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
}: TextAreaFieldProps) {
  const { idCampo, idDica, idErro, descritoPor } =
    useIdsCampo(id, dica, erro);

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
        aria-describedby={descritoPor}
        className={`${classeCaixa(erro)} resize-y`}
      />

      <MensagensCampo
        idDica={idDica}
        dica={dica}
        idErro={idErro}
        erro={erro}
      />
    </div>
  );
}
