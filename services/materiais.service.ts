import { abreviacaoUnidade, type UnidadeUso } from "@/lib/materiais";
import { createClient } from "@/lib/supabase/client";

/* Em caso de erro, as funções lançam o próprio erro do Supabase
   (com error.code). A mensagem para a usuária é montada na tela. */

const supabase = createClient();

export interface Material {
  id: number;
  user_id: string;
  nome: string;
  category_id: number | null;
  unidade_uso: UnidadeUso;
  preco: number;
  quantidade_por_compra: number;
  custo_por_unidade: number | null;
  estoque_atual: number | null;
  minimum_stock: number | null;
  ativo: boolean | null;
  /* Colunas antigas, ainda lidas pelas telas de estoque, produtos e pedidos. */
  categoria: string | null;
  unidade: string | null;
  quantidade_comprada: number | null;
  custo_unitario: number | null;
  /* Nome da categoria (vem da ligação category_id). */
  categoria_info: { nome: string } | null;
}

export interface CategoriaMaterial {
  id: number;
  nome: string;
}

/** O que a tela de materiais grava (cadastro e edição). */
export interface DadosMaterial {
  nome: string;
  category_id: number;
  nomeCategoria: string;
  unidade_uso: UnidadeUso;
  preco: number;
  quantidade_por_compra: number;
  minimum_stock: number;
}

const SELECT_MATERIAL = "*, categoria_info:material_categories(nome)";

/** Código do erro do Supabase (ex.: "23503", "23505", "22P02"), se houver. */
export function codigoDoErro(erro: unknown): string | undefined {
  if (typeof erro === "object" && erro !== null && "code" in erro) {
    return String((erro as { code: unknown }).code);
  }
  return undefined;
}

async function usuariaLogada() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Usuário não autenticado");

  return user;
}

/** Colunas novas + antigas (as telas antigas ainda leem as antigas).
    Nunca grava custo_por_unidade: o banco calcula. */
function colunasParaGravar(dados: DadosMaterial) {
  return {
    nome: dados.nome,
    category_id: dados.category_id,
    unidade_uso: dados.unidade_uso,
    preco: dados.preco,
    quantidade_por_compra: dados.quantidade_por_compra,
    minimum_stock: dados.minimum_stock,

    categoria: dados.nomeCategoria,
    unidade: abreviacaoUnidade(dados.unidade_uso),
    quantidade_comprada: dados.quantidade_por_compra,
    custo_unitario: dados.preco / dados.quantidade_por_compra,
  };
}

export async function getMateriais(): Promise<Material[]> {
  const { data, error } = await supabase
    .from("materials")
    .select(SELECT_MATERIAL)
    .order("nome", { ascending: true });

  if (error) throw error;

  return (data ?? []) as Material[];
}

/** Um material pelo id. Devolve null se não existir ou for de outra conta. */
export async function getMaterialById(id: string): Promise<Material | null> {
  const { data, error } = await supabase
    .from("materials")
    .select(SELECT_MATERIAL)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data as Material | null;
}

/** Cria o material e, se houver estoque inicial, registra a entrada. */
export async function createMaterial(
  dados: DadosMaterial,
  estoqueInicial: number
): Promise<Material> {
  const user = await usuariaLogada();

  const { data, error } = await supabase
    .from("materials")
    .insert({
      ...colunasParaGravar(dados),
      user_id: user.id,
      estoque: estoqueInicial,
      estoque_atual: estoqueInicial,
    })
    .select(SELECT_MATERIAL)
    .single();

  if (error) throw error;

  const material = data as Material;

  if (estoqueInicial > 0) {
    const custo = dados.preco / dados.quantidade_por_compra;

    const { error: erroMovimento } = await supabase
      .from("material_movements")
      .insert({
        material_id: material.id,
        user_id: user.id,
        tipo: "entrada",
        quantidade: estoqueInicial,
        valor_unitario: custo,
        valor_total: estoqueInicial * custo,
        observacao: "Estoque inicial",
      });

    if (erroMovimento) throw erroMovimento;
  }

  return material;
}

/** Atualiza o cadastro. NUNCA altera estoque nem estoque_atual. */
export async function updateMaterial(
  id: number,
  dados: DadosMaterial
): Promise<Material> {
  const { data, error } = await supabase
    .from("materials")
    .update(colunasParaGravar(dados))
    .eq("id", id)
    .select(SELECT_MATERIAL)
    .single();

  if (error) throw error;

  return data as Material;
}

/** Arquiva (ativo = false) ou desarquiva (ativo = true). */
export async function setMaterialAtivo(
  id: number,
  ativo: boolean
): Promise<void> {
  const { error } = await supabase
    .from("materials")
    .update({ ativo })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteMaterial(id: number): Promise<void> {
  const { error } = await supabase
    .from("materials")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/** Categorias ativas da usuária, em ordem alfabética. */
export async function getCategoriasMaterial(): Promise<CategoriaMaterial[]> {
  const { data, error } = await supabase
    .from("material_categories")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) throw error;

  return (data ?? []) as CategoriaMaterial[];
}

/** Cria categoria. Nome repetido (sem diferenciar maiúsculas) → erro 23505. */
export async function createCategoriaMaterial(
  nome: string
): Promise<CategoriaMaterial> {
  const user = await usuariaLogada();

  const { data, error } = await supabase
    .from("material_categories")
    .insert({ user_id: user.id, nome })
    .select("id, nome")
    .single();

  if (error) throw error;

  return data as CategoriaMaterial;
}
