"use client";

import { useState, type FormEvent } from "react";

import { MoneyField } from "@/components/forms/MoneyField";
import { QuantityField } from "@/components/forms/QuantityField";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { useAvisos } from "@/components/ui/Avisos";
import { Button } from "@/components/ui/Button";
import { formatarCustoUnitario } from "@/lib/formatar";
import {
  formatarQuantidadeComUnidade,
  rotuloUnidade,
  unidadesUso,
  type UnidadeUso,
} from "@/lib/materiais";
import {
  codigoDoErro,
  type CategoriaMaterial,
  type DadosMaterial,
} from "@/services/materiais.service";

export interface ValoresIniciaisMaterial {
  nome: string;
  category_id: number | null;
  unidade_uso: UnidadeUso;
  preco: number;
  quantidade_por_compra: number;
  minimum_stock: number | null;
}

interface FormularioMaterialProps {
  categorias: CategoriaMaterial[];
  /** Cria a categoria no banco e devolve a criada (erro 23505 = repetida). */
  aoCriarCategoria: (nome: string) => Promise<CategoriaMaterial>;
  valoresIniciais?: ValoresIniciaisMaterial;
  /** Na edição: estoque atual, mostrado só como texto. */
  estoqueAtual?: number;
  textoSalvar: string;
  salvando: boolean;
  /** estoqueInicial só existe no cadastro (sem valoresIniciais). */
  aoSalvar: (dados: DadosMaterial, estoqueInicial: number) => void;
  aoCancelar: () => void;
}

