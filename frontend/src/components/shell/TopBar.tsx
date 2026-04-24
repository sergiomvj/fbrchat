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
      <h1 className="topbar__title">{title}</h1>
      <div className="topbar__meta">
        {search}
        <StatusPill label={statusLabel} />
        {rightSlot}
      </div>
    </header>
  );
}
