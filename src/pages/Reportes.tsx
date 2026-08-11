import { useState } from "react";
import type jsPDF from "jspdf";
import {
  BookOpenCheck,
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  Landmark,
  Loader2,
  ScrollText,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  addParagraph,
  addSectionTitle,
  addSummaryCards,
  addTable,
  addTotalRow,
  createLedgerlyDocument,
  finishAndDownload,
} from "@/lib/pdf";
import { formatDate, formatDateTime, formatMXN, formatPercent } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import type { ReporteGenerado } from "@/lib/types";
import {
  fetchAlertasCobranza,
  fetchAsientos,
  fetchCarteraAging,
  fetchCarteraOperativaMensual,
  fetchConcentracionCliente,
  fetchConcentracionSector,
  fetchCreditos,
  fetchDashboardKpis,
  fetchFuentesFondeo,
  fetchHistoricoReporte,
  fetchLibroMayor,
  fetchPagosRecientes,
  fetchPldResumen,
  fetchProvisiones,
  fetchVintage,
  registrarReporteGenerado,
} from "@/lib/api";

interface Reporte {
  nombre: string;
  descripcion: string;
  formato: string[];
  ultimoCorte: string;
  icon: React.ComponentType<{ className?: string }>;
  codigo: string;
  build: (doc: jsPDF, y: number) => Promise<void>;
}

// ---------- helpers ----------

function generarFolio(codigo: string) {
  const fecha = new Date();
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `RPT-${codigo}-${yyyy}${mm}${dd}-${rand}`;
}

function slugify(nombre: string) {
  return nombre.replace(/[^\w\sáéíóúñ-]/gi, "").replace(/\s+/g, "_");
}

function concentracionLabel(item: { nombre?: string; sector?: string; tipo?: string }) {
  return item.nombre ?? item.sector ?? item.tipo ?? "—";
}

// ---------- constructores de contenido (datos reales por reporte) ----------

async function buildEstadoResultados(doc: jsPDF, y: number) {
  const rows = await fetchLibroMayor();
  const ingresos = rows.filter((r) => r.naturaleza === "INGRESO");
  const gastos = rows.filter((r) => r.naturaleza === "GASTO");
  const totalIngresos = ingresos.reduce((s, r) => s + (r.total_haber - r.total_debe), 0);
  const totalGastos = gastos.reduce((s, r) => s + (r.total_debe - r.total_haber), 0);
  const utilidad = totalIngresos - totalGastos;

  let cursor = addSummaryCards(doc, y, [
    { label: "Ingresos totales", value: formatMXN(totalIngresos) },
    { label: "Gastos totales", value: formatMXN(totalGastos) },
    { label: "Utilidad neta", value: formatMXN(utilidad) },
  ]);
  cursor = addSectionTitle(doc, cursor, "Ingresos por cuenta");
  cursor = addTable(
    doc,
    cursor,
    ["Cuenta", "Nombre", "Monto"],
    ingresos.map((r) => [r.cuenta_codigo, r.cuenta_nombre, formatMXN(r.total_haber - r.total_debe)])
  );
  cursor = addSectionTitle(doc, cursor, "Gastos por cuenta");
  cursor = addTable(
    doc,
    cursor,
    ["Cuenta", "Nombre", "Monto"],
    gastos.map((r) => [r.cuenta_codigo, r.cuenta_nombre, formatMXN(r.total_debe - r.total_haber)])
  );
  addTotalRow(doc, cursor, "Utilidad neta del periodo", formatMXN(utilidad));
}

