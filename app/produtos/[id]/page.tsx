"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

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
};

type Material = {
  id: number;
  nome: string;
  preco: number;
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
  const params = useParams();

  const productId = params.id;

  const [product, setProduct] =
    useState<Product | null>(null);

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
            preco
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
      return productMaterials.reduce(
        (acc, item) =>
          acc +
          Number(item.custo_total),
        0
      );
    }, [productMaterials]);

  const maoDeObra = useMemo(() => {
    if (!product) return 0;

    return (
      Number(
        product.tempo_producao || 0
      ) *
      Number(product.valor_hora || 0)
    );
  }, [product]);

  const multiplicadorValorizacao =
    useMemo(() => {
      const fatorComplexidade =
        Number(complexidade || 1) *
        0.08;

      const fatorExclusividade =
        Number(exclusividade || 1) *
        0.08;

      const fatorTecnico =
        Number(nivelTecnico || 1) *
        0.1;

      const fatorDemanda =
        Number(nivelDemanda || 1) *
        0.12;

      const fatorMarca =
        Number(nivelMarca || 1) *
        0.12;

      return (
        1 +
        fatorComplexidade +
        fatorExclusividade +
        fatorTecnico +
        fatorDemanda +
        fatorMarca
      );
    }, [
      complexidade,
      exclusividade,
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

  const scoreArtesanal =
    useMemo(() => {
      const score =
        complexidade * 10 +
        exclusividade * 10 +
        nivelTecnico * 12 +
        nivelDemanda * 8 +
        nivelMarca * 10;

      return Math.min(score, 100);
    }, [
      complexidade,
      exclusividade,
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
            valor_hora:
              product?.valor_hora || 0,
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

      const custoTotal =
        material.preco * quantidade;

      const { error } =
        await supabase
          .from("product_materials")
          .insert({
            product_id:
              Number(productId),
            material_id:
              material.id,
            quantidade,
            custo_total:
              custoTotal,
          });

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
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
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
          label="Score Artesanal"
          value={`${scoreArtesanal}/100`}
          highlight
        />

        <InfoItem
          label="Nível Produto"
          value={nivelProduto}
        />

        <InfoItem
          label="Multiplicador"
          value={`${multiplicadorValorizacao.toFixed(
            2
          )}x`}
        />

        <InfoItem
          label="Margem Lucro"
          value={`R$ ${margemLucro.toFixed(
            2
          )}`}
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
            label="Preço Atual"
            value={`R$ ${Number(
              product.preco
            ).toFixed(2)}`}
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
              Valor Hora
            </strong>

            <input
              type="number"
              value={
                product.valor_hora ||
                0
              }
              onChange={(e) =>
                setProduct((prev) =>
                  prev
                    ? {
                        ...prev,
                        valor_hora:
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

          <InfoItem
            label="Mão de Obra"
            value={`R$ ${maoDeObra.toFixed(
              2
            )}`}
            highlight
          />

          <SelectField
            label="Complexidade"
            value={complexidade}
            onChange={
              setComplexidade
            }
            options={[
              "1 - Simples",
              "2 - Básico",
              "3 - Intermediário",
              "4 - Avançado",
              "5 - Extremamente complexo",
            ]}
          />

          <SelectField
            label="Exclusividade"
            value={exclusividade}
            onChange={
              setExclusividade
            }
            options={[
              "1 - Muito comum",
              "2 - Pouco diferente",
              "3 - Diferenciado",
              "4 - Exclusivo",
              "5 - Peça única",
            ]}
          />

          <SelectField
            label="Nível Técnico"
            value={nivelTecnico}
            onChange={
              setNivelTecnico
            }
            options={[
              "1 - Iniciante",
              "2 - Básico",
              "3 - Intermediário",
              "4 - Avançado",
              "5 - Especialista",
            ]}
          />
        </div>
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

      <ProductPricingCard
        custoTotalProduto={
          custoTotalProduto
        }
        maoDeObra={maoDeObra}
        multiplicadorValorizacao={
          multiplicadorValorizacao
        }
        precoSugerido={
          precoSugerido
        }
      />

      <FinancialMetricsCard
        custoTotalProduto={
          custoTotalProduto
        }
        maoDeObra={maoDeObra}
        precoSugerido={
          precoSugerido
        }
        margemLucro={margemLucro}
      />

      <FinancialEvolutionChart
        data={evolutionData}
      />

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