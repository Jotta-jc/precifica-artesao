import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { Cartao } from "@/components/ui/Cartao";
import { classeBotao, type VarianteBotao } from "@/components/ui/estiloBotao";
import { Icone, type NomeIcone } from "@/components/ui/Icone";
import { linkPublicoFoto } from "@/lib/imagens";
import { NOME_SISTEMA } from "@/lib/marca";
import {
  inicialDoNome,
  linkInstagram,
  linkWhatsapp,
  nomeDaVitrine,
  precoPublico,
  prazoPublico,
} from "@/lib/vitrine";
import { buscarVitrinePublica } from "@/services/vitrinePublica.server";

/* Sempre na hora: "Tirar do ar" e despublicar valem na próxima visita. */
export const dynamic = "force-dynamic";

/* Endereço do projeto Supabase: a mesma variável do CartaoFoto. */
const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Link público da foto ou do logo no bucket (caminho vazio ou inválido → null). */
function linkDaImagem(caminho: string | null): string | null {
  return URL_SUPABASE ? linkPublicoFoto(URL_SUPABASE, caminho) : null;
}

interface PaginaVitrineProps {
  params: Promise<{ endereco: string }>;
}

export async function generateMetadata({ params }: PaginaVitrineProps): Promise<Metadata> {
  const { endereco } = await params;
  const resultado = await buscarVitrinePublica(endereco);
  const robots = { index: false, follow: false };

  if (resultado.situacao === "ok") {
    return { title: `${nomeDaVitrine(resultado.vitrine.nome_atelie)} · Vitrine`, robots };
  }
  if (resultado.situacao === "nao_encontrada") {
    return { title: "Vitrine não encontrada", robots };
  }
  return { title: "Vitrine", robots };
}

