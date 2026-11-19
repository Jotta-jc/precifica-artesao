import type { ReactNode } from "react";

interface CabecalhoPaginaProps {
  titulo: string;
  subtitulo?: string;
  /** Ação à direita (no celular, vai para baixo do título). */
  acao?: ReactNode;
}

/* Cabeçalho do visual novo, usado por todas as telas refeitas
   (o PageHeader.tsx antigo foi excluído na Etapa 8). */
export function CabecalhoPagina({
  titulo,
  subtitulo,
  acao,
}: CabecalhoPaginaProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] font-bold leading-tight text-texto md:text-[34px]">
          {titulo}
        </h1>

        {subtitulo && (
          <p className="mt-2 text-lg text-texto-suave">
            {subtitulo}
          </p>
        )}
      </div>

      {acao && (
        <div className="flex flex-wrap gap-3">
          {acao}
        </div>
      )}
    </header>
  );
}
