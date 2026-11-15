const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** "R$ 1.234,50". Valor inválido (NaN, Infinity) vira "R$ 0,00". */
export function formatarMoeda(valor: number): string {
  return formatadorMoeda.format(
    Number.isFinite(valor) ? valor : 0
  );
}

/** "1.234,5" — até `casas` casas decimais, sem zeros desnecessários. */
export function formatarNumero(
  valor: number,
  casas = 2
): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  }).format(Number.isFinite(valor) ? valor : 0);
}

/**
 * Lê um número digitado pela usuária.
 * Aceita "12,50", "1.234,50", "12.5" e "1.234.567".
 * Com vírgula, os pontos são separadores de milhar.
 * Sem vírgula, um único ponto é a casa decimal; vários pontos são milhar.
 * Texto vazio ou inválido devolve null.
 */
export function lerNumero(texto: string): number | null {
  let limpo = texto.trim().replace(/\s/g, "");

  if (limpo === "") return null;

  if (limpo.includes(",")) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if ((limpo.match(/\./g) ?? []).length > 1) {
    limpo = limpo.replace(/\./g, "");
  }

  if (!/^-?\d+(\.\d+)?$/.test(limpo)) return null;

  const numero = Number(limpo);

  return Number.isFinite(numero) ? numero : null;
}
