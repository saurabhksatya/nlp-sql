import { useEffect, useRef, useState } from "react";
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
  dotSource: string;
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
  dotSource,
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
        <SchemaView
          schema={schema}
          dotSource={dotSource}
          dark={dark}
        />
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
  "tab" | "onTabChange" | "dotSource" | "schema" | "dark"
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-transform cursor-pointer ${index === activeStep
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

let vizPromise: Promise<{ renderString: (src: string, opts?: { format: string }) => string }> | null = null;
function getVizInstance() {
  if (!vizPromise) {
    vizPromise = import("@viz-js/viz").then(({ instance }) => instance());
  }
  return vizPromise;
}

function ChenDiagram({ dot, dark = true }: { dot: string; dark?: boolean }) {
  const diagramRef = useRef<HTMLDivElement>(null);
  const modalDiagramRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Close modal on Escape key
  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getVizInstance()
      .then((viz) => {
        if (cancelled) return;
        const svg = viz.renderString(dot, { format: "svg" });
        if (cancelled) return;
        if (diagramRef.current) {
          diagramRef.current.innerHTML = svg;
        }
        if (modalDiagramRef.current) {
          modalDiagramRef.current.innerHTML = svg;
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dot]);

  // When expanding modal, also ensure svg is populated into modalDiagramRef
  useEffect(() => {
    if (isExpanded && modalDiagramRef.current && diagramRef.current) {
      modalDiagramRef.current.innerHTML = diagramRef.current.innerHTML;
    }
  }, [isExpanded]);

  const handleDownloadSVG = () => {
    const activeRef = isExpanded ? modalDiagramRef.current : diagramRef.current;
    const svgEl = activeRef?.querySelector("svg") || diagramRef.current?.querySelector("svg");
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const svgData = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "entity-relationship-diagram.svg";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = () => {
    const activeRef = isExpanded ? modalDiagramRef.current : diagramRef.current;
    const svgEl = activeRef?.querySelector("svg") || diagramRef.current?.querySelector("svg");
    if (!svgEl) return;
    setDownloading("png");
    try {
      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const svgData = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        const bbox = svgEl.getBoundingClientRect();
        const viewBox = svgEl.viewBox?.baseVal;
        const width = viewBox?.width && viewBox.width > 0 ? viewBox.width : (bbox.width || 900);
        const height = viewBox?.height && viewBox.height > 0 ? viewBox.height : (bbox.height || 600);
        const scale = 2;

        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.fillStyle = dark ? "#0f172a" : "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pngUrl = canvas.toDataURL("image/png");
          const anchor = document.createElement("a");
          anchor.href = pngUrl;
          anchor.download = "entity-relationship-diagram.png";
          anchor.click();
        }
        URL.revokeObjectURL(url);
        setDownloading(null);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        setDownloading(null);
      };

      img.src = url;
    } catch {
      setDownloading(null);
    }
  };

  return (
    <>
      <div
        className="panel min-h-60 overflow-hidden flex flex-col rounded-lg border transition-all"
        style={{
          background: "var(--surface-subtle)",
          borderColor: "var(--border)",
        }}
        aria-label="Entity-Relationship Diagram"
      >
        <div
          className="flex items-center justify-between px-3.5 py-2 border-b text-xs"
          style={{
            background: "var(--panel)",
            borderColor: "var(--border)",
          }}
        >
          <span className="font-semibold text-xs opacity-75" style={{ color: "var(--foreground)" }}>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadSVG}
              disabled={loading || !!error}
              className="px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              title="Download diagram as vector SVG"
            >
              <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download SVG</span>
            </button>
            <button
              onClick={handleDownloadPNG}
              disabled={loading || !!error || downloading === "png"}
              className="px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              title="Download diagram as high-resolution PNG image"
            >
              <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{downloading === "png" ? "Exporting..." : "Download PNG"}</span>
            </button>
          </div>
        </div>

        <div className="relative p-4 overflow-x-auto [&_svg]:mx-auto [&_svg]:max-w-full [&_svg]:h-auto flex items-center justify-center flex-1 min-h-52">
          {/* Diagonal Arrows Expand Button positioned on top-left inside the diagram image area */}
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setIsExpanded(true);
            }}
            disabled={loading || !!error}
            className="absolute top-3 right-3 z-10 px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-medium shadow-md transition-all hover:scale-105 hover:opacity-100 opacity-85 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-md"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
            title="Expand diagram (Fullscreen / Zoom View)"
            aria-label="Expand diagram"
          >
            {/* Diagonal Expand Arrows Icon */}
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>

          {loading && (
            <div className="flex items-center gap-2 text-xs opacity-70 p-4" style={{ color: "var(--muted)" }}>
              <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Rendering ER diagram...</span>
            </div>
          )}
          {error && (
            <p className="text-xs text-red-500 p-2">ER Diagram rendering error: {error}</p>
          )}
          <div ref={diagramRef} className={loading || error ? "hidden" : "w-full overflow-x-auto"} />
        </div>
      </div>

      {/* Fullscreen / Expanded Diagram Modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="w-full max-w-6xl h-[92vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Expanded Entity-Relationship Diagram"
          >
            {/* Modal Header */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight" style={{ color: "var(--foreground)" }}>
                    Entity-Relationship Diagram
                  </h3>
                  <p className="text-[11px] opacity-70 font-mono" style={{ color: "var(--muted)" }}>
                    Chen Notation &bull; Zoom: {Math.round(zoom * 100)}%
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Zoom controls */}
                <div
                  className="flex items-center rounded-lg border overflow-hidden"
                  style={{ borderColor: "var(--border)", background: "var(--panel)" }}
                >
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.2).toFixed(1))))}
                    className="px-2.5 py-1 text-xs hover:bg-[var(--surface-hover)] transition-colors border-r"
                    style={{ borderColor: "var(--border)" }}
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom(1)}
                    className="px-2.5 py-1 text-xs font-mono hover:bg-[var(--surface-hover)] transition-colors"
                    title="Reset Zoom to 100%"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(3, Number((z + 0.2).toFixed(1))))}
                    className="px-2.5 py-1 text-xs hover:bg-[var(--surface-hover)] transition-colors border-l"
                    style={{ borderColor: "var(--border)" }}
                    title="Zoom In"
                  >
                    +
                  </button>
                </div>

                {/* Download buttons */}
                <button
                  type="button"
                  onClick={handleDownloadSVG}
                  className="px-3 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                  style={{
                    background: "var(--panel)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                  title="Download SVG"
                >
                  <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>SVG</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPNG}
                  disabled={downloading === "png"}
                  className="px-3 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                  style={{
                    background: "var(--panel)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                  title="Download PNG"
                >
                  <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>{downloading === "png" ? "Exporting..." : "PNG"}</span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-lg border hover:bg-rose-500/15 hover:border-rose-500/40 hover:text-rose-400 transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--muted)",
                  }}
                  title="Close Fullscreen (Esc)"
                  aria-label="Close expanded view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Canvas */}
            <div
              className="flex-1 overflow-auto p-6 flex items-center justify-center cursor-grab active:cursor-grabbing"
              style={{
                background: "var(--background)",
              }}
            >
              <div
                ref={modalDiagramRef}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: "transform 150ms ease-out",
                }}
                className="w-full flex items-center justify-center [&_svg]:mx-auto [&_svg]:max-w-full [&_svg]:h-auto"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SchemaView({
  schema,
  dotSource = "",
  dark,
}: {
  schema: Table[];
  dotSource?: string;
  dark: boolean;
}) {
  return (
    <div
      className="panel p-4 overflow-auto flex flex-col gap-5"
      style={{
        background: "var(--panel)",
        borderColor: "var(--border)",
        color: "var(--foreground)",
      }}
    >
      <div>
        <h2 className="font-bold mb-3 text-base" style={{ color: "var(--foreground)" }}>
          Database Schema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {schema.map((table) => (
            <div
              key={table.name}
              className="p-3.5 rounded-lg border flex flex-col justify-between overflow-hidden shadow-2xs"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b" style={{ borderColor: "var(--border)" }}>
                  <h3 className="font-mono font-bold text-sm truncate" style={{ color: "var(--foreground)" }} title={table.name}>
                    {table.name}
                  </h3>
                  <span className="text-[11px] font-mono opacity-50 shrink-0" style={{ color: "var(--muted)" }}>
                    {table.columns.length} col{table.columns.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex flex-col divide-y divide-[var(--border)]/30">
                  {table.columns.map((column) => (
                    <div
                      key={column.name}
                      className="py-1.5 flex items-center justify-between gap-2 text-xs min-w-0"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          className="font-mono font-medium truncate"
                          style={{ color: "var(--foreground)" }}
                          title={column.name}
                        >
                          {column.name}
                        </span>
                        <span
                          className="text-[11px] opacity-55 font-mono shrink-0"
                          style={{ color: "var(--muted)" }}
                        >
                          {column.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 justify-end max-w-[60%]">
                        {column.pk && (
                          <span
                            className="font-bold text-amber-500 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] tracking-wide shrink-0"
                            title="Primary Key"
                          >
                            PK
                          </span>
                        )}
                        {column.fk && (
                          <span
                            className="text-sky-500 bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 rounded text-[10px] font-mono truncate max-w-full inline-block"
                            title={`Foreign Key → ${column.fk.table}.${column.fk.column}`}
                          >
                            FK→{column.fk.table}.{column.fk.column}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] opacity-60 mt-2.5 pt-1.5 border-t border-[var(--border)]/30" style={{ color: "var(--muted)" }}>
                {table.rows.length} sample row{table.rows.length !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h3 className="font-bold text-base" style={{ color: "var(--foreground)" }}>
            Entity-Relationship Diagram
          </h3>
          <div className="flex items-center gap-3 text-xs opacity-80 flex-wrap" style={{ color: "var(--muted)" }}>
            <span className="flex items-center gap-1 font-medium">
              <span className="inline-block w-2.5 h-2.5 bg-blue-500"></span> Entity
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="inline-block w-2.5 h-2.5 rotate-45 bg-emerald-500"></span> Relationship
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="inline-block w-3 h-2 rounded-full border border-current"></span> Attribute
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="underline font-bold">PK</span> Primary Key
            </span>
          </div>
        </div>

        <ChenDiagram dot={dotSource} dark={dark} />
      </div>
    </div>
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
