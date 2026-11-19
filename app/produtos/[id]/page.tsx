"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FichaTecnica } from "@/components/produtos/FichaTecnica";
import { FormularioProduto } from "@/components/produtos/FormularioProduto";
import { PainelPreco } from "@/components/produtos/PainelPreco";
import { useAvisos } from "@/components/ui/Avisos";
import { Badge } from "@/components/ui/Badge";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
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
  codigoDoErro,
  createCategoriaProduto,
  getCategoriasProduto,
  getFichaTecnica,
  getProdutoById,
  mensagemErroProduto,
  salvarPrecoProduto,
  updateProduto,
  type CategoriaProduto,
} from "@/services/produtos.service";

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

            <div>
              <LinkBotao href="/produtos" variante="secundario" icone="voltar">
                Voltar para Produtos
              </LinkBotao>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
