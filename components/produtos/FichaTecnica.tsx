"use client";

import { useState, type FormEvent } from "react";

import { QuantityField } from "@/components/forms/QuantityField";
import { SelectField } from "@/components/forms/SelectField";
import { useAvisos } from "@/components/ui/Avisos";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Cartao } from "@/components/ui/Cartao";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icone } from "@/components/ui/Icone";
import { LinkBotao } from "@/components/ui/LinkBotao";
import { formatarCustoUnitario, formatarMoeda } from "@/lib/formatar";
import { formatarQuantidadeComUnidade, rotuloUnidade } from "@/lib/materiais";
import { custoDoItem, fichaTemMaterialSemCusto, type ItemFicha } from "@/lib/produtos";
import type { Material } from "@/services/materiais.service";
import {
  adicionarItemFicha,
  atualizarItemFicha,
  codigoDoErro,
  mensagemErroProduto,
  removerItemFicha,
} from "@/services/produtos.service";

interface FichaTecnicaProps {
  produtoId: number;
  itens: ItemFicha[];
  /** Todos os materiais da conta (a ficha mostra só os ativos para adicionar). */
  materiais: Material[];
  /** Recarrega a ficha do banco (getFichaTecnica) depois de cada gravação. */
  aoRecarregar: () => Promise<void>;
}

/* Erros que pertencem ao campo de quantidade. */
const ERROS_DE_QUANTIDADE = ["23514", "QUANTIDADE_INVALIDA"];

const MENSAGEM_GENERICA = "Não foi possível salvar agora. Tente de novo em instantes.";

function mensagemDoErro(erro: unknown) {
  return mensagemErroProduto(erro) ?? MENSAGEM_GENERICA;
}

function textoCustoUnidade(item: ItemFicha) {
  return `${formatarCustoUnitario(item.custo_por_unidade)} por ${rotuloUnidade(item.unidade, 1)}`;
}

/** Aviso âmbar com ícone + texto. */
function AvisoSemCusto({ materialId }: { materialId: number }) {
  return (
    <div className="mt-3 flex flex-col items-start gap-2 rounded-2xl bg-aviso-fundo p-3 text-base text-aviso-texto">
      <span className="inline-flex items-center gap-2 font-bold">
        <Icone nome="alerta" tamanho={20} />
        Material sem custo
      </span>
      <LinkBotao href={`/materiais/${materialId}`} variante="discreto" className="-ml-3">
        Ver o material
      </LinkBotao>
    </div>
  );
}

