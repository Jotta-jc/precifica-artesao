-- =====================================================================
-- Precifica+ | Jornada 2 — base de dados dos produtos e do preço
-- Data: 18/11/2026
-- Executar no SQL Editor do Supabase, uma única vez.
--
-- Metodologia de preço aprovada em 18/11/2026 (CLAUDE.md, "Jornada 2").
--
-- O que este arquivo faz:
--  A. Tabela product_categories (categoria própria de PRODUTO, separada da
--     categoria de material), com RLS e permissões só para usuárias logadas.
--  B. Função com a lista padrão de categorias de produto.
--  C. Cadastro de conta nova (handle_new_user) passa a criar também as
--     categorias de produto e a linha de configurações (business_metrics).
--  D. Contas que já existem: as mesmas categorias e a linha de configurações.
--  E. products: categoria_id, tipo (físico ou aula), nível de complexidade e
--     de exclusividade, convertidos a partir das colunas antigas.
--  F. business_metrics: custos fixos, taxas de venda, margens em FRAÇÃO
--     (0.20 = 20%) e nível/fator da marca.
--
-- NÃO apaga nenhuma coluna. As colunas antigas (products.categoria,
-- complexidade, exclusividade; business_metrics.nivel_marca) continuam,
-- por compatibilidade com as telas atuais.
-- A estrutura (tabela, colunas, regras, políticas) pode ser rodada de novo
-- sem erro. As CONVERSÕES de dados (E e F) foram pensadas para rodar uma
-- vez: rodar de novo recalcula os níveis e as margens a partir das colunas
-- antigas e desfaz alterações feitas depois pelas telas.
-- Tudo dentro de begin/commit: ou tudo é aplicado, ou nada.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- A. Categorias de produto
-- ---------------------------------------------------------------------

create table if not exists public.product_categories (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid()
              references auth.users(id) on delete cascade,
  nome        text not null,
  created_at  timestamptz default now(),
  constraint product_categories_nome_nao_vazio check (trim(nome) <> ''),
  -- Necessária para a ligação composta products(user_id, categoria_id):
  -- garante que o produto só aponta para categoria da própria dona.
  constraint product_categories_user_id_id_unico unique (user_id, id)
);

-- Impede categorias repetidas na mesma conta ("Bolsas" e "bolsas").
-- Também serve de índice em user_id (primeira coluna) para as políticas.
create unique index if not exists product_categories_user_nome_unico
  on public.product_categories (user_id, lower(nome));

alter table public.product_categories enable row level security;

drop policy if exists product_categories_select on public.product_categories;
drop policy if exists product_categories_insert on public.product_categories;
drop policy if exists product_categories_update on public.product_categories;
drop policy if exists product_categories_delete on public.product_categories;

create policy product_categories_select on public.product_categories
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy product_categories_insert on public.product_categories
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy product_categories_update on public.product_categories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy product_categories_delete on public.product_categories
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Visitante sem acesso; usuária logada só com ler/criar/alterar/excluir.
revoke all on table public.product_categories from anon, authenticated;
grant select, insert, update, delete on table public.product_categories to authenticated;
grant all on table public.product_categories to service_role;

-- ---------------------------------------------------------------------
-- B. Lista padrão de categorias de produto
-- ---------------------------------------------------------------------

