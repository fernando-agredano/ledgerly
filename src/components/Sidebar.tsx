import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  FileText,
  Wallet,
  AlertCircle,
  BarChart3,
  BookOpenCheck,
  ShieldAlert,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { Logo } from "./Logo";
import { UserProfileModal } from "./UserProfileModal";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/solicitudes", label: "Solicitudes", icon: Inbox },
  { to: "/cartera", label: "Cartera", icon: Wallet },
  { to: "/cobranza", label: "Cobranza", icon: AlertCircle },
  { to: "/documentos", label: "Documentos", icon: FileText },
  { to: "/contabilidad", label: "Contabilidad", icon: BookOpenCheck },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
  { to: "/riesgo", label: "Riesgo", icon: ShieldAlert },
  { to: "/config", label: "Configuración", icon: Settings },
];

const STORAGE_KEY = "sidebar-collapsed";

// Shared row shape so the icon column lines up identically for the toggle,
// every nav link, and the user footer button — only the trailing label
// mounts/unmounts on collapse, the icon itself never shifts. Height is fixed
// (not padding-based) so a row's height can't change when its label's
// line-height disappears, which would otherwise nudge every row below it.
// Horizontal padding is left out here and set per-row instead, since each
// row sits inside a different wrapper (nav's own padding, or the footer's)
// and needs its own left inset to land its icon dead-center in the 76px
// collapsed rail without ever moving when the label mounts/unmounts.
const rowBase =
  "flex items-center gap-3 rounded-xl h-12 text-[15px] transition-colors duration-150";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useAuth();
  const { profile, updateProfile, uploadPhoto } = useProfile();

  const nombreMostrado = profile?.nombre ?? user?.email ?? "Cargando…";
  const rolMostrado = profile?.rol ?? "";

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "bg-slate-100 border-r border-slate-200 flex flex-col flex-shrink-0 transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[76px]" : "w-72"
      )}
    >
      <div className="h-16 flex items-center pl-6 pr-4 border-b border-slate-200 overflow-hidden">
        <Logo size="md" showText={!collapsed} />
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden scrollbar-thin">
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expandir menú" : "Contraer menú"}
          className={cn(rowBase, "w-full px-4 mb-3 text-slate-500 hover:bg-white hover:text-navy-900 hover:shadow-card")}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5 flex-shrink-0" />
          ) : (
            <PanelLeftClose className="h-5 w-5 flex-shrink-0" />
          )}
          {!collapsed && <span className="truncate whitespace-nowrap">Contraer menú</span>}
        </button>

        <div className="space-y-2 pt-2 border-t border-slate-200">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <NavLink
                key={it.to}
                to={it.to}
                title={collapsed ? it.label : undefined}
                className={({ isActive }) =>
                  cn(
                    rowBase,
                    "group relative px-4",
                    isActive
                      ? "bg-white text-navy-900 font-semibold shadow-card"
                      : "text-slate-600 hover:bg-white hover:text-navy-900"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-brand-500 transition-all duration-150",
                        isActive ? "h-6" : "h-0 group-hover:h-3"
                      )}
                    />
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span className="truncate whitespace-nowrap">{it.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          onClick={() => setProfileOpen(true)}
          className={cn(rowBase, "w-full pl-2 pr-3 hover:bg-white hover:shadow-card")}
          title={collapsed ? `${nombreMostrado} · ${rolMostrado}` : undefined}
        >
          <div className="h-9 w-9 flex-shrink-0 rounded-full border-2 border-slate-300 text-slate-700 flex items-center justify-center font-semibold text-sm overflow-hidden">
            {profile?.foto_url ? (
              <img src={profile.foto_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(nombreMostrado)
            )}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium text-navy-900 leading-tight truncate">
                  {nombreMostrado}
                </div>
                <div className="text-[11px] text-slate-500 leading-tight truncate">
                  {rolMostrado}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            </>
          )}
        </button>
      </div>

      <UserProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
        onUpdateProfile={updateProfile}
        onUploadPhoto={uploadPhoto}
      />
    </aside>
  );
}
