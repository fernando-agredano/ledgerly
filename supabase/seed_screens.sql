-- =====================================================================
-- Ledgerly — Seed para pantallas adicionales
--   · Documentos recurrentes sobre créditos vigentes (Panel 17)
--   · Vistas para Riesgo (concentración, vintage, stress)
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- DOCUMENTOS RECURRENTES por crédito vigente
-- (Estados financieros, declaración anual, opinión 32-D, CSF, avalúo, etc.)
-- ---------------------------------------------------------------------

-- Vitalcore (LDG-VTC-001)
insert into public.documentos (credito_id, cliente_id, nombre, frecuencia, estatus, fecha_carga, fecha_vigencia, proxima_actualizacion) values
  ('22222222-2222-2222-2222-000000000003', '11111111-1111-1111-1111-000000000003',
   'Estados financieros',  'SEMESTRAL', 'PENDIENTE', '2026-02-15', '2026-08-15', '2026-08-15'),
  ('22222222-2222-2222-2222-000000000003', '11111111-1111-1111-1111-000000000003',
   'Estados de cuenta',    'TRIMESTRAL','VALIDO',    '2026-04-20', '2026-07-20', '2026-07-20'),
  ('22222222-2222-2222-2222-000000000003', '11111111-1111-1111-1111-000000000003',
   'Declaración anual',    'ANUAL',     'VALIDO',    '2026-03-30', '2027-03-31', '2027-03-31'),
  ('22222222-2222-2222-2222-000000000003', '11111111-1111-1111-1111-000000000003',
   'Opinión 32-D SAT',     'SEMESTRAL', 'VALIDO',    '2026-04-15', '2026-10-15', '2026-10-15'),
  ('22222222-2222-2222-2222-000000000003', '11111111-1111-1111-1111-000000000003',
   'CSF (Const. Situación Fiscal)', 'SEMESTRAL', 'VALIDO', '2026-04-10', '2026-10-10', '2026-10-10');

-- Norvento Arrendadora (LDG-NVA-001)
insert into public.documentos (credito_id, cliente_id, nombre, frecuencia, estatus, fecha_carga, fecha_vigencia, proxima_actualizacion) values
  ('22222222-2222-2222-2222-000000000001', '11111111-1111-1111-1111-000000000001',
   'Estados financieros',  'SEMESTRAL', 'PENDIENTE', '2025-11-15', '2026-05-15', '2026-05-15'),
  ('22222222-2222-2222-2222-000000000001', '11111111-1111-1111-1111-000000000001',
   'Estados de cuenta',    'TRIMESTRAL','VENCIDO',   '2026-01-20', '2026-04-20', '2026-04-20'),
  ('22222222-2222-2222-2222-000000000001', '11111111-1111-1111-1111-000000000001',
   'Declaración anual',    'ANUAL',     'VALIDO',    '2026-03-31', '2027-03-31', '2027-03-31'),
  ('22222222-2222-2222-2222-000000000001', '11111111-1111-1111-1111-000000000001',
   'Avalúo inmueble',      'CADA_24M',  'VALIDO',    '2025-08-20', '2027-08-20', '2027-08-20');

-- Grupo Solvex (LDG-GSV-001)
insert into public.documentos (credito_id, cliente_id, nombre, frecuencia, estatus, fecha_carga, fecha_vigencia, proxima_actualizacion) values
  ('22222222-2222-2222-2222-000000000002', '11111111-1111-1111-1111-000000000002',
   'Estados financieros',  'SEMESTRAL', 'VALIDO',    '2026-04-01', '2026-10-01', '2026-10-01'),
  ('22222222-2222-2222-2222-000000000002', '11111111-1111-1111-1111-000000000002',
   'Opinión 32-D SAT',     'SEMESTRAL', 'PENDIENTE', '2025-11-15', '2026-05-15', '2026-05-15');

-- Klarpay (LDG-KLP-001)
insert into public.documentos (credito_id, cliente_id, nombre, frecuencia, estatus, fecha_carga, fecha_vigencia, proxima_actualizacion) values
  ('22222222-2222-2222-2222-000000000004', '11111111-1111-1111-1111-000000000004',
   'Estados financieros',  'SEMESTRAL', 'VALIDO',    '2026-04-15', '2026-10-15', '2026-10-15'),
  ('22222222-2222-2222-2222-000000000004', '11111111-1111-1111-1111-000000000004',
   'CSF',                  'SEMESTRAL', 'VALIDO',    '2026-03-20', '2026-09-20', '2026-09-20');

-- ---------------------------------------------------------------------
-- VISTA: documentos recurrentes con datos del crédito y cliente
-- ---------------------------------------------------------------------

