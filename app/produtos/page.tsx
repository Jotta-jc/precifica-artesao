"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

export default function ProdutosPage() {
  const [openModal, setOpenModal] =
    useState(false);

  const [products, setProducts] =
    useState<any[]>([]);

  const [nome, setNome] =
    useState("");

  const [categoria, setCategoria] =
    useState("");

  const [preco, setPreco] =
    useState("");

  const [
    editingProductId,
    setEditingProductId,
  ] = useState<number | null>(null);

  async function carregarProdutos() {
    const { data, error } =
      await supabase
        .from("products")
        .select("*")
        .order("id", {
          ascending: false,
        });

    if (error) {
      console.log(error);
      return;
    }

    setProducts(data || []);
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function salvarProduto() {
    if (
      !nome ||
      !categoria ||
      !preco
    ) {
      alert(
        "Preencha todos os campos"
      );

      return;
    }

    if (editingProductId) {
      const { error } =
        await supabase
          .from("products")
          .update({
            nome,
            categoria,
            preco: Number(preco),
          })
          .eq(
            "id",
            editingProductId
          );

      if (error) {
        console.log(error);

        alert(
          "Erro ao atualizar produto"
        );

        return;
      }

      alert(
        "Produto atualizado com sucesso ✏️"
      );
    } else {
      const { error } =
        await supabase
          .from("products")
          .insert({
            nome,
            categoria,
            preco: Number(preco),
          });

      if (error) {
        console.log(error);

        alert(error.message);

        return;
      }

      alert(
        "Produto salvo com sucesso 🚀"
      );
    }

    setNome("");
    setCategoria("");
    setPreco("");

    setEditingProductId(null);

    setOpenModal(false);

    carregarProdutos();
  }

  async function excluirProduto(
    id: number
  ) {
    const confirmar = confirm(
      "Deseja realmente excluir este produto?"
    );

    if (!confirmar) return;

    const { error } =
      await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) {
      console.log(error);

      alert(
        "Erro ao excluir produto"
      );

      return;
    }

    alert(
      "Produto excluído com sucesso 🗑️"
    );

    carregarProdutos();
  }

  return (
    <main className="bg-gray-100 p-4 md:p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 md:text-5xl">
          Produtos
        </h1>

        <p className="mt-3 text-base text-gray-500 md:text-xl">
          Cadastro de produtos do sistema 📦
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => {
            setEditingProductId(
              null
            );

            setNome("");
            setCategoria("");
            setPreco("");

            setOpenModal(true);
          }}
          className="
            rounded-2xl
            bg-slate-900
            px-6
            py-4
            text-base
            font-bold
            text-white
            transition-all
            hover:bg-slate-800
            md:text-xl
          "
        >
          + Novo Produto
        </button>
      </div>

      <div
        className="
          overflow-x-auto
          rounded-3xl
          border
          border-gray-200
          bg-white
          p-4
          shadow-sm
          md:p-6
        "
      >
        <table className="min-w-[1000px] w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="p-4 text-left text-sm font-semibold text-gray-500 md:text-lg">
                ID
              </th>

              <th className="p-4 text-left text-sm font-semibold text-gray-500 md:text-lg">
                Produto
              </th>

              <th className="p-4 text-left text-sm font-semibold text-gray-500 md:text-lg">
                Categoria
              </th>

              <th className="p-4 text-left text-sm font-semibold text-gray-500 md:text-lg">
                Preço
              </th>

              <th className="p-4 text-left text-sm font-semibold text-gray-500 md:text-lg">
                Status
              </th>

              <th className="p-4 text-left text-sm font-semibold text-gray-500 md:text-lg">
                Ações
              </th>
            </tr>
          </thead>

          <tbody>
            {products.map(
              (product) => (
                <tr
                  key={product.id}
                  className="border-b border-slate-100"
                >
                  <td className="p-4 text-sm font-bold text-slate-900 md:text-lg">
                    #{product.id}
                  </td>

                  <td className="p-4 text-sm text-slate-900 md:text-lg">
                    {product.nome}
                  </td>

                  <td className="p-4 text-sm text-slate-900 md:text-lg">
                    {
                      product.categoria
                    }
                  </td>

                  <td className="p-4 text-sm text-slate-900 md:text-lg">
                    R${" "}
                    {Number(
                      product.preco
                    ).toFixed(2)}
                  </td>

                  <td className="p-4">
                    <span
                      className="
                        rounded-full
                        bg-green-100
                        px-4
                        py-2
                        text-xs
                        font-bold
                        text-green-700
                        md:text-sm
                      "
                    >
                      Ativo
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/produtos/${product.id}`}
                        className="
                          inline-flex
                          items-center
                          justify-center
                          rounded-xl
                          bg-slate-900
                          px-4
                          py-3
                          text-sm
                          font-bold
                          text-white
                          transition-all
                          hover:bg-slate-800
                        "
                      >
                        Detalhes
                      </Link>

                      <button
                        onClick={() => {
                          setEditingProductId(
                            product.id
                          );

                          setNome(
                            product.nome
                          );

                          setCategoria(
                            product.categoria
                          );

                          setPreco(
                            String(
                              product.preco
                            )
                          );

                          setOpenModal(
                            true
                          );
                        }}
                        className="
                          rounded-xl
                          bg-blue-600
                          px-4
                          py-3
                          text-sm
                          font-bold
                          text-white
                          transition-all
                          hover:bg-blue-700
                        "
                      >
                        Editar
                      </button>

                      <button
                        onClick={() =>
                          excluirProduto(
                            product.id
                          )
                        }
                        className="
                          rounded-xl
                          bg-red-600
                          px-4
                          py-3
                          text-sm
                          font-bold
                          text-white
                          transition-all
                          hover:bg-red-700
                        "
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {openModal && (
        <div
          className="
            fixed
            inset-0
            z-[999]
            flex
            items-center
            justify-center
            bg-black/50
            p-5
          "
        >
          <div
            className="
              w-full
              max-w-lg
              rounded-3xl
              bg-white
              p-6
              shadow-2xl
              md:p-8
            "
          >
            <h2 className="mb-6 text-2xl font-bold text-slate-900 md:text-3xl">
              {editingProductId
                ? "Editar Produto"
                : "Novo Produto"}
            </h2>

            <input
              placeholder="Nome"
              value={nome}
              onChange={(e) =>
                setNome(
                  e.target.value
                )
              }
              className="
                mb-4
                w-full
                rounded-2xl
                border
                border-slate-300
                p-4
                text-base
                outline-none
                transition-all
                focus:border-slate-900
              "
            />

            <input
              placeholder="Categoria"
              value={categoria}
              onChange={(e) =>
                setCategoria(
                  e.target.value
                )
              }
              className="
                mb-4
                w-full
                rounded-2xl
                border
                border-slate-300
                p-4
                text-base
                outline-none
                transition-all
                focus:border-slate-900
              "
            />

            <input
              placeholder="Preço"
              type="number"
              value={preco}
              onChange={(e) =>
                setPreco(
                  e.target.value
                )
              }
              className="
                mb-6
                w-full
                rounded-2xl
                border
                border-slate-300
                p-4
                text-base
                outline-none
                transition-all
                focus:border-slate-900
              "
            />

            <div className="flex flex-wrap justify-end gap-3">
              <button
                onClick={() => {
                  setOpenModal(
                    false
                  );

                  setEditingProductId(
                    null
                  );
                }}
                className="
                  rounded-2xl
                  bg-slate-200
                  px-5
                  py-3
                  font-semibold
                  text-slate-700
                  transition-all
                  hover:bg-slate-300
                "
              >
                Cancelar
              </button>

              <button
                onClick={
                  salvarProduto
                }
                className="
                  rounded-2xl
                  bg-slate-900
                  px-5
                  py-3
                  font-bold
                  text-white
                  transition-all
                  hover:bg-slate-800
                "
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}