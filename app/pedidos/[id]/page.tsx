"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function PedidoDetalhePage() {
  const params = useParams();
const supabase = createClient();
const [pedido, setPedido] =
  useState<any>(null);

const [loading, setLoading] =
  useState(true);

  const [itens, setItens] =
  useState<any[]>([]);

  const [
  observacao,
  setObservacao,
] = useState("");

  async function carregarPedido() {
  const { data, error } =
    await supabase
      .from("orders")
      .select(`
        *,
        clientes (
          nome,
          telefone,
          email
        )
      `)
      .eq("id", params.id)
      .single();

  if (error) {
    console.log(error);
    return;
  }

setPedido(data);

setObservacao(
  data.observacao || ""
);

const {
  data: itensData,
} = await supabase
  .from("order_items")
  .select(`
    *,
    products (
      nome,
      preco
    )
  `)
  .eq(
    "order_id",
    Number(params.id)
  );

setItens(
  itensData || []
);

setLoading(false);
}

useEffect(() => {
  carregarPedido();
}, []);

async function atualizarStatus(
  status: string
) {
  if (
    status === "producao" &&
    !pedido.estoque_baixado
  ) {
    await baixarEstoquePedido();
  }

  const { error } =
    await supabase
      .from("orders")
      .update({
        status,
      })
      .eq(
        "id",
        Number(params.id)
      );

  if (error) {
    console.log(error);

    alert(
      "Erro ao atualizar status"
    );

    return;
  }

  await carregarPedido();
}

async function salvarPedido() {
  const { error } =
    await supabase
      .from("orders")
      .update({
        observacao,
      })
      .eq(
        "id",
        Number(params.id)
      );

  if (error) {
    console.log(error);

    alert(
      "Erro ao salvar pedido"
    );

    return;
  }

  alert(
    "Pedido atualizado"
  );

  carregarPedido();
}

 async function baixarEstoquePedido() {
  const {
    data: orderItems,
    error: itemsError,
  } = await supabase
    .from("order_items")
    .select("*")
    .eq(
      "order_id",
      Number(params.id)
    );

  if (
    itemsError ||
    !orderItems
  ) {
    console.log(itemsError);
    return;
  }

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) return;

  for (const item of orderItems) {
    const {
      data: materiais,
      error: materiaisError,
    } = await supabase
      .from(
        "product_materials"
      )
      .select("*")
      .eq(
        "product_id",
        item.product_id
      );

    if (
      materiaisError ||
      !materiais
    ) {
      console.log(
        materiaisError
      );

      continue;
    }

    for (const materialProduto of materiais) {
      const {
        data: material,
      } = await supabase
        .from("materials")
        .select("*")
        .eq(
          "id",
          materialProduto.material_id
        )
        .single();

      if (!material)
        continue;

      const quantidadeBaixa =
        Number(
          materialProduto.quantidade
        ) *
        Number(
          item.quantidade
        );

      const estoqueAtual =
        Number(
          material.estoque_atual || 0
        );

      const novoEstoque =
        estoqueAtual -
        quantidadeBaixa;

      const valorUnitario =
        Number(
          material.custo_unitario || 0
        );

      const valorTotal =
        valorUnitario *
        quantidadeBaixa;

      const {
        error:
          updateError,
      } = await supabase
        .from("materials")
        .update({
          estoque_atual:
            novoEstoque,
        })
        .eq(
          "id",
          material.id
        );

      if (
        updateError
      ) {
        console.log(
          updateError
        );

        continue;
      }

      await supabase
        .from(
          "material_movements"
        )
        .insert({
          material_id:
            material.id,

          user_id:
            user.id,

          tipo: "saida",

          quantidade:
            quantidadeBaixa,

          valor_unitario:
            valorUnitario,

          valor_total:
            valorTotal,

          observacao:
            `Pedido #${params.id}`,
        });
    }
  }

  await supabase
    .from("orders")
    .update({
      estoque_baixado:
        true,
    })
    .eq(
      "id",
      Number(params.id)
    );
}


if (loading) {
  return (
    <main className="p-8">
      Carregando...
    </main>
  );
}

  return (
    <main className="p-8">
      <h1 className="text-5xl font-black">
        Pedido #{pedido.id}
      </h1>

      <p className="mt-3 text-slate-500">
        Detalhes do pedido
      </p>
<div className="grid gap-6 md:grid-cols-2">
  <div className="rounded-3xl border border-slate-200 bg-white p-6">
    <h2 className="mb-2 text-sm font-semibold text-slate-500">
      Status
    </h2>

<select
  value={pedido.status}
  onChange={(e) =>
    atualizarStatus(
      e.target.value
    )
  }
  className="
    w-full
    rounded-xl
    border
    border-slate-300
    p-3
  "
>
  <option value="orcamento">
    Orçamento
  </option>

  <option value="aguardando_aprovacao">
    Aguardando Aprovação
  </option>

  <option value="aprovado">
    Aprovado
  </option>

  <option value="producao">
    Produção
  </option>

  <option value="finalizado">
    Finalizado
  </option>

  <option value="entregue">
    Entregue
  </option>

  <option value="cancelado">
    Cancelado
  </option>
</select>
  </div>

  <div className="rounded-3xl border border-slate-200 bg-white p-6">
    <h2 className="mb-2 text-sm font-semibold text-slate-500">
      Valor Total
    </h2>

    <p className="text-2xl font-bold text-green-600">
      R$ {Number(
        pedido.valor_total
      ).toFixed(2)}
    </p>
  </div>
</div>

<div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
  <h2 className="mb-4 text-xl font-bold">
    Observação do Pedido
  </h2>

  <textarea
    value={observacao}
    onChange={(e) =>
      setObservacao(
        e.target.value
      )
    }
    rows={4}
    className="
      w-full
      rounded-2xl
      border
      border-slate-300
      p-4
    "
  />

  <button
    onClick={salvarPedido}
    className="
      mt-4
      rounded-2xl
      bg-green-600
      px-6
      py-3
      font-bold
      text-white
    "
  >
    Salvar Alterações
  </button>
</div>

<div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
  <h2 className="mb-4 text-xl font-bold">
    Cliente
  </h2>

  <p>
    {pedido.clientes?.nome}
  </p>

  <p>
    {pedido.clientes?.telefone}
  </p>

  <p>
    {pedido.clientes?.email}
  </p>
</div>

<div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
  <h2 className="mb-4 text-xl font-bold">
    Itens do Pedido
  </h2>

  <table className="w-full">
    <thead>
      <tr className="border-b">
        <th className="p-3 text-left">
          Produto
        </th>

        <th className="p-3 text-left">
          Quantidade
        </th>

        <th className="p-3 text-left">
          Valor
        </th>
      </tr>
    </thead>

    <tbody>
      {itens.map(
        (item: any) => (
          <tr
            key={item.id}
            className="border-b"
          >
            <td className="p-3">
              {
                item.products
                  ?.nome
              }
            </td>

            <td className="p-3">
              {
                item.quantidade
              }
            </td>

            <td className="p-3">
              R$ {Number(
                item.valor_total
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