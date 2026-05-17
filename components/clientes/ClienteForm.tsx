"use client";

import { useState } from "react";

import {
  CreateClienteDTO,
} from "@/types/client";

interface ClienteFormProps {
  onSubmit: (
    data: CreateClienteDTO
  ) => Promise<void>;
}

export function ClienteForm({
  onSubmit,
}: ClienteFormProps) {
  const [loading, setLoading] =
    useState(false);

  const [formData, setFormData] =
    useState<CreateClienteDTO>({
      nome: "",
      email: "",
      telefone: "",
      instagram: "",
      tipo_cliente: "cliente",
      observacoes: "",
    });

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      await onSubmit(formData);

      setFormData({
        nome: "",
        email: "",
        telefone: "",
        instagram: "",
        tipo_cliente: "cliente",
        observacoes: "",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            className="
              block
              text-sm
              font-medium
              text-slate-700
              mb-2
            "
          >
            Nome do Cliente
          </label>

          <input
            type="text"
            required
            value={formData.nome}
            onChange={(e) =>
              setFormData({
                ...formData,
                nome: e.target.value,
              })
            }
            className="
              w-full
              rounded-xl
              border
              border-slate-300
              px-4
              py-3
              outline-none
              focus:ring-2
              focus:ring-blue-500
            "
            placeholder="Ex: Maria Silva"
          />
        </div>

        <div>
          <label
            className="
              block
              text-sm
              font-medium
              text-slate-700
              mb-2
            "
          >
            Email
          </label>

          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({
                ...formData,
                email: e.target.value,
              })
            }
            className="
              w-full
              rounded-xl
              border
              border-slate-300
              px-4
              py-3
              outline-none
              focus:ring-2
              focus:ring-blue-500
            "
            placeholder="cliente@email.com"
          />
        </div>

        <div>
          <label
            className="
              block
              text-sm
              font-medium
              text-slate-700
              mb-2
            "
          >
            Telefone
          </label>

          <input
            type="text"
            value={formData.telefone}
            onChange={(e) =>
              setFormData({
                ...formData,
                telefone: e.target.value,
              })
            }
            className="
              w-full
              rounded-xl
              border
              border-slate-300
              px-4
              py-3
              outline-none
              focus:ring-2
              focus:ring-blue-500
            "
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <label
            className="
              block
              text-sm
              font-medium
              text-slate-700
              mb-2
            "
          >
            Instagram
          </label>

          <input
            type="text"
            value={formData.instagram}
            onChange={(e) =>
              setFormData({
                ...formData,
                instagram: e.target.value,
              })
            }
            className="
              w-full
              rounded-xl
              border
              border-slate-300
              px-4
              py-3
              outline-none
              focus:ring-2
              focus:ring-blue-500
            "
            placeholder="@cliente"
          />
        </div>
      </div>

      <div>
        <label
          className="
            block
            text-sm
            font-medium
            text-slate-700
            mb-2
          "
        >
          Tipo de Cliente
        </label>

        <select
          value={formData.tipo_cliente}
          onChange={(e) =>
            setFormData({
              ...formData,
              tipo_cliente: e.target
                .value as CreateClienteDTO["tipo_cliente"],
            })
          }
          className="
            w-full
            rounded-xl
            border
            border-slate-300
            px-4
            py-3
            outline-none
            focus:ring-2
            focus:ring-blue-500
          "
        >
          <option value="cliente">
            Cliente
          </option>

          <option value="revendedor">
            Revendedor
          </option>

          <option value="parceiro">
            Parceiro
          </option>
        </select>
      </div>

      <div>
        <label
          className="
            block
            text-sm
            font-medium
            text-slate-700
            mb-2
          "
        >
          Observações
        </label>

        <textarea
          value={formData.observacoes}
          onChange={(e) =>
            setFormData({
              ...formData,
              observacoes: e.target.value,
            })
          }
          rows={4}
          className="
            w-full
            rounded-xl
            border
            border-slate-300
            px-4
            py-3
            outline-none
            focus:ring-2
            focus:ring-blue-500
          "
          placeholder="Observações importantes sobre o cliente..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="
          bg-[#0B1739]
          hover:bg-[#152250]

          transition-all

          text-white
          font-semibold

          px-6
          py-3

          rounded-xl

          disabled:opacity-50
        "
      >
        {loading
          ? "Salvando..."
          : "Salvar Cliente"}
      </button>
    </form>
  );
}