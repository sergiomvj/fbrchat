import type { ReactNode } from "react";
import { StatusPill } from "./StatusPill";

type TopBarProps = {
  title: string;
  search?: ReactNode;
  statusLabel?: string;
  rightSlot?: ReactNode;
};

export function TopBar({
  title,
  search,
  statusLabel = "Online",
  rightSlot
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__brand-wrap">
        <button className="topbar__menu" onClick={() => alert("Acionaria a Drawer/Sidebar no Mobile")}>
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="topbar__title">{title}</h1>
      </div>
      <div className="topbar__meta">
        {search}
        <StatusPill label={statusLabel} />
        {rightSlot}
      </div>
    </header>
  );
}
