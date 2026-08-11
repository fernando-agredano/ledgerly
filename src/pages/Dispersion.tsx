import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  ChevronRight,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useFetch } from "@/hooks/useFetch";
import { useToast } from "@/hooks/useToast";
import {
  createAsientosDispersion,
  createCreditoDesdeSolicitud,
  fetchSolicitudByFolio,
  updateSolicitudEtapa,
} from "@/lib/api";
import { formatMXN } from "@/lib/format";
import { ErrorBlock, LoadingBlock } from "@/components/ui/States";

function generarCep() {
  let digits = "";
  for (let i = 0; i < 18; i++) digits += Math.floor(Math.random() * 10);
  return `MBAN01${digits}`;
}

export default function Dispersion() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<"fondeo" | "dispersion" | "confirmacion">(
    "fondeo"
  );
  const [dispersando, setDispersando] = useState(false);
  const [dispersionError, setDispersionError] = useState<string | null>(null);
  const [creditoCreado, setCreditoCreado] = useState<{ contrato_numero: string } | null>(
    null
  );
  const sol = useFetch(() => fetchSolicitudByFolio(id), [id]);
  const toast = useToast();
  const [cep] = useState(() => generarCep());

  if (sol.loading) return <div className="py-20"><LoadingBlock /></div>;
  if (sol.error || !sol.data) {
    return <ErrorBlock message={sol.error ?? "No se encontró la solicitud"} onRetry={sol.refetch} />;
  }
  const exp = sol.data;

  async function handleEjecutarDispersion() {
    setDispersando(true);
    setDispersionError(null);
    try {
      const credito = await createCreditoDesdeSolicitud({
        cliente_id: exp.cliente_id,
        monto_original: exp.monto_solicitado,
        tasa_anual: exp.tasa_propuesta ?? 0,
        plazo_meses: exp.plazo_meses,
        centro_costo: exp.centro_costo,
      });
      await createAsientosDispersion(credito.id, exp.monto_solicitado);
      await updateSolicitudEtapa(exp.id, "DISPERSADO");
      setCreditoCreado(credito);
      setStep("confirmacion");
      toast.success("Dispersión ejecutada", `Crédito ${credito.contrato_numero} generado y fondeado.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo ejecutar la dispersión.";
      setDispersionError(message);
      toast.error("No se pudo ejecutar la dispersión", message);
    } finally {
      setDispersando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/comite/${id}`}
          className="text-sm text-slate-500 hover:text-navy-700 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al comité
        </Link>
        <h1 className="text-2xl font-semibold text-navy-900 mt-3">
          Preaprobación y Dispersión
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {exp.cliente?.nombre} · Solicitud {exp.folio}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preaprobación card */}
        <Card>
          <CardBody>
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-brand-50 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-brand-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-navy-900">
                ¡Preaprobado!
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Hemos preaprobado tu crédito.
              </p>
            </div>

            <div className="mt-6 space-y-2.5 text-sm">
              <Row label="Monto" value={formatMXN(exp.monto_solicitado)} />
              <Row label="Plazo" value={`${exp.plazo_meses} meses`} />
              <Row label="Tasa anual" value={exp.benchmark ?? `${((exp.tasa_propuesta ?? 0) * 100).toFixed(2)}%`} />
              <Row label="Fecha primer pago" value="30/06/2026" />
            </div>

            <p className="mt-5 text-[11px] text-slate-400 text-center leading-relaxed">
              Sujeto a firma de documentos y cumplimiento de condiciones precedentes.
            </p>
          </CardBody>
        </Card>

        {/* Dispersión flow */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-6">
              <Step n={1} label="Fondeo" active={step === "fondeo"} done={step !== "fondeo"} />
              <Step n={2} label="Dispersión" active={step === "dispersion"} done={step === "confirmacion"} />
              <Step n={3} label="Confirmación" active={step === "confirmacion"} done={false} />
            </div>
          </CardHeader>
          <CardBody>
            {step === "fondeo" && (
              <FondeoStep onNext={() => setStep("dispersion")} monto={exp.monto_solicitado} />
            )}
            {step === "dispersion" && (
              <DispersionStep
                onNext={handleEjecutarDispersion}
                loading={dispersando}
                error={dispersionError}
                monto={exp.monto_solicitado}
                empresa={exp.cliente?.nombre ?? ""}
                cep={cep}
              />
            )}
            {step === "confirmacion" && creditoCreado && (
              <ConfirmacionStep
                contratoNumero={creditoCreado.contrato_numero}
                cep={cep}
                onFinish={() => navigate(`/cartera/${creditoCreado.contrato_numero}`)}
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function Step({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold ring-2 ring-offset-2 ring-offset-white transition-colors",
          done && "bg-emerald-500 text-white ring-emerald-200",
          active && "bg-brand-600 text-white ring-brand-200",
          !active && !done && "bg-slate-100 text-slate-500 ring-transparent"
        )}
      >
        {done ? <CheckCircle2 className="h-4 w-4" /> : n}
      </div>
      <span className={cn("text-sm", active ? "text-navy-900 font-semibold" : "text-slate-500")}>
        {label}
      </span>
    </div>
  );
}

function FondeoStep({ onNext, monto }: { onNext: () => void; monto: number }) {
  return (
    <div>
      <p className="text-sm font-medium text-navy-900 mb-3">Fuente de fondeo</p>
      <div className="border border-slate-200 rounded-lg p-4 flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-navy-900 text-white flex items-center justify-center">
          <Building className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-navy-900">
            Línea de crédito Meridian Capital Bank (MXN)
          </p>
          <p className="text-xs text-slate-500">
            Línea revolvente · TIIE Fondeo + 0.85% · Disponible
          </p>
        </div>
        <span className="text-sm font-semibold text-navy-900 tabular-nums">{formatMXN(monto)}</span>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={onNext}>
          Continuar a dispersión
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function DispersionStep({
  onNext,
  loading,
  error,
  monto,
  empresa,
  cep,
}: {
  onNext: () => void;
  loading: boolean;
  error: string | null;
  monto: number;
  empresa: string;
  cep: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-navy-900 mb-3">Datos de dispersión SPEI</p>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Box label="Monto a dispersar" value={formatMXN(monto)} />
          <Box label="Fecha de dispersión" value={new Date().toLocaleDateString("es-MX")} />
          <Box label="Cuenta destino (CLABE)" value="0021 8001 2345 6789 12" mono />
          <Box label="Banco" value="BBVA México" />
          <div className="col-span-2"><Box label="Beneficiario" value={empresa} /></div>
          <Box label="CEP / Folio" value={cep} mono />
          <Box label="Concepto" value="Dispersión crédito Ledgerly" />
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-900">
            <span className="font-medium">Control dual:</span> esta dispersión requiere
            autorización de Tesorería y Contabilidad antes de ejecutar el SPEI.
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-end mt-6">
        <Button onClick={onNext} disabled={loading}>
          <Send className="h-4 w-4" />
          {loading ? "Ejecutando…" : "Ejecutar dispersión"}
        </Button>
      </div>
    </div>
  );
}

function ConfirmacionStep({
  contratoNumero,
  cep,
  onFinish,
}: {
  contratoNumero: string;
  cep: string;
  onFinish: () => void;
}) {
  return (
    <div>
      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            Dispersión realizada con éxito
          </p>
          <p className="text-xs text-emerald-800">
            Estatus: Desembolsado · Asientos contables registrados automáticamente.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <Box label="CEP" value={cep} mono />
        <Box label="Crédito generado" value={contratoNumero} />
      </div>

      <div className="mt-5">
        <Badge tone="green" dot>
          Asientos registrados (Cartera vigente · Bancos)
        </Badge>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={onFinish}>
          Ver crédito en cartera
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Box({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={cn("font-semibold text-navy-900", mono && "font-mono text-xs")}>
        {value}
      </p>
    </div>
  );
}
