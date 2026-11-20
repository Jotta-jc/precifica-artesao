"use client";

import { useEffect, useState } from "react";

import { Cartao } from "@/components/ui/Cartao";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { precisaLembrete } from "@/lib/termometro";
import { listarHistorico } from "@/services/termometro.service";

/* Lembrete do termômetro da marca no Início (K10): aparece a partir do dia 1
   quando o mês atual ainda não tem resposta. Tem a própria busca; enquanto
   carrega ou se a busca falhar, não mostra nada (o Início segue normal). */

type Situacao =
  | { tipo: "escondido" }
  | { tipo: "mostrar"; jaRespondeu: boolean };

export function LembreteTermometro() {
  const [situacao, setSituacao] = useState<Situacao>({ tipo: "escondido" });

  useEffect(() => {
    let ativo = true;

    listarHistorico(1)
      .then((lista) => {
        if (!ativo) return;
        const mesUltimaResposta = lista[0]?.mes ?? null;

        if (precisaLembrete(mesUltimaResposta)) {
          setSituacao({ tipo: "mostrar", jaRespondeu: mesUltimaResposta !== null });
        }
      })
      .catch(() => {
        /* Falha no lembrete não aparece para a usuária. */
      });

    return () => {
      ativo = false;
    };
  }, []);

  if (situacao.tipo === "escondido") return null;

  return (
    <Cartao titulo="Termômetro da marca" className="mb-6">
      <p className="mb-4 text-lg text-texto">
        {situacao.jaRespondeu
          ? "Novo mês: responda o termômetro da marca para ver se o seu nível mudou."
          : "Descubra o nível da sua marca em 5 perguntas."}
      </p>
      <LinkBotao href="/empresa/termometro" icone="avancar">
        Responder o termômetro
      </LinkBotao>
    </Cartao>
  );
}
