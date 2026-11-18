-- =====================================================================
-- Precifica+ | Jornada 2 — ficha técnica protegida e arquivar produto
-- Data: 18/11/2026
-- Executar no SQL Editor do Supabase, uma única vez.
-- Antes de executar, rode as 3 consultas de conferência (só leitura)
-- entregues junto com esta migration.
--
-- O que este arquivo faz:
--  1. products.ativo: permite ARQUIVAR produto (produto vendido não pode
--     ser excluído). Os produtos que já existem ficam ativos.
--  2. Ficha técnica (product_materials) protegida por um gatilho: o
--     material precisa ser da MESMA conta do produto. Hoje o RLS da ficha
--     só confere o produto; a ligação com o material é checada pelo banco
--     sem RLS, então seria possível gravar o material de outra conta.
--     Erro devolvido: código FT001 (a tela traduz para português simples).
--  3. Sem material repetido na mesma ficha.
--  4. Quantidade da ficha maior que zero (só para linhas novas ou
--     alteradas; as antigas não são conferidas — ver NOT VALID abaixo).
--
-- Não apaga nem altera nenhum dado. Tudo dentro de begin/commit:
-- ou tudo é aplicado, ou nada.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Arquivar produto
-- ---------------------------------------------------------------------

alter table public.products
  add column if not exists ativo boolean not null default true;

-- ---------------------------------------------------------------------
-- 2. Ficha técnica: material da mesma conta do produto
-- ---------------------------------------------------------------------

-- security definer + search_path vazio + nomes completos: a função lê
-- products e materials com as permissões do dono da função, sem depender
-- do RLS da usuária. Assim ela compara as donas de verdade.
create or replace function public.conferir_dona_material_ficha()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_dona_produto  uuid;
  v_dona_material uuid;
begin
  select p.user_id into v_dona_produto
    from public.products p
   where p.id = new.product_id;

  select m.user_id into v_dona_material
    from public.materials m
   where m.id = new.material_id;

  if v_dona_produto is null
     or v_dona_material is null
     or v_dona_produto <> v_dona_material then
    -- FT001 = "Ficha Técnica": código próprio, fora das classes usadas pelo
    -- PostgreSQL e sem o prefixo PT (que o PostgREST usa para status HTTP).
    raise exception 'O material escolhido não pertence a esta conta.'
      using errcode = 'FT001';
  end if;

  return new;
end;
$function$;

-- O gatilho continua funcionando: a permissão de executar a função só é
-- conferida quando o gatilho é CRIADO (por quem roda esta migration), e
-- não a cada inserção. Revogar impede chamar a função diretamente.
revoke all on function public.conferir_dona_material_ficha() from public, anon, authenticated;

drop trigger if exists product_materials_conferir_dona on public.product_materials;

create trigger product_materials_conferir_dona
  before insert or update of product_id, material_id
  on public.product_materials
  for each row
  execute function public.conferir_dona_material_ficha();

-- ---------------------------------------------------------------------
-- 3. Sem material repetido na mesma ficha
-- ---------------------------------------------------------------------
-- Se já houver pares repetidos, a migration inteira é cancelada
-- (consulta de conferência "b").

alter table public.product_materials
  drop constraint if exists product_materials_produto_material_unico,
  add constraint product_materials_produto_material_unico
    unique (product_id, material_id);

-- ---------------------------------------------------------------------
-- 4. Quantidade maior que zero
-- ---------------------------------------------------------------------
-- NOT VALID: a regra vale para toda linha NOVA e para toda linha
-- ALTERADA daqui em diante, mas o banco não confere as linhas que já
-- existem. Assim, itens antigos com quantidade 0 não cancelam a migration.
-- (Se um item antigo com 0 for alterado, ele precisa ganhar uma
-- quantidade maior que zero.) Depois de corrigir as linhas antigas, é
-- possível rodar: alter table public.product_materials
--   validate constraint product_materials_quantidade_positiva;

alter table public.product_materials
  drop constraint if exists product_materials_quantidade_positiva,
  add constraint product_materials_quantidade_positiva
    check (quantidade > 0) not valid;

commit;

-- ---------------------------------------------------------------------
-- Conferência depois de executar (só leitura):
--
-- select column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'products' and column_name = 'ativo';
--
-- select conname, convalidated
-- from pg_constraint
-- where conrelid = 'public.product_materials'::regclass
--   and conname in ('product_materials_produto_material_unico',
--                   'product_materials_quantidade_positiva');
--
-- select tgname, tgenabled
-- from pg_trigger
-- where tgrelid = 'public.product_materials'::regclass
--   and tgname = 'product_materials_conferir_dona';
-- ---------------------------------------------------------------------
