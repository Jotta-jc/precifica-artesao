import { formatarMoeda } from "@/lib/formatar";

interface MetaDoMesProps {
  /** Resultado de calcularMetaProduto; null quando o motor recusou. */
  meta: { ganhoPorPeca: number; pecasPorMes: number } | null;
  /** Mensagem do motor quando meta é null (ex.: GANHO_INSUFICIENTE). */
  erroMeta: string | null;
}

/**
 * Caixa da meta do mês, só exibição. Quem usa calcula a meta e decide
 * quando mostrar a caixa (ex.: escondida sem meta informada).
 */
export function MetaDoMes({ meta, erroMeta }: MetaDoMesProps) {
  return (
    <div className="rounded-2xl border border-borda bg-fundo p-4 text-lg text-texto">
      {meta ? (
        <>
          <p>
            Para chegar à sua meta, venda{" "}
            <strong>
              {meta.pecasPorMes} {meta.pecasPorMes === 1 ? "peça" : "peças"}
            </strong>{" "}
            por mês.
          </p>
          <p className="mt-1">
            Você ganha <strong>{formatarMoeda(meta.ganhoPorPeca)}</strong> em cada
            peça.
          </p>
        </>
      ) : (
        <p>{erroMeta}</p>
      )}
    </div>
  );
}
