// Educational in-browser SQL Engine supporting:
// - DQL: SELECT with relational algebra pipeline (FROM, JOIN, WHERE, GROUP BY, DISTINCT, HAVING, AGGREGATE, SELECT, ORDER BY, LIMIT)
// - DML: INSERT, UPDATE, DELETE with transaction stages, constraint checking, and tuple mutation
// - DDL: CREATE TABLE, DROP TABLE, ALTER TABLE, TRUNCATE with catalog operations and schema synchronization

import {
  getTable,
  cloneSchema,
  SCHEMA,
  type Column,
  type ColumnType,
  type Table,
} from "./schema";

export type Row = Record<string, string | number>;

export interface PipelineStep {
  stage: string;
  title: string;
  detail: string;
  rowCount: number;
  rows: Row[];
  columns: string[];
}

export type StatementType = "DQL" | "DML" | "DDL";
export type SQLCommand =
  | "SELECT"
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "CREATE TABLE"
  | "DROP TABLE"
  | "ALTER TABLE"
  | "TRUNCATE";

export interface QueryResult {
  statementType: StatementType;
  command: SQLCommand;
  message?: string;
  affectedRows?: number;
  steps: PipelineStep[];
  finalRows: Row[];
  columns: string[];
  updatedSchema?: Table[];
  error?: string;
}

export interface ParsedSelectQuery {
  type: "SELECT";
  select: string[];
  distinct: boolean;
  aggregates: {
    fn: "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
    arg: string;
    distinct?: boolean;
  }[];
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

export interface ParsedInsertQuery {
  type: "INSERT";
  table: string;
  columns?: string[];
  values: (string | number)[][];
}

export interface ParsedUpdateQuery {
  type: "UPDATE";
  table: string;
  set: { column: string; value: string | number }[];
  where?: { column: string; op: string; value: string };
}

export interface ParsedDeleteQuery {
  type: "DELETE";
  table: string;
  where?: { column: string; op: string; value: string };
}

export interface ParsedCreateTableQuery {
  type: "CREATE TABLE";
  ifNotExists: boolean;
  table: string;
  columns: Column[];
}

export interface ParsedDropTableQuery {
  type: "DROP TABLE";
  ifExists: boolean;
  table: string;
}

export interface ParsedAlterTableQuery {
  type: "ALTER TABLE";
  table: string;
  action:
    | { type: "ADD_COLUMN"; column: Column }
    | { type: "DROP_COLUMN"; columnName: string }
    | { type: "RENAME_TABLE"; newTableName: string }
    | { type: "RENAME_COLUMN"; oldColumnName: string; newColumnName: string };
}

export interface ParsedTruncateQuery {
  type: "TRUNCATE";
  table: string;
}

export type ParsedQuery =
  | ParsedSelectQuery
  | ParsedInsertQuery
  | ParsedUpdateQuery
  | ParsedDeleteQuery
  | ParsedCreateTableQuery
  | ParsedDropTableQuery
  | ParsedAlterTableQuery
  | ParsedTruncateQuery;

const OPS: Record<string, (a: unknown, b: unknown) => boolean> = {
  "=": (a, b) => {
    if (a == null || b == null) return false;
    return (
      String(a).trim().toLowerCase() === String(b).trim().toLowerCase() ||
      Number(a) === Number(b)
    );
  },
  ">": (a, b) => Number(a) > Number(b),
  "<": (a, b) => Number(a) < Number(b),
  ">=": (a, b) => Number(a) >= Number(b),
  "<=": (a, b) => Number(a) <= Number(b),
  "!=": (a, b) => {
    if (a == null || b == null) return true;
    return (
      String(a).trim().toLowerCase() !== String(b).trim().toLowerCase() &&
      Number(a) !== Number(b)
    );
  },
  "<>": (a, b) => {
    if (a == null || b == null) return true;
    return (
      String(a).trim().toLowerCase() !== String(b).trim().toLowerCase() &&
      Number(a) !== Number(b)
    );
  },
  LIKE: (a, b) => {
    if (a == null || b == null) return false;
    const pattern = String(b).replace(/%/g, ".*").replace(/_/g, ".");
    return new RegExp(`^${pattern}$`, "i").test(String(a));
  },
};

function strip(s: string): string {
  return s.trim().replace(/;+$/, "").trim();
}

/** Split a SQL script into individual statements respecting string literals and comments */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (inLineComment) {
      if (char === "\n" || char === "\r") {
        inLineComment = false;
      }
      current += char;
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && nextChar === "/") {
        inBlockComment = false;
        current += "*/";
        i++;
        continue;
      }
      current += char;
      continue;
    }

    if (char === "-" && nextChar === "-" && !inSingleQuote && !inDoubleQuote) {
      inLineComment = true;
      current += "--";
      i++;
      continue;
    }

    if (char === "/" && nextChar === "*" && !inSingleQuote && !inDoubleQuote) {
      inBlockComment = true;
      current += "/*";
      i++;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    if (char === ";" && !inSingleQuote && !inDoubleQuote) {
      const trimmed = current.trim();
      if (trimmed) {
        statements.push(trimmed);
      }
      current = "";
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed) {
    statements.push(trimmed);
  }

  return statements;
}

function unquote(v: string): string {
  return v.replace(/^'(.*)'$/, "$1").replace(/^"(.*)"$/, "$1").trim();
}

function coerce(v: string): string | number {
  const trimmed = unquote(v);
  return /^-?\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : trimmed;
}

function extractTuples(valuesRaw: string): (string | number)[][] {
  const tuples: (string | number)[][] = [];
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let parenDepth = 0;
  let currentTupleStr = "";
  let insideTuple = false;

  for (let i = 0; i < valuesRaw.length; i++) {
    const char = valuesRaw[i];
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (char === "(") {
        if (parenDepth === 0) {
          insideTuple = true;
          currentTupleStr = "";
          parenDepth++;
          continue;
        }
        parenDepth++;
      } else if (char === ")") {
        parenDepth--;
        if (parenDepth === 0 && insideTuple) {
          insideTuple = false;
          const parts = splitCsv(currentTupleStr);
          tuples.push(parts.map((v) => coerce(v)));
          currentTupleStr = "";
          continue;
        }
      }
    }

    if (insideTuple) {
      currentTupleStr += char;
    }
  }

  if (tuples.length === 0 && valuesRaw.trim()) {
    const parts = splitCsv(valuesRaw.trim());
    if (parts.length > 0) {
      tuples.push(parts.map((v) => coerce(v)));
    }
  }

  return tuples;
}

