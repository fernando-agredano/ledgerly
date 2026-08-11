-- =====================================================================
-- Ledgerly — 0014 Rebranding de datos: retirar referencias a la empresa
-- real de la prueba técnica original (VECTIS/HSI, JP Morgan Chase, y el
-- roster de clientes extraído de los PDFs reales) y sustituirlas por
-- entidades completamente ficticias. Los montos, fechas, tasas y demás
-- cifras financieras NO cambian — solo los nombres identificables.
-- =====================================================================

-- ---------------------------------------------------------------------
-- CLIENTES (roster real de la prueba → ficticio)
-- ---------------------------------------------------------------------

update public.clientes set nombre = 'Norvento Arrendadora', razon_social = 'Norvento Arrendadora S.A. de C.V.', rfc = 'NVA150505XX1' where id = '11111111-1111-1111-1111-000000000001';
update public.clientes set nombre = 'Grupo Solvex', razon_social = 'Grupo Solvex S.A. de C.V.', rfc = 'GSV170820XX2' where id = '11111111-1111-1111-1111-000000000002';
update public.clientes set nombre = 'VITALCORE, S.A.P.I. DE C.V.', razon_social = 'Vitalcore S.A.P.I. de C.V.', rfc = 'VTC180310XX3' where id = '11111111-1111-1111-1111-000000000003';
update public.clientes set nombre = 'KLARPAY, S.A. DE C.V.', razon_social = 'Klarpay S.A. de C.V.', rfc = 'KLP190415XX4' where id = '11111111-1111-1111-1111-000000000004';
update public.clientes set nombre = 'ALTIRA CAPITAL', razon_social = 'Altira Capital S.A. de C.V.', rfc = 'ALT200101XX5' where id = '11111111-1111-1111-1111-000000000005';
update public.clientes set nombre = 'Coreinvest', razon_social = 'Coreinvest S.A. de C.V.', rfc = 'CIV210202XX6' where id = '11111111-1111-1111-1111-000000000006';
update public.clientes set nombre = 'Predios Claros', razon_social = 'Predios Claros S.A. de C.V.', rfc = 'PCL220303XX7' where id = '11111111-1111-1111-1111-000000000007';
update public.clientes set nombre = 'Nova Media Group', razon_social = 'Nova Media Group S.A. de C.V.', rfc = 'NMG230404XX8' where id = '11111111-1111-1111-1111-000000000008';
update public.clientes set nombre = 'Transportes Kaizen', razon_social = 'Transportes Kaizen S.A. de C.V.', rfc = 'TKZ200505XX9' where id = '11111111-1111-1111-1111-000000000009';
update public.clientes set nombre = 'Vantage Tech', razon_social = 'Vantage Tech Solutions S.A. de C.V.', rfc = 'VTS180606XXA' where id = '11111111-1111-1111-1111-00000000000A';
update public.clientes set nombre = 'Municipio de Vega del Bosque', razon_social = 'Municipio de Vega del Bosque', rfc = 'MVB-XXX' where id = '11111111-1111-1111-1111-00000000000B';
update public.clientes set nombre = 'Ceibal Holding', razon_social = 'Ceibal Holding S.A. de C.V.', rfc = 'CBH210707XXB' where id = '11111111-1111-1111-1111-00000000000C';
update public.clientes set nombre = 'PYME Piloto (plantilla)', razon_social = 'PYME Piloto — Demostración', rfc = 'PPT260101XXC' where id = '11111111-1111-1111-1111-00000000000D';

-- ---------------------------------------------------------------------
-- CRÉDITOS: prefijo de contrato HSI- → LDG- y notas con el nombre viejo
-- ---------------------------------------------------------------------

update public.creditos set contrato_numero = 'LDG-NVA-001', notas = 'Arrendamiento a Norvento Arrendadora S.A. de C.V.' where id = '22222222-2222-2222-2222-000000000001';
update public.creditos set contrato_numero = 'LDG-GSV-001' where id = '22222222-2222-2222-2222-000000000002';
update public.creditos set contrato_numero = 'LDG-VTC-001', notas = 'Crédito simple a Vitalcore' where id = '22222222-2222-2222-2222-000000000003';
update public.creditos set contrato_numero = 'LDG-KLP-001', notas = 'Crédito Klarpay tramo 1 (2.5 mdp)' where id = '22222222-2222-2222-2222-000000000004';
update public.creditos set contrato_numero = 'LDG-KLP-002', notas = 'Crédito Klarpay tramo 2 (1.25 mdp)' where id = '22222222-2222-2222-2222-000000000005';
update public.creditos set contrato_numero = 'LDG-ALT-001', notas = 'Crédito revolvente intercompañía Altira' where id = '22222222-2222-2222-2222-000000000006';
update public.creditos set contrato_numero = 'LDG-CIV-001', notas = 'Préstamo intercompañía Coreinvest' where id = '22222222-2222-2222-2222-000000000007';
update public.creditos set contrato_numero = 'LDG-NVA-NPL', notas = 'Cartera vencida Norvento Arrendadora — contratos I011, I018, I037 — demanda en proceso' where id = '22222222-2222-2222-2222-000000000008';
update public.creditos set contrato_numero = 'LDG-000101', notas = 'Crédito plantilla PYME Piloto — referencia para tabla de amortización institucional' where id = '22222222-2222-2222-2222-00000000000A';

-- ---------------------------------------------------------------------
-- ACTIVOS: quitar marcas reales de vehículos/equipo
-- ---------------------------------------------------------------------

