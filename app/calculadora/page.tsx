"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

import {
  getPricingSettings,
} from "@/services/pricingSettings.service";

type Product = {
  id: number;
  nome: string;
};

type ProductMaterial = {
  id: number;
  product_id: number;
  material_id: number;
  quantidade: number;
  custo_total: number;
};

type PricingHistory = {
  id: string;
  product_id: number;

  custo_materiais: number;
  custo_mao_obra: number;

  custo_embalagem: number;
  custos_extras: number;

  margem_lucro: number;

  preco_minimo: number;
  preco_ideal: number;
  preco_premium: number;

  tempo_producao: number;

  products: {
    nome: string;
  };
};

export default function CalculadoraPage() {
  /* =========================
     STATES
  ========================== */

  const [products, setProducts] =
    useState<Product[]>([]);

  const [materials, setMaterials] =
    useState<ProductMaterial[]>([]);

  const [pricingHistory, setPricingHistory] =
    useState<PricingHistory[]>([]);

  const [selectedProduct, setSelectedProduct] =
    useState("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [businessMetrics, setBusinessMetrics] =
    useState<any>(null);

    const [
  pricingSettings,
  setPricingSettings,
] = useState<any>(null);

  /* =========================
     FORM
  ========================== */

  const [finalPrice, setFinalPrice] =
    useState(350);

  const [packagingCost, setPackagingCost] =
    useState(15);

  const [extraCost, setExtraCost] =
    useState(10);

  const [
    productionHours,
    setProductionHours,
  ] = useState(3);

/* =========================
   LOAD
========================== */

useEffect(() => {
  loadProducts();

  loadPricingHistory();

  loadBusinessMetrics();

  loadPricingSettings();
}, []);

async function loadBusinessMetrics() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data, error } =
    await supabase
      .from("business_metrics")
      .select("*")
      .eq("user_id", user.id)
      .single();

  if (error) {
    console.error(error);

    return;
  }

  setBusinessMetrics(data);
}

async function loadPricingSettings() {
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

  setPricingSettings(data);
}

async function loadProducts() {
  const { data, error } =
    await supabase
      .from("products")
      .select("id, nome")
      .order("nome");

  if (error) {
    console.error(error);

    return;
  }

  setProducts(data || []);
}

async function loadPricingHistory() {
  const { data, error } =
    await supabase
      .from("product_pricing")
      .select(`
        *,
        products(nome)
      `)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    console.error(error);

    return;
  }

  setPricingHistory(
    (data as PricingHistory[]) || []
  );
}

  /* =========================
     PRODUCT
  ========================== */

  async function handleSelectProduct(
    productId: string
  ) {
    setSelectedProduct(productId);

    const { data, error } =
      await supabase
        .from("product_materials")
        .select("*")
        .eq(
          "product_id",
          Number(productId)
        );

    if (error) {
      console.error(error);

      return;
    }

    setMaterials(data || []);
  }

  /* =========================
     RESET
  ========================== */

  function resetForm() {
    setEditingId(null);

    setSelectedProduct("");

    setMaterials([]);

    setFinalPrice(350);

    setPackagingCost(15);

    setExtraCost(10);

    setProductionHours(3);
  }

  /* =========================
     CALCULOS
  ========================== */

  const materialsCost = useMemo(() => {
    return materials.reduce(
      (total, item) =>
        total +
        Number(item.custo_total),
      0
    );
  }, [materials]);

  /* =========================
   CONFIG IA
========================== */

const demandWeight =
  Number(
    pricingSettings?.demand_weight ||
      0.08
  );

const brandWeight =
  Number(
    pricingSettings?.brand_weight ||
      0.12
  );

const socialWeight =
  Number(
    pricingSettings?.social_weight ||
      0.03
  );

const premiumMultiplier =
  Number(
    pricingSettings?.premium_multiplier ||
      1.25
  );

const aiMultiplier =
  Number(
    pricingSettings?.ai_multiplier ||
      1.15
  );

const laborWeight =
  Number(
    pricingSettings?.labor_weight ||
      1
  );

const materialWeight =
  Number(
    pricingSettings?.material_weight ||
      1
  );

const exclusivityWeight =
  Number(
    pricingSettings?.exclusivity_weight ||
      1
  );

const urgencyWeight =
  Number(
    pricingSettings?.urgency_weight ||
      1
  );

/* =========================
   CUSTOS
========================== */

const adjustedMaterialCost =
  materialsCost *
  materialWeight;

const laborCost =
  productionHours *
  Number(
    businessMetrics?.valor_hora || 0
  ) *
  laborWeight;

const adjustedLaborCost =
  laborCost;

/* =========================
   PREÇOS BASE
========================== */

const minimumPrice =
  adjustedMaterialCost +
  adjustedLaborCost +
  Number(packagingCost) +
  Number(extraCost);

const idealPrice =
  Number(finalPrice);

const premiumPrice =
  idealPrice *
  premiumMultiplier;

/* =========================
   MARGEM
========================== */

const calculatedMargin =
  minimumPrice > 0
    ? (
        ((idealPrice -
          minimumPrice) /
          minimumPrice) *
        100
      ).toFixed(2)
    : "0";

