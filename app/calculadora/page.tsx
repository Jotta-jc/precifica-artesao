"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { getKnowledgeSettings } from "@/services/knowledgeSettings.service";
import { getProfitLevels } from "@/services/profitLevels.service";
import { getBusinessMetrics } from "@/services/businessMetrics";

export default function CalculadoraPage() {
  const supabase = createClient();

  const [
  selectedComplexity,
  setSelectedComplexity,
] = useState(0);

const [
  selectedKnowledge,
  setSelectedKnowledge,
] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [knowledgeSettings, setKnowledgeSettings] =
    useState<any[]>([]);

  const [profitLevels, setProfitLevels] =
    useState<any[]>([]);

  const [businessMetrics, setBusinessMetrics] =
    useState<any>(null);

  const [products, setProducts] =
    useState<any[]>([]);

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState("");

  const [materialsCost, setMaterialsCost] =
    useState(0);

const [packagingCost, setPackagingCost] =
  useState(0);

const [extraCost, setExtraCost] =
  useState(0);

const [productionHours, setProductionHours] =
  useState(0);


  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      carregarProduto();
    }
  }, [selectedProductId]);

  async function carregarDados() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [
        knowledge,
        profit,
        metrics,
        productsResponse,
      ] = await Promise.all([
        getKnowledgeSettings(),
        getProfitLevels(),
        getBusinessMetrics(user.id),

        supabase
          .from("products")
          .select(
            "id,nome,tempo_producao"
          )
          .order("nome"),
      ]);

      setKnowledgeSettings(
        knowledge || []
      );

      setProfitLevels(
        profit || []
      );

      setBusinessMetrics(metrics);

      setProducts(
        productsResponse.data || []
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function carregarProduto() {
    try {
      const { data: product } =
        await supabase
          .from("products")
          .select("*")
          .eq(
            "id",
            Number(selectedProductId)
          )
          .single();

if (product) {
  setProductionHours(
    Number(
      product.tempo_producao || 0
    )
  );

  setPackagingCost(
    Number(
      product.embalagem || 0
    )
  );

  setExtraCost(
    Number(
      product.custos_extras || 0
    )
  );
}

      setSelectedComplexity(
  Number(
    product.complexidade || 1
  )
);

setSelectedKnowledge(
  Number(
    product.nivel_tecnico || 1
  )
);

console.log(
  "COMPLEXIDADE",
  product.complexidade
);

console.log(
  "NIVEL_TECNICO",
  product.nivel_tecnico
);

      const { data: materials } =
        await supabase
          .from("product_materials")
          .select("custo_total")
          .eq(
            "product_id",
            Number(selectedProductId)
          );

      const totalMaterials =
        (materials || []).reduce(
          (acc, item) =>
            acc +
            Number(
              item.custo_total || 0
            ),
          0
        );

        setMaterialsCost(
        totalMaterials
      );
    } catch (error) {
      console.log(error);
    }
  }

  /* =========================
     CUSTOS
  ========================== */

  const laborCost =
    productionHours *
    Number(
      businessMetrics?.valor_hora || 0
    );

const totalCost =
  materialsCost +
  laborCost +
  packagingCost +
  extraCost 

 /* =========================
   COMPLEXIDADE
========================== */

const complexityScoreMap: Record<
  number,
  number
> = {
  1: 5,
  2: 10,
  3: 15,
  4: 25,
};

const knowledgeScoreMap: Record<
  number,
  number
> = {
  1: 5,
  2: 10,
  3: 15,
  4: 20,
};

/* =========================
   DEMANDA
========================== */

const demandScoreMap: Record<
  number,
  number
> = {
   1: 0,
  2: 5,
  3: 10,
  4: 15,
};

const recognitionScoreMap: Record<
  number,
  number
> = {
   1: 5,
  2: 10,
  3: 20,
  4: 30,
};

const complexityScore =
  complexityScoreMap[
    selectedComplexity
  ] || 0;

const knowledgeScore =
  knowledgeScoreMap[
    selectedKnowledge
  ] || 0;

const demandScore =
  demandScoreMap[
    Number(
      businessMetrics?.nivel_demanda
    )
  ] || 0;

const recognitionScore =
  recognitionScoreMap[
    Number(
      businessMetrics?.nivel_marca
    )
  ] || 0;

const totalScore =
  complexityScore +
  knowledgeScore +
  demandScore +
  recognitionScore;

  /* =========================
   MARGEM OFICIAL
========================== */

const officialMargin =
  complexityScore +
  knowledgeScore +
  demandScore +
  recognitionScore;

/* =========================
   PREÇOS OFICIAIS
========================== */

const premiumPrice =
  totalCost *
  (1 + officialMargin / 100);

const principalPrice =
  totalCost *
  (1 +
    officialMargin *
      0.9 /
      100);

const minimumPrice =
  totalCost *
  (1 +
    officialMargin *
      0.8 /
      100);

const premiumProfit =
  premiumPrice -
  totalCost;

const principalProfit =
  principalPrice -
  totalCost;

const minimumProfit =
  minimumPrice -
  totalCost;

const premiumMargin =
  premiumPrice > 0
    ? (premiumProfit /
        premiumPrice) *
      100
    : 0;

const principalMargin =
  principalPrice > 0
    ? (principalProfit /
        principalPrice) *
      100
    : 0;

const minimumMargin =
  minimumPrice > 0
    ? (minimumProfit /
        minimumPrice) *
      100
    : 0;

    const valorizacaoTotal =
  laborCost +
  premiumProfit;

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-5xl font-black text-slate-900">
          Calculadora Inteligente
        </h1>

        <p className="mt-3 text-xl text-slate-500">
          Metodologia Oficial Precifica+
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">
          Estrutura Oficial
        </h2>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Selecionar Produto
          </label>

          <select
            value={selectedProductId}
            onChange={(e) => {

  setSelectedProductId(
    e.target.value
  );
}}
            className="w-full rounded-2xl border border-slate-300 p-4"
          >
            <option value="">
              Selecione um produto
            </option>

            {products.map(
              (product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.nome}
                </option>
              )
            )}
          </select>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">

  <div className="rounded-2xl bg-blue-100 p-6">
    <p className="text-sm text-blue-700">
      Mão de Obra
    </p>

    <h3 className="mt-2 text-3xl font-bold text-blue-900">
      R$ {laborCost.toFixed(2)}
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

  <div className="rounded-2xl bg-indigo-100 p-6">
    <p className="text-sm text-indigo-700">
      Margem Oficial
    </p>

    <h3 className="mt-2 text-3xl font-bold text-indigo-900">
      {officialMargin}%
    </h3>
  </div>

