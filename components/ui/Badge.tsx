import type { ReactNode } from "react";

type VarianteSelo =
  | "neutro"
  | "sucesso"
  | "aviso"
  | "perigo";

/* Contraste do texto sobre o fundo (todos acima de 4,5:1):
   neutro ~14:1, sucesso ~9:1, aviso ~7:1, perigo ~5,7:1 */
const estilos: Record<VarianteSelo, string> = {
  neutro: "bg-fundo text-texto border-borda",
  sucesso:
    "bg-destaque-suave text-destaque-escuro border-destaque-suave",
  aviso: "bg-aviso-fundo text-aviso-texto border-aviso-fundo",
  perigo: "bg-perigo-suave text-perigo border-perigo-suave",
};

interface BadgeProps {
  variante?: VarianteSelo;
  children: ReactNode;
  className?: string;
}

export function Badge({
  variante = "neutro",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        border
        px-3
        py-1
        text-base
        font-bold
        leading-tight
        whitespace-nowrap
        ${estilos[variante]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
