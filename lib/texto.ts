/* Normalização de texto compartilhada (busca de produtos, endereço da vitrine).
   Funções puras: sem banco e sem React. */

/* Acentos separados pelo normalize("NFD"): faixa Unicode 0300 a 036F.
   (Montada com fromCharCode: o alvo ES2017 não aceita \p{M}.) */
const ACENTOS = new RegExp(
  `[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`,
  "g"
);

/** Tira os acentos ("Ateliê" → "Atelie"), sem mudar maiúsculas. */
export function semAcentos(texto: string): string {
  return texto.normalize("NFD").replace(ACENTOS, "");
}

/** Minúsculas e sem acentos, para comparar textos ("Crochê" = "croche"). */
export function normalizarTexto(texto: string): string {
  return semAcentos(texto).toLowerCase();
}
