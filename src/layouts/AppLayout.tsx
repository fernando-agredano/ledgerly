import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="px-8 py-6 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
