@AGENTS.md

# CLAUDE.md — Precifica+

Instruções permanentes para o Claude Code neste repositório.
Leia este arquivo inteiro antes de qualquer tarefa.

---

## 1. O produto

**Precifica+** (nome provisório; o nome final será definido para registro de domínio) é um sistema web de gestão e precificação vendido como serviço para **qualquer artesão**: crochê, costura, bijuteria, sabonetes, velas, cerâmica etc.

- Público inicial: mais de 1.000 alunas de um curso de crochê de bolsas, muitas com **mais de 60 anos**.
- Uso principal no **celular**, mas tudo deve funcionar no computador.
- Objetivo: integrar materiais, produtos, ficha técnica, custo, preço, clientes, pedidos e estoque.
- Não deixe nada fixo de um nicho (crochê, bolsa) nem de uma marca específica.

Diretório local: `C:\Users\jcges\Documents\Projeto VS\precifica-artesao` (Windows, VS Code, PowerShell). O caminho tem espaço: use aspas nos comandos do PowerShell. O desenvolvimento era feito antes num notebook; hoje é feito neste PC.
Repositório: `github.com/Jotta-jc/precifica-artesao`, branch `main`.

---

## 2. Quem trabalha aqui e como

- **Juarez** é o proprietário. É iniciante em programação e escreve em português do Brasil.
- **Claude (chat)** atua como arquiteto, mentor e revisor. Escreve os prompts de implementação.
- **Claude Code** (você) implementa a partir desses prompts e devolve o `git diff` para revisão.

### Regras de execução

1. **Um passo por vez.** Faça somente o que o prompt pede. Não adiante tarefas seguintes.
2. **Ao terminar, mostre o `git diff`** das alterações e pare. Aguarde a revisão.
3. **Em caso de erro, pare.** Mostre a mensagem completa, diagnostique a causa e proponha a correção. Não tente várias correções seguidas por conta própria.
4. **Não assuma que algo existe.** Verifique arquivos, tabelas, colunas e dependências antes de usar.
5. **Alterações pequenas.** Não reescreva arquivos inteiros quando uma edição pontual resolve.
6. **Explique em português simples** o que foi feito e por quê.

### Git

- **Commit apenas local**, e só quando o prompt pedir.
- **Push somente depois que o Juarez testar** e autorizar explicitamente. Nunca use `--force`.
- Antes de qualquer alteração, rode `git status` e preserve as alterações locais existentes.
- **Proibido sem autorização explícita:** `git reset --hard`, `git clean`, `git checkout -- .`, `git push --force`, rebase, ou qualquer comando que descarte trabalho.

### Segredos

- **Nunca leia, exiba, copie ou comente o conteúdo de `.env`, `.env.local` ou similares.** Para saber quais variáveis existem, procure os nomes no código (`process.env.`).
- Nunca peça senhas, chaves ou tokens. Se o Git ou outra ferramenta pedir login, avise o Juarez para ele fazer a autenticação.
- Nunca coloque segredos em código, logs, commits ou documentação.
- Nunca use `service_role` em variáveis `NEXT_PUBLIC_` ou em código que rode no navegador.
- Variáveis usadas hoje: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. O `.env*` está no `.gitignore`.

### Proibido sem autorização explícita

- Instalar ou remover dependências.
- `npm audit fix`, e principalmente `npm audit fix --force` (pode trocar versões principais e quebrar o sistema).
- Executar migrações ou alterar o banco Supabase.
- `DROP TABLE`, `DELETE`/`UPDATE` em massa, `TRUNCATE`.
- Desativar RLS para "resolver" erro de consulta.
- Excluir ou renomear pastas e arquivos.
- Deploy em produção.

---

## 3. Stack (versões conferidas em 15/11/2026)

| Pacote | Versão |
|---|---|
| next | 16.4.6 (App Router), atualizado em 15/11/2026 por segurança |
| react / react-dom | 19.2.4 |
| typescript | 5.9.3 |
| tailwindcss | 4.3.0 (configurado via CSS, sem tailwind.config.js) |
| @supabase/supabase-js | 2.105.4 |
| @supabase/ssr | 0.10.3 |
| eslint | 9.39.4 |