async function buildBalanceGeneral(doc: jsPDF, y: number) {
  const rows = await fetchLibroMayor();
  const activos = rows.filter((r) => r.naturaleza === "ACTIVO");
  const pasivos = rows.filter((r) => r.naturaleza === "PASIVO");
  const capital = rows.filter((r) => r.naturaleza === "CAPITAL");
  const totalActivos = activos.reduce((s, r) => s + r.saldo_deudor, 0);
  const totalPasivos = pasivos.reduce((s, r) => s - r.saldo_deudor, 0);
  const totalCapital = capital.reduce((s, r) => s - r.saldo_deudor, 0);

  let cursor = addSummaryCards(doc, y, [
    { label: "Activo total", value: formatMXN(totalActivos) },
    { label: "Pasivo total", value: formatMXN(totalPasivos) },
    { label: "Capital contable", value: formatMXN(totalCapital) },
  ]);
  cursor = addSectionTitle(doc, cursor, "Activo");
  cursor = addTable(
    doc,
    cursor,
    ["Cuenta", "Nombre", "Saldo"],
    activos.map((r) => [r.cuenta_codigo, r.cuenta_nombre, formatMXN(r.saldo_deudor)])
  );
  cursor = addSectionTitle(doc, cursor, "Pasivo");
  cursor = addTable(
    doc,
    cursor,
    ["Cuenta", "Nombre", "Saldo"],
    pasivos.map((r) => [r.cuenta_codigo, r.cuenta_nombre, formatMXN(-r.saldo_deudor)])
  );
  cursor = addSectionTitle(doc, cursor, "Capital");
  cursor = addTable(
    doc,
    cursor,
    ["Cuenta", "Nombre", "Saldo"],
    capital.map((r) => [r.cuenta_codigo, r.cuenta_nombre, formatMXN(-r.saldo_deudor)])
  );
  addTotalRow(doc, cursor, "Pasivo + Capital", formatMXN(totalPasivos + totalCapital));
}

async function buildFlujoEfectivo(doc: jsPDF, y: number) {
  const asientos = await fetchAsientos();
  const bancos = asientos.filter((a) => a.cuenta_codigo === "1.01");
  const totalEntradas = bancos.reduce((s, a) => s + a.debe, 0);
  const totalSalidas = bancos.reduce((s, a) => s + a.haber, 0);
  const flujoNeto = totalEntradas - totalSalidas;

  let cursor = addSummaryCards(doc, y, [
    { label: "Entradas de efectivo", value: formatMXN(totalEntradas) },
    { label: "Salidas de efectivo", value: formatMXN(totalSalidas) },
    { label: "Flujo neto", value: formatMXN(flujoNeto) },
  ]);
  cursor = addSectionTitle(doc, cursor, "Movimientos de banco (cuenta 1.01)");
  cursor = addTable(
    doc,
    cursor,
    ["Fecha", "Descripción", "Entrada", "Salida"],
    bancos.map((a) => [
      formatDate(a.fecha),
      a.descripcion,
      a.debe ? formatMXN(a.debe) : "—",
      a.haber ? formatMXN(a.haber) : "—",
    ])
  );
  addTotalRow(doc, cursor, "Flujo neto de efectivo", formatMXN(flujoNeto));
}

async function buildCarteraOperativa(doc: jsPDF, y: number) {
  const rows = await fetchCarteraOperativaMensual();
  const totalSinIva = rows.reduce((s, r) => s + r.ingreso_sin_iva, 0);
  const totalIva = rows.reduce((s, r) => s + r.iva, 0);
  const totalConIva = rows.reduce((s, r) => s + r.ingreso_con_iva, 0);

  let cursor = addSummaryCards(doc, y, [
    { label: "Ingreso sin IVA", value: formatMXN(totalSinIva) },
    { label: "IVA", value: formatMXN(totalIva) },
    { label: "Ingreso con IVA", value: formatMXN(totalConIva) },
  ]);
  cursor = addSectionTitle(doc, cursor, "Detalle por contrato");
  cursor = addTable(
    doc,
    cursor,
    ["Contrato", "Cliente", "Tipo", "Sin IVA", "IVA", "Con IVA"],
    rows.map((r) => [
      r.contrato_numero,
      r.cliente_nombre,
      r.tipo,
      formatMXN(r.ingreso_sin_iva),
      formatMXN(r.iva),
      formatMXN(r.ingreso_con_iva),
    ])
  );
  addTotalRow(doc, cursor, "Ingreso total con IVA", formatMXN(totalConIva));
}

async function buildAgingCartera(doc: jsPDF, y: number) {
  const rows = await fetchCarteraAging();
  const total = rows.reduce((s, r) => s + r.valor, 0);
  const vigente = rows.find((r) => /vigente/i.test(r.rango));
  const mora = rows.filter((r) => !/vigente/i.test(r.rango)).reduce((s, r) => s + r.valor, 0);

  let cursor = addSummaryCards(doc, y, [
    { label: "Cartera total", value: formatMXN(total) },
    { label: "Cartera vigente", value: formatMXN(vigente?.valor ?? 0) },
    { label: "Cartera en mora", value: formatMXN(mora) },
  ]);
  cursor = addSectionTitle(doc, cursor, "Distribución por rango de atraso");
  cursor = addTable(
    doc,
    cursor,
    ["Rango", "Saldo", "% de cartera"],
    rows.map((r) => [r.rango, formatMXN(r.valor), formatPercent(total ? (r.valor / total) * 100 : 0)])
  );
  addTotalRow(doc, cursor, "Cartera total", formatMXN(total));
}

