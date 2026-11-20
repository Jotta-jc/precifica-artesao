-- =====================================================================
-- Precifica+ | Jornada 3, Etapa V6a — fotos dos produtos e logo do ateliê
-- Data: 20/11/2026
-- Executar no SQL Editor do Supabase. Pode ser rodada de novo sem erro.
--
-- Decisões Q1–Q4:
--  Q1 uma foto por produto (products.foto) e um logo por conta
--     (business_metrics.logo), guardados como CAMINHO do arquivo no bucket.
--  Q2 bucket público "vitrine", só JPEG, até 2 MB. Caminhos:
--       <user_id>/produtos/<id do produto>-<data-hora>.jpg
--       <user_id>/logo-<data-hora>.jpg
--     (nome novo a cada envio: a foto trocada não fica presa no cache).
--  Q3 policies do storage só para authenticated, cada conta só na própria
--     pasta (<user_id>/...). NENHUMA policy para anon: a vitrine pública
--     abre a foto pelo link público do bucket.
--  Q4 vitrine_publica passa a devolver o logo e a foto (só o caminho),
--     com revoke + grant no fim (regra L11).
--
-- Não mexe nas permissões (grant/revoke) das tabelas do schema storage.
-- Não apaga nem altera nenhum dado. Tudo dentro de begin/commit.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Colunas
-- ---------------------------------------------------------------------

alter table public.products         add column if not exists foto text;
alter table public.business_metrics add column if not exists logo text;

-- ---------------------------------------------------------------------
-- 2. Formato dos caminhos
-- ---------------------------------------------------------------------
-- O caminho tem que começar pela pasta da PRÓPRIA conta (user_id da linha):
-- uma conta não consegue apontar a foto para o arquivo de outra.

alter table public.products drop constraint if exists products_foto_formato;
alter table public.products
  add constraint products_foto_formato
    check (
      foto is null
      or (
        foto ~ '^[0-9a-f-]{36}/produtos/[0-9]+-[0-9]+\.jpg$'
        and split_part(foto, '/', 1) = user_id::text
      )
    );

alter table public.business_metrics drop constraint if exists business_metrics_logo_formato;
alter table public.business_metrics
  add constraint business_metrics_logo_formato
    check (
      logo is null
      or (
        logo ~ '^[0-9a-f-]{36}/logo-[0-9]+\.jpg$'
        and split_part(logo, '/', 1) = user_id::text
      )
    );

-- ---------------------------------------------------------------------
-- 3. Bucket "vitrine"
-- ---------------------------------------------------------------------
-- public = true: qualquer pessoa com o link abre o arquivo (leitura).
-- Enviar, trocar e apagar continuam exigindo as policies abaixo.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vitrine', 'vitrine', true, 2097152, array['image/jpeg'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- 4. Policies em storage.objects (só authenticated, só a própria pasta)
-- ---------------------------------------------------------------------
-- O select é exigido pelo Supabase para apagar e trocar arquivos.
-- A vitrine pública lê a foto pelo link público do bucket, sem policy
-- para anon. NUNCA criar policy de storage para anon.

drop policy if exists vitrine_fotos_select on storage.objects;
create policy vitrine_fotos_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'vitrine'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists vitrine_fotos_insert on storage.objects;
create policy vitrine_fotos_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'vitrine'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists vitrine_fotos_update on storage.objects;
create policy vitrine_fotos_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'vitrine'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'vitrine'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists vitrine_fotos_delete on storage.objects;
create policy vitrine_fotos_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'vitrine'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------
-- 5. vitrine_publica com logo e foto
-- ---------------------------------------------------------------------
-- Cópia da versão de 20261120120000; só entram 'logo' (vitrine) e 'foto'
-- (produto), ambos como caminho do arquivo no bucket. A página monta o
-- link público. security definer passa por cima do RLS: o filtro e a
-- lista de campos são a proteção. Nunca usar select *.

create or replace function public.vitrine_publica(p_endereco text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'endereco',    v.endereco,
    'nome_atelie', bm.nome_empresa,
    'logo',        bm.logo,
    'whatsapp',    v.whatsapp,
    'instagram',   v.instagram,
    'sobre',       v.sobre,
    'produtos', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id',         p.id,
          'nome',       p.nome,
          'tipo',       p.tipo,
          'descricao',  p.descricao,
          'foto',       p.foto,
          'preco',      case when p.mostrar_preco and p.preco > 0 then p.preco end,
          'prazo',      case when p.tipo = 'aula' then null else p.prazo end,
          'prazo_dias', case when p.tipo = 'aula' then null else p.prazo_dias end
        )
        order by p.nome, p.id
      )
      from public.products p
      where p.user_id = v.user_id
        and p.ativo
        and p.publicado
    ), '[]'::jsonb)
  )
  from public.vitrines v
  left join public.business_metrics bm on bm.user_id = v.user_id
  where char_length(btrim(p_endereco)) between 3 and 40
    and v.endereco = lower(btrim(p_endereco))
    and v.publicada;
$function$;

-- create or replace mantém as permissões antigas: por isso revoke + grant (L11).
revoke all on function public.vitrine_publica(text) from public, anon, authenticated;
grant execute on function public.vitrine_publica(text) to anon, authenticated;

commit;

-- ---------------------------------------------------------------------
-- Conferência depois de executar (só leitura):
--
-- select column_name, data_type from information_schema.columns
-- where table_schema = 'public'
--   and ((table_name = 'products' and column_name = 'foto')
--     or (table_name = 'business_metrics' and column_name = 'logo'));
--
-- select conname, pg_get_constraintdef(oid) from pg_constraint
-- where conname in ('products_foto_formato', 'business_metrics_logo_formato');
--
-- select id, public, file_size_limit, allowed_mime_types
-- from storage.buckets where id = 'vitrine';
--
-- select policyname, cmd, roles from pg_policies
-- where schemaname = 'storage' and tablename = 'objects'
--   and policyname like 'vitrine_fotos_%';
-- (esperado: 4 linhas, todas com roles = {authenticated})
--
-- select grantee, privilege_type from information_schema.routine_privileges
-- where routine_schema = 'public' and routine_name = 'vitrine_publica';
-- (esperado: postgres, service_role, anon e authenticated; sem PUBLIC)
-- ---------------------------------------------------------------------
