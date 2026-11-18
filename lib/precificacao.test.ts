import { describe, expect, it } from "vitest";

import {
  calcularCustoPeca,
  custoDoMaterial,
  calcularPecasParaMeta,
  calcularPrecos,
  calcularValorHora,
  ErroPrecificacao,
  PADROES_PRECO,
  type CodigoErroPrecificacao,
} from "./precificacao";

/** Confere que a função lança ErroPrecificacao com o código esperado. */
function esperarErro(fn: () => unknown, codigo: CodigoErroPrecificacao) {
  try {
    fn();
  } catch (erro) {
    expect(erro).toBeInstanceOf(ErroPrecificacao);
    expect((erro as ErroPrecificacao).codigo).toBe(codigo);
    expect((erro as ErroPrecificacao).message.length).toBeGreaterThan(0);
    return;
  }
  throw new Error(`Esperava o erro ${codigo}, mas a função não lançou erro.`);
}

const precosPadrao = {
  taxasVenda: PADROES_PRECO.taxasVenda,
  margemMinima: PADROES_PRECO.margemMinima,
  margemIdeal: PADROES_PRECO.margemIdeal,
  fatorMarca: 1,
  fatorExclusividade: 1,
};

const custoBase = {
  materiais: [],
  horas: 6,
  valorHora: 25,
  percentualComplexidade: 0,
  embalagem: 0,
  extras: 0,
};

describe("calcularValorHora", () => {
  it("meta 3700 + fixos 300, em 160 h → 25", () => {
    expect(
      calcularValorHora({ metaMensal: 3700, custosFixosMensais: 300, horasPorMes: 160 })
    ).toBe(25);
  });
});

describe("calcularCustoPeca", () => {
  it("exemplo da metodologia → custo 242", () => {
    const custo = calcularCustoPeca({
      materiais: [
        { quantidade: 300, custoPorUnidade: 0.12 },
        { quantidade: 2, custoPorUnidade: 3 },
      ],
      horas: 6,
      valorHora: 25,
      percentualComplexidade: 0.3,
      embalagem: 5,
      extras: 0,
    });

    expect(custo).toEqual({
      custoMateriais: 42,
      valorTempo: 150,
      adicionalComplexidade: 45,
      embalagem: 5,
      extras: 0,
      custoTotal: 242,
    });
  });

  it("soma os materiais item por item (frações de centavo)", () => {
    const custo = calcularCustoPeca({
      materiais: [
        { quantidade: 1, custoPorUnidade: 0.005 },
        { quantidade: 1, custoPorUnidade: 0.005 },
      ],
      horas: 0,
      valorHora: 0,
      percentualComplexidade: 0,
      embalagem: 0,
      extras: 0,
    });
    // Cada item: R$ 0,005 → R$ 0,01. Antes, somava bruto e dava R$ 0,01.
    expect(custo.custoMateriais).toBe(0.02);
    expect(custo.custoTotal).toBe(0.02);
  });

  it("arredonda 1,005 para 1,01", () => {
    expect(custoDoMaterial({ quantidade: 1, custoPorUnidade: 1.005 })).toBe(1.01);
  });

  it("ficha sem materiais → custoMateriais 0", () => {
    const custo = calcularCustoPeca(custoBase);
    expect(custo.custoMateriais).toBe(0);
    expect(custo.custoTotal).toBe(150);
  });

  it.each([
    ["simples", 0, 0],
    ["media", 0.15, 22.5],
    ["dificil", 0.3, 45],
    ["autor", 0.5, 75],
  ] as const)("complexidade %s (%s) → adicional %s sobre 150", (nivel, percentual, adicional) => {
    expect(PADROES_PRECO.complexidade[nivel]).toBe(percentual);

    const custo = calcularCustoPeca({ ...custoBase, percentualComplexidade: percentual });
    expect(custo.adicionalComplexidade).toBe(adicional);
    expect(custo.custoTotal).toBe(150 + adicional);
  });
});

describe("calcularPrecos", () => {
  it("exemplo: custo 242, padrões, marca 1,2 e exclusividade 1,1", () => {
    expect(
      calcularPrecos({ ...precosPadrao, custoTotal: 242, fatorMarca: 1.2, fatorExclusividade: 1.1 })
    ).toEqual({ minimo: 372.31, justo: 440, sugerido: 580.8 });
  });

  it.each([
    ["regular", 1, 440],
    ["encomenda", 1.05, 462],
    ["limitada", 1.1, 484],
    ["unica", 1.25, 550],
  ] as const)("exclusividade %s (×%s) → sugerido %s", (nivel, fator, sugerido) => {
    expect(PADROES_PRECO.exclusividade[nivel]).toBe(fator);

    const precos = calcularPrecos({ ...precosPadrao, custoTotal: 242, fatorExclusividade: fator });
    expect(precos.justo).toBe(440);
    expect(precos.sugerido).toBe(sugerido);
  });
});

describe("calcularPecasParaMeta", () => {
  it("meta 3700 + fixos 300, preço 580,80, taxas 15%, custo direto 47 → 9 peças", () => {
    expect(
      calcularPecasParaMeta({
        metaMensal: 3700,
        custosFixosMensais: 300,
        precoVenda: 580.8,
        taxasVenda: 0.15,
        custoDiretoPeca: 47,
      })
    ).toEqual({ ganhoPorPeca: 446.68, pecasPorMes: 9 });
  });
});

describe("erros", () => {
  it("VALOR_NEGATIVO", () => {
    esperarErro(
      () => calcularCustoPeca({ ...custoBase, embalagem: -1 }),
      "VALOR_NEGATIVO"
    );
    esperarErro(
      () =>
        calcularCustoPeca({
          ...custoBase,
          materiais: [{ quantidade: 1, custoPorUnidade: -0.5 }],
        }),
      "VALOR_NEGATIVO"
    );
    esperarErro(
      () => calcularValorHora({ metaMensal: -10, custosFixosMensais: 0, horasPorMes: 160 }),
      "VALOR_NEGATIVO"
    );
    esperarErro(() => calcularPrecos({ ...precosPadrao, custoTotal: -5 }), "VALOR_NEGATIVO");
  });

  it("HORAS_INVALIDAS", () => {
    esperarErro(
      () => calcularValorHora({ metaMensal: 3700, custosFixosMensais: 300, horasPorMes: 0 }),
      "HORAS_INVALIDAS"
    );
  });

  it("MARGEM_INVALIDA", () => {
    esperarErro(
      () => calcularPrecos({ ...precosPadrao, custoTotal: 242, taxasVenda: 0.7, margemIdeal: 0.3 }),
      "MARGEM_INVALIDA"
    );
  });

  it("MARGENS_INVERTIDAS", () => {
    esperarErro(
      () =>
        calcularPrecos({ ...precosPadrao, custoTotal: 242, margemMinima: 0.4, margemIdeal: 0.3 }),
      "MARGENS_INVERTIDAS"
    );
  });

  it("FATOR_INVALIDO", () => {
    esperarErro(
      () => calcularPrecos({ ...precosPadrao, custoTotal: 242, fatorMarca: 0 }),
      "FATOR_INVALIDO"
    );
  });

  it("GANHO_INSUFICIENTE", () => {
    esperarErro(
      () =>
        calcularPecasParaMeta({
          metaMensal: 3700,
          custosFixosMensais: 300,
          precoVenda: 50,
          taxasVenda: 0.15,
          custoDiretoPeca: 47,
        }),
      "GANHO_INSUFICIENTE"
    );
  });
});
