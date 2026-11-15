"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Icone, type NomeIcone } from "@/components/ui/Icone";

type TipoAviso = "sucesso" | "erro" | "informacao";

interface NovoAviso {
  tipo: TipoAviso;
  texto: string;
}

interface Aviso extends NovoAviso {
  id: number;
}

interface ContextoAvisos {
  avisar: (aviso: NovoAviso) => void;
}

const Contexto = createContext<ContextoAvisos | null>(null);

const TEMPO_MS = 6000;

const aparencia: Record<
  TipoAviso,
  { icone: NomeIcone; caixa: string; cor: string }
> = {
  sucesso: {
    icone: "sucesso",
    caixa: "border-destaque bg-destaque-suave",
    cor: "text-destaque-escuro",
  },
  informacao: {
    icone: "informacao",
    caixa: "border-borda bg-cartao",
    cor: "text-destaque",
  },
  erro: {
    icone: "alerta",
    caixa: "border-perigo bg-perigo-suave",
    cor: "text-perigo",
  },
};

export function useAvisos(): ContextoAvisos {
  const contexto = useContext(Contexto);

  if (!contexto) {
    throw new Error(
      "useAvisos precisa estar dentro de AvisosProvider."
    );
  }

  return contexto;
}

export function AvisosProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const proximoId = useRef(1);

  const avisar = useCallback((novo: NovoAviso) => {
    const id = proximoId.current++;
    setAvisos((lista) => [...lista, { ...novo, id }]);
  }, []);

  const remover = useCallback((id: number) => {
    setAvisos((lista) => lista.filter((a) => a.id !== id));
  }, []);

  const tranquilos = avisos.filter((a) => a.tipo !== "erro");
  const erros = avisos.filter((a) => a.tipo === "erro");

  return (
    <Contexto.Provider value={{ avisar }}>
      {children}

      {/* Celular: acima da barra de menu (96px + área segura do iPhone).
          Computador: canto inferior direito. */}
      <div
        className="
          pointer-events-none
          fixed
          inset-x-4
          bottom-[calc(96px+env(safe-area-inset-bottom))]
          z-[60]
          flex
          flex-col
          gap-3
          md:inset-x-auto
          md:bottom-6
          md:right-6
          md:w-[480px]
        "
      >
        <div
          aria-live="polite"
          className="flex flex-col gap-3"
        >
          {tranquilos.map((aviso) => (
            <ItemAviso
              key={aviso.id}
              aviso={aviso}
              aoFechar={remover}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {erros.map((aviso) => (
            <ItemAviso
              key={aviso.id}
              aviso={aviso}
              aoFechar={remover}
            />
          ))}
        </div>
      </div>
    </Contexto.Provider>
  );
}

function ItemAviso({
  aviso,
  aoFechar,
}: {
  aviso: Aviso;
  aoFechar: (id: number) => void;
}) {
  const [pausado, setPausado] = useState(false);
  const restante = useRef(TEMPO_MS);
  const somemSozinho = aviso.tipo !== "erro";

  /* Conta 6 segundos; para enquanto o mouse (ou o foco) estiver em cima
     e continua de onde parou. Erro não some sozinho. */
  useEffect(() => {
    if (!somemSozinho || pausado) return;

    const inicio = Date.now();
    const timer = setTimeout(
      () => aoFechar(aviso.id),
      restante.current
    );

    return () => {
      clearTimeout(timer);
      restante.current = Math.max(
        0,
        restante.current - (Date.now() - inicio)
      );
    };
  }, [somemSozinho, pausado, aoFechar, aviso.id]);

  const { icone, caixa, cor } = aparencia[aviso.tipo];

  return (
    <div
      role={aviso.tipo === "erro" ? "alert" : undefined}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      className={`
        pointer-events-auto
        flex
        w-full
        max-w-[480px]
        items-start
        gap-3
        rounded-2xl
        border-2
        p-4
        text-lg
        text-texto
        shadow-lg
        ${caixa}
      `}
    >
      <Icone nome={icone} className={`mt-0.5 ${cor}`} />

      <p className="min-w-0 flex-1">{aviso.texto}</p>

      <button
        type="button"
        onClick={() => aoFechar(aviso.id)}
        className="
          -my-1
          min-h-12
          shrink-0
          rounded-xl
          px-3
          text-base
          font-bold
          text-texto
          underline
          underline-offset-4
          hover:bg-black/5
          focus-visible:outline-none
          focus-visible:ring-[3px]
          focus-visible:ring-destaque
        "
      >
        Fechar
      </button>
    </div>
  );
}
