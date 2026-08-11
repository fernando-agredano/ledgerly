import { supabase } from "./supabase";
import type {
  AlertaCobranza,
  AmortizacionPeriodo,
  AsientoContable,
  CapitalResumen,
  CarteraAging,
  CarteraOperativa,
  Cliente,
  CobranzaAccion,
  CobranzaAccionTipo,
  CobranzaBucket,
  ComiteAprobacion,
  ConcentracionItem,
  CondicionAprobada,
  CreditoFull,
  DashboardKpis,
  DistribucionEtapa,
  Documento,
  DocumentoRecurrente,
  EtapaSolicitud,
  FuenteFondeo,
  LibroMayorRow,
  Pago,
  PldResumenItem,
  PldVerificacion,
  Provision,
  ReporteGenerado,
  SolicitudDetalle,
  SolicitudListItem,
  Usuario,
  VintageItem,
} from "./types";

function unwrap<T>(data: T | null, error: { message: string } | null, ctx: string): T {
  if (error) throw new Error(`[${ctx}] ${error.message}`);
  if (data == null) throw new Error(`[${ctx}] no data`);
  return data;
}

// ---------- DASHBOARD ----------

export async function fetchDashboardKpis(): Promise<DashboardKpis> {
  const { data, error } = await supabase
    .from("v_dashboard_kpis")
    .select("*")
    .single();
  return unwrap(data, error, "v_dashboard_kpis");
}

export async function fetchCapitalResumen(): Promise<CapitalResumen> {
  const { data, error } = await supabase
    .from("v_capital_resumen")
    .select("*")
    .single();
  return unwrap(data, error, "v_capital_resumen");
}

export async function fetchDistribucionEtapa(): Promise<DistribucionEtapa> {
  const { data, error } = await supabase
    .from("v_distribucion_etapa")
    .select("*")
    .single();
  return unwrap(data, error, "v_distribucion_etapa");
}

export async function fetchCarteraAging(): Promise<CarteraAging[]> {
  const { data, error } = await supabase
    .from("v_cartera_aging")
    .select("*");
  return unwrap(data, error, "v_cartera_aging");
}

// ---------- SOLICITUDES ----------

export async function fetchSolicitudes(): Promise<SolicitudListItem[]> {
  const { data, error } = await supabase
    .from("solicitudes")
    .select(`
      id, folio, cliente_id, monto_solicitado, plazo_meses,
      tasa_propuesta, etapa_codigo, analista, fecha_solicitud, score_total,
      cliente:clientes ( nombre, rfc )
    `)
    .order("fecha_solicitud", { ascending: false });
  const rows = unwrap(data, error, "solicitudes");
  return rows.map((r: any) => ({
    ...r,
    cliente: Array.isArray(r.cliente) ? r.cliente[0] : r.cliente,
  })) as SolicitudListItem[];
}

export async function fetchSolicitudByFolio(folio: string): Promise<SolicitudDetalle> {
  const { data, error } = await supabase
    .from("solicitudes")
    .select(`
      *,
      cliente:clientes ( nombre, rfc )
    `)
    .eq("folio", folio)
    .single();
  const row = unwrap(data, error, "solicitudes by folio");
  return {
    ...(row as any),
    cliente: Array.isArray((row as any).cliente)
      ? (row as any).cliente[0]
      : (row as any).cliente,
  } as SolicitudDetalle;
}

export async function fetchDocumentosBySolicitud(solicitudId: string): Promise<Documento[]> {
  const { data, error } = await supabase
    .from("documentos")
    .select("id, nombre, archivo_filename, estatus, fecha_carga")
    .eq("solicitud_id", solicitudId)
    .order("fecha_carga", { ascending: true, nullsFirst: false });
  return unwrap(data, error, "documentos");
}

export async function fetchPldBySolicitud(solicitudId: string): Promise<PldVerificacion[]> {
  const { data, error } = await supabase
    .from("pld_verificaciones")
    .select("id, lista, resultado, encontrado")
    .eq("solicitud_id", solicitudId);
  return unwrap(data, error, "pld_verificaciones");
}

