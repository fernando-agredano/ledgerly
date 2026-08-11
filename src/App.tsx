import { ReactElement } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Solicitudes from "./pages/Solicitudes";
import Expediente from "./pages/Expediente";
import Comite from "./pages/Comite";
import Dispersion from "./pages/Dispersion";
import Credito from "./pages/Credito";
import Cobranza from "./pages/Cobranza";
import Ledger from "./pages/Ledger";
import Documentos from "./pages/Documentos";
import Reportes from "./pages/Reportes";
import Riesgo from "./pages/Riesgo";
import Configuracion from "./pages/Configuracion";
import { useAuth } from "./hooks/useAuth";
import { LoadingBlock } from "./components/ui/States";

function FullScreenLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <LoadingBlock label="Cargando…" />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactElement }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoading />;
  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

function RedirectIfAuthed({ children }: { children: ReactElement }) {
  const { session, loading } = useAuth();

  if (loading) return <FullScreenLoading />;
  if (session) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <RedirectIfAuthed>
              <Login />
            </RedirectIfAuthed>
          }
        />
      </Route>

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/solicitudes" element={<Solicitudes />} />
        <Route path="/solicitudes/:id" element={<Expediente />} />
        <Route path="/comite/:id" element={<Comite />} />
        <Route path="/dispersion/:id" element={<Dispersion />} />
        <Route path="/cartera" element={<Credito />} />
        <Route path="/cartera/:id" element={<Credito />} />
        <Route path="/cobranza" element={<Cobranza />} />
        <Route path="/documentos" element={<Documentos />} />
        <Route path="/contabilidad" element={<Ledger />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/riesgo" element={<Riesgo />} />
        <Route path="/config" element={<Configuracion />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
