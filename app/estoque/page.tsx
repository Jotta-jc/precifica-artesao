"use client";

import { useState } from "react";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
export default function EstoquePage() {
    const supabase = createClient();
    const [materials, setMaterials] =
  useState<any[]>([]);

const [
  movements,
  setMovements,
] = useState<any[]>([]);

  const [
  selectedMaterialId,
  setSelectedMaterialId,
] = useState("");

const [quantidade, setQuantidade] =
  useState("");

  const [valorPago, setValorPago] =
  useState("");

  const [observacao, setObservacao] =
  useState("");

  const selectedMaterial =
  materials.find(
    (material) =>
      String(material.id) ===
      selectedMaterialId
  );

  const custoUnitario =
  Number(valorPago || 0) /
  Number(quantidade || 1);

async function registrarEntrada() {
  if (!selectedMaterialId) {
    alert("Selecione um material");
    return;
  }

  if (
    Number(quantidade) <= 0
  ) {
    alert("Informe a quantidade");
    return;
  }

  if (
    Number(valorPago) <= 0
  ) {
    alert("Informe o valor pago");
    return;
  }

  const material =
    materials.find(
      (item) =>
        String(item.id) ===
        selectedMaterialId
    );

  if (!material) return;

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) return;

  const { error: movementError } =
    await supabase
      .from(
        "material_movements"
      )
      .insert({
        material_id:
          material.id,

        user_id:
          user.id,

        tipo: "entrada",

        quantidade:
          Number(
            quantidade
          ),

        valor_total:
          Number(
            valorPago
          ),

        valor_unitario:
          custoUnitario,

observacao:
  observacao ||
  "Entrada manual",
      });

  if (movementError) {
    console.log(
      movementError
    );

    alert(
      "Erro ao registrar movimentação"
    );

    return;
  }

  const novoEstoque =
    Number(
      material.estoque_atual || 0
    ) +
    Number(quantidade);

  const {
    error: materialError,
  } = await supabase
    .from("materials")
    .update({
      estoque_atual:
        novoEstoque,

      custo_unitario:
        custoUnitario,
    })
    .eq(
      "id",
      material.id
    );

  if (materialError) {
    console.log(
      materialError
    );

    alert(
      "Erro ao atualizar estoque"
    );

    return;
  }

  alert(
    "Entrada registrada com sucesso"
  );

  setQuantidade("");
setObservacao("");
  setSelectedMaterialId("");

  carregarMateriais();
}

async function carregarMateriais() {
  const { data, error } =
    await supabase
      .from("materials")
      .select("*")
      .order("nome");

  if (error) {
    console.log(error);

    alert(
      "Erro ao carregar materiais"
    );

    return;
  }

  setMaterials(data || []);
}

async function carregarMovimentacoes() {
  const { data, error } =
    await supabase
      .from(
        "material_movements"
      )
      .select(`
        *,
        materials (
          nome
        )
      `)
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

  if (error) {
    console.log(error);

    return;
  }

  setMovements(
    data || []
  );
}

useEffect(() => {
  carregarMateriais();

  carregarMovimentacoes();
}, []);

console.log(
  "MATERIAIS",
  materials
);

console.log(
  "MOVIMENTOS",
  movements
);

return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-5xl font-black text-slate-900">
          Estoque
        </h1>

        <p className="mt-3 text-xl text-slate-500">
          Entrada e movimentação de materiais
        </p>
      </div>

<div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
  <h2 className="text-2xl font-bold text-slate-900">
    Registrar Entrada
  </h2>

  <p className="mt-2 text-slate-500">
    Adicione novas compras ao estoque
  </p>

  <div className="mt-8">
    <label className="mb-2 block text-sm font-semibold text-slate-500">
      Material
    </label>

    <select
      value={selectedMaterialId}
      onChange={(e) =>
        setSelectedMaterialId(
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
        Selecione um material
      </option>

      {materials.map(
        (material) => (
          <option
            key={material.id}
            value={material.id}
          >
            {material.nome}
          </option>
        )
      )}
    </select>

    <div className="mt-6">
<label className="mb-2 block text-sm font-semibold text-slate-500">
  Quantidade Comprada

  {selectedMaterial && (
    <span className="ml-2 text-green-600">
      ({selectedMaterial.unidade})
    </span>
  )}
</label>

  <input
    type="number"
    value={quantidade}
    onChange={(e) =>
      setQuantidade(
        e.target.value
      )
    }
    placeholder="Ex: 500"
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
    Valor Pago
  </label>

  <input
    type="number"
    step="0.01"
    value={valorPago}
    onChange={(e) =>
      setValorPago(
        e.target.value
      )
    }
    placeholder="Ex: 55.00"
    className="
      w-full
      rounded-2xl
      border
      border-slate-300
      p-4
    "
  />
</div>

<div className="mt-6 rounded-2xl bg-green-50 p-4 border border-green-200">
  <p className="text-sm text-green-700">
    Custo Unitário Calculado
  </p>

  <h3 className="mt-2 text-2xl font-bold text-green-900">
    R$ {custoUnitario.toFixed(4)}
  </h3>
</div>
<div className="mt-6">
  <label className="mb-2 block text-sm font-semibold text-slate-500">
    Observação
  </label>

  <input
    type="text"
    value={observacao}
    onChange={(e) =>
      setObservacao(
        e.target.value
      )
    }
    placeholder="Ex: Compra Shopee"
    className="
      w-full
      rounded-2xl
      border
      border-slate-300
      p-4
    "
  />
</div>
<button
  onClick={
    registrarEntrada
  }
  className="
    mt-6
    rounded-2xl
    bg-green-600
    px-6
    py-4
    font-bold
    text-white
    hover:bg-green-700
  "
>
  Registrar Entrada
</button>

  </div>
</div>
<div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
  <h2 className="text-2xl font-bold text-slate-900">
    Histórico de Movimentações
  </h2>

  <div className="mt-6 overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-slate-200 text-left">
          <th className="p-3">
            Data
          </th>

          <th className="p-3">
            Material
          </th>

          <th className="p-3">
            Tipo
          </th>

          <th className="p-3">
            Quantidade
          </th>

          <th className="p-3">
            Valor
          </th>
<th className="p-3">
  Observação
</th>

        </tr>
      </thead>

      <tbody>
        {movements.map(
          (movement) => (
            <tr
              key={movement.id}
              className="border-b border-slate-100"
            >
              <td className="p-3">
                {new Date(
                  movement.created_at
                ).toLocaleDateString(
                  "pt-BR"
                )}
              </td>

              <td className="p-3">
                {
                  movement
                    .materials
                    ?.nome
                }
              </td>

              <td className="p-3">
                {movement.tipo}
              </td>

              <td className="p-3">
                {
                  movement.quantidade
                }
              </td>

              <td className="p-3">
                R${" "}
                {Number(
                  movement.valor_total ||
                    0
                ).toFixed(2)}
              </td>
              <td className="p-3">
  {movement.observacao}
</td>
            </tr>
          )
        )}
      </tbody>
    </table>
  </div>
</div>
    </main>
  );
}