import Link from "next/link";
import type { ComponentProps } from "react";

import {
  classeBotao,
  type VarianteBotao,
} from "@/components/ui/estiloBotao";
import { Icone, type NomeIcone } from "@/components/ui/Icone";

type LinkBotaoProps = ComponentProps<typeof Link> & {
  variante?: VarianteBotao;
  larguraTotal?: boolean;
  /** Nome do ícone. O link sempre tem texto ao lado do ícone. */
  icone?: NomeIcone;
};

/** Link de navegação com a mesma aparência do Button. */
export function LinkBotao({
  variante = "primario",
  larguraTotal = false,
  icone,
  className = "",
  children,
  ...props
}: LinkBotaoProps) {
  return (
    <Link
      {...props}
      className={classeBotao({ variante, larguraTotal, className })}
    >
      {icone && <Icone nome={icone} />}
      {children}
    </Link>
  );
}
