// A tiny in-browser SQL engine that executes a supported subset of SELECT
// queries as an explicit, visualizable relational-algebra pipeline:
//   FROM (cartesian + join) -> WHERE -> GROUP BY -> HAVING -> SELECT/projection
//   -> aggregates -> ORDER BY -> LIMIT
// Each stage records its intermediate result so the UI can animate it.

import { getTable, type Column } from "./schema";

export type Row = Record<string, string | number>;

export interface PipelineStep {
  stage: string; // FROM / JOIN / WHERE / GROUP BY / HAVING / SELECT / ORDER BY / LIMIT
  title: string;
  detail: string;
  rowCount: number;
  rows: Row[];
  columns: string[];
}

export interface QueryResult {
  steps: PipelineStep[];
  finalRows: Row[];
  columns: string[];
  error?: string;
}

export interface ParsedQuery {
  select: string[]; // expressions or "*"
  aggregates: { fn: "COUNT" | "SUM" | "AVG" | "MIN" | "MAX"; arg: string }[];
  from: string;
  joins: {
    table: string;
    left: string;
    right: string;
    type: "INNER" | "LEFT";
  }[];
  where?: { column: string; op: string; value: string };
  groupBy?: string;
  having?: { agg: string; op: string; value: number };
  orderBy?: { expr: string; dir: "ASC" | "DESC"; isAggIndex?: boolean };
  limit?: number;
}

const OPS: Record<string, (a: unknown, b: unknown) => boolean> = {
  "=": (a, b) => a === b,
  ">": (a, b) => Number(a) > Number(b),
  "<": (a, b) => Number(a) < Number(b),
  ">=": (a, b) => Number(a) >= Number(b),
  "<=": (a, b) => Number(a) <= Number(b),
  "!=": (a, b) => a !== b,
};

function strip(s: string): string {
  return s.trim().replace(/;$/, "");
}

/** Very small SQL parser for the teaching subset. Throws on unsupported syntax. */
export function parseSQL(sql: string): ParsedQuery {
  const q = strip(sql).trim();
  if (!/^select\s/i.test(q))
    throw new Error("Only SELECT statements are supported.");
  const parsed: ParsedQuery = {
    select: [],
    aggregates: [],
    from: "",
    joins: [],
  };

  // Split top-level clauses
  const clauses = splitClauses(q);
  const sel = clauses.get("select") ?? "";
  parsed.from = (clauses.get("from") ?? "").toLowerCase();
  if (!parsed.from) throw new Error("Missing FROM clause.");

  // FROM + JOINs
  const fromParts = parsed.from.split(/\s+join\s+/i);
  parsed.from = fromParts[0].split(/\s+/)[0];
  if (!getTable(parsed.from))
    throw new Error(`Unknown table "${parsed.from}".`);
  for (let i = 1; i < fromParts.length; i++) {
    const m = fromParts[i].match(
      /^(inner\s+|left\s+(outer\s+)?)?(\w+)\s+on\s+([\w.]+)\s*=\s*([\w.]+)$/i,
    );
    if (!m) throw new Error(`Unsupported JOIN syntax: "JOIN ${fromParts[i]}".`);
    const type = /^left/i.test(m[1] ?? "") ? "LEFT" : "INNER";
    const table = m[3].toLowerCase();
    if (!getTable(table)) throw new Error(`Unknown table "${table}".`);
    parsed.joins.push({ table, left: m[4], right: m[5], type });
  }

  // SELECT list
  for (const item of sel.split(",")) {
    const t = item.trim();
    const agg = t.match(
      /^(count|sum|avg|min|max)\s*\(\s*(\*|\w+(\.\w+)?)\s*\)$/i,
    );
    if (agg) {
      parsed.aggregates.push({
        fn: agg[1].toUpperCase() as ParsedQuery["aggregates"][number]["fn"],
        arg: agg[2],
      });
      parsed.select.push(t.toUpperCase());
    } else if (/^[\w.*]+$/.test(t)) {
      parsed.select.push(t);
    } else {
      throw new Error(`Unsupported SELECT expression: "${t}"`);
    }
  }

  // WHERE
  const where = clauses.get("where");
  if (where) {
    const m = where.match(/^([\w.]+)\s*(>=|<=|!=|=|>|<)\s*(.+)$/);
    if (!m)
      throw new Error(
        "Only single-condition WHERE (col op value) is supported.",
      );
    parsed.where = { column: m[1], op: m[2], value: unquote(m[3].trim()) };
  }

  // GROUP BY / HAVING / ORDER BY / LIMIT
  const gb = clauses.get("group by");
  if (gb) {
    if (!/^\w+$/.test(gb.trim()))
      throw new Error("GROUP BY supports a single column.");
    parsed.groupBy = gb.trim();
  }
  const hv = clauses.get("having");
  if (hv) {
    const m = hv.match(
      /^(count|sum|avg|min|max)\s*\(\s*\*?\s*\)\s*(>=|<=|!=|=|>|<)\s*(\d+)$/i,
    );
    if (!m) throw new Error("HAVING must look like AGG(*) op N.");
    parsed.having = {
      agg: `${m[1].toUpperCase()}(*)`,
      op: m[2],
      value: Number(m[3]),
    };
  }
  const ob = clauses.get("order by");
  if (ob) {
    const m = ob.match(/^([\w.*()]+(?:\s*\(\s*\*?\s*\))?)\s*(asc|desc)?$/i);
    if (!m) throw new Error("ORDER BY supports one expression.");
    parsed.orderBy = {
      expr: m[1].trim().toUpperCase(),
      dir: (m[2]?.toUpperCase() as "ASC" | "DESC") ?? "ASC",
    };
  }
  const lim = clauses.get("limit");
  if (lim) {
    const n = parseInt(lim, 10);
    if (isNaN(n)) throw new Error("LIMIT must be a number.");
    parsed.limit = n;
  }
  return parsed;
}

