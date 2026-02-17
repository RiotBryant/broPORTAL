export default function Card({
  title,
  subtitle,
  desc,
  actions
}: {
  title: string;
  subtitle?: string;
  desc?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="cardHeader">
        <div className="cardTitle">{title}</div>
        {subtitle ? <div className="cardSub">{subtitle}</div> : null}
        {desc ? <div className="cardDesc">{desc}</div> : null}
      </div>
      {actions ? <div className="cardActions">{actions}</div> : null}
    </div>
  );
}
