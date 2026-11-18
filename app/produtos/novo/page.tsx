"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FormularioProduto } from "@/components/produtos/FormularioProduto";
import { useAvisos } from "@/components/ui/Avisos";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { Loading } from "@/components/ui/Loading";
import type { DadosProduto } from "@/lib/produtos";
import { createClient } from "@/lib/supabase/client";
import {
  createCategoriaProduto,
  createProduto,
  getCategoriasProduto,
  mensagemErroProduto,
  type CategoriaProduto,
} from "@/services/produtos.service";

type Estado = "carregando" | "erro" | "pronto";

export default function NovoProdutoPage() {
  const router = useRouter();
  const { avisar } = useAvisos();

  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    getCategoriasProduto()
      .then((lista) => {
        if (!ativo) return;
        setCategorias(lista);
        setEstado("pronto");
      })
      .catch(() => {
        if (ativo) setEstado("erro");
      });

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  async function salvar(dados: DadosProduto) {
    setSalvando(true);

    try {
      const {
        data: { user },
      } = await createClient().auth.getUser();

      if (!user) {
        avisar({ tipo: "erro", texto: "Sua sessão expirou. Entre novamente para salvar." });
        return;
      }

      const novo = await createProduto(dados);

      avisar({ tipo: "sucesso", texto: "Produto cadastrado." });
      router.push(`/produtos/${novo.id}`);
    } catch (erro) {
      /* Mensagem técnica não vai para a tela. */
      avisar({
        tipo: "erro",
        texto:
          mensagemErroProduto(erro) ??
          "Não foi possível salvar agora. Tente de novo em instantes.",
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <LinkBotao href="/produtos" variante="discreto" icone="voltar" className="mb-4 -ml-3">
        Voltar para Produtos
      </LinkBotao>

      <CabecalhoPagina titulo="Novo produto" />

      {estado === "carregando" && <Loading texto="Carregando categorias..." />}

      {estado === "erro" && (
        <ErrorState
          aoTentarDeNovo={() => {
            setEstado("carregando");
            setTentativa((n) => n + 1);
          }}
        />
      )}

      {estado === "pronto" && (
        <Cartao>
          <FormularioProduto
            categorias={categorias}
            aoCriarCategoria={createCategoriaProduto}
            textoSalvar="Salvar produto"
            salvando={salvando}
            aoSalvar={salvar}
            aoCancelar={() => router.push("/produtos")}
          />
        </Cartao>
      )}
    </div>
  );
}
