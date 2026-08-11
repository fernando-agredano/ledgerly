-- =====================================================================
-- VECTIS / HSI — 0013 Notificaciones en tiempo real
-- La campana de notificaciones (Topbar) se calculaba a partir de
-- creditos/documentos/solicitudes solo al cargar la página. Para que se
-- actualice en vivo cuando otro usuario registra un pago, sube un
-- documento o crea una solicitud, se agregan estas tablas base a la
-- publicación de Supabase Realtime; el frontend se suscribe a sus
-- cambios (postgres_changes) y refresca las alertas automáticamente.
-- =====================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'creditos'
  ) then
    alter publication supabase_realtime add table public.creditos;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'documentos'
  ) then
    alter publication supabase_realtime add table public.documentos;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'solicitudes'
  ) then
    alter publication supabase_realtime add table public.solicitudes;
  end if;
end $$;
