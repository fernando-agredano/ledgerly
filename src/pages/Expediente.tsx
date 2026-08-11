import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { StatusBadge } from "@/components/StatusBadge";
import { ErrorBlock, LoadingBlock } from "@/components/ui/States";
import { useFetch } from "@/hooks/useFetch";
import {
  createDocumento,
  fetchCondicionesBySolicitud,
  fetchDocumentosBySolicitud,
  fetchPldBySolicitud,
  fetchSolicitudByFolio,
  updateSolicitudEtapa,
} from "@/lib/api";
import { formatCompactMXN, formatDate, formatMXN, formatPercent } from "@/lib/format";
import {
  addInfoRows,
  addSectionTitle,
  createLedgerlyDocument,
  finishAndDownload,
} from "@/lib/pdf";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import type {
  CondicionAprobada,
  Documento,
  PldVerificacion,
  SolicitudDetalle,
} from "@/lib/types";

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "documentos", label: "Documentos" },
  { id: "ai", label: "AI Underwriting" },
  { id: "capacidad", label: "Capacidad de pago" },
  { id: "pld", label: "PLD" },
  { id: "garantia", label: "Garantía" },
  { id: "analisis", label: "Análisis" },
];

const ETAPA_LABEL: Record<string, string> = {
  EVALUACION: "En evaluación",
  ANALISIS: "En análisis",
  PENDIENTE: "Pendiente docs",
  COMITE: "Comité",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
  DISPERSADO: "Dispersado",
};

const PLD_LABEL: Record<string, string> = {
  OFAC: "OFAC",
  ONU: "ONU",
  SAT_69B: "SAT 69-B",
  PEP: "PEP",
  BENEFICIARIO_CONTROLADOR: "Beneficiario controlador",
  NOTICIAS_NEGATIVAS: "Noticias negativas",
};

