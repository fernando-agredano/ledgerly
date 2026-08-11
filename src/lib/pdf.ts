import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Shared Ledgerly letterhead/footer so every exported PDF (expedientes,
// estados de cuenta, convenios, reportes) looks like it came from the same
// institutional template — an invoice-style header (folio/periodo/generado
// por in a bordered box) instead of a bare title, so nothing prints "empty".
const BRAND: [number, number, number] = [61, 114, 244]; // brand-600
const NAVY: [number, number, number] = [15, 28, 51]; // navy-900
const SLATE: [number, number, number] = [100, 116, 139]; // slate-500
const SLATE_LINE: [number, number, number] = [226, 232, 240]; // slate-200
const SLATE_BG: [number, number, number] = [248, 250, 252]; // slate-50
const MARGIN = 14;

export interface LedgerlyDocMeta {
  /** The report/document's own name, e.g. "Balance General". */
  title: string;
  /** Small tagline under the wordmark, e.g. "Centro de reportes". */
  category: string;
  folio?: string;
  periodo?: string;
  generadoPor?: string;
}

/** Shrinks a bold value's font size until it fits maxWidth (e.g. a long email in a fixed-width box). */
function fitBoldFontSize(doc: jsPDF, text: string, maxWidth: number, maxSize: number, minSize: number): number {
  doc.setFont("helvetica", "bold");
  let size = maxSize;
  while (size > minSize) {
    doc.setFontSize(size);
    if (doc.getTextWidth(text) <= maxWidth) return size;
    size -= 0.5;
  }
  doc.setFontSize(minSize);
  return minSize;
}

/** Last-resort ellipsis truncation for values that don't fit even at the smallest font size. */
function truncateToWidth(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && doc.getTextWidth(`${t}…`) > maxWidth) {
    t = t.slice(0, -1);
  }
  return `${t}…`;
}

function drawLetterheadAndMeta(doc: jsPDF, meta: LedgerlyDocMeta): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const topY = 18;

  // Logo mark (three ascending bars) + wordmark — same glyph as the app's sidebar logo.
  doc.setFillColor(...BRAND);
  doc.rect(MARGIN, topY - 6, 2.6, 6, "F");
  doc.rect(MARGIN + 4.2, topY - 9, 2.6, 9, "F");
  doc.rect(MARGIN + 8.4, topY - 13, 2.6, 13, "F");

  const textX = MARGIN + 8.4 + 2.6 + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...NAVY);
  doc.text("Ledgerly", textX, topY - 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text(meta.category, textX, topY);

  // Invoice-style metadata box, top-right — wide enough for a long email in "generado por".
  const boxW = 76;
  const boxX = pageWidth - MARGIN - boxW;
  const boxY = 3;
  const boxH = 25;
  doc.setFillColor(...SLATE_BG);
  doc.roundedRect(boxX, boxY, boxW, boxH, 1.5, 1.5, "F");
  doc.setDrawColor(...SLATE_LINE);
  doc.setLineWidth(0.3);
  doc.roundedRect(boxX, boxY, boxW, boxH, 1.5, 1.5, "S");

  const rows: [string, string][] = [
    ["FOLIO", meta.folio ?? "—"],
    ["PERIODO", meta.periodo ?? "—"],
    ["GENERADO POR", meta.generadoPor ?? "—"],
  ];
  let ry = boxY + 6;
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...SLATE);
    doc.text(label, boxX + 4, ry);

    const labelWidth = doc.getTextWidth(label);
    const maxValueWidth = boxW - 8 - labelWidth - 3;
    const valueSize = fitBoldFontSize(doc, value, maxValueWidth, 8.5, 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(valueSize);
    doc.setTextColor(...NAVY);
    doc.text(truncateToWidth(doc, value, maxValueWidth), boxX + boxW - 4, ry, { align: "right" });

    ry += 6.5;
  }

  const dividerY = Math.max(topY + 4, boxY + boxH + 4);
  doc.setDrawColor(...SLATE_LINE);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, dividerY, pageWidth - MARGIN, dividerY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND);
  doc.text("REPORTE", MARGIN, dividerY + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text(meta.title, MARGIN, dividerY + 16);

  return dividerY + 24;
}

function drawFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const fecha = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...SLATE_LINE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, pageHeight - 16, pageWidth - MARGIN, pageHeight - 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    doc.text(`Ledgerly · Documento generado el ${fecha}`, MARGIN, pageHeight - 10);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - MARGIN, pageHeight - 10, {
      align: "right",
    });
  }
}

/** Starts a new letter-size PDF with the Ledgerly letterhead + invoice-style meta box. */
export function createLedgerlyDocument(meta: LedgerlyDocMeta) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const y = drawLetterheadAndMeta(doc, meta);
  return { doc, y };
}

export function addSectionTitle(doc: jsPDF, y: number, text: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(text.toUpperCase(), MARGIN, y);
  return y + 5;
}

/** A row of bordered summary tiles, like an invoice's subtotal/tax/total strip. */
export function addSummaryCards(
  doc: jsPDF,
  startY: number,
  items: { label: string; value: string }[]
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const gap = 4;
  const totalW = pageWidth - MARGIN * 2;
  const cardW = (totalW - gap * (items.length - 1)) / items.length;
  const cardH = 20;

  items.forEach((item, i) => {
    const x = MARGIN + i * (cardW + gap);
    doc.setFillColor(...SLATE_BG);
    doc.roundedRect(x, startY, cardW, cardH, 1.5, 1.5, "F");
    doc.setDrawColor(...SLATE_LINE);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, startY, cardW, cardH, 1.5, 1.5, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...SLATE);
    doc.text(item.label.toUpperCase(), x + 4, startY + 6.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(item.value, x + 4, startY + 15.5);
  });

  return startY + cardH + 8;
}

/** Bold, right-aligned total line with a rule above it — like an invoice's grand total. */
export function addTotalRow(doc: jsPDF, startY: number, label: string, value: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const lineX = pageWidth - MARGIN - 85;
  doc.setDrawColor(...SLATE_LINE);
  doc.setLineWidth(0.4);
  doc.line(lineX, startY, pageWidth - MARGIN, startY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...SLATE);
  doc.text(label, lineX, startY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text(value, pageWidth - MARGIN, startY + 7, { align: "right" });

  return startY + 15;
}

/** Two-column label/value block (for "Empresa: X", "Monto: $Y", etc.) */
export function addInfoRows(doc: jsPDF, startY: number, rows: [string, string][]): number {
  autoTable(doc, {
    startY,
    theme: "plain",
    styles: { fontSize: 9, textColor: NAVY, cellPadding: 1.1 },
    columnStyles: {
      0: { textColor: SLATE, cellWidth: 60 },
      1: { fontStyle: "bold" },
    },
    body: rows,
    margin: { left: MARGIN, right: MARGIN },
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
}

export function addTable(
  doc: jsPDF,
  startY: number,
  head: string[],
  body: (string | number)[][]
): number {
  autoTable(doc, {
    startY,
    head: [head],
    body,
    styles: { fontSize: 8.5, textColor: NAVY, cellPadding: 2.2 },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: SLATE_BG },
    margin: { left: MARGIN, right: MARGIN },
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
}

export function addParagraph(doc: jsPDF, startY: number, text: string): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  const pageWidth = doc.internal.pageSize.getWidth();
  const lines = doc.splitTextToSize(text, pageWidth - MARGIN * 2);
  doc.text(lines, MARGIN, startY);
  return startY + lines.length * 4.5 + 4;
}

export function finishAndDownload(doc: jsPDF, filename: string) {
  drawFooter(doc);
  doc.save(filename);
}
