import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function getKnowledgeSettings() {
  const { data, error } =
    await supabase
      .from("knowledge_settings")
      .select("*")
      .eq("active", true)
      .order("points");

  if (error) {
    console.error(error);

    return [];
  }

  return data;
}