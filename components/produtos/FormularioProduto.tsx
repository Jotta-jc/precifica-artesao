"use client";

import { useState, type FormEvent } from "react";

import { MoneyField } from "@/components/forms/MoneyField";
import { QuantityField } from "@/components/forms/QuantityField";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { useAvisos } from "@/components/ui/Avisos";
import { Button } from "@/components/ui/Button";
import {
  ROTULOS_COMPLEXIDADE,
  ROTULOS_EXCLUSIVIDADE,
  type Complexidade,
  type Exclusividade,
} from "@/lib/precificacao";
import {
  ROTULOS_TIPO,
  validarProduto,
  type DadosProduto,
  type TipoProduto,
} from "@/lib/produtos";
import { codigoDoErro, type CategoriaProduto } from "@/services/produtos.service";

interface FormularioProdutoProps {
  categorias: CategoriaProduto[];
  /** Cria a categoria no banco e devolve a criada (erro 23505 = repetida). */
  aoCriarCategoria: (nome: string) => Promise<CategoriaProduto>;
  valoresIniciais?: DadosProduto;
  textoSalvar: string;
  salvando: boolean;
  aoSalvar: (dados: DadosProduto) => void;
  aoCancelar: () => void;
}

/** Valor especial do select de categoria para abrir o campo de nova categoria. */
const NOVA_CATEGORIA = "__nova__";

const TIPOS: { valor: TipoProduto; explicacao: string }[] = [
  { valor: "fisico", explicacao: "Algo que você produz e entrega: bolsa, tapete, cachepô." },
  { valor: "aula", explicacao: "Um curso ou uma oficina em que você ensina." },
];

const opcoesComplexidade = (Object.keys(ROTULOS_COMPLEXIDADE) as Complexidade[]).map((n) => ({
  valor: n,
  rotulo: ROTULOS_COMPLEXIDADE[n],
}));

const opcoesExclusividade = (Object.keys(ROTULOS_EXCLUSIVIDADE) as Exclusividade[]).map((n) => ({
  valor: n,
  rotulo: ROTULOS_EXCLUSIVIDADE[n],
}));

/* Ordem dos campos na tela, para levar o foco ao primeiro erro. */
const ORDEM_CAMPOS: (keyof DadosProduto)[] = [
  "nome",
  "categoria_id",
  "tipo",
  "tempo_producao",
  "nivel_complexidade",
  "nivel_exclusividade",
  "embalagem",
  "custos_extras",
];

/** Mesmo nome, sem diferenciar maiúscula nem acento ("Decoração" = "decoracao"). */
function mesmoNome(a: string, b: string) {
  return a.trim().localeCompare(b.trim(), "pt-BR", { sensitivity: "base" }) === 0;
}

