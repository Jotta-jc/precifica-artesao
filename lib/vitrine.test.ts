import { describe, expect, it } from "vitest";

import { formatarMoeda } from "./formatar";
import { normalizarTexto, semAcentos } from "./texto";
import {
  ENDERECOS_RESERVADOS,
  formatarWhatsapp,
  inicialDoNome,
  lerVitrinePublica,
  linkInstagram,
  linkWhatsapp,
  NOME_RESERVA_VITRINE,
  nomeDaVitrine,
  normalizarEndereco,
  normalizarInstagram,
  normalizarWhatsapp,
  precoPublico,
  prazoPublico,
  produtoNaVitrine,
  sugerirEndereco,
  type ProdutoPublico,
  textoPrazo,
  textoPreco,
  validarDescricao,
  validarEndereco,
  validarInstagram,
  validarPrazo,
  validarSobre,
  validarVitrine,
  validarVitrineProduto,
  validarWhatsapp,
} from "./vitrine";

describe("texto", () => {
  it("semAcentos e normalizarTexto", () => {
    expect(semAcentos("Ateliê Crochê Ação")).toBe("Atelie Croche Acao");
    expect(normalizarTexto("Ateliê CROCHÊ")).toBe("atelie croche");
  });
});

describe("sugerirEndereco", () => {
  it.each([
    ["Ateliê da Ana", "atelie-da-ana"],
    ["  Bolsas & Cia!!  ", "bolsas-cia"],
    ["Crochê---Fino", "croche-fino"],
    ["Maria's 100% Artesanal", "maria-s-100-artesanal"],
  ])("%s → %s", (nome, endereco) => {
    expect(sugerirEndereco(nome)).toBe(endereco);
  });

  it.each(["", "  ", "Zé", "!!"])("nome curto ou vazio (%j) → meu-atelie", (nome) => {
    expect(sugerirEndereco(nome)).toBe("meu-atelie");
  });

  it("nome longo: corta em 40 sem terminar em hífen", () => {
    const sugestao = sugerirEndereco("Ateliê de Crochê e Tricô da Vovó Maria das Graças");
    expect(sugestao.length).toBeLessThanOrEqual(40);
    expect(sugestao.endsWith("-")).toBe(false);
    expect(validarEndereco(sugestao)).toBeNull();
  });

  it("nome que dá endereço reservado ganha -atelie", () => {
    expect(sugerirEndereco("Admin")).toBe("admin-atelie");
  });
});

describe("normalizarEndereco", () => {
  it("trim, minúsculas, sem acento, espaço vira hífen", () => {
    expect(normalizarEndereco("  Ateliê da Ana  ")).toBe("atelie-da-ana");
  });
});

describe("validarEndereco", () => {
  it("válido → null", () => {
    expect(validarEndereco("atelie-da-ana")).toBeNull();
    expect(validarEndereco("abc")).toBeNull();
    expect(validarEndereco("a".repeat(40))).toBeNull();
  });

  it("vazio", () => {
    expect(validarEndereco("")).toBe("Digite o endereço da sua vitrine.");
  });

  it.each(["ab", "a".repeat(41)])("tamanho fora de 3 a 40 (%s)", (texto) => {
    expect(validarEndereco(texto)).toBe("Use de 3 a 40 caracteres.");
  });

  it.each(["-ana", "ana-", "ana--maria", "Ana", "ana_maria", "ateliê"])(
    "formato inválido (%s)",
    (texto) => {
      expect(validarEndereco(texto)).toBe(
        "Use só letras sem acento, números e hífen, sem hífen no começo ou no fim."
      );
    }
  );

  it.each(ENDERECOS_RESERVADOS.filter((e) => e.length >= 3))("reservado (%s)", (texto) => {
    expect(validarEndereco(texto)).toBe("Esse endereço não pode ser usado. Escolha outro.");
  });
});

