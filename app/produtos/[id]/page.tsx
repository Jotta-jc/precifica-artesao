"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  CartaoNaVitrine,
  type DadosVitrineProduto,
  type EstadoVitrineDoAtelie,
} from "@/components/produtos/CartaoNaVitrine";
import { CartaoFoto } from "@/components/fotos/CartaoFoto";
import { FichaTecnica } from "@/components/produtos/FichaTecnica";
import { FormularioProduto } from "@/components/produtos/FormularioProduto";
import { PainelPreco } from "@/components/produtos/PainelPreco";
import { useAvisos } from "@/components/ui/Avisos";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { Loading } from "@/components/ui/Loading";
import {
  ROTULOS_TIPO,
  type DadosProduto,
  type ItemFicha,
  type Produto,
} from "@/lib/produtos";
import { createClient } from "@/lib/supabase/client";
import {
  buscarConfiguracoesAtelie,
  type ConfiguracoesAtelie,
} from "@/services/atelie.service";
import { getMateriais, type Material } from "@/services/materiais.service";
import {
  arquivarProduto,
  codigoDoErro,
  createCategoriaProduto,
  deleteProduto,
  getCategoriasProduto,
  getFichaTecnica,
  getProdutoById,
  mensagemErroProduto,
  reativarProduto,
  salvarPrecoProduto,
  salvarVitrineProduto,
  updateProduto,
  type CategoriaProduto,
} from "@/services/produtos.service";
import {
  enviarFotoProduto,
  mensagemErroFoto,
  removerFotoProduto,
} from "@/services/fotos.service";
import { buscarMinhaVitrine } from "@/services/vitrine.service";

type Estado = "carregando" | "naoEncontrado" | "erro" | "pronto";
type EstadoAtelie = "carregando" | "erro" | "pronto";

/** Os campos que o formulário edita, a partir do produto lido. */
function dadosDoProduto(p: Produto): DadosProduto {
  return {
    nome: p.nome,
    tipo: p.tipo,
    categoria_id: p.categoria_id,
    nivel_complexidade: p.nivel_complexidade,
    nivel_exclusividade: p.nivel_exclusividade,
    tempo_producao: p.tempo_producao,
    embalagem: p.embalagem,
    custos_extras: p.custos_extras,
  };
}

