-- =====================================================================
-- VECTIS / HSI — 0002 Activos productivos, arrendamientos, fondeo y caja
-- =====================================================================

-- ---------------------------------------------------------------------
-- Activos productivos (vehículos, equipo de cómputo, inmuebles)
-- ---------------------------------------------------------------------

create table public.activos (
  id uuid primary key default gen_random_uuid(),
  descripcion text not null,
  categoria text not null check (categoria in (
    'VEHICULO', 'EQUIPO_COMPUTO', 'INMUEBLE', 'MAQUINARIA', 'OTRO'
  )),
  inversion_compra numeric(18, 2) not null,
  fecha_adquisicion date,
  esquema text check (esquema in (
    'ARRENDAMIENTO_OPERATIVO', 'ARRENDAMIENTO_FINANCIERO',
    'GARANTIA', 'PROPIO'
  )),
  arrendatario_id uuid references public.clientes(id),
  valor_actual numeric(18, 2),
  depreciacion_acumulada numeric(18, 2) default 0,
  estatus text default 'ACTIVO' check (estatus in (
    'ACTIVO', 'INACTIVO', 'EN_MANTENIMIENTO', 'BAJA'
  )),
  notas text,
  created_at timestamptz default now()
);

create index idx_activos_categoria on public.activos(categoria);
create index idx_activos_arrendatario on public.activos(arrendatario_id);

-- ---------------------------------------------------------------------
-- Contratos de arrendamiento (renta mensual de activos productivos)
-- ---------------------------------------------------------------------

create table public.contratos_arrendamiento (
  id uuid primary key default gen_random_uuid(),
  contrato_numero text unique not null,
  arrendatario_id uuid not null references public.clientes(id),
  fecha_inicio date not null,
  fecha_vencimiento date,
  plazo_meses int,
  monto_mensual_sin_iva numeric(18, 2) not null,
  iva_mensual numeric(18, 2) generated always as (round(monto_mensual_sin_iva * 0.16, 2)) stored,
  monto_mensual_con_iva numeric(18, 2) generated always as (round(monto_mensual_sin_iva * 1.16, 2)) stored,
  estatus text not null default 'VIGENTE' check (estatus in (
    'VIGENTE', 'MORA', 'TERMINADO', 'CANCELADO'
  )),
  notas text,
  created_at timestamptz default now()
);

create index idx_arrendamiento_arrendatario on public.contratos_arrendamiento(arrendatario_id);
create index idx_arrendamiento_estatus on public.contratos_arrendamiento(estatus);

-- ---------------------------------------------------------------------
-- Junction: un contrato puede agrupar uno o más activos
-- ---------------------------------------------------------------------

create table public.contratos_arrendamiento_activos (
  contrato_id uuid not null references public.contratos_arrendamiento(id) on delete cascade,
  activo_id uuid not null references public.activos(id) on delete cascade,
  primary key (contrato_id, activo_id)
);

-- ---------------------------------------------------------------------
-- Fuentes de fondeo (JP Morgan, intercompañías, otros prestamistas)
-- ---------------------------------------------------------------------

create table public.fuentes_fondeo (
  id uuid primary key default gen_random_uuid(),
  prestamista text not null,
  tipo text not null check (tipo in (
    'REVOLVENTE', 'SIMPLE', 'INTERCOMPANIA', 'SECURITIZACION', 'SUBORDINADA'
  )),
  moneda text not null references public.monedas(codigo),
  monto_linea numeric(18, 2),
  saldo_actual numeric(18, 2) not null,
  tasa_referencia text,
  spread numeric(7, 4),
  fecha_disposicion date,
  fecha_vencimiento date,
  tipo_cambio numeric(8, 4) default 1.00,
  saldo_mxn numeric(18, 2) generated always as (round(saldo_actual * tipo_cambio, 2)) stored,
  notas text,
  created_at timestamptz default now()
);

create index idx_fondeo_prestamista on public.fuentes_fondeo(prestamista);
create index idx_fondeo_moneda on public.fuentes_fondeo(moneda);

-- ---------------------------------------------------------------------
-- Cuentas bancarias (caja y equivalentes)
-- ---------------------------------------------------------------------

create table public.cuentas_bancarias (
  id uuid primary key default gen_random_uuid(),
  banco_id int not null references public.bancos(id),
  alias text,
  moneda text not null references public.monedas(codigo),
  numero_cuenta text,
  clabe text,
  saldo numeric(18, 2) not null default 0,
  tipo_cambio numeric(8, 4) default 1.00,
  saldo_mxn numeric(18, 2) generated always as (round(saldo * tipo_cambio, 2)) stored,
  ultima_actualizacion timestamptz default now(),
  notas text
);

create index idx_cuentas_banco on public.cuentas_bancarias(banco_id);

-- ---------------------------------------------------------------------
-- Cartera vencida (NPL register)
-- ---------------------------------------------------------------------

create table public.cartera_vencida (
  id uuid primary key default gen_random_uuid(),
  credito_id uuid references public.creditos(id),
  cliente_id uuid references public.clientes(id),
  contratos_afectados text,
  saldo_vencido numeric(18, 2) not null,
  fecha_default date,
  dias_mora int,
  estatus_legal text not null check (estatus_legal in (
    'PRE_DEMANDA', 'DEMANDA_EN_PROCESO', 'EMBARGO',
    'REMATE', 'RECUPERACION_EXTRAJUDICIAL',
    'RECUPERADO', 'CASTIGADO'
  )),
  abogado_responsable text,
  fecha_demanda date,
  monto_recuperado numeric(18, 2) default 0,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_npl_estatus on public.cartera_vencida(estatus_legal);
create index idx_npl_credito on public.cartera_vencida(credito_id);

create trigger trg_npl_updated before update on public.cartera_vencida
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Pagos recibidos (de créditos y de arrendamientos)
-- ---------------------------------------------------------------------

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  credito_id uuid references public.creditos(id),
  arrendamiento_id uuid references public.contratos_arrendamiento(id),
  periodo_amortizacion_id uuid references public.tabla_amortizacion(id),
  fecha_pago date not null,
  monto_capital numeric(18, 2) default 0,
  monto_intereses numeric(18, 2) default 0,
  monto_iva numeric(18, 2) default 0,
  monto_renta numeric(18, 2) default 0,
  monto_penalidad numeric(18, 2) default 0,
  monto_total numeric(18, 2) not null,
  cep_spei text,
  banco_origen_id int references public.bancos(id),
  conciliado boolean default false,
  fecha_conciliacion timestamptz,
  created_at timestamptz default now(),
  check (
    (credito_id is not null) or (arrendamiento_id is not null)
  )
);

create index idx_pagos_credito on public.pagos(credito_id);
create index idx_pagos_arrendamiento on public.pagos(arrendamiento_id);
create index idx_pagos_fecha on public.pagos(fecha_pago);
create index idx_pagos_conciliado on public.pagos(conciliado);