- **Não instalados:** Zod, TanStack Table, React Hook Form e qualquer biblioteca de testes. Se precisar, avise; não instale. O Zod aparece em node_modules apenas como peça interna do ESLint; não é dependência do projeto e não deve ser importado sem autorização.
- Scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.
- Use `npm run build` para validar tipos e compilação ao final de cada tarefa.
- Autenticação: Supabase Auth, só login com Google hoje (`/login` → `/auth/callback`). Falhas no retorno levam a `/login?erro=login`, com aviso na tela. O callback não registra código, URL nem sessão em log.
- O `.env.local` usa a chave `anon` antiga (legada) do Supabase, que será desativada no início de 2027. A troca pela chave "publishable" nova está planejada. Ao fazer essa troca, criar uma chave publishable NOVA no painel e desativar a antiga, que constava em documentos .docx no histórico do Git (já retirados do repositório).
- O projeto usa `middleware.ts`. O Next.js 16 avisa que a convenção mudou para `proxy.ts`. **Não migre** sem prompt específico: envolve sessão, cookies e proteção de rotas.
- A partir do Next.js 16.3, o `npm run dev` pode atualizar sozinho o bloco `nextjs-agent-rules` do AGENTS.md. Se o AGENTS.md aparecer alterado no git status, avise antes de commitar.
- Documentos do Word (`*.docx`) não entram no repositório (estão no .gitignore). Anotações do projeto ficam em `C:\Users\jcges\Documents\Projeto VS\precifica-docs`.

---

## 4. Estrutura

```text
app/          páginas e rotas (App Router)
components/   componentes
  crud/ forms/ ui/   em grande parte ARQUIVOS VAZIOS (reservados para o futuro kit visual)
  produtos/   componentes de produto em uso (FormularioProduto, FichaTecnica, PainelPreco)
lib/supabase/ client.ts (navegador) e server.ts (servidor)
services/     acesso a dados; vários arquivos ainda vazios
types/        tipos; vários arquivos ainda vazios
middleware.ts proteção de rotas
```

Rotas: `/`, `/login`, `/auth/callback`, `/dashboard`, `/empresa`, `/clientes`, `/clientes/[id]`, `/clientes/[id]/editar`, `/pedidos`, `/pedidos/[id]`, `/produtos`, `/produtos/[id]`, `/materiais`, `/estoque`, `/calculadora-rapida`, `/empresa/termometro`, `/empresa/vitrine`.

Vitrine (Jornada 3, V3b): `/empresa/vitrine` edita endereço, WhatsApp, Instagram e "sobre", publica ou tira do ar (aberta pelo cartão "Sua vitrine" em Dados do ateliê, que fica fora do formulário). Rota privada; a página pública `/v/<endereco>` vem na V5.

Termômetro da marca (Etapa 11): `/empresa/termometro` tem as 5 perguntas do mês atual, mostra os pontos e o nível sugerido e, com um clique, salva as respostas e muda o nível da marca (aberto pelo cartão "Sua marca" em Dados do ateliê).

Cálculo rápido (Etapa 10): `/calculadora-rapida` faz a conta de uma peça ou aula sem cadastrar, com o motor único e os materiais do cadastro; nada é salvo. Telas antigas desligadas na Etapa 8 (o endereço só redireciona): `/calculadora` → `/produtos`; `/configuracoes` → `/empresa`.

Fatos importantes:

- O layout raiz (`app/layout.tsx`) é Server Component; o `AppShell` (menus e avisos) é `"use client"`. Hoje quase todas as consultas ao banco rodam no navegador; o cliente de servidor (`lib/supabase/server.ts`) só é usado no retorno do login.
- A página `/` só redireciona para `/dashboard` (quem não está logado vai antes para `/login` pelo middleware).
- Os componentes de produto ficam em `components/produtos/` (a pasta antiga `components/products/` foi removida na Etapa 8).
- Há cerca de 80 `console.*` de diagnóstico e 36 erros de lint. Não corrija fora do escopo do prompt.

---

## 5. Banco de dados (auditado em 14/11/2026)

**Infraestrutura (decidido em 15/11/2026):** o Precifica+ é um produto vendido a terceiros e usa um projeto Supabase PRÓPRIO, com login próprio. Ele nunca deve ser ligado ao projeto `jc-empresa` nem a outros sistemas internos da JC.

**Sempre confira o schema real antes de escrever consultas.** A referência do schema (14/11/2026) está em `supabase/migrations/20261114000000_baseline_referencia.sql`. As migrations posteriores, na mesma pasta, mostram o que mudou desde então.

### Segurança

