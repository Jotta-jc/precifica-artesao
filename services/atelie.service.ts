import { calcularValorHora, type NivelMarca } from "@/lib/precificacao";
import { createClient } from "@/lib/supabase/client";

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
}

const COLUNAS =
  "nome_empresa, meta_faturamento, custos_fixos_mensais, dias_trabalhados, horas_por_dia, taxas_venda, margem_minima, margem_ideal, marca_nivel, marca_fator";

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
  dados: ConfiguracoesAtelie
): Promise<void> {
  const user = await usuariaLogada();

  const valorHora = calcularValorHora({
    metaMensal: dados.meta_faturamento,
    custosFixosMensais: dados.custos_fixos_mensais,
    horasPorMes: dados.dias_trabalhados * dados.horas_por_dia,
  });

  const { error } = await supabase
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
    .eq("user_id", user.id);

  if (error) throw error;
}