update public.activos set descripcion = 'Camión de carga' where id = '33333333-3333-3333-3333-000000000001';
update public.activos set descripcion = 'Vehículo eléctrico ejecutivo' where id = '33333333-3333-3333-3333-000000000002';
update public.activos set descripcion = 'Camioneta utilitaria (vehículo 1)' where id = '33333333-3333-3333-3333-000000000003';
update public.activos set descripcion = 'Camioneta utilitaria (vehículo 2)' where id = '33333333-3333-3333-3333-000000000004';
update public.activos set descripcion = 'Equipo de Cómputo — Vega del Bosque' where id = '33333333-3333-3333-3333-000000000005';
update public.activos set descripcion = 'Equipo de Cómputo — Vantage Tech' where id = '33333333-3333-3333-3333-000000000006';

-- ---------------------------------------------------------------------
-- CONTRATOS DE ARRENDAMIENTO: prefijo + notas
-- ---------------------------------------------------------------------

update public.contratos_arrendamiento set contrato_numero = 'LDG-ARR-MVB-001', notas = 'Arrendamiento equipo cómputo Vega del Bosque' where id = '44444444-4444-4444-4444-000000000001';
update public.contratos_arrendamiento set contrato_numero = 'LDG-ARR-VTS-CCTV1', notas = 'Vantage Tech — Proyecto videovigilancia vial (sistema 1)' where id = '44444444-4444-4444-4444-000000000002';
update public.contratos_arrendamiento set contrato_numero = 'LDG-ARR-VTS-CCTV2', notas = 'Vantage Tech — Proyecto videovigilancia vial (sistema 2)' where id = '44444444-4444-4444-4444-000000000003';
update public.contratos_arrendamiento set contrato_numero = 'LDG-ARR-TKZ-001', notas = 'Arrendamiento camión de carga a Transportes Kaizen' where id = '44444444-4444-4444-4444-000000000004';
update public.contratos_arrendamiento set contrato_numero = 'LDG-ARR-PCL-001', notas = 'Arrendamiento vehículo eléctrico a Predios Claros' where id = '44444444-4444-4444-4444-000000000005';
update public.contratos_arrendamiento set contrato_numero = 'LDG-ARR-VTS-VEH1', notas = 'Arrendamiento camioneta utilitaria vehículo 1 a Vantage Tech' where id = '44444444-4444-4444-4444-000000000006';
update public.contratos_arrendamiento set contrato_numero = 'LDG-ARR-VTS-VEH2', notas = 'Arrendamiento camioneta utilitaria vehículo 2 a Vantage Tech' where id = '44444444-4444-4444-4444-000000000007';

-- ---------------------------------------------------------------------
-- FUENTES DE FONDEO: JP Morgan Chase → Meridian Capital Bank; Parota → Ceibal Holding
-- ---------------------------------------------------------------------

update public.fuentes_fondeo set prestamista = 'Meridian Capital Bank', notas = 'Línea revolvente Meridian Capital Bank en pesos' where id = '55555555-5555-5555-5555-000000000001';
update public.fuentes_fondeo set prestamista = 'Meridian Capital Bank', notas = 'Línea revolvente Meridian Capital Bank en dólares' where id = '55555555-5555-5555-5555-000000000002';
update public.fuentes_fondeo set prestamista = 'Ceibal Holding', notas = 'Préstamo intercompañía Ceibal Holding' where id = '55555555-5555-5555-5555-000000000003';

-- ---------------------------------------------------------------------
-- CARTERA VENCIDA
-- ---------------------------------------------------------------------

update public.cartera_vencida
   set notas = 'Norvento Arrendadora — tres contratos previos en demanda judicial. Garantía hipotecaria sujeta a remate.'
 where credito_id = '22222222-2222-2222-2222-000000000008';

-- ---------------------------------------------------------------------
-- LEDGER: descripciones de asientos contables con el nombre viejo
-- ---------------------------------------------------------------------

update public.asientos_contables set descripcion = 'Balance de apertura — Línea Meridian Capital Bank MXN' where descripcion = 'Balance de apertura — Línea JP Morgan MXN';
update public.asientos_contables set descripcion = 'Balance de apertura — Línea Meridian Capital Bank USD' where descripcion = 'Balance de apertura — Línea JP Morgan USD';
update public.asientos_contables set descripcion = 'Balance de apertura — Préstamo Ceibal Holding' where descripcion = 'Balance de apertura — Préstamo Parota';
update public.asientos_contables set descripcion = 'Devengo intereses Vitalcore' where descripcion = 'Devengo intereses MEDAID';
update public.asientos_contables set descripcion = 'Cobro mensualidad Vitalcore' where descripcion = 'Cobro mensualidad MEDAID';

-- ---------------------------------------------------------------------
-- PLAN DE CUENTAS y CATÁLOGO DE BANCOS
-- ---------------------------------------------------------------------

update public.cuentas_contables set nombre = 'Línea Meridian Capital Bank MXN' where codigo = '2.01';
update public.cuentas_contables set nombre = 'Línea Meridian Capital Bank USD' where codigo = '2.02';
update public.cuentas_contables set nombre = 'Costo financiero Meridian Capital Bank' where codigo = '5.01';
update public.bancos set nombre = 'Meridian Capital Bank' where nombre = 'JP Morgan Chase';

-- ---------------------------------------------------------------------
-- USUARIOS: dominio de correo institucional
-- ---------------------------------------------------------------------

update public.usuarios set email = replace(email, '@vectis.mx', '@ledgerly.mx') where email like '%@vectis.mx';
