import type { ClienteTipo } from "@/types/client";

/** Opções do campo "Tipo" (os valores são os aceitos pelo banco). */
export const opcoesTipoCliente: { valor: ClienteTipo; rotulo: string }[] = [
  { valor: "cliente", rotulo: "Cliente" },
  { valor: "revendedor", rotulo: "Revendedor(a)" },
  { valor: "parceiro", rotulo: "Parceiro(a)" },
];

/** Rótulo amigável do tipo. Valor desconhecido: primeira letra maiúscula. */
export function rotuloTipoCliente(tipo: string | null | undefined): string {
  if (!tipo) return "";

  const opcao = opcoesTipoCliente.find((o) => o.valor === tipo);

  if (opcao) return opcao.rotulo;

  return tipo.charAt(0).toUpperCase() + tipo.slice(1);
}
