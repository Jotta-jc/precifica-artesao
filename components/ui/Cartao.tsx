import type { ReactNode } from "react";

interface CartaoProps {
  titulo?: string;
  children: ReactNode;
  className?: string;
}

/* Cartão do visual novo. O Card.tsx antigo continua em uso nas telas
   de clientes e será substituído quando elas forem refeitas. */
export function Cartao({
  titulo,
  children,
  className = "",
}: CartaoProps) {
  return (
    <section
      className={`
        rounded-3xl
        border
        border-borda
        bg-cartao
        p-5
        md:p-6
        ${className}
      `}
    >
      {titulo && (
        <h2 className="mb-4 text-xl font-bold text-texto">
          {titulo}
        </h2>
      )}

      {children}
    </section>
  );
}
