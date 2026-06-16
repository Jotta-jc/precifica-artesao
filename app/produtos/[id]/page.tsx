"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import { getBusinessMetrics } from "@/services/businessMetrics";

import { ProductPricingCard } from "@/components/products/ProductPricingCard";

import { FinancialMetricsCard } from "@/components/dashboard/FinancialMetricsCard";

import { FinancialEvolutionChart } from "@/components/dashboard/FinancialEvolutionChart";

type Product = {
  id: number;
  nome: string;
  categoria: string;
  preco: number;
  tempo_producao: number;
  valor_hora: number;
  complexidade: number;
  exclusividade: number;
  nivel_tecnico: number;

  embalagem: number;
  custos_extras: number;
};

type Material = {
  id: number;
  nome: string;
  preco: number;

  unidade: string;

  quantidade_comprada: number;

  estoque_atual: number;
};

type ProductMaterial = {
  id: number;
  quantidade: number;
  custo_total: number;
  materials: {
    id: number;
    nome: string;
    preco: number;
  };
};

function InfoItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        rounded-2xl
        border
        p-5
        shadow-sm
        transition-all

        ${
          highlight
            ? "border-green-200 bg-green-50"
            : "border-slate-200 bg-white"
        }
      `}
    >
      <p className="mb-2 text-sm text-slate-500">
        {label}
      </p>

      <h3
        className={`
          text-2xl
          font-bold

          ${
            highlight
              ? "text-green-700"
              : "text-slate-900"
          }
        `}
      >
        {value}
      </h3>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  options: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <label className="mb-3 block text-sm font-semibold text-slate-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(Number(e.target.value))
        }
        className="
          w-full
          rounded-xl
          border
          border-slate-300
          bg-white
          p-3
          outline-none
          transition
          focus:border-green-500
        "
      >
        {options.map((option, index) => (
          <option
            key={option}
            value={index + 1}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ProdutoDetalhePage() {
  const supabase = createClient();
  const params = useParams();

  const productId = params.id;

  const [product, setProduct] =
    useState<Product | null>(null);

    const [embalagem, setEmbalagem] =
  useState(0);

const [custosExtras, setCustosExtras] =
  useState(0);

  const [materials, setMaterials] =
    useState<Material[]>([]);

  const [
    productMaterials,
    setProductMaterials,
  ] = useState<ProductMaterial[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [openModal, setOpenModal] =
    useState(false);

  const [
    selectedMaterialId,
    setSelectedMaterialId,
  ] = useState("");

  const [quantidade, setQuantidade] =
    useState(1);

  const [complexidade, setComplexidade] =
    useState(1);

  const [
    exclusividade,
    setExclusividade,
  ] = useState(1);

  const [
    nivelTecnico,
    setNivelTecnico,
  ] = useState(1);

  const [
    nivelDemanda,
    setNivelDemanda,
  ] = useState(1);

  const [nivelMarca, setNivelMarca] =
  useState(1);
  
const [hourlyRate, setHourlyRate] =
  useState(0);

  const [
    salvandoValorizacao,
    setSalvandoValorizacao,
  ] = useState(false);

  const [salvandoMaterial, setSalvandoMaterial] =
    useState(false);

  async function carregarProduto() {
    const { data, error } =
      await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

    if (error) {
      console.log(error);

      alert(
        "Erro ao carregar produto"
      );

      return;
    }

    setProduct(data);

    setComplexidade(
      data?.complexidade || 1
    );

    setExclusividade(
      data?.exclusividade || 1
    );

    setNivelTecnico(
      data?.nivel_tecnico || 1
    );

    setEmbalagem(
  Number(
    data?.embalagem || 0
  )
);

setCustosExtras(
  Number(
    data?.custos_extras || 0
  )
);
  }

  async function carregarMateriais() {
    const { data, error } =
      await supabase
        .from("materials")
        .select("*")
        .order("id", {
          ascending: false,
        });

    if (error) {
      console.log(error);

      alert(
        "Erro ao carregar materiais"
      );

      return;
    }

    setMaterials(data || []);
  }

  async function carregarMateriaisProduto() {
    const { data, error } =
      await supabase
        .from("product_materials")
        .select(
          `
          *,