describe("WhatsApp", () => {
  it("normalizarWhatsapp: só dígitos", () => {
    expect(normalizarWhatsapp("(41) 99999-9999")).toBe("41999999999");
    expect(normalizarWhatsapp("+55 41 99999-9999")).toBe("5541999999999");
  });

  it("validarWhatsapp: com máscara e com 55 → válido", () => {
    expect(validarWhatsapp("(41) 99999-9999", true)).toBeNull();
    expect(validarWhatsapp("+55 (41) 99999-9999", true)).toBeNull();
    expect(validarWhatsapp("(41) 3333-4444", true)).toBeNull();
  });

  it("validarWhatsapp: vazio só é erro quando obrigatório", () => {
    expect(validarWhatsapp("", false)).toBeNull();
    expect(validarWhatsapp("  ", true)).toBe("Digite o seu WhatsApp para publicar a vitrine.");
  });

  it.each(["99999-999", "12345678901234"])("validarWhatsapp: tamanho errado (%s)", (texto) => {
    expect(validarWhatsapp(texto, false)).toBe(
      "Digite o WhatsApp com DDD, como (41) 99999-9999."
    );
  });

  it("linkWhatsapp: sem 55 ganha 55; sem produto", () => {
    expect(linkWhatsapp("(41) 99999-9999")).toBe(
      `https://wa.me/5541999999999?text=${encodeURIComponent("Olá! Vi a sua vitrine e quero saber mais.")}`
    );
  });

  it("linkWhatsapp: com 55 não repete", () => {
    expect(linkWhatsapp("5541999999999")).toMatch(/^https:\/\/wa\.me\/5541999999999\?text=/);
  });

  it("linkWhatsapp: produto com acento fica codificado", () => {
    const link = linkWhatsapp("41999999999", "Bolsa Crochê");
    expect(link).toBe(
      "https://wa.me/5541999999999?text=Ol%C3%A1!%20Vi%20o%20produto%20Bolsa%20Croch%C3%AA%20na%20sua%20vitrine%20e%20quero%20saber%20mais."
    );
  });

  it.each(["", "   "])("linkWhatsapp: nome vazio ou só espaços (%j) → mensagem geral", (nome) => {
    expect(linkWhatsapp("41999999999", nome)).toBe(
      `https://wa.me/5541999999999?text=${encodeURIComponent("Olá! Vi a sua vitrine e quero saber mais.")}`
    );
  });

  it("linkWhatsapp: nome com espaços nas pontas fica sem eles", () => {
    expect(linkWhatsapp("41999999999", "  Bag Aleska  ")).toBe(
      `https://wa.me/5541999999999?text=${encodeURIComponent(
        "Olá! Vi o produto Bag Aleska na sua vitrine e quero saber mais."
      )}`
    );
  });

  it.each([
    ["4133334444", "(41) 3333-4444"],
    ["41999999999", "(41) 99999-9999"],
    ["554133334444", "(41) 3333-4444"],
    ["5541999999999", "(41) 99999-9999"],
    [" +55 (41) 99999-9999 ", "(41) 99999-9999"],
    ["(41) 9999-9999", "(41) 9999-9999"],
    ["123456789", "123456789"],
    ["991234567890", "991234567890"],
    ["12-345", "12345"],
    ["", ""],
  ])("formatarWhatsapp(%j) → %j", (entrada, saida) => {
    expect(formatarWhatsapp(entrada)).toBe(saida);
  });
});

