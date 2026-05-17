"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import {
  getBusinessMetrics,
  updateBusinessMetrics,
} from "@/services/businessMetrics";

import {
  getPricingSettings,
  updatePricingSettings,
} from "@/services/pricingSettings.service";

export default function EmpresaPage() {
  /* =========================
     POSICIONAMENTO
  ========================== */

  const [nivelDemanda, setNivelDemanda] =
    useState(1);

  const [nivelMarca, setNivelMarca] =
    useState(1);

  /* =========================
     SOCIAL
  ========================== */

  const [
    instagramSeguidores,
    setInstagramSeguidores,
  ] = useState(0);

  const [
    tiktokSeguidores,
    setTiktokSeguidores,
  ] = useState(0);

  /* =========================
     OPERAÇÃO
  ========================== */

  const [
    metaFaturamento,
    setMetaFaturamento,
  ] = useState(10000);

  const [
    diasTrabalhados,
    setDiasTrabalhados,
  ] = useState(22);

  const [
    horasPorDia,
    setHorasPorDia,
  ] = useState(6);

  /* =========================
     SISTEMA
  ========================== */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  /* =========================
     SCORES
  ========================== */

  const instagramScore =
    instagramSeguidores >= 100000
      ? 50
      : instagramSeguidores >= 50000
      ? 30
      : instagramSeguidores >= 10000
      ? 15
      : instagramSeguidores >= 1000
      ? 5
      : 0;

  const tiktokScore =
    tiktokSeguidores >= 100000
      ? 50
      : tiktokSeguidores >= 50000
      ? 30
      : tiktokSeguidores >= 10000
      ? 15
      : tiktokSeguidores >= 1000
      ? 5
      : 0;

  const demandScore =
    nivelDemanda * 16;

  const brandScore =
    nivelMarca * 20;

  const scoreGeral =
    demandScore +
    brandScore +
    instagramScore +
    tiktokScore;

  /* =========================
     OPERAÇÃO
  ========================== */

  const horasMensais =
    diasTrabalhados *
    horasPorDia;

  const valorHora =
    horasMensais > 0
      ? metaFaturamento /
        horasMensais
      : 0;

  /* =========================
     IA
  ========================== */

  let nivelIA = "Iniciante";

  if (scoreGeral >= 160) {
    nivelIA = "Marca Premium";
  } else if (scoreGeral >= 120) {
    nivelIA = "Alta Autoridade";
  } else if (scoreGeral >= 80) {
    nivelIA = "Marca Forte";
  } else if (scoreGeral >= 40) {
    nivelIA = "Em Crescimento";
  }

  /* =========================
     LOAD
  ========================== */

  async function carregarDados() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const metrics =
        await getBusinessMetrics(
          user.id
        );

      if (!metrics) return;

      setNivelDemanda(
        Number(
          metrics.nivel_demanda || 1
        )
      );

      setNivelMarca(
        Number(
          metrics.nivel_marca || 1
        )
      );

      setInstagramSeguidores(
        Number(
          metrics.instagram_seguidores ||
            0
        )
      );

      setTiktokSeguidores(
        Number(
          metrics.tiktok_seguidores ||
            0
        )
      );

      setMetaFaturamento(
        Number(
          metrics.meta_faturamento ||
            10000
        )
      );

      setDiasTrabalhados(
        Number(
          metrics.dias_trabalhados ||
            22
        )
      );

      setHorasPorDia(
        Number(
          metrics.horas_por_dia ||
            6
        )
      );
    } catch (error) {
      console.log(error);

      alert(
        "Erro ao carregar métricas"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     SAVE
  ========================== */

  async function salvarDados() {
    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert(
          "Usuário não encontrado"
        );

        return;
      }

      await updateBusinessMetrics({
        userId: user.id,

        nivel_demanda:
          nivelDemanda,

        nivel_marca:
          nivelMarca,

        instagram_seguidores:
          instagramSeguidores,

        tiktok_seguidores:
          tiktokSeguidores,

        score_artesanal:
          scoreGeral,

        meta_faturamento:
          metaFaturamento,

        dias_trabalhados:
          diasTrabalhados,

        horas_por_dia:
          horasPorDia,

        valor_hora:
          valorHora,
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

  /* =========================
     LOADING
  ========================== */

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
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 md:text-5xl">
          Empresa
        </h1>

        <p className="mt-3 text-base text-slate-500 md:text-xl">
          Estratégia e operação da empresa artesanal 🚀
        </p>
      </div>

      {/* FORM */}
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Inteligência da Empresa
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Configure operação,
              posicionamento e métricas estratégicas
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
          {/* META */}
          <div>
            <strong className="mb-2 block text-sm text-slate-500">
              Meta de Faturamento Mensal
            </strong>

            <input
              type="number"
              value={metaFaturamento}
              onChange={(e) =>
                setMetaFaturamento(
                  Number(
                    e.target.value
                  )
                )
              }
              className="
                w-full
                rounded-2xl
                border
                border-slate-300
                p-4
              "
            />
          </div>

          {/* DIAS */}
          <div>
            <strong className="mb-2 block text-sm text-slate-500">
              Dias Trabalhados
            </strong>

            <input
              type="number"
              value={diasTrabalhados}
              onChange={(e) =>
                setDiasTrabalhados(
                  Number(
                    e.target.value
                  )
                )
              }
              className="
                w-full
                rounded-2xl
                border
                border-slate-300
                p-4
              "
            />
          </div>

          {/* HORAS */}
          <div>
            <strong className="mb-2 block text-sm text-slate-500">
              Horas por Dia
            </strong>

            <input
              type="number"
              value={horasPorDia}
              onChange={(e) =>
                setHorasPorDia(
                  Number(
                    e.target.value
                  )
                )
              }
              className="
                w-full
                rounded-2xl
                border
                border-slate-300
                p-4
              "
            />
          </div>

          {/* DEMANDA */}
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
              className="
                w-full
                rounded-2xl
                border
                border-slate-300
                p-4
              "
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

          {/* MARCA */}
          <div>
            <strong className="mb-2 block text-sm text-slate-500">
              Posicionamento da Marca
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
              className="
                w-full
                rounded-2xl
                border
                border-slate-300
                p-4
              "
            >
              <option value={1}>
                1 - Iniciante Local
              </option>

              <option value={2}>
                2 - Marca em Crescimento
              </option>

              <option value={3}>
                3 - Marca Reconhecida
              </option>

              <option value={4}>
                4 - Autoridade Artesanal
              </option>

              <option value={5}>
                5 - Marca Premium
              </option>
            </select>
          </div>

          {/* INSTAGRAM */}
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
              className="
                w-full
                rounded-2xl
                border
                border-slate-300
                p-4
              "
            />
          </div>

          {/* TIKTOK */}
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
              className="
                w-full
                rounded-2xl
                border
                border-slate-300
                p-4
              "
            />
          </div>
        </div>
      </section>

      {/* CARDS */}
      <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-5">
        {/* HORAS */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">
            Horas/Mês
          </p>

          <h3 className="text-4xl font-bold text-sky-600">
            {horasMensais}
          </h3>
        </div>

        {/* VALOR HORA */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">
            Valor/Hora
          </p>

          <h3 className="text-4xl font-bold text-emerald-600">
            R$ {valorHora.toFixed(2)}
          </h3>
        </div>

        {/* DEMANDA */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">
            Demanda
          </p>

          <h3 className="text-4xl font-bold text-orange-500">
            {demandScore}
          </h3>
        </div>

        {/* SCORE */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">
            Score IA
          </p>

          <h3 className="text-4xl font-bold text-green-600">
            {scoreGeral}
          </h3>
        </div>

        {/* IA */}
        <div className="rounded-3xl bg-violet-100 p-6 shadow-sm">
          <p className="mb-3 text-sm text-violet-700">
            Estratégia
          </p>

          <h3 className="text-2xl font-bold text-violet-800">
            {nivelIA}
          </h3>
        </div>
      </section>
    </main>
  );
}