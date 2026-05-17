import { supabase } from "@/lib/supabase";
import {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
} from "@/types/client";

export async function getClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar clientes:", error);
    throw new Error(error.message);
  }

  return data as Cliente[];
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

  if (error) {
    console.error("Erro ao criar cliente:", error);
    throw new Error(error.message);
  }

  return data as Cliente;
}

export async function updateCliente(
  id: string,
  payload: UpdateClienteDTO
): Promise<Cliente> {
  const { data, error } = await supabase
    .from("clientes")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar cliente:", error);
    throw new Error(error.message);
  }

  return data as Cliente;
}

export async function deleteCliente(id: string): Promise<void> {
  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar cliente:", error);
    throw new Error(error.message);
  }
}