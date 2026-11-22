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
| vitest | 4.1.12 (testes das funções puras de `lib/`) |

- **Testes:** Vitest 4 instalado; rode `npm test` (371 testes em 21/11/2026).
- **Não instalados:** Zod, TanStack Table, React Hook Form e outras bibliotecas de testes além do Vitest. Se precisar, avise; não instale. O Zod aparece em node_modules apenas como peça interna do ESLint; não é dependência do projeto e não deve ser importado sem autorização.
- Scripts: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, `npm test`.
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
  fotos/      CartaoFoto (foto do produto e logo do ateliê)
lib/supabase/ client.ts (navegador), server.ts (servidor) e publico.ts (cliente público sem sessão, só para a vitrine)
services/     acesso a dados; vários arquivos ainda vazios
types/        tipos; vários arquivos ainda vazios
middleware.ts proteção de rotas
```

Rotas: `/`, `/login`, `/auth/callback`, `/dashboard`, `/empresa`, `/clientes`, `/clientes/[id]`, `/clientes/[id]/editar`, `/pedidos`, `/pedidos/[id]`, `/produtos`, `/produtos/[id]`, `/materiais`, `/estoque`, `/calculadora-rapida`, `/empresa/termometro`, `/empresa/vitrine`, `/v/[endereco]` (pública).

Vitrine (Jornada 3, V3b): `/empresa/vitrine` edita endereço, WhatsApp, Instagram e "sobre", publica ou tira do ar (aberta pelo menu "Vitrine" e pelo cartão "Sua vitrine" em Dados do ateliê, que fica fora do formulário). Rota privada. Com a vitrine SALVA publicada, as duas telas mostram "Ver minha vitrine" (nova aba, endereço salvo).

Vitrine pública (V5): `/v/[endereco]` é componente de servidor, `force-dynamic`, noindex, sem menu (`AppShell`) e com `not-found.tsx` próprio (inexistente e fora do ar dão a mesma tela). Lê pela `services/vitrinePublica.server.ts` (só servidor; `cache` do React só na mesma montagem) com `lib/supabase/publico.ts`: cliente sem cookies, sempre `anon`, SÓ para a vitrine pública. O número do WhatsApp não aparece em texto, só no link do botão (O12). Visual V6d: cabeçalho em cartão com logo redondo, nome, "Sobre" e os botões de contato (W4: centralizado e compacto no celular e no tablet; a partir de `lg`, faixa horizontal com logo à esquerda, nome e "Sobre" no meio e a frase do WhatsApp com os botões empilhados à direita); cartões de produto com foto quadrada ou a inicial (`inicialDoNome`) quando não há foto; 1, 2 ou 3 colunas (celular, `sm`, `lg`); rodapé "Vitrine feita com `NOME_SISTEMA`"; `<img>` comum (Q9). O middleware deixa `/v/` (com barra) passar antes do `getUser`; `/v` e `/vitrine` continuam exigindo login.

Termômetro da marca (Etapa 11): `/empresa/termometro` tem as 5 perguntas do mês atual, mostra os pontos e o nível sugerido e, com um clique, salva as respostas e muda o nível da marca (aberto pelo cartão "Sua marca" em Dados do ateliê).

Cálculo rápido (Etapa 10): `/calculadora-rapida` faz a conta de uma peça ou aula sem cadastrar, com o motor único e os materiais do cadastro; nada é salvo. Telas antigas desligadas na Etapa 8 (o endereço só redireciona): `/calculadora` → `/produtos`; `/configuracoes` → `/empresa`.

Fatos importantes:

- O layout raiz (`app/layout.tsx`) é Server Component; o `AppShell` (menus e avisos) é `"use client"`. Hoje quase todas as consultas ao banco rodam no navegador; o cliente de servidor (`lib/supabase/server.ts`) só é usado no retorno do login. A página pública `/v/[endereco]` roda no servidor com o cliente público `lib/supabase/publico.ts` (sem sessão, sempre `anon`).
- A página `/` só redireciona para `/dashboard` (quem não está logado vai antes para `/login` pelo middleware).
- Os componentes de produto ficam em `components/produtos/` (a pasta antiga `components/products/` foi removida na Etapa 8).
- Há cerca de 80 `console.*` de diagnóstico e, em 21/11/2026, 13 problemas de lint (10 erros e 3 avisos). Não corrija fora do escopo do prompt.

---

## 5. Banco de dados (auditado em 14/11/2026)

**Infraestrutura (decidido em 15/11/2026):** o Precifica+ é um produto vendido a terceiros e usa um projeto Supabase PRÓPRIO, com login próprio. Ele nunca deve ser ligado ao projeto `jc-empresa` nem a outros sistemas internos da JC.

**Sempre confira o schema real antes de escrever consultas.** A referência do schema (14/11/2026) está em `supabase/migrations/20261114000000_baseline_referencia.sql`. As migrations posteriores, na mesma pasta, mostram o que mudou desde então.

### Segurança

- **RLS ativo em todas as tabelas**, com policies de isolamento por usuária (`auth.uid() = user_id`).
- Tabelas filhas são protegidas pela mãe: `order_items` pelo pedido, `product_materials` pelo produto.
- O visitante não logado (`anon`) não tem acesso a nenhuma tabela. Usuárias logadas (`authenticated`) têm só SELECT, INSERT, UPDATE e DELETE. Nunca conceda acesso a `anon`.
- **Regra L11 (migration 20261120090000):** tabelas, sequências e funções criadas pelo papel `postgres` no esquema `public` não nascem mais com acesso do `anon` (default privileges). Além disso, por uma regra GLOBAL (o `EXECUTE` de `PUBLIC` em funções novas é padrão global do Postgres), toda função nova criada pelo `postgres` nasce sem execute para ninguém além do dono: **cada migration que cria função precisa de `grant execute ... to authenticated` explícito** (ou `to anon`, só na função pública da vitrine). As funções que já existiam não mudaram. Mesmo assim, toda migration nova continua com o seu `revoke ... from anon` explícito. As funções de gatilho `handle_new_user` e `set_updated_at` não podem ser chamadas diretamente (execute revogado de public, anon e authenticated); os gatilhos continuam funcionando. A única exceção para o visitante é a função pública da vitrine, `vitrine_publica(p_endereco)`, liberada de propósito: criada na V4 e recriada na V6a, sempre com `revoke` + `grant`. É a única função que o `anon` executa (conferido no banco na V7).
- **Função pública da vitrine (migration 20261120120000):** `public.vitrine_publica(p_endereco text)` → `jsonb`: única função do `anon`; `security definer`, `search_path` vazio, campos um a um; `null` se não existe ou não publicada; `preco` só com `mostrar_preco` e > 0; aula sem prazo; categoria fora por enquanto; `grant execute` só para `anon` e `authenticated`. Toda mudança nela traz `revoke` + `grant` (L11). Desde a migration 20261120200000 devolve também `logo` (vitrine) e `foto` (produto), só como caminho no bucket.
- **Pendência (T3):** o `middleware.ts` usa `startsWith` sem barra em `/login` e `/auth/callback`, então um endereço como `/login-qualquer` passaria sem login (hoje não existe nenhuma rota assim). Corrigir na troca para `proxy.ts`.
- **Fotos e logo (migration 20261120200000, V6a):** bucket `vitrine` público para leitura, só JPEG, até 2 MB. Caminhos `<user_id>/produtos/<id do produto>-<data-hora>.jpg` e `<user_id>/logo-<data-hora>.jpg` (nome novo a cada envio). Colunas `products.foto` e `business_metrics.logo` guardam o caminho; as restrições `products_foto_formato` e `business_metrics_logo_formato` conferem o formato e que a pasta é o `user_id` da linha. Policies `vitrine_fotos_*` em `storage.objects` só para `authenticated`, cada conta só na própria pasta. **Nunca criar policy de storage para `anon`** nem mexer nos grants das tabelas do schema `storage`.
- **Fotos no código (V6b):** `lib/imagens.ts` (puro, com testes) tem as constantes (foto 1200px, logo 600px, JPEG 0,8, 2 MB), `ErroFoto`, `medidasReduzidas`, os caminhos (`caminhoFotoProduto`, `caminhoLogo`, as mesmas regex do banco) e `linkPublicoFoto`. `lib/reduzirImagem.ts` (só navegador) reduz pelo canvas, com fundo branco; HEIC não é convertido. `services/fotos.service.ts` envia e remove a foto do produto e o logo, sempre na ordem **subir o arquivo novo → gravar o caminho → só então apagar o antigo** (falha ao gravar apaga o novo; falha ao apagar o antigo só vai para o log). Excluir produto apaga a foto depois da linha; arquivar mantém. `updateProduto`, `salvarVitrineProduto`, `salvarConfiguracoesAtelie` e `salvarNivelMarca` nunca gravam foto nem logo.
- **Telas de foto (V6c1):** `components/fotos/CartaoFoto.tsx` (tipo `foto` ou `logo`) envia na hora em que a artesã escolhe, sempre FORA dos formulários (não aciona "Sair sem salvar?"); botões "Escolher / Trocar / Remover", com confirmação para remover. Erro ao tirar a foto ou o logo é `REMOCAO_FALHOU`. O cartão "Foto do produto" fica em `/produtos/[id]`, entre o `PainelPreco` e o "Na vitrine". O cartão "Logo do ateliê" (V6c2) fica em `/empresa`, fora do `<form>`, logo depois dele e antes de "Sua vitrine"; o logo tem estado próprio e não entra no "Sair sem salvar?".
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
- **Vitrine pública (Jornada 3):** o visitante (`anon`) continua SEM acesso às tabelas. A vitrine lê apenas a função própria `vitrine_publica`, que entrega só os campos públicos (nome, descrição, foto, preço ou "sob consulta", prazo; a categoria fica fora por enquanto) dos produtos marcados como publicados, e os dados de contato do ateliê. Nunca expõe custo, margem, materiais, estoque, clientes ou pedidos. Essa exceção foi desenhada e revisada em tarefas próprias (V4 e V7); não libere acesso de `anon` a tabelas para "resolver" a vitrine.
- **Revisão de segurança V7 (21/11/2026):** conferido no código, no banco (como `anon`) e na janela anônima. O visitante recebe só `endereco`, `nome_atelie`, `logo`, `whatsapp`, `instagram`, `sobre` e, nos produtos, `id`, `nome`, `tipo`, `descricao`, `foto`, `preco`, `prazo` e `prazo_dias`. O `anon` não tem acesso a tabelas, e a `lerVitrinePublica` usa uma lista fechada de campos (campo a mais vindo do banco é descartado).
  - **Risco aceito (T1):** o link público da foto e do logo leva o `user_id` e o id do produto (`<user_id>/produtos/<id>-<ms>.jpg`). O uuid não é segredo, e o RLS e as policies continuam protegendo os dados. O id do produto (sequencial) também sai na resposta da função (usado só como `key`); aceito pelo mesmo motivo (no máximo permite estimar quantos produtos a conta tem).
  - **Riscos aceitos já registrados:** o número do WhatsApp vai no link do botão (O12); a foto de um produto não publicado abre para quem tiver o link (Q2).
- **Vitrine — regras no código (V2):** `lib/vitrine.ts` tem as funções puras (endereço, WhatsApp, Instagram, textos de preço e prazo, validações) e `lib/texto.ts` a normalização de texto (sem acento, minúsculas), usada também na busca de produtos. O service da V3 grava o `whatsapp` só com dígitos (`normalizarWhatsapp`), o `instagram` normalizado (`normalizarInstagram`) e campo vazio como `null` (nunca `""`). A lista de endereços reservados (`ENDERECOS_RESERVADOS`) só existe no código, não no banco. Para a página pública (V5a): `formatarWhatsapp` (tira o 55, mostra (41) 99999-9999), `lerVitrinePublica` (confere o retorno de `vitrine_publica` campo a campo), `nomeDaVitrine` (reserva "Vitrine do ateliê"), `prazoPublico` (aula sem prazo) e `precoPublico`.
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
- Larguras no computador (W1): formulários e telas de um item com `max-w-3xl`; Início e cliente com `max-w-5xl`; listas com tabela (materiais, estoque, produtos, clientes) com `max-w-7xl`; vitrine pública com `max-w-6xl`. Pedidos ainda é tela antiga, sem largura máxima.
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
- Menu: no computador, lateral CLARA com o nome do sistema e do ateliê, ícone + texto e item ativo em verde suave; no celular, barra fixa embaixo com Início, Materiais, Produtos, Vendas e o botão "Mais" (Estoque, Cálculo rápido, Clientes, Vitrine, Dados do ateliê). "Vitrine" (`/empresa/vitrine`) fica no grupo Vendas da lateral e no "Mais" (a barra continua com 4 itens + Mais). Item ativo: o próprio endereço ou uma página dentro dele, menos as de `exceto` ("Dados do ateliê" tem `exceto: ["/empresa/vitrine"]`, para não acender junto com "Vitrine"). Sem fundo preto.
- Linguagem do dia a dia: "Início" (não "Dashboard"), "Meu lucro", "Preço sugerido". Sem "Score", "Performance" ou "Premium".

---

## 8. Situação atual e ordem de trabalho

O plano completo (Roadmap) é mantido pelo arquiteto. Resumo das fases:

1. Fundação segura e base do banco para escala ✅
2. Protótipo visual ✅ (aprovado)
3. Kit visual e menu novo ✅
4. Jornada 1 — Materiais (compras, estoque, unidades de compra × uso) ✅
5. Jornada 2 — Produtos (categorias de produto, ficha técnica, preço único) ✅
6. **Jornada 3 — Vitrine pública, pedidos e clientes** ← fase atual: Vitrine concluída (V0–V7); próximo: push, teste com alunas, Pedidos
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
