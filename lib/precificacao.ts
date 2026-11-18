/* Motor único de precificação (Jornada 2, metodologia aprovada em 18/11/2026).
   TypeScript puro: sem React e sem Supabase. Nenhuma tela calcula preço
   por conta própria; todas usam estas funções.
   Valores em reais saem arredondados para centavos SÓ no resultado final. */

// ---------------------------------------------------------------------
// Tipos e valores padrão
// ---------------------------------------------------------------------

export type Complexidade = "simples" | "media" | "dificil" | "autor";
export type Exclusividade = "regular" | "encomenda" | "limitada" | "unica";
export type NivelMarca = "comecando" | "regional" | "reconhecida" | "referencia";

export const PADROES_PRECO = {
  taxasVenda: 0.15,
  margemMinima: 0.2,
  margemIdeal: 0.3,
  /** Adicional sobre o valor do tempo. */
  complexidade: { simples: 0, media: 0.15, dificil: 0.3, autor: 0.5 },
  /** Multiplica o preço justo. */
  exclusividade: { regular: 1, encomenda: 1.05, limitada: 1.1, unica: 1.25 },
  /** Multiplica o preço justo ("Referência" pode ser ajustado acima de 2). */
  marca: { comecando: 1, regional: 1.2, reconhecida: 1.5, referencia: 2 },
} as const satisfies {
  taxasVenda: number;
  margemMinima: number;
  margemIdeal: number;
  complexidade: Record<Complexidade, number>;
  exclusividade: Record<Exclusividade, number>;
  marca: Record<NivelMarca, number>;
};

// Rótulos para a tela.
export const ROTULOS_COMPLEXIDADE: Record<Complexidade, string> = {
  simples: "Simples",
  media: "Média",
  dificil: "Difícil",
  autor: "Peça de autor",
};

export const ROTULOS_EXCLUSIVIDADE: Record<Exclusividade, string> = {
  regular: "Produção regular",
  encomenda: "Sob encomenda",
  limitada: "Edição limitada",
  unica: "Peça única",
};

export const ROTULOS_MARCA: Record<NivelMarca, string> = {
  comecando: "Começando",
  regional: "Conhecida na região",
  reconhecida: "Reconhecida",
  referencia: "Referência",
};

// ---------------------------------------------------------------------
// Erros (mensagem em português simples, para a artesã)
// ---------------------------------------------------------------------

export type CodigoErroPrecificacao =
  | "VALOR_NEGATIVO"
  | "HORAS_INVALIDAS"
  | "MARGEM_INVALIDA"
  | "MARGENS_INVERTIDAS"
  | "FATOR_INVALIDO"
  | "GANHO_INSUFICIENTE";

const MENSAGENS_ERRO: Record<CodigoErroPrecificacao, string> = {
  VALOR_NEGATIVO: "Algum valor está negativo. Confira os números digitados.",
  HORAS_INVALIDAS: "Informe quantas horas você trabalha por mês (mais que zero).",
  MARGEM_INVALIDA:
    "As taxas de venda somadas à margem chegam a 100% ou mais. Diminua as taxas ou a margem.",
  MARGENS_INVERTIDAS: "A margem mínima não pode ser maior que a margem ideal.",
  FATOR_INVALIDO: "Os fatores de marca e de exclusividade precisam ser maiores que zero.",
  GANHO_INSUFICIENTE:
    "Com esse preço, cada peça não paga o próprio custo. Aumente o preço ou reduza os custos.",
};

export class ErroPrecificacao extends Error {
  readonly codigo: CodigoErroPrecificacao;

  constructor(codigo: CodigoErroPrecificacao) {
    super(MENSAGENS_ERRO[codigo]);
    this.name = "ErroPrecificacao";
    this.codigo = codigo;
  }
}

// ---------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------

