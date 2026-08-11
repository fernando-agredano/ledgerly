-- =====================================================================
-- VECTIS / HSI — 0004 Pipeline (originación, expediente, documentos)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Solicitudes de crédito
-- ---------------------------------------------------------------------

create table public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  folio text unique not null,
  cliente_id uuid not null references public.clientes(id),
  monto_solicitado numeric(18, 2) not null check (monto_solicitado > 0),
  moneda text not null default 'MXN' references public.monedas(codigo),
  plazo_meses int not null,
  tasa_propuesta numeric(7, 4),
  benchmark text,
  etapa_codigo text not null default 'EVALUACION' references public.etapas_solicitud(codigo),
  analista text,
  centro_costo text,
  fecha_solicitud date not null default current_date,
  -- AI Underwriting
  score_total int check (score_total between 0 and 100),
  score_kyc int,
  score_capacidad int,
  score_garantia int,
  score_legal int,
  score_rentabilidad int,
  riesgo_clasificacion text check (riesgo_clasificacion in (
    'BAJO', 'MEDIO', 'ALTO', 'NO_ACEPTABLE'
  )),
  -- Capacidad de pago (snapshot)
  ingresos_mensuales numeric(18, 2),
  ebitda_mensual numeric(18, 2),
  flujo_disponible numeric(18, 2),
  dscr numeric(6, 2),
  indice_pago numeric(6, 4),
  -- PLD
  pld_resultado text check (pld_resultado in (
    'BAJO', 'MEDIO', 'ALTO', 'NO_ACEPTABLE'
  )),
  pld_oficial text,
  pld_fecha timestamptz,
  -- Garantía
  garantia_tipo text,
  garantia_ubicacion text,
  garantia_valor_avaluo numeric(18, 2),
  cobertura_garantia numeric(6, 2),
  -- Decisión
  decision_analista text check (decision_analista in (
    'APROBAR', 'APROBAR_CONDICIONES', 'RECHAZAR', 'ESCALAR_COMITE'
  )),
  comentarios_analista text,
  decision_comite text check (decision_comite in (
    'APROBAR', 'APROBAR_CONDICIONES', 'RECHAZAR', 'MODIFICAR_ESTRUCTURA'
  )),
  comentarios_comite text,
  fecha_comite timestamptz,
  credito_generado_id uuid references public.creditos(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_solicitudes_etapa on public.solicitudes(etapa_codigo);
create index idx_solicitudes_cliente on public.solicitudes(cliente_id);
create index idx_solicitudes_fecha on public.solicitudes(fecha_solicitud desc);

create trigger trg_solicitudes_updated before update on public.solicitudes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Documentos del expediente
-- ---------------------------------------------------------------------

create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid references public.solicitudes(id) on delete cascade,
  credito_id uuid references public.creditos(id) on delete cascade,
  cliente_id uuid references public.clientes(id),
  nombre text not null,
  archivo_url text,
  archivo_filename text,
  estatus text not null default 'PENDIENTE' check (estatus in (
    'PENDIENTE', 'VALIDO', 'RECHAZADO', 'VENCIDO'
  )),
  frecuencia text check (frecuencia in (
    'UNICA', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'CADA_24M'
  )),
  fecha_carga timestamptz default now(),
  fecha_vigencia date,
  proxima_actualizacion date,
  validado_por text,
  fecha_validacion timestamptz,
  notas text,
  check (
    (solicitud_id is not null) or
    (credito_id   is not null) or
    (cliente_id   is not null)
  )
);

create index idx_documentos_solicitud on public.documentos(solicitud_id);
create index idx_documentos_credito on public.documentos(credito_id);
create index idx_documentos_estatus on public.documentos(estatus);

-- ---------------------------------------------------------------------
-- Verificaciones PLD detalladas
-- ---------------------------------------------------------------------

create table public.pld_verificaciones (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes(id) on delete cascade,
  lista text not null check (lista in (
    'OFAC', 'ONU', 'SAT_69B', 'PEP', 'BENEFICIARIO_CONTROLADOR', 'NOTICIAS_NEGATIVAS'
  )),
  resultado text not null,
  encontrado boolean not null default false,
  detalle text,
  fecha_verificacion timestamptz default now()
);

create index idx_pld_solicitud on public.pld_verificaciones(solicitud_id);

-- ---------------------------------------------------------------------
-- Comité — registro de aprobaciones
-- ---------------------------------------------------------------------

create table public.comite_aprobaciones (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes(id) on delete cascade,
  miembro text not null,
  cargo text,
  voto text not null check (voto in ('APRUEBA', 'RECHAZA', 'ABSTENCION')),
  comentario text,
  fecha_voto timestamptz default now()
);

create index idx_comite_solicitud on public.comite_aprobaciones(solicitud_id);

-- ---------------------------------------------------------------------
-- Condiciones aprobadas (para créditos con condiciones)
-- ---------------------------------------------------------------------

create table public.condiciones_aprobadas (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid references public.solicitudes(id) on delete cascade,
  credito_id uuid references public.creditos(id) on delete cascade,
  descripcion text not null,
  cumplido boolean default false,
  fecha_cumplimiento date,
  notas text,
  check (
    (solicitud_id is not null) or (credito_id is not null)
  )
);

create index idx_condiciones_credito on public.condiciones_aprobadas(credito_id);
