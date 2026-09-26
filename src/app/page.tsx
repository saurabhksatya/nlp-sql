"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── DB Network Canvas Background ───────────────────────────────────────────
//
// Palette rationale: SQL (ANSI/ISO standard, declarative, reads data) gets a
// cool sky-blue identity. PL/SQL (Oracle's procedural extension) gets a warm
// ember-red identity, a nod to Oracle's own brand color. The two halves meet
// in the middle as a literal color blend — the "wire" connecting them.

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  side: "left" | "right" | "both";
  pulse: number;
  pulseSpeed: number;
}

function DBCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = 0,
      H = 0;

    function resize() {
      W = canvas!.offsetWidth;
      H = canvas!.offsetHeight;
      canvas!.width = W;
      canvas!.height = H;
      initNodes();
    }

    function initNodes() {
      const count = Math.floor((W * H) / 14000);
      const isMobile = W < 768;
      nodesRef.current = Array.from({ length: count }, () => {
        const side =
          Math.random() < 0.45
            ? "left"
            : Math.random() < 0.55
              ? "right"
              : "both";
        let x: number;
        let y: number;
        if (isMobile) {
          x = Math.random() * W;
          y =
            side === "left"
              ? Math.random() * H * 0.52
              : side === "right"
                ? H * 0.48 + Math.random() * H * 0.52
                : Math.random() * H;
        } else {
          x =
            side === "left"
              ? Math.random() * W * 0.52
              : side === "right"
                ? W * 0.48 + Math.random() * W * 0.52
                : Math.random() * W;
          y = Math.random() * H;
        }
        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: 2 + Math.random() * 3.5,
          side,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.01 + Math.random() * 0.02,
        };
      });
    }

    function drawHexGrid() {
      const isMobile = W < 768;
      const size = 38;
      const cols = Math.ceil(W / (size * 1.5)) + 2;
      const rows = Math.ceil(H / (size * Math.sqrt(3))) + 2;
      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const x = col * size * 1.5;
          const y =
            row * size * Math.sqrt(3) +
            (col % 2 ? (size * Math.sqrt(3)) / 2 : 0);
          const posRatio = isMobile ? y / H : x / W;
          let color: string;
          if (posRatio < 0.44) color = "rgba(148,199,255,0.035)";
          else if (posRatio > 0.56) color = "rgba(234, 94, 255, 0.04)";
          else {
            const t = (posRatio - 0.44) / 0.12;
            const r = Math.round(148 + t * (234 - 148));
            const g = Math.round(199 - t * (199 - 94));
            const b = Math.round(255 - t * (255 - 255));
            color = `rgba(${r},${g},${b},0.035)`;
          }
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const px = x + size * 0.85 * Math.cos(angle);
            const py = y + size * 0.85 * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const isMobile = W < 768;

      if (isMobile) {
        const topGrad = ctx.createLinearGradient(0, 0, 0, H * 0.5);
        topGrad.addColorStop(0, "#081221");
        topGrad.addColorStop(0.5, "#0b1c33");
        topGrad.addColorStop(1, "#05090f");
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, W, H * 0.5);

        const bottomGrad = ctx.createLinearGradient(0, H * 0.5, 0, H);
        bottomGrad.addColorStop(0, "#190624");
        bottomGrad.addColorStop(0.5, "#240a2c");
        bottomGrad.addColorStop(1, "#0d0514");
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, H * 0.5, W, H * 0.5);
      } else {
        const leftGrad = ctx.createLinearGradient(0, 0, W * 0.5, H);
        leftGrad.addColorStop(0, "#081221");
        leftGrad.addColorStop(0.5, "#0b1c33");
        leftGrad.addColorStop(1, "#05090f");
        ctx.fillStyle = leftGrad;
        ctx.fillRect(0, 0, W * 0.5, H);

        const rightGrad = ctx.createLinearGradient(W * 0.5, 0, W, H);
        rightGrad.addColorStop(0, "#1c0b06");
        rightGrad.addColorStop(0.5, "#2a1006");
        rightGrad.addColorStop(1, "#0f0503");
        ctx.fillStyle = rightGrad;
        ctx.fillRect(W * 0.5, 0, W * 0.5, H);
      }

      drawHexGrid();

      const nodes = nodesRef.current;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 110;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.25;
            const posRatio = isMobile
              ? (nodes[i].y + nodes[j].y) / (2 * H)
              : (nodes[i].x + nodes[j].x) / (2 * W);
            let color: string;
            if (posRatio < 0.44) color = `rgba(214,238,255,${alpha * 0.6})`;
            else if (posRatio > 0.56) color = `rgba(234,180,255,${alpha * 0.7})`;
            else color = `rgba(255,255,255,${alpha * 0.8})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = color;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        n.pulse += n.pulseSpeed;
        const pulseFactor = 0.7 + 0.3 * Math.sin(n.pulse);

        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3);
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * pulseFactor, 0, Math.PI * 2);
        ctx.fill();

        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -10 || n.x > W + 10) n.vx *= -1;
        if (n.y < -10 || n.y > H + 10) n.vy *= -1;
      }

      if (isMobile) {
        const blendGrad = ctx.createLinearGradient(0, H * 0.38, 0, H * 0.62);
        blendGrad.addColorStop(0, "rgba(125,211,252,0)");
        blendGrad.addColorStop(0.3, "rgba(125,211,252,0.045)");
        blendGrad.addColorStop(0.5, "rgba(255,255,255,0.055)");
        blendGrad.addColorStop(0.7, "rgba(234,94,255,0.045)");
        blendGrad.addColorStop(1, "rgba(234,94,255,0)");
        ctx.fillStyle = blendGrad;
        ctx.fillRect(0, H * 0.38, W, H * 0.24);
      } else {
        const blendGrad = ctx.createLinearGradient(W * 0.38, 0, W * 0.62, 0);
        blendGrad.addColorStop(0, "rgba(125,211,252,0)");
        blendGrad.addColorStop(0.3, "rgba(125,211,252,0.045)");
        blendGrad.addColorStop(0.5, "rgba(255,255,255,0.055)");
        blendGrad.addColorStop(0.7, "rgba(255,91,57,0.045)");
        blendGrad.addColorStop(1, "rgba(255,91,57,0)");
        ctx.fillStyle = blendGrad;
        ctx.fillRect(W * 0.38, 0, W * 0.24, H);
      }

      animRef.current = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ─── Typewriter Heading ───────────────────────────────────────────────────────

function TypewriterHeading({
  text,
  style,
  className,
}: {
  text: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    setDisplayed("");
    const intervalTime = 900 / text.length;
    const t = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(t);
    }, intervalTime);
    return () => clearInterval(t);
  }, [text]);
  return (
    <h1 className={className} style={style}>
      {displayed}
    </h1>
  );
}

// ─── Background Terminal Code Stream ─────────────────────────────────────────

function BackgroundCode({
  lines,
  color,
  speed = 14,
}: {
  lines: string[];
  color: string;
  speed?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayedLines, setDisplayedLines] = useState<string[]>([""]);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (el && displayedLines.length > 2) {
      if (el.scrollHeight > el.clientHeight) {
        setDisplayedLines([""]);
        setLineIdx(0);
        setCharIdx(0);
      }
    }
  }, [displayedLines, charIdx]);

  useEffect(() => {
    if (lineIdx >= lines.length) {
      setDisplayedLines([""]);
      setLineIdx(0);
      setCharIdx(0);
      return;
    }

    const currentLine = lines[lineIdx];
    if (charIdx <= currentLine.length) {
      const timer = setTimeout(() => {
        setDisplayedLines((prev) => {
          const next = [...prev];
          next[lineIdx] = currentLine.slice(0, charIdx);
          return next;
        });
        setCharIdx((c) => c + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else {
      setDisplayedLines((prev) => [...prev, ""]);
      setLineIdx((l) => l + 1);
      setCharIdx(0);
    }
  }, [charIdx, lineIdx, lines, speed]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 p-6 sm:p-8 md:p-10 pointer-events-none overflow-hidden select-none"
      style={{
        fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
        fontSize: "clamp(9.5px, 0.85vw, 11px)",
        lineHeight: "1.55",
        color,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        letterSpacing: "0.01em",
      }}
    >
      {displayedLines.map((line, i) => (
        <div key={i} className="min-h-[1.55em]">
          {line}
          {i === displayedLines.length - 1 && (
            <span
              className="inline-block w-2 h-3.5 ml-1 align-middle opacity-75 animate-pulse"
              style={{ backgroundColor: color }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Query & Procedure Code Datasets ──────────────────────────────────────────

const SQL_LINES = [
  "SELECT e.emp_id, e.name, e.salary, e.hire_date,",
  "       d.dept_name, d.region, d.budget,",
  "       COUNT(p.project_id) AS total_projects,",
  "       SUM(p.revenue)      AS total_revenue,",
  "       AVG(p.duration_days) AS avg_duration",
  "FROM   employees e",
  "JOIN   departments d  ON e.dept_id  = d.id",
  "LEFT   JOIN projects p ON e.emp_id  = p.lead_id",
  "WHERE  e.status = 'ACTIVE'",
  "  AND  d.region IN ('APAC', 'EMEA', 'AMER')",
  "  AND  e.hire_date < SYSDATE - INTERVAL '2' YEAR",
  "GROUP  BY e.emp_id, e.name, e.salary, e.hire_date,",
  "          d.dept_name, d.region, d.budget",
  "HAVING COUNT(p.project_id) > 2",
  "ORDER  BY total_revenue DESC, e.salary DESC",
  "FETCH  FIRST 50 ROWS ONLY;",
  "",
  "WITH monthly_sales AS (",
  "  SELECT  product_id,",
  "          TRUNC(sale_date, 'MM') AS month,",
  "          SUM(quantity)          AS units_sold,",
  "          SUM(amount)            AS revenue",
  "  FROM    sales_records",
  "  WHERE   sale_date >= ADD_MONTHS(SYSDATE, -12)",
  "  GROUP   BY product_id, TRUNC(sale_date, 'MM')",
  "),",
  "ranked_products AS (",
  "  SELECT  product_id, month, units_sold, revenue,",
  "          RANK() OVER (",
  "            PARTITION BY month",
  "            ORDER BY revenue DESC",
  "          ) AS rank_in_month",
  "  FROM    monthly_sales",
  ")",
  "SELECT  p.product_name, r.month,",
  "        r.units_sold,  r.revenue,",
  "        r.rank_in_month",
  "FROM    ranked_products r",
  "JOIN    products p ON r.product_id = p.id",
  "WHERE   r.rank_in_month <= 5",
  "ORDER   BY r.month DESC, r.rank_in_month;",
  "",
  "SELECT  a.account_id, a.holder_name,",
  "        a.balance,    a.account_type,",
  "        t.txn_id,     t.txn_date,",
  "        t.amount,     t.status,",
  "        t.channel",
  "FROM    accounts     a",
  "INNER   JOIN transactions t",
  "        ON  a.account_id = t.account_id",
  "WHERE   t.txn_date  >= DATE '2024-01-01'",
  "  AND   t.status    NOT IN ('CANCELLED','PENDING')",
  "  AND   a.balance   > 5000",
  "  AND   t.channel   = 'ONLINE'",
  "ORDER   BY t.txn_date DESC, t.amount DESC;",
  "",
  "SELECT  d.dept_name,",
  "        COUNT(e.emp_id)      AS headcount,",
  "        AVG(e.salary)        AS avg_salary,",
  "        MIN(e.salary)        AS min_salary,",
  "        MAX(e.salary)        AS max_salary,",
  "        SUM(e.salary)        AS payroll",
  "FROM    departments d",
  "JOIN    employees   e ON d.id = e.dept_id",
  "WHERE   e.hire_date < DATE '2020-01-01'",
  "  AND   e.status = 'ACTIVE'",
  "GROUP   BY d.dept_name",
  "ORDER   BY payroll DESC;",
];

const PLSQL_LINES = [
  "CREATE OR REPLACE PROCEDURE sync_balances(",
  "  p_account_id  IN  NUMBER,",
  "  p_currency    IN  VARCHAR2 DEFAULT 'USD',",
  "  p_result      OUT VARCHAR2",
  ") IS",
  "  v_balance     NUMBER  := 0;",
  "  v_threshold   CONSTANT NUMBER := 1000;",
  "  v_fx_rate     NUMBER  := 1;",
  "  v_count       NUMBER;",
  "BEGIN",
  "  SELECT NVL(SUM(amount), 0)",
  "    INTO v_balance",
  "    FROM transactions",
  "   WHERE account_id = p_account_id",
  "     AND status     = 'POSTED';",
  "  IF p_currency <> 'USD' THEN",
  "    SELECT rate INTO v_fx_rate",
  "      FROM fx_rates",
  "     WHERE base = 'USD'",
  "       AND quote = p_currency;",
  "    v_balance := v_balance * v_fx_rate;",
  "  END IF;",
  "  IF v_balance < v_threshold THEN",
  "    send_alert(p_account_id, v_balance);",
  "  END IF;",
  "  p_result := 'OK: ' || ROUND(v_balance, 2);",
  "EXCEPTION",
  "  WHEN NO_DATA_FOUND THEN",
  "    p_result := 'NO_DATA';",
  "  WHEN OTHERS THEN",
  "    p_result := 'ERR: ' || SQLERRM;",
  "    ROLLBACK;",
  "END sync_balances;",
  "/",
  "",
  "CREATE OR REPLACE FUNCTION get_employee_rank(",
  "  p_emp_id IN NUMBER",
  ") RETURN VARCHAR2 IS",
  "  v_rank    VARCHAR2(50);",
  "  v_salary  NUMBER;",
  "  v_yrs     NUMBER;",
  "BEGIN",
  "  SELECT salary,",
  "         MONTHS_BETWEEN(SYSDATE, hire_date) / 12",
  "    INTO v_salary, v_yrs",
  "    FROM employees",
  "   WHERE emp_id = p_emp_id;",
  "  IF    v_salary >= 120000 AND v_yrs >= 5 THEN",
  "    v_rank := 'PRINCIPAL';",
  "  ELSIF v_salary >= 90000  THEN",
  "    v_rank := 'SENIOR';",
  "  ELSIF v_salary >= 60000  THEN",
  "    v_rank := 'MID';",
  "  ELSE",
  "    v_rank := 'JUNIOR';",
  "  END IF;",
  "  RETURN v_rank;",
  "EXCEPTION",
  "  WHEN NO_DATA_FOUND THEN RETURN 'UNKNOWN';",
  "END get_employee_rank;",
  "/",
  "",
  "CREATE OR REPLACE TRIGGER audit_salary_changes",
  "BEFORE UPDATE OF salary ON employees",
  "FOR EACH ROW",
  "DECLARE",
  "  v_pct NUMBER;",
  "BEGIN",
  "  v_pct := (:NEW.salary - :OLD.salary)",
  "           / NULLIF(:OLD.salary, 0) * 100;",
  "  INSERT INTO salary_audit(",
  "    emp_id, old_salary, new_salary,",
  "    pct_change, changed_by, changed_at",
  "  ) VALUES (",
  "    :OLD.emp_id, :OLD.salary, :NEW.salary,",
  "    ROUND(v_pct, 2), SYS_CONTEXT('USERENV','SESSION_USER'),",
  "    SYSDATE",
  "  );",
  "  IF v_pct > 50 THEN",
  "    RAISE_APPLICATION_ERROR(",
  "      -20001, 'Salary increase exceeds 50%');",
  "  END IF;",
  "END;",
  "/",
];

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <>
      {/* Desktop Vertical Divider */}
      <div
        className="hidden md:flex absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-20 flex-col items-center pointer-events-none"
        style={{ width: "3px" }}
      >
        <div
          className="divider-glow w-full flex-1"
          style={{
            background:
              "linear-gradient(to bottom, rgba(214,238,255,0.18) 0%, rgba(214,238,255,0.75) 30%, rgba(255,255,255,0.95) 50%, rgba(239, 197, 232, 1) 70%, rgba(198, 71, 170, 0.83) 100%)",
          }}
        />
      </div>

      {/* Mobile Horizontal Divider */}
      <div className="flex md:hidden absolute left-0 right-0 top-1/2 -translate-y-1/2 z-20 items-center justify-center pointer-events-none px-4">
        <div
          className="relative w-full h-[2px]"
          style={{
            background:
              "linear-gradient(to right, rgba(56,189,248,0.05) 0%, rgba(125,211,252,0.85) 30%, rgba(255,255,255,0.95) 50%, rgba(234,94,255,0.85) 70%, rgba(198,71,170,0.05) 100%)",
            boxShadow:
              "0 0 10px rgba(125,211,252,0.6), 0 0 20px rgba(234,94,255,0.4)",
          }}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#ffffff,0_0_16px_#38bdf8,0_0_16px_#ea5eff]" />
        </div>
      </div>
    </>
  );
}

// ─── Flow Particles ───────────────────────────────────────────────────────────

const PARTICLES = [
  {
    id: 0,
    left: "8%",
    duration: "8.4s",
    delay: "0.5s",
    size: 1.8,
    color: "rgba(56,189,248,0.75)",
  },
  {
    id: 1,
    left: "16%",
    duration: "11.2s",
    delay: "2.1s",
    size: 2.4,
    color: "rgba(56,189,248,0.75)",
  },
  {
    id: 2,
    left: "24%",
    duration: "7.6s",
    delay: "1.4s",
    size: 1.5,
    color: "rgba(56,189,248,0.75)",
  },
  {
    id: 3,
    left: "32%",
    duration: "12.8s",
    delay: "3.7s",
    size: 2.9,
    color: "rgba(56,189,248,0.75)",
  },
  {
    id: 4,
    left: "40%",
    duration: "9.5s",
    delay: "0.9s",
    size: 1.7,
    color: "rgba(56,189,248,0.75)",
  },
  {
    id: 5,
    left: "48%",
    duration: "10.4s",
    delay: "4.2s",
    size: 2.2,
    color: "rgba(56,189,248,0.75)",
  },
  {
    id: 6,
    left: "52%",
    duration: "8.9s",
    delay: "1.8s",
    size: 2.6,
    color: "rgba(239, 197, 232, 1)",
  },
  {
    id: 7,
    left: "60%",
    duration: "13.1s",
    delay: "3.2s",
    size: 1.6,
    color: "rgba(239, 197, 232, 1)",
  },
  {
    id: 8,
    left: "68%",
    duration: "7.8s",
    delay: "0.3s",
    size: 2.1,
    color: "rgba(239, 197, 232, 1)",
  },
  {
    id: 9,
    left: "76%",
    duration: "11.7s",
    delay: "4.8s",
    size: 2.8,
    color: "rgba(239, 197, 232, 1)",
  },
  {
    id: 10,
    left: "84%",
    duration: "9.1s",
    delay: "2.5s",
    size: 1.9,
    color: "rgba(239, 197, 232, 1)",
  },
  {
    id: 11,
    left: "92%",
    duration: "12.3s",
    delay: "1.1s",
    size: 2.5,
    color: "rgba(239, 197, 232, 1)",
  },
];

function FlowParticles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-5">
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="flow-particle absolute rounded-full"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size * 12}px`,
            background: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<"split" | "sql" | "plsql">("split");
  const [plsqlToast, setPlsqlToast] = useState(false);
  const sqlRef = useRef<HTMLDivElement>(null);
  const plsqlRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative w-full h-screen h-[100dvh] overflow-hidden select-none bg-[#050810]"
      style={{ fontFamily: "'Outfit', var(--font-geist-sans), sans-serif" }}
    >
      <DBCanvas />
      <FlowParticles />

      {plsqlToast && (
        <div
          className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium shadow-[0_0_30px_rgba(255,91,57,0.35)] flex items-center gap-3 backdrop-blur-md animate-bounce"
          style={{
            background: "rgba(26,10,6,0.95)",
            border: "1px solid rgba(255,91,57,0.45)",
            color: "#FFD3C2",
          }}
        >
          <span className="text-base">⚡</span>
          <span>
            The PL/SQL workspace is still being built — SQL is ready now.
          </span>
          <button
            type="button"
            onClick={() => setPlsqlToast(false)}
            className="ml-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-300 rounded"
            style={{ color: "#FF8B5E" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main split container: vertical column on mobile, horizontal row on desktop */}
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row pb-0 md:pb-[72px] overflow-hidden">
        {/* ── TOP (mobile) / LEFT (desktop): SQL ── */}
        <div
          ref={sqlRef}
          className="relative flex-1 min-h-0 min-w-0 flex flex-col items-center justify-center px-4 sm:px-8 md:px-12 transition-all duration-700 ease-in-out"
          style={{
            flex:
              view === "sql"
                ? "1 0 100%"
                : view === "plsql"
                  ? "0 0 0%"
                  : "1 1 50%",
            opacity: view === "plsql" ? 0 : 1,
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: "#081221", opacity: 0.45 }}
          />

          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ filter: "blur(1.5px)", opacity: 0.32 }}
          >
            <BackgroundCode lines={SQL_LINES} color="#BFE3FF" />
          </div>

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(56,189,248,0.14) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10 w-full max-w-lg space-y-2.5 sm:space-y-4 md:space-y-8 flex flex-col items-center py-2">
            <div className="flex justify-center">
              <span
                className="text-[10px] sm:text-xs px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border backdrop-blur-md"
                style={{
                  color: "#E2F7FF",
                  borderColor: "rgba(125,211,252,0.35)",
                  background: "rgba(125,211,252,0.08)",
                  fontFamily:
                    "'JetBrains Mono', var(--font-geist-mono), monospace",
                  letterSpacing: "0.03em",
                }}
              >
                Structured Query Language
              </span>
            </div>

            <div className="text-center">
              <TypewriterHeading
                text="SQL"
                className="font-bold leading-none tracking-tight"
                style={{
                  fontSize: "clamp(2.75rem, 6.5vh, 6rem)",
                  color: "#F3FBFF",
                  textShadow:
                    "0 0 50px rgba(125,211,252,0.5), 0 0 100px rgba(56,189,248,0.2)",
                }}
              />
              <p
                className="mt-1.5 sm:mt-3 text-xs sm:text-sm md:text-base font-light tracking-wide max-w-sm mx-auto"
                style={{ color: "rgba(226,247,255,0.85)" }}
              >
                Describe what you want.
              </p>
            </div>

            {/* Mobile SQL Action Button */}
            <div className="flex md:hidden justify-center pt-1.5 w-full">
              <Link
                href="/sql"
                className="group inline-flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 active:scale-95 text-[#F3FBFF]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(14, 165, 233, 0.22) 0%, rgba(8, 18, 33, 0.9) 100%)",
                  border: "1px solid rgba(125, 211, 252, 0.4)",
                  boxShadow:
                    "0 0 20px rgba(56, 189, 248, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(16px)",
                  fontFamily:
                    "'JetBrains Mono', var(--font-geist-mono), monospace",
                }}
              >
                <span>Start querying</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="group-hover:translate-x-1 group-active:translate-x-1 transition-transform"
                >
                  <path
                    d="M7 2l5 5-5 5M2 7h10"
                    stroke="#F3FBFF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* ── DIVIDER (Horizontal on Mobile, Vertical on Desktop) ── */}
        <div
          className="transition-opacity duration-700"
          style={{ opacity: view === "split" ? 1 : 0 }}
        >
          <Divider />
        </div>

        {/* ── BOTTOM (mobile) / RIGHT (desktop): PL/SQL ── */}
        <div
          ref={plsqlRef}
          className="relative flex-1 min-h-0 min-w-0 flex flex-col items-center justify-center px-4 sm:px-8 md:px-12 transition-all duration-700 ease-in-out"
          style={{
            flex:
              view === "plsql"
                ? "1 0 100%"
                : view === "sql"
                  ? "0 0 0%"
                  : "1 1 50%",
            opacity: view === "sql" ? 0 : 1,
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: "#4808a3a6", opacity: 0.45 }}
          />

          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ filter: "blur(1.5px)", opacity: 0.32 }}
          >
            <BackgroundCode lines={PLSQL_LINES} color="#FFB199" />
          </div>

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(234,94,255,0.14) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10 w-full max-w-lg space-y-2.5 sm:space-y-4 md:space-y-8 flex flex-col items-center py-2">
            <div className="flex justify-center">
              <span
                className="text-[10px] sm:text-xs px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border backdrop-blur-md"
                style={{
                  color: "#FFFFFF",
                  borderColor: "rgba(234,94,255,0.35)",
                  background: "rgba(210,129,228,0.15)",
                  fontFamily:
                    "'JetBrains Mono', var(--font-geist-mono), monospace",
                  letterSpacing: "0.03em",
                }}
              >
                Oracle&apos;s procedural extension to SQL
              </span>
            </div>

            <div className="text-center">
              <TypewriterHeading
                text="PL/SQL"
                className="font-bold leading-none tracking-tight"
                style={{
                  fontSize: "clamp(2.75rem, 6.5vh, 6rem)",
                  color: "#fce3f0",
                  textShadow:
                    "0 0 60px rgba(239, 197, 232, .5), 0 0 120px rgba(184, 64, 164, 0.5)",
                }}
              />
              <p
                className="mt-1.5 sm:mt-3 text-xs sm:text-sm md:text-base font-light tracking-wide max-w-sm mx-auto"
                style={{ color: "rgba(239, 197, 232, 1)" }}
              >
                Define how it happens.
              </p>
            </div>

            {/* Mobile PL/SQL Action Button */}
            <div className="flex md:hidden justify-center pt-1.5 w-full">
              <Link
                href="/plsql"
                className="group inline-flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 active:scale-95 text-[#fce3f0]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(40, 9, 52, 0.9) 100%)",
                  border: "1px solid rgba(234, 94, 255, 0.4)",
                  boxShadow:
                    "0 0 20px rgba(210, 129, 228, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(16px)",
                  fontFamily:
                    "'JetBrains Mono', var(--font-geist-mono), monospace",
                }}
              >
                <span>Start scripting</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="group-hover:translate-x-1 group-active:translate-x-1 transition-transform"
                >
                  <path
                    d="M7 2l5 5-5 5M2 7h10"
                    stroke="#fce3f0"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom CTA Buttons (Desktop Only) ── */}
      <div
        className="hidden md:flex absolute bottom-0 left-0 right-0 z-30"
        style={{ height: "72px" }}
      >
        {/* SQL Button */}
        <Link
          href="/sql"
          className="flex-1 flex items-center justify-center gap-3 text-sm font-semibold transition-all duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-inset"
          style={{
            background: "rgba(8,18,33,0.88)",
            borderTop: "1px solid rgba(125,211,252,0.25)",
            color: "#F3FBFF",
            fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
            backdropFilter: "blur(16px)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(125,211,252,0.12)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(8,18,33,0.88)";
          }}
        >
          Start querying
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            style={{ opacity: 0.9 }}
            className="group-hover:translate-x-1 transition-transform"
          >
            <path
              d="M7 2l5 5-5 5M2 7h10"
              stroke="#F3FBFF"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </Link>

        <div
          className="flex items-center justify-center"
          style={{
            width: "3px",
            background:
              "linear-gradient(to bottom, rgba(125,211,252,0.5), rgba(255,91,57,0.55))",
          }}
        />

        {/* PL/SQL Button */}
        <Link
          href="/plsql"
          className="flex-1 flex items-center justify-center gap-3 text-sm font-semibold transition-all duration-300 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-inset"
          style={{
            background: "#280934",
            borderTop: "1px solid #8d42aaff",
            color: "rgba(243, 223, 240, 1)",
            fontFamily: "'JetBrains Mono', var(--font-geist-mono), monospace",
            backdropFilter: "blur(16px)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(83, 31, 102, .8)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "#280934";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            style={{ opacity: 0.8, transform: "rotate(180deg)" }}
            className="group-hover:-translate-x-1 transition-transform"
          >
            <path
              d="M7 2l5 5-5 5M2 7h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Start scripting
        </Link>
      </div>
    </div>
  );
}
