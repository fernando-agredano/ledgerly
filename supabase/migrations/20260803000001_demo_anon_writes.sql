-- =====================================================================
-- VECTIS / HSI — 0007 Escritura anónima para la demo
-- El frontend usa únicamente la anon key (no hay Supabase Auth real en
-- el login, es solo navegación). Las políticas de 0006 solo permiten
-- INSERT/UPDATE a "authenticated", así que "Nueva solicitud", "Enviar a
-- Comité" y "Subir documento" fallarían por RLS. Se agrega aquí el mismo
-- patrón "DEMO" que ya existe para SELECT, mínimo indispensable
-- (solicitudes + documentos) para ese flujo.
-- TODO PROD: quitar estas políticas cuando haya autenticación real y
-- roles institucionales.
-- =====================================================================

create policy "demo_anon_insert_solicitudes" on public.solicitudes
  for insert to anon with check (true);

create policy "demo_anon_update_solicitudes" on public.solicitudes
  for update to anon using (true);

create policy "demo_anon_insert_documentos" on public.documentos
  for insert to anon with check (true);
