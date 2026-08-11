-- =====================================================================
-- Ledgerly — 0015 Histórico de ~6 meses
-- El ledger y los pagos solo tenían un snapshot del día (más 3 meses de
-- pagos relativos a la fecha de corte) y el pipeline de solicitudes
-- estaba concentrado en una ventana de 10 días. Para que el proyecto se
-- vea poblado como una operación real con historia, se agregan:
--   · 3 meses adicionales de pagos (llegando a 6 meses en total,
--     junto con los ya sembrados por 0005_seed_provisiones_pagos.sql)
--   · 5 cortes mensuales adicionales de ledger (devengo, cobro, costo
--     financiero y provisión), agregados a partir de la cartera real
--   · 8 solicitudes adicionales repartidas en los últimos ~5 meses,
--     usando los mismos clientes ya existentes (renombrados)
-- =====================================================================

-- ---------------------------------------------------------------------
-- PAGOS: 3 meses adicionales (mismos criterios que la migración 0005)
-- ---------------------------------------------------------------------

insert into public.pagos (
  credito_id, fecha_pago, monto_capital, monto_intereses, monto_iva,
  monto_total, cep_spei, banco_origen_id, conciliado, fecha_conciliacion
)
select
  c.id,
  ((date_trunc('month', current_date) - (n * interval '1 month'))::date + 4),
  round(c.monto_original / greatest(c.plazo_meses, 1), 2),
  round(coalesce(c.saldo_insoluto, c.monto_original) * c.tasa_anual / 12, 2),
  round(coalesce(c.saldo_insoluto, c.monto_original) * c.tasa_anual / 12 * 0.16, 2),
  round(
    c.monto_original / greatest(c.plazo_meses, 1) +
    coalesce(c.saldo_insoluto, c.monto_original) * c.tasa_anual / 12 * 1.16,
    2
  ),
  'MBAN01' || lpad((500 + row_number() over (order by c.id, n))::text, 18, '0'),
  (select id from public.bancos order by id limit 1),
  true,
  now() - (n || ' days')::interval
from public.creditos c
cross join generate_series(3, 5) as n
where c.estatus_codigo in ('VIGENTE', 'MORA');

-- ---------------------------------------------------------------------
-- LEDGER: 5 cortes mensuales adicionales (devengo + cobro + costo
-- financiero + provisión), escalados sobre la cartera vigente real.
-- ---------------------------------------------------------------------

do $$
declare
  mes int;
  factor numeric;
  bid uuid;
  fecha_corte date;
  base_interes numeric;
  base_iva numeric;
  costo_financiero numeric;
  provision numeric;
begin
  for mes in reverse 5..1 loop
    factor := 0.90 + (5 - mes) * 0.025;  -- 0.90, 0.925, 0.95, 0.975, 1.00 → tendencia de crecimiento hacia el corte actual
    fecha_corte := (date_trunc('month', current_date) - (mes * interval '1 month'))::date + 9;
    bid := gen_random_uuid();

    select round(coalesce(sum(saldo_insoluto * tasa_anual / 12), 0) * factor, 2)
      into base_interes
      from public.creditos
      where estatus_codigo = 'VIGENTE';

    base_iva := round(base_interes * 0.16, 2);
    costo_financiero := round(580000 * factor, 2);
    provision := round(420000 * factor, 2);

    insert into public.asientos_contables (batch_id, fecha, descripcion, cuenta_codigo, debe, haber)
    values
      (bid, fecha_corte, 'Devengo de intereses del periodo', '1.04', base_interes, 0),
      (bid, fecha_corte, 'Devengo de intereses del periodo', '4.01', 0, base_interes),
      (bid, fecha_corte, 'Cobro de cartera del periodo', '1.01', base_interes + base_iva, 0),
      (bid, fecha_corte, 'Cobro de cartera del periodo', '1.04', 0, base_interes),
      (bid, fecha_corte, 'Cobro de cartera del periodo', '2.04', 0, base_iva),
      (bid, fecha_corte, 'Costo financiero Meridian Capital Bank del periodo', '5.01', costo_financiero, 0),
      (bid, fecha_corte, 'Costo financiero Meridian Capital Bank del periodo', '1.01', 0, costo_financiero),
      (bid, fecha_corte, 'Provisión cartera vigente del periodo', '5.02', provision, 0),
      (bid, fecha_corte, 'Provisión cartera vigente del periodo', '1.08', 0, provision);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- SOLICITUDES: 8 adicionales repartidas en los últimos ~5 meses