export async function fetchComiteBySolicitud(solicitudId: string): Promise<ComiteAprobacion[]> {
  const { data, error } = await supabase
    .from("comite_aprobaciones")
    .select("id, miembro, cargo, voto")
    .eq("solicitud_id", solicitudId);
  return unwrap(data, error, "comite_aprobaciones");
}

export async function fetchCondicionesBySolicitud(solicitudId: string): Promise<CondicionAprobada[]> {
  const { data, error } = await supabase
    .from("condiciones_aprobadas")
    .select("id, descripcion")
    .eq("solicitud_id", solicitudId);
  return unwrap(data, error, "condiciones_aprobadas");
}

export async function fetchClientes(): Promise<Pick<Cliente, "id" | "nombre" | "rfc">[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, rfc")
    .order("nombre", { ascending: true });
  return unwrap(data, error, "clientes");
}

export interface NuevaSolicitudInput {
  cliente_id: string;
  monto_solicitado: number;
  plazo_meses: number;
  tasa_propuesta: number | null;
  analista: string | null;
  centro_costo: string | null;
}

export async function createSolicitud(
  input: NuevaSolicitudInput
): Promise<{ id: string; folio: string }> {
  const folio = `SOL-${new Date().getFullYear()}-${String(
    Math.floor(Math.random() * 90000) + 10000
  ).padStart(5, "0")}`;
  const { data, error } = await supabase
    .from("solicitudes")
    .insert({ folio, ...input })
    .select("id, folio")
    .single();
  return unwrap(data, error, "insert solicitudes");
}

export async function updateSolicitudEtapa(
  id: string,
  etapa_codigo: EtapaSolicitud
): Promise<void> {
  const { error } = await supabase
    .from("solicitudes")
    .update({ etapa_codigo })
    .eq("id", id);
  if (error) throw new Error(`[update solicitudes] ${error.message}`);
}

export interface NuevoDocumentoInput {
  solicitud_id: string;
  nombre: string;
  archivo_filename: string;
}

export async function createDocumento(input: NuevoDocumentoInput): Promise<Documento> {
  const { data, error } = await supabase
    .from("documentos")
    .insert({ ...input, estatus: "VALIDO" })
    .select("id, nombre, archivo_filename, estatus, fecha_carga")
    .single();
  return unwrap(data, error, "insert documentos");
}

// ---------- CARTERA ----------

export async function fetchCreditos(): Promise<CreditoFull[]> {
  const { data, error } = await supabase
    .from("v_creditos_full")
    .select("*")
    .order("fecha_inicio", { ascending: false });
  return unwrap(data, error, "v_creditos_full");
}

export async function fetchCreditoByContrato(contrato: string): Promise<CreditoFull> {
  const { data, error } = await supabase
    .from("v_creditos_full")
    .select("*")
    .eq("contrato_numero", contrato)
    .single();
  return unwrap(data, error, "v_creditos_full by contrato");
}

export async function fetchAmortizacionByCredito(creditoId: string): Promise<AmortizacionPeriodo[]> {
  const { data, error } = await supabase
    .from("tabla_amortizacion")
    .select("*")
    .eq("credito_id", creditoId)
    .order("periodo", { ascending: true });
  return unwrap(data, error, "tabla_amortizacion");
}

export async function fetchCarteraOperativaMensual(): Promise<CarteraOperativa[]> {
  const { data, error } = await supabase
    .from("v_cartera_operativa_mensual")
    .select("*");
  return unwrap(data, error, "v_cartera_operativa_mensual");
}

// ---------- COBRANZA ----------

export async function fetchAlertasCobranza(): Promise<AlertaCobranza[]> {
  const { data, error } = await supabase
    .from("v_alertas_cobranza")
    .select("*")
    .order("dias_atraso", { ascending: false });
  return unwrap(data, error, "v_alertas_cobranza");
}

export async function fetchCobranzaBuckets(): Promise<CobranzaBucket[]> {
  const { data, error } = await supabase
    .from("v_cobranza_buckets")
    .select("*");
  return unwrap(data, error, "v_cobranza_buckets");
}

// ---------- LEDGER ----------

