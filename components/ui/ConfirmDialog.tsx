"use client";

import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  /** Deve explicar a consequência (ex.: "O produto sai da lista e não volta."). */
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  variante?: "perigo" | "primario";
  carregando?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

/* Usa o <dialog> nativo com showModal(): o navegador prende o foco dentro
   do diálogo, escurece o fundo e trata a tecla Esc (evento "cancel").
   Avisos (useAvisos) devem ser disparados DEPOIS de fechar o diálogo:
   o diálogo fica numa camada acima de tudo e cobriria o aviso. */
export function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  variante = "perigo",
  carregando = false,
  aoConfirmar,
  aoCancelar,
}: ConfirmDialogProps) {
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const idMensagem = useId();

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (!dialogo) return;

    if (aberto && !dialogo.open) {
      dialogo.showModal();

      /* Foco no Cancelar: quem aperta Enter sem querer não confirma. */
      dialogo
        .querySelector<HTMLButtonElement>("[data-cancelar]")
        ?.focus();
    } else if (!aberto && dialogo.open) {
      dialogo.close();
    }
  }, [aberto]);

  function cancelar() {
    if (!carregando) aoCancelar();
  }

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby={idTitulo}
      aria-describedby={idMensagem}
      onCancel={(e) => {
        /* Esc: quem decide fechar é a tela (prop "aberto"). */
        e.preventDefault();
        cancelar();
      }}
      onClose={() => {
        /* Se o navegador fechou por conta própria, avisa a tela. */
        if (aberto) aoCancelar();
      }}
      onClick={(e) => {
        /* Clique no fundo escurecido (fora do conteúdo). */
        if (e.target === e.currentTarget) cancelar();
      }}
      className="
        m-auto
        w-[calc(100%-2rem)]
        max-w-lg
        rounded-3xl
        border
        border-borda
        bg-cartao
        p-0
        text-texto
        backdrop:bg-black/50
      "
    >
      <div className="p-6">
        <h2
          id={idTitulo}
          className="text-2xl font-bold leading-tight"
        >
          {titulo}
        </h2>

        <p
          id={idMensagem}
          className="mt-3 text-lg text-texto-suave"
        >
          {mensagem}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            data-cancelar
            variante="secundario"
            onClick={cancelar}
            disabled={carregando}
            className="w-full sm:w-auto"
          >
            {textoCancelar}
          </Button>

          <Button
            variante={variante}
            onClick={aoConfirmar}
            carregando={carregando}
            className="w-full sm:w-auto"
          >
            {textoConfirmar}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
