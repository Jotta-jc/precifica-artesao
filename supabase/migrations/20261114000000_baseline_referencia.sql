-- =====================================================================
-- Precifica+ | Migration de REFERÊNCIA (baseline) do schema public
-- Data da fotografia: 14/11/2026
--
-- ATENÇÃO: NÃO EXECUTE ESTE ARQUIVO NO BANCO ATUAL.
-- As tabelas já existem. Este arquivo apenas registra, no Git, como o
-- banco está hoje, para revisão e para recriar o banco do zero no
-- futuro (por exemplo, num ambiente de testes).
--
-- Origem: consultas de leitura feitas no SQL Editor do Supabase
-- (RLS, policies, permissões, colunas, chaves, índices, gatilhos e
-- funções). O estado foi registrado COMO ESTÁ, inclusive os problemas
-- conhecidos, marcados com "PROBLEMA CONHECIDO". Eles serão corrigidos
-- em migrations próprias.
--
-- Não inclui:
--   - dados (ex.: linhas de knowledge_settings e profit_levels, que são
--     configurações globais usadas pelas calculadoras);
--   - permissões do papel service_role;
--   - o corpo exato de set_updated_at (reconstruído; ver nota abaixo).
-- =====================================================================


-- =====================================================================
-- 1. TABELAS
-- =====================================================================

create table public.artisan_profile (
  id                      uuid not null default gen_random_uuid(),
  user_id                 uuid,
  nome_marca              text,
  instagram               text,
  anos_experiencia        integer default 0,
  possui_marca            boolean default false,
  instagram_profissional  boolean default false,
  trabalha_sob_encomenda  boolean default false,
  nivel_acabamento        text default 'medio'::text,
  exclusividade           text default 'baixa'::text,
  demanda                 text default 'baixa'::text,
  created_at              timestamp with time zone default now(),
  constraint artisan_profile_pkey primary key (id)
);

create table public.business_metrics (
  id                     bigint generated always as identity,
  user_id                uuid not null,
  nivel_demanda          integer not null default 1,
  nivel_marca            integer not null default 1,
  score_artesanal        numeric default 0,
  instagram_seguidores   integer default 0,
  tiktok_seguidores      integer default 0,
  created_at             timestamp with time zone default timezone('utc'::text, now()),
  updated_at             timestamp with time zone default timezone('utc'::text, now()),
  meta_faturamento       numeric default 10000,
  dias_trabalhados       integer default 22,
  horas_por_dia          numeric default 6,
  valor_hora             numeric default 0,
  margem_minima          numeric default 20,
  margem_ideal           numeric default 100,
  multiplicador_premium  numeric default 1.25,
  peso_marca             numeric default 1,
  peso_demanda           numeric default 1,
  peso_social            numeric default 1,
  nome_empresa           text,
  constraint business_metrics_pkey primary key (id),
  constraint business_metrics_user_id_key unique (user_id)
);

create table public.clientes (
  id            uuid not null default gen_random_uuid(),
  user_id       uuid not null,
  nome          text not null,
  telefone      text,
  email         text,
  instagram     text,
  tipo_cliente  text default 'cliente'::text,
  observacoes   text,
  created_at    timestamp with time zone default now(),
  updated_at    timestamp with time zone default now(),
  constraint clientes_pkey primary key (id),
  constraint clientes_tipo_cliente_check
    check (tipo_cliente = any (array['cliente'::text, 'revendedor'::text, 'parceiro'::text]))
);

create table public.knowledge_settings (
  id           bigint generated always as identity,
  category     text not null,
  label        text not null,
  description  text,
  points       integer not null,
  active       boolean not null default true,
  created_at   timestamp with time zone not null default now(),
  constraint knowledge_settings_pkey primary key (id)
);

create table public.material_brands (
  id          bigserial,
  user_id     uuid not null,
  nome        text not null,
  ativo       boolean not null default true,
  created_at  timestamp with time zone default now(),
  updated_at  timestamp with time zone default now(),
  constraint material_brands_pkey primary key (id)
);

create table public.material_categories (
  id          bigserial,
  user_id     uuid not null,
  nome        text not null,
  ativo       boolean not null default true,
  created_at  timestamp with time zone default now(),
  updated_at  timestamp with time zone default now(),
  constraint material_categories_pkey primary key (id)
);

create table public.material_colors (
  id          bigserial,
  user_id     uuid not null,
  nome        text not null,
  codigo_hex  text,
  ativo       boolean not null default true,
  created_at  timestamp with time zone default now(),
  updated_at  timestamp with time zone default now(),
  constraint material_colors_pkey primary key (id)
);

