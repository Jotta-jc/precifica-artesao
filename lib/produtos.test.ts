import { describe, expect, it } from "vitest";

import { calcularPrecos, ErroPrecificacao } from "./precificacao";
import {
  calcularMetaProduto,
  calcularPrecoProduto,
  complexidadeAntiga,
  custoTotalItemCompat,
  exclusividadeAntiga,
  faltaTempo,
  fichaTemMaterialSemCusto,
  horasPorMes,
  precoAbaixoDoMinimo,
  validarProduto,
  type AtelieParaPreco,
  type ProdutoParaPreco,
} from "./produtos";

/* Mesmas entradas dos testes do motor (exemplo da metodologia):
   meta 3700 + fixos 300 em 160 h (20 dias × 8 h) → R$ 25/h;
   materiais 300 × 0,12 + 2 × 3 = 42; 6 h; Difícil (+30%); embalagem 5. */
const atelie: AtelieParaPreco = {
  meta_faturamento: 3700,
  custos_fixos_mensais: 300,
  dias_trabalhados: 20,
  horas_por_dia: 8,
  taxas_venda: 0.15,
  margem_minima: 0.2,
  margem_ideal: 0.3,
  marca_fator: 1.2,
};

const itens = [
  { quantidade: 300, custo_por_unidade: 0.12 },
  { quantidade: 2, custo_por_unidade: 3 },
];

const peca: ProdutoParaPreco = {
  tipo: "fisico",
  tempo_producao: 6,
  embalagem: 5,
  custos_extras: 0,
  nivel_complexidade: "dificil",
  nivel_exclusividade: "limitada",
};

describe("calcularPrecoProduto — exemplo da metodologia", () => {
  it("custo 242 → mínimo 372,31 · justo 440 · sugerido 580,80", () => {
    const r = calcularPrecoProduto(peca, itens, atelie);

    expect(r.valorHora).toBe(25);
    expect(r.custo).toEqual({
      custoMateriais: 42,
      valorTempo: 150,
      adicionalComplexidade: 45,
      embalagem: 5,
      extras: 0,
      custoTotal: 242,
    });
    expect(r.precos).toEqual({ minimo: 372.31, justo: 440, sugerido: 580.8 });
  });

  it("custoDireto = materiais + embalagem + extras", () => {
    const r = calcularPrecoProduto({ ...peca, custos_extras: 3.5 }, itens, atelie);
    expect(r.custoDireto).toBe(42 + 5 + 3.5);
  });

  it("meta 3700 + fixos 300 → 9 peças", () => {
    const r = calcularPrecoProduto(peca, itens, atelie);
    expect(r.custoDireto).toBe(47);
    expect(calcularMetaProduto(r.precos.sugerido, r, atelie)).toEqual({
      ganhoPorPeca: 446.68,
      pecasPorMes: 9,
    });
  });
});

describe("calcularPrecoProduto — aula", () => {
  it("ignora a ficha, a embalagem e a exclusividade gravada", () => {
    const aula: ProdutoParaPreco = {
      ...peca,
      tipo: "aula",
      embalagem: 99,
      nivel_exclusividade: "unica",
      custos_extras: 10,
    };

    const r = calcularPrecoProduto(aula, itens, atelie);

    expect(r.custo.custoMateriais).toBe(0);
    expect(r.custo.embalagem).toBe(0);
    expect(r.custo.extras).toBe(10);
    // 150 de tempo + 45 de complexidade + 10 de extras
    expect(r.custo.custoTotal).toBe(205);
    expect(r.custoDireto).toBe(10);

    // Exclusividade "regular" (×1), só a marca (×1,2): justo × 1,2
    const regular = calcularPrecoProduto(
      { ...aula, nivel_exclusividade: "regular" },
      [],
      atelie
    );
    expect(r.precos).toEqual(regular.precos);
    expect(r.precos).toEqual(
      calcularPrecos({
        custoTotal: 205,
        taxasVenda: 0.15,
        margemMinima: 0.2,
        margemIdeal: 0.3,
        fatorMarca: 1.2,
        fatorExclusividade: 1,
      })
    );
  });
});

