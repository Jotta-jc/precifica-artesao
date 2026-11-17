-- =====================================================================
-- Precifica+ | Jornada 1 — base de dados dos materiais
-- Data: 17/11/2026
-- Executar no SQL Editor do Supabase, uma única vez.
--
-- Decisões do Juarez (17/11/2026):
--  - categorias de material = lista própria de cada artesã (material_categories),
--    com uma lista padrão de 16 categorias para todas as contas, inclusive novas;
--  - unidade de USO numa lista fixa: grama, quilo, metro, centimetro,
--    mililitro, litro, unidade, par;
--  - a artesã informa quanto vem em cada compra; o banco calcula o custo por
--    unidade de uso;
--  - estoque mínimo (coluna minimum_stock) e arquivamento (coluna ativo).
--
-- O que este arquivo faz:
--  1. Lista padrão de categorias: função, gatilho para contas novas e
--     preenchimento das contas que já existem (sem duplicar).
--  2. Colunas novas em materials: unidade_uso, quantidade_por_compra e
--     custo_por_unidade (calculada pelo banco).
--  3. Converte os dados atuais SEM mudar o custo de nenhum material:
--     quantidade_por_compra = quantidade_comprada, ou 1 quando ela é 0.
--  4. Liga cada material a uma categoria da lista (category_id).
--
-- NÃO apaga nenhuma coluna. As colunas antigas (categoria, unidade, estoque,
-- quantidade_comprada, quantidade_por_unidade, quantity_per_package,
-- custo_unitario) continuam e só sairão depois que nenhuma tela as usar.
-- Tudo dentro de begin/commit: ou tudo é aplicado, ou nada.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Categorias padrão
-- ---------------------------------------------------------------------

-- Impede categorias repetidas na mesma conta ("Fios" e "fios").
-- Se já houver repetidas, a migration inteira é cancelada.
create unique index material_categories_user_nome_unico
  on public.material_categories (user_id, lower(nome));

create or replace function public.criar_categorias_padrao(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.material_categories (user_id, nome)
  select p_user_id, padrao.nome
  from (values
    ('Alças'), ('Argolas'), ('Botões'), ('Colas'), ('Embalagens'),
    ('Etiquetas'), ('Ferragens'), ('Fios'), ('Forros'), ('Linhas'),
    ('Madeiras'), ('Mosquetões'), ('Outros'), ('Resinas'), ('Tecidos'),
    ('Zíperes')
  ) as padrao(nome)
  where not exists (
    select 1 from public.material_categories c
    where c.user_id = p_user_id and lower(c.nome) = lower(padrao.nome)
  );
end;
$function$;

-- Só o banco (gatilho e esta migration) chama a função.
revoke all on function public.criar_categorias_padrao(uuid) from public, anon, authenticated;

-- Contas novas: o gatilho de cadastro passa a criar também as categorias.
-- (mesmo corpo de antes + a chamada nova; search_path continua fixo)
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

  return new;

end;
$function$;

-- Contas que já existem.
do $$
declare
  conta record;
begin
  for conta in select id from auth.users loop
    perform public.criar_categorias_padrao(conta.id);
  end loop;
end
$$;

-- ---------------------------------------------------------------------
-- 2. Colunas novas em materials
-- ---------------------------------------------------------------------

alter table public.materials
  add column unidade_uso text,
  add column quantidade_por_compra numeric not null default 1;

alter table public.materials
  add constraint materials_quantidade_por_compra_positiva
    check (quantidade_por_compra > 0),
  add constraint materials_minimum_stock_nao_negativo
    check (minimum_stock is null or minimum_stock >= 0);

-- ---------------------------------------------------------------------
-- 3. Conversão dos dados atuais
-- ---------------------------------------------------------------------

-- Unidade de uso a partir do texto livre de hoje.
update public.materials
set unidade_uso = case lower(trim(coalesce(unidade, '')))
  when 'kg'       then 'quilo'
  when 'quilo'    then 'quilo'
  when 'quilos'   then 'quilo'
  when 'kilo'     then 'quilo'
  when 'g'        then 'grama'
  when 'gr'       then 'grama'
  when 'grama'    then 'grama'
  when 'gramas'   then 'grama'
  when 'm'        then 'metro'
  when 'metro'    then 'metro'
  when 'metros'   then 'metro'
  when 'cm'       then 'centimetro'
  when 'ml'       then 'mililitro'
  when 'l'        then 'litro'
  when 'litro'    then 'litro'
  when 'litros'   then 'litro'
  when 'par'      then 'par'
  when 'pares'    then 'par'
  else 'unidade'  -- un, unt, unid, unidade, unitario e qualquer outro texto
end;

alter table public.materials
  alter column unidade_uso set default 'unidade',
  alter column unidade_uso set not null,
  add constraint materials_unidade_uso_valida
    check (unidade_uso in ('grama', 'quilo', 'metro', 'centimetro',
                           'mililitro', 'litro', 'unidade', 'par'));

-- Quanto vem em cada compra. Mantém o custo de hoje:
-- com quantidade comprada > 0, o preço era da compra inteira;
-- com 0, o preço era de 1 unidade.
update public.materials
set quantidade_por_compra = case
  when coalesce(quantidade_comprada, 0) > 0 then quantidade_comprada
  else 1
end;

-- Custo por unidade de uso, calculado pelo próprio banco.
alter table public.materials
  add column custo_por_unidade numeric
    generated always as (preco / quantidade_por_compra) stored;

-- ---------------------------------------------------------------------
-- 4. Ligar cada material a uma categoria da lista da própria dona
-- ---------------------------------------------------------------------

with alvo as (
  select m.id,
         m.user_id,
         case
           when lower(trim(coalesce(m.categoria, ''))) in ('fios', 'fio', 'fio náutico', 'fio nautico') then 'Fios'
           when lower(trim(coalesce(m.categoria, ''))) in ('alças', 'alcas', 'alça', 'alca') then 'Alças'
           when lower(trim(coalesce(m.categoria, ''))) in ('argolas', 'argola') then 'Argolas'
           when lower(trim(coalesce(m.categoria, ''))) in ('ziper', 'zíper', 'ziperes', 'zíperes') then 'Zíperes'
           when lower(trim(coalesce(m.categoria, ''))) in ('forro', 'forros') then 'Forros'
           when lower(trim(coalesce(m.categoria, ''))) = 'teste' then 'Outros'
           else trim(coalesce(m.categoria, ''))
         end as nome_categoria
  from public.materials m
  where m.category_id is null
)
update public.materials m
set category_id = coalesce(
  (select c.id from public.material_categories c
    where c.user_id = alvo.user_id
      and lower(c.nome) = lower(alvo.nome_categoria)),
  (select c.id from public.material_categories c
    where c.user_id = alvo.user_id
      and c.nome = 'Outros')
)
from alvo
where m.id = alvo.id;

commit;

-- ---------------------------------------------------------------------
-- Conferência (rodar depois, separadamente; só leitura):
--
-- select m.id, m.nome, m.categoria as categoria_antiga, c.nome as categoria_nova,
--        m.unidade as unidade_antiga, m.unidade_uso, m.preco,
--        m.quantidade_comprada, m.quantidade_por_compra, m.custo_por_unidade
-- from public.materials m
-- left join public.material_categories c on c.id = m.category_id
-- order by m.user_id, m.id;
--
-- select left(user_id::text, 8) as dona, count(*) as categorias
-- from public.material_categories group by user_id order by dona;
-- ---------------------------------------------------------------------
