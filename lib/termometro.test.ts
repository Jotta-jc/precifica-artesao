import { describe, expect, it } from "vitest";

import {
  calcularTermometro,
  erroFatorMarca,
  mesAtual,
  nivelPorPontos,
  pontosClientes,
  pontosEspera,
  pontosPresenca,
  pontosSeguidores,
  pontosVendas,
  precisaLembrete,
  rotuloMes,
  validarRespostas,
  type RascunhoTermometro,
} from "./termometro";

describe("pontos de cada pergunta (limites entram na faixa)", () => {
  it.each([
    [0, 0],
    [500, 0],
    [501, 1],
    [2000, 1],
    [2001, 2],
    [10000, 2],
    [10001, 3],
  ])("seguidores %s → %s", (n, pontos) => {
    expect(pontosSeguidores(n)).toBe(pontos);
  });

  it.each([
    [0, 0],
    [4, 0],
    [5, 1],
    [14, 1],
    [15, 2],
    [39, 2],
    [40, 3],
  ])("vendas %s → %s", (n, pontos) => {
    expect(pontosVendas(n)).toBe(pontos);
  });

  it.each([
    ["sem_espera", 0],
    ["ate_1_semana", 1],
    ["1_a_4_semanas", 2],
    ["mais_1_mes", 3],
  ] as const)("espera %s → %s", (f, pontos) => {
    expect(pontosEspera(f)).toBe(pontos);
  });

  it.each([
    ["menos_10", 0],
    ["10_24", 1],
    ["25_49", 2],
    ["50_mais", 3],
  ] as const)("clientes %s → %s", (f, pontos) => {
    expect(pontosClientes(f)).toBe(pontos);
  });

  it.each([
    [[false, false, false, false], 0],
    [[true, false, false, false], 1],
    [[true, true, false, false], 2],
    [[true, true, true, false], 3],
    [[true, true, true, true], 3],
  ] as const)("presença %j → %s", ([midia, feiras, premios, aulas], pontos) => {
    expect(pontosPresenca({ midia, feiras, premios, aulas })).toBe(pontos);
  });

  it.each([-1, 2.5, Number.NaN])("número inválido %s → RangeError", (n) => {
    expect(() => pontosSeguidores(n)).toThrow(RangeError);
    expect(() => pontosVendas(n)).toThrow(RangeError);
  });
});

describe("nivelPorPontos", () => {
  it.each([
    [0, "comecando"],
    [3, "comecando"],
    [4, "regional"],
    [7, "regional"],
    [8, "reconhecida"],
    [11, "reconhecida"],
    [12, "referencia"],
    [15, "referencia"],
  ] as const)("%s pontos → %s", (total, nivel) => {
    expect(nivelPorPontos(total)).toBe(nivel);
  });

  it.each([16, -1])("%s pontos → RangeError", (total) => {
    expect(() => nivelPorPontos(total)).toThrow(RangeError);
  });
});

describe("calcularTermometro", () => {
  it("caso completo: 1 + 2 + 2 + 1 + 3 = 9 → Reconhecida", () => {
    expect(
      calcularTermometro({
        seguidores: 1500,
        vendasMes: 20,
        espera: "1_a_4_semanas",
        clientesVoltam: "10_24",
        midia: true,
        feiras: true,
        premios: false,
        aulas: true,
      })
    ).toEqual({
      pontos: { seguidores: 1, vendas: 2, espera: 2, clientes: 1, presenca: 3 },
      total: 9,
      nivelSugerido: "reconhecida",
    });
  });
});

describe("validarRespostas", () => {
  const completo: RascunhoTermometro = {
    seguidores: 800,
    vendasMes: 10,
    espera: "ate_1_semana",
    clientesVoltam: "25_49",
    midia: false,
    feiras: true,
    premios: false,
    aulas: false,
  };

  it("tudo certo → respostas prontas", () => {
    expect(validarRespostas(completo)).toEqual({ ok: true, respostas: completo });
  });

  it("número vazio → pede para digitar (0 se for nenhum)", () => {
    expect(validarRespostas({ ...completo, seguidores: null, vendasMes: null })).toEqual({
      ok: false,
      erros: {
        seguidores: "Digite um número. Se for nenhum, digite 0.",
        vendasMes: "Digite um número. Se for nenhum, digite 0.",
      },
    });
  });

  it("negativo e com casas → número inteiro, 0 ou mais", () => {
    expect(validarRespostas({ ...completo, seguidores: -3, vendasMes: 2.5 })).toEqual({
      ok: false,
      erros: {
        seguidores: "Use um número inteiro, 0 ou mais.",
        vendasMes: "Use um número inteiro, 0 ou mais.",
      },
    });
  });

  it("faixa vazia → escolha uma opção", () => {
    expect(validarRespostas({ ...completo, espera: null, clientesVoltam: null })).toEqual({
      ok: false,
      erros: { espera: "Escolha uma opção.", clientesVoltam: "Escolha uma opção." },
    });
  });
});

describe("erroFatorMarca (mesma regra de Dados do ateliê)", () => {
  it("Referência com 1,9 → erro", () => {
    expect(erroFatorMarca("referencia", 1.9)).toBe(
      "Para Referência, o fator precisa ser 2 ou mais."
    );
  });

  it("Referência com 2 → sem erro", () => {
    expect(erroFatorMarca("referencia", 2)).toBeNull();
  });

  it("outros níveis → sem erro", () => {
    expect(erroFatorMarca("regional", 1.2)).toBeNull();
  });
});

describe("mesAtual (fuso de São Paulo, UTC−3)", () => {
  it.each([
    ["2026-12-01T02:00:00Z", "2026-11-01"], // 30/11 23h em SP
    ["2026-12-01T03:05:00Z", "2026-12-01"], // 01/12 00h05 em SP
    ["2027-01-01T02:00:00Z", "2026-12-01"], // 31/12 23h em SP
    ["2027-01-01T03:05:00Z", "2027-01-01"], // 01/01 00h05 em SP
  ])("%s → %s", (utc, mes) => {
    expect(mesAtual(new Date(utc))).toBe(mes);
  });
});

describe("rotuloMes", () => {
  it.each([
    ["2026-01-01", "janeiro de 2026"],
    ["2026-12-01", "dezembro de 2026"],
  ])("%s → %s", (mes, rotulo) => {
    expect(rotuloMes(mes)).toBe(rotulo);
  });

  it.each(["2026-13-01", "2026-11-15", "novembro"])("formato inválido %s → RangeError", (mes) => {
    expect(() => rotuloMes(mes)).toThrow(RangeError);
  });
});

describe("precisaLembrete", () => {
  const agora = new Date("2026-11-20T15:00:00Z");

  it("nunca respondeu → true", () => {
    expect(precisaLembrete(null, agora)).toBe(true);
  });

  it("respondeu neste mês → false", () => {
    expect(precisaLembrete("2026-11-01", agora)).toBe(false);
  });

  it("última resposta no mês anterior → true", () => {
    expect(precisaLembrete("2026-10-01", agora)).toBe(true);
  });
});