export default function EditarProdutoPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const { avisar } = useAvisos();

  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
  const [itens, setItens] = useState<ItemFicha[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [salvandoPreco, setSalvandoPreco] = useState(false);
  const [atelie, setAtelie] = useState<ConfiguracoesAtelie | null>(null);
  const [estadoAtelie, setEstadoAtelie] = useState<EstadoAtelie>("carregando");
  const [tentativaAtelie, setTentativaAtelie] = useState(0);
  /* Vitrine do ateliê, à parte: a falha não bloqueia a página (o cartão só não mostra o selo). */
  const [vitrineAtelie, setVitrineAtelie] = useState<EstadoVitrineDoAtelie>({
    estado: "carregando",
  });
  const [salvandoVitrine, setSalvandoVitrine] = useState(false);
  /* Cartão "Arquivar ou excluir" (mesmo padrão de Materiais). */
  const [dialogo, setDialogo] = useState<"arquivar" | "excluir" | null>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    let ativo = true;

    Promise.all([
      getProdutoById(id),
      getCategoriasProduto(),
      getFichaTecnica(Number(id)),
      getMateriais(),
    ])
      .then(([encontrado, cats, ficha, listaMateriais]) => {
        if (!ativo) return;

        if (!encontrado) {
          setEstado("naoEncontrado");
          return;
        }

        setProduto(encontrado);
        setCategorias(cats);
        setItens(ficha);
        setMateriais(listaMateriais);
        setEstado("pronto");
      })
      .catch((erro) => {
        if (!ativo) return;
        /* 22P02: endereço com id inválido. */
        setEstado(codigoDoErro(erro) === "22P02" ? "naoEncontrado" : "erro");
      });

    return () => {
      ativo = false;
    };
  }, [id, tentativa]);

  /* Ateliê à parte: se só ele falhar, a página continua e só o painel de preço avisa. */
  useEffect(() => {
    let ativo = true;

    buscarConfiguracoesAtelie()
      .then((config) => {
        if (!ativo) return;
        setAtelie(config);
        setEstadoAtelie("pronto");
      })
      .catch(() => {
        if (ativo) setEstadoAtelie("erro");
      });

    return () => {
      ativo = false;
    };
  }, [tentativa, tentativaAtelie]);

  useEffect(() => {
    let ativo = true;

    buscarMinhaVitrine()
      .then((vitrine) => {
        if (ativo) setVitrineAtelie({ estado: "pronto", vitrine });
      })
      .catch(() => {
        if (ativo) setVitrineAtelie({ estado: "erro" });
      });

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  function tentarDeNovo() {
    setEstado("carregando");
    setEstadoAtelie("carregando");
    setTentativa((n) => n + 1);
  }

  /** Recarrega só os Dados do ateliê. */
  function tentarAtelieDeNovo() {
    setEstadoAtelie("carregando");
    setTentativaAtelie((n) => n + 1);
  }

  /** Depois de cada gravação na ficha: lê de novo do banco. */
  async function recarregarFicha() {
    if (!produto) return;

    try {
      setItens(await getFichaTecnica(produto.id));
    } catch {
      avisar({
        tipo: "erro",
        texto: "Não foi possível atualizar a ficha. Recarregue a página.",
      });
    }
  }

  async function salvar(dados: DadosProduto) {
    if (!produto) return;
    setSalvando(true);

    try {
      const {
        data: { user },
      } = await createClient().auth.getUser();

      if (!user) {
        avisar({ tipo: "erro", texto: "Sua sessão expirou. Entre novamente para salvar." });
        return;
      }

      const atualizado = await updateProduto(produto.id, dados);

      setProduto(atualizado);
      avisar({ tipo: "sucesso", texto: "Alterações salvas." });
    } catch (erro) {
      avisar({
        tipo: "erro",
        texto:
          codigoDoErro(erro) === "AULA_COM_FICHA"
            ? "Para transformar em aula, tire antes os materiais da ficha técnica."
            : (mensagemErroProduto(erro) ??
              "Não foi possível salvar agora. Tente de novo em instantes."),
      });
    } finally {
      setSalvando(false);
    }
  }

  /** Grava só o preço. O formulário "Dados do produto" não é salvo nem reiniciado. */
  async function salvarPreco(valores: { preco: number; preco_sugerido: number }) {
    if (!produto || salvandoPreco) return;
    setSalvandoPreco(true);

    try {
      const {
        data: { user },
      } = await createClient().auth.getUser();

      if (!user) {
        avisar({ tipo: "erro", texto: "Sua sessão expirou. Entre novamente para salvar." });
        return;
      }

      const atualizado = await salvarPrecoProduto(produto.id, valores);

      setProduto(atualizado);
      avisar({ tipo: "sucesso", texto: "Preço salvo." });
    } catch (erro) {
      avisar({
        tipo: "erro",
        texto: mensagemErroProduto(erro) ?? "Não foi possível salvar o preço. Tente de novo.",
      });
    } finally {
      setSalvandoPreco(false);
    }
  }

  /** Confere a sessão antes de arquivar, desarquivar ou excluir. */
  async function sessaoAtiva(): Promise<boolean> {
    const {
      data: { user },
    } = await createClient().auth.getUser();

    if (user) return true;

    setDialogo(null);
    avisar({ tipo: "erro", texto: "Sua sessão expirou. Entre novamente para continuar." });
    return false;
  }

  /** Arquiva (ativo = false) ou desarquiva (ativo = true), sem recarregar a página. */
  async function mudarAtivo(ativo: boolean) {
    if (!produto || processando) return;
    setProcessando(true);

    try {
      if (!(await sessaoAtiva())) return;

      if (ativo) {
        await reativarProduto(produto.id);
      } else {
        await arquivarProduto(produto.id);
      }

      /* Fecha o diálogo antes do aviso (o diálogo cobre a tela). */
      setDialogo(null);
      setProduto((atual) => (atual ? { ...atual, ativo } : atual));
      avisar({
        tipo: "sucesso",
        texto: ativo ? "Produto desarquivado." : "Produto arquivado.",
      });
    } catch (erro) {
      setDialogo(null);
      avisar({
        tipo: "erro",
        texto:
          mensagemErroProduto(erro) ??
          (ativo
            ? "Não foi possível desarquivar o produto. Tente de novo."
            : "Não foi possível arquivar o produto. Tente de novo."),
      });
    } finally {
      setProcessando(false);
    }
  }

  async function excluir() {
    if (!produto || processando) return;
    setProcessando(true);

    try {
      if (!(await sessaoAtiva())) return;

      await deleteProduto(produto.id);

      setDialogo(null);
      avisar({ tipo: "sucesso", texto: "Produto excluído." });
      router.push("/produtos");
    } catch (erro) {
      setDialogo(null);
      avisar({
        tipo: "erro",
        /* Inclui PRODUTO_EM_PEDIDO (produto em pedidos ou orçamentos). */
        texto:
          mensagemErroProduto(erro) ?? "Não foi possível excluir o produto. Tente de novo.",
      });
    } finally {
      setProcessando(false);
    }
  }

  /**
   * Grava só os campos de vitrine do produto (o cadastro e o preço não mudam).
   * Devolve a mensagem de erro para o cartão mostrar, ou null.
   */
  async function salvarVitrine(dados: DadosVitrineProduto): Promise<string | null> {
    if (!produto || salvandoVitrine) return null;
    setSalvandoVitrine(true);

    try {
      const {
        data: { user },
      } = await createClient().auth.getUser();

      if (!user) return "Sua sessão expirou. Entre novamente para salvar.";

      const atualizado = await salvarVitrineProduto(produto.id, dados);

      setProduto(atualizado);
      avisar({ tipo: "sucesso", texto: "Dados da vitrine salvos." });
      return null;
    } catch (erro) {
      return (
        mensagemErroProduto(erro) ?? "Não foi possível salvar os dados da vitrine. Tente de novo."
      );
    } finally {
      setSalvandoVitrine(false);
    }
  }

  /** Envia a foto do produto; devolve a mensagem de erro para o cartão, ou null. */
  async function enviarFoto(arquivo: File): Promise<string | null> {
    if (!produto) return null;
    try {
      const caminho = await enviarFotoProduto(produto.id, arquivo);
      setProduto((atual) => (atual ? { ...atual, foto: caminho } : atual));
      return null;
    } catch (erro) {
      return mensagemErroFoto(erro);
    }
  }

  /** Tira a foto do produto; devolve a mensagem de erro para o cartão, ou null. */
  async function removerFoto(): Promise<string | null> {
    if (!produto) return null;
    try {
      await removerFotoProduto(produto.id);
      setProduto((atual) => (atual ? { ...atual, foto: null } : atual));
      return null;
    } catch (erro) {
      return mensagemErroFoto(erro);
    }
  }

  const voltar = (
    <LinkBotao href="/produtos" variante="discreto" icone="voltar" className="mb-4 -ml-3">
      Voltar para Produtos
    </LinkBotao>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      {voltar}

      {estado === "carregando" && <Loading texto="Carregando produto..." />}

      {estado === "naoEncontrado" && (
        <EmptyState
          icone="produtos"
          titulo="Produto não encontrado"
          texto="Ele pode ter sido excluído ou o endereço está incorreto."
          acao={
            <LinkBotao href="/produtos" icone="voltar">
              Voltar para Produtos
            </LinkBotao>
          }
        />
      )}

      {estado === "erro" && <ErrorState aoTentarDeNovo={tentarDeNovo} />}

      {estado === "pronto" && produto && (
        <>
          <CabecalhoPagina
            titulo={produto.nome}
            subtitulo={ROTULOS_TIPO[produto.tipo]}
          />

          {!produto.ativo && (
            <p className="-mt-2 mb-6">
              <Badge>Arquivado</Badge>
            </p>
          )}

          <div className="flex flex-col gap-6">
            <Cartao titulo="Dados do produto">
              <FormularioProduto
                categorias={categorias}
                aoCriarCategoria={createCategoriaProduto}
                valoresIniciais={dadosDoProduto(produto)}
                textoSalvar="Salvar alterações"
                salvando={salvando}
                aoSalvar={salvar}
                aoCancelar={() => router.push("/produtos")}
              />
            </Cartao>

            {/* A ficha segue o tipo GRAVADO (produto), não o do formulário sem salvar. */}
            {produto.tipo === "fisico" ? (
              <FichaTecnica
                produtoId={produto.id}
                itens={itens}
                materiais={materiais}
                aoRecarregar={recarregarFicha}
              />
            ) : (
              <Cartao titulo="Ficha técnica">
                <p className="text-lg text-texto-suave">
                  Aula não tem ficha técnica de materiais.
                </p>
              </Cartao>
            )}

            {/* Preço: recalcula com o produto e a ficha do estado (já salvos). */}
            {estadoAtelie === "carregando" && <Loading texto="Carregando o preço..." />}
            {estadoAtelie === "erro" && (
              <ErrorState
                mensagem="Não foi possível carregar os Dados do ateliê."
                aoTentarDeNovo={tentarAtelieDeNovo}
              />
            )}
            {estadoAtelie === "pronto" && atelie && (
              <PainelPreco
                produto={produto}
                itens={itens}
                atelie={atelie}
                aoSalvarPreco={salvarPreco}
                salvando={salvandoPreco}
              />
            )}

            {/* Envio imediato, fora dos formulários: não aciona "Sair sem salvar?". */}
            <CartaoFoto
              tipo="foto"
              titulo="Foto do produto"
              frase="Esta foto aparece na sua vitrine."
              caminho={produto.foto}
              alt={produto.nome}
              idCampo="produto-foto"
              aoEnviar={enviarFoto}
              aoRemover={removerFoto}
            />

            <CartaoNaVitrine
              produto={produto}
              vitrine={vitrineAtelie}
              salvando={salvandoVitrine}
              aoSalvar={salvarVitrine}
            />

            <Cartao titulo="Arquivar ou excluir">
              <p className="mb-4 text-lg text-texto-suave">
                {produto.ativo
                  ? "Arquivar tira o produto da lista e dos pedidos novos. Você pode desarquivar quando quiser. Excluir apaga o produto de vez."
                  : "Produto arquivado: não aparece na lista nem para novos pedidos."}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                {produto.ativo ? (
                  <Button
                    variante="secundario"
                    disabled={processando}
                    onClick={() => setDialogo("arquivar")}
                    className="w-full sm:w-auto"
                  >
                    Arquivar
                  </Button>
                ) : (
                  <Button
                    variante="secundario"
                    carregando={processando && dialogo === null}
                    disabled={processando}
                    onClick={() => mudarAtivo(true)}
                    className="w-full sm:w-auto"
                  >
                    Desarquivar
                  </Button>
                )}

                <Button
                  variante="perigo"
                  icone="excluir"
                  disabled={processando}
                  onClick={() => setDialogo("excluir")}
                  className="w-full sm:w-auto"
                >
                  Excluir
                </Button>
              </div>
            </Cartao>

            <div>
              <LinkBotao href="/produtos" variante="secundario" icone="voltar">
                Voltar para Produtos
              </LinkBotao>
            </div>
          </div>

          <ConfirmDialog
            aberto={dialogo === "arquivar"}
            titulo="Arquivar produto?"
            mensagem="O produto sai da lista e não aparece para novos pedidos. Nada é apagado."
            textoConfirmar="Arquivar"
            textoCancelar="Não arquivar"
            variante="primario"
            carregando={processando}
            aoConfirmar={() => mudarAtivo(false)}
            aoCancelar={() => setDialogo(null)}
          />

          <ConfirmDialog
            aberto={dialogo === "excluir"}
            titulo="Excluir produto?"
            mensagem="A ficha técnica e o preço deste produto também serão apagados. Isso não pode ser desfeito."
            textoConfirmar="Excluir"
            textoCancelar="Não excluir"
            variante="perigo"
            carregando={processando}
            aoConfirmar={excluir}
            aoCancelar={() => setDialogo(null)}
          />
        </>
      )}
    </div>
  );
}