create table public.material_movements (
  id              bigserial,
  material_id     bigint not null,
  user_id         uuid not null,
  tipo            text not null,
  quantidade      numeric not null,
  valor_total     numeric,
  observacao      text,
  created_at      timestamp with time zone default now(),
  valor_unitario  numeric,
  constraint material_movements_pkey primary key (id),
  constraint material_movements_tipo_check
    check (tipo = any (array['entrada'::text, 'saida'::text, 'ajuste'::text]))
);

create table public.material_subcategories (
  id           bigserial,
  user_id      uuid not null,
  category_id  bigint not null,
  nome         text not null,
  ativo        boolean not null default true,
  created_at   timestamp with time zone default now(),
  updated_at   timestamp with time zone default now(),
  constraint material_subcategories_pkey primary key (id)
);

create table public.material_units (
  id          bigserial,
  user_id     uuid not null,
  nome        text not null,
  sigla       text not null,
  tipo        text not null,
  ativo       boolean not null default true,
  created_at  timestamp with time zone default now(),
  updated_at  timestamp with time zone default now(),
  constraint material_units_pkey primary key (id)
);

-- PROBLEMA CONHECIDO: colunas duplicadas (estoque x estoque_atual;
-- quantidade_por_unidade x quantity_per_package). Na prática, a coluna
-- de estoque oficial é estoque_atual. user_id aceita vazio.
create table public.materials (
  id                      bigint generated always as identity,
  user_id                 uuid,
  nome                    text not null,
  categoria               text,
  unidade                 text,
  preco                   numeric not null default 0,
  estoque                 numeric default 0,
  created_at              timestamp with time zone default now(),
  quantidade_comprada     numeric default 0,
  quantidade_por_unidade  numeric default 0,
  estoque_atual           numeric default 0,
  custo_unitario          numeric,
  category_id             bigint,
  subcategory_id          bigint,
  brand_id                bigint,
  color_id                bigint,
  purchase_unit_id        bigint,
  consumption_unit_id     bigint,
  quantity_per_package    numeric default 1,
  minimum_stock           numeric default 0,
  internal_code           text,
  barcode                 text,
  location                text,
  ativo                   boolean default true,
  constraint materials_pkey primary key (id)
);

create table public.order_items (
  id              bigint generated always as identity,
  order_id        bigint not null,
  product_id      bigint not null,
  quantidade      numeric not null default 1,
  valor_unitario  numeric not null default 0,
  valor_total     numeric not null default 0,
  created_at      timestamp with time zone default now(),
  constraint order_items_pkey primary key (id)
);

create table public.orders (
  id               bigint generated always as identity,
  user_id          uuid not null,
  client_id        uuid not null,
  status           text not null default 'orcamento'::text,
  valor_total      numeric not null default 0,
  observacao       text,
  created_at       timestamp with time zone default now(),
  estoque_baixado  boolean default false,
  constraint orders_pkey primary key (id)
);

-- Gravada pela tela "Configurações IA", mas não usada em nenhum cálculo.
create table public.pricing_settings (
  id                  bigint generated always as identity,
  user_id             uuid not null,
  demand_weight       numeric default 0.08,
  brand_weight        numeric default 0.12,
  social_weight       numeric default 0.03,
  premium_multiplier  numeric default 1.25,
  ai_multiplier       numeric default 1.15,
  labor_weight        numeric default 1.0,
  material_weight     numeric default 1.0,
  exclusivity_weight  numeric default 1.0,
  urgency_weight      numeric default 1.0,
  created_at          timestamp with time zone default now(),
  updated_at          timestamp with time zone default now(),
  constraint pricing_settings_pkey primary key (id)
);

-- Ficha técnica (em uso pelo código).
create table public.product_materials (
  id              bigint generated always as identity,
  product_id      bigint,
  material_id     bigint,
  quantidade      numeric not null default 0,
  created_at      timestamp with time zone default now(),
  custo_total     numeric,
  custo_unitario  numeric,
  unidade         text,
  constraint product_materials_pkey primary key (id)
);