-- (mismos clientes ya sembrados, distintas etapas según antigüedad)
-- ---------------------------------------------------------------------

insert into public.solicitudes (
  id, folio, cliente_id, monto_solicitado, plazo_meses,
  tasa_propuesta, benchmark, etapa_codigo, analista,
  centro_costo, fecha_solicitud, score_total, riesgo_clasificacion
) values
  ('77777777-7777-7777-7777-000000000101', 'SOL-2026-00101',
   '11111111-1111-1111-1111-00000000001B', 4200000, 24, 0.1720, 'TIIE 28d + 2.8%',
   'DISPERSADO', 'Carlos Ruiz', 'CC-NORTE',
   ((date_trunc('month', current_date) - interval '5 months')::date + 9), 81, 'BAJO'),

  ('77777777-7777-7777-7777-000000000102', 'SOL-2026-00102',
   '11111111-1111-1111-1111-00000000001C', 1800000, 12, 0.1950, 'TIIE 28d + 4.5%',
   'RECHAZADO', 'Juan Pérez', 'CC-CENTRO',
   ((date_trunc('month', current_date) - interval '5 months')::date + 24), 55, 'NO_ACEPTABLE'),

  ('77777777-7777-7777-7777-000000000103', 'SOL-2026-00103',
   '11111111-1111-1111-1111-000000000009', 2900000, 30, 0.1680, 'TIIE 28d + 2.3%',
   'DISPERSADO', 'María Gómez', 'CC-OCC',
   ((date_trunc('month', current_date) - interval '4 months')::date + 11), 84, 'BAJO'),

  ('77777777-7777-7777-7777-000000000104', 'SOL-2026-00104',
   '11111111-1111-1111-1111-000000000020', 3600000, 24, 0.1790, 'TIIE 28d + 3.3%',
   'APROBADO', 'Ana López', 'CC-CENTRO',
   ((date_trunc('month', current_date) - interval '2 months')::date + 7), 77, 'MEDIO'),

  ('77777777-7777-7777-7777-000000000105', 'SOL-2026-00105',
   '11111111-1111-1111-1111-000000000021', 2100000, 18, 0.1850, 'TIIE 28d + 3.8%',
   'COMITE', 'Carlos Ruiz', 'CC-NORTE',
   ((date_trunc('month', current_date) - interval '2 months')::date + 21), 73, 'MEDIO'),

  ('77777777-7777-7777-7777-000000000106', 'SOL-2026-00106',
   '11111111-1111-1111-1111-000000000002', 4800000, 20, 0.1690, 'TIIE 28d + 2.4%',
   'ANALISIS', 'Juan Pérez', 'CC-CENTRO',
   ((date_trunc('month', current_date) - interval '1 month')::date + 14), 80, 'BAJO'),

  ('77777777-7777-7777-7777-000000000107', 'SOL-2026-00107',
   '11111111-1111-1111-1111-00000000001E', 1500000, 12, 0.1920, 'TIIE 28d + 4.2%',
   'PENDIENTE', 'María Gómez', 'CC-SUR',
   ((date_trunc('month', current_date) - interval '1 month')::date + 29), 68, 'MEDIO'),

  ('77777777-7777-7777-7777-000000000108', 'SOL-2026-00108',
   '11111111-1111-1111-1111-00000000001D', 3300000, 24, 0.1740, 'TIIE 28d + 2.9%',
   'EVALUACION', 'Ana López', 'CC-BAJÍO',
   (current_date - 3), null, null);