describe("calcularPrecoProduto — erros do motor", () => {
  it("ateliê sem horas → ErroPrecificacao (HORAS_INVALIDAS)", () => {
    expect.assertions(2);
    try {
      calcularPrecoProduto(peca, itens, { ...atelie, horas_por_dia: 0 });
    } catch (erro) {
      expect(erro).toBeInstanceOf(ErroPrecificacao);
      expect((erro as ErroPrecificacao).codigo).toBe("HORAS_INVALIDAS");
    }
  });
});

describe("horasPorMes", () => {
  it("20 dias × 8 h = 160 h", () => {
    expect(horasPorMes(20, 8)).toBe(160);
  });
});

describe("validarProduto", () => {
  const valido = {
    nome: "Bolsa",
    tipo: "fisico" as const,
    categoria_id: null,
    nivel_complexidade: "media" as const,
    nivel_exclusividade: "regular" as const,
    tempo_producao: 2,
    embalagem: 0,
    custos_extras: 0,
  };

  it("produto válido → sem erros", () => {
    expect(validarProduto(valido)).toEqual({});
  });

  it("nome só com espaços → erro no nome", () => {
    expect(validarProduto({ ...valido, nome: "   " }).nome).toBeTruthy();
  });

  it("valores negativos → erro em cada campo", () => {
    const erros = validarProduto({
      ...valido,
      tempo_producao: -1,
      embalagem: -0.5,
      custos_extras: -2,
    });
    expect(Object.keys(erros).sort()).toEqual(["custos_extras", "embalagem", "tempo_producao"]);
  });

  it("tipo e níveis inválidos → erro", () => {
    const erros = validarProduto({
      ...valido,
      tipo: "outro" as never,
      nivel_complexidade: "x" as never,
      nivel_exclusividade: "y" as never,
    });
    expect(erros.tipo).toBeTruthy();
    expect(erros.nivel_complexidade).toBeTruthy();
    expect(erros.nivel_exclusividade).toBeTruthy();
  });
});

describe("faltaTempo e precoAbaixoDoMinimo", () => {
  it("faltaTempo", () => {
    expect(faltaTempo({ tempo_producao: 0 })).toBe(true);
    expect(faltaTempo({ tempo_producao: -1 })).toBe(true);
    expect(faltaTempo({ tempo_producao: 0.5 })).toBe(false);
  });

  it("precoAbaixoDoMinimo", () => {
    expect(precoAbaixoDoMinimo(300, 372.31)).toBe(true);
    expect(precoAbaixoDoMinimo(372.31, 372.31)).toBe(false);
    expect(precoAbaixoDoMinimo(400, 372.31)).toBe(false);
  });
});

describe("fichaTemMaterialSemCusto", () => {
  it("true quando algum item está sem custo", () => {
    expect(fichaTemMaterialSemCusto([{ semCusto: false }, { semCusto: true }])).toBe(true);
  });

  it("false quando todos têm custo ou a ficha está vazia", () => {
    expect(fichaTemMaterialSemCusto([{ semCusto: false }, { semCusto: false }])).toBe(false);
    expect(fichaTemMaterialSemCusto([])).toBe(false);
  });
});

describe("compatibilidade com as colunas antigas", () => {
  it.each([
    ["simples", 1],
    ["media", 2],
    ["dificil", 3],
    ["autor", 4],
  ] as const)("complexidade %s → %s", (nivel, antigo) => {
    expect(complexidadeAntiga(nivel)).toBe(antigo);
  });

  it.each([
    ["regular", 1],
    ["encomenda", 2],
    ["limitada", 3],
    ["unica", 4],
  ] as const)("exclusividade %s → %s", (nivel, antigo) => {
    expect(exclusividadeAntiga(nivel)).toBe(antigo);
  });

  it("custoTotalItemCompat = quantidade × custo por unidade", () => {
    expect(custoTotalItemCompat(300, 0.12)).toBeCloseTo(36);
    expect(custoTotalItemCompat(2, 3)).toBe(6);
    expect(custoTotalItemCompat(1, Number.POSITIVE_INFINITY)).toBe(0);
  });
});
