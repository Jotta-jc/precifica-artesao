"use client";

import Card from "@/components/ui/Card";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import StatCard from "@/components/ui/StatCard";

export default function ClienteDetalhePage() {
  const params = useParams();

  const supabase = createClient();

  const [cliente, setCliente] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [pedidos, setPedidos] =
    useState<any[]>([]);

  const totalPedidos =
    pedidos.length;

  const totalVendido =
    pedidos.reduce(
      (acc, pedido) =>
        acc +
        Number(
          pedido.valor_total || 0
        ),
      0
    );

  const ticketMedio =
    totalPedidos > 0
      ? totalVendido /
        totalPedidos
      : 0;

  async function carregarCliente() {
    const { data, error } =
      await supabase
        .from("clientes")
        .select("*")
        .eq("id", params.id)
        .single();

if (error) {
  console.error("ERRO CLIENTE:", {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    id: params.id,
  });

  setLoading(false);
  return;
}
    setCliente(data);

    const {
      data: pedidosData,
    } = await supabase
      .from("orders")
      .select("*")
      .eq(
        "client_id",
        params.id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    setPedidos(
      pedidosData || []
    );

    setLoading(false);
  }

async function excluirCliente() {
  const confirmar = window.confirm(
    "Deseja realmente excluir este cliente?"
  );

  if (!confirmar) return;

  setLoading(true);

  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("Erro ao excluir cliente:", error);

    alert(
      error.code === "23503"
        ? "Este cliente tem pedidos registrados e não pode ser excluído. Assim o histórico de vendas fica preservado."
        : "Não foi possível excluir agora. Tente novamente em instantes."
    );

    setLoading(false);
    return;
  }

  window.location.href = "/clientes";
}

  useEffect(() => {
    carregarCliente();
  }, []);

  if (loading) {
    return (
      <main className="p-8">
        Carregando...
      </main>
    );
  }

  return (
    <main className="p-8">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black">
            {cliente.nome}
          </h1>

          <p className="mt-3 text-slate-500">
            Detalhes do cliente
          </p>
        </div>

        <div className="flex gap-3">
<button
  onClick={() => {
    window.location.href = `/clientes/${params.id}/editar`;
  }}
  className="
    rounded-2xl
    bg-amber-500
    px-6
    py-3
    font-bold
    text-white
    transition
    hover:bg-amber-600
  "
>
  Editar Cliente
</button>

          <button
            onClick={
              excluirCliente
            }
            className="
              rounded-2xl
              bg-red-600
              px-6
              py-3
              font-bold
              text-white
            "
          >
            Excluir Cliente
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
           

        <div className="mt-8 grid gap-6 md:grid-cols-3">
  <StatCard
    title="Total de Pedidos"
    value={totalPedidos}
    description="Pedidos realizados pelo cliente"
  />

  <StatCard
    title="Total Vendido"
    value={`R$ ${totalVendido.toFixed(2)}`}
    description="Valor total dos pedidos"
    color="green"
  />

  <StatCard
    title="Ticket Médio"
    value={`R$ ${ticketMedio.toFixed(2)}`}
    description="Valor médio por pedido"
    color="blue"
  />
</div>

      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="mb-6 text-2xl font-bold">
          Informações do Cliente
        </h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              Email
            </p>

            <p className="mt-2 font-semibold">
              {cliente.email || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              Telefone
            </p>

            <p className="mt-2 font-semibold">
              {cliente.telefone || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              Instagram
            </p>

            <p className="mt-2 font-semibold">
              {cliente.instagram || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              Tipo
            </p>

            <p className="mt-2 font-semibold">
              {cliente.tipo_cliente || "-"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">
            Observações
          </p>

          <p className="mt-2">
            {cliente.observacoes ||
              "Nenhuma observação cadastrada"}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-bold">
          Pedidos do Cliente
        </h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left">
                Pedido
              </th>

              <th className="p-3 text-left">
                Status
              </th>

              <th className="p-3 text-left">
                Valor
              </th>

              <th className="p-3 text-left">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {pedidos.map(
              (pedido: any) => (
                <tr
                  key={pedido.id}
                  className="border-b"
                >
                  <td className="p-3">
                    #{pedido.id}
                  </td>

                  <td className="p-3">
                    {pedido.status}
                  </td>

                  <td className="p-3">
                    R$ {Number(
                      pedido.valor_total
                    ).toFixed(2)}
                  </td>

                  <td className="p-3">
                    <a
                      href={`/pedidos/${pedido.id}`}
                      className="
                        rounded-xl
                        bg-blue-600
                        px-4
                        py-2
                        text-white
                      "
                    >
                      Ver Pedido
                    </a>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

    </main>
  );
}