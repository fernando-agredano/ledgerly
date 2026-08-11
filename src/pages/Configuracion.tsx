import { FormEvent, useState } from "react";
import {
  Building,
  Mail,
  Settings as SettingsIcon,
  Shield,
  Sliders,
  Users,
} from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ErrorBlock, LoadingBlock } from "@/components/ui/States";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useFetch } from "@/hooks/useFetch";
import { useToast } from "@/hooks/useToast";
import { createUsuario, fetchUsuarios, updateUsuario } from "@/lib/api";
import { initials } from "@/lib/format";
import type { Usuario } from "@/lib/types";

const TABS = [
  { id: "institucion", label: "Institución" },
  { id: "parametros", label: "Parámetros" },
  { id: "usuarios", label: "Usuarios y roles" },
  { id: "integraciones", label: "Integraciones" },
];

export default function Configuracion() {
  const [tab, setTab] = useState("institucion");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-navy-900">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Parámetros institucionales, usuarios, roles e integraciones de la
          plataforma.
        </p>
      </header>

      <Card>
        <div className="px-6 pt-2">
          <Tabs items={TABS} active={tab} onChange={setTab} className="border-b-0" />
        </div>
        <div className="border-t border-slate-100 p-6">
          {tab === "institucion" && <InstitucionTab />}
          {tab === "parametros" && <ParametrosTab />}
          {tab === "usuarios" && <UsuariosTab />}
          {tab === "integraciones" && <IntegracionesTab />}
        </div>
      </Card>
    </div>
  );
}

function InstitucionTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-none border-slate-200">
        <CardHeader>
          <CardTitle>Datos de la institución</CardTitle>
          <Building className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardBody className="space-y-4">
          <Input label="Razón social" defaultValue="Ledgerly Capital S.A. de C.V." />
          <Input label="Nombre comercial" defaultValue="Ledgerly" />
          <Input label="RFC" defaultValue="LDG-XXXXXX-XXX" />
          <Input label="Dirección fiscal" defaultValue="Av. Reforma 222, CDMX" />
          <Input label="Centro de costo principal" defaultValue="CC-CENTRAL" />
        </CardBody>
      </Card>

      <Card className="shadow-none border-slate-200">
        <CardHeader>
          <CardTitle>Identidad operativa</CardTitle>
          <SettingsIcon className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardBody className="space-y-4">
          <Input label="Tipo de entidad" defaultValue="SOFOM ENR" disabled />
          <Input label="Moneda funcional" defaultValue="MXN (Peso Mexicano)" disabled />
          <Input label="Régimen fiscal" defaultValue="601 - Personas Morales" />
          <Input label="Año fiscal" defaultValue="Enero - Diciembre" />
          <div className="flex items-center justify-between p-3 bg-slate-50/60 rounded-lg">
            <div className="text-sm">
              <p className="font-medium text-navy-900">Contabilidad en doble partida</p>
              <p className="text-xs text-slate-500 mt-0.5">Ledger inmutable activo</p>
            </div>
            <Badge tone="green" dot>Activo</Badge>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function ParametrosTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-none border-slate-200">
          <CardHeader>
            <CardTitle>Tasas de provisión por bucket</CardTitle>
            <Sliders className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardBody>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <Table>
                <THead>
                  <TR>
                    <TH>Bucket</TH>
                    <TH>Días atraso</TH>
                    <TH className="text-right">Tasa</TH>
                  </TR>
                </THead>
                <TBody>
                  {[
                    { bucket: "Vigente", dias: "0", tasa: "1.00%" },
                    { bucket: "Mora temprana", dias: "1–30", tasa: "5.00%" },
                    { bucket: "Cobranza intensiva", dias: "31–60", tasa: "15.00%" },
                    { bucket: "Pre-jurídico", dias: "61–90", tasa: "35.00%" },
                    { bucket: "Jurídico", dias: "90+", tasa: "75–100%" },
                  ].map((r) => (
                    <TR key={r.bucket}>
                      <TD className="font-medium">{r.bucket}</TD>
                      <TD className="text-slate-700 text-xs">{r.dias} días</TD>
                      <TD className="text-right tabular-nums font-semibold">
                        {r.tasa}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Modelo institucional simple. Migración a IFRS 9 / B-6 CNBV pendiente.
            </p>
          </CardBody>
        </Card>

        <Card className="shadow-none border-slate-200">
          <CardHeader>
            <CardTitle>Política de crédito</CardTitle>
            <Shield className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardBody className="space-y-4">
            <ConfigRow label="DSCR mínimo" value="1.25x" />
            <ConfigRow label="Cobertura garantía mínima" value="2.0x" />
            <ConfigRow label="LTV residencial premium" value="60%" />
            <ConfigRow label="LTV comercial / industrial" value="50%" />
            <ConfigRow label="LTV mixto / terreno" value="30%" />
            <ConfigRow label="Score mínimo aceptable" value="65 / 100" />
            <ConfigRow label="Tasa moratoria" value="ordinaria × 2" />
            <ConfigRow label="Frecuencia revaluación inmuebles" value="24 meses" />
          </CardBody>
        </Card>
      </div>

      <Card className="shadow-none border-slate-200">
        <CardHeader>
          <CardTitle>Límites de concentración</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <LimitCard label="Single obligor" actual="32.4%" limite="5%" estado="violado" />
            <LimitCard label="Top-10 acreditados" actual="92%" limite="30%" estado="violado" />
            <LimitCard label="Sector dominante" actual="48%" limite="25%" estado="violado" />
            <LimitCard label="Geografía dominante" actual="35%" limite="35%" estado="critico" />
          </div>
          <p className="text-xs text-amber-700 mt-4 bg-amber-50 border border-amber-100 rounded-lg p-3">
            <strong>Atención:</strong> los límites están en violación o al borde porque
            la cartera incluye intercompañías de gran volumen. En producción debe
            calcularse contra cartera externa solamente.
          </p>
        </CardBody>
      </Card>

      <Card className="shadow-none border-slate-200">
        <CardHeader>
          <CardTitle>Costo financiero</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ConfigBox label="Meridian Capital Bank MXN" value="TIIE Fondeo + 0.85%" />
            <ConfigBox label="Meridian Capital Bank USD" value="SOFR Fondeo + 0.85%" />
            <ConfigBox label="Hurdle rate objetivo" value="TIIE 28d × 2 a × 3" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-700">{label}</span>
      <span className="text-sm font-semibold text-navy-900 tabular-nums">{value}</span>
    </div>
  );
}

function ConfigBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-lg">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-navy-900 mt-1">{value}</p>
    </div>
  );
}

