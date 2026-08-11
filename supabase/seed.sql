-- =====================================================================
-- Ledgerly — Seed de datos operativos iniciales
--   · Activos, cartera, fondeo, caja, NPL
--   · Tabla de amortización (PYME Piloto, LDG-000101)
-- =====================================================================
--
-- Este seed asume que ya se aplicaron las migraciones 0001-0006.
-- Para correrlo: psql contra la BD o Supabase Dashboard SQL Editor.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- CLIENTES
-- ---------------------------------------------------------------------

insert into public.clientes (id, nombre, razon_social, rfc, tipo, sector) values
  ('11111111-1111-1111-1111-000000000001', 'Norvento Arrendadora',    'Norvento Arrendadora S.A. de C.V.', 'NVA150505XX1', 'PYME',          'Servicios financieros / arrendamiento'),
  ('11111111-1111-1111-1111-000000000002', 'Grupo Solvex',            'Grupo Solvex S.A. de C.V.',    'GSV170820XX2', 'PYME',          'Tecnología'),
  ('11111111-1111-1111-1111-000000000003', 'VITALCORE, S.A.P.I. DE C.V.','Vitalcore S.A.P.I. de C.V.', 'VTC180310XX3', 'GRAN_EMPRESA',  'Salud'),
  ('11111111-1111-1111-1111-000000000004', 'KLARPAY, S.A. DE C.V.',   'Klarpay S.A. de C.V.',         'KLP190415XX4', 'PYME',          'Pagos / fintech'),
  ('11111111-1111-1111-1111-000000000005', 'ALTIRA CAPITAL',          'Altira Capital S.A. de C.V.',  'ALT200101XX5', 'INTERCOMPANIA', 'Holding intercompañía'),
  ('11111111-1111-1111-1111-000000000006', 'Coreinvest',              'Coreinvest S.A. de C.V.',      'CIV210202XX6', 'INTERCOMPANIA', 'Holding intercompañía'),
  ('11111111-1111-1111-1111-000000000007', 'Predios Claros',          'Predios Claros S.A. de C.V.',  'PCL220303XX7', 'INTERCOMPANIA', 'Holding intercompañía'),
  ('11111111-1111-1111-1111-000000000008', 'Nova Media Group',        'Nova Media Group S.A. de C.V.','NMG230404XX8', 'INTERCOMPANIA', 'Holding intercompañía'),
  ('11111111-1111-1111-1111-000000000009', 'Transportes Kaizen',      'Transportes Kaizen S.A. de C.V.','TKZ200505XX9','PYME',          'Logística'),
  ('11111111-1111-1111-1111-00000000000A', 'Vantage Tech',            'Vantage Tech Solutions S.A. de C.V.', 'VTS180606XXA', 'PYME',   'Tecnología / Videovigilancia'),
  ('11111111-1111-1111-1111-00000000000B', 'Municipio de Vega del Bosque', 'Municipio de Vega del Bosque', 'MVB-XXX', 'GOBIERNO',      'Sector público'),
  ('11111111-1111-1111-1111-00000000000C', 'Ceibal Holding',          'Ceibal Holding S.A. de C.V.',  'CBH210707XXB', 'INTERCOMPANIA', 'Holding intercompañía'),
  ('11111111-1111-1111-1111-00000000000D', 'PYME Piloto (plantilla)', 'PYME Piloto — Demostración',   'PPT260101XXC', 'PYME',          'Demo / amortización plantilla');

-- ---------------------------------------------------------------------
-- CRÉDITOS
-- ---------------------------------------------------------------------

