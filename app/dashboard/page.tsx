"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import { DashboardCard } from "@/components/DashboardCard";

import { FinancialEvolutionChart } from "@/components/dashboard/FinancialEvolutionChart";

type Product = {
  id: number;
  nome: string;
  preco_sugerido: number;
  complexidade: number;
  exclusividade: number;
  nivel_tecnico: number;
};

type Material = {
  id: number;
};

export default function Dashboard() {
  const supabase = createClient();
  const [loading, setLoading] =
    useState(true);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [materials, setMaterials] =
    useState<Material[]>([]);

  async function carregarDados() {
    try {
      setLoading(true);

      const [
        productsResponse,
        materialsResponse,
      ] = await Promise.all([
        supabase
          .from("products")
          .select("*"),

        supabase
          .from("materials")
          .select("*"),
      ]);

      if (
        productsResponse.error
      ) {
        console.log(
          productsResponse.error
        );
      }

      if (
        materialsResponse.error
      ) {
        console.log(
          materialsResponse.error
        );
      }

      setProducts(
        productsResponse.data ||
          []
      );

      setMaterials(
        materialsResponse.data ||
          []
      );
    } catch (error) {
      console.log(error);

      alert(
        "Erro ao carregar dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const totalProdutos =
    products.length;

  const totalMateriais =
    materials.length;

  const faturamentoPotencial =
    useMemo(() => {
      return products.reduce(
        (acc, item) =>
          acc +
          Number(
            item.preco_sugerido ||
              0
          ),
        0
      );
    }, [products]);

  const scoreMedio =
    useMemo(() => {
      if (
        products.length === 0
      )
        return 0;

      const total =
        products.reduce(
          (acc, product) => {
            const score =
              product.complexidade *
                10 +
              product.exclusividade *
                10 +
              product.nivel_tecnico *
                12;

            return acc + score;
          },
          0
        );

      return Math.round(
        total / products.length
      );
    }, [products]);

  const produtosPremium =
    useMemo(() => {
      return products.filter(
        (product) => {
          const score =
            product.complexidade *
              10 +
            product.exclusividade *
              10 +
            product.nivel_tecnico *
              12;

          return score >= 70;
        }
      ).length;
    }, [products]);

  const evolutionData =
    useMemo(() => {
      return products.map(
        (product) => ({
          nome: product.nome,
          precoSugerido:
            Number(
              product.preco_sugerido ||
                0
            ),
        })
      );
    }, [products]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          Carregando dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 md:text-5xl">
          Dashboard
        </h1>

        <p className="mt-3 text-base text-slate-500 md:text-xl">
          Visão estratégica artesanal 🚀
        </p>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Produtos"
          value={String(
            totalProdutos
          )}
        />

        <DashboardCard
          title="Materiais"
          value={String(
            totalMateriais
          )}
        />

        <DashboardCard
          title="Produtos Premium"
          value={String(
            produtosPremium
          )}
        />

        <DashboardCard
          title="Score Médio"
          value={`${scoreMedio}/100`}
        />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">
            Faturamento Potencial
          </p>

          <h2 className="text-5xl font-black text-green-600">
            R${" "}
            {faturamentoPotencial.toFixed(
              2
            )}
          </h2>

          <p className="mt-4 text-sm text-slate-500">
            Soma de todos os preços
            sugeridos da plataforma
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">
            Performance Artesanal
          </p>

          <h2 className="text-5xl font-black text-orange-500">
            {scoreMedio >= 70
              ? "🔥"
              : scoreMedio >= 50
              ? "⭐"
              : "✨"}
          </h2>

          <p className="mt-4 text-sm text-slate-500">
            Baseado na valorização
            média dos produtos
          </p>
        </div>
      </section>

      <FinancialEvolutionChart
        data={evolutionData}
      />
    </main>
  );
}