export function FichaTecnica({ produtoId, itens, materiais, aoRecarregar }: FichaTecnicaProps) {
  const { avisar } = useAvisos();

  /* Adicionar */
  const [materialId, setMaterialId] = useState("");
  const [quantidade, setQuantidade] = useState<number | null>(null);
  const [erroMaterial, setErroMaterial] = useState("");
  const [erroQuantidade, setErroQuantidade] = useState("");
  const [adicionando, setAdicionando] = useState(false);

  /* Tirar da ficha */
  const [itemParaTirar, setItemParaTirar] = useState<ItemFicha | null>(null);
  const [tirando, setTirando] = useState(false);

  const naFicha = new Set(itens.map((i) => i.material_id));
  const ativos = materiais.filter((m) => m.ativo !== false);
  const disponiveis = ativos
    .filter((m) => !naFicha.has(m.id))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));

  const materialEscolhido = disponiveis.find((m) => String(m.id) === materialId) ?? null;

  /* Total = soma de custoDoItem, igual ao custo de materiais do motor (os dois somam item por item, em centavos). */
  const totalMateriais = itens.reduce((total, item) => total + custoDoItem(item), 0);

  async function adicionar(e: FormEvent) {
    e.preventDefault();

    const semMaterial = !materialEscolhido;
    const semQuantidade = quantidade === null || quantidade <= 0;

    setErroMaterial(semMaterial ? "Escolha o material." : "");
    setErroQuantidade(semQuantidade ? "Digite quanto a peça usa (maior que zero)." : "");

    if (semMaterial) {
      document.getElementById("ficha-material")?.focus();
      return;
    }
    if (semQuantidade || quantidade === null) {
      document.getElementById("ficha-quantidade")?.focus();
      return;
    }

    setAdicionando(true);

    try {
      await adicionarItemFicha(produtoId, materialEscolhido.id, quantidade);
      setMaterialId("");
      setQuantidade(null);
      await aoRecarregar();
      avisar({ tipo: "sucesso", texto: "Material adicionado." });
    } catch (erro) {
      if (ERROS_DE_QUANTIDADE.includes(codigoDoErro(erro) ?? "")) {
        setErroQuantidade(mensagemDoErro(erro));
        document.getElementById("ficha-quantidade")?.focus();
      } else {
        avisar({ tipo: "erro", texto: mensagemDoErro(erro) });
      }
    } finally {
      setAdicionando(false);
    }
  }

  async function tirar() {
    if (!itemParaTirar) return;
    setTirando(true);

    try {
      await removerItemFicha(itemParaTirar.id);
      /* Fecha o diálogo antes do aviso (o diálogo cobre a tela). */
      setItemParaTirar(null);
      await aoRecarregar();
      avisar({ tipo: "sucesso", texto: "Material tirado da ficha." });
    } catch (erro) {
      setItemParaTirar(null);
      avisar({ tipo: "erro", texto: mensagemDoErro(erro) });
    } finally {
      setTirando(false);
    }
  }

  return (
    <Cartao titulo="Ficha técnica">
      <p className="mb-4 text-lg text-texto-suave">
        Os materiais que a peça usa. O custo vem sempre do preço atual de cada material.
      </p>

      {fichaTemMaterialSemCusto(itens) && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-aviso-fundo p-4 text-lg text-aviso-texto">
          <Icone nome="alerta" className="mt-0.5" />
          <p>
            Algum material está sem custo, e o preço pode sair baixo demais. Informe o
            preço da compra no cadastro do material, em Materiais, ou registre uma compra
            em Estoque.
          </p>
        </div>
      )}

      {/* Itens da ficha */}
      {itens.length === 0 ? (
        <p className="mb-6 text-lg text-texto-suave">Nenhum material na ficha ainda.</p>
      ) : (
        <>
          <ul className="mb-4 flex flex-col gap-3">
            {itens.map((item) => (
              <LinhaItem
                key={`${item.id}-${item.quantidade}`}
                item={item}
                aoPedirParaTirar={() => setItemParaTirar(item)}
                aoRecarregar={aoRecarregar}
              />
            ))}
          </ul>

          <p className="mb-6 rounded-2xl bg-destaque-suave px-4 py-3 text-lg text-destaque-escuro">
            Custo dos materiais: <strong>{formatarMoeda(totalMateriais)}</strong>
          </p>
        </>
      )}

      {/* Adicionar material */}
      <div className="rounded-2xl border border-borda p-4">
        <h3 className="mb-4 text-xl font-bold">Adicionar material</h3>

        {ativos.length === 0 ? (
          <div className="flex flex-col items-start gap-3 text-lg">
            <p>Cadastre materiais primeiro.</p>
            <LinkBotao href="/materiais/novo" icone="mais">
              Cadastrar material
            </LinkBotao>
          </div>
        ) : disponiveis.length === 0 ? (
          <p className="text-lg text-texto-suave">Todos os seus materiais já estão na ficha.</p>
        ) : (
          <form onSubmit={adicionar} noValidate className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                id="ficha-material"
                rotulo="Material"
                valor={materialId}
                aoMudar={(v) => {
                  setMaterialId(v);
                  setErroMaterial("");
                }}
                opcoes={disponiveis.map((m) => ({ valor: String(m.id), rotulo: m.nome }))}
                textoVazio="Escolha o material"
                erro={erroMaterial || undefined}
              />
              <QuantityField
                id="ficha-quantidade"
                rotulo="Quanto a peça usa"
                valor={quantidade}
                aoMudar={(v) => {
                  setQuantidade(v);
                  setErroQuantidade("");
                }}
                unidade={
                  materialEscolhido ? rotuloUnidade(materialEscolhido.unidade_uso, 2) : undefined
                }
                casas={3}
                dica={
                  materialEscolhido
                    ? `Na unidade do material (${rotuloUnidade(materialEscolhido.unidade_uso, 2)}).`
                    : "Escolha o material para ver a unidade."
                }
                erro={erroQuantidade || undefined}
              />
            </div>
            <div>
              <Button
                type="submit"
                icone="mais"
                carregando={adicionando}
                className="w-full sm:w-auto"
              >
                Adicionar à ficha
              </Button>
            </div>
          </form>
        )}
      </div>

      <ConfirmDialog
        aberto={itemParaTirar !== null}
        titulo={`Tirar ${itemParaTirar?.nome ?? "material"} da ficha?`}
        mensagem="O material sai da ficha deste produto. O cadastro do material e o estoque não mudam."
        textoConfirmar="Tirar da ficha"
        textoCancelar="Não tirar"
        variante="perigo"
        carregando={tirando}
        aoConfirmar={tirar}
        aoCancelar={() => setItemParaTirar(null)}
      />
    </Cartao>
  );
}

