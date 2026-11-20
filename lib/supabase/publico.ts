import { createClient } from "@supabase/supabase-js";

/* Só para a vitrine pública: sem cookies e sem sessão, vai SEMPRE como anon.
   Nunca usar para dados da artesã (esses passam pelo RLS da usuária logada). */
export function criarClientePublico() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
