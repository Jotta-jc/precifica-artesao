import { caminhoLogoValido } from "@/lib/imagens";
import { calcularValorHora, PADROES_PRECO, type NivelMarca } from "@/lib/precificacao";
import { createClient } from "@/lib/supabase/client";
import { erroFatorMarca } from "@/lib/termometro";

/* Configurações do ateliê (tabela business_metrics, uma linha por usuária).
   Em caso de erro, as funções lançam o próprio erro do Supabase.
   A mensagem para a usuária é montada na tela. */

const supabase = createClient();

export interface ConfiguracoesAtelie {
  nome_empresa: string | null;
  meta_faturamento: number;
  custos_fixos_mensais: number;
  dias_trabalhados: number;
  horas_por_dia: number;
  /** Frações: 0.15 = 15%. */
  taxas_venda: number;
  margem_minima: number;
  margem_ideal: number;
  marca_nivel: NivelMarca;
  marca_fator: number;
  /** Caminho do logo no bucket "vitrine" (migration 20261120200000). Só
      services/fotos.service.ts grava; as funções abaixo nunca o gravam. */
  logo: string | null;
}

const COLUNAS =
  "nome_empresa, meta_faturamento, custos_fixos_mensais, dias_trabalhados, horas_por_dia, taxas_venda, margem_minima, margem_ideal, marca_nivel, marca_fator, logo";

/** Nível antigo (1 a 4), ainda lido pelas telas antigas de preço. */
const NIVEL_MARCA_ANTIGO: Record<NivelMarca, number> = {
  comecando: 1,
  regional: 2,
  reconhecida: 3,
  referencia: 4,
};

async function usuariaLogada() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Usuário não autenticado");

  return user;
}

/** O banco devolve numeric como número ou texto; garante número. */
function normalizar(linha: Record<string, unknown>): ConfiguracoesAtelie {
  return {
    nome_empresa: (linha.nome_empresa as string | null) ?? null,
    meta_faturamento: Number(linha.meta_faturamento ?? 0),
    custos_fixos_mensais: Number(linha.custos_fixos_mensais ?? 0),
    dias_trabalhados: Number(linha.dias_trabalhados ?? 0),
    horas_por_dia: Number(linha.horas_por_dia ?? 0),
    taxas_venda: Number(linha.taxas_venda ?? 0),
    margem_minima: Number(linha.margem_minima ?? 0),
    margem_ideal: Number(linha.margem_ideal ?? 0),
    marca_nivel: (linha.marca_nivel as NivelMarca) ?? "comecando",
    marca_fator: Number(linha.marca_fator ?? 1),
    logo: typeof linha.logo === "string" && caminhoLogoValido(linha.logo) ? linha.logo : null,
  };
}

/** Lê as configurações da usuária; se a linha não existir, cria com os padrões. */
export async function buscarConfiguracoesAtelie(): Promise<ConfiguracoesAtelie> {
  const user = await usuariaLogada();

  const { data, error } = await supabase
    .from("business_metrics")
    .select(COLUNAS)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (data) return normalizar(data as Record<string, unknown>);

  const { data: criada, error: erroCriar } = await supabase
    .from("business_metrics")
    .insert({ user_id: user.id })
    .select(COLUNAS)
    .single();

  if (erroCriar) throw erroCriar;

  return normalizar(criada as Record<string, unknown>);
}

/**
 * Grava as configurações. Por compatibilidade com as telas antigas, grava
 * também valor_hora (calculado pelo motor) e nivel_marca (1 a 4).
 * Erros do motor (ErroPrecificacao) também são lançados.
 */
export async function salvarConfiguracoesAtelie(
  /* Sem o logo: esta função nunca o grava (só fotos.service.ts). */
  dados: Omit<ConfiguracoesAtelie, "logo">
): Promise<void> {
  const user = await usuariaLogada();

  const valorHora = calcularValorHora({
    metaMensal: dados.meta_faturamento,
    custosFixosMensais: dados.custos_fixos_mensais,
    horasPorMes: dados.dias_trabalhados * dados.horas_por_dia,
  });

  const { data, error } = await supabase
    .from("business_metrics")
    .update({
      nome_empresa: dados.nome_empresa,
      meta_faturamento: dados.meta_faturamento,
      custos_fixos_mensais: dados.custos_fixos_mensais,
      dias_trabalhados: dados.dias_trabalhados,
      horas_por_dia: dados.horas_por_dia,
      taxas_venda: dados.taxas_venda,
      margem_minima: dados.margem_minima,
      margem_ideal: dados.margem_ideal,
      marca_nivel: dados.marca_nivel,
      marca_fator: dados.marca_fator,

      /* Colunas antigas, lidas por Preço do produto, Cálculo rápido e Produtos. */
      valor_hora: valorHora,
      nivel_marca: NIVEL_MARCA_ANTIGO[dados.marca_nivel],
    })
    .eq("user_id", user.id)
    .select("user_id")
    .maybeSingle();

  if (error) throw error;
  /* O RLS não dá erro quando nenhuma linha muda: confere se gravou. */
  if (!data) throw new Error("Não foi possível salvar os dados do ateliê. Tente de novo.");
}

/**
 * Grava só o nível da marca (botão "Usar este nível" do termômetro).
 * Mesma regra de Dados do ateliê: escolher um nível usa o fator padrão dele;
 * só Referência aceita fator livre, 2 ou mais (erroFatorMarca). Grava também
 * nivel_marca (1 a 4) por compatibilidade, como salvarConfiguracoesAtelie.
 */
export async function salvarNivelMarca(
  nivel: NivelMarca,
  fator: number | null
): Promise<ConfiguracoesAtelie> {
  const erro = erroFatorMarca(nivel, fator);
  if (erro) throw new Error(erro);

  const user = await usuariaLogada();
  const fatorGravado =
    nivel === "referencia" ? (fator ?? PADROES_PRECO.marca.referencia) : PADROES_PRECO.marca[nivel];

  const { data, error } = await supabase
    .from("business_metrics")
    .update({
      marca_nivel: nivel,
      marca_fator: fatorGravado,
      nivel_marca: NIVEL_MARCA_ANTIGO[nivel],
    })
    .eq("user_id", user.id)
    .select(COLUNAS)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Não foi possível salvar o nível da marca. Tente de novo.");

  return normalizar(data as Record<string, unknown>);
}
