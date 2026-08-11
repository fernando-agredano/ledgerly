-- =====================================================================
-- VECTIS / HSI — 0005 Vistas y funciones derivadas
-- =====================================================================

-- ---------------------------------------------------------------------
-- VISTA: créditos con datos del cliente (consultable directamente desde el front)
-- ---------------------------------------------------------------------

create or replace view public.v_creditos_full as
select
  cr.id,
  cr.contrato_numero,
  cr.cliente_id,
  cl.nombre as cliente_nombre,
  cl.rfc as cliente_rfc,
  cl.tipo as cliente_tipo,
  cr.tipo_codigo,
  tc.nombre as tipo_nombre,
  tc.aplica_iva,
  cr.monto_original,
  cr.moneda,
  cr.tasa_anual,
  cr.tasa_mensual,
  cr.plazo_meses,
  cr.fecha_inicio,
  cr.fecha_vencimiento,
  cr.fecha_dispersion,
  cr.cuota_mensual,
  cr.estatus_codigo,
  ec.nombre as estatus_nombre,
  cr.saldo_insoluto,
  cr.dias_atraso,
  cr.intercompania,
  cr.cobertura_garantia,
  cr.dscr_actual,
  cr.score_comportamiento,
  cr.created_at
from public.creditos cr
join public.clientes cl on cl.id = cr.cliente_id
join public.tipos_credito tc on tc.codigo = cr.tipo_codigo
join public.estatus_credito ec on ec.codigo = cr.estatus_codigo;

-- ---------------------------------------------------------------------
-- VISTA: cartera operativa mensual
--   - intereses devengados de créditos vivos (con IVA si aplica el tipo)
--   - rentas mensuales de arrendamientos vivos (con IVA)
-- Esto reproduce la tabla "CARTERA OPERATIVA" del PDF 1 sin duplicar datos.
-- ---------------------------------------------------------------------

create or replace view public.v_cartera_operativa_mensual as
-- Componente: créditos (interés mensual sobre saldo insoluto)
select
  cr.id as fuente_id,
  'CREDITO'::text as origen,
  cr.contrato_numero,
  cr.cliente_id,
  cl.nombre as cliente_nombre,
  case
    when cr.tipo_codigo = 'INVERSION' then 'Inversión'
    when cr.tipo_codigo in ('SIMPLE','REVOLVENTE','ARRENDAMIENTO_F') then 'Financiamiento'
    else 'Otro'
  end as tipo,
  round(coalesce(cr.saldo_insoluto, cr.monto_original) * (cr.tasa_anual / 12), 2) as ingreso_sin_iva,
  case
    when tc.aplica_iva then round(coalesce(cr.saldo_insoluto, cr.monto_original) * (cr.tasa_anual / 12) * 0.16, 2)
    else 0
  end as iva,
  case
    when tc.aplica_iva then round(coalesce(cr.saldo_insoluto, cr.monto_original) * (cr.tasa_anual / 12) * 1.16, 2)
    else round(coalesce(cr.saldo_insoluto, cr.monto_original) * (cr.tasa_anual / 12), 2)
  end as ingreso_con_iva
from public.creditos cr
join public.clientes cl on cl.id = cr.cliente_id
join public.tipos_credito tc on tc.codigo = cr.tipo_codigo
where cr.estatus_codigo in ('VIGENTE','MORA')

union all

-- Componente: arrendamientos (renta fija mensual con IVA)
select
  ca.id as fuente_id,
  'ARRENDAMIENTO'::text as origen,
  ca.contrato_numero,
  ca.arrendatario_id as cliente_id,
  cl.nombre as cliente_nombre,
  'Arrendamiento'::text as tipo,
  ca.monto_mensual_sin_iva as ingreso_sin_iva,
  ca.iva_mensual as iva,
  ca.monto_mensual_con_iva as ingreso_con_iva
from public.contratos_arrendamiento ca
join public.clientes cl on cl.id = ca.arrendatario_id
where ca.estatus = 'VIGENTE';

