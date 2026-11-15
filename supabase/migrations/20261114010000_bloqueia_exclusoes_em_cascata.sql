-- =====================================================================
-- Precifica+ | Bloqueia exclusões em cascata que apagam histórico
-- Data: 14/11/2026
-- Executar no SQL Editor do Supabase, uma única vez.
--
-- Antes: apagar cliente apagava pedidos; apagar produto apagava itens
-- de pedidos; apagar material apagava histórico de estoque e linhas de
-- ficha técnica.
-- Depois: o banco impede essas exclusões (on delete restrict).
--
-- Continuam em cascata (de propósito):
--   orders -> order_items (excluir pedido apaga seus itens)
--   products -> product_materials (excluir produto sem vendas apaga a ficha)
-- =====================================================================

begin;

alter table public.orders
  drop constraint orders_client_id_fkey,
  add constraint orders_client_id_fkey
    foreign key (client_id) references public.clientes(id) on delete restrict;

alter table public.order_items
  drop constraint order_items_product_id_fkey,
  add constraint order_items_product_id_fkey
    foreign key (product_id) references public.products(id) on delete restrict;

alter table public.product_materials
  drop constraint product_materials_material_id_fkey,
  add constraint product_materials_material_id_fkey
    foreign key (material_id) references public.materials(id) on delete restrict;

alter table public.material_movements
  drop constraint material_movements_material_id_fkey,
  add constraint material_movements_material_id_fkey
    foreign key (material_id) references public.materials(id) on delete restrict;

commit;

-- ---------------------------------------------------------------------
-- Para desfazer (somente se necessário), troque "restrict" por
-- "cascade" nas quatro ligações acima e execute novamente.
-- ---------------------------------------------------------------------
