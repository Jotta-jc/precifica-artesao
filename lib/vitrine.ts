/* Vitrine pública (Jornada 3, etapa V2; decisões L1–L11).
   Funções puras: sem banco e sem React. As regras seguem as restrições da
   tabela vitrines e das colunas de vitrine de products
   (migration 20261120090000). */

/* Caminho relativo de propósito: o Vitest roda sem o atalho "@/". */
import { formatarMoeda } from "./formatar";
import { semAcentos } from "./texto";

// ---------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------

export type PrazoProduto = "pronta_entrega" | "sob_encomenda";

/** Uma linha da tabela vitrines. */
export interface Vitrine {
  id: number;
  user_id: string;
  endereco: string;
  publicada: boolean;
  whatsapp: string | null;
  instagram: string | null;
  sobre: string | null;
  created_at: string;
  updated_at: string;
}

/** O que a tela edita (texto digitado; vazio = sem valor). */
export interface RascunhoVitrine {
  endereco: string;
  whatsapp: string;
  instagram: string;
  sobre: string;
}

export type ErrosVitrine = Partial<Record<"endereco" | "whatsapp" | "instagram" | "sobre", string>>;

// ---------------------------------------------------------------------
// Endereço (/v/<endereco>)
// ---------------------------------------------------------------------

const ENDERECO_MIN = 3;
const ENDERECO_MAX = 40;
const FORMATO_ENDERECO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Endereços que não podem ser usados (partes do sistema ou que confundem). */
export const ENDERECOS_RESERVADOS: readonly string[] = [
  "admin",
  "api",
  "login",
  "entrar",
  "sair",
  "cadastro",
  "conta",
  "suporte",
  "ajuda",
  "oficial",
  "vitrine",
  "vitrines",
  "precifica",
  "ateliefacil",
];