-- ---------------------------------------------------------------------
-- VISTA: KPIs del dashboard ejecutivo
-- ---------------------------------------------------------------------

create or replace view public.v_dashboard_kpis as
with
  cartera as (
    select
      sum(case when estatus_codigo in ('VIGENTE','MORA') then saldo_insoluto else 0 end) as cartera_total,
      sum(case when estatus_codigo = 'VIGENTE' then saldo_insoluto else 0 end) as cartera_vigente,
      sum(case when estatus_codigo = 'JURIDICO' then saldo_insoluto else 0 end) as cartera_juridico,
      count(*) filter (where estatus_codigo in ('VIGENTE','MORA','JURIDICO')) as total_creditos,
      count(*) filter (where estatus_codigo = 'JURIDICO') as creditos_juridico
    from public.creditos
  ),
  caja as (
    select sum(saldo_mxn) as efectivo_total
    from public.cuentas_bancarias
  ),
  fondeo as (
    select sum(saldo_mxn) as deuda_total
    from public.fuentes_fondeo
  )
select
  cartera.cartera_total,
  cartera.cartera_vigente,
  cartera.cartera_juridico,
  case
    when cartera.cartera_total > 0 then
      round((cartera.cartera_juridico / cartera.cartera_total)::numeric * 100, 2)
    else 0
  end as ipm_pct,
  cartera.total_creditos,
  cartera.creditos_juridico,
  caja.efectivo_total,
  fondeo.deuda_total
from cartera, caja, fondeo;

-- ---------------------------------------------------------------------
-- VISTA: capital invertido y distribuido (tipo PDF 1)
-- ---------------------------------------------------------------------

create or replace view public.v_capital_resumen as
with
  activos_total as (
    select coalesce(sum(inversion_compra), 0) as total
    from public.activos
    where estatus = 'ACTIVO'
  ),
  cartera_vigente as (
    select coalesce(sum(saldo_insoluto), 0) as total
    from public.creditos
    where estatus_codigo in ('VIGENTE','MORA')
  ),
  cartera_npl as (
    select coalesce(sum(saldo_vencido), 0) as total
    from public.cartera_vencida
    where estatus_legal not in ('CASTIGADO','RECUPERADO')
  )
select
  activos_total.total as activos_productivos,
  cartera_vigente.total as cartera_vigente,
  (activos_total.total + cartera_vigente.total) as capital_invertido_operacion,
  cartera_npl.total as cartera_vencida,
  (activos_total.total + cartera_vigente.total + cartera_npl.total) as capital_distribuido
from activos_total, cartera_vigente, cartera_npl;

-- ---------------------------------------------------------------------
-- FUNCIÓN: generar tabla de amortización (Crédito Simple)
-- Replica la lógica del PDF 2 — uso típico:
--   select public.generar_tabla_amortizacion('uuid-credito');
-- ---------------------------------------------------------------------

create or replace function public.generar_tabla_amortizacion(p_credito_id uuid)
returns int
language plpgsql
as $$
declare
  v_credito record;
  v_saldo numeric(18, 2);
  v_cuota numeric(18, 2);
  v_intereses numeric(18, 2);
  v_iva numeric(18, 2);
  v_capital numeric(18, 2);
  v_tasa_mensual numeric(8, 6);
  v_fecha date;
  v_iva_rate numeric := 0.16;
  i int;
  v_aplica_iva boolean;
