-- =====================================================================
-- VECTIS / HSI — 0012 Histórico real de reportes generados
-- "Ver histórico" en Reportes.tsx mostraba un texto fijo de demostración
-- porque no existía ningún registro de qué se había descargado. Se crea
-- un log inmutable (folio, periodo, quién lo generó) que se llena cada
-- vez que un usuario descarga un PDF desde el centro de reportes, para
-- que el histórico sea real y trazable — consistente con el resto del
-- ledger institucional (inmutable, sin update/delete).
-- =====================================================================

create table public.reportes_generados (
  id uuid primary key default gen_random_uuid(),
  reporte_nombre text not null,
  categoria text not null,
  folio text not null,
  periodo text,
  generado_por text,
  created_at timestamptz not null default now()
);

create index reportes_generados_nombre_idx
  on public.reportes_generados (reporte_nombre, created_at desc);

alter table public.reportes_generados enable row level security;

create policy "reportes_generados_select_authenticated" on public.reportes_generados
  for select to authenticated using (true);

create policy "reportes_generados_insert_authenticated" on public.reportes_generados
  for insert to authenticated with check (true);
