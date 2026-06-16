"use client";

import {
  useEffect,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
export default function PedidosPage() {
    const supabase = createClient();
    const [openModal, setOpenModal] =
  useState(false);

  const [clientes, setClientes] =
  useState<any[]>([]);

const [
  selectedClienteId,
  setSelectedClienteId,
] = useState("");

const [produtos, setProdutos] =
  useState<any[]>([]);

  const [pedidos, setPedidos] =
  useState<any[]>([]);

const [
  selectedProdutoId,
  setSelectedProdutoId,
] = useState("");

const [quantidade, setQuantidade] =
  useState(1);

  const [observacao, setObservacao] =
  useState("");

async function carregarClientes() {
  const { data, error } =
    await supabase
      .from("clientes")
      .select("*")
      .order("nome");

  if (error) {
    console.log(error);
    return;
  }

  setClientes(data || []);
}

async function carregarProdutos() {
const { data, error } =
    await supabase
      .from("products")
      .select("*")
      .order("nome");

  if (error) {
    console.log(error);
    return;
  }

  setProdutos(data || []);
}

async function carregarPedidos() {
  const { data, error } =
    await supabase
      .from("orders")
      .select(`
        *,
        clientes (
          nome
        )
      `)
      .order(
        "created_at",
        { ascending: false }
      );

  if (error) {
    console.log(error);
    return;
  }

  setPedidos(data || []);
}

async function atualizarStatus(
  pedidoId: number,
  status: string
) {
  const { error } =
    await supabase
      .from("orders")
      .update({
        status,
      })
      .eq("id", pedidoId);

  if (error) {
    console.log(error);

    alert(
      "Erro ao atualizar status"
    );

    return;
  }

  carregarPedidos();
}

useEffect(() => {
  carregarClientes();

  carregarProdutos();

  carregarPedidos();
}, []);

async function salvarPedido() {
  if (!selectedClienteId) {
    alert("Selecione um cliente");
    return;
  }

  if (!selectedProdutoId) {
    alert("Selecione um produto");
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const produto =
    produtos.find(
      (p) =>
        String(p.id) ===
        selectedProdutoId
    );

  if (!produto) return;

  const valorUnitario =
    Number(produto.preco || 0);

  const valorTotal =
    valorUnitario *
    quantidade;

  const {
    data: order,
    error: orderError,
  } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,

      client_id:
        selectedClienteId,

      observacao,

      valor_total:
        valorTotal,
    })
    .select()
    .single();

  if (orderError) {
    console.log(orderError);

    alert(
      "Erro ao criar pedido"
    );

    return;
  }

  const {
    error: itemError,
  } = await supabase
    .from("order_items")
    .insert({
      order_id: order.id,

      product_id:
        produto.id,

      quantidade,

      valor_unitario:
        valorUnitario,

      valor_total:
        valorTotal,
    });

  if (itemError) {
    console.log(itemError);

    alert(
      "Erro ao criar item"
    );

    return;
  }

  alert(
    "Pedido criado com sucesso"
  );

  carregarPedidos();

  setOpenModal(false);

  setSelectedClienteId("");
  setSelectedProdutoId("");
  setQuantidade(1);
  setObservacao("");
}
  
  return (
    <main className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black text-slate-900">
            Pedidos
          </h1>

          <p className="mt-3 text-xl text-slate-500">
            Gestão de orçamentos, vendas e produção
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
  "
>
  + Novo Pedido
</button>
      </div>
      {openModal && (
  <div
    className="
      fixed
      inset-0
      z-50
      flex
      items-center
      justify-center
      bg-black/50
      p-4
    "
  >
    <div
      className="
        w-full
        max-w-2xl
        rounded-3xl
        bg-white
        p-8
      "
    >
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Novo Pedido
        </h2>

        <button
          onClick={() =>
            setOpenModal(false)
          }
        >
          ✕
        </button>
      </div>

<div>
  <label className="mb-2 block text-sm font-semibold text-slate-500">
    Cliente
  </label>

  <select
    value={selectedClienteId}
    onChange={(e) =>
      setSelectedClienteId(
        e.target.value
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
    <option value="">
      Selecione um cliente
    </option>

    {clientes.map(
      (cliente) => (
        <option
          key={cliente.id}
          value={cliente.id}
        >
          {cliente.nome}
        </option>
      )
    )}
  </select>

  <div className="mt-6">
  <label className="mb-2 block text-sm font-semibold text-slate-500">
    Produto
  </label>

  <select
    value={selectedProdutoId}
    onChange={(e) =>
      setSelectedProdutoId(
        e.target.value
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
    <option value="">
      Selecione um produto
    </option>

    {produtos.map(
      (produto) => (
        <option
          key={produto.id}
          value={produto.id}
        >
          {produto.nome}
        </option>
      )
    )}
  </select>
  <div className="mt-6">
  <label className="mb-2 block text-sm font-semibold text-slate-500">
    Quantidade
  </label>

  <input
    type="number"
    min="1"
    value={quantidade}
    onChange={(e) =>
      setQuantidade(
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
<div className="mt-6">
  <label className="mb-2 block text-sm font-semibold text-slate-500">
    Observação
  </label>

  <textarea
    value={observacao}
    onChange={(e) =>
      setObservacao(
        e.target.value
      )
    }
    rows={3}
    className="
      w-full
      rounded-2xl
      border
      border-slate-300
      p-4
    "
    placeholder="Observações do pedido"
  />
</div>

<button
  onClick={salvarPedido}
  className="
    mt-6
    w-full
    rounded-2xl
    bg-green-600
    px-6
    py-4
    font-bold
    text-white
    hover:bg-green-700
  "
>
  Salvar Pedido
</button>

</div>

</div>

    </div>
  </div>
)}

<div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6">
  <h2 className="mb-6 text-2xl font-bold">
    Pedidos
  </h2>

  <table className="w-full">
    <thead>
      <tr className="border-b">
        <th className="p-3 text-left">
          ID
        </th>

        <th className="p-3 text-left">
          Cliente
        </th>

        <th className="p-3 text-left">
          Status
        </th>

        <th className="p-3 text-left">
          Valor
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
              {
                pedido.clientes
                  ?.nome
              }
            </td>

<td className="p-3">
  <select
    value={pedido.status}
    onChange={(e) =>
      atualizarStatus(
        pedido.id,
        e.target.value
      )
    }
    className="
      rounded-xl
      border
      border-slate-300
      px-3
      py-2
    "
  >
    <option value="orcamento">
      Orçamento
    </option>

    <option value="aguardando">
      Aguardando
    </option>

    <option value="producao">
      Produção
    </option>

    <option value="finalizado">
      Finalizado
    </option>

    <option value="cancelado">
      Cancelado
    </option>
  </select>
</td>

<td className="p-3">
  R$ {Number(
    pedido.valor_total
  ).toFixed(2)}
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