describe("lerVitrinePublica", () => {
  /* Retorno real da teste-atelie, conferido no banco (Bag Aleska, id 21). */
  const bagAleska = {
    id: 21,
    nome: "Bag Aleska",
    tipo: "fisico",
    descricao: null,
    preco: 529.62,
    prazo: "sob_encomenda",
    prazo_dias: null,
    foto: null,
  };
  const exemplo = {
    endereco: "teste-atelie",
    nome_atelie: "Jotta Art",
    logo: null,
    whatsapp: "41999999999",
    instagram: null,
    sobre: "Texto de teste do ateliê.",
    produtos: [bagAleska],
  };

  it("exemplo real passa igual", () => {
    const lida = lerVitrinePublica(exemplo);
    expect(lida).toEqual(exemplo);
    expect(formatarWhatsapp(lida!.whatsapp)).toBe("(41) 99999-9999");
    expect(precoPublico(lida!.produtos[0])).toContain("529,62");
    expect(prazoPublico(lida!.produtos[0])).toBe("Sob encomenda");
  });

  it.each([null, undefined, "teste", 42, true, [], [exemplo]])("%j → null", (dados) => {
    expect(lerVitrinePublica(dados)).toBeNull();
  });

  it.each([undefined, null, "", "   ", 41999999999])("sem whatsapp válido (%j) → null", (whatsapp) => {
    expect(lerVitrinePublica({ ...exemplo, whatsapp })).toBeNull();
  });

  it.each([undefined, null, "", "  ", 7])("sem endereço válido (%j) → null", (endereco) => {
    expect(lerVitrinePublica({ ...exemplo, endereco })).toBeNull();
  });

  it("textos com espaços nas pontas; vazios ou não texto → null", () => {
    const lida = lerVitrinePublica({
      ...exemplo,
      nome_atelie: "  Teste Ateliê  ",
      instagram: "   ",
      sobre: 123,
    });
    expect(lida?.nome_atelie).toBe("Teste Ateliê");
    expect(lida?.instagram).toBeNull();
    expect(lida?.sobre).toBeNull();
  });

  it.each([undefined, null, "lista", { 0: bagAleska }])("produtos não array (%j) → []", (produtos) => {
    expect(lerVitrinePublica({ ...exemplo, produtos })?.produtos).toEqual([]);
  });

  it.each([
    ["id texto", { id: "21" }],
    ["id quebrado", { id: 2.5 }],
    ["id infinito", { id: Infinity }],
    ["sem nome", { nome: undefined }],
    ["nome vazio", { nome: "  " }],
    ["tipo inválido", { tipo: "servico" }],
  ])("produto com %s é descartado", (_caso, mudanca) => {
    const produtos = [{ ...bagAleska, ...mudanca }, { ...bagAleska, id: 22 }, null, "x"];
    expect(lerVitrinePublica({ ...exemplo, produtos })?.produtos.map((p) => p.id)).toEqual([22]);
  });

  it.each([0, -10, "189.90", NaN, Infinity, null])("preço %j → null", (preco) => {
    expect(lerVitrinePublica({ ...exemplo, produtos: [{ ...bagAleska, preco }] })?.produtos[0].preco).toBeNull();
  });

  it("descrição com espaços nas pontas; só espaços → null", () => {
    const lida = lerVitrinePublica({
      ...exemplo,
      produtos: [
        { ...bagAleska, descricao: "  Bolsa  " },
        { ...bagAleska, id: 22, descricao: "   " },
      ],
    });
    expect(lida?.produtos.map((p) => p.descricao)).toEqual(["Bolsa", null]);
  });

  it("aula com prazo → prazo e dias null", () => {
    const lida = lerVitrinePublica({
      ...exemplo,
      produtos: [{ ...bagAleska, tipo: "aula", prazo: "sob_encomenda", prazo_dias: 10 }],
    });
    expect(lida?.produtos[0]).toMatchObject({ tipo: "aula", prazo: null, prazo_dias: null });
  });

  it("pronta entrega com dias → dias null", () => {
    const lida = lerVitrinePublica({
      ...exemplo,
      produtos: [{ ...bagAleska, prazo: "pronta_entrega", prazo_dias: 10 }],
    });
    expect(lida?.produtos[0]).toMatchObject({ prazo: "pronta_entrega", prazo_dias: null });
  });

  it("prazo inválido → prazo e dias null", () => {
    const lida = lerVitrinePublica({ ...exemplo, produtos: [{ ...bagAleska, prazo: "amanha" }] });
    expect(lida?.produtos[0]).toMatchObject({ prazo: null, prazo_dias: null });
  });

  it.each([0, 366, 2.5, "15", -1])("dias %j → null", (prazo_dias) => {
    const lida = lerVitrinePublica({ ...exemplo, produtos: [{ ...bagAleska, prazo_dias }] });
    expect(lida?.produtos[0]).toMatchObject({ prazo: "sob_encomenda", prazo_dias: null });
  });

  it("mantém a ordem que veio do banco", () => {
    const produtos = [
      { ...bagAleska, id: 30, nome: "Zebra" },
      { ...bagAleska, id: 10, nome: "Abacaxi" },
    ];
    expect(lerVitrinePublica({ ...exemplo, produtos })?.produtos.map((p) => p.id)).toEqual([30, 10]);
  });

  describe("logo e foto (caminhos no bucket)", () => {
    const usuaria = "0f8e7a6b-1c2d-4e5f-8a9b-0c1d2e3f4a5b";
    const logoValido = `${usuaria}/logo-1763680000123.jpg`;
    const fotoValida = `${usuaria}/produtos/21-1763680000123.jpg`;

    it("caminhos válidos passam", () => {
      const lida = lerVitrinePublica({
        ...exemplo,
        logo: logoValido,
        produtos: [{ ...bagAleska, foto: fotoValida }],
      });
      expect(lida?.logo).toBe(logoValido);
      expect(lida?.produtos[0].foto).toBe(fotoValida);
    });

    it("campos ausentes → null", () => {
      const semLogo: Record<string, unknown> = { ...exemplo };
      delete semLogo.logo;
      const semFoto: Record<string, unknown> = { ...bagAleska };
      delete semFoto.foto;
      const lida = lerVitrinePublica({ ...semLogo, produtos: [semFoto] });
      expect(lida?.logo).toBeNull();
      expect(lida?.produtos[0].foto).toBeNull();
    });

    it.each([
      ["número", 123],
      ["texto vazio", ""],
      ["link inteiro", `https://abc.supabase.co/storage/v1/object/public/vitrine/${fotoValida}`],
      ["outra extensão", `${usuaria}/produtos/21-1.png`],
      ["foto no lugar do logo", fotoValida],
    ])("logo inválido (%s) → null", (_caso, logo) => {
      expect(lerVitrinePublica({ ...exemplo, logo })?.logo).toBeNull();
    });

    it.each([
      ["número", 123],
      ["texto vazio", ""],
      ["com espaços", ` ${fotoValida} `],
      ["outra pasta", `${usuaria}/outra/21-1.jpg`],
      ["logo no lugar da foto", logoValido],
    ])("foto inválida (%s) → null", (_caso, foto) => {
      const lida = lerVitrinePublica({ ...exemplo, produtos: [{ ...bagAleska, foto }] });
      expect(lida?.produtos[0].foto).toBeNull();
    });
  });

  it("não muta a entrada", () => {
    const entrada = {
      ...exemplo,
      nome_atelie: "  Teste  ",
      produtos: [{ ...bagAleska, tipo: "aula" }, { id: "x" }],
    };
    const copia = structuredClone(entrada);
    lerVitrinePublica(entrada);
    expect(entrada).toEqual(copia);
  });
});

