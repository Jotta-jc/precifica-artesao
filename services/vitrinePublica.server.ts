/* Vitrine pública (V5b). Só servidor: nunca importar em "use client".
   Sem cache entre visitas: "Tirar do ar" e despublicar valem na hora.
   O cache do React só junta as chamadas da MESMA montagem da página
   (generateMetadata + página). */

import { cache } from "react";

import { criarClientePublico } from "@/lib/supabase/publico";
import { lerVitrinePublica, type VitrinePublica } from "@/lib/vitrine";

export type ResultadoVitrinePublica =
  | { situacao: "ok"; vitrine: VitrinePublica }
  | { situacao: "nao_encontrada" }
  | { situacao: "erro" };

export const buscarVitrinePublica = cache(
  async (endereco: string): Promise<ResultadoVitrinePublica> => {
    try {
      /* Sem cookies: sempre anon, mesmo com a artesã logada (o middleware
         não renova a sessão em /v/). */
      const supabase = criarClientePublico();
      const { data, error } = await supabase.rpc("vitrine_publica", {
        p_endereco: endereco,
      });

      if (error) {
        console.error("vitrine_publica:", error.code, error.message);
        return { situacao: "erro" };
      }

      const vitrine = data === null ? null : lerVitrinePublica(data);
      if (vitrine === null) return { situacao: "nao_encontrada" };

      return { situacao: "ok", vitrine };
    } catch {
      /* Falha de rede ou de configuração: sem detalhes no log. */
      console.error("vitrine_publica: falha inesperada");
      return { situacao: "erro" };
    }
  }
);
