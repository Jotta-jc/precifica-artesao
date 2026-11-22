"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { TextField } from "@/components/forms/TextField";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icone } from "@/components/ui/Icone";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { Loading } from "@/components/ui/Loading";
import { rotuloTipoCliente } from "@/lib/clientes";
import { formatarTelefone } from "@/lib/formatar";
import { getClientes } from "@/services/clientes.service";
import type { Cliente } from "@/types/client";

/** Minúsculas e sem acentos, para a busca. */
function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

type Estado = "carregando" | "erro" | "pronto";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    let ativo = true;

    getClientes()
      .then((lista) => {
        if (!ativo) return;
        setClientes(lista);
        setEstado("pronto");
      })
      .catch(() => {
        /* Mensagem técnica não vai para a tela. */
        if (ativo) setEstado("erro");
      });

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  function tentarDeNovo() {
    setEstado("carregando");
    setTentativa((n) => n + 1);
  }

  const ordenados = useMemo(
    () =>
      [...clientes].sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
      ),
    [clientes]
  );

  const termo = normalizar(busca.trim());
  const termoDigitos = busca.replace(/\D/g, "");

  const filtrados = termo
    ? ordenados.filter((c) => {
        const texto = normalizar(
          [c.nome, c.email ?? "", c.telefone ?? "", formatarTelefone(c.telefone ?? "")].join(" ")
        );
        const digitos = (c.telefone ?? "").replace(/\D/g, "");

        return (
          texto.includes(termo) ||
          (termoDigitos.length > 0 && digitos.includes(termoDigitos))
        );
      })
    : ordenados;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
      <CabecalhoPagina
        titulo="Clientes"
        subtitulo="As pessoas que compram de você"
        acao={
          <LinkBotao href="/clientes/novo" icone="mais">
            Novo cliente
          </LinkBotao>
        }
      />

      {estado === "carregando" && <Loading texto="Carregando clientes..." />}

      {estado === "erro" && <ErrorState aoTentarDeNovo={tentarDeNovo} />}

      {estado === "pronto" && clientes.length === 0 && (
        <EmptyState
          icone="conversa"
          titulo="Você ainda não cadastrou clientes"
          texto="Cadastre as pessoas que compram de você para acompanhar os pedidos de cada uma."
          acao={
            <LinkBotao href="/clientes/novo" icone="mais">
              Cadastrar o primeiro cliente
            </LinkBotao>
          }
        />
      )}

      {estado === "pronto" && clientes.length > 0 && (
        <>
          <div className="mb-6 max-w-xl">
            <TextField
              rotulo="Buscar cliente"
              tipo="search"
              valor={busca}
              aoMudar={setBusca}
              dica="Nome, telefone ou e-mail"
            />
          </div>

          {filtrados.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-3xl border border-borda bg-cartao p-5 text-lg">
              <p>Nenhum cliente encontrado para &lsquo;{busca.trim()}&rsquo;.</p>
              <Button variante="discreto" onClick={() => setBusca("")}>
                Limpar busca
              </Button>
            </div>
          ) : (
            <>
              {/* Celular: cartões clicáveis */}
              <ul className="flex flex-col gap-3 md:hidden">
                {filtrados.map((cliente) => (
                  <li key={cliente.id}>
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="flex min-h-[88px] items-center gap-3 rounded-3xl border border-borda bg-cartao p-4 text-texto hover:bg-destaque-suave focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-destaque"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xl font-bold">{cliente.nome}</span>
                          <Badge>{rotuloTipoCliente(cliente.tipo_cliente)}</Badge>
                        </div>

                        {cliente.telefone && (
                          <p className="mt-1 text-lg text-texto-suave">
                            {formatarTelefone(cliente.telefone)}
                          </p>
                        )}

                        {cliente.email && (
                          <p className="break-words text-base text-texto-suave">
                            {cliente.email}
                          </p>
                        )}
                      </div>

                      <Icone nome="avancar" className="text-destaque" />
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Computador: tabela */}
              <div className="hidden overflow-hidden rounded-3xl border border-borda bg-cartao md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-lg">
                    <thead>
                      <tr className="border-b border-borda text-base text-texto-suave">
                        <th scope="col" className="px-5 py-4 font-bold">Nome</th>
                        <th scope="col" className="px-5 py-4 font-bold">Telefone</th>
                        <th scope="col" className="px-5 py-4 font-bold">E-mail</th>
                        <th scope="col" className="px-5 py-4 font-bold">Tipo</th>
                        <th scope="col" className="px-5 py-4 font-bold">Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filtrados.map((cliente) => (
                        <tr key={cliente.id} className="border-b border-borda last:border-b-0">
                          <td className="px-5 py-3 font-bold">{cliente.nome}</td>
                          <td className="whitespace-nowrap px-5 py-3">
                            {cliente.telefone ? formatarTelefone(cliente.telefone) : "—"}
                          </td>
                          <td className="px-5 py-3 break-all">{cliente.email || "—"}</td>
                          <td className="px-5 py-3">
                            <Badge>{rotuloTipoCliente(cliente.tipo_cliente)}</Badge>
                          </td>
                          <td className="px-5 py-3">
                            <LinkBotao
                              href={`/clientes/${cliente.id}`}
                              variante="secundario"
                              aria-label={`Ver ${cliente.nome}`}
                            >
                              Ver
                            </LinkBotao>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