function splitClauses(q: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /\b(select|from|where|group\s+by|having|order\s+by|limit)\b/gi;
  let last = -1;
  let key = "";
  let m: RegExpExecArray | null;
  while ((m = re.exec(q))) {
    if (key) map.set(key, q.slice(last, m.index).trim());
    key = m[1].toLowerCase().replace(/\s+/g, " ");
    last = m.index + m[0].length;
  }
  if (key) map.set(key, q.slice(last).trim());
  return map;
}

function unquote(v: string): string {
  return v.replace(/^'(.*)'$/, "$1").replace(/^"(.*)"$/, "$1");
}

function resolveCol(row: Row, col: string): string | number | undefined {
  if (col.includes(".")) {
    const [, c] = col.split(".");
    return row[c];
  }
  return row[col];
}

function colName(col: string): string {
  return col.includes(".") ? col.split(".")[1] : col;
}

/** Execute a parsed query, recording every pipeline stage. */
export function executeParsed(p: ParsedQuery): QueryResult {
  const steps: PipelineStep[] = [];
  const push = (
    stage: string,
    title: string,
    detail: string,
    rows: Row[],
    columns: string[],
  ) => {
    steps.push({ stage, title, detail, rowCount: rows.length, rows, columns });
  };

  // 1. FROM — scan base table
  const baseTable = getTable(p.from)!;
  let rows: Row[] = baseTable.rows.map((r) => ({ ...r }));
  push(
    "FROM",
    `Scan ${baseTable.name}`,
    `Read all ${rows.length} rows of table \`${baseTable.name}\` into the working set (full table scan, O(n)).`,
    rows,
    Object.keys(rows[0] ?? {}),
  );

  // 2. JOINs — nested loop join
  for (const j of p.joins) {
    const jt = getTable(j.table)!;
    const out: Row[] = [];
    for (const l of rows) {
      let matched = false;
      for (const r of jt.rows) {
        const merged = { ...l, ...r };
        if (OPS["="](resolveCol(merged, j.left), resolveCol(merged, j.right))) {
          out.push(merged);
          matched = true;
        }
      }
      if (!matched && j.type === "LEFT") out.push({ ...l });
    }
    rows = out;
    push(
      "JOIN",
      `${j.type} JOIN ${jt.name}`,
      `Nested-loop ${j.type} JOIN on \`${j.left} = ${j.right}\`. Complexity O(n·m); produced ${rows.length} combined rows.`,
      rows.slice(0, 50),
      Object.keys(rows[0] ?? {}),
    );
  }

  // 3. WHERE — selection σ
  if (p.where) {
    const before = rows.length;
    const fn = OPS[p.where.op];
    if (!fn) throw new Error(`Unknown operator ${p.where.op}`);
    const val = coerce(p.where.value);
    rows = rows.filter((r) => fn(resolveCol(r, p.where!.column), val));
    push(
      "WHERE",
      `Filter σ(${p.where.column} ${p.where.op} ${p.where.value})`,
      `Selection predicate applied to each row: kept ${rows.length} of ${before} rows (O(n) scan).`,
      rows.slice(0, 50),
      Object.keys(rows[0] ?? {}),
    );
  }

  // 4. GROUP BY — grouping γ
  let groups: Row[][] | null = null;
  let groupKeys: string[] = [];
  if (p.groupBy) {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const k = String(resolveCol(r, p.groupBy));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    groups = [...map.values()];
    groupKeys = [...map.keys()];
    push(
      "GROUP BY",
      `Group γ(${p.groupBy})`,
      `Rows hashed into ${groups.length} groups keyed by \`${p.groupBy}\` (hash aggregation, expected O(n)).`,
      groups.map((g) => ({
        [p.groupBy!]: resolveCol(g[0], p.groupBy!) ?? 0,
        _rows: g.length,
      })),
      [p.groupBy, "_rows"],
    );
  }

  // 5. Aggregates + projection
  const outCols: string[] = [];
  const finalRows: Row[] = [];

  const computeAgg = (grp: Row[], fn: string, arg: string): string | number => {
    const f = fn.toUpperCase();
    if (f === "COUNT")
      return arg === "*"
        ? grp.length
        : grp.filter((r) => resolveCol(r, arg) != null).length;
    const nums = grp
      .map((r) => Number(resolveCol(r, arg)))
      .filter((n) => !isNaN(n));
    if (f === "SUM") return nums.reduce((a, b) => a + b, 0);
    if (f === "AVG")
      return nums.length
        ? +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)
        : 0;
    if (f === "MIN") return Math.min(...nums);
    if (f === "MAX") return Math.max(...nums);
    return 0;
  };

  if (p.aggregates.length || p.groupBy) {
    const list = groups ?? [rows];
    const keys = p.groupBy ? groupKeys : ["ALL"];
    list.forEach((grp, i) => {
      const out: Row = {};
      if (p.groupBy) out[colName(p.groupBy)] = keys[i];
      for (const a of p.aggregates) {
        const label = `${a.fn.toLowerCase()}_${a.arg === "*" ? "all" : colName(a.arg)}`;
        out[label] = computeAgg(grp, a.fn, a.arg);
      }
      finalRows.push(out);
    });
    // HAVING
    if (p.having) {
      const label = Object.keys(finalRows[0]).find((k) =>
        k.startsWith(p.having!.agg.split("(")[0].toLowerCase()),
      );
      const fn = OPS[p.having.op];
      const before = finalRows.length;
      if (label)
        finalRows.splice(
          0,
          finalRows.length,
          ...finalRows.filter((r) => fn(r[label], p.having!.value)),
        );
      push(
        "HAVING",
        `Having (${p.having.agg} ${p.having.op} ${p.having.value})`,
        `Filter on aggregated groups: kept ${finalRows.length} of ${before}.`,
        finalRows,
        Object.keys(finalRows[0] ?? {}),
      );
    }
    outCols.push(...Object.keys(finalRows[0] ?? {}));
    push(
      "AGGREGATE",
      "Aggregate & project",
      `Computed ${p.aggregates.map((a) => a.fn).join(", ") || "grouped"} results per group.`,
      finalRows,
      outCols,
    );
  } else {
    // plain projection π
    for (const r of rows) {
      const out: Row = {};
      for (const c of p.select) {
        if (c === "*") {
          Object.assign(out, r);
        } else {
          out[colName(c)] = resolveCol(r, c) ?? "";
        }
      }
      finalRows.push(out);
    }
    outCols.push(
      ...(p.select.includes("*")
        ? Object.keys(rows[0] ?? {})
        : p.select.map(colName)),
    );
    push(
      "SELECT",
      "Project π",
      `Projection keeps only requested columns: ${p.select.join(", ")}.`,
      finalRows.slice(0, 50),
      outCols,
    );
  }

  // 6. ORDER BY
  if (p.orderBy) {
    const { expr, dir } = p.orderBy;
    const idxMatch = expr.match(/^\d+$/);
    const keyOf = (r: Row): string | number => {
      if (idxMatch) return r[Object.keys(r)[Number(expr) - 1]] ?? "";
      const k = Object.keys(r).find(
        (k) =>
          k === colName(expr.replace(/[()]/g, "").split("(")[0]) ||
          k === expr.toLowerCase(),
      );
      return (k ? r[k] : "") ?? "";
    };
    finalRows.sort((a, b) => {
      const x = keyOf(a),
        y = keyOf(b);
      const cmp =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y));
      return dir === "DESC" ? -cmp : cmp;
    });
    push(
      "ORDER BY",
      `Sort (${expr} ${dir})`,
      `External merge sort, O(n log n), direction ${dir}.`,
      finalRows.slice(0, 50),
      Object.keys(finalRows[0] ?? {}),
    );
  }

  // 7. LIMIT
  if (p.limit != null) {
    const cut = finalRows.slice(0, p.limit);
    push(
      "LIMIT",
      `Limit ${p.limit}`,
      `Return first ${cut.length} row(s) after sorting.`,
      cut,
      Object.keys(cut[0] ?? {}),
    );
    return { steps, finalRows: cut, columns: Object.keys(cut[0] ?? {}) };
  }

  return { steps, finalRows, columns: Object.keys(finalRows[0] ?? {}) };
}

function coerce(v: string): string | number {
  return /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;
}

export function executeSQL(sql: string): QueryResult {
  try {
    return executeParsed(parseSQL(sql));
  } catch (e) {
    return {
      steps: [],
      finalRows: [],
      columns: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
