type StatusPillProps = {
  label: string;
};

export function StatusPill({ label }: StatusPillProps) {
  return (
    <span className="status-pill">
      <span className="status-pill__dot" />
      {label}
    </span>
  );
}
