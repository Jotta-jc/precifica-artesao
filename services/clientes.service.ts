import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
import {
  Cliente,
  CreateClienteDTO,
} from "@/types/client";

/* Em caso de erro, as funções lançam o próprio erro do Supabase
   (com error.code). A mensagem para a usuária é montada na tela. */

/** Campos que a tela pode alterar; null apaga o valor. */
export type AtualizarClienteDados = Partial<
  Pick<
    Cliente,
    | "nome"
    | "telefone"
    | "email"
    | "instagram"
    | "tipo_cliente"
    | "observacoes"
  >
>;

/** Resumo de pedido mostrado no detalhe do cliente. */
export interface PedidoDoCliente {
  id: number;
  status: string;
  valor_total: number | null;
  created_at: string | null;
}

/** Código do erro do Supabase (ex.: "23503", "22P02"), se houver. */
export function codigoDoErro(erro: unknown): string | undefined {
  if (typeof erro === "object" && erro !== null && "code" in erro) {
    return String((erro as { code: unknown }).code);
  }
  return undefined;
}

export async function getClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as Cliente[];
}

/** Um cliente pelo id. Devolve null se não existir ou for de outra conta. */
export async function getClienteById(
  id: string
): Promise<Cliente | null> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data as Cliente | null;
}

/** Pedidos de um cliente, do mais recente para o mais antigo. */
export async function getPedidosDoCliente(
  clienteId: string
): Promise<PedidoDoCliente[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, valor_total, created_at")
    .eq("client_id", clienteId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as PedidoDoCliente[];
}

export async function createCliente(
  payload: CreateClienteDTO
): Promise<Cliente> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      ...payload,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  return data as Cliente;
}

export async function updateCliente(
  id: string,
  payload: AtualizarClienteDados
): Promise<Cliente> {
  const { data, error } = await supabase
    .from("clientes")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Cliente;
}

export async function deleteCliente(id: string): Promise<void> {
  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
