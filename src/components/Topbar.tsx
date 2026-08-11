import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  FileWarning,
  HelpCircle,
  Inbox,
  Shield,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import {
  fetchAlertasCobranza,
  fetchDocumentosRecurrentes,
  fetchSolicitudes,
} from "@/lib/api";
import { formatDate } from "@/lib/format";
import { supabase } from "@/lib/supabase";

type PanelId = "seguridad" | "ayuda" | "notificaciones" | null;

interface NotificationItem {
  id: string;
  icon: typeof AlertTriangle;
  tone: "red" | "amber";
  title: string;
  detail: string;
  to: string;
}

export default function Topbar() {
  const navigate = useNavigate();
  const [openPanel, setOpenPanel] = useState<PanelId>(null);

  const alertas = useFetch(fetchAlertasCobranza);
  const docsRecurrentes = useFetch(fetchDocumentosRecurrentes);
  const solicitudes = useFetch(fetchSolicitudes);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Tiempo real: cuando otro usuario registra un pago, sube un documento o
  // crea una solicitud, las tablas base cambian y refrescamos las alertas
  // derivadas (v_alertas_cobranza, v_documentos_recurrentes) sin recargar.
  useEffect(() => {
    const channel = supabase
      .channel("topbar-notificaciones")
      .on("postgres_changes", { event: "*", schema: "public", table: "creditos" }, () =>
        alertas.refetch()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "documentos" }, () =>
        docsRecurrentes.refetch()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "solicitudes" }, () =>
        solicitudes.refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];

    (alertas.data ?? [])
      .filter((a) => a.dias_atraso >= 60)
      .forEach((a) =>
        list.push({
          id: `cobranza-${a.credito_id}`,
          icon: AlertTriangle,
          tone: "red",
          title: `${a.empresa} · ${a.dias_atraso} días de atraso`,
          detail: `Contrato ${a.contrato_numero} en riesgo jurídico`,
          to: "/cobranza",
        })
      );

    (docsRecurrentes.data ?? [])
      .filter((d) => d.alerta === "VENCIDO" || d.alerta === "POR_VENCER")
      .forEach((d) =>
        list.push({
          id: `doc-${d.id}`,
          icon: FileWarning,
          tone: d.alerta === "VENCIDO" ? "red" : "amber",
          title: `${d.documento} — ${d.cliente_nombre}`,
          detail:
            d.alerta === "VENCIDO"
              ? `Vencido · contrato ${d.contrato_numero}`
              : `Vence pronto${
                  d.proxima_actualizacion ? ` (${formatDate(d.proxima_actualizacion)})` : ""
                }`,
          to: "/documentos",
        })
      );

    (solicitudes.data ?? [])
      .filter((s) => s.etapa_codigo === "PENDIENTE")
      .forEach((s) =>
        list.push({
          id: `sol-${s.id}`,
          icon: Inbox,
          tone: "amber",
          title: `${s.cliente?.nombre ?? s.folio} · documentación pendiente`,
          detail: `Folio ${s.folio}`,
          to: `/solicitudes/${s.folio}`,
        })
      );

    return list;
  }, [alertas.data, docsRecurrentes.data, solicitudes.data]);

  const visibleNotifications = useMemo(
    () => notifications.filter((n) => !dismissedIds.has(n.id)),
    [notifications, dismissedIds]
  );

  const loadingNotifications =
    alertas.loading || docsRecurrentes.loading || solicitudes.loading;

  function limpiarNotificaciones() {
    setDismissedIds(new Set(notifications.map((n) => n.id)));
  }

  function togglePanel(id: PanelId) {
    setOpenPanel((current) => (current === id ? null : id));
  }

  function goTo(to: string) {
    setOpenPanel(null);
    navigate(to);
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-6 flex-shrink-0 relative">
      <div className="flex items-center gap-2 text-slate-500">
        <div className="relative">
          <button
            onClick={() => togglePanel("seguridad")}
            className="h-11 w-11 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center"
            title="Seguridad"
          >
            <Shield className="h-5 w-5" />
          </button>
          {openPanel === "seguridad" && (
            <Panel onClose={() => setOpenPanel(null)}>
              <PanelHeader icon={ShieldCheck} title="Seguridad" tone="emerald" />
              <ul className="space-y-2.5 text-sm text-slate-700">
                <li className="flex gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  Row Level Security habilitado en todas las tablas operativas.
                </li>
                <li className="flex gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  Lectura pública (anon + authenticated) — configuración de demo.
                </li>
                <li className="flex gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  Escritura restringida a usuarios autenticados (Supabase Auth) en
                  todas las tablas del flujo operativo.
                </li>
                <li className="flex gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  Login real con Supabase Auth: sesión persistente y foto de perfil
                  en Storage.
                </li>
              </ul>
            </Panel>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => togglePanel("ayuda")}
            className="h-11 w-11 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center"
            title="Soporte"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          {openPanel === "ayuda" && (
            <Panel onClose={() => setOpenPanel(null)}>
              <PanelHeader icon={HelpCircle} title="Ayuda rápida" tone="brand" />
              <ul className="space-y-3 text-sm">
                <li>
                  <p className="font-medium text-navy-900">Flujo de crédito</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Solicitudes → Expediente → Comité → Dispersión → Cartera.
                  </p>
                </li>
                <li>
                  <p className="font-medium text-navy-900">Sidebar contraíble</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Usa el botón "Contraer menú" arriba de las opciones para ganar
                    espacio.
                  </p>
                </li>
                <li>
                  <p className="font-medium text-navy-900">Exportar documentos</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Expedientes, estados de cuenta y reportes se descargan como PDF
                    con membrete institucional.
                  </p>
                </li>
              </ul>
            </Panel>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => togglePanel("notificaciones")}
            className="h-11 w-11 rounded-lg hover:bg-slate-100 inline-flex items-center justify-center relative"
            title="Notificaciones"
          >
            <Bell className="h-5 w-5" />
            {visibleNotifications.length > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>
          {openPanel === "notificaciones" && (
            <Panel onClose={() => setOpenPanel(null)} wide>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Bell className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-navy-900">Notificaciones</p>
                </div>
                {visibleNotifications.length > 0 && (
                  <button
                    onClick={limpiarNotificaciones}
                    className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-600"
                    title="Limpiar notificaciones"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Limpiar
                  </button>
                )}
              </div>
              {loadingNotifications ? (
                <p className="text-sm text-slate-500 py-6 text-center">Cargando…</p>
              ) : visibleNotifications.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">
                  Sin alertas activas por ahora.
                </p>
              ) : (
                <ul className="space-y-1 -mx-2 max-h-96 overflow-y-auto">
                  {visibleNotifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <li key={n.id}>
                        <button
                          onClick={() => goTo(n.to)}
                          className="w-full flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 text-left"
                        >
                          <div
                            className={
                              n.tone === "red"
                                ? "h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0"
                                : "h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0"
                            }
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-navy-900 truncate">
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{n.detail}</p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          )}
        </div>
      </div>
    </header>
  );
}

function Panel({
  children,
  onClose,
  wide,
}: {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        className={
          (wide ? "w-96" : "w-80") +
          " absolute right-0 top-[calc(100%+8px)] z-40 bg-white border border-slate-200 rounded-xl shadow-lg p-4"
        }
      >
        {children}
      </div>
    </>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  tone,
}: {
  icon: typeof Bell;
  title: string;
  tone: "brand" | "emerald";
}) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
      <div
        className={
          tone === "brand"
            ? "h-7 w-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"
            : "h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"
        }
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-semibold text-navy-900">{title}</p>
    </div>
  );
}
