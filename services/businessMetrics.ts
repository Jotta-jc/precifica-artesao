import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function getBusinessMetrics(
  userId: string
) {
  const { data, error } =
    await supabase
      .from("business_metrics")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .single();

  if (error) {
    console.log(error);

    return null;
  }

  return data;
}

type UpdateBusinessMetricsParams = {
  userId: string;

  nome_empresa: string;

  nivel_demanda: number;

  nivel_marca: number;

  meta_faturamento: number;

  dias_trabalhados: number;

  horas_por_dia: number;

  valor_hora: number;
};

export async function updateBusinessMetrics({
  userId,

  nome_empresa,

  nivel_demanda,

  nivel_marca,

  meta_faturamento,

  dias_trabalhados,

  horas_por_dia,

  valor_hora,
}: UpdateBusinessMetricsParams) {
  /* =========================
     VERIFICA EXISTENTE
  ========================== */

  const { data: existing } =
    await supabase
      .from("business_metrics")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  /* =========================
     UPDATE
  ========================== */

  if (existing) {
    const { data, error } =
      await supabase
        .from("business_metrics")
        .update({
          nome_empresa,

          nivel_demanda,

          nivel_marca,

          meta_faturamento,

          dias_trabalhados,

          horas_por_dia,

          valor_hora,
        })
        .eq("id", existing.id)
        .select()
        .single();

    if (error) {
      console.log(error);

      throw error;
    }

    return data;
  }

  /* =========================
     INSERT
  ========================== */

  const { data, error } =
    await supabase
      .from("business_metrics")
      .insert({
        user_id: userId,

        nome_empresa,

        nivel_demanda,

        nivel_marca,

        meta_faturamento,

        dias_trabalhados,

        horas_por_dia,

        valor_hora,
      })
      .select()
      .single();

  if (error) {
    console.log(error);

    throw error;
  }

  return data;
}