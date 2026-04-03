import { useState, useEffect, useRef, useCallback } from "react";

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap";

// --- Data ---
const INCOME_SOURCES = [
  { id: "retail", label: "Retail Cash Sales", monthly: 285000, type: "cash", reliability: 0.92 },
  { id: "wholesale", label: "Wholesale Cheques", monthly: 420000, type: "cheque", reliability: 0.78, avgClearDays: 14 },
  { id: "export", label: "Export Orders", monthly: 195000, type: "mixed", reliability: 0.65, avgClearDays: 21 },
  { id: "govt", label: "Govt. Contracts", monthly: 310000, type: "cheque", reliability: 0.55, avgClearDays: 45 },
  { id: "scrap", label: "Scrap & Byproduct", monthly: 48000, type: "cash", reliability: 0.88 },
  { id: "rental", label: "Equipment Rental", monthly: 62000, type: "mixed", reliability: 0.95 },
];

const DEBT_ITEMS = [
  { id: "d1", creditor: "National Bank", type: "Term Loan", principal: 2800000, rate: 12.5, emi: 68000, remaining: 48, priority: "high" },
  { id: "d2", creditor: "Supplier A — Steel Corp", type: "Trade Credit", principal: 1450000, rate: 0, emi: 0, remaining: 0, priority: "critical", overdue: 32 },
  { id: "d3", creditor: "Supplier B — Polymers Ltd", type: "Trade Credit", principal: 680000, rate: 0, emi: 0, remaining: 0, priority: "medium", overdue: 18 },
  { id: "d4", creditor: "Equipment Lease Co.", type: "Lease", principal: 920000, rate: 14, emi: 42000, remaining: 24, priority: "high" },
  { id: "d5", creditor: "Private Lender", type: "Personal Loan", principal: 500000, rate: 18, emi: 25000, remaining: 30, priority: "critical" },
  { id: "d6", creditor: "MSME Finance", type: "Working Capital", principal: 1200000, rate: 11, emi: 55000, remaining: 36, priority: "medium" },
  { id: "d7", creditor: "Tax Authority", type: "Tax Arrears", principal: 380000, rate: 15, emi: 0, remaining: 0, priority: "critical", overdue: 60 },
];

const MONTHLY_EXPENSES = [
  { label: "Raw Materials", amount: 520000 },
  { label: "Labor & Wages", amount: 310000 },
  { label: "Utilities & Power", amount: 85000 },
  { label: "Transport & Logistics", amount: 72000 },
  { label: "Rent & Facility", amount: 45000 },
  { label: "Admin & Overheads", amount: 38000 },
  { label: "Debt Servicing (EMIs)", amount: 190000 },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// --- Utilities ---
const fmt = (n) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};

const lerp = (a, b, t) => a + (b - a) * t;

// --- Animated Counter ---
function AnimCounter({ target, duration = 1800, prefix = "₹", suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(lerp(0, target, eased)));
      if (p < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration]);

  return <span>{prefix}{val.toLocaleString("en-IN")}{suffix}</span>;
}

// --- Intersection Observer Hook ---
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// --- Particle Field ---
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let w = c.width = c.offsetWidth;
    let h = c.height = c.offsetHeight;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5, o: Math.random() * 0.3 + 0.05,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${p.o})`;
        ctx.fill();
      });
      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,0,0,${0.04 * (1 - dist / 120)})`;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

// --- Flowing Lines Background ---
function FlowLines({ color = "rgba(0,0,0,0.04)", count = 5 }) {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "hidden" }}>
      {Array.from({ length: count }, (_, i) => {
        const y1 = 20 + (i * 60) / count + "%";
        const y2 = 30 + (i * 50) / count + "%";
        return (
          <path key={i} d={`M -10 ${y1} Q 25% ${y2}, 50% ${y1} T 110% ${y2}`}
            fill="none" stroke={color} strokeWidth="1"
            strokeDasharray="8 6" opacity={0.6 + i * 0.08}>
            <animate attributeName="stroke-dashoffset" from="0" to="-28" dur={`${3 + i * 0.7}s`} repeatCount="indefinite" />
          </path>
        );
      })}
    </svg>
  );
}

