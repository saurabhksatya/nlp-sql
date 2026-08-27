import { useEffect, useRef } from "react";
import type { Table } from "@/lib/schema";
import type { PipelineStep, Row } from "@/lib/sqlEngine";
import type { Tab } from "./nlSqlTypes";
import { Theory } from "./Theory";

const STAGE_COLORS: Record<string, string> = {
  FROM: "bg-sky-500",
  JOIN: "bg-cyan-500",
  WHERE: "bg-amber-500",
  "GROUP BY": "bg-violet-500",
  DISTINCT: "bg-indigo-500",
  HAVING: "bg-fuchsia-500",
  AGGREGATE: "bg-emerald-500",
  SELECT: "bg-emerald-500",
  "ORDER BY": "bg-orange-500",
  LIMIT: "bg-rose-500",
};

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
}: VisualizationPanelProps) {
  return (
    <section
      className="flex flex-col gap-4 min-w-0"
      aria-label="Visualization panel"
    >
      <div className="flex gap-2">
        {(["result", "schema", "theory"] as const).map((item) => (
          <button
            key={item}
            onClick={() => onTabChange(item)}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize ${tab === item ? "text-white" : "panel"}`}
            style={tab === item ? { background: "var(--accent)" } : undefined}
          >
            {item === "result"
              ? "Pipeline & Result"
              : item === "schema"
                ? "Schema / ER"
                : "Theory"}
          </button>
        ))}
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
}: Omit<
  VisualizationPanelProps,
  "tab" | "onTabChange" | "mermaidSource" | "schema" | "dark"
>) {
  return (
    <>
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Execution Pipeline</h2>
          <button
            onClick={onPlay}
            disabled={!steps.length}
            className="px-3 py-1 rounded-lg text-xs text-white disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            {playing ? "⏸ Pause" : "▶ Animate"}
          </button>
        </div>
        <pre className="mb-3 overflow-x-auto whitespace-pre-wrap wrap-break-word rounded bg-black/5 p-2 text-xs font-mono dark:bg-white/5">
          {sql}
        </pre>
        {steps.length === 0 ? (
          <p className="text-sm opacity-50">
            Run a query to see its execution plan.
          </p>
        ) : (
          <ol className="flex flex-wrap gap-2" role="list">
            {steps.map((step, index) => (
              <li key={index}>
                <button
                  onClick={() => onStepChange(index)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono text-white transition-transform ${
                    index === activeStep
                      ? "scale-110 ring-2 ring-offset-2"
                      : "opacity-60"
                  } ${STAGE_COLORS[step.stage] ?? "bg-slate-500"}`}
                >
                  {step.stage}
                  <span className="ml-1 opacity-80">({step.rowCount})</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {current && (
        <div className="panel p-4">
          <h3 className="font-semibold text-base mb-1">
            Step {activeStep + 1}/{steps.length}: {current.title}
          </h3>
          <p className="text-xs opacity-70 mb-3">{current.detail}</p>
          <StepTable step={current} />
        </div>
      )}

      {finalRows.length > 0 && (
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-base">
              Final Result ({finalRows.length} row
              {finalRows.length !== 1 && "s"})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={onExportCSV}
                className="text-xs panel px-2 py-1 hover:opacity-75"
              >
                ⬇ CSV
              </button>
              <button
                onClick={onExportReport}
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
    <div className="panel p-4 overflow-auto">
      <h2 className="font-semibold mb-3">Database Schema</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {schema.map((table) => (
          <div key={table.name} className="panel p-3">
            <h3 className="font-mono font-semibold text-base mb-1">
              {table.name}
            </h3>
            <table className="text-sm w-full">
              <tbody>
                {table.columns.map((column) => (
                  <tr key={column.name}>
                    <td className="py-0.5 pr-2 font-mono">{column.name}</td>
                    <td className="opacity-60">{column.type}</td>
                    <td className="text-right">
                      {column.pk && <span className="text-amber-500">PK </span>}
                      {column.fk && (
                        <span className="text-sky-400">
                          FK→{column.fk.table}.{column.fk.column}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs opacity-50 mt-1">
              {table.rows.length} sample rows
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <h3 className="font-semibold text-base mb-2">ER diagram</h3>
        <MermaidDiagram source={source} dark={dark} />
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold">
            Mermaid ER source
          </summary>
          <pre className="text-xs mt-2 overflow-x-auto panel p-2 whitespace-pre-wrap">
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
    void import("mermaid").then(({ default: mermaid }) => {
      if (cancelled || !diagramRef.current) return;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: dark ? "dark" : "default",
      });
      return mermaid.render("nl-sql-er-diagram", source).then(({ svg }) => {
        if (cancelled || !diagramRef.current) return;
        diagramRef.current.innerHTML = svg;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [source, dark]);

  return (
    <div
      ref={diagramRef}
      className="panel min-h-40 overflow-x-auto p-3 [&_svg]:mx-auto [&_svg]:max-w-full"
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
          <tr>
            {step.columns.map((column) => (
              <th
                key={column}
                className="text-left px-2 py-1 border-b font-mono"
                style={{ borderColor: "var(--border)" }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {step.rows.slice(0, 20).map((row, index) => (
            <tr key={index}>
              {step.columns.map((column) => (
                <td
                  key={column}
                  className="px-2 py-1 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  {String(row[column] ?? "")}
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
      <table className="text-sm w-full border-collapse">
        <thead>
          <tr style={{ background: "var(--background)" }}>
            {cols.map((column) => (
              <th
                key={column}
                className="text-left px-2 py-1.5 border-b font-mono"
                style={{ borderColor: "var(--border)" }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="hover:opacity-80">
              {cols.map((column) => (
                <td
                  key={column}
                  className="px-2 py-1.5 border-b"
                  style={{ borderColor: "var(--border)" }}
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