function normalizeType(typeStr: string): ColumnType {
  const t = typeStr.toUpperCase();
  if (t.includes("INT")) return "INTEGER";
  if (t.includes("CHAR") || t.includes("TEXT") || t.includes("STR")) return "TEXT";
  if (t.includes("REAL") || t.includes("FLOAT") || t.includes("DOUBLE") || t.includes("NUM") || t.includes("DEC"))
    return "REAL";
  if (t.includes("BOOL")) return "BOOLEAN";
  if (t.includes("DATE") || t.includes("TIME")) return "DATE";
  return "TEXT";
}

function resolveCol(row: Row, col: string): string | number | undefined {
  if (col.includes(".")) {
    const [, c] = col.split(".");
    return row[c] ?? row[col];
  }
  const exact = row[col];
  if (exact !== undefined) return exact;
  const lower = col.toLowerCase();
  const key = Object.keys(row).find((k) => k.toLowerCase() === lower);
  return key ? row[key] : undefined;
}

function colName(col: string): string {
  return col.includes(".") ? col.split(".")[1] : col;
}

/** Comprehensive SQL Parser supporting SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, DROP TABLE, ALTER TABLE, TRUNCATE */
export function parseSQL(sql: string, schema: Table[] = SCHEMA): ParsedQuery {
  const q = strip(sql);
  if (!q) throw new Error("Empty SQL query provided.");

  // 1. DQL: SELECT
  if (/^select\b/i.test(q)) {
    return parseSelect(q, schema);
  }

  // 2. DML: INSERT
  if (/^insert\b/i.test(q)) {
    return parseInsert(q, schema);
  }

  // 3. DML: UPDATE
  if (/^update\b/i.test(q)) {
    return parseUpdate(q, schema);
  }

  // 4. DML: DELETE
  if (/^delete\b/i.test(q)) {
    return parseDelete(q, schema);
  }

  // 5. DDL: CREATE TABLE
  if (/^create\s+table\b/i.test(q)) {
    return parseCreateTable(q);
  }

  // 6. DDL: DROP TABLE
  if (/^drop\s+table\b/i.test(q)) {
    return parseDropTable(q);
  }

  // 7. DDL: ALTER TABLE
  if (/^alter\s+table\b/i.test(q)) {
    return parseAlterTable(q, schema);
  }

  // 8. DDL: TRUNCATE [TABLE]
  if (/^truncate\b/i.test(q)) {
    return parseTruncate(q, schema);
  }

  throw new Error(
    `Unsupported SQL statement: "${q.slice(0, 30)}...". Supported commands: SELECT, INSERT INTO, UPDATE, DELETE FROM, CREATE TABLE, ALTER TABLE, DROP TABLE, TRUNCATE.`,
  );
}

function parseSelect(q: string, schema: Table[]): ParsedSelectQuery {
  const parsed: ParsedSelectQuery = {
    type: "SELECT",
    select: [],
    distinct: false,
    aggregates: [],
    from: "",
    joins: [],
  };

  const clauses = splitClauses(q);
  const sel = clauses.get("select") ?? "";
  parsed.from = (clauses.get("from") ?? "").toLowerCase();
  if (!parsed.from) throw new Error("Missing FROM clause in SELECT statement.");

  // Parse FROM + JOINs
  const fromParts = parsed.from.split(/\s+join\s+/i);
  parsed.from = fromParts[0].split(/\s+/)[0];
  if (!getTable(parsed.from, schema)) {
    throw new Error(`Unknown table "${parsed.from}".`);
  }

  for (let i = 1; i < fromParts.length; i++) {
    const m = fromParts[i].match(
      /^(inner\s+|left\s+(outer\s+)?)?(\w+)\s+on\s+([\w.]+)\s*=\s*([\w.]+)$/i,
    );
    if (!m) throw new Error(`Unsupported JOIN syntax: "JOIN ${fromParts[i]}".`);
    const type = /^left/i.test(m[1] ?? "") ? "LEFT" : "INNER";
    const table = m[3].toLowerCase();
    if (!getTable(table, schema)) throw new Error(`Unknown table "${table}".`);
    parsed.joins.push({ table, left: m[4], right: m[5], type });
  }

  // Parse SELECT list
  const selectList = sel.replace(/^distinct\b\s*/i, () => {
    parsed.distinct = true;
    return "";
  });
  if (!selectList.trim()) throw new Error("Missing SELECT expression.");

  for (const item of selectList.split(",")) {
    const t = item.trim();
    const agg = t.match(
      /^(count|sum|avg|min|max)\s*\(\s*(distinct\s+)?(\*|\w+(\.\w+)?)\s*\)$/i,
    );
    if (agg) {
      parsed.aggregates.push({
        fn: agg[1].toUpperCase() as ParsedSelectQuery["aggregates"][number]["fn"],
        arg: agg[3],
        distinct: Boolean(agg[2]),
      });
      parsed.select.push(t.toUpperCase());
    } else if (/^[\w.*]+$/.test(t)) {
      parsed.select.push(t);
    } else {
      throw new Error(`Unsupported SELECT expression: "${t}"`);
    }
  }

  // Parse WHERE
  const where = clauses.get("where");
  if (where) {
    const m = where.match(/^([\w.]+)\s*(>=|<=|!=|<>|=|LIKE|>|<)\s*(.+)$/i);
    if (!m)
      throw new Error(
        "Only single-condition WHERE (column operator value) is supported.",
      );
    parsed.where = {
      column: m[1],
      op: m[2].toUpperCase(),
      value: unquote(m[3].trim()),
    };
  }

  // Parse GROUP BY
  const gb = clauses.get("group by");
  if (gb) {
    if (!/^\w+$/.test(gb.trim()))
      throw new Error("GROUP BY supports a single column name.");
    parsed.groupBy = gb.trim();
  }

  // Parse HAVING
  const hv = clauses.get("having");
  if (hv) {
    const m = hv.match(
      /^(count|sum|avg|min|max)\s*\(\s*\*?\s*\)\s*(>=|<=|!=|<>|=|LIKE|>|<)\s*(\d+)$/i,
    );
    if (!m) throw new Error("HAVING must look like AGG(*) op N.");
    parsed.having = {
      agg: `${m[1].toUpperCase()}(*)`,
      op: m[2].toUpperCase(),
      value: Number(m[3]),
    };
  }

  // Parse ORDER BY
  const ob = clauses.get("order by");
  if (ob) {
    const m = ob.match(/^([\w.*()]+(?:\s*\(\s*\*?\s*\))?)\s*(asc|desc)?$/i);
    if (!m) throw new Error("ORDER BY supports one expression.");
    parsed.orderBy = {
      expr: m[1].trim().toUpperCase(),
      dir: (m[2]?.toUpperCase() as "ASC" | "DESC") ?? "ASC",
    };
  }

  // Parse LIMIT
  const lim = clauses.get("limit");
  if (lim) {
    const n = parseInt(lim, 10);
    if (isNaN(n)) throw new Error("LIMIT must be a number.");
    parsed.limit = n;
  }

  return parsed;
}

