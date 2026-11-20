/* Regras de produto (Jornada 2). Funções puras: sem banco e sem React.
   Todo preço vem do motor (lib/precificacao.ts); aqui só se montam as
   entradas do motor a partir do produto, da ficha técnica e do ateliê. */

import type { UnidadeUso } from "@/lib/materiais";
import type { ConfiguracoesAtelie } from "@/services/atelie.service";

/* Caminho relativo de propósito: o Vitest roda sem o atalho "@/" (não há
   configuração do Vitest no projeto). Os "import type" acima somem na
   compilação e não precisam do atalho para rodar. */
import {
  calcularCustoPeca,
  calcularPecasParaMeta,
  calcularPrecos,
  calcularValorHora,
  centavos,
  custoDoMaterial,
  PADROES_PRECO,
  type Complexidade,
  type CustoPeca,
  type Exclusividade,
  type Precos,
} from "./precificacao";
import { normalizarTexto } from "./texto";
import type { PrazoProduto } from "./vitrine";

// ---------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------

export type TipoProduto = "fisico" | "aula";

export const ROTULOS_TIPO: Record<TipoProduto, string> = {
  fisico: "Peça física",
  aula: "Aula",
};

/** Produto como a tela nova lê e grava (colunas novas de products). */
export interface Produto {
  id: number;
  nome: string;
  tipo: TipoProduto;
  categoria_id: number | null;
  nivel_complexidade: Complexidade;
  nivel_exclusividade: Exclusividade;
  /** Horas de trabalho na peça (ou de aula e preparo). */
  tempo_producao: number;
  embalagem: number;
  custos_extras: number;
  /** Preço de venda escolhido (é o que os Pedidos usam). */
  preco: number | null;
  preco_sugerido: number | null;
  ativo: boolean;
  /** Nome da categoria (vem da ligação categoria_id). */
  categoria_info: { nome: string } | null;
  /* Vitrine (migration 20261120090000). */
  descricao: string | null;
  publicado: boolean;
  /** false = "Preço sob consulta". */
  mostrar_preco: boolean;
  prazo: PrazoProduto;
  /** Só com "sob_encomenda" (1 a 365). */
  prazo_dias: number | null;
}

/** Campos que o cadastro e a edição gravam. */
export type DadosProduto = Pick<
  Produto,
  | "nome"
  | "tipo"
  | "categoria_id"
  | "nivel_complexidade"
  | "nivel_exclusividade"
  | "tempo_producao"
  | "embalagem"
  | "custos_extras"
>;

/** Item da ficha técnica, com os dados atuais do material. */
export interface ItemFicha {
  id: number;
  material_id: number;
  /** Quanto a peça usa, na unidade de uso do material. */
  quantidade: number;
  /** Sempre o materials.custo_por_unidade ATUAL (0 quando não há custo). */
  custo_por_unidade: number;
  /** true quando o material não tem custo (vazio ou ≤ 0): a peça sai mais barata do que deveria. */
  semCusto: boolean;
  nome: string;
  unidade: UnidadeUso;
  ativo: boolean;
}

/** O que o preço precisa das configurações do ateliê (frações: 0.15 = 15%). */
export type AtelieParaPreco = Pick<
  ConfiguracoesAtelie,
  | "meta_faturamento"
  | "custos_fixos_mensais"
  | "dias_trabalhados"
  | "horas_por_dia"
  | "taxas_venda"
  | "margem_minima"
  | "margem_ideal"
  | "marca_fator"
>;

/** O que o cálculo de preço precisa do produto. */
export type ProdutoParaPreco = Pick<
  Produto,
  | "tipo"
  | "tempo_producao"
  | "embalagem"
  | "custos_extras"
  | "nivel_complexidade"
  | "nivel_exclusividade"
>;

export interface ResultadoPrecoProduto {
  valorHora: number;
  custo: CustoPeca;
  precos: Precos;
  /** Materiais + embalagem + extras (usado nas "peças para a meta"). */
  custoDireto: number;
}

// ---------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------

const TIPOS: TipoProduto[] = ["fisico", "aula"];
const COMPLEXIDADES = Object.keys(PADROES_PRECO.complexidade) as Complexidade[];
const EXCLUSIVIDADES = Object.keys(PADROES_PRECO.exclusividade) as Exclusividade[];

function naoNegativo(valor: unknown): boolean {
  return typeof valor === "number" && Number.isFinite(valor) && valor >= 0;
}

