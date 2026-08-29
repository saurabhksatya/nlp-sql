import { useEffect, useRef } from "react";
import type { Table } from "@/lib/schema";
import type { PipelineStep, Row } from "@/lib/sqlEngine";
import type { Tab, ThemeId } from "./nlSqlTypes";
import { Theory } from "./Theory";

function getStageBadgeClass(stage: string, theme: ThemeId = "eclipse"): string {
  if (theme === "volt") {
    switch (stage) {
      case "MUTATION":
      case "DELETE":
      case "DROP":
      case "LIMIT":
        return "bg-black text-[#ff3333] border-2 border-[#ff3333] font-bold";
      case "SELECT":
      case "COMMIT":
      case "DISTINCT":
      case "AGGREGATE":
        return "bg-black text-[#00ff66] border-2 border-[#00ff66] font-bold";
      default:
        return "bg-black text-[#ffff00] border-2 border-[#ffff00] font-bold";
    }
  }

  if (theme === "slate") {
    return "bg-zinc-800 text-zinc-100 border border-zinc-700 font-semibold";
  }

  if (theme === "lazuli") {
    switch (stage) {
      case "FROM":
      case "JOIN":
        return "bg-blue-600/90 text-white border border-blue-400/40";
      case "WHERE":
      case "HAVING":
        return "bg-indigo-600/90 text-white border border-indigo-400/40";
      case "SELECT":
      case "AGGREGATE":
        return "bg-sky-600/90 text-white border border-sky-400/40";
      default:
        return "bg-slate-700 text-slate-100 border border-slate-600";
    }
  }

  if (theme === "pearl") {
    switch (stage) {
      case "FROM":
      case "JOIN":
        return "bg-blue-600 text-white shadow-xs font-semibold";
      case "WHERE":
      case "HAVING":
        return "bg-indigo-600 text-white shadow-xs font-semibold";
      case "SELECT":
      case "AGGREGATE":
        return "bg-sky-600 text-white shadow-xs font-semibold";
      case "GROUP BY":
        return "bg-purple-600 text-white shadow-xs font-semibold";
      default:
        return "bg-slate-700 text-white shadow-xs font-semibold";
    }
  }

  // Default: Eclipse (matching user screenshot)
  const COLORFUL_MAP: Record<string, string> = {
    PARSER: "bg-blue-600 text-white shadow-xs",
    CATALOG: "bg-purple-600 text-white shadow-xs",
    CONSTRAINT: "bg-amber-600 text-white shadow-xs",
    MUTATION: "bg-rose-600 text-white shadow-xs",
    COMMIT: "bg-emerald-600 text-white shadow-xs",
    SCHEMA: "bg-indigo-600 text-white shadow-xs",
    FROM: "bg-sky-500 text-white shadow-xs",
    JOIN: "bg-cyan-500 text-white shadow-xs",
    WHERE: "bg-amber-500 text-white shadow-xs",
    "GROUP BY": "bg-violet-500 text-white shadow-xs",
    DISTINCT: "bg-indigo-500 text-white shadow-xs",
    HAVING: "bg-fuchsia-500 text-white shadow-xs",
    AGGREGATE: "bg-emerald-500 text-white shadow-xs",
    SELECT: "bg-emerald-500 text-white shadow-xs",
    "ORDER BY": "bg-orange-500 text-white shadow-xs",
    LIMIT: "bg-rose-500 text-white shadow-xs",
  };
  return COLORFUL_MAP[stage] ?? "bg-slate-600 text-white";
}

interface VisualizationPanelProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  steps: PipelineStep[];
  activeStep: number;
  current?: PipelineStep;
  playing: boolean;
  onPlay: () => void;
  onStepChange: (index: number) => void;
  finalRows: Row[];
  columns: string[];
  onExportCSV: () => void;
  onExportReport: () => void;
  sql: string;
  mermaidSource: string;
  schema: Table[];
  dark: boolean;
  theme?: ThemeId;
}

