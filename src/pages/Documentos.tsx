import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Upload,
} from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { ErrorBlock, LoadingBlock } from "@/components/ui/States";
import { useFetch } from "@/hooks/useFetch";
import { useToast } from "@/hooks/useToast";
import { fetchDocumentosRecurrentes, marcarDocumentoRecurrenteRecibido } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { DocumentoRecurrente, FrecuenciaDoc } from "@/lib/types";

const FRECUENCIA_LABEL: Record<FrecuenciaDoc, string> = {
  UNICA: "Única vez",
  TRIMESTRAL: "Cada 3 meses",
  SEMESTRAL: "Cada 6 meses",
  ANUAL: "Anual",
  CADA_24M: "Cada 24 meses",
};

const FRECUENCIA_MESES: Record<FrecuenciaDoc, number | null> = {
  UNICA: null,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
  CADA_24M: 24,
};

function proximaActualizacionPara(frecuencia: FrecuenciaDoc): string | null {
  const meses = FRECUENCIA_MESES[frecuencia];
  if (meses == null) return null;
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() + meses);
  return fecha.toISOString().slice(0, 10);
}

export default function Documentos() {
  const [tab, setTab] = useState("requeridos");
  const docs = useFetch(fetchDocumentosRecurrentes);

  const counts = useMemo(() => {
    const list = docs.data ?? [];
    return {
      requeridos: list.filter((d) => d.estatus === "PENDIENTE" || d.alerta === "POR_VENCER" || d.alerta === "VENCIDO").length,
      historial: list.filter((d) => d.estatus === "VALIDO").length,
      calendario: list.length,
    };
  }, [docs.data]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-navy-900">
          Documentos y Actualizaciones
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Gestión de documentos recurrentes sobre créditos vivos: estados financieros,
          declaración anual, opinión 32-D SAT, CSF, avalúo.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiDoc
          label="Requeridos"
          value={counts.requeridos}
          subtitle="Pendientes / por vencer / vencidos"
          tone="amber"
          icon={AlertTriangle}
        />
        <KpiDoc
          label="Vigentes"
          value={counts.historial}
          subtitle="Recibidos y validados"
          tone="emerald"
          icon={CheckCircle2}
        />
        <KpiDoc
          label="Próximos 30 días"
          value={(docs.data ?? []).filter((d) => d.alerta === "POR_VENCER").length}
          subtitle="Por vencer en el mes"
          tone="brand"
          icon={Clock}
        />
      </section>

      <Card>
        <div className="px-6 pt-2">
          <Tabs
            items={[
              { id: "requeridos", label: "Requeridos", count: counts.requeridos },
              { id: "historial", label: "Historial", count: counts.historial },
              { id: "calendario", label: "Calendario", count: counts.calendario },
            ]}
            active={tab}
            onChange={setTab}
            className="border-b-0"
          />
        </div>

        <div className="border-t border-slate-100">
          {docs.loading ? (
            <LoadingBlock />
          ) : docs.error ? (
            <div className="p-6">
              <ErrorBlock message={docs.error} onRetry={docs.refetch} />
            </div>
          ) : (
            <>
              {tab === "requeridos" && (
                <RequeridosTab
                  data={(docs.data ?? []).filter((d) => d.estatus !== "VALIDO" || d.alerta === "POR_VENCER" || d.alerta === "VENCIDO")}
                  onUpdated={docs.refetch}
                />
              )}
              {tab === "historial" && (
                <HistorialTab data={(docs.data ?? []).filter((d) => d.estatus === "VALIDO")} />
              )}
              {tab === "calendario" && <CalendarioTab data={docs.data ?? []} />}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

function KpiDoc({
  label,
  value,
  subtitle,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  subtitle: string;
  tone: "amber" | "emerald" | "brand";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const colors = {
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    brand: "bg-brand-50 text-brand-700",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-navy-900">{label}</p>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${colors[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-semibold text-navy-900 tabular-nums">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    </div>
  );
}

function RequeridosTab({
  data,
  onUpdated,
}: {
  data: DocumentoRecurrente[];
  onUpdated: () => void;
}) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const toast = useToast();

  async function marcarRecibido(d: DocumentoRecurrente) {
    setSavingId(d.id);
    try {
      await marcarDocumentoRecurrenteRecibido(d.id, proximaActualizacionPara(d.frecuencia));
      onUpdated();
      toast.success("Documento actualizado", `${d.documento} se marcó como recibido.`);
    } catch (err) {
      toast.error(
        "No se pudo actualizar el documento",
        err instanceof Error ? err.message : "Ocurrió un error inesperado."
      );
    } finally {
      setSavingId(null);
    }
  }

  if (data.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-slate-500">
        Sin documentos requeridos. Toda la cartera está al corriente.
      </div>
    );
  }
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy-900">
          Documentos requeridos por la cartera vigente
        </h3>
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Documento</TH>
              <TH>Crédito · Cliente</TH>
              <TH>Frecuencia</TH>
              <TH>Última actualización</TH>
              <TH>Próxima actualización</TH>
              <TH>Estatus</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {data.map((d) => (
              <TR key={d.id}>
                <TD className="font-medium">{d.documento}</TD>
                <TD>
                  <div className="text-xs font-mono text-brand-700">
                    {d.contrato_numero}
                  </div>
                  <div className="text-xs text-slate-500">{d.cliente_nombre}</div>
                </TD>
                <TD className="text-slate-700 text-xs">
                  {FRECUENCIA_LABEL[d.frecuencia]}
                </TD>
                <TD className="text-slate-500 text-xs">
                  {d.fecha_carga ? formatDate(d.fecha_carga) : "—"}
                </TD>
                <TD className="text-slate-700 text-xs">
                  {d.proxima_actualizacion ? formatDate(d.proxima_actualizacion) : "—"}
                  {d.dias_para_vencer != null && d.dias_para_vencer >= 0 && (
                    <span className="block text-[11px] text-slate-400">
                      en {d.dias_para_vencer} días
                    </span>
                  )}
                </TD>
                <TD>
                  {d.alerta === "VENCIDO" ? (
                    <Badge tone="red" dot>Vencido</Badge>
                  ) : d.alerta === "POR_VENCER" ? (
                    <Badge tone="yellow" dot>Por vencer</Badge>
                  ) : d.estatus === "PENDIENTE" ? (
                    <Badge tone="yellow" dot>Pendiente</Badge>
                  ) : (
                    <Badge tone="green" dot>Vigente</Badge>
                  )}
                </TD>
                <TD className="text-right">
                  <Button
                    size="sm"
                    disabled={savingId === d.id}
                    onClick={() => marcarRecibido(d)}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {savingId === d.id ? "Subiendo…" : "Subir"}
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}

function HistorialTab({ data }: { data: DocumentoRecurrente[] }) {
  if (data.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-slate-500">
        No hay documentos en el historial.
      </div>
    );
  }
  return (
    <div className="p-6">
      <h3 className="text-sm font-semibold text-navy-900 mb-4">
        Documentos validados ({data.length})
      </h3>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Documento</TH>
              <TH>Crédito · Cliente</TH>
              <TH>Cargado</TH>
              <TH>Vigente hasta</TH>
              <TH>Estatus</TH>
            </TR>
          </THead>
          <TBody>
            {data.map((d) => (
              <TR key={d.id}>
                <TD className="font-medium">{d.documento}</TD>
                <TD>
                  <div className="text-xs font-mono text-brand-700">
                    {d.contrato_numero}
                  </div>
                  <div className="text-xs text-slate-500">{d.cliente_nombre}</div>
                </TD>
                <TD className="text-slate-500 text-xs">
                  {d.fecha_carga ? formatDate(d.fecha_carga) : "—"}
                </TD>
                <TD className="text-slate-700 text-xs">
                  {d.proxima_actualizacion ? formatDate(d.proxima_actualizacion) : "—"}
                </TD>
                <TD>
                  <Badge tone="green" dot>Validado</Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}

function CalendarioTab({ data }: { data: DocumentoRecurrente[] }) {
  // Agrupar por mes de próxima actualización
  const grouped = useMemo(() => {
    const m = new Map<string, DocumentoRecurrente[]>();
    data.forEach((d) => {
      if (!d.proxima_actualizacion) return;
      const key = new Date(d.proxima_actualizacion).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
      });
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(d);
    });
    return Array.from(m.entries()).sort(
      (a, b) =>
        new Date(a[1][0].proxima_actualizacion!).getTime() -
        new Date(b[1][0].proxima_actualizacion!).getTime()
    );
  }, [data]);

  return (
    <div className="p-6">
      <h3 className="text-sm font-semibold text-navy-900 mb-4">
        Calendario de actualizaciones próximas
      </h3>
      <div className="space-y-5">
        {grouped.map(([mes, docs]) => (
          <Card key={mes} className="shadow-none border-slate-200">
            <CardHeader>
              <CardTitle className="capitalize text-sm">
                <CalendarDays className="h-4 w-4 inline mr-2 text-brand-600" />
                {mes}
              </CardTitle>
              <span className="text-xs text-slate-500">{docs.length} documentos</span>
            </CardHeader>
            <CardBody className="space-y-2">
              {docs.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[40px]">
                      <p className="text-xs text-slate-500 uppercase">
                        {new Date(d.proxima_actualizacion!).toLocaleDateString("es-MX", {
                          month: "short",
                        })}
                      </p>
                      <p className="text-lg font-semibold text-navy-900 leading-none">
                        {new Date(d.proxima_actualizacion!).getDate()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy-900">
                        {d.documento}
                      </p>
                      <p className="text-xs text-slate-500">
                        {d.contrato_numero} · {d.cliente_nombre}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      {FRECUENCIA_LABEL[d.frecuencia]}
                    </span>
                    {d.alerta === "VENCIDO" ? (
                      <Badge tone="red" dot>Vencido</Badge>
                    ) : d.alerta === "POR_VENCER" ? (
                      <Badge tone="yellow" dot>Por vencer</Badge>
                    ) : (
                      <Badge tone="green" dot>Programado</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        ))}
        {grouped.length === 0 && (
          <p className="text-center text-sm text-slate-500 py-12">
            Sin actualizaciones programadas.
          </p>
        )}
      </div>
    </div>
  );
}