async function buildConcentracion(doc: jsPDF, y: number) {
  const [clientes, sectores] = await Promise.all([
    fetchConcentracionCliente(),
    fetchConcentracionSector(),
  ]);

  let cursor = addSectionTitle(doc, y, "Concentración por cliente (top exposiciones)");
  cursor = addTable(
    doc,
    cursor,
    ["Cliente", "Exposición", "% cartera", "Créditos"],
    clientes.map((c) => [
      concentracionLabel(c),
      formatMXN(c.exposicion),
      formatPercent(c.pct_cartera),
      String(c.creditos),
    ])
  );
  cursor = addSectionTitle(doc, cursor, "Concentración por sector");
  addTable(
    doc,
    cursor,
    ["Sector", "Exposición", "% cartera", "Créditos"],
    sectores.map((s) => [
      concentracionLabel(s),
      formatMXN(s.exposicion),
      formatPercent(s.pct_cartera),
      String(s.creditos),
    ])
  );
}

async function buildVintage(doc: jsPDF, y: number) {
  const rows = await fetchVintage();
  const totalOriginado = rows.reduce((s, r) => s + r.monto_originado, 0);
  const totalSaldo = rows.reduce((s, r) => s + r.saldo_actual, 0);

  let cursor = addSummaryCards(doc, y, [
    { label: "Monto originado", value: formatMXN(totalOriginado) },
    { label: "Saldo actual", value: formatMXN(totalSaldo) },
    { label: "Cosechas analizadas", value: String(rows.length) },
  ]);
  cursor = addSectionTitle(doc, cursor, "NPL ratio por cosecha de originación");
  addTable(
    doc,
    cursor,
    ["Cosecha", "Créditos", "Originado", "Saldo actual", "Saldo con problemas", "NPL %"],
    rows.map((r) => [
      r.cosecha,
      String(r.creditos),
      formatMXN(r.monto_originado),
      formatMXN(r.saldo_actual),
      formatMXN(r.saldo_problemas),
      formatPercent(r.npl_ratio_pct),
    ])
  );
}

async function buildRecuperacionJudicial(doc: jsPDF, y: number) {
  const alertas = await fetchAlertasCobranza();
  const juridico = alertas.filter(
    (a) => a.estatus_codigo === "JURIDICO" || a.bucket === "Jurídica (60+ días)"
  );
  const totalSaldo = juridico.reduce((s, a) => s + a.saldo_insoluto, 0);
  const totalVencido = juridico.reduce((s, a) => s + a.importe_vencido_estimado, 0);

  let cursor = addSummaryCards(doc, y, [
    { label: "Créditos en jurídico", value: String(juridico.length) },
    { label: "Saldo insoluto", value: formatMXN(totalSaldo) },
    { label: "Vencido estimado", value: formatMXN(totalVencido) },
  ]);
  cursor = addSectionTitle(doc, cursor, "Créditos en proceso judicial");
  if (juridico.length === 0) {
    addParagraph(
      doc,
      cursor,
      "No se identifican créditos en proceso de recuperación judicial al corte de este reporte."
    );
    return;
  }
  addTable(
    doc,
    cursor,
    ["Contrato", "Empresa", "Días de atraso", "Saldo insoluto", "Vencido estimado"],
    juridico.map((a) => [
      a.contrato_numero,
      a.empresa,
      String(a.dias_atraso),
      formatMXN(a.saldo_insoluto),
      formatMXN(a.importe_vencido_estimado),
    ])
  );
}

async function buildCnbvB6(doc: jsPDF, y: number) {
  const [kpis, aging] = await Promise.all([fetchDashboardKpis(), fetchCarteraAging()]);

  let cursor = addSummaryCards(doc, y, [
    { label: "Cartera total", value: formatMXN(kpis.cartera_total) },
    { label: "Cartera vigente", value: formatMXN(kpis.cartera_vigente) },
    { label: "IMOR", value: formatPercent(kpis.ipm_pct) },
  ]);
  cursor = addSectionTitle(doc, cursor, "Distribución de cartera por aging (insumo B-6)");
  cursor = addTable(doc, cursor, ["Rango", "Saldo"], aging.map((a) => [a.rango, formatMXN(a.valor)]));
  addParagraph(
    doc,
    cursor,
    "Este documento consolida los insumos internos (cartera, aging, IMOR) utilizados para la elaboración del reporte regulatorio B-6 ante la CNBV. La capa de layout XML/TXT conforme al catálogo vigente se genera en el módulo regulatorio de producción y no está incluida en este entorno de demostración."
  );
}