/** Arredonda para centavos (só no resultado final). */
function centavos(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** Recusa número negativo (ou que não seja número). */
function exigirNaoNegativo(...valores: number[]): void {
  for (const v of valores) {
    if (!Number.isFinite(v) || v < 0) throw new ErroPrecificacao("VALOR_NEGATIVO");
  }
}

// ---------------------------------------------------------------------
// Valor/hora
// ---------------------------------------------------------------------

/** Valor/hora = (quanto quero ganhar no mês + custos fixos) ÷ horas produtivas. */
export function calcularValorHora(entrada: {
  metaMensal: number;
  custosFixosMensais: number;
  horasPorMes: number;
}): number {
  const { metaMensal, custosFixosMensais, horasPorMes } = entrada;

  if (!Number.isFinite(horasPorMes) || horasPorMes <= 0) {
    throw new ErroPrecificacao("HORAS_INVALIDAS");
  }
  exigirNaoNegativo(metaMensal, custosFixosMensais);

  return centavos((metaMensal + custosFixosMensais) / horasPorMes);
}

// ---------------------------------------------------------------------
// Custo da peça
// ---------------------------------------------------------------------

export interface MaterialDaFicha {
  /** Quanto a peça usa, na unidade de uso do material. */
  quantidade: number;
  custoPorUnidade: number;
}

export interface CustoPeca {
  custoMateriais: number;
  valorTempo: number;
  adicionalComplexidade: number;
  embalagem: number;
  extras: number;
  custoTotal: number;
}

/** Custo = materiais + tempo + adicional de complexidade (sobre o tempo) + embalagem + extras. */
export function calcularCustoPeca(entrada: {
  materiais: MaterialDaFicha[];
  horas: number;
  valorHora: number;
  /** Ex.: 0.3 para +30%. */
  percentualComplexidade: number;
  embalagem: number;
  extras: number;
}): CustoPeca {
  const { materiais, horas, valorHora, percentualComplexidade, embalagem, extras } = entrada;

  exigirNaoNegativo(horas, valorHora, percentualComplexidade, embalagem, extras);
  for (const m of materiais) exigirNaoNegativo(m.quantidade, m.custoPorUnidade);

  const custoMateriais = materiais.reduce(
    (soma, m) => soma + m.quantidade * m.custoPorUnidade,
    0
  );
  const valorTempo = horas * valorHora;
  const adicionalComplexidade = valorTempo * percentualComplexidade;
  const custoTotal = custoMateriais + valorTempo + adicionalComplexidade + embalagem + extras;

  return {
    custoMateriais: centavos(custoMateriais),
    valorTempo: centavos(valorTempo),
    adicionalComplexidade: centavos(adicionalComplexidade),
    embalagem: centavos(embalagem),
    extras: centavos(extras),
    custoTotal: centavos(custoTotal),
  };
}

// ---------------------------------------------------------------------
// Preços
// ---------------------------------------------------------------------

export interface Precos {
  minimo: number;
  justo: number;
  sugerido: number;
}

/**
 * Mínimo = custo ÷ (1 − taxas − margem mínima);
 * Justo  = custo ÷ (1 − taxas − margem ideal);
 * Sugerido = justo × fator da marca × fator de exclusividade.
 * A margem é sobre o PREÇO DE VENDA (não é markup sobre o custo).
 */
export function calcularPrecos(entrada: {
  custoTotal: number;
  taxasVenda: number;
  margemMinima: number;
  margemIdeal: number;
  fatorMarca: number;
  fatorExclusividade: number;
}): Precos {
  const { custoTotal, taxasVenda, margemMinima, margemIdeal, fatorMarca, fatorExclusividade } =
    entrada;

  exigirNaoNegativo(custoTotal, taxasVenda, margemMinima, margemIdeal);

  if (
    !Number.isFinite(fatorMarca) ||
    !Number.isFinite(fatorExclusividade) ||
    fatorMarca <= 0 ||
    fatorExclusividade <= 0
  ) {
    throw new ErroPrecificacao("FATOR_INVALIDO");
  }

  if (taxasVenda + margemIdeal >= 1 || taxasVenda + margemMinima >= 1) {
    throw new ErroPrecificacao("MARGEM_INVALIDA");
  }

  if (margemMinima > margemIdeal) {
    throw new ErroPrecificacao("MARGENS_INVERTIDAS");
  }

  const minimo = custoTotal / (1 - taxasVenda - margemMinima);
  const justo = custoTotal / (1 - taxasVenda - margemIdeal);
  const sugerido = justo * fatorMarca * fatorExclusividade;

  return {
    minimo: centavos(minimo),
    justo: centavos(justo),
    sugerido: centavos(sugerido),
  };
}

// ---------------------------------------------------------------------
// Quantas peças vender para atingir a meta
// ---------------------------------------------------------------------

/**
 * Ganho por peça = preço × (1 − taxas) − custo direto (materiais + embalagem + extras).
 * Peças por mês = (meta + custos fixos) ÷ ganho por peça, arredondado para cima.
 */
export function calcularPecasParaMeta(entrada: {
  metaMensal: number;
  custosFixosMensais: number;
  precoVenda: number;
  taxasVenda: number;
  custoDiretoPeca: number;
}): { ganhoPorPeca: number; pecasPorMes: number } {
  const { metaMensal, custosFixosMensais, precoVenda, taxasVenda, custoDiretoPeca } = entrada;

  exigirNaoNegativo(metaMensal, custosFixosMensais, precoVenda, taxasVenda, custoDiretoPeca);

  const ganhoPorPeca = precoVenda * (1 - taxasVenda) - custoDiretoPeca;

  if (ganhoPorPeca <= 0) {
    throw new ErroPrecificacao("GANHO_INSUFICIENTE");
  }

  const pecasPorMes = Math.ceil((metaMensal + custosFixosMensais) / ganhoPorPeca);

  return { ganhoPorPeca: centavos(ganhoPorPeca), pecasPorMes };
}
