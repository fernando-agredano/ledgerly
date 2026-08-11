-- =====================================================================
-- Ledgerly — Seed suplementario
-- Datos demo adicionales para que la UI luzca completa:
--   · Más solicitudes en pipeline
--   · Documentos del expediente hero
--   · Verificaciones PLD detalladas
--   · Comité y condiciones aprobadas
--   · Vista derivada para alertas de cobranza
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Más solicitudes en pipeline (para que la bandeja luzca llena)
-- ---------------------------------------------------------------------

insert into public.clientes (id, nombre, razon_social, rfc, tipo, sector) values
  ('11111111-1111-1111-1111-00000000001A', 'Constructora del Bajío S.A. de C.V.', 'Constructora del Bajío S.A. de C.V.',  'CBA160101K12','PYME','Construcción'),
  ('11111111-1111-1111-1111-00000000001B', 'Grupo Comercial del Norte',           'Grupo Comercial del Norte S.A.',       'GCN150812L33','PYME','Comercio'),
  ('11111111-1111-1111-1111-00000000001C', 'Alimentos Selectos S.A.',             'Alimentos Selectos S.A. de C.V.',      'ASE180920M44','PYME','Alimentos'),
  ('11111111-1111-1111-1111-00000000001D', 'Manufacturas Industriales XYZ',       'Manufacturas Industriales XYZ S.A.',   'MIX140505P55','PYME','Manufactura'),
  ('11111111-1111-1111-1111-00000000001E', 'Servicios Integrales SA',             'Servicios Integrales S.A. de C.V.',    'SIS170310R66','PYME','Servicios'),
  ('11111111-1111-1111-1111-00000000001F', 'Logística del Pacífico',              'Logística del Pacífico S.A. de C.V.',  'LDP190702T77','PYME','Logística'),
  ('11111111-1111-1111-1111-000000000020', 'Distribuidora Central',               'Distribuidora Central S.A. de C.V.',   'DCE160815V88','PYME','Distribución'),
  ('11111111-1111-1111-1111-000000000021', 'Textiles del Norte',                  'Textiles del Norte S.A.',              'TDN150405W99','PYME','Textil');

-- Reasignar la solicitud hero a "Constructora del Bajío" (consistencia con el mockup)
update public.solicitudes
   set cliente_id = '11111111-1111-1111-1111-00000000001A'
 where folio = 'SOL-2026-00128';

insert into public.solicitudes (
  id, folio, cliente_id, monto_solicitado, plazo_meses,
  tasa_propuesta, benchmark, etapa_codigo, analista,
  centro_costo, fecha_solicitud,
  score_total, riesgo_clasificacion
) values
  ('77777777-7777-7777-7777-000000000002', 'SOL-2026-00127',
   '11111111-1111-1111-1111-00000000001B', 7300000, 36, 0.1750, 'TIIE 28d + 3.0%',
   'ANALISIS', 'Carlos Ruiz', 'CC-NORTE', '2026-05-25', 82, 'BAJO'),

  ('77777777-7777-7777-7777-000000000003', 'SOL-2026-00126',
   '11111111-1111-1111-1111-00000000001C', 2500000, 18, 0.1820, 'TIIE 28d + 3.5%',
   'PENDIENTE', 'María Gómez', 'CC-CENTRO', '2026-05-24', 71, 'MEDIO'),

  ('77777777-7777-7777-7777-000000000004', 'SOL-2026-00125',
   '11111111-1111-1111-1111-00000000001D', 5500000, 30, 0.1620, 'TIIE 28d + 1.5%',
   'EVALUACION', 'Ana López', 'CC-BAJÍO', '2026-05-23', 86, 'BAJO'),

  ('77777777-7777-7777-7777-000000000005', 'SOL-2026-00124',
   '11111111-1111-1111-1111-00000000001E', 4000000, 24, 0.1700, 'TIIE 28d + 2.5%',
   'EVALUACION', 'Juan Pérez', 'CC-SUR', '2026-05-22', 74, 'MEDIO'),

  ('77777777-7777-7777-7777-000000000006', 'SOL-2026-00123',
   '11111111-1111-1111-1111-00000000001F', 6200000, 36, 0.1650, 'TIIE 28d + 2.0%',
   'COMITE', 'Carlos Ruiz', 'CC-OCC', '2026-05-20', 80, 'BAJO'),

  ('77777777-7777-7777-7777-000000000007', 'SOL-2026-00122',
   '11111111-1111-1111-1111-000000000020', 1800000, 12, 0.1900, 'TIIE 28d + 4.0%',
   'APROBADO', 'María Gómez', 'CC-CENTRO', '2026-05-18', 79, 'MEDIO'),

  ('77777777-7777-7777-7777-000000000008', 'SOL-2026-00121',
   '11111111-1111-1111-1111-000000000021', 3500000, 24, 0.1780, 'TIIE 28d + 3.2%',
   'RECHAZADO', 'Juan Pérez', 'CC-NORTE', '2026-05-17', 58, 'NO_ACEPTABLE');

