"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { MoneyField } from "@/components/forms/MoneyField";
import { QuantityField } from "@/components/forms/QuantityField";
import { TextField } from "@/components/forms/TextField";
import { useAvisos } from "@/components/ui/Avisos";
import { Button } from "@/components/ui/Button";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { Loading } from "@/components/ui/Loading";
import { formatarMoeda, formatarNumero } from "@/lib/formatar";
import {
  calcularPrecos,
  calcularValorHora,
  ErroPrecificacao,
  PADROES_PRECO,
  ROTULOS_MARCA,
  type NivelMarca,
} from "@/lib/precificacao";
import { createClient } from "@/lib/supabase/client";
import { erroFatorMarca, EXPLICACAO_MARCA } from "@/lib/termometro";
import {
  buscarConfiguracoesAtelie,
  salvarConfiguracoesAtelie,
} from "@/services/atelie.service";

type Estado = "carregando" | "erro" | "pronto";

const NIVEIS_MARCA: NivelMarca[] = ["comecando", "regional", "reconhecida", "referencia"];

/* Percentuais: na tela a artesã vê e digita 15; no banco fica 0.15. */
function paraPercentual(fracao: number): number {
  return Math.round(fracao * 10000) / 100;
}

function paraFracao(percentual: number): number {
  return percentual / 100;
}

/** "×1,0", "×1,2", "×2,0". */
function textoFator(fator: number): string {
  return `×${formatarNumero(fator, 2, 1)}`;
}

/** Mensagem do motor, se o erro for dele. */
function mensagemDoMotor(erro: unknown): string | null {
  return erro instanceof ErroPrecificacao ? erro.message : null;
}

/** Os valores do formulário num texto só, para saber se há alterações não salvas. */
function retrato(v: {
  nome: string;
  meta: number | null;
  custosFixos: number | null;
  dias: number | null;
  horasDia: number | null;
  taxas: number | null;
  margemMinima: number | null;
  margemIdeal: number | null;
  marcaNivel: NivelMarca;
  marcaFator: number | null;
}): string {
  return JSON.stringify([
    v.nome,
    v.meta,
    v.custosFixos,
    v.dias,
    v.horasDia,
    v.taxas,
    v.margemMinima,
    v.margemIdeal,
    v.marcaNivel,
    v.marcaFator,
  ]);
}

