export default function TopBar({
  title,
  subtitle,
  right
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>{title}</div>
        {subtitle ? <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{subtitle}</div> : null}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {right}
      </div>
    </div>
  );
}