export function VisualizationPanel({
  tab,
  onTabChange,
  steps,
  activeStep,
  current,
  playing,
  onPlay,
  onStepChange,
  finalRows,
  columns,
  onExportCSV,
  onExportReport,
  sql,
  mermaidSource,
  schema,
  dark,
  theme = "eclipse",
}: VisualizationPanelProps) {
  return (
    <section
      className="flex flex-col gap-4 min-w-0"
      aria-label="Visualization panel"
    >
      <div className="flex gap-2">
        {(["result", "schema", "theory"] as const).map((item) => {
          const isActive = tab === item;
          return (
            <button
              key={item}
              onClick={() => onTabChange(item)}
              className="px-3.5 py-1.5 rounded-lg text-sm capitalize cursor-pointer transition-all border font-semibold shadow-xs"
              style={
                isActive
                  ? {
                      background: "var(--accent)",
                      color: "var(--accent-foreground)",
                      borderColor: "var(--accent)",
                    }
                  : {
                      background: "var(--panel)",
                      color: "var(--muted)",
                      borderColor: "var(--border)",
                    }
              }
            >
              {item === "result"
                ? "Pipeline & Result"
                : item === "schema"
                  ? "Schema / ER"
                  : "Theory"}
            </button>
          );
        })}
      </div>

      {tab === "result" && (
        <ResultView
          steps={steps}
          activeStep={activeStep}
          current={current}
          playing={playing}
          onPlay={onPlay}
          onStepChange={onStepChange}
          finalRows={finalRows}
          columns={columns}
          onExportCSV={onExportCSV}
          onExportReport={onExportReport}
          sql={sql}
          theme={theme}
        />
      )}
      {tab === "schema" && (
        <SchemaView schema={schema} source={mermaidSource} dark={dark} />
      )}
      {tab === "theory" && <Theory />}
    </section>
  );
}

