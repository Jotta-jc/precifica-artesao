"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  FormularioCliente,
  type DadosCliente,
} from "@/components/clientes/FormularioCliente";
import { useAvisos } from "@/components/ui/Avisos";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { createClient } from "@/lib/supabase/client";
import { createCliente } from "@/services/clientes.service";

export default function NovoClientePage() {
  const router = useRouter();
  const { avisar } = useAvisos();
  const [salvando, setSalvando] = useState(false);

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

      /* No cadastro, campo vazio simplesmente não é enviado. */
      await createCliente({
        nome: dados.nome,
        telefone: dados.telefone ?? undefined,
        email: dados.email ?? undefined,
        instagram: dados.instagram ?? undefined,
        tipo_cliente: dados.tipo_cliente,
        observacoes: dados.observacoes ?? undefined,
      });

      avisar({ tipo: "sucesso", texto: "Cliente cadastrado." });
      router.push("/clientes");
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <LinkBotao
        href="/clientes"
        variante="discreto"
        icone="voltar"
        className="mb-4 -ml-3"
      >
        Voltar para clientes
      </LinkBotao>

      <CabecalhoPagina titulo="Novo cliente" />

      <Cartao>
        <FormularioCliente
          textoSalvar="Salvar cliente"
          salvando={salvando}
          aoSalvar={salvar}
          aoCancelar={() => router.push("/clientes")}
        />
      </Cartao>
    </div>
  );
}
