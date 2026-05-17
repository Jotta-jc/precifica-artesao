import { supabase } from "@/lib/supabase";

export async function getBusinessMetrics(
  userId: string
) {
  const { data, error } =
    await supabase
      .from("business_metrics")
      .select("*")
      .eq("user_id", userId)
      .single();

  if (error) {
    console.log(error);

    return null;
  }

  return data;
}

type UpdateBusinessMetricsParams = {
  userId: string;

  nivel_demanda: number;

  nivel_marca: number;

  instagram_seguidores: number;

  tiktok_seguidores: number;
};

export async function updateBusinessMetrics({
  userId,
  nivel_demanda,
  nivel_marca,
  instagram_seguidores,
  tiktok_seguidores,
}: UpdateBusinessMetricsParams) {
  const score_geral =
    (nivel_demanda +
      nivel_marca) *
    10;

  const { data, error } =
    await supabase
      .from("business_metrics")
      .upsert({
        user_id: userId,

        nivel_demanda,

        nivel_marca,

        instagram_seguidores,

        tiktok_seguidores,

        score_geral,
      })
      .select()
      .single();

  if (error) {
    console.log(error);

    throw error;
  }

  return data;
}