/** Erros por campo. Objeto vazio = tudo certo. */
export function validarProduto(
  dados: Partial<DadosProduto>
): Partial<Record<keyof DadosProduto, string>> {
  const erros: Partial<Record<keyof DadosProduto, string>> = {};

  if (!dados.nome || dados.nome.trim() === "") {
    erros.nome = "Digite o nome do produto.";
  }
  if (!dados.tipo || !TIPOS.includes(dados.tipo)) {
    erros.tipo = "Escolha se é uma peça física ou uma aula.";
  }
  if (!dados.nivel_complexidade || !COMPLEXIDADES.includes(dados.nivel_complexidade)) {
    erros.nivel_complexidade = "Escolha a complexidade.";
  }
  if (!dados.nivel_exclusividade || !EXCLUSIVIDADES.includes(dados.nivel_exclusividade)) {
    erros.nivel_exclusividade = "Escolha a exclusividade.";
  }
  if (!naoNegativo(dados.tempo_producao)) {
    erros.tempo_producao = "Digite o tempo em horas (zero ou mais).";
  }
  if (!naoNegativo(dados.embalagem)) {
    erros.embalagem = "Digite o valor da embalagem (zero ou mais).";
  }
  if (!naoNegativo(dados.custos_extras)) {
    erros.custos_extras = "Digite o valor dos extras (zero ou mais).";
  }

  return erros;
}

// ---------------------------------------------------------------------
// Preço (sempre pelo motor)
// ---------------------------------------------------------------------

/** Horas de trabalho no mês = dias de trabalho × horas por dia. */
export function horasPorMes(diasTrabalhados: number, horasPorDia: number): number {
  return diasTrabalhados * horasPorDia;
}

/**
 * Preço do produto pelo motor: valor/hora → custo da peça → três preços.
 * Aula: sem ficha técnica, sem embalagem e com exclusividade "regular".
 * Erros do motor (ErroPrecificacao) sobem para a tela.
 */
export function calcularPrecoProduto(
  produto: ProdutoParaPreco,
  itens: Pick<ItemFicha, "quantidade" | "custo_por_unidade">[],
  atelie: AtelieParaPreco
): ResultadoPrecoProduto {
  const aula = produto.tipo === "aula";

  const valorHora = calcularValorHora({
    metaMensal: atelie.meta_faturamento,
    custosFixosMensais: atelie.custos_fixos_mensais,
    horasPorMes: horasPorMes(atelie.dias_trabalhados, atelie.horas_por_dia),
  });

  const custo = calcularCustoPeca({
    materiais: aula
      ? []
      : itens.map((i) => ({ quantidade: i.quantidade, custoPorUnidade: i.custo_por_unidade })),
    horas: produto.tempo_producao,
    valorHora,
    percentualComplexidade: PADROES_PRECO.complexidade[produto.nivel_complexidade],
    embalagem: aula ? 0 : produto.embalagem,
    extras: produto.custos_extras,
  });

  const precos = calcularPrecos({
    custoTotal: custo.custoTotal,
    taxasVenda: atelie.taxas_venda,
    margemMinima: atelie.margem_minima,
    margemIdeal: atelie.margem_ideal,
    fatorMarca: atelie.marca_fator,
    fatorExclusividade: aula
      ? PADROES_PRECO.exclusividade.regular
      : PADROES_PRECO.exclusividade[produto.nivel_exclusividade],
  });

  /* Única soma fora do motor: os três valores que ele mesmo devolveu. */
  const custoDireto = centavos(custo.custoMateriais + custo.embalagem + custo.extras);

  return { valorHora, custo, precos, custoDireto };
}

/** Quantas peças vender no mês para atingir a meta, com o preço escolhido. */
export function calcularMetaProduto(
  precoVenda: number,
  resultado: Pick<ResultadoPrecoProduto, "custoDireto">,
  atelie: Pick<AtelieParaPreco, "meta_faturamento" | "custos_fixos_mensais" | "taxas_venda">
): { ganhoPorPeca: number; pecasPorMes: number } {
  return calcularPecasParaMeta({
    metaMensal: atelie.meta_faturamento,
    custosFixosMensais: atelie.custos_fixos_mensais,
    precoVenda,
    taxasVenda: atelie.taxas_venda,
    custoDiretoPeca: resultado.custoDireto,
  });
}

/** O produto ainda não tem tempo informado. */
export function faltaTempo(produto: Pick<Produto, "tempo_producao">): boolean {
  return !(Number(produto.tempo_producao) > 0);
}

/**
 * Custo de UM item da ficha para mostrar na tela: a mesma conta do motor
 * (custoDoMaterial), item por item, em centavos.
 * Material sem custo (custo_por_unidade 0) dá 0.
 */
export function custoDoItem(item: Pick<ItemFicha, "quantidade" | "custo_por_unidade">): number {
  return custoDoMaterial({ quantidade: item.quantidade, custoPorUnidade: item.custo_por_unidade });
}

