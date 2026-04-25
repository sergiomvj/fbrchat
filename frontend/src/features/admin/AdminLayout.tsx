import { Outlet } from "react-router-dom";
import { SearchField } from "../../components/shell/SearchField";
import { BottomNavBar } from "../../components/shell/BottomNavBar";
import { TopBar } from "../../components/shell/TopBar";
import { AdminRuntimeProvider, useAdminRuntime } from "./AdminRuntime";
import { AdminSidebar } from "./components/AdminSidebar";
import { InspectionPanel } from "./components/InspectionPanel";

function AdminShell() {
  const { error, isLoading } = useAdminRuntime();

  return (
    <div className="shell admin-layout">
      <aside className="shell__sidebar">
        <div className="shell__brand">
          <h1 className="shell__brand-title">FBR CHAT</h1>
          <p className="shell__brand-subtitle">Operational Node 01</p>
        </div>
        <div className="shell__nav">
          <AdminSidebar />
          <button className="button button--primary" type="button">
            Execute New
          </button>
        </div>
      </aside>

      <main className="shell__main">
        <TopBar
          title="Admin Console"
          search={<SearchField placeholder="Busca global..." />}
          statusLabel={error ? "Falha" : isLoading ? "Syncing" : "Online"}
        />
        <div className="admin-layout__body">
          <Outlet />
          <InspectionPanel />
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

export function AdminLayout() {
  return (
    <AdminRuntimeProvider>
      <AdminShell />
    </AdminRuntimeProvider>
  );
}