-- PROBLEMA CONHECIDO: tabela sem uso no código, com colunas repetidas
-- em inglês e português.
create table public.product_pricing (
  id                   uuid not null default gen_random_uuid(),
  user_id              uuid not null,
  product_id           bigint not null,
  material_cost        numeric default 0,
  labor_cost           numeric default 0,
  packaging_cost       numeric default 0,
  extra_cost           numeric default 0,
  profit_margin        numeric default 0,
  suggested_price      numeric default 0,
  premium_price        numeric default 0,
  minimum_price        numeric default 0,
  final_price          numeric default 0,
  notes                text,
  created_at           timestamp with time zone default now(),
  updated_at           timestamp with time zone default now(),
  custo_materiais      numeric default 0,
  custo_embalagem      numeric default 0,
  custos_extras        numeric default 0,
  margem_lucro         numeric default 0,
  preco_minimo         numeric default 0,
  preco_ideal          numeric default 0,
  preco_premium        numeric default 0,
  tempo_producao       numeric default 0,
  custo_mao_obra       numeric default 0,
  pontuacao_total      integer,
  nivel_precificacao   numeric,
  margem_metodologia   numeric,
  fator_precificacao   numeric,
  preco_oficial        numeric,
  constraint product_pricing_pkey primary key (id)
);

-- PROBLEMA CONHECIDO: user_id aceita vazio e não tem chave estrangeira
-- para auth.users. "categoria" hoje recebe o id de material_categories.
create table public.products (
  id              bigint generated always as identity,
  nome            text not null,
  categoria       text,
  preco           numeric,
  created_at      timestamp with time zone default now(),
  tempo_producao  numeric default 0,
  valor_hora      numeric default 0,
  mao_obra        numeric default 0,
  preco_sugerido  numeric default 0,
  complexidade    numeric default 1,
  exclusividade   numeric default 1,
  nivel_tecnico   numeric default 1,
  user_id         uuid,
  embalagem       numeric default 0,
  custos_extras   numeric default 0,
  constraint products_pkey primary key (id)
);

create table public.profiles (
  id          uuid not null,
  email       text not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamp with time zone default now(),
  constraint profiles_pkey primary key (id)
);

create table public.profit_levels (
  id                 bigint generated always as identity,
  pontos_min         integer not null,
  pontos_max         integer not null,
  nivel              numeric not null,
  margem_percentual  numeric not null,
  fator              numeric not null,
  active             boolean not null default true,
  created_at         timestamp with time zone not null default now(),
  constraint profit_levels_pkey primary key (id),
  constraint profit_levels_range_check check (pontos_min <= pontos_max)
);

-- PROBLEMA CONHECIDO: tabela de teste, a remover.
create table public.test (
  id    bigint generated always as identity,
  name  text,
  constraint test_pkey primary key (id)
);


-- =====================================================================
-- 2. CHAVES ESTRANGEIRAS
-- =====================================================================

alter table public.artisan_profile
  add constraint artisan_profile_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.clientes
  add constraint clientes_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.material_brands
  add constraint material_brands_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.material_categories
  add constraint material_categories_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.material_colors
  add constraint material_colors_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- PROBLEMA CONHECIDO: apagar um material apaga o histórico de estoque.
alter table public.material_movements
  add constraint material_movements_material_id_fkey
  foreign key (material_id) references public.materials(id) on delete cascade;

alter table public.material_subcategories
  add constraint material_subcategories_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.material_subcategories
  add constraint material_subcategories_category_id_fkey
  foreign key (category_id) references public.material_categories(id) on delete cascade;

alter table public.material_units
  add constraint material_units_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.materials
  add constraint materials_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.materials
  add constraint materials_brand_id_fkey
  foreign key (brand_id) references public.material_brands(id);

alter table public.materials
  add constraint materials_category_id_fkey
  foreign key (category_id) references public.material_categories(id);

alter table public.materials
  add constraint materials_color_id_fkey
  foreign key (color_id) references public.material_colors(id);

alter table public.materials
  add constraint materials_consumption_unit_id_fkey
  foreign key (consumption_unit_id) references public.material_units(id);

alter table public.materials
  add constraint materials_purchase_unit_id_fkey
  foreign key (purchase_unit_id) references public.material_units(id);

alter table public.materials
  add constraint materials_subcategory_id_fkey
  foreign key (subcategory_id) references public.material_subcategories(id);

-- PROBLEMA CONHECIDO: apagar um produto apaga itens de pedidos já vendidos.
alter table public.order_items
  add constraint order_items_product_id_fkey
  foreign key (product_id) references public.products(id) on delete cascade;

alter table public.order_items
  add constraint order_items_order_id_fkey
  foreign key (order_id) references public.orders(id) on delete cascade;

-- PROBLEMA CONHECIDO: apagar um cliente apaga todos os pedidos dele.
alter table public.orders
  add constraint orders_client_id_fkey
  foreign key (client_id) references public.clientes(id) on delete cascade;

-- PROBLEMA CONHECIDO: sem "on delete cascade"; trava a exclusão de conta.
alter table public.orders
  add constraint orders_user_id_fkey
  foreign key (user_id) references auth.users(id);

alter table public.pricing_settings
  add constraint pricing_settings_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.product_materials
  add constraint product_materials_product_id_fkey
  foreign key (product_id) references public.products(id) on delete cascade;

