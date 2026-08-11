import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ErrorBlock, LoadingBlock } from "@/components/ui/States";
import { useFetch } from "@/hooks/useFetch";
import { useToast } from "@/hooks/useToast";
import {
  fetchComiteBySolicitud,
  fetchCondicionesBySolicitud,
  fetchSolicitudByFolio,
  updateSolicitudEtapa,
} from "@/lib/api";
import { formatMXN } from "@/lib/format";
import type { EtapaSolicitud } from "@/lib/types";

const DECISION_ETAPA: Record<string, EtapaSolicitud | null> = {
  aprobar: "APROBADO",
  "aprobar-condiciones": "APROBADO",
  rechazar: "RECHAZADO",
  modificar: null,
};

export default function Comite() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [decision, setDecision] = useState("aprobar-condiciones");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const toast = useToast();

  const sol = useFetch(() => fetchSolicitudByFolio(id), [id]);
  const condiciones = useFetch(
    () => (sol.data ? fetchCondicionesBySolicitud(sol.data.id) : Promise.resolve([])),
    [sol.data?.id]
  );
  const comite = useFetch(
    () => (sol.data ? fetchComiteBySolicitud(sol.data.id) : Promise.resolve([])),
    [sol.data?.id]
  );

  if (sol.loading) return <div className="py-20"><LoadingBlock label="Cargando comité…" /></div>;
  if (sol.error || !sol.data) {
    return <ErrorBlock message={sol.error ?? "No se encontró la solicitud"} onRetry={sol.refetch} />;
  }

  const exp = sol.data;

  async function handleConfirmar() {
    const etapa = DECISION_ETAPA[decision];
    if (!etapa) {
      toast.info(
        "Estructura modificada registrada",
        "Se registra para una nueva ronda de análisis; no cambia la etapa todavía."
      );
      return;
    }
    setConfirming(true);
    setConfirmError(null);
    try {
      await updateSolicitudEtapa(exp.id, etapa);
      toast.success(
        etapa === "RECHAZADO" ? "Solicitud rechazada" : "Decisión del comité registrada",
        `Solicitud ${exp.folio} pasó a ${etapa === "RECHAZADO" ? "rechazada" : "dispersión"}.`
      );
      if (etapa === "RECHAZADO") {
        navigate("/solicitudes");
      } else {
        navigate(`/dispersion/${exp.folio}`);
      }
    } catch (err) {
      setConfirming(false);
      const message =
        err instanceof Error ? err.message : "No se pudo registrar la decisión del comité.";
      setConfirmError(message);
      toast.error("No se pudo registrar la decisión", message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/solicitudes/${id}`}
          className="text-sm text-slate-500 hover:text-navy-700 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al expediente
        </Link>
        <header className="mt-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">
              Comité de Crédito
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Sesión: {new Date().toLocaleDateString("es-MX")} · Solicitud {exp.folio}
            </p>
          </div>
          <Badge tone="violet" dot>
            Pendiente de decisión
          </Badge>
        </header>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ficha resumen */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Ficha del crédito</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500">Empresa</p>
                <p className="text-sm font-semibold text-navy-900">
                  {exp.cliente?.nombre}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <Stat label="Monto solicitado" value={formatMXN(exp.monto_solicitado)} />
                <Stat label="Plazo" value={`${exp.plazo_meses} meses`} />
                <Stat
                  label="Tasa propuesta"
                  value={
                    exp.benchmark ?? `${((exp.tasa_propuesta ?? 0) * 100).toFixed(2)}%`
                  }
                />
                <Stat label="DSCR" value={`${(exp.dscr ?? 0).toFixed(2)}x`} />
                <Stat
                  label="Cobertura garantía"
                  value={`${(exp.cobertura_garantia ?? 0).toFixed(2)}x`}
                />
                <Stat label="Score AI" value={`${exp.score_total ?? "—"} / 100`} />
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">
                  Recomendación del analista
                </p>
                <Badge tone="yellow" dot>
                  {exp.decision_analista === "APROBAR_CONDICIONES"
                    ? "Aprobación con condiciones"
                    : exp.decision_analista ?? "Pendiente"}
                </Badge>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/solicitudes/${exp.folio}`)}
              >
                Ver expediente completo
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Decisión del comité */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Decisión del comité</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-navy-900 mb-3">
                  Resolución
                </p>
                <div className="space-y-2">
                  {[
                    { id: "aprobar", label: "Aprobar" },
                    { id: "aprobar-condiciones", label: "Aprobar con condiciones" },
                    { id: "rechazar", label: "Rechazar" },
                    { id: "modificar", label: "Modificar estructura" },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
                    >
                      <input
                        type="radio"
                        name="comite-decision"
                        value={opt.id}
                        checked={decision === opt.id}
                        onChange={() => setDecision(opt.id)}
                        className="h-4 w-4 text-brand-600"
                      />
                      <span className="text-sm text-navy-900">{opt.label}</span>
                    </label>
                  ))}
                </div>

                <p className="text-sm font-medium text-navy-900 mt-6 mb-2">
                  Comentarios
                </p>
                <textarea
                  rows={3}
                  defaultValue="Se aprueba por unanimidad."
                  className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-navy-900 mb-3">
                  Condiciones aprobadas
                </p>
                <div className="space-y-2">
                  {condiciones.loading ? (
                    <LoadingBlock />
                  ) : (
                    (condiciones.data ?? []).map((c) => (
                      <div
                        key={c.id}
                        className="flex items-start gap-2 p-2.5 bg-slate-50/60 rounded-lg"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-navy-800">{c.descripcion}</span>
                      </div>
                    ))
                  )}
                </div>

                <p className="text-sm font-medium text-navy-900 mt-6 mb-3">
                  Aprobadores
                </p>
                <div className="space-y-2">
                  {comite.loading ? (
                    <LoadingBlock />
                  ) : (
                    (comite.data ?? []).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 p-2 border border-slate-200 rounded-lg"
                      >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-navy-700 text-white flex items-center justify-center text-xs font-semibold">
                          {m.miembro
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy-900 truncate">
                            {m.miembro}
                          </p>
                          <p className="text-xs text-slate-500">{m.cargo ?? "—"}</p>
                        </div>
                        <Badge
                          tone={
                            m.voto === "APRUEBA"
                              ? "green"
                              : m.voto === "RECHAZA"
                              ? "red"
                              : "neutral"
                          }
                          dot
                        >
                          {m.voto.charAt(0) + m.voto.slice(1).toLowerCase()}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              {confirmError && (
                <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {confirmError}
                </p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Al confirmar, el crédito pasará a preaprobación y dispersión.
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => navigate("/solicitudes")}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirmar} disabled={confirming}>
                    {confirming ? "Confirmando…" : "Confirmar y preaprobar"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-navy-900">{value}</p>
    </div>
  );
}