/** Tira o "-" do começo e do fim e junta hífens repetidos. */
function limparHifens(texto: string): string {
  return texto.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * Sugestão de endereço a partir do nome do ateliê: minúsculas, sem acento,
 * o que não é letra ou número vira hífen; até 40 caracteres, sem hífen nas
 * pontas. Curto demais (menos de 3) → "meu-atelie". Se der um endereço
 * reservado, acrescenta "-atelie" para continuar válido.
 */
export function sugerirEndereco(nomeAtelie: string): string {
  let endereco = limparHifens(semAcentos(nomeAtelie).toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  endereco = limparHifens(endereco.slice(0, ENDERECO_MAX));

  if (endereco.length < ENDERECO_MIN) return "meu-atelie";
  if (ENDERECOS_RESERVADOS.includes(endereco)) return `${endereco}-atelie`;
  return endereco;
}

/** Como a tela prepara o que foi digitado: sem espaços nas pontas, minúsculas, sem acento, espaço vira hífen. */
export function normalizarEndereco(texto: string): string {
  return semAcentos(texto.trim()).toLowerCase().replace(/\s+/g, "-");
}

/** Mensagem do problema do endereço, ou null se estiver certo. */
export function validarEndereco(texto: string): string | null {
  if (texto === "") return "Digite o endereço da sua vitrine.";
  if (texto.length < ENDERECO_MIN || texto.length > ENDERECO_MAX) {
    return "Use de 3 a 40 caracteres.";
  }
  if (!FORMATO_ENDERECO.test(texto)) {
    return "Use só letras sem acento, números e hífen, sem hífen no começo ou no fim.";
  }
  if (ENDERECOS_RESERVADOS.includes(texto)) {
    return "Esse endereço não pode ser usado. Escolha outro.";
  }
  return null;
}

// ---------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------

/** Só os dígitos: "(41) 99999-9999" → "41999999999". */
export function normalizarWhatsapp(texto: string): string {
  return texto.replace(/\D/g, "");
}

/** Mensagem do problema, ou null. Vazio só é erro quando for obrigatório (publicar). */
export function validarWhatsapp(texto: string, obrigatorio: boolean): string | null {
  const digitos = normalizarWhatsapp(texto);

  if (digitos === "") {
    return obrigatorio ? "Digite o seu WhatsApp para publicar a vitrine." : null;
  }
  if (digitos.length < 10 || digitos.length > 13) {
    return "Digite o WhatsApp com DDD, como (41) 99999-9999.";
  }
  return null;
}

/**
 * Link para conversar no WhatsApp, com a mensagem pronta.
 * Número com 10 ou 11 dígitos (DDD + número) ganha o 55 do Brasil.
 */
export function linkWhatsapp(numero: string, nomeProduto?: string): string {
  let digitos = normalizarWhatsapp(numero);
  if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`;

  const nome = nomeProduto?.trim();
  const mensagem = nome
    ? `Olá! Vi o produto ${nome} na sua vitrine e quero saber mais.`
    : "Olá! Vi a sua vitrine e quero saber mais.";

  return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`;
}

// ---------------------------------------------------------------------
// Instagram
// ---------------------------------------------------------------------

const FORMATO_INSTAGRAM = /^[A-Za-z0-9._]{1,30}$/;

/**
 * Só o nome do perfil: tira espaços, "https://", "www.", "instagram.com/",
 * o "@" do começo, o que vem depois de "?" (links compartilhados) e a barra do fim.
 */
export function normalizarInstagram(texto: string): string {
  return texto
    .replace(/\s+/g, "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^instagram\.com\//i, "")
    .replace(/\?.*$/, "")
    .replace(/^@+/, "")
    .replace(/\/+$/, "");
}

/** Mensagem do problema, ou null. Vazio é válido (o Instagram é opcional). */
export function validarInstagram(texto: string): string | null {
  const usuario = normalizarInstagram(texto);
  if (usuario === "") return null;
  if (!FORMATO_INSTAGRAM.test(usuario)) {
    return "Use só o nome do perfil, com letras, números, ponto ou sublinhado.";
  }
  return null;
}

export function linkInstagram(usuario: string): string {
  return `https://www.instagram.com/${normalizarInstagram(usuario)}/`;
}

// ---------------------------------------------------------------------
// Textos livres
// ---------------------------------------------------------------------

/* Conta caracteres como o banco (char_length): emoji conta 1. */
function tamanho(texto: string): number {
  return [...texto].length;
}

export function validarSobre(texto: string): string | null {
  return tamanho(texto) > 500 ? "Use até 500 caracteres." : null;
}

export function validarDescricao(texto: string): string | null {
  return tamanho(texto) > 1000 ? "Use até 1000 caracteres." : null;
}

// ---------------------------------------------------------------------
// Produto na vitrine
// ---------------------------------------------------------------------

/** O produto só aparece se estiver ativo, publicado e com a vitrine publicada. */
export function produtoNaVitrine(
  produto: { ativo: boolean; publicado: boolean },
  vitrinePublicada: boolean
): boolean {
  return produto.ativo && produto.publicado && vitrinePublicada;
}

/** "R$ 120,00", ou "Preço sob consulta" (preço escondido, vazio ou zero). */
export function textoPreco(produto: { preco: number | null; mostrar_preco: boolean }): string {
  const { preco, mostrar_preco } = produto;
  if (!mostrar_preco || preco === null || !Number.isFinite(preco) || preco <= 0) {
    return "Preço sob consulta";
  }
  return formatarMoeda(preco);
}

export function textoPrazo(produto: { prazo: PrazoProduto; prazo_dias: number | null }): string {
  if (produto.prazo === "pronta_entrega") return "Pronta entrega";
  if (produto.prazo_dias === null) return "Sob encomenda";
  const dias = produto.prazo_dias === 1 ? "1 dia" : `${produto.prazo_dias} dias`;
  return `Sob encomenda: fica pronto em até ${dias}`;
}

/** Dias só com "sob encomenda", inteiro de 1 a 365 (vazio é válido). */
export function validarPrazo(prazo: PrazoProduto, prazoDias: number | null): string | null {
  if (prazoDias === null) return null;
  if (prazo !== "sob_encomenda") return "O prazo em dias só vale para Sob encomenda.";
  if (!Number.isInteger(prazoDias) || prazoDias < 1 || prazoDias > 365) {
    return "Use um número de dias de 1 a 365.";
  }
  return null;
}

// ---------------------------------------------------------------------
// Vitrine inteira
// ---------------------------------------------------------------------

/** Erros por campo (vazio = tudo certo). Publicar exige WhatsApp. */
export function validarVitrine(
  rascunho: RascunhoVitrine,
  opcoes: { publicar: boolean }
): ErrosVitrine {
  const erros: ErrosVitrine = {};

  const erroEndereco = validarEndereco(normalizarEndereco(rascunho.endereco));
  if (erroEndereco) erros.endereco = erroEndereco;
  const erroWhatsapp = validarWhatsapp(rascunho.whatsapp, opcoes.publicar);
  if (erroWhatsapp) erros.whatsapp = erroWhatsapp;
  const erroInstagram = validarInstagram(rascunho.instagram);
  if (erroInstagram) erros.instagram = erroInstagram;
  const erroSobre = validarSobre(rascunho.sobre);
  if (erroSobre) erros.sobre = erroSobre;

  return erros;
}
