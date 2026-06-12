import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function getProfitLevels() {
  const { data, error } =
    await supabase
      .from("profit_levels")
      .select("*")
      .eq("active", true)
      .order("pontos_min");

  if (error) {
    console.error(error);

    return [];
  }

  return data;
}