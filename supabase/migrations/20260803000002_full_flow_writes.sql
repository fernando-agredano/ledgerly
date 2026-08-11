-- =====================================================================
-- VECTIS / HSI — 0008 Tablas y permisos para el flujo end-to-end
-- Agrega lo que faltaba para que "Comité", "Dispersión", "Cobranza" y
-- "Configuración > Usuarios" funcionen con datos reales en vez de UI
-- decorativa, y extiende el patrón demo_anon_* (mismo criterio de 0007)
-- a las tablas que ahora también reciben escritura desde el frontend.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Usuarios institucionales (antes hardcodeado en el frontend)
-- ---------------------------------------------------------------------

create table public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  rol text not null,
  email text,
  estado text not null default 'Activo' check (estado in ('Activo', 'Pendiente', 'Por crear')),
  foto_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.usuarios enable row level security;
create policy "demo_select_usuarios" on public.usuarios for select to anon, authenticated using (true);
create policy "demo_anon_insert_usuarios" on public.usuarios for insert to anon with check (true);
create policy "demo_anon_update_usuarios" on public.usuarios for update to anon using (true);

insert into public.usuarios (nombre, rol, email, estado) values
  ('Ana López',       'Administrador',    'ana.lopez@vectis.mx',       'Activo'),
  ('Carlos Ruiz',     'Comité de Crédito','carlos.ruiz@vectis.mx',     'Activo'),
  ('María Gómez',     'Comité de Crédito','maria.gomez@vectis.mx',     'Activo'),
  ('Juan Pérez',      'Analista',         'juan.perez@vectis.mx',      'Activo'),
  ('María Fernández', 'Oficial PLD',      'maria.fernandez@vectis.mx', 'Activo'),
  ('Lic. F. Álvarez', 'Jurídico',         'f.alvarez@vectis.mx',       'Activo'),
  ('—',               'Tesorería',        'tesoreria@vectis.mx',       'Pendiente'),
  ('—',               'Auditor interno',  null,                       'Por crear');

-- ---------------------------------------------------------------------
-- Bitácora de acciones de cobranza (antes hardcodeada como "ya hechas")
-- ---------------------------------------------------------------------

create table public.cobranza_acciones (
  id uuid primary key default gen_random_uuid(),
  credito_id uuid not null,
  tipo text not null check (tipo in ('CONTACTO', 'CONVENIO', 'EXPEDIENTE_JURIDICO')),
  descripcion text not null,
  creado_por text,
  created_at timestamptz default now()
);

alter table public.cobranza_acciones enable row level security;
create policy "demo_select_cobranza_acciones" on public.cobranza_acciones for select to anon, authenticated using (true);
create policy "demo_anon_insert_cobranza_acciones" on public.cobranza_acciones for insert to anon with check (true);

-- ---------------------------------------------------------------------
-- Escritura anon adicional para el flujo Comité → Dispersión
-- (0007 ya cubrió solicitudes/documentos; esto cubre lo que faltaba
-- para que "Confirmar y preaprobar" y "Ejecutar dispersión" persistan.)
-- ---------------------------------------------------------------------

create policy "demo_anon_insert_creditos" on public.creditos
  for insert to anon with check (true);

create policy "demo_anon_insert_comite_aprobaciones" on public.comite_aprobaciones
  for insert to anon with check (true);

create policy "demo_anon_insert_condiciones_aprobadas" on public.condiciones_aprobadas
  for insert to anon with check (true);

-- "Documentos y Actualizaciones" marca como recibido un documento recurrente
-- existente (UPDATE), no crea uno nuevo — 0007 solo cubrió INSERT.
create policy "demo_anon_update_documentos" on public.documentos
  for update to anon using (true);

-- La dispersión registra los asientos de doble partida del desembolso
-- (Cartera vigente / Bancos) al momento de crear el crédito.
create policy "demo_anon_insert_asientos_contables" on public.asientos_contables
  for insert to anon with check (true);
