import type { QueryResult } from "@/lib/sqlEngine";

interface ExplanationPanelProps {
  current?: {
    stage: string;
    title: string;
    detail: string;
    rowCount: number;
  };
  error?: string;
  lastResult?: QueryResult | null;
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
    "Selection (σ) is a row filter — it removes tuples that fail the predicate but never changes their shape.",
  "GROUP BY":
    "Grouping partitions rows into buckets so aggregates can be computed per bucket, usually via hashing or sorting.",
  DISTINCT:
    "DISTINCT removes duplicate values or rows so each remaining value is considered only once (δ operator).",
  HAVING:
    "HAVING filters groups after aggregation, unlike WHERE which filters rows before it.",
  AGGREGATE:
    "Aggregates collapse many rows into one summary value per group — COUNT, SUM, AVG, MIN, MAX (γ operator).",
  SELECT:
    "Projection (π) keeps only requested columns, reducing data shipped to the client.",
  "ORDER BY":
    "Sorting is typically an external merge sort, O(n log n), possibly spilling to disk for large inputs (τ operator).",
  LIMIT:
    "LIMIT lets the engine stop early — combined with ORDER BY it enables efficient 'top-N' execution plans.",
};

export function ExplanationPanel({
  current,
  error,
  lastResult,
}: ExplanationPanelProps) {
  return (
    <aside
      className="panel p-4 overflow-y-auto max-h-[calc(100vh-5rem)]"
      aria-label="Explanation panel"
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-sm">Execution Theory & Algebra</h2>
        {lastResult && (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
            {lastResult.statementType}
          </span>
        )}
      </div>

      {!current && !error && (
        <div className="space-y-2 text-xs opacity-75">
          <p>
            Run any SQL statement to inspect its step-by-step pipeline execution, relational algebra notation, and complexity metrics.
          </p>
          <div className="p-2.5 rounded bg-black/5 dark:bg-white/5 space-y-1 text-[11px]">
            <p className="font-semibold">Supported Command Families:</p>
            <p>• <strong>DQL:</strong> SELECT, JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT</p>
            <p>• <strong>DML:</strong> INSERT INTO, UPDATE, DELETE FROM</p>
            <p>• <strong>DDL:</strong> CREATE TABLE, ALTER TABLE, DROP TABLE, TRUNCATE</p>
          </div>
        </div>
      )}

      {error && (
        <div className="text-xs space-y-1.5">
          <p className="text-rose-500 font-bold">Execution Failed</p>
          <p className="opacity-80 font-mono bg-rose-500/10 p-2 rounded text-rose-600 dark:text-rose-400">
            {error}
          </p>
          <p className="opacity-60 text-[11px] mt-2">
            Verify table names, column types, and SQL syntax against the active Database Schema.
          </p>
        </div>
      )}

      {current && (
        <div className="space-y-3 text-xs">
          <div>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono text-white bg-slate-600">
              {current.stage}
            </span>
            <h3 className="font-semibold text-sm mt-1.5">{current.title}</h3>
          </div>

          <div className="space-y-2">
            <p className="leading-relaxed">{current.detail}</p>
            <p className="opacity-70 text-[11px] italic bg-black/5 dark:bg-white/5 p-2 rounded">
              {NOTES[current.stage] ?? "Database operation executed successfully."}
            </p>
            <p className="text-[11px] font-mono">
              Working rows after this stage: <strong>{current.rowCount}</strong>
            </p>
          </div>

          <div
            className="border-t pt-3"
            style={{ borderColor: "var(--border)" }}
          >
            <h4 className="text-[10px] font-semibold uppercase opacity-60 mb-1 tracking-wider">
              Relational Notation / Semantics
            </h4>
            <p className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
              {algebraFor(current.stage, lastResult?.command)}
            </p>
          </div>
        </div>
      )}
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
      if (command === "INSERT") return "R ← R ∪ { t_new }";
      if (command === "UPDATE") return "R ← (R \\ σ_p(R)) ∪ { update(t) }";
      if (command === "DELETE") return "R ← R \\ σ_p(R)";
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
      return "R ← R ⋈_θ S";
    case "WHERE":
      return "R ← σ_condition(R)";
    case "GROUP BY":
      return "R ← γ_group-cols(R)";
    case "DISTINCT":
      return "R ← δ(R)";
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
      return "R ← eval(Op)";
  }
}
