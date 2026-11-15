"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { SelectField } from "@/components/forms/SelectField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { TextField } from "@/components/forms/TextField";
import { useAvisos } from "@/components/ui/Avisos";
import { Button } from "@/components/ui/Button";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { Icone } from "@/components/ui/Icone";
import { opcoesTipoCliente } from "@/lib/clientes";
import { createClient } from "@/lib/supabase/client";
import { createCliente } from "@/services/clientes.service";
import type { ClienteTipo } from "@/types/client";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Texto vazio vira undefined (o banco grava vazio como "sem valor"). */
function ouNada(texto: string) {
  const limpo = texto.trim();
  return limpo === "" ? undefined : limpo;
}

export default function NovoClientePage() {
  const router = useRouter();
  const { avisar } = useAvisos();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tipo, setTipo] = useState<ClienteTipo>("cliente");
  const [observacoes, setObservacoes] = useState("");

  const [erroNome, setErroNome] = useState("");
  const [erroTelefone, setErroTelefone] = useState("");
  const [erroEmail, setErroEmail] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: FormEvent) {
    e.preventDefault();

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim();
    const digitosTelefone = telefone.replace(/\D/g, "");

    const novoErroNome = nomeLimpo ? "" : "Digite o nome do cliente.";
    const novoErroTelefone =
      telefone.trim() && digitosTelefone.length < 10
        ? "Digite o telefone com DDD, como (41) 99228-8256."
        : "";
    const novoErroEmail =
      emailLimpo && !EMAIL_VALIDO.test(emailLimpo)
        ? "Digite um e-mail válido, como maria@email.com."
        : "";

    setErroNome(novoErroNome);
    setErroTelefone(novoErroTelefone);
    setErroEmail(novoErroEmail);

    /* Leva o foco ao primeiro campo com erro, na ordem da tela. */
    const primeiroErro = novoErroNome
      ? "cliente-nome"
      : novoErroTelefone
        ? "cliente-telefone"
        : novoErroEmail
          ? "cliente-email"
          : null;

    if (primeiroErro) {
      document.getElementById(primeiroErro)?.focus();
      return;
    }

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

      await createCliente({
        nome: nomeLimpo,
        telefone: ouNada(digitosTelefone),
        email: ouNada(emailLimpo),
        instagram: ouNada(instagram.trim().replace(/^@+/, "").replace(/\s/g, "")),
        tipo_cliente: tipo,
        observacoes: ouNada(observacoes),
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
      <Link
        href="/clientes"
        className="mb-4 inline-flex min-h-12 items-center gap-2 rounded-2xl px-2 text-lg font-bold text-destaque hover:bg-destaque-suave focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-destaque"
      >
        <Icone nome="voltar" />
        Voltar para clientes
      </Link>

      <CabecalhoPagina titulo="Novo cliente" />

      <Cartao>
        <form onSubmit={salvar} noValidate className="flex flex-col gap-6">
          <TextField
            id="cliente-nome"
            rotulo="Nome"
            valor={nome}
            aoMudar={(v) => {
              setNome(v);
              if (erroNome) setErroNome("");
            }}
            autoComplete="name"
            obrigatorio
            erro={erroNome || undefined}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              id="cliente-telefone"
              rotulo="Telefone ou WhatsApp"
              tipo="tel"
              autoComplete="tel"
              valor={telefone}
              aoMudar={(v) => {
                setTelefone(v);
                if (erroTelefone) setErroTelefone("");
              }}
              dica="Com DDD, por exemplo (41) 99228-8256"
              erro={erroTelefone || undefined}
            />

            <TextField
              id="cliente-email"
              rotulo="E-mail"
              tipo="email"
              autoComplete="email"
              valor={email}
              aoMudar={(v) => {
                setEmail(v);
                if (erroEmail) setErroEmail("");
              }}
              erro={erroEmail || undefined}
            />

            <TextField
              rotulo="Instagram"
              valor={instagram}
              aoMudar={setInstagram}
              dica="Por exemplo @maria.artesanatos"
            />

            <SelectField
              rotulo="Tipo"
              valor={tipo}
              aoMudar={(v) => setTipo((v || "cliente") as ClienteTipo)}
              opcoes={opcoesTipoCliente}
            />
          </div>

          <TextAreaField
            rotulo="Observações"
            valor={observacoes}
            aoMudar={setObservacoes}
          />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              icone="sucesso"
              carregando={salvando}
              className="w-full sm:w-auto"
            >
              Salvar cliente
            </Button>

            <Button
              variante="secundario"
              onClick={() => router.push("/clientes")}
              disabled={salvando}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Cartao>
    </div>
  );
}