begin
  select cr.*, tc.aplica_iva
    into v_credito
    from public.creditos cr
    join public.tipos_credito tc on tc.codigo = cr.tipo_codigo
    where cr.id = p_credito_id;

  if not found then
    raise exception 'Crédito % no encontrado', p_credito_id;
  end if;

  if v_credito.tipo_codigo not in ('SIMPLE', 'ARRENDAMIENTO_F') then
    raise exception 'Solo se genera amortización para Crédito Simple o Arrendamiento Financiero (tipo actual: %)', v_credito.tipo_codigo;
  end if;

  -- Limpiar tabla previa
  delete from public.tabla_amortizacion where credito_id = p_credito_id;

  v_saldo := v_credito.monto_original;
  v_tasa_mensual := v_credito.tasa_anual / 12;
  v_aplica_iva := v_credito.aplica_iva;

  -- Cuota fija (sistema francés, sólo capital + interés sin IVA)
  v_cuota := round(
    v_saldo * (v_tasa_mensual / (1 - power(1 + v_tasa_mensual, -v_credito.plazo_meses))),
    2
  );

  for i in 1..v_credito.plazo_meses loop
    v_intereses := round(v_saldo * v_tasa_mensual, 2);
    v_iva := case when v_aplica_iva then round(v_intereses * v_iva_rate, 2) else 0 end;
    v_capital := round(v_cuota - v_intereses, 2);

    -- Ajuste de redondeo en última cuota
    if i = v_credito.plazo_meses then
      v_capital := v_saldo;
      v_cuota := v_capital + v_intereses;
    end if;

    v_fecha := (coalesce(v_credito.fecha_dispersion, v_credito.fecha_inicio) + (interval '1 month' * i))::date;

    insert into public.tabla_amortizacion (
      credito_id, periodo, fecha_pago,
      saldo_inicial, cuota, intereses, iva_intereses,
      amortizacion_capital, saldo_insoluto, pago_total
    ) values (
      p_credito_id, i, v_fecha,
      v_saldo, v_cuota, v_intereses, v_iva,
      v_capital, round(v_saldo - v_capital, 2), round(v_cuota + v_iva, 2)
    );

    v_saldo := round(v_saldo - v_capital, 2);
  end loop;

  -- Actualizar cuota_mensual en el crédito
  update public.creditos
    set cuota_mensual = v_cuota
    where id = p_credito_id;

  return v_credito.plazo_meses;
end;
$$;

-- ---------------------------------------------------------------------
-- FUNCIÓN: calcular provisiones (modelo simple por bucket — PDF spec)
-- ---------------------------------------------------------------------

create or replace function public.calcular_provisiones(p_fecha_corte date default current_date)
returns int
language plpgsql
as $$
declare
  v_count int := 0;
  rec record;
  v_bucket text;
  v_tasa numeric(5, 4);
begin
  delete from public.provisiones where fecha_corte = p_fecha_corte;

  for rec in
    select id, saldo_insoluto, dias_atraso
    from public.creditos
    where estatus_codigo in ('VIGENTE','MORA','JURIDICO')
      and saldo_insoluto > 0
  loop
    if rec.dias_atraso = 0 then
      v_bucket := 'VIGENTE';     v_tasa := 0.0100;
    elsif rec.dias_atraso between 1 and 30 then
      v_bucket := '1_30';        v_tasa := 0.0500;
    elsif rec.dias_atraso between 31 and 60 then
      v_bucket := '31_60';       v_tasa := 0.1500;
    elsif rec.dias_atraso between 61 and 90 then
      v_bucket := '61_90';       v_tasa := 0.3500;
    else
      v_bucket := '90_PLUS';     v_tasa := 0.7500;
    end if;

    insert into public.provisiones (
      fecha_corte, credito_id, bucket, saldo, tasa_provision, monto_provision
    ) values (
      p_fecha_corte, rec.id, v_bucket, rec.saldo_insoluto, v_tasa,
      round(rec.saldo_insoluto * v_tasa, 2)
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------
-- VISTA: resumen contable del libro mayor (cuadre debe/haber)
-- ---------------------------------------------------------------------

create or replace view public.v_libro_mayor as
select
  cuenta_codigo,
  cc.nombre as cuenta_nombre,
  cc.naturaleza,
  sum(debe) as total_debe,
  sum(haber) as total_haber,
  sum(debe) - sum(haber) as saldo_deudor
from public.asientos_contables a
join public.cuentas_contables cc on cc.codigo = a.cuenta_codigo
group by cuenta_codigo, cc.nombre, cc.naturaleza
order by cuenta_codigo;
