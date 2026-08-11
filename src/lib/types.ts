// Tipos derivados del esquema Supabase de Ledgerly

export type EstatusCredito =
  | "VIGENTE"
  | "MORA"
  | "JURIDICO"
  | "CASTIGADO"
  | "LIQUIDADO";

export type EtapaSolicitud =
  | "EVALUACION"
  | "ANALISIS"
  | "PENDIENTE"
  | "COMITE"
  | "APROBADO"
  | "RECHAZADO"
  | "DISPERSADO";

export interface Cliente {
  id: string;
  nombre: string;
  razon_social: string | null;
  rfc: string | null;
  tipo: string;
  sector: string | null;
}

export interface CreditoFull {
  id: string;
  contrato_numero: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_rfc: string | null;
  cliente_tipo: string;
  tipo_codigo: string;
  tipo_nombre: string;
  aplica_iva: boolean;
  monto_original: number;
  moneda: string;
  tasa_anual: number;
  tasa_mensual: number;
  plazo_meses: number | null;
  fecha_inicio: string;
  fecha_vencimiento: string | null;
  fecha_dispersion: string | null;
  cuota_mensual: number | null;
  estatus_codigo: EstatusCredito;
  estatus_nombre: string;
  saldo_insoluto: number | null;
  dias_atraso: number;
  intercompania: boolean;
  cobertura_garantia: number | null;
  dscr_actual: number | null;
  score_comportamiento: number | null;
}

export interface DashboardKpis {
  cartera_total: number;
  cartera_vigente: number;
  cartera_juridico: number;
  ipm_pct: number;
  total_creditos: number;
  creditos_juridico: number;
  efectivo_total: number;
  deuda_total: number;
}

export interface CapitalResumen {
  activos_productivos: number;
  cartera_vigente: number;
  capital_invertido_operacion: number;
  cartera_vencida: number;
  capital_distribuido: number;
}

export interface DistribucionEtapa {
  en_evaluacion: number;
  aprobado: number;
  desembolsado: number;
  en_cobranza: number;
  liquidado: number;
}

export interface CarteraAging {
  rango: string;
  valor: number;
}

export interface CarteraOperativa {
  fuente_id: string;
  origen: "CREDITO" | "ARRENDAMIENTO";
  contrato_numero: string;
  cliente_nombre: string;
  tipo: string;
  ingreso_sin_iva: number;
  iva: number;
  ingreso_con_iva: number;
}

export interface SolicitudListItem {
  id: string;
  folio: string;
  cliente_id: string;
  monto_solicitado: number;
  plazo_meses: number;
  tasa_propuesta: number | null;
  etapa_codigo: EtapaSolicitud;
  analista: string | null;
  fecha_solicitud: string;
  score_total: number | null;
  cliente: { nombre: string; rfc: string | null } | null;
}

export interface SolicitudDetalle extends SolicitudListItem {
  benchmark: string | null;
  centro_costo: string | null;
  score_kyc: number | null;
  score_capacidad: number | null;
  score_garantia: number | null;
  score_legal: number | null;
  score_rentabilidad: number | null;
  riesgo_clasificacion: string | null;
  ingresos_mensuales: number | null;
  ebitda_mensual: number | null;
  flujo_disponible: number | null;
  dscr: number | null;
  pld_resultado: string | null;
  pld_oficial: string | null;
  pld_fecha: string | null;
  garantia_tipo: string | null;
  garantia_ubicacion: string | null;
  garantia_valor_avaluo: number | null;
  cobertura_garantia: number | null;
  decision_analista: string | null;
  comentarios_analista: string | null;
}

export interface Documento {
  id: string;
  nombre: string;
  archivo_filename: string | null;
  estatus: "PENDIENTE" | "VALIDO" | "RECHAZADO" | "VENCIDO";
  fecha_carga: string | null;
}

export interface PldVerificacion {
  id: string;
  lista: string;
  resultado: string;
  encontrado: boolean;
}

export interface ComiteAprobacion {
  id: string;
  miembro: string;
  cargo: string | null;
  voto: "APRUEBA" | "RECHAZA" | "ABSTENCION";
}

export interface CondicionAprobada {
  id: string;
  descripcion: string;
}

