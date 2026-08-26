"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SCHEMA, erDiagramMermaid } from "@/lib/schema";
import { executeSQL, type PipelineStep, type Row } from "@/lib/sqlEngine";
import { nlToSQL } from "@/lib/nlToSql";
import { EXAMPLES } from "@/lib/examples";

interface HistoryItem {
  id: number;
  question: string;
  sql: string;
  rows: number;
  time: string;
}

const STAGE_COLORS: Record<string, string> = {
  FROM: "bg-sky-500",
  JOIN: "bg-cyan-500",
  WHERE: "bg-amber-500",
  "GROUP BY": "bg-violet-500",
  HAVING: "bg-fuchsia-500",
  AGGREGATE: "bg-emerald-500",
  SELECT: "bg-emerald-500",
  "ORDER BY": "bg-orange-500",
  LIMIT: "bg-rose-500",
};

export default function Home() {
  const [dark, setDark] = useState(false);
  const [nlInput, setNlInput] = useState("");
  const [sql, setSql] = useState(
    "SELECT name, city FROM customers WHERE city = 'Mumbai';",
  );
  const [nlInfo, setNlInfo] = useState<ReturnType<typeof nlToSQL> | null>(null);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [finalRows, setFinalRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const h = localStorage.getItem("nlp-sql-history");
      return h ? (JSON.parse(h) as HistoryItem[]) : [];
    } catch {
      return [];
    }
  });
  const [tab, setTab] = useState<"result" | "schema" | "theory">("result");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const runQuery = useCallback(
    (query?: string, question?: string) => {
      const q = (query ?? sql).trim();
      if (timer.current) clearInterval(timer.current);
      setPlaying(false);
      const res = executeSQL(q);
      setSteps(res.steps);
      setFinalRows(res.finalRows);
      setColumns(res.columns);
      setError(res.error);
      setActiveStep(0);
      if (!res.error && res.steps.length) {
        const item: HistoryItem = {
          id: Date.now(),
          question: question ?? nlInput ?? q,
          sql: q,
          rows: res.finalRows.length,
          time: new Date().toLocaleTimeString(),
        };
        setHistory((prev) => {
          const next = [item, ...prev].slice(0, 30);
          try {
            localStorage.setItem("nlp-sql-history", JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    },
    [sql, nlInput],
  );

  const play = useCallback(() => {
    if (!steps.length) return;
    if (playing) {
      if (timer.current) clearInterval(timer.current);
      setPlaying(false);
      return;
    }
    setPlaying(true);
    let i = activeStep >= steps.length - 1 ? -1 : activeStep - 1;
    timer.current = setInterval(() => {
      i += 1;
      setActiveStep(i);
      if (i >= steps.length - 1) {
        if (timer.current) clearInterval(timer.current);
        setPlaying(false);
      }
    }, 1200);
  }, [steps, playing, activeStep]);

  useEffect(
    () => () => void (timer.current && clearInterval(timer.current)),
    [],
  );

  const translateNL = useCallback(() => {
    const info = nlToSQL(nlInput);
    setNlInfo(info);
    if (info.sql) runQuery(info.sql, nlInput);
  }, [nlInput, runQuery]);

  const exportCSV = useCallback(() => {
    if (!finalRows.length) return;
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      columns.map(esc).join(","),
      ...finalRows.map((r) => columns.map((c) => esc(r[c])).join(",")),
    ].join("\n");
    download(new Blob([csv], { type: "text/csv" }), "results.csv");
  }, [finalRows, columns]);

  const exportReport = useCallback(() => {
    const md = [
      "# NL→SQL Execution Report",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Query",
      "```sql\n" + sql + "\n```",
      error ? `\n**Error:** ${error}` : "",
      "",
      "## Pipeline Steps",
      ...steps.map(
        (s, i) =>
          `${i + 1}. **${s.stage}** — ${s.title}: ${s.detail} (${s.rowCount} rows)`,
      ),
      "",
      "## Final Result",
      "| " + columns.join(" | ") + " |",
      "|" + columns.map(() => "---").join("|") + "|",
      ...finalRows.map(
        (r) => "| " + columns.map((c) => r[c] ?? "").join(" | ") + " |",
      ),
    ].join("\n");
    download(new Blob([md], { type: "text/markdown" }), "report.md");
  }, [sql, steps, finalRows, columns, error]);

  const mermaidSrc = useMemo(() => erDiagramMermaid(), []);
  const current = steps[activeStep];

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <h1 className="text-lg font-bold">
          🗣️→🗄️ NL→SQL Visualizer
          <span className="ml-2 text-xs font-normal opacity-60">
            Natural Language to SQL, step by step
          </span>
        </h1>
        <button
          onClick={() => setDark((d) => !d)}
          className="px-3 py-1.5 rounded-lg text-sm panel hover:opacity-80"
          aria-label="Toggle dark mode"
        >
          {dark ? "☀️ Light" : "🌙 Dark"}
        </button>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr_340px] gap-4 p-4">
        {/* LEFT: input */}
        <section
          className="panel p-4 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-5rem)]"
          aria-label="Input panel"
        >
          <div>
            <h2 className="font-semibold mb-2">1. Ask in Natural Language</h2>
            <textarea
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              placeholder='e.g. "How many customers are there?"'
              rows={2}
              className="w-full panel p-2 text-sm resize-y"
              aria-label="Natural language input"
            />
            <button
              onClick={translateNL}
              disabled={!nlInput.trim()}
              className="mt-2 w-full py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              Translate & Run ▶
            </button>
            {nlInfo && (
              <div className="mt-2 text-xs space-y-1">
                <p>
                  Confidence:{" "}
                  <span className="font-mono">
                    {(nlInfo.confidence * 100).toFixed(0)}%
                  </span>
                </p>
                <p className="opacity-70">{nlInfo.interpretation}</p>
                {nlInfo.matchedRules.length > 0 && (
                  <p className="font-mono opacity-60">
                    rules: {nlInfo.matchedRules.join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-semibold mb-2">2. Or write SQL directly</h2>
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              rows={4}
              spellCheck={false}
              className="w-full panel p-2 text-sm font-mono resize-y"
              aria-label="SQL query"
            />
            <button
              onClick={() => runQuery()}
              className="mt-2 w-full py-2 rounded-lg text-sm font-medium panel hover:opacity-80"
            >
              Execute SQL ⚡
            </button>
            {error && (
              <p role="alert" className="mt-2 text-xs text-red-500 font-mono">
                ✗ {error}
              </p>
            )}
          </div>

          <div>
            <h2 className="font-semibold mb-2">Sample Inputs</h2>
            <ul className="space-y-1.5">
              {EXAMPLES.map((ex) => (
                <li key={ex.id}>
                  <button
                    onClick={() => {
                      setNlInput(ex.question);
                      setSql(ex.sql);
                      runQuery(ex.sql, ex.question);
                    }}
                    className="w-full text-left text-xs panel px-2 py-1.5 hover:opacity-75"
                    title={`Expected: ${ex.expected}`}
                  >
                    <span className="opacity-50 mr-1">{ex.id}.</span>{" "}
                    {ex.question}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-semibold mb-2">History</h2>
            {history.length === 0 && (
              <p className="text-xs opacity-50">No queries yet.</p>
            )}
            <ul className="space-y-1">
              {history.slice(0, 8).map((h) => (
                <li key={h.id}>
                  <button
                    onClick={() => {
                      setSql(h.sql);
                      runQuery(h.sql, h.question);
                    }}
                    className="w-full text-left text-xs panel px-2 py-1.5 hover:opacity-75 truncate"
                  >
                    <span className="opacity-50">
                      {h.time} · {h.rows} rows
                    </span>
                    <br />
                    {h.question}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CENTER: visualization */}
        <section
          className="flex flex-col gap-4 min-w-0"
          aria-label="Visualization panel"
        >
          <div className="flex gap-2">
            {(["result", "schema", "theory"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize ${tab === t ? "text-white" : "panel"}`}
                style={tab === t ? { background: "var(--accent)" } : undefined}
              >
                {t === "result"
                  ? "Pipeline & Result"
                  : t === "schema"
                    ? "Schema / ER"
                    : "Theory"}
              </button>
            ))}
          </div>

          {tab === "result" && (
            <>
              <div className="panel p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm">Execution Pipeline</h2>
                  <button
                    onClick={play}
                    disabled={!steps.length}
                    className="px-3 py-1 rounded-lg text-xs text-white disabled:opacity-40"
                    style={{ background: "var(--accent)" }}
                  >
                    {playing ? "⏸ Pause" : "▶ Animate"}
                  </button>
                </div>
                {steps.length === 0 ? (
                  <p className="text-sm opacity-50">
                    Run a query to see its execution plan.
                  </p>
                ) : (
                  <ol className="flex flex-wrap gap-2" role="list">
                    {steps.map((s, i) => (
                      <li key={i}>
                        <button
                          onClick={() => setActiveStep(i)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono text-white transition-transform ${
                            i === activeStep
                              ? "scale-110 ring-2 ring-offset-2"
                              : "opacity-60"
                          } ${STAGE_COLORS[s.stage] ?? "bg-slate-500"}`}
                        >
                          {s.stage}
                          <span className="ml-1 opacity-80">
                            ({s.rowCount})
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {current && (
                <div className="panel p-4">
                  <h3 className="font-semibold text-sm mb-1">
                    Step {activeStep + 1}/{steps.length}: {current.title}
                  </h3>
                  <p className="text-xs opacity-70 mb-3">{current.detail}</p>
                  <StepTable step={current} />
                </div>
              )}

              {!error && finalRows.length > 0 && (
                <div className="panel p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">
                      Final Result ({finalRows.length} row
                      {finalRows.length !== 1 && "s"})
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={exportCSV}
                        className="text-xs panel px-2 py-1 hover:opacity-75"
                      >
                        ⬇ CSV
                      </button>
                      <button
                        onClick={exportReport}
                        className="text-xs panel px-2 py-1 hover:opacity-75"
                      >
                        ⬇ Report
                      </button>
                    </div>
                  </div>
                  <ResultTable rows={finalRows} cols={columns} />
                </div>
              )}
            </>
          )}

          {tab === "schema" && (
            <div className="panel p-4 overflow-auto">
              <h2 className="font-semibold mb-3">Database Schema</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SCHEMA.map((t) => (
                  <div key={t.name} className="panel p-3">
                    <h3 className="font-mono font-semibold text-sm mb-1">
                      {t.name}
                    </h3>
                    <table className="text-xs w-full">
                      <tbody>
                        {t.columns.map((c) => (
                          <tr key={c.name}>
                            <td className="py-0.5 pr-2 font-mono">{c.name}</td>
                            <td className="opacity-60">{c.type}</td>
                            <td className="text-right">
                              {c.pk && (
                                <span className="text-amber-500">PK </span>
                              )}
                              {c.fk && (
                                <span className="text-sky-400">
                                  FK→{c.fk.table}.{c.fk.column}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs opacity-50 mt-1">
                      {t.rows.length} sample rows
                    </p>
                  </div>
                ))}
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold">
                  Mermaid ER source
                </summary>
                <pre className="text-xs mt-2 overflow-x-auto panel p-2 whitespace-pre-wrap">
                  {mermaidSrc}
                </pre>
              </details>
            </div>
          )}

          {tab === "theory" && <Theory />}
        </section>

        {/* RIGHT: explanation */}
        <aside
          className="panel p-4 overflow-y-auto max-h-[calc(100vh-5rem)]"
          aria-label="Explanation panel"
        >
          <h2 className="font-semibold mb-2">Explanation</h2>
          {!current && !error && (
            <p className="text-sm opacity-60">
              Run a query and each pipeline stage will be explained here in
              plain English, including the relational algebra operator and its
              complexity.
            </p>
          )}
          {error && (
            <div className="text-sm">
              <p className="text-red-500 font-medium">Validation failed</p>
              <p className="opacity-70 mt-1">{error}</p>
              <p className="opacity-60 mt-2 text-xs">
                Supported subset: single-table or JOINed SELECT with one WHERE
                condition, GROUP BY, HAVING AGG(*) op N, ORDER BY, LIMIT.
              </p>
            </div>
          )}
          {current && (
            <div className="space-y-3 text-sm">
              <div>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs text-white ${STAGE_COLORS[current.stage] ?? "bg-slate-500"}`}
                >
                  {current.stage}
                </span>
                <h3 className="font-semibold mt-2">{current.title}</h3>
              </div>
              <ExplainStage
                stage={current.stage}
                detail={current.detail}
                rowCount={current.rowCount}
              />
              <div
                className="border-t pt-3"
                style={{ borderColor: "var(--border)" }}
              >
                <h4 className="text-xs font-semibold uppercase opacity-60 mb-1">
                  Relational algebra
                </h4>
                <p className="font-mono text-xs">{algebraFor(current.stage)}</p>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

function StepTable({ step }: { step: PipelineStep }) {
  if (!step.rows.length)
    return <p className="text-xs opacity-50 italic">No rows at this stage.</p>;
  return (
    <div className="overflow-x-auto max-h-56">
      <table className="text-xs w-full border-collapse">
        <thead>
          <tr>
            {step.columns.map((c) => (
              <th
                key={c}
                className="text-left px-2 py-1 border-b font-mono"
                style={{ borderColor: "var(--border)" }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {step.rows.slice(0, 20).map((r, i) => (
            <tr key={i}>
              {step.columns.map((c) => (
                <td
                  key={c}
                  className="px-2 py-1 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  {String(r[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {step.rows.length > 20 && (
        <p className="text-xs opacity-50 mt-1">
          …showing first 20 of {step.rows.length}
        </p>
      )}
    </div>
  );
}

function ResultTable({ rows, cols }: { rows: Row[]; cols: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="text-xs w-full border-collapse">
        <thead>
          <tr style={{ background: "var(--background)" }}>
            {cols.map((c) => (
              <th
                key={c}
                className="text-left px-2 py-1.5 border-b font-mono"
                style={{ borderColor: "var(--border)" }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="hover:opacity-80">
              {cols.map((c) => (
                <td
                  key={c}
                  className="px-2 py-1.5 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  {String(r[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExplainStage({
  stage,
  detail,
  rowCount,
}: {
  stage: string;
  detail: string;
  rowCount: number;
}) {
  const notes: Record<string, string> = {
    FROM: "The database first locates the table on disk and reads its pages into memory. Every subsequent operator works on this working set.",
    JOIN: "A join combines rows of two tables using a predicate. Nested-loop join is O(n·m); real engines use hash joins (O(n+m)) when indexes are absent.",
    WHERE:
      "Selection (σ) is a row filter — it removes tuples that fail the predicate but never changes their shape.",
    "GROUP BY":
      "Grouping partitions rows into buckets so aggregates can be computed per bucket, usually via hashing or sorting.",
    HAVING:
      "HAVING filters groups *after* aggregation, unlike WHERE which filters rows before it.",
    AGGREGATE:
      "Aggregates collapse many rows into one summary value per group — COUNT, SUM, AVG, MIN, MAX.",
    SELECT:
      "Projection (π) keeps only requested columns, reducing data shipped to the client.",
    "ORDER BY":
      "Sorting is typically an external merge sort, O(n log n), possibly spilling to disk for large inputs.",
    LIMIT:
      "LIMIT lets the engine stop early — combined with ORDER BY it enables efficient 'top-N' plans.",
  };
  return (
    <div className="space-y-2">
      <p>{detail}</p>
      <p className="opacity-70 text-xs">{notes[stage]}</p>
      <p className="text-xs">
        Rows after this stage: <strong>{rowCount}</strong>
      </p>
    </div>
  );
}

function algebraFor(stage: string): string {
  switch (stage) {
    case "FROM":
      return "R ← scan(table)";
    case "JOIN":
      return "R ← R ⋈ S";
    case "WHERE":
      return "R ← σ_condition(R)";
    case "GROUP BY":
      return "R ← γ_group-cols(R)";
    case "HAVING":
      return "R ← σ_agg-condition(γ(R))";
    case "AGGREGATE":
      return "R ← γ_aggs(R)";
    case "SELECT":
      return "R ← π_attrs(R)";
    case "ORDER BY":
      return "R ← τ_key(R)";
    case "LIMIT":
      return "R ← top-N(R)";
    default:
      return "";
  }
}

function Theory() {
  return (
    <div className="panel p-4 text-sm space-y-4 leading-relaxed overflow-y-auto">
      <section>
        <h2 className="font-bold text-base mb-1">What is NL→SQL?</h2>
        <p>
          Natural Language to SQL (NL2SQL / Text-to-SQL) maps a free-form user
          question to a Structured Query Language statement that a relational
          DBMS can execute. It sits at the intersection of NLP (semantic
          parsing) and databases (query processing).
        </p>
      </section>
      <section>
        <h2 className="font-bold text-base mb-1">Key definitions</h2>
        <ul className="list-disc list-inside space-y-1 opacity-80">
          <li>
            <strong>Semantic parsing:</strong> converting natural language into
            a formal meaning representation (here, SQL).
          </li>
          <li>
            <strong>Schema linking:</strong> aligning phrases in the question to
            tables/columns (&quot;city&quot; → customers.city).
          </li>
          <li>
            <strong>Relational algebra:</strong> the theoretical foundation of
            SQL — operators π (project), σ (filter), ⋈ (join), γ (grouping).
          </li>
          <li>
            <strong>Logical plan:</strong> the ordered pipeline of operators the
            optimizer rearranges before execution.
          </li>
        </ul>
      </section>
      <section>
        <h2 className="font-bold text-base mb-1">Real-world use cases</h2>
        <ul className="list-disc list-inside space-y-1 opacity-80">
          <li>
            Business intelligence chatbots letting non-analysts query
            warehouses.
          </li>
          <li>
            Voice assistants over structured data (banking, retail dashboards).
          </li>
          <li>Internal admin consoles and data exploration tools.</li>
        </ul>
      </section>
      <section>
        <h2 className="font-bold text-base mb-1">Limitations</h2>
        <ul className="list-disc list-inside space-y-1 opacity-80">
          <li>
            Ambiguity: &quot;top products&quot; could mean by revenue, units, or
            rating.
          </li>
          <li>
            Schema mismatch: users say &quot;buyers&quot;, schema says
            &quot;customers&quot;.
          </li>
          <li>
            Complex SQL (subqueries, window functions, multi-hop joins) is hard
            to generate reliably.
          </li>
          <li>
            Security: generated SQL must be validated to prevent injection or
            data exfiltration.
          </li>
        </ul>
      </section>
      <section>
        <h2 className="font-bold text-base mb-1">
          Algorithms used here &amp; complexity
        </h2>
        <ul className="list-disc list-inside space-y-1 opacity-80">
          <li>
            NL translation: rule-based pattern matching — O(L) in question
            length; deterministic and explainable.
          </li>
          <li>
            Joins: nested-loop join O(n·m) (educational); production engines
            prefer hash join O(n+m).
          </li>
          <li>Filtering/projection: linear scans O(n).</li>
          <li>Grouping: hash aggregation, expected O(n).</li>
          <li>Sorting: comparison sort O(n log n).</li>
        </ul>
      </section>
      <section>
        <h2 className="font-bold text-base mb-1">Learning outcomes</h2>
        <ol className="list-decimal list-inside space-y-1 opacity-80">
          <li>
            Understand how a question becomes SQL via schema linking and intent
            detection.
          </li>
          <li>
            Implement/read a mini query engine whose stages mirror a real DBMS
            logical plan.
          </li>
          <li>
            Interpret the animated pipeline: watch row counts shrink through σ,
            γ, π, τ operators.
          </li>
        </ol>
      </section>
      <section>
        <h2 className="font-bold text-base mb-1">References</h2>
        <ul className="list-disc list-inside space-y-1 opacity-80 text-xs">
          <li>
            Silberschatz, Korth &amp; Sudarshan —{" "}
            <em>Database System Concepts</em>, 7th ed.
          </li>
          <li>
            Ramakrishnan &amp; Gehrke — <em>Database Management Systems</em>.
          </li>
          <li>
            Yu et al., &quot;Spider: A Large-Scale Human-Labeled Dataset for
            Complex Text-to-SQL Tasks&quot;, EMNLP 2018.
          </li>
          <li>ISO/IEC 9075 SQL standard documentation.</li>
        </ul>
      </section>
    </div>
  );
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
