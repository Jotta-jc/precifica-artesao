"use client";

import { useState } from "react";

import { CheckboxField } from "@/components/forms/CheckboxField";
import { MoneyField } from "@/components/forms/MoneyField";
import { QuantityField } from "@/components/forms/QuantityField";
import { SelectField } from "@/components/forms/SelectField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { TextField } from "@/components/forms/TextField";
import { useAvisos } from "@/components/ui/Avisos";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icone, nomesIcones } from "@/components/ui/Icone";
import { Loading } from "@/components/ui/Loading";
import {
  formatarMoeda,
  formatarNumero,
  lerNumero,
} from "@/lib/formatar";
import { NOME_SISTEMA } from "@/lib/marca";

const exemplosMoeda = [0, 12.5, 1234.5, NaN];
const exemplosNumero: [number, number | undefined][] = [
  [1234.5, undefined],
  [2.125, 2],
  [0.333333, 3],
  [10, undefined],
];
const exemplosLeitura = [
  "12,50",
  "1.234,50",
  "12.5",
  "1.234",
  "0.333",
  "",
  "abc",
];

const opcoesCategoria = [
  { valor: "bolsas", rotulo: "Bolsas" },
  { valor: "acessorios", rotulo: "Acessórios" },
  { valor: "decoracao", rotulo: "Decoração" },
];