async function buildIfrs9(doc: jsPDF, y: number) {
  const creditos = await fetchCreditos();
  const activos = creditos.filter(
    (c) => c.estatus_codigo !== "LIQUIDADO" && c.estatus_codigo !== "CASTIGADO"
  );

  function stageDe(dias: number): { stage: string; tasa: number } {
    if (dias === 0) return { stage: "Stage 1", tasa: 0.01 };
    if (dias <= 30) return { stage: "Stage 2", tasa: 0.05 };
    if (dias <= 60) return { stage: "Stage 2", tasa: 0.15 };
    if (dias <= 90) return { stage: "Stage 3", tasa: 0.35 };
    return { stage: "Stage 3", tasa: 0.75 };
  }

  const rows = activos.map((c) => {
    const saldo = c.saldo_insoluto ?? c.monto_original;
    const { stage, tasa } = stageDe(c.dias_atraso);
    return { stage, saldo, ecl: saldo * tasa };
  });
  const totalSaldo = rows.reduce((s, r) => s + r.saldo, 0);
  const totalEcl = rows.reduce((s, r) => s + r.ecl, 0);
  const porStage = ["Stage 1", "Stage 2", "Stage 3"].map((stage) => {
    const subset = rows.filter((r) => r.stage === stage);
    return {
      stage,
      creditos: subset.length,
      saldo: subset.reduce((s, r) => s + r.saldo, 0),
      ecl: subset.reduce((s, r) => s + r.ecl, 0),
    };
  });

  let cursor = addSummaryCards(doc, y, [
    { label: "Saldo total", value: formatMXN(totalSaldo) },
    { label: "ECL total", value: formatMXN(totalEcl) },
    { label: "Cobertura ECL", value: formatPercent(totalSaldo ? (totalEcl / totalSaldo) * 100 : 0) },
  ]);
  cursor = addSectionTitle(doc, cursor, "Pérdida esperada por etapa (Stage 1 / 2 / 3)");
  cursor = addTable(
    doc,
    cursor,
    ["Etapa", "Créditos", "Saldo", "Tasa promedio", "ECL"],
    porStage.map((s) => [
      s.stage,
      String(s.creditos),
      formatMXN(s.saldo),
      formatPercent(s.saldo ? (s.ecl / s.saldo) * 100 : 0),
      formatMXN(s.ecl),
    ])
  );
  addTotalRow(doc, cursor, "Pérdida esperada total (ECL)", formatMXN(totalEcl));
}

async function buildUif(doc: jsPDF, y: number) {
  const resumen = await fetchPldResumen();
  const totalVerificaciones = resumen.reduce((s, r) => s + r.total, 0);
  const totalEncontrados = resumen.reduce((s, r) => s + r.encontrados, 0);

  let cursor = addSummaryCards(doc, y, [
    { label: "Verificaciones PLD", value: String(totalVerificaciones) },
    { label: "Listas consultadas", value: String(resumen.length) },
    { label: "Coincidencias", value: String(totalEncontrados) },
  ]);
  cursor = addSectionTitle(doc, cursor, "Resultado por lista de verificación");
  cursor = addTable(
    doc,
    cursor,
    ["Lista", "Verificaciones", "Coincidencias"],
    resumen.map((r) => [r.lista, String(r.total), String(r.encontrados)])
  );
  addParagraph(
    doc,
    cursor,
    totalEncontrados === 0
      ? "No se identificaron operaciones inusuales, relevantes o preocupantes que requieran reporte a la UIF conforme a la LFPIORPI durante el periodo analizado."
      : `Se identificaron ${totalEncontrados} coincidencia(s) en listas de verificación PLD. Estos casos deben ser revisados por el oficial de cumplimiento antes de determinar si procede un reporte de operación inusual o relevante ante la UIF.`
  );
}

