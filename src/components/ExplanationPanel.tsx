import type { QueryResult } from "@/lib/sqlEngine";
import type { Table, Dataset } from "@/lib/schema";
import { generateDatasetSQL, generateTableCSV } from "@/lib/exportUtils";

interface ExplanationPanelProps {
  current?: {
    stage: string;
    title: string;
    detail: string;
    rowCount: number;
  };
  error?: string;
  lastResult?: QueryResult | null;
  dataset?: Dataset;
  activeSchema?: Table[];
}

const NOTES: Record<string, string> = {
  PARSER:
    "The query parser lexicalizes and parses the SQL string into an Abstract Syntax Tree (AST), checking SQL grammar, keywords, and identifiers.",
  CATALOG:
    "The System Catalog (Data Dictionary) manages metadata schemas, relation definitions, column types, and integrity constraints.",
  CONSTRAINT:
    "Constraint validation verifies Domain Constraints (types), Entity Integrity (Primary Key uniqueness & NOT NULL), and Referential Integrity (Foreign Keys).",
  MUTATION:
    "Tuple/Schema Mutation applies row insertions, updates, deletions, or structural catalog alterations to the in-memory database storage buffer.",
  COMMIT:
    "Transaction Commit finalizes all mutations atomically, ensuring ACID durability and synchronizing live catalog state with active relations.",
  SCHEMA:
    "Relational schema construction allocates table descriptor headers, column data types, and key indexes.",
  FROM: "The database first locates the table on disk and reads its pages into memory. Every subsequent operator works on this working set.",
  JOIN: "A join combines rows of two tables using a predicate. Nested-loop join is O(n·m); real engines use hash joins (O(n+m)) when indexes are absent.",
  WHERE:
    "Selection (WHERE) is a row filter — it removes tuples that fail the predicate but never changes their shape.",
  "GROUP BY":
    "Grouping partitions rows into buckets so aggregates can be computed per bucket, usually via hashing or sorting.",
  DISTINCT:
    "DISTINCT removes duplicate values or rows so each remaining value is considered only once.",
  HAVING:
    "HAVING filters groups after aggregation, unlike WHERE which filters rows before it.",
  AGGREGATE:
    "Aggregates collapse many rows into one summary value per group — COUNT, SUM, AVG, MIN, MAX.",
  SELECT:
    "Projection (SELECT) keeps only requested columns, reducing data shipped to the client.",
  "ORDER BY":
    "Sorting is typically an external merge sort, O(n log n), possibly spilling to disk for large inputs.",
  LIMIT:
    "LIMIT lets the engine stop early — combined with ORDER BY it enables efficient 'top-N' execution plans.",
};