create or replace view public.v_documentos_recurrentes as
select
  d.id,
  d.credito_id,
  c.contrato_numero,
  cl.nombre as cliente_nombre,
  d.nombre as documento,
  d.frecuencia,
  d.estatus,
  d.fecha_carga,
  d.proxima_actualizacion,
  case
    when d.proxima_actualizacion is null then null
    when d.proxima_actualizacion < current_date then 'VENCIDO'
    when d.proxima_actualizacion <= current_date + interval '30 days' then 'POR_VENCER'
    else 'VIGENTE'
  end as alerta,
  (d.proxima_actualizacion - current_date) as dias_para_vencer
from public.documentos d
join public.creditos c on c.id = d.credito_id
join public.clientes cl on cl.id = c.cliente_id
where d.credito_id is not null
  and d.frecuencia is not null
order by d.proxima_actualizacion asc nulls last;

-- ---------------------------------------------------------------------
-- VISTA: concentración por cliente (top-N + Herfindahl)
-- ---------------------------------------------------------------------

create or replace view public.v_concentracion_cliente as
with totals as (
  select sum(saldo_insoluto) as cartera_total
  from public.creditos
  where estatus_codigo in ('VIGENTE','MORA','JURIDICO')
)
select
  cl.id as cliente_id,
  cl.nombre,
  cl.tipo,
  cl.sector,
  sum(c.saldo_insoluto) as exposicion,
  round(
    (sum(c.saldo_insoluto) / nullif(totals.cartera_total, 0))::numeric * 100,
    2
  ) as pct_cartera,
  count(*) as creditos
from public.creditos c
join public.clientes cl on cl.id = c.cliente_id
cross join totals
where c.estatus_codigo in ('VIGENTE','MORA','JURIDICO')
group by cl.id, cl.nombre, cl.tipo, cl.sector, totals.cartera_total
order by exposicion desc;

-- ---------------------------------------------------------------------
-- VISTA: concentración por sector
-- ---------------------------------------------------------------------

create or replace view public.v_concentracion_sector as
with totals as (
  select sum(c.saldo_insoluto) as cartera_total
  from public.creditos c
  where estatus_codigo in ('VIGENTE','MORA','JURIDICO')
)
select
  coalesce(cl.sector, 'Sin clasificar') as sector,
  sum(c.saldo_insoluto) as exposicion,
  round(
    (sum(c.saldo_insoluto) / nullif(totals.cartera_total, 0))::numeric * 100,
    2
  ) as pct_cartera,
  count(*) as creditos
from public.creditos c
join public.clientes cl on cl.id = c.cliente_id
cross join totals
where c.estatus_codigo in ('VIGENTE','MORA','JURIDICO')
group by cl.sector, totals.cartera_total
order by exposicion desc;

-- ---------------------------------------------------------------------
-- VISTA: concentración por tipo de crédito
-- ---------------------------------------------------------------------

create or replace view public.v_concentracion_tipo as
with totals as (
  select sum(saldo_insoluto) as cartera_total
  from public.creditos
  where estatus_codigo in ('VIGENTE','MORA','JURIDICO')
)
select
  tc.codigo,
  tc.nombre as tipo,
  sum(c.saldo_insoluto) as exposicion,
  round(
    (sum(c.saldo_insoluto) / nullif(totals.cartera_total, 0))::numeric * 100,
    2
  ) as pct_cartera,
  count(*) as creditos
from public.creditos c
join public.tipos_credito tc on tc.codigo = c.tipo_codigo
cross join totals
where c.estatus_codigo in ('VIGENTE','MORA','JURIDICO')
group by tc.codigo, tc.nombre, totals.cartera_total
order by exposicion desc;

-- ---------------------------------------------------------------------
-- VISTA: vintage por trimestre de originación
-- ---------------------------------------------------------------------

create or replace view public.v_vintage_originacion as
select
  to_char(fecha_inicio, 'YYYY-Q') as cosecha,
  count(*) as creditos,
  sum(monto_original) as monto_originado,
  sum(saldo_insoluto) as saldo_actual,
  sum(case when estatus_codigo in ('MORA','JURIDICO') then saldo_insoluto else 0 end) as saldo_problemas,
  round(
    (sum(case when estatus_codigo in ('MORA','JURIDICO') then saldo_insoluto else 0 end)
      / nullif(sum(saldo_insoluto), 0))::numeric * 100,
    2
  ) as npl_ratio_pct
from public.creditos
where estatus_codigo in ('VIGENTE','MORA','JURIDICO')
group by cosecha
order by cosecha desc;

commit;