-- PROBLEMA CONHECIDO: apagar um material o retira das fichas técnicas.
alter table public.product_materials
  add constraint product_materials_material_id_fkey
  foreign key (material_id) references public.materials(id) on delete cascade;

alter table public.product_pricing
  add constraint product_pricing_product_id_fkey
  foreign key (product_id) references public.products(id) on delete cascade;

alter table public.product_pricing
  add constraint product_pricing_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;


-- =====================================================================
-- 3. ÍNDICES (além das chaves primárias e únicas, criadas acima)
-- =====================================================================

create index idx_material_brands_user          on public.material_brands using btree (user_id);
create index idx_material_categories_user      on public.material_categories using btree (user_id);
create index idx_material_colors_user          on public.material_colors using btree (user_id);
create index idx_material_subcategories_category on public.material_subcategories using btree (category_id);
create index idx_material_subcategories_user   on public.material_subcategories using btree (user_id);
create index idx_material_units_user           on public.material_units using btree (user_id);
create index idx_materials_brand               on public.materials using btree (brand_id);
create index idx_materials_category            on public.materials using btree (category_id);
create index idx_materials_color               on public.materials using btree (color_id);
create index idx_materials_subcategory         on public.materials using btree (subcategory_id);


-- =====================================================================
-- 4. FUNÇÕES
-- =====================================================================

-- NOTA: o corpo desta função foi reconstruído no formato padrão (não foi
-- lido do banco). Conferir com:
--   select pg_get_functiondef('public.set_updated_at'::regproc);
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- Corpo lido do banco em 14/11/2026.
-- PROBLEMA CONHECIDO (risco baixo): security definer sem "set search_path".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
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

  return new;

end;
$function$;


-- =====================================================================
-- 5. GATILHOS
-- =====================================================================

create trigger handle_updated_at_material_brands
  before update on public.material_brands
  for each row execute function public.set_updated_at();

create trigger handle_updated_at_material_categories
  before update on public.material_categories
  for each row execute function public.set_updated_at();

create trigger handle_updated_at_material_colors
  before update on public.material_colors
  for each row execute function public.set_updated_at();

create trigger handle_updated_at_material_subcategories
  before update on public.material_subcategories
  for each row execute function public.set_updated_at();

create trigger handle_updated_at_material_units
  before update on public.material_units
  for each row execute function public.set_updated_at();

-- Cria o perfil quando uma nova usuária entra pela primeira vez.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =====================================================================
-- 6. PERMISSÕES (papéis anon e authenticated)
-- =====================================================================
-- O Supabase concede tudo a anon e authenticated por padrão em tabelas
-- novas. Para reproduzir o estado exato, primeiro tudo é revogado e
-- depois concedido como estava em 14/11/2026.

revoke all on table
  public.artisan_profile, public.business_metrics, public.clientes,
  public.knowledge_settings, public.material_brands, public.material_categories,
  public.material_colors, public.material_movements, public.material_subcategories,
  public.material_units, public.materials, public.order_items, public.orders,
  public.pricing_settings, public.product_materials, public.product_pricing,
  public.products, public.profiles, public.profit_levels, public.test
from anon, authenticated;

-- Tabelas que já seguem o padrão do projeto (só authenticated, sem anon).
grant select, insert, update, delete on table
  public.business_metrics, public.clientes, public.materials,
  public.pricing_settings, public.product_materials, public.product_pricing,
  public.products
to authenticated;

-- PROBLEMA CONHECIDO: permissão total (inclui TRUNCATE) para anon e
-- authenticated. O RLS barra as linhas, mas não controla TRUNCATE.
grant all on table
  public.artisan_profile, public.knowledge_settings, public.material_brands,
  public.material_categories, public.material_colors, public.material_movements,
  public.material_subcategories, public.material_units, public.order_items,
  public.orders, public.profiles, public.profit_levels, public.test
to anon, authenticated;


-- =====================================================================
-- 7. ROW LEVEL SECURITY (ativo em todas as tabelas)
-- =====================================================================

alter table public.artisan_profile        enable row level security;
alter table public.business_metrics       enable row level security;
alter table public.clientes               enable row level security;
alter table public.knowledge_settings     enable row level security;
alter table public.material_brands        enable row level security;
alter table public.material_categories    enable row level security;
alter table public.material_colors        enable row level security;
alter table public.material_movements     enable row level security;
alter table public.material_subcategories enable row level security;
alter table public.material_units         enable row level security;
alter table public.materials              enable row level security;
alter table public.order_items            enable row level security;
alter table public.orders                 enable row level security;
alter table public.pricing_settings       enable row level security;
alter table public.product_materials      enable row level security;
alter table public.product_pricing        enable row level security;
alter table public.products               enable row level security;
alter table public.profiles               enable row level security;
alter table public.profit_levels          enable row level security;
alter table public.test                   enable row level security;