/** Algum material da ficha está sem custo (o preço pode sair baixo demais). */
export function fichaTemMaterialSemCusto(itens: Pick<ItemFicha, "semCusto">[]): boolean {
  return itens.some((item) => item.semCusto);
}

/**
 * Custo por unidade de um material para o motor. O banco pode devolver
 * numeric como texto; vazio, inválido, zero ou negativo viram 0 e marcam
 * "sem custo" (a tela avisa). Usada pela ficha técnica e pelo Cálculo rápido.
 */
export function custoParaCalculo(valor: number | string | null | undefined): {
  custo: number;
  semCusto: boolean;
} {
  const custo = Number(valor ?? 0);
  const semCusto = !Number.isFinite(custo) || custo <= 0;
  return { custo: semCusto ? 0 : custo, semCusto };
}

// ---------------------------------------------------------------------
// Cálculo rápido (sem salvar)
// ---------------------------------------------------------------------

/** O que o Cálculo rápido precisa de um material (o Material do service serve). */
export interface MaterialParaCalculo {
  /* number | string: o service devolve número; o campo de escolha, texto. */
  id: number | string;
  nome: string;
  custo_por_unidade: number | string | null;
  ativo: boolean | null;
}

/** Um material escolhido na tela, com quanto a peça usa (unidade do material). */
export interface LinhaCalculo {
  materialId: string;
  quantidade: number;
}

/** Arredonda em 3 casas (a casa do campo de quantidade), sem sobra de ponto flutuante. */
function tresCasas(valor: number): number {
  return Math.round(Number((valor * 1000).toPrecision(12))) / 1000;
}

/** Materiais que podem ser escolhidos: só os ativos, por nome. Não muda a lista recebida. */
export function materiaisParaCalculo<T extends MaterialParaCalculo>(materiais: T[]): T[] {
  return materiais
    .filter((m) => m.ativo !== false)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
}

/**
 * Acrescenta um material. Se ele já está na lista, SOMA a quantidade
 * (somou = true, a tela avisa); senão entra no fim. Não muda a lista recebida.
 * Quantidade inválida lança RangeError (proteção: a tela valida antes).
 */
export function adicionarLinhaCalculo(
  linhas: LinhaCalculo[],
  materialId: string,
  quantidade: number
): { linhas: LinhaCalculo[]; somou: boolean } {
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    throw new RangeError("A quantidade precisa ser maior que zero.");
  }

  const existe = linhas.some((l) => l.materialId === materialId);

  if (!existe) {
    return { linhas: [...linhas, { materialId, quantidade }], somou: false };
  }

  return {
    linhas: linhas.map((l) =>
      l.materialId === materialId ? { ...l, quantidade: tresCasas(l.quantidade + quantidade) } : l
    ),
    somou: true,
  };
}

/**
 * Itens para o motor a partir das linhas escolhidas. O custo segue a mesma
 * regra da ficha técnica (custoParaCalculo). Linha de material que não está
 * na lista é ignorada.
 */
export function itensDoCalculoRapido(
  linhas: LinhaCalculo[],
  materiais: MaterialParaCalculo[]
): { itens: Pick<ItemFicha, "quantidade" | "custo_por_unidade">[]; temSemCusto: boolean } {
  const porId = new Map(materiais.map((m) => [String(m.id), m]));
  const itens: Pick<ItemFicha, "quantidade" | "custo_por_unidade">[] = [];
  let temSemCusto = false;

  for (const linha of linhas) {
    const material = porId.get(linha.materialId);
    if (!material) continue;

    const { custo, semCusto } = custoParaCalculo(material.custo_por_unidade);
    if (semCusto) temSemCusto = true;
    itens.push({ quantidade: linha.quantidade, custo_por_unidade: custo });
  }

  return { itens, temSemCusto };
}

/** O preço escolhido ficou abaixo do mínimo calculado. */
export function precoAbaixoDoMinimo(preco: number, minimo: number): boolean {
  return preco < minimo;
}

// ---------------------------------------------------------------------
// Escolha do preço de venda
// ---------------------------------------------------------------------

export type OpcaoPreco = "minimo" | "justo" | "sugerido" | "outro";

/** Rótulo e frase de cada preço, usados pelo painel do produto e pelo Cálculo rápido. */
export const TEXTOS_PRECO: Record<OpcaoPreco, { rotulo: string; frase: string }> = {
  minimo: { rotulo: "Mínimo", frase: "Abaixo disso, você perde dinheiro." },
  justo: { rotulo: "Justo", frase: "Paga seu tempo, os custos e a margem ideal." },
  sugerido: {
    rotulo: "Sugerido",
    frase: "O justo com o valor da sua marca e da exclusividade.",
  },
  outro: { rotulo: "Outro valor", frase: "Digite o preço que você quer cobrar." },
};

