import type { NivelMarca } from "@/lib/precificacao";
import { createClient } from "@/lib/supabase/client";
import {
  calcularTermometro,
  mesAtual,
  type FaixaClientes,
  type FaixaEspera,
  type OrigemResposta,
  type RespostasTermometro,
} from "@/lib/termometro";

/* Termômetro da marca (tabela termometro_marca, uma linha por mês por conta).
   Em caso de erro, as funções lançam o próprio erro do Supabase.
   A mensagem para a usuária é montada na tela. */

const supabase = createClient();

/** Uma linha de termometro_marca (nomes das colunas do banco). */
export interface RegistroTermometro {
  id: number;
  user_id: string;
  /** "AAAA-MM-01". */
  mes: string;
  seguidores: number;
  vendas_mes: number;
  espera: FaixaEspera;
  clientes_voltam: FaixaClientes;
  midia: boolean;
  feiras: boolean;
  premios: boolean;
  aulas: boolean;
  origem_vendas: OrigemResposta;
  origem_espera: OrigemResposta;
  origem_clientes: OrigemResposta;
  pontos: number;
  nivel_sugerido: NivelMarca;
  created_at: string;
  updated_at: string;
}

const COLUNAS =
  "id, user_id, mes, seguidores, vendas_mes, espera, clientes_voltam, midia, feiras, premios, aulas, origem_vendas, origem_espera, origem_clientes, pontos, nivel_sugerido, created_at, updated_at";

async function usuariaLogada() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("Usuário não autenticado");

  return user;
}

/** A resposta do mês ("AAAA-MM-01"), ou null se ainda não houver. */
export async function buscarTermometroDoMes(mes: string): Promise<RegistroTermometro | null> {
  const user = await usuariaLogada();

  const { data, error } = await supabase
    .from("termometro_marca")
    .select(COLUNAS)
    .eq("user_id", user.id)
    .eq("mes", mes)
    .maybeSingle();

  if (error) throw error;

  return (data as RegistroTermometro | null) ?? null;
}

/** As últimas respostas da usuária, do mês mais novo para o mais velho. */
export async function listarHistorico(limite: number): Promise<RegistroTermometro[]> {
  const user = await usuariaLogada();

  const { data, error } = await supabase
    .from("termometro_marca")
    .select(COLUNAS)
    .eq("user_id", user.id)
    .order("mes", { ascending: false })
    .limit(limite);

  if (error) throw error;

  return (data ?? []) as RegistroTermometro[];
}

/**
 * Grava as respostas do MÊS ATUAL (fuso de São Paulo; meses passados não
 * são gravados pela tela). Pontos e nível sugerido vêm de calcularTermometro
 * (RangeError sobe como veio). Responder de novo no mesmo mês substitui a
 * resposta (upsert em user_id + mes). created_at não é enviado: fica o da
 * primeira resposta.
 */
export async function salvarTermometro(
  respostas: RespostasTermometro
): Promise<RegistroTermometro> {
  const user = await usuariaLogada();
  const resultado = calcularTermometro(respostas);

  const { data, error } = await supabase
    .from("termometro_marca")
    .upsert(
      {
        user_id: user.id,
        mes: mesAtual(),
        seguidores: respostas.seguidores,
        vendas_mes: respostas.vendasMes,
        espera: respostas.espera,
        clientes_voltam: respostas.clientesVoltam,
        midia: respostas.midia,
        feiras: respostas.feiras,
        premios: respostas.premios,
        aulas: respostas.aulas,
        origem_vendas: "informado",
        origem_espera: "informado",
        origem_clientes: "informado",
        pontos: resultado.total,
        nivel_sugerido: resultado.nivelSugerido,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,mes" }
    )
    .select(COLUNAS)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Não foi possível salvar as respostas. Tente de novo.");

  return data as RegistroTermometro;
}