export interface AsientoContable {
  id: string;
  fecha: string;
  descripcion: string;
  cuenta_codigo: string;
  debe: number;
  haber: number;
}

export interface AlertaCobranza {
  credito_id: string;
  contrato_numero: string;
  empresa: string;
  dias_atraso: number;
  saldo_insoluto: number;
  estatus_codigo: EstatusCredito;
  bucket:
    | "Mora temprana"
    | "Cobranza inicial"
    | "Cobranza intensiva"
    | "Jurídica (60+ días)"
    | null;
  importe_vencido_estimado: number;
}

export interface CobranzaBucket {
  bucket: string;
  creditos: number;
  total_vencido: number;
}

export interface AmortizacionPeriodo {
  id: string;
  periodo: number;
  fecha_pago: string;
  saldo_inicial: number;
  cuota: number;
  intereses: number;
  iva_intereses: number;
  amortizacion_capital: number;
  saldo_insoluto: number;
  pago_total: number;
  estatus: string;
}

// ----- Documentos recurrentes (Panel 17) -----

export type FrecuenciaDoc =
  | "UNICA"
  | "TRIMESTRAL"
  | "SEMESTRAL"
  | "ANUAL"
  | "CADA_24M";

export type AlertaDoc = "VIGENTE" | "POR_VENCER" | "VENCIDO";

export interface DocumentoRecurrente {
  id: string;
  credito_id: string;
  contrato_numero: string;
  cliente_nombre: string;
  documento: string;
  frecuencia: FrecuenciaDoc;
  estatus: "PENDIENTE" | "VALIDO" | "RECHAZADO" | "VENCIDO";
  fecha_carga: string | null;
  proxima_actualizacion: string | null;
  alerta: AlertaDoc | null;
  dias_para_vencer: number | null;
}

// ----- Usuarios y roles -----

export interface Usuario {
  id: string;
  nombre: string;
  rol: string;
  email: string | null;
  estado: "Activo" | "Pendiente" | "Por crear";
  foto_url: string | null;
}

// ----- Cobranza: bitácora de acciones -----

export type CobranzaAccionTipo = "CONTACTO" | "CONVENIO" | "EXPEDIENTE_JURIDICO";

export interface CobranzaAccion {
  id: string;
  credito_id: string;
  tipo: CobranzaAccionTipo;
  descripcion: string;
  creado_por: string | null;
  created_at: string;
}

// ----- Reportes: tablas contables/operativas de respaldo -----

export interface LibroMayorRow {
  cuenta_codigo: string;
  cuenta_nombre: string;
  naturaleza: "ACTIVO" | "PASIVO" | "CAPITAL" | "INGRESO" | "GASTO";
  total_debe: number;
  total_haber: number;
  saldo_deudor: number;
}

export interface Provision {
  id: string;
  fecha_corte: string;
  credito_id: string;
  bucket: "VIGENTE" | "1_30" | "31_60" | "61_90" | "90_PLUS";
  saldo: number;
  tasa_provision: number;
  monto_provision: number;
}

export interface FuenteFondeo {
  id: string;
  prestamista: string;
  tipo: string;
  moneda: string;
  monto_linea: number | null;
  saldo_actual: number;
  saldo_mxn: number;
  tasa_referencia: string | null;
  spread: number | null;
  fecha_disposicion: string | null;
  fecha_vencimiento: string | null;
}

export interface Pago {
  id: string;
  credito_id: string | null;
  fecha_pago: string;
  monto_capital: number;
  monto_intereses: number;
  monto_total: number;
  cep_spei: string | null;
  conciliado: boolean;
}

export interface PldResumenItem {
  lista: string;
  total: number;
  encontrados: number;
}

export interface ReporteGenerado {
  id: string;
  reporte_nombre: string;
  categoria: string;
  folio: string;
  periodo: string | null;
  generado_por: string | null;
  created_at: string;
}

// ----- Riesgo / Portfolio Management -----

export interface ConcentracionItem {
  cliente_id?: string;
  codigo?: string;
  nombre?: string;
  tipo?: string;
  sector?: string;
  exposicion: number;
  pct_cartera: number;
  creditos: number;
}

export interface VintageItem {
  cosecha: string;
  creditos: number;
  monto_originado: number;
  saldo_actual: number;
  saldo_problemas: number;
  npl_ratio_pct: number;
}
