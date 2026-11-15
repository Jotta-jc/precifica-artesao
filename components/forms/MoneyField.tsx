"use client";

import {
  CampoNumerico,
  type CampoNumericoProps,
} from "@/components/forms/CampoNumerico";

type MoneyFieldProps = Omit<
  CampoNumericoProps,
  | "casas"
  | "casasMinimas"
  | "prefixo"
  | "sufixo"
  | "mensagemInvalido"
>;

/** Campo de dinheiro: "R$" fixo à esquerda; reformata para "1.234,50". */
export function MoneyField({
  placeholder = "0,00",
  ...props
}: MoneyFieldProps) {
  return (
    <CampoNumerico
      {...props}
      placeholder={placeholder}
      prefixo="R$"
      casas={2}
      casasMinimas={2}
      mensagemInvalido="Digite um valor como 12,50"
    />
  );
}