insert into public.creditos (
  id, contrato_numero, cliente_id, tipo_codigo,
  monto_original, moneda, tasa_anual, plazo_meses,
  fecha_inicio, fecha_vencimiento, fecha_dispersion,
  estatus_codigo, saldo_insoluto, intercompania, notas
) values
  -- 1. Norvento Arrendadora
  ('22222222-2222-2222-2222-000000000001', 'LDG-NVA-001',
   '11111111-1111-1111-1111-000000000001', 'SIMPLE',
   7219992.00, 'MXN', 0.1611, 48,
   '2025-09-09', '2029-08-08', '2025-09-09',
   'VIGENTE', 7219992.00, false,
   'Arrendamiento a Norvento Arrendadora S.A. de C.V.'),

  -- 2. Grupo Solvex
  ('22222222-2222-2222-2222-000000000002', 'LDG-GSV-001',
   '11111111-1111-1111-1111-000000000002', 'INVERSION',
   5000000.00, 'MXN', 0.1875, 16,
   '2025-08-04', '2027-01-03', '2025-08-04',
   'VIGENTE', 5000000.00, false,
   'Inversión / mutuo simple'),

  -- 3. Vitalcore
  ('22222222-2222-2222-2222-000000000003', 'LDG-VTC-001',
   '11111111-1111-1111-1111-000000000003', 'SIMPLE',
   5000000.00, 'MXN', 0.2400, 24,
   '2025-08-01', '2027-07-30', '2025-08-01',
   'VIGENTE', 5000000.00, false,
   'Crédito simple a Vitalcore'),

  -- 4. Klarpay (01)
  ('22222222-2222-2222-2222-000000000004', 'LDG-KLP-001',
   '11111111-1111-1111-1111-000000000004', 'SIMPLE',
   2500000.00, 'MXN', 0.1875, 16,
   '2026-01-19', '2027-05-20', '2026-01-19',
   'VIGENTE', 2500000.00, false,
   'Crédito Klarpay tramo 1 (2.5 mdp)'),

  -- 5. Klarpay (02)
  ('22222222-2222-2222-2222-000000000005', 'LDG-KLP-002',
   '11111111-1111-1111-1111-000000000004', 'SIMPLE',
   1250000.00, 'MXN', 0.1875, 16,
   '2026-04-07', '2027-08-05', '2026-04-07',
   'VIGENTE', 1250000.00, false,
   'Crédito Klarpay tramo 2 (1.25 mdp)'),

  -- 6. Altira Capital — Revolvente intercompañía
  ('22222222-2222-2222-2222-000000000006', 'LDG-ALT-001',
   '11111111-1111-1111-1111-000000000005', 'REVOLVENTE',
   11500000.00, 'MXN', 0.1000, null,
   '2025-01-01', null, null,
   'VIGENTE', 11500000.00, true,
   'Crédito revolvente intercompañía Altira'),

  -- 7. Coreinvest — Préstamo intercompañía
  ('22222222-2222-2222-2222-000000000007', 'LDG-CIV-001',
   '11111111-1111-1111-1111-000000000006', 'INTERCOMPANIA',
   8000000.00, 'MXN', 0.0000, null,
   '2025-01-01', null, null,
   'VIGENTE', 8000000.00, true,
   'Préstamo intercompañía Coreinvest'),

  -- 8. Cartera vencida — Norvento Arrendadora contratos I011 + I018 + I037
  ('22222222-2222-2222-2222-000000000008', 'LDG-NVA-NPL',
   '11111111-1111-1111-1111-000000000001', 'SIMPLE',
   7002424.00, 'MXN', 0.1611, 48,
   '2024-01-01', '2028-01-01', '2024-01-01',
   'JURIDICO', 7002424.00, false,
   'Cartera vencida Norvento Arrendadora — contratos I011, I018, I037 — demanda en proceso'),

  -- 9. PYME Piloto — plantilla de amortización
  ('22222222-2222-2222-2222-00000000000A', 'LDG-000101',
   '11111111-1111-1111-1111-00000000000D', 'SIMPLE',
   3000000.00, 'MXN', 0.1600, 36,
   '2026-04-30', '2029-04-30', '2026-04-30',
   'VIGENTE', 3000000.00, false,
   'Crédito plantilla PYME Piloto — referencia para tabla de amortización institucional');

-- Días de atraso en NPL
update public.creditos set dias_atraso = 487 where id = '22222222-2222-2222-2222-000000000008';

-- ---------------------------------------------------------------------
-- ACTIVOS PRODUCTIVOS
-- ---------------------------------------------------------------------

