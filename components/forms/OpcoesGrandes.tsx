"use client";

/* Botões de opção grandes (radio dentro de um cartão), com as mesmas classes
   do Tipo em FormularioProduto. Por enquanto só o Cálculo rápido usa; o Tipo,
   o painel de preço e /empresa ainda têm a cópia própria (pendência). */

export interface OpcaoGrande<T extends string> {
  valor: T;
  rotulo: string;
  descricao?: string;
}

interface OpcoesGrandesProps<T extends string> {
  legenda: string;
  /** Frase curta abaixo da legenda (opcional). */
  dica?: string;
  /** Nome do grupo de radios (um por tela). */
  name: string;
  opcoes: OpcaoGrande<T>[];
  valor: T;
  aoMudar: (valor: T) => void;
  /** id do primeiro radio (para levar o foco até o grupo). */
  id?: string;
}

export function OpcoesGrandes<T extends string>({
  legenda,
  dica,
  name,
  opcoes,
  valor,
  aoMudar,
  id,
}: OpcoesGrandesProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-lg font-bold text-texto">{legenda}</legend>
      {dica && <p className="mb-3 text-base text-texto-suave">{dica}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {opcoes.map((opcao, indice) => {
          const escolhido = valor === opcao.valor;

          return (
            <label
              key={opcao.valor}
              className={`flex min-h-[88px] cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 focus-within:ring-[3px] focus-within:ring-destaque ${
                escolhido
                  ? "border-destaque bg-destaque-suave"
                  : "border-borda-campo bg-cartao hover:bg-fundo"
              }`}
            >
              <input
                id={indice === 0 ? id : undefined}
                type="radio"
                name={name}
                value={opcao.valor}
                checked={escolhido}
                onChange={() => aoMudar(opcao.valor)}
                className="mt-1 h-6 w-6 shrink-0 accent-destaque focus:outline-none"
              />
              <span className="flex flex-col gap-1">
                <span className="text-lg font-bold text-texto">{opcao.rotulo}</span>
                {opcao.descricao && (
                  <span className="text-base text-texto-suave">{opcao.descricao}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
