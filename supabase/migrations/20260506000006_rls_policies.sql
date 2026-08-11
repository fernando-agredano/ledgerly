-- =====================================================================
-- VECTIS / HSI — 0006 Row Level Security
-- Para la demo: SELECT abierto a authenticated y anon (lectura).
-- En producción se debe restringir por roles institucionales (CRO, CFO,
-- analista, oficial de cumplimiento, jurídico, comité, auditor).
-- =====================================================================

-- Habilitar RLS en todas las tablas operativas
alter table public.clientes                       enable row level security;
alter table public.creditos                       enable row level security;
alter table public.tabla_amortizacion             enable row level security;
alter table public.activos                        enable row level security;
alter table public.contratos_arrendamiento        enable row level security;
alter table public.contratos_arrendamiento_activos enable row level security;
alter table public.fuentes_fondeo                 enable row level security;
alter table public.cuentas_bancarias              enable row level security;
alter table public.cartera_vencida                enable row level security;
alter table public.pagos                          enable row level security;
alter table public.cuentas_contables              enable row level security;
alter table public.asientos_contables             enable row level security;
alter table public.provisiones                    enable row level security;
alter table public.solicitudes                    enable row level security;
alter table public.documentos                     enable row level security;
alter table public.pld_verificaciones             enable row level security;
alter table public.comite_aprobaciones            enable row level security;
alter table public.condiciones_aprobadas          enable row level security;
alter table public.monedas                        enable row level security;
alter table public.bancos                         enable row level security;
alter table public.tipos_credito                  enable row level security;
alter table public.estatus_credito                enable row level security;
alter table public.etapas_solicitud               enable row level security;

-- ---------------------------------------------------------------------
-- Políticas (DEMO): lectura pública para anon y authenticated
-- TODO PROD: cambiar a "authenticated" only y filtrar por role/depto.
-- ---------------------------------------------------------------------

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'clientes','creditos','tabla_amortizacion','activos',
      'contratos_arrendamiento','contratos_arrendamiento_activos',
      'fuentes_fondeo','cuentas_bancarias','cartera_vencida','pagos',
      'cuentas_contables','asientos_contables','provisiones',
      'solicitudes','documentos','pld_verificaciones',
      'comite_aprobaciones','condiciones_aprobadas',
      'monedas','bancos','tipos_credito','estatus_credito','etapas_solicitud'
    ])
  loop
    execute format(
      'create policy "demo_select_%I" on public.%I for select to anon, authenticated using (true);',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Políticas de escritura (sólo authenticated por ahora)
-- ---------------------------------------------------------------------

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'clientes','creditos','tabla_amortizacion','activos',
      'contratos_arrendamiento','contratos_arrendamiento_activos',
      'fuentes_fondeo','cuentas_bancarias','cartera_vencida','pagos',
      'asientos_contables','provisiones',
      'solicitudes','documentos','pld_verificaciones',
      'comite_aprobaciones','condiciones_aprobadas'
    ])
  loop
    execute format(
      'create policy "auth_insert_%I" on public.%I for insert to authenticated with check (true);',
      t, t
    );
    execute format(
      'create policy "auth_update_%I" on public.%I for update to authenticated using (true);',
      t, t
    );
  end loop;
end $$;
