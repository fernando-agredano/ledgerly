-- =====================================================================
-- VECTIS / HSI — 0001 Core Schema
-- Catálogos, clientes, créditos y tabla de amortización
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Catálogos (lookup tables)
-- ---------------------------------------------------------------------

create table public.monedas (
  codigo text primary key,
  nombre text not null,
  simbolo text not null
);

create table public.bancos (
  id serial primary key,
  nombre text not null unique,
  clabe_prefix text
);

create table public.tipos_credito (
  codigo text primary key,
  nombre text not null,
  descripcion text,
  aplica_iva boolean default true
);

create table public.estatus_credito (
  codigo text primary key,
  nombre text not null,
  orden int not null
);

create table public.etapas_solicitud (
  codigo text primary key,
  nombre text not null,
  orden int not null
);

-- ---------------------------------------------------------------------
-- Clientes (acreditados, arrendatarios, intercompañías)
-- ---------------------------------------------------------------------

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  razon_social text,
  rfc text,
  tipo text not null check (tipo in (
    'PYME', 'GOBIERNO', 'GRAN_EMPRESA', 'INTERCOMPANIA', 'PERSONA_FISICA'
  )),
  sector text,
  email text,
  telefono text,
  direccion text,
  fecha_alta timestamptz default now(),
  activo boolean default true,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_clientes_rfc on public.clientes(rfc);
create index idx_clientes_tipo on public.clientes(tipo);

-- ---------------------------------------------------------------------
-- Créditos (simple, inversión, revolvente, intercompañía)
-- ---------------------------------------------------------------------

create table public.creditos (
  id uuid primary key default gen_random_uuid(),
  contrato_numero text unique not null,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  tipo_codigo text not null references public.tipos_credito(codigo),
  monto_original numeric(18, 2) not null check (monto_original > 0),
  moneda text not null default 'MXN' references public.monedas(codigo),
  tasa_anual numeric(7, 4) not null check (tasa_anual >= 0),
  tasa_mensual numeric(8, 6) generated always as (round(tasa_anual / 12, 6)) stored,
  plazo_meses int,
  fecha_inicio date not null,
  fecha_vencimiento date,
  fecha_dispersion date,
  cuota_mensual numeric(18, 2),
  estatus_codigo text not null default 'VIGENTE' references public.estatus_credito(codigo),
  saldo_insoluto numeric(18, 2),
  dias_atraso int default 0,
  intercompania boolean default false,
  centro_costo text,
  garantia_descripcion text,
  cobertura_garantia numeric(6, 2),
  dscr_actual numeric(6, 2),
  score_comportamiento int,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_creditos_cliente on public.creditos(cliente_id);
create index idx_creditos_estatus on public.creditos(estatus_codigo);
create index idx_creditos_intercompania on public.creditos(intercompania);

-- ---------------------------------------------------------------------
-- Tabla de amortización (Crédito Simple — plantilla del PDF 2)
-- ---------------------------------------------------------------------

create table public.tabla_amortizacion (
  id uuid primary key default gen_random_uuid(),
  credito_id uuid not null references public.creditos(id) on delete cascade,
  periodo int not null,
  fecha_pago date not null,
  saldo_inicial numeric(18, 2) not null,
  cuota numeric(18, 2) not null,
  intereses numeric(18, 2) not null,
  iva_intereses numeric(18, 2) not null,
  amortizacion_capital numeric(18, 2) not null,
  saldo_insoluto numeric(18, 2) not null,
  pago_total numeric(18, 2) not null,
  estatus text not null default 'PROGRAMADO' check (estatus in (
    'PROGRAMADO', 'PAGADO', 'PARCIAL', 'VENCIDO'
  )),
  fecha_pago_real date,
  monto_pagado_real numeric(18, 2),
  unique (credito_id, periodo)
);

create index idx_amortizacion_fecha on public.tabla_amortizacion(fecha_pago);
create index idx_amortizacion_estatus on public.tabla_amortizacion(estatus);

-- ---------------------------------------------------------------------
-- Trigger: mantener updated_at
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_clientes_updated before update on public.clientes
  for each row execute function public.set_updated_at();

create trigger trg_creditos_updated before update on public.creditos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Seed de catálogos (datos de referencia mínimos)
-- ---------------------------------------------------------------------

insert into public.monedas (codigo, nombre, simbolo) values
  ('MXN', 'Peso Mexicano', '$'),
  ('USD', 'Dólar Estadounidense', 'US$');

insert into public.bancos (nombre, clabe_prefix) values
  ('Banorte', '072'),
  ('JP Morgan Chase', '110'),
  ('BBVA México', '012'),
  ('Santander', '014'),
  ('Banamex', '002');

insert into public.tipos_credito (codigo, nombre, descripcion, aplica_iva) values
  ('SIMPLE',         'Crédito Simple',          'Préstamo con tabla de amortización fija; se cobra IVA sobre intereses', true),
  ('REVOLVENTE',     'Crédito Revolvente',      'Línea revolvente con disposiciones; se cobra IVA sobre intereses',     true),
  ('INVERSION',      'Inversión / Mutuo',       'Inversión con rendimiento mensual; sin IVA',                            false),
  ('INTERCOMPANIA',  'Préstamo Intercompañía',  'Operación entre empresas relacionadas',                                  false),
  ('ARRENDAMIENTO_F','Arrendamiento Financiero','Arrendamiento con opción de compra; se cobra IVA',                       true);

insert into public.estatus_credito (codigo, nombre, orden) values
  ('VIGENTE',   'Vigente',                  1),
  ('MORA',      'Mora',                     2),
  ('JURIDICO',  'Jurídico (90+ días)',      3),
  ('CASTIGADO', 'Castigado',                4),
  ('LIQUIDADO', 'Liquidado',                5);

insert into public.etapas_solicitud (codigo, nombre, orden) values
  ('EVALUACION',   'En evaluación',     1),
  ('ANALISIS',     'En análisis',       2),
  ('PENDIENTE',    'Pendiente docs',    3),
  ('COMITE',       'En comité',         4),
  ('APROBADO',     'Aprobado',          5),
  ('RECHAZADO',    'Rechazado',         6),
  ('DISPERSADO',   'Dispersado',        7);
