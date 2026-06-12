"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import {
  getBusinessMetrics,
  updateBusinessMetrics,
} from "@/services/businessMetrics";

export default function EmpresaPage() {
  const supabase = createClient();

  const [nomeEmpresa, setNomeEmpresa] =
  useState("");

  const [nivelDemanda, setNivelDemanda] =
    useState(1);

  const [
    nivelReconhecimento,
    setNivelReconhecimento,
  ] = useState(1);

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

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  /* =========================
     METODOLOGIA OFICIAL
  ========================== */

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

const demandPoints =
  demandPointsMap[
    nivelDemanda
  ] || 0;

const recognitionPoints =
  recognitionPointsMap[
    nivelReconhecimento
  ] || 0;

const scoreAtual =
  demandPoints +
  recognitionPoints;

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

      setNivelReconhecimento(
        Number(
          metrics.nivel_marca || 1
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

setNomeEmpresa(
  metrics.nome_empresa || ""
);

    } catch (error) {
      console.error(error);

      alert(
        "Erro ao carregar métricas."
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
          "Usuário não encontrado."
        );

        return;
      }

      console.log(
  "NOME EMPRESA",
  nomeEmpresa
);

      await updateBusinessMetrics({
        userId: user.id,
        nome_empresa:
  nomeEmpresa,

        nivel_demanda:
          nivelDemanda,

        nivel_marca:
          nivelReconhecimento,

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
        "Métricas atualizadas."
      );
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao salvar métricas."
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

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
          Configuração oficial da metodologia
        </p>
      </div>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Dados da Empresa
            </h2>
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
            "
          >
            {saving
              ? "Salvando..."
              : "Salvar"}
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          <div>
  <strong className="mb-2 block text-sm text-slate-500">
    Nome da Empresa
  </strong>

  <input
    type="text"
    value={nomeEmpresa}
    onChange={(e) =>
      setNomeEmpresa(
        e.target.value
      )
    }
    className="w-full rounded-2xl border border-slate-300 p-4"
    placeholder="Ex: Ateliê Edi Art Crochê"
  />
</div>
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
              className="w-full rounded-2xl border border-slate-300 p-4"
            />
          </div>

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
              className="w-full rounded-2xl border border-slate-300 p-4"
            />
          </div>

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
              className="w-full rounded-2xl border border-slate-300 p-4"
            />
          </div>

          <div>
            <strong className="mb-2 block text-sm text-slate-500">
              Demanda Atual
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
                Sem Encomendas
              </option>

              <option value={2}>
                Tempo Ocioso
              </option>

              <option value={3}>
                Demanda Normal
              </option>

              <option value={4}>
                Demanda Excessiva
              </option>
            </select>
          </div>

          <div>
            <strong className="mb-2 block text-sm text-slate-500">
              Reconhecimento de Mercado
            </strong>

            <select
              value={
                nivelReconhecimento
              }
              onChange={(e) =>
                setNivelReconhecimento(
                  Number(
                    e.target.value
                  )
                )
              }
              className="w-full rounded-2xl border border-slate-300 p-4"
            >
              <option value="1">
  Pouco Conhecida
</option>

<option value="2">
  Sendo Comentada
</option>

<option value="3">
  Marca Reconhecida
</option>

<option value="4">
  Marca Desejada
</option>
            </select>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-5">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">
            Horas/Mês
          </p>

          <h3 className="text-4xl font-bold text-sky-600">
            {horasMensais}
          </h3>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">
            Valor/Hora
          </p>

          <h3 className="text-4xl font-bold text-emerald-600">
            R$ {valorHora.toFixed(2)}
          </h3>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">
            Demanda Atual
          </p>

<h3 className="text-4xl font-bold text-orange-500">
  {demandPoints}
</h3>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">
            Reconhecimento
          </p>

          <h3 className="text-4xl font-bold text-violet-600">
            {recognitionPoints}
          </h3>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">
            Pontuação Atual
          </p>

          <h3 className="text-4xl font-bold text-green-600">
            {scoreAtual}
          </h3>
        </div>
      </section>
    </main>
  );
}