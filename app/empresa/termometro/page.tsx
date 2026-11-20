"use client";

import { useEffect, useState } from "react";

import { CheckboxField } from "@/components/forms/CheckboxField";
import { OpcoesGrandes } from "@/components/forms/OpcoesGrandes";
import { QuantityField } from "@/components/forms/QuantityField";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { Loading } from "@/components/ui/Loading";
import { formatarNumero } from "@/lib/formatar";
import { PADROES_PRECO, ROTULOS_MARCA, type NivelMarca } from "@/lib/precificacao";
import {
  calcularTermometro,
  mesAtual,
  OPCOES_CLIENTES,
  OPCOES_ESPERA,
  rotuloMes,
  TEXTOS_CLIENTES,
  TEXTOS_ESPERA,
  validarRespostas,
  type ErrosTermometro,
  type FaixaClientes,
  type FaixaEspera,
  type RascunhoTermometro,
} from "@/lib/termometro";
import {
  buscarConfiguracoesAtelie,
  salvarNivelMarca,
  type ConfiguracoesAtelie,
} from "@/services/atelie.service";
import {
  buscarTermometroDoMes,
  listarHistorico,
  salvarTermometro,
  type RegistroTermometro,
} from "@/services/termometro.service";

type Estado = "carregando" | "erro" | "pronto";
type Mensagem = { tipo: "sucesso" | "erro"; texto: string } | null;

const RASCUNHO_VAZIO: RascunhoTermometro = {
  seguidores: null,
  vendasMes: null,
  espera: null,
  clientesVoltam: null,
  midia: false,
  feiras: false,
  premios: false,
  aulas: false,
};

/* Ordem dos campos na tela, para levar o foco ao primeiro erro. */
const ORDEM_ERROS: (keyof ErrosTermometro)[] = ["seguidores", "vendasMes", "espera", "clientesVoltam"];
const ID_CAMPO: Record<keyof ErrosTermometro, string> = {
  seguidores: "termometro-seguidores",
  vendasMes: "termometro-vendas",
  espera: "termometro-espera",
  clientesVoltam: "termometro-clientes",
};

const OPCOES_ESPERA_TELA = OPCOES_ESPERA.map((valor) => ({ valor, rotulo: TEXTOS_ESPERA[valor] }));
const OPCOES_CLIENTES_TELA = OPCOES_CLIENTES.map((valor) => ({
  valor,
  rotulo: TEXTOS_CLIENTES[valor],
}));

/** "×1,0", "×1,2", "×2,0". */
function textoFator(fator: number): string {
  return `×${formatarNumero(fator, 2, 1)}`;
}

/** Fator mostrado para o nível sugerido (Referência: 2 ou mais). */
function textoFatorSugerido(nivel: NivelMarca): string {
  return nivel === "referencia" ? "×2 ou mais" : textoFator(PADROES_PRECO.marca[nivel]);
}

function rascunhoDoRegistro(r: RegistroTermometro): RascunhoTermometro {
  return {
    seguidores: r.seguidores,
    vendasMes: r.vendas_mes,
    espera: r.espera,
    clientesVoltam: r.clientes_voltam,
    midia: r.midia,
    feiras: r.feiras,
    premios: r.premios,
    aulas: r.aulas,
  };
}

/** Aviso curto abaixo dos botões. */
function TextoAviso({ mensagem }: { mensagem: Mensagem }) {
  if (!mensagem) return null;
  return (
    <p
      role="status"
      className={`text-lg font-bold ${
        mensagem.tipo === "sucesso" ? "text-destaque-escuro" : "text-perigo"
      }`}
    >
      {mensagem.texto}
    </p>
  );
}