function LimitCard({
  label,
  actual,
  limite,
  estado,
}: {
  label: string;
  actual: string;
  limite: string;
  estado: "ok" | "critico" | "violado";
}) {
  const tones = {
    ok: { tone: "green" as const, label: "Dentro" },
    critico: { tone: "yellow" as const, label: "En el límite" },
    violado: { tone: "red" as const, label: "Excedido" },
  };
  const t = tones[estado];
  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <Badge tone={t.tone}>{t.label}</Badge>
      </div>
      <p className="text-2xl font-semibold text-navy-900 tabular-nums">{actual}</p>
      <p className="text-xs text-slate-500 mt-1">Límite: {limite}</p>
    </div>
  );
}

function UsuariosTab() {
  const { data, loading, error, refetch } = useFetch(fetchUsuarios);
  const [modalUser, setModalUser] = useState<Usuario | "new" | null>(null);

  const usuarios = data ?? [];

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {usuarios.filter((u) => u.estado === "Activo").length} usuarios activos ·{" "}
          {usuarios.length} roles institucionales definidos
        </p>
        <Button size="sm" onClick={() => setModalUser("new")}>
          <Users className="h-4 w-4" />
          Invitar usuario
        </Button>
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Usuario</TH>
              <TH>Rol</TH>
              <TH>Email</TH>
              <TH>Estado</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {usuarios.map((u) => (
              <TR key={u.id}>
                <TD>
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full border-2 border-slate-300 text-slate-700 flex items-center justify-center text-[11px] font-semibold overflow-hidden flex-shrink-0">
                      {u.foto_url ? (
                        <img src={u.foto_url} alt="" className="h-full w-full object-cover" />
                      ) : u.nombre !== "—" ? (
                        initials(u.nombre)
                      ) : null}
                    </div>
                    <span className="font-medium">{u.nombre}</span>
                  </div>
                </TD>
                <TD className="text-slate-700 text-sm">{u.rol}</TD>
                <TD className="text-slate-500 text-xs font-mono">{u.email ?? "—"}</TD>
                <TD>
                  <Badge
                    tone={
                      u.estado === "Activo"
                        ? "green"
                        : u.estado === "Pendiente"
                        ? "yellow"
                        : "neutral"
                    }
                    dot
                  >
                    {u.estado}
                  </Badge>
                </TD>
                <TD className="text-right">
                  <button
                    onClick={() => setModalUser(u)}
                    className="text-brand-600 text-sm font-medium hover:underline"
                  >
                    Editar
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      {modalUser && (
        <UsuarioModal
          usuario={modalUser === "new" ? null : modalUser}
          onClose={() => setModalUser(null)}
          onSaved={() => {
            setModalUser(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function UsuarioModal({
  usuario,
  onClose,
  onSaved,
}: {
  usuario: Usuario | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [rol, setRol] = useState(usuario?.rol ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [estado, setEstado] = useState(usuario?.estado ?? "Pendiente");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const toast = useToast();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      if (usuario) {
        await updateUsuario(usuario.id, { nombre, rol, email: email || null, estado });
        toast.success("Usuario actualizado", `${nombre} se guardó correctamente.`);
      } else {
        await createUsuario({ nombre, rol, email: email || null });
        toast.success("Usuario invitado", `${nombre} se agregó al directorio institucional.`);
      }
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo guardar el usuario.";
      setSaveError(message);
      toast.error("No se pudo guardar el usuario", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={usuario ? "Editar usuario" : "Invitar usuario"}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <Input label="Rol" value={rol} onChange={(e) => setRol(e.target.value)} required />
        <Input
          label="Email"
          type="email"
          value={email ?? ""}
          onChange={(e) => setEmail(e.target.value)}
        />
        {usuario && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-navy-800 block">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as Usuario["estado"])}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            >
              <option value="Activo">Activo</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Por crear">Por crear</option>
            </select>
          </div>
        )}
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
            {saving ? "Guardando…" : usuario ? "Guardar cambios" : "Invitar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const INTEGRACIONES_BASE = [
  {
    nombre: "Supabase",
    descripcion: "Base de datos institucional · ledger · vistas materializadas",
    estado: "Conectado" as const,
    real: true,
    icon: Building,
  },
  {
    nombre: "Meridian Capital Bank API",
    descripcion: "Saldos línea revolvente MXN/USD · borrowing base · disposiciones",
    estado: "Pendiente" as const,
    real: false,
    icon: Building,
  },
  {
    nombre: "Banorte SPEI",
    descripcion: "Conciliación CEP · dispersión y cobro automatizado",
    estado: "Pendiente" as const,
    real: false,
    icon: Building,
  },
  {
    nombre: "SAT (e.firma)",
    descripcion: "Opinión 32-D, CSF, DIOT, complementos de pago",
    estado: "Pendiente" as const,
    real: false,
    icon: Building,
  },
  {
    nombre: "Buró de Crédito",
    descripcion: "Consulta y monitoreo de score y comportamiento de acreditados",
    estado: "Pendiente" as const,
    real: false,
    icon: Shield,
  },
  {
    nombre: "Email transaccional",
    descripcion: "Notificaciones a clientes · recordatorios de pago · estados de cuenta",
    estado: "Pendiente" as const,
    real: false,
    icon: Mail,
  },
];

function IntegracionesTab() {
  const [estados, setEstados] = useState<Record<string, "Conectado" | "Pendiente">>(
    () => Object.fromEntries(INTEGRACIONES_BASE.map((i) => [i.nombre, i.estado]))
  );
  const [modalTarget, setModalTarget] = useState<(typeof INTEGRACIONES_BASE)[number] | null>(
    null
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {INTEGRACIONES_BASE.map((it) => {
        const Icon = it.icon;
        const estado = estados[it.nombre];
        return (
          <Card key={it.nombre} className="shadow-none border-slate-200">
            <CardBody>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-slate-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-navy-900">
                      {it.nombre}
                    </p>
                    <Badge tone={estado === "Conectado" ? "green" : "yellow"} dot>
                      {estado}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{it.descripcion}</p>
                  <div className="mt-3">
                    {it.real ? (
                      <Button size="sm" variant="outline" disabled>
                        Configurar
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setModalTarget(it)}>
                        {estado === "Conectado" ? "Configurar" : "Conectar"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}

      {modalTarget && (
        <Modal
          open
          onClose={() => setModalTarget(null)}
          title={`Conectar ${modalTarget.nombre}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Esta integración requiere credenciales reales de{" "}
              <span className="font-medium text-navy-900">{modalTarget.nombre}</span>{" "}
              (API key, certificado o convenio con el proveedor) que esta demo no
              tiene — no se puede conectar de verdad desde aquí.
            </p>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-900">
              Puedes marcarla como conectada para ver cómo se vería la pantalla con
              la integración activa; esto solo cambia el estado en tu sesión, no
              establece ninguna conexión real.
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalTarget(null)}>
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setEstados((prev) => ({
                    ...prev,
                    [modalTarget.nombre]:
                      prev[modalTarget.nombre] === "Conectado" ? "Pendiente" : "Conectado",
                  }));
                  setModalTarget(null);
                }}
              >
                {estados[modalTarget.nombre] === "Conectado"
                  ? "Marcar como pendiente"
                  : "Marcar como conectado (demo)"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
