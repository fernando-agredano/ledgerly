# Ledgerly · Supabase / Base de datos institucional

Esta carpeta contiene todo lo necesario para reproducir la base de datos
operativa de Ledgerly sobre Supabase (cloud o local).

## Contenido

```
supabase/
├── config.toml                       # Config Supabase CLI
├── README.md
├── seed.sql                          # Datos reales (Info General + Tabla Amortización)
└── migrations/
    ├── 0001_core_schema.sql          # Catálogos, clientes, créditos, amortización
    ├── 0002_assets_funding.sql       # Activos, arrendamientos, fondeo, caja, NPL, pagos
    ├── 0003_accounting.sql           # Plan de cuentas, asientos, provisiones
    ├── 0004_pipeline.sql             # Solicitudes, expediente, documentos, comité
    ├── 0005_views_functions.sql      # Vistas y funciones (KPIs, amortización auto, ECL)
    └── 0006_rls_policies.sql         # Row Level Security (policies de demo)
```

## Modelo de datos (resumen)

| Tabla | Propósito |
|---|---|
| `clientes` | Acreditados, arrendatarios, intercompañías |
| `creditos` | Crédito simple, inversión, revolvente, intercompañía |
| `tabla_amortizacion` | Calendario de pagos por crédito (capital, intereses, IVA) |
| `pagos` | Pagos recibidos (de créditos y de arrendamientos) |
| `activos` | Activos productivos (vehículos, equipo cómputo, inmuebles) |
| `contratos_arrendamiento` | Renta mensual sobre activos productivos |
| `fuentes_fondeo` | Meridian Capital Bank MXN/USD, intercompañías |
| `cuentas_bancarias` | Caja Banorte MXN/USD |
| `cartera_vencida` | Registro NPL (saldo, demanda, abogado) |
| `cuentas_contables` | Plan de cuentas (chart of accounts) |
| `asientos_contables` | Ledger inmutable en doble partida |
| `provisiones` | Reservas por bucket (1% / 5% / 15% / 35% / 75%) |
| `solicitudes` | Pipeline de originación + AI Underwriting |
| `documentos` | Expediente |
| `pld_verificaciones`, `comite_aprobaciones`, `condiciones_aprobadas` | Soporte de comité y compliance |

## Vistas y funciones clave

| Objeto | Uso |
|---|---|
| `v_creditos_full` | Crédito + cliente + tipo + estatus (consumir directo desde el front) |
| `v_cartera_operativa_mensual` | Replica el bloque "CARTERA OPERATIVA" del PDF 1 sin duplicar datos |
| `v_dashboard_kpis` | Cartera total, vigente, jurídico, IPM, caja, deuda |
| `v_capital_resumen` | Capital invertido / capital distribuido (PDF 1) |
| `v_libro_mayor` | Saldos por cuenta contable (debe / haber / saldo) |
| `generar_tabla_amortizacion(uuid)` | Genera 36/48/N rows según el crédito |
| `calcular_provisiones(date)` | Snapshot de provisiones por bucket a una fecha |

## Aplicar las migraciones

### Opción A — Supabase Cloud (Dashboard)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, abre cada archivo en orden y ejecútalo:
   1. `migrations/0001_core_schema.sql`
   2. `migrations/0002_assets_funding.sql`
   3. `migrations/0003_accounting.sql`
   4. `migrations/0004_pipeline.sql`
   5. `migrations/0005_views_functions.sql`
   6. `migrations/0006_rls_policies.sql`
   7. `seed.sql`
3. Ve a **Settings → API** y copia:
   - `Project URL`
   - `anon public` key

### Opción B — Supabase CLI (local o cloud)

```bash
# Instalar CLI si no la tienes
brew install supabase/tap/supabase

# Vincular al proyecto cloud
supabase link --project-ref <project-ref>

# Aplicar migraciones
supabase db push

# Cargar el seed
psql "$(supabase db remote-url)" -f supabase/seed.sql
```

### Opción C — Supabase local con Docker

```bash
supabase start
supabase db reset            # corre migraciones + seed.sql automáticamente
```

## Conectar la demo (Vite + React) a Supabase

1. Instalar el cliente:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Crear `.env.local` en la raíz del repo:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Crear `src/lib/supabase.ts`:
   ```ts
   import { createClient } from "@supabase/supabase-js";
   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL!,
     import.meta.env.VITE_SUPABASE_ANON_KEY!
   );
   ```

4. Reemplazar `src/data/mock.ts` con queries a Supabase. Ejemplos:
   ```ts
   const { data: creditos } = await supabase.from("v_creditos_full").select("*");
   const { data: kpis }     = await supabase.from("v_dashboard_kpis").select("*").single();
   const { data: cartera }  = await supabase.from("v_cartera_operativa_mensual").select("*");
   ```

## Verificar que el seed cargó correctamente

Ejecuta en el SQL Editor:

```sql
-- 1. Capital invertido y distribuido (debe coincidir con el PDF 1)
select * from public.v_capital_resumen;
-- Esperado:
--   activos_productivos          = 44,952,160
--   cartera_vigente              ≈ 33,467,568
--   capital_invertido_operacion  ≈ 78,419,728   (sin intercompañías)
--   cartera_vencida              =  7,002,424

-- 2. Cartera operativa mensual total (sin IVA, debe ≈ 5,361,557)
select round(sum(ingreso_sin_iva), 2) as total_sin_iva
  from public.v_cartera_operativa_mensual;

-- 3. Tabla de amortización PYME 1 — primeros 5 periodos
select periodo, fecha_pago, intereses, iva_intereses, amortizacion_capital, saldo_insoluto
  from public.tabla_amortizacion
  where credito_id = '22222222-2222-2222-2222-00000000000A'
  order by periodo
  limit 5;
-- Periodo 1 esperado: intereses 40,000.00 · IVA 6,400.00 · amort 65,471.10 · saldo 2,934,528.90

-- 4. Cuadre del libro mayor (apertura)
select sum(debe) - sum(haber) as descuadre from public.asientos_contables;
-- Esperado: 0
```

## Seguridad — notas de RLS

Las políticas actuales son **abiertas para anon** (lectura) y **abiertas para
authenticated** (escritura). Esto es apropiado para una demo, **no para
producción**. Antes de exponer en producción se debe:

- Crear roles institucionales: `cro`, `cfo`, `analista`, `comite`, `oficial_pld`,
  `juridico`, `tesoreria`, `auditor`.
- Restringir SELECT por `auth.uid()` y `auth.jwt()->>'role'`.
- Bloquear DELETE en `asientos_contables` (ledger inmutable).
- Forzar `service_role` para procesos batch (cierre, provisiones, devengos).

## Próximos pasos institucionales (no incluidos aún)

- [ ] Triggers de devengo automático mensual (intereses sobre saldo insoluto)
- [ ] Trigger de generación de asientos por evento (dispersión, cobro, mora)
- [ ] Función ECL IFRS 9 / B-6 con PD/LGD/EAD por segmento
- [ ] Vista de borrowing base contra Meridian Capital Bank
- [ ] Vista de gap analysis ALM (descalce activos / pasivos)
- [ ] Storage buckets para documentos (Supabase Storage)
- [ ] Edge Functions para conciliación SPEI con BANXICO/CEP
