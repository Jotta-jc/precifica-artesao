import type { ButtonHTMLAttributes } from "react";

import { Icone, type NomeIcone } from "@/components/ui/Icone";

type Variante =
  | "primario"
  | "secundario"
  | "perigo"
  | "discreto";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  larguraTotal?: boolean;
  carregando?: boolean;
  /** Nome do ícone. O botão sempre tem texto ao lado do ícone. */
  icone?: NomeIcone;
}

const estilos: Record<Variante, string> = {
  primario:
    "bg-destaque text-white border-2 border-destaque hover:bg-destaque-escuro hover:border-destaque-escuro",
  secundario:
    "bg-cartao text-destaque border-2 border-destaque hover:bg-destaque-suave",
  perigo:
    "bg-perigo text-white border-2 border-perigo hover:brightness-90",
  discreto:
    "bg-transparent text-destaque border-2 border-transparent hover:bg-destaque-suave",
};

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
      className={`
        inline-flex
        min-h-12
        items-center
        justify-center
        gap-2
        rounded-2xl
        px-5
        py-2
        text-lg
        font-bold
        leading-tight
        transition-colors
        focus-visible:outline-none
        focus-visible:ring-[3px]
        focus-visible:ring-destaque
        focus-visible:ring-offset-2
        focus-visible:ring-offset-fundo
        disabled:cursor-not-allowed
        disabled:opacity-60
        ${larguraTotal ? "w-full" : ""}
        ${estilos[variante]}
        ${className}
      `}
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