/** Termômetro da marca (Etapa 11): sugere o nível; a artesã decide se muda. */
export default function TermometroPage() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [config, setConfig] = useState<ConfiguracoesAtelie | null>(null);
  const [registro, setRegistro] = useState<RegistroTermometro | null>(null);
  const [historico, setHistorico] = useState<RegistroTermometro[]>([]);

  const [rascunho, setRascunho] = useState<RascunhoTermometro>(RASCUNHO_VAZIO);
  const [erros, setErros] = useState<ErrosTermometro>({});
  /* Qual botão está salvando (para o "carregando" ficar só nele). */
  const [salvando, setSalvando] = useState<"respostas" | "mudar" | null>(null);
  const [mensagem, setMensagem] = useState<Mensagem>(null);

  useEffect(() => {
    let ativo = true;

    Promise.all([
      buscarConfiguracoesAtelie(),
      buscarTermometroDoMes(mesAtual()),
      listarHistorico(7),
    ])
      .then(([c, doMes, lista]) => {
        if (!ativo) return;
        setConfig(c);
        setRegistro(doMes);
        setHistorico(lista);
        setRascunho(doMes ? rascunhoDoRegistro(doMes) : RASCUNHO_VAZIO);
        setEstado("pronto");
      })
      .catch(() => {
        if (ativo) setEstado("erro");
      });

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  /** Muda um campo do rascunho e limpa o erro e os avisos ligados a ele. */
  function mudar<K extends keyof RascunhoTermometro>(campo: K, valor: RascunhoTermometro[K]) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }));
    if (campo in ID_CAMPO) {
      setErros((e) => ({ ...e, [campo as keyof ErrosTermometro]: undefined }));
    }
    setMensagem(null);
  }

  const validacao = validarRespostas(rascunho);
  const resultado = validacao.ok ? calcularTermometro(validacao.respostas) : null;

  const mesDaTela = registro?.mes ?? mesAtual();
  const anteriores = historico.filter((r) => r.mes !== mesAtual()).slice(0, 6);

  /* K13: com o resultado completo, o nível sugerido (ao vivo) é diferente do atual? */
  const sugeridoDiferente =
    resultado !== null && config !== null && resultado.nivelSugerido !== config.marca_nivel;

  /**
   * Salva as respostas do mês e, se pedido, muda a marca para o nível
   * sugerido (K12: Referência grava ×2,0; ajuste fino só em Dados do ateliê).
   * Se as respostas falharem, não tenta mudar o nível.
   */
  async function salvar(mudarMarca: boolean) {
    if (salvando) return;

    const v = validarRespostas(rascunho);
    if (!v.ok) {
      setErros(v.erros);
      const primeiro = ORDEM_ERROS.find((campo) => v.erros[campo]);
      if (primeiro) document.getElementById(ID_CAMPO[primeiro])?.focus();
      return;
    }

    setErros({});
    setSalvando(mudarMarca ? "mudar" : "respostas");
    setMensagem(null);

    try {
      let salvo: RegistroTermometro;
      try {
        salvo = await salvarTermometro(v.respostas);
        setRegistro(salvo);
      } catch {
        setMensagem({ tipo: "erro", texto: "Não foi possível salvar as respostas. Tente de novo." });
        return;
      }

      if (!mudarMarca) {
        setMensagem({ tipo: "sucesso", texto: "Respostas salvas." });
        return;
      }

      const nivel: NivelMarca = salvo.nivel_sugerido;
      try {
        setConfig(
          await salvarNivelMarca(
            nivel,
            nivel === "referencia" ? PADROES_PRECO.marca.referencia : null
          )
        );
        setMensagem({
          tipo: "sucesso",
          texto: `Respostas salvas e marca mudada para ${ROTULOS_MARCA[nivel]}. Os preços sugeridos dos seus produtos mudaram: confira cada produto.`,
        });
      } catch {
        setMensagem({
          tipo: "erro",
          texto: "Suas respostas foram salvas, mas o nível não mudou. Tente de novo.",
        });
      }
    } finally {
      setSalvando(null);
    }
  }

  const ocupado = salvando !== null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <LinkBotao href="/empresa" variante="discreto" icone="voltar" className="mb-4 -ml-3">
        Voltar para Dados do ateliê
      </LinkBotao>

      <CabecalhoPagina
        titulo="Termômetro da marca"
        subtitulo="Responda 5 perguntas para descobrir o nível da sua marca. Leva uns 2 minutos."
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

      {estado === "pronto" && config && (
        <div className="flex flex-col gap-6">
          <p className="text-lg font-bold text-texto">Respostas de {rotuloMes(mesDaTela)}</p>

          <Cartao titulo="1. Seguidores">
            <QuantityField
              id="termometro-seguidores"
              rotulo="Quantas pessoas seguem o seu trabalho nas redes sociais? Some todas: Instagram, Facebook, TikTok e outras."
              valor={rascunho.seguidores}
              aoMudar={(v) => mudar("seguidores", v)}
              casas={0}
              erro={erros.seguidores}
            />
          </Cartao>

          <Cartao titulo="2. Vendas">
            <div className="mb-3">
              <Badge variante="neutro">Você informou</Badge>
            </div>
            <QuantityField
              id="termometro-vendas"
              rotulo="Quantas peças você vende por mês, em média?"
              valor={rascunho.vendasMes}
              aoMudar={(v) => mudar("vendasMes", v)}
              casas={0}
              erro={erros.vendasMes}
            />
          </Cartao>

          <Cartao titulo="3. Encomendas">
            <OpcoesGrandes<FaixaEspera>
              id="termometro-espera"
              legenda="Quanto tempo as clientes esperam pelas suas encomendas?"
              name="termometro-espera"
              opcoes={OPCOES_ESPERA_TELA}
              /* "" = nenhuma escolhida ainda (nenhum cartão marcado). */
              valor={(rascunho.espera ?? "") as FaixaEspera}
              aoMudar={(v) => mudar("espera", v)}
            />
            {erros.espera && (
              <p className="mt-2 text-base font-bold text-perigo">{erros.espera}</p>
            )}
          </Cartao>

          <Cartao titulo="4. Clientes que voltam">
            <OpcoesGrandes<FaixaClientes>
              id="termometro-clientes"
              legenda="Quantas clientes voltam a comprar com você?"
              name="termometro-clientes"
              opcoes={OPCOES_CLIENTES_TELA}
              valor={(rascunho.clientesVoltam ?? "") as FaixaClientes}
              aoMudar={(v) => mudar("clientesVoltam", v)}
            />
            {erros.clientesVoltam && (
              <p className="mt-2 text-base font-bold text-perigo">{erros.clientesVoltam}</p>
            )}
          </Cartao>

          <Cartao titulo="5. Marque o que já aconteceu com o seu trabalho">
            <div className="flex flex-col gap-2">
              <CheckboxField
                id="termometro-midia"
                rotulo="Meu trabalho já apareceu em jornal, TV, revista ou site"
                marcado={rascunho.midia}
                aoMudar={(v) => mudar("midia", v)}
              />
              <CheckboxField
                id="termometro-feiras"
                rotulo="Participo de feiras ou exposições"
                marcado={rascunho.feiras}
                aoMudar={(v) => mudar("feiras", v)}
              />
              <CheckboxField
                id="termometro-premios"
                rotulo="Já ganhei prêmio ou concurso"
                marcado={rascunho.premios}
                aoMudar={(v) => mudar("premios", v)}
              />
              <CheckboxField
                id="termometro-aulas"
                rotulo="Dou aulas ou oficinas"
                marcado={rascunho.aulas}
                aoMudar={(v) => mudar("aulas", v)}
              />
            </div>
          </Cartao>

          <Cartao titulo="Resultado">
            <div className="flex flex-col gap-4 text-lg text-texto">
              {resultado ? (
                <>
                  <p className="text-xl font-bold">
                    Você somou {resultado.total} de 15 pontos.
                  </p>
                  <dl className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                    {(
                      [
                        ["Seguidores", resultado.pontos.seguidores],
                        ["Vendas", resultado.pontos.vendas],
                        ["Espera", resultado.pontos.espera],
                        ["Clientes que voltam", resultado.pontos.clientes],
                        ["Presença", resultado.pontos.presenca],
                      ] as const
                    ).map(([rotulo, pontos]) => (
                      <div key={rotulo} className="flex justify-between gap-4 border-b border-borda py-2">
                        <dt>{rotulo}</dt>
                        <dd className="font-bold">
                          {pontos} {pontos === 1 ? "ponto" : "pontos"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="rounded-2xl bg-destaque-suave px-4 py-3 text-destaque-escuro">
                    Nível sugerido:{" "}
                    <strong>
                      {ROTULOS_MARCA[resultado.nivelSugerido]} (
                      {textoFatorSugerido(resultado.nivelSugerido)})
                    </strong>
                  </p>
                </>
              ) : (
                <p className="text-texto-suave">Responda todas as perguntas para ver o resultado.</p>
              )}

              <p>
                Seu nível hoje:{" "}
                <strong>
                  {ROTULOS_MARCA[config.marca_nivel]} ({textoFator(config.marca_fator)})
                </strong>
              </p>

              {resultado && !sugeridoDiferente && (
                <p>A sugestão é igual ao seu nível de hoje.</p>
              )}

              <div className="flex flex-col items-start gap-3">
                {resultado && sugeridoDiferente ? (
                  <>
                    <Button
                      icone="sucesso"
                      carregando={salvando === "mudar"}
                      disabled={ocupado}
                      onClick={() => salvar(true)}
                      className="w-full sm:w-auto"
                    >
                      Salvar e mudar minha marca para {ROTULOS_MARCA[resultado.nivelSugerido]} (
                      {textoFator(PADROES_PRECO.marca[resultado.nivelSugerido])})
                    </Button>
                    <Button
                      variante="secundario"
                      carregando={salvando === "respostas"}
                      disabled={ocupado}
                      onClick={() => salvar(false)}
                      className="w-full sm:w-auto"
                    >
                      Só salvar as respostas
                    </Button>
                  </>
                ) : (
                  <Button
                    icone="sucesso"
                    carregando={salvando === "respostas"}
                    disabled={ocupado}
                    onClick={() => salvar(false)}
                    className="w-full sm:w-auto"
                  >
                    Salvar respostas
                  </Button>
                )}
                <TextoAviso mensagem={mensagem} />
              </div>
            </div>
          </Cartao>

          <Cartao titulo="Meses anteriores">
            {anteriores.length === 0 ? (
              <p className="text-lg text-texto-suave">Ainda não há respostas de meses anteriores.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-lg">
                {anteriores.map((r) => (
                  <li key={r.mes} className="border-b border-borda py-2 last:border-b-0">
                    {rotuloMes(r.mes)} — {r.pontos} {r.pontos === 1 ? "ponto" : "pontos"} —{" "}
                    {ROTULOS_MARCA[r.nivel_sugerido]}
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>
      )}
    </div>
  );
}
