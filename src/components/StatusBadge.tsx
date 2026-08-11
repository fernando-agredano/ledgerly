import { Badge } from "./ui/Badge";

const map: Record<string, { tone: "neutral" | "blue" | "green" | "yellow" | "red" | "navy" | "violet"; label: string }> = {
  "En evaluación": { tone: "blue", label: "En evaluación" },
  "En análisis": { tone: "violet", label: "En análisis" },
  "Pendiente docs": { tone: "yellow", label: "Pendiente docs" },
  Aprobado: { tone: "green", label: "Aprobado" },
  Rechazado: { tone: "red", label: "Rechazado" },
  Comité: { tone: "navy", label: "Comité" },
  Dispersado: { tone: "green", label: "Dispersado" },
  Vigente: { tone: "green", label: "Vigente" },
  Mora: { tone: "yellow", label: "Mora" },
  Jurídico: { tone: "red", label: "Jurídico" },
  Liquidado: { tone: "neutral", label: "Liquidado" },
  Válido: { tone: "green", label: "Válido" },
  Válida: { tone: "green", label: "Válida" },
  Pendiente: { tone: "yellow", label: "Pendiente" },
  Vencido: { tone: "red", label: "Vencido" },
};

export function StatusBadge({ value }: { value: string }) {
  const item = map[value] ?? { tone: "neutral" as const, label: value };
  return <Badge tone={item.tone} dot>{item.label}</Badge>;
}