/** Um item da ficha: dados, quantidade editável e o botão de tirar. */
function LinhaItem({
  item,
  aoPedirParaTirar,
  aoRecarregar,
}: {
  item: ItemFicha;
  aoPedirParaTirar: () => void;
  aoRecarregar: () => Promise<void>;
}) {
  const { avisar } = useAvisos();

  const [quantidade, setQuantidade] = useState<number | null>(item.quantidade);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const idCampo = `ficha-item-${item.id}`;
  const mudou = quantidade !== item.quantidade;

  async function salvarQuantidade() {
    if (quantidade === null || quantidade <= 0) {
      setErro("Digite quanto a peça usa (maior que zero).");
      document.getElementById(idCampo)?.focus();
      return;
    }

    setSalvando(true);

    try {
      await atualizarItemFicha(item.id, quantidade);
      await aoRecarregar();
      avisar({ tipo: "sucesso", texto: "Quantidade salva." });
    } catch (falha) {
      if (ERROS_DE_QUANTIDADE.includes(codigoDoErro(falha) ?? "")) {
        setErro(mensagemDoErro(falha));
        document.getElementById(idCampo)?.focus();
      } else {
        avisar({ tipo: "erro", texto: mensagemDoErro(falha) });
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <li className="rounded-2xl border border-borda bg-cartao p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg font-bold">{item.nome}</span>
        {!item.ativo && <Badge>Arquivado</Badge>}
      </div>

      <dl className="mt-2 grid gap-1 text-lg sm:grid-cols-3">
        <div>
          <dt className="text-base text-texto-suave">Usa</dt>
          <dd>{formatarQuantidadeComUnidade(item.quantidade, item.unidade)}</dd>
        </div>
        <div>
          <dt className="text-base text-texto-suave">Custo por unidade</dt>
          <dd>{textoCustoUnidade(item)}</dd>
        </div>
        <div>
          <dt className="text-base text-texto-suave">Custo do item</dt>
          <dd className="font-bold">{formatarMoeda(custoDoItem(item))}</dd>
        </div>
      </dl>

      {item.semCusto && <AvisoSemCusto materialId={item.material_id} />}

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
        <QuantityField
          id={idCampo}
          rotulo="Mudar a quantidade"
          valor={quantidade}
          aoMudar={(v) => {
            setQuantidade(v);
            setErro("");
          }}
          unidade={rotuloUnidade(item.unidade, 2)}
          casas={3}
          erro={erro || undefined}
        />
        <Button
          variante="secundario"
          carregando={salvando}
          disabled={!mudou}
          onClick={salvarQuantidade}
          className="w-full md:w-auto"
        >
          Salvar quantidade
        </Button>
        <Button
          variante="discreto"
          icone="excluir"
          disabled={salvando}
          onClick={aoPedirParaTirar}
          className="w-full md:w-auto"
        >
          Tirar da ficha
        </Button>
      </div>
    </li>
  );
}
