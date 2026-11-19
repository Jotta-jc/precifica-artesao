"use client";

import { useState } from "react";

import { MoneyField } from "@/components/forms/MoneyField";
import { Aviso, AvisoAtelie, mensagemDoErroPreco } from "@/components/produtos/AvisosPreco";
import { CustoDetalhado } from "@/components/produtos/CustoDetalhado";
import { MetaDoMes } from "@/components/produtos/MetaDoMes";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Cartao } from "@/components/ui/Cartao";
import { Icone } from "@/components/ui/Icone";
import { formatarMoeda } from "@/lib/formatar";
import { centavos, ErroPrecificacao, type Precos } from "@/lib/precificacao";
import {
  calcularMetaProduto,
  calcularPrecoProduto,
  custosMudaram,
  escolhaInicialPreco,
  faltaTempo,
  fichaTemMaterialSemCusto,
  precoAbaixoDoMinimo,
  precoDaEscolha,
  TEXTOS_PRECO,
  type AtelieParaPreco,
  type ItemFicha,
  type OpcaoPreco,
  type Produto,
  type ResultadoPrecoProduto,
} from "@/lib/produtos";

interface PainelPrecoProps {
  produto: Produto;
  itens: ItemFicha[];
  atelie: AtelieParaPreco;
  /** A página grava e mostra o aviso de sucesso ou de erro. */
  aoSalvarPreco: (valores: { preco: number; preco_sugerido: number }) => Promise<void>;
  salvando: boolean;
}

/** As quatro opções de preço, na ordem da tela (textos em TEXTOS_PRECO). */
const OPCOES_PRECO: { valor: OpcaoPreco; rotulo: string; frase: string }[] = (
  ["minimo", "justo", "sugerido", "outro"] as const
).map((valor) => ({ valor, ...TEXTOS_PRECO[valor] }));

/** Valor mostrado no cartão (o "Outro valor" não tem valor calculado). */
function valorDaOpcao(opcao: OpcaoPreco, precos: Precos): number | null {
  return opcao === "outro" ? null : precos[opcao];
}

