import type { ReactNode } from "react";

type AdminPageLayoutProps = {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPageLayout({
  title,
  subtitle,
  actions,
  children
}: AdminPageLayoutProps) {
  return (
    <section className="admin-page">
      <header className="admin-page__header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {actions ? <div className="admin-page__actions">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