/** Link externo com cara de botão: abre em nova aba. */
function LinkExterno({
  href,
  variante = "primario",
  icone,
  rotuloAcessivel,
  children,
}: {
  href: string;
  variante?: VarianteBotao;
  icone: NomeIcone;
  rotuloAcessivel?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={rotuloAcessivel ? `${rotuloAcessivel} (abre em nova aba)` : undefined}
      className={classeBotao({ variante, className: "w-full sm:w-auto" })}
    >
      <Icone nome={icone} />
      <span>{children}</span>
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}

export default async function PaginaVitrine({ params }: PaginaVitrineProps) {
  const { endereco } = await params;
  const resultado = await buscarVitrinePublica(endereco);

  if (resultado.situacao === "nao_encontrada") notFound();

  if (resultado.situacao === "erro") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Cartao>
          <div role="alert" className="flex flex-col items-start gap-4 text-lg text-texto">
            <div className="flex items-start gap-3">
              <Icone nome="alerta" className="mt-0.5 text-perigo" />
              <p>Não foi possível abrir a vitrine agora.</p>
            </div>
            <a
              href={`/v/${encodeURIComponent(endereco)}`}
              className={classeBotao({ variante: "secundario", className: "w-full sm:w-auto" })}
            >
              Tentar de novo
            </a>
          </div>
        </Cartao>
      </div>
    );
  }

  const { vitrine } = resultado;
  const nome = nomeDaVitrine(vitrine.nome_atelie);
  const linkLogo = linkDaImagem(vitrine.logo);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 md:px-8 md:py-10">
      {/* Abaixo de lg: tudo centralizado, um embaixo do outro. A partir de lg:
          faixa horizontal (logo | nome e "Sobre" | contato). */}
      <header className="rounded-3xl border border-borda bg-cartao px-5 py-6 md:px-8 lg:py-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 text-center lg:max-w-none lg:flex-row lg:items-center lg:gap-6 lg:text-left">
          {linkLogo && (
            <>
              {/* Foto do bucket público, já reduzida no envio (decisão Q9). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={linkLogo}
                alt={nome}
                loading="lazy"
                className="h-22 w-22 shrink-0 rounded-full border border-borda bg-cartao object-cover lg:h-18 lg:w-18"
              />
            </>
          )}

          <div className="flex w-full min-w-0 flex-col items-center gap-3 lg:flex-1 lg:items-start">
            <h1 className="break-words text-[30px] font-bold leading-tight text-texto md:text-4xl">
              {nome}
            </h1>

            <div aria-hidden="true" className="mx-auto h-0.5 w-10 bg-destaque lg:mx-0" />

            {vitrine.sobre && (
              <p className="whitespace-pre-line break-words text-lg text-texto-suave">
                {vitrine.sobre}
              </p>
            )}
          </div>

          <div className="flex w-full flex-col items-center gap-3 lg:w-auto lg:shrink-0 lg:items-end lg:text-right">
            {/* O12: o número não aparece em texto, só no link do botão. */}
            <p className="text-lg text-texto">Tire dúvidas e faça encomendas pelo WhatsApp.</p>

            {/* lg: um botão sobre o outro, os dois na largura do bloco. */}
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:flex-col lg:flex-nowrap">
              <LinkExterno href={linkWhatsapp(vitrine.whatsapp)} icone="conversa">
                Chamar no WhatsApp
              </LinkExterno>
              {vitrine.instagram && (
                <LinkExterno
                  href={linkInstagram(vitrine.instagram)}
                  variante="secundario"
                  icone="instagram"
                  rotuloAcessivel={`Ver @${vitrine.instagram} no Instagram`}
                >
                  Ver no Instagram
                </LinkExterno>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-texto">Produtos</h2>

        {vitrine.produtos.length === 0 ? (
          <p className="text-lg text-texto-suave">Ainda não há produtos na vitrine.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vitrine.produtos.map((produto) => {
              const prazo = prazoPublico(produto);
              const linkFoto = linkDaImagem(produto.foto);
              const inicial = inicialDoNome(produto.nome);

              return (
                <li key={produto.id} className="min-w-0">
                  <Cartao className="flex h-full flex-col gap-3">
                    {linkFoto ? (
                      <>
                        {/* Foto do bucket público, já reduzida no envio (decisão Q9). */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={linkFoto}
                          alt={produto.nome}
                          loading="lazy"
                          className="aspect-square w-full rounded-2xl border border-borda bg-cartao object-cover"
                        />
                      </>
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex aspect-square w-full items-center justify-center rounded-2xl border border-borda bg-destaque-suave"
                      >
                        {inicial ? (
                          <span className="text-5xl font-bold text-destaque-escuro">{inicial}</span>
                        ) : (
                          <Icone nome="vitrine" tamanho={56} className="text-destaque" />
                        )}
                      </div>
                    )}

                    <h3 className="break-words text-xl font-bold text-texto">{produto.nome}</h3>
                    {produto.tipo === "aula" && (
                      <div>
                        <Badge>Aula</Badge>
                      </div>
                    )}
                    {produto.descricao && (
                      <p className="whitespace-pre-line break-words text-lg text-texto-suave">
                        {produto.descricao}
                      </p>
                    )}
                    <p className="text-2xl font-bold text-destaque-escuro">
                      {precoPublico(produto)}
                    </p>
                    {prazo !== null && <p className="text-lg text-texto">{prazo}</p>}
                    <div className="mt-auto pt-2">
                      <LinkExterno
                        href={linkWhatsapp(vitrine.whatsapp, produto.nome)}
                        icone="conversa"
                        rotuloAcessivel={`Pedir ${produto.nome} pelo WhatsApp`}
                      >
                        Pedir pelo WhatsApp
                      </LinkExterno>
                    </div>
                  </Cartao>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="border-t border-borda pt-6 text-center text-base text-texto-suave">
        Vitrine feita com {NOME_SISTEMA} ·{" "}
        <Link href="/privacidade" className="underline">
          Privacidade
        </Link>
      </footer>
    </div>
  );
}