const opcoesUnidade = unidadesUso.map((u) => ({
  valor: u.chave,
  rotulo: u.plural.charAt(0).toUpperCase() + u.plural.slice(1),
}));

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function FormularioMaterial({
  categorias: categoriasIniciais,
  aoCriarCategoria,
  valoresIniciais,
  estoqueAtual,
  textoSalvar,
  salvando,
  aoSalvar,
  aoCancelar,
}: FormularioMaterialProps) {
  const { avisar } = useAvisos();
  const edicao = Boolean(valoresIniciais);

  const [categorias, setCategorias] = useState(categoriasIniciais);

  const [nome, setNome] = useState(valoresIniciais?.nome ?? "");
  const [categoriaId, setCategoriaId] = useState(
    valoresIniciais?.category_id ? String(valoresIniciais.category_id) : ""
  );
  const [unidade, setUnidade] = useState<string>(valoresIniciais?.unidade_uso ?? "");
  const [preco, setPreco] = useState<number | null>(valoresIniciais?.preco ?? null);
  const [quantidade, setQuantidade] = useState<number | null>(
    valoresIniciais?.quantidade_por_compra ?? null
  );
  const [minimo, setMinimo] = useState<number | null>(
    valoresIniciais ? (valoresIniciais.minimum_stock ?? 0) : null
  );
  const [estoqueInicial, setEstoqueInicial] = useState<number | null>(null);

  const [criandoCategoria, setCriandoCategoria] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [erroNovaCategoria, setErroNovaCategoria] = useState("");
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);

  const [erros, setErros] = useState<Record<string, string>>({});

  function limparErro(campo: string) {
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: "" }));
  }

  async function adicionarCategoria() {
    const nomeLimpo = novaCategoria.trim();

    if (!nomeLimpo) {
      setErroNovaCategoria("Digite o nome da categoria.");
      return;
    }

    if (categorias.some((c) => normalizar(c.nome) === normalizar(nomeLimpo))) {
      setErroNovaCategoria("Essa categoria já existe.");
      return;
    }

    setSalvandoCategoria(true);

    try {
      const criada = await aoCriarCategoria(nomeLimpo);

      setCategorias((lista) =>
        [...lista, criada].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      );
      setCategoriaId(String(criada.id));
      limparErro("categoria");
      setNovaCategoria("");
      setCriandoCategoria(false);
      avisar({ tipo: "sucesso", texto: "Categoria criada." });
    } catch (erro) {
      if (codigoDoErro(erro) === "23505") {
        setErroNovaCategoria("Essa categoria já existe.");
      } else {
        avisar({
          tipo: "erro",
          texto: "Não foi possível criar a categoria agora. Tente de novo em instantes.",
        });
      }
    } finally {
      setSalvandoCategoria(false);
    }
  }

  const custoPorUnidade =
    preco !== null && quantidade !== null && quantidade > 0
      ? preco / quantidade
      : null;

  function enviar(e: FormEvent) {
    e.preventDefault();

    const novos: Record<string, string> = {};

    if (!nome.trim()) novos.nome = "Digite o nome do material.";
    if (!categoriaId) novos.categoria = "Escolha a categoria.";
    if (!unidade) novos.unidade = "Escolha a unidade de uso.";
    if (preco === null) novos.preco = "Digite o preço da compra, como 12,50.";
    if (quantidade === null || quantidade <= 0)
      novos.quantidade = "Digite quanto vem em cada compra (maior que zero).";

    setErros(novos);

    const ordem = ["nome", "categoria", "unidade", "preco", "quantidade"];
    const primeiro = ordem.find((campo) => novos[campo]);

    if (primeiro) {
      document.getElementById(`material-${primeiro}`)?.focus();
      return;
    }

    const categoria = categorias.find((c) => String(c.id) === categoriaId);

    aoSalvar(
      {
        nome: nome.trim(),
        category_id: Number(categoriaId),
        nomeCategoria: categoria?.nome ?? "",
        unidade_uso: unidade as UnidadeUso,
        preco: preco as number,
        quantidade_por_compra: quantidade as number,
        minimum_stock: minimo ?? 0,
      },
      edicao ? 0 : (estoqueInicial ?? 0)
    );
  }

  const unidadePlural = unidade ? rotuloUnidade(unidade, 2) : undefined;
  const unidadeSingular = unidade ? rotuloUnidade(unidade, 1) : "";

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      <TextField
        id="material-nome"
        rotulo="Nome"
        valor={nome}
        aoMudar={(v) => {
          setNome(v);
          limparErro("nome");
        }}
        obrigatorio
        placeholder="Ex.: Fio náutico branco"
        erro={erros.nome || undefined}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <SelectField
            id="material-categoria"
            rotulo="Categoria"
            valor={categoriaId}
            aoMudar={(v) => {
              setCategoriaId(v);
              limparErro("categoria");
            }}
            opcoes={categorias.map((c) => ({ valor: String(c.id), rotulo: c.nome }))}
            obrigatorio
            erro={erros.categoria || undefined}
          />

          {!criandoCategoria ? (
            <Button
              variante="discreto"
              icone="mais"
              className="mt-2 -ml-3"
              onClick={() => setCriandoCategoria(true)}
            >
              Criar categoria nova
            </Button>
          ) : (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-borda bg-fundo p-4">
              <TextField
                rotulo="Nome da categoria nova"
                valor={novaCategoria}
                aoMudar={(v) => {
                  setNovaCategoria(v);
                  setErroNovaCategoria("");
                }}
                erro={erroNovaCategoria || undefined}
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  icone="mais"
                  carregando={salvandoCategoria}
                  onClick={adicionarCategoria}
                >
                  Adicionar
                </Button>
                <Button
                  variante="discreto"
                  disabled={salvandoCategoria}
                  onClick={() => {
                    setCriandoCategoria(false);
                    setNovaCategoria("");
                    setErroNovaCategoria("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>

        <SelectField
          id="material-unidade"
          rotulo="Unidade de uso"
          valor={unidade}
          aoMudar={(v) => {
            setUnidade(v);
            limparErro("unidade");
          }}
          opcoes={opcoesUnidade}
          obrigatorio
          dica="Como você mede o material ao usar numa peça."
          erro={erros.unidade || undefined}
        />
      </div>

      <fieldset className="flex flex-col gap-4 rounded-2xl border border-borda p-4 md:p-5">
        <legend className="px-2 text-xl font-bold text-texto">
          Como você compra
        </legend>

        <div className="grid gap-6 md:grid-cols-2">
          <MoneyField
            id="material-preco"
            rotulo="Preço da compra"
            valor={preco}
            aoMudar={(v) => {
              setPreco(v);
              limparErro("preco");
            }}
            obrigatorio
            erro={erros.preco || undefined}
          />

          <QuantityField
            id="material-quantidade"
            rotulo="Quanto vem em cada compra"
            valor={quantidade}
            aoMudar={(v) => {
              setQuantidade(v);
              limparErro("quantidade");
            }}
            unidade={unidadePlural}
            casas={3}
            obrigatorio
            dica="Ex.: um rolo com 150 metros"
            erro={erros.quantidade || undefined}
          />
        </div>

        <p
          aria-live="polite"
          className="rounded-2xl bg-destaque-suave px-4 py-3 text-lg text-destaque-escuro"
        >
          {custoPorUnidade !== null ? (
            <>
              {unidade ? `Custo por ${unidadeSingular}: ` : "Custo por unidade de uso: "}
              <strong>{formatarCustoUnitario(custoPorUnidade)}</strong>
            </>
          ) : (
            "Preencha o preço e a quantidade para ver o custo."
          )}
        </p>
      </fieldset>

      <div className="grid gap-6 md:grid-cols-2">
        <QuantityField
          rotulo="Estoque mínimo"
          valor={minimo}
          aoMudar={setMinimo}
          unidade={unidadePlural}
          casas={3}
          dica="Avisamos quando o estoque ficar abaixo disso. Deixe 0 para não avisar."
        />

        {!edicao ? (
          <QuantityField
            rotulo="Estoque inicial"
            valor={estoqueInicial}
            aoMudar={setEstoqueInicial}
            unidade={unidadePlural}
            casas={3}
            dica="Quanto você tem hoje"
          />
        ) : (
          <div>
            <p className="mb-2 text-lg font-bold text-texto">Em estoque</p>
            <p className="text-xl font-bold">
              {formatarQuantidadeComUnidade(estoqueAtual ?? 0, unidade)}
            </p>
            <p className="mt-2 text-base text-texto-suave">
              O estoque muda pela tela Estoque, a cada compra ou uso.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="submit"
          icone="sucesso"
          carregando={salvando}
          className="w-full sm:w-auto"
        >
          {textoSalvar}
        </Button>

        <Button
          variante="secundario"
          onClick={aoCancelar}
          disabled={salvando}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
