import { describe, expect, it } from "vitest";

import { formatarMoeda } from "./formatar";
import { normalizarTexto, semAcentos } from "./texto";
import {
  ENDERECOS_RESERVADOS,
  linkInstagram,
  linkWhatsapp,
  normalizarEndereco,
  normalizarInstagram,
  normalizarWhatsapp,
  produtoNaVitrine,
  sugerirEndereco,
  textoPrazo,
  textoPreco,
  validarDescricao,
  validarEndereco,
  validarInstagram,
  validarPrazo,
  validarSobre,
  validarVitrine,
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
