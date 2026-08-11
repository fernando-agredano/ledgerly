import { FormEvent, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { StatusBadge } from "@/components/StatusBadge";
import { Tabs } from "@/components/ui/Tabs";
import { ErrorBlock, LoadingBlock } from "@/components/ui/States";
import { useFetch } from "@/hooks/useFetch";
import { useToast } from "@/hooks/useToast";
import { createSolicitud, fetchClientes, fetchSolicitudes } from "@/lib/api";
import { formatDate, formatMXN } from "@/lib/format";
import type { EtapaSolicitud, SolicitudListItem } from "@/lib/types";

const ETAPA_DISPLAY: Record<EtapaSolicitud, string> = {
  EVALUACION: "En evaluación",
  ANALISIS: "En análisis",
  PENDIENTE: "Pendiente docs",
  COMITE: "Comité",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
  DISPERSADO: "Dispersado",
};

export default function Solicitudes() {
  const navigate = useNavigate();
  const [active, setActive] = useState("todos");
  const [query, setQuery] = useState("");
  const { data, loading, error, refetch } = useFetch(fetchSolicitudes);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterAnalista, setFilterAnalista] = useState("");
  const [montoMin, setMontoMin] = useState("");
  const [montoMax, setMontoMax] = useState("");

  const [newOpen, setNewOpen] = useState(false);

  const analistas = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.map((s) => s.analista).filter(Boolean))) as string[];
  }, [data]);

  const activeAdvancedFilters =
    (filterAnalista ? 1 : 0) + (montoMin ? 1 : 0) + (montoMax ? 1 : 0);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((s) => {
      if (active === "evaluacion" && s.etapa_codigo !== "EVALUACION") return false;
      if (active === "analisis" && s.etapa_codigo !== "ANALISIS") return false;
      if (active === "pendientes" && s.etapa_codigo !== "PENDIENTE") return false;
      if (active === "rechazadas" && s.etapa_codigo !== "RECHAZADO") return false;
      if (filterAnalista && s.analista !== filterAnalista) return false;
      if (montoMin && s.monto_solicitado < Number(montoMin)) return false;
      if (montoMax && s.monto_solicitado > Number(montoMax)) return false;
      if (
        query &&
        ![s.folio, s.cliente?.nombre, s.cliente?.rfc, s.analista]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())
      )
        return false;
      return true;
    });
  }, [data, active, query, filterAnalista, montoMin, montoMax]);

  const counts = useMemo(() => {
    if (!data)
      return { todos: 0, evaluacion: 0, analisis: 0, pendientes: 0, rechazadas: 0 };
    return {
      todos: data.length,
      evaluacion: data.filter((s) => s.etapa_codigo === "EVALUACION").length,
      analisis: data.filter((s) => s.etapa_codigo === "ANALISIS").length,
      pendientes: data.filter((s) => s.etapa_codigo === "PENDIENTE").length,
      rechazadas: data.filter((s) => s.etapa_codigo === "RECHAZADO").length,
    };
  }, [data]);

  function resetAdvancedFilters() {
    setFilterAnalista("");
    setMontoMin("");
    setMontoMax("");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Solicitudes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Bandeja de originación: pipeline completo del crédito.
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva solicitud
        </Button>
      </header>

      <Card>
        <div className="px-6 pt-4 flex items-center justify-between gap-4">
          <Tabs
            items={[
              { id: "todos", label: "Todos", count: counts.todos },
              { id: "evaluacion", label: "En evaluación", count: counts.evaluacion },
              { id: "analisis", label: "En análisis", count: counts.analisis },
              { id: "pendientes", label: "Pendientes", count: counts.pendientes },
              { id: "rechazadas", label: "Rechazadas", count: counts.rechazadas },
            ]}
            active={active}
            onChange={setActive}
            className="border-b-0"
          />
        </div>

        <div className="px-6 py-3 border-b border-slate-200 flex items-center gap-3 relative">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar folio, empresa, RFC…"
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:bg-white focus:border-brand-300"
            />
          </div>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeAdvancedFilters > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-white text-[10px] font-semibold">
                  {activeAdvancedFilters}
                </span>
              )}
            </Button>

            {filtersOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setFiltersOpen(false)}
                />
                <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-4">
                  <p className="text-xs font-semibold text-navy-900 uppercase tracking-wide mb-2">
                    Analista
                  </p>
                  <select
                    value={filterAnalista}
                    onChange={(e) => setFilterAnalista(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm mb-4 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                  >
                    <option value="">Todos</option>
                    {analistas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>

                  <p className="text-xs font-semibold text-navy-900 uppercase tracking-wide mb-2">
                    Monto solicitado
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="number"
                      value={montoMin}
                      onChange={(e) => setMontoMin(e.target.value)}
                      placeholder="Mínimo"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    />
                    <span className="text-slate-400 text-sm">–</span>
                    <input
                      type="number"
                      value={montoMax}
                      onChange={(e) => setMontoMax(e.target.value)}
                      placeholder="Máximo"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={resetAdvancedFilters}
                      className="text-xs font-medium text-slate-500 hover:text-navy-700"
                    >
                      Limpiar
                    </button>
                    <Button size="sm" onClick={() => setFiltersOpen(false)}>
                      Aplicar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingBlock />
        ) : error ? (
          <div className="p-6">
            <ErrorBlock message={error} onRetry={refetch} />
          </div>
        ) : (
          <SolicitudesTable rows={filtered} totalRows={data?.length ?? 0} />
        )}
      </Card>

      <NuevaSolicitudModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(folio) => {
          setNewOpen(false);
          refetch();
          navigate(`/solicitudes/${folio}`);
        }}
      />
    </div>
  );
}

function NuevaSolicitudModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (folio: string) => void;
}) {
  const clientes = useFetch(fetchClientes);
  const [clienteId, setClienteId] = useState("");
  const [monto, setMonto] = useState("");
  const [plazo, setPlazo] = useState("24");
  const [tasa, setTasa] = useState("");
  const [analista, setAnalista] = useState("");
  const [centroCosto, setCentroCosto] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const toast = useToast();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clienteId || !monto || !plazo) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { folio } = await createSolicitud({
        cliente_id: clienteId,
        monto_solicitado: Number(monto),
        plazo_meses: Number(plazo),
        // La columna se guarda como fracción (0.168), no como porcentaje (16.8),
        // igual que el resto del esquema (tasa_anual, etc.).
        tasa_propuesta: tasa ? Number(tasa) / 100 : null,
        analista: analista || null,
        centro_costo: centroCosto || null,
      });
      setClienteId("");
      setMonto("");
      setPlazo("24");
      setTasa("");
      setAnalista("");
      setCentroCosto("");
      toast.success("Solicitud creada", `Folio ${folio} se registró correctamente.`);
      onCreated(folio);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear la solicitud.";
      setSaveError(message);
      toast.error("No se pudo crear la solicitud", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva solicitud">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-navy-800 block">Empresa</label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
            className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            <option value="" disabled>
              {clientes.loading ? "Cargando empresas…" : "Selecciona una empresa"}
            </option>
            {(clientes.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
                {c.rfc ? ` · ${c.rfc}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Monto solicitado"
            type="number"
            min={1}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="3000000"
            required
          />
          <Input
            label="Plazo (meses)"
            type="number"
            min={1}
            value={plazo}
            onChange={(e) => setPlazo(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Tasa propuesta (%)"
            type="number"
            step="0.01"
            value={tasa}
            onChange={(e) => setTasa(e.target.value)}
            placeholder="16.80"
          />
          <Input
            label="Analista"
            value={analista}
            onChange={(e) => setAnalista(e.target.value)}
            placeholder="Ana López"
          />
        </div>

        <Input
          label="Centro de costo"
          value={centroCosto}
          onChange={(e) => setCentroCosto(e.target.value)}
          placeholder="CC-CENTRO"
        />

        {saveError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {saveError}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Creando…" : "Crear solicitud"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SolicitudesTable({
  rows,
  totalRows,
}: {
  rows: SolicitudListItem[];
  totalRows: number;
}) {
  return (
    <>
      <Table>
        <THead>
          <TR>
            <TH>Folio</TH>
            <TH>Empresa</TH>
            <TH className="text-right">Monto solicitado</TH>
            <TH>Etapa</TH>
            <TH>Analista</TH>
            <TH>Fecha</TH>
            <TH />
          </TR>
        </THead>
        <TBody>
          {rows.map((s) => (
            <TR key={s.id}>
              <TD className="font-medium text-brand-700">{s.folio}</TD>
              <TD>
                <div className="font-medium">{s.cliente?.nombre ?? "—"}</div>
                <div className="text-xs text-slate-500">{s.cliente?.rfc ?? ""}</div>
              </TD>
              <TD className="text-right font-medium tabular-nums">
                {formatMXN(s.monto_solicitado)}
              </TD>
              <TD>
                <StatusBadge value={ETAPA_DISPLAY[s.etapa_codigo]} />
              </TD>
              <TD className="text-slate-700">{s.analista ?? "—"}</TD>
              <TD className="text-slate-500 text-xs">
                {formatDate(s.fecha_solicitud)}
              </TD>
              <TD className="text-right">
                <Link
                  to={`/solicitudes/${s.folio}`}
                  className="text-brand-600 text-sm font-medium hover:underline"
                >
                  Abrir
                </Link>
              </TD>
            </TR>
          ))}
          {rows.length === 0 && (
            <TR>
              <TD colSpan={7} className="text-center py-12 text-slate-500">
                No hay solicitudes que coincidan con los filtros.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>

      <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Mostrando 1 a {rows.length} de {totalRows}
        </span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((p) => (
            <button
              key={p}
              className={
                p === 1
                  ? "h-7 w-7 rounded-md bg-brand-600 text-white font-medium"
                  : "h-7 w-7 rounded-md hover:bg-slate-100 text-slate-600"
              }
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