async function buildSat(doc: jsPDF, y: number) {
  const rows = await fetchLibroMayor();
  const ingresos = rows.filter((r) => r.naturaleza === "INGRESO");
  const totalIngresos = ingresos.reduce((s, r) => s + (r.total_haber - r.total_debe), 0);
  const ivaPorPagar = rows.find((r) => r.cuenta_codigo === "2.04");
  const ivaMonto = ivaPorPagar ? -ivaPorPagar.saldo_deudor : 0;

  let cursor = addSummaryCards(doc, y, [
    { label: "Ingresos gravables", value: formatMXN(totalIngresos) },
    { label: "IVA por pagar", value: formatMXN(ivaMonto) },
    { label: "ISR estimado (30%)", value: formatMXN(totalIngresos * 0.3) },
  ]);
  cursor = addSectionTitle(doc, cursor, "Base de ingresos por cuenta");
  cursor = addTable(
    doc,
    cursor,
    ["Cuenta", "Nombre", "Ingreso"],
    ingresos.map((r) => [r.cuenta_codigo, r.cuenta_nombre, formatMXN(r.total_haber - r.total_debe)])
  );
  addParagraph(
    doc,
    cursor,
    "Las cifras anteriores son la base contable (ingresos e IVA por pagar) que alimenta las declaraciones formales (DIOT, pagos provisionales de ISR, complementos de pago). La generación del XML timbrado y su envío al SAT requiere el módulo fiscal con e.firma / CSD, no incluido en este entorno de demostración."
  );
}

async function buildConciliacionSpei(doc: jsPDF, y: number) {
  const pagos = await fetchPagosRecientes();
  const conciliados = pagos.filter((p) => p.conciliado);
  const pendientes = pagos.filter((p) => !p.conciliado);
  const totalMonto = pagos.reduce((s, p) => s + p.monto_total, 0);

  let cursor = addSummaryCards(doc, y, [
    { label: "Pagos registrados", value: String(pagos.length) },
    { label: "Conciliados", value: String(conciliados.length) },
    { label: "Pendientes", value: String(pendientes.length) },
  ]);
  cursor = addSectionTitle(doc, cursor, "Detalle de pagos y estatus de conciliación");
  cursor = addTable(
    doc,
    cursor,
    ["Fecha", "CEP SPEI", "Capital", "Intereses", "Total", "Estatus"],
    pagos.map((p) => [
      formatDate(p.fecha_pago),
      p.cep_spei ?? "—",
      formatMXN(p.monto_capital),
      formatMXN(p.monto_intereses),
      formatMXN(p.monto_total),
      p.conciliado ? "Conciliado" : "Pendiente",
    ])
  );
  addTotalRow(doc, cursor, "Monto total procesado", formatMXN(totalMonto));
}

async function buildMovimientosMes(doc: jsPDF, y: number) {
  const asientos = await fetchAsientos();
  const totalDebe = asientos.reduce((s, a) => s + a.debe, 0);
  const totalHaber = asientos.reduce((s, a) => s + a.haber, 0);

  let cursor = addSummaryCards(doc, y, [
    { label: "Asientos registrados", value: String(asientos.length) },
    { label: "Total cargos", value: formatMXN(totalDebe) },
    { label: "Total abonos", value: formatMXN(totalHaber) },
  ]);
  cursor = addSectionTitle(doc, cursor, "Últimos movimientos contables");
  addTable(
    doc,
    cursor,
    ["Fecha", "Cuenta", "Descripción", "Cargo", "Abono"],
    asientos.map((a) => [
      formatDate(a.fecha),
      a.cuenta_codigo,
      a.descripcion,
      a.debe ? formatMXN(a.debe) : "—",
      a.haber ? formatMXN(a.haber) : "—",
    ])
  );
}

