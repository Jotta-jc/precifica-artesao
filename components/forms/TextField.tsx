"use client";

import {
  classeCaixa,
  MensagensCampo,
  RotuloCampo,
  useIdsCampo,
} from "@/components/forms/partesCampo";

interface TextFieldProps {
  rotulo: string;
  valor: string;
  aoMudar: (texto: string) => void;
  tipo?: "text" | "email" | "tel" | "search";
  placeholder?: string;
  autoComplete?: string;
  dica?: string;
  erro?: string;
  obrigatorio?: boolean;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export function TextField({
  rotulo,
  valor,
  aoMudar,
  tipo = "text",
  placeholder,
  autoComplete,
  dica,
  erro,
  obrigatorio = false,
  id,
  name,
  disabled,
}: TextFieldProps) {
  const { idCampo, idDica, idErro, descritoPor } =
    useIdsCampo(id, dica, erro);

  return (
    <div>
      <RotuloCampo
        htmlFor={idCampo}
        texto={rotulo}
        obrigatorio={obrigatorio}
      />

      <input
        id={idCampo}
        name={name}
        type={tipo}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={obrigatorio}
        disabled={disabled}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor}
        className={classeCaixa(erro)}
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