// --- Mini Sparkline ---
function Sparkline({ data, width = 120, height = 32, color = "#000" }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// --- Bar Chart ---
function BarChart({ items, maxVal, color = "#000", animDelay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 140, fontFamily: "'DM Sans'", fontSize: 12, color: "#666", textAlign: "right", flexShrink: 0 }}>{item.label}</div>
          <div style={{ flex: 1, height: 28, background: "#f5f5f5", borderRadius: 4, overflow: "hidden", position: "relative" }}>
            <div style={{
              height: "100%", background: color, borderRadius: 4,
              width: inView ? `${(item.amount / maxVal) * 100}%` : "0%",
              transition: `width 1.2s cubic-bezier(0.16,1,0.3,1) ${animDelay + i * 0.08}s`,
            }} />
            <span style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#999",
            }}>{fmt(item.amount)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Debt Node Map ---
function DebtMap({ debts }) {
  const [ref, inView] = useInView();
  const [hovered, setHovered] = useState(null);
  const totalDebt = debts.reduce((s, d) => s + d.principal, 0);
  const priorityColor = { critical: "#c0392b", high: "#e67e22", medium: "#7f8c8d" };

  return (
    <div ref={ref} style={{ position: "relative", padding: "60px 0" }}>
      {/* Center node */}
      <div style={{
        width: 100, height: 100, borderRadius: "50%", border: "2px solid #000",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
        margin: "0 auto", position: "relative", zIndex: 2, background: "#fff",
        boxShadow: "0 0 0 8px rgba(0,0,0,0.03)",
      }}>
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#999" }}>TOTAL</span>
        <span style={{ fontFamily: "'Cormorant Garamond'", fontSize: 16, fontWeight: 600 }}>{fmt(totalDebt)}</span>
      </div>
      {/* Debt nodes */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, marginTop: 32 }}>
        {debts.map((d, i) => {
          const size = 40 + (d.principal / totalDebt) * 80;
          const isHov = hovered === d.id;
          return (
            <div key={d.id}
              onMouseEnter={() => setHovered(d.id)} onMouseLeave={() => setHovered(null)}
              style={{
                width: size + 80, padding: "16px 12px", borderRadius: 12,
                border: `1.5px solid ${isHov ? priorityColor[d.priority] : "#e8e8e8"}`,
                background: isHov ? `${priorityColor[d.priority]}08` : "#fafafa",
                transition: "all 0.4s ease", cursor: "default",
                opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)",
                transitionDelay: `${i * 0.07}s`,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: priorityColor[d.priority],
              }} />
              <span style={{ fontFamily: "'DM Sans'", fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: 1 }}>{d.type}</span>
              <span style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, textAlign: "center" }}>{d.creditor}</span>
              <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 14, fontWeight: 500 }}>{fmt(d.principal)}</span>
              {d.rate > 0 && <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#999" }}>{d.rate}% p.a.</span>}
              {d.overdue && <span style={{ fontFamily: "'DM Sans'", fontSize: 10, color: "#c0392b", fontWeight: 600 }}>{d.overdue} days overdue</span>}
              {d.emi > 0 && <span style={{ fontFamily: "'DM Sans'", fontSize: 10, color: "#666" }}>EMI: {fmt(d.emi)}/mo</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Cashflow Waterfall ---
function Waterfall({ income, expenses }) {
  const [ref, inView] = useInView();
  const totalIn = income.reduce((s, v) => s + v.monthly, 0);
  const totalOut = expenses.reduce((s, v) => s + v.amount, 0);
  const surplus = totalIn - totalOut;
  const maxVal = totalIn;

  const items = [
    { label: "Total Income", value: totalIn, cum: totalIn, type: "income" },
    ...expenses.map((e, i) => {
      const cum = totalIn - expenses.slice(0, i + 1).reduce((s, v) => s + v.amount, 0);
      return { label: e.label, value: -e.amount, cum, type: "expense" };
    }),
    { label: "Net Surplus", value: surplus, cum: surplus, type: surplus >= 0 ? "surplus" : "deficit" },
  ];

  return (
    <div ref={ref} style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, minWidth: 700, height: 260, padding: "0 8px", position: "relative" }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <div key={p} style={{
            position: "absolute", left: 0, right: 0, bottom: p * 220 + 32,
            borderTop: "1px solid #f0f0f0", zIndex: 0,
          }}>
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "#ccc", position: "absolute", left: 0, top: -12 }}>
              {fmt(maxVal * p)}
            </span>
          </div>
        ))}
        {items.map((item, i) => {
          const barH = Math.abs(item.cum) / maxVal * 220;
          const colors = { income: "#1a1a1a", expense: "#d4d4d4", surplus: "#2ecc71", deficit: "#c0392b" };
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1 }}>
              <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#666", marginBottom: 4 }}>
                {item.value >= 0 ? "+" : ""}{fmt(item.value)}
              </span>
              <div style={{
                width: "100%", maxWidth: 48, borderRadius: "4px 4px 0 0",
                background: colors[item.type],
                height: inView ? barH : 0,
                transition: `height 1s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s`,
              }} />
              <span style={{
                fontFamily: "'DM Sans'", fontSize: 9, color: "#999", marginTop: 6,
                textAlign: "center", lineHeight: 1.2, maxWidth: 70,
              }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Simulator ---
function Simulator() {
  const [months, setMonths] = useState(24);
  const [extraPayment, setExtraPayment] = useState(50000);
  const [revenueGrowth, setRevenueGrowth] = useState(5);
  const [costReduction, setCostReduction] = useState(3);

  const totalDebt = DEBT_ITEMS.reduce((s, d) => s + d.principal, 0);
  const totalIncome = INCOME_SOURCES.reduce((s, v) => s + v.monthly, 0);
  const totalExpense = MONTHLY_EXPENSES.reduce((s, v) => s + v.amount, 0);

  // Simulate
  const timeline = [];
  let debt = totalDebt;
  let revenue = totalIncome;
  let costs = totalExpense;
  let cumProfit = 0;

  for (let m = 0; m <= months; m++) {
    const monthRevenue = revenue * Math.pow(1 + revenueGrowth / 100 / 12, m);
    const monthCost = costs * Math.pow(1 - costReduction / 100 / 12, m);
    const surplus = monthRevenue - monthCost;
    const debtPayment = Math.min(debt, extraPayment + 190000);
    debt = Math.max(0, debt - debtPayment + (debt * 0.12 / 12));
    cumProfit += surplus;
    timeline.push({ month: m, debt: Math.round(debt), revenue: Math.round(monthRevenue), cost: Math.round(monthCost), surplus: Math.round(surplus), cumProfit: Math.round(cumProfit) });
  }

  const debtFreeMonth = timeline.findIndex(t => t.debt <= 0);
  const maxDebt = Math.max(...timeline.map(t => t.debt));
  const maxRev = Math.max(...timeline.map(t => t.revenue));

  const SliderControl = ({ label, value, onChange, min, max, step, unit, color }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: "'DM Sans'", fontSize: 12, color: "#666" }}>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 500, color }}>{typeof value === "number" && value >= 1000 ? fmt(value) : value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color || "#000" }} />
    </div>
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 40, alignItems: "start" }}>
        {/* Controls */}
        <div style={{ padding: 24, background: "#fafafa", borderRadius: 16, border: "1px solid #eee" }}>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#999", marginBottom: 20 }}>Simulation Controls</p>
          <SliderControl label="Time Horizon" value={months} onChange={setMonths} min={6} max={60} step={6} unit=" months" color="#1a1a1a" />
          <SliderControl label="Extra Debt Payment" value={extraPayment} onChange={setExtraPayment} min={0} max={200000} step={10000} unit="" color="#c0392b" />
          <SliderControl label="Revenue Growth" value={revenueGrowth} onChange={setRevenueGrowth} min={0} max={20} step={1} unit="% p.a." color="#2ecc71" />
          <SliderControl label="Cost Reduction" value={costReduction} onChange={setCostReduction} min={0} max={15} step={1} unit="% p.a." color="#e67e22" />
        </div>

        {/* Chart */}
        <div>
          {/* KPI Strip */}
          <div style={{ display: "flex", gap: 24, marginBottom: 28, flexWrap: "wrap" }}>
            {[
              { label: "Debt-Free By", value: debtFreeMonth > 0 ? `Month ${debtFreeMonth}` : "Not in range", accent: debtFreeMonth > 0 ? "#2ecc71" : "#c0392b" },
              { label: "Final Surplus/mo", value: fmt(timeline[timeline.length - 1].surplus), accent: "#1a1a1a" },
              { label: "Cumulative Profit", value: fmt(timeline[timeline.length - 1].cumProfit), accent: timeline[timeline.length - 1].cumProfit > 0 ? "#2ecc71" : "#c0392b" },
              { label: "Final Debt", value: fmt(timeline[timeline.length - 1].debt), accent: timeline[timeline.length - 1].debt === 0 ? "#2ecc71" : "#e67e22" },
            ].map((kpi) => (
              <div key={kpi.label} style={{ padding: "12px 16px", border: `1px solid ${kpi.accent}22`, borderRadius: 10, background: `${kpi.accent}06`, minWidth: 130 }}>
                <p style={{ fontFamily: "'DM Sans'", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, color: "#999", margin: 0 }}>{kpi.label}</p>
                <p style={{ fontFamily: "'JetBrains Mono'", fontSize: 18, fontWeight: 600, color: kpi.accent, margin: "4px 0 0" }}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* SVG Chart */}
          <svg viewBox="0 0 700 280" style={{ width: "100%", fontFamily: "'JetBrains Mono'" }}>
            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((p) => (
              <g key={p}>
                <line x1="50" y1={20 + (1 - p) * 230} x2="690" y2={20 + (1 - p) * 230} stroke="#f0f0f0" />
                <text x="46" y={24 + (1 - p) * 230} textAnchor="end" fontSize="8" fill="#ccc">{fmt(maxDebt * p)}</text>
              </g>
            ))}

            {/* Debt area */}
            <path d={
              `M 50 250 ` +
              timeline.map((t, i) => `L ${50 + (i / months) * 640} ${250 - (t.debt / maxDebt) * 230}`).join(" ") +
              ` L ${50 + 640} 250 Z`
            } fill="rgba(192,57,43,0.08)" />
            <path d={
              timeline.map((t, i) => `${i === 0 ? "M" : "L"} ${50 + (i / months) * 640} ${250 - (t.debt / maxDebt) * 230}`).join(" ")
            } fill="none" stroke="#c0392b" strokeWidth="2" />

            {/* Revenue line */}
            <path d={
              timeline.map((t, i) => `${i === 0 ? "M" : "L"} ${50 + (i / months) * 640} ${250 - (t.revenue / maxRev) * 200}`).join(" ")
            } fill="none" stroke="#2ecc71" strokeWidth="1.5" strokeDasharray="4 3" />

            {/* Cost line */}
            <path d={
              timeline.map((t, i) => `${i === 0 ? "M" : "L"} ${50 + (i / months) * 640} ${250 - (t.cost / maxRev) * 200}`).join(" ")
            } fill="none" stroke="#e67e22" strokeWidth="1.5" strokeDasharray="4 3" />

            {/* Debt-free marker */}
            {debtFreeMonth > 0 && (
              <g>
                <line x1={50 + (debtFreeMonth / months) * 640} y1="20" x2={50 + (debtFreeMonth / months) * 640} y2="250" stroke="#2ecc71" strokeWidth="1" strokeDasharray="3 3" />
                <text x={50 + (debtFreeMonth / months) * 640} y="14" textAnchor="middle" fontSize="9" fill="#2ecc71" fontWeight="600">DEBT FREE</text>
              </g>
            )}

            {/* X axis labels */}
            {timeline.filter((_, i) => i % Math.ceil(months / 8) === 0).map((t) => (
              <text key={t.month} x={50 + (t.month / months) * 640} y="268" textAnchor="middle" fontSize="8" fill="#bbb">M{t.month}</text>
            ))}

            {/* Legend */}
            <g transform="translate(60, 6)">
              <rect width="10" height="3" fill="#c0392b" rx="1" /><text x="14" y="4" fontSize="8" fill="#999">Debt</text>
              <rect x="55" width="10" height="3" fill="#2ecc71" rx="1" /><text x="69" y="4" fontSize="8" fill="#999">Revenue</text>
              <rect x="120" width="10" height="3" fill="#e67e22" rx="1" /><text x="134" y="4" fontSize="8" fill="#999">Costs</text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

// --- Roadmap Phase ---
function RoadmapPhase({ phase, index }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      display: "flex", gap: 24, opacity: inView ? 1 : 0,
      transform: inView ? "translateX(0)" : "translateX(-30px)",
      transition: `all 0.8s ease ${index * 0.15}s`,
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%", border: "2px solid #000",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'JetBrains Mono'", fontSize: 14, fontWeight: 600,
          background: index === 0 ? "#000" : "#fff", color: index === 0 ? "#fff" : "#000",
        }}>{index + 1}</div>
        {index < 4 && <div style={{ width: 1, height: 80, background: "#e0e0e0", marginTop: 4 }} />}
      </div>
      <div style={{ paddingBottom: 32 }}>
        <p style={{ fontFamily: "'DM Sans'", fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: "#999", margin: 0 }}>{phase.timeline}</p>
        <h4 style={{ fontFamily: "'Cormorant Garamond'", fontSize: 22, fontWeight: 600, margin: "4px 0 8px", color: "#1a1a1a" }}>{phase.title}</h4>
        <p style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "#666", lineHeight: 1.6, margin: 0, maxWidth: 500 }}>{phase.description}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {phase.tags.map((t) => (
            <span key={t} style={{
              fontFamily: "'JetBrains Mono'", fontSize: 9, padding: "4px 10px",
              background: "#f5f5f5", borderRadius: 20, color: "#666", letterSpacing: 0.5,
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Cash Reliability Gauge ---
function ReliabilityGauge({ value, label }) {
  const [ref, inView] = useInView();
  const pct = value * 100;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width="68" height="68" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="34" cy="34" r="28" fill="none" stroke="#f0f0f0" strokeWidth="4" />
        <circle cx="34" cy="34" r="28" fill="none" stroke={pct > 80 ? "#2ecc71" : pct > 60 ? "#e67e22" : "#c0392b"} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={inView ? offset : circumference}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      </svg>
      <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, fontWeight: 600 }}>{Math.round(pct)}%</span>
      <span style={{ fontFamily: "'DM Sans'", fontSize: 9, color: "#999", textAlign: "center", maxWidth: 70 }}>{label}</span>
    </div>
  );
}

// ==================== MAIN ====================
export default function AcmeFinancialClarity() {
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef([]);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = FONT_LINK;
    document.head.appendChild(link);
  }, []);

  const totalIncome = INCOME_SOURCES.reduce((s, v) => s + v.monthly, 0);
  const totalExpense = MONTHLY_EXPENSES.reduce((s, v) => s + v.amount, 0);
  const totalDebt = DEBT_ITEMS.reduce((s, d) => s + d.principal, 0);
  const surplus = totalIncome - totalExpense;

  const cashflowData = MONTHS.map((_, i) => totalIncome * (0.85 + Math.random() * 0.3));
  const expenseData = MONTHS.map((_, i) => totalExpense * (0.9 + Math.random() * 0.2));

  const roadmapPhases = [
    { timeline: "Month 1–2", title: "Forensic Audit & Book Cleanup", description: "Digitize all cash and cheque records. Map every income source, categorize all receivables by type, and reconcile bank statements against physical records.", tags: ["RECONCILIATION", "DIGITIZATION", "AUDIT"] },
    { timeline: "Month 2–4", title: "Debt Restructuring & Prioritization", description: "Negotiate with critical creditors. Consolidate high-interest private loans. Set up structured repayment schedules using the avalanche method prioritizing highest-rate debt.", tags: ["NEGOTIATION", "AVALANCHE METHOD", "CONSOLIDATION"] },
    { timeline: "Month 3–6", title: "Cash Flow Discipline System", description: "Implement weekly cash position tracking. Create separate accounts for operations, debt servicing, and growth reserves. Establish 30-60-90 day receivable management.", tags: ["CASH CONTROLS", "RESERVE FUND", "RECEIVABLES"] },
    { timeline: "Month 4–12", title: "Working Capital Optimization", description: "Reduce raw material inventory holding period. Negotiate better payment terms with suppliers. Implement just-in-time ordering where feasible. Target 15% working capital reduction.", tags: ["INVENTORY", "JIT", "SUPPLIER TERMS"] },
    { timeline: "Month 6–24", title: "Growth & Profit Scaling", description: "Reinvest freed capital into high-margin product lines. Diversify income beyond government contracts. Build emergency fund covering 3 months of operations.", tags: ["MARGIN EXPANSION", "DIVERSIFICATION", "EMERGENCY FUND"] },
  ];

  const sections = ["Overview", "Income Map", "Debt Anatomy", "Cash Waterfall", "Roadmap", "Simulator"];

  return (
    <div style={{ background: "#fff", minHeight: "100vh", color: "#1a1a1a", overflowX: "hidden" }}>
      {/* --- NAV --- */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100, background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)", borderBottom: "1px solid #f0f0f0",
        padding: "0 32px", display: "flex", alignItems: "center", height: 52,
      }}>
        <span style={{ fontFamily: "'Cormorant Garamond'", fontSize: 16, fontWeight: 600, letterSpacing: 1 }}>ACME</span>
        <span style={{ fontFamily: "'DM Sans'", fontSize: 10, color: "#bbb", marginLeft: 12, textTransform: "uppercase", letterSpacing: 2 }}>Financial Clarity Engine</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {sections.map((s, i) => (
            <button key={s} onClick={() => document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: "smooth" })}
              style={{
                fontFamily: "'DM Sans'", fontSize: 11, padding: "6px 14px", borderRadius: 20,
                border: "none", background: activeSection === i ? "#1a1a1a" : "transparent",
                color: activeSection === i ? "#fff" : "#999", cursor: "pointer",
                transition: "all 0.3s ease", fontWeight: 500,
              }}>{s}</button>
          ))}
        </div>
      </nav>

      {/* --- HERO --- */}
      <section id="section-0" style={{ position: "relative", padding: "100px 48px 80px", overflow: "hidden" }}>
        <ParticleField />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto" }}>
          <p style={{
            fontFamily: "'DM Sans'", fontSize: 11, textTransform: "uppercase", letterSpacing: 4,
            color: "#bbb", marginBottom: 16,
          }}>
            <span style={{ display: "inline-block", width: 32, height: 1, background: "#ccc", verticalAlign: "middle", marginRight: 12 }} />
            AI-Powered Financial Transparency
          </p>
          <h1 style={{
            fontFamily: "'Cormorant Garamond'", fontSize: "clamp(36px, 5vw, 62px)", fontWeight: 300,
            lineHeight: 1.15, margin: "0 0 24px", letterSpacing: -1,
          }}>
            From Chaos to Clarity.<br />
            <span style={{ fontWeight: 600 }}>One Dashboard.</span>
          </h1>
          <p style={{
            fontFamily: "'DM Sans'", fontSize: 15, color: "#888", lineHeight: 1.7,
            maxWidth: 560, marginBottom: 40,
          }}>
            Acme Manufacturing's complete financial picture — income streams mapped, debt cycles untangled, and a disciplined roadmap to profitability. Powered by algorithmic analysis of every rupee flowing in and out.
          </p>

          {/* Hero KPIs */}
          <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
            {[
              { label: "Monthly Revenue", value: totalIncome, color: "#1a1a1a" },
              { label: "Monthly Expenses", value: totalExpense, color: "#666" },
              { label: "Outstanding Debt", value: totalDebt, color: "#c0392b" },
              { label: "Monthly Surplus", value: surplus, color: surplus > 0 ? "#2ecc71" : "#c0392b" },
            ].map((kpi) => (
              <div key={kpi.label}>
                <p style={{ fontFamily: "'DM Sans'", fontSize: 10, textTransform: "uppercase", letterSpacing: 2, color: "#bbb", margin: "0 0 4px" }}>{kpi.label}</p>
                <p style={{ fontFamily: "'Cormorant Garamond'", fontSize: 32, fontWeight: 600, color: kpi.color, margin: 0 }}>
                  <AnimCounter target={kpi.value} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- INCOME MAP --- */}
      <section id="section-1" style={{ padding: "80px 48px", position: "relative" }}>
        <FlowLines color="rgba(46,204,113,0.08)" count={4} />
        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 10, textTransform: "uppercase", letterSpacing: 3, color: "#bbb" }}>Chapter 01</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond'", fontSize: 36, fontWeight: 400, margin: "8px 0 12px" }}>
            Where the <span style={{ fontStyle: "italic" }}>Money</span> Comes From
          </h2>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "#888", maxWidth: 500, marginBottom: 40, lineHeight: 1.7 }}>
            Six revenue streams. Mixed cash and cheque. Wildly different reliability scores. Here's the real picture of Acme's income ecosystem.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
            {INCOME_SOURCES.map((src, i) => {
              const sparkData = Array.from({ length: 12 }, () => src.monthly * (0.6 + Math.random() * 0.8));
              return (
                <div key={src.id} style={{
                  padding: 20, borderRadius: 12, border: "1px solid #eee",
                  background: "#fafafa", display: "flex", gap: 16, alignItems: "center",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono'", fontSize: 9, padding: "2px 8px", borderRadius: 10,
                        background: src.type === "cash" ? "#2ecc7118" : src.type === "cheque" ? "#e67e2218" : "#3498db18",
                        color: src.type === "cash" ? "#2ecc71" : src.type === "cheque" ? "#e67e22" : "#3498db",
                        textTransform: "uppercase", letterSpacing: 1,
                      }}>{src.type}</span>
                      {src.avgClearDays && <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "#ccc" }}>{src.avgClearDays}d clear</span>}
                    </div>
                    <p style={{ fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 600, margin: "4px 0 2px" }}>{src.label}</p>
                    <p style={{ fontFamily: "'JetBrains Mono'", fontSize: 16, fontWeight: 500, margin: 0 }}>{fmt(src.monthly)}<span style={{ fontSize: 10, color: "#999" }}>/mo</span></p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <Sparkline data={sparkData} color={src.reliability > 0.8 ? "#2ecc71" : src.reliability > 0.6 ? "#e67e22" : "#c0392b"} />
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "#999" }}>{Math.round(src.reliability * 100)}% reliable</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reliability gauges */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginTop: 24 }}>
            {INCOME_SOURCES.map((src) => (
              <ReliabilityGauge key={src.id} value={src.reliability} label={src.label.split(" ")[0]} />
            ))}
          </div>
        </div>
      </section>

      {/* --- DEBT ANATOMY --- */}
      <section id="section-2" style={{ padding: "80px 48px", background: "#fafafa" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 10, textTransform: "uppercase", letterSpacing: 3, color: "#bbb" }}>Chapter 02</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond'", fontSize: 36, fontWeight: 400, margin: "8px 0 12px" }}>
            The Debt <span style={{ fontStyle: "italic" }}>Anatomy</span>
          </h2>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "#888", maxWidth: 500, marginBottom: 12, lineHeight: 1.7 }}>
            Seven creditors. Three priority levels. A tangled web of term loans, trade credits, equipment leases, and tax arrears — all demanding attention simultaneously.
          </p>
          {/* Priority legend */}
          <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
            {[{ l: "Critical", c: "#c0392b" }, { l: "High", c: "#e67e22" }, { l: "Medium", c: "#7f8c8d" }].map((p) => (
              <div key={p.l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.c }} />
                <span style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#999" }}>{p.l}</span>
              </div>
            ))}
          </div>
          <DebtMap debts={DEBT_ITEMS} />
        </div>
      </section>

      {/* --- CASH WATERFALL --- */}
      <section id="section-3" style={{ padding: "80px 48px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 10, textTransform: "uppercase", letterSpacing: 3, color: "#bbb" }}>Chapter 03</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond'", fontSize: 36, fontWeight: 400, margin: "8px 0 12px" }}>
            The Cash <span style={{ fontStyle: "italic" }}>Waterfall</span>
          </h2>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "#888", maxWidth: 500, marginBottom: 40, lineHeight: 1.7 }}>
            Watch how ₹13.2L of monthly revenue gets consumed. Every bar is a drain — raw materials, labor, debt servicing — until we reach the thin margin that keeps Acme alive.
          </p>

          <Waterfall income={INCOME_SOURCES} expenses={MONTHLY_EXPENSES} />

          <div style={{ marginTop: 40 }}>
            <p style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, marginBottom: 16 }}>Expense Breakdown</p>
            <BarChart items={MONTHLY_EXPENSES} maxVal={Math.max(...MONTHLY_EXPENSES.map(e => e.amount))} color="#1a1a1a" />
          </div>
        </div>
      </section>

      {/* --- ROADMAP --- */}
      <section id="section-4" style={{ padding: "80px 48px", background: "#fafafa" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 10, textTransform: "uppercase", letterSpacing: 3, color: "#bbb" }}>Chapter 04</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond'", fontSize: 36, fontWeight: 400, margin: "8px 0 12px" }}>
            The <span style={{ fontStyle: "italic" }}>Roadmap</span> to Freedom
          </h2>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "#888", maxWidth: 500, marginBottom: 48, lineHeight: 1.7 }}>
            A phased, disciplined approach to untangling Acme's finances — from forensic audit through growth scaling. Each phase builds on the last.
          </p>
          {roadmapPhases.map((phase, i) => (
            <RoadmapPhase key={i} phase={phase} index={i} />
          ))}
        </div>
      </section>

      {/* --- SIMULATOR --- */}
      <section id="section-5" style={{ padding: "80px 48px", position: "relative" }}>
        <FlowLines color="rgba(0,0,0,0.02)" count={3} />
        <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 10, textTransform: "uppercase", letterSpacing: 3, color: "#bbb" }}>Chapter 05</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond'", fontSize: 36, fontWeight: 400, margin: "8px 0 12px" }}>
            The <span style={{ fontStyle: "italic" }}>Simulator</span>
          </h2>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "#888", maxWidth: 500, marginBottom: 40, lineHeight: 1.7 }}>
            Adjust the levers. See the future. Explore how different strategies affect Acme's debt payoff timeline and profitability trajectory.
          </p>
          <Simulator />
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer style={{
        padding: "48px", borderTop: "1px solid #f0f0f0", textAlign: "center",
      }}>
        <p style={{ fontFamily: "'Cormorant Garamond'", fontSize: 20, fontWeight: 400, color: "#ccc" }}>
          Built with AI-Powered Financial Intelligence
        </p>
        <p style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#ddd", marginTop: 8 }}>
          Acme Manufacturing — Confidential Financial Review
        </p>
      </footer>
    </div>
  );
}
