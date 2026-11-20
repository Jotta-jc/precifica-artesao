"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { TextAreaField } from "@/components/forms/TextAreaField";
import { TextField } from "@/components/forms/TextField";
import { Aviso } from "@/components/produtos/AvisosPreco";
import { useAvisos } from "@/components/ui/Avisos";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icone } from "@/components/ui/Icone";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { Loading } from "@/components/ui/Loading";
import { createClient } from "@/lib/supabase/client";
import {
  normalizarEndereco,
  sugerirEndereco,
  validarVitrine,
  type ErrosVitrine,
  type RascunhoVitrine,
  type Vitrine,
} from "@/lib/vitrine";
import { buscarConfiguracoesAtelie } from "@/services/atelie.service";
import {
  buscarMinhaVitrine,
  ErroVitrine,
  mensagemErroVitrine,
  salvarVitrine,
  tirarVitrineDoAr,
} from "@/services/vitrine.service";

type Estado = "carregando" | "erro" | "pronto";
/** Qual ação está em andamento (para o texto "Salvando..." ficar só no botão clicado). */
type Acao = "principal" | "secundaria" | "tirar" | null;

/* Ordem dos campos na tela, para levar o foco ao primeiro erro. */
const ORDEM_CAMPOS: (keyof ErrosVitrine)[] = ["endereco", "whatsapp", "instagram", "sobre"];
const ID_CAMPO: Record<keyof ErrosVitrine, string> = {
  endereco: "vitrine-endereco",
  whatsapp: "vitrine-whatsapp",
  instagram: "vitrine-instagram",
  sobre: "vitrine-sobre",
};

/** Campos da tela a partir da vitrine gravada (valores já normalizados). */
function rascunhoDaVitrine(v: Vitrine): RascunhoVitrine {
  return {
    endereco: v.endereco,
    whatsapp: v.whatsapp ?? "",
    instagram: v.instagram ?? "",
    sobre: v.sobre ?? "",
  };
}

/** Os 4 campos num texto só, para saber se há alterações não salvas. */
function retrato(r: RascunhoVitrine): string {
  return JSON.stringify([r.endereco, r.whatsapp, r.instagram, r.sobre]);
}

function focarPrimeiroErro(erros: ErrosVitrine) {
  const primeiro = ORDEM_CAMPOS.find((campo) => erros[campo]);
  if (primeiro) document.getElementById(ID_CAMPO[primeiro])?.focus();
}

