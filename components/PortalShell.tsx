export default function PortalShell({ children }: { children: React.ReactNode }) {
  const baseCSS = `
    :root { color-scheme: dark; }
    .page{ min-height:100vh; background:#07070b; color:white; padding:24px; }
    .shell{ max-width:1100px; margin:0 auto; }
    .pill{
      border-radius:999px; border:1px solid rgba(255,255,255,0.12);
      background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.92);
      padding:10px 14px; font-size:13px; text-decoration:none; display:inline-flex; gap:8px;
      transition:transform .12s ease, background .12s ease, border-color .12s ease;
      white-space:nowrap;
    }
    .pill:hover{ transform:translateY(-1px); background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); }
    .pillPrimary{ background:rgba(255,255,255,0.10); border-color:rgba(255,255,255,0.18); }

    .hero{
      border-radius:22px; border:1px solid rgba(255,255,255,0.10);
      background: radial-gradient(1200px 420px at 20% 35%, rgba(80,170,255,0.20), rgba(0,0,0,0.0)),
                  radial-gradient(900px 420px at 85% 50%, rgba(255,120,200,0.14), rgba(0,0,0,0.0)),
                  rgba(255,255,255,0.04);
      padding:18px 18px 16px;
      box-shadow:0 0 60px rgba(80,170,255,0.06);
      margin-bottom:18px;
    }
    .heroRow{ display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
    .chipRow{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
    .chip{
      border-radius:999px; border:1px solid rgba(255,255,255,0.12);
      background:rgba(0,0,0,0.25); padding:8px 10px; font-size:12px; color:rgba(255,255,255,0.70);
    }
    .chip b{ color:rgba(255,255,255,0.92); font-weight:800; }

    .heroButtons{ display:flex; gap:10px; flex-wrap:wrap; }
    .cta{
      border-radius:999px; padding:10px 14px; font-size:13px; text-decoration:none;
      border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.06);
      color:rgba(255,255,255,0.90); transition:transform .12s ease, background .12s ease, border-color .12s ease;
      display:inline-flex; align-items:center; gap:8px; white-space:nowrap;
    }
    .cta:hover{ transform:translateY(-1px); background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); }
    .ctaPrimary{ background:#fff; color:#000; border:none; }

    .heroTitle{ margin:12px 0 0; font-size:56px; line-height:1.02; font-weight:900; letter-spacing:-0.03em; }
    @media (max-width: 900px){ .heroTitle{ font-size:44px; } }

    .sectionLabel{ margin:14px 0 10px; font-size:12px; color:rgba(255,255,255,0.55); letter-spacing:0.06em; }
    .grid{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    @media (max-width: 900px){ .grid{ grid-template-columns:1fr; } }

    .card{
      border-radius:22px; border:1px solid rgba(255,255,255,0.10);
      background:rgba(255,255,255,0.04); padding:18px;
      box-shadow:0 0 50px rgba(0,0,0,0.35);
    }
    .cardHeader{ margin-bottom:12px; }
    .cardTitle{ font-size:22px; font-weight:900; letter-spacing:-0.02em; margin:0; }
    .cardSub{ margin-top:6px; font-size:12px; color:rgba(255,255,255,0.50); }
    .cardDesc{ margin-top:8px; font-size:13px; color:rgba(255,255,255,0.70); }
    .cardActions{ display:flex; gap:10px; flex-wrap:wrap; margin-top:14px; }

    .btn{
      border-radius:999px; padding:10px 14px; font-size:13px; text-decoration:none;
      border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.06);
      color:rgba(255,255,255,0.90); transition:transform .12s ease, background .12s ease, border-color .12s ease;
      display:inline-flex; align-items:center; gap:8px; white-space:nowrap; cursor:pointer;
    }
    .btn:hover{ transform:translateY(-1px); background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); }
    .btnPrimary{ background:#fff; color:#000; border:none; }
    .btnGhost{ background:rgba(255,255,255,0.04); }
    input, textarea{
      width:100%; margin-top:6px; padding:10px 12px; border-radius:14px;
      border:1px solid rgba(255,255,255,0.12); background:rgba(0,0,0,0.35); color:white;
      outline:none;
    }
    textarea{ min-height: 110px; resize: vertical; }
    .tiny{ font-size:12px; color:rgba(255,255,255,0.55); }
  `;

  return (
    <div className="page">
      <style>{baseCSS}</style>
      <div className="shell">{children}</div>
    </div>
  );
}
