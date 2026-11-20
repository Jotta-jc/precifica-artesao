-- =====================================================================
-- Precifica+ | Jornada 3, Etapa V1 — dados da vitrine pública
-- Data: 20/11/2026
-- Executar no SQL Editor do Supabase, uma única vez (pode ser rodada de
-- novo sem erro). Depois, rode o SQL de conferência (só leitura).
--
-- O que este arquivo faz (decisões L1–L11):
--  1. Tabela vitrines: uma por conta, com o endereço público (/v/<endereco>),
--     se está publicada, WhatsApp, Instagram e um texto "sobre". Nasce
--     escondida e só pode ser publicada com WhatsApp. É criada quando a
--     artesã salva pela primeira vez (handle_new_user NÃO muda).
--  2. products: descrição, publicado, mostrar preço e prazo (pronta entrega
--     ou sob encomenda, com dias opcionais). O produto só aparece na vitrine
--     se estiver ativo, publicado e com a vitrine publicada (regra da futura
--     função pública, etapa V4). Fotos e logo ficam para a etapa V6.
--  3. Proteção (L11): tabelas, sequências e funções criadas daqui em diante
--     NÃO nascem com acesso do visitante (anon); funções novas também não
--     nascem com execute para PUBLIC (regra global) — toda função nova
--     precisa de "grant execute" explícito para authenticated (ou anon, só
--     na função da vitrine). As funções que já existem não mudam. As
--     funções de gatilho handle_new_user e set_updated_at deixam de poder
--     ser chamadas diretamente.
--
-- O visitante (anon) continua SEM acesso a nenhuma tabela. A vitrine vai
-- ler apenas por uma função própria, desenhada na etapa V4.
--
-- Rodar de novo: vitrines usa "create table if not exists" — se ela já
-- existir, colunas e restrições de dentro do create table NÃO são refeitas.
-- As colunas de products usam "add column if not exists"; as restrições de
-- products, as políticas e as permissões são refeitas sempre.
--
-- Tudo dentro de begin/commit: ou tudo é aplicado, ou nada.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Tabela vitrines
-- ---------------------------------------------------------------------

create table if not exists public.vitrines (
  id          bigint generated always as identity primary key,
  -- Uma vitrine por conta. O índice desta regra serve às políticas.
  user_id     uuid not null unique default auth.uid()
              references auth.users(id) on delete cascade,
  -- Endereço público: /v/<endereco>. Só minúsculas, números e hífens.
  endereco    text not null unique,
  publicada   boolean not null default false,
  -- Só dígitos, com DDD (e código do país, se vier): 10 a 13 dígitos.
  whatsapp    text,
  -- Usuário do Instagram, sem "@".
  instagram   text,
  sobre       text,
  created_at  timestamptz not null default now(),
  -- Preenchido pelo service a cada gravação (sem gatilho).
  updated_at  timestamptz not null default now(),

  constraint vitrines_endereco_tamanho
    check (char_length(endereco) between 3 and 40),
  constraint vitrines_endereco_formato
    check (endereco ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint vitrines_whatsapp_formato
    check (whatsapp is null or whatsapp ~ '^[0-9]{10,13}$'),
  constraint vitrines_instagram_formato
    check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  constraint vitrines_sobre_tamanho
    check (sobre is null or char_length(sobre) <= 500),
  -- Publicar exige WhatsApp (é o contato da cliente com a artesã).
  constraint vitrines_publicada_com_whatsapp
    check (not publicada or whatsapp is not null)
);

alter table public.vitrines enable row level security;

-- Sem política de exclusão: nenhuma tela apaga a vitrine (ela pode só
-- ser escondida). Ao excluir a conta, a linha some pelo on delete cascade.
drop policy if exists vitrines_select on public.vitrines;
drop policy if exists vitrines_insert on public.vitrines;
drop policy if exists vitrines_update on public.vitrines;

create policy vitrines_select on public.vitrines
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy vitrines_insert on public.vitrines
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy vitrines_update on public.vitrines
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Visitante sem acesso; usuária logada só com ler, criar e alterar.
-- A coluna id é "identity": não precisa de permissão na sequência.
revoke all on table public.vitrines from anon, authenticated;
grant select, insert, update on table public.vitrines to authenticated;
grant all on table public.vitrines to service_role;

-- ---------------------------------------------------------------------
-- 2. Produtos: dados para a vitrine
-- ---------------------------------------------------------------------
-- Os produtos que já existem ficam: sem descrição, NÃO publicados,
-- mostrando o preço e com "pronta entrega".

alter table public.products
  add column if not exists descricao text,
  add column if not exists publicado boolean not null default false,
  add column if not exists mostrar_preco boolean not null default true,
  add column if not exists prazo text not null default 'pronta_entrega',
  add column if not exists prazo_dias integer;

alter table public.products
  drop constraint if exists products_descricao_tamanho,
  add constraint products_descricao_tamanho
    check (descricao is null or char_length(descricao) <= 1000),
  drop constraint if exists products_prazo_valido,
  add constraint products_prazo_valido
    check (prazo in ('pronta_entrega', 'sob_encomenda')),
  drop constraint if exists products_prazo_dias_intervalo,
  add constraint products_prazo_dias_intervalo
    check (prazo_dias is null or prazo_dias between 1 and 365),
  -- Dias só fazem sentido para "sob encomenda".
  drop constraint if exists products_prazo_dias_so_encomenda,
  add constraint products_prazo_dias_so_encomenda
    check (prazo_dias is null or prazo = 'sob_encomenda');

-- ---------------------------------------------------------------------
-- 3. Proteção (L11)
-- ---------------------------------------------------------------------
-- a) Objetos FUTUROS criados pelo papel postgres (o do SQL Editor) no
--    esquema public não nascem com acesso do anon. Não muda nada do que
--    já existe; cada migration continua com o seu revoke explícito.
alter default privileges for role postgres in schema public
  revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon;
alter default privileges for role postgres in schema public
  revoke all on functions from anon;

-- Forma GLOBAL (sem "in schema"): o EXECUTE de PUBLIC em funções novas é
-- um padrão GLOBAL do Postgres, e regras por esquema só somam ao global —
-- por isso a regra acima não basta para fechá-lo. A partir de agora, toda
-- função nova criada pelo postgres nasce SEM execute para ninguém além do
-- dono: cada migration precisa de "grant execute ... to authenticated"
-- explícito (ou "to anon", só na função pública da vitrine).
alter default privileges for role postgres
  revoke execute on functions from public;

-- b) Funções de gatilho: ninguém precisa chamá-las diretamente.
--    Os gatilhos continuam funcionando: a permissão de executar a função
--    só é conferida quando o gatilho é CRIADO, não a cada disparo.
--    handle_new_user: gatilho on_auth_user_created (auth.users).
--    set_updated_at: gatilhos handle_updated_at_material_* (5 tabelas).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

commit;
