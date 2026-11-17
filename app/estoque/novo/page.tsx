"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

import { MoneyField } from "@/components/forms/MoneyField";
import { QuantityField } from "@/components/forms/QuantityField";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { useAvisos } from "@/components/ui/Avisos";
import { Button } from "@/components/ui/Button";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { Loading } from "@/components/ui/Loading";
import {
  codigoErroEstoque,
  mensagemErroEstoque,
  tipoMovimentoValido,
  type TipoMovimento,
} from "@/lib/estoque";
import { formatarCustoUnitario } from "@/lib/formatar";
import { formatarQuantidadeComUnidade, rotuloUnidade } from "@/lib/materiais";
import { createClient } from "@/lib/supabase/client";
import { registrarMovimento } from "@/services/estoque.service";
import { getMateriais, type Material } from "@/services/materiais.service";

type Estado = "carregando" | "erro" | "pronto";

const opcoesTipo = [
  { valor: "entrada", rotulo: "Compra de material" },
  { valor: "saida", rotulo: "Uso ou perda de material" },
  { valor: "ajuste", rotulo: "Correção de contagem" },
];

const titulos: Record<TipoMovimento, string> = {
  entrada: "Registrar compra",
  saida: "Registrar uso",
  ajuste: "Corrigir contagem",
};

const dicasObservacao: Record<TipoMovimento, string> = {
  entrada: "Ex.: loja onde comprou",
  saida: "Ex.: usado na bolsa da Maria",
  ajuste: "Ex.: contagem do mês",
};

const sucesso: Record<TipoMovimento, string> = {
  entrada: "Compra registrada.",
  saida: "Uso registrado.",
  ajuste: "Contagem corrigida.",
};

export default function NovoMovimentoPage() {
  return (
    <Suspense fallback={<Loading />}>
      <FormularioMovimento />
    </Suspense>
  );
}

