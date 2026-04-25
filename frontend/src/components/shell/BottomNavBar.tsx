import { NavLink } from "react-router-dom";
import "../../styles/bottom-nav.css";

export function BottomNavBar() {
  return (
    <nav className="bottom-nav">
      <NavLink 
        to="/chat" 
        className={({ isActive }) => `bottom-nav__item ${isActive ? "bottom-nav__item--active" : ""}`}
      >
        <span className="material-symbols-outlined bottom-nav__icon">chat_bubble</span>
        <span className="bottom-nav__label">Chat</span>
      </NavLink>
      <NavLink 
        to="/admin/agents" 
        className={({ isActive }) => `bottom-nav__item ${isActive ? "bottom-nav__item--active" : ""}`}
      >
        <span className="material-symbols-outlined bottom-nav__icon">badge</span>
        <span className="bottom-nav__label">Agents</span>
      </NavLink>
      <NavLink 
        to="/admin/groups" 
        className={({ isActive }) => `bottom-nav__item ${isActive ? "bottom-nav__item--active" : ""}`}
      >
        <span className="material-symbols-outlined bottom-nav__icon">group</span>
        <span className="bottom-nav__label">Groups</span>
      </NavLink>
      <NavLink 
        to="/admin" 
        end
        className={({ isActive }) => `bottom-nav__item ${isActive ? "bottom-nav__item--active" : ""}`}
      >
        <span className="material-symbols-outlined bottom-nav__icon">analytics</span>
        <span className="bottom-nav__label">Admin</span>
      </NavLink>
    </nav>
  );
}