insert into public.activos (id, descripcion, categoria, inversion_compra, esquema, arrendatario_id, valor_actual) values
  ('33333333-3333-3333-3333-000000000001', 'Camión de carga',                     'VEHICULO',       1020900.00, 'ARRENDAMIENTO_OPERATIVO', '11111111-1111-1111-1111-000000000009', 1020900.00),
  ('33333333-3333-3333-3333-000000000002', 'Vehículo eléctrico ejecutivo',        'VEHICULO',       1023800.00, 'ARRENDAMIENTO_OPERATIVO', '11111111-1111-1111-1111-000000000007', 1023800.00),
  ('33333333-3333-3333-3333-000000000003', 'Camioneta utilitaria (vehículo 1)',   'VEHICULO',        302400.00, 'ARRENDAMIENTO_OPERATIVO', '11111111-1111-1111-1111-00000000000A',  302400.00),
  ('33333333-3333-3333-3333-000000000004', 'Camioneta utilitaria (vehículo 2)',   'VEHICULO',        302400.00, 'ARRENDAMIENTO_OPERATIVO', '11111111-1111-1111-1111-00000000000A',  302400.00),
  ('33333333-3333-3333-3333-000000000005', 'Equipo de Cómputo — Vega del Bosque', 'EQUIPO_COMPUTO',21220676.00, 'ARRENDAMIENTO_OPERATIVO', '11111111-1111-1111-1111-00000000000B',21220676.00),
  ('33333333-3333-3333-3333-000000000006', 'Equipo de Cómputo — Vantage Tech',    'EQUIPO_COMPUTO',21081984.00, 'ARRENDAMIENTO_OPERATIVO', '11111111-1111-1111-1111-00000000000A',21081984.00);

-- ---------------------------------------------------------------------
-- CONTRATOS DE ARRENDAMIENTO
-- ---------------------------------------------------------------------

insert into public.contratos_arrendamiento (
  id, contrato_numero, arrendatario_id,
  fecha_inicio, plazo_meses, monto_mensual_sin_iva,
  estatus, notas
) values
  ('44444444-4444-4444-4444-000000000001', 'LDG-ARR-MVB-001', '11111111-1111-1111-1111-00000000000B',
   '2025-01-01', 60, 2798736.00, 'VIGENTE', 'Arrendamiento equipo cómputo Vega del Bosque'),

  ('44444444-4444-4444-4444-000000000002', 'LDG-ARR-VTS-CCTV1', '11111111-1111-1111-1111-00000000000A',
   '2025-01-01', 60, 1812846.00, 'VIGENTE', 'Vantage Tech — Proyecto videovigilancia vial (sistema 1)'),

  ('44444444-4444-4444-4444-000000000003', 'LDG-ARR-VTS-CCTV2', '11111111-1111-1111-1111-00000000000A',
   '2025-01-01', 60,  233672.00, 'VIGENTE', 'Vantage Tech — Proyecto videovigilancia vial (sistema 2)'),

  ('44444444-4444-4444-4444-000000000004', 'LDG-ARR-TKZ-001', '11111111-1111-1111-1111-000000000009',
   '2025-06-01', 36,   36043.00, 'VIGENTE', 'Arrendamiento camión de carga a Transportes Kaizen'),

  ('44444444-4444-4444-4444-000000000005', 'LDG-ARR-PCL-001', '11111111-1111-1111-1111-000000000007',
   '2025-06-01', 36,   39136.00, 'VIGENTE', 'Arrendamiento vehículo eléctrico a Predios Claros'),

  ('44444444-4444-4444-4444-000000000006', 'LDG-ARR-VTS-VEH1', '11111111-1111-1111-1111-00000000000A',
   '2025-06-01', 36,   10570.00, 'VIGENTE', 'Arrendamiento camioneta utilitaria vehículo 1 a Vantage Tech'),

  ('44444444-4444-4444-4444-000000000007', 'LDG-ARR-VTS-VEH2', '11111111-1111-1111-1111-00000000000A',
   '2025-06-01', 36,   10570.00, 'VIGENTE', 'Arrendamiento camioneta utilitaria vehículo 2 a Vantage Tech');

