import { caminhoFotoValido } from "@/lib/imagens";
import { abreviacaoUnidade, type UnidadeUso } from "@/lib/materiais";
import { centavos } from "@/lib/precificacao";
import {
  complexidadeAntiga,
  custoParaCalculo,
  custoTotalItemCompat,
  exclusividadeAntiga,
  validarProduto,
  type DadosProduto,
  type ItemFicha,
  type Produto,
} from "@/lib/produtos";
import { createClient } from "@/lib/supabase/client";
import { validarVitrineProduto, type PrazoProduto } from "@/lib/vitrine";
import { apagarArquivoDaVitrine } from "@/services/fotos.service";

/* Em caso de erro, as funções lançam o próprio erro do Supabase (com
   error.code) ou um ErroProduto (com code próprio, em letras). A mensagem
   para a usuária vem de mensagemErroProduto() ou é montada na tela. */

const supabase = createClient();

// ---------------------------------------------------------------------
// Erros
// ---------------------------------------------------------------------

export type CodigoErroProduto =
  | "DADOS_INVALIDOS"
  | "AULA_COM_FICHA"
  | "AULA_SEM_FICHA"
  | "PRODUTO_NAO_ENCONTRADO"
  | "MATERIAL_NAO_ENCONTRADO"
  | "MATERIAL_ARQUIVADO"
  | "ITEM_NAO_ENCONTRADO"
  | "QUANTIDADE_INVALIDA"
  | "PRECO_INVALIDO"
  | "PRODUTO_EM_PEDIDO";

/** Erro próprio do service. Usa "code", como o erro do Supabase, para
    codigoDoErro() funcionar igual nos dois casos. */
export class ErroProduto extends Error {
  readonly code: CodigoErroProduto;

  constructor(code: CodigoErroProduto) {
    super(code);
    this.name = "ErroProduto";
    this.code = code;
  }
}

/** Código do erro (do Supabase, ex.: "23503", "FT001"; ou do ErroProduto). */
export function codigoDoErro(erro: unknown): string | undefined {
  if (typeof erro === "object" && erro !== null && "code" in erro) {
    return String((erro as { code: unknown }).code);
  }
  return undefined;
}

/** Mensagens simples. 23505 aqui é o da FICHA (material repetido);
    na categoria, a tela mostra "Essa categoria já existe.". */
export const MENSAGENS_ERRO_PRODUTO: Record<string, string> = {
  FT001: "Esse material não é desta conta.",
  "23505": "Esse material já está na ficha.",
  "23514": "A quantidade precisa ser maior que zero.",
  DADOS_INVALIDOS: "Confira os campos do produto.",
  AULA_COM_FICHA: "Para virar aula, tire antes os materiais da ficha técnica.",
  AULA_SEM_FICHA: "Aula não tem ficha técnica de materiais.",
  PRODUTO_NAO_ENCONTRADO: "Produto não encontrado. Ele pode ter sido excluído.",
  MATERIAL_NAO_ENCONTRADO: "Material não encontrado. Ele pode ter sido excluído.",
  MATERIAL_ARQUIVADO: "Esse material está arquivado. Desarquive-o em Materiais para usar.",
  ITEM_NAO_ENCONTRADO: "Esse item não está mais na ficha.",
  QUANTIDADE_INVALIDA: "A quantidade precisa ser maior que zero.",
  PRECO_INVALIDO: "Digite um preço válido, como 120,00.",
  PRODUTO_EM_PEDIDO:
    "Este produto está em pedidos ou orçamentos e não pode ser excluído. Use Arquivar.",
};

/** Mensagem simples para o erro, se conhecido; senão, null. */
export function mensagemErroProduto(erro: unknown): string | null {
  const codigo = codigoDoErro(erro);
  return codigo ? (MENSAGENS_ERRO_PRODUTO[codigo] ?? null) : null;
}

/** Gatilhos de aula do banco (migration 20261119170000) → códigos que as
    telas já conhecem. Outros erros voltam como vieram. */
function erroDeAula(erro: unknown): unknown {
  const codigo = codigoDoErro(erro);
  if (codigo === "FT002") return new ErroProduto("AULA_SEM_FICHA");
  if (codigo === "FT003") return new ErroProduto("AULA_COM_FICHA");
  return erro;
}

// ---------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------

async function usuariaLogada() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Usuário não autenticado");

  return user;
}

const SELECT_PRODUTO =
  "id, nome, tipo, categoria_id, nivel_complexidade, nivel_exclusividade, tempo_producao, embalagem, custos_extras, preco, preco_sugerido, ativo, descricao, publicado, mostrar_preco, prazo, prazo_dias, foto, categoria_info:product_categories(nome)";

