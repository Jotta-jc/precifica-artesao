import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

export async function getPricingSettings(
  userId: string
) {
  const { data, error } =
    await supabase
      .from("pricing_settings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  if (error) {
    console.log(error);

    return null;
  }

  return data;
}

type UpdatePricingSettingsParams = {
  userId: string;

  demand_weight: number;

  brand_weight: number;

  social_weight: number;

  premium_multiplier: number;

  ai_multiplier: number;

  labor_weight: number;

  material_weight: number;

  exclusivity_weight: number;

  urgency_weight: number;
};

export async function updatePricingSettings({
  userId,

  demand_weight,

  brand_weight,

  social_weight,

  premium_multiplier,

  ai_multiplier,

  labor_weight,

  material_weight,

  exclusivity_weight,

  urgency_weight,
}: UpdatePricingSettingsParams) {
  /* =========================
     EXISTENTE
  ========================== */

  const { data: existing } =
    await supabase
      .from("pricing_settings")
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
        .from("pricing_settings")
        .update({
          demand_weight,

          brand_weight,

          social_weight,

          premium_multiplier,

          ai_multiplier,

          labor_weight,

          material_weight,

          exclusivity_weight,

          urgency_weight,
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
      .from("pricing_settings")
      .insert({
        user_id: userId,

        demand_weight,

        brand_weight,

        social_weight,

        premium_multiplier,

        ai_multiplier,

        labor_weight,

        material_weight,

        exclusivity_weight,

        urgency_weight,
      })
      .select()
      .single();

  if (error) {
    console.log(error);

    throw error;
  }

  return data;
}