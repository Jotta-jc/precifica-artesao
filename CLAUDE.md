@AGENTS.md

# CLAUDE.md — Precifica+

Instruções permanentes para o Claude Code neste repositório.
Leia este arquivo inteiro antes de qualquer tarefa.

---

## 1. O projeto

**Precifica+** (marca complementar: **Jotta Art**) é um sistema web de gestão e precificação para pequenos negócios artesanais (bolsas e acessórios).

Objetivo: integrar clientes, produtos, materiais, estoque, pedidos, custos, ficha técnica e formação de preço em um só sistema.

Diretório local: `C:\Users\Samsung\Documents\precifica-artesao` (Windows, VS Code, PowerShell).

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
- **Push somente depois que o Juarez testar** e autorizar explicitamente.
- Antes de qualquer alteração, rode `git status` e preserve as alterações locais existentes.
- **Proibido sem autorização explícita:** `git reset --hard`, `git clean`, `git checkout -- .`, `git push --force`, rebase, ou qualquer comando que descarte trabalho.

### Segredos

- **Nunca leia, exiba, copie ou comente o conteúdo de `.env`, `.env.local` ou similares.** Se precisar saber quais variáveis o código usa, procure os nomes no código-fonte (ex.: `process.env.`), não no arquivo.
- Nunca peça senhas, chaves ou tokens.
- Nunca coloque segredos em código, logs, commits ou documentação.
- Nunca use `service_role` em variáveis `NEXT_PUBLIC_` ou em código que rode no navegador.
- `.env.local` não deve ser versionado (confirme no `.gitignore`).

### Proibido sem autorização explícita

- Instalar ou remover dependências.
- Executar migrações ou alterar o banco Supabase.
- `DROP TABLE`, `DELETE`/`UPDATE` em massa, `TRUNCATE`.
- Desativar RLS para "resolver" erro de consulta.
- Excluir ou renomear pastas e arquivos.
- Deploy em produção.

---

## 3. Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Backend | Supabase (Auth, PostgreSQL, RLS) |
| Autenticação | Supabase Auth com Google OAuth; tela em `/login` |
| Hospedagem | Local (`npm run dev` → `http://localhost:3000`). Vercel planejada |

- Next.js **16.2.6** foi observado na interface; confirme no `package.json`.
- Bibliotecas do padrão desejado (Zod, Recharts, TanStack Table, React Hook Form): **verifique se estão instaladas antes de usar.** Se não estiverem, avise; não instale.
- Testes automatizados: não presuma Jest, Vitest ou Playwright. Consulte os `scripts` do `package.json`.

### Comandos

```bash
npm run dev     # desenvolvimento
npm run build   # build de produção (use para validar tipos e build)
npm run start   # rodar o build
```

---

## 4. Estrutura

```text
app/          páginas e rotas (App Router)
components/   componentes reutilizáveis
  crud/       CrudModal, CrudPage, CrudTable, CrudToolbar
  forms/      TextField, MoneyField, QuantityField, SelectField, ...
  ui/         Badge, Button, Card, ConfirmDialog, EmptyState, Loading, ...
lib/supabase/ clientes Supabase
services/     acesso a dados e regras de negócio (*.service.ts)
types/        tipos TypeScript compartilhados
```

Módulos em `app/`: dashboard, empresa, clientes (`[id]`), pedidos (`[id]`), produtos, materiais, estoque, calculadora, configuracoes, login.

### Atenção

- Existem **`components/products/` e `components/produtos/`**. Não exclua nem mescle sem verificar todos os imports.
- O aviso *"The middleware file convention is deprecated. Please use proxy instead"* aparece no terminal. **Não migre** `middleware.ts` → `proxy.ts` sem prompt específico: isso envolve sessão, cookies e proteção de rotas.

---

## 5. Banco de dados (Supabase)

**Sempre confira o schema real antes de escrever consultas.** Os nomes no banco nem sempre batem com os do frontend.

