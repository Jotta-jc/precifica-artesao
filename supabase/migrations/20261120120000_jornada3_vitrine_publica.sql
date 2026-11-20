-- Jornada 3, Vitrine V4: função pública vitrine_publica(p_endereco)
-- Única porta do anon para a vitrine (o anon não tem acesso a nenhuma tabela).
-- security definer (dono postgres) passa por cima do RLS: o filtro e a lista
-- de campos abaixo são a proteção. Nunca usar select *.
-- Devolve null para vitrine inexistente OU não publicada (não dá para saber
-- qual dos dois). Nunca devolve custos, margens, ficha, sugerido, clientes.
-- preco só sai com mostrar_preco e preco > 0 (senão null = "Preço sob consulta").
-- Aula sai sem prazo (a página também esconde pelo tipo).
-- Pode rodar de novo: create or replace mantém permissões antigas, por isso
-- o revoke + grant no fim (regra L11).

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

revoke all on function public.vitrine_publica(text) from public, anon, authenticated;
grant execute on function public.vitrine_publica(text) to anon, authenticated;
