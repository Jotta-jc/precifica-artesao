import type { ReactNode } from "react";

import { Cartao } from "@/components/ui/Cartao";
import { Icone } from "@/components/ui/Icone";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { formatarMoeda } from "@/lib/formatar";
import { ErroPrecificacao } from "@/lib/precificacao";
import {
  calcularMetaProduto,
  calcularPrecoProduto,
  faltaTempo,
  fichaTemMaterialSemCusto,
  type AtelieParaPreco,
  type ItemFicha,
  type Produto,
  type ResultadoPrecoProduto,
} from "@/lib/produtos";

interface PainelPrecoProps {
  produto: Produto;
  itens: ItemFicha[];
  atelie: AtelieParaPreco;
}

/** Mensagem do motor (português simples); outro erro vira texto genérico. */
function mensagemDoErro(erro: unknown): string {
  return erro instanceof ErroPrecificacao
    ? erro.message
    : "Não foi possível calcular o preço agora.";
}

/** Aviso âmbar com o botão para completar os Dados do ateliê. */
function AvisoAtelie({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-4 rounded-2xl bg-aviso-fundo p-4 text-lg text-aviso-texto"
    >
      <div className="flex items-start gap-3">
        <Icone nome="alerta" className="mt-0.5" />
        <p>{children}</p>
      </div>
      <LinkBotao href="/empresa" variante="secundario" icone="atelie">
        Completar Dados do ateliê
      </LinkBotao>
    </div>
  );
}

/** Caixa âmbar de aviso (mesmas classes da Ficha técnica e de Materiais). */
function Aviso({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-aviso-fundo p-4 text-lg text-aviso-texto">
      <Icone nome="alerta" className="mt-0.5" />
      <p>{children}</p>
    </div>
  );
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

/** Painel SÓ DE LEITURA: tudo recalculado pelo motor a cada desenho. */
export function PainelPreco({ produto, itens, atelie }: PainelPrecoProps) {
  const fisico = produto.tipo === "fisico";

  let resultado: ResultadoPrecoProduto | null = null;
  let erroPreco: string | null = null;
  /* Só erro do motor leva ao botão "Completar Dados do ateliê". */
  let erroDoMotor = false;

  try {
    resultado = calcularPrecoProduto(produto, itens, atelie);
  } catch (erro) {
    erroPreco = mensagemDoErro(erro);
    erroDoMotor = erro instanceof ErroPrecificacao;
  }

  /* Meta + custos fixos = 0: o tempo não entra no preço e a meta não faz sentido. */
  const semMeta = resultado !== null && resultado.valorHora === 0;

  let meta: { ganhoPorPeca: number; pecasPorMes: number } | null = null;
  let erroMeta: string | null = null;

  if (resultado && !semMeta) {
    try {
      meta = calcularMetaProduto(resultado.precos.sugerido, resultado, atelie);
    } catch (erro) {
      erroMeta = mensagemDoErro(erro);
    }
  }

  return (
    <Cartao titulo="Preço de venda">
      <p className="mb-4 text-lg text-texto-suave">O preço usa os dados salvos acima.</p>

      <div className="flex flex-col gap-4">
        {faltaTempo(produto) && (
          <Aviso>
            Falta informar o tempo. Sem o tempo, o preço sai baixo demais. Informe o tempo
            em Dados do produto.
          </Aviso>
        )}

        {fisico && fichaTemMaterialSemCusto(itens) && (
          <Aviso>Algum material está sem custo, e o preço pode sair baixo demais.</Aviso>
        )}

        {erroPreco !== null &&
          (erroDoMotor ? <AvisoAtelie>{erroPreco}</AvisoAtelie> : <Aviso>{erroPreco}</Aviso>)}

        {semMeta && (
          <AvisoAtelie>
            Sua meta do mês ainda não foi informada. Sem ela, o preço não paga o seu tempo.
          </AvisoAtelie>
        )}

        {resultado && (
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

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-borda p-4">
                <p className="text-lg font-bold text-texto">Mínimo</p>
                <p className="text-2xl font-bold text-texto">
                  {formatarMoeda(resultado.precos.minimo)}
                </p>
                <p className="mt-1 text-base text-texto-suave">Abaixo disso, você perde dinheiro.</p>
              </div>

              <div className="rounded-2xl border border-borda p-4">
                <p className="text-lg font-bold text-texto">Justo</p>
                <p className="text-2xl font-bold text-texto">
                  {formatarMoeda(resultado.precos.justo)}
                </p>
                <p className="mt-1 text-base text-texto-suave">
                  Paga seu tempo, os custos e a margem ideal.
                </p>
              </div>

              <div className="rounded-2xl border-2 border-destaque bg-destaque-suave p-4 text-destaque-escuro">
                <p className="text-lg font-bold">Sugerido</p>
                <p className="text-2xl font-bold">{formatarMoeda(resultado.precos.sugerido)}</p>
                <p className="mt-1 text-base">
                  O justo com o valor da sua marca e da exclusividade.
                </p>
              </div>
            </div>

            {!semMeta && (
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
            )}
          </>
        )}
      </div>
    </Cartao>
  );
}
