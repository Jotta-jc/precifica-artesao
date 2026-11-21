"use client";

import { useState, type ChangeEvent } from "react";

import { Aviso } from "@/components/produtos/AvisosPreco";
import { Button } from "@/components/ui/Button";
import { Cartao } from "@/components/ui/Cartao";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { classeBotao } from "@/components/ui/estiloBotao";
import { Icone } from "@/components/ui/Icone";
import { linkPublicoFoto } from "@/lib/imagens";

type TipoFoto = "foto" | "logo";

/* Envio imediato (fora de qualquer formulário): escolher já envia. Quem
   chama grava pelo services/fotos.service.ts e devolve a mensagem de erro. */

interface TextosFoto {
  escolher: string;
  trocar: string;
  remover: string;
  enviando: string;
  removendo: string;
  salva: string;
  removida: string;
  semFoto: string;
  legenda: string;
  confirmarTitulo: string;
  confirmarMensagem: string;
}

const TEXTOS: Record<TipoFoto, TextosFoto> = {
  foto: {
    escolher: "Escolher foto",
    trocar: "Trocar foto",
    remover: "Remover foto",
    enviando: "Enviando a foto...",
    removendo: "Removendo a foto...",
    salva: "Foto salva.",
    removida: "Foto removida.",
    semFoto: "Ainda não há foto.",
    legenda: "Assim ela aparece na vitrine.",
    confirmarTitulo: "Remover a foto?",
    confirmarMensagem: "Ela sai da sua vitrine.",
  },
  logo: {
    escolher: "Escolher logo",
    trocar: "Trocar logo",
    remover: "Remover logo",
    enviando: "Enviando o logo...",
    removendo: "Removendo o logo...",
    salva: "Logo salvo.",
    removida: "Logo removido.",
    semFoto: "Ainda não há logo.",
    legenda: "Assim ele aparece na vitrine.",
    confirmarTitulo: "Remover o logo?",
    confirmarMensagem: "Ele sai da sua vitrine.",
  },
};

/* Endereço do projeto Supabase: a mesma variável de lib/supabase/client.ts. */
const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

interface CartaoFotoProps {
  tipo: TipoFoto;
  titulo: string;
  frase: string;
  /** Caminho no bucket, como está gravado (null = sem foto). */
  caminho: string | null;
  alt: string;
  idCampo: string;
  /** Envia e grava; devolve a mensagem de erro, ou null. */
  aoEnviar: (arquivo: File) => Promise<string | null>;
  /** Remove; devolve a mensagem de erro, ou null. */
  aoRemover: () => Promise<string | null>;
}

type Mensagem = { tipo: "sucesso" | "erro"; texto: string };

export function CartaoFoto({
  tipo,
  titulo,
  frase,
  caminho,
  alt,
  idCampo,
  aoEnviar,
  aoRemover,
}: CartaoFotoProps) {
  const textos = TEXTOS[tipo];

  const [acao, setAcao] = useState<"enviando" | "removendo" | null>(null);
  const [mensagem, setMensagem] = useState<Mensagem | null>(null);
  const [confirmar, setConfirmar] = useState(false);

  const ocupado = acao !== null;
  const link = URL_SUPABASE ? linkPublicoFoto(URL_SUPABASE, caminho) : null;
  const temFoto = caminho !== null;

  async function escolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    /* Zera o campo: deixa escolher o mesmo arquivo de novo. */
    e.target.value = "";
    if (!arquivo || ocupado) return;

    setMensagem(null);
    setAcao("enviando");
    try {
      const erro = await aoEnviar(arquivo);
      setMensagem(erro ? { tipo: "erro", texto: erro } : { tipo: "sucesso", texto: textos.salva });
    } finally {
      setAcao(null);
    }
  }

  async function remover() {
    setConfirmar(false);
    if (ocupado) return;

    setMensagem(null);
    setAcao("removendo");
    try {
      const erro = await aoRemover();
      setMensagem(
        erro ? { tipo: "erro", texto: erro } : { tipo: "sucesso", texto: textos.removida }
      );
    } finally {
      setAcao(null);
    }
  }

  const classePrevia =
    tipo === "foto"
      ? "aspect-square w-full max-w-72 rounded-2xl"
      : "h-32 w-32 rounded-full";

  return (
    <Cartao titulo={titulo}>
      <div className="flex flex-col gap-5">
        <p className="text-lg text-texto-suave">{frase}</p>

        {link ? (
          <figure className="flex flex-col gap-2">
            {/* Foto do bucket público, já reduzida no envio (decisão Q9). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={link}
              alt={alt}
              className={`${classePrevia} border border-borda bg-cartao object-cover`}
            />
            <figcaption className="text-lg text-texto-suave">{textos.legenda}</figcaption>
          </figure>
        ) : (
          <div
            className={`${classePrevia} flex items-center justify-center bg-destaque-suave p-4 text-center text-lg text-destaque-escuro`}
          >
            {textos.semFoto}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input
            id={idCampo}
            type="file"
            accept="image/*"
            className="peer sr-only"
            disabled={ocupado}
            onChange={escolher}
          />
          <label
            htmlFor={idCampo}
            aria-disabled={ocupado || undefined}
            className={classeBotao({
              variante: temFoto ? "secundario" : "primario",
              className: `w-full cursor-pointer sm:w-auto peer-focus-visible:ring-[3px] peer-focus-visible:ring-destaque peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-fundo ${
                ocupado ? "pointer-events-none opacity-60" : ""
              }`,
            })}
          >
            <Icone nome="camera" />
            <span>
              {acao === "enviando" ? textos.enviando : temFoto ? textos.trocar : textos.escolher}
            </span>
          </label>

          {temFoto && (
            <Button
              variante="secundario"
              icone="excluir"
              disabled={ocupado}
              onClick={() => setConfirmar(true)}
              className="w-full sm:w-auto"
            >
              {acao === "removendo" ? textos.removendo : textos.remover}
            </Button>
          )}
        </div>

        {mensagem?.tipo === "sucesso" && (
          <p role="status" className="flex items-center gap-2 text-lg font-bold text-destaque-escuro">
            <Icone nome="sucesso" />
            <span>{mensagem.texto}</span>
          </p>
        )}
        {mensagem?.tipo === "erro" && (
          <div role="alert">
            <Aviso>{mensagem.texto}</Aviso>
          </div>
        )}
      </div>

      <ConfirmDialog
        aberto={confirmar}
        titulo={textos.confirmarTitulo}
        mensagem={textos.confirmarMensagem}
        textoConfirmar="Remover"
        textoCancelar="Manter"
        variante="perigo"
        aoConfirmar={remover}
        aoCancelar={() => setConfirmar(false)}
      />
    </Cartao>
  );
}
