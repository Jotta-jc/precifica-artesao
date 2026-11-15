-- =====================================================================
-- Precifica+ | Desempenho e limpeza das regras de acesso (RLS)
-- Data: 15/11/2026
-- Executar no SQL Editor do Supabase, uma única vez.
--
-- 1. user_id obrigatório em products e materials; ligação formal com
--    auth.users em products, material_movements e business_metrics.
-- 2. Índices nas colunas usadas pelas regras de acesso e pelas ligações.
-- 3. Todas as políticas reescritas:
--    - (select auth.uid()) no lugar de auth.uid(): o banco calcula a
--      usuária uma vez por consulta, e não uma vez por linha;
--    - papel authenticated no lugar de public;
--    - políticas duplicadas removidas (business_metrics e product_pricing);
--    - UPDATE com "with check" explícito.
--
-- NÃO muda quem vê o quê: cada usuária continua vendo só os próprios dados.
-- knowledge_settings e profit_levels (leitura global) não são alterados.
-- Tudo dentro de begin/commit: ou tudo é aplicado, ou nada.
-- Conferência antes (15/11/2026): nenhuma linha sem dona ou com dona
-- inexistente em products, materials, material_movements, business_metrics.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. user_id obrigatório e ligações com auth.users
-- ---------------------------------------------------------------------

alter table public.products  alter column user_id set not null;
alter table public.materials alter column user_id set not null;

alter table public.products
  add constraint products_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.material_movements
  add constraint material_movements_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.business_metrics
  add constraint business_metrics_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- ---------------------------------------------------------------------
-- 2. Índices
-- ---------------------------------------------------------------------

create index if not exists idx_artisan_profile_user        on public.artisan_profile (user_id);
create index if not exists idx_clientes_user               on public.clientes (user_id);
create index if not exists idx_materials_user              on public.materials (user_id);
create index if not exists idx_material_movements_user     on public.material_movements (user_id);
create index if not exists idx_material_movements_material on public.material_movements (material_id);
create index if not exists idx_orders_user                 on public.orders (user_id);
create index if not exists idx_orders_client               on public.orders (client_id);
create index if not exists idx_order_items_order           on public.order_items (order_id);
create index if not exists idx_order_items_product         on public.order_items (product_id);
create index if not exists idx_pricing_settings_user       on public.pricing_settings (user_id);
create index if not exists idx_product_materials_product   on public.product_materials (product_id);
create index if not exists idx_product_materials_material  on public.product_materials (material_id);
create index if not exists idx_product_pricing_user        on public.product_pricing (user_id);
create index if not exists idx_product_pricing_product     on public.product_pricing (product_id);
create index if not exists idx_products_user               on public.products (user_id);

-- ---------------------------------------------------------------------
-- 3. Políticas: remover as atuais (nomes da referência de 14/11/2026)
--    Sem "if exists" de propósito: se algum nome não existir, a
--    migration inteira é cancelada e nada muda.
-- ---------------------------------------------------------------------

drop policy artisan_profile_insert on public.artisan_profile;
drop policy artisan_profile_select on public.artisan_profile;
drop policy artisan_profile_update on public.artisan_profile;

drop policy "Users can manage own business metrics" on public.business_metrics;
drop policy "Users can insert own business metrics" on public.business_metrics;
drop policy "Users can view own business metrics"   on public.business_metrics;
drop policy "Users can update own business metrics" on public.business_metrics;

drop policy "Usuarios podem deletar seus clientes"    on public.clientes;
drop policy "Usuarios podem criar seus clientes"      on public.clientes;
drop policy "Usuarios podem visualizar seus clientes" on public.clientes;
drop policy "Usuarios podem atualizar seus clientes"  on public.clientes;

drop policy "Users manage own brands"        on public.material_brands;
drop policy "Users manage own categories"    on public.material_categories;
drop policy "Users manage own colors"        on public.material_colors;
drop policy "Users manage own subcategories" on public.material_subcategories;
drop policy "Users manage own units"         on public.material_units;

drop policy "Users can manage own movements" on public.material_movements;

drop policy materials_delete on public.materials;
drop policy materials_insert on public.materials;
drop policy materials_select on public.materials;
drop policy materials_update on public.materials;

