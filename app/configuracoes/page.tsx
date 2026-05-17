"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import {
  getPricingSettings,
  updatePricingSettings,
} from "@/services/pricingSettings.service";

export default function ConfiguracoesPage() {
  const [loading, setLoading] =
    useState(false);

  const [
    demandWeight,
    setDemandWeight,
  ] = useState(0.08);

  const [
    brandWeight,
    setBrandWeight,
  ] = useState(0.12);

  const [
    socialWeight,
    setSocialWeight,
  ] = useState(0.03);

  const [
    premiumMultiplier,
    setPremiumMultiplier,
  ] = useState(1.25);

  const [
    aiMultiplier,
    setAiMultiplier,
  ] = useState(1.15);

  const [
    laborWeight,
    setLaborWeight,
  ] = useState(1);

  const [
    materialWeight,
    setMaterialWeight,
  ] = useState(1);

  const [
    exclusivityWeight,
    setExclusivityWeight,
  ] = useState(1);

  const [
    urgencyWeight,
    setUrgencyWeight,
  ] = useState(1);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const data =
      await getPricingSettings(
        user.id
      );

    if (!data) {
      return;
    }

    setDemandWeight(
      Number(data.demand_weight)
    );

    setBrandWeight(
      Number(data.brand_weight)
    );

    setSocialWeight(
      Number(data.social_weight)
    );

    setPremiumMultiplier(
      Number(
        data.premium_multiplier
      )
    );

    setAiMultiplier(
      Number(data.ai_multiplier)
    );

    setLaborWeight(
      Number(data.labor_weight)
    );

    setMaterialWeight(
      Number(data.material_weight)
    );

    setExclusivityWeight(
      Number(
        data.exclusivity_weight
      )
    );

    setUrgencyWeight(
      Number(data.urgency_weight)
    );
  }

  async function handleSave() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert(
          "Usuário não autenticado."
        );

        return;
      }

      await updatePricingSettings({
        userId: user.id,

        demand_weight:
          demandWeight,

        brand_weight:
          brandWeight,

        social_weight:
          socialWeight,

        premium_multiplier:
          premiumMultiplier,

        ai_multiplier:
          aiMultiplier,

        labor_weight:
          laborWeight,

        material_weight:
          materialWeight,

        exclusivity_weight:
          exclusivityWeight,

        urgency_weight:
          urgencyWeight,
      });

      alert(
        "Configurações salvas!"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao salvar."
      );
    } finally {
      setLoading(false);
    }
  }

  function renderInput(
    label: string,
    value: number,
    setValue: (value: number) => void
  ) {
    return (
      <div>
        <label
          className="
            mb-2
            block
            text-sm
            font-semibold
            text-slate-700
          "
        >
          {label}
        </label>

        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) =>
            setValue(
              Number(
                e.target.value
              )
            )
          }
          className="
            h-14
            w-full
            rounded-2xl
            border
            border-slate-300
            bg-white
            px-4
            text-base
            outline-none
          "
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="
            text-5xl
            font-black
            text-slate-900
          "
        >
          Configurações IA
        </h1>

        <p
          className="
            mt-2
            text-lg
            text-slate-500
          "
        >
          Controle total do motor
          de precificação
        </p>
      </div>

      <div
        className="
          rounded-3xl
          border
          border-slate-200
          bg-white
          p-8
          shadow-sm
        "
      >
        <div
          className="
            grid
            gap-6
            md:grid-cols-2
          "
        >
          {renderInput(
            "Peso Demanda",
            demandWeight,
            setDemandWeight
          )}

          {renderInput(
            "Peso Marca",
            brandWeight,
            setBrandWeight
          )}

          {renderInput(
            "Peso Social",
            socialWeight,
            setSocialWeight
          )}

          {renderInput(
            "Multiplicador Premium",
            premiumMultiplier,
            setPremiumMultiplier
          )}

          {renderInput(
            "Multiplicador IA",
            aiMultiplier,
            setAiMultiplier
          )}

          {renderInput(
            "Peso Mão de Obra",
            laborWeight,
            setLaborWeight
          )}

          {renderInput(
            "Peso Materiais",
            materialWeight,
            setMaterialWeight
          )}

          {renderInput(
            "Peso Exclusividade",
            exclusivityWeight,
            setExclusivityWeight
          )}

          {renderInput(
            "Peso Urgência",
            urgencyWeight,
            setUrgencyWeight
          )}
        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="
              rounded-2xl
              bg-slate-950
              px-8
              py-4
              text-base
              font-bold
              text-white
            "
          >
            {loading
              ? "Salvando..."
              : "Salvar Configurações"}
          </button>
        </div>
      </div>
    </div>
  );
}