describe("nomeDaVitrine", () => {
  it.each([
    ["  Ateliê da Ana  ", "Ateliê da Ana"],
    ["", NOME_RESERVA_VITRINE],
    ["   ", NOME_RESERVA_VITRINE],
    [null, NOME_RESERVA_VITRINE],
  ])("%j → %j", (nome, saida) => {
    expect(nomeDaVitrine(nome)).toBe(saida);
  });

  it("a reserva é Vitrine do ateliê", () => {
    expect(NOME_RESERVA_VITRINE).toBe("Vitrine do ateliê");
  });
});

describe("inicialDoNome", () => {
  it.each([
    ["ateliê", "A"],
    ["  bolsa", "B"],
    ["🌸 Flor", "F"],
    ["123 Bolsas", "1"],
    ["ítalo", "Í"],
    ["--- Bag", "B"],
  ])("%j → %j", (nome, inicial) => {
    expect(inicialDoNome(nome)).toBe(inicial);
  });

  it.each(["🌸🌸", "", "   ", "!!!"])("sem letra nem número (%j) → null", (nome) => {
    expect(inicialDoNome(nome)).toBeNull();
  });
});

describe("prazoPublico e precoPublico", () => {
  const base: ProdutoPublico = {
    id: 1,
    nome: "Bag",
    tipo: "fisico",
    descricao: null,
    preco: 120,
    prazo: "pronta_entrega",
    prazo_dias: null,
    foto: null,
  };

  it("aula → null", () => {
    expect(prazoPublico({ ...base, tipo: "aula", prazo: "sob_encomenda", prazo_dias: 5 })).toBeNull();
  });

  it("prazo null → null", () => {
    expect(prazoPublico({ ...base, prazo: null })).toBeNull();
  });

  it("pronta entrega", () => {
    expect(prazoPublico(base)).toBe("Pronta entrega");
  });

  it("sob encomenda com e sem dias", () => {
    expect(prazoPublico({ ...base, prazo: "sob_encomenda", prazo_dias: 15 })).toBe(
      "Sob encomenda: fica pronto em até 15 dias"
    );
    expect(prazoPublico({ ...base, prazo: "sob_encomenda", prazo_dias: null })).toBe("Sob encomenda");
  });

  it("preço número → moeda; null → sob consulta", () => {
    expect(precoPublico(base)).toBe(formatarMoeda(120));
    expect(precoPublico({ ...base, preco: null })).toBe("Preço sob consulta");
  });
});

