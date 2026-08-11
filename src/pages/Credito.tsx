import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Eye } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { ErrorBlock, LoadingBlock } from "@/components/ui/States";
import { useFetch } from "@/hooks/useFetch";
import {
  fetchAmortizacionByCredito,
  fetchCreditoByContrato,
  fetchCreditos,
} from "@/lib/api";
import { formatDate, formatMXN } from "@/lib/format";
import { addInfoRows, addSectionTitle, addTable, createLedgerlyDocument, finishAndDownload } from "@/lib/pdf";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import type { CreditoFull, EstatusCredito } from "@/lib/types";

const ESTATUS_LABEL: Record<EstatusCredito, string> = {
  VIGENTE: "Vigente",
  MORA: "Mora",
  JURIDICO: "Jurídico",
  CASTIGADO: "Castigado",
  LIQUIDADO: "Liquidado",
};

export default function Credito() {
  const { id } = useParams();
  if (id) return <CreditoDetalle contrato={id} />;
  return <CarteraIndex />;
}

function CarteraIndex() {
  const { data, loading, error, refetch } = useFetch(fetchCreditos);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-navy-900">Cartera</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Créditos vigentes, monitoreo continuo y desempeño.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Créditos en cartera</CardTitle>
          <span className="text-xs text-slate-500">
            {data
              ? `${data.length} créditos · Saldo total ${formatMXN(
                  data.reduce((a, c) => a + (c.saldo_insoluto ?? 0), 0)
                )}`
              : ""}
          </span>
        </CardHeader>

        {loading ? (
          <LoadingBlock />
        ) : error ? (
          <div className="p-6"><ErrorBlock message={error} onRetry={refetch} /></div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Crédito</TH>
                <TH>Empresa</TH>
                <TH>Tipo</TH>
                <TH className="text-right">Saldo insoluto</TH>
                <TH>Estatus</TH>
                <TH className="text-center">Días atraso</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {(data ?? []).map((c) => (
                <TR key={c.id}>
                  <TD className="font-medium text-brand-700">{c.contrato_numero}</TD>
                  <TD>
                    <div className="font-medium">{c.cliente_nombre}</div>
                    <div className="text-xs text-slate-500">{c.cliente_rfc ?? ""}</div>
                  </TD>
                  <TD className="text-slate-700 text-xs">{c.tipo_nombre}</TD>
                  <TD className="text-right tabular-nums">
                    {formatMXN(c.saldo_insoluto ?? c.monto_original)}
                  </TD>
                  <TD>
                    <StatusBadge value={ESTATUS_LABEL[c.estatus_codigo]} />
                  </TD>
                  <TD className="text-center">
                    {c.dias_atraso > 0 ? (
                      <span className="text-red-600 font-medium">{c.dias_atraso}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TD>
                  <TD className="text-right">
                    <Link
                      to={`/cartera/${c.contrato_numero}`}
                      className="text-brand-600 text-sm font-medium hover:underline inline-flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver
                    </Link>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function CreditoDetalle({ contrato }: { contrato: string }) {
  const [tab, setTab] = useState("estado");
  const cred = useFetch(() => fetchCreditoByContrato(contrato), [contrato]);

  if (cred.loading) return <div className="py-20"><LoadingBlock /></div>;
  if (cred.error || !cred.data) {
    return <ErrorBlock message={cred.error ?? "No se encontró el crédito"} onRetry={cred.refetch} />;
  }
  const c = cred.data;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/cartera"
          className="text-sm text-slate-500 hover:text-navy-700 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Cartera
        </Link>
        <header className="mt-3 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-navy-900">
                Crédito: {c.contrato_numero}
              </h1>
              <StatusBadge value={ESTATUS_LABEL[c.estatus_codigo]} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {c.cliente_nombre} · RFC {c.cliente_rfc ?? "—"} · {c.tipo_nombre}
            </p>
          </div>
        </header>
      </div>

      <Card>
        <div className="px-6 pt-2">
          <Tabs
            items={[
              { id: "estado", label: "Estado de cuenta" },
              { id: "amortizacion", label: "Amortización" },
              { id: "monitoreo", label: "Monitoreo" },
            ]}
            active={tab}
            onChange={setTab}
            className="border-b-0"
          />
        </div>
        <div className="border-t border-slate-100">
          {tab === "estado" && <EstadoCuentaTab c={c} />}
          {tab === "amortizacion" && <AmortizacionTab creditoId={c.id} />}
          {tab === "monitoreo" && <MonitoreoTab c={c} />}
        </div>
      </Card>
    </div>
  );
}

function EstadoCuentaTab({ c }: { c: CreditoFull }) {
  const { user } = useAuth();
  const toast = useToast();
  const saldo = c.saldo_insoluto ?? c.monto_original;
  const interesPeriodo = (saldo * c.tasa_anual) / 12;
  const ivaInteres = c.aplica_iva ? interesPeriodo * 0.16 : 0;
  const capital = c.cuota_mensual ? c.cuota_mensual - interesPeriodo : 0;
  const totalProximo = c.cuota_mensual ? c.cuota_mensual + ivaInteres : interesPeriodo + ivaInteres;

  function handleDescargarEstadoCuenta() {
    const { doc, y } = createLedgerlyDocument({
      title: "Estado de cuenta",
      category: "Cartera de crédito",
      folio: c.contrato_numero,
      periodo: new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
      generadoPor: user?.email ?? "—",
    });
    let cursor = addInfoRows(doc, y, [
      ["Empresa", c.cliente_nombre],
      ["RFC", c.cliente_rfc ?? "—"],
      ["Tipo de crédito", c.tipo_nombre],
      ["Estatus", ESTATUS_LABEL[c.estatus_codigo]],
    ]);

    cursor = addSectionTitle(doc, cursor, "Condiciones del crédito");
    cursor = addInfoRows(doc, cursor, [
      ["Monto original", formatMXN(c.monto_original)],
      ["Saldo insoluto", formatMXN(saldo)],
      ["Plazo", c.plazo_meses ? `${c.plazo_meses} meses` : "—"],
      ["Tasa anual", `${(c.tasa_anual * 100).toFixed(2)}%`],
      ["Fecha de inicio", c.fecha_inicio ? formatDate(c.fecha_inicio) : "—"],
      ["Vencimiento", c.fecha_vencimiento ? formatDate(c.fecha_vencimiento) : "—"],
      [
        "Cobertura de garantía",
        c.cobertura_garantia ? `${c.cobertura_garantia.toFixed(2)}x` : "—",
      ],
    ]);

    cursor = addSectionTitle(doc, cursor, "Detalle del próximo pago");
    addTable(
      doc,
      cursor,
      ["Concepto", "Importe"],
      [
        ["Capital", formatMXN(Math.max(capital, 0))],
        ["Intereses", formatMXN(interesPeriodo)],
        [`IVA intereses ${c.aplica_iva ? "(16%)" : "(no aplica)"}`, formatMXN(ivaInteres)],
        ["Total", formatMXN(totalProximo)],
      ]
    );

    finishAndDownload(doc, `Estado_cuenta_${c.contrato_numero}.pdf`);
    toast.success("Estado de cuenta descargado", `${c.contrato_numero} se descargó correctamente.`);
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Stat label="Monto original" value={formatMXN(c.monto_original)} />
          <Stat label="Saldo insoluto" value={formatMXN(saldo)} />
          <Stat label="Plazo" value={c.plazo_meses ? `${c.plazo_meses} meses` : "—"} />
          <Stat label="Tasa anual" value={`${(c.tasa_anual * 100).toFixed(2)}%`} />
          <Stat
            label="Fecha inicio"
            value={c.fecha_inicio ? formatDate(c.fecha_inicio) : "—"}
          />
          <Stat
            label="Vencimiento"
            value={c.fecha_vencimiento ? formatDate(c.fecha_vencimiento) : "—"}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-navy-900 mb-3">
            Detalle del próximo pago
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>Concepto</TH>
                  <TH className="text-right">Importe</TH>
                </TR>
              </THead>
              <TBody>
                <TR>
                  <TD>Capital</TD>
                  <TD className="text-right tabular-nums">{formatMXN(Math.max(capital, 0))}</TD>
                </TR>
                <TR>
                  <TD>Intereses</TD>
                  <TD className="text-right tabular-nums">{formatMXN(interesPeriodo)}</TD>
                </TR>
                <TR>
                  <TD>IVA intereses {c.aplica_iva ? "(16%)" : "(no aplica)"}</TD>
                  <TD className="text-right tabular-nums">{formatMXN(ivaInteres)}</TD>
                </TR>
                <TR className="bg-slate-50/60 font-semibold">
                  <TD>Total</TD>
                  <TD className="text-right tabular-nums">{formatMXN(totalProximo)}</TD>
                </TR>
              </TBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="shadow-none border-slate-200">
          <CardBody>
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Cobertura garantía
            </p>
            <p className="text-2xl font-semibold text-navy-900 mt-1">
              {c.cobertura_garantia ? `${c.cobertura_garantia.toFixed(2)}x` : "—"}
            </p>
            {c.cobertura_garantia && (
              <Badge
                tone={c.cobertura_garantia >= 2 ? "green" : "yellow"}
                dot
                className="mt-1"
              >
                {c.cobertura_garantia >= 2 ? "Aceptable" : "En revisión"}
              </Badge>
            )}
          </CardBody>
        </Card>
        <Card className="shadow-none border-slate-200">
          <CardBody>
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              Intercompañía
            </p>
            <p className="text-2xl font-semibold text-navy-900 mt-1">
              {c.intercompania ? "Sí" : "No"}
            </p>
          </CardBody>
        </Card>
        <Button variant="outline" className="w-full" onClick={handleDescargarEstadoCuenta}>
          Ver estado de cuenta completo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function AmortizacionTab({ creditoId }: { creditoId: string }) {
  const { data, loading, error, refetch } = useFetch(
    () => fetchAmortizacionByCredito(creditoId),
    [creditoId]
  );

  if (loading) return <LoadingBlock />;
  if (error) return <div className="p-6"><ErrorBlock message={error} onRetry={refetch} /></div>;
  if (!data || data.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-slate-500">
        Este crédito no tiene tabla de amortización registrada (típico de créditos
        revolventes o intercompañía).
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-navy-900">
          Tabla de amortización ({data.length} periodos)
        </h3>
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH className="text-center">Periodo</TH>
              <TH>Fecha pago</TH>
              <TH className="text-right">Saldo inicial</TH>
              <TH className="text-right">Cuota</TH>
              <TH className="text-right">Intereses</TH>
              <TH className="text-right">IVA</TH>
              <TH className="text-right">Capital</TH>
              <TH className="text-right">Saldo final</TH>
              <TH className="text-right">Pago total</TH>
            </TR>
          </THead>
          <TBody>
            {data.map((p) => (
              <TR key={p.id}>
                <TD className="text-center font-medium">{p.periodo}</TD>
                <TD className="text-xs text-slate-600">{formatDate(p.fecha_pago)}</TD>
                <TD className="text-right tabular-nums">{formatMXN(p.saldo_inicial)}</TD>
                <TD className="text-right tabular-nums">{formatMXN(p.cuota)}</TD>
                <TD className="text-right tabular-nums">{formatMXN(p.intereses)}</TD>
                <TD className="text-right tabular-nums">{formatMXN(p.iva_intereses)}</TD>
                <TD className="text-right tabular-nums">{formatMXN(p.amortizacion_capital)}</TD>
                <TD className="text-right tabular-nums">{formatMXN(p.saldo_insoluto)}</TD>
                <TD className="text-right tabular-nums font-medium">{formatMXN(p.pago_total)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}

function MonitoreoTab({ c }: { c: CreditoFull }) {
  const puntualidad = c.dias_atraso === 0 ? 100 : Math.max(40, 100 - c.dias_atraso);
  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="shadow-none border-slate-200 lg:col-span-1">
        <CardBody className="text-center">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Puntualidad en pagos
          </p>
          <div className="mt-4 relative h-40 w-40 mx-auto">
            <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={puntualidad >= 90 ? "#10b981" : puntualidad >= 70 ? "#f59e0b" : "#ef4444"}
                strokeWidth="10"
                strokeDasharray={`${(puntualidad / 100) * 326.7} 326.7`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-semibold text-navy-900">{puntualidad}%</span>
              <span className="text-xs text-slate-500 mt-0.5">
                {puntualidad >= 90 ? "Excelente" : puntualidad >= 70 ? "Bueno" : "Atención"}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="shadow-none border-slate-200 lg:col-span-2">
        <CardHeader>
          <CardTitle>Indicadores</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <Indicator
              label="DSCR actual"
              value={c.dscr_actual ? `${c.dscr_actual.toFixed(2)}x` : "—"}
              good={!!c.dscr_actual && c.dscr_actual >= 1.25}
            />
            <Indicator
              label="Score comportamiento"
              value={c.score_comportamiento ? `${c.score_comportamiento} / 100` : "—"}
              good={!!c.score_comportamiento && c.score_comportamiento >= 70}
            />
            <Indicator
              label="Días de atraso"
              value={c.dias_atraso > 0 ? `${c.dias_atraso} días` : "0"}
              good={c.dias_atraso === 0}
            />
            <Indicator
              label="Cobertura garantía"
              value={c.cobertura_garantia ? `${c.cobertura_garantia.toFixed(2)}x` : "—"}
              good={!!c.cobertura_garantia && c.cobertura_garantia >= 2}
            />
            <Indicator
              label="Estatus"
              value={ESTATUS_LABEL[c.estatus_codigo]}
              good={c.estatus_codigo === "VIGENTE"}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-4 bg-slate-50 rounded-lg">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-base font-semibold text-navy-900 mt-1 tabular-nums">{value}</p>
    </div>
  );
}

function Indicator({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-navy-800">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium tabular-nums">{value}</span>
        <span className={good ? "h-2 w-2 rounded-full bg-emerald-500" : "h-2 w-2 rounded-full bg-amber-500"} />
      </div>
    </div>
  );
}
