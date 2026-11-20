/* Redução da foto no navegador (V6b, decisão Q5), sem pacote: canvas.
   Só navegador (usa document, Image, createImageBitmap): sem teste unitário.
   Regravar pelo canvas também tira os dados escondidos da foto (como a
   localização do celular). HEIC não é convertido (Q6): se o navegador não
   abrir, vira NAO_ABRIU. */

import {
  ErroFoto,
  medidasReduzidas,
  QUALIDADE_JPEG,
  TAMANHO_MAXIMO_FOTO,
} from "./imagens";

/** Segunda tentativa quando a foto passa de 2 MB. */
const QUALIDADE_MENOR = 0.6;

interface ImagemAberta {
  imagem: CanvasImageSource;
  largura: number;
  altura: number;
  liberar: () => void;
}

async function abrirComBitmap(arquivo: File): Promise<ImagemAberta> {
  /* "from-image": respeita o giro gravado pela câmera. */
  const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  return {
    imagem: bitmap,
    largura: bitmap.width,
    altura: bitmap.height,
    liberar: () => bitmap.close(),
  };
}

async function abrirComImagem(arquivo: File): Promise<ImagemAberta> {
  const url = URL.createObjectURL(arquivo);
  try {
    const imagem = new Image();
    await new Promise<void>((resolve, reject) => {
      imagem.onload = () => resolve();
      imagem.onerror = () => reject(new Error("imagem não abriu"));
      imagem.src = url;
    });
    return {
      imagem,
      largura: imagem.naturalWidth,
      altura: imagem.naturalHeight,
      liberar: () => {},
    };
  } finally {
    /* Depois de carregada, a imagem continua desenhável sem a URL. */
    URL.revokeObjectURL(url);
  }
}

async function abrir(arquivo: File): Promise<ImagemAberta> {
  if (typeof createImageBitmap === "function") {
    try {
      return await abrirComBitmap(arquivo);
    } catch {
      /* Tenta pelo outro caminho. */
    }
  }
  try {
    return await abrirComImagem(arquivo);
  } catch {
    throw new ErroFoto("NAO_ABRIU");
  }
}

function paraJpeg(canvas: HTMLCanvasElement, qualidade: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new ErroFoto("NAO_ABRIU"))),
      "image/jpeg",
      qualidade
    );
  });
}

/**
 * Reduz a foto para caber em ladoMaximo (lado maior), em JPEG com fundo
 * branco (foto com transparência não fica preta). Passou de 2 MB: tenta com
 * qualidade 0,6; ainda maior → ErroFoto MUITO_GRANDE.
 */
export async function reduzirImagem(arquivo: File, ladoMaximo: number): Promise<Blob> {
  if (!arquivo.type.startsWith("image/")) throw new ErroFoto("NAO_E_IMAGEM");

  const aberta = await abrir(arquivo);

  try {
    if (aberta.largura <= 0 || aberta.altura <= 0) throw new ErroFoto("NAO_ABRIU");

    const { largura, altura } = medidasReduzidas(aberta.largura, aberta.altura, ladoMaximo);

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;

    const contexto = canvas.getContext("2d");
    if (!contexto) throw new ErroFoto("NAO_ABRIU");

    contexto.fillStyle = "#FFFFFF";
    contexto.fillRect(0, 0, largura, altura);
    contexto.drawImage(aberta.imagem, 0, 0, largura, altura);

    let blob = await paraJpeg(canvas, QUALIDADE_JPEG);
    if (blob.size > TAMANHO_MAXIMO_FOTO) blob = await paraJpeg(canvas, QUALIDADE_MENOR);
    if (blob.size > TAMANHO_MAXIMO_FOTO) throw new ErroFoto("MUITO_GRANDE");

    return blob;
  } finally {
    aberta.liberar();
  }
}
