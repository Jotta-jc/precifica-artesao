"use client";

import { useEffect, useState, type FormEvent } from "react";

import { MoneyField } from "@/components/forms/MoneyField";
import { OpcoesGrandes, type OpcaoGrande } from "@/components/forms/OpcoesGrandes";
import { QuantityField } from "@/components/forms/QuantityField";
import { SelectField } from "@/components/forms/SelectField";
import { Aviso, AvisoAtelie, mensagemDoErroPreco } from "@/components/produtos/AvisosPreco";
import { CustoDetalhado } from "@/components/produtos/CustoDetalhado";
import { MetaDoMes } from "@/components/produtos/MetaDoMes";
import { PrecosCalculados } from "@/components/produtos/PrecosCalculados";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { Loading } from "@/components/ui/Loading";
import { formatarMoeda } from "@/lib/formatar";
import { formatarQuantidadeComUnidade, rotuloUnidade } from "@/lib/materiais";
import {
  ErroPrecificacao,
  ROTULOS_COMPLEXIDADE,
  ROTULOS_EXCLUSIVIDADE,
  type Complexidade,
  type Exclusividade,
} from "@/lib/precificacao";
import {
  adicionarLinhaCalculo,
  calcularMetaProduto,
  calcularPrecoProduto,
  custoDoItem,
  custoParaCalculo,
  faltaTempo,
  itensDoCalculoRapido,
  materiaisParaCalculo,
  ROTULOS_TIPO,
  type LinhaCalculo,
  type ProdutoParaPreco,
  type ResultadoPrecoProduto,
  type TipoProduto,
} from "@/lib/produtos";
import {
  buscarConfiguracoesAtelie,
  type ConfiguracoesAtelie,
} from "@/services/atelie.service";
import { getMateriais, type Material } from "@/services/materiais.service";

type Estado = "carregando" | "erro" | "pronto";

/* Mesmos rótulos e explicações do Tipo em FormularioProduto. */
const TIPOS: OpcaoGrande<TipoProduto>[] = [
  {
    valor: "fisico",
    rotulo: ROTULOS_TIPO.fisico,
    descricao: "Algo que você produz e entrega: bolsa, tapete, cachepô.",
  },
  {
    valor: "aula",
    rotulo: ROTULOS_TIPO.aula,
    descricao: "Um curso ou uma oficina em que você ensina.",
  },
];

const opcoesComplexidade = (Object.keys(ROTULOS_COMPLEXIDADE) as Complexidade[]).map((n) => ({
  valor: n,
  rotulo: ROTULOS_COMPLEXIDADE[n],
}));

const opcoesExclusividade = (Object.keys(ROTULOS_EXCLUSIVIDADE) as Exclusividade[]).map((n) => ({
  valor: n,
  rotulo: ROTULOS_EXCLUSIVIDADE[n],
}));