function ResultView({
  steps,
  activeStep,
  current,
  playing,
  onPlay,
  onStepChange,
  finalRows,
  columns,
  onExportCSV,
  onExportReport,
  sql,
  theme = "eclipse",
}: Omit<
  VisualizationPanelProps,
  "tab" | "onTabChange" | "mermaidSource" | "schema" | "dark"
>) {
  return (
    <>
      <div
        className="panel p-4"
        style={{
          background: "var(--panel)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
            Execution Pipeline
          </h2>
          <button
            onClick={onPlay}
            disabled={!steps.length}
            className="px-3 py-1 rounded-lg text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-xs transition-opacity hover:opacity-90 border"
            style={{
              background: "var(--accent)",
              color: "var(--accent-foreground)",
              borderColor: "var(--accent)",
            }}
          >
            {playing ? (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                <span>Pause</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Animate</span>
              </>
            )}
          </button>
        </div>
        <pre
          className="mb-3 overflow-x-auto whitespace-pre-wrap wrap-break-word rounded-lg p-2.5 text-xs font-mono border"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          {sql}
        </pre>
        {steps.length === 0 ? (
          <p className="text-sm opacity-60" style={{ color: "var(--muted)" }}>
            Run a query to see its execution plan.
          </p>
        ) : (
          <ol className="flex flex-wrap gap-2" role="list">
            {steps.map((step, index) => (
              <li key={index}>
                <button
                  onClick={() => onStepChange(index)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-transform cursor-pointer ${
                    index === activeStep
                      ? "scale-105 ring-2 ring-offset-2 ring-offset-[var(--background)] ring-[var(--accent)] font-bold shadow-md"
                      : "opacity-85 hover:opacity-100"
                  } ${getStageBadgeClass(step.stage, theme)}`}
                >
                  {step.stage}
                  <span className="ml-1 opacity-90">({step.rowCount})</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {current && (
        <div
          className="panel p-4"
          style={{
            background: "var(--panel)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          <h3 className="font-bold text-base mb-1" style={{ color: "var(--foreground)" }}>
            Step {activeStep + 1}/{steps.length}: {current.title}
          </h3>
          <p className="text-xs opacity-75 mb-3" style={{ color: "var(--foreground)" }}>
            {current.detail}
          </p>
          <StepTable step={current} />
        </div>
      )}

      {finalRows.length > 0 && (
        <div
          className="panel p-4"
          style={{
            background: "var(--panel)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base" style={{ color: "var(--foreground)" }}>
              Final Result ({finalRows.length} row
              {finalRows.length !== 1 && "s"})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={onExportCSV}
                className="text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer font-medium hover:opacity-90"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>CSV</span>
              </button>
              <button
                onClick={onExportReport}
                className="text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer font-medium hover:opacity-90"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Report</span>
              </button>
            </div>
          </div>
          <ResultTable rows={finalRows} cols={columns} />
        </div>
      )}
    </>
  );
}

function SchemaView({
  schema,
  source,
  dark,
}: {
  schema: Table[];
  source: string;
  dark: boolean;
}) {
  return (
    <div
      className="panel p-4 overflow-auto"
      style={{
        background: "var(--panel)",
        borderColor: "var(--border)",
        color: "var(--foreground)",
      }}
    >
      <h2 className="font-bold mb-3 text-base" style={{ color: "var(--foreground)" }}>
        Database Schema
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {schema.map((table) => (
          <div
            key={table.name}
            className="p-3 rounded-lg border"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
            }}
          >
            <h3 className="font-mono font-bold text-base mb-1" style={{ color: "var(--foreground)" }}>
              {table.name}
            </h3>
            <table className="text-sm w-full">
              <tbody>
                {table.columns.map((column) => (
                  <tr key={column.name}>
                    <td className="py-0.5 pr-2 font-mono" style={{ color: "var(--foreground)" }}>
                      {column.name}
                    </td>
                    <td className="opacity-60" style={{ color: "var(--muted)" }}>
                      {column.type}
                    </td>
                    <td className="text-right font-mono text-xs">
                      {column.pk && (
                        <span className="font-bold text-amber-500 bg-amber-500/15 border border-amber-500/30 px-1 py-0.5 rounded mr-1">
                          PK
                        </span>
                      )}
                      {column.fk && (
                        <span className="text-sky-500 bg-sky-500/15 border border-sky-500/30 px-1 py-0.5 rounded">
                          FK→{column.fk.table}.{column.fk.column}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs opacity-60 mt-1.5" style={{ color: "var(--muted)" }}>
              {table.rows.length} sample rows
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <h3 className="font-bold text-base mb-2" style={{ color: "var(--foreground)" }}>
          ER diagram
        </h3>
        <MermaidDiagram source={source} dark={dark} />
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            Mermaid ER source
          </summary>
          <pre
            className="text-xs mt-2 overflow-x-auto p-2.5 rounded-lg border whitespace-pre-wrap font-mono"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            {source}
          </pre>
        </details>
      </div>
    </div>
  );
}

function MermaidDiagram({ source, dark }: { source: string; dark: boolean }) {
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const renderId = "er_" + Math.random().toString(36).slice(2, 9);
    void import("mermaid")
      .then(({ default: mermaid }) => {
        if (cancelled || !diagramRef.current) return;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: dark ? "dark" : "neutral",
        });
        return mermaid.render(renderId, source);
      })
      .then((result) => {
        if (cancelled || !diagramRef.current || !result) return;
        diagramRef.current.innerHTML = result.svg;
      })
      .catch((err) => {
        if (cancelled || !diagramRef.current) return;
        diagramRef.current.innerHTML = `<p class="text-xs text-red-500 p-2">ER Diagram rendering error: ${err instanceof Error ? err.message : String(err)}</p>`;
      });
    return () => {
      cancelled = true;
    };
  }, [source, dark]);

  return (
    <div
      ref={diagramRef}
      className="panel min-h-40 overflow-x-auto p-3 [&_svg]:mx-auto [&_svg]:max-w-full"
      style={{
        background: "var(--surface-subtle)",
        borderColor: "var(--border)",
      }}
      aria-label="Entity relationship diagram"
    />
  );
}

function StepTable({ step }: { step: PipelineStep }) {
  if (!step.rows.length)
    return <p className="text-xs opacity-50 italic">No rows at this stage.</p>;
  return (
    <div className="overflow-x-auto max-h-56">
      <table className="text-sm w-full border-collapse">
        <thead>
          <tr style={{ background: "var(--surface-subtle)" }}>
            {step.columns.map((column) => (
              <th
                key={column}
                className="text-left px-2.5 py-1.5 border-b font-mono font-bold"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {step.rows.slice(0, 20).map((row, index) => (
            <tr key={index} className="hover:opacity-85 transition-opacity">
              {step.columns.map((column) => (
                <td
                  key={column}
                  className="px-2.5 py-1.5 border-b"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  {String(row[column] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {step.rows.length > 20 && (
        <p className="text-xs opacity-50 mt-1" style={{ color: "var(--muted)" }}>
          …showing first 20 of {step.rows.length}
        </p>
      )}
    </div>
  );
}

function ResultTable({ rows, cols }: { rows: Row[]; cols: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="text-sm w-full border-collapse">
        <thead>
          <tr style={{ background: "var(--surface-subtle)" }}>
            {cols.map((column) => (
              <th
                key={column}
                className="text-left px-2.5 py-1.5 border-b font-mono font-bold"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="hover:opacity-85 transition-opacity">
              {cols.map((column) => (
                <td
                  key={column}
                  className="px-2.5 py-1.5 border-b"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  {String(row[column] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