-- Junction table: vincular contratos ↔ activos
insert into public.contratos_arrendamiento_activos (contrato_id, activo_id) values
  ('44444444-4444-4444-4444-000000000001', '33333333-3333-3333-3333-000000000005'),
  ('44444444-4444-4444-4444-000000000002', '33333333-3333-3333-3333-000000000006'),
  ('44444444-4444-4444-4444-000000000003', '33333333-3333-3333-3333-000000000006'),
  ('44444444-4444-4444-4444-000000000004', '33333333-3333-3333-3333-000000000001'),
  ('44444444-4444-4444-4444-000000000005', '33333333-3333-3333-3333-000000000002'),
  ('44444444-4444-4444-4444-000000000006', '33333333-3333-3333-3333-000000000003'),
  ('44444444-4444-4444-4444-000000000007', '33333333-3333-3333-3333-000000000004');

-- ---------------------------------------------------------------------
-- FUENTES DE FONDEO
-- ---------------------------------------------------------------------

insert into public.fuentes_fondeo (
  id, prestamista, tipo, moneda, monto_linea, saldo_actual,
  tasa_referencia, spread, tipo_cambio, notas
) values
  ('55555555-5555-5555-5555-000000000001', 'Meridian Capital Bank', 'REVOLVENTE', 'MXN',
   80000000.00, 57826801.00, 'TIIE Fondeo', 0.0085, 1.00,
   'Línea revolvente Meridian Capital Bank en pesos'),

  ('55555555-5555-5555-5555-000000000002', 'Meridian Capital Bank', 'REVOLVENTE', 'USD',
    5000000.00,  2195000.00, 'SOFR Fondeo', 0.0085, 17.46,
   'Línea revolvente Meridian Capital Bank en dólares'),

  ('55555555-5555-5555-5555-000000000003', 'Ceibal Holding',        'INTERCOMPANIA', 'MXN',
    8000000.00,  8000000.00, null,         null,    1.00,
   'Préstamo intercompañía Ceibal Holding');

-- ---------------------------------------------------------------------
-- CUENTAS BANCARIAS (Efectivo y equivalentes)
-- ---------------------------------------------------------------------

insert into public.cuentas_bancarias (id, banco_id, alias, moneda, saldo, tipo_cambio, notas) values
  ('66666666-6666-6666-6666-000000000001',
   (select id from public.bancos where nombre = 'Banorte'),
   'Banorte MXN',  'MXN', 18000000.00, 1.00,    'Cuenta operativa principal MXN'),

  ('66666666-6666-6666-6666-000000000002',
   (select id from public.bancos where nombre = 'Banorte'),
   'Banorte USD',  'USD',    13022.00, 17.46,   'Cuenta operativa USD');

-- ---------------------------------------------------------------------
-- CARTERA VENCIDA (Norvento Arrendadora I011/I018/I037)
-- ---------------------------------------------------------------------

insert into public.cartera_vencida (
  credito_id, cliente_id, contratos_afectados,
  saldo_vencido, fecha_default, dias_mora,
  estatus_legal, notas
) values
  ('22222222-2222-2222-2222-000000000008',
   '11111111-1111-1111-1111-000000000001',
   'I011, I018, I037',
   7002424.00, '2025-01-15', 487,
   'DEMANDA_EN_PROCESO',
   'Norvento Arrendadora — tres contratos previos en demanda judicial. Garantía hipotecaria sujeta a remate.');

-- ---------------------------------------------------------------------
-- PIPELINE DEMO (solicitud hero ya en flujo, para alimentar la UI)
-- ---------------------------------------------------------------------