drop policy "Users can manage own order items" on public.order_items;
drop policy "Users can manage own orders"      on public.orders;

drop policy "Users can delete own pricing settings" on public.pricing_settings;
drop policy "Users can insert own pricing settings" on public.pricing_settings;
drop policy "Users can view own pricing settings"   on public.pricing_settings;
drop policy "Users can update own pricing settings" on public.pricing_settings;

drop policy product_materials_delete on public.product_materials;
drop policy product_materials_insert on public.product_materials;
drop policy product_materials_select on public.product_materials;
drop policy product_materials_update on public.product_materials;

drop policy "Users can manage own pricing" on public.product_pricing;
drop policy "Users can insert pricing"     on public.product_pricing;
drop policy "Users can view pricing"       on public.product_pricing;

drop policy products_delete_own on public.products;
drop policy products_insert_own on public.products;
drop policy products_select_own on public.products;
drop policy products_update_own on public.products;

drop policy profiles_delete_own on public.profiles;
drop policy profiles_insert_own on public.profiles;
drop policy profiles_select_own on public.profiles;
drop policy profiles_update_own on public.profiles;

-- ---------------------------------------------------------------------
-- 4. Políticas novas (todas para authenticated)
-- ---------------------------------------------------------------------

-- artisan_profile (mesmas operações de antes: ler, criar, alterar)
create policy artisan_profile_select on public.artisan_profile
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy artisan_profile_insert on public.artisan_profile
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy artisan_profile_update on public.artisan_profile
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- business_metrics (uma política só, no lugar de quatro)
create policy business_metrics_own on public.business_metrics
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- clientes
create policy clientes_select on public.clientes
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy clientes_insert on public.clientes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy clientes_update on public.clientes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy clientes_delete on public.clientes
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- material_brands, material_categories, material_colors,
-- material_subcategories, material_units
create policy material_brands_own on public.material_brands
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy material_categories_own on public.material_categories
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy material_colors_own on public.material_colors
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy material_subcategories_own on public.material_subcategories
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy material_units_own on public.material_units
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- material_movements
create policy material_movements_own on public.material_movements
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- materials
create policy materials_select on public.materials
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy materials_insert on public.materials
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy materials_update on public.materials
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy materials_delete on public.materials
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- order_items (protegida pelo pedido)
create policy order_items_own on public.order_items
  for all to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = (select auth.uid())
  ));

-- orders
create policy orders_own on public.orders
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- pricing_settings
create policy pricing_settings_select on public.pricing_settings
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy pricing_settings_insert on public.pricing_settings
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy pricing_settings_update on public.pricing_settings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy pricing_settings_delete on public.pricing_settings
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- product_materials (protegida pelo produto)
create policy product_materials_select on public.product_materials
  for select to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_materials.product_id and p.user_id = (select auth.uid())
  ));
create policy product_materials_insert on public.product_materials
  for insert to authenticated
  with check (exists (
    select 1 from public.products p
    where p.id = product_materials.product_id and p.user_id = (select auth.uid())
  ));
create policy product_materials_update on public.product_materials
  for update to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_materials.product_id and p.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.products p
    where p.id = product_materials.product_id and p.user_id = (select auth.uid())
  ));
create policy product_materials_delete on public.product_materials
  for delete to authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_materials.product_id and p.user_id = (select auth.uid())
  ));

-- product_pricing (uma política só, no lugar de três)
create policy product_pricing_own on public.product_pricing
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- products
create policy products_select on public.products
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy products_insert on public.products
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy products_update on public.products
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy products_delete on public.products
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- profiles (a chave é o próprio id da usuária)
create policy profiles_select on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);
create policy profiles_update on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy profiles_delete on public.profiles
  for delete to authenticated
  using ((select auth.uid()) = id);

commit;

-- ---------------------------------------------------------------------
-- Resultado esperado: 39 políticas no schema public
-- (37 novas + 2 de leitura global em knowledge_settings e profit_levels).
-- Para desfazer: as políticas e ligações anteriores estão registradas em
-- 20261114000000_baseline_referencia.sql (seções 2 e 8).
-- ---------------------------------------------------------------------
