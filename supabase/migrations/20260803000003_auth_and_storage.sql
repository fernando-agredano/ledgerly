-- =====================================================================
-- VECTIS / HSI — 0009 Login real + fotos de perfil (Supabase Auth + Storage)
-- Hasta ahora el login era decorativo (solo navegaba) y el frontend usaba
-- únicamente la anon key, así que agregamos políticas "demo_anon_*" en 0007
-- y 0008 para que la app pudiera escribir sin sesión. Ahora que hay
-- autenticación real, cerramos ese bypass: escribir requiere haber
-- iniciado sesión, igual que ya exigían las políticas originales de 0006
-- para las tablas que cubrían.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Perfil ligado a la cuenta de auth (distinto de "usuarios", que es el
-- directorio/roster institucional de Configuración — puede tener personas
-- sin cuenta todavía, ej. "Por crear"). "profiles" es la identidad real
-- de quien inició sesión: nombre, rol y foto que edita en su propio perfil.
-- ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default 'Nuevo usuario',
  rol text not null default 'Analista',
  foto_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- Aprovisiona el perfil automáticamente cuando alguien se registra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'rol', 'Analista')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Bucket de Storage para fotos de perfil
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_own_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_own_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_own_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- Cerrar el bypass de escritura anónima ahora que el login es real
-- ---------------------------------------------------------------------

drop policy if exists "demo_anon_insert_solicitudes" on public.solicitudes;
drop policy if exists "demo_anon_update_solicitudes" on public.solicitudes;
drop policy if exists "demo_anon_insert_documentos" on public.documentos;
drop policy if exists "demo_anon_update_documentos" on public.documentos;
drop policy if exists "demo_anon_insert_usuarios" on public.usuarios;
drop policy if exists "demo_anon_update_usuarios" on public.usuarios;
drop policy if exists "demo_anon_insert_cobranza_acciones" on public.cobranza_acciones;
drop policy if exists "demo_anon_insert_creditos" on public.creditos;
drop policy if exists "demo_anon_insert_comite_aprobaciones" on public.comite_aprobaciones;
drop policy if exists "demo_anon_insert_condiciones_aprobadas" on public.condiciones_aprobadas;
drop policy if exists "demo_anon_insert_asientos_contables" on public.asientos_contables;

-- "usuarios" y "cobranza_acciones" son tablas nuevas (0008); 0006 no pudo
-- cubrirlas con su patrón "authenticated" porque no existían todavía.
create policy "auth_insert_usuarios" on public.usuarios
  for insert to authenticated with check (true);
create policy "auth_update_usuarios" on public.usuarios
  for update to authenticated using (true);
create policy "auth_insert_cobranza_acciones" on public.cobranza_acciones
  for insert to authenticated with check (true);