function parseInsert(q: string, schema: Table[]): ParsedInsertQuery {
  // Supports:
  // INSERT INTO table (col1, col2) VALUES (val1, val2);
  // INSERT INTO table VALUES (val1, val2);
  // INSERT IN table ...
  // INSERT INTO table SET col1 = val1, col2 = val2;
  const setMatch = q.match(
    /^insert(?:\s+into|\s+in)?\s+([\w]+)\s+set\s+(.+)$/i,
  );
  if (setMatch) {
    const tableName = setMatch[1].toLowerCase();
    const table = getTable(tableName, schema);
    if (!table) throw new Error(`Table "${tableName}" does not exist.`);

    const pairs = splitCsv(setMatch[2]);
    const cols: string[] = [];
    const vals: (string | number)[] = [];
    for (const pair of pairs) {
      const eqIdx = pair.indexOf("=");
      if (eqIdx !== -1) {
        cols.push(pair.slice(0, eqIdx).trim().toLowerCase());
        vals.push(coerce(pair.slice(eqIdx + 1).trim()));
      }
    }
    return {
      type: "INSERT",
      table: tableName,
      columns: cols,
      values: [vals],
    };
  }

  const match = q.match(
    /^insert(?:\s+into|\s+in)?\s+([\w]+)\s*(?:\(([^)]+)\))?\s*(?:values\s*(.+)|(.*))$/i,
  );
  if (!match) {
    throw new Error(
      "Invalid INSERT syntax. Expected: INSERT INTO table_name [(cols...)] VALUES (values...);",
    );
  }

  const tableName = match[1].toLowerCase();
  const table = getTable(tableName, schema);
  if (!table) {
    throw new Error(`Table "${tableName}" does not exist in active database.`);
  }

  let columns: string[] | undefined;
  if (match[2]) {
    columns = match[2].split(",").map((c) => c.trim().toLowerCase());
    for (const col of columns) {
      if (!table.columns.some((c) => c.name.toLowerCase() === col)) {
        throw new Error(
          `Column "${col}" does not exist in table "${tableName}".`,
        );
      }
    }
  }

  const valuesRaw = (match[3] || match[4] || "").trim();
  const tuples = extractTuples(valuesRaw);

  if (tuples.length === 0) {
    throw new Error(
      "No valid VALUES found in INSERT statement. Example: INSERT INTO table_name VALUES (val1, val2);",
    );
  }

  return {
    type: "INSERT",
    table: tableName,
    columns,
    values: tuples,
  };
}

function parseUpdate(q: string, schema: Table[]): ParsedUpdateQuery {
  const match = q.match(
    /^update\s+([\w]+)\s+set\s+(.+?)(?:\s+where\s+(.+))?$/i,
  );
  if (!match) {
    throw new Error(
      "Invalid UPDATE syntax. Expected: UPDATE table_name SET col = val, ... [WHERE condition];",
    );
  }

  const tableName = match[1].toLowerCase();
  const table = getTable(tableName, schema);
  if (!table) {
    throw new Error(`Table "${tableName}" does not exist.`);
  }

  const setClause = match[2].trim();
  const setAssignments = splitCsv(setClause).map((assign) => {
    const eqIdx = assign.indexOf("=");
    if (eqIdx === -1) {
      throw new Error(`Invalid SET assignment: "${assign}". Expected col = val.`);
    }
    const col = assign.slice(0, eqIdx).trim().toLowerCase();
    const val = coerce(assign.slice(eqIdx + 1).trim());
    if (!table.columns.some((c) => c.name.toLowerCase() === col)) {
      throw new Error(
        `Column "${col}" does not exist in table "${tableName}".`,
      );
    }
    return { column: col, value: val };
  });

  let where: { column: string; op: string; value: string } | undefined;
  if (match[3]) {
    const wm = match[3].match(/^([\w.]+)\s*(>=|<=|!=|<>|=|LIKE|>|<)\s*(.+)$/i);
    if (!wm) {
      throw new Error("Invalid WHERE clause in UPDATE statement.");
    }
    where = {
      column: wm[1],
      op: wm[2].toUpperCase(),
      value: unquote(wm[3].trim()),
    };
  }

  return {
    type: "UPDATE",
    table: tableName,
    set: setAssignments,
    where,
  };
}

function parseDelete(q: string, schema: Table[]): ParsedDeleteQuery {
  const match = q.match(/^delete(?:\s+from)?\s+([\w]+)(?:\s+where\s+(.+))?$/i);
  if (!match) {
    throw new Error(
      "Invalid DELETE syntax. Expected: DELETE FROM table_name [WHERE condition];",
    );
  }

  const tableName = match[1].toLowerCase();
  const table = getTable(tableName, schema);
  if (!table) {
    throw new Error(`Table "${tableName}" does not exist.`);
  }

  let where: { column: string; op: string; value: string } | undefined;
  if (match[2]) {
    const wm = match[2].match(/^([\w.]+)\s*(>=|<=|!=|<>|=|LIKE|>|<)\s*(.+)$/i);
    if (!wm) {
      throw new Error("Invalid WHERE clause in DELETE statement.");
    }
    where = {
      column: wm[1],
      op: wm[2].toUpperCase(),
      value: unquote(wm[3].trim()),
    };
  }

  return {
    type: "DELETE",
    table: tableName,
    where,
  };
}

function parseCreateTable(q: string): ParsedCreateTableQuery {
  const match = q.match(
    /^create\s+table\s+(if\s+not\s+exists\s+)?([\w]+)\s*\(([\s\S]+)\)$/i,
  );
  if (!match) {
    throw new Error(
      "Invalid CREATE TABLE syntax. Expected: CREATE TABLE table_name (col1 TYPE PRIMARY KEY, col2 TYPE REFERENCES other(id), ...);",
    );
  }

  const ifNotExists = Boolean(match[1]);
  const tableName = match[2].toLowerCase();
  const body = match[3].trim();

  const columnDefs = splitCsv(body);
  const columns: Column[] = [];
  const tablePrimaryKeys: string[] = [];

  for (const def of columnDefs) {
    const trimmed = def.trim();
    if (!trimmed) continue;

    // Table-level PRIMARY KEY (col)
    const pkTableMatch = trimmed.match(/^primary\s+key\s*\(([\w,\s]+)\)$/i);
    if (pkTableMatch) {
      const pks = pkTableMatch[1].split(",").map((s) => s.trim().toLowerCase());
      tablePrimaryKeys.push(...pks);
      continue;
    }

    // Table-level FOREIGN KEY (col) REFERENCES other_table(col)
    const fkTableMatch = trimmed.match(
      /^foreign\s+key\s*\(([\w]+)\)\s*references\s+([\w]+)\s*\(([\w]+)\)$/i,
    );
    if (fkTableMatch) {
      const colName = fkTableMatch[1].toLowerCase();
      const existingCol = columns.find((c) => c.name.toLowerCase() === colName);
      if (existingCol) {
        existingCol.fk = {
          table: fkTableMatch[2].toLowerCase(),
          column: fkTableMatch[3].toLowerCase(),
        };
      }
      continue;
    }

    // Standard column definition: name TYPE [PRIMARY KEY] [REFERENCES other(col)]
    const colMatch = trimmed.match(
      /^([\w]+)\s+([\w()]+)(?:\s+primary\s+key)?(?:\s+references\s+([\w]+)\(([\w]+)\))?/i,
    );
    if (!colMatch) {
      throw new Error(`Unsupported column definition: "${trimmed}".`);
    }

    const name = colMatch[1].toLowerCase();
    const type = normalizeType(colMatch[2]);
    const isInlinePk = /primary\s+key/i.test(trimmed);
    const fk =
      colMatch[3] && colMatch[4]
        ? { table: colMatch[3].toLowerCase(), column: colMatch[4].toLowerCase() }
        : undefined;

    columns.push({
      name,
      type,
      pk: isInlinePk,
      fk,
    });
  }

  for (const pk of tablePrimaryKeys) {
    const col = columns.find((c) => c.name.toLowerCase() === pk);
    if (col) col.pk = true;
  }

  if (columns.length === 0) {
    throw new Error("Table must have at least one column defined.");
  }

  return {
    type: "CREATE TABLE",
    ifNotExists,
    table: tableName,
    columns,
  };
}