export async function fetchAsientos(): Promise<AsientoContable[]> {
  const { data, error } = await supabase
    .from("asientos_contables")
    .select("id, fecha, descripcion, cuenta_codigo, debe, haber")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  return unwrap(data, error, "asientos_contables");
}

export async function fetchLibroMayor(): Promise<LibroMayorRow[]> {
  const { data, error } = await supabase
    .from("v_libro_mayor")
    .select("*");
  return unwrap(data, error, "v_libro_mayor");
}

// ---------- REPORTES: respaldo contable/operativo ----------

export async function fetchProvisiones(): Promise<Provision[]> {
  const { data, error } = await supabase
    .from("provisiones")
    .select("*")
    .order("fecha_corte", { ascending: false });
  return unwrap(data, error, "provisiones");
}

export async function fetchFuentesFondeo(): Promise<FuenteFondeo[]> {
  const { data, error } = await supabase
    .from("fuentes_fondeo")
    .select("*")
    .order("prestamista", { ascending: true });
  return unwrap(data, error, "fuentes_fondeo");
}

export async function fetchPagosRecientes(): Promise<Pago[]> {
  const { data, error } = await supabase
    .from("pagos")
    .select("id, credito_id, fecha_pago, monto_capital, monto_intereses, monto_total, cep_spei, conciliado")
    .order("fecha_pago", { ascending: false })
    .limit(50);
  return unwrap(data, error, "pagos");
}

export async function fetchPldResumen(): Promise<PldResumenItem[]> {
  const { data, error } = await supabase
    .from("pld_verificaciones")
    .select("lista, encontrado");
  const rows = unwrap(data, error, "pld_verificaciones resumen");
  const map = new Map<string, PldResumenItem>();
  for (const r of rows as { lista: string; encontrado: boolean }[]) {
    const cur = map.get(r.lista) ?? { lista: r.lista, total: 0, encontrados: 0 };
    cur.total += 1;
    if (r.encontrado) cur.encontrados += 1;
    map.set(r.lista, cur);
  }
  return Array.from(map.values());
}

export async function fetchHistoricoReporte(reporteNombre: string): Promise<ReporteGenerado[]> {
  const { data, error } = await supabase
    .from("reportes_generados")
    .select("*")
    .eq("reporte_nombre", reporteNombre)
    .order("created_at", { ascending: false })
    .limit(20);
  return unwrap(data, error, "reportes_generados");
}

export async function registrarReporteGenerado(input: {
  reporte_nombre: string;
  categoria: string;
  folio: string;
  periodo: string | null;
  generado_por: string | null;
}): Promise<void> {
  const { error } = await supabase.from("reportes_generados").insert(input);
  if (error) throw new Error(`[insert reportes_generados] ${error.message}`);
}

// ---------- DOCUMENTOS RECURRENTES (Panel 17) ----------

export async function fetchDocumentosRecurrentes(): Promise<DocumentoRecurrente[]> {
  const { data, error } = await supabase
    .from("v_documentos_recurrentes")
    .select("*");
  return unwrap(data, error, "v_documentos_recurrentes");
}

// ---------- RIESGO / PORTFOLIO MANAGEMENT ----------

export async function fetchConcentracionCliente(): Promise<ConcentracionItem[]> {
  const { data, error } = await supabase
    .from("v_concentracion_cliente")
    .select("*");
  return unwrap(data, error, "v_concentracion_cliente");
}

export async function fetchConcentracionSector(): Promise<ConcentracionItem[]> {
  const { data, error } = await supabase
    .from("v_concentracion_sector")
    .select("*");
  return unwrap(data, error, "v_concentracion_sector");
}

export async function fetchConcentracionTipo(): Promise<ConcentracionItem[]> {
  const { data, error } = await supabase
    .from("v_concentracion_tipo")
    .select("*");
  return unwrap(data, error, "v_concentracion_tipo");
}

export async function fetchVintage(): Promise<VintageItem[]> {
  const { data, error } = await supabase
    .from("v_vintage_originacion")
    .select("*");
  return unwrap(data, error, "v_vintage_originacion");
}

// ---------- USUARIOS Y ROLES ----------

