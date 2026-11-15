/* Aparência compartilhada pelo Button (<button>) e pelo LinkBotao (<Link>).
   Mudou aqui, muda nos dois. */

export type VarianteBotao =
  | "primario"
  | "secundario"
  | "perigo"
  | "discreto";

const estilosVariante: Record<VarianteBotao, string> = {
  primario:
    "bg-destaque text-white border-2 border-destaque hover:bg-destaque-escuro hover:border-destaque-escuro",
  secundario:
    "bg-cartao text-destaque border-2 border-destaque hover:bg-destaque-suave",
  perigo:
    "bg-perigo text-white border-2 border-perigo hover:brightness-90",
  discreto:
    "bg-transparent text-destaque border-2 border-transparent hover:bg-destaque-suave",
};

export function classeBotao({
  variante = "primario",
  larguraTotal = false,
  className = "",
}: {
  variante?: VarianteBotao;
  larguraTotal?: boolean;
  className?: string;
}) {
  return `
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
    ${estilosVariante[variante]}
    ${className}
  `;
}
