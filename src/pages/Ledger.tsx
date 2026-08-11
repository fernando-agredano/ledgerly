import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { ErrorBlock, LoadingBlock } from "@/components/ui/States";
import { useFetch } from "@/hooks/useFetch";
import {
  fetchAsientos,
  fetchCapitalResumen,
  fetchLibroMayor,
} from "@/lib/api";
import { formatDate, formatMXN } from "@/lib/format";

export default function Ledger() {
  const [tab, setTab] = useState("resumen");
  const asientos = useFetch(fetchAsientos);
  const capital = useFetch(fetchCapitalResumen);
  const libroMayor = useFetch(fetchLibroMayor);

  const totalDebe = (asientos.data ?? []).reduce((a, x) => a + Number(x.debe), 0);
  const totalHaber = (asientos.data ?? []).reduce((a, x) => a + Number(x.haber), 0);
  const cuadra = Math.abs(totalDebe - totalHaber) < 0.01;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-navy-900">
          Contabilidad / Ledger
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Registro contable institucional · Doble partida · Ledger inmutable.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Activos productivos"
          value={capital.data ? formatMXN(capital.data.activos_productivos) : "—"}
        />
        <Stat
          label="Cartera vigente"
          value={capital.data ? formatMXN(capital.data.cartera_vigente) : "—"}
        />
        <Stat
          label="Capital invertido"
          value={
            capital.data ? formatMXN(capital.data.capital_invertido_operacion) : "—"
          }
        />
        <Stat
          label="Capital distribuido"
          value={capital.data ? formatMXN(capital.data.capital_distribuido) : "—"}
        />
      </section>

      <Card>
        <div className="px-6 pt-2">
          <Tabs
            items={[
              { id: "resumen", label: "Resumen" },
              { id: "asientos", label: "Asientos" },
              { id: "mayor", label: "Libro mayor" },
              { id: "spei", label: "Conciliación SPEI" },
            ]}
            active={tab}
            onChange={setTab}
            className="border-b-0"
          />
        </div>

        <div className="border-t border-slate-100 p-6">
          {tab === "resumen" && (
            <ResumenTab cuadra={cuadra} totalDebe={totalDebe} totalHaber={totalHaber} />
          )}
          {tab === "asientos" && (
            <AsientosTab
              loading={asientos.loading}
              error={asientos.error}
              data={asientos.data ?? []}
              onRetry={asientos.refetch}
            />
          )}
          {tab === "mayor" && (
            <LibroMayorTab
              loading={libroMayor.loading}
              error={libroMayor.error}
              data={libroMayor.data ?? []}
              onRetry={libroMayor.refetch}
            />
          )}
          {tab === "spei" && <SpeiTab />}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-semibold text-navy-900 mt-2 tabular-nums">{value}</p>
    </div>
  );
}

