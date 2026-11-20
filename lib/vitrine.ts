/* Vitrine pública (Jornada 3, etapa V2; decisões L1–L11).
   Funções puras: sem banco e sem React. As regras seguem as restrições da
   tabela vitrines e das colunas de vitrine de products
   (migration 20261120090000). */

/* Caminho relativo de propósito: o Vitest roda sem o atalho "@/". */
import { formatarMoeda, formatarTelefone } from "./formatar";
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

/** Erros dos campos de vitrine de um produto. */
export interface ErrosVitrineProduto {
  descricao?: string;
  prazo_dias?: string;
}

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

/**
 * WhatsApp para mostrar na tela: "5541999999999" → "(41) 99999-9999".
 * Com 12 ou 13 dígitos começando por 55, tira o 55. Outro tamanho → só os dígitos.
 */
export function formatarWhatsapp(numero: string): string {
  let digitos = normalizarWhatsapp(numero);
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) {
    digitos = digitos.slice(2);
  }
  if (digitos.length === 10 || digitos.length === 11) return formatarTelefone(digitos);
  return digitos;
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

/**
 * Campos de vitrine de um produto. Sem prazo (aula: a tela não manda),
 * os dias não são conferidos. Com "pronta_entrega", os dias são ignorados
 * (o service grava null).
 */
export function validarVitrineProduto(dados: {
  descricao: string;
  prazo?: PrazoProduto;
  prazo_dias: number | null;
}): ErrosVitrineProduto {
  const erros: ErrosVitrineProduto = {};

  const erroDescricao = validarDescricao(dados.descricao.trim());
  if (erroDescricao) erros.descricao = erroDescricao;

  if (dados.prazo === "sob_encomenda") {
    const erroPrazo = validarPrazo("sob_encomenda", dados.prazo_dias);
    if (erroPrazo) erros.prazo_dias = erroPrazo;
  }

  return erros;
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

// ---------------------------------------------------------------------
// Vitrine pública (V5): retorno da função vitrine_publica
// ---------------------------------------------------------------------

/** Um produto como a página pública recebe (sem custos nem ficha). */
export interface ProdutoPublico {
  id: number;
  nome: string;
  tipo: "fisico" | "aula";
  descricao: string | null;
  /** null = "Preço sob consulta". */
  preco: number | null;
  /** null na aula. */
  prazo: PrazoProduto | null;
  prazo_dias: number | null;
}

/** A vitrine publicada, como a página pública recebe. */
export interface VitrinePublica {
  endereco: string;
  nome_atelie: string | null;
  whatsapp: string;
  instagram: string | null;
  sobre: string | null;
  produtos: ProdutoPublico[];
}

export const NOME_RESERVA_VITRINE = "Vitrine do ateliê";

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/** Texto com algo além de espaços → sem espaços nas pontas; o resto → null. */
function textoOuNull(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpo = valor.trim();
  return limpo === "" ? null : limpo;
}

function lerProdutoPublico(dados: unknown): ProdutoPublico | null {
  if (!ehObjeto(dados)) return null;

  const { id, tipo } = dados;
  if (typeof id !== "number" || !Number.isSafeInteger(id)) return null;
  const nome = textoOuNull(dados.nome);
  if (nome === null) return null;
  if (tipo !== "fisico" && tipo !== "aula") return null;

  const preco =
    typeof dados.preco === "number" && Number.isFinite(dados.preco) && dados.preco > 0
      ? dados.preco
      : null;

  let prazo: PrazoProduto | null =
    dados.prazo === "pronta_entrega" || dados.prazo === "sob_encomenda" ? dados.prazo : null;
  let prazoDias =
    typeof dados.prazo_dias === "number" &&
    Number.isInteger(dados.prazo_dias) &&
    dados.prazo_dias >= 1 &&
    dados.prazo_dias <= 365
      ? dados.prazo_dias
      : null;

  if (tipo === "aula") {
    prazo = null;
    prazoDias = null;
  }
  if (prazo !== "sob_encomenda") prazoDias = null;

  return {
    id,
    nome,
    tipo,
    descricao: textoOuNull(dados.descricao),
    preco,
    prazo,
    prazo_dias: prazoDias,
  };
}

/**
 * Confere o que veio da função vitrine_publica, campo a campo.
 * Vitrine inválida → null; produto inválido é descartado. Não muta a entrada.
 */
export function lerVitrinePublica(dados: unknown): VitrinePublica | null {
  if (!ehObjeto(dados)) return null;

  const endereco = textoOuNull(dados.endereco);
  const whatsapp = textoOuNull(dados.whatsapp);
  if (endereco === null || whatsapp === null) return null;

  const produtos = Array.isArray(dados.produtos)
    ? dados.produtos
        .map(lerProdutoPublico)
        .filter((p): p is ProdutoPublico => p !== null)
    : [];

  return {
    endereco,
    nome_atelie: textoOuNull(dados.nome_atelie),
    whatsapp,
    instagram: textoOuNull(dados.instagram),
    sobre: textoOuNull(dados.sobre),
    produtos,
  };
}

/** Nome do ateliê para o título; vazio → "Vitrine do ateliê". */
export function nomeDaVitrine(nome: string | null): string {
  return textoOuNull(nome) ?? NOME_RESERVA_VITRINE;
}

/** Prazo para a página pública; aula ou sem prazo → null (não mostrar). */
export function prazoPublico(produto: ProdutoPublico): string | null {
  if (produto.tipo === "aula" || produto.prazo === null) return null;
  return textoPrazo({ prazo: produto.prazo, prazo_dias: produto.prazo_dias });
}

/** Preço para a página pública: a função já manda null quando é "sob consulta". */
export function precoPublico(produto: ProdutoPublico): string {
  return textoPreco({ preco: produto.preco, mostrar_preco: true });
}
