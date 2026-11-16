-- Ejecutar una vez en el SQL Editor del proyecto Supabase.
-- Es repetible: no elimina datos ni modifica tablas existentes de gastos/categorías.
begin;
create table if not exists public.metas_ahorro (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 80),
  monto_objetivo numeric(14,2) not null check (monto_objetivo > 0 and monto_objetivo <> 'NaN'::numeric),
  monto_ahorrado numeric(14,2) not null default 0 check (monto_ahorrado >= 0 and monto_ahorrado <> 'NaN'::numeric),
  fecha_objetivo date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists metas_ahorro_usuario_fecha_idx on public.metas_ahorro (usuario_id, created_at desc);
alter table public.metas_ahorro enable row level security;
revoke all on table public.metas_ahorro from anon, authenticated;
grant select, insert, update, delete on table public.metas_ahorro to authenticated;
grant usage on schema public to authenticated;

drop policy if exists metas_select_propias on public.metas_ahorro;
create policy metas_select_propias on public.metas_ahorro for select to authenticated using ((select auth.uid()) = usuario_id);
drop policy if exists metas_insert_propias on public.metas_ahorro;
create policy metas_insert_propias on public.metas_ahorro for insert to authenticated with check ((select auth.uid()) = usuario_id);
drop policy if exists metas_update_propias on public.metas_ahorro;
create policy metas_update_propias on public.metas_ahorro for update to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id);
drop policy if exists metas_delete_propias on public.metas_ahorro;
create policy metas_delete_propias on public.metas_ahorro for delete to authenticated using ((select auth.uid()) = usuario_id);

create or replace function public.actualizar_fecha_meta()
returns trigger language plpgsql security invoker set search_path = pg_catalog
as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists metas_actualizar_fecha on public.metas_ahorro;
create trigger metas_actualizar_fecha before update on public.metas_ahorro for each row execute function public.actualizar_fecha_meta();

create or replace function public.aportar_a_meta(p_meta_id uuid, p_monto numeric)
returns public.metas_ahorro
language plpgsql security invoker set search_path = pg_catalog, public
as $$
declare resultado public.metas_ahorro;
begin
  if auth.uid() is null then raise exception 'Inicia sesión para administrar tus metas.'; end if;
  if p_monto is null or p_monto = 0 or abs(p_monto) > 999999999999.99 or p_monto <> round(p_monto, 2) then
    raise exception 'El monto debe ser válido, distinto de cero y tener hasta dos decimales.';
  end if;
  -- UPDATE aplica el incremento de forma atómica, también ante aportes simultáneos.
  update public.metas_ahorro
     set monto_ahorrado = monto_ahorrado + p_monto
   where id = p_meta_id and usuario_id = auth.uid()
     and monto_ahorrado + p_monto >= 0
     and monto_ahorrado + p_monto <= 999999999999.99
  returning * into resultado;
  if not found then
    if exists (select 1 from public.metas_ahorro where id = p_meta_id and usuario_id = auth.uid()) then
      raise exception 'El retiro supera el ahorro disponible o el aporte excede el monto permitido.';
    end if;
    raise exception 'La meta no existe o no está disponible para tu cuenta.';
  end if;
  return resultado;
end;
$$;
revoke all on function public.aportar_a_meta(uuid, numeric) from public, anon;
grant execute on function public.aportar_a_meta(uuid, numeric) to authenticated;
revoke all on function public.actualizar_fecha_meta() from public, anon;
commit;
