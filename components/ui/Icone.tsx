import type { ReactNode } from "react";

/* Ícones de linha desenhados à mão (sem biblioteca externa).
   Sempre usar com texto ao lado: o ícone é decorativo (aria-hidden). */
const desenhos = {
  inicio: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M10 21v-6h4v6" />
    </>
  ),
  materiais: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M4.5 8.5c5 0 10 3 13 10" />
      <path d="M8 4c4 2 8 7 9 13" />
      <path d="M3.5 13c4 0 8 2 10 7.5" />
    </>
  ),
  produtos: (
    <>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="m3 8 9 5 9-5" />
      <path d="M12 13v8" />
    </>
  ),
  vendas: (
    <>
      <path d="M6 7h12l1 14H5L6 7Z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </>
  ),
  vitrine: (
    <>
      <path d="M4 10v10h16V10" />
      <path d="M2.5 10 4.5 4h15l2 6Z" />
      <path d="M9 20v-5h6v5" />
    </>
  ),
  atelie: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.9 1.2-1.7-.4-1 .3-2.3 1.5-2.3H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10Z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="9.5" cy="7" r="1" />
      <circle cx="14.5" cy="7" r="1" />
      <circle cx="17" cy="11" r="1" />
    </>
  ),
  ajuda: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7v.5" />
      <path d="M12 17h.01" />
    </>
  ),
  mais: <path d="M12 5v14M5 12h14" />,
  voltar: <path d="m15 18-6-6 6-6" />,
  avancar: <path d="m9 6 6 6-6 6" />,
  editar: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  excluir: (
    <>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="m6 7 1 13h10l1-13" />
      <path d="M9 7V4h6v3" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </>
  ),
  sucesso: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </>
  ),
  informacao: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>
  ),
  fechar: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  buscar: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  compra: (
    <>
      <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2" />
      <circle cx="9.5" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
    </>
  ),
  conversa: (
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.2-4.4A8 8 0 1 1 21 12Z" />
  ),
  /* "@" estilizado (não é o logotipo da marca) */
  instagram: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.3 6.7" />
    </>
  ),
  sair: (
    <>
      <path d="M9 4H5v16h4" />
      <path d="m14 8 4 4-4 4" />
      <path d="M18 12H9" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type NomeIcone = keyof typeof desenhos;

export const nomesIcones = Object.keys(
  desenhos
) as NomeIcone[];

interface IconeProps {
  nome: NomeIcone;
  tamanho?: number;
  className?: string;
}

export function Icone({
  nome,
  tamanho = 24,
  className = "",
}: IconeProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {desenhos[nome]}
    </svg>
  );
}
