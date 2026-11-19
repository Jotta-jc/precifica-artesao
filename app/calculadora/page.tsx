import { redirect } from "next/navigation";

/* Tela antiga "Preço do produto" desligada (Etapa 8, P6): o preço agora
   fica na página de cada produto, pelo motor único. */
export default function CalculadoraPage() {
  redirect("/produtos");
}
