import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CabecalhoPagina } from "@/components/ui/CabecalhoPagina";
import { Cartao } from "@/components/ui/Cartao";
import { LinkBotao } from "@/components/ui/LinkBotao";
import {
  CIDADE_RESPONSAVEL,
  CNPJ_RESPONSAVEL,
  EMAIL_CONTATO,
  NOME_SISTEMA,
  RESPONSAVEL_SISTEMA,
} from "@/lib/marca";

/* Página pública (sem login). A política descreve o que o sistema faz:
   mudou dado coletado, fornecedor, vitrine ou fotos → atualizar aqui e a data. */

export const metadata: Metadata = {
  title: `Política de privacidade · ${NOME_SISTEMA}`,
};

function Paragrafo({ children }: { children: ReactNode }) {
  return <p className="text-lg text-texto">{children}</p>;
}

function Lista({ children }: { children: ReactNode }) {
  return <ul className="flex list-disc flex-col gap-2 pl-6 text-lg text-texto">{children}</ul>;
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Cartao titulo={titulo}>
      <div className="flex flex-col gap-3">{children}</div>
    </Cartao>
  );
}

const email = (
  <a href={`mailto:${EMAIL_CONTATO}`} className="break-all font-bold text-destaque underline">
    {EMAIL_CONTATO}
  </a>
);

