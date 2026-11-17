/* Situações (status) de pedido encontradas no código em 17/11/2026:
   app/pedidos/page.tsx e app/pedidos/[id]/page.tsx. O banco não restringe
   os valores (orders.status é texto livre, padrão "orcamento"). */

const rotulos: Record<string, string> = {
  orcamento: "Orçamento",
  aguardando: "Aguardando",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovado: "Aprovado",
  producao: "Em produção",
  pronto: "Pronto",
  finalizado: "Finalizado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

/** Nome amigável da situação. Valor desconhecido: primeira letra maiúscula. */
export function rotuloStatusPedido(status: string | null | undefined): string {
  if (!status) return "";

  return (
    rotulos[status] ??
    status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")
  );
}

export type VarianteStatusPedido = "neutro" | "sucesso" | "aviso" | "perigo";

/** Cor do selo (Badge) de cada situação. */
export function varianteStatusPedido(
  status: string | null | undefined
): VarianteStatusPedido {
  switch (status) {
    case "entregue":
      return "sucesso";
    case "cancelado":
      return "perigo";
    case "producao":
    case "aguardando":
    case "aguardando_aprovacao":
      return "aviso";
    default:
      return "neutro";
  }
}
