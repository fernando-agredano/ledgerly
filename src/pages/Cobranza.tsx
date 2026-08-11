import { useState } from "react";
import {
  AlertTriangle,
  Mail,
  MessageSquare,
  Phone,
  Scale,
  CheckCircle2,
} from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { ErrorBlock, LoadingBlock } from "@/components/ui/States";
import { useFetch } from "@/hooks/useFetch";
import {
  createCobranzaAccion,
  fetchAlertasCobranza,
  fetchCobranzaAcciones,
  fetchCobranzaBuckets,
} from "@/lib/api";
import { formatDateTime, formatMXN } from "@/lib/format";
import { addInfoRows, addSectionTitle, createLedgerlyDocument, finishAndDownload } from "@/lib/pdf";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/useToast";
import type { AlertaCobranza, CobranzaAccionTipo } from "@/lib/types";

const BUCKET_TONE: Record<string, "yellow" | "blue" | "violet" | "red"> = {
  "Mora temprana": "yellow",
  "Cobranza inicial": "blue",
  "Cobranza intensiva": "violet",
  "Jurídica (60+ días)": "red",
};

const ACCION_ICON: Record<CobranzaAccionTipo, typeof Mail> = {
  CONTACTO: Phone,
  CONVENIO: MessageSquare,
  EXPEDIENTE_JURIDICO: Scale,
};

