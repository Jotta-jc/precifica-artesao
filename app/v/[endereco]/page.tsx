import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { Cartao } from "@/components/ui/Cartao";
import { classeBotao, type VarianteBotao } from "@/components/ui/estiloBotao";
import { Icone, type NomeIcone } from "@/components/ui/Icone";
import {
  formatarWhatsapp,
  linkInstagram,
  linkWhatsapp,
  nomeDaVitrine,
  precoPublico,
  prazoPublico,
} from "@/lib/vitrine";
import { buscarVitrinePublica } from "@/services/vitrinePublica.server";

/* Sempre na hora: "Tirar do ar" e despublicar valem na próxima visita. */
export const dynamic = "force-dynamic";

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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-3">
        <h1 className="break-words text-[28px] font-bold leading-tight text-texto md:text-[34px]">
          {nome}
        </h1>
        {vitrine.sobre && (
          <p className="whitespace-pre-line break-words text-lg text-texto-suave">
            {vitrine.sobre}
          </p>
        )}
      </header>

      <Cartao titulo="Fale com o ateliê">
        <div className="flex flex-col gap-4">
          <p className="text-lg text-texto">
            WhatsApp: <strong>{formatarWhatsapp(vitrine.whatsapp)}</strong>
          </p>
          {vitrine.instagram && (
            <p className="break-words text-lg text-texto">
              Instagram: <strong>@{vitrine.instagram}</strong>
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <LinkExterno href={linkWhatsapp(vitrine.whatsapp)} icone="conversa">
              Chamar no WhatsApp
            </LinkExterno>
            {vitrine.instagram && (
              <LinkExterno
                href={linkInstagram(vitrine.instagram)}
                variante="secundario"
                icone="instagram"
              >
                Ver no Instagram
              </LinkExterno>
            )}
          </div>
        </div>
      </Cartao>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-texto">Produtos</h2>

        {vitrine.produtos.length === 0 ? (
          <p className="text-lg text-texto-suave">Ainda não há produtos na vitrine.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {vitrine.produtos.map((produto) => {
              const prazo = prazoPublico(produto);

              return (
                <li key={produto.id} className="min-w-0">
                  <Cartao className="flex h-full flex-col gap-3">
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
    </div>
  );
}