materials (
  id,
  nome,
  preco,
  unidade,
  quantidade_comprada,
  estoque_atual
)
        `
        )
        .eq("product_id", productId);

    if (error) {
      console.log(error);

      alert(
        "Erro ao carregar materiais do produto"
      );

      return;
    }

    setProductMaterials(data || []);
  }

  async function carregarDados() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const businessMetrics =
          await getBusinessMetrics(
            user.id
          );

        if (businessMetrics) {
          setNivelDemanda(
            businessMetrics.nivel_demanda ||
              1
          );

          setHourlyRate(
  Number(
    businessMetrics.valor_hora || 0
  )
);
          setNivelMarca(
            businessMetrics.nivel_marca ||
              1
          );
        }
      }

      await Promise.all([
        carregarProduto(),
        carregarMateriais(),
        carregarMateriaisProduto(),
      ]);
    } catch (error) {
      console.log(error);

      alert(
        "Erro ao carregar dados"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

const custoTotalProduto =
  useMemo(() => {
    if (!product) return 0;

    return (
      productMaterials.reduce(
        (acc, item) =>
          acc +
          Number(item.custo_total),
        0
      ) +
      Number(product.embalagem || 0) +
      Number(product.custos_extras || 0)
    );
  }, [
    productMaterials,
    product,
  ]);

const maoDeObra = useMemo(() => {
  if (!product) return 0;

  return (
    Number(
      product.tempo_producao || 0
    ) * hourlyRate
  );
  
}, [
  product,
  hourlyRate,
]);


const complexityPointsMap: Record<
  number,
  number
> = {
  1: 5,
  2: 10,
  3: 15,
  4: 25,
};

const knowledgePointsMap: Record<
  number,
  number
> = {
  1: 5,
  2: 10,
  3: 15,
  4: 20,
};

const demandPointsMap: Record<
  number,
  number
> = {
  1: 0,
  2: 5,
  3: 10,
  4: 15,
};

const recognitionPointsMap: Record<
  number,
  number
> = {
  1: 5,
  2: 10,
  3: 20,
  4: 30,
};

const officialMargin =
  (complexityPointsMap[
    Number(complexidade)
  ] || 0) +
  (knowledgePointsMap[
    Number(nivelTecnico)
  ] || 0) +
  (demandPointsMap[
    Number(nivelDemanda)
  ] || 0) +
  (recognitionPointsMap[
    Number(nivelMarca)
  ] || 0);

const multiplicadorValorizacao =
  useMemo(() => {
    const complexityPoints =
      complexityPointsMap[
        Number(complexidade)
      ] || 0;

    const knowledgePoints =
      knowledgePointsMap[
        Number(nivelTecnico)
      ] || 0;

    const officialMargin =
      complexityPoints +
      knowledgePoints +
      nivelDemanda +
      nivelMarca;

    return (
1 +
officialMargin / 100
    );
    }, [
      complexidade,
            nivelTecnico,
      nivelDemanda,
      nivelMarca,
    ]);

  const precoSugerido =
    useMemo(() => {
      return (
        (custoTotalProduto +
          maoDeObra) *
        multiplicadorValorizacao
      );
    }, [
      custoTotalProduto,
      maoDeObra,
      multiplicadorValorizacao,
    ]);

  const margemLucro =
    useMemo(() => {
      return (
        precoSugerido -
        (custoTotalProduto +
          maoDeObra)
      );
    }, [
      precoSugerido,
      custoTotalProduto,
      maoDeObra,
    ]);

    const premiumPrice =
  (custoTotalProduto + maoDeObra) *
  (1 + officialMargin / 100);

const recommendedPrice =
  (custoTotalProduto + maoDeObra) *
  (1 +
    officialMargin *
      0.9 /
      100);

const minimumPrice =
  (custoTotalProduto + maoDeObra) *
  (1 +
    officialMargin *
      0.8 /
      100);

const premiumProfit =
  premiumPrice -
  (custoTotalProduto + maoDeObra);

const recommendedProfit =
  recommendedPrice -
  (custoTotalProduto + maoDeObra);

const minimumProfit =
  minimumPrice -
  (custoTotalProduto + maoDeObra);

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

const scoreArtesanal =
  useMemo(() => {

const complexityPoints =
  complexityPointsMap[
    Number(complexidade)
  ] || 0;

const knowledgePoints =
  knowledgePointsMap[
    Number(nivelTecnico)
  ] || 0;

const score =
  complexityPoints +
  knowledgePoints +
  nivelDemanda +
  nivelMarca;

      return Math.min(score, 100);
    }, [
      complexidade,
      nivelTecnico,
      nivelDemanda,
      nivelMarca,
    ]);

  const nivelProduto =
    useMemo(() => {
      if (scoreArtesanal >= 85)
        return "🏆 Premium";

      if (scoreArtesanal >= 70)
        return "🔥 Alto Valor";

      if (scoreArtesanal >= 50)
        return "⭐ Diferenciado";

      return "✨ Em evolução";
    }, [scoreArtesanal]);

  const evolutionData =
    useMemo(() => {
      return [
        {
          nome: "Base",
          precoSugerido:
            custoTotalProduto,
        },
        {
          nome: "Mão Obra",
          precoSugerido:
            custoTotalProduto +
            maoDeObra,
        },
        {
          nome: "Final",
          precoSugerido,
        },
      ];
    }, [
      custoTotalProduto,
      maoDeObra,
      precoSugerido,
    ]);

  async function salvarValorizacao() {
    try {
      setSalvandoValorizacao(true);

      const { error } =
        await supabase
          .from("products")
.update({
  complexidade,
  exclusividade,
  nivel_tecnico:
    nivelTecnico,
  preco_sugerido:
    precoSugerido,
  mao_obra:
    maoDeObra,
  tempo_producao:
    product?.tempo_producao ||
    0,

  embalagem:
    product?.embalagem || 0,

  custos_extras:
    product?.custos_extras || 0,
})
          .eq("id", productId);

      if (error) {
        console.log(error);

        alert(
          "Erro ao salvar valorização"
        );

        return;
      }

      alert(
        "Precificação atualizada 🚀"
      );
    } catch (error) {
      console.log(error);
    } finally {
      setSalvandoValorizacao(false);
    }
  }

  async function adicionarMaterial() {
    try {
      setSalvandoMaterial(true);

      const material =
        materials.find(
          (item) =>
            item.id ===
            Number(
              selectedMaterialId
            )
        );

      if (!material) {
        alert(
          "Selecione um material"
        );

        return;
      }

const custoUnitario =
  Number(material.preco) /
  Number(
    material.quantidade_comprada
  );

const custoTotal =
  custoUnitario *
  quantidade;

      const { error } =
        await supabase
          .from("product_materials")
.insert({
  product_id:
    Number(productId),

  material_id:
    material.id,

  quantidade,

  unidade:
    material.unidade,

  custo_unitario:
    custoUnitario,

  custo_total:
    custoTotal,
})

      if (error) {
        console.log(error);

        alert(
          "Erro ao adicionar material"
        );

        return;
      }

      setOpenModal(false);

      setSelectedMaterialId("");

      setQuantidade(1);

      carregarMateriaisProduto();
    } catch (error) {
      console.log(error);
    } finally {
      setSalvandoMaterial(false);
    }
  }

  async function excluirMaterial(
    id: number
  ) {
    const confirmar = confirm(
      "Deseja remover este material?"
    );

    if (!confirmar) return;

    const { error } =
      await supabase
        .from("product_materials")
        .delete()
        .eq("id", id);

    if (error) {
      console.log(error);

      alert(
        "Erro ao excluir material"
      );

      return;
    }

    carregarMateriaisProduto();
  }

  if (loading || !product) {
    return (
      <main className="bg-gray-100 p-4 md:p-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          Carregando...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-gray-100 p-4 md:p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 md:text-5xl">
          {product.nome}
        </h1>

        <p className="mt-3 text-base text-slate-500 md:text-xl">
          Gestão estratégica do produto artesanal
        </p>
      </div>

<section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">

  <InfoItem
    label="Mão de Obra"
    value={`R$ ${maoDeObra.toFixed(2)}`}
    highlight
  />

  <InfoItem
    label="Lucro Premium"
    value={`R$ ${premiumProfit.toFixed(2)}`}
  />

  <InfoItem
    label="Valorização Total"
    value={`R$ ${(maoDeObra + premiumProfit).toFixed(2)}`}
  />

<InfoItem
  label="Margem Oficial"
  value={`${officialMargin}%`}
/>

</section>

      <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Informações do Produto
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Configure a valorização artesanal
            </p>
          </div>

          <button
            onClick={salvarValorizacao}
            disabled={
              salvandoValorizacao
            }
            className="
              rounded-2xl
              bg-green-600
              px-6
              py-4
              font-bold
              text-white
              transition-all
              hover:bg-green-700
              disabled:opacity-70
            "
          >
            {salvandoValorizacao
              ? "Salvando..."
              : "Salvar Precificação"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <InfoItem
            label="Produto"
            value={product.nome}
          />

          <InfoItem
            label="Categoria"
            value={product.categoria}
          />

<InfoItem
  label="Custo Total"
  value={`R$ ${custoTotalProduto.toFixed(
    2
  )}`}
/>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <strong className="mb-2 block text-sm text-slate-500">
              Tempo Produção
              (horas)
            </strong>

            <input
              type="number"
              value={
                product.tempo_producao ||
                0
              }
              onChange={(e) =>
                setProduct((prev) =>
                  prev
                    ? {
                        ...prev,
                        tempo_producao:
                          Number(
                            e.target
                              .value
                          ),
                      }
                    : null
                )
              }
              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                p-3
                outline-none
                transition
                focus:border-green-500
              "
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
  <strong className="mb-2 block text-sm text-slate-500">
    Embalagem
  </strong>

  <input
    type="number"
value={embalagem}
onChange={(e) => {
  const value = Number(
    e.target.value
  );

  setEmbalagem(value);

  setProduct((prev) =>
    prev
      ? {
          ...prev,
          embalagem: value,
        }
      : null
  );
}}
    className="
      w-full
      rounded-xl
      border
      border-slate-300
      bg-white
      p-3
      outline-none
      transition
      focus:border-green-500
    "
  />
</div>

<div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
  <strong className="mb-2 block text-sm text-slate-500">
    Custos Extras
  </strong>

  <input
    type="number"
value={custosExtras}
onChange={(e) => {
  const value = Number(
    e.target.value
  );

  setCustosExtras(value);

  setProduct((prev) =>
    prev
      ? {
          ...prev,
          custos_extras: value,
        }
      : null
  );
}}
    className="
      w-full
      rounded-xl
      border
      border-slate-300
      bg-white
      p-3
      outline-none
      transition
      focus:border-green-500
    "
  />
</div>

<SelectField
  label="Complexidade"
  value={complexidade}
  onChange={
    setComplexidade
  }
  options={[
    "1 - Simples",
    "2 - Básico",
    "3 - Avançado",
    "4 - Complexo",
  ]}
/>

          <SelectField
            label="Conhecimento"
            value={nivelTecnico}
            onChange={
              setNivelTecnico
            }
options={[
  "1 - Iniciante",
  "2 - Desenvolvimento",
  "3 - Atuante",
  "4 - Especialista",
]}
          />
        </div>

              <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
  <h2 className="mb-6 text-2xl font-bold text-slate-900">
    Precificação Oficial
  </h2>

  <div className="grid gap-4 md:grid-cols-3">

    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
      <p className="text-sm text-amber-700">
        Preço Mínimo
      </p>

      <h3 className="mt-2 text-3xl font-bold text-amber-900">
        R$ {minimumPrice.toFixed(2)}
      </h3>

      <p className="mt-3 text-sm text-green-700">
        Lucro: R$ {minimumProfit.toFixed(2)}
      </p>

      <p className="text-sm text-slate-600">
        Margem: {minimumMargin.toFixed(1)}%
      </p>
    </div>

    <div className="rounded-2xl border border-blue-300 bg-blue-50 p-6">
      <p className="text-sm text-blue-700">
        Preço Recomendado
      </p>

      <h3 className="mt-2 text-3xl font-bold text-blue-900">
        R$ {recommendedPrice.toFixed(2)}
      </h3>

      <p className="mt-3 text-sm text-green-700">
        Lucro: R$ {recommendedProfit.toFixed(2)}
      </p>

      <p className="text-sm text-slate-600">
        Margem: {recommendedMargin.toFixed(1)}%
      </p>
    </div>

    <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6">
      <p className="text-sm text-emerald-700">
        ⭐ Preço Premium
      </p>

      <h3 className="mt-2 text-3xl font-bold text-emerald-900">
        R$ {premiumPrice.toFixed(2)}
      </h3>

      <p className="mt-3 text-sm text-green-700">
        Lucro: R$ {premiumProfit.toFixed(2)}
      </p>

      <p className="text-sm text-slate-600">
        Margem: {premiumMargin.toFixed(1)}%
      </p>
    </div>

  </div>
</section>
      </section>
      
      <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Materiais do Produto
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Gerencie os materiais utilizados
            </p>
          </div>

          <button
            onClick={() =>
              setOpenModal(true)
            }
            className="
              rounded-2xl
              bg-slate-900
              px-6
              py-4
              font-bold
              text-white
              transition-all
              hover:bg-slate-800
            "
          >
            + Adicionar Material
          </button>
        </div>

        {productMaterials.length ===
        0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Nenhum material adicionado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr>
                  <th className="pb-4 text-left text-sm text-slate-500">
                    Material
                  </th>

                  <th className="pb-4 text-left text-sm text-slate-500">
                    Quantidade
                  </th>

                  <th className="pb-4 text-left text-sm text-slate-500">
                    Custo
                  </th>

                  <th className="pb-4 text-left text-sm text-slate-500">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {productMaterials.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100"
                    >
                      <td className="py-5">
                        {
                          item.materials
                            ?.nome
                        }
                      </td>

                      <td className="py-5">
                        {
                          item.quantidade
                        }
                      </td>

                      <td className="py-5 font-bold">
                        R${" "}
                        {Number(
                          item.custo_total
                        ).toFixed(2)}
                      </td>

                      <td className="py-5">
                        <button
                          onClick={() =>
                            excluirMaterial(
                              item.id
                            )
                          }
                          className="
                            rounded-lg
                            bg-red-600
                            px-4
                            py-2
                            text-sm
                            font-semibold
                            text-white
                            transition
                            hover:bg-red-700
                          "
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {openModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Adicionar Material
            </h2>

            <select
              value={
                selectedMaterialId
              }
              onChange={(e) =>
                setSelectedMaterialId(
                  e.target.value
                )
              }
              className="mb-4 w-full rounded-xl border border-slate-300 p-4"
            >
              <option value="">
                Selecione um
                material
              </option>

              {materials.map(
                (material) => (
                  <option
                    key={
                      material.id
                    }
                    value={
                      material.id
                    }
                  >
                    {
                      material.nome
                    }
                  </option>
                )
              )}
            </select>

            <input
              type="number"
              placeholder="Quantidade"
              value={quantidade}
              onChange={(e) =>
                setQuantidade(
                  Number(
                    e.target.value
                  )
                )
              }
              className="mb-6 w-full rounded-xl border border-slate-300 p-4"
            />

            <div className="flex gap-4">
              <button
                onClick={
                  adicionarMaterial
                }
                disabled={
                  salvandoMaterial
                }
                className="
                  flex-1
                  rounded-xl
                  bg-green-600
                  px-5
                  py-4
                  font-bold
                  text-white
                  transition
                  hover:bg-green-700
                "
              >
                {salvandoMaterial
                  ? "Salvando..."
                  : "Adicionar"}
              </button>

              <button
                onClick={() =>
                  setOpenModal(
                    false
                  )
                }
                className="
                  flex-1
                  rounded-xl
                  bg-slate-200
                  px-5
                  py-4
                  font-bold
                  text-slate-700
                  transition
                  hover:bg-slate-300
                "
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}