/** Há um valor em reais utilizável (número finito e maior que zero). */
function temValor(valor: number | null): valor is number {
  return valor !== null && Number.isFinite(valor) && valor > 0;
}

/**
 * Opção marcada ao abrir o painel: compara o preço gravado com os três
 * preços de agora, no mesmo centavo. Empate: sugerido, justo, mínimo.
 * Sem preço gravado → "sugerido"; nenhum igual → "outro" com o valor gravado.
 */
export function escolhaInicialPreco(
  precoGravado: number | null,
  precos: Precos
): { opcao: OpcaoPreco; valorOutro: number | null } {
  if (!temValor(precoGravado)) return { opcao: "sugerido", valorOutro: null };

  const gravado = centavos(precoGravado);
  const ordem: Exclude<OpcaoPreco, "outro">[] = ["sugerido", "justo", "minimo"];
  const igual = ordem.find((opcao) => centavos(precos[opcao]) === gravado);

  return igual ? { opcao: igual, valorOutro: null } : { opcao: "outro", valorOutro: gravado };
}

/** Preço da opção marcada; em "outro", o valor digitado (null se vazio). */
export function precoDaEscolha(
  opcao: OpcaoPreco,
  precos: Precos,
  valorOutro: number | null
): number | null {
  return opcao === "outro" ? valorOutro : precos[opcao];
}

/**
 * Os custos mudaram desde que o preço foi salvo: o sugerido gravado é
 * diferente do sugerido de agora (em centavos). Sem preço gravado ou sem
 * sugerido gravado, não há com o que comparar → false.
 */
export function custosMudaram(
  produto: Pick<Produto, "preco" | "preco_sugerido">,
  sugeridoAtual: number
): boolean {
  if (!temValor(produto.preco) || !temValor(produto.preco_sugerido)) return false;

  return centavos(produto.preco_sugerido) !== centavos(sugeridoAtual);
}

// ---------------------------------------------------------------------
// Filtros da lista
// ---------------------------------------------------------------------

/** Valor do filtro de categoria para produtos sem categoria_id. */
export const SEM_CATEGORIA = "sem-categoria";

export interface FiltrosProdutos {
  /** Texto da busca pelo nome (sem diferenciar maiúscula nem acento). */
  busca: string;
  /** "" = todas; SEM_CATEGORIA = sem categoria; ou o id da categoria. */
  categoria: string;
  /** "" = todos; ou o tipo. */
  tipo: "" | TipoProduto;
  mostrarArquivados: boolean;
}

/** Aplica busca, categoria, tipo e arquivados. Mantém a ordem recebida. */
export function filtrarProdutos<
  T extends Pick<Produto, "nome" | "categoria_id" | "tipo" | "ativo">,
>(produtos: T[], filtros: FiltrosProdutos): T[] {
  const termo = normalizarTexto(filtros.busca.trim());

  return produtos.filter((p) => {
    if (!filtros.mostrarArquivados && !p.ativo) return false;

    if (filtros.categoria === SEM_CATEGORIA) {
      if (p.categoria_id !== null) return false;
    } else if (filtros.categoria && String(p.categoria_id) !== filtros.categoria) {
      return false;
    }

    if (filtros.tipo && p.tipo !== filtros.tipo) return false;
    if (termo && !normalizarTexto(p.nome).includes(termo)) return false;

    return true;
  });
}

// ---------------------------------------------------------------------
// Compatibilidade com as colunas antigas (telas antigas ainda leem)
// ---------------------------------------------------------------------

const COMPLEXIDADE_ANTIGA: Record<Complexidade, number> = {
  simples: 1,
  media: 2,
  dificil: 3,
  autor: 4,
};

const EXCLUSIVIDADE_ANTIGA: Record<Exclusividade, number> = {
  regular: 1,
  encomenda: 2,
  limitada: 3,
  unica: 4,
};

/** nivel_complexidade → coluna antiga complexidade (1 a 4). */
export function complexidadeAntiga(nivel: Complexidade): number {
  return COMPLEXIDADE_ANTIGA[nivel];
}

/** nivel_exclusividade → coluna antiga exclusividade (1 a 4). */
export function exclusividadeAntiga(nivel: Exclusividade): number {
  return EXCLUSIVIDADE_ANTIGA[nivel];
}

/** custo_total gravado na ficha, só por compatibilidade (o preço não usa). */
export function custoTotalItemCompat(quantidade: number, custoPorUnidade: number): number {
  const total = quantidade * custoPorUnidade;
  return Number.isFinite(total) ? total : 0;
}
