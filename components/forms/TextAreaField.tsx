"use client";

import {
  classeCaixa,
  MensagensCampo,
  RotuloCampo,
  useIdsCampo,
} from "@/components/forms/partesCampo";

interface TextAreaFieldProps {
  rotulo: string;
  valor: string;
  aoMudar: (texto: string) => void;
  linhas?: number;
  placeholder?: string;
  dica?: string;
  erro?: string;
  obrigatorio?: boolean;
  id?: string;
  name?: string;
  disabled?: boolean;
  /** Mostra "N de LIMITE caracteres" abaixo do campo. Não corta o texto. */
  limite?: number;
}

export function TextAreaField({
  rotulo,
  valor,
  aoMudar,
  linhas = 4,
  placeholder,
  dica,
  erro,
  obrigatorio = false,
  id,
  name,
  disabled,
  limite,
}: TextAreaFieldProps) {
  const { idCampo, idDica, idErro, descritoPor } =
    useIdsCampo(id, dica, erro);

  /* Conta como o banco (char_length) e as validações: emoji conta 1. */
  const usados = [...valor].length;
  const idContador = `${idCampo}-contador`;
  const descritoComContador =
    limite === undefined
      ? descritoPor
      : [descritoPor, idContador].filter(Boolean).join(" ");

  return (
    <div>
      <RotuloCampo
        htmlFor={idCampo}
        texto={rotulo}
        obrigatorio={obrigatorio}
      />

      <textarea
        id={idCampo}
        name={name}
        rows={linhas}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        required={obrigatorio}
        disabled={disabled}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoComContador}
        className={`${classeCaixa(erro)} resize-y`}
      />

      {limite !== undefined && (
        <p
          id={idContador}
          className={`mt-2 text-base ${usados > limite ? "font-bold text-perigo" : "text-texto-suave"}`}
        >
          {usados} de {limite} caracteres
        </p>
      )}

      <MensagensCampo
        idDica={idDica}
        dica={dica}
        idErro={idErro}
        erro={erro}
      />
    </div>
  );
}