Tabelas conhecidas: `clientes`, `orders`, `material_categories`, e produtos (nome exato da tabela a confirmar).

### `material_categories` (confirmada)

| Coluna | Tipo |
|---|---|
| `id` | bigint |
| `user_id` | uuid (obrigatório) |
| `nome` | text |
| `ativo` | boolean |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |

- A coluna é **`nome`**, não `name`.
- Já existem 16 categorias cadastradas na conta de desenvolvimento. **Não insira de novo.**

### `orders` (parcial)

Colunas usadas na tela de cliente: `id`, `client_id`, `status`, `valor_total`, `created_at`. Verifique o restante antes de integrar.

### Multiusuário e segurança

- Todo dado de negócio pertence a um usuário (`user_id`).
- **Nunca use UUID de usuário fixo no código.** Obtenha o usuário autenticado dinamicamente.
- O isolamento deve ser garantido por **RLS no PostgreSQL**, não só por filtro no frontend.
- Toda tabela nova precisa de: RLS ativado, policies por operação, GRANT explícito, isolamento por `user_id`.

Padrão de GRANT:

```sql
grant select, insert, update, delete on public.nome_tabela to authenticated;
grant all on public.nome_tabela to service_role;
alter table public.nome_tabela enable row level security;
```

GRANT não substitui POLICY. Nunca libere acesso a `anon` sem necessidade.
Não afirme que as tabelas atuais seguem esse padrão: isso ainda precisa ser auditado.

---

## 6. Regra de negócio central

**Materiais são insumos. Produtos são itens finais vendidos.**

- Materiais: tecido, fio, zíper, argola, alça.
- Produtos: Bolsa Aleška, Bolsa Maria, carteira, mochila.
- Um produto consome vários materiais por meio de uma **ficha técnica** (estrutura futura, ex.: `product_materials` — nome ainda não aprovado nem criado).
- **`material_categories` não deve classificar produtos.** Hoje `app/produtos/page.tsx` carrega categorias dessa tabela: isso é um erro arquitetural conhecido, a ser corrigido em etapa própria.
- A estrutura de categorias de produtos ainda não foi decidida. Não crie sem aprovação.
- Margem de lucro e markup são conceitos diferentes. Não os confunda nos cálculos.

---

## 7. Padrões de código

- Server Components por padrão; Client Components (`"use client"`) só quando houver interatividade.
- Acesso a dados concentrado em `services/`, respeitando a separação cliente/servidor.
- Reaproveite `components/ui`, `components/forms` e `components/crud` antes de criar novos.
- Tipagem forte; evite `any`.
- Trate erros e mostre estados de carregamento e vazio.
- Remova `console.log` de diagnóstico quando o prompt pedir limpeza.

### Interface

- Sidebar escura fixa à esquerda; fundo e cards brancos; bordas em tons de slate.
- Azul principal `#0B1739`, hover `#152250`. Exclusão em vermelho.
- Campos `<select>` e `<option>` com `bg-white text-slate-900`.
- Textos da interface em português, linguagem simples para pequenos empreendedores.

---

## 8. Situação atual e ordem de trabalho

Fase atual: **auditoria somente leitura**, depois separação entre Produtos e Materiais.

Ordem planejada (não pule etapas):

1. Auditoria do código e do banco (sem alterar nada)
2. Separação Produtos × Materiais
3. Revisão dos cadastros de materiais e produtos
4. Ficha técnica
5. Custo de fabricação
6. Precificação
7. Estoque integrado
8. Pedidos integrados
9. Dashboard
10. Segurança e produção

Não desenvolva funcionalidades que dependam de estruturas ainda não definidas.

---

## 9. Formato da resposta ao final de cada tarefa

1. **Resumo** em português simples: o que foi feito.
2. **Arquivos alterados.**
3. **`git diff`** completo.
4. **Como testar** (passos no navegador ou comando).
5. **Pendências ou dúvidas**, se houver.

Depois disso, pare e aguarde.
