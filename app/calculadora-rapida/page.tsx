"use client";

import { getProfitLevels } from "@/services/profitLevels.service";
import { getKnowledgeSettings } from "@/services/knowledgeSettings.service";


import {
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import {
  getBusinessMetrics,
} from "@/services/businessMetrics";



export default function CalculadoraRapidaPage() {
  const supabase = createClient();

const [custoMateriais, setCustoMateriais] =
  useState("");

  const [horasProducao, setHorasProducao] =
    useState(0);

const [custoEmbalagem, setCustoEmbalagem] =
  useState("");

const [custosExtras, setCustosExtras] =
  useState("")

  const [complexidade, setComplexidade] =
    useState("3");

   const [nivelTecnico, setNivelTecnico] =
    useState("3");

  const [valorHora, setValorHora] =
    useState(25);
    

    const [businessMetrics, setBusinessMetrics] =
  useState<any>(null);

    const [profitLevels, setProfitLevels] =
  useState<any[]>([]);

const [knowledgeSettings, setKnowledgeSettings] =
  useState<any[]>([]);

  useEffect(() => {
    async function carregarValorHora() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

const [
  metrics,
  knowledge,
  profit,
] = await Promise.all([
  getBusinessMetrics(user.id),
  getKnowledgeSettings(),
  getProfitLevels(),
]);

      if (!metrics) return;

      setBusinessMetrics(metrics);
      
      setKnowledgeSettings(
  knowledge || []
);

setProfitLevels(
  profit || []
);

      setValorHora(
        Number(
          metrics.valor_hora || 25
        )
      );
    }

    carregarValorHora();
  }, []);

  const custoMateriaisNumber =
  Number(
    custoMateriais.replace(",", ".")
  ) || 0;

const custoEmbalagemNumber =
  Number(
    custoEmbalagem.replace(",", ".")
  ) || 0;

const custosExtrasNumber =
  Number(
    custosExtras.replace(",", ".")
  ) || 0;

const custoMaoDeObra =
  horasProducao * valorHora;

const custoTotal =
  custoMateriaisNumber +
  custoEmbalagemNumber +
  custosExtrasNumber +
  custoMaoDeObra;

const complexityPercentMap: Record<
  number,
  number
> = {
  1: 5,
  2: 10,
  3: 15,
  4: 25,
};

const knowledgePercentMap: Record<
  number,
  number
> = {
  1: 5,
  2: 10,
  3: 15,
  4: 20,
};

const demandPercentMap: Record<
  number,
  number
> = {
  1: 0,
  2: 5,
  3: 10,
  4: 15,
};

const recognitionPercentMap: Record<
  number,
  number
> = {
  1: 5,
  2: 10,
  3: 20,
  4: 30,
};

const complexityPercent =
  complexityPercentMap[
    Number(complexidade)
  ] || 0;

const knowledgePercent =
  knowledgePercentMap[
    Number(nivelTecnico)
  ] || 0;

const demandPercent =
  demandPercentMap[
    Number(
      businessMetrics?.nivel_demanda || 1
    )
  ] || 0;

const recognitionPercent =
  recognitionPercentMap[
    Number(
      businessMetrics?.nivel_marca || 1
    )
  ] || 0;

const officialMargin =
  complexityPercent +
  knowledgePercent +
  demandPercent +
  recognitionPercent;

const premiumPrice =
  custoTotal *
  (1 + officialMargin / 100);

const recommendedPrice =
  custoTotal *
  (1 +
    officialMargin *
      0.9 /
      100);

const minimumPrice =
  custoTotal *
  (1 +
    officialMargin *
      0.8 /
      100);

const premiumProfit =
  premiumPrice - custoTotal;

const recommendedProfit =
  recommendedPrice -
  custoTotal;

const minimumProfit =
  minimumPrice - custoTotal;

  const valorizacaoTotal =
  custoMaoDeObra +
  premiumProfit;

const premiumMargin =
  premiumPrice > 0
    ? (premiumProfit /
        premiumPrice) *
      100
    : 0;

const recommendedMargin =
  recommendedPrice > 0
    ? (recommendedProfit /
        recommendedPrice) *
      100
    : 0;

const minimumMargin =
  minimumPrice > 0
    ? (minimumProfit /
        minimumPrice) *
      100
    : 0;

    console.log({
  custoTotal,
  minimumPrice,
  recommendedPrice,
  premiumPrice,
});

function limparCalculadora() {
  setCustoMateriais("");
  setHorasProducao(0);
  setCustoEmbalagem("");
  setCustosExtras("");

  setComplexidade("3");
  setNivelTecnico("3");
}

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-5xl font-black text-slate-900">
          Calculadora Rápida
        </h1>

        <p className="mt-3 text-xl text-slate-500">
          Descubra o preço ideal da peça em segundos.
        </p>

<div className="mt-4 flex flex-wrap items-center gap-3">

  <div className="inline-flex items-center rounded-xl bg-blue-50 px-4 py-2 border border-blue-200">
    <span className="text-sm font-medium text-blue-700">
      Valor Hora:
    </span>

    <span className="ml-2 font-bold text-blue-900">
      R$ {valorHora.toFixed(2)}
    </span>
  </div>

  <div className="inline-flex items-center rounded-xl bg-violet-50 px-4 py-2 border border-violet-200">
    <span className="text-sm font-medium text-violet-700">
      Margem Oficial:
    </span>

    <span className="ml-2 font-bold text-violet-900">
      {officialMargin}%
    </span>
  </div>

</div>
<p className="mt-2 text-sm text-slate-500">
  Utilize ponto para centavos. Ex: 260.50
</p>
      </div>



      <div className="max-w-4xl rounded-3xl bg-white p-8 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Custo dos Materiais
            </label>

<input
  type="text"
  inputMode="decimal"
  value={custoMateriais}
  onChange={(e) =>
    setCustoMateriais(
      e.target.value
    )
  }
  className="
    w-full
    rounded-xl
    border
    p-4
    text-xl
    font-semibold
  "
  placeholder="Ex: 260,50"
/>
          </div>
<div>
  <label className="mb-2 block text-sm font-medium">
    Horas de Produção
  </label>

  <input
    type="text"
    inputMode="decimal"
    value={
      horasProducao === 0
        ? ""
        : horasProducao
    }
    onChange={(e) => {
      const valor =
        e.target.value.replace(
          ",",
          "."
        );

      setHorasProducao(
        Number(valor) || 0
      );
    }}
    className="w-full rounded-xl border p-3"
    placeholder="Ex: 4"
  />
</div>

<div>
  <label className="mb-2 block text-sm font-medium">
    Custo da Embalagem
  </label>

<input
  type="text"
  inputMode="decimal"
  value={custoEmbalagem}
  onChange={(e) =>
    setCustoEmbalagem(
      e.target.value
    )
  }
  className="w-full rounded-xl border p-3"
  placeholder="Ex: 15,50"
/>
</div>

<div>
  <label className="mb-2 block text-sm font-medium">
    Custos Extras
  </label>

 <input
  type="text"
  inputMode="decimal"
  value={custosExtras}
  onChange={(e) =>
    setCustosExtras(
      e.target.value
    )
  }
  className="w-full rounded-xl border p-3"
  placeholder="Ex: 10,00"
/>
</div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Complexidade
            </label>

            <select
              value={complexidade}
              onChange={(e) =>
                setComplexidade(
                  e.target.value
                )
              }
              className="w-full rounded-xl border p-3"
            >
<option value="1">
  1 - Simples
</option>

<option value="2">
  2 - Básico
</option>

<option value="3">
  3 - Avançado
</option>

<option value="4">
  4 - Complexo
</option>
            </select>
          </div>

           <div>
  <label className="mb-2 block text-sm font-medium">
    Conhecimento
  </label>

  <select
    value={nivelTecnico}
    onChange={(e) =>
      setNivelTecnico(
        e.target.value
      )
    }
    className="w-full rounded-xl border p-3"
  >
    <option value="1">
      1 - Iniciante
    </option>

    <option value="2">
      2 - Desenvolvimento
    </option>

    <option value="3">
      3 - Atuante
    </option>

    <option value="4">
      4 - Especialista
    </option>
  </select>
</div>

        </div>

</div>

<div className="mt-6 flex gap-3">
  <button
    onClick={limparCalculadora}
    className="
      rounded-xl
      bg-slate-200
      px-5
      py-3
      font-semibold
      text-slate-700
      hover:bg-slate-300
    "
  >
    Limpar
  </button>
</div>

<div className="mt-8 grid gap-4 md:grid-cols-3">

  <div className="rounded-2xl bg-blue-100 p-6">
    <p className="text-sm text-blue-700">
      Mão de Obra
    </p>

    <h3 className="mt-2 text-3xl font-bold text-blue-900">
      R$ {custoMaoDeObra.toFixed(2)}
    </h3>
  </div>

  <div className="rounded-2xl bg-green-100 p-6">
    <p className="text-sm text-green-700">
      Lucro Premium
    </p>

    <h3 className="mt-2 text-3xl font-bold text-green-900">
      R$ {premiumProfit.toFixed(2)}
    </h3>
  </div>

  <div className="rounded-2xl bg-violet-100 p-6">
    <p className="text-sm text-violet-700">
      Valorização Total
    </p>

    <h3 className="mt-2 text-3xl font-bold text-violet-900">
      R$ {valorizacaoTotal.toFixed(2)}
    </h3>
  </div>

</div>

<div className="mt-8 grid gap-4 md:grid-cols-3">

  <div className="rounded-2xl bg-slate-100 p-6">
    <p className="text-sm text-slate-500">
      Preço Mínimo
    </p>

    <h3 className="mt-2 text-3xl font-bold text-slate-900">
      R$ {minimumPrice.toFixed(2)}
    </h3>

    <p className="mt-2 text-sm text-green-700">
      Lucro: R$ {minimumProfit.toFixed(2)}
    </p>

    <p className="text-sm text-slate-500">
      Margem: {minimumMargin.toFixed(1)}%
    </p>
  </div>

  <div className="rounded-2xl bg-slate-100 p-6">
    <p className="text-sm text-slate-600">
      Preço Recomendado
    </p>

    <h3 className="mt-2 text-3xl font-bold text-slate-900">
      R$ {recommendedPrice.toFixed(2)}
    </h3>

    <p className="mt-2 text-sm text-green-700">
      Lucro: R$ {recommendedProfit.toFixed(2)}
    </p>

    <p className="text-sm text-slate-500">
      Margem: {recommendedMargin.toFixed(1)}%
    </p>
  </div>

  <div className="rounded-2xl bg-emerald-100 p-6">
    <p className="text-sm text-emerald-700">
      ⭐ Preço Premium
    </p>

    <h3 className="mt-2 text-3xl font-bold text-emerald-900">
      R$ {premiumPrice.toFixed(2)}
    </h3>

    <p className="mt-2 text-sm text-green-800">
      Lucro: R$ {premiumProfit.toFixed(2)}
    </p>

    <p className="text-sm text-emerald-700">
      Margem: {premiumMargin.toFixed(1)}%
    </p>
  </div>

</div>
                  </main>
  );
}