describe("Instagram", () => {
  it.each([
    ["@ana.croche", "ana.croche"],
    [" ana_croche ", "ana_croche"],
    ["https://www.instagram.com/ana.croche/", "ana.croche"],
    ["instagram.com/ana.croche", "ana.croche"],
    ["https://instagram.com/ana.croche?igsh=abc123", "ana.croche"],
  ])("normalizarInstagram(%s) → %s", (texto, usuario) => {
    expect(normalizarInstagram(texto)).toBe(usuario);
  });

  it("validarInstagram: vazio é válido; link é válido; caractere errado não", () => {
    expect(validarInstagram("")).toBeNull();
    expect(validarInstagram("https://www.instagram.com/ana.croche/")).toBeNull();
    expect(validarInstagram("ana croche!")).toBe(
      "Use só o nome do perfil, com letras, números, ponto ou sublinhado."
    );
    expect(validarInstagram("a".repeat(31))).not.toBeNull();
  });

  it("linkInstagram", () => {
    expect(linkInstagram("@ana.croche")).toBe("https://www.instagram.com/ana.croche/");
  });
});

describe("sobre e descrição (limites)", () => {
  it("sobre: 500 ok, 501 erro", () => {
    expect(validarSobre("a".repeat(500))).toBeNull();
    expect(validarSobre("a".repeat(501))).toBe("Use até 500 caracteres.");
  });

  it("descrição: 1000 ok, 1001 erro", () => {
    expect(validarDescricao("a".repeat(1000))).toBeNull();
    expect(validarDescricao("a".repeat(1001))).toBe("Use até 1000 caracteres.");
  });
});