/* =========================
   BOOSTS IA
========================== */

const demandBoost =
  Number(
    businessMetrics?.nivel_demanda ||
      1
  ) * demandWeight;

const brandBoost =
  Number(
    businessMetrics?.nivel_marca ||
      1
  ) * brandWeight;

const socialBoost =
  Number(
    businessMetrics?.score_artesanal ||
      0
  ) * socialWeight;

const strategicBoost =
  demandBoost +
  brandBoost +
  socialBoost;

/* =========================
   IA ESTRATÉGICA
========================== */

const strategicPrice =
  premiumPrice +
  strategicBoost;

const intelligentPrice =
  strategicPrice *
  aiMultiplier *
  exclusivityWeight *
  urgencyWeight;


  /* =========================
     SAVE
  ========================== */

  async function handleSavePricing() {
    try {
      setLoading(true);

      if (!selectedProduct) {
        alert(
          "Selecione um produto."
        );

        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert(
          "Usuário não autenticado."
        );

        return;
      }

      let error = null;

      if (editingId) {
        const response =
          await supabase
            .from("product_pricing")
            .update({
              product_id: Number(
                selectedProduct
              ),

              custo_materiais:
                materialsCost,

              custo_mao_obra:
                laborCost,

              custo_embalagem:
                packagingCost,

              custos_extras:
                extraCost,

              tempo_producao:
                productionHours,

              margem_lucro:
                Number(
                  calculatedMargin
                ),

              preco_minimo:
                minimumPrice,

              preco_ideal:
                idealPrice,

              preco_premium:
                premiumPrice,
            })
            .eq("id", editingId);

        error = response.error;
      } else {
        const response =
          await supabase
            .from("product_pricing")
            .insert({
              user_id: user.id,

              product_id: Number(
                selectedProduct
              ),

              custo_materiais:
                materialsCost,

              custo_mao_obra:
                laborCost,

              custo_embalagem:
                packagingCost,

              custos_extras:
                extraCost,

              tempo_producao:
                productionHours,

              margem_lucro:
                Number(
                  calculatedMargin
                ),

              preco_minimo:
                minimumPrice,

              preco_ideal:
                idealPrice,

              preco_premium:
                premiumPrice,
            });

        error = response.error;
      }

      if (error) {
        console.error(error);

        alert(
          "Erro ao salvar precificação."
        );

        return;
      }

      alert(
        editingId
          ? "Precificação atualizada!"
          : "Precificação salva!"
      );

      resetForm();

      loadPricingHistory();
    } catch (error) {
      console.error(error);

      alert(
        "Erro inesperado."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     DELETE
  ========================== */

  async function handleDeletePricing(
    id: string
  ) {
    const confirmDelete =
      confirm(
        "Deseja excluir esta precificação?"
      );

    if (!confirmDelete) {
      return;
    }

    const { error } = await supabase
      .from("product_pricing")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);

      alert(
        "Erro ao excluir."
      );

      return;
    }

    alert(
      "Precificação excluída."
    );

    loadPricingHistory();
  }

  /* =========================
     EDIT
  ========================== */

  async function handleEditPricing(
    item: PricingHistory
  ) {
    setEditingId(item.id);

    setSelectedProduct(
      String(item.product_id)
    );

    setFinalPrice(
      Number(item.preco_ideal)
    );

    setPackagingCost(
      Number(item.custo_embalagem)
    );

    setExtraCost(
      Number(item.custos_extras)
    );

    setProductionHours(
      Number(item.tempo_producao || 3)
    );

    await handleSelectProduct(
      String(item.product_id)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1
          className="
            text-5xl
            font-black
            tracking-tight
            text-slate-900
          "
        >
          Calculadora Inteligente
        </h1>

        <p
          className="
            mt-2
            text-lg
            text-slate-500
          "
        >
          Precificação estratégica
          artesanal
        </p>
      </div>

      {/* CARD */}
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
        {/* TITLE */}
        <div className="mb-10">
          <h2
            className="
              text-3xl
              font-bold
              text-slate-900
            "
          >
            {editingId
              ? "Editar Precificação"
              : "Precificação do Produto"}
          </h2>

          <p
            className="
              mt-2
              text-base
              text-slate-500
            "
          >
            Sistema profissional de
            precificação artesanal
          </p>
        </div>

        {/* FORM */}
        <div
          className="
            grid
            gap-6
            md:grid-cols-2
          "
        >
          {/* PRODUTO */}
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
              Produto
            </label>

            <select
              value={selectedProduct}
              onChange={(e) =>
                handleSelectProduct(
                  e.target.value
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

          {/* PREÇO */}
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
              Preço Final Desejado
            </label>

            <input
              type="number"
              value={finalPrice}
              onChange={(e) =>
                setFinalPrice(
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

          {/* EMBALAGEM */}
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
              Custo Embalagem
            </label>

            <input
              type="number"
              value={packagingCost}
              onChange={(e) =>
                setPackagingCost(
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

          {/* EXTRAS */}
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
              Custos Extras
            </label>

            <input
              type="number"
              value={extraCost}
              onChange={(e) =>
                setExtraCost(
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

          {/* TEMPO */}
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
              Tempo Produção (horas)
            </label>

            <input
              type="number"
              value={productionHours}
              onChange={(e) =>
                setProductionHours(
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
        </div>

        {/* RESULTADOS */}
        <div
          className="
            mt-10
            grid
            gap-5
            md:grid-cols-5
          "
        >
          {/* MATERIAL */}
          <div className="rounded-3xl bg-slate-100 p-6">
            <p className="text-sm text-slate-500">
              Materiais
            </p>

            <strong className="mt-3 block text-4xl font-black text-slate-900">
              R$
              {" "}
              {materialsCost.toFixed(2)}
            </strong>
          </div>

          {/* MAO OBRA */}
          <div className="rounded-3xl bg-sky-100 p-6">
            <p className="text-sm text-sky-700">
              Mão de Obra
            </p>

            <strong className="mt-3 block text-4xl font-black text-sky-800">
              R$
              {" "}
              {laborCost.toFixed(2)}
            </strong>
          </div>

          {/* MINIMO */}
          <div className="rounded-3xl bg-slate-100 p-6">
            <p className="text-sm text-slate-500">
              Preço Mínimo
            </p>

            <strong className="mt-3 block text-4xl font-black text-slate-900">
              R$
              {" "}
              {minimumPrice.toFixed(2)}
            </strong>
          </div>

          {/* IDEAL */}
          <div className="rounded-3xl bg-emerald-100 p-6">
            <p className="text-sm text-emerald-700">
              Preço definido
            </p>

            <strong className="mt-3 block text-4xl font-black text-emerald-800">
              R$
              {" "}
              {idealPrice.toFixed(2)}
            </strong>
          </div>

          {/* PREMIUM */}
          <div className="rounded-3xl bg-amber-100 p-6">
            <p className="text-sm text-amber-700">
              Premium
            </p>

            <strong className="mt-3 block text-4xl font-black text-amber-800">
              R$
              {" "}
              {premiumPrice.toFixed(2)}
            </strong>
          </div>
        </div>

        {/* IA */}
        <div
          className="
            mt-5
            rounded-3xl
            bg-violet-100
            p-6
          "
        >
          <p className="text-sm text-violet-700">
            Preço Estratégico IA
          </p>

          <strong className="mt-3 block text-4xl font-black text-violet-800">
            R$
            {" "}
{intelligentPrice.toFixed(2)}
          </strong>

          <p className="mt-2 text-sm text-violet-700">
            Margem:
            {" "}
            {calculatedMargin}%
          </p>
        </div>

        {/* ACTIONS */}
        <div
          className="
            mt-10
            flex
            justify-end
            gap-4
          "
        >
          {editingId && (
            <button
              onClick={resetForm}
              className="
                rounded-2xl
                border
                border-slate-300
                bg-white
                px-8
                py-4
                text-base
                font-bold
                text-slate-700
              "
            >
              Cancelar
            </button>
          )}

          <button
            onClick={
              handleSavePricing
            }
            disabled={loading}
            className="
              rounded-2xl
              bg-slate-950
              px-8
              py-4
              text-base
              font-bold
              text-white
              transition-all

              hover:opacity-90

              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {loading
              ? "Salvando..."
              : editingId
              ? "Atualizar Precificação"
              : "Salvar Precificação"}
          </button>
        </div>
      </div>

      {/* HISTORICO */}
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Histórico
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Últimas precificações
          </p>
        </div>

        <div className="space-y-4">
          {pricingHistory.length ===
            0 && (
            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-slate-300
                p-8
                text-center
              "
            >
              <p className="text-slate-500">
                Nenhuma precificação
                salva.
              </p>
            </div>
          )}

          {pricingHistory.map((item) => (
            <div
              key={item.id}
              className="
                flex
                flex-col
                gap-4
                rounded-2xl
                border
                border-slate-200
                p-5

                md:flex-row
                md:items-center
                md:justify-between
              "
            >
              {/* LEFT */}
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {item.products?.nome}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Lucro:
                  {" "}
                  {Number(
                    item.margem_lucro
                  ).toFixed(0)}
                  %
                </p>
              </div>

              {/* RIGHT */}
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-3
                "
              >
                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    Preço definido
                  </p>

                  <strong className="text-2xl font-black text-emerald-700">
                    R$
                    {" "}
                    {Number(
                      item.preco_ideal
                    ).toFixed(2)}
                  </strong>
                </div>

                <button
                  onClick={() =>
                    handleEditPricing(
                      item
                    )
                  }
                  className="
                    rounded-xl
                    bg-blue-500
                    px-4
                    py-2
                    text-sm
                    font-bold
                    text-white

                    hover:bg-blue-600
                  "
                >
                  Editar
                </button>

                <button
                  onClick={() =>
                    handleDeletePricing(
                      item.id
                    )
                  }
                  className="
                    rounded-xl
                    bg-red-500
                    px-4
                    py-2
                    text-sm
                    font-bold
                    text-white

                    hover:bg-red-600
                  "
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}