-- ---------------------------------------------------------------------
-- Documentos del expediente hero (SOL-2026-00128)
-- ---------------------------------------------------------------------

insert into public.documentos (solicitud_id, nombre, archivo_filename, estatus, fecha_carga) values
  ('77777777-7777-7777-7777-000000000001', 'Acta constitutiva',         'Acta_Constitutiva.pdf', 'VALIDO',    '2026-05-15 10:00:00'),
  ('77777777-7777-7777-7777-000000000001', 'Poder representante',       'Poder_rep.pdf',         'VALIDO',    '2026-05-15 10:30:00'),
  ('77777777-7777-7777-7777-000000000001', 'Comprobante domicilio',     'Domicilio.pdf',         'VALIDO',    '2026-05-16 09:00:00'),
  ('77777777-7777-7777-7777-000000000001', 'Estados de cuenta',         'Cuenta_banco.zip',      'VALIDO',    '2026-05-17 14:20:00'),
  ('77777777-7777-7777-7777-000000000001', 'Estados financieros (3m)',  'EEFF_3m.pdf',           'PENDIENTE', null),
  ('77777777-7777-7777-7777-000000000001', 'Opinión 32D SAT',           'Opinion_32D.pdf',       'VALIDO',    '2026-05-18 11:45:00');

-- ---------------------------------------------------------------------
-- Verificaciones PLD del expediente hero
-- ---------------------------------------------------------------------

insert into public.pld_verificaciones (solicitud_id, lista, resultado, encontrado) values
  ('77777777-7777-7777-7777-000000000001', 'OFAC',                     'No encontrado', false),
  ('77777777-7777-7777-7777-000000000001', 'ONU',                      'No encontrado', false),
  ('77777777-7777-7777-7777-000000000001', 'SAT_69B',                  'No encontrado', false),
  ('77777777-7777-7777-7777-000000000001', 'PEP',                      'No encontrado', false),
  ('77777777-7777-7777-7777-000000000001', 'BENEFICIARIO_CONTROLADOR', 'Identificado',  true),
  ('77777777-7777-7777-7777-000000000001', 'NOTICIAS_NEGATIVAS',       'Sin hallazgos', false);

-- Actualizar scores específicos del expediente hero
update public.solicitudes
   set score_kyc          = 85,
       score_capacidad    = 72,
       score_garantia     = 80,
       score_legal        = 75,
       score_rentabilidad = 82,
       decision_analista  = 'APROBAR_CONDICIONES',
       comentarios_analista = 'La empresa muestra estabilidad en sus ventas y márgenes. Se recomienda solicitar mayor detalle de contratos con clientes principales. DSCR 1.42x y cobertura de garantía 2.24x se mantienen sobre el umbral institucional.'
 where folio = 'SOL-2026-00128';

-- ---------------------------------------------------------------------
-- Comité — aprobaciones para el expediente hero
-- ---------------------------------------------------------------------

insert into public.comite_aprobaciones (solicitud_id, miembro, cargo, voto, comentario) values
  ('77777777-7777-7777-7777-000000000001', 'María Gómez',  'Presidente', 'APRUEBA', 'Aprueba con condiciones precedentes'),
  ('77777777-7777-7777-7777-000000000001', 'Carlos Ruiz',  'Vocal',      'APRUEBA', 'Aprueba'),
  ('77777777-7777-7777-7777-000000000001', 'Juan Pérez',   'Vocal',      'APRUEBA', 'Aprueba');

-- ---------------------------------------------------------------------
-- Condiciones aprobadas para el expediente hero
-- ---------------------------------------------------------------------

insert into public.condiciones_aprobadas (solicitud_id, descripcion) values
  ('77777777-7777-7777-7777-000000000001', 'DSCR mínimo 1.25x'),
  ('77777777-7777-7777-7777-000000000001', 'EEFF cada 6 meses'),
  ('77777777-7777-7777-7777-000000000001', 'Cobertura garantía mínima 2.0x'),
  ('77777777-7777-7777-7777-000000000001', 'Seguro de daños sobre inmueble'),
  ('77777777-7777-7777-7777-000000000001', 'Prohibición de dividendos extraordinarios');