/** Vitrine pública do ateliê (Jornada 3, V3b): endereço, contatos e publicar. */
export default function VitrinePage() {
  const router = useRouter();
  const { avisar } = useAvisos();

  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);
  /** A vitrine como está gravada (null = ainda não salva). */
  const [vitrine, setVitrine] = useState<Vitrine | null>(null);

  const [rascunho, setRascunho] = useState<RascunhoVitrine>({
    endereco: "",
    whatsapp: "",
    instagram: "",
    sobre: "",
  });
  const [retratoSalvo, setRetratoSalvo] = useState<string | null>(null);
  const [erros, setErros] = useState<ErrosVitrine>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [acao, setAcao] = useState<Acao>(null);

  const [confirmarTirar, setConfirmarTirar] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const [origem, setOrigem] = useState("");

  useEffect(() => {
    let ativo = true;

    Promise.all([buscarMinhaVitrine(), buscarConfiguracoesAtelie()])
      .then(([salva, config]) => {
        if (!ativo) return;
        const inicial = salva
          ? rascunhoDaVitrine(salva)
          : {
              endereco: sugerirEndereco(config.nome_empresa ?? ""),
              whatsapp: "",
              instagram: "",
              sobre: "",
            };
        setVitrine(salva);
        setRascunho(inicial);
        setRetratoSalvo(retrato(inicial));
        /* A origem (https://...) só existe no navegador: lida aqui, depois de
           montar, para o servidor e o navegador desenharem a mesma coisa. */
        setOrigem(window.location.origin);
        setEstado("pronto");
      })
      .catch(() => {
        if (ativo) setEstado("erro");
      });

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  function mudar(campo: keyof RascunhoVitrine, valor: string) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }));
    setErroGeral(null);
  }

  const publicada = vitrine?.publicada === true;
  const enderecoNormalizado = normalizarEndereco(rascunho.endereco);
  const mudouEnderecoPublicado = publicada && vitrine !== null && enderecoNormalizado !== vitrine.endereco;
  const temAlteracoes = retratoSalvo !== null && retrato(rascunho) !== retratoSalvo;
  const ocupado = acao !== null;

  async function salvar(publicar: boolean, qual: "principal" | "secundaria") {
    if (ocupado) return;

    const errosTela = validarVitrine(rascunho, { publicar });
    if (Object.keys(errosTela).length > 0) {
      setErros(errosTela);
      focarPrimeiroErro(errosTela);
      return;
    }

    setErros({});
    setErroGeral(null);
    setAcao(qual);

    try {
      const {
        data: { user },
      } = await createClient().auth.getUser();

      if (!user) {
        setErroGeral("Sua sessão expirou. Entre novamente para salvar.");
        return;
      }

      const salva = await salvarVitrine(rascunho, { publicar });
      const gravado = rascunhoDaVitrine(salva);

      setVitrine(salva);
      setRascunho(gravado);
      setRetratoSalvo(retrato(gravado));
      avisar({
        tipo: "sucesso",
        texto: publicar && !publicada ? "Vitrine publicada." : "Vitrine salva.",
      });
    } catch (erro) {
      if (erro instanceof ErroVitrine && erro.code === "DADOS_INVALIDOS" && erro.erros) {
        setErros(erro.erros);
        focarPrimeiroErro(erro.erros);
      } else if (erro instanceof ErroVitrine && erro.code === "ENDERECO_EM_USO") {
        const comEndereco = { endereco: mensagemErroVitrine(erro) };
        setErros(comEndereco);
        focarPrimeiroErro(comEndereco);
      } else {
        setErroGeral(mensagemErroVitrine(erro));
      }
    } finally {
      setAcao(null);
    }
  }

  async function tirarDoAr() {
    if (ocupado) return;
    setAcao("tirar");

    try {
      const atualizada = await tirarVitrineDoAr();
      /* Fecha o diálogo antes do aviso. Só a situação muda: os campos que
         ela está editando ficam como estão. */
      setConfirmarTirar(false);
      setVitrine(atualizada);
      avisar({ tipo: "sucesso", texto: "Vitrine fora do ar." });
    } catch (erro) {
      setConfirmarTirar(false);
      setErroGeral(mensagemErroVitrine(erro));
    } finally {
      setAcao(null);
    }
  }

  /** Enter num campo = ação do botão principal (publicar ou salvar publicada). */
  function aoEnviar(e: FormEvent) {
    e.preventDefault();
    void salvar(true, "principal");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <LinkBotao
        href="/empresa"
        variante="discreto"
        icone="voltar"
        className="mb-4 -ml-3"
        onClick={(e) => {
          /* Com alterações não salvas, pergunta antes de sair. */
          if (temAlteracoes) {
            e.preventDefault();
            setConfirmarSaida(true);
          }
        }}
      >
        Voltar para Dados do ateliê
      </LinkBotao>

      <CabecalhoPagina
        titulo="Sua vitrine"
        subtitulo="A página onde suas clientes veem seus produtos e falam com você pelo WhatsApp."
      />

      {estado === "carregando" && <Loading texto="Carregando sua vitrine..." />}

      {estado === "erro" && (
        <ErrorState
          mensagem="Não foi possível carregar a sua vitrine."
          aoTentarDeNovo={() => {
            setEstado("carregando");
            setTentativa((n) => n + 1);
          }}
        />
      )}

      {estado === "pronto" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3 text-lg text-texto">
            {publicada ? (
              <Badge variante="sucesso">Publicada</Badge>
            ) : (
              <>
                <Badge variante="neutro">Não publicada</Badge>
                <span className="text-texto-suave">Sua vitrine ainda não aparece para ninguém.</span>
              </>
            )}
          </div>

          <Cartao>
            <form onSubmit={aoEnviar} noValidate className="flex flex-col gap-6">
              <div>
                <TextField
                  id="vitrine-endereco"
                  rotulo="Endereço da vitrine"
                  valor={rascunho.endereco}
                  aoMudar={(v) => mudar("endereco", v)}
                  dica="Use letras sem acento, números e hífen."
                  erro={erros.endereco}
                />
                <p className="mt-2 break-all text-lg text-texto">
                  Seu link:{" "}
                  <strong>
                    {origem}/v/{enderecoNormalizado}
                  </strong>
                </p>
                {mudouEnderecoPublicado && (
                  <div className="mt-3">
                    <Aviso>Ao mudar o endereço, o link antigo vai parar de funcionar.</Aviso>
                  </div>
                )}
              </div>

              <TextField
                id="vitrine-whatsapp"
                rotulo="WhatsApp"
                tipo="tel"
                autoComplete="tel"
                placeholder="(41) 99999-9999"
                valor={rascunho.whatsapp}
                aoMudar={(v) => mudar("whatsapp", v)}
                dica="Este número aparece para quem abrir sua vitrine. Obrigatório para publicar."
                erro={erros.whatsapp}
              />

              <TextField
                id="vitrine-instagram"
                rotulo="Instagram"
                placeholder="seu_perfil"
                valor={rascunho.instagram}
                aoMudar={(v) => mudar("instagram", v)}
                dica="Opcional. Pode colar o link do seu perfil."
                erro={erros.instagram}
              />

              <TextAreaField
                id="vitrine-sobre"
                rotulo="Sobre o ateliê"
                linhas={4}
                limite={500}
                valor={rascunho.sobre}
                aoMudar={(v) => mudar("sobre", v)}
                dica="Opcional. Conte em poucas palavras o que você faz."
                erro={erros.sobre}
              />

              {erroGeral && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl bg-perigo-suave p-4 text-lg text-texto"
                >
                  <Icone nome="alerta" className="mt-0.5 text-perigo" />
                  <p>{erroGeral}</p>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  icone="sucesso"
                  disabled={ocupado}
                  className="w-full sm:w-auto"
                >
                  {acao === "principal"
                    ? "Salvando..."
                    : publicada
                      ? "Salvar vitrine"
                      : "Publicar minha vitrine"}
                </Button>

                {publicada ? (
                  <Button
                    variante="secundario"
                    disabled={ocupado}
                    onClick={() => setConfirmarTirar(true)}
                    className="w-full sm:w-auto"
                  >
                    Tirar a vitrine do ar
                  </Button>
                ) : (
                  <Button
                    variante="secundario"
                    disabled={ocupado}
                    onClick={() => void salvar(false, "secundaria")}
                    className="w-full sm:w-auto"
                  >
                    {acao === "secundaria" ? "Salvando..." : "Só salvar"}
                  </Button>
                )}
              </div>
            </form>
          </Cartao>
        </div>
      )}

      <ConfirmDialog
        aberto={confirmarTirar}
        titulo="Tirar a vitrine do ar?"
        mensagem="Ninguém vai conseguir abrir sua vitrine até você publicar de novo. Seus dados continuam guardados."
        textoConfirmar="Tirar do ar"
        textoCancelar="Deixar no ar"
        variante="primario"
        carregando={acao === "tirar"}
        aoConfirmar={() => void tirarDoAr()}
        aoCancelar={() => setConfirmarTirar(false)}
      />

      <ConfirmDialog
        aberto={confirmarSaida}
        titulo="Sair sem salvar?"
        mensagem="As alterações desta página ainda não foram salvas. Se sair agora, elas se perdem."
        textoConfirmar="Sair sem salvar"
        textoCancelar="Continuar aqui"
        variante="perigo"
        aoConfirmar={() => {
          setConfirmarSaida(false);
          router.push("/empresa");
        }}
        aoCancelar={() => setConfirmarSaida(false)}
      />
    </div>
  );
}
