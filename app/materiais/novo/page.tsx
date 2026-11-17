"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FormularioMaterial } from "@/components/materiais/FormularioMaterial";
import { useAvisos } from "@/components/ui/Avisos";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { Loading } from "@/components/ui/Loading";
import { createClient } from "@/lib/supabase/client";
import {
  createCategoriaMaterial,
  createMaterial,
  getCategoriasMaterial,
  type CategoriaMaterial,
  type DadosMaterial,
} from "@/services/materiais.service";

type Estado = "carregando" | "erro" | "pronto";

export default function NovoMaterialPage() {
  const router = useRouter();
  const { avisar } = useAvisos();

  const [estado, setEstado] = useState<Estado>("carregando");
  const [tentativa, setTentativa] = useState(0);
  const [categorias, setCategorias] = useState<CategoriaMaterial[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    getCategoriasMaterial()
      .then((lista) => {
        if (!ativo) return;
        setCategorias(lista);
        setEstado("pronto");
      })
      .catch(() => {
        if (ativo) setEstado("erro");
      });

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  async function salvar(dados: DadosMaterial, estoqueInicial: number) {
    setSalvando(true);

    try {
      const {
        data: { user },
      } = await createClient().auth.getUser();

      if (!user) {
        avisar({ tipo: "erro", texto: "Sua sessão expirou. Entre novamente para salvar." });
        return;
      }

      await createMaterial(dados, estoqueInicial);

      avisar({ tipo: "sucesso", texto: "Material cadastrado." });
      router.push("/materiais");
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
        href="/materiais"
        variante="discreto"
        icone="voltar"
        className="mb-4 -ml-3"
      >
        Voltar para materiais
      </LinkBotao>

      <CabecalhoPagina titulo="Novo material" />

      {estado === "carregando" && <Loading texto="Carregando categorias..." />}

      {estado === "erro" && (
        <ErrorState
          aoTentarDeNovo={() => {
            setEstado("carregando");
            setTentativa((n) => n + 1);
          }}
        />
      )}

      {estado === "pronto" && (
        <Cartao>
          <FormularioMaterial
            categorias={categorias}
            aoCriarCategoria={createCategoriaMaterial}
            textoSalvar="Salvar material"
            salvando={salvando}
            aoSalvar={salvar}
            aoCancelar={() => router.push("/materiais")}
          />
        </Cartao>
      )}
    </div>
  );
}
