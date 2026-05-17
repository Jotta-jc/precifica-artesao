export type ClienteTipo =
  | "cliente"
  | "revendedor"
  | "parceiro";

export interface Cliente {
  id: string;
  user_id: string;

  nome: string;
  telefone: string | null;
  email: string | null;
  instagram: string | null;

  tipo_cliente: ClienteTipo;

  observacoes: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreateClienteDTO {
  nome: string;
  telefone?: string;
  email?: string;
  instagram?: string;

  tipo_cliente?: ClienteTipo;

  observacoes?: string;
}

export interface UpdateClienteDTO {
  nome?: string;
  telefone?: string;
  email?: string;
  instagram?: string;

  tipo_cliente?: ClienteTipo;

  observacoes?: string;
}