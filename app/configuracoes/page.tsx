import { redirect } from "next/navigation";

/* Tela antiga de configurações desligada (Etapa 8, H3): as taxas e as
   margens ficam em "Dados do ateliê". */
export default function ConfiguracoesPage() {
  redirect("/empresa");
}
