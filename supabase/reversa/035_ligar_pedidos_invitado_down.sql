-- Reversa de 035: quita la función (los pedidos ya ligados conservan su user_id).
drop function if exists public.ligar_pedidos_invitado(uuid);
notify pgrst, 'reload schema';