/** Painel de preço: tudo recalculado pelo motor a cada desenho; a escolha é gravada pela página. */
export function PainelPreco({
  produto,
  itens,
  atelie,
  aoSalvarPreco,
  salvando,
}: PainelPrecoProps) {
  const fisico = produto.tipo === "fisico";

  let resultado: ResultadoPrecoProduto | null = null;
  let erroPreco: string | null = null;
  /* Só erro do motor leva ao botão "Completar Dados do ateliê". */
  let erroDoMotor = false;

  try {
    resultado = calcularPrecoProduto(produto, itens, atelie);
  } catch (erro) {
    erroPreco = mensagemDoErroPreco(erro);
    erroDoMotor = erro instanceof ErroPrecificacao;
  }

  /* Nasce uma vez, a partir do preço gravado. Trocar o custo na mesma
     visita não muda a opção marcada, só o valor dela. */
  const precosAoAbrir = resultado?.precos ?? null;
  const escolhaAoAbrir = () =>
    precosAoAbrir
      ? escolhaInicialPreco(produto.preco, precosAoAbrir)
      : { opcao: "sugerido" as OpcaoPreco, valorOutro: null };
  const [opcao, setOpcao] = useState<OpcaoPreco>(() => escolhaAoAbrir().opcao);
  const [valorOutro, setValorOutro] = useState<number | null>(
    () => escolhaAoAbrir().valorOutro
  );
  /* Erro ao tentar salvar ("erroPreco" já é o erro do motor). Em "Outro
     valor" aparece no campo; nas outras opções, abaixo do botão. */
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  /* Meta + custos fixos = 0: o tempo não entra no preço e a meta não faz sentido. */
  const semMeta = resultado !== null && resultado.valorHora === 0;

  const precoEscolhido = resultado ? precoDaEscolha(opcao, resultado.precos, valorOutro) : null;
  const abaixoDoMinimo =
    resultado !== null &&
    precoEscolhido !== null &&
    precoAbaixoDoMinimo(precoEscolhido, resultado.precos.minimo);
  const mudaram = resultado !== null && custosMudaram(produto, resultado.precos.sugerido);
  const precoSalvo = produto.preco !== null && produto.preco > 0 ? produto.preco : null;

  let meta: { ganhoPorPeca: number; pecasPorMes: number } | null = null;
  let erroMeta: string | null = null;

  function focarOutroValor() {
    document.getElementById("preco-outro")?.focus();
  }

  async function salvarEscolha() {
    if (!resultado || salvando) return;

    if (precoEscolhido === null) {
      setErroSalvar("Digite o preço de venda.");
      focarOutroValor();
      return;
    }

    if (centavos(precoEscolhido) <= 0) {
      setErroSalvar("O preço precisa ser maior que zero. Escolha Outro valor.");
      if (opcao === "outro") focarOutroValor();
      return;
    }

    /* Abaixo do mínimo salva normalmente: o aviso já está na tela. */
    setErroSalvar(null);
    await aoSalvarPreco({ preco: precoEscolhido, preco_sugerido: resultado.precos.sugerido });
  }

  /* A meta usa o preço ESCOLHIDO; "Outro valor" vazio esconde o bloco. */
  if (resultado && !semMeta && precoEscolhido !== null) {
    try {
      meta = calcularMetaProduto(precoEscolhido, resultado, atelie);
    } catch (erro) {
      erroMeta = mensagemDoErroPreco(erro);
    }
  }

  return (
    <Cartao titulo="Preço de venda">
      <p className="mb-4 text-lg text-texto-suave">O preço usa os dados salvos acima.</p>

      <div className="flex flex-col gap-4">
        {mudaram && (
          <Aviso>Os custos mudaram desde que você salvou o preço. Confira e salve de novo.</Aviso>
        )}

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
            <CustoDetalhado resultado={resultado} fisico={fisico} />

            <p className="text-lg text-texto">
              {precoSalvo !== null ? (
                <>
                  Preço de venda salvo: <strong>{formatarMoeda(precoSalvo)}</strong>
                </>
              ) : (
                "Ainda sem preço salvo."
              )}
            </p>

            {/* Mesmos cartões de opção do Tipo (FormularioProduto). */}
            <fieldset>
              <legend className="mb-3 text-lg font-bold text-texto">
                Escolha o preço de venda
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {OPCOES_PRECO.map(({ valor, rotulo, frase }) => {
                  const escolhido = opcao === valor;
                  const valorCartao = valorDaOpcao(valor, resultado.precos);

                  return (
                    <label
                      key={valor}
                      className={`flex min-h-[88px] cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 focus-within:ring-[3px] focus-within:ring-destaque ${
                        escolhido
                          ? "border-destaque bg-destaque-suave"
                          : "border-borda-campo bg-cartao hover:bg-fundo"
                      }`}
                    >
                      <input
                        type="radio"
                        name="opcao-preco"
                        value={valor}
                        checked={escolhido}
                        onChange={() => {
                          setOpcao(valor);
                          setErroSalvar(null);
                        }}
                        className="mt-1 h-6 w-6 shrink-0 accent-destaque focus:outline-none"
                      />
                      <span className="flex flex-col gap-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold text-texto">{rotulo}</span>
                          {valor === "sugerido" && <Badge variante="neutro">Recomendado</Badge>}
                        </span>
                        {valorCartao !== null && (
                          <span className="text-2xl font-bold text-texto">
                            {formatarMoeda(valorCartao)}
                          </span>
                        )}
                        <span className="text-base text-texto-suave">{frase}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {opcao === "outro" && (
              <MoneyField
                id="preco-outro"
                rotulo="Preço de venda"
                valor={valorOutro}
                aoMudar={(v) => {
                  setValorOutro(v);
                  setErroSalvar(null);
                }}
                erro={erroSalvar ?? undefined}
              />
            )}

            {abaixoDoMinimo && (
              <Aviso>
                Esse preço está abaixo do mínimo ({formatarMoeda(resultado.precos.minimo)}). Assim
                a venda pode não cobrir os custos.
              </Aviso>
            )}

            <div className="flex flex-col items-start gap-3">
              <Button carregando={salvando} onClick={salvarEscolha}>
                Salvar preço
              </Button>

              {/* Em "Outro valor" o erro aparece no próprio campo. */}
              {erroSalvar !== null && opcao !== "outro" && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl bg-perigo-suave p-4 text-lg text-texto"
                >
                  <Icone nome="alerta" className="mt-0.5 text-perigo" />
                  <p>{erroSalvar}</p>
                </div>
              )}
            </div>

            {!semMeta && precoEscolhido !== null && (
              <MetaDoMes meta={meta} erroMeta={erroMeta} />
            )}
          </>
        )}
      </div>
    </Cartao>
  );
}
