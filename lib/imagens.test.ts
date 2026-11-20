import { describe, expect, it } from "vitest";

import {
  BUCKET_VITRINE,
  caminhoFotoProduto,
  caminhoFotoValido,
  caminhoLogo,
  caminhoLogoValido,
  ErroFoto,
  LADO_MAXIMO_FOTO,
  LADO_MAXIMO_LOGO,
  linkPublicoFoto,
  medidasReduzidas,
  QUALIDADE_JPEG,
  TAMANHO_MAXIMO_FOTO,
} from "./imagens";

const USUARIA = "0f8e7a6b-1c2d-4e5f-8a9b-0c1d2e3f4a5b";

describe("constantes", () => {
  it("valores das decisões Q2 e Q5", () => {
    expect(BUCKET_VITRINE).toBe("vitrine");
    expect(LADO_MAXIMO_FOTO).toBe(1200);
    expect(LADO_MAXIMO_LOGO).toBe(600);
    expect(QUALIDADE_JPEG).toBe(0.8);
    expect(TAMANHO_MAXIMO_FOTO).toBe(2097152);
  });

  it("ErroFoto guarda o código", () => {
    const erro = new ErroFoto("MUITO_GRANDE");
    expect(erro).toBeInstanceOf(Error);
    expect(erro.code).toBe("MUITO_GRANDE");
    expect(erro.name).toBe("ErroFoto");
  });
});

describe("medidasReduzidas", () => {
  it.each([
    ["retrato", 3000, 4000, 1200, { largura: 900, altura: 1200 }],
    ["paisagem", 4000, 3000, 1200, { largura: 1200, altura: 900 }],
    ["quadrada", 2000, 2000, 600, { largura: 600, altura: 600 }],
    ["arredonda", 4032, 3024, 1200, { largura: 1200, altura: 900 }],
    ["arredonda ímpar", 1000, 333, 600, { largura: 600, altura: 200 }],
    ["menor que o limite não aumenta", 800, 600, 1200, { largura: 800, altura: 600 }],
    ["igual ao limite", 1200, 500, 1200, { largura: 1200, altura: 500 }],
    ["muito fina: mínimo 1", 10000, 2, 600, { largura: 600, altura: 1 }],
    ["fração arredonda", 800.4, 600.6, 1200, { largura: 800, altura: 601 }],
  ])("%s", (_caso, largura, altura, lado, esperado) => {
    expect(medidasReduzidas(largura, altura, lado)).toEqual(esperado);
  });

  it.each([
    [0, 100, 600],
    [100, 0, 600],
    [-1, 100, 600],
    [100, 100, 0],
    [NaN, 100, 600],
    [100, Infinity, 600],
    [100, 100, -600],
  ])("inválido (%s, %s, %s) → RangeError", (largura, altura, lado) => {
    expect(() => medidasReduzidas(largura, altura, lado)).toThrow(RangeError);
  });
});

describe("caminhos", () => {
  it("foto do produto", () => {
    expect(caminhoFotoProduto(USUARIA, 21, 1763680000123)).toBe(
      `${USUARIA}/produtos/21-1763680000123.jpg`
    );
  });

  it("logo", () => {
    expect(caminhoLogo(USUARIA, 0)).toBe(`${USUARIA}/logo-0.jpg`);
  });

  it("os caminhos gerados passam na regex do banco", () => {
    expect(caminhoFotoValido(caminhoFotoProduto(USUARIA, 21, 1763680000123))).toBe(true);
    expect(caminhoLogoValido(caminhoLogo(USUARIA, 1763680000123))).toBe(true);
  });

  it("foto não passa como logo e vice-versa", () => {
    expect(caminhoLogoValido(caminhoFotoProduto(USUARIA, 21, 1))).toBe(false);
    expect(caminhoFotoValido(caminhoLogo(USUARIA, 1))).toBe(false);
  });

  it.each([
    "0F8E7A6B-1C2D-4E5F-8A9B-0C1D2E3F4A5B",
    "nao-e-uuid",
    "",
    `${USUARIA}/x`,
  ])("conta inválida (%j) → RangeError", (userId) => {
    expect(() => caminhoFotoProduto(userId, 1, 1)).toThrow(RangeError);
    expect(() => caminhoLogo(userId, 1)).toThrow(RangeError);
  });

  it.each([0, -1, 2.5, NaN, Number.MAX_SAFE_INTEGER + 1])("produto inválido (%s) → RangeError", (id) => {
    expect(() => caminhoFotoProduto(USUARIA, id, 1)).toThrow(RangeError);
  });

  it.each([-1, 1.5, NaN, Infinity])("data inválida (%s) → RangeError", (agora) => {
    expect(() => caminhoFotoProduto(USUARIA, 1, agora)).toThrow(RangeError);
    expect(() => caminhoLogo(USUARIA, agora)).toThrow(RangeError);
  });

  it.each([
    `${USUARIA}/produtos/21-1.png`,
    `${USUARIA}/produtos/21.jpg`,
    `${USUARIA}/produtos/abc-1.jpg`,
    `${USUARIA}/outra/21-1.jpg`,
    `../${USUARIA}/produtos/21-1.jpg`,
    `${USUARIA}/produtos/21-1.jpg?x=1`,
    "",
  ])("foto fora do formato (%j)", (caminho) => {
    expect(caminhoFotoValido(caminho)).toBe(false);
  });

  it.each([`${USUARIA}/logo.jpg`, `${USUARIA}/logo-1.jpeg`, `${USUARIA}/x/logo-1.jpg`, ""])(
    "logo fora do formato (%j)",
    (caminho) => {
      expect(caminhoLogoValido(caminho)).toBe(false);
    }
  );
});

describe("linkPublicoFoto", () => {
  const foto = `${USUARIA}/produtos/21-1.jpg`;
  const esperado = `https://abc.supabase.co/storage/v1/object/public/vitrine/${foto}`;

  it("sem barra final", () => {
    expect(linkPublicoFoto("https://abc.supabase.co", foto)).toBe(esperado);
  });

  it("com barra(s) final(is)", () => {
    expect(linkPublicoFoto("https://abc.supabase.co/", foto)).toBe(esperado);
    expect(linkPublicoFoto("https://abc.supabase.co//", foto)).toBe(esperado);
  });

  it("logo também", () => {
    expect(linkPublicoFoto("https://abc.supabase.co", `${USUARIA}/logo-5.jpg`)).toBe(
      `https://abc.supabase.co/storage/v1/object/public/vitrine/${USUARIA}/logo-5.jpg`
    );
  });

  it.each([null, "", "qualquer/coisa.jpg", `${USUARIA}/produtos/21-1.png`])(
    "caminho null ou inválido (%j) → null",
    (caminho) => {
      expect(linkPublicoFoto("https://abc.supabase.co", caminho)).toBeNull();
    }
  );
});