-- =====================================================================
-- 8. POLICIES
-- =====================================================================

-- artisan_profile
create policy artisan_profile_insert on public.artisan_profile
  for insert to public
  with check (auth.uid() = user_id);

create policy artisan_profile_select on public.artisan_profile
  for select to public
  using (auth.uid() = user_id);

create policy artisan_profile_update on public.artisan_profile
  for update to public
  using (auth.uid() = user_id);

-- business_metrics
-- PROBLEMA CONHECIDO: policies duplicadas (a "manage" já cobre as demais).
create policy "Users can manage own business metrics" on public.business_metrics
  for all to public
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can insert own business metrics" on public.business_metrics
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view own business metrics" on public.business_metrics
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own business metrics" on public.business_metrics
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- clientes
create policy "Usuarios podem deletar seus clientes" on public.clientes
  for delete to authenticated
  using (auth.uid() = user_id);

create policy "Usuarios podem criar seus clientes" on public.clientes
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Usuarios podem visualizar seus clientes" on public.clientes
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Usuarios podem atualizar seus clientes" on public.clientes
  for update to authenticated
  using (auth.uid() = user_id);

-- knowledge_settings (configuração global, somente leitura)
create policy authenticated_can_read_knowledge_settings on public.knowledge_settings
  for select to authenticated
  using (true);

-- material_brands
create policy "Users manage own brands" on public.material_brands
  for all to public
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- material_categories
create policy "Users manage own categories" on public.material_categories
  for all to public
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- material_colors
create policy "Users manage own colors" on public.material_colors
  for all to public
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- material_movements
create policy "Users can manage own movements" on public.material_movements
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- material_subcategories
create policy "Users manage own subcategories" on public.material_subcategories
  for all to public
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- material_units
create policy "Users manage own units" on public.material_units
  for all to public
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- materials
create policy materials_delete on public.materials
  for delete to public
  using (auth.uid() = user_id);

create policy materials_insert on public.materials
  for insert to public
  with check (auth.uid() = user_id);

create policy materials_select on public.materials
  for select to public
  using (auth.uid() = user_id);

create policy materials_update on public.materials
  for update to public
  using (auth.uid() = user_id);

-- order_items (protegida pelo pedido)
create policy "Users can manage own order items" on public.order_items
  for all to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));

-- orders
create policy "Users can manage own orders" on public.orders
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- pricing_settings
create policy "Users can delete own pricing settings" on public.pricing_settings
  for delete to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own pricing settings" on public.pricing_settings
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view own pricing settings" on public.pricing_settings
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own pricing settings" on public.pricing_settings
  for update to authenticated
  using (auth.uid() = user_id);

-- product_materials (protegida pelo produto)
create policy product_materials_delete on public.product_materials
  for delete to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_materials.product_id and p.user_id = auth.uid()
  ));

create policy product_materials_insert on public.product_materials
  for insert to authenticated
  with check (exists (
    select 1 from public.products p
    where p.id = product_materials.product_id and p.user_id = auth.uid()
  ));

create policy product_materials_select on public.product_materials
  for select to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_materials.product_id and p.user_id = auth.uid()
  ));

create policy product_materials_update on public.product_materials
  for update to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_materials.product_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.products p
    where p.id = product_materials.product_id and p.user_id = auth.uid()
  ));

-- product_pricing
-- PROBLEMA CONHECIDO: policies duplicadas (a "manage" já cobre as demais).
create policy "Users can manage own pricing" on public.product_pricing
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can insert pricing" on public.product_pricing
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view pricing" on public.product_pricing
  for select to authenticated
  using (auth.uid() = user_id);

-- products
create policy products_delete_own on public.products
  for delete to authenticated
  using (user_id = auth.uid());

create policy products_insert_own on public.products
  for insert to authenticated
  with check (user_id = auth.uid());

create policy products_select_own on public.products
  for select to authenticated
  using (user_id = auth.uid());

create policy products_update_own on public.products
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- profiles
create policy profiles_delete_own on public.profiles
  for delete to authenticated
  using (auth.uid() = id);

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- profit_levels (configuração global, somente leitura)
create policy authenticated_can_read_profit_levels on public.profit_levels
  for select to authenticated
  using (true);

-- test: RLS ativo e nenhuma policy (ninguém acessa pela API).

-- FIM DA REFERÊNCIA
