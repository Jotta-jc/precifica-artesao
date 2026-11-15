"use client";

import {
  MensagensCampo,
  useIdsCampo,
} from "@/components/forms/partesCampo";

interface CheckboxFieldProps {
  rotulo: string;
  marcado: boolean;
  aoMudar: (marcado: boolean) => void;
  dica?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export function CheckboxField({
  rotulo,
  marcado,
  aoMudar,
  dica,
  id,
  name,
  disabled,
}: CheckboxFieldProps) {
  const { idCampo, idDica, idErro, descritoPor } =
    useIdsCampo(id, dica, undefined);

  return (
    <div>
      <label
        htmlFor={idCampo}
        className="flex min-h-12 cursor-pointer items-center gap-3 text-lg font-bold text-texto"
      >
        <input
          id={idCampo}
          name={name}
          type="checkbox"
          checked={marcado}
          onChange={(e) => aoMudar(e.target.checked)}
          disabled={disabled}
          aria-describedby={descritoPor}
          className="
            h-7
            w-7
            shrink-0
            cursor-pointer
            accent-destaque
            focus:outline-none
            focus-visible:ring-[3px]
            focus-visible:ring-destaque
            focus-visible:ring-offset-2
          "
        />
        <span>{rotulo}</span>
      </label>

      <MensagensCampo
        idDica={idDica}
        dica={dica}
        idErro={idErro}
      />
    </div>
  );
}
