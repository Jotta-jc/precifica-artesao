import { Badge } from "@/components/ui/Badge";
import { formatarMoeda } from "@/lib/formatar";
import type { Precos } from "@/lib/precificacao";
import { TEXTOS_PRECO } from "@/lib/produtos";

/** Os 3 preços calculados, só leitura (sem escolha). O Sugerido fica em destaque. */
export function PrecosCalculados({ precos }: { precos: Precos }) {
  const ordem = ["minimo", "justo", "sugerido"] as const;

  return (
    <ul className="grid gap-3 lg:grid-cols-3">
      {ordem.map((opcao) => {
        const destaque = opcao === "sugerido";
        const { rotulo, frase } = TEXTOS_PRECO[opcao];

        return (
          <li
            key={opcao}
            className={`flex flex-col gap-1 rounded-2xl border-2 p-4 ${
              destaque ? "border-destaque bg-destaque-suave" : "border-borda bg-cartao"
            }`}
          >
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-texto">{rotulo}</span>
              {destaque && <Badge variante="neutro">Recomendado</Badge>}
            </span>
            <span className="text-2xl font-bold text-texto">{formatarMoeda(precos[opcao])}</span>
            <span className="text-base text-texto-suave">{frase}</span>
          </li>
        );
      })}
    </ul>
  );
}
