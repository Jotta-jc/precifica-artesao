interface LoadingProps {
  texto?: string;
}

export function Loading({
  texto = "Carregando...",
}: LoadingProps) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 py-6 text-lg text-texto-suave"
    >
      <span
        aria-hidden="true"
        className="
          inline-block
          h-6
          w-6
          shrink-0
          animate-spin
          rounded-full
          border-[3px]
          border-borda
          border-t-destaque
          motion-reduce:animate-none
        "
      />

      <span>{texto}</span>
    </div>
  );
}
