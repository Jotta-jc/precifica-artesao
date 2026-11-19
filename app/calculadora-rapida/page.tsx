import { redirect } from "next/navigation";

/* Tela antiga "Cálculo rápido" desligada (Etapa 8, H2): volta reescrita
   com o motor único depois. Até lá, leva para Produtos. */
export default function CalculadoraRapidaPage() {
  redirect("/produtos");
}