create or replace function public.criar_categorias_produto_padrao(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.product_categories (user_id, nome)
  select p_user_id, padrao.nome
  from (values
    ('Acessórios'), ('Bolsas'), ('Cachepôs'), ('Carteiras'),
    ('Decoração'), ('Outros'), ('Tapetes')
  ) as padrao(nome)
  on conflict do nothing;  -- a que já existir (mesmo nome) é ignorada
end;
$function$;

-- Só o banco (gatilho e esta migration) chama a função.
revoke all on function public.criar_categorias_produto_padrao(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- C. Cadastro de conta nova
-- ---------------------------------------------------------------------
-- Mesmo corpo da Jornada 1 (20261117000000) + categorias de produto +
-- linha de configurações em business_metrics.
-- business_metrics: a única coluna obrigatória sem padrão é user_id
-- (nivel_demanda e nivel_marca têm padrão 1), então o insert abaixo basta.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin

  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  perform public.criar_categorias_padrao(new.id);

  perform public.criar_categorias_produto_padrao(new.id);

  insert into public.business_metrics (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;

end;
$function$;

-- ---------------------------------------------------------------------
-- D. Contas que já existem
-- ---------------------------------------------------------------------

do $$
declare
  conta record;
begin
  for conta in select id from auth.users loop
    perform public.criar_categorias_produto_padrao(conta.id);
  end loop;
end
$$;

insert into public.business_metrics (user_id)
select u.id from auth.users u
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------
-- E. Produtos: categoria própria, tipo e níveis da metodologia
-- ---------------------------------------------------------------------

alter table public.products
  add column if not exists categoria_id bigint,
  add column if not exists tipo text not null default 'fisico',
  add column if not exists nivel_complexidade text not null default 'simples',
  add column if not exists nivel_exclusividade text not null default 'regular';

alter table public.products
  drop constraint if exists products_tipo_valido,
  add constraint products_tipo_valido
    check (tipo in ('fisico', 'aula')),
  drop constraint if exists products_nivel_complexidade_valido,
  add constraint products_nivel_complexidade_valido
    check (nivel_complexidade in ('simples', 'media', 'dificil', 'autor')),
  drop constraint if exists products_nivel_exclusividade_valido,
  add constraint products_nivel_exclusividade_valido
    check (nivel_exclusividade in ('regular', 'encomenda', 'limitada', 'unica'));

-- Ligação composta: a categoria precisa ser da mesma dona do produto.
-- Ao excluir a categoria, só categoria_id vira vazio (user_id fica).
alter table public.products
  drop constraint if exists products_categoria_id_fkey,
  add constraint products_categoria_id_fkey
    foreign key (user_id, categoria_id)
    references public.product_categories (user_id, id)
    on delete set null (categoria_id);

create index if not exists idx_products_user_categoria
  on public.products (user_id, categoria_id);

-- Níveis a partir das colunas antigas (1 a 4); outro valor → padrão.
update public.products
set nivel_complexidade = case complexidade
      when 1 then 'simples'
      when 2 then 'media'
      when 3 then 'dificil'
      when 4 then 'autor'
      else 'simples'
    end,
    nivel_exclusividade = case exclusividade
      when 1 then 'regular'
      when 2 then 'encomenda'
      when 3 then 'limitada'
      when 4 then 'unica'
      else 'regular'
    end;

-- Categoria: "Bolsas", "Bolsas em Náutico" e "Bolsa pequena" → Bolsas;
-- qualquer outro texto (ou vazio) → Outros. Sempre da mesma dona.
update public.products p
set categoria_id = (
  select c.id
  from public.product_categories c
  where c.user_id = p.user_id
    and c.nome = case
      when lower(trim(coalesce(p.categoria, '')))
           in ('bolsas', 'bolsas em náutico', 'bolsas em nautico', 'bolsa pequena')
        then 'Bolsas'
      else 'Outros'
    end
)
where p.categoria_id is null;

-- ---------------------------------------------------------------------
-- F. Configurações de preço do ateliê (business_metrics)
-- ---------------------------------------------------------------------

alter table public.business_metrics
  add column if not exists custos_fixos_mensais numeric not null default 0,
  add column if not exists taxas_venda numeric not null default 0.15,
  add column if not exists marca_nivel text not null default 'comecando',
  add column if not exists marca_fator numeric not null default 1;

-- Margens passam a ser FRAÇÃO do preço de venda (0.20 = 20%).
-- Antes eram 20 e 100 e nenhuma tela usava esses valores.
update public.business_metrics
set margem_minima = 0.20,
    margem_ideal  = 0.30;

alter table public.business_metrics
  alter column margem_minima set default 0.20,
  alter column margem_ideal  set default 0.30;

-- Marca a partir do nível antigo (1 a 4); outro valor → Começando, ×1.
update public.business_metrics
set marca_nivel = case nivel_marca
      when 1 then 'comecando'
      when 2 then 'regional'
      when 3 then 'reconhecida'
      when 4 then 'referencia'
      else 'comecando'
    end,
    marca_fator = case nivel_marca
      when 1 then 1
      when 2 then 1.2
      when 3 then 1.5
      when 4 then 2
      else 1
    end;

alter table public.business_metrics
  drop constraint if exists business_metrics_custos_fixos_nao_negativo,
  add constraint business_metrics_custos_fixos_nao_negativo
    check (custos_fixos_mensais >= 0),
  drop constraint if exists business_metrics_taxas_venda_nao_negativa,
  add constraint business_metrics_taxas_venda_nao_negativa
    check (taxas_venda >= 0),
  drop constraint if exists business_metrics_margem_minima_nao_negativa,
  add constraint business_metrics_margem_minima_nao_negativa
    check (margem_minima >= 0),
  drop constraint if exists business_metrics_margens_em_ordem,
  add constraint business_metrics_margens_em_ordem
    check (margem_minima <= margem_ideal),
  drop constraint if exists business_metrics_taxas_margem_abaixo_de_100,
  add constraint business_metrics_taxas_margem_abaixo_de_100
    check (taxas_venda + margem_ideal < 1),
  drop constraint if exists business_metrics_marca_nivel_valido,
  add constraint business_metrics_marca_nivel_valido
    check (marca_nivel in ('comecando', 'regional', 'reconhecida', 'referencia')),
  drop constraint if exists business_metrics_marca_fator_positivo,
  add constraint business_metrics_marca_fator_positivo
    check (marca_fator > 0);

commit;

-- ---------------------------------------------------------------------
-- G. Conferência (rodar depois, separadamente; só leitura)
--
-- 1) Categorias de produto por conta (esperado: 7 em cada uma das 4):
-- select left(user_id::text, 8) as dona, count(*) as categorias
-- from public.product_categories group by user_id order by dona;
--
-- 2) Produtos com a categoria nova e os níveis convertidos:
-- select p.id, p.nome, p.categoria as categoria_antiga, c.nome as categoria_nova,
--        p.complexidade, p.nivel_complexidade,
--        p.exclusividade, p.nivel_exclusividade, p.tipo
-- from public.products p
-- left join public.product_categories c on c.id = p.categoria_id
-- order by p.user_id, p.id;
--
-- 3) Configurações das 4 contas com os campos novos (esperado: 4 linhas):
-- select left(user_id::text, 8) as dona, nome_empresa,
--        custos_fixos_mensais, taxas_venda, margem_minima, margem_ideal,
--        nivel_marca, marca_nivel, marca_fator
-- from public.business_metrics order by dona;
--
-- 4) Políticas de product_categories (esperado: 4, todas para authenticated):
-- select policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'product_categories'
-- order by policyname;
-- ---------------------------------------------------------------------
