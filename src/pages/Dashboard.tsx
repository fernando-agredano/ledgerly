import { ReactNode, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Sector,
  Cell,
  BarChart,
  Bar,
  LabelList,
  AreaChart,
  Area,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ThemeProvider,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stack,
  Box,
  Button,
  Select,
  MenuItem,
  Popover,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Badge,
  Skeleton,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRounded from "@mui/icons-material/TrendingDownRounded";
import AccountBalanceWalletRounded from "@mui/icons-material/AccountBalanceWalletRounded";
import VerifiedRounded from "@mui/icons-material/VerifiedRounded";
import ReportProblemRounded from "@mui/icons-material/ReportProblemRounded";
import SavingsRounded from "@mui/icons-material/SavingsRounded";
import DonutLargeRounded from "@mui/icons-material/DonutLargeRounded";
import BarChartRounded from "@mui/icons-material/BarChartRounded";
import ShowChartRounded from "@mui/icons-material/ShowChartRounded";
import AccountBalanceRounded from "@mui/icons-material/AccountBalanceRounded";
import PaidRounded from "@mui/icons-material/PaidRounded";
import { muiTheme } from "@/lib/muiTheme";
import { formatCompactMXN, formatMXN } from "@/lib/format";
import { useFetch } from "@/hooks/useFetch";
import {
  fetchCarteraAging,
  fetchCapitalResumen,
  fetchCreditos,
  fetchDashboardKpis,
  fetchDistribucionEtapa,
} from "@/lib/api";

// Categorical palette validated with the dataviz skill's six-checks script
// (node scripts/validate_palette.js, surface #ffffff, --pairs all since the
// "Filtros" panel can reorder/remove slices so any two colors can end up
// adjacent). "Liquidado" is deliberately low-chroma — it's the de-emphasis
// slot for a closed/settled loan, not a series that needs to compete visually.
const ETAPAS = [
  { key: "en_evaluacion", label: "En evaluación", color: "#3d72f4" },
  { key: "aprobado", label: "Aprobado", color: "#10b981" },
  { key: "desembolsado", label: "Desembolsado", color: "#4a3aa7" },
  { key: "en_cobranza", label: "En cobranza", color: "#f59e0b" },
  { key: "liquidado", label: "Liquidado", color: "#94a3b8" },
] as const;

const RANGOS = ["0-30", "31-60", "61-90", "90+"];

const MONTH_INDEX: Record<string, number> = {
  Enero: 0,
  Febrero: 1,
  Marzo: 2,
  Abril: 3,
  Mayo: 4,
  Junio: 5,
  Julio: 6,
  Agosto: 7,
  Septiembre: 8,
  Octubre: 9,
  Noviembre: 10,
  Diciembre: 11,
};
const MONTH_NAMES = Object.keys(MONTH_INDEX);

// "Periodo" options: Febrero 2026 through the current month, newest first.
function buildPeriodos(): string[] {
  const now = new Date();
  let year = 2026;
  let month = 1; // Febrero
  const endYear = now.getFullYear();
  const endMonth = now.getMonth();

  const list: string[] = [];
  while (year < endYear || (year === endYear && month <= endMonth)) {
    list.push(`${MONTH_NAMES[month]} ${year}`);
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return list.reverse();
}

const PERIODOS = buildPeriodos();

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #dbe3ef",
  boxShadow: "0 10px 24px rgba(30, 58, 138, 0.10)",
  fontSize: 12,
};

function KpiCardMui({
  label,
  value,
  delta,
  deltaLabel,
  invertColor = false,
  icon,
  color,
}: {
  label: string;
  value: ReactNode;
  delta?: number;
  deltaLabel?: string;
  invertColor?: boolean;
  icon: ReactNode;
  color: string;
}) {
  const showDelta = typeof delta === "number";
  const positive = showDelta ? delta! >= 0 : false;
  const isGood = invertColor ? !positive : positive;
  const trendColor = isGood ? "success.main" : "error.main";

  return (
    <Card
      variant="outlined"
      sx={{
        position: "relative",
        minWidth: 0,
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: alpha(color, 0.28),
          boxShadow:
            "0 4px 6px rgba(15, 28, 51, 0.06), 0 14px 28px rgba(15, 28, 51, 0.10)",
        },
      }}
    >
      <Avatar
        variant="rounded"
        sx={{
          position: "absolute",
          top: 14,
          right: 14,
          bgcolor: alpha(color, 0.12),
          color,
          width: 44,
          height: 44,
          border: `1px solid ${alpha(color, 0.12)}`,
          boxShadow: `inset 0 1px 0 ${alpha("#ffffff", 0.72)}`,
          "& .MuiSvgIcon-root": { fontSize: 23 },
        }}
      >
        {icon}
      </Avatar>

      <CardContent
        sx={{
          p: 2.5,
          minHeight: 168,
          display: "flex",
          flexDirection: "column",
          "&:last-child": { pb: 2.5 },
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{
            display: "block",
            pr: 7.5,
            letterSpacing: 1.1,
            lineHeight: 1.25,
            fontWeight: 700,
            textWrap: "balance",
          }}
        >
          {label}
        </Typography>

        <Typography
          component="div"
          sx={{
            mt: 1.5,
            fontWeight: 800,
            color: "text.primary",
            fontSize: { xs: "1.55rem", sm: "1.7rem", xl: "1.8rem" },
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </Typography>

        {showDelta && (
          <Chip
            size="small"
            icon={
              positive ? (
                <TrendingUpRounded sx={{ fontSize: 16 }} />
              ) : (
                <TrendingDownRounded sx={{ fontSize: 16 }} />
              )
            }
            label={
              <>
                {positive ? "+" : ""}
                {delta!.toFixed(2)}%{" "}
                {deltaLabel && (
                  <Box component="span" sx={{ opacity: 0.75, fontWeight: 400 }}>
                    {deltaLabel}
                  </Box>
                )}
              </>
            }
            sx={{
              mt: "auto",
              alignSelf: "flex-start",
              height: 24,
              bgcolor: alpha(isGood ? "#10b981" : "#e34948", 0.12),
              color: trendColor,
              fontWeight: 600,
              borderRadius: 1.5,
              "& .MuiChip-icon": { color: "inherit", ml: "6px" },
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Custom "lifted" active slice: pops outward a few px with a clean white
// ring, instead of Recharts' bare default or an opacity-dimmed rest-of-chart.
function ActiveSlice(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 4}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="#fff"
      strokeWidth={2}
    />
  );
}

export default function Dashboard() {
  const kpis = useFetch(fetchDashboardKpis);
  const dist = useFetch(fetchDistribucionEtapa);
  const aging = useFetch(fetchCarteraAging);
  const capital = useFetch(fetchCapitalResumen);
  const creditos = useFetch(fetchCreditos);

  const [periodo, setPeriodo] = useState(() =>
    PERIODOS.includes("Mayo 2026") ? "Mayo 2026" : PERIODOS[0]
  );

  const [etapasActivas, setEtapasActivas] = useState<Set<string>>(
    () => new Set(ETAPAS.map((e) => e.key))
  );
  const [rangosActivos, setRangosActivos] = useState<Set<string>>(
    () => new Set(RANGOS)
  );
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [activeSlice, setActiveSlice] = useState<number | null>(null);

  const activeFilterCount =
    (ETAPAS.length - etapasActivas.size) + (RANGOS.length - rangosActivos.size);

  function toggleEtapa(key: string) {
    setEtapasActivas((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleRango(rango: string) {
    setRangosActivos((prev) => {
      const next = new Set(prev);
      next.has(rango) ? next.delete(rango) : next.add(rango);
      return next;
    });
  }

  function resetFiltros() {
    setEtapasActivas(new Set(ETAPAS.map((e) => e.key)));
    setRangosActivos(new Set(RANGOS));
  }

  const pieData = useMemo(() => {
    if (!dist.data) return [];
    return ETAPAS.filter((e) => etapasActivas.has(e.key))
      .map((e) => ({
        name: e.label,
        value: (dist.data as unknown as Record<string, number>)[e.key] ?? 0,
        color: e.color,
      }))
      .filter((d) => d.value > 0);
  }, [dist.data, etapasActivas]);

  const pieTotal = useMemo(
    () => pieData.reduce((sum, d) => sum + d.value, 0),
    [pieData]
  );

  const barData = useMemo(() => {
    if (!aging.data) return [];
    return aging.data.filter((d) => rangosActivos.has(d.rango));
  }, [aging.data, rangosActivos]);

  const trendData = useMemo(() => {
    if (!creditos.data) return [];
    const [monthName, yearText] = periodo.split(" ");
    const endMonth = MONTH_INDEX[monthName] ?? 0;
    const endYear = Number(yearText);

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(endYear, endMonth - (5 - index), 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const rows = creditos.data!.filter((credito) => {
        const start = new Date(`${credito.fecha_inicio}T00:00:00`);
        return start.getFullYear() === year && start.getMonth() === month;
      });

      return {
        mes: new Intl.DateTimeFormat("es-MX", { month: "short" })
          .format(date)
          .replace(".", ""),
        originado: rows.reduce((sum, credito) => sum + credito.monto_original, 0),
        operaciones: rows.length,
      };
    });
  }, [creditos.data, periodo]);

  const capitalData = useMemo(() => {
    if (!capital.data) return [];
    return [
      { concepto: "Activos productivos", valor: capital.data.activos_productivos },
      { concepto: "Cartera vigente", valor: capital.data.cartera_vigente },
      { concepto: "Capital distribuido", valor: capital.data.capital_distribuido },
      { concepto: "Cartera vencida", valor: capital.data.cartera_vencida },
    ];
  }, [capital.data]);

  const financialPositionData = useMemo(() => {
    if (!kpis.data) return [];
    return [
      { concepto: "Caja", valor: kpis.data.efectivo_total, fill: "#3d72f4" },
      { concepto: "Deuda", valor: kpis.data.deuda_total, fill: "#94a3b8" },
    ];
  }, [kpis.data]);

  const liquidityCoverage = kpis.data?.deuda_total
    ? (kpis.data.efectivo_total / kpis.data.deuda_total) * 100
    : 0;
  const vigenteShare = kpis.data
    ? (kpis.data.cartera_vigente / Math.max(kpis.data.cartera_total, 1)) * 100
    : 0;

  return (
    <ThemeProvider theme={muiTheme}>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">
              Dashboard ejecutivo
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Resumen institucional de cartera, originación y desempeño financiero.
            </p>
          </div>

          <div className="flex items-center flex-wrap" style={{ gap: 24 }}>
            <Badge
              badgeContent={activeFilterCount}
              color="primary"
              invisible={activeFilterCount === 0}
            >
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<TuneOutlined fontSize="small" />}
                onClick={(e) => setFilterAnchor(e.currentTarget)}
                sx={{ borderColor: "divider", height: 40 }}
              >
                Filtros
              </Button>
            </Badge>

            <Popover
              open={Boolean(filterAnchor)}
              anchorEl={filterAnchor}
              onClose={() => setFilterAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <Box sx={{ p: 2.5, width: 280 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Etapas del crédito
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Controla qué etapas se muestran en la distribución.
                </Typography>
                <FormGroup sx={{ mt: 0.5 }}>
                  {ETAPAS.map((e) => (
                    <FormControlLabel
                      key={e.key}
                      control={
                        <Checkbox
                          size="small"
                          checked={etapasActivas.has(e.key)}
                          onChange={() => toggleEtapa(e.key)}
                          sx={{ color: e.color, "&.Mui-checked": { color: e.color } }}
                        />
                      }
                      label={<Typography variant="body2">{e.label}</Typography>}
                    />
                  ))}
                </FormGroup>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Aging (días de atraso)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Controla qué rangos se muestran en la cartera vencida.
                </Typography>
                <FormGroup row sx={{ mt: 0.5 }}>
                  {RANGOS.map((r) => (
                    <FormControlLabel
                      key={r}
                      control={
                        <Checkbox
                          size="small"
                          checked={rangosActivos.has(r)}
                          onChange={() => toggleRango(r)}
                        />
                      }
                      label={<Typography variant="body2">{r}</Typography>}
                    />
                  ))}
                </FormGroup>

                <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 1 }}>
                  <Button size="small" onClick={resetFiltros}>
                    Restablecer
                  </Button>
                </Stack>
              </Box>
            </Popover>
          </div>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.loading || !kpis.data ? (
            <>
              <Skeleton variant="rounded" height={128} />
              <Skeleton variant="rounded" height={128} />
              <Skeleton variant="rounded" height={128} />
              <Skeleton variant="rounded" height={128} />
            </>
          ) : (
            <>
              <KpiCardMui
                label="Cartera total"
                value={formatMXN(kpis.data.cartera_total)}
                delta={8.6}
                deltaLabel="vs Abr 2026"
                icon={<AccountBalanceWalletRounded />}
                color="#3d72f4"
              />
              <KpiCardMui
                label="Cartera vigente"
                value={formatMXN(kpis.data.cartera_vigente)}
                delta={7.2}
                deltaLabel="vs Abr 2026"
                icon={<VerifiedRounded />}
                color="#10b981"
              />
              <KpiCardMui
                label="Índice de morosidad (90+)"
                value={`${kpis.data.ipm_pct.toFixed(2)}%`}
                delta={-0.45}
                deltaLabel="vs Abr 2026"
                invertColor
                icon={<ReportProblemRounded />}
                color="#f59e0b"
              />
              <KpiCardMui
                label="Caja institucional"
                value={formatMXN(kpis.data.efectivo_total)}
                delta={2.1}
                deltaLabel="vs Abr 2026"
                icon={<SavingsRounded />}
                color="#4a3aa7"
              />
            </>
          )}
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <Card
            variant="outlined"
            className="xl:col-span-5"
            sx={{
              transition: "box-shadow 0.18s ease",
              "&:hover": {
                boxShadow:
                  "0 4px 6px rgba(15, 28, 51, 0.06), 0 14px 28px rgba(15, 28, 51, 0.10)",
              },
            }}
          >
            <CardHeader
              avatar={
                <Avatar
                  variant="rounded"
                  sx={{ bgcolor: alpha("#3d72f4", 0.12), color: "#3d72f4", width: 36, height: 36 }}
                >
                  <DonutLargeRounded fontSize="small" />
                </Avatar>
              }
              title={
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Distribución por etapa del crédito
                </Typography>
              }
              subheader={
                <Typography variant="caption" color="text.secondary">
                  Número de solicitudes por etapa actual
                </Typography>
              }
            />
            <CardContent>
              <div className="h-72 relative">
                {dist.loading ? (
                  <Stack sx={{ alignItems: "center", justifyContent: "center", height: "100%", gap: 1.5 }}>
                    <CircularProgress size={28} />
                    <Typography variant="body2" color="text.secondary">
                      Cargando datos…
                    </Typography>
                  </Stack>
                ) : dist.error ? (
                  <Alert
                    severity="error"
                    action={
                      <Button color="inherit" size="small" onClick={dist.refetch}>
                        Reintentar
                      </Button>
                    }
                  >
                    {dist.error}
                  </Alert>
                ) : pieData.length === 0 ? (
                  <Stack sx={{ alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay etapas seleccionadas en los filtros.
                    </Typography>
                  </Stack>
                ) : (
                  <div className="flex items-center w-full gap-4">
                    {/* Box sized to hug the ring itself (not the full row
                        height) so the chart sits flush against the card's
                        left padding instead of floating inside extra
                        invisible space. cx/cy="50%" is exactly this box's
                        own center, so the overlay below (also inset-0 +
                        centered) can never drift from it. */}
                    <div className="relative w-56 h-56 flex-shrink-0">
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none text-center">
                        <span className="text-3xl font-extrabold leading-none tracking-tight text-navy-900">{pieTotal}</span>
                        <span className="mt-1.5 text-sm leading-tight text-slate-500">solicitudes</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={76}
                            outerRadius={110}
                            paddingAngle={3}
                            activeIndex={activeSlice ?? undefined}
                            activeShape={ActiveSlice}
                            onMouseEnter={(_, i) => setActiveSlice(i)}
                            onMouseLeave={() => setActiveSlice(null)}
                          >
                            {pieData.map((d) => (
                              <Cell key={d.name} fill={d.color} stroke="#fff" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v: number, n: string) => [`${v}`, n]}
                            contentStyle={tooltipStyle}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-4">
                      {pieData.map((d) => (
                        <div key={d.name} className="flex items-center w-full gap-3">
                          <span
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: d.color }}
                          />
                          <span className="text-sm text-slate-700 truncate">{d.name}</span>
                          <span className="text-sm text-slate-400 ml-auto pl-2 text-right">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card
            variant="outlined"
            className="xl:col-span-7"
            sx={{
              transition: "box-shadow 0.18s ease",
              "&:hover": {
                boxShadow:
                  "0 4px 6px rgba(15, 28, 51, 0.06), 0 14px 28px rgba(15, 28, 51, 0.10)",
              },
            }}
          >
            <CardHeader
              avatar={
                <Avatar
                  variant="rounded"
                  sx={{ bgcolor: alpha("#3d72f4", 0.12), color: "#3d72f4", width: 36, height: 36 }}
                >
                  <BarChartRounded fontSize="small" />
                </Avatar>
              }
              title={
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Cartera por aging (días de atraso)
                </Typography>
              }
              subheader={
                <Typography variant="caption" color="text.secondary">
                  Saldo vencido por rango de días de atraso
                </Typography>
              }
            />
            <CardContent>
              <div className="h-72">
                {aging.loading ? (
                  <Stack sx={{ alignItems: "center", justifyContent: "center", height: "100%", gap: 1.5 }}>
                    <CircularProgress size={28} />
                    <Typography variant="body2" color="text.secondary">
                      Cargando datos…
                    </Typography>
                  </Stack>
                ) : aging.error ? (
                  <Alert
                    severity="error"
                    action={
                      <Button color="inherit" size="small" onClick={aging.refetch}>
                        Reintentar
                      </Button>
                    }
                  >
                    {aging.error}
                  </Alert>
                ) : barData.length === 0 ? (
                  <Stack sx={{ alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <Typography variant="body2" color="text.secondary">
                      No hay rangos seleccionados en los filtros.
                    </Typography>
                  </Stack>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} barCategoryGap={32} margin={{ top: 24 }}>
                      <CartesianGrid vertical={false} stroke="#e8edf5" strokeDasharray="4 4" />
                      <XAxis
                        dataKey="rango"
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        stroke="#64748b"
                      />
                      <YAxis
                        tickFormatter={formatCompactMXN}
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                        stroke="#64748b"
                      />
                      <Tooltip
                        cursor={false}
                        formatter={(v: number) => [formatMXN(v), "Saldo vencido"]}
                        labelFormatter={(label) => `Rango ${label} días`}
                        contentStyle={tooltipStyle}
                      />
                      <Bar
                        dataKey="valor"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={56}
                        activeBar={false}
                      >
                        {barData.map((entry) => (
                          <Cell
                            key={entry.rango}
                            fill={entry.rango === "90+" ? "#e96a5f" : entry.rango === "61-90" ? "#f59e0b" : entry.rango === "31-60" ? "#6b91ef" : "#3d72f4"}
                          />
                        ))}
                        <LabelList
                          dataKey="valor"
                          position="top"
                          formatter={formatCompactMXN}
                          style={{ fill: "#0f1c33", fontSize: 12, fontWeight: 600 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Portfolio narrative: evolution and present financial position */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <Card
            variant="outlined"
            className="xl:col-span-8"
            sx={{ overflow: "hidden" }}
          >
            <CardHeader
              avatar={
                <Avatar
                  variant="rounded"
                  sx={{ bgcolor: alpha("#3d72f4", 0.12), color: "#3d72f4", width: 36, height: 36 }}
                >
                  <ShowChartRounded fontSize="small" />
                </Avatar>
              }
              title={
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Originación reciente
                </Typography>
              }
              subheader={
                <Typography variant="caption" color="text.secondary">
                  Monto colocado y número de operaciones por mes
                </Typography>
              }
              action={
                <div className="flex items-center" style={{ marginTop: 6, marginRight: 12 }}>
                  {/* This is the only card whose data is actually derived per-period
                      (grouped from real créditos by fecha_inicio) — every other KPI/chart
                      on this dashboard is a live current-state snapshot from Supabase views
                      with no date parameter, so the selector lives here rather than in the
                      global header where it would imply a scope it can't honor. */}
                  <Select
                    size="small"
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    sx={{ minWidth: 190, height: 36, mr: 3, bgcolor: "background.paper" }}
                    renderValue={(v) => (
                      <span style={{ display: "flex", alignItems: "center", fontSize: "0.8125rem" }}>
                        <CalendarMonthOutlined fontSize="small" style={{ marginRight: 8 }} />
                        <span>Periodo: {v as string}</span>
                      </span>
                    )}
                  >
                    {PERIODOS.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </Select>

                  <div className="hidden sm:flex items-center">
                  <div className="flex items-center" style={{ marginRight: 24 }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#3d72f4",
                        marginRight: 8,
                      }}
                    />
                    <span className="text-xs leading-none text-slate-500">Monto originado</span>
                  </div>
                  <div className="flex items-center">
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#10b981",
                        marginRight: 8,
                      }}
                    />
                    <span className="text-xs leading-none text-slate-500">Operaciones</span>
                  </div>
                  </div>
                </div>
              }
            />
            <CardContent sx={{ pt: 1 }}>
              <div className="h-[270px]">
                {creditos.loading ? (
                  <Skeleton variant="rounded" height="100%" />
                ) : creditos.error ? (
                  <Alert
                    severity="error"
                    action={<Button color="inherit" size="small" onClick={creditos.refetch}>Reintentar</Button>}
                  >
                    {creditos.error}
                  </Alert>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 14, right: 12, left: 2, bottom: 0 }}>
                      <defs>
                        <linearGradient id="carteraFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3d72f4" stopOpacity={0.22} />
                          <stop offset="100%" stopColor="#3d72f4" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#e8edf5" strokeDasharray="4 4" />
                      <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} stroke="#64748b" />
                      <YAxis
                        yAxisId="amount"
                        tickFormatter={formatCompactMXN}
                        tickLine={false}
                        axisLine={false}
                        width={54}
                        fontSize={12}
                        stroke="#64748b"
                      />
                      <YAxis yAxisId="count" orientation="right" hide allowDecimals={false} />
                      <Tooltip
                        formatter={(value: number, name: string) => [name === "originado" ? formatMXN(value) : value, name === "originado" ? "Monto originado" : "Operaciones"]}
                        contentStyle={tooltipStyle}
                      />
                      <Area
                        yAxisId="amount"
                        type="monotone"
                        dataKey="originado"
                        stroke="#3d72f4"
                        strokeWidth={2.5}
                        fill="url(#carteraFill)"
                        activeDot={{ r: 5, strokeWidth: 3, stroke: "#fff" }}
                      />
                      <Line
                        yAxisId="count"
                        type="monotone"
                        dataKey="operaciones"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 5, strokeWidth: 3, stroke: "#fff" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card variant="outlined" className="xl:col-span-4">
            <CardHeader
              avatar={
                <Avatar
                  variant="rounded"
                  sx={{ bgcolor: alpha("#4a3aa7", 0.11), color: "#4a3aa7", width: 36, height: 36 }}
                >
                  <AccountBalanceRounded fontSize="small" />
                </Avatar>
              }
              title={<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Posición financiera</Typography>}
              subheader={<Typography variant="caption" color="text.secondary">Caja disponible frente a deuda institucional</Typography>}
            />
            <CardContent sx={{ pt: 1 }}>
              <div className="h-[178px]">
                {kpis.loading || !kpis.data ? (
                  <Skeleton variant="rounded" height="100%" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialPositionData} margin={{ top: 26, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#edf1f7" />
                      <XAxis dataKey="concepto" tickLine={false} axisLine={false} fontSize={12} stroke="#64748b" />
                      <YAxis hide />
                      <Tooltip formatter={(value: number) => formatMXN(value)} contentStyle={tooltipStyle} cursor={{ fill: "#f7f9fc" }} />
                      <Bar dataKey="valor" radius={[7, 7, 2, 2]} maxBarSize={64}>
                        {financialPositionData.map((item) => <Cell key={item.concepto} fill={item.fill} />)}
                        <LabelList dataKey="valor" position="top" formatter={formatCompactMXN} style={{ fill: "#0f1c33", fontSize: 12, fontWeight: 700 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <Box
                sx={{
                  mt: 1,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 2,
                  bgcolor: alpha(liquidityCoverage >= 100 ? "#10b981" : "#f59e0b", 0.09),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Typography variant="caption" color="text.secondary">Cobertura de deuda con caja</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                  {liquidityCoverage.toFixed(1)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-12 gap-4 pb-2">
          <Card variant="outlined" className="xl:col-span-8">
            <CardHeader
              avatar={
                <Avatar
                  variant="rounded"
                  sx={{ bgcolor: alpha("#10b981", 0.11), color: "#0f9f72", width: 36, height: 36 }}
                >
                  <PaidRounded fontSize="small" />
                </Avatar>
              }
              title={<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Composición del capital</Typography>}
              subheader={<Typography variant="caption" color="text.secondary">Distribución de los principales componentes financieros</Typography>}
            />
            <CardContent sx={{ pt: 1 }}>
              <div className="h-[250px]">
                {capital.loading ? (
                  <Skeleton variant="rounded" height="100%" />
                ) : capital.error ? (
                  <Alert
                    severity="error"
                    action={<Button color="inherit" size="small" onClick={capital.refetch}>Reintentar</Button>}
                  >
                    {capital.error}
                  </Alert>
                ) : capitalData.length === 0 ? (
                  <Stack sx={{ alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <Typography variant="body2" color="text.secondary">No hay información de capital disponible.</Typography>
                  </Stack>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={capitalData} layout="vertical" margin={{ top: 8, right: 72, left: 22, bottom: 4 }}>
                      <CartesianGrid horizontal={false} stroke="#e8edf5" strokeDasharray="4 4" />
                      <XAxis type="number" tickFormatter={formatCompactMXN} tickLine={false} axisLine={false} fontSize={12} stroke="#64748b" />
                      <YAxis type="category" dataKey="concepto" tickLine={false} axisLine={false} width={124} fontSize={12} stroke="#475569" />
                      <Tooltip formatter={(value: number) => formatMXN(value)} contentStyle={tooltipStyle} cursor={{ fill: "#f7f9fc" }} />
                      <Bar dataKey="valor" fill="#3d72f4" radius={[0, 7, 7, 0]} maxBarSize={24}>
                        {capitalData.map((item) => (
                          <Cell key={item.concepto} fill={item.concepto === "Cartera vencida" ? "#f59e0b" : item.concepto === "Cartera vigente" ? "#10b981" : "#3d72f4"} />
                        ))}
                        <LabelList dataKey="valor" position="right" formatter={formatCompactMXN} style={{ fill: "#0f1c33", fontSize: 12, fontWeight: 700 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card
            variant="outlined"
            className="xl:col-span-4"
            sx={{
              background: "linear-gradient(145deg, #f7f9fd 0%, #eef3fb 100%)",
              position: "relative",
              overflow: "hidden",
              "&::after": {
                content: '\"\"',
                position: "absolute",
                width: 180,
                height: 180,
                borderRadius: "50%",
                right: -70,
                bottom: -90,
                bgcolor: alpha("#6092f9", 0.12),
              },
            }}
          >
            <CardContent sx={{ p: 3, position: "relative", zIndex: 1 }}>
              <Typography variant="overline" sx={{ color: "#567099", letterSpacing: 1.2 }}>
                Lectura del periodo
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, maxWidth: 280, lineHeight: 1.35 }}>
                {vigenteShare >= 80 ? "La cartera conserva una base vigente sólida" : "La cartera requiere atención preventiva"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.65 }}>
                La prioridad operativa permanece en los saldos con más de 90 días y en sostener la cobertura de deuda con caja.
              </Typography>

              <Divider sx={{ my: 2.5, borderColor: alpha("#476299", 0.14) }} />

              <Stack sx={{ gap: 2 }}>
                <Box>
                  <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.75 }}>
                    <Typography variant="caption" color="text.secondary">Cartera vigente</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {kpis.data ? `${vigenteShare.toFixed(1)}%` : "—"}
                    </Typography>
                  </Stack>
                  <Box sx={{ height: 6, borderRadius: 3, bgcolor: alpha("#476299", 0.12), overflow: "hidden" }}>
                    <Box sx={{ height: "100%", width: kpis.data ? `${Math.min(vigenteShare, 100)}%` : 0, borderRadius: 3, bgcolor: "#10b981" }} />
                  </Box>
                </Box>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Créditos activos</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{kpis.data?.total_creditos ?? "—"}</Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary">En jurídico</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#b76a00", fontVariantNumeric: "tabular-nums" }}>{kpis.data?.creditos_juridico ?? "—"}</Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </section>
      </div>
    </ThemeProvider>
  );
}