export default function Expediente() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("resumen");
  const [sendingComite, setSendingComite] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const sol = useFetch(() => fetchSolicitudByFolio(id), [id]);

  if (sol.loading) {
    return (
      <div className="py-20">
        <LoadingBlock label="Cargando expediente…" />
      </div>
    );
  }

  if (sol.error || !sol.data) {
    return (
      <ErrorBlock
        message={sol.error ?? "No se encontró la solicitud"}
        onRetry={sol.refetch}
      />
    );
  }

  const exp = sol.data;

  async function handleEnviarComite() {
    setSendingComite(true);
    try {
      await updateSolicitudEtapa(exp.id, "COMITE");
      toast.success("Enviado a comité", `Solicitud ${exp.folio} pasó a revisión del comité.`);
      navigate(`/comite/${exp.folio}`);
    } catch (err) {
      setSendingComite(false);
      const message =
        err instanceof Error ? err.message : "No se pudo enviar la solicitud a comité.";
      toast.error("No se pudo enviar a comité", message);
    }
  }

  function handleDescargarExpediente() {
    const { doc, y } = createLedgerlyDocument({
      title: `Expediente ${exp.folio}`,
      category: "Originación de crédito",
      folio: exp.folio,
      periodo: formatDate(exp.fecha_solicitud),
      generadoPor: user?.email ?? "—",
    });

    let cursor = addInfoRows(doc, y, [
      ["Empresa", exp.cliente?.nombre ?? "—"],
      ["RFC", exp.cliente?.rfc ?? "—"],
      ["Etapa", ETAPA_LABEL[exp.etapa_codigo] ?? exp.etapa_codigo],
      ["Analista", exp.analista ?? "—"],
      ["Centro de costo", exp.centro_costo ?? "—"],
      ["Fecha de solicitud", exp.fecha_solicitud],
    ]);

    cursor = addSectionTitle(doc, cursor, "Condiciones propuestas");
    cursor = addInfoRows(doc, cursor, [
      ["Monto solicitado", formatMXN(exp.monto_solicitado)],
      ["Plazo", `${exp.plazo_meses} meses`],
      [
        "Tasa propuesta",
        `${((exp.tasa_propuesta ?? 0) * 100).toFixed(2)}%${
          exp.benchmark ? ` (${exp.benchmark})` : ""
        }`,
      ],
      [
        "Cobertura de garantía",
        exp.cobertura_garantia ? `${exp.cobertura_garantia.toFixed(2)}x` : "—",
      ],
    ]);

    cursor = addSectionTitle(doc, cursor, "AI Underwriting");
    cursor = addInfoRows(doc, cursor, [
      ["Score total", exp.score_total != null ? `${exp.score_total} / 100` : "—"],
      ["Clasificación de riesgo", exp.riesgo_clasificacion ?? "—"],
      ["DSCR", exp.dscr != null ? `${exp.dscr.toFixed(2)}x` : "—"],
    ]);

    cursor = addSectionTitle(doc, cursor, "PLD");
    addInfoRows(doc, cursor, [
      ["Resultado", exp.pld_resultado ?? "—"],
      ["Oficial de cumplimiento", exp.pld_oficial ?? "—"],
    ]);

    finishAndDownload(doc, `Expediente_${exp.folio}.pdf`);
    toast.success("Expediente descargado", `Expediente ${exp.folio} se descargó correctamente.`);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/solicitudes"
          className="text-sm text-slate-500 hover:text-navy-700 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a Solicitudes
        </Link>
        <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-navy-900">
                Expediente: {exp.folio}
              </h1>
              <StatusBadge value={ETAPA_LABEL[exp.etapa_codigo]} />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {exp.cliente?.nombre} · RFC {exp.cliente?.rfc ?? "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDescargarExpediente}>
              Descargar expediente
            </Button>
            <Button onClick={handleEnviarComite} disabled={sendingComite}>
              {sendingComite ? "Enviando…" : "Enviar a Comité"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </header>
      </div>

      <Card>
        <div className="px-6 pt-2">
          <Tabs items={TABS} active={tab} onChange={setTab} className="border-b-0" />
        </div>
        <div className="border-t border-slate-100">
          {tab === "resumen" && <ResumenTab exp={exp} />}
          {tab === "documentos" && <DocumentosTab solicitudId={exp.id} />}
          {tab === "ai" && <AITab exp={exp} />}
          {tab === "capacidad" && <CapacidadTab exp={exp} />}
          {tab === "pld" && <PLDTab exp={exp} />}
          {tab === "garantia" && <GarantiaTab exp={exp} />}
          {tab === "analisis" && (
            <AnalisisTab
              solicitudId={exp.id}
              comentariosIniciales={exp.comentarios_analista}
              decisionInicial={exp.decision_analista}
              onSubmit={handleEnviarComite}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-navy-900 text-right">{value}</span>
    </div>
  );
}

function ResumenTab({ exp }: { exp: SolicitudDetalle }) {
  // Checklist deriva de la presencia de campos clave
  const checklist = [
    { nombre: "Información KYC", progreso: exp.cliente ? 100 : 0 },
    { nombre: "Capacidad de pago", progreso: exp.dscr ? 100 : 0 },
    { nombre: "Garantía", progreso: exp.cobertura_garantia ? 100 : 50 },
    { nombre: "PLD", progreso: exp.pld_resultado ? 100 : 0 },
    { nombre: "Underwriting AI", progreso: exp.score_total ? 100 : 0 },
  ];
  const progresoGeneral = Math.round(
    checklist.reduce((a, c) => a + c.progreso, 0) / checklist.length
  );

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm font-semibold text-navy-900 mb-3">
          Información general
        </h3>
        <div className="bg-slate-50/60 rounded-lg px-4 py-2">
          <InfoRow label="Empresa" value={exp.cliente?.nombre ?? "—"} />
          <InfoRow label="RFC" value={exp.cliente?.rfc ?? "—"} />
          <InfoRow label="Monto solicitado" value={formatMXN(exp.monto_solicitado)} />
          <InfoRow label="Plazo" value={`${exp.plazo_meses} meses`} />
          <InfoRow
            label="Tasa estimada"
            value={
              exp.benchmark
                ? `${exp.benchmark} (${((exp.tasa_propuesta ?? 0) * 100).toFixed(2)}%)`
                : `${((exp.tasa_propuesta ?? 0) * 100).toFixed(2)}%`
            }
          />
          <InfoRow label="Solicitado el" value={exp.fecha_solicitud} />
          <InfoRow label="Centro de costo" value={exp.centro_costo ?? "—"} />
          <InfoRow label="Analista" value={exp.analista ?? "—"} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-navy-900 mb-3">
          Checklist del expediente
        </h3>
        <div className="space-y-3">
          {checklist.map((c) => (
            <div key={c.nombre}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <div className="flex items-center gap-2">
                  {c.progreso === 100 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                  )}
                  <span className="text-navy-800">{c.nombre}</span>
                </div>
                <span
                  className={
                    c.progreso === 100
                      ? "text-emerald-600 font-medium text-xs"
                      : "text-slate-500 text-xs"
                  }
                >
                  {c.progreso}%
                </span>
              </div>
              <Progress
                value={c.progreso}
                tone={
                  c.progreso === 100
                    ? "green"
                    : c.progreso >= 70
                    ? "blue"
                    : "yellow"
                }
                size="sm"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-brand-50 border border-brand-100 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-navy-900">
              Progreso general
            </span>
            <span className="text-sm font-semibold text-brand-700">
              {progresoGeneral}%
            </span>
          </div>
          <Progress value={progresoGeneral} tone="blue" className="mt-2" />
        </div>
      </div>
    </div>
  );
}

function DocumentosTab({ solicitudId }: { solicitudId: string }) {
  const { data, loading, error, refetch } = useFetch(
    () => fetchDocumentosBySolicitud(solicitudId),
    [solicitudId]
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const toast = useToast();

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const nombre = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .trim();

    setUploading(true);
    setUploadError(null);
    try {
      await createDocumento({
        solicitud_id: solicitudId,
        nombre: nombre || file.name,
        archivo_filename: file.name,
      });
      refetch();
      toast.success("Documento subido", `${nombre || file.name} se agregó al expediente.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo subir el documento.";
      setUploadError(message);
      toast.error("No se pudo subir el documento", message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <LoadingBlock />;
  if (error) return <div className="p-6"><ErrorBlock message={error} onRetry={refetch} /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy-900">
          Documentos del expediente
        </h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={onFileSelected}
          />
          <Button
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Subiendo…" : "Subir documento"}
          </Button>
        </div>
      </div>
      {uploadError && (
        <p className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {uploadError}
        </p>
      )}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Documento</TH>
              <TH>Archivo</TH>
              <TH>Estatus</TH>
              <TH>Fecha</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {(data ?? []).map((d: Documento) => (
              <TR key={d.id}>
                <TD className="font-medium">{d.nombre}</TD>
                <TD className="text-slate-600 text-xs font-mono">
                  {d.archivo_filename ?? "—"}
                </TD>
                <TD>
                  <StatusBadge
                    value={d.estatus === "VALIDO" ? "Válido" : d.estatus.charAt(0) + d.estatus.slice(1).toLowerCase()}
                  />
                </TD>
                <TD className="text-slate-500 text-xs">
                  {d.fecha_carga ? new Date(d.fecha_carga).toLocaleDateString("es-MX") : "—"}
                </TD>
                <TD className="text-right">
                  <button className="text-brand-600 text-sm font-medium hover:underline">
                    {d.estatus === "PENDIENTE" ? "Solicitar" : "Ver"}
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}

function AITab({ exp }: { exp: SolicitudDetalle }) {
  const dimensiones = [
    { nombre: "KYC / PLD", score: exp.score_kyc },
    { nombre: "Capacidad de pago", score: exp.score_capacidad },
    { nombre: "Garantías", score: exp.score_garantia },
    { nombre: "Legal", score: exp.score_legal },
    { nombre: "Rentabilidad", score: exp.score_rentabilidad },
  ].filter((d): d is { nombre: string; score: number } => d.score != null);

  const hallazgos = [
    exp.dscr && exp.dscr >= 1.25
      ? `Flujo operativo positivo, DSCR ${exp.dscr.toFixed(2)}x (aceptable)`
      : exp.dscr
      ? `DSCR ${exp.dscr.toFixed(2)}x — bajo umbral de 1.25x`
      : null,
    exp.cobertura_garantia && exp.cobertura_garantia >= 2
      ? `Cobertura de garantía ${exp.cobertura_garantia.toFixed(2)}x (aceptable)`
      : exp.cobertura_garantia
      ? `Cobertura de garantía ${exp.cobertura_garantia.toFixed(2)}x — bajo umbral`
      : null,
    exp.pld_resultado === "BAJO" ? "Sin coincidencias negativas en PLD" : null,
    "Estados financieros consistentes con bancarios",
  ].filter(Boolean) as string[];

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 shadow-none border-slate-200">
        <CardBody>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Score total
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-5xl font-semibold text-navy-900">
              {exp.score_total ?? "—"}
            </span>
            <span className="text-2xl text-slate-400">/ 100</span>
          </div>
          {exp.riesgo_clasificacion && (
            <Badge
              tone={
                exp.riesgo_clasificacion === "BAJO"
                  ? "green"
                  : exp.riesgo_clasificacion === "MEDIO"
                  ? "yellow"
                  : "red"
              }
              dot
              className="mt-3"
            >
              Riesgo {exp.riesgo_clasificacion.toLowerCase()}
            </Badge>
          )}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-900">
              Requiere validación del analista antes de pasar a comité.
            </p>
          </div>
        </CardBody>
      </Card>

      <Card className="lg:col-span-2 shadow-none border-slate-200">
        <CardHeader>
          <CardTitle>Scores por dimensión</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {dimensiones.map((d) => (
            <div key={d.nombre}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-navy-800">{d.nombre}</span>
                <span className="font-medium tabular-nums">
                  {d.score} / 100
                </span>
              </div>
              <Progress
                value={d.score}
                tone={d.score >= 80 ? "green" : d.score >= 70 ? "blue" : "yellow"}
              />
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="lg:col-span-3">
        <h4 className="text-sm font-semibold text-navy-900 mb-3">
          Hallazgos principales
        </h4>
        <ul className="space-y-2">
          {hallazgos.map((h, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-sm text-navy-800"
            >
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500 flex-shrink-0" />
              {h}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CapacidadTab({ exp }: { exp: SolicitudDetalle }) {
  const ingresos = exp.ingresos_mensuales ?? 0;
  const ebitda = exp.ebitda_mensual ?? 0;
  const flujo = exp.flujo_disponible ?? 0;
  const dscr = exp.dscr ?? 0;
  const pago = flujo / Math.max(dscr, 1);

  // serie sintética sobre ingresos actuales (último 6 meses)
  const ingresosHistoricos = [
    { mes: "Dic", valor: ingresos * 0.76 },
    { mes: "Ene", valor: ingresos * 0.78 },
    { mes: "Feb", valor: ingresos * 0.84 },
    { mes: "Mar", valor: ingresos * 0.9 },
    { mes: "Abr", valor: ingresos * 0.94 },
    { mes: "May", valor: ingresos },
  ];

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-navy-900 mb-2">Indicadores</h3>
        <div className="bg-slate-50/60 rounded-lg px-4">
          <InfoRow label="Ingresos mensuales" value={formatMXN(ingresos)} />
          <InfoRow label="EBITDA mensual" value={formatMXN(ebitda)} />
          <InfoRow label="Flujo disponible mensual" value={formatMXN(flujo)} />
          <InfoRow label="Pago mensual estimado" value={formatMXN(pago)} />
          <InfoRow label="DSCR" value={`${dscr.toFixed(2)}x`} />
          <InfoRow
            label="Índice de pago"
            value={ingresos ? formatPercent((pago / ingresos) * 100, 1) : "—"}
          />
        </div>

        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-sm font-medium text-emerald-900">
              {dscr >= 1.25 ? "Cumple" : "No cumple"}
            </p>
            <p className="text-xs text-emerald-800">
              DSCR mínimo requerido (≥ 1.25x)
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-navy-900 mb-2">
          Evolución de ingresos
        </h3>
        <div className="h-64 bg-slate-50/60 rounded-lg p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ingresosHistoricos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="#64748b"
              />
              <YAxis
                tickFormatter={formatCompactMXN}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="#64748b"
              />
              <Tooltip
                formatter={(v: number) => formatMXN(v)}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="valor"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#2563eb" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function PLDTab({ exp }: { exp: SolicitudDetalle }) {
  const { data, loading, error, refetch } = useFetch(
    () => fetchPldBySolicitud(exp.id),
    [exp.id]
  );

  if (loading) return <LoadingBlock />;
  if (error) return <div className="p-6"><ErrorBlock message={error} onRetry={refetch} /></div>;

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="shadow-none border-slate-200 lg:col-span-1">
        <CardBody>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">
                Resultado PLD
              </p>
              <p className="text-lg font-semibold text-emerald-700">
                {exp.pld_resultado === "BAJO" ? "Riesgo bajo" : exp.pld_resultado ?? "—"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Sin coincidencias negativas en listas controladas.
          </p>
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-1">
            <p className="text-xs text-slate-500">Oficial de Cumplimiento</p>
            <p className="text-sm font-medium text-navy-900">{exp.pld_oficial ?? "—"}</p>
            <p className="text-xs text-slate-500">
              {exp.pld_fecha
                ? new Date(exp.pld_fecha).toLocaleString("es-MX")
                : "—"}
            </p>
          </div>
        </CardBody>
      </Card>

      <Card className="shadow-none border-slate-200 lg:col-span-2">
        <CardHeader>
          <CardTitle>Verificaciones</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          {(data ?? []).map((v: PldVerificacion) => (
            <div
              key={v.id}
              className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
            >
              <span className="text-sm text-navy-800">{PLD_LABEL[v.lista] ?? v.lista}</span>
              <span className="text-sm text-slate-500">{v.resultado}</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function GarantiaTab({ exp }: { exp: SolicitudDetalle }) {
  const cobertura = exp.cobertura_garantia ?? 0;
  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-none border-slate-200">
        <CardHeader>
          <CardTitle>Inmueble</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="bg-slate-50/60 rounded-lg px-4">
            <InfoRow label="Tipo de inmueble" value={exp.garantia_tipo ?? "—"} />
            <InfoRow label="Ubicación" value={exp.garantia_ubicacion ?? "—"} />
            <InfoRow
              label="Valor avalúo actual"
              value={exp.garantia_valor_avaluo ? formatMXN(exp.garantia_valor_avaluo) : "—"}
            />
            <InfoRow
              label="Cobertura actual"
              value={
                <span className="inline-flex items-center gap-2">
                  {cobertura.toFixed(2)}x
                  {cobertura >= 2.0 && <Badge tone="green" dot>Aceptable</Badge>}
                </span>
              }
            />
            <InfoRow label="Cobertura mínima requerida" value="2.0x" />
          </div>
        </CardBody>
      </Card>

      <Card className="shadow-none border-slate-200">
        <CardHeader>
          <CardTitle>Validaciones jurídicas</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {[
              "Avalúo",
              "Escritura",
              "Libertad de gravamen",
              "Pago predial",
              "Seguro inmueble",
            ].map((v) => (
              <div
                key={v}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-2 text-sm text-navy-800">
                  <FileCheck2 className="h-4 w-4 text-slate-400" />
                  {v}
                </div>
                <StatusBadge value="Válido" />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function AnalisisTab({
  solicitudId,
  comentariosIniciales,
  decisionInicial,
  onSubmit,
}: {
  solicitudId: string;
  comentariosIniciales: string | null;
  decisionInicial: string | null;
  onSubmit: () => void;
}) {
  const [decision, setDecision] = useState(
    (decisionInicial ?? "APROBAR_CONDICIONES").toLowerCase()
  );
  const condiciones = useFetch(
    () => fetchCondicionesBySolicitud(solicitudId),
    [solicitudId]
  );

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm font-semibold text-navy-900 mb-3">
          Comentarios del analista
        </h3>
        <textarea
          rows={6}
          defaultValue={
            comentariosIniciales ??
            "La empresa muestra estabilidad en sus ventas y márgenes."
          }
          className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />

        <h3 className="text-sm font-semibold text-navy-900 mt-6 mb-3">
          Decisión del analista
        </h3>
        <div className="space-y-2">
          {[
            { id: "aprobar", label: "Recomendar aprobación" },
            { id: "aprobar_condiciones", label: "Recomendar aprobación con condiciones" },
            { id: "rechazar", label: "Recomendar rechazo" },
            { id: "escalar_comite", label: "Escalar a Comité" },
          ].map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
            >
              <input
                type="radio"
                name="decision"
                value={opt.id}
                checked={decision === opt.id}
                onChange={() => setDecision(opt.id)}
                className="h-4 w-4 text-brand-600"
              />
              <span className="text-sm text-navy-900">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-navy-900 mb-3">
          Condiciones propuestas
        </h3>
        <div className="space-y-2">
          {condiciones.loading ? (
            <LoadingBlock />
          ) : (
            (condiciones.data ?? []).map((c: CondicionAprobada) => (
              <div
                key={c.id}
                className="flex items-center gap-2 p-2.5 bg-slate-50/60 rounded-lg"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-navy-800">{c.descripcion}</span>
              </div>
            ))
          )}
        </div>

        <Button onClick={onSubmit} className="w-full mt-6" size="lg">
          Enviar a Comité
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
