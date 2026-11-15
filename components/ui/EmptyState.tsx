import type { ReactNode } from "react";

import { Icone, type NomeIcone } from "@/components/ui/Icone";

interface EmptyStateProps {
  icone?: NomeIcone;
  titulo: string;
  texto?: string;
  /** Ex.: um botão "Cadastrar o primeiro cliente". */
  acao?: ReactNode;
}

export function EmptyState({
  icone = "informacao",
  titulo,
  texto,
  acao,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-borda bg-cartao px-5 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destaque-suave text-destaque">
        <Icone nome={icone} tamanho={28} />
      </span>

      <h2 className="text-xl font-bold text-texto">
        {titulo}
      </h2>

      {texto && (
        <p className="max-w-md text-lg text-texto-suave">
          {texto}
        </p>
      )}

      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}
