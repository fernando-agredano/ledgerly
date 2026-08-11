-- =====================================================================
-- VECTIS / HSI — 0011 Datos reales para Provisiones y Pagos
-- Los reportes de "Provisiones y reservas", "IFRS 9 / ECL" y
-- "Conciliación SPEI" quedaban vacíos porque las tablas provisiones y
-- pagos nunca se poblaron en el seed original. Se calculan aquí a partir
-- de los créditos reales ya existentes (bucket de mora → tasa de
-- provisión institucional, la misma que se muestra en
-- Configuración > Parámetros), en vez de inventar cifras sueltas.
-- =====================================================================

insert into public.provisiones (fecha_corte, credito_id, bucket, saldo, tasa_provision, monto_provision)
select
  current_date,
  c.id,
  case
    when c.dias_atraso = 0 then 'VIGENTE'
    when c.dias_atraso <= 30 then '1_30'
    when c.dias_atraso <= 60 then '31_60'
    when c.dias_atraso <= 90 then '61_90'
    else '90_PLUS'
  end,
  coalesce(c.saldo_insoluto, c.monto_original),
  case
    when c.dias_atraso = 0 then 0.01
    when c.dias_atraso <= 30 then 0.05
    when c.dias_atraso <= 60 then 0.15
    when c.dias_atraso <= 90 then 0.35
    else 0.75
  end,
  round(
    coalesce(c.saldo_insoluto, c.monto_original) *
    (case
      when c.dias_atraso = 0 then 0.01
      when c.dias_atraso <= 30 then 0.05
      when c.dias_atraso <= 60 then 0.15
      when c.dias_atraso <= 90 then 0.35
      else 0.75
    end),
    2
  )
from public.creditos c
where c.estatus_codigo in ('VIGENTE', 'MORA', 'JURIDICO')
on conflict (fecha_corte, credito_id) do nothing;

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
  'MBAN01' || lpad((row_number() over (order by c.id, n))::text, 18, '0'),
  (select id from public.bancos order by id limit 1),
  (n > 0),
  case when n > 0 then now() - (n || ' days')::interval else null end
from public.creditos c
cross join generate_series(0, 2) as n
where c.estatus_codigo in ('VIGENTE', 'MORA')
limit 40;
