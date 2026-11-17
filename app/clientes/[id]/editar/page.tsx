"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  FormularioCliente,
  type DadosCliente,
} from "@/components/clientes/FormularioCliente";
import { useAvisos } from "@/components/ui/Avisos";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { Loading } from "@/components/ui/Loading";
import { createClient } from "@/lib/supabase/client";
import {
  codigoDoErro,
  getClienteById,
  updateCliente,
} from "@/services/clientes.service";
import type { Cliente } from "@/types/client";

type Estado = "carregando" | "naoEncontrado" | "erro" | "pronto";

export default function EditarClientePage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const { avisar } = useAvisos();

  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    getClienteById(id)
      .then((encontrado) => {
        if (!ativo) return;

        if (!encontrado) {
          setEstado("naoEncontrado");
          return;
        }

        setCliente(encontrado);
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

  async function salvar(dados: DadosCliente) {
    setSalvando(true);

    try {
      const {
        data: { user },
      } = await createClient().auth.getUser();

      if (!user) {
        avisar({
          tipo: "erro",
          texto: "Sua sessão expirou. Entre novamente para salvar.",
        });
        return;
      }

      /* Na edição, campo apagado vai como null e limpa o valor antigo. */
      await updateCliente(id, dados);

      avisar({ tipo: "sucesso", texto: "Alterações salvas." });
      router.push(`/clientes/${id}`);
    } catch {
      /* Mensagem técnica não vai para a tela. */
      avisar({
        tipo: "erro",
        texto: "Não foi possível salvar agora. Tente de novo em instantes.",
      });
    } finally {
      setSalvando(false);
    }
  }

  const naoPronto = estado !== "pronto" || !cliente;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <LinkBotao
        href={naoPronto ? "/clientes" : `/clientes/${id}`}
        variante="discreto"
        icone="voltar"
        className="mb-4 -ml-3"
      >
        {naoPronto ? "Voltar para clientes" : "Voltar para o cliente"}
      </LinkBotao>

      {estado === "carregando" && <Loading texto="Carregando cliente..." />}

      {estado === "naoEncontrado" && (
        <EmptyState
          icone="conversa"
          titulo="Cliente não encontrado"
          texto="Ele pode ter sido excluído ou o endereço está incorreto."
          acao={
            <LinkBotao href="/clientes" icone="voltar">
              Voltar para clientes
            </LinkBotao>
          }
        />
      )}

      {estado === "erro" && <ErrorState aoTentarDeNovo={tentarDeNovo} />}

      {!naoPronto && cliente && (
        <>
          <CabecalhoPagina titulo="Editar cliente" subtitulo={cliente.nome} />

          <Cartao>
            <FormularioCliente
              valoresIniciais={cliente}
              textoSalvar="Salvar alterações"
              salvando={salvando}
              aoSalvar={salvar}
              aoCancelar={() => router.push(`/clientes/${id}`)}
            />
          </Cartao>
        </>
      )}
    </div>
  );
}
