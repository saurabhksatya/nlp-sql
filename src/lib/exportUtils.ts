import type { Table } from "./schema";

/**
 * Generates full DDL (CREATE TABLE) and DML (INSERT INTO) SQL script for a dataset schema.
 */
export function generateDatasetSQL(datasetName: string, schema: Table[]): string {
  const lines: string[] = [
    `-- SQL Schema and Data Export for Dataset: ${datasetName}`,
    `-- Exported at: ${new Date().toISOString()}`,
    "",
  ];

  for (const table of schema) {
    lines.push(`-- Table: ${table.name}`);
    lines.push(`DROP TABLE IF EXISTS ${table.name};`);

    const colDefs = (table.columns || []).map((col) => {
      let def = `  ${col.name} ${col.type || "TEXT"}`;
      if (col.pk) def += " PRIMARY KEY";
      if (col.fk && col.fk.table) {
        def += ` REFERENCES ${col.fk.table}(${col.fk.column})`;
      }
      return def;
    });

    lines.push(`CREATE TABLE ${table.name} (\n${colDefs.join(",\n")}\n);`);
    lines.push("");

    if (table.rows && table.rows.length > 0) {
      const colNames = (table.columns || []).map((c) => c.name);
      lines.push(`INSERT INTO ${table.name} (${colNames.join(", ")}) VALUES`);

      const rowStrings = table.rows.map((row) => {
        const vals = colNames.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return "NULL";
          if (typeof val === "number") return String(val);
          if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        return `  (${vals.join(", ")})`;
      });

      lines.push(rowStrings.join(",\n") + ";");
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Generates CSV string for a single table in a dataset.
 */
export function generateTableCSV(table: Table): string {
  const escapeValue = (val: unknown) =>
    `"${String(val ?? "").replace(/"/g, '""')}"`;

  const colNames = (table.columns || []).map((c) => c.name);
  const header = colNames.map(escapeValue).join(",");
  const rows = (table.rows || []).map((row) =>
    colNames.map((col) => escapeValue(row[col])).join(",")
  );

  return [header, ...rows].join("\n");
}
