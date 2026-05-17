"use client";

import { useEffect, useState } from "react";

import { ClienteForm } from "@/components/clientes/ClienteForm";

import {
  createCliente,
  getClientes,
} from "@/services/clientes.service";

import {
  Cliente,
  CreateClienteDTO,
} from "@/types/client";

export default function ClientesPage() {
  const [clientes, setClientes] =
    useState<Cliente[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  useEffect(() => {
    loadClientes();
  }, []);

  async function loadClientes() {
    try {
      const data =
        await getClientes();

      setClientes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCliente(
    data: CreateClienteDTO
  ) {
    try {
      const novoCliente =
        await createCliente(data);

      setClientes((prev) => [
        novoCliente,
        ...prev,
      ]);

      setShowForm(false);
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao cadastrar cliente"
      );
    }
  }

  return (
    <div className="p-8">
      <div
        className="
          mb-8
          flex
          items-center
          justify-between
        "
      >
        <div>
          <h1
            className="
              text-6xl
              font-bold
              text-slate-900
            "
          >
            Clientes
          </h1>

          <p
            className="
              text-slate-500
              text-2xl
              mt-2
            "
          >
            Gestão estratégica de clientes 👥
          </p>
        </div>

        <button
          onClick={() =>
            setShowForm(!showForm)
          }
          className="
            inline-flex
            items-center
            justify-center

            bg-[#0B1739]
            hover:bg-[#152250]

            transition-all

            text-white
            font-semibold

            px-6
            py-3

            rounded-xl

            shadow-md
          "
        >
          {showForm
            ? "Fechar"
            : "+ Novo Cliente"}
        </button>
      </div>

      {showForm && (
        <div
          className="
            bg-white
            rounded-[32px]
            shadow-sm
            border
            border-slate-200

            p-8
            mb-8
          "
        >
          <h2
            className="
              text-3xl
              font-bold
              text-slate-900
              mb-6
            "
          >
            Cadastrar Cliente
          </h2>

          <ClienteForm
            onSubmit={
              handleCreateCliente
            }
          />
        </div>
      )}

      <div
        className="
          bg-white
          rounded-[32px]
          shadow-sm
          border
          border-slate-200
          overflow-hidden
        "
      >
        {loading ? (
          <div className="p-12">
            <p
              className="
                text-slate-500
                text-xl
              "
            >
              Carregando clientes...
            </p>
          </div>
        ) : clientes.length === 0 ? (
          <div
            className="
              flex
              flex-col
              items-center
              justify-center

              py-24
            "
          >
            <h2
              className="
                text-3xl
                font-bold
                text-slate-800
              "
            >
              Nenhum cliente cadastrado
            </h2>

            <p
              className="
                text-slate-500
                text-xl
                mt-3
              "
            >
              Comece cadastrando seu primeiro cliente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="
                    border-b
                    border-slate-200
                  "
                >
                  <th
                    className="
                      text-left
                      p-6
                      text-slate-500
                      text-xl
                    "
                  >
                    Nome
                  </th>

                  <th
                    className="
                      text-left
                      p-6
                      text-slate-500
                      text-xl
                    "
                  >
                    Email
                  </th>

                  <th
                    className="
                      text-left
                      p-6
                      text-slate-500
                      text-xl
                    "
                  >
                    Telefone
                  </th>

                  <th
                    className="
                      text-left
                      p-6
                      text-slate-500
                      text-xl
                    "
                  >
                    Tipo
                  </th>
                </tr>
              </thead>

              <tbody>
                {clientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="
                      border-b
                      border-slate-100
                    "
                  >
                    <td
                      className="
                        p-6
                        text-slate-900
                        font-semibold
                        text-xl
                      "
                    >
                      {cliente.nome}
                    </td>

                    <td
                      className="
                        p-6
                        text-slate-600
                        text-lg
                      "
                    >
                      {cliente.email || "-"}
                    </td>

                    <td
                      className="
                        p-6
                        text-slate-600
                        text-lg
                      "
                    >
                      {cliente.telefone || "-"}
                    </td>

                    <td className="p-6">
                      <span
                        className="
                          bg-emerald-100
                          text-emerald-700

                          px-4
                          py-2

                          rounded-full

                          text-sm
                          font-semibold
                        "
                      >
                        {cliente.tipo_cliente}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}