export default function PoliticaDePrivacidade() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-10">
      <LinkBotao href="/" variante="discreto" icone="voltar" className="mb-4 -ml-3">
        Voltar para o {NOME_SISTEMA}
      </LinkBotao>

      <CabecalhoPagina
        titulo="Política de privacidade"
        subtitulo="Última atualização: 22 de novembro de 2026"
      />

      <div className="flex flex-col gap-6">
        <Paragrafo>
          O {NOME_SISTEMA} é um sistema para artesãos, mantido por {RESPONSAVEL_SISTEMA} (CNPJ{" "}
          {CNPJ_RESPONSAVEL}), de {CIDADE_RESPONSAVEL}. Esta página explica, de forma simples,
          quais dados guardamos, para que usamos e quais são os seus direitos pela Lei Geral de
          Proteção de Dados (LGPD). O {NOME_SISTEMA} está em fase de teste e é destinado a maiores
          de 18 anos.
        </Paragrafo>

        <Secao titulo="1. Quais dados guardamos">
          <Lista>
            <li>
              Da sua conta: nome, e-mail e foto de perfil que o Google envia quando você entra com
              a sua conta Google. Nós não recebemos a sua senha.
            </li>
            <li>
              Do seu ateliê: o que você cadastra no sistema, como nome do ateliê, meta de ganho,
              custos, materiais, estoque, produtos, preços, respostas do termômetro da marca,
              pedidos e clientes.
            </li>
            <li>
              Da sua vitrine: endereço da vitrine, WhatsApp, Instagram, texto &quot;Sobre o
              ateliê&quot;, logo, fotos e descrições dos produtos.
            </li>
          </Lista>
        </Secao>

        <Secao titulo="2. Dados das suas clientes">
          <Paragrafo>
            Quando você cadastra clientes (nome, telefone e outros contatos), é você quem decide
            guardar esses dados e responde por eles (pela LGPD, você é a controladora). Cadastre
            só o necessário e com o conhecimento da cliente. O {NOME_SISTEMA} apenas guarda esses
            dados para você (pela LGPD, é o operador) e não os usa para nenhuma outra finalidade.
          </Paragrafo>
        </Secao>

        <Secao titulo="3. Para que usamos os dados">
          <Lista>
            <li>
              Para o sistema funcionar: guardar seus cadastros, calcular custos e preços e montar a
              sua vitrine.
            </li>
            <li>Para falar com você sobre a sua conta e sobre o teste.</li>
            <li>Para manter o sistema e as contas seguros.</li>
          </Lista>
          <Paragrafo>
            Pela LGPD, usamos seus dados para cumprir o contrato de uso do sistema, para cumprir
            obrigações legais e, no caso da segurança, pelo nosso legítimo interesse em proteger o
            sistema e as contas.
          </Paragrafo>
          <Paragrafo>
            Não vendemos seus dados, não usamos para propaganda e não compartilhamos com outras
            empresas além das que fazem o sistema funcionar (item 6).
          </Paragrafo>
        </Secao>

        <Secao titulo="4. O que fica público na vitrine">
          <Paragrafo>
            Só depois que você clica em &quot;Publicar minha vitrine&quot;, qualquer pessoa com o
            link consegue ver: nome e logo do ateliê, o texto &quot;Sobre o ateliê&quot;, os
            botões de WhatsApp e Instagram (o seu número de WhatsApp vai dentro do link do botão)
            e os produtos que você escolheu mostrar, com nome, descrição, foto, preço (ou
            &quot;Preço sob consulta&quot;) e prazo.
          </Paragrafo>
          <Paragrafo>
            Nunca aparecem na vitrine: custos, margens, ficha técnica, preço sugerido, clientes e
            pedidos.
          </Paragrafo>
          <Paragrafo>
            Durante o teste, pedimos aos buscadores, como o Google, que não mostrem as vitrines. O{" "}
            {NOME_SISTEMA} não divulga as vitrines: você decide onde compartilhar o seu link, por
            exemplo no seu Instagram e no seu WhatsApp. Você pode tirar a vitrine do ar quando
            quiser.
          </Paragrafo>
        </Secao>

        <Secao titulo="5. Fotos e logo">
          <Paragrafo>
            Ao enviar uma foto ou o logo, o sistema reduz o tamanho da imagem e remove os dados da
            câmera, como a localização. As fotos e o logo ficam guardados num endereço de internet
            difícil de adivinhar, que inclui um código interno da sua conta. Quem tiver o link
            exato de uma foto consegue abri-la, mesmo que o produto não esteja na vitrine. Quando
            você remove uma foto ou exclui o produto, o arquivo é apagado. Envie só fotos das suas
            peças, sem documentos ou informações pessoais.
          </Paragrafo>
        </Secao>

        <Secao titulo="6. Onde os dados ficam">
          <Lista>
            <li>Supabase: banco de dados e fotos, em servidores em São Paulo.</li>
            <li>
              Vercel: hospedagem do site (empresa dos Estados Unidos). Pode registrar dados
              técnicos de acesso, como endereço IP e tipo de navegador, para segurança e
              funcionamento.
            </li>
            <li>Google: login com a conta Google.</li>
          </Lista>
          <Paragrafo>
            Alguns dados podem passar por servidores nos Estados Unidos (Vercel e Google). Essas
            empresas seguem regras próprias de segurança e privacidade. Você pode pedir mais
            informações sobre isso pelo canal de privacidade (item 11).
          </Paragrafo>
        </Secao>

        <Secao titulo="7. Segurança">
          <Paragrafo>
            A conexão é protegida (https). Fora o que você publica na vitrine e as fotos (item 5),
            cada conta só consegue ver e alterar os próprios dados: essa proteção fica no próprio
            banco de dados. Mesmo com esses cuidados, nenhum sistema na internet é 100% seguro. Se
            acontecer algum problema de segurança que afete os seus dados, vamos avisar você.
          </Paragrafo>
        </Secao>

        <Secao titulo="8. Cookies">
          <Paragrafo>
            Usamos só os cookies necessários para manter o seu login ativo. Não usamos cookies de
            propaganda nem de análise de visitas.
          </Paragrafo>
        </Secao>

        <Secao titulo="9. Por quanto tempo guardamos">
          <Paragrafo>
            Enquanto a sua conta existir. Se você pedir, apagamos a sua conta e os seus dados,
            inclusive fotos e logo, exceto o que a lei nos obrigue a guardar por um tempo. Cópias
            de segurança do banco de dados podem permanecer por alguns dias, até serem
            substituídas.
          </Paragrafo>
        </Secao>

        <Secao titulo="10. Seus direitos">
          <Paragrafo>Pela LGPD, você pode:</Paragrafo>
          <Lista>
            <li>confirmar se tratamos seus dados e saber quais dados temos sobre você;</li>
            <li>corrigir seus dados (a maioria pelas próprias telas do sistema);</li>
            <li>pedir uma cópia dos seus dados, inclusive para levar a outro serviço;</li>
            <li>pedir a exclusão da sua conta e dos seus dados;</li>
            <li>saber com quais empresas compartilhamos seus dados (item 6);</li>
            <li>retirar o seu consentimento, quando o uso depender dele;</li>
            <li>reclamar na Autoridade Nacional de Proteção de Dados (ANPD).</li>
          </Lista>
          <Paragrafo>
            Durante o teste, a exclusão da conta é feita por pedido: escreva para {email} a partir
            do e-mail da sua conta. Respondemos ao pedido em até 15 dias.
          </Paragrafo>
        </Secao>

        <Secao titulo="11. Canal de privacidade e contato">
          <Paragrafo>
            Responsável: {RESPONSAVEL_SISTEMA}, CNPJ {CNPJ_RESPONSAVEL}, {CIDADE_RESPONSAVEL}.
            Canal de privacidade e contato: {email}.
          </Paragrafo>
        </Secao>

        <Secao titulo="12. Mudanças nesta política">
          <Paragrafo>
            Quando esta política mudar, a data no topo será atualizada. Mudanças importantes serão
            avisadas no sistema ou por e-mail.
          </Paragrafo>
        </Secao>
      </div>
    </div>
  );
}
