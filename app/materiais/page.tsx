"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MateriaisPage() {
  const supabase = createClient();
  const [materiais, setMateriais] = useState<any[]>([]);

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [unidade, setUnidade] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");

  const [
  quantidadeComprada,
  setQuantidadeComprada,
] = useState("");

  const [openModal, setOpenModal] =
    useState(false);

  const [
    editingMaterialId,
    setEditingMaterialId,
  ] = useState<number | null>(null);

  useEffect(() => {
    carregarMateriais();
  }, []);

  async function carregarMateriais() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log(error);

      return;
    }

    setMateriais(data || []);
  }

  async function salvarMaterial() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("Usuário não autenticado");

      return;
    }

    if (
      !nome ||
      !categoria ||
      !unidade ||
      !preco
    ) {
      alert("Preencha todos os campos");

      return;
    }

    // EDITAR
    if (editingMaterialId) {
      const { error } = await supabase
        .from("materials")
.update({
  nome,
  categoria,
  unidade,

  quantidade_comprada:
    Number(
      quantidadeComprada
    ),

  preco: Number(preco),

  estoque: Number(
  quantidadeComprada
),

  estoque_atual:
    Number(
      quantidadeComprada
    ),
})
        .eq("id", editingMaterialId);

      if (error) {
        console.log(error);

        alert(error.message);

        return;
      }

      alert("Material atualizado 🚀");
    }

    // NOVO
    else {
      const { error } = await supabase
        .from("materials")
.insert([
  {
    user_id: session.user.id,

    nome,
    categoria,
    unidade,

    quantidade_comprada:
      Number(
        quantidadeComprada
      ),

    preco: Number(preco),

    estoque: Number(
  quantidadeComprada
),

    estoque_atual:
      Number(
        quantidadeComprada
      ),
  },
])

      if (error) {
        console.log(error);

        alert(error.message);

        return;
      }

      alert("Material salvo com sucesso 🚀");
    }

    setNome("");
    setCategoria("");
    setUnidade("");
    setPreco("");
    setEstoque("");

    setEditingMaterialId(null);

    setOpenModal(false);

    carregarMateriais();
  }

  async function excluirMaterial(id: number) {
    const confirmar = confirm(
      "Deseja excluir este material?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", id);

    if (error) {
      console.log(error);

      alert(error.message);

      return;
    }

    carregarMateriais();
  }

  return (
    <main
      style={{
        padding: "32px",
        backgroundColor: "#f3f4f6",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          marginBottom: "40px",
        }}
      >
        <h1
          style={{
            fontSize: "52px",
            color: "#111827",
            marginBottom: "16px",
            lineHeight: 1.1,
          }}
        >
          Materiais
        </h1>

        <p
          style={{
            fontSize: "24px",
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          Cadastro de insumos e materiais 🧶
        </p>
      </div>

      <button
        onClick={() => {
          setEditingMaterialId(null);

          setNome("");
          setCategoria("");
          setUnidade("");
          setPreco("");
          setEstoque("");

          setOpenModal(true);
        }}
        style={{
          backgroundColor: "#0f172a",
          color: "#ffffff",
          border: "none",
          padding: "18px 28px",
          borderRadius: "16px",
          fontSize: "18px",
          fontWeight: "bold",
          cursor: "pointer",
          marginBottom: "30px",
        }}
      >
        + Novo Material
      </button>

      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          padding: "24px",
          border: "1px solid #e5e7eb",
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "1000px",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom:
                  "1px solid #e5e7eb",
              }}
            >
              <th
                style={{
                  textAlign: "left",
                  padding: "16px",
                  color: "#64748b",
                  fontSize: "18px",
                }}
              >
                ID
              </th>

              <th
                style={{
                  textAlign: "left",
                  padding: "16px",
                  color: "#64748b",
                  fontSize: "18px",
                }}
              >
                Nome
              </th>

              <th
                style={{
                  textAlign: "left",
                  padding: "16px",
                  color: "#64748b",
                  fontSize: "18px",
                }}
              >
                Categoria
              </th>

              <th
                style={{
                  textAlign: "left",
                  padding: "16px",
                  color: "#64748b",
                  fontSize: "18px",
                }}
              >
                Unidade
              </th>

              <th
                style={{
                  textAlign: "left",
                  padding: "16px",
                  color: "#64748b",
                  fontSize: "18px",
                }}
              >
                Preço
              </th>

              <th
  style={{
    textAlign: "left",
    padding: "16px",
    color: "#64748b",
    fontSize: "18px",
  }}
>
  Custo Unitário
</th>

              <th
                style={{
                  textAlign: "left",
                  padding: "16px",
                  color: "#64748b",
                  fontSize: "18px",
                }}
              >
                Estoque Atual
              </th>

              <th
                style={{
                  textAlign: "left",
                  padding: "16px",
                  color: "#64748b",
                  fontSize: "18px",
                }}
              >
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {materiais.map((material) => (
              <tr
                key={material.id}
                style={{
                  borderBottom:
                    "1px solid #f1f5f9",
                }}
              >
                <td
                  style={{
                    padding: "20px 16px",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  #{material.id}
                </td>

                <td
                  style={{
                    padding: "20px 16px",
                    fontSize: "18px",
                  }}
                >
                  {material.nome}
                </td>

                <td
                  style={{
                    padding: "20px 16px",
                    fontSize: "18px",
                  }}
                >
                  {material.categoria}
                </td>

                <td
                  style={{
                    padding: "20px 16px",
                    fontSize: "18px",
                  }}
                >
                  {material.unidade}
                </td>

                <td
                  style={{
                    padding: "20px 16px",
                    fontSize: "18px",
                  }}
                >
                  R${" "}
                  {Number(
                    material.preco
                  ).toFixed(2)}
                </td>

                <td
  style={{
    padding: "20px 16px",
    fontSize: "18px",
  }}
>
  R${" "}
  {(
    Number(material.preco || 0) /
    Number(
      material.quantidade_comprada || 1
    )
  ).toFixed(4)}
</td>

                <td
                  style={{
                    padding: "20px 16px",
                    fontSize: "18px",
                  }}
                >
                  {material.estoque_atual}
                </td>

                <td
                  style={{
                    padding: "20px 16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                    }}
                  >
                    <button
                      onClick={() => {
                        setEditingMaterialId(
                          material.id
                        );

                        setNome(
                          material.nome
                        );

                        setCategoria(
                          material.categoria
                        );

                        setUnidade(
                          material.unidade
                        );

                        setPreco(
                          String(
                            material.preco
                          )
                        );

                        setQuantidadeComprada(
  String(
    material.quantidade_comprada || 0
  )
);

                        setEstoque(
                          String(
                            material.estoque
                          )
                        );

                        setOpenModal(true);
                      }}
                      style={{
                        backgroundColor:
                          "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        padding:
                          "12px 18px",
                        borderRadius:
                          "12px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        excluirMaterial(
                          material.id
                        )
                      }
                      style={{
                        backgroundColor:
                          "#dc2626",
                        color: "#ffffff",
                        border: "none",
                        padding:
                          "12px 18px",
                        borderRadius:
                          "12px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor:
              "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "32px",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "500px",
            }}
          >
            <h2
              style={{
                fontSize: "32px",
                marginBottom: "24px",
              }}
            >
              {editingMaterialId
                ? "Editar Material"
                : "Novo Material"}
            </h2>

            <input
              placeholder="Nome"
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
              style={{
                width: "100%",
                padding: "16px",
                marginBottom: "16px",
                borderRadius: "14px",
                border:
                  "1px solid #cbd5e1",
                fontSize: "18px",
              }}
            />

            <input
              placeholder="Categoria"
              value={categoria}
              onChange={(e) =>
                setCategoria(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                padding: "16px",
                marginBottom: "16px",
                borderRadius: "14px",
                border:
                  "1px solid #cbd5e1",
                fontSize: "18px",
              }}
            />

<select
  value={unidade}
  onChange={(e) =>
    setUnidade(
      e.target.value
    )
  }
  style={{
    width: "100%",
    padding: "16px",
    marginBottom: "16px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    fontSize: "18px",
  }}
>
  <option value="">
    Selecione a unidade
  </option>

  <option value="g">
    Grama (g)
  </option>

  <option value="m">
    Metro (m)
  </option>

  <option value="un">
    Unidade (un)
  </option>
</select>

<input
  type="number"
  placeholder="Quantidade Comprada"
  value={quantidadeComprada}
  onChange={(e) =>
    setQuantidadeComprada(
      e.target.value
    )
  }
  style={{
    width: "100%",
    padding: "16px",
    marginBottom: "16px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    fontSize: "18px",
  }}
/>
            <input
              type="number"
              placeholder="Preço"
              value={preco}
              onChange={(e) =>
                setPreco(e.target.value)
              }
              style={{
                width: "100%",
                padding: "16px",
                marginBottom: "16px",
                borderRadius: "14px",
                border:
                  "1px solid #cbd5e1",
                fontSize: "18px",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "12px",
              }}
            >
              <button
                onClick={salvarMaterial}
                style={{
                  flex: 1,
                  backgroundColor:
                    "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  padding: "16px",
                  borderRadius: "14px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Salvar
              </button>

              <button
                onClick={() =>
                  setOpenModal(false)
                }
                style={{
                  flex: 1,
                  backgroundColor:
                    "#e5e7eb",
                  color: "#111827",
                  border: "none",
                  padding: "16px",
                  borderRadius: "14px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
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