// Rule-based Natural Language → SQL translator.
// Deterministic pattern matching keeps it fast (<2s), explainable and offline —
// a deliberate teaching choice: students can read every rule.

import { SCHEMA, type Table } from "./schema";

export interface NLResult {
  sql: string;
  confidence: number;
  matchedRules: string[];
  interpretation: string;
}

const AGG_WORDS: { re: RegExp; fn: string }[] = [
  { re: /\bhow many\b|\bcount\b|\bnumber of\b/i, fn: "COUNT" },
  { re: /\btotal\b|\bsum of\b/i, fn: "SUM" },
  { re: /\baverage\b|\bavg\b|\bmean\b/i, fn: "AVG" },
  { re: /\bmaximum\b|\bhighest\b|\bmax\b|\bmost expensive\b/i, fn: "MAX" },
  { re: /\bminimum\b|\blowest\b|\bmin\b/i, fn: "MIN" },
];

function findTable(text: string, schema: Table[]): string | null {
  for (const t of schema) {
    if (text.includes(t.name.toLowerCase())) return t.name;
    // crude singular/plural handling
    if (t.name.endsWith("s") && text.includes(t.name.slice(0, -1)))
      return t.name;
  }
  return null;
}

function findColumn(
  table: string,
  text: string,
  schema: Table[],
): string | null {
  const t = schema.find((x) => x.name === table)!;
  for (const c of t.columns) {
    if (text.includes(c.name.toLowerCase())) return c.name;
  }
  return null;
}

export function nlToSQL(input: string, schema: Table[] = SCHEMA): NLResult {
  const text = input.toLowerCase().trim();
  const rules: string[] = [];
  let conf = 0.3;

  // Detect intent
  const agg = AGG_WORDS.find((a) => a.re.test(text));
  const table = findTable(text, schema);
  if (!table) {
    return {
      sql: "",
      confidence: 0,
      matchedRules: [],
      interpretation:
        "Could not map the question to a known table. Try mentioning customers, products, orders or order_items.",
    };
  }
  rules.push(`table:${table}`);
  conf += 0.2;

  let sql = "";
  let interpretation = "";

  // Pattern 1: aggregation over whole table
  if (agg && !/per\s+\w+|by\s+\w+|each\s+\w+/.test(text)) {
    const col = findColumn(table, text, schema);
    const arg = col ?? "*";
    sql = `SELECT ${agg.fn}(${arg}) FROM ${table};`;
    interpretation = `Aggregate query: ${agg.fn} of ${arg === "*" ? "all rows" : `\`${col}\``} in \`${table}\`.`;
    rules.push(`aggregate:${agg.fn}(${arg})`);
    conf += 0.3;
  }

  // Pattern 2: grouped aggregation ("... per city", "... by category")
  else if (agg) {
    const m = text.match(/\b(?:per|by|each)\s+(\w+)/);
    const groupCol = m ? findColumn(table, m[1], schema) : null;
    const valCol = findColumn(table, text, schema);
    const arg = valCol && valCol !== groupCol ? valCol : "*";
    if (!groupCol) {
      sql = `SELECT ${agg.fn}(${arg}) FROM ${table};`;
      interpretation = `Simple aggregate ${agg.fn}(${arg}) on \`${table}\`.`;
    } else {
      sql = `SELECT ${groupCol}, ${agg.fn}(${arg}) FROM ${table} GROUP BY ${groupCol};`;
      interpretation = `Grouped aggregate: ${agg.fn}(${arg}) for each distinct \`${groupCol}\` in \`${table}\`.`;
      rules.push(`groupBy:${groupCol}`);
    }
    rules.push(`aggregate:${agg.fn}(${arg})`);
    conf += 0.35;
  }

  // Pattern 3: filter + list ("show/list ... where/in/above/below")
  else {
    const cols = schema
      .find((x) => x.name === table)!
      .columns.filter((c) => c.name !== "id")
      .map((c) => c.name);
    const sel = cols.join(", ");
    let where = "";

    const inMatch = text.match(/\bin\s+([a-z ]+)/);
    const cmpMatch =
      text.match(/\b(above|more than|greater than|over)\s+(?:₹?)(\d+)/) ||
      text.match(/\b(below|less than|under)\s+(?:₹?)(\d+)/);
    const namedMatch = text.match(
      /\b(?:named|called|of)\s+([a-z]+(?: [a-z]+)?)/,
    );

    if (cmpMatch) {
      const op = /above|more than|greater than|over/.test(cmpMatch[1])
        ? ">"
        : "<";
      const col =
        findColumn(table, text, schema) ??
        schema
          .find((x) => x.name === table)!
          .columns.find(
            (column) => column.type !== "TEXT" && column.name !== "id",
          )?.name ??
        "id";
      where = ` WHERE ${col} ${op} ${cmpMatch[2]}`;
      interpretation = `Filter \`${table}\` where \`${col}\` ${op} ${cmpMatch[2]}, then project readable columns.`;
      rules.push(`where:${col}${op}${cmpMatch[2]}`);
      conf += 0.3;
    } else if (inMatch) {
      const city = inMatch[1].trim().split(" ")[0];
      const col =
        findColumn(table, text, schema) ??
        schema
          .find((x) => x.name === table)!
          .columns.find((column) => column.type === "TEXT")?.name ??
        "name";
      where = ` WHERE ${col} = '${city.charAt(0).toUpperCase() + city.slice(1)}'`;
      interpretation = `Filter \`${table}\` where \`${col}\` equals '${city}', projecting readable columns.`;
      rules.push(`where:${col}='${city}'`);
      conf += 0.3;
    } else if (namedMatch) {
      const col = findColumn(table, text, schema) ?? "name";
      where = ` WHERE ${col} = '${namedMatch[1]}'`;
      interpretation = `Equality filter on \`${col}\`.`;
      rules.push(`where:${col}='${namedMatch[1]}'`);
      conf += 0.25;
    } else {
      interpretation = `Full listing of readable columns from \`${table}\`.`;
      conf += 0.15;
    }

    sql = `SELECT ${sel} FROM ${table}${where};`;
    rules.push(`project:[${sel}]`);
  }

  // ORDER BY / LIMIT hints
  if (/\btop\s+(\d+)\b/.test(text)) {
    const n = text.match(/\btop\s+(\d+)\b/)![1];
    sql = sql.replace(/;$/, "") + ` LIMIT ${n};`;
    rules.push(`limit:${n}`);
    interpretation += ` Limited to top ${n} results.`;
    conf += 0.05;
  }
  if (/\b(sorted|ordered) by (\w+)/.test(text)) {
    const col = text.match(/\b(sorted|ordered) by (\w+)/)![2];
    const real = findColumn(table, col, schema);
    if (real) {
      sql = sql.replace(/;$/, "") + ` ORDER BY ${real} DESC;`;
      rules.push(`orderBy:${real}`);
      interpretation += ` Sorted by \`${real}\` descending.`;
      conf += 0.05;
    }
  }

  return {
    sql,
    confidence: Math.min(conf, 1),
    matchedRules: rules,
    interpretation,
  };
}