/** Cálculo rápido (Etapa 10): a conta de uma peça sem cadastrar. Nada é gravado. */
export default function CalculoRapidoPage() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [atelie, setAtelie] = useState<ConfiguracoesAtelie | null>(null);

  /* Sobre a peça (mesmos valores iniciais do formulário de produto). */
  const [tipo, setTipo] = useState<TipoProduto>("fisico");
  const [tempo, setTempo] = useState<number | null>(null);
  const [complexidade, setComplexidade] = useState<Complexidade>("simples");
  const [exclusividade, setExclusividade] = useState<Exclusividade>("regular");
  const [embalagem, setEmbalagem] = useState<number | null>(null);
  const [extras, setExtras] = useState<number | null>(null);

  /* Materiais */
  const [linhas, setLinhas] = useState<LinhaCalculo[]>([]);
  const [materialId, setMaterialId] = useState("");
  const [quantidade, setQuantidade] = useState<number | null>(null);
  const [erroMaterial, setErroMaterial] = useState("");
  const [erroQuantidade, setErroQuantidade] = useState("");
  const [somou, setSomou] = useState(false);

  const [confirmarLimpar, setConfirmarLimpar] = useState(false);

  useEffect(() => {
    let ativo = true;

    Promise.all([getMateriais(), buscarConfiguracoesAtelie()])
      .then(([lista, config]) => {
        if (!ativo) return;
        setMateriais(lista);
        setAtelie(config);
        setEstado("pronto");
      })
      .catch(() => {
        if (ativo) setEstado("erro");
      });

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const fisico = tipo === "fisico";
  const disponiveis = materiaisParaCalculo(materiais);
  const materialEscolhido = disponiveis.find((m) => String(m.id) === materialId) ?? null;
  const porId = new Map(materiais.map((m) => [String(m.id), m]));

  const { itens, temSemCusto } = itensDoCalculoRapido(linhas, materiais);
  /* Mesma soma do motor: item por item, em centavos. */
  const totalMateriais = itens.reduce((total, item) => total + custoDoItem(item), 0);

  /* Montado a cada desenho; vazio conta como 0. Aula: o motor ignora
     materiais, embalagem e exclusividade. */
  const produto: ProdutoParaPreco = {
    tipo,
    tempo_producao: tempo ?? 0,
    embalagem: embalagem ?? 0,
    custos_extras: extras ?? 0,
    nivel_complexidade: complexidade,
    nivel_exclusividade: exclusividade,
  };

  let resultado: ResultadoPrecoProduto | null = null;
  let erroPreco: string | null = null;
  let erroDoMotor = false;
  let meta: { ganhoPorPeca: number; pecasPorMes: number } | null = null;
  let erroMeta: string | null = null;

  if (atelie) {
    try {
      resultado = calcularPrecoProduto(produto, itens, atelie);
    } catch (erro) {
      erroPreco = mensagemDoErroPreco(erro);
      erroDoMotor = erro instanceof ErroPrecificacao;
    }

    if (resultado) {
      try {
        meta = calcularMetaProduto(resultado.precos.sugerido, resultado, atelie);
      } catch (erro) {
        erroMeta = mensagemDoErroPreco(erro);
      }
    }
  }

  /* Meta + custos fixos = 0: o tempo não entra no preço e a meta não faz sentido. */
  const semMeta = resultado !== null && resultado.valorHora === 0;

  function adicionar(e: FormEvent) {
    e.preventDefault();

    /* Confere os dois campos de uma vez; o foco vai para o primeiro com erro. */
    const semMaterial = !materialEscolhido;
    const semQuantidade = quantidade === null || quantidade <= 0;

    setErroMaterial(semMaterial ? "Escolha um material." : "");
    setErroQuantidade(semQuantidade ? "Digite a quantidade." : "");

    if (semMaterial) {
      document.getElementById("calculo-material")?.focus();
      return;
    }
    if (semQuantidade || quantidade === null) {
      document.getElementById("calculo-quantidade")?.focus();
      return;
    }

    const r = adicionarLinhaCalculo(linhas, materialId, quantidade);
    setLinhas(r.linhas);
    setSomou(r.somou);
    setMaterialId("");
    setQuantidade(null);
  }

  function tirar(id: string) {
    setLinhas((atuais) => atuais.filter((l) => l.materialId !== id));
    setSomou(false);
  }

  /** Volta tudo aos valores iniciais (materiais e ateliê continuam carregados). */
  function limpar() {
    setTipo("fisico");
    setTempo(null);
    setComplexidade("simples");
    setExclusividade("regular");
    setEmbalagem(null);
    setExtras(null);
    setLinhas([]);
    setMaterialId("");
    setQuantidade(null);
    setErroMaterial("");
    setErroQuantidade("");
    setSomou(false);
    setConfirmarLimpar(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <CabecalhoPagina
        titulo="Cálculo rápido"
        subtitulo="Faça a conta de uma peça sem cadastrar. Nada é salvo."
      />

      {estado === "carregando" && <Loading texto="Carregando..." />}

      {estado === "erro" && (
        <ErrorState
          aoTentarDeNovo={() => {
            setEstado("carregando");
            setTentativa((n) => n + 1);
          }}
        />
      )}

      {estado === "pronto" && (
        <div className="flex flex-col gap-6">
          <Cartao titulo="Sobre a peça">
            <div className="flex flex-col gap-6">
              <OpcoesGrandes
                id="calculo-tipo"
                legenda="Tipo"
                dica="Escolha se você vende uma peça ou uma aula."
                name="calculo-tipo"
                opcoes={TIPOS}
                valor={tipo}
                aoMudar={setTipo}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <QuantityField
                  id="calculo-tempo"
                  rotulo={fisico ? "Horas para fazer a peça" : "Horas de aula e preparo"}
                  valor={tempo}
                  aoMudar={setTempo}
                  unidade="horas"
                  casas={2}
                  dica={
                    fisico
                      ? "Some todo o tempo de trabalho. Ex.: 2,5 para duas horas e meia."
                      : "Some o tempo da aula e o tempo para preparar. Ex.: 3 ou 1,5."
                  }
                />

                <SelectField
                  id="calculo-complexidade"
                  rotulo="Complexidade"
                  valor={complexidade}
                  /* A opção vazia do campo é ignorada: o motor precisa de um nível. */
                  aoMudar={(v) => v && setComplexidade(v as Complexidade)}
                  opcoes={opcoesComplexidade}
                  textoVazio="Escolha a complexidade"
                  dica="Trabalhos mais difíceis valem mais pela sua hora."
                />

                {fisico && (
                  <SelectField
                    id="calculo-exclusividade"
                    rotulo="Exclusividade"
                    valor={exclusividade}
                    aoMudar={(v) => v && setExclusividade(v as Exclusividade)}
                    opcoes={opcoesExclusividade}
                    textoVazio="Escolha a exclusividade"
                    dica="Peças raras ou únicas podem ter um preço maior."
                  />
                )}

                {fisico && (
                  <MoneyField
                    id="calculo-embalagem"
                    rotulo="Embalagem"
                    valor={embalagem}
                    aoMudar={setEmbalagem}
                    dica="Caixa, sacola, etiqueta, papel de seda. Deixe vazio se não tiver."
                  />
                )}

                <MoneyField
                  id="calculo-extras"
                  rotulo={fisico ? "Outros gastos da peça" : "Apostila ou material entregue"}
                  valor={extras}
                  aoMudar={setExtras}
                  dica={
                    fisico
                      ? "Gastos que não estão na lista de materiais. Deixe vazio se não tiver."
                      : "Quanto custa o que a aluna leva para casa. Deixe vazio se não tiver."
                  }
                />
              </div>
            </div>
          </Cartao>

          {fisico && (
            <Cartao titulo="Materiais">
              <p className="mb-4 text-lg text-texto-suave">
                Os materiais que a peça usa. O custo vem do preço atual de cada material.
              </p>

              {temSemCusto && (
                <div className="mb-4">
                  <Aviso>
                    Algum material está sem custo, e o preço pode sair baixo demais. Informe o
                    preço da compra no cadastro do material, em Materiais, ou registre uma compra
                    em Estoque.
                  </Aviso>
                </div>
              )}

              {linhas.length === 0 ? (
                <p className="mb-6 text-lg text-texto-suave">Nenhum material no cálculo ainda.</p>
              ) : (
                <>
                  <ul className="mb-4 flex flex-col gap-3">
                    {linhas.map((linha) => {
                      const material = porId.get(linha.materialId);
                      if (!material) return null;

                      const { custo, semCusto } = custoParaCalculo(material.custo_por_unidade);
                      const custoItem = custoDoItem({
                        quantidade: linha.quantidade,
                        custo_por_unidade: custo,
                      });

                      return (
                        <li
                          key={linha.materialId}
                          className="rounded-2xl border border-borda bg-cartao p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-lg font-bold">{material.nome}</span>
                            {semCusto && <Badge variante="aviso">Material sem custo</Badge>}
                          </div>

                          <dl className="mt-2 grid gap-1 text-lg sm:grid-cols-2">
                            <div>
                              <dt className="text-base text-texto-suave">Usa</dt>
                              <dd>
                                {formatarQuantidadeComUnidade(
                                  linha.quantidade,
                                  material.unidade_uso
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-base text-texto-suave">Custo do item</dt>
                              <dd className="font-bold">{formatarMoeda(custoItem)}</dd>
                            </div>
                          </dl>

                          <div className="mt-3">
                            <Button
                              variante="discreto"
                              icone="excluir"
                              aria-label={`Tirar ${material.nome}`}
                              onClick={() => tirar(linha.materialId)}
                              className="-ml-3"
                            >
                              Tirar
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <p className="mb-6 rounded-2xl bg-destaque-suave px-4 py-3 text-lg text-destaque-escuro">
                    Custo dos materiais: <strong>{formatarMoeda(totalMateriais)}</strong>
                  </p>
                </>
              )}

              <div className="rounded-2xl border border-borda p-4">
                <h3 className="mb-4 text-xl font-bold">Adicionar material</h3>

                {disponiveis.length === 0 ? (
                  <div className="flex flex-col items-start gap-3 text-lg">
                    <p>Cadastre materiais primeiro.</p>
                    <LinkBotao href="/materiais/novo" icone="mais">
                      Cadastrar material
                    </LinkBotao>
                  </div>
                ) : (
                  <form onSubmit={adicionar} noValidate className="flex flex-col gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <SelectField
                        id="calculo-material"
                        rotulo="Material"
                        valor={materialId}
                        aoMudar={(v) => {
                          setMaterialId(v);
                          setErroMaterial("");
                          setSomou(false);
                        }}
                        opcoes={disponiveis.map((m) => ({ valor: String(m.id), rotulo: m.nome }))}
                        textoVazio="Escolha o material"
                        erro={erroMaterial || undefined}
                      />
                      <QuantityField
                        id="calculo-quantidade"
                        rotulo="Quanto a peça usa"
                        valor={quantidade}
                        aoMudar={(v) => {
                          setQuantidade(v);
                          setErroQuantidade("");
                        }}
                        unidade={
                          materialEscolhido
                            ? rotuloUnidade(materialEscolhido.unidade_uso, 2)
                            : undefined
                        }
                        casas={3}
                        dica={
                          materialEscolhido
                            ? `Na unidade do material (${rotuloUnidade(materialEscolhido.unidade_uso, 2)}).`
                            : "Escolha o material para ver a unidade."
                        }
                        erro={erroQuantidade || undefined}
                      />
                    </div>

                    {somou && (
                      <p role="status" className="text-lg text-destaque-escuro">
                        Esse material já estava no cálculo. Somamos a quantidade.
                      </p>
                    )}

                    <div>
                      <Button type="submit" icone="mais" className="w-full sm:w-auto">
                        Adicionar
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Cartao>
          )}

          <Cartao titulo="Resultado">
            <div className="flex flex-col gap-4">
              {faltaTempo(produto) && (
                <Aviso>
                  Falta informar o tempo. Sem o tempo, o preço sai baixo demais. Informe o tempo
                  em Sobre a peça.
                </Aviso>
              )}

              {erroPreco !== null &&
                (erroDoMotor ? (
                  <AvisoAtelie>{erroPreco}</AvisoAtelie>
                ) : (
                  <Aviso>{erroPreco}</Aviso>
                ))}

              {semMeta && (
                <AvisoAtelie>
                  Sua meta do mês ainda não foi informada. Sem ela, o preço não paga o seu tempo.
                </AvisoAtelie>
              )}

              {resultado && (
                <>
                  <CustoDetalhado resultado={resultado} fisico={fisico} />
                  <PrecosCalculados precos={resultado.precos} />
                  {!semMeta && <MetaDoMes meta={meta} erroMeta={erroMeta} />}
                </>
              )}
            </div>
          </Cartao>

          <div>
            <Button
              variante="secundario"
              onClick={() => setConfirmarLimpar(true)}
              className="w-full sm:w-auto"
            >
              Começar de novo
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        aberto={confirmarLimpar}
        titulo="Limpar o cálculo?"
        mensagem="Os dados digitados nesta tela serão apagados."
        textoConfirmar="Limpar"
        textoCancelar="Não limpar"
        variante="perigo"
        aoConfirmar={limpar}
        aoCancelar={() => setConfirmarLimpar(false)}
      />
    </div>
  );
}
