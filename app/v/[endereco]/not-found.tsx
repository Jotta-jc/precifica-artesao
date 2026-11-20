import { Icone } from "@/components/ui/Icone";

/* Vitrine inexistente ou fora do ar (a função não diz qual dos dois). */
export default function VitrineNaoEncontrada() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destaque-suave text-destaque">
        <Icone nome="vitrine" tamanho={28} />
      </span>
      <h1 className="text-[28px] font-bold leading-tight text-texto">
        Vitrine não encontrada
      </h1>
      <p className="max-w-md text-lg text-texto-suave">
        Confira o endereço com quem mandou o link.
      </p>
    </div>
  );
}