async function buildProvisiones(doc: jsPDF, y: number) {
  const provisiones = await fetchProvisiones();
  const BUCKETS: { key: string; label: string }[] = [
    { key: "VIGENTE", label: "Vigente" },
    { key: "1_30", label: "1-30 días" },
    { key: "31_60", label: "31-60 días" },
    { key: "61_90", label: "61-90 días" },
    { key: "90_PLUS", label: "90+ días" },
  ];
  const porBucket = BUCKETS.map(({ key, label }) => {
    const subset = provisiones.filter((p) => p.bucket === key);
    return {
      label,
      creditos: subset.length,
      saldo: subset.reduce((s, p) => s + p.saldo, 0),
      provision: subset.reduce((s, p) => s + p.monto_provision, 0),
    };
  });
  const totalSaldo = porBucket.reduce((s, b) => s + b.saldo, 0);
  const totalProvision = porBucket.reduce((s, b) => s + b.provision, 0);

  let cursor = addSummaryCards(doc, y, [
    { label: "Saldo total", value: formatMXN(totalSaldo) },
    { label: "Provisión total", value: formatMXN(totalProvision) },
    { label: "Cobertura", value: formatPercent(totalSaldo ? (totalProvision / totalSaldo) * 100 : 0) },
  ]);
  cursor = addSectionTitle(doc, cursor, "Reservas por bucket de mora");
  cursor = addTable(
    doc,
    cursor,
    ["Bucket", "Créditos", "Saldo", "Tasa", "Provisión"],
    porBucket.map((b) => [
      b.label,
      String(b.creditos),
      formatMXN(b.saldo),
      formatPercent(b.saldo ? (b.provision / b.saldo) * 100 : 0),
      formatMXN(b.provision),
    ])
  );
  addTotalRow(doc, cursor, "Provisión total requerida", formatMXN(totalProvision));
}

async function buildBorrowingBase(doc: jsPDF, y: number) {
  const fuentes = await fetchFuentesFondeo();
  const meridian = fuentes.filter((f) => /meridian/i.test(f.prestamista));
  const lineas = meridian.length ? meridian : fuentes;
  const totalLinea = lineas.reduce((s, f) => s + (f.monto_linea ?? 0), 0);
  const totalDispuesto = lineas.reduce((s, f) => s + f.saldo_mxn, 0);
  const disponible = totalLinea - totalDispuesto;

  let cursor = addSummaryCards(doc, y, [
    { label: "Línea total", value: formatMXN(totalLinea) },
    { label: "Saldo dispuesto", value: formatMXN(totalDispuesto) },
    { label: "Disponible", value: formatMXN(disponible) },
  ]);
  cursor = addSectionTitle(doc, cursor, "Líneas de fondeo");
  cursor = addTable(
    doc,
    cursor,
    ["Prestamista", "Tipo", "Moneda", "Línea", "Saldo actual", "Tasa ref.", "Vencimiento"],
    lineas.map((f) => [
      f.prestamista,
      f.tipo,
      f.moneda,
      f.monto_linea != null ? formatMXN(f.monto_linea) : "—",
      formatMXN(f.saldo_actual),
      f.tasa_referencia ?? "—",
      f.fecha_vencimiento ? formatDate(f.fecha_vencimiento) : "—",
    ])
  );
  addTotalRow(doc, cursor, "Disponible en línea (borrowing base)", formatMXN(disponible));
}

// ---------- catálogo de reportes ----------

const REPORTES_FINANCIEROS: Reporte[] = [
  {
    nombre: "Estado de Resultados (mensual)",
    descripcion: "P&L institucional con desglose por línea de negocio (crédito, arrendamiento, inversiones)",
    formato: ["PDF", "Excel"],
    ultimoCorte: "31/05/2026",
    icon: TrendingUp,
    codigo: "ER",
    build: buildEstadoResultados,
  },
  {
    nombre: "Balance General",
    descripcion: "Activos productivos, cartera, caja, fondeo Meridian Capital Bank, capital social",
    formato: ["PDF", "Excel"],
    ultimoCorte: "31/05/2026",
    icon: Landmark,
    codigo: "BG",
    build: buildBalanceGeneral,
  },
  {
    nombre: "Flujo de efectivo",
    descripcion: "Entradas (cobros, dispersiones) y salidas (pagos, costo financiero)",
    formato: ["PDF", "Excel"],
    ultimoCorte: "31/05/2026",
    icon: TrendingUp,
    codigo: "FE",
    build: buildFlujoEfectivo,
  },
  {
    nombre: "Cartera operativa mensual",
    descripcion: "Ingresos recurrentes proyectados por crédito y arrendamiento (con/sin IVA)",
    formato: ["Excel"],
    ultimoCorte: "31/05/2026",
    icon: FileSpreadsheet,
    codigo: "CO",
    build: buildCarteraOperativa,
  },
];