export default function KitPage() {
  const { avisar } = useAvisos();

  const [tentativas, setTentativas] = useState(0);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [busca, setBusca] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categoriaErro, setCategoriaErro] = useState("");
  const [aceitaEncomenda, setAceitaEncomenda] = useState(true);
  const [preco, setPreco] = useState<number | null>(null);
  const [custo, setCusto] = useState<number | null>(12.5);
  const [quantidade, setQuantidade] = useState<number | null>(null);
  const [linha, setLinha] = useState<number | null>(2.5);

  const [confirmarAberto, setConfirmarAberto] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  function confirmarExclusao() {
    setExcluindo(true);

    /* Simula a espera do banco na demonstração. */
    setTimeout(() => {
      setExcluindo(false);
      setConfirmarAberto(false);
      avisar({
        tipo: "sucesso",
        texto: "Produto de exemplo excluído.",
      });
    }, 1200);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex items-start gap-3 rounded-2xl bg-aviso-fundo p-4 text-lg text-aviso-texto">
        <Icone nome="informacao" className="mt-0.5" />
        <p>
          Página de demonstração do kit visual. Não aparece no menu.
        </p>
      </div>

      <CabecalhoPagina
        titulo="Kit visual"
        subtitulo={`Componentes base do ${NOME_SISTEMA} com o visual aprovado.`}
        acao={
          <Button icone="mais">Novo produto</Button>
        }
      />

      <div className="flex flex-col gap-6">
        <Cartao titulo="Botões">
          <div className="flex flex-col gap-6">
            {(
              [
                ["primario", "Primário"],
                ["secundario", "Secundário"],
                ["perigo", "Perigo"],
                ["discreto", "Discreto"],
              ] as const
            ).map(([variante, rotulo]) => (
              <div key={variante}>
                <h3 className="mb-3 text-lg font-bold text-texto-suave">
                  {rotulo}
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button variante={variante}>Salvar</Button>
                  <Button variante={variante} carregando>
                    Salvar
                  </Button>
                  <Button variante={variante} disabled>
                    Desabilitado
                  </Button>
                  <Button
                    variante={variante}
                    icone={variante === "perigo" ? "excluir" : "editar"}
                  >
                    {variante === "perigo" ? "Excluir" : "Editar"}
                  </Button>
                </div>
              </div>
            ))}

            <div>
              <h3 className="mb-3 text-lg font-bold text-texto-suave">
                Largura total
              </h3>
              <Button larguraTotal icone="sucesso">
                Confirmar pedido
              </Button>
            </div>
          </div>
        </Cartao>

        <Cartao titulo="Ícones">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {nomesIcones.map((nome) => (
              <li
                key={nome}
                className="flex flex-col items-center gap-2 rounded-2xl border border-borda p-3 text-texto"
              >
                <Icone nome={nome} tamanho={28} />
                <span className="text-base">{nome}</span>
              </li>
            ))}
          </ul>
        </Cartao>

        <Cartao titulo="Cartão">
          <p className="text-lg text-texto-suave">
            Este é um cartão com título. Use para agrupar informações.
          </p>
        </Cartao>

        <Cartao titulo="Selos">
          <div className="flex flex-wrap gap-3">
            <Badge>Orçamento</Badge>
            <Badge variante="sucesso">Entregue</Badge>
            <Badge variante="aviso">Estoque baixo</Badge>
            <Badge variante="perigo">Atrasado</Badge>
          </div>
        </Cartao>

        <Cartao titulo="Carregando">
          <Loading />
          <Loading texto="Buscando seus materiais..." />
        </Cartao>

        <Cartao titulo="Lista vazia">
          <EmptyState
            icone="vendas"
            titulo="Você ainda não tem clientes"
            texto="Cadastre a primeira cliente para começar a registrar pedidos."
            acao={
              <Button icone="mais">
                Cadastrar o primeiro cliente
              </Button>
            }
          />
        </Cartao>

        <Cartao titulo="Erro ao carregar">
          <ErrorState
            aoTentarDeNovo={() => setTentativas((n) => n + 1)}
          />
          <p className="mt-3 text-base text-texto-suave">
            Tentativas nesta demonstração: {tentativas}
          </p>
        </Cartao>

        <Cartao titulo="Campos de texto">
          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              rotulo="Nome do produto"
              valor={nome}
              aoMudar={setNome}
              placeholder="Ex.: Bolsa de crochê"
            />
            <TextField
              rotulo="E-mail"
              tipo="email"
              autoComplete="email"
              valor={email}
              aoMudar={setEmail}
              dica="Usado só para enviar o recibo."
            />
            <TextField
              rotulo="Telefone"
              tipo="tel"
              autoComplete="tel"
              valor={telefone}
              aoMudar={setTelefone}
              obrigatorio
            />
            <TextField
              rotulo="Buscar cliente"
              tipo="search"
              valor={busca}
              aoMudar={setBusca}
              erro="Digite pelo menos 2 letras para buscar."
            />
          </div>

          <div className="mt-6">
            <TextAreaField
              rotulo="Descrição"
              valor={descricao}
              aoMudar={setDescricao}
              dica="Conte como a peça é feita e os cuidados de lavagem."
            />
          </div>
        </Cartao>

        <Cartao titulo="Lista de opções e caixa de marcar">
          <div className="grid gap-6 md:grid-cols-2">
            <SelectField
              rotulo="Categoria"
              valor={categoria}
              aoMudar={(v) => {
                setCategoria(v);
                setCategoriaErro("");
              }}
              opcoes={opcoesCategoria}
              obrigatorio
              erro={categoriaErro || undefined}
              dica="Escolha onde o produto aparece na vitrine."
            />

            <div className="flex flex-col gap-2">
              <CheckboxField
                rotulo="Aceito encomendas"
                marcado={aceitaEncomenda}
                aoMudar={setAceitaEncomenda}
                dica="As clientes podem pedir peças sob medida."
              />
            </div>
          </div>

          <div className="mt-4">
            <Button
              variante="secundario"
              onClick={() =>
                setCategoriaErro(
                  categoria ? "" : "Escolha uma categoria."
                )
              }
            >
              Conferir categoria
            </Button>
          </div>
        </Cartao>

        <Cartao titulo="Dinheiro e quantidade">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <MoneyField
                rotulo="Preço de venda"
                valor={preco}
                aoMudar={setPreco}
                obrigatorio
                dica="Digite como 12,50 ou 1.234,50."
              />
              <p className="mt-2 text-base text-texto-suave">
                Valor lido: {String(preco)}
              </p>
            </div>

            <div>
              <MoneyField
                rotulo="Custo dos materiais"
                valor={custo}
                aoMudar={setCusto}
              />
              <p className="mt-2 text-base text-texto-suave">
                Valor lido: {String(custo)}
              </p>
            </div>

            <div>
              <QuantityField
                rotulo="Quantidade em estoque"
                valor={quantidade}
                aoMudar={setQuantidade}
                unidade="unidades"
                casas={0}
              />
              <p className="mt-2 text-base text-texto-suave">
                Valor lido: {String(quantidade)}
              </p>
            </div>

            <div>
              <QuantityField
                rotulo="Linha usada"
                valor={linha}
                aoMudar={setLinha}
                unidade="metros"
              />
              <p className="mt-2 text-base text-texto-suave">
                Valor lido: {String(linha)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Button
              variante="discreto"
              onClick={() => {
                setPreco(null);
                setCusto(null);
                setQuantidade(null);
                setLinha(null);
              }}
            >
              Limpar valores
            </Button>
          </div>
        </Cartao>

        <Cartao titulo="Confirmação">
          <Button
            variante="perigo"
            icone="excluir"
            onClick={() => setConfirmarAberto(true)}
          >
            Excluir produto de exemplo
          </Button>

          <ConfirmDialog
            aberto={confirmarAberto}
            titulo="Excluir este produto?"
            mensagem="O produto sai da sua lista e da vitrine, e a ficha técnica dele é apagada. Isso não pode ser desfeito."
            textoConfirmar="Excluir produto"
            textoCancelar="Não excluir"
            carregando={excluindo}
            aoConfirmar={confirmarExclusao}
            aoCancelar={() => setConfirmarAberto(false)}
          />
        </Cartao>

        <Cartao titulo="Avisos">
          <div className="flex flex-wrap gap-3">
            <Button
              icone="sucesso"
              onClick={() =>
                avisar({
                  tipo: "sucesso",
                  texto: "Material salvo com sucesso.",
                })
              }
            >
              Aviso de sucesso
            </Button>
            <Button
              variante="secundario"
              icone="informacao"
              onClick={() =>
                avisar({
                  tipo: "informacao",
                  texto: "Seu estoque de linha está acabando.",
                })
              }
            >
              Aviso de informação
            </Button>
            <Button
              variante="perigo"
              icone="alerta"
              onClick={() =>
                avisar({
                  tipo: "erro",
                  texto: "Não foi possível salvar. Verifique sua internet e tente de novo.",
                })
              }
            >
              Aviso de erro
            </Button>
          </div>
          <p className="mt-3 text-base text-texto-suave">
            Sucesso e informação somem em 6 segundos (param com o mouse em cima). O erro só some ao clicar em Fechar.
          </p>
        </Cartao>

        <Cartao titulo="Formatação">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="mb-2 text-lg font-bold">formatarMoeda</h3>
              <ul className="space-y-1 text-lg">
                {exemplosMoeda.map((valor) => (
                  <li key={String(valor)}>
                    <span className="text-texto-suave">{String(valor)} → </span>
                    {formatarMoeda(valor)}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-bold">formatarNumero</h3>
              <ul className="space-y-1 text-lg">
                {exemplosNumero.map(([valor, casas]) => (
                  <li key={`${valor}-${casas}`}>
                    <span className="text-texto-suave">
                      {valor}
                      {casas !== undefined ? ` (${casas} casas)` : ""} →{" "}
                    </span>
                    {formatarNumero(valor, casas)}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-bold">lerNumero</h3>
              <ul className="space-y-1 text-lg">
                {exemplosLeitura.map((texto) => (
                  <li key={texto || "vazio"}>
                    <span className="text-texto-suave">
                      {texto === "" ? "(vazio)" : `"${texto}"`} →{" "}
                    </span>
                    {String(lerNumero(texto))}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Cartao>
      </div>
    </div>
  );
}
