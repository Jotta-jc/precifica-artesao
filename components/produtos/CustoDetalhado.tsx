import { formatarMoeda } from "@/lib/formatar";
import type { ResultadoPrecoProduto } from "@/lib/produtos";

interface CustoDetalhadoProps {
  resultado: ResultadoPrecoProduto;
  /** Peça física mostra Materiais e Embalagem; aula não. */
  fisico: boolean;
}

/** Uma linha do "Como chegamos ao custo". */
function Linha({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-borda py-3">
      <dt className="text-lg text-texto">{rotulo}</dt>
      <dd className="text-lg font-bold text-texto">{formatarMoeda(valor)}</dd>
    </div>
  );
}

/**
 * "Valor da sua hora" e "Como chegamos ao custo", só exibição.
 * Devolve dois blocos irmãos (fragmento): quem usa decide o espaçamento.
 */
export function CustoDetalhado({ resultado, fisico }: CustoDetalhadoProps) {
  return (
    <>
      <div className="rounded-2xl bg-destaque-suave px-4 py-4 text-destaque-escuro">
        <p className="text-lg">Valor da sua hora</p>
        <p className="text-2xl font-bold">{formatarMoeda(resultado.valorHora)}</p>
      </div>

      <div>
        <h3 className="mb-1 text-lg font-bold text-texto">Como chegamos ao custo</h3>
        <dl>
          {fisico && <Linha rotulo="Materiais" valor={resultado.custo.custoMateriais} />}
          <Linha rotulo="Tempo" valor={resultado.custo.valorTempo} />
          <Linha
            rotulo="Adicional de complexidade"
            valor={resultado.custo.adicionalComplexidade}
          />
          {fisico && <Linha rotulo="Embalagem" valor={resultado.custo.embalagem} />}
          <Linha
            rotulo={fisico ? "Outros gastos da peça" : "Apostila ou material entregue"}
            valor={resultado.custo.extras}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-3">
            <dt className="text-xl font-bold text-texto">Custo da peça</dt>
            <dd className="text-xl font-bold text-texto">
              {formatarMoeda(resultado.custo.custoTotal)}
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
}
