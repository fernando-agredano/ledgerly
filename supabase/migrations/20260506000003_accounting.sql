-- =====================================================================
-- VECTIS / HSI — 0003 Contabilidad
-- Plan de cuentas, asientos en doble partida, provisiones por bucket
-- =====================================================================

-- ---------------------------------------------------------------------
-- Plan de cuentas (chart of accounts)
-- ---------------------------------------------------------------------

create table public.cuentas_contables (
  codigo text primary key,
  nombre text not null,
  naturaleza text not null check (naturaleza in (
    'ACTIVO', 'PASIVO', 'CAPITAL', 'INGRESO', 'GASTO'
  )),
  padre text references public.cuentas_contables(codigo),
  contra boolean default false,
  activo boolean default true
);

-- ---------------------------------------------------------------------
-- Asientos contables (ledger inmutable, doble partida)
-- ---------------------------------------------------------------------

create table public.asientos_contables (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null,
  fecha date not null,
  descripcion text not null,
  cuenta_codigo text not null references public.cuentas_contables(codigo),
  debe numeric(18, 2) default 0,
  haber numeric(18, 2) default 0,
  credito_id uuid references public.creditos(id),
  arrendamiento_id uuid references public.contratos_arrendamiento(id),
  pago_id uuid references public.pagos(id),
  fondeo_id uuid references public.fuentes_fondeo(id),
  created_at timestamptz default now(),
  check (
    (debe > 0 and haber = 0) or (haber > 0 and debe = 0)
  )
);

create index idx_asientos_batch on public.asientos_contables(batch_id);
create index idx_asientos_fecha on public.asientos_contables(fecha);
create index idx_asientos_cuenta on public.asientos_contables(cuenta_codigo);
create index idx_asientos_credito on public.asientos_contables(credito_id);

-- ---------------------------------------------------------------------
-- Provisiones por bucket (snapshot por fecha de corte)
-- Reglas tomadas del knowledge module: 1% / 5% / 15% / 35% / 75–100%
-- ---------------------------------------------------------------------

create table public.provisiones (
  id uuid primary key default gen_random_uuid(),
  fecha_corte date not null,
  credito_id uuid not null references public.creditos(id),
  bucket text not null check (bucket in (
    'VIGENTE', '1_30', '31_60', '61_90', '90_PLUS'
  )),
  saldo numeric(18, 2) not null,
  tasa_provision numeric(5, 4) not null,
  monto_provision numeric(18, 2) not null,
  created_at timestamptz default now(),
  unique (fecha_corte, credito_id)
);

create index idx_provisiones_fecha on public.provisiones(fecha_corte);
create index idx_provisiones_bucket on public.provisiones(bucket);

-- ---------------------------------------------------------------------
-- Seed del plan de cuentas mínimo institucional
-- ---------------------------------------------------------------------

insert into public.cuentas_contables (codigo, nombre, naturaleza, padre, contra) values
  -- ACTIVOS
  ('1.00', 'ACTIVO',                           'ACTIVO',  null, false),
  ('1.01', 'Bancos',                           'ACTIVO',  '1.00', false),
  ('1.02', 'Cartera vigente',                  'ACTIVO',  '1.00', false),
  ('1.03', 'Cartera vencida',                  'ACTIVO',  '1.00', false),
  ('1.04', 'Intereses por cobrar',             'ACTIVO',  '1.00', false),
  ('1.05', 'IVA por cobrar',                   'ACTIVO',  '1.00', false),
  ('1.06', 'Activos productivos',              'ACTIVO',  '1.00', false),
  ('1.07', 'Depreciación acumulada',           'ACTIVO',  '1.06', true),
  ('1.08', 'Reserva preventiva',               'ACTIVO',  '1.00', true),
  ('1.09', 'Cuentas por cobrar arrendamiento', 'ACTIVO',  '1.00', false),
  -- PASIVOS
  ('2.00', 'PASIVO',                            'PASIVO',  null, false),
  ('2.01', 'Línea JP Morgan MXN',               'PASIVO',  '2.00', false),
  ('2.02', 'Línea JP Morgan USD',               'PASIVO',  '2.00', false),
  ('2.03', 'Préstamos intercompañía',           'PASIVO',  '2.00', false),
  ('2.04', 'IVA por pagar',                     'PASIVO',  '2.00', false),
  -- CAPITAL
  ('3.00', 'CAPITAL',                           'CAPITAL', null, false),
  ('3.01', 'Capital social',                    'CAPITAL', '3.00', false),
  ('3.02', 'Resultado del ejercicio',           'CAPITAL', '3.00', false),
  -- INGRESOS
  ('4.00', 'INGRESOS',                          'INGRESO', null, false),
  ('4.01', 'Ingresos por intereses',            'INGRESO', '4.00', false),
  ('4.02', 'Ingresos por arrendamiento',        'INGRESO', '4.00', false),
  ('4.03', 'Ingresos por inversiones',          'INGRESO', '4.00', false),
  ('4.04', 'Ingresos por penalidades',          'INGRESO', '4.00', false),
  -- GASTOS
  ('5.00', 'GASTOS',                            'GASTO',   null, false),
  ('5.01', 'Costo financiero JP Morgan',        'GASTO',   '5.00', false),
  ('5.02', 'Gasto por provisión',               'GASTO',   '5.00', false),
  ('5.03', 'Gastos operativos',                 'GASTO',   '5.00', false),
  ('5.04', 'Gastos legales / cobranza',         'GASTO',   '5.00', false);
