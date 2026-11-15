-- =====================================================================
-- Precifica+ | Ajustes de segurança do banco
-- Data: 14/11/2026
-- Executar no SQL Editor do Supabase, uma única vez.
--
-- 1. Visitante não logado (anon) perde o acesso às tabelas de negócio.
-- 2. Usuárias logadas ficam só com ler/criar/alterar/excluir
--    (sem TRUNCATE, TRIGGER e REFERENCES).
-- 3. Configurações globais (knowledge_settings, profit_levels): só leitura.
-- 4. Função de cadastro (handle_new_user) com search_path fixo.
-- 5. Remove a tabela test (vazia e sem uso). Se ela tiver alguma linha,
--    a migration inteira é cancelada.
--
-- Não altera RLS nem policies. O isolamento entre contas continua igual.
-- =====================================================================

begin;

-- 1. Visitante não logado: sem acesso
revoke all on table
  public.artisan_profile, public.knowledge_settings, public.material_brands,
  public.material_categories, public.material_colors, public.material_movements,
  public.material_subcategories, public.material_units, public.order_items,
  public.orders, public.profiles, public.profit_levels
from anon;

-- 2. Usuárias logadas: somente o necessário
revoke all on table
  public.artisan_profile, public.material_brands, public.material_categories,
  public.material_colors, public.material_movements, public.material_subcategories,
  public.material_units, public.order_items, public.orders, public.profiles
from authenticated;

grant select, insert, update, delete on table
  public.artisan_profile, public.material_brands, public.material_categories,
  public.material_colors, public.material_movements, public.material_subcategories,
  public.material_units, public.order_items, public.orders, public.profiles
to authenticated;

-- 3. Configurações globais: somente leitura
revoke all on table
  public.knowledge_settings, public.profit_levels
from authenticated;

grant select on table
  public.knowledge_settings, public.profit_levels
to authenticated;

-- 4. Função de cadastro com search_path fixo
alter function public.handle_new_user() set search_path = '';

-- 5. Remover a tabela test, somente se estiver vazia
do $$
begin
  if exists (select 1 from public.test) then
    raise exception 'A tabela test tem linhas. Migration cancelada.';
  end if;
end
$$;

drop table public.test;

commit;

-- ---------------------------------------------------------------------
-- Para desfazer os itens 1 a 3, use os grants registrados na referência
-- 20261114000000_baseline_referencia.sql (seção 6). Para o item 4:
--   alter function public.handle_new_user() reset search_path;
-- A tabela test não precisa ser recriada.
-- ---------------------------------------------------------------------