-- ---------------------------------------------------------------------
-- Asientos contables transaccionales (eventos del mes — flujo)
-- ---------------------------------------------------------------------

with batch as (select gen_random_uuid() as bid)
insert into public.asientos_contables (batch_id, fecha, descripcion, cuenta_codigo, debe, haber)
select bid, '2026-05-30'::date, 'Devengo intereses Vitalcore', '1.04', 100000.00, 0 from batch
union all
select bid, '2026-05-30'::date, 'Devengo intereses Vitalcore', '4.01', 0, 100000.00 from batch
union all
select bid, '2026-05-30'::date, 'Cobro mensualidad Vitalcore', '1.01', 116000.00, 0 from batch
union all
select bid, '2026-05-30'::date, 'Cobro mensualidad Vitalcore', '1.04', 0, 100000.00 from batch
union all
select bid, '2026-05-30'::date, 'Cobro mensualidad Vitalcore', '2.04', 0,  16000.00 from batch
union all
select bid, '2026-05-30'::date, 'Provisión cartera vigente 1%', '5.02',  434700.00, 0 from batch
union all
select bid, '2026-05-30'::date, 'Provisión cartera vigente 1%', '1.08', 0, 434700.00 from batch;

-- ---------------------------------------------------------------------
-- VISTA: alertas de cobranza (deriva de creditos + cartera_vencida)
-- ---------------------------------------------------------------------

create or replace view public.v_alertas_cobranza as
select
  c.id            as credito_id,
  c.contrato_numero,
  cl.id           as cliente_id,
  cl.nombre       as empresa,
  c.dias_atraso,
  c.saldo_insoluto,
  c.estatus_codigo,
  case
    when c.dias_atraso between 1 and 7   then 'Mora temprana'
    when c.dias_atraso between 8 and 30  then 'Cobranza inicial'
    when c.dias_atraso between 31 and 60 then 'Cobranza intensiva'
    when c.dias_atraso > 60              then 'Jurídica (60+ días)'
    else null
  end as bucket,
  -- Importe vencido aproximado (pago mensual + penalidad ×2)
  round(coalesce(c.cuota_mensual, c.saldo_insoluto * (c.tasa_anual/12) * 1.16), 2) as importe_vencido_estimado
from public.creditos c
join public.clientes cl on cl.id = c.cliente_id
where c.dias_atraso > 0 or c.estatus_codigo in ('MORA','JURIDICO');

-- ---------------------------------------------------------------------
-- VISTA: agregado por bucket para KPIs de cobranza
-- ---------------------------------------------------------------------

create or replace view public.v_cobranza_buckets as
select
  bucket,
  count(*) as creditos,
  sum(importe_vencido_estimado) as total_vencido
from public.v_alertas_cobranza
where bucket is not null
group by bucket;

-- ---------------------------------------------------------------------
-- VISTA: distribución de la cartera por etapa para el dashboard
-- ---------------------------------------------------------------------

create or replace view public.v_distribucion_etapa as
with conteos as (
  select
    sum(case when s.etapa_codigo in ('EVALUACION','ANALISIS') then 1 else 0 end) as en_evaluacion,
    sum(case when s.etapa_codigo = 'APROBADO'  then 1 else 0 end)                as aprobado,
    sum(case when s.etapa_codigo = 'PENDIENTE' then 1 else 0 end)                as pendiente
  from public.solicitudes s
),
creditos as (
  select
    sum(case when estatus_codigo = 'VIGENTE'   then 1 else 0 end) as desembolsado,
    sum(case when estatus_codigo in ('MORA','JURIDICO') then 1 else 0 end) as en_cobranza,
    sum(case when estatus_codigo = 'LIQUIDADO' then 1 else 0 end) as liquidado
  from public.creditos
)
select
  conteos.en_evaluacion + conteos.pendiente as en_evaluacion,
  conteos.aprobado,
  creditos.desembolsado,
  creditos.en_cobranza,
  creditos.liquidado
from conteos, creditos;

-- ---------------------------------------------------------------------
-- VISTA: aging de cartera por días de atraso (para chart de vencimiento)
-- ---------------------------------------------------------------------

create or replace view public.v_cartera_aging as
select
  case
    when dias_atraso = 0                  then '0-30'
    when dias_atraso between 1 and 30     then '0-30'
    when dias_atraso between 31 and 60    then '31-60'
    when dias_atraso between 61 and 90    then '61-90'
    else                                       '90+'
  end as rango,
  sum(saldo_insoluto) as valor
from public.creditos
where estatus_codigo in ('VIGENTE','MORA','JURIDICO')
group by rango
order by rango;

commit;