export async function fetchUsuarios(): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .order("created_at", { ascending: true });
  return unwrap(data, error, "usuarios");
}

export interface NuevoUsuarioInput {
  nombre: string;
  rol: string;
  email: string | null;
}

export async function createUsuario(input: NuevoUsuarioInput): Promise<Usuario> {
  const { data, error } = await supabase
    .from("usuarios")
    .insert({ ...input, estado: "Pendiente" })
    .select("*")
    .single();
  return unwrap(data, error, "insert usuarios");
}

export async function updateUsuario(
  id: string,
  patch: Partial<Pick<Usuario, "nombre" | "rol" | "email" | "estado" | "foto_url">>
): Promise<void> {
  const { error } = await supabase.from("usuarios").update(patch).eq("id", id);
  if (error) throw new Error(`[update usuarios] ${error.message}`);
}

// ---------- COBRANZA: BITÁCORA DE ACCIONES ----------

export async function fetchCobranzaAcciones(creditoId: string): Promise<CobranzaAccion[]> {
  const { data, error } = await supabase
    .from("cobranza_acciones")
    .select("*")
    .eq("credito_id", creditoId)
    .order("created_at", { ascending: false });
  return unwrap(data, error, "cobranza_acciones");
}

export async function createCobranzaAccion(input: {
  credito_id: string;
  tipo: CobranzaAccionTipo;
  descripcion: string;
  creado_por?: string | null;
}): Promise<CobranzaAccion> {
  const { data, error } = await supabase
    .from("cobranza_acciones")
    .insert(input)
    .select("*")
    .single();
  return unwrap(data, error, "insert cobranza_acciones");
}

// ---------- DOCUMENTOS RECURRENTES: marcar recibido ----------

export async function marcarDocumentoRecurrenteRecibido(
  id: string,
  proximaActualizacion: string | null
): Promise<void> {
  const { error } = await supabase
    .from("documentos")
    .update({
      estatus: "VALIDO",
      fecha_carga: new Date().toISOString(),
      proxima_actualizacion: proximaActualizacion,
    })
    .eq("id", id);
  if (error) throw new Error(`[update documentos] ${error.message}`);
}

// ---------- COMITÉ / DISPERSIÓN ----------

export interface NuevoCreditoDesdeSolicitudInput {
  cliente_id: string;
  monto_original: number;
  tasa_anual: number;
  plazo_meses: number;
  centro_costo: string | null;
}

export async function createCreditoDesdeSolicitud(
  input: NuevoCreditoDesdeSolicitudInput
): Promise<{ id: string; contrato_numero: string }> {
  const contrato_numero = `CRT-${new Date().getFullYear()}-${String(
    Math.floor(Math.random() * 90000) + 10000
  ).padStart(5, "0")}`;
  const fecha_inicio = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("creditos")
    .insert({
      contrato_numero,
      cliente_id: input.cliente_id,
      tipo_codigo: "SIMPLE",
      monto_original: input.monto_original,
      tasa_anual: input.tasa_anual,
      plazo_meses: input.plazo_meses,
      fecha_inicio,
      fecha_dispersion: fecha_inicio,
      estatus_codigo: "VIGENTE",
      saldo_insoluto: input.monto_original,
      centro_costo: input.centro_costo,
    })
    .select("id, contrato_numero")
    .single();
  return unwrap(data, error, "insert creditos");
}

/** Doble partida del desembolso: carga Cartera vigente (1.02), abona Bancos (1.01). */
export async function createAsientosDispersion(
  creditoId: string,
  monto: number
): Promise<void> {
  const batch_id = crypto.randomUUID();
  const fecha = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("asientos_contables").insert([
    {
      batch_id,
      fecha,
      descripcion: "Dispersión del crédito",
      cuenta_codigo: "1.02",
      debe: monto,
      haber: 0,
      credito_id: creditoId,
    },
    {
      batch_id,
      fecha,
      descripcion: "Dispersión del crédito",
      cuenta_codigo: "1.01",
      debe: 0,
      haber: monto,
      credito_id: creditoId,
    },
  ]);
  if (error) throw new Error(`[insert asientos_contables] ${error.message}`);
}
