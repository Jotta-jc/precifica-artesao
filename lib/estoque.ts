/* Tipos de movimento de estoque (material_movements.tipo) e erros da
   função registrar_movimentacao_estoque (migration 20261117010000). */

export type TipoMovimento = "entrada" | "saida" | "ajuste";

const aparencia: Record<
  TipoMovimento,
  { rotulo: string; variante: "sucesso" | "aviso" | "neutro" }
> = {
  entrada: { rotulo: "Compra", variante: "sucesso" },
  saida: { rotulo: "Uso", variante: "aviso" },
  ajuste: { rotulo: "Correção", variante: "neutro" },
};

export function rotuloTipoMovimento(tipo: string): string {
  return aparencia[tipo as TipoMovimento]?.rotulo ?? tipo;
}

export function varianteTipoMovimento(
  tipo: string
): "sucesso" | "aviso" | "neutro" {
  return aparencia[tipo as TipoMovimento]?.variante ?? "neutro";
}

export function tipoMovimentoValido(valor: string | null): valor is TipoMovimento {
  return valor === "entrada" || valor === "saida" || valor === "ajuste";
}

const mensagens = {
  ESTOQUE_INSUFICIENTE:
    "Não há estoque suficiente para esse uso. Corrija a contagem se o estoque estiver errado.",
  SEM_DIFERENCA: "A contagem é igual ao que o sistema já registra.",
  QUANTIDADE_INVALIDA: "Digite uma quantidade válida.",
  VALOR_INVALIDO: "Digite um valor válido para a compra.",
  MATERIAL_NAO_ENCONTRADO: "Material não encontrado. Ele pode ter sido excluído.",
  TIPO_INVALIDO: "Escolha se é uma compra, um uso ou uma correção.",
} as const;

export type ErroEstoque = keyof typeof mensagens;

/** Qual erro da função veio do banco (pela mensagem do erro), se algum. */
export function codigoErroEstoque(erro: unknown): ErroEstoque | null {
  const texto =
    typeof erro === "object" && erro !== null && "message" in erro
      ? String((erro as { message: unknown }).message)
      : "";

  return (
    (Object.keys(mensagens) as ErroEstoque[]).find((codigo) =>
      texto.includes(codigo)
    ) ?? null
  );
}

/** Mensagem em português simples para um erro da função, se conhecido. */
export function mensagemErroEstoque(erro: unknown): string | null {
  const codigo = codigoErroEstoque(erro);
  return codigo ? mensagens[codigo] : null;
}