export default function Cobranza() {
  const [tab, setTab] = useState("alertas");

  const buckets = useFetch(fetchCobranzaBuckets);
  const alertas = useFetch(fetchAlertasCobranza);

  const bucketByName = (name: string) =>
    buckets.data?.find((b) => b.bucket === name);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-navy-900">Cobranza</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Gestión de mora, alertas tempranas y escalamiento jurídico.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiBucket
          label="Mora temprana"
          subtitle="1–7 días"
          count={bucketByName("Mora temprana")?.creditos ?? 0}
          valor={bucketByName("Mora temprana")?.total_vencido ?? 0}
          tone="yellow"
          loading={buckets.loading}
        />
        <KpiBucket
          label="Cobranza inicial"
          subtitle="8–30 días"
          count={bucketByName("Cobranza inicial")?.creditos ?? 0}
          valor={bucketByName("Cobranza inicial")?.total_vencido ?? 0}
          tone="blue"
          loading={buckets.loading}
        />
        <KpiBucket
          label="Cobranza intensiva"
          subtitle="31–60 días"
          count={bucketByName("Cobranza intensiva")?.creditos ?? 0}
          valor={bucketByName("Cobranza intensiva")?.total_vencido ?? 0}
          tone="violet"
          loading={buckets.loading}
        />
        <KpiBucket
          label="Jurídica"
          subtitle="60+ días"
          count={bucketByName("Jurídica (60+ días)")?.creditos ?? 0}
          valor={bucketByName("Jurídica (60+ días)")?.total_vencido ?? 0}
          tone="red"
          loading={buckets.loading}
        />
      </section>

      <Card>
        <div className="px-6 pt-2">
          <Tabs
            items={[
              { id: "alertas", label: "Alertas", count: alertas.data?.length },
              { id: "juridico", label: "Jurídico" },
            ]}
            active={tab}
            onChange={setTab}
            className="border-b-0"
          />
        </div>

        {tab === "alertas" && (
          <div className="border-t border-slate-100">
            {alertas.loading ? (
              <LoadingBlock />
            ) : alertas.error ? (
              <div className="p-6"><ErrorBlock message={alertas.error} onRetry={alertas.refetch} /></div>
            ) : (alertas.data ?? []).length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                Sin alertas activas. Toda la cartera vigente.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {(alertas.data ?? []).map((a) => (
                  <AlertaItem key={a.credito_id} a={a} onVerJuridico={() => setTab("juridico")} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "juridico" && (
          <div className="border-t border-slate-100">
            <JuridicoTab alertas={alertas.data ?? []} />
          </div>
        )}
      </Card>
    </div>
  );
}

function KpiBucket({
  label,
  subtitle,
  count,
  valor,
  tone,
  loading,
}: {
  label: string;
  subtitle: string;
  count: number;
  valor: number;
  tone: "yellow" | "blue" | "violet" | "red";
  loading?: boolean;
}) {
  const dotColors = {
    yellow: "bg-amber-500",
    blue: "bg-brand-500",
    violet: "bg-violet-500",
    red: "bg-red-500",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-navy-900">{label}</p>
        <span className={`h-2 w-2 rounded-full ${dotColors[tone]}`} />
      </div>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      <p className="text-2xl font-semibold text-navy-900 mt-3 tabular-nums">
        {loading ? "—" : count}
      </p>
      <p className="text-xs text-slate-500 mt-1">
        Importe estimado{" "}
        <span className="text-navy-800 font-medium tabular-nums">
          {formatMXN(valor)}
        </span>
      </p>
    </div>
  );
}

function AlertaItem({
  a,
  onVerJuridico,
}: {
  a: AlertaCobranza;
  onVerJuridico: () => void;
}) {
  const tone = a.bucket ? BUCKET_TONE[a.bucket] : "neutral";
  const isJuridico = a.bucket === "Jurídica (60+ días)";
  const { user } = useAuth();
  const { profile } = useProfile();
  const nombreUsuario = profile?.nombre ?? user?.email ?? "Usuario";

  const acciones = useFetch(() => fetchCobranzaAcciones(a.credito_id), [a.credito_id]);
  const [registrando, setRegistrando] = useState(false);
  const toast = useToast();

  async function registrar(tipo: CobranzaAccionTipo, descripcion: string) {
    setRegistrando(true);
    try {
      await createCobranzaAccion({
        credito_id: a.credito_id,
        tipo,
        descripcion,
        creado_por: nombreUsuario,
      });
      acciones.refetch();
      toast.success(tipo === "CONVENIO" ? "Convenio generado" : "Acción registrada", descripcion);
    } catch (err) {
      toast.error(
        "No se pudo registrar la acción",
        err instanceof Error ? err.message : "Ocurrió un error inesperado."
      );
    } finally {
      setRegistrando(false);
    }
  }

  function handleGenerarConvenio() {
    const { doc, y } = createLedgerlyDocument({
      title: "Convenio de pago",
      category: "Cobranza",
      folio: a.contrato_numero,
      periodo: new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
      generadoPor: nombreUsuario,
    });
    let cursor = addInfoRows(doc, y, [
      ["Empresa", a.empresa],
      ["Contrato", a.contrato_numero],
      ["Días de atraso", `${a.dias_atraso} días`],
      ["Saldo insoluto", formatMXN(a.saldo_insoluto)],
      ["Importe vencido estimado", formatMXN(a.importe_vencido_estimado)],
    ]);
    cursor = addSectionTitle(doc, cursor, "Términos propuestos");
    cursor = addInfoRows(doc, cursor, [
      ["Capital vencido", formatMXN(a.importe_vencido_estimado * 0.66)],
      ["Intereses vencidos", formatMXN(a.importe_vencido_estimado * 0.21)],
      ["Penalidad moratoria (×2)", formatMXN(a.importe_vencido_estimado * 0.13)],
      ["Total a regularizar", formatMXN(a.importe_vencido_estimado)],
    ]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "Este convenio requiere firma de ambas partes para entrar en vigor. Sujeto a",
      14,
      cursor
    );
    doc.text("aprobación de Tesorería y Jurídico.", 14, cursor + 4.5);

    finishAndDownload(doc, `Convenio_${a.contrato_numero}.pdf`);
    registrar("CONVENIO", `Convenio de pago generado por ${nombreUsuario}`);
  }

  return (
    <div className="px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={
              isJuridico
                ? "h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center"
                : "h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center"
            }
          >
            <AlertTriangle
              className={isJuridico ? "h-5 w-5 text-red-600" : "h-5 w-5 text-amber-600"}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-navy-900">{a.empresa}</p>
              <span className="text-xs text-slate-500">· {a.contrato_numero}</span>
            </div>
            <p className="text-sm text-slate-600 mt-0.5">
              <span className="font-medium text-navy-900">
                {a.dias_atraso} días de atraso
              </span>{" "}
              · Saldo insoluto {formatMXN(a.saldo_insoluto)}
            </p>
          </div>
        </div>
        {a.bucket && <Badge tone={tone as any} dot>{a.bucket}</Badge>}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <p className="text-xs text-slate-500 mb-2">Acciones registradas</p>
          <div className="space-y-1.5">
            {acciones.loading ? (
              <p className="text-xs text-slate-400">Cargando…</p>
            ) : (acciones.data ?? []).length === 0 ? (
              <p className="text-xs text-slate-400">Aún no se ha registrado ninguna acción.</p>
            ) : (
              (acciones.data ?? []).map((acc) => (
                <ActionItem
                  key={acc.id}
                  icon={ACCION_ICON[acc.tipo]}
                  label={acc.descripcion}
                  fecha={acc.created_at}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-2">Importe vencido estimado</p>
          <div className="bg-slate-50/60 rounded-lg p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Capital</span>
              <span className="tabular-nums">
                {formatMXN(a.importe_vencido_estimado * 0.66)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Intereses</span>
              <span className="tabular-nums">
                {formatMXN(a.importe_vencido_estimado * 0.21)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Penalidad (×2)</span>
              <span className="tabular-nums">
                {formatMXN(a.importe_vencido_estimado * 0.13)}
              </span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-200 font-semibold">
              <span>Total estimado</span>
              <span className="tabular-nums">
                {formatMXN(a.importe_vencido_estimado)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          size="sm"
          disabled={registrando}
          onClick={() => registrar("CONTACTO", `Contacto registrado por ${nombreUsuario}`)}
        >
          {registrando ? "Registrando…" : "Registrar contacto"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleGenerarConvenio}>
          Generar convenio
        </Button>
        {isJuridico && (
          <Button size="sm" variant="danger" onClick={onVerJuridico}>
            Ver expediente jurídico
          </Button>
        )}
      </div>
    </div>
  );
}

function ActionItem({
  icon: Icon,
  label,
  fecha,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  fecha: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      <span className="text-navy-800">{label}</span>
      <span className="text-xs text-slate-500 ml-auto">({formatDateTime(fecha)})</span>
    </div>
  );
}

function JuridicoTab({ alertas }: { alertas: AlertaCobranza[] }) {
  const juridico = alertas.find((a) => a.bucket === "Jurídica (60+ días)");

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-none border-slate-200 lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {juridico
                ? `Expediente jurídico — ${juridico.contrato_numero}`
                : "Expediente jurídico"}
            </CardTitle>
            {juridico && <Badge tone="red" dot>Demanda presentada</Badge>}
          </CardHeader>
          <CardBody>
            {juridico ? (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <Box label="Días de atraso" value={`${juridico.dias_atraso} días`} />
                  <Box
                    label="Saldo insoluto"
                    value={formatMXN(juridico.saldo_insoluto)}
                  />
                  <Box
                    label="Empresa"
                    value={juridico.empresa}
                  />
                  <Box label="Abogado responsable" value="Lic. Fernando Álvarez" />
                </div>

                <p className="text-sm font-semibold text-navy-900 mt-4 mb-2">
                  Documentos jurídicos
                </p>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <Table>
                    <THead>
                      <TR>
                        <TH>Documento</TH>
                        <TH>Estatus</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {[
                        { d: "Pagaré", s: "Válido" },
                        { d: "Escritura garantía", s: "Válida" },
                        { d: "Demanda", s: "Presentada" },
                        { d: "Acuse de recibo", s: "Recibido" },
                      ].map((x) => (
                        <TR key={x.d}>
                          <TD>{x.d}</TD>
                          <TD>
                            <Badge
                              tone={
                                x.s === "Presentada"
                                  ? "yellow"
                                  : x.s === "Recibido"
                                  ? "blue"
                                  : "green"
                              }
                              dot
                            >
                              {x.s}
                            </Badge>
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">
                Sin expedientes en jurídico.
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="shadow-none border-slate-200">
          <CardHeader>
            <CardTitle>Línea de tiempo</CardTitle>
          </CardHeader>
          <CardBody>
            <ol className="space-y-4 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
              {[
                { d: "30/04/2026", t: "Demanda presentada" },
                { d: "15/04/2026", t: "Notificación notarial" },
                { d: "31/03/2026", t: "Cobranza intensiva" },
                { d: "15/02/2026", t: "Primer incumplimiento" },
              ].map((e, i) => (
                <li key={i} className="relative pl-8">
                  <span className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white ring-2 ring-slate-300" />
                  <p className="text-sm font-medium text-navy-900">{e.t}</p>
                  <p className="text-xs text-slate-500">{e.d}</p>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-navy-900">{value}</p>
    </div>
  );
}