export function ExplanationPanel({
  current,
  error,
  lastResult,
  dataset,
  activeSchema = [],
}: ExplanationPanelProps) {
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSQL = () => {
    const dsName = dataset?.name || "dataset";
    const sqlContent = generateDatasetSQL(dsName, activeSchema);
    const filename = `${dsName.toLowerCase().replace(/[^\w]/g, "_")}_schema.sql`;
    downloadFile(sqlContent, filename, "application/sql");
  };

  const handleExportTableCSV = (table: Table) => {
    const csvContent = generateTableCSV(table);
    downloadFile(csvContent, `${table.name}.csv`, "text/csv");
  };

  const handleExportAllCSV = () => {
    activeSchema.forEach((table) => {
      const csvContent = generateTableCSV(table);
      downloadFile(csvContent, `${table.name}.csv`, "text/csv");
    });
  };

  return (
    <aside
      className="panel p-4 overflow-y-auto max-h-[calc(100vh-5rem)] flex flex-col gap-4"
      style={{
        background: "var(--panel)",
        borderColor: "var(--border)",
        color: "var(--foreground)",
      }}
      aria-label="Explanation panel"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
            Execution Theory &amp; Algebra
          </h2>
          {lastResult && (
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              {lastResult.statementType}
            </span>
          )}
        </div>

        {!current && !error && (
          <div className="space-y-3 text-xs opacity-90">
            <p style={{ color: "var(--foreground)" }}>
              Run any SQL statement to inspect its step-by-step pipeline execution, relational algebra notation, and complexity metrics.
            </p>
            <div
              className="p-3 rounded-lg border space-y-1.5 text-[11px]"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              <p className="font-bold" style={{ color: "var(--foreground)" }}>
                Supported Command Families:
              </p>
              <p>• <strong>DQL:</strong> SELECT, JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT</p>
              <p>• <strong>DML:</strong> INSERT INTO, UPDATE, DELETE FROM</p>
              <p>• <strong>DDL:</strong> CREATE TABLE, ALTER TABLE, DROP TABLE, TRUNCATE</p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs space-y-2">
            <p className="font-bold text-red-500">Execution Failed</p>
            <p className="font-mono p-2.5 rounded-lg border bg-red-500/10 border-red-500/30 text-red-500">
              {error}
            </p>
            <p className="text-[11px] opacity-70" style={{ color: "var(--muted)" }}>
              Verify table names, column types, and SQL syntax against the active Database Schema.
            </p>
          </div>
        )}

        {current && (
          <div className="space-y-3 text-xs">
            <div>
              <span
                className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                {current.stage}
              </span>
              <h3
                className="font-bold text-sm mt-1.5"
                style={{ color: "var(--foreground)" }}
              >
                {current.title}
              </h3>
            </div>

            <div className="space-y-2">
              <p className="leading-relaxed" style={{ color: "var(--foreground)" }}>
                {current.detail}
              </p>
              <div
                className="p-2.5 rounded-lg border text-xs leading-relaxed"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <p className="italic opacity-90">
                  {NOTES[current.stage] ?? "Database operation executed successfully."}
                </p>
              </div>
              <p className="text-[11px] font-mono" style={{ color: "var(--foreground)" }}>
                Working rows after this stage:{" "}
                <strong style={{ color: "var(--accent)" }}>{current.rowCount}</strong>
              </p>
            </div>

            <div
              className="border-t pt-3"
              style={{ borderColor: "var(--border)" }}
            >
              <h4
                className="text-[10px] font-bold uppercase mb-1.5 tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                Relational Notation / Semantics
              </h4>
              <div
                className="p-2 rounded-lg font-mono text-xs font-semibold border"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                {algebraFor(current.stage, lastResult?.command)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Dataset Section Box */}
      <div
        className="border-t pt-4 mt-auto space-y-3"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <h3
            className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: "var(--foreground)" }}
          >
            <svg
              className="w-4 h-4 text-emerald-500 opacity-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Export Dataset</span>
          </h3>
          {dataset && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded border opacity-70"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
                color: "var(--muted)",
              }}
            >
              {dataset.name}
            </span>
          )}
        </div>

        <div
          className="p-3 rounded-lg border space-y-3"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
          }}
        >
          <p className="text-[11px] opacity-80" style={{ color: "var(--foreground)" }}>
            Download active dataset in CSV and SQL script formats:
          </p>

          {/* Export SQL Script Button */}
          <button
            type="button"
            onClick={handleExportSQL}
            className="w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500 opacity-90 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              <span>Export SQL Script (.sql)</span>
            </span>
            <span className="text-[10px] opacity-60 font-mono">DDL &amp; DML</span>
          </button>

          {/* CSV Tables Export Section */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold opacity-80">
              <span>CSV Tables (.csv)</span>
              {activeSchema.length > 1 && (
                <button
                  type="button"
                  onClick={handleExportAllCSV}
                  className="text-[10px] text-emerald-500 hover:underline cursor-pointer font-bold"
                >
                  Export All ({activeSchema.length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {activeSchema.map((table) => (
                <button
                  key={table.name}
                  type="button"
                  onClick={() => handleExportTableCSV(table)}
                  className="w-full text-left p-2 rounded-lg border text-xs flex items-center justify-between transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
                  style={{
                    background: "var(--panel)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  <span className="flex items-center gap-2 font-mono text-[11px]">
                    <svg className="w-3.5 h-3.5 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{table.name}.csv</span>
                  </span>
                  <span className="text-[10px] opacity-60">
                    {table.rows?.length ?? 0} rows
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function algebraFor(stage: string, command?: string): string {
  switch (stage) {
    case "PARSER":
      return "AST ← parse(SQL_Statement)";
    case "CATALOG":
      return "Catalog ← lookup_or_modify(Schema, Relation)";
    case "CONSTRAINT":
      return "Assert(Domain(col) ∧ Unique(PK) ∧ FK_Ref(Target))";
    case "MUTATION":
      if (command === "INSERT") return "R ← R ∪ { new_rows }";
      if (command === "UPDATE") return "R ← update_matching(R, predicate)";
      if (command === "DELETE") return "R ← delete_matching(R, predicate)";
      if (command === "ALTER TABLE") return "Schema(R) ← Schema(R) ∪ { attr }";
      if (command === "TRUNCATE") return "R ← ∅";
      return "Mutation(R, BufferPool)";
    case "COMMIT":
      return "ACID_Commit(Transaction_Log, StorageEngine)";
    case "SCHEMA":
      return "Schema(Catalog) ← Schema(Catalog) ∪ { Relation }";
    case "FROM":
      return "R ← scan(table)";
    case "JOIN":
      return "R ← join(R, S, condition)";
    case "WHERE":
      return "R ← filter(R, condition)";
    case "GROUP BY":
      return "R ← group_by(R, columns)";
    case "DISTINCT":
      return "R ← distinct(R)";
    case "HAVING":
      return "R ← filter_groups(group_results, condition)";
    case "AGGREGATE":
      return "R ← aggregate(R, functions)";
    case "SELECT":
      return "R ← project(R, columns)";
    case "ORDER BY":
      return "R ← sort(R, order_key)";
    case "LIMIT":
      return "R ← top-N(R)";
    default:
      return "R ← eval(Op)";
  }
}
