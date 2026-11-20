/* Fotos dos produtos e logo do ateliê (V6b; decisões Q1–Q8). Só navegador.
   Ordem de toda troca: subir o arquivo novo (nome novo a cada envio) →
   gravar o caminho novo na linha → só então apagar o arquivo antigo.
   Falha ao gravar: apaga o arquivo novo. Falha ao apagar o antigo: só vai
   para o log (com code e message), a troca já valeu. */

import {
  BUCKET_VITRINE,
  caminhoFotoProduto,
  caminhoLogo,
  ErroFoto,
  LADO_MAXIMO_FOTO,
  LADO_MAXIMO_LOGO,
  type CodigoErroFoto,
} from "@/lib/imagens";
import { reduzirImagem } from "@/lib/reduzirImagem";
import { createClient } from "@/lib/supabase/client";

export { ErroFoto, type CodigoErroFoto };

const supabase = createClient();

// ---------------------------------------------------------------------
// Erros
// ---------------------------------------------------------------------

export const MENSAGENS_ERRO_FOTO: Record<CodigoErroFoto, string> = {
  NAO_E_IMAGEM: "Escolha um arquivo de foto.",
  NAO_ABRIU: "Essa foto não abriu. Escolha outra ou tire uma nova pela câmera.",
  MUITO_GRANDE: "Essa foto ficou grande demais. Escolha outra.",
  SESSAO_EXPIRADA: "Sua sessão expirou. Entre novamente para enviar a foto.",
  ENVIO_FALHOU: "Não foi possível enviar a foto. Confira a internet e tente de novo.",
  PRODUTO_NAO_ENCONTRADO: "Produto não encontrado.",
};

/** Mensagem simples; qualquer erro que não seja ErroFoto vira ENVIO_FALHOU. */
export function mensagemErroFoto(erro: unknown): string {
  return erro instanceof ErroFoto
    ? MENSAGENS_ERRO_FOTO[erro.code]
    : MENSAGENS_ERRO_FOTO.ENVIO_FALHOU;
}

// ---------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------

/** Só code e message no log (nunca o erro inteiro). */
function registrar(onde: string, erro: unknown) {
  const { code, message } = (typeof erro === "object" && erro !== null ? erro : {}) as {
    code?: unknown;
    message?: unknown;
  };
  console.error(`fotos: ${onde}`, code ?? "", message ?? "");
}

async function idDaUsuaria(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new ErroFoto("SESSAO_EXPIRADA");

  return user.id;
}

/** Apaga um arquivo do bucket. Falha só vai para o log. */
export async function apagarArquivoDaVitrine(caminho: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from(BUCKET_VITRINE).remove([caminho]);
    if (error) registrar("não apagou o arquivo", error);
  } catch (erro) {
    registrar("não apagou o arquivo", erro);
  }
}

/**
 * Sobe o arquivo novo, grava o caminho e só então apaga o antigo.
 * gravar() devolve false quando a linha não foi encontrada (RLS não dá erro).
 */
async function trocarArquivo({
  caminhoNovo,
  arquivo,
  caminhoAntigo,
  gravar,
  erroSemLinha,
}: {
  caminhoNovo: string;
  arquivo: Blob;
  caminhoAntigo: string | null;
  gravar: (caminho: string) => Promise<boolean>;
  erroSemLinha: CodigoErroFoto;
}): Promise<string> {
  const { error: erroEnvio } = await supabase.storage
    .from(BUCKET_VITRINE)
    .upload(caminhoNovo, arquivo, {
      contentType: "image/jpeg",
      upsert: false,
      cacheControl: "31536000",
    });

  if (erroEnvio) {
    registrar("não enviou o arquivo", erroEnvio);
    throw new ErroFoto("ENVIO_FALHOU");
  }

  let gravou: boolean;
  try {
    gravou = await gravar(caminhoNovo);
  } catch (erro) {
    registrar("não gravou o caminho", erro);
    await apagarArquivoDaVitrine(caminhoNovo);
    throw new ErroFoto("ENVIO_FALHOU");
  }

  if (!gravou) {
    await apagarArquivoDaVitrine(caminhoNovo);
    throw new ErroFoto(erroSemLinha);
  }

  if (caminhoAntigo && caminhoAntigo !== caminhoNovo) {
    await apagarArquivoDaVitrine(caminhoAntigo);
  }

  return caminhoNovo;
}