const REPORTES_CARTERA: Reporte[] = [
  {
    nombre: "Aging de cartera",
    descripcion: "Distribución por días de atraso (0-30 / 31-60 / 61-90 / 90+) con saldo y tasa moratoria",
    formato: ["Excel"],
    ultimoCorte: "31/05/2026",
    icon: FileSpreadsheet,
    codigo: "AG",
    build: buildAgingCartera,
  },
  {
    nombre: "Concentración por cliente / sector",
    descripcion: "Top-N exposiciones, porcentaje sobre cartera, índice Herfindahl",
    formato: ["Excel"],
    ultimoCorte: "31/05/2026",
    icon: FileSpreadsheet,
    codigo: "CC",
    build: buildConcentracion,
  },
  {
    nombre: "Vintage / cosechas",
    descripcion: "NPL ratio por trimestre de originación; análisis de deterioro estructural vs coyuntural",
    formato: ["Excel"],
    ultimoCorte: "31/05/2026",
    icon: TrendingUp,
    codigo: "VT",
    build: buildVintage,
  },
  {
    nombre: "Recuperación judicial",
    descripcion: "Cartera vencida en proceso, abogados responsables, días desde demanda, recuperación esperada",
    formato: ["PDF", "Excel"],
    ultimoCorte: "31/05/2026",
    icon: ScrollText,
    codigo: "RJ",
    build: buildRecuperacionJudicial,
  },
];

const REPORTES_REGULATORIOS: Reporte[] = [
  {
    nombre: "CNBV — Reporte B-6 (Cartera)",
    descripcion: "Reporte regulatorio CNBV para SOFOM ENR sobre cartera de crédito y provisiones",
    formato: ["TXT", "Excel"],
    ultimoCorte: "30/04/2026",
    icon: ShieldAlert,
    codigo: "B6",
    build: buildCnbvB6,
  },
  {
    nombre: "IFRS 9 / ECL",
    descripcion: "Pérdida esperada por etapas (Stage 1/2/3) con macro overlay",
    formato: ["Excel"],
    ultimoCorte: "31/05/2026",
    icon: ShieldAlert,
    codigo: "E9",
    build: buildIfrs9,
  },
  {
    nombre: "UIF — Reportes 24h e inusuales",
    descripcion: "Operaciones relevantes, internas preocupantes y de 24h conforme a LFPIORPI",
    formato: ["XML"],
    ultimoCorte: "Vigente",
    icon: ShieldAlert,
    codigo: "UIF",
    build: buildUif,
  },
  {
    nombre: "SAT — Constancias y declaraciones",
    descripcion: "DIOT, ISR retenido, complementos de pago",
    formato: ["XML", "PDF"],
    ultimoCorte: "31/05/2026",
    icon: ScrollText,
    codigo: "SAT",
    build: buildSat,
  },
];

const REPORTES_OPERATIVOS: Reporte[] = [
  {
    nombre: "Conciliación SPEI",
    descripcion: "Conciliación banco ↔ subledger ↔ ledger contable; diferencias y excepciones",
    formato: ["Excel"],
    ultimoCorte: "31/05/2026",
    icon: BookOpenCheck,
    codigo: "CS",
    build: buildConciliacionSpei,
  },
  {
    nombre: "Movimientos del mes",
    descripcion: "Dispersiones, cobros, devengos, provisiones registradas durante el periodo",
    formato: ["Excel"],
    ultimoCorte: "31/05/2026",
    icon: FileSpreadsheet,
    codigo: "MM",
    build: buildMovimientosMes,
  },
  {
    nombre: "Provisiones y reservas",
    descripcion: "Snapshot por bucket (1% / 5% / 15% / 35% / 75%) con movimiento de reservas",
    formato: ["Excel"],
    ultimoCorte: "31/05/2026",
    icon: FileText,
    codigo: "PR",
    build: buildProvisiones,
  },
  {
    nombre: "Borrowing base — Meridian Capital Bank",
    descripcion: "Cartera elegible, advance rate, covenants vs línea revolvente",
    formato: ["Excel"],
    ultimoCorte: "31/05/2026",
    icon: Building2,
    codigo: "BB",
    build: buildBorrowingBase,
  },
];

const CATEGORIA_POR_TAB: Record<string, string> = {
  financieros: "Reportes financieros",
  cartera: "Reportes de cartera",
  regulatorios: "Reportes regulatorios",
  operativos: "Reportes operativos",
};

const TABS = [
  { id: "financieros", label: "Financieros", reportes: REPORTES_FINANCIEROS },
  { id: "cartera", label: "Cartera", reportes: REPORTES_CARTERA },
  { id: "regulatorios", label: "Regulatorios", reportes: REPORTES_REGULATORIOS },
  { id: "operativos", label: "Operativos", reportes: REPORTES_OPERATIVOS },
];

