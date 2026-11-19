import { describe, expect, it } from "vitest";

import { calcularPrecos, centavos, ErroPrecificacao } from "./precificacao";
import {
  adicionarLinhaCalculo,
  calcularMetaProduto,
  calcularPrecoProduto,
  complexidadeAntiga,
  custoDoItem,
  custoParaCalculo,
  custosMudaram,
  custoTotalItemCompat,
  escolhaInicialPreco,
  exclusividadeAntiga,
  faltaTempo,
  fichaTemMaterialSemCusto,
  filtrarProdutos,
  horasPorMes,
  itensDoCalculoRapido,
  materiaisParaCalculo,
  precoAbaixoDoMinimo,
  precoDaEscolha,
  SEM_CATEGORIA,
  validarProduto,
  type FiltrosProdutos,
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

/* Base da escolha do preço: os três preços do exemplo da metodologia. */
const precosBase = { minimo: 372.31, justo: 440, sugerido: 580.8 };

describe("escolhaInicialPreco", () => {
  it.each([
    [580.8, "sugerido"],
    [440, "justo"],
    [372.31, "minimo"],
  ] as const)("preço gravado %s → %s", (gravado, opcao) => {
    expect(escolhaInicialPreco(gravado, precosBase)).toEqual({ opcao, valorOutro: null });
  });

  it("500 → outro com 500", () => {
    expect(escolhaInicialPreco(500, precosBase)).toEqual({ opcao: "outro", valorOutro: 500 });
  });

  it.each([null, 0])("preço gravado %s → sugerido", (gravado) => {
    expect(escolhaInicialPreco(gravado, precosBase)).toEqual({
      opcao: "sugerido",
      valorOutro: null,
    });
  });

  it("580,8000001 (sobra de ponto flutuante) → sugerido", () => {
    expect(escolhaInicialPreco(580.8000001, precosBase).opcao).toBe("sugerido");
  });

  it("580,81 (um centavo a mais) → outro", () => {
    expect(escolhaInicialPreco(580.81, precosBase)).toEqual({
      opcao: "outro",
      valorOutro: 580.81,
    });
  });

  it("empate justo = sugerido → sugerido", () => {
    const precos = { minimo: 372.31, justo: 440, sugerido: 440 };
    expect(escolhaInicialPreco(440, precos).opcao).toBe("sugerido");
  });

  it("empate mínimo = justo → justo", () => {
    const precos = { minimo: 440, justo: 440, sugerido: 580.8 };
    expect(escolhaInicialPreco(440, precos).opcao).toBe("justo");
  });
});

describe("precoDaEscolha", () => {
  it.each([
    ["minimo", 372.31],
    ["justo", 440],
    ["sugerido", 580.8],
  ] as const)("%s → %s", (opcao, preco) => {
    expect(precoDaEscolha(opcao, precosBase, null)).toBe(preco);
  });

  it("outro com 123,45 → 123,45", () => {
    expect(precoDaEscolha("outro", precosBase, 123.45)).toBe(123.45);
  });

  it("outro vazio → null", () => {
    expect(precoDaEscolha("outro", precosBase, null)).toBeNull();
  });
});

describe("custosMudaram", () => {
  it("sugerido gravado igual ao atual → false", () => {
    expect(custosMudaram({ preco: 440, preco_sugerido: 580.8 }, 580.8)).toBe(false);
  });

  it("sugerido gravado diferente → true", () => {
    expect(custosMudaram({ preco: 440, preco_sugerido: 580.8 }, 600)).toBe(true);
  });

  it("diferença menor que meio centavo → false", () => {
    expect(custosMudaram({ preco: 440, preco_sugerido: 580.8 }, 580.804)).toBe(false);
  });

  it.each([null, 0])("preço gravado %s → false", (preco) => {
    expect(custosMudaram({ preco, preco_sugerido: 580.8 }, 600)).toBe(false);
  });

  it.each([null, 0])("sugerido gravado %s → false", (preco_sugerido) => {
    expect(custosMudaram({ preco: 440, preco_sugerido }, 600)).toBe(false);
  });
});

describe("custoDoItem", () => {
  it("2,5 × 3,20 = 8", () => {
    expect(custoDoItem({ quantidade: 2.5, custo_por_unidade: 3.2 })).toBe(8);
  });

  it("material sem custo (0) dá 0", () => {
    expect(custoDoItem({ quantidade: 300, custo_por_unidade: 0 })).toBe(0);
  });

  it("a soma dos itens é igual ao custo de materiais do motor", () => {
    const fichas = [
      itens,
      [
        { quantidade: 2.5, custo_por_unidade: 3.2 },
        { quantidade: 150, custo_por_unidade: 0.08 },
        { quantidade: 1, custo_por_unidade: 12.9 },
      ],
      [{ quantidade: 230, custo_por_unidade: 0.543478 }],
    ];

    for (const ficha of fichas) {
      const soma = ficha.reduce((total, item) => total + custoDoItem(item), 0);
      const motor = calcularPrecoProduto(peca, ficha, atelie).custo.custoMateriais;
      expect(centavos(soma)).toBe(motor);
    }
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

describe("custoParaCalculo (mesma regra da ficha técnica)", () => {
  it.each([
    [2.5, 2.5, false],
    ["2.50", 2.5, false],
    [0.001, 0.001, false],
    [null, 0, true],
    [undefined, 0, true],
    [0, 0, true],
    [-1, 0, true],
    ["abc", 0, true],
  ] as const)("%s → custo %s, sem custo %s", (valor, custo, semCusto) => {
    expect(custoParaCalculo(valor)).toEqual({ custo, semCusto });
  });
});

describe("Cálculo rápido", () => {
  const materiais = [
    { id: 3, nome: "Zíper", custo_por_unidade: 3, ativo: true },
    { id: 1, nome: "alça de couro", custo_por_unidade: "12.90", ativo: null },
    { id: 2, nome: "Barbante", custo_por_unidade: 0.12, ativo: false },
    { id: 4, nome: "Botão", custo_por_unidade: null, ativo: true },
  ];

  it("materiaisParaCalculo: só os ativos, por nome, sem mudar a lista recebida", () => {
    const antes = materiais.map((m) => m.nome);
    const lista = materiaisParaCalculo(materiais);

    expect(lista.map((m) => m.nome)).toEqual(["alça de couro", "Botão", "Zíper"]);
    expect(materiais.map((m) => m.nome)).toEqual(antes);
  });

  it("adicionarLinhaCalculo: material novo entra no fim", () => {
    const linhas = [{ materialId: "3", quantidade: 1 }];
    const r = adicionarLinhaCalculo(linhas, "1", 2);

    expect(r).toEqual({
      linhas: [
        { materialId: "3", quantidade: 1 },
        { materialId: "1", quantidade: 2 },
      ],
      somou: false,
    });
    expect(linhas).toEqual([{ materialId: "3", quantidade: 1 }]);
  });

  it("adicionarLinhaCalculo: material repetido soma a quantidade (0,1 + 0,2 = 0,3)", () => {
    const linhas = [
      { materialId: "1", quantidade: 0.1 },
      { materialId: "3", quantidade: 1 },
    ];
    const r = adicionarLinhaCalculo(linhas, "1", 0.2);

    expect(r.somou).toBe(true);
    expect(r.linhas).toEqual([
      { materialId: "1", quantidade: 0.3 },
      { materialId: "3", quantidade: 1 },
    ]);
    expect(linhas[0].quantidade).toBe(0.1);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "adicionarLinhaCalculo: quantidade %s → erro",
    (quantidade) => {
      expect(() => adicionarLinhaCalculo([], "1", quantidade)).toThrow(RangeError);
    }
  );

  it("itensDoCalculoRapido: custo como texto, sem custo e material inexistente", () => {
    const r = itensDoCalculoRapido(
      [
        { materialId: "1", quantidade: 2 },
        { materialId: "4", quantidade: 5 },
        { materialId: "99", quantidade: 1 },
      ],
      materiais
    );

    expect(r).toEqual({
      itens: [
        { quantidade: 2, custo_por_unidade: 12.9 },
        { quantidade: 5, custo_por_unidade: 0 },
      ],
      temSemCusto: true,
    });
  });

  it("itensDoCalculoRapido: todos com custo → temSemCusto false", () => {
    const r = itensDoCalculoRapido([{ materialId: "3", quantidade: 2 }], materiais);
    expect(r.temSemCusto).toBe(false);
  });

  it("ponta a ponta: mesmo resultado da ficha técnica equivalente (custo 242)", () => {
    const cadastro = [
      { id: 10, nome: "Fio", custo_por_unidade: "0.12", ativo: true },
      { id: 11, nome: "Argola", custo_por_unidade: 3, ativo: true },
    ];
    const { itens: doRapido } = itensDoCalculoRapido(
      [
        { materialId: "10", quantidade: 300 },
        { materialId: "11", quantidade: 2 },
      ],
      cadastro
    );

    /* Produto montado na tela, sem id. */
    const montado: ProdutoParaPreco = { ...peca };
    const rapido = calcularPrecoProduto(montado, doRapido, atelie);
    const ficha = calcularPrecoProduto(peca, itens, atelie);

    expect(rapido).toEqual(ficha);
    expect(rapido.custo.custoTotal).toBe(242);
  });
});

describe("filtrarProdutos", () => {
  const lista = [
    { nome: "Bolsa Náutica", categoria_id: 1, tipo: "fisico" as const, ativo: true },
    { nome: "Carteira", categoria_id: 2, tipo: "fisico" as const, ativo: true },
    { nome: "Aula de crochê", categoria_id: null, tipo: "aula" as const, ativo: true },
    { nome: "Bolsa antiga", categoria_id: 1, tipo: "fisico" as const, ativo: false },
  ];

  const semFiltro: FiltrosProdutos = {
    busca: "",
    categoria: "",
    tipo: "",
    mostrarArquivados: false,
  };

  const nomes = (filtros: Partial<FiltrosProdutos>) =>
    filtrarProdutos(lista, { ...semFiltro, ...filtros }).map((p) => p.nome);

  it("sem filtro: só os ativos, na ordem recebida", () => {
    expect(nomes({})).toEqual(["Bolsa Náutica", "Carteira", "Aula de crochê"]);
  });

  it("mostra os arquivados quando pedido", () => {
    expect(nomes({ mostrarArquivados: true })).toContain("Bolsa antiga");
  });

  it("busca ignora acento e maiúscula", () => {
    expect(nomes({ busca: "NAUTICA" })).toEqual(["Bolsa Náutica"]);
    expect(nomes({ busca: "croche" })).toEqual(["Aula de crochê"]);
  });

  it("filtro 'Sem categoria'", () => {
    expect(nomes({ categoria: SEM_CATEGORIA })).toEqual(["Aula de crochê"]);
  });

  it("filtro por categoria (id)", () => {
    expect(nomes({ categoria: "2" })).toEqual(["Carteira"]);
  });

  it("filtro por tipo", () => {
    expect(nomes({ tipo: "aula" })).toEqual(["Aula de crochê"]);
    expect(nomes({ tipo: "fisico" })).toEqual(["Bolsa Náutica", "Carteira"]);
  });

  it("filtros combinados", () => {
    expect(nomes({ busca: "bolsa", categoria: "1", tipo: "fisico" })).toEqual(["Bolsa Náutica"]);
    expect(
      nomes({ busca: "bolsa", categoria: "1", tipo: "fisico", mostrarArquivados: true })
    ).toEqual(["Bolsa Náutica", "Bolsa antiga"]);
    expect(nomes({ busca: "bolsa", tipo: "aula" })).toEqual([]);
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
