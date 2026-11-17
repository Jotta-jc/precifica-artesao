"use client";

import { useState, type FormEvent } from "react";

import { SelectField } from "@/components/forms/SelectField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { TextField } from "@/components/forms/TextField";
import { Button } from "@/components/ui/Button";
import { opcoesTipoCliente } from "@/lib/clientes";
import { formatarTelefone } from "@/lib/formatar";
import type { ClienteTipo } from "@/types/client";

/** Dados já limpos, prontos para gravar. Campo vazio vem como null. */
export interface DadosCliente {
  nome: string;
  telefone: string | null;
  email: string | null;
  instagram: string | null;
  tipo_cliente: ClienteTipo;
  observacoes: string | null;
}

interface FormularioClienteProps {
  valoresIniciais?: Partial<Record<keyof DadosCliente, string | null>>;
  textoSalvar: string;
  salvando: boolean;
  aoSalvar: (dados: DadosCliente) => void;
  aoCancelar: () => void;
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ouNulo(texto: string) {
  const limpo = texto.trim();
  return limpo === "" ? null : limpo;
}

function tipoValido(valor: string | null | undefined): ClienteTipo {
  return opcoesTipoCliente.some((o) => o.valor === valor)
    ? (valor as ClienteTipo)
    : "cliente";
}

/** Formulário de cliente usado no cadastro e na edição. */
export function FormularioCliente({
  valoresIniciais,
  textoSalvar,
  salvando,
  aoSalvar,
  aoCancelar,
}: FormularioClienteProps) {
  const [nome, setNome] = useState(valoresIniciais?.nome ?? "");
  const [telefone, setTelefone] = useState(
    formatarTelefone(valoresIniciais?.telefone ?? "")
  );
  const [email, setEmail] = useState(valoresIniciais?.email ?? "");
  const [instagram, setInstagram] = useState(valoresIniciais?.instagram ?? "");
  const [tipo, setTipo] = useState<ClienteTipo>(
    tipoValido(valoresIniciais?.tipo_cliente)
  );
  const [observacoes, setObservacoes] = useState(
    valoresIniciais?.observacoes ?? ""
  );

  const [erroNome, setErroNome] = useState("");
  const [erroTelefone, setErroTelefone] = useState("");
  const [erroEmail, setErroEmail] = useState("");

  function enviar(e: FormEvent) {
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

    aoSalvar({
      nome: nomeLimpo,
      telefone: ouNulo(digitosTelefone),
      email: ouNulo(emailLimpo),
      instagram: ouNulo(
        instagram.trim().replace(/^@+/, "").replace(/\s/g, "")
      ),
      tipo_cliente: tipo,
      observacoes: ouNulo(observacoes),
    });
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
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
          aoMudar={(v) => setTipo(tipoValido(v))}
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
          {textoSalvar}
        </Button>

        <Button
          variante="secundario"
          onClick={aoCancelar}
          disabled={salvando}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