export default function Reportes() {
  const [tab, setTab] = useState("financieros");
  const activeTab = TABS.find((t) => t.id === tab);
  const reportes = activeTab?.reportes ?? [];

  const totalReportes = TABS.reduce((a, t) => a + t.reportes.length, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Reportes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Centro institucional de descarga: {totalReportes} reportes financieros,
            de cartera, regulatorios y operativos.
          </p>
        </div>
      </header>

      <Card>
        <div className="px-6 pt-2">
          <Tabs
            items={TABS.map((t) => ({
              id: t.id,
              label: t.label,
              count: t.reportes.length,
            }))}
            active={tab}
            onChange={setTab}
            className="border-b-0"
          />
        </div>

        <div className="border-t border-slate-100 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reportes.map((r) => (
              <ReporteCard
                key={r.nombre}
                reporte={r}
                categoria={CATEGORIA_POR_TAB[tab] ?? "Centro de reportes"}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function ReporteCard({ reporte, categoria }: { reporte: Reporte; categoria: string }) {
  const Icon = reporte.icon;
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [historico, setHistorico] = useState<ReporteGenerado[] | null>(null);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  async function handleDescargar() {
    setGenerando(true);
    try {
      const folio = generarFolio(reporte.codigo);
      const generadoPor = user?.email ?? "—";
      const { doc, y } = createLedgerlyDocument({
        title: reporte.nombre,
        category: categoria,
        folio,
        periodo: reporte.ultimoCorte,
        generadoPor,
      });
      await reporte.build(doc, y);
      finishAndDownload(doc, `${slugify(reporte.nombre)}.pdf`);
      toast.success("Reporte generado", `${reporte.nombre} se descargó correctamente.`);
      try {
        await registrarReporteGenerado({
          reporte_nombre: reporte.nombre,
          categoria,
          folio,
          periodo: reporte.ultimoCorte,
          generado_por: generadoPor,
        });
      } catch {
        // El PDF ya se descargó; no bloqueamos al usuario si falla el registro del histórico.
      }
    } catch (err) {
      toast.error(
        "No se pudo generar el reporte",
        err instanceof Error ? err.message : "Ocurrió un error al consultar los datos."
      );
    } finally {
      setGenerando(false);
    }
  }

  function abrirHistorico() {
    setHistoricoOpen(true);
    setHistoricoLoading(true);
    fetchHistoricoReporte(reporte.nombre)
      .then(setHistorico)
      .catch(() => setHistorico([]))
      .finally(() => setHistoricoLoading(false));
  }

  return (
    <Card className="shadow-none border-slate-200 hover:shadow-card-hover transition-shadow">
      <CardBody>
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm">{reporte.nombre}</CardTitle>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {reporte.descripcion}
            </p>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Último corte:</span>
                <span className="text-xs font-medium text-navy-800">
                  {reporte.ultimoCorte}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {reporte.formato.map((f) => (
                  <Badge key={f} tone="neutral">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button size="sm" onClick={handleDescargar} disabled={generando}>
                {generando ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {generando ? "Generando…" : "Descargar"}
              </Button>
              <Button size="sm" variant="outline" onClick={abrirHistorico}>
                Ver histórico
              </Button>
            </div>
          </div>
        </div>
      </CardBody>

      {historicoOpen && (
        <Modal open onClose={() => setHistoricoOpen(false)} title={reporte.nombre}>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Corte más reciente</span>
              <span className="font-semibold text-navy-900">{reporte.ultimoCorte}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Formatos</span>
              <div className="flex items-center gap-1.5">
                {reporte.formato.map((f) => (
                  <Badge key={f} tone="neutral">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Descargas registradas
              </p>
              {historicoLoading ? (
                <p className="text-sm text-slate-400 py-4 text-center">Cargando histórico…</p>
              ) : !historico || historico.length === 0 ? (
                <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  Todavía no hay descargas registradas para este reporte. Cada vez que alguien
                  lo descargue aparecerá aquí, con folio, fecha y quién lo generó.
                </p>
              ) : (
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {historico.map((h) => (
                    <div key={h.id} className="px-3 py-2.5 flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-navy-900 truncate">{h.folio}</p>
                        <p className="text-xs text-slate-500 truncate">{h.generado_por ?? "—"}</p>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {formatDateTime(h.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setHistoricoOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}