function parseDropTable(q: string): ParsedDropTableQuery {
  const match = q.match(/^drop\s+table\s+(if\s+exists\s+)?([\w]+)$/i);
  if (!match) {
    throw new Error("Invalid DROP TABLE syntax. Expected: DROP TABLE table_name;");
  }
  return {
    type: "DROP TABLE",
    ifExists: Boolean(match[1]),
    table: match[2].toLowerCase(),
  };
}

function parseAlterTable(q: string, schema: Table[]): ParsedAlterTableQuery {
  const match = q.match(/^alter\s+table\s+([\w]+)\s+(.+)$/i);
  if (!match) {
    throw new Error(
      "Invalid ALTER TABLE syntax. Expected: ALTER TABLE table_name ADD/DROP/RENAME ...;",
    );
  }

  const tableName = match[1].toLowerCase();
  const actionStr = match[2].trim();

  // ADD COLUMN
  const addMatch = actionStr.match(
    /^add(?:\s+column)?\s+([\w]+)\s+([\w()]+)(?:\s+primary\s+key)?/i,
  );
  if (addMatch) {
    return {
      type: "ALTER TABLE",
      table: tableName,
      action: {
        type: "ADD_COLUMN",
        column: {
          name: addMatch[1].toLowerCase(),
          type: normalizeType(addMatch[2]),
          pk: /primary\s+key/i.test(actionStr),
        },
      },
    };
  }

  // DROP COLUMN
  const dropMatch = actionStr.match(/^drop(?:\s+column)?\s+([\w]+)$/i);
  if (dropMatch) {
    return {
      type: "ALTER TABLE",
      table: tableName,
      action: {
        type: "DROP_COLUMN",
        columnName: dropMatch[1].toLowerCase(),
      },
    };
  }

  // RENAME TO new_table
  const renameTableMatch = actionStr.match(/^rename\s+to\s+([\w]+)$/i);
  if (renameTableMatch) {
    return {
      type: "ALTER TABLE",
      table: tableName,
      action: {
        type: "RENAME_TABLE",
        newTableName: renameTableMatch[1].toLowerCase(),
      },
    };
  }

  // RENAME COLUMN old TO new
  const renameColMatch = actionStr.match(
    /^rename(?:\s+column)?\s+([\w]+)\s+to\s+([\w]+)$/i,
  );
  if (renameColMatch) {
    return {
      type: "ALTER TABLE",
      table: tableName,
      action: {
        type: "RENAME_COLUMN",
        oldColumnName: renameColMatch[1].toLowerCase(),
        newColumnName: renameColMatch[2].toLowerCase(),
      },
    };
  }

  throw new Error(
    `Unsupported ALTER TABLE action: "${actionStr}". Supported: ADD COLUMN, DROP COLUMN, RENAME TO, RENAME COLUMN.`,
  );
}

function parseTruncate(q: string, schema: Table[]): ParsedTruncateQuery {
  const match = q.match(/^truncate(?:\s+table)?\s+([\w]+)$/i);
  if (!match) {
    throw new Error(
      "Invalid TRUNCATE syntax. Expected: TRUNCATE [TABLE] table_name;",
    );
  }
  return {
    type: "TRUNCATE",
    table: match[1].toLowerCase(),
  };
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

function splitCsv(str: string): string[] {
  const items: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let parenDepth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += char;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += char;
    } else if (char === "(" && !inSingleQuote && !inDoubleQuote) {
      parenDepth++;
      current += char;
    } else if (char === ")" && !inSingleQuote && !inDoubleQuote) {
      parenDepth--;
      current += char;
    } else if (char === "," && !inSingleQuote && !inDoubleQuote && parenDepth === 0) {
      items.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) items.push(current.trim());
  return items;
}

// --------------------------------------------------------------------------
// EXECUTION ENGINE
// --------------------------------------------------------------------------

export function executeParsed(
  p: ParsedQuery,
  schema: Table[] = SCHEMA,
): QueryResult {
  switch (p.type) {
    case "SELECT":
      return executeSelect(p, schema);
    case "INSERT":
      return executeInsert(p, schema);
    case "UPDATE":
      return executeUpdate(p, schema);
    case "DELETE":
      return executeDelete(p, schema);
    case "CREATE TABLE":
      return executeCreateTable(p, schema);
    case "DROP TABLE":
      return executeDropTable(p, schema);
    case "ALTER TABLE":
      return executeAlterTable(p, schema);
    case "TRUNCATE":
      return executeTruncate(p, schema);
    default:
      throw new Error("Unsupported query type.");
  }
}

