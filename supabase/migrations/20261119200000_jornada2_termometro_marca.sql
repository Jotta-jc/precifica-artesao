-- =====================================================================
-- Precifica+ | Jornada 2, Etapa 11 — termômetro da marca
-- Data: 19/11/2026
-- Executar no SQL Editor do Supabase, uma única vez (pode ser rodada de
-- novo sem erro). Depois, rode o SQL de conferência (só leitura).
--
-- O que este arquivo faz (decisões K1–K11):
--  Cria a tabela termometro_marca: as respostas do termômetro, uma linha
--  por mês por conta (histórico). A tela calcula os pontos e o nível
--  sugerido; a tabela guarda as respostas, os pontos e o nível sugerido
--  daquele mês.
--
--  NÃO altera business_metrics: o motor de preço continua usando
--  business_metrics.marca_nivel e marca_fator. O termômetro só SUGERE;
--  quem muda o nível é a artesã, pela tela.
--
-- Rodar de novo: a tabela usa "create table if not exists". Se ela já
-- existir, NADA dentro do create table é refeito: colunas e restrições
-- (checks, unique) que já existem continuam como estão, mesmo que este
-- arquivo tenha mudado. As políticas (drop + create) e as permissões são
-- refeitas sempre.
--
-- Tudo dentro de begin/commit: ou tudo é aplicado, ou nada.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Tabela
-- ---------------------------------------------------------------------

create table if not exists public.termometro_marca (
  id               bigint generated always as identity primary key,
  user_id          uuid not null default auth.uid()
                   references auth.users(id) on delete cascade,
  -- Mês da resposta, sempre no dia 1 (fuso de São Paulo, calculado na tela).
  mes              date not null,

  -- Pergunta 1: soma dos seguidores de todas as redes.
  seguidores       integer not null,
  -- Pergunta 2: peças vendidas por mês.
  vendas_mes       integer not null,
  -- Pergunta 3: espera das encomendas (faixa escolhida).
  espera           text not null,
  -- Pergunta 4: clientes que voltam a comprar (faixa escolhida).
  clientes_voltam  text not null,
  -- Pergunta 5: mídia, feiras, prêmios, aulas (sim/não).
  midia            boolean not null default false,
  feiras           boolean not null default false,
  premios          boolean not null default false,
  aulas            boolean not null default false,

  -- De onde veio cada número das perguntas 2 a 4 (automático na Jornada 3).
  origem_vendas    text not null default 'informado',
  origem_espera    text not null default 'informado',
  origem_clientes  text not null default 'informado',

  -- Resultado daquele mês (guardado: se as faixas mudarem, o histórico não muda).
  pontos           smallint not null,
  nivel_sugerido   text not null,

  created_at       timestamptz not null default now(),
  -- Preenchido pelo service a cada gravação (sem gatilho).
  updated_at       timestamptz not null default now(),

  constraint termometro_marca_mes_dia_1
    check (extract(day from mes) = 1),
  constraint termometro_marca_seguidores_nao_negativo
    check (seguidores >= 0),
  constraint termometro_marca_vendas_mes_nao_negativo
    check (vendas_mes >= 0),
  constraint termometro_marca_espera_valida
    check (espera in ('sem_espera', 'ate_1_semana', '1_a_4_semanas', 'mais_1_mes')),
  constraint termometro_marca_clientes_voltam_valido
    check (clientes_voltam in ('menos_10', '10_24', '25_49', '50_mais')),
  constraint termometro_marca_origem_vendas_valida
    check (origem_vendas in ('informado', 'automatico')),
  constraint termometro_marca_origem_espera_valida
    check (origem_espera in ('informado', 'automatico')),
  constraint termometro_marca_origem_clientes_valida
    check (origem_clientes in ('informado', 'automatico')),
  constraint termometro_marca_pontos_validos
    check (pontos between 0 and 15),
  constraint termometro_marca_nivel_sugerido_valido
    check (nivel_sugerido in ('comecando', 'regional', 'reconhecida', 'referencia')),

  -- Uma resposta por mês por conta. O índice desta regra começa por
  -- user_id e já serve às políticas (não é preciso outro índice).
  constraint termometro_marca_user_mes_unico
    unique (user_id, mes)
);

-- ---------------------------------------------------------------------
-- 2. RLS: cada conta só vê e grava as próprias linhas
-- ---------------------------------------------------------------------
-- Sem política de exclusão: nenhuma tela apaga o histórico. Ao excluir a
-- conta, as linhas somem pela ligação com auth.users (on delete cascade).

alter table public.termometro_marca enable row level security;

drop policy if exists termometro_marca_select on public.termometro_marca;
drop policy if exists termometro_marca_insert on public.termometro_marca;
drop policy if exists termometro_marca_update on public.termometro_marca;

create policy termometro_marca_select on public.termometro_marca
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy termometro_marca_insert on public.termometro_marca
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy termometro_marca_update on public.termometro_marca
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------
-- 3. Permissões
-- ---------------------------------------------------------------------
-- Visitante sem acesso; usuária logada só com ler, criar e alterar.
-- A coluna id é "identity": o banco gera o número sem precisar de
-- permissão separada na sequência (igual a product_categories).

revoke all on table public.termometro_marca from anon, authenticated;
grant select, insert, update on table public.termometro_marca to authenticated;
grant all on table public.termometro_marca to service_role;

commit;
