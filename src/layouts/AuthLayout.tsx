import { Outlet } from "react-router-dom";
import { Logo } from "@/components/Logo";

export default function AuthLayout() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-white relative overflow-hidden p-6"
      style={{
        backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1.5px)",
        backgroundSize: "26px 26px",
      }}
    >
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-brand-500 blur-3xl opacity-10 pointer-events-none" />

      <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-300/40 p-8 sm:p-10">
        <div className="flex items-center justify-center mb-8">
          <Logo size="lg" />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
