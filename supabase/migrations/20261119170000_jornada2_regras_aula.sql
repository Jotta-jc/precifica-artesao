-- =====================================================================
-- Precifica+ | Jornada 2 — regras de aula protegidas no banco
-- Data: 19/11/2026
-- Executar no SQL Editor do Supabase, uma única vez (pode ser rodada de
-- novo sem erro). Antes de executar, rode a conferência do PASSO 145
-- (nenhuma aula com embalagem diferente de 0 e nenhuma aula com ficha).
--
-- Decisão G7: aula não tem ficha técnica e tem embalagem 0. Hoje isso é
-- conferido só pelo código (service e formulário). Este arquivo faz o
-- banco conferir também:
--  1. Ficha técnica (product_materials) não aceita produto do tipo aula.
--     Erro devolvido: código FT002.
--  2. Produto com materiais na ficha não pode virar aula.
--     Erro devolvido: código FT003.
--  3. Aula só pode ter embalagem 0 (restrição products_aula_sem_embalagem).
--
-- Não apaga nem altera nenhum dado. Tudo dentro de begin/commit:
-- ou tudo é aplicado, ou nada.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Ficha técnica: não aceita aula
-- ---------------------------------------------------------------------

-- security definer + search_path vazio + nomes completos (mesmo padrão da
-- migration de 18/11): a função lê products com as permissões do dono da
-- função, sem depender do RLS da usuária.
create or replace function public.conferir_ficha_nao_e_aula()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_tipo text;
begin
  -- "for share" trava a linha do produto até o fim da operação: enquanto
  -- este material entra na ficha, outra operação não consegue mudar o
  -- produto para aula ao mesmo tempo (e vice-versa).
  select p.tipo into v_tipo
    from public.products p
   where p.id = new.product_id
     for share;

  if v_tipo = 'aula' then
    -- FT002 = "Ficha Técnica", erro 2 (o FT001 é o do material de outra conta).
    raise exception 'Aula não tem ficha técnica.'
      using errcode = 'FT002';
  end if;

  return new;
end;
$function$;

-- O gatilho continua funcionando: a permissão de executar a função só é
-- conferida quando o gatilho é CRIADO, e não a cada inserção. Revogar
-- impede chamar a função diretamente.
revoke all on function public.conferir_ficha_nao_e_aula() from public, anon, authenticated;

drop trigger if exists product_materials_conferir_aula on public.product_materials;

create trigger product_materials_conferir_aula
  before insert or update of product_id
  on public.product_materials
  for each row
  execute function public.conferir_ficha_nao_e_aula();

-- ---------------------------------------------------------------------
-- 2. Produto com ficha não pode virar aula
-- ---------------------------------------------------------------------

create or replace function public.conferir_aula_sem_ficha()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.tipo = 'aula'
     and old.tipo is distinct from 'aula'
     and exists (
       select 1
         from public.product_materials pm
        where pm.product_id = new.id
     ) then
    raise exception 'Para transformar em aula, tire antes os materiais da ficha técnica.'
      using errcode = 'FT003';
  end if;

  return new;
end;
$function$;

revoke all on function public.conferir_aula_sem_ficha() from public, anon, authenticated;

drop trigger if exists products_conferir_aula_sem_ficha on public.products;

create trigger products_conferir_aula_sem_ficha
  before update of tipo
  on public.products
  for each row
  execute function public.conferir_aula_sem_ficha();

-- ---------------------------------------------------------------------
-- 3. Aula só com embalagem 0
-- ---------------------------------------------------------------------
-- Nasce validada: a conferência do PASSO 145 não achou aula com embalagem
-- diferente de 0. Se houver alguma, a migration inteira é cancelada.
-- Embalagem vazia (null) conta como zero: coalesce(embalagem, 0).
-- Só é criada se ainda não existir (para poder rodar o arquivo de novo).

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conrelid = 'public.products'::regclass
       and conname = 'products_aula_sem_embalagem'
  ) then
    alter table public.products
      add constraint products_aula_sem_embalagem
        check (tipo <> 'aula' or coalesce(embalagem, 0) = 0);
  end if;
end;
$$;

commit;

-- ---------------------------------------------------------------------
-- Conferência depois de executar (só leitura):
--
-- select tgname, tgenabled
-- from pg_trigger
-- where tgrelid = 'public.product_materials'::regclass
--   and tgname = 'product_materials_conferir_aula';
--
-- select tgname, tgenabled
-- from pg_trigger
-- where tgrelid = 'public.products'::regclass
--   and tgname = 'products_conferir_aula_sem_ficha';
--
-- select conname, convalidated, pg_get_constraintdef(oid) as regra
-- from pg_constraint
-- where conrelid = 'public.products'::regclass
--   and conname = 'products_aula_sem_embalagem';
-- ---------------------------------------------------------------------
