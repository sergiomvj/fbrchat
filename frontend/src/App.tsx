import { NavLink, Route, Routes } from "react-router-dom";
import { ChatLayout } from "./features/chat/ChatLayout";
import { AdminLayout } from "./features/admin/AdminLayout";
import { AdminDashboardPage } from "./features/admin/pages/AdminDashboardPage";
import { AdminUsersPage } from "./features/admin/pages/AdminUsersPage";
import { AdminAgentsPage } from "./features/admin/pages/AdminAgentsPage";
import { AdminGroupsPage } from "./features/admin/pages/AdminGroupsPage";
import { AdminLogsPage } from "./features/admin/pages/AdminLogsPage";
import { AdminSettingsPage } from "./features/admin/pages/AdminSettingsPage";

function HomeRedirect() {
  return (
    <div className="app-home">
      <div className="app-home__card">
        <h1>FBR CHAT</h1>
        <p>Base inicial do frontend alinhada ao PRD e aos exports do Stitch.</p>
        <div className="app-home__actions">
          <NavLink className="button button--primary" to="/chat">
            Abrir Chat
          </NavLink>
          <NavLink className="button" to="/admin">
            Abrir Admin
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/chat" element={<ChatLayout />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="agents" element={<AdminAgentsPage />} />
        <Route path="groups" element={<AdminGroupsPage />} />
        <Route path="logs" element={<AdminLogsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
    </Routes>
  );
}