- **RLS ativo em todas as tabelas**, com policies de isolamento por usuária (`auth.uid() = user_id`).
- Tabelas filhas são protegidas pela mãe: `order_items` pelo pedido, `product_materials` pelo produto.
- O visitante não logado (`anon`) não tem acesso a nenhuma tabela. Usuárias logadas (`authenticated`) têm só SELECT, INSERT, UPDATE e DELETE. Nunca conceda acesso a `anon`.
- **Regra L11 (migration 20261120090000):** tabelas, sequências e funções criadas pelo papel `postgres` no esquema `public` não nascem mais com acesso do `anon` (default privileges). Além disso, por uma regra GLOBAL (o `EXECUTE` de `PUBLIC` em funções novas é padrão global do Postgres), toda função nova criada pelo `postgres` nasce sem execute para ninguém além do dono: **cada migration que cria função precisa de `grant execute ... to authenticated` explícito** (ou `to anon`, só na função pública da vitrine). As funções que já existiam não mudaram. Mesmo assim, toda migration nova continua com o seu `revoke ... from anon` explícito. As funções de gatilho `handle_new_user` e `set_updated_at` não podem ser chamadas diretamente (execute revogado de public, anon e authenticated); os gatilhos continuam funcionando. A única exceção futura para o visitante será a função pública da vitrine (etapa V4), liberada de propósito.
- **Função pública da vitrine (migration 20261120120000):** `public.vitrine_publica(p_endereco text)` → `jsonb`: única função do `anon`; `security definer`, `search_path` vazio, campos um a um; `null` se não existe ou não publicada; `preco` só com `mostrar_preco` e > 0; aula sem prazo; categoria fora por enquanto; `grant execute` só para `anon` e `authenticated`. Toda mudança nela traz `revoke` + `grant` (L11).
- Isolamento testado na prática com duas contas Google (15/11/2026): uma conta não vê nem abre registros da outra.
- Todas as políticas são para `authenticated` e usam `(select auth.uid())`, a forma rápida (o banco calcula a usuária uma vez por consulta). Toda política nova deve seguir esse padrão.
- `user_id` é obrigatório (`not null`) em `products` e `materials`. `products`, `material_movements` e `business_metrics` têm ligação com `auth.users`.
- As colunas usadas pelas políticas e pelas ligações têm índice (migration de 15/11/2026). Toda tabela nova deve ter índice em `user_id`.
- Todo dado de negócio pertence a uma usuária. **Nunca use UUID fixo.** Obtenha a usuária autenticada dinamicamente.
- GRANT não substitui POLICY. Toda tabela nova precisa de RLS, policies por operação e GRANT explícito:

```sql
grant select, insert, update, delete on public.nome_tabela to authenticated;
grant all on public.nome_tabela to service_role;
alter table public.nome_tabela enable row level security;
```

### Tabelas em uso pelo código

| Tabela | Observações |
|---|---|
| `clientes` | id uuid; `tipo_cliente` aceita só `cliente`, `revendedor`, `parceiro` |
| `orders` | id bigint; `client_id` → clientes; status padrão `orcamento`; `estoque_baixado` |
| `order_items` | `order_id`, `product_id`, quantidade, valor_unitario, valor_total |
| `products` | `categoria` é texto (hoje grava o id de material_categories: erro conhecido). Vitrine (migration 20261120090000): `descricao` (até 1000), `publicado` (padrão false), `mostrar_preco` (padrão true; false = "sob consulta"), `prazo` (`pronta_entrega` ou `sob_encomenda`) e `prazo_dias` (1 a 365, só com `sob_encomenda`). Na vitrine aparece só produto `ativo` + `publicado` + vitrine publicada; o preço é `products.preco` |
| `materials` | **`estoque_atual` é a coluna de estoque oficial na prática**; `estoque` é legada |
| `product_materials` | **ficha técnica, já existe e está em uso**; quantidade > 0 validada em todas as linhas (migration 20261119180000) |
| `material_movements` | `tipo` aceita só `entrada`, `saida`, `ajuste` |
| `material_categories` | coluna `nome` (não `name`); 16 categorias de teste já cadastradas — não reinserir |
| `business_metrics` | uma linha por usuária (`user_id` único); valor/hora |
| `termometro_marca` | respostas do termômetro da marca: uma linha por mês por conta (`unique (user_id, mes)`, `mes` no dia 1), histórico; sem exclusão pela tela. Só sugere o nível: o motor continua usando `business_metrics.marca_nivel` e `marca_fator` (migration 20261119200000) |
| `vitrines` | vitrine pública do ateliê, uma por conta (`user_id` único): `endereco` único (3 a 40, minúsculas, números e hífens; endereço `/v/<endereco>`), `publicada` (padrão false, só com WhatsApp), `whatsapp` (10 a 13 dígitos), `instagram` (sem @), `sobre` (até 500). Criada quando a artesã salva pela primeira vez; sem exclusão pela tela; `anon` sem acesso (migration 20261120090000) |