// ---------------------------------------------------------------------
// Foto do produto
// ---------------------------------------------------------------------

async function lerFotoDoProduto(produtoId: number): Promise<{ id: number; foto: string | null }> {
  const { data, error } = await supabase
    .from("products")
    .select("id, foto")
    .eq("id", produtoId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new ErroFoto("PRODUTO_NAO_ENCONTRADO");

  return { id: Number(data.id), foto: (data.foto as string | null) ?? null };
}

/** Reduz, envia e grava a foto do produto. Devolve o caminho novo. */
export async function enviarFotoProduto(produtoId: number, arquivo: File): Promise<string> {
  const userId = await idDaUsuaria();
  const produto = await lerFotoDoProduto(produtoId);
  const reduzida = await reduzirImagem(arquivo, LADO_MAXIMO_FOTO);

  return trocarArquivo({
    caminhoNovo: caminhoFotoProduto(userId, produto.id, Date.now()),
    arquivo: reduzida,
    caminhoAntigo: produto.foto,
    erroSemLinha: "PRODUTO_NAO_ENCONTRADO",
    gravar: async (caminho) => {
      const { data, error } = await supabase
        .from("products")
        .update({ foto: caminho })
        .eq("id", produto.id)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      return data !== null;
    },
  });
}

/** Tira a foto do produto: grava null e depois apaga o arquivo. */
export async function removerFotoProduto(produtoId: number): Promise<void> {
  await idDaUsuaria();
  const produto = await lerFotoDoProduto(produtoId);
  if (!produto.foto) return;

  const { data, error } = await supabase
    .from("products")
    .update({ foto: null })
    .eq("id", produto.id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new ErroFoto("PRODUTO_NAO_ENCONTRADO");

  await apagarArquivoDaVitrine(produto.foto);
}

// ---------------------------------------------------------------------
// Logo do ateliê (business_metrics, uma linha por conta)
// ---------------------------------------------------------------------

async function lerLogo(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("business_metrics")
    .select("logo")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  /* A linha é criada ao abrir Dados do ateliê; sem ela, não há onde gravar. */
  if (!data) throw new ErroFoto("ENVIO_FALHOU");

  return (data.logo as string | null) ?? null;
}

/** Reduz, envia e grava o logo do ateliê. Devolve o caminho novo. */
export async function enviarLogo(arquivo: File): Promise<string> {
  const userId = await idDaUsuaria();
  const logoAntigo = await lerLogo(userId);
  const reduzido = await reduzirImagem(arquivo, LADO_MAXIMO_LOGO);

  return trocarArquivo({
    caminhoNovo: caminhoLogo(userId, Date.now()),
    arquivo: reduzido,
    caminhoAntigo: logoAntigo,
    erroSemLinha: "ENVIO_FALHOU",
    gravar: async (caminho) => {
      const { data, error } = await supabase
        .from("business_metrics")
        .update({ logo: caminho })
        .eq("user_id", userId)
        .select("user_id")
        .maybeSingle();

      if (error) throw error;
      return data !== null;
    },
  });
}

/** Tira o logo: grava null e depois apaga o arquivo. */
export async function removerLogo(): Promise<void> {
  const userId = await idDaUsuaria();
  const logoAntigo = await lerLogo(userId);
  if (!logoAntigo) return;

  const { data, error } = await supabase
    .from("business_metrics")
    .update({ logo: null })
    .eq("user_id", userId)
    .select("user_id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new ErroFoto("ENVIO_FALHOU");

  await apagarArquivoDaVitrine(logoAntigo);
}
