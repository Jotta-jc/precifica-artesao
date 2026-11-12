"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function EditarClientePage() {
  const params = useParams();
  const router = useRouter();

  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tipoCliente, setTipoCliente] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    async function carregarCliente() {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) {
        console.error("Erro ao carregar cliente:", error);
        setLoading(false);
        return;
      }

      setNome(data.nome || "");
      setEmail(data.email || "");
      setTelefone(data.telefone || "");
      setInstagram(data.instagram || "");
      setTipoCliente(data.tipo_cliente || "");
      setObservacoes(data.observacoes || "");

      setLoading(false);
    }

    carregarCliente();
  }, [params.id]);

  async function salvarCliente(e: React.FormEvent) {
    e.preventDefault();

    setSalvando(true);

    const { error } = await supabase
      .from("clientes")
      .update({
        nome,
        email,
        telefone,
        instagram,
        tipo_cliente: tipoCliente,
        observacoes,
      })
      .eq("id", params.id);

    if (error) {
      console.error("Erro ao atualizar cliente:", error);

      alert("Erro ao atualizar cliente.");

      setSalvando(false);
      return;
    }

    router.push(`/clientes/${params.id}`);
  }

  if (loading) {
    return (
      <main className="p-8">
        <p className="text-slate-500">
          Carregando cliente...
        </p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900">
          Editar Cliente
        </h1>

        <p className="mt-2 text-slate-500">
          Atualize as informações do cliente.
        </p>
      </div>

      <form
        onSubmit={salvarCliente}
        className="max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nome
            </label>

            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Telefone
            </label>

            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Instagram
            </label>

            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tipo de Cliente
            </label>

            <input
              value={tipoCliente}
              onChange={(e) => setTipoCliente(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Observações
          </label>

          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl bg-slate-200 px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-300"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={salvando}
            className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </main>
  );
}