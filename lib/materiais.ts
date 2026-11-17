import { formatarNumero } from "@/lib/formatar";

/* Unidades de USO aceitas pelo banco (materials.unidade_uso). */
export const unidadesUso = [
  { chave: "grama", singular: "grama", plural: "gramas", abreviacao: "g" },
  { chave: "quilo", singular: "quilo", plural: "quilos", abreviacao: "kg" },
  { chave: "metro", singular: "metro", plural: "metros", abreviacao: "m" },
  { chave: "centimetro", singular: "centímetro", plural: "centímetros", abreviacao: "cm" },
  { chave: "mililitro", singular: "mililitro", plural: "mililitros", abreviacao: "ml" },
  { chave: "litro", singular: "litro", plural: "litros", abreviacao: "l" },
  { chave: "unidade", singular: "unidade", plural: "unidades", abreviacao: "un" },
  { chave: "par", singular: "par", plural: "pares", abreviacao: "par" },
] as const;

export type UnidadeUso = (typeof unidadesUso)[number]["chave"];

function dadosUnidade(chave: string | null | undefined) {
  return unidadesUso.find((u) => u.chave === chave);
}

/** Abreviação gravada na coluna antiga "unidade" (ex.: "g", "m"). */
export function abreviacaoUnidade(chave: string | null | undefined): string {
  return dadosUnidade(chave)?.abreviacao ?? chave ?? "";
}

/** "grama" quando a quantidade é 1; "gramas" nos outros casos. */
export function rotuloUnidade(
  chave: string | null | undefined,
  quantidade: number
): string {
  const u = dadosUnidade(chave);
  if (!u) return chave ?? "";
  return quantidade === 1 ? u.singular : u.plural;
}

/** "1.500 gramas", "1 par", "2,5 metros". */
export function formatarQuantidadeComUnidade(
  valor: number,
  chave: string | null | undefined
): string {
  const numero = Number.isFinite(valor) ? valor : 0;
  return `${formatarNumero(numero, 3)} ${rotuloUnidade(chave, numero)}`;
}

export type SituacaoEstoque = "sem_estoque" | "acabando" | "em_dia";

/** Sem estoque (≤ 0), acabando (mínimo > 0 e estoque ≤ mínimo) ou em dia. */
export function situacaoEstoque(
  estoqueAtual: number | null | undefined,
  minimo: number | null | undefined
): SituacaoEstoque {
  const estoque = Number(estoqueAtual ?? 0);
  const min = Number(minimo ?? 0);

  if (estoque <= 0) return "sem_estoque";
  if (min > 0 && estoque <= min) return "acabando";
  return "em_dia";
}

export const aparenciaSituacao: Record<
  SituacaoEstoque,
  { rotulo: string; variante: "perigo" | "aviso" | "sucesso" }
> = {
  sem_estoque: { rotulo: "Sem estoque", variante: "perigo" },
  acabando: { rotulo: "Acabando", variante: "aviso" },
  em_dia: { rotulo: "Em dia", variante: "sucesso" },
};
