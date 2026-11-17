"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAvisos } from "@/components/ui/Avisos";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icone } from "@/components/ui/Icone";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { Loading } from "@/components/ui/Loading";
import { rotuloTipoCliente } from "@/lib/clientes";
import {
  formatarData,
  formatarMoeda,
  formatarTelefone,
} from "@/lib/formatar";
import {
  rotuloStatusPedido,
  varianteStatusPedido,
} from "@/lib/pedidos";
import {
  codigoDoErro,
  deleteCliente,
  getClienteById,
  getPedidosDoCliente,
  type PedidoDoCliente,
} from "@/services/clientes.service";
import type { Cliente } from "@/types/client";

type Estado = "carregando" | "naoEncontrado" | "erro" | "pronto";

/** Dígitos com o código do Brasil (55), sem repetir se já tiver. */
function telefoneComPais(telefone: string) {
  const d = telefone.replace(/\D/g, "");
  const jaTem55 = d.startsWith("55") && (d.length === 12 || d.length === 13);
  return jaTem55 ? d : `55${d}`;
}

export default function ClienteDetalhePage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const { avisar } = useAvisos();

  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pedidos, setPedidos] = useState<PedidoDoCliente[]>([]);

  const [confirmarAberto, setConfirmarAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    let ativo = true;

    Promise.all([getClienteById(id), getPedidosDoCliente(id)])
      .then(([encontrado, lista]) => {
        if (!ativo) return;

        if (!encontrado) {
          setEstado("naoEncontrado");
          return;
        }

        setCliente(encontrado);
        setPedidos(lista);
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

  async function excluir() {
    setExcluindo(true);

    try {
      await deleteCliente(id);

      /* Fecha o diálogo antes do aviso (o diálogo cobre a tela). */
      setConfirmarAberto(false);
      avisar({ tipo: "sucesso", texto: "Cliente excluído." });
      router.push("/clientes");
    } catch (erro) {
      setConfirmarAberto(false);
      avisar({
        tipo: "erro",
        texto:
          codigoDoErro(erro) === "23503"
            ? "Este cliente tem pedidos registrados e não pode ser excluído. Assim o histórico de vendas fica preservado."
            : "Não foi possível excluir agora. Tente de novo em instantes.",
      });
    } finally {
      setExcluindo(false);
    }
  }

  const voltar = (
    <LinkBotao
      href="/clientes"
      variante="discreto"
      icone="voltar"
      className="mb-4 -ml-3"
    >
      Voltar para clientes
    </LinkBotao>
  );

  if (estado !== "pronto" || !cliente) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
        {voltar}

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
      </div>
    );
  }

  /* "Pedidos" conta todos. Os valores ignoram orçamentos e cancelados;
     o valor médio divide só pelos pedidos que entraram na soma.
     Valor vazio conta como zero. */
  const quantidade = pedidos.length;
  const pedidosVendidos = pedidos.filter(
    (p) => p.status !== "cancelado" && p.status !== "orcamento"
  );
  const totalVendido = pedidosVendidos.reduce(
    (soma, p) => soma + Number(p.valor_total || 0),
    0
  );
  const valorMedio =
    pedidosVendidos.length > 0 ? totalVendido / pedidosVendidos.length : 0;

  const temPedidos = quantidade > 0;
  const usuarioInstagram = (cliente.instagram ?? "").replace(/^@+/, "").trim();
  const temContato = Boolean(
    cliente.telefone || cliente.email || usuarioInstagram || cliente.observacoes
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      {voltar}

      <CabecalhoPagina
        titulo={cliente.nome}
        subtitulo={rotuloTipoCliente(cliente.tipo_cliente)}
        acao={
          <>
            <LinkBotao
              href={`/clientes/${id}/editar`}
              variante="secundario"
              icone="editar"
            >
              Editar
            </LinkBotao>
            <Button
              variante="perigo"
              icone="excluir"
              disabled={temPedidos}
              onClick={() => setConfirmarAberto(true)}
            >
              Excluir
            </Button>
          </>
        }
      />

      {temPedidos && (
        <p className="-mt-2 mb-6 text-base text-texto-suave">
          Clientes com pedidos não podem ser excluídos, para preservar o
          histórico de vendas.
        </p>
      )}

      <div className="flex flex-col gap-6">
        <Cartao titulo="Contato">
          {!temContato ? (
            <p className="text-lg text-texto-suave">Nenhum contato cadastrado.</p>
          ) : (
            <dl className="flex flex-col gap-5 text-lg">
              {cliente.telefone && (
                <div>
                  <dt className="text-base font-bold text-texto-suave">
                    Telefone ou WhatsApp
                  </dt>
                  <dd className="mt-1">
                    <p className="text-xl font-bold">
                      {formatarTelefone(cliente.telefone)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <LinkBotao
                        href={`tel:+${telefoneComPais(cliente.telefone)}`}
                        variante="secundario"
                        icone="telefone"
                      >
                        Ligar
                      </LinkBotao>
                      <LinkBotao
                        href={`https://wa.me/${telefoneComPais(cliente.telefone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variante="secundario"
                        icone="conversa"
                      >
                        WhatsApp
                      </LinkBotao>
                    </div>
                  </dd>
                </div>
              )}

              {cliente.email && (
                <div>
                  <dt className="text-base font-bold text-texto-suave">E-mail</dt>
                  <dd className="mt-1 break-all">
                    <a
                      href={`mailto:${cliente.email}`}
                      className="font-bold text-destaque underline underline-offset-4"
                    >
                      {cliente.email}
                    </a>
                  </dd>
                </div>
              )}

              {usuarioInstagram && (
                <div>
                  <dt className="text-base font-bold text-texto-suave">Instagram</dt>
                  <dd className="mt-1 break-all">
                    <a
                      href={`https://instagram.com/${encodeURIComponent(usuarioInstagram)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-destaque underline underline-offset-4"
                    >
                      @{usuarioInstagram}
                    </a>
                  </dd>
                </div>
              )}

              {cliente.observacoes && (
                <div>
                  <dt className="text-base font-bold text-texto-suave">Observações</dt>
                  <dd className="mt-1 whitespace-pre-line">{cliente.observacoes}</dd>
                </div>
              )}
            </dl>
          )}
        </Cartao>

        <div className="grid gap-4 md:grid-cols-3">
          <Cartao>
            <p className="text-base font-bold text-texto-suave">Pedidos</p>
            <p className="mt-1 text-[28px] font-bold">{quantidade}</p>
          </Cartao>
          <Cartao>
            <p className="text-base font-bold text-texto-suave">Total vendido</p>
            <p className="mt-1 text-[28px] font-bold">{formatarMoeda(totalVendido)}</p>
            <p className="mt-1 text-base text-texto-suave">
              Não conta orçamentos nem pedidos cancelados.
            </p>
          </Cartao>
          <Cartao>
            <p className="text-base font-bold text-texto-suave">Valor médio por pedido</p>
            <p className="mt-1 text-[28px] font-bold">{formatarMoeda(valorMedio)}</p>
            <p className="mt-1 text-base text-texto-suave">
              Não conta orçamentos nem pedidos cancelados.
            </p>
          </Cartao>
        </div>

        <Cartao titulo="Pedidos deste cliente">
          {!temPedidos ? (
            <p className="text-lg text-texto-suave">
              Este cliente ainda não tem pedidos.
            </p>
          ) : (
            <>
              {/* Celular: um cartão por pedido */}
              <ul className="flex flex-col gap-3 md:hidden">
                {pedidos.map((pedido) => (
                  <li key={pedido.id}>
                    <Link
                      href={`/pedidos/${pedido.id}`}
                      className="flex min-h-[88px] items-center gap-3 rounded-2xl border border-borda p-4 text-texto hover:bg-destaque-suave focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-destaque"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold">Pedido nº {pedido.id}</span>
                          <Badge variante={varianteStatusPedido(pedido.status)}>
                            {rotuloStatusPedido(pedido.status)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-base text-texto-suave">
                          {formatarData(pedido.created_at)}
                        </p>
                        <p className="mt-1 text-lg font-bold">
                          {formatarMoeda(Number(pedido.valor_total || 0))}
                        </p>
                      </div>
                      <Icone nome="avancar" className="text-destaque" />
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Computador: tabela */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-lg">
                  <thead>
                    <tr className="border-b border-borda text-base text-texto-suave">
                      <th scope="col" className="px-4 py-3 font-bold">Pedido</th>
                      <th scope="col" className="px-4 py-3 font-bold">Data</th>
                      <th scope="col" className="px-4 py-3 font-bold">Situação</th>
                      <th scope="col" className="px-4 py-3 font-bold">Valor</th>
                      <th scope="col" className="px-4 py-3 font-bold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((pedido) => (
                      <tr key={pedido.id} className="border-b border-borda last:border-b-0">
                        <td className="px-4 py-3 font-bold">nº {pedido.id}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatarData(pedido.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variante={varianteStatusPedido(pedido.status)}>
                            {rotuloStatusPedido(pedido.status)}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {formatarMoeda(Number(pedido.valor_total || 0))}
                        </td>
                        <td className="px-4 py-3">
                          <LinkBotao
                            href={`/pedidos/${pedido.id}`}
                            variante="secundario"
                            aria-label={`Ver pedido nº ${pedido.id}`}
                          >
                            Ver pedido
                          </LinkBotao>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Cartao>
      </div>

      <ConfirmDialog
        aberto={confirmarAberto}
        titulo="Excluir cliente?"
        mensagem={`${cliente.nome} será excluído e não poderá ser recuperado.`}
        textoConfirmar="Excluir cliente"
        textoCancelar="Não excluir"
        variante="perigo"
        carregando={excluindo}
        aoConfirmar={excluir}
        aoCancelar={() => setConfirmarAberto(false)}
      />
    </div>
  );
}