export function FormularioProduto({
  categorias: categoriasIniciais,
  aoCriarCategoria,
  valoresIniciais,
  textoSalvar,
  salvando,
  aoSalvar,
  aoCancelar,
}: FormularioProdutoProps) {
  const { avisar } = useAvisos();

  const [categorias, setCategorias] = useState(categoriasIniciais);

  const [nome, setNome] = useState(valoresIniciais?.nome ?? "");
  const [categoriaId, setCategoriaId] = useState(
    valoresIniciais?.categoria_id ? String(valoresIniciais.categoria_id) : ""
  );
  const [tipo, setTipo] = useState<TipoProduto>(valoresIniciais?.tipo ?? "fisico");
  const [tempo, setTempo] = useState<number | null>(valoresIniciais?.tempo_producao ?? null);
  const [complexidade, setComplexidade] = useState<Complexidade>(
    valoresIniciais?.nivel_complexidade ?? "simples"
  );
  const [exclusividade, setExclusividade] = useState<Exclusividade>(
    valoresIniciais?.nivel_exclusividade ?? "regular"
  );
  const [embalagem, setEmbalagem] = useState<number | null>(valoresIniciais?.embalagem ?? null);
  const [extras, setExtras] = useState<number | null>(valoresIniciais?.custos_extras ?? null);

  const [criandoCategoria, setCriandoCategoria] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [erroNovaCategoria, setErroNovaCategoria] = useState("");
  const [salvandoCategoria, setSalvandoCategoria] = useState(false);

  const [erros, setErros] = useState<Partial<Record<keyof DadosProduto, string>>>({});

  const fisico = tipo === "fisico";

  function limparErro(campo: keyof DadosProduto) {
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: "" }));
  }

  function escolherCategoria(valor: string) {
    if (valor === NOVA_CATEGORIA) {
      setCriandoCategoria(true);
      return;
    }
    setCriandoCategoria(false);
    setCategoriaId(valor);
    limparErro("categoria_id");
  }

  async function salvarCategoria() {
    const nomeLimpo = novaCategoria.trim();

    if (!nomeLimpo) {
      setErroNovaCategoria("Digite o nome da categoria.");
      return;
    }

    if (categorias.some((c) => mesmoNome(c.nome, nomeLimpo))) {
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

  function enviar(e: FormEvent) {
    e.preventDefault();

    /* Aula: sem exclusividade (regular) e sem embalagem (0). Vazio = 0. */
    const dados: DadosProduto = {
      nome: nome.trim(),
      tipo,
      categoria_id: categoriaId ? Number(categoriaId) : null,
      tempo_producao: tempo ?? 0,
      nivel_complexidade: complexidade,
      nivel_exclusividade: fisico ? exclusividade : "regular",
      embalagem: fisico ? (embalagem ?? 0) : 0,
      custos_extras: extras ?? 0,
    };

    const novos = validarProduto(dados);
    setErros(novos);

    const primeiro = ORDEM_CAMPOS.find((campo) => novos[campo]);

    if (primeiro) {
      document.getElementById(`produto-${primeiro}`)?.focus();
      return;
    }

    aoSalvar(dados);
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      <TextField
        id="produto-nome"
        rotulo="Nome"
        valor={nome}
        aoMudar={(v) => {
          setNome(v);
          limparErro("nome");
        }}
        obrigatorio
        placeholder="Ex.: Bolsa de praia em fio náutico"
        dica="Como você chama esse produto."
        erro={erros.nome || undefined}
      />

      {/* Categoria (com opção de criar uma nova) */}
      <div>
        <SelectField
          id="produto-categoria_id"
          rotulo="Categoria"
          valor={criandoCategoria ? NOVA_CATEGORIA : categoriaId}
          aoMudar={escolherCategoria}
          opcoes={[
            ...categorias.map((c) => ({ valor: String(c.id), rotulo: c.nome })),
            { valor: NOVA_CATEGORIA, rotulo: "Criar nova categoria" },
          ]}
          textoVazio="Sem categoria"
          dica="Ajuda a organizar e encontrar seus produtos."
          erro={erros.categoria_id || undefined}
        />

        {criandoCategoria && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-borda bg-fundo p-4">
            {/* Enter aqui cria a categoria e NÃO envia o formulário do produto. */}
            <div
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!salvandoCategoria) salvarCategoria();
                }
              }}
            >
              <TextField
                rotulo="Nome da categoria nova"
                valor={novaCategoria}
                aoMudar={(v) => {
                  setNovaCategoria(v);
                  setErroNovaCategoria("");
                }}
                erro={erroNovaCategoria || undefined}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button icone="mais" carregando={salvandoCategoria} onClick={salvarCategoria}>
                Salvar categoria
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

      {/* Tipo: botões de opção grandes */}
      <fieldset>
        <legend className="mb-2 text-lg font-bold text-texto">Tipo</legend>
        <p className="mb-3 text-base text-texto-suave">
          Escolha se você vende uma peça ou uma aula.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {TIPOS.map(({ valor, explicacao }, indice) => {
            const escolhido = tipo === valor;

            return (
              <label
                key={valor}
                className={`flex min-h-[88px] cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 focus-within:ring-[3px] focus-within:ring-destaque ${
                  escolhido
                    ? "border-destaque bg-destaque-suave"
                    : "border-borda-campo bg-cartao hover:bg-fundo"
                }`}
              >
                <input
                  id={indice === 0 ? "produto-tipo" : undefined}
                  type="radio"
                  name="tipo"
                  value={valor}
                  checked={escolhido}
                  onChange={() => {
                    setTipo(valor);
                    limparErro("tipo");
                  }}
                  className="mt-1 h-6 w-6 shrink-0 accent-destaque focus:outline-none"
                />
                <span className="flex flex-col gap-1">
                  <span className="text-lg font-bold text-texto">{ROTULOS_TIPO[valor]}</span>
                  <span className="text-base text-texto-suave">{explicacao}</span>
                </span>
              </label>
            );
          })}
        </div>
        {erros.tipo && (
          <p className="mt-2 text-base font-bold text-perigo">{erros.tipo}</p>
        )}
      </fieldset>

      <div className="grid gap-6 md:grid-cols-2">
        <QuantityField
          id="produto-tempo_producao"
          rotulo={fisico ? "Horas para fazer a peça" : "Horas de aula e preparo"}
          valor={tempo}
          aoMudar={(v) => {
            setTempo(v);
            limparErro("tempo_producao");
          }}
          unidade="horas"
          casas={2}
          dica={
            fisico
              ? "Some todo o tempo de trabalho. Ex.: 2,5 para duas horas e meia."
              : "Some o tempo da aula e o tempo para preparar. Ex.: 3 ou 1,5."
          }
          erro={erros.tempo_producao || undefined}
        />

        <SelectField
          id="produto-nivel_complexidade"
          rotulo="Complexidade"
          valor={complexidade}
          aoMudar={(v) => {
            setComplexidade(v as Complexidade);
            limparErro("nivel_complexidade");
          }}
          opcoes={opcoesComplexidade}
          textoVazio="Escolha a complexidade"
          dica="Trabalhos mais difíceis valem mais pela sua hora."
          erro={erros.nivel_complexidade || undefined}
        />

        {fisico && (
          <SelectField
            id="produto-nivel_exclusividade"
            rotulo="Exclusividade"
            valor={exclusividade}
            aoMudar={(v) => {
              setExclusividade(v as Exclusividade);
              limparErro("nivel_exclusividade");
            }}
            opcoes={opcoesExclusividade}
            textoVazio="Escolha a exclusividade"
            dica="Peças raras ou únicas podem ter um preço maior."
            erro={erros.nivel_exclusividade || undefined}
          />
        )}

        {fisico && (
          <MoneyField
            id="produto-embalagem"
            rotulo="Embalagem"
            valor={embalagem}
            aoMudar={(v) => {
              setEmbalagem(v);
              limparErro("embalagem");
            }}
            dica="Caixa, sacola, etiqueta, papel de seda. Deixe vazio se não tiver."
            erro={erros.embalagem || undefined}
          />
        )}

        <MoneyField
          id="produto-custos_extras"
          rotulo={fisico ? "Outros gastos da peça" : "Apostila ou material entregue"}
          valor={extras}
          aoMudar={(v) => {
            setExtras(v);
            limparErro("custos_extras");
          }}
          dica={
            fisico
              ? "Gastos que não estão na ficha de materiais. Deixe vazio se não tiver."
              : "Quanto custa o que a aluna leva para casa. Deixe vazio se não tiver."
          }
          erro={erros.custos_extras || undefined}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" icone="sucesso" carregando={salvando} className="w-full sm:w-auto">
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
