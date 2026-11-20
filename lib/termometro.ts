/* Termômetro da marca (Jornada 2, Etapa 11; decisões K1–K11 e I7).
   Funções puras: sem banco e sem React. O termômetro só SUGERE o nível;
   o motor continua usando marca_nivel e marca_fator do ateliê. */

/* Caminho relativo de propósito: o Vitest roda sem o atalho "@/". */
import { PADROES_PRECO, type NivelMarca } from "./precificacao";

// ---------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------

export type FaixaEspera = "sem_espera" | "ate_1_semana" | "1_a_4_semanas" | "mais_1_mes";
export type FaixaClientes = "menos_10" | "10_24" | "25_49" | "50_mais";
export type OrigemResposta = "informado" | "automatico";

/** Respostas completas e válidas (o que vai para o banco e para o cálculo). */
export interface RespostasTermometro {
  /** Pergunta 1: soma dos seguidores de todas as redes. */
  seguidores: number;
  /** Pergunta 2: peças vendidas por mês. */
  vendasMes: number;
  /** Pergunta 3: espera das encomendas. */
  espera: FaixaEspera;
  /** Pergunta 4: clientes que voltam a comprar. */
  clientesVoltam: FaixaClientes;
  /** Pergunta 5: mídia, feiras, prêmios, aulas. */
  midia: boolean;
  feiras: boolean;
  premios: boolean;
  aulas: boolean;
}

/** Estado da tela: campos ainda podem estar vazios. */
export interface RascunhoTermometro {
  seguidores: number | null;
  vendasMes: number | null;
  espera: FaixaEspera | null;
  clientesVoltam: FaixaClientes | null;
  midia: boolean;
  feiras: boolean;
  premios: boolean;
  aulas: boolean;
}

export interface PontosTermometro {
  seguidores: number;
  vendas: number;
  espera: number;
  clientes: number;
  presenca: number;
}

export interface ResultadoTermometro {
  pontos: PontosTermometro;
  /** 0 a 15. */
  total: number;
  nivelSugerido: NivelMarca;
}

// ---------------------------------------------------------------------
// Textos para a tela (em ordem)
// ---------------------------------------------------------------------

export const OPCOES_ESPERA: FaixaEspera[] = [
  "sem_espera",
  "ate_1_semana",
  "1_a_4_semanas",
  "mais_1_mes",
];

export const TEXTOS_ESPERA: Record<FaixaEspera, string> = {
  sem_espera: "Não têm espera",
  ate_1_semana: "Até 1 semana",
  "1_a_4_semanas": "De 1 a 4 semanas",
  mais_1_mes: "Mais de 1 mês",
};

export const OPCOES_CLIENTES: FaixaClientes[] = ["menos_10", "10_24", "25_49", "50_mais"];

export const TEXTOS_CLIENTES: Record<FaixaClientes, string> = {
  menos_10: "Quase nenhuma (menos de 1 em cada 10)",
  "10_24": "Algumas (1 ou 2 em cada 10)",
  "25_49": "Muitas (de 3 a 4 em cada 10)",
  "50_mais": "Metade ou mais",
};

/** Explicação de cada nível da marca (usada em Dados do ateliê e no termômetro). */
export const EXPLICACAO_MARCA: Record<NivelMarca, string> = {
  comecando: "Você está começando a vender ou ainda é pouco conhecida.",
  regional: "Clientes da sua cidade já conhecem e indicam o seu trabalho.",
  reconhecida: "Seu nome atrai clientes de outros lugares e tem procura constante.",
  referencia: "Você é referência no seu tipo de peça: ensina, expõe ou recebe prêmios.",
};

// ---------------------------------------------------------------------
// Pontos (0 a 3 por pergunta; os limites entram na faixa)
// ---------------------------------------------------------------------

/** Proteção: número inteiro, finito e não negativo (a tela valida antes). */
function exigirInteiroNaoNegativo(n: number): void {
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    throw new RangeError("Use um número inteiro, 0 ou mais.");
  }
}

/** Seguidores: até 500 → 0; até 2 mil → 1; até 10 mil → 2; acima → 3. */
export function pontosSeguidores(n: number): number {
  exigirInteiroNaoNegativo(n);
  if (n <= 500) return 0;
  if (n <= 2000) return 1;
  if (n <= 10000) return 2;
  return 3;
}

/** Peças vendidas por mês: 0–4 → 0; 5–14 → 1; 15–39 → 2; 40+ → 3. */
export function pontosVendas(n: number): number {
  exigirInteiroNaoNegativo(n);
  if (n <= 4) return 0;
  if (n <= 14) return 1;
  if (n <= 39) return 2;
  return 3;
}

/** Espera das encomendas: 0 a 3, na ordem das faixas. */
export function pontosEspera(f: FaixaEspera): number {
  return OPCOES_ESPERA.indexOf(f);
}

/** Clientes que voltam: 0 a 3, na ordem das faixas. */
export function pontosClientes(f: FaixaClientes): number {
  return OPCOES_CLIENTES.indexOf(f);
}

