import type { ButtonHTMLAttributes } from "react";

import {
  classeBotao,
  type VarianteBotao,
} from "@/components/ui/estiloBotao";
import { Icone, type NomeIcone } from "@/components/ui/Icone";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  larguraTotal?: boolean;
  carregando?: boolean;
  /** Nome do ícone. O botão sempre tem texto ao lado do ícone. */
  icone?: NomeIcone;
}

export function Button({
  variante = "primario",
  larguraTotal = false,
  carregando = false,
  icone,
  type = "button",
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={classeBotao({ variante, larguraTotal, className })}
    >
      {carregando ? (
        "Aguarde..."
      ) : (
        <>
          {icone && <Icone nome={icone} />}
          {children}
        </>
      )}
    </button>
  );
}
