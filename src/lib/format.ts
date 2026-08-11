const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

const intFormatter = new Intl.NumberFormat("es-MX");

export const formatMXN = (n: number) => mxn.format(n);
export const formatInt = (n: number) => intFormatter.format(n);
export const formatPercent = (n: number, decimals = 2) =>
  `${n.toFixed(decimals)}%`;

/** Notación compacta para ejes/etiquetas de gráficas: $1.2M, $850K, $500. */
export function formatCompactMXN(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return formatMXN(value);
}

export function formatDate(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