### Tabelas que existem mas o código não usa

`material_units`, `material_brands`, `material_colors`, `material_subcategories` (modelo completo de materiais, com unidade de compra × consumo) e `profiles` (preenchida pela função `handle_new_user` no cadastro). A tabela `test` foi removida em 14/11/2026. Na Etapa 9 (migration 20261119180000) foram apagadas `product_pricing`, `pricing_settings`, `artisan_profile`, `knowledge_settings` e `profit_levels`, que nenhuma tela usava.

### Exclusões bloqueadas (migration de 14/11/2026)

O banco recusa (`on delete restrict`, erro `23503`) a exclusão de:

- **cliente** que tem pedidos;
- **produto** que aparece em itens de pedido;
- **material** com movimentações de estoque ou usado em ficha técnica.

As telas de clientes, produtos e materiais tratam o código `23503` com mensagem clara em português. Continuam em cascata, de propósito: excluir um **pedido** apaga seus itens, e excluir um **produto sem vendas** apaga sua ficha técnica. Produtos e materiais podem ser **arquivados** (`ativo = false`): saem das listas e das escolhas novas sem perder o histórico; clientes ainda não têm essa opção.

### Migrations

- A pasta `supabase/migrations/` guarda as mudanças do banco, em ordem de data.
- O arquivo `20261114000000_baseline_referencia.sql` é só uma fotografia do banco: **nunca o execute**.
- Fluxo de toda mudança no banco: o Claude Code escreve a migration → o arquiteto revisa → o Juarez executa no SQL Editor → teste → commit.
- O Claude Code **nunca** executa migrations nem acessa o banco.

---

## 6. Regras de negócio

- **Materiais são insumos. Produtos são o que a artesã vende.**
- **Produto não usa `material_categories`.** Categoria de material classifica material; produto terá categoria própria (correção planejada).
- Aulas e cursos devem poder ser vendidos (provável tipo de item sem materiais e sem estoque — decisão pendente).
- Editar o cadastro de um material **nunca** altera o estoque. O estoque só muda por movimentações (`material_movements`).
- A fórmula de preço existe hoje em 4 versões diferentes no código. **Não crie uma quinta.** A metodologia oficial será decidida pelo proprietário.
- Margem e markup são diferentes. Margem é sobre o preço de venda; markup é sobre o custo.
- Não prometa IA na interface. As telas antigas "Configurações IA" e "Calculadora Inteligente", que não usavam IA, foram desligadas na Etapa 8.
- **Vitrine pública (Jornada 3):** o visitante (`anon`) continua SEM acesso às tabelas. A vitrine lerá apenas uma função ou view própria que entrega só os campos públicos (nome, descrição, foto, preço ou "sob consulta", prazo; a categoria fica fora por enquanto) dos produtos marcados como publicados, e os dados de contato do ateliê. Nunca expõe custo, margem, materiais, estoque, clientes ou pedidos. Essa exceção será desenhada e revisada em tarefa própria; não libere acesso de `anon` a tabelas para "resolver" a vitrine.
- **Vitrine — regras no código (V2):** `lib/vitrine.ts` tem as funções puras (endereço, WhatsApp, Instagram, textos de preço e prazo, validações) e `lib/texto.ts` a normalização de texto (sem acento, minúsculas), usada também na busca de produtos. O service da V3 grava o `whatsapp` só com dígitos (`normalizarWhatsapp`), o `instagram` normalizado (`normalizarInstagram`) e campo vazio como `null` (nunca `""`). A lista de endereços reservados (`ENDERECOS_RESERVADOS`) só existe no código, não no banco.
- **Vitrine — services (V3a):** `services/vitrine.service.ts` tem `buscarMinhaVitrine`, `salvarVitrine` (upsert por `user_id`; 23505 vira "endereço já em uso") e `tirarVitrineDoAr`, com `ErroVitrine` e `mensagemErroVitrine`. Os campos de vitrine do produto são gravados por `salvarVitrineProduto` (`services/produtos.service.ts`), separada do `updateProduto`.
- **Vitrine — cartão do produto (V3c):** `components/produtos/CartaoNaVitrine.tsx` fica em `/produtos/[id]`, entre o painel de preço e "Arquivar ou excluir": mostrar na vitrine, descrição, preço ou "sob consulta" e prazo (só peça física), com prévia; a página carrega a vitrine à parte e grava com `salvarVitrineProduto`.
- **Jornada 1 — Materiais (decidido em 17/11/2026):** categorias de material vêm da lista própria de cada artesã (tabela material_categories), com opção de criar novas; unidade de USO escolhida numa lista fixa (grama, quilo, metro, centímetro, mililitro, litro, unidade, par) e a artesã informa quanto vem em cada compra (ex.: rolo com 150 metros), e o sistema calcula o custo por unidade de uso; estoque mínimo com aviso "Acabando"; materiais com histórico podem ser arquivados. Marca, cor, subcategoria e código de barras ficam para depois. Base no banco: migration 20261117000000 (colunas unidade_uso, quantidade_por_compra e custo_por_unidade calculado; categorias padrão para todas as contas, inclusive novas). Tela nova de materiais entregue em 17/11/2026 (grava as colunas novas e as antigas, por compatibilidade com Estoque, Produtos e Pedidos). Estoque (17/11/2026): compras, usos e correções passam pela função registrar_movimentacao_estoque (migration 20261117010000), numa operação só: compra em embalagens, custo = último preço pago, estoque negativo bloqueado. A baixa de estoque da tela de Pedidos ainda é a antiga e deve passar a usar essa função na Jornada 3.