insert into public.solicitudes (
  id, folio, cliente_id, monto_solicitado, plazo_meses,
  tasa_propuesta, benchmark, etapa_codigo, analista,
  centro_costo, fecha_solicitud,
  score_total, score_kyc, score_capacidad, score_garantia,
  score_legal, score_rentabilidad, riesgo_clasificacion,
  ingresos_mensuales, ebitda_mensual, flujo_disponible, dscr,
  pld_resultado, pld_oficial, pld_fecha,
  garantia_tipo, garantia_ubicacion, garantia_valor_avaluo, cobertura_garantia
) values
  ('77777777-7777-7777-7777-000000000001',
   'SOL-2026-00128',
   '11111111-1111-1111-1111-000000000004',
   3000000.00, 24,
   0.1680, 'TIIE 28d + 2.25%', 'ANALISIS', 'Ana López',
   'CC-Centro', '2026-05-26',
   78, 85, 72, 80, 75, 82, 'MEDIO',
   1250000.00, 290000.00, 210000.00, 1.42,
   'BAJO', 'María Fernández', '2026-05-25 10:15',
   'Nave industrial', 'Av. Juan B. Pressedo 1234, Zapopan, Jalisco', 6720000.00, 2.24);

-- ---------------------------------------------------------------------
-- GENERAR TABLA DE AMORTIZACIÓN para los Créditos Simples
-- ---------------------------------------------------------------------

-- PYME Piloto (36 periodos, 16% anual, $3M, cuota $105,471.10)
select public.generar_tabla_amortizacion('22222222-2222-2222-2222-00000000000A');

-- Créditos simples (genera amortización completa para los activos)
select public.generar_tabla_amortizacion('22222222-2222-2222-2222-000000000001');  -- Norvento Arrendadora
select public.generar_tabla_amortizacion('22222222-2222-2222-2222-000000000003');  -- Vitalcore
select public.generar_tabla_amortizacion('22222222-2222-2222-2222-000000000004');  -- Klarpay-001
select public.generar_tabla_amortizacion('22222222-2222-2222-2222-000000000005');  -- Klarpay-002

-- ---------------------------------------------------------------------
-- CALCULAR PROVISIONES iniciales
-- ---------------------------------------------------------------------

select public.calcular_provisiones(current_date);

-- ---------------------------------------------------------------------
-- ASIENTOS CONTABLES INICIALES (apertura del balance)
-- ---------------------------------------------------------------------

with batch as (select gen_random_uuid() as bid)
insert into public.asientos_contables (batch_id, fecha, descripcion, cuenta_codigo, debe, haber)
select bid, current_date, 'Balance de apertura — Bancos Banorte MXN',           '1.01', 18000000.00, 0 from batch
union all
select bid, current_date, 'Balance de apertura — Bancos Banorte USD',           '1.01',   227364.00, 0 from batch
union all
select bid, current_date, 'Balance de apertura — Cartera vigente',              '1.02', 40469992.00, 0 from batch  -- cartera total externa + intercompañía
union all
select bid, current_date, 'Balance de apertura — Cartera vencida',              '1.03',  7002424.00, 0 from batch
union all
select bid, current_date, 'Balance de apertura — Activos productivos',          '1.06', 44952160.00, 0 from batch
union all
select bid, current_date, 'Balance de apertura — Línea Meridian Capital Bank MXN', '2.01', 0, 57826801.00 from batch
union all
select bid, current_date, 'Balance de apertura — Línea Meridian Capital Bank USD', '2.02', 0, 38324700.00 from batch
union all
select bid, current_date, 'Balance de apertura — Préstamo Ceibal Holding',       '2.03', 0,  8000000.00 from batch
union all
-- Capital social cuadrador = ACTIVOS (110,651,940) − PASIVOS (104,151,501) = 6,500,439
select bid, current_date, 'Balance de apertura — Capital social (cuadre)',      '3.01', 0, 6500439.00 from batch;

commit;

-- =====================================================================
-- VERIFICACIÓN POST-SEED
-- =====================================================================
-- select * from public.v_capital_resumen;
-- select * from public.v_dashboard_kpis;
-- select sum(ingreso_sin_iva) from public.v_cartera_operativa_mensual;  -- esperado: ~5,361,557
-- select * from public.tabla_amortizacion where credito_id = '22222222-2222-2222-2222-00000000000A' order by periodo;
-- =====================================================================
