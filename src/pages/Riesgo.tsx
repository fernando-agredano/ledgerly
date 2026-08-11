import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { AlertTriangle, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { ErrorBlock, LoadingBlock } from "@/components/ui/States";
import { useFetch } from "@/hooks/useFetch";
import {
  fetchConcentracionCliente,
  fetchConcentracionSector,
  fetchConcentracionTipo,
  fetchDashboardKpis,
  fetchVintage,
} from "@/lib/api";
import { formatMXN, formatPercent } from "@/lib/format";
import type { ConcentracionItem, VintageItem } from "@/lib/types";

export default function Riesgo() {
  const [tab, setTab] = useState("concentracion");
  const kpis = useFetch(fetchDashboardKpis);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-navy-900">
          Riesgo · Portfolio Management
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Monitoreo institucional de la cartera: concentración, vintage analysis,
          early warning indicators y stress testing.
        </p>
      </header>

      {/* KPIs de riesgo */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RiskKpi
          label="IPM (90+)"
          value={kpis.data ? `${kpis.data.ipm_pct.toFixed(2)}%` : "—"}
          tone="amber"
          good={false}
        />
        <RiskKpi
          label="NPL"
          value={kpis.data ? formatMXN(kpis.data.cartera_juridico) : "—"}
          tone="red"
          good={false}
        />
        <RiskKpi
          label="Concentración top-5"
          value={kpis.data ? "—" : "—"}
          tone="brand"
          good={true}
          subValue="Calculado en tabla"
        />
        <RiskKpi
          label="Cobertura caja / deuda"
          value={
            kpis.data && kpis.data.deuda_total > 0
              ? `${((kpis.data.efectivo_total / kpis.data.deuda_total) * 100).toFixed(1)}%`
              : "—"
          }
          tone="emerald"
          good={true}
        />
      </section>

      <Card>
        <div className="px-6 pt-2">
          <Tabs
            items={[
              { id: "concentracion", label: "Concentración" },
              { id: "vintage", label: "Vintage" },
              { id: "ewi", label: "Early Warning" },
              { id: "stress", label: "Stress Testing" },
            ]}
            active={tab}
            onChange={setTab}
            className="border-b-0"
          />
        </div>
        <div className="border-t border-slate-100 p-6">
          {tab === "concentracion" && <ConcentracionTab />}
          {tab === "vintage" && <VintageTab />}
          {tab === "ewi" && <EWITab />}
          {tab === "stress" && <StressTab />}
        </div>
      </Card>
    </div>
  );
}

function RiskKpi({
  label,
  value,
  tone,
  good,
  subValue,
}: {
  label: string;
  value: string;
  tone: "amber" | "red" | "brand" | "emerald";
  good: boolean;
  subValue?: string;
}) {
  const colors = {
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    brand: "bg-brand-50 text-brand-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${colors[tone]}`}>
          {good ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
        </div>
      </div>
      <p className="text-2xl font-semibold text-navy-900 tabular-nums">{value}</p>
      {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
    </div>
  );
}

function ConcentracionTab() {
  const cliente = useFetch(fetchConcentracionCliente);
  const sector = useFetch(fetchConcentracionSector);
  const tipo = useFetch(fetchConcentracionTipo);

  const top5 = (cliente.data ?? []).slice(0, 5);
  const top5Pct = top5.reduce((a, c) => a + Number(c.pct_cartera), 0);

  const colorScale = ["#1d4ed8", "#2563eb", "#3d72f4", "#6092f9", "#93b8fd", "#bfd4fe"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Stat label="Top-5 acreditados" value={`${top5Pct.toFixed(1)}% de cartera`} hint="Límite institucional sugerido: 50%" tone={top5Pct > 50 ? "amber" : "emerald"} />
        <Stat label="Acreditados totales" value={`${cliente.data?.length ?? 0}`} hint="Diversificación de riesgo" tone="brand" />
        <Stat
          label="Sector dominante"
          value={sector.data?.[0]?.sector ?? "—"}
          hint={sector.data?.[0] ? `${sector.data[0].pct_cartera.toFixed(1)}% de cartera` : ""}
          tone="brand"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-none border-slate-200">
          <CardHeader>
            <CardTitle>Top acreditados (single obligor)</CardTitle>
          </CardHeader>
          <CardBody>
            {cliente.loading ? (
              <LoadingBlock />
            ) : cliente.error ? (
              <ErrorBlock message={cliente.error} onRetry={cliente.refetch} />
            ) : (
              <ConcentracionList items={cliente.data ?? []} valueKey="nombre" colors={colorScale} />
            )}
          </CardBody>
        </Card>

        <Card className="shadow-none border-slate-200">
          <CardHeader>
            <CardTitle>Por sector</CardTitle>
          </CardHeader>
          <CardBody>
            {sector.loading ? (
              <LoadingBlock />
            ) : sector.error ? (
              <ErrorBlock message={sector.error} onRetry={sector.refetch} />
            ) : (
              <ConcentracionBars items={sector.data ?? []} valueKey="sector" />
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="shadow-none border-slate-200">
        <CardHeader>
          <CardTitle>Por tipo de crédito</CardTitle>
        </CardHeader>
        <CardBody>
          {tipo.loading ? (
            <LoadingBlock />
          ) : tipo.error ? (
            <ErrorBlock message={tipo.error} onRetry={tipo.refetch} />
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <Table>
                <THead>
                  <TR>
                    <TH>Tipo</TH>
                    <TH className="text-center">Créditos</TH>
                    <TH className="text-right">Exposición</TH>
                    <TH className="text-right">% cartera</TH>
                  </TR>
                </THead>
                <TBody>
                  {(tipo.data ?? []).map((r) => (
                    <TR key={r.codigo}>
                      <TD className="font-medium">{r.tipo}</TD>
                      <TD className="text-center">{r.creditos}</TD>
                      <TD className="text-right tabular-nums">
                        {formatMXN(r.exposicion)}
                      </TD>
                      <TD className="text-right tabular-nums font-medium">
                        {formatPercent(Number(r.pct_cartera), 1)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function ConcentracionList({
  items,
  valueKey,
  colors,
}: {
  items: ConcentracionItem[];
  valueKey: "nombre" | "sector";
  colors: string[];
}) {
  return (
    <div className="space-y-2.5">
      {items.slice(0, 8).map((it, i) => (
        <div key={(it as any)[valueKey] ?? i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-navy-800 font-medium truncate pr-3">
              {(it as any)[valueKey] ?? "—"}
            </span>
            <span className="font-semibold tabular-nums">
              {Number(it.pct_cartera).toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(Number(it.pct_cartera), 100)}%`,
                backgroundColor: colors[i % colors.length],
              }}
            />
          </div>
          <p className="text-[11px] text-slate-500 tabular-nums">
            {formatMXN(it.exposicion)} · {it.creditos} crédito(s)
          </p>
        </div>
      ))}
    </div>
  );
}

function ConcentracionBars({
  items,
  valueKey,
}: {
  items: ConcentracionItem[];
  valueKey: "nombre" | "sector";
}) {
  const data = items.map((it) => ({
    name: (it as any)[valueKey] ?? "—",
    pct: Number(it.pct_cartera),
    monto: it.exposicion,
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            stroke="#64748b"
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            stroke="#64748b"
            width={120}
          />
          <Tooltip
            formatter={(v: number, n: string, props: any) => {
              if (n === "pct") {
                return [`${v.toFixed(1)}% (${formatMXN(props.payload.monto)})`, "Exposición"];
              }
              return [v, n];
            }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
          <Bar dataKey="pct" radius={[0, 6, 6, 0]} maxBarSize={32}>
            {data.map((_, i) => (
              <Cell key={i} fill="#3d72f4" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function VintageTab() {
  const { data, loading, error, refetch } = useFetch(fetchVintage);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Análisis de cosechas: NPL ratio por trimestre de originación. Permite distinguir
        deterioro estructural (cosechas malas) de coyuntural (toda la cartera afectada).
      </p>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Cosecha</TH>
              <TH className="text-center">Créditos</TH>
              <TH className="text-right">Monto originado</TH>
              <TH className="text-right">Saldo actual</TH>
              <TH className="text-right">Saldo en problemas</TH>
              <TH className="text-right">NPL ratio</TH>
            </TR>
          </THead>
          <TBody>
            {(data ?? []).map((v: VintageItem) => (
              <TR key={v.cosecha}>
                <TD className="font-mono text-sm">{v.cosecha}</TD>
                <TD className="text-center">{v.creditos}</TD>
                <TD className="text-right tabular-nums">{formatMXN(v.monto_originado)}</TD>
                <TD className="text-right tabular-nums">{formatMXN(v.saldo_actual)}</TD>
                <TD className="text-right tabular-nums text-red-700">
                  {formatMXN(v.saldo_problemas)}
                </TD>
                <TD className="text-right">
                  {Number(v.npl_ratio_pct) > 20 ? (
                    <Badge tone="red" dot>
                      {Number(v.npl_ratio_pct).toFixed(1)}%
                    </Badge>
                  ) : Number(v.npl_ratio_pct) > 5 ? (
                    <Badge tone="yellow" dot>
                      {Number(v.npl_ratio_pct).toFixed(1)}%
                    </Badge>
                  ) : (
                    <Badge tone="green" dot>
                      {Number(v.npl_ratio_pct).toFixed(1)}%
                    </Badge>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}

function EWITab() {
  const indicators = [
    {
      nombre: "Caída en buró de crédito ≥ 50 pts",
      descripcion: "Disparador automático de revisión y contacto preventivo",
      activos: 0,
      umbral: "50 puntos",
      criticidad: "alta" as const,
    },
    {
      nombre: "DSCR proyectado < 1.0x",
      descripcion: "Capacidad de pago por debajo del servicio de deuda",
      activos: 1,
      umbral: "DSCR < 1.0x",
      criticidad: "alta" as const,
    },
    {
      nombre: "Demanda en RPP",
      descripcion: "Demandas mercantiles o civiles contra el acreditado",
      activos: 1,
      umbral: "Cualquiera",
      criticidad: "alta" as const,
    },
    {
      nombre: "Concentración con cliente del cliente > 40%",
      descripcion: "Riesgo en cadena de valor",
      activos: 1,
      umbral: "40% facturación",
      criticidad: "media" as const,
    },
    {
      nombre: "Documento vigente vencido",
      descripcion: "EEFF, Opinión 32-D, CSF fuera de fecha",
      activos: 2,
      umbral: "+30 días",
      criticidad: "media" as const,
    },
    {
      nombre: "Reducción ingresos > 20% mensual",
      descripcion: "Caída material en flujos de caja del acreditado",
      activos: 0,
      umbral: "20% mensual",
      criticidad: "media" as const,
    },
    {
      nombre: "Atraso en pago > 7 días",
      descripcion: "Disparo a cobranza preventiva",
      activos: 1,
      umbral: "7 días",
      criticidad: "baja" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Catálogo de Early Warning Indicators (EWI). Cada indicador dispara automáticamente
        revisión por parte del equipo de cobranza, comité o jurídico.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {indicators.map((ind) => (
          <Card
            key={ind.nombre}
            className={
              ind.activos > 0
                ? "shadow-none border-amber-200 bg-amber-50/30"
                : "shadow-none border-slate-200"
            }
          >
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    {ind.activos > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className="text-sm font-medium text-navy-900">{ind.nombre}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 ml-6">{ind.descripcion}</p>
                </div>
                <Badge
                  tone={
                    ind.criticidad === "alta"
                      ? "red"
                      : ind.criticidad === "media"
                      ? "yellow"
                      : "blue"
                  }
                  dot
                >
                  {ind.criticidad}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Umbral: <span className="font-medium text-navy-700">{ind.umbral}</span>
                </span>
                <span
                  className={
                    ind.activos > 0
                      ? "text-amber-700 font-medium"
                      : "text-slate-500"
                  }
                >
                  {ind.activos > 0
                    ? `${ind.activos} crédito(s) activos`
                    : "Sin disparos"}
                </span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StressTab() {
  const escenarios = [
    {
      nombre: "TIIE +200 pb",
      descripcion: "Choque al alza en TIIE Fondeo. El costo financiero sube ~10% y el spread se comprime.",
      impactoSpread: -2.0,
      impactoROE: -8.5,
      probabilidad: "Media",
      mitigacion: "Renegociar tasas activas con clientes; pricing engine reactivo",
    },
    {
      nombre: "Depreciación MXN 15%",
      descripcion: "Tipo de cambio MXN/USD pasa de 17.46 a 20.08. Pasivos USD se incrementan en pesos.",
      impactoSpread: 0.0,
      impactoROE: -12.3,
      probabilidad: "Media",
      mitigacion: "Cobertura natural / sintética con NDF o swaps cross-currency",
    },
    {
      nombre: "Caída ingresos PYME 20%",
      descripcion: "Recesión sectorial. DSCR de cartera cae; aumenta probabilidad de incumplimiento.",
      impactoSpread: 0.0,
      impactoROE: -18.7,
      probabilidad: "Media-Alta",
      mitigacion: "Restructuras preventivas; aumento de provisiones IFRS 9 Stage 2",
    },
    {
      nombre: "Deterioro garantías -25%",
      descripcion: "Caída del valor de los inmuebles colaterales. La cobertura promedio baja de 2.24x a 1.68x.",
      impactoSpread: 0.0,
      impactoROE: -5.2,
      probabilidad: "Baja",
      mitigacion: "Re-avalúo trimestral; activar covenants de cobertura mínima",
    },
    {
      nombre: "Pull de línea Meridian Capital Bank",
      descripcion: "Meridian ejerce MAC clause y reduce advance rate del 75% al 50%.",
      impactoSpread: 0.0,
      impactoROE: -25.0,
      probabilidad: "Baja",
      mitigacion: "Líneas backup con Bancomext / NAFIN; securitización privada",
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Escenarios institucionales de stress testing con impacto estimado al margen
        financiero (NIM) y al ROE. Reverse stress en revisión semestral.
      </p>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Escenario</TH>
              <TH className="text-center">Probabilidad</TH>
              <TH className="text-right">Δ Spread (pp)</TH>
              <TH className="text-right">Δ ROE (pp)</TH>
              <TH>Mitigación</TH>
            </TR>
          </THead>
          <TBody>
            {escenarios.map((e) => (
              <TR key={e.nombre}>
                <TD>
                  <p className="font-medium text-navy-900">{e.nombre}</p>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-md">{e.descripcion}</p>
                </TD>
                <TD className="text-center">
                  <Badge
                    tone={
                      e.probabilidad === "Baja"
                        ? "neutral"
                        : e.probabilidad.includes("Alta")
                        ? "red"
                        : "yellow"
                    }
                  >
                    {e.probabilidad}
                  </Badge>
                </TD>
                <TD className="text-right tabular-nums text-red-700 font-medium">
                  {e.impactoSpread.toFixed(1)}
                </TD>
                <TD className="text-right tabular-nums text-red-700 font-medium">
                  {e.impactoROE.toFixed(1)}
                </TD>
                <TD className="text-xs text-slate-700 max-w-md">{e.mitigacion}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: "amber" | "emerald" | "brand";
}) {
  const colors = {
    amber: "text-amber-700",
    emerald: "text-emerald-700",
    brand: "text-brand-700",
  };
  return (
    <div className="bg-slate-50/60 border border-slate-200 rounded-lg p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${colors[tone]}`}>{value}</p>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}