function FormularioMovimento() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { avisar } = useAvisos();

  const tipoDaUrl = searchParams.get("tipo");

  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [materiais, setMateriais] = useState<Material[]>([]);

  const [tipo, setTipo] = useState<string>(
    tipoMovimentoValido(tipoDaUrl) ? tipoDaUrl : ""
  );
  const [materialId, setMaterialId] = useState("");
  const [quantidade, setQuantidade] = useState<number | null>(null);
  const [valorTotal, setValorTotal] = useState<number | null>(null);
  const [valorEditado, setValorEditado] = useState(false);
  const [observacao, setObservacao] = useState("");

  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    getMateriais()
      .then((lista) => {
        if (!ativo) return;
        setMateriais(
          lista
            .filter((m) => m.ativo !== false)
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }))
        );
        setEstado("pronto");
      })
      .catch(() => {
        if (ativo) setEstado("erro");
      });

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const tipoAtual = tipoMovimentoValido(tipo) ? tipo : null;
  const material = materiais.find((m) => String(m.id) === materialId) ?? null;

  const unidade = material?.unidade_uso;
  const unidadePlural = unidade ? rotuloUnidade(unidade, 2) : undefined;
  const estoqueAtual = Number(material?.estoque_atual ?? 0);
  const porEmbalagem = Number(material?.quantidade_por_compra ?? 0);
  const precoEmbalagem = Number(material?.preco ?? 0);

  /* Compra: total sugerido = embalagens × preço atual, até a usuária mexer. */
  const valorSugerido =
    quantidade !== null && material ? quantidade * precoEmbalagem : null;
  const valorMostrado = valorEditado ? valorTotal : valorSugerido;

  const quantidadeUso =
    tipoAtual === "entrada" && quantidade !== null ? quantidade * porEmbalagem : null;

  const novoCusto =
    quantidadeUso && quantidadeUso > 0 && valorMostrado !== null
      ? valorMostrado / quantidadeUso
      : null;

  const diferenca =
    tipoAtual === "ajuste" && quantidade !== null && material
      ? quantidade - estoqueAtual
      : null;

  const mensagemSemEstoque = material
    ? `Você tem só ${formatarQuantidadeComUnidade(estoqueAtual, unidade)}. Corrija a contagem se o estoque estiver errado.`
    : "";

  function limparErro(campo: string) {
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: "" }));
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();

    const novos: Record<string, string> = {};

    if (!tipoAtual) novos.tipo = "Escolha o que você quer registrar.";
    if (!material) novos.material = "Escolha o material.";

    if (quantidade === null) {
      novos.quantidade = "Digite a quantidade.";
    } else if (tipoAtual === "entrada" && quantidade <= 0) {
      novos.quantidade = "Digite quantas embalagens você comprou (maior que zero).";
    } else if (tipoAtual === "saida" && quantidade <= 0) {
      novos.quantidade = "Digite quanto você usou (maior que zero).";
    } else if (tipoAtual === "saida" && material && quantidade > estoqueAtual) {
      novos.quantidade = mensagemSemEstoque;
    } else if (tipoAtual === "ajuste" && material && quantidade === estoqueAtual) {
      novos.quantidade = "A contagem é igual ao que o sistema já registra.";
    }

    if (tipoAtual === "entrada" && valorMostrado === null) {
      novos.valor = "Digite quanto você pagou, como 45,00.";
    }

    setErros(novos);

    const primeiro = ["tipo", "material", "quantidade", "valor"].find((c) => novos[c]);

    if (primeiro || !tipoAtual || !material || quantidade === null) {
      if (primeiro) document.getElementById(`movimento-${primeiro}`)?.focus();
      return;
    }

    setSalvando(true);

    try {
      const {
        data: { user },
      } = await createClient().auth.getUser();

      if (!user) {
        avisar({ tipo: "erro", texto: "Sua sessão expirou. Entre novamente para salvar." });
        return;
      }

      await registrarMovimento(
        material.id,
        tipoAtual,
        quantidade,
        tipoAtual === "entrada" ? valorMostrado : null,
        observacao
      );

      avisar({ tipo: "sucesso", texto: sucesso[tipoAtual] });
      router.push("/estoque");
    } catch (erro) {
      const codigo = codigoErroEstoque(erro);

      if (codigo === "ESTOQUE_INSUFICIENTE") {
        setErros({ quantidade: mensagemSemEstoque });
        document.getElementById("movimento-quantidade")?.focus();
      } else if (codigo === "SEM_DIFERENCA") {
        setErros({ quantidade: "A contagem é igual ao que o sistema já registra." });
        document.getElementById("movimento-quantidade")?.focus();
      } else {
        avisar({
          tipo: "erro",
          texto:
            mensagemErroEstoque(erro) ??
            "Não foi possível registrar agora. Tente de novo em instantes.",
        });
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <LinkBotao href="/estoque" variante="discreto" icone="voltar" className="mb-4 -ml-3">
        Voltar para estoque
      </LinkBotao>

      <CabecalhoPagina titulo={tipoAtual ? titulos[tipoAtual] : "Registrar no estoque"} />

      {estado === "carregando" && <Loading texto="Carregando materiais..." />}

      {estado === "erro" && (
        <ErrorState
          aoTentarDeNovo={() => {
            setEstado("carregando");
            setTentativa((n) => n + 1);
          }}
        />
      )}

      {estado === "pronto" && (
        <Cartao>
          <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
            {!tipoMovimentoValido(tipoDaUrl) && (
              <SelectField
                id="movimento-tipo"
                rotulo="O que você quer registrar?"
                valor={tipo}
                aoMudar={(v) => {
                  setTipo(v);
                  limparErro("tipo");
                }}
                opcoes={opcoesTipo}
                obrigatorio
                erro={erros.tipo || undefined}
              />
            )}

            <SelectField
              id="movimento-material"
              rotulo="Material"
              valor={materialId}
              aoMudar={(v) => {
                setMaterialId(v);
                limparErro("material");
                limparErro("quantidade");
              }}
              opcoes={materiais.map((m) => ({
                valor: String(m.id),
                rotulo: `${m.nome} (em estoque: ${formatarQuantidadeComUnidade(
                  Number(m.estoque_atual ?? 0),
                  m.unidade_uso
                )})`,
              }))}
              obrigatorio
              erro={erros.material || undefined}
            />

            {tipoAtual === "entrada" && (
              <>
                <div>
                  <QuantityField
                    id="movimento-quantidade"
                    rotulo="Quantas embalagens você comprou?"
                    valor={quantidade}
                    aoMudar={(v) => {
                      setQuantidade(v);
                      limparErro("quantidade");
                    }}
                    casas={2}
                    obrigatorio
                    dica={
                      material
                        ? `Cada embalagem tem ${formatarQuantidadeComUnidade(porEmbalagem, unidade)}`
                        : "Escolha o material para ver quanto vem em cada embalagem."
                    }
                    erro={erros.quantidade || undefined}
                  />
                  {quantidadeUso !== null && material && (
                    <p className="mt-2 text-lg font-bold text-destaque-escuro">
                      = {formatarQuantidadeComUnidade(quantidadeUso, unidade)}
                    </p>
                  )}
                </div>

                <MoneyField
                  id="movimento-valor"
                  rotulo="Quanto você pagou no total?"
                  valor={valorMostrado}
                  aoMudar={(v) => {
                    setValorEditado(true);
                    setValorTotal(v);
                    limparErro("valor");
                  }}
                  obrigatorio
                  dica="Já calculamos pelo preço atual. Mude se pagou outro valor."
                  erro={erros.valor || undefined}
                />

                <p className="rounded-2xl bg-destaque-suave px-4 py-3 text-lg text-destaque-escuro">
                  {novoCusto !== null && unidade ? (
                    <>
                      Novo custo:{" "}
                      <strong>
                        {formatarCustoUnitario(novoCusto)} por {rotuloUnidade(unidade, 1)}
                      </strong>
                    </>
                  ) : (
                    "Preencha o material, as embalagens e o valor para ver o novo custo."
                  )}
                </p>
              </>
            )}

            {tipoAtual === "saida" && (
              <>
                {material && (
                  <p className="text-lg">
                    Em estoque:{" "}
                    <strong>{formatarQuantidadeComUnidade(estoqueAtual, unidade)}</strong>
                  </p>
                )}
                <QuantityField
                  id="movimento-quantidade"
                  rotulo="Quanto você usou ou perdeu?"
                  valor={quantidade}
                  aoMudar={(v) => {
                    setQuantidade(v);
                    limparErro("quantidade");
                  }}
                  unidade={unidadePlural}
                  casas={3}
                  obrigatorio
                  erro={erros.quantidade || undefined}
                />
              </>
            )}

            {tipoAtual === "ajuste" && (
              <>
                {material && (
                  <p className="text-lg">
                    Hoje o sistema registra:{" "}
                    <strong>{formatarQuantidadeComUnidade(estoqueAtual, unidade)}</strong>
                  </p>
                )}
                <div>
                  <QuantityField
                    id="movimento-quantidade"
                    rotulo="Quanto você contou agora?"
                    valor={quantidade}
                    aoMudar={(v) => {
                      setQuantidade(v);
                      limparErro("quantidade");
                    }}
                    unidade={unidadePlural}
                    casas={3}
                    obrigatorio
                    erro={erros.quantidade || undefined}
                  />
                  {diferenca !== null && diferenca !== 0 && (
                    <p className="mt-2 text-lg font-bold text-destaque-escuro">
                      {diferenca > 0 ? "Vai entrar " : "Vai sair "}
                      {formatarQuantidadeComUnidade(Math.abs(diferenca), unidade)}
                    </p>
                  )}
                </div>
              </>
            )}

            {tipoAtual && (
              <TextField
                rotulo="Observação"
                valor={observacao}
                aoMudar={setObservacao}
                dica={dicasObservacao[tipoAtual]}
              />
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                icone="sucesso"
                carregando={salvando}
                className="w-full sm:w-auto"
              >
                Registrar
              </Button>
              <Button
                variante="secundario"
                onClick={() => router.push("/estoque")}
                disabled={salvando}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Cartao>
      )}
    </div>
  );
}