export default function DadosAtelie() {
  const { avisar } = useAvisos();
  const router = useRouter();

  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  const [nome, setNome] = useState("");
  const [meta, setMeta] = useState<number | null>(null);
  const [custosFixos, setCustosFixos] = useState<number | null>(null);
  const [dias, setDias] = useState<number | null>(null);
  const [horasDia, setHorasDia] = useState<number | null>(null);
  const [taxas, setTaxas] = useState<number | null>(null);
  const [margemMinima, setMargemMinima] = useState<number | null>(null);
  const [margemIdeal, setMargemIdeal] = useState<number | null>(null);
  const [marcaNivel, setMarcaNivel] = useState<NivelMarca>("comecando");
  const [marcaFator, setMarcaFator] = useState<number | null>(1);

  /* Retrato dos últimos valores carregados ou salvos (null = ainda carregando). */
  const [retratoSalvo, setRetratoSalvo] = useState<string | null>(null);
  const [confirmarSaida, setConfirmarSaida] = useState(false);

  /* ---------------- Carregamento ---------------- */

  useEffect(() => {
    let ativo = true;

    buscarConfiguracoesAtelie()
      .then((c) => {
        if (!ativo) return;
        setNome(c.nome_empresa ?? "");
        setMeta(c.meta_faturamento);
        setCustosFixos(c.custos_fixos_mensais);
        setDias(c.dias_trabalhados);
        setHorasDia(c.horas_por_dia);
        setTaxas(paraPercentual(c.taxas_venda));
        setMargemMinima(paraPercentual(c.margem_minima));
        setMargemIdeal(paraPercentual(c.margem_ideal));
        setMarcaNivel(c.marca_nivel);
        setMarcaFator(c.marca_fator);
        setRetratoSalvo(
          retrato({
            nome: c.nome_empresa ?? "",
            meta: c.meta_faturamento,
            custosFixos: c.custos_fixos_mensais,
            dias: c.dias_trabalhados,
            horasDia: c.horas_por_dia,
            taxas: paraPercentual(c.taxas_venda),
            margemMinima: paraPercentual(c.margem_minima),
            margemIdeal: paraPercentual(c.margem_ideal),
            marcaNivel: c.marca_nivel,
            marcaFator: c.marca_fator,
          })
        );
        setEstado("pronto");
      })
      .catch(() => {
        /* Mensagem técnica não vai para a tela. */
        if (ativo) setEstado("erro");
      });

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  function limparErro(campo: string) {
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: "" }));
  }

  const retratoAtual = retrato({
    nome,
    meta,
    custosFixos,
    dias,
    horasDia,
    taxas,
    margemMinima,
    margemIdeal,
    marcaNivel,
    marcaFator,
  });
  const temAlteracoes = retratoSalvo !== null && retratoAtual !== retratoSalvo;

  /* ---------------- Valor da hora, ao vivo (só pelo motor) ---------------- */

  const horasMes = (dias ?? 0) * (horasDia ?? 0);

  let valorHora: number | null = null;
  let erroValorHora: string | null = null;

  try {
    valorHora = calcularValorHora({
      metaMensal: meta ?? 0,
      custosFixosMensais: custosFixos ?? 0,
      horasPorMes: horasMes,
    });
  } catch (erro) {
    erroValorHora = mensagemDoMotor(erro) ?? "Confira os números digitados.";
  }

  /* ---------------- Marca ---------------- */

  function escolherMarca(nivel: NivelMarca) {
    setMarcaNivel(nivel);
    setMarcaFator(PADROES_PRECO.marca[nivel]);
    limparErro("marcaFator");
  }

  function usarSugeridos() {
    setTaxas(paraPercentual(PADROES_PRECO.taxasVenda));
    setMargemMinima(paraPercentual(PADROES_PRECO.margemMinima));
    setMargemIdeal(paraPercentual(PADROES_PRECO.margemIdeal));
    setErros((e) => ({ ...e, taxas: "", margemMinima: "", margemIdeal: "" }));
  }

  /* ---------------- Validação ---------------- */

  function validar(): Record<string, string> {
    const novos: Record<string, string> = {};

    if (meta === null) novos.meta = "Digite quanto você quer ganhar por mês, como 3.000,00.";
    if (dias === null || dias <= 0) novos.dias = "Digite quantos dias você trabalha no mês.";
    if (horasDia === null || horasDia <= 0)
      novos.horasDia = "Digite quantas horas você trabalha por dia.";
    if (taxas === null) novos.taxas = "Digite as taxas de venda, como 15.";
    if (margemMinima === null) novos.margemMinima = "Digite a margem mínima, como 20.";
    if (margemIdeal === null) novos.margemIdeal = "Digite a margem ideal, como 30.";

    const fator = marcaFator ?? 0;
    const erroFator = erroFatorMarca(marcaNivel, marcaFator);
    if (erroFator) novos.marcaFator = erroFator;

    /* Mesmas regras e mensagens do motor de preço. */
    if (!novos.dias && !novos.horasDia) {
      try {
        calcularValorHora({
          metaMensal: meta ?? 0,
          custosFixosMensais: custosFixos ?? 0,
          horasPorMes: horasMes,
        });
      } catch (erro) {
        novos.horasDia = mensagemDoMotor(erro) ?? "Confira as horas de trabalho.";
      }
    }

    if (taxas !== null && margemMinima !== null && margemIdeal !== null && !novos.marcaFator) {
      try {
        calcularPrecos({
          custoTotal: 0,
          taxasVenda: paraFracao(taxas),
          margemMinima: paraFracao(margemMinima),
          margemIdeal: paraFracao(margemIdeal),
          fatorMarca: fator,
          fatorExclusividade: 1,
        });
      } catch (erro) {
        const mensagem = mensagemDoMotor(erro) ?? "Confira os percentuais.";
        const codigo = erro instanceof ErroPrecificacao ? erro.codigo : null;

        if (codigo === "MARGENS_INVERTIDAS") novos.margemMinima = mensagem;
        else if (codigo === "FATOR_INVALIDO") novos.marcaFator = mensagem;
        else novos.margemIdeal = mensagem;
      }
    }

    return novos;
  }

  /* ---------------- Salvar ---------------- */

  async function salvar(e: FormEvent) {
    e.preventDefault();

    const novos = validar();
    setErros(novos);

    const ordem = ["meta", "dias", "horasDia", "taxas", "margemMinima", "margemIdeal", "marcaFator"];
    const primeiro = ordem.find((campo) => novos[campo]);

    if (primeiro) {
      document.getElementById(`atelie-${primeiro}`)?.focus();
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

      await salvarConfiguracoesAtelie({
        nome_empresa: nome.trim() || null,
        meta_faturamento: meta ?? 0,
        custos_fixos_mensais: custosFixos ?? 0,
        dias_trabalhados: dias ?? 0,
        horas_por_dia: horasDia ?? 0,
        taxas_venda: paraFracao(taxas ?? 0),
        margem_minima: paraFracao(margemMinima ?? 0),
        margem_ideal: paraFracao(margemIdeal ?? 0),
        marca_nivel: marcaNivel,
        marca_fator: marcaFator ?? PADROES_PRECO.marca[marcaNivel],
      });

      setRetratoSalvo(retratoAtual);
      avisar({ tipo: "sucesso", texto: "Dados do ateliê salvos." });
    } catch (erro) {
      avisar({
        tipo: "erro",
        texto:
          mensagemDoMotor(erro) ??
          "Não foi possível salvar agora. Tente de novo em instantes.",
      });
    } finally {
      setSalvando(false);
    }
  }

  /* ---------------- Tela ---------------- */

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <CabecalhoPagina
        titulo="Dados do ateliê"
        subtitulo="Essas informações são a base do preço das suas peças."
      />

      {estado === "carregando" && <Loading texto="Carregando seus dados..." />}

      {estado === "erro" && (
        <ErrorState
          aoTentarDeNovo={() => {
            setEstado("carregando");
            setTentativa((n) => n + 1);
          }}
        />
      )}

      {estado === "pronto" && (
        <form onSubmit={salvar} noValidate className="flex flex-col gap-6">
          {/* a) Seu ateliê */}
          <Cartao titulo="Seu ateliê">
            <TextField
              rotulo="Nome do ateliê"
              valor={nome}
              aoMudar={setNome}
              placeholder="Ex.: Ateliê da Maria"
              dica="Aparece no menu e, no futuro, na sua vitrine."
            />
          </Cartao>

          {/* b) Quanto você quer ganhar */}
          <Cartao titulo="Quanto você quer ganhar">
            <div className="grid gap-6 md:grid-cols-2">
              <MoneyField
                id="atelie-meta"
                rotulo="Quanto você quer ganhar por mês"
                valor={meta}
                aoMudar={(v) => {
                  setMeta(v);
                  limparErro("meta");
                }}
                obrigatorio
                erro={erros.meta || undefined}
              />
              <MoneyField
                rotulo="Custos fixos do mês"
                valor={custosFixos}
                aoMudar={setCustosFixos}
                dica="Luz, internet, transporte, MEI…"
              />
              <QuantityField
                id="atelie-dias"
                rotulo="Dias de trabalho no mês"
                valor={dias}
                aoMudar={(v) => {
                  setDias(v);
                  limparErro("dias");
                }}
                unidade="dias"
                casas={0}
                obrigatorio
                erro={erros.dias || undefined}
              />
              <QuantityField
                id="atelie-horasDia"
                rotulo="Horas de trabalho por dia"
                valor={horasDia}
                aoMudar={(v) => {
                  setHorasDia(v);
                  limparErro("horasDia");
                }}
                unidade="horas"
                casas={1}
                obrigatorio
                erro={erros.horasDia || undefined}
              />
            </div>

            <div aria-live="polite" className="mt-6 flex flex-col gap-2">
              <p className="text-lg text-texto-suave">
                Horas de trabalho no mês:{" "}
                <strong className="text-texto">{formatarNumero(horasMes, 1)}</strong>
              </p>
              <div className="rounded-2xl bg-destaque-suave px-4 py-4 text-destaque-escuro">
                {valorHora !== null ? (
                  <p className="text-xl">
                    Seu valor da hora:{" "}
                    <strong className="text-[28px] leading-tight">
                      {formatarMoeda(valorHora)}
                    </strong>
                  </p>
                ) : (
                  <p className="text-lg">{erroValorHora}</p>
                )}
              </div>
            </div>
          </Cartao>

          {/* c) Taxas e margens */}
          <Cartao titulo="Taxas e margens">
            <div className="grid gap-6 md:grid-cols-3">
              <QuantityField
                id="atelie-taxas"
                rotulo="Taxas de venda"
                valor={taxas}
                aoMudar={(v) => {
                  setTaxas(v);
                  limparErro("taxas");
                  limparErro("margemIdeal");
                }}
                unidade="%"
                casas={2}
                obrigatorio
                dica="Maquininha, site de vendas, impostos"
                erro={erros.taxas || undefined}
              />
              <QuantityField
                id="atelie-margemMinima"
                rotulo="Margem mínima"
                valor={margemMinima}
                aoMudar={(v) => {
                  setMargemMinima(v);
                  limparErro("margemMinima");
                }}
                unidade="%"
                casas={2}
                obrigatorio
                dica="O menor lucro que você aceita"
                erro={erros.margemMinima || undefined}
              />
              <QuantityField
                id="atelie-margemIdeal"
                rotulo="Margem ideal"
                valor={margemIdeal}
                aoMudar={(v) => {
                  setMargemIdeal(v);
                  limparErro("margemIdeal");
                  limparErro("margemMinima");
                }}
                unidade="%"
                casas={2}
                obrigatorio
                dica="O lucro que você quer ter"
                erro={erros.margemIdeal || undefined}
              />
            </div>

            <div className="mt-4">
              <Button variante="secundario" onClick={usarSugeridos}>
                Usar valores sugeridos
              </Button>
            </div>
          </Cartao>

          {/* d) Sua marca */}
          <Cartao titulo="Sua marca">
            <fieldset>
              <legend className="mb-4 text-lg text-texto-suave">
                Escolha o nível que mais combina com o seu ateliê hoje.
              </legend>

              <div className="grid gap-3 md:grid-cols-2">
                {NIVEIS_MARCA.map((nivel) => {
                  const escolhido = marcaNivel === nivel;

                  return (
                    <label
                      key={nivel}
                      className={`flex min-h-[88px] cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 focus-within:ring-[3px] focus-within:ring-destaque ${
                        escolhido
                          ? "border-destaque bg-destaque-suave"
                          : "border-borda-campo bg-cartao hover:bg-fundo"
                      }`}
                    >
                      <input
                        type="radio"
                        name="marca"
                        value={nivel}
                        checked={escolhido}
                        onChange={() => escolherMarca(nivel)}
                        className="mt-1 h-6 w-6 shrink-0 accent-destaque focus:outline-none"
                      />
                      <span className="flex flex-col gap-1">
                        <span className="text-lg font-bold text-texto">
                          {ROTULOS_MARCA[nivel]}{" "}
                          <span className="text-destaque-escuro">
                            {textoFator(PADROES_PRECO.marca[nivel])}
                          </span>
                        </span>
                        <span className="text-base text-texto-suave">
                          {EXPLICACAO_MARCA[nivel]}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {marcaNivel === "referencia" && (
              <div className="mt-6 max-w-xs">
                <QuantityField
                  id="atelie-marcaFator"
                  rotulo="Fator da sua marca"
                  valor={marcaFator}
                  aoMudar={(v) => {
                    setMarcaFator(v);
                    limparErro("marcaFator");
                  }}
                  casas={2}
                  dica="Mínimo 2. Ex.: 2,5 deixa o preço sugerido 2,5 vezes o preço justo."
                  erro={erros.marcaFator || undefined}
                />
              </div>
            )}

            <div className="mt-6 flex flex-col items-start gap-3">
              <p className="text-lg text-texto-suave">
                Não sabe qual nível escolher? Responda o termômetro da marca: são 5 perguntas.
              </p>
              <LinkBotao
                href="/empresa/termometro"
                variante="secundario"
                onClick={(e) => {
                  /* Com alterações não salvas, pergunta antes de sair. */
                  if (temAlteracoes) {
                    e.preventDefault();
                    setConfirmarSaida(true);
                  }
                }}
              >
                Responder o termômetro
              </LinkBotao>
            </div>
          </Cartao>

          {/* Botão Salvar: sempre visível no celular, acima da barra de menu */}
          <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 -mx-4 border-t border-borda bg-fundo/95 px-4 py-3 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
            <Button
              type="submit"
              icone="sucesso"
              carregando={salvando}
              className="w-full md:w-auto"
            >
              Salvar
            </Button>
          </div>
        </form>
      )}

      <ConfirmDialog
        aberto={confirmarSaida}
        titulo="Sair sem salvar?"
        mensagem="As alterações desta página ainda não foram salvas. Se sair agora, elas se perdem."
        textoConfirmar="Sair sem salvar"
        textoCancelar="Continuar aqui"
        variante="perigo"
        aoConfirmar={() => {
          setConfirmarSaida(false);
          router.push("/empresa/termometro");
        }}
        aoCancelar={() => setConfirmarSaida(false)}
      />
    </div>
  );
}