describe("produto na vitrine", () => {
  it.each([
    [true, true, true, true],
    [false, true, true, false],
    [true, false, true, false],
    [true, true, false, false],
  ])("ativo %s, publicado %s, vitrine publicada %s → %s", (ativo, publicado, vitrine, esperado) => {
    expect(produtoNaVitrine({ ativo, publicado }, vitrine)).toBe(esperado);
  });

  it("textoPreco: preço formatado ou sob consulta", () => {
    expect(textoPreco({ preco: 120, mostrar_preco: true })).toBe(formatarMoeda(120));
    expect(textoPreco({ preco: 120, mostrar_preco: false })).toBe("Preço sob consulta");
    expect(textoPreco({ preco: null, mostrar_preco: true })).toBe("Preço sob consulta");
    expect(textoPreco({ preco: 0, mostrar_preco: true })).toBe("Preço sob consulta");
  });

  it("textoPrazo", () => {
    expect(textoPrazo({ prazo: "pronta_entrega", prazo_dias: null })).toBe("Pronta entrega");
    expect(textoPrazo({ prazo: "sob_encomenda", prazo_dias: null })).toBe("Sob encomenda");
    expect(textoPrazo({ prazo: "sob_encomenda", prazo_dias: 1 })).toBe(
      "Sob encomenda: fica pronto em até 1 dia"
    );
    expect(textoPrazo({ prazo: "sob_encomenda", prazo_dias: 15 })).toBe(
      "Sob encomenda: fica pronto em até 15 dias"
    );
  });

  it("validarPrazo: limites 1 e 365, só sob encomenda, inteiro", () => {
    expect(validarPrazo("sob_encomenda", null)).toBeNull();
    expect(validarPrazo("sob_encomenda", 1)).toBeNull();
    expect(validarPrazo("sob_encomenda", 365)).toBeNull();
    expect(validarPrazo("sob_encomenda", 0)).toBe("Use um número de dias de 1 a 365.");
    expect(validarPrazo("sob_encomenda", 366)).toBe("Use um número de dias de 1 a 365.");
    expect(validarPrazo("sob_encomenda", 2.5)).toBe("Use um número de dias de 1 a 365.");
    expect(validarPrazo("pronta_entrega", 10)).toBe(
      "O prazo em dias só vale para Sob encomenda."
    );
  });
});

describe("validarVitrineProduto", () => {
  it("descrição: 1000 ok, 1001 erro", () => {
    expect(
      validarVitrineProduto({ descricao: "a".repeat(1000), prazo: "pronta_entrega", prazo_dias: null })
    ).toEqual({});
    expect(
      validarVitrineProduto({ descricao: "a".repeat(1001), prazo: "pronta_entrega", prazo_dias: null })
    ).toEqual({ descricao: "Use até 1000 caracteres." });
  });

  it("descrição só com espaços é válida", () => {
    expect(validarVitrineProduto({ descricao: "     ", prazo: "pronta_entrega", prazo_dias: null })).toEqual({});
  });

  it.each([null, 1, 365])("sob encomenda com %s dias → ok", (dias) => {
    expect(validarVitrineProduto({ descricao: "", prazo: "sob_encomenda", prazo_dias: dias })).toEqual({});
  });

  it.each([0, 366, 1.5])("sob encomenda com %s dias → erro", (dias) => {
    expect(validarVitrineProduto({ descricao: "", prazo: "sob_encomenda", prazo_dias: dias })).toEqual({
      prazo_dias: "Use um número de dias de 1 a 365.",
    });
  });

  it("pronta entrega com dias preenchidos é válido (o service grava null)", () => {
    expect(validarVitrineProduto({ descricao: "", prazo: "pronta_entrega", prazo_dias: 10 })).toEqual({});
  });

  it("sem prazo (aula) não confere os dias", () => {
    expect(validarVitrineProduto({ descricao: "", prazo_dias: 999 })).toEqual({});
  });
});

describe("validarVitrine", () => {
  const certo = {
    endereco: "Ateliê da Ana",
    whatsapp: "(41) 99999-9999",
    instagram: "@ana.croche",
    sobre: "Bolsas de crochê feitas à mão.",
  };

  it("tudo certo, publicando → sem erros", () => {
    expect(validarVitrine(certo, { publicar: true })).toEqual({});
  });

  it("sem WhatsApp: erro só ao publicar", () => {
    expect(validarVitrine({ ...certo, whatsapp: "" }, { publicar: false })).toEqual({});
    expect(validarVitrine({ ...certo, whatsapp: "" }, { publicar: true })).toEqual({
      whatsapp: "Digite o seu WhatsApp para publicar a vitrine.",
    });
  });

  it("erros em vários campos", () => {
    expect(
      validarVitrine(
        { endereco: "", whatsapp: "123", instagram: "ana croche!", sobre: "a".repeat(501) },
        { publicar: false }
      )
    ).toEqual({
      endereco: "Digite o endereço da sua vitrine.",
      whatsapp: "Digite o WhatsApp com DDD, como (41) 99999-9999.",
      instagram: "Use só o nome do perfil, com letras, números, ponto ou sublinhado.",
      sobre: "Use até 500 caracteres.",
    });
  });
});
