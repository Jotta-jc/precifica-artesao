import { createClient } from "@/lib/supabase/client";
import {
  normalizarEndereco,
  normalizarInstagram,
  normalizarWhatsapp,
  validarVitrine,
  type ErrosVitrine,
  type RascunhoVitrine,
  type Vitrine,
} from "@/lib/vitrine";

/* Vitrine pública do ateliê (tabela vitrines, uma por conta).
   Em caso de erro, as funções lançam o erro do Supabase ou um ErroVitrine
   (com code próprio, em letras). A mensagem para a usuária vem de
   mensagemErroVitrine(). */

const supabase = createClient();

const COLUNAS =
  "id, user_id, endereco, publicada, whatsapp, instagram, sobre, created_at, updated_at";

// ---------------------------------------------------------------------
// Erros
// ---------------------------------------------------------------------

export type CodigoErroVitrine =
  | "DADOS_INVALIDOS"
  | "ENDERECO_EM_USO"
  | "REGRA_DO_BANCO"
  | "VITRINE_NAO_ENCONTRADA";

/** Erro próprio do service. Usa "code", como o erro do Supabase. Em
    DADOS_INVALIDOS, traz os erros por campo para a tela mostrar. */
export class ErroVitrine extends Error {
  readonly code: CodigoErroVitrine;
  readonly erros?: ErrosVitrine;

  constructor(code: CodigoErroVitrine, erros?: ErrosVitrine) {
    super(code);
    this.name = "ErroVitrine";
    this.code = code;
    this.erros = erros;
  }
}

/** Mensagens simples. 23505 = endereço repetido; 23514 = regra do banco. */
export const MENSAGENS_ERRO_VITRINE: Record<string, string> = {
  ENDERECO_EM_USO: "Esse endereço já está em uso. Escolha outro.",
  "23505": "Esse endereço já está em uso. Escolha outro.",
  REGRA_DO_BANCO: "Não foi possível salvar. Confira os campos da vitrine.",
  "23514": "Não foi possível salvar. Confira os campos da vitrine.",
  VITRINE_NAO_ENCONTRADA: "Sua vitrine ainda não foi salva.",
  DADOS_INVALIDOS: "Confira os campos marcados.",
};

function codigoDoErro(erro: unknown): string | undefined {
  if (typeof erro === "object" && erro !== null && "code" in erro) {
    return String((erro as { code: unknown }).code);
  }
  return undefined;
}

/** Mensagem simples para qualquer erro (nunca o texto técnico do banco). */
export function mensagemErroVitrine(erro: unknown): string {
  const codigo = codigoDoErro(erro);
  return (
    (codigo ? MENSAGENS_ERRO_VITRINE[codigo] : undefined) ??
    "Não foi possível salvar a vitrine. Tente de novo."
  );
}

// ---------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------

async function usuariaLogada() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Usuário não autenticado");

  return user;
}

/** Texto sem espaços nas pontas; vazio vira null (nunca ""). */
function ouNulo(texto: string): string | null {
  const limpo = texto.trim();
  return limpo === "" ? null : limpo;
}

// ---------------------------------------------------------------------
// Vitrine
// ---------------------------------------------------------------------

/** A vitrine da usuária logada, ou null se ela ainda não salvou. */
export async function buscarMinhaVitrine(): Promise<Vitrine | null> {
  const user = await usuariaLogada();

  const { data, error } = await supabase
    .from("vitrines")
    .select(COLUNAS)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  return (data as Vitrine | null) ?? null;
}

/**
 * Cria ou atualiza a vitrine (upsert em user_id: a primeira gravação cria).
 * Grava o endereço normalizado, o WhatsApp só com dígitos, o Instagram sem
 * link nem "@" e campos vazios como null. created_at nunca é enviado.
 */
export async function salvarVitrine(
  rascunho: RascunhoVitrine,
  opcoes: { publicar: boolean }
): Promise<Vitrine> {
  const erros = validarVitrine(rascunho, opcoes);
  if (Object.keys(erros).length > 0) throw new ErroVitrine("DADOS_INVALIDOS", erros);

  const user = await usuariaLogada();

  const { data, error } = await supabase
    .from("vitrines")
    .upsert(
      {
        user_id: user.id,
        endereco: normalizarEndereco(rascunho.endereco),
        whatsapp: ouNulo(normalizarWhatsapp(rascunho.whatsapp)),
        instagram: ouNulo(normalizarInstagram(rascunho.instagram)),
        sobre: ouNulo(rascunho.sobre),
        publicada: opcoes.publicar,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select(COLUNAS)
    .single();

  if (error) {
    const codigo = codigoDoErro(error);
    if (codigo === "23505") throw new ErroVitrine("ENDERECO_EM_USO");
    if (codigo === "23514") throw new ErroVitrine("REGRA_DO_BANCO");
    throw error;
  }

  return data as Vitrine;
}

/** Esconde a vitrine (publicada = false). Os dados continuam guardados. */
export async function tirarVitrineDoAr(): Promise<Vitrine> {
  const user = await usuariaLogada();

  const { data, error } = await supabase
    .from("vitrines")
    .update({ publicada: false, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select(COLUNAS)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new ErroVitrine("VITRINE_NAO_ENCONTRADA");

  return data as Vitrine;
}
