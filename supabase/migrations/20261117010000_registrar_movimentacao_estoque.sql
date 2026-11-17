-- =====================================================================
-- Precifica+ | Jornada 1 — registrar movimentos de estoque numa operação só
-- Data: 17/11/2026
-- Executar no SQL Editor do Supabase, uma única vez.
--
-- Decisões do Juarez (17/11/2026):
--  - compra informada em EMBALAGENS ("comprei 3 rolos"); o sistema converte
--    para a unidade de uso (3 × 150 = 450 metros);
--  - o custo do material passa a ser o ÚLTIMO PREÇO PAGO;
--  - estoque negativo é BLOQUEADO.
--
-- Tipos:
--  'entrada' (compra)  : p_quantidade = nº de embalagens; p_valor_total = valor pago
--  'saida'   (uso)     : p_quantidade = quanto saiu, na unidade de uso
--  'ajuste'  (contagem): p_quantidade = quanto a artesã contou agora (valor novo)
--
-- Tudo acontece numa única operação: grava o movimento e atualiza o
-- material juntos, ou nada. Roda com as permissões da própria usuária
-- (security invoker): as regras de acesso (RLS) continuam valendo.
--
-- Erros devolvidos (a tela traduz para português simples):
--  MATERIAL_NAO_ENCONTRADO, QUANTIDADE_INVALIDA, VALOR_INVALIDO,
--  TIPO_INVALIDO, ESTOQUE_INSUFICIENTE, SEM_DIFERENCA
-- =====================================================================

begin;

create or replace function public.registrar_movimentacao_estoque(
  p_material_id bigint,
  p_tipo        text,
  p_quantidade  numeric,
  p_valor_total numeric default null,
  p_observacao  text    default null
)
returns numeric
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_usuaria      uuid := (select auth.uid());
  v_material     record;
  v_qtd_uso      numeric;   -- quantidade na unidade de uso
  v_custo        numeric;   -- custo por unidade de uso deste movimento
  v_novo_estoque numeric;
begin
  if v_usuaria is null then
    raise exception 'MATERIAL_NAO_ENCONTRADO';
  end if;

  -- Trava a linha do material até o fim da operação (evita duas baixas
  -- ao mesmo tempo). O RLS garante que só o material da própria usuária
  -- é encontrado.
  select id, quantidade_por_compra, custo_por_unidade,
         coalesce(estoque_atual, 0) as estoque_atual
    into v_material
    from public.materials
   where id = p_material_id
     for update;

  if not found then
    raise exception 'MATERIAL_NAO_ENCONTRADO';
  end if;

  if p_quantidade is null then
    raise exception 'QUANTIDADE_INVALIDA';
  end if;

  -- ---------------- Compra ----------------
  if p_tipo = 'entrada' then
    if p_quantidade <= 0 then
      raise exception 'QUANTIDADE_INVALIDA';
    end if;
    if p_valor_total is null or p_valor_total < 0 then
      raise exception 'VALOR_INVALIDO';
    end if;

    v_qtd_uso      := p_quantidade * v_material.quantidade_por_compra;
    v_custo        := p_valor_total / v_qtd_uso;
    v_novo_estoque := v_material.estoque_atual + v_qtd_uso;

    -- Último preço pago: preço de UMA embalagem desta compra.
    update public.materials
       set estoque_atual       = v_novo_estoque,
           estoque             = v_novo_estoque,             -- coluna antiga
           preco               = p_valor_total / p_quantidade,
           quantidade_comprada = quantidade_por_compra,      -- coluna antiga
           custo_unitario      = v_custo                     -- coluna antiga
     where id = p_material_id;

    insert into public.material_movements
      (material_id, user_id, tipo, quantidade, valor_unitario, valor_total, observacao)
    values
      (p_material_id, v_usuaria, 'entrada', v_qtd_uso, v_custo, p_valor_total,
       nullif(trim(coalesce(p_observacao, '')), ''));

  -- ---------------- Uso ou perda ----------------
  elsif p_tipo = 'saida' then
    if p_quantidade <= 0 then
      raise exception 'QUANTIDADE_INVALIDA';
    end if;
    if p_quantidade > v_material.estoque_atual then
      raise exception 'ESTOQUE_INSUFICIENTE';
    end if;

    v_custo        := coalesce(v_material.custo_por_unidade, 0);
    v_novo_estoque := v_material.estoque_atual - p_quantidade;

    update public.materials
       set estoque_atual = v_novo_estoque,
           estoque       = v_novo_estoque                    -- coluna antiga
     where id = p_material_id;

    insert into public.material_movements
      (material_id, user_id, tipo, quantidade, valor_unitario, valor_total, observacao)
    values
      (p_material_id, v_usuaria, 'saida', p_quantidade, v_custo, p_quantidade * v_custo,
       nullif(trim(coalesce(p_observacao, '')), ''));

  -- ---------------- Correção de contagem ----------------
  elsif p_tipo = 'ajuste' then
    if p_quantidade < 0 then
      raise exception 'QUANTIDADE_INVALIDA';
    end if;
    if p_quantidade = v_material.estoque_atual then
      raise exception 'SEM_DIFERENCA';
    end if;

    v_custo        := coalesce(v_material.custo_por_unidade, 0);
    v_novo_estoque := p_quantidade;
    -- Guarda a DIFERENÇA (positiva = sobrou, negativa = faltou).
    v_qtd_uso      := p_quantidade - v_material.estoque_atual;

    update public.materials
       set estoque_atual = v_novo_estoque,
           estoque       = v_novo_estoque                    -- coluna antiga
     where id = p_material_id;

    insert into public.material_movements
      (material_id, user_id, tipo, quantidade, valor_unitario, valor_total, observacao)
    values
      (p_material_id, v_usuaria, 'ajuste', v_qtd_uso, v_custo, v_qtd_uso * v_custo,
       nullif(trim(coalesce(p_observacao, '')), ''));

  else
    raise exception 'TIPO_INVALIDO';
  end if;

  return v_novo_estoque;
end;
$function$;

-- Só usuárias logadas podem chamar; visitantes, não.
revoke all on function public.registrar_movimentacao_estoque(bigint, text, numeric, numeric, text)
  from public, anon;
grant execute on function public.registrar_movimentacao_estoque(bigint, text, numeric, numeric, text)
  to authenticated;

commit;

-- ---------------------------------------------------------------------
-- Conferência (rodar depois, separadamente; só leitura):
--
-- select p.proname, p.prosecdef as privilegio_total, p.proconfig
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname = 'registrar_movimentacao_estoque';
-- (esperado: 1 linha, privilegio_total = false, search_path vazio)
-- ---------------------------------------------------------------------
