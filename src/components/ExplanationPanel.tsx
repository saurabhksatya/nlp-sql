interface ExplanationPanelProps {
  current?: {
    stage: string;
    title: string;
    detail: string;
    rowCount: number;
  };
  error?: string;
}

const NOTES: Record<string, string> = {
  FROM: "The database first locates the table on disk and reads its pages into memory. Every subsequent operator works on this working set.",
  JOIN: "A join combines rows of two tables using a predicate. Nested-loop join is O(n·m); real engines use hash joins (O(n+m)) when indexes are absent.",
  WHERE:
    "Selection (σ) is a row filter — it removes tuples that fail the predicate but never changes their shape.",
  "GROUP BY":
    "Grouping partitions rows into buckets so aggregates can be computed per bucket, usually via hashing or sorting.",
  DISTINCT:
    "DISTINCT removes duplicate values or rows so each remaining value is considered only once.",
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

export function ExplanationPanel({ current, error }: ExplanationPanelProps) {
  return (
    <aside
      className="panel p-4 overflow-y-auto max-h-[calc(100vh-5rem)]"
      aria-label="Explanation panel"
    >
      <h2 className="font-semibold mb-2">Explanation</h2>
      {!current && !error && (
        <p className="text-sm opacity-60">
          Run a query and each pipeline stage will be explained here in plain
          English, including the relational algebra operator and its complexity.
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
            <span className="inline-block px-2 py-0.5 rounded text-xs text-white bg-slate-500">
              {current.stage}
            </span>
            <h3 className="font-semibold mt-2">{current.title}</h3>
          </div>
          <div className="space-y-2">
            <p>{current.detail}</p>
            <p className="opacity-70 text-xs">{NOTES[current.stage]}</p>
            <p className="text-xs">
              Rows after this stage: <strong>{current.rowCount}</strong>
            </p>
          </div>
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
      return "";
  }
}