function ResumenTab({
  cuadra,
  totalDebe,
  totalHaber,
}: {
  cuadra: boolean;
  totalDebe: number;
  totalHaber: number;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-none border-slate-200">
        <CardHeader>
          <CardTitle>Cuadre del libro mayor</CardTitle>
          <Badge tone={cuadra ? "green" : "red"} dot>
            {cuadra ? "Cuadra" : "Descuadre"}
          </Badge>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Total debe</span>
            <span className="font-medium tabular-nums">{formatMXN(totalDebe)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Total haber</span>
            <span className="font-medium tabular-nums">{formatMXN(totalHaber)}</span>
          </div>
          <div className="flex justify-between py-2 font-semibold">
            <span>Diferencia</span>
            <span className="tabular-nums">{formatMXN(Math.abs(totalDebe - totalHaber))}</span>
          </div>
        </CardBody>
      </Card>

      <Card className="shadow-none border-slate-200">
        <CardHeader>
          <CardTitle>Principios institucionales</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="space-y-1.5 text-sm">
            <li className="text-navy-800">✓ Doble partida obligatoria</li>
            <li className="text-navy-800">✓ Ledger inmutable (sin DELETE en producción)</li>
            <li className="text-navy-800">✓ Provisiones automáticas por bucket</li>
            <li className="text-navy-800">✓ Conciliación SPEI ↔ subledger ↔ banco</li>
            <li className="text-navy-800">✓ Trazabilidad por evento (dispersión, cobro, mora)</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function AsientosTab({
  loading,
  error,
  data,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  data: { id: string; fecha: string; descripcion: string; cuenta_codigo: string; debe: number; haber: number }[];
  onRetry: () => void;
}) {
  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={onRetry} />;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy-900">
          Últimos asientos contables
        </h3>
        <span className="text-xs text-slate-500">{data.length} asientos</span>
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Fecha</TH>
              <TH>Descripción</TH>
              <TH>Cuenta</TH>
              <TH className="text-right">Debe</TH>
              <TH className="text-right">Haber</TH>
            </TR>
          </THead>
          <TBody>
            {data.map((a) => (
              <TR key={a.id}>
                <TD className="text-slate-600 text-xs">{formatDate(a.fecha)}</TD>
                <TD className="font-medium">{a.descripcion}</TD>
                <TD className="text-slate-700 text-xs font-mono">{a.cuenta_codigo}</TD>
                <TD className="text-right tabular-nums">
                  {Number(a.debe) > 0 ? formatMXN(Number(a.debe)) : "—"}
                </TD>
                <TD className="text-right tabular-nums">
                  {Number(a.haber) > 0 ? formatMXN(Number(a.haber)) : "—"}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}

function LibroMayorTab({
  loading,
  error,
  data,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  data: {
    cuenta_codigo: string;
    cuenta_nombre: string;
    total_debe: number;
    total_haber: number;
    saldo_deudor: number;
  }[];
  onRetry: () => void;
}) {
  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} onRetry={onRetry} />;
  return (
    <div>
      <h3 className="text-sm font-semibold text-navy-900 mb-3">
        Saldos por cuenta contable
      </h3>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Cuenta</TH>
              <TH>Nombre</TH>
              <TH className="text-right">Debe</TH>
              <TH className="text-right">Haber</TH>
              <TH className="text-right">Saldo</TH>
            </TR>
          </THead>
          <TBody>
            {data.map((r) => (
              <TR key={r.cuenta_codigo}>
                <TD className="font-mono text-xs">{r.cuenta_codigo}</TD>
                <TD className="font-medium">{r.cuenta_nombre}</TD>
                <TD className="text-right tabular-nums">{formatMXN(Number(r.total_debe))}</TD>
                <TD className="text-right tabular-nums">{formatMXN(Number(r.total_haber))}</TD>
                <TD className="text-right tabular-nums font-semibold">
                  {formatMXN(Number(r.saldo_deudor))}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}

function SpeiTab() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-navy-900 mb-3">
        Conciliación SPEI · {formatDate(new Date())}
      </h3>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>CEP / Folio</TH>
              <TH>Concepto</TH>
              <TH className="text-right">Importe</TH>
              <TH>Estatus</TH>
            </TR>
          </THead>
          <TBody>
            {[
              { f: "MBAN01700412345678123456", c: "Dispersión Vitalcore", v: 5_000_000, s: "Conciliado" },
              { f: "MBAN01700412345678123457", c: "Cobro Vitalcore mensual", v: 116_000, s: "Conciliado" },
              { f: "MBAN01700412345678123458", c: "Cobro Altira Capital intereses", v: 113_100, s: "Conciliado" },
              { f: "MBAN01700412345678123459", c: "Cobro Vega del Bosque arrendamiento", v: 3_246_534, s: "En revisión" },
            ].map((x) => (
              <TR key={x.f}>
                <TD className="font-mono text-xs text-slate-600">{x.f}</TD>
                <TD>{x.c}</TD>
                <TD className="text-right tabular-nums">{formatMXN(x.v)}</TD>
                <TD>
                  <Badge tone={x.s === "Conciliado" ? "green" : "yellow"} dot>
                    {x.s}
                  </Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
