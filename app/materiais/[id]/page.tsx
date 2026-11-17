"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FormularioMaterial } from "@/components/materiais/FormularioMaterial";
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
import { createClient } from "@/lib/supabase/client";
import {
  codigoDoErro,
  createCategoriaMaterial,
  deleteMaterial,
  getCategoriasMaterial,
  getMaterialById,
  setMaterialAtivo,
  updateMaterial,
  type CategoriaMaterial,
  type DadosMaterial,
  type Material,
} from "@/services/materiais.service";

type Estado = "carregando" | "naoEncontrado" | "erro" | "pronto";

export default function EditarMaterialPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const { avisar } = useAvisos();

  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [material, setMaterial] = useState<Material | null>(null);
  const [categorias, setCategorias] = useState<CategoriaMaterial[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [dialogo, setDialogo] = useState<"arquivar" | "excluir" | null>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    let ativo = true;

    Promise.all([getMaterialById(id), getCategoriasMaterial()])
      .then(([encontrado, cats]) => {
        if (!ativo) return;

        if (!encontrado) {
          setEstado("naoEncontrado");
          return;
        }

        /* Se o material usa uma categoria arquivada, ela continua na lista. */
        const lista =
          encontrado.category_id &&
          !cats.some((c) => c.id === encontrado.category_id) &&
          encontrado.categoria_info
            ? [...cats, { id: encontrado.category_id, nome: encontrado.categoria_info.nome }]
            : cats;

        setMaterial(encontrado);
        setCategorias(lista);
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

  function tentarDeNovo() {
    setEstado("carregando");
    setTentativa((n) => n + 1);
  }

  async function salvar(dados: DadosMaterial) {
    if (!material) return;
    setSalvando(true);

    try {
      const {
        data: { user },
      } = await createClient().auth.getUser();

      if (!user) {
        avisar({ tipo: "erro", texto: "Sua sessão expirou. Entre novamente para salvar." });
        return;
      }

      await updateMaterial(material.id, dados);

      avisar({ tipo: "sucesso", texto: "Alterações salvas." });
      router.push("/materiais");
    } catch {
      avisar({
        tipo: "erro",
        texto: "Não foi possível salvar agora. Tente de novo em instantes.",
      });
    } finally {
      setSalvando(false);
    }
  }

  async function arquivar(ativo: boolean) {
    if (!material) return;
    setProcessando(true);

    try {
      await setMaterialAtivo(material.id, ativo);

      /* Fecha o diálogo antes do aviso (o diálogo cobre a tela). */
      setDialogo(null);
      setMaterial({ ...material, ativo });
      avisar({
        tipo: "sucesso",
        texto: ativo ? "Material desarquivado." : "Material arquivado.",
      });
    } catch {
      setDialogo(null);
      avisar({
        tipo: "erro",
        texto: "Não foi possível salvar agora. Tente de novo em instantes.",
      });
    } finally {
      setProcessando(false);
    }
  }

  async function excluir() {
    if (!material) return;
    setProcessando(true);

    try {
      await deleteMaterial(material.id);

      setDialogo(null);
      avisar({ tipo: "sucesso", texto: "Material excluído." });
      router.push("/materiais");
    } catch (erro) {
      setDialogo(null);
      avisar({
        tipo: "erro",
        texto:
          codigoDoErro(erro) === "23503"
            ? "Este material tem histórico de estoque ou faz parte da ficha técnica de um produto. Use Arquivar."
            : "Não foi possível excluir agora. Tente de novo em instantes.",
      });
    } finally {
      setProcessando(false);
    }
  }

  const pronto = estado === "pronto" && material;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <LinkBotao
        href="/materiais"
        variante="discreto"
        icone="voltar"
        className="mb-4 -ml-3"
      >
        Voltar para materiais
      </LinkBotao>

      {estado === "carregando" && <Loading texto="Carregando material..." />}

      {estado === "naoEncontrado" && (
        <EmptyState
          icone="materiais"
          titulo="Material não encontrado"
          texto="Ele pode ter sido excluído ou o endereço está incorreto."
          acao={
            <LinkBotao href="/materiais" icone="voltar">
              Voltar para materiais
            </LinkBotao>
          }
        />
      )}

      {estado === "erro" && <ErrorState aoTentarDeNovo={tentarDeNovo} />}

      {pronto && (
        <>
          <CabecalhoPagina titulo="Editar material" subtitulo={material.nome} />

          {material.ativo === false && (
            <p className="-mt-2 mb-6">
              <Badge>Arquivado</Badge>
            </p>
          )}

          <div className="flex flex-col gap-6">
            <Cartao>
              <FormularioMaterial
                categorias={categorias}
                aoCriarCategoria={createCategoriaMaterial}
                valoresIniciais={{
                  nome: material.nome,
                  category_id: material.category_id,
                  unidade_uso: material.unidade_uso,
                  preco: Number(material.preco),
                  quantidade_por_compra: Number(material.quantidade_por_compra),
                  minimum_stock: material.minimum_stock,
                }}
                estoqueAtual={Number(material.estoque_atual ?? 0)}
                textoSalvar="Salvar alterações"
                salvando={salvando}
                aoSalvar={salvar}
                aoCancelar={() => router.push("/materiais")}
              />
            </Cartao>

            <Cartao titulo="Arquivar ou excluir">
              <p className="mb-4 text-lg text-texto-suave">
                Arquivar tira o material da lista sem perder o histórico. Excluir
                só é possível para materiais sem histórico de estoque e fora das
                fichas técnicas.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                {material.ativo === false ? (
                  <Button
                    variante="secundario"
                    carregando={processando && dialogo === null}
                    onClick={() => arquivar(true)}
                    className="w-full sm:w-auto"
                  >
                    Desarquivar
                  </Button>
                ) : (
                  <Button
                    variante="secundario"
                    onClick={() => setDialogo("arquivar")}
                    className="w-full sm:w-auto"
                  >
                    Arquivar material
                  </Button>
                )}

                <Button
                  variante="perigo"
                  icone="excluir"
                  onClick={() => setDialogo("excluir")}
                  className="w-full sm:w-auto"
                >
                  Excluir material
                </Button>
              </div>
            </Cartao>
          </div>

          <ConfirmDialog
            aberto={dialogo === "arquivar"}
            titulo="Arquivar material?"
            mensagem="Ele sai da lista, mas o histórico e as fichas técnicas continuam. Você pode desarquivar quando quiser."
            textoConfirmar="Arquivar material"
            textoCancelar="Não arquivar"
            variante="primario"
            carregando={processando}
            aoConfirmar={() => arquivar(false)}
            aoCancelar={() => setDialogo(null)}
          />

          <ConfirmDialog
            aberto={dialogo === "excluir"}
            titulo="Excluir material?"
            mensagem={`${material.nome} será excluído e não poderá ser recuperado.`}
            textoConfirmar="Excluir material"
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