</div>

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl bg-slate-100 p-4">
            <p className="text-sm text-slate-500">
              Materiais
            </p>

            <strong className="text-3xl">
              R$ {materialsCost.toFixed(2)}
            </strong>
          </div>

          <div className="rounded-2xl bg-slate-100 p-4">
            <p className="text-sm text-slate-500">
              Embalagem
            </p>

            <strong className="text-3xl">
              R$ {packagingCost.toFixed(2)}
            </strong>
          </div>

          <div className="rounded-2xl bg-slate-100 p-4">
            <p className="text-sm text-slate-500">
              Extras
            </p>

            <strong className="text-3xl">
              R$ {extraCost.toFixed(2)}
            </strong>
          </div>
<div className="rounded-2xl bg-emerald-100 p-4">
  <p className="text-sm text-emerald-700">
    Custo Total
  </p>

  <strong className="text-3xl text-emerald-900">
    R$ {totalCost.toFixed(2)}
  </strong>
</div>
        </div>

  <div className="grid gap-4 md:grid-cols-3">

    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
      <p className="text-sm font-semibold text-amber-700">
        Preço Mínimo
      </p>

      <h3 className="mt-2 text-4xl font-black">
        R$ {minimumPrice.toFixed(2)}
      </h3>

      <p className="mt-3 text-green-700 font-medium">
        Lucro: R$ {minimumProfit.toFixed(2)}
              </p>
              <p className="text-sm text-slate-500">
  Margem: {minimumMargin.toFixed(1)}%
</p>
    </div>

    <div className="rounded-3xl border border-slate-300 bg-white p-6">
      <p className="text-sm font-semibold text-slate-600">
        Preço Recomendado
      </p>

      <h3 className="mt-2 text-4xl font-black">
        R$ {principalPrice.toFixed(2)}
      </h3>

      <p className="mt-3 text-green-700 font-medium">
        Lucro: R$ {principalProfit.toFixed(2)}
      </p>
      <p className="text-sm text-slate-500">
  Margem: {principalMargin.toFixed(1)}%
</p>
    </div>

    <div className="rounded-3xl border border-green-300 bg-green-50 p-6">
      <p className="text-sm font-semibold text-green-700">
        ⭐ Preço Premium
      </p>

      <h3 className="mt-2 text-4xl font-black text-green-800">
        R$ {premiumPrice.toFixed(2)}
      </h3>

      <p className="mt-3 text-green-800 font-medium">
        Lucro: R$ {premiumProfit.toFixed(2)}
      </p>
      <p className="text-sm text-green-700">
  Margem: {premiumMargin.toFixed(1)}%
</p>
    </div>

  </div>
        
              </div>
    </main>
  );
}
