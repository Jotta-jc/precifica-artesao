-- =====================================================================
-- Precifica+ | Jornada 2, Etapa 9 — limpeza do banco
-- Data: 19/11/2026
-- Executar no SQL Editor do Supabase, uma única vez (pode ser rodada de
-- novo sem erro). ANTES de executar, rode as conferências do bloco
-- "Antes de executar" (só leitura), no fim deste arquivo.
--
-- O que este arquivo faz (decisão I1):
--  1. Apaga 5 tabelas que nenhuma tela usa mais (levantamento do PASSO 159:
--     nenhuma citação no código; nenhuma outra tabela aponta para elas;
--     handle_new_user não grava nelas):
--       product_pricing, pricing_settings, artisan_profile,
--       knowledge_settings, profit_levels.
--     O "drop table" apaga junto as policies (RLS), os índices, as
--     restrições e as permissões de cada tabela.
--     SEM "cascade" de propósito: se aparecer alguma dependência que não
--     conhecemos (uma view, por exemplo), o banco recusa e a migration
--     inteira é cancelada, sem apagar nada.
--  2. Valida a restrição product_materials_quantidade_positiva (criada
--     NOT VALID em 18/11): a partir daqui o banco confere também as linhas
--     antigas da ficha técnica. Se existir item com quantidade 0 ou
--     negativa, a migration inteira é cancelada.
--
-- ATENÇÃO: apagar tabela não tem volta. Os dados dessas 5 tabelas somem.
-- Se quiser guardar alguma coisa, exporte antes (Table Editor → Export).
--
-- Tudo dentro de begin/commit: ou tudo é aplicado, ou nada.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Tabelas sem uso
-- ---------------------------------------------------------------------

-- Ligada a products e a auth.users (as ligações saem junto com ela).
drop table if exists public.product_pricing;

-- Gravada só pela tela antiga /configuracoes (desligada na Etapa 8).
drop table if exists public.pricing_settings;

-- Perfil antigo do ateliê; nunca foi usado pelo código atual.
drop table if exists public.artisan_profile;

-- Configurações globais das calculadoras antigas (desligadas na Etapa 8).
drop table if exists public.knowledge_settings;
drop table if exists public.profit_levels;

-- ---------------------------------------------------------------------
-- 2. Ficha técnica: quantidade maior que zero também nas linhas antigas
-- ---------------------------------------------------------------------
-- Só valida se a restrição existir e ainda não estiver validada (para
-- poder rodar o arquivo de novo sem erro).

do $$
begin
  if exists (
    select 1
      from pg_constraint
     where conrelid = 'public.product_materials'::regclass
       and conname = 'product_materials_quantidade_positiva'
       and not convalidated
  ) then
    alter table public.product_materials
      validate constraint product_materials_quantidade_positiva;
  end if;
end;
$$;

commit;

-- ---------------------------------------------------------------------
-- Antes de executar (só leitura; rode cada consulta separadamente):
--
-- a) Quantas linhas cada tabela tem (para saber o que vai sumir):
-- select 'product_pricing' as tabela, count(*) from public.product_pricing
-- union all select 'pricing_settings', count(*) from public.pricing_settings
-- union all select 'artisan_profile', count(*) from public.artisan_profile
-- union all select 'knowledge_settings', count(*) from public.knowledge_settings
-- union all select 'profit_levels', count(*) from public.profit_levels;
--
-- b) Views que usam alguma dessas tabelas (esperado: nenhuma linha):
-- select view_schema, view_name, table_name
-- from information_schema.view_table_usage
-- where table_schema = 'public'
--   and table_name in ('product_pricing', 'pricing_settings', 'artisan_profile',
--                      'knowledge_settings', 'profit_levels');
--
-- c) Funções que citam essas tabelas (esperado: nenhuma linha):
-- select p.proname
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and (p.prosrc ilike '%product_pricing%' or p.prosrc ilike '%pricing_settings%'
--        or p.prosrc ilike '%artisan_profile%' or p.prosrc ilike '%knowledge_settings%'
--        or p.prosrc ilike '%profit_levels%');
--
-- d) Itens da ficha com quantidade 0 ou negativa (esperado: 0; se não for,
--    corrija esses itens antes, senão a validação cancela a migration):
-- select count(*) from public.product_materials where quantidade <= 0;
--
-- ---------------------------------------------------------------------
-- Depois de executar (só leitura):
--
-- e) As 5 tabelas não existem mais (esperado: nenhuma linha):
-- select table_name
-- from information_schema.tables
-- where table_schema = 'public'
--   and table_name in ('product_pricing', 'pricing_settings', 'artisan_profile',
--                      'knowledge_settings', 'profit_levels');
--
-- f) A restrição da ficha está validada (esperado: convalidated = true):
-- select conname, convalidated
-- from pg_constraint
-- where conrelid = 'public.product_materials'::regclass
--   and conname = 'product_materials_quantidade_positiva';
-- ---------------------------------------------------------------------