/** O banco devolve numeric como número ou texto; garante número. */
function normalizarProduto(linha: Record<string, unknown>): Produto {
  return {
    ...(linha as unknown as Produto),
    tempo_producao: Number(linha.tempo_producao ?? 0),
    embalagem: Number(linha.embalagem ?? 0),
    custos_extras: Number(linha.custos_extras ?? 0),
    preco: linha.preco === null || linha.preco === undefined ? null : Number(linha.preco),
    preco_sugerido:
      linha.preco_sugerido === null || linha.preco_sugerido === undefined
        ? null
        : Number(linha.preco_sugerido),
    ativo: linha.ativo !== false,
    descricao:
      typeof linha.descricao === "string" && linha.descricao.trim() !== ""
        ? linha.descricao
        : null,
    publicado: linha.publicado === true,
    mostrar_preco: linha.mostrar_preco !== false,
    prazo: linha.prazo === "sob_encomenda" ? "sob_encomenda" : "pronta_entrega",
    prazo_dias:
      linha.prazo_dias === null || linha.prazo_dias === undefined
        ? null
        : Number(linha.prazo_dias),
    foto: typeof linha.foto === "string" && caminhoFotoValido(linha.foto) ? linha.foto : null,
  };
}

/** Colunas novas + antigas compatíveis. Aula grava embalagem 0. */
function colunasParaGravar(dados: DadosProduto) {
  if (Object.keys(validarProduto(dados)).length > 0) {
    throw new ErroProduto("DADOS_INVALIDOS");
  }

  return {
    nome: dados.nome.trim(),
    tipo: dados.tipo,
    categoria_id: dados.categoria_id,
    nivel_complexidade: dados.nivel_complexidade,
    nivel_exclusividade: dados.nivel_exclusividade,
    tempo_producao: dados.tempo_producao,
    embalagem: dados.tipo === "aula" ? 0 : dados.embalagem,
    custos_extras: dados.custos_extras,

    /* Colunas antigas, ainda lidas pelas telas antigas de preço. */
    complexidade: complexidadeAntiga(dados.nivel_complexidade),
    exclusividade: exclusividadeAntiga(dados.nivel_exclusividade),
  };
}

// ---------------------------------------------------------------------
// Produtos
// ---------------------------------------------------------------------

