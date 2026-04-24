import { NavLink } from "react-router-dom";

const items = [
  { label: "Dashboard", to: "/admin" },
  { label: "Users", to: "/admin/users" },
  { label: "Agents", to: "/admin/agents" },
  { label: "Groups", to: "/admin/groups" },
  { label: "Audit Logs", to: "/admin/logs" },
  { label: "Settings", to: "/admin/settings" }
];

export function AdminSidebar() {
  return (
    <nav className="admin-sidebar">
      {items.map((item) => (
        <NavLink
          key={item.to}
          className={({ isActive }) =>
            isActive ? "admin-sidebar__item admin-sidebar__item--active" : "admin-sidebar__item"
          }
          end={item.to === "/admin"}
          to={item.to}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
