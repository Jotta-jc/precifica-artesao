/* Fotos dos produtos e logo do ateliê (Jornada 3, V6b; decisões Q1–Q8).
   Funções puras: sem banco, sem navegador e sem React. As regras seguem o
   bucket "vitrine" e as restrições products_foto_formato e
   business_metrics_logo_formato (migration 20261120200000). */

export const BUCKET_VITRINE = "vitrine";
/** Lado maior da foto do produto, em pixels. */
export const LADO_MAXIMO_FOTO = 1200;
/** Lado maior do logo do ateliê, em pixels. */
export const LADO_MAXIMO_LOGO = 600;
export const QUALIDADE_JPEG = 0.8;
/** Limite do bucket: 2 MB. */
export const TAMANHO_MAXIMO_FOTO = 2 * 1024 * 1024;

// ---------------------------------------------------------------------
// Erros
// ---------------------------------------------------------------------

export type CodigoErroFoto =
  | "NAO_E_IMAGEM"
  | "NAO_ABRIU"
  | "MUITO_GRANDE"
  | "SESSAO_EXPIRADA"
  | "ENVIO_FALHOU"
  | "REMOCAO_FALHOU"
  | "PRODUTO_NAO_ENCONTRADO";

/** Erro das fotos, com "code" como o erro do Supabase. As mensagens ficam em
    services/fotos.service.ts. Fica aqui (e não no service) para
    lib/reduzirImagem.ts usar sem importar o service, que importa ele. */
export class ErroFoto extends Error {
  readonly code: CodigoErroFoto;

  constructor(code: CodigoErroFoto) {
    super(code);
    this.name = "ErroFoto";
    this.code = code;
  }
}

// ---------------------------------------------------------------------
// Medidas
// ---------------------------------------------------------------------

function positivoFinito(valor: number): boolean {
  return Number.isFinite(valor) && valor > 0;
}

/**
 * Medidas para caber em ladoMaximo, mantendo a proporção. Nunca aumenta uma
 * foto menor que o limite. Arredonda, com mínimo de 1 pixel.
 */
export function medidasReduzidas(
  largura: number,
  altura: number,
  ladoMaximo: number
): { largura: number; altura: number } {
  if (!positivoFinito(largura) || !positivoFinito(altura) || !positivoFinito(ladoMaximo)) {
    throw new RangeError("Medidas inválidas.");
  }

  const escala = Math.min(1, ladoMaximo / Math.max(largura, altura));

  return {
    largura: Math.max(1, Math.round(largura * escala)),
    altura: Math.max(1, Math.round(altura * escala)),
  };
}

// ---------------------------------------------------------------------
// Caminhos no bucket
// ---------------------------------------------------------------------

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/* Mesmas regex das restrições do banco (o banco confere também o user_id). */
const FORMATO_CAMINHO_FOTO = /^[0-9a-f-]{36}\/produtos\/[0-9]+-[0-9]+\.jpg$/;
const FORMATO_CAMINHO_LOGO = /^[0-9a-f-]{36}\/logo-[0-9]+\.jpg$/;

function conferirUsuaria(userId: string) {
  if (!FORMATO_UUID.test(userId)) throw new RangeError("Conta inválida.");
}

function conferirAgora(agoraMs: number) {
  if (!Number.isSafeInteger(agoraMs) || agoraMs < 0) throw new RangeError("Data inválida.");
}

/** "<user_id>/produtos/<id do produto>-<agoraMs>.jpg" (nome novo a cada envio). */
export function caminhoFotoProduto(userId: string, produtoId: number, agoraMs: number): string {
  conferirUsuaria(userId);
  if (!Number.isSafeInteger(produtoId) || produtoId <= 0) {
    throw new RangeError("Produto inválido.");
  }
  conferirAgora(agoraMs);
  return `${userId}/produtos/${produtoId}-${agoraMs}.jpg`;
}

/** "<user_id>/logo-<agoraMs>.jpg" (nome novo a cada envio). */
export function caminhoLogo(userId: string, agoraMs: number): string {
  conferirUsuaria(userId);
  conferirAgora(agoraMs);
  return `${userId}/logo-${agoraMs}.jpg`;
}

export function caminhoFotoValido(caminho: string): boolean {
  return FORMATO_CAMINHO_FOTO.test(caminho);
}

export function caminhoLogoValido(caminho: string): boolean {
  return FORMATO_CAMINHO_LOGO.test(caminho);
}

/**
 * Link público do arquivo no bucket "vitrine". urlBase é o endereço do
 * projeto Supabase. Caminho vazio ou fora dos dois formatos → null.
 */
export function linkPublicoFoto(urlBase: string, caminho: string | null): string | null {
  if (caminho === null || !(caminhoFotoValido(caminho) || caminhoLogoValido(caminho))) {
    return null;
  }
  const base = urlBase.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${BUCKET_VITRINE}/${caminho}`;
}
