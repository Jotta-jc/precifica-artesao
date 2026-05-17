"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

import {
  getBusinessMetrics,
  updateBusinessMetrics,
} from "@/services/businessMetrics";

export default function EmpresaPage() {
  const [
    nivelDemanda,
    setNivelDemanda,
  ] = useState(1);

  const [
    nivelMarca,
    setNivelMarca,
  ] = useState(1);

  const [
    instagramSeguidores,
    setInstagramSeguidores,
  ] = useState(0);

  const [
    tiktokSeguidores,
    setTiktokSeguidores,
  ] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  async function carregarDados() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const metrics =
        await getBusinessMetrics(
          user.id
        );

      if (metrics) {
        setNivelDemanda(
          metrics.nivel_demanda || 1
        );

        setNivelMarca(
          metrics.nivel_marca || 1
        );

        setInstagramSeguidores(
          metrics.instagram_seguidores ||
            0
        );

        setTiktokSeguidores(
          metrics.tiktok_seguidores ||
            0
        );
      }
    } catch (error) {
      console.log(error);

      alert(
        "Erro ao carregar métricas"
      );
    } finally {
      setLoading(false);
    }
  }

  async function salvarDados() {
    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Usuário não encontrado");

        return;
      }

      await updateBusinessMetrics({
        userId: user.id,

        nivel_demanda:
          nivelDemanda,

        nivel_marca: nivelMarca,

        instagram_seguidores:
          instagramSeguidores,

        tiktok_seguidores:
          tiktokSeguidores,
      });

      alert(
        "Métricas atualizadas 🚀"
      );
    } catch (error) {
      console.log(error);

      alert(
        "Erro ao salvar métricas"
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const scoreGeral = useMemo(() => {
    return (
      (nivelDemanda +
        nivelMarca) *
      10
    );
  }, [
    nivelDemanda,
    nivelMarca,
  ]);

  if (loading) {
    return (
      <main className="bg-gray-100 p-4 md:p-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          Carregando...
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gray-100 p-4 md:p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 md:text-5xl">
          Empresa
        </h1>

        <p className="mt-3 text-base text-slate-500 md:text-xl">
          Posicionamento estratégico artesanal 🚀
        </p>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Posicionamento da Marca
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Configure os fatores
              estratégicos da sua
              empresa artesanal
            </p>
          </div>

          <button
            onClick={salvarDados}
            disabled={saving}
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
            {saving
              ? "Salvando..."
              : "Salvar Métricas"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <strong className="mb-2 block text-sm text-slate-500">
              Nível de Demanda
            </strong>

            <select
              value={nivelDemanda}
              onChange={(e) =>
                setNivelDemanda(
                  Number(
                    e.target.value
                  )
                )
              }
              className="w-full rounded-2xl border border-slate-300 p-4"
            >
              <option value={1}>
                1 - Baixa Procura
              </option>

              <option value={2}>
                2 - Agenda Livre
              </option>

              <option value={3}>
                3 - Demanda Estável
              </option>

              <option value={4}>
                4 - Alta Procura
              </option>

              <option value={5}>
                5 - Lista de Espera
              </option>
            </select>
          </div>

          <div>
            <strong className="mb-2 block text-sm text-slate-500">
              Posicionamento da
              Marca
            </strong>

            <select
              value={nivelMarca}
              onChange={(e) =>
                setNivelMarca(
                  Number(
                    e.target.value
                  )
                )
              }
              className="w-full rounded-2xl border border-slate-300 p-4"
            >
              <option value={1}>
                1 - Iniciante Local
              </option>

              <option value={2}>
                2 - Marca em
                Crescimento
              </option>

              <option value={3}>
                3 - Marca
                Reconhecida
              </option>

              <option value={4}>
                4 - Autoridade
                Artesanal
              </option>

              <option value={5}>
                5 - Marca Premium
              </option>
            </select>
          </div>

          <div>
            <strong className="mb-2 block text-sm text-slate-500">
              Seguidores Instagram
            </strong>

            <input
              type="number"
              value={
                instagramSeguidores
              }
              onChange={(e) =>
                setInstagramSeguidores(
                  Number(
                    e.target.value
                  )
                )
              }
              className="w-full rounded-2xl border border-slate-300 p-4"
            />
          </div>

          <div>
            <strong className="mb-2 block text-sm text-slate-500">
              Seguidores TikTok
            </strong>

            <input
              type="number"
              value={
                tiktokSeguidores
              }
              onChange={(e) =>
                setTiktokSeguidores(
                  Number(
                    e.target.value
                  )
                )
              }
              className="w-full rounded-2xl border border-slate-300 p-4"
            />
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">
            Nível de Demanda
          </p>

          <h3 className="text-4xl font-bold text-orange-500">
            {nivelDemanda}/5
          </h3>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">
            Força da Marca
          </p>

          <h3 className="text-4xl font-bold text-pink-600">
            {nivelMarca}/5
          </h3>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">
            Score Artesanal
          </p>

          <h3 className="text-4xl font-bold text-green-600">
            {scoreGeral}/100
          </h3>
        </div>
      </section>
    </main>
  );
}