import type { TipoMovimento } from "@/lib/estoque";
import type { UnidadeUso } from "@/lib/materiais";
import { createClient } from "@/lib/supabase/client";

/* Em caso de erro, as funções lançam o próprio erro do Supabase.
   Os erros da função do banco vêm na mensagem (ex.: "ESTOQUE_INSUFICIENTE");
   a tela traduz com lib/estoque.ts. */

const supabase = createClient();

export interface Movimento {
  id: number;
  material_id: number;
  tipo: TipoMovimento;
  /** Compra e uso: quantidade movida; correção: a diferença (+ ou −). */
  quantidade: number;
  valor_unitario: number | null;
  valor_total: number | null;
  observacao: string | null;
  created_at: string | null;
  materials: { nome: string; unidade_uso: UnidadeUso } | null;
}

/**
 * Registra compra, uso ou correção numa operação só (função do banco).
 * - entrada: quantidade = nº de embalagens; valorTotal = valor pago;
 * - saida: quantidade na unidade de uso;
 * - ajuste: quantidade = o que a artesã contou agora.
 * Devolve o novo estoque.
 */
export async function registrarMovimento(
  materialId: number,
  tipo: TipoMovimento,
  quantidade: number,
  valorTotal?: number | null,
  observacao?: string
): Promise<number> {
  const { data, error } = await supabase.rpc("registrar_movimentacao_estoque", {
    p_material_id: materialId,
    p_tipo: tipo,
    p_quantidade: quantidade,
    p_valor_total: valorTotal ?? null,
    p_observacao: observacao?.trim() || null,
  });

  if (error) throw error;

  return Number(data);
}

/** Últimos 50 movimentos (de um material ou de todos), mais recentes primeiro. */
export async function listarMovimentos(
  materialId?: number
): Promise<Movimento[]> {
  let consulta = supabase
    .from("material_movements")
    .select(
      "id, material_id, tipo, quantidade, valor_unitario, valor_total, observacao, created_at, materials(nome, unidade_uso)"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (materialId) consulta = consulta.eq("material_id", materialId);

  const { data, error } = await consulta;

  if (error) throw error;

  return (data ?? []) as unknown as Movimento[];
}