/** Mídia, feiras, prêmios, aulas: quantos "sim" (3 ou 4 valem 3). */
export function pontosPresenca(r: Pick<RespostasTermometro, "midia" | "feiras" | "premios" | "aulas">): number {
  const sim = [r.midia, r.feiras, r.premios, r.aulas].filter(Boolean).length;
  return Math.min(sim, 3);
}

/** Soma 0–15 → nível: 0–3 Começando; 4–7 Conhecida na região; 8–11 Reconhecida; 12–15 Referência. */
export function nivelPorPontos(total: number): NivelMarca {
  exigirInteiroNaoNegativo(total);
  if (total > 15) throw new RangeError("Os pontos vão de 0 a 15.");
  if (total <= 3) return "comecando";
  if (total <= 7) return "regional";
  if (total <= 11) return "reconhecida";
  return "referencia";
}

/** Pontos de cada pergunta, total e nível sugerido. */
export function calcularTermometro(r: RespostasTermometro): ResultadoTermometro {
  const pontos: PontosTermometro = {
    seguidores: pontosSeguidores(r.seguidores),
    vendas: pontosVendas(r.vendasMes),
    espera: pontosEspera(r.espera),
    clientes: pontosClientes(r.clientesVoltam),
    presenca: pontosPresenca(r),
  };
  const total =
    pontos.seguidores + pontos.vendas + pontos.espera + pontos.clientes + pontos.presenca;

  return { pontos, total, nivelSugerido: nivelPorPontos(total) };
}

// ---------------------------------------------------------------------
// Validação da tela
// ---------------------------------------------------------------------

export type ErrosTermometro = Partial<
  Record<"seguidores" | "vendasMes" | "espera" | "clientesVoltam", string>
>;

const ERRO_VAZIO = "Digite um número. Se for nenhum, digite 0.";
const ERRO_INTEIRO = "Use um número inteiro, 0 ou mais.";
const ERRO_OPCAO = "Escolha uma opção.";

function erroNumero(n: number | null): string | undefined {
  if (n === null) return ERRO_VAZIO;
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return ERRO_INTEIRO;
  return undefined;
}

/** Confere o rascunho da tela; devolve as respostas prontas ou os erros por campo. */
export function validarRespostas(
  r: RascunhoTermometro
): { ok: true; respostas: RespostasTermometro } | { ok: false; erros: ErrosTermometro } {
  const erros: ErrosTermometro = {};

  const erroSeguidores = erroNumero(r.seguidores);
  if (erroSeguidores) erros.seguidores = erroSeguidores;
  const erroVendas = erroNumero(r.vendasMes);
  if (erroVendas) erros.vendasMes = erroVendas;
  if (r.espera === null) erros.espera = ERRO_OPCAO;
  if (r.clientesVoltam === null) erros.clientesVoltam = ERRO_OPCAO;

  if (
    Object.keys(erros).length > 0 ||
    r.seguidores === null ||
    r.vendasMes === null ||
    r.espera === null ||
    r.clientesVoltam === null
  ) {
    return { ok: false, erros };
  }

  return {
    ok: true,
    respostas: {
      seguidores: r.seguidores,
      vendasMes: r.vendasMes,
      espera: r.espera,
      clientesVoltam: r.clientesVoltam,
      midia: r.midia,
      feiras: r.feiras,
      premios: r.premios,
      aulas: r.aulas,
    },
  };
}

/** Regra do fator da marca (Dados do ateliê): Referência pede fator 2 ou mais. */
export function erroFatorMarca(nivel: NivelMarca, fator: number | null): string | null {
  if (nivel === "referencia" && (fator ?? 0) < PADROES_PRECO.marca.referencia) {
    return "Para Referência, o fator precisa ser 2 ou mais.";
  }
  return null;
}

// ---------------------------------------------------------------------
// Mês (fuso de São Paulo)
// ---------------------------------------------------------------------

const formatadorMes = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
});

/** Mês atual em São Paulo, no formato do banco: "AAAA-MM-01". */
export function mesAtual(agora: Date = new Date()): string {
  const partes = formatadorMes.formatToParts(agora);
  const ano = partes.find((p) => p.type === "year")?.value;
  const mes = partes.find((p) => p.type === "month")?.value;
  return `${ano}-${mes}-01`;
}

const NOMES_MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "2026-11-01" → "novembro de 2026" (lê o texto, sem criar Date). */
export function rotuloMes(mes: string): string {
  const partes = /^(\d{4})-(\d{2})-01$/.exec(mes);
  const numero = partes ? Number(partes[2]) : 0;

  if (!partes || numero < 1 || numero > 12) {
    throw new RangeError("Mês inválido. Use o formato AAAA-MM-01.");
  }

  return `${NOMES_MESES[numero - 1]} de ${partes[1]}`;
}

/** O lembrete aparece se nunca respondeu ou se a última resposta não é deste mês. */
export function precisaLembrete(
  mesUltimaResposta: string | null,
  agora: Date = new Date()
): boolean {
  return mesUltimaResposta === null || mesUltimaResposta !== mesAtual(agora);
}