## Jornada 2 — Metodologia de preço (aprovada em 18/11/2026)

Regra: todo cálculo de preço fica num motor único em `lib/precificacao.ts`, com testes. Nenhuma tela calcula preço por conta própria.

Custo da peça = materiais (ficha técnica × custo_por_unidade) + tempo (horas × valor/hora) + adicional de complexidade (percentual sobre o valor do tempo) + embalagem + extras.

- Valor/hora = (quanto quero ganhar no mês + custos fixos do mês) ÷ horas produtivas no mês.
- Complexidade (sobre o valor do tempo): Simples +0%, Média +15%, Difícil +30%, Peça de autor +50%.
- Preço mínimo = custo ÷ (1 − taxas de venda − margem mínima). Sem marca e sem exclusividade.
- Preço justo = custo ÷ (1 − taxas de venda − margem ideal). Sem marca e sem exclusividade.
- Preço sugerido = preço justo × fator da marca × fator de exclusividade.
- Exclusividade: Produção regular ×1,0; Sob encomenda ×1,05; Edição limitada ×1,1; Peça única ×1,25.
- Fator da marca (termômetro): Começando ×1,0; Conhecida na região ×1,2; Reconhecida ×1,5; Referência ×2,0 ou mais (ajuste livre).
- Termômetro: perguntas 1 (seguidores) e 5 (mídia, feiras, prêmios, aulas) são informadas pela artesã, com lembrete mensal no Início. Perguntas 2 (vendas/mês, média de 3 meses), 3 (encomendas e espera) e 4 (clientes que voltam, 12 meses) passam a ser automáticas na Jornada 3; antes disso, ou com menos de 3 meses de registros, são informadas. A tela mostra a origem de cada número.
- Termômetro, K12 (aprovada em 20/11/2026): o termômetro não pede fator. Mudar para Referência grava ×2,0 (`PADROES_PRECO.marca.referencia`); se ela já é Referência, nada muda e o fator dela fica. O ajuste fino do fator da Referência é só em "Dados do ateliê".
- Termômetro, K13 (aprovada em 20/11/2026): um clique só, no cartão "Resultado". Com o resultado completo e o nível sugerido diferente do atual: botão principal "Salvar e mudar minha marca para <nível> (×fator)" e botão secundário "Só salvar as respostas". Sugerido igual ao atual: só "Salvar respostas" e a frase "A sugestão é igual ao seu nível de hoje.". Resultado incompleto: só "Salvar respostas". "Salvar e mudar" grava as respostas e depois o nível; se as respostas falharem, o nível não é tentado.
- Valores iniciais: taxas 15%, margem mínima 20%, margem ideal 30%. Todos os percentuais são editáveis em "Dados do ateliê".
- Exemplo para os testes: materiais 42 + tempo 6 h × 25 = 150 + complexidade 30% = 45 + embalagem 5 → custo 242 → mínimo 372,31; justo 440,00; sugerido 580,80 (marca 1,2 e exclusividade 1,1).
- Se uma soma de taxas e margem chegar a 100% ou mais, o motor deve devolver erro, nunca dividir por zero ou dar preço negativo.

