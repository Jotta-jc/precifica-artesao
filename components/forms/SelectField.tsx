"use client";

import {
  classeCaixa,
  MensagensCampo,
  RotuloCampo,
  useIdsCampo,
} from "@/components/forms/partesCampo";

export interface OpcaoSelect {
  valor: string;
  rotulo: string;
}

interface SelectFieldProps {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  opcoes: OpcaoSelect[];
  textoVazio?: string;
  dica?: string;
  erro?: string;
  obrigatorio?: boolean;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export function SelectField({
  rotulo,
  valor,
  aoMudar,
  opcoes,
  textoVazio = "Selecione...",
  dica,
  erro,
  obrigatorio = false,
  id,
  name,
  disabled,
}: SelectFieldProps) {
  const { idCampo, idDica, idErro, descritoPor } =
    useIdsCampo(id, dica, erro);

  return (
    <div>
      <RotuloCampo
        htmlFor={idCampo}
        texto={rotulo}
        obrigatorio={obrigatorio}
      />

      <select
        id={idCampo}
        name={name}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        required={obrigatorio}
        disabled={disabled}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor}
        className={`${classeCaixa(erro)} cursor-pointer`}
      >
        <option value="" className="bg-white text-texto">
          {textoVazio}
        </option>

        {opcoes.map((opcao) => (
          <option
            key={opcao.valor}
            value={opcao.valor}
            className="bg-white text-texto"
          >
            {opcao.rotulo}
          </option>
        ))}
      </select>

      <MensagensCampo
        idDica={idDica}
        dica={dica}
        idErro={idErro}
        erro={erro}
      />
    </div>
  );
}
