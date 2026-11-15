-- shop_provision_owner reads auth.users to confirm the owner's email; service_role cannot read auth.users,
-- so the function must run as its owner. Execution stays restricted to service_role (server only).
alter function public.shop_provision_owner(uuid) security definer set search_path = public, pg_temp;
revoke all on function public.shop_provision_owner(uuid) from public, anon, authenticated;
grant execute on function public.shop_provision_owner(uuid) to service_role;