/** Todos os produtos (ativos e arquivados), com a categoria, por nome. */
export async function getProdutos(): Promise<Produto[]> {
  const { data, error } = await supabase
    .from("products")
    .select(SELECT_PRODUTO)
    .order("nome", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((linha) => normalizarProduto(linha as Record<string, unknown>));
}

/** Um produto pelo id. Devolve null se não existir ou for de outra conta. */
export async function getProdutoById(id: string): Promise<Produto | null> {
  const { data, error } = await supabase
    .from("products")
    .select(SELECT_PRODUTO)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data ? normalizarProduto(data as Record<string, unknown>) : null;
}

export async function createProduto(dados: DadosProduto): Promise<Produto> {
  const user = await usuariaLogada();

  const { data, error } = await supabase
    .from("products")
    .insert({ ...colunasParaGravar(dados), user_id: user.id })
    .select(SELECT_PRODUTO)
    .single();

  if (error) throw error;

  return normalizarProduto(data as Record<string, unknown>);
}

/** Atualiza o cadastro. Virar "aula" com itens na ficha é recusado. */
export async function updateProduto(id: number, dados: DadosProduto): Promise<Produto> {
  const colunas = colunasParaGravar(dados);

  if (dados.tipo === "aula") {
    const { count, error: erroFicha } = await supabase
      .from("product_materials")
      .select("id", { count: "exact", head: true })
      .eq("product_id", id);

    if (erroFicha) throw erroFicha;
    if ((count ?? 0) > 0) throw new ErroProduto("AULA_COM_FICHA");
  }

  const { data, error } = await supabase
    .from("products")
    .update(colunas)
    .eq("id", id)
    .select(SELECT_PRODUTO)
    .single();

  /* FT003: o banco também recusa virar aula com ficha (duas abas ao mesmo tempo). */
  if (error) throw erroDeAula(error);

  return normalizarProduto(data as Record<string, unknown>);
}

/**
 * Grava só os campos de vitrine do produto (o cadastro não muda).
 * Descrição sem espaços nas pontas (vazia → null). Prazo só é gravado se
 * vier (aula: a tela não manda); com "pronta_entrega", os dias viram null.
 * products não tem updated_at, como no updateProduto.
 */
export async function salvarVitrineProduto(
  id: number,
  dados: {
    publicado: boolean;
    descricao: string;
    mostrar_preco: boolean;
    prazo?: PrazoProduto;
    prazo_dias: number | null;
  }
): Promise<Produto> {
  if (Object.keys(validarVitrineProduto(dados)).length > 0) {
    throw new ErroProduto("DADOS_INVALIDOS");
  }

  const descricao = dados.descricao.trim();
  const colunas: Record<string, unknown> = {
    publicado: dados.publicado,
    mostrar_preco: dados.mostrar_preco,
    descricao: descricao === "" ? null : descricao,
  };

  if (dados.prazo) {
    colunas.prazo = dados.prazo;
    colunas.prazo_dias = dados.prazo === "pronta_entrega" ? null : dados.prazo_dias;
  }

  const { data, error } = await supabase
    .from("products")
    .update(colunas)
    .eq("id", id)
    .select(SELECT_PRODUTO)
    .maybeSingle();

  if (error) throw error;
  /* O RLS não dá erro quando nenhuma linha muda: confere se gravou. */
  if (!data) throw new ErroProduto("PRODUTO_NAO_ENCONTRADO");

  return normalizarProduto(data as Record<string, unknown>);
}

/**
 * Grava o preço escolhido (usado nos Pedidos) e o sugerido do momento.
 * Os dois são arredondados em centavos (centavos do motor) ANTES de validar:
 * 0,004 vira 0 e é recusado. Decisão F3: preco_sugerido é sempre o sugerido
 * do momento em que a artesã salva; quem calcula é a tela (pelo motor), o
 * service só grava. Devolve o produto atualizado.
 */
export async function salvarPrecoProduto(
  id: number,
  valores: { preco: number; preco_sugerido: number }
): Promise<Produto> {
  const preco = centavos(valores.preco);
  const precoSugerido = centavos(valores.preco_sugerido);

  /* Preço de venda > 0; o sugerido pode ser 0. */
  const precoValido = Number.isFinite(preco) && preco > 0;
  const sugeridoValido = Number.isFinite(precoSugerido) && precoSugerido >= 0;
  if (!precoValido || !sugeridoValido) throw new ErroProduto("PRECO_INVALIDO");

  const { data, error } = await supabase
    .from("products")
    .update({ preco, preco_sugerido: precoSugerido })
    .eq("id", id)
    .select(SELECT_PRODUTO)
    .maybeSingle();

  if (error) throw error;
  /* O RLS não dá erro quando nenhuma linha muda: confere se gravou. */
  if (!data) throw new ErroProduto("PRODUTO_NAO_ENCONTRADO");

  return normalizarProduto(data as Record<string, unknown>);
}

async function definirAtivo(id: number, ativo: boolean): Promise<void> {
  const { data, error } = await supabase
    .from("products")
    .update({ ativo })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new ErroProduto("PRODUTO_NAO_ENCONTRADO");
}

export async function arquivarProduto(id: number): Promise<void> {
  await definirAtivo(id, false);
}

export async function reativarProduto(id: number): Promise<void> {
  await definirAtivo(id, true);
}

/**
 * Exclui o produto (a ficha vai junto). O banco bloqueia (23503) produto
 * que está em algum item de pedido, de qualquer status, inclusive
 * orçamento: vira ErroProduto("PRODUTO_EM_PEDIDO"), e nada é apagado.
 * A foto é lida na própria exclusão (a linha excluída volta com a foto) e
 * o arquivo só é apagado DEPOIS que a linha saiu; falha só vai para o log.
 */
export async function deleteProduto(id: number): Promise<void> {
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .select("id, foto")
    .maybeSingle();

  if (error) {
    if (codigoDoErro(error) === "23503") throw new ErroProduto("PRODUTO_EM_PEDIDO");
    throw error;
  }
  if (!data) throw new ErroProduto("PRODUTO_NAO_ENCONTRADO");

  if (typeof data.foto === "string" && caminhoFotoValido(data.foto)) {
    await apagarArquivoDaVitrine(data.foto);
  }
}

// ---------------------------------------------------------------------
// Categorias de produto
// ---------------------------------------------------------------------

export interface CategoriaProduto {
  id: number;
  nome: string;
}

/** Categorias de produto da usuária, em ordem alfabética. */
export async function getCategoriasProduto(): Promise<CategoriaProduto[]> {
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, nome")
    .order("nome", { ascending: true });

  if (error) throw error;

  return (data ?? []) as CategoriaProduto[];
}

/** Cria categoria. Nome repetido (sem diferenciar maiúsculas) → erro 23505. */
export async function createCategoriaProduto(nome: string): Promise<CategoriaProduto> {
  const user = await usuariaLogada();

  const { data, error } = await supabase
    .from("product_categories")
    .insert({ user_id: user.id, nome: nome.trim() })
    .select("id, nome")
    .single();

  if (error) throw error;

  return data as CategoriaProduto;
}

// ---------------------------------------------------------------------
// Ficha técnica (product_materials)
// ---------------------------------------------------------------------

const SELECT_ITEM =
  "id, material_id, quantidade, materials(nome, unidade_uso, custo_por_unidade, ativo)";

interface LinhaItem {
  id: number;
  material_id: number;
  quantidade: number | string;
  materials: {
    nome: string;
    unidade_uso: UnidadeUso;
    custo_por_unidade: number | string | null;
    ativo: boolean | null;
  } | null;
}

function paraItemFicha(linha: LinhaItem): ItemFicha {
  /* Sem custo → 0 para o motor; a tela avisa pelo semCusto (regra em custoParaCalculo). */
  const { custo, semCusto } = custoParaCalculo(linha.materials?.custo_por_unidade);

  return {
    id: linha.id,
    material_id: linha.material_id,
    quantidade: Number(linha.quantidade ?? 0),
    custo_por_unidade: custo,
    semCusto,
    nome: linha.materials?.nome ?? "Material",
    unidade: linha.materials?.unidade_uso ?? "unidade",
    ativo: linha.materials?.ativo !== false,
  };
}

function quantidadeValida(quantidade: number): boolean {
  return Number.isFinite(quantidade) && quantidade > 0;
}

/** Itens da ficha com os dados ATUAIS do material (inclusive o custo). */
export async function getFichaTecnica(produtoId: number): Promise<ItemFicha[]> {
  const { data, error } = await supabase
    .from("product_materials")
    .select(SELECT_ITEM)
    .eq("product_id", produtoId)
    .order("id", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as LinhaItem[]).map(paraItemFicha);
}

/**
 * Adiciona material à ficha. Antes de gravar, confere (com o RLS da
 * usuária) que o produto e o material são dela e que o material está
 * ativo. O banco confere de novo pelo gatilho (erro FT001).
 * Grava unidade, custo_unitario e custo_total só por compatibilidade.
 */
export async function adicionarItemFicha(
  produtoId: number,
  materialId: number,
  quantidade: number
): Promise<ItemFicha> {
  if (!quantidadeValida(quantidade)) throw new ErroProduto("QUANTIDADE_INVALIDA");

  const { data: produto, error: erroProduto } = await supabase
    .from("products")
    .select("id, tipo")
    .eq("id", produtoId)
    .maybeSingle();

  if (erroProduto) throw erroProduto;
  if (!produto) throw new ErroProduto("PRODUTO_NAO_ENCONTRADO");
  if (produto.tipo === "aula") throw new ErroProduto("AULA_SEM_FICHA");

  const { data: material, error: erroMaterial } = await supabase
    .from("materials")
    .select("id, unidade_uso, custo_por_unidade, ativo")
    .eq("id", materialId)
    .maybeSingle();

  if (erroMaterial) throw erroMaterial;
  if (!material) throw new ErroProduto("MATERIAL_NAO_ENCONTRADO");
  if (material.ativo === false) throw new ErroProduto("MATERIAL_ARQUIVADO");

  const custo = Number(material.custo_por_unidade ?? 0);

  const { data, error } = await supabase
    .from("product_materials")
    .insert({
      product_id: produtoId,
      material_id: materialId,
      quantidade,
      unidade: abreviacaoUnidade(material.unidade_uso),
      custo_unitario: custo,
      custo_total: custoTotalItemCompat(quantidade, custo),
    })
    .select(SELECT_ITEM)
    .single();

  /* FT002: o banco também recusa ficha em aula (duas abas ao mesmo tempo). */
  if (error) throw erroDeAula(error);

  return paraItemFicha(data as unknown as LinhaItem);
}

/** Muda a quantidade; recalcula custo_unitario e custo_total (compatibilidade). */
export async function atualizarItemFicha(itemId: number, quantidade: number): Promise<ItemFicha> {
  if (!quantidadeValida(quantidade)) throw new ErroProduto("QUANTIDADE_INVALIDA");

  const { data: atual, error: erroAtual } = await supabase
    .from("product_materials")
    .select(SELECT_ITEM)
    .eq("id", itemId)
    .maybeSingle();

  if (erroAtual) throw erroAtual;
  if (!atual) throw new ErroProduto("ITEM_NAO_ENCONTRADO");

  const custo = paraItemFicha(atual as unknown as LinhaItem).custo_por_unidade;

  const { data, error } = await supabase
    .from("product_materials")
    .update({
      quantidade,
      custo_unitario: custo,
      custo_total: custoTotalItemCompat(quantidade, custo),
    })
    .eq("id", itemId)
    .select(SELECT_ITEM)
    .single();

  if (error) throw erroDeAula(error);

  return paraItemFicha(data as unknown as LinhaItem);
}

export async function removerItemFicha(itemId: number): Promise<void> {
  const { data, error } = await supabase
    .from("product_materials")
    .delete()
    .eq("id", itemId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new ErroProduto("ITEM_NAO_ENCONTRADO");
}
