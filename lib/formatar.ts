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

/**
 * "1.234,5" — até `casas` casas decimais, sem zeros desnecessários.
 * `casasMinimas` força zeros à direita (ex.: 2 → "12,50").
 */
export function formatarNumero(
  valor: number,
  casas = 2,
  casasMinimas = 0
): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: Math.min(casasMinimas, casas),
    maximumFractionDigits: casas,
  }).format(Number.isFinite(valor) ? valor : 0);
}

/**
 * Lê um número digitado pela usuária.
 * Aceita "12,50", "1.234,50", "12.5", "1.234" e "1.234.567".
 * Com vírgula, os pontos são separadores de milhar.
 * Sem vírgula:
 *   - vários pontos são milhar ("1.234.567");
 *   - um único ponto seguido de exatamente 3 dígitos, com parte inteira
 *     diferente de "0", é milhar ("1.234" → 1234; "12.500" → 12500);
 *   - nos outros casos, o ponto é a casa decimal ("12.5"; "0.333").
 * Texto vazio ou inválido devolve null.
 */
export function lerNumero(texto: string): number | null {
  let limpo = texto.trim().replace(/\s/g, "");

  if (limpo === "") return null;

  if (limpo.includes(",")) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else {
    const pontos = (limpo.match(/\./g) ?? []).length;

    const pontoDeMilhar =
      pontos === 1 &&
      /^-?\d+\.\d{3}$/.test(limpo) &&
      !/^-?0\./.test(limpo);

    if (pontos > 1 || pontoDeMilhar) {
      limpo = limpo.replace(/\./g, "");
    }
  }

  if (!/^-?\d+(\.\d+)?$/.test(limpo)) return null;

  const numero = Number(limpo);

  return Number.isFinite(numero) ? numero : null;
}