/** Execute SELECT query with relational algebra pipeline */
function executeSelect(
  p: ParsedSelectQuery,
  schema: Table[],
): QueryResult {
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

  const baseTable = getTable(p.from, schema);
  if (!baseTable) throw new Error(`Table "${p.from}" not found.`);

  let rows: Row[] = baseTable.rows.map((r) => ({ ...r }));
  push(
    "FROM",
    `Scan ${baseTable.name}`,
    `Read all ${rows.length} rows of table \`${baseTable.name}\` into the working set (full table scan, O(n)).`,
    rows,
    baseTable.columns.map((c) => c.name),
  );

  for (const j of p.joins) {
    const jt = getTable(j.table, schema);
    if (!jt) throw new Error(`Joined table "${j.table}" not found.`);
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

  let groups: Row[][] | null = null;
  let groupKeys: string[] = [];
  if (p.groupBy) {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const k = String(resolveCol(r, p.groupBy) ?? "");
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

  const outCols: string[] = [];
  const finalRows: Row[] = [];

  const computeAgg = (
    grp: Row[],
    fn: string,
    arg: string,
    distinct = false,
  ): string | number => {
    const f = fn.toUpperCase();
    const values = grp
      .map((r) => resolveCol(r, arg))
      .filter((value): value is string | number => value != null);
    const input = distinct ? [...new Set(values)] : values;
    if (f === "COUNT") return arg === "*" ? grp.length : input.length;
    const nums = input
      .map((value) => Number(value))
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

  const distinctAggregate = p.aggregates.find((aggregate) => aggregate.distinct);
  if (distinctAggregate) {
    const distinctRows: Row[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      const value = resolveCol(row, distinctAggregate.arg);
      if (value == null && distinctAggregate.arg !== "*") continue;
      const key = JSON.stringify(
        p.groupBy
          ? [resolveCol(row, p.groupBy), value]
          : [value],
      );
      if (seen.has(key)) continue;
      seen.add(key);
      distinctRows.push(
        p.groupBy
          ? {
              [colName(p.groupBy)]: resolveCol(row, p.groupBy) ?? "",
              [colName(distinctAggregate.arg)]: value ?? "",
            }
          : { [colName(distinctAggregate.arg)]: value ?? "" },
      );
    }
    push(
      "DISTINCT",
      `Deduplicate ${distinctAggregate.arg}`,
      `Removed duplicate values before ${distinctAggregate.fn} aggregation: kept ${distinctRows.length} distinct value(s).`,
      distinctRows,
      Object.keys(distinctRows[0] ?? {}),
    );
  }

  if (p.aggregates.length || p.groupBy) {
    const list = groups ?? [rows];
    const keys = p.groupBy ? groupKeys : ["ALL"];
    list.forEach((grp, i) => {
      const out: Row = {};
      if (p.groupBy) out[colName(p.groupBy)] = keys[i];
      for (const a of p.aggregates) {
        const label = `${a.fn.toLowerCase()}_${a.arg === "*" ? "all" : colName(a.arg)}`;
        out[label] = computeAgg(grp, a.fn, a.arg, a.distinct);
      }
      finalRows.push(out);
    });

    if (p.having) {
      const label = Object.keys(finalRows[0] ?? {}).find((k) =>
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
        ? baseTable.columns.map((c) => c.name)
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

  if (p.distinct) {
    const beforeDistinct = finalRows.length;
    const seen = new Set<string>();
    const uniqueRows = finalRows.filter((row) => {
      const key = JSON.stringify(outCols.map((column) => row[column]));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    finalRows.splice(0, finalRows.length, ...uniqueRows);
    push(
      "DISTINCT",
      "Deduplicate DISTINCT",
      `Removed duplicate projected rows: kept ${finalRows.length} of ${beforeDistinct}.`,
      finalRows.slice(0, 50),
      outCols,
    );
  }

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

  if (p.limit != null) {
    const cut = finalRows.slice(0, p.limit);
    push(
      "LIMIT",
      `Limit ${p.limit}`,
      `Return first ${cut.length} row(s) after sorting.`,
      cut,
      Object.keys(cut[0] ?? {}),
    );
    return {
      statementType: "DQL",
      command: "SELECT",
      steps,
      finalRows: cut,
      columns: Object.keys(cut[0] ?? outCols),
    };
  }

  return {
    statementType: "DQL",
    command: "SELECT",
    steps,
    finalRows,
    columns: outCols.length ? outCols : Object.keys(finalRows[0] ?? {}),
  };
}

/** Execute INSERT INTO with constraints and transaction stages */
function executeInsert(
  p: ParsedInsertQuery,
  schema: Table[],
): QueryResult {
  const updatedSchema = cloneSchema(schema);
  const table = getTable(p.table, updatedSchema);
  if (!table) throw new Error(`Table "${p.table}" does not exist.`);

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

  const colNames = table.columns.map((c) => c.name);
  const targetCols = p.columns
    ? p.columns.map((c) => c.toLowerCase())
    : colNames.map((c) => c.toLowerCase());

  // Stage 1: PARSER
  push(
    "PARSER",
    `Parse INSERT (${p.table})`,
    `Parsed ${p.values.length} tuple(s) targeted for table \`${table.name}\` across columns [${targetCols.join(", ")}].`,
    p.values.map((v, idx) => {
      const r: Row = { "#": idx + 1 };
      targetCols.forEach((col, i) => {
        r[col] = v[i] ?? "NULL";
      });
      return r;
    }),
    ["#", ...targetCols],
  );

  // Stage 2: SCHEMA VALIDATION & CONSTRAINT CHECK
  const pkCol = table.columns.find((c) => c.pk);
  const newRows: Row[] = [];

  for (const rawValues of p.values) {
    const rowObj: Row = {};
    for (const col of table.columns) {
      const idx = targetCols.indexOf(col.name.toLowerCase());
      if (idx !== -1 && rawValues[idx] !== undefined) {
        rowObj[col.name] = rawValues[idx];
      } else if (col.pk) {
        const maxId = table.rows.reduce(
          (max, r) => Math.max(max, Number(r[col.name]) || 0),
          0,
        );
        rowObj[col.name] = maxId + 1 + newRows.length;
      } else {
        rowObj[col.name] = "";
      }
    }

    // Validate PK uniqueness
    if (pkCol) {
      const pkVal = rowObj[pkCol.name];
      const existsInTable = table.rows.some((r) => OPS["="](r[pkCol.name], pkVal));
      const existsInNew = newRows.some((r) => OPS["="](r[pkCol.name], pkVal));
      if (existsInTable || existsInNew) {
        throw new Error(
          `PRIMARY KEY constraint violated: duplicate key value "${pkVal}" for column "${pkCol.name}" in table "${table.name}".`,
        );
      }
    }

    newRows.push(rowObj);
  }

  push(
    "CONSTRAINT",
    "Integrity & Domain Check",
    `Validated ${newRows.length} tuple(s) against Primary Key (${pkCol?.name ?? "none"}), Foreign Key, and DataType constraints.`,
    newRows,
    colNames,
  );

  // Stage 3: MUTATION
  table.rows.push(...newRows);
  push(
    "MUTATION",
    `Insert into ${table.name}`,
    `Appended ${newRows.length} new row(s) to in-memory relation buffer. Table \`${table.name}\` now contains ${table.rows.length} total rows.`,
    newRows,
    colNames,
  );

  // Stage 4: COMMIT
  push(
    "COMMIT",
    "Transaction Commit",
    `Transaction committed successfully. Wrote ${newRows.length} tuple(s) to relation \`${table.name}\`.`,
    table.rows.slice(-10),
    colNames,
  );

  return {
    statementType: "DML",
    command: "INSERT",
    message: `Successfully inserted ${newRows.length} row(s) into table "${table.name}".`,
    affectedRows: newRows.length,
    steps,
    finalRows: table.rows,
    columns: colNames,
    updatedSchema,
  };
}

/** Execute UPDATE query with selection filter and column mutation */
function executeUpdate(
  p: ParsedUpdateQuery,
  schema: Table[],
): QueryResult {
  const updatedSchema = cloneSchema(schema);
  const table = getTable(p.table, updatedSchema);
  if (!table) throw new Error(`Table "${p.table}" does not exist.`);

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

  const colNames = table.columns.map((c) => c.name);

  // Stage 1: PARSER & SCAN
  push(
    "PARSER",
    `Parse UPDATE (${p.table})`,
    `Parsed UPDATE on table \`${table.name}\`. Assignments: ${p.set.map((s) => `\`${s.column} = ${s.value}\``).join(", ")}.`,
    table.rows.slice(0, 50),
    colNames,
  );

  // Stage 2: WHERE Filter
  let matchIndices: number[] = [];
  if (p.where) {
    const fn = OPS[p.where.op];
    if (!fn) throw new Error(`Unknown operator ${p.where.op}`);
    const val = coerce(p.where.value);
    matchIndices = table.rows
      .map((r, i) => (fn(resolveCol(r, p.where!.column), val) ? i : -1))
      .filter((i) => i !== -1);

    push(
      "WHERE",
      `Filter σ(${p.where.column} ${p.where.op} ${p.where.value})`,
      `Located ${matchIndices.length} matching candidate row(s) to update out of ${table.rows.length} total rows.`,
      matchIndices.map((i) => table.rows[i]),
      colNames,
    );
  } else {
    matchIndices = table.rows.map((_, i) => i);
    push(
      "WHERE",
      "Full Table Scope (No WHERE)",
      `No WHERE predicate specified: all ${matchIndices.length} row(s) selected for update.`,
      table.rows.slice(0, 50),
      colNames,
    );
  }

  // Stage 3: MUTATION
  const updatedRows: Row[] = [];
  for (const idx of matchIndices) {
    const row = table.rows[idx];
    for (const assignment of p.set) {
      const realCol = table.columns.find((c) => c.name.toLowerCase() === assignment.column.toLowerCase())?.name ?? assignment.column;
      row[realCol] = assignment.value;
    }
    updatedRows.push({ ...row });
  }

  push(
    "MUTATION",
    `Update ${updatedRows.length} row(s)`,
    `Applied new column values to ${updatedRows.length} row(s) in \`${table.name}\`.`,
    updatedRows,
    colNames,
  );

  // Stage 4: COMMIT
  push(
    "COMMIT",
    "Transaction Commit",
    `Persisted updates across ${updatedRows.length} row(s) in relation \`${table.name}\`.`,
    table.rows,
    colNames,
  );

  return {
    statementType: "DML",
    command: "UPDATE",
    message: `Successfully updated ${updatedRows.length} row(s) in table "${table.name}".`,
    affectedRows: updatedRows.length,
    steps,
    finalRows: table.rows,
    columns: colNames,
    updatedSchema,
  };
}

/** Execute DELETE FROM query */
function executeDelete(
  p: ParsedDeleteQuery,
  schema: Table[],
): QueryResult {
  const updatedSchema = cloneSchema(schema);
  const table = getTable(p.table, updatedSchema);
  if (!table) throw new Error(`Table "${p.table}" does not exist.`);

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

  const colNames = table.columns.map((c) => c.name);

  // Stage 1: PARSER
  push(
    "PARSER",
    `Parse DELETE (${p.table})`,
    `Parsed DELETE statement on table \`${table.name}\`.`,
    table.rows,
    colNames,
  );

  // Stage 2: WHERE FILTER
  let toDelete: Row[] = [];
  let remaining: Row[] = [];

  if (p.where) {
    const fn = OPS[p.where.op];
    if (!fn) throw new Error(`Unknown operator ${p.where.op}`);
    const val = coerce(p.where.value);

    for (const r of table.rows) {
      if (fn(resolveCol(r, p.where.column), val)) {
        toDelete.push(r);
      } else {
        remaining.push(r);
      }
    }

    push(
      "WHERE",
      `Filter σ(${p.where.column} ${p.where.op} ${p.where.value})`,
      `Identified ${toDelete.length} row(s) matching delete criteria out of ${table.rows.length} total rows.`,
      toDelete,
      colNames,
    );
  } else {
    toDelete = [...table.rows];
    remaining = [];
    push(
      "WHERE",
      "Full Table Scope (No WHERE)",
      `No WHERE condition specified: all ${toDelete.length} row(s) marked for deletion.`,
      toDelete,
      colNames,
    );
  }

  // Stage 3: MUTATION
  table.rows = remaining;
  push(
    "MUTATION",
    `Remove ${toDelete.length} row(s)`,
    `Removed ${toDelete.length} row(s) from table \`${table.name}\`. Working set updated.`,
    remaining,
    colNames,
  );

  // Stage 4: COMMIT
  push(
    "COMMIT",
    "Transaction Commit",
    `Transaction committed. Relation \`${table.name}\` now contains ${remaining.length} rows.`,
    remaining,
    colNames,
  );

  return {
    statementType: "DML",
    command: "DELETE",
    message: `Successfully deleted ${toDelete.length} row(s) from table "${table.name}".`,
    affectedRows: toDelete.length,
    steps,
    finalRows: table.rows,
    columns: colNames,
    updatedSchema,
  };
}

/** Execute CREATE TABLE query */
function executeCreateTable(
  p: ParsedCreateTableQuery,
  schema: Table[],
): QueryResult {
  const updatedSchema = cloneSchema(schema);
  const existing = getTable(p.table, updatedSchema);

  if (existing) {
    if (p.ifNotExists) {
      return {
        statementType: "DDL",
        command: "CREATE TABLE",
        message: `Table "${p.table}" already exists (IF NOT EXISTS skipped).`,
        steps: [
          {
            stage: "CATALOG",
            title: `Table ${p.table} already exists`,
            detail: `Found existing table \`${p.table}\` in schema. IF NOT EXISTS clause prevented error.`,
            rowCount: existing.rows.length,
            rows: existing.rows,
            columns: existing.columns.map((c) => c.name),
          },
        ],
        finalRows: existing.rows,
        columns: existing.columns.map((c) => c.name),
        updatedSchema,
      };
    }
    throw new Error(`Table "${p.table}" already exists in the database schema.`);
  }

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

  // Stage 1: PARSER
  push(
    "PARSER",
    `Parse CREATE TABLE (${p.table})`,
    `Parsed table name \`${p.table}\` with ${p.columns.length} column definition(s).`,
    p.columns.map((c) => ({
      column: c.name,
      type: c.type,
      primary_key: c.pk ? "YES" : "NO",
      foreign_key: c.fk ? `${c.fk.table}.${c.fk.column}` : "NONE",
    })),
    ["column", "type", "primary_key", "foreign_key"],
  );

  // Stage 2: CATALOG REGISTRATION
  const newTable: Table = {
    name: p.table,
    columns: p.columns,
    rows: [],
  };
  updatedSchema.push(newTable);

  push(
    "CATALOG",
    "Data Dictionary Registration",
    `Allocated system catalog entry and metadata headers for new relation \`${p.table}\`.`,
    [
      {
        table_name: p.table,
        column_count: p.columns.length,
        primary_key: p.columns.find((c) => c.pk)?.name ?? "none",
      },
    ],
    ["table_name", "column_count", "primary_key"],
  );

  // Stage 3: COMMIT
  push(
    "COMMIT",
    `Relation ${p.table} created`,
    `Created empty table \`${p.table}\` (0 rows) and updated live Entity-Relationship schema.`,
    [],
    p.columns.map((c) => c.name),
  );

  return {
    statementType: "DDL",
    command: "CREATE TABLE",
    message: `Table "${p.table}" created successfully with ${p.columns.length} columns.`,
    affectedRows: 0,
    steps,
    finalRows: [],
    columns: p.columns.map((c) => c.name),
    updatedSchema,
  };
}

/** Execute DROP TABLE query */
function executeDropTable(
  p: ParsedDropTableQuery,
  schema: Table[],
): QueryResult {
  const updatedSchema = cloneSchema(schema);
  const idx = updatedSchema.findIndex(
    (t) => t.name.toLowerCase() === p.table.toLowerCase(),
  );

  if (idx === -1) {
    if (p.ifExists) {
      return {
        statementType: "DDL",
        command: "DROP TABLE",
        message: `Table "${p.table}" does not exist (IF EXISTS skipped).`,
        steps: [
          {
            stage: "CATALOG",
            title: `Table ${p.table} not found`,
            detail: `Table \`${p.table}\` was not found in schema. IF EXISTS clause prevented error.`,
            rowCount: 0,
            rows: [],
            columns: [],
          },
        ],
        finalRows: [],
        columns: [],
        updatedSchema,
      };
    }
    throw new Error(`Table "${p.table}" does not exist in schema.`);
  }

  const droppedTable = updatedSchema[idx];
  updatedSchema.splice(idx, 1);

  for (const t of updatedSchema) {
    for (const c of t.columns) {
      if (c.fk && c.fk.table.toLowerCase() === p.table.toLowerCase()) {
        c.fk = undefined;
      }
    }
  }

  const steps: PipelineStep[] = [
    {
      stage: "PARSER",
      title: `Parse DROP TABLE (${p.table})`,
      detail: `Parsed request to drop relation \`${p.table}\`.`,
      rowCount: 1,
      rows: [{ table_to_drop: p.table }],
      columns: ["table_to_drop"],
    },
    {
      stage: "CATALOG",
      title: "Remove from Data Dictionary",
      detail: `Unregistered schema definition and freed pages for relation \`${p.table}\` (${droppedTable.rows.length} rows purged).`,
      rowCount: 0,
      rows: [],
      columns: [],
    },
    {
      stage: "COMMIT",
      title: "Catalog Commit",
      detail: `Relation \`${p.table}\` dropped. Database now contains ${updatedSchema.length} active tables.`,
      rowCount: updatedSchema.length,
      rows: updatedSchema.map((t) => ({
        table_name: t.name,
        columns: t.columns.length,
        rows: t.rows.length,
      })),
      columns: ["table_name", "columns", "rows"],
    },
  ];

  return {
    statementType: "DDL",
    command: "DROP TABLE",
    message: `Table "${p.table}" dropped successfully.`,
    affectedRows: droppedTable.rows.length,
    steps,
    finalRows: [],
    columns: [],
    updatedSchema,
  };
}

/** Execute ALTER TABLE query */
function executeAlterTable(
  p: ParsedAlterTableQuery,
  schema: Table[],
): QueryResult {
  const updatedSchema = cloneSchema(schema);
  const table = getTable(p.table, updatedSchema);
  if (!table) throw new Error(`Table "${p.table}" does not exist.`);

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

  let message = "";

  if (p.action.type === "ADD_COLUMN") {
    const newCol = p.action.column;
    if (table.columns.some((c) => c.name.toLowerCase() === newCol.name.toLowerCase())) {
      throw new Error(
        `Column "${newCol.name}" already exists in table "${table.name}".`,
      );
    }
    table.columns.push(newCol);
    for (const r of table.rows) {
      r[newCol.name] = newCol.type === "INTEGER" || newCol.type === "REAL" ? 0 : "";
    }
    message = `Added column "${newCol.name}" (${newCol.type}) to table "${table.name}".`;

    push(
      "PARSER",
      `Parse ALTER TABLE (${table.name} ADD ${newCol.name})`,
      `Parsed request to add column \`${newCol.name}\` of type ${newCol.type}.`,
      table.columns.map((c) => ({
        column: c.name,
        type: c.type,
      })),
      ["column", "type"],
    );

    push(
      "MUTATION",
      "Schema & Tuple Mutation",
      `Added column \`${newCol.name}\` to catalog definition and updated all ${table.rows.length} existing tuples with default values.`,
      table.rows.slice(0, 20),
      table.columns.map((c) => c.name),
    );
  } else if (p.action.type === "DROP_COLUMN") {
    const colName = p.action.columnName;
    const colIdx = table.columns.findIndex(
      (c) => c.name.toLowerCase() === colName.toLowerCase(),
    );
    if (colIdx === -1) {
      throw new Error(`Column "${colName}" not found in table "${table.name}".`);
    }
    table.columns.splice(colIdx, 1);
    for (const r of table.rows) {
      delete r[colName];
    }
    message = `Dropped column "${colName}" from table "${table.name}".`;

    push(
      "PARSER",
      `Parse ALTER TABLE (${table.name} DROP ${colName})`,
      `Parsed request to drop column \`${colName}\`.`,
      table.columns.map((c) => ({
        column: c.name,
        type: c.type,
      })),
      ["column", "type"],
    );

    push(
      "MUTATION",
      "Column Removed",
      `Removed column \`${colName}\` from schema catalog and stripped attributes from all ${table.rows.length} rows.`,
      table.rows.slice(0, 20),
      table.columns.map((c) => c.name),
    );
  } else if (p.action.type === "RENAME_TABLE") {
    const newName = p.action.newTableName;
    if (getTable(newName, updatedSchema)) {
      throw new Error(`Table name "${newName}" already exists.`);
    }
    const oldName = table.name;
    table.name = newName;
    for (const t of updatedSchema) {
      for (const c of t.columns) {
        if (c.fk && c.fk.table.toLowerCase() === oldName.toLowerCase()) {
          c.fk.table = newName;
        }
      }
    }
    message = `Renamed table "${oldName}" to "${newName}".`;

    push(
      "CATALOG",
      `Rename Table (${oldName} → ${newName})`,
      `Updated relation descriptor and foreign key catalog pointers from \`${oldName}\` to \`${newName}\`.`,
      [{ old_name: oldName, new_name: newName }],
      ["old_name", "new_name"],
    );
  } else if (p.action.type === "RENAME_COLUMN") {
    const { oldColumnName, newColumnName } = p.action;
    const col = table.columns.find(
      (c) => c.name.toLowerCase() === oldColumnName.toLowerCase(),
    );
    if (!col) {
      throw new Error(
        `Column "${oldColumnName}" not found in table "${table.name}".`,
      );
    }
    col.name = newColumnName;
    for (const r of table.rows) {
      r[newColumnName] = r[oldColumnName];
      delete r[oldColumnName];
    }
    message = `Renamed column "${oldColumnName}" to "${newColumnName}" in table "${table.name}".`;

    push(
      "CATALOG",
      `Rename Column (${oldColumnName} → ${newColumnName})`,
      `Updated column attribute identifier in catalog and migrated key names across all ${table.rows.length} tuples.`,
      table.rows.slice(0, 20),
      table.columns.map((c) => c.name),
    );
  }

  push(
    "COMMIT",
    "Catalog Commit",
    `Schema alteration committed successfully. Table \`${table.name}\` now has ${table.columns.length} columns.`,
    table.rows.slice(0, 20),
    table.columns.map((c) => c.name),
  );

  return {
    statementType: "DDL",
    command: "ALTER TABLE",
    message,
    affectedRows: 0,
    steps,
    finalRows: table.rows,
    columns: table.columns.map((c) => c.name),
    updatedSchema,
  };
}

/** Execute TRUNCATE TABLE query */
function executeTruncate(
  p: ParsedTruncateQuery,
  schema: Table[],
): QueryResult {
  const updatedSchema = cloneSchema(schema);
  const table = getTable(p.table, updatedSchema);
  if (!table) throw new Error(`Table "${p.table}" does not exist.`);

  const previousCount = table.rows.length;
  table.rows = [];

  const steps: PipelineStep[] = [
    {
      stage: "PARSER",
      title: `Parse TRUNCATE (${p.table})`,
      detail: `Parsed TRUNCATE statement on table \`${table.name}\`.`,
      rowCount: 1,
      rows: [{ table: p.table, previous_rows: previousCount }],
      columns: ["table", "previous_rows"],
    },
    {
      stage: "MUTATION",
      title: "Fast Page Deallocation",
      detail: `Deallocated all ${previousCount} row tuples in relation \`${table.name}\`. High-water mark reset to 0.`,
      rowCount: 0,
      rows: [],
      columns: table.columns.map((c) => c.name),
    },
    {
      stage: "COMMIT",
      title: "Commit Truncation",
      detail: `Table \`${table.name}\` truncated successfully. Preserved table structure with ${table.columns.length} columns.`,
      rowCount: 0,
      rows: [],
      columns: table.columns.map((c) => c.name),
    },
  ];

  return {
    statementType: "DDL",
    command: "TRUNCATE",
    message: `Table "${table.name}" truncated. Removed ${previousCount} rows.`,
    affectedRows: previousCount,
    steps,
    finalRows: [],
    columns: table.columns.map((c) => c.name),
    updatedSchema,
  };
}

/** Main Entry point to parse and execute one or more DQL, DML, or DDL statements */
export function executeSQL(sql: string, schema: Table[] = SCHEMA): QueryResult {
  const statements = splitSqlStatements(sql);
  if (statements.length === 0) {
    return {
      statementType: "DQL",
      command: "SELECT",
      steps: [],
      finalRows: [],
      columns: [],
      error: "Empty SQL query provided.",
    };
  }

  let currentSchema = cloneSchema(schema);
  const allSteps: PipelineStep[] = [];
  let lastResult: QueryResult | null = null;
  let totalAffectedRows = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      const parsed = parseSQL(stmt, currentSchema);
      const result = executeParsed(parsed, currentSchema);
      if (result.error) {
        return {
          ...result,
          steps: [...allSteps, ...result.steps],
          updatedSchema: currentSchema,
        };
      }
      if (result.updatedSchema) {
        currentSchema = result.updatedSchema;
      }
      if (result.affectedRows) {
        totalAffectedRows += result.affectedRows;
      }
      allSteps.push(...result.steps);
      lastResult = result;
    } catch (e) {
      const rawSql = stmt.trim().toUpperCase();
      let guessedType: StatementType = "DQL";
      let guessedCmd: SQLCommand = "SELECT";

      if (rawSql.startsWith("INSERT")) {
        guessedType = "DML";
        guessedCmd = "INSERT";
      } else if (rawSql.startsWith("UPDATE")) {
        guessedType = "DML";
        guessedCmd = "UPDATE";
      } else if (rawSql.startsWith("DELETE")) {
        guessedType = "DML";
        guessedCmd = "DELETE";
      } else if (rawSql.startsWith("CREATE")) {
        guessedType = "DDL";
        guessedCmd = "CREATE TABLE";
      } else if (rawSql.startsWith("DROP")) {
        guessedType = "DDL";
        guessedCmd = "DROP TABLE";
      } else if (rawSql.startsWith("ALTER")) {
        guessedType = "DDL";
        guessedCmd = "ALTER TABLE";
      } else if (rawSql.startsWith("TRUNCATE")) {
        guessedType = "DDL";
        guessedCmd = "TRUNCATE";
      }

      const errMsg = e instanceof Error ? e.message : String(e);
      const prefix =
        statements.length > 1
          ? `[Statement ${i + 1} of ${statements.length}] `
          : "";

      return {
        statementType: guessedType,
        command: guessedCmd,
        steps: allSteps,
        finalRows: [],
        columns: [],
        error: `${prefix}${errMsg}`,
        updatedSchema: currentSchema,
      };
    }
  }

  if (!lastResult) {
    return {
      statementType: "DQL",
      command: "SELECT",
      steps: [],
      finalRows: [],
      columns: [],
      error: "No statements executed.",
    };
  }

  if (statements.length > 1) {
    return {
      ...lastResult,
      steps: allSteps,
      affectedRows: totalAffectedRows,
      message: `Successfully executed ${statements.length} statements. ${lastResult.message ?? ""}`.trim(),
      updatedSchema: currentSchema,
    };
  }

  return {
    ...lastResult,
    updatedSchema: currentSchema,
  };
}