---

## 7. Padrões de código

- Server Components por padrão; Client Components (`"use client"`) só quando houver interatividade.
- Acesso a dados concentrado em `services/`, respeitando a separação cliente/servidor.
- Tipagem forte; evite `any`.
- Trate erros e sempre mostre estados de carregamento, lista vazia e erro (nunca deixe a tela presa em "Carregando...").
- Não deixe `console.log` de diagnóstico em código novo. Nunca registre dados de login em log.

### Interface: requisitos obrigatórios (público 60+ e celular)

- **Celular primeiro.** Toda tela deve funcionar a partir de 360px de largura, sem rolagem horizontal da página.
- Fonte de conteúdo com no mínimo 16px; prefira 18px para textos importantes. Evite `text-xs` e `text-sm` em conteúdo.
- Botões e áreas de toque com no mínimo 44px de altura (de preferência 48px).
- Todo campo com rótulo visível (`<label htmlFor>`), não só texto de exemplo.
- Botões só com ícone precisam de `aria-label`.
- Contraste forte: evite `slate-400` sobre branco em textos.
- Mensagens em português simples. Nunca mostre o erro técnico do banco para a usuária.
- Dinheiro sempre no formato brasileiro (`R$ 12,50`), com `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.
- Mostre valores com rótulo amigável (ex.: "Em produção", não `producao`).
- Confirmação antes de excluir, explicando a consequência.
- **Visual aprovado (15/11/2026)**, referência: protótipo "Precifica+ — Protótipo do novo layout".
- Fonte: Nunito Sans (escolhida em 15/11/2026: zero sem traço, que não se confunde com o 8; negrito firme). Texto base 18px. Variável CSS --font-principal.
- Cores: fundo `#F6F4EF`; cartões brancos com borda `#DCD8CF`; texto `#1F2421`; texto secundário `#4E5651`; destaque verde-musgo `#2F5D50` (hover `#1F4238`, fundo suave `#E3EEE9`); aviso âmbar com fundo `#FDF1DC` e texto `#6B4100`; exclusão em vermelho escuro com bom contraste.
- Ícones de linha (SVG) sempre acompanhados de texto. Não usar emojis como ícones.
- Menu: no computador, lateral CLARA com o nome do sistema e do ateliê, ícone + texto e item ativo em verde suave; no celular, barra fixa embaixo com Início, Materiais, Produtos, Vendas e o botão "Mais" (Estoque, Cálculo rápido, Clientes, Dados do ateliê). O item Vitrine entra na barra quando a vitrine pública existir (Jornada 3, etapa V5). Sem fundo preto.
- Linguagem do dia a dia: "Início" (não "Dashboard"), "Meu lucro", "Preço sugerido". Sem "Score", "Performance" ou "Premium".

---

## 8. Situação atual e ordem de trabalho

O plano completo (Roadmap) é mantido pelo arquiteto. Resumo das fases:

1. Fundação segura e base do banco para escala ✅
2. Protótipo visual ✅ (aprovado)
3. **Kit visual e menu novo** ← fase atual
4. Jornada 1 — Materiais (compras, estoque, unidades de compra × uso)
5. Jornada 2 — Produtos (categorias de produto, ficha técnica, preço único)
6. Jornada 3 — Vitrine pública, pedidos e clientes
7. Início com os números do negócio
8. Pronto para vender (login por e-mail, LGPD, domínio, publicação, cobrança)
9. IA (opcional)

Já concluído: auditoria de código e banco; correção da edição de material que sobrescrevia o estoque; referência do schema versionada; bloqueio das exclusões em cascata; página inicial sem consulta ao banco; login sem logs sensíveis e com aviso de falha; permissões do banco ajustadas e tabela `test` removida; teste de isolamento com duas contas; promessas de IA retiradas da interface; Next.js atualizado para 16.4.6; documentos .docx retirados do repositório; base do banco para escala (políticas com (select auth.uid()), índices, user_id obrigatório).

Não desenvolva funcionalidades que dependam de decisões ainda não tomadas.

---

## 9. Formato da resposta ao final de cada tarefa

1. **Resumo** em português simples: o que foi feito.
2. **Arquivos alterados.**
3. **`git diff`** completo.
4. **Como testar** (passos no navegador ou comando).
5. **Pendências ou dúvidas**, se houver.

Depois disso, pare e aguarde.
