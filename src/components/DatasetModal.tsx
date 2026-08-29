"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  type Column,
  type ColumnType,
  type Dataset,
  type Table,
  erDiagramMermaid,
} from "@/lib/schema";
import { executeSQL } from "@/lib/sqlEngine";

interface DatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDataset: (dataset: Dataset) => void;
  dark?: boolean;
}

const COLUMN_TYPES: ColumnType[] = [
  "INTEGER",
  "TEXT",
  "REAL",
  "BOOLEAN",
  "DATE",
  "VARCHAR",
];

const DEFAULT_SQL_TEMPLATE = `-- Define your custom dataset tables and sample data:
CREATE TABLE authors (
  id INTEGER PRIMARY KEY,
  name TEXT,
  country TEXT
);

CREATE TABLE books (
  id INTEGER PRIMARY KEY,
  title TEXT,
  genre TEXT,
  price REAL,
  author_id INTEGER REFERENCES authors(id)
);

INSERT INTO authors (id, name, country) VALUES
  (1, 'Jane Austen', 'United Kingdom'),
  (2, 'George Orwell', 'United Kingdom'),
  (3, 'Haruki Murakami', 'Japan');

INSERT INTO books (id, title, genre, price, author_id) VALUES
  (101, 'Pride and Prejudice', 'Romance', 499, 1),
  (102, '1984', 'Dystopian', 399, 2),
  (103, 'Norwegian Wood', 'Fiction', 599, 3);
`;

export function DatasetModal({
  isOpen,
  onClose,
  onCreateDataset,
  dark = false,
}: DatasetModalProps) {
  const [mode, setMode] = useState<"visual" | "sql">("visual");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Visual builder state
  const [tables, setTables] = useState<Table[]>([
    {
      name: "items",
      columns: [
        { name: "id", type: "INTEGER", pk: true },
        { name: "name", type: "TEXT" },
        { name: "price", type: "REAL" },
      ],
      rows: [
        { id: 1, name: "Item Alpha", price: 100 },
        { id: 2, name: "Item Beta", price: 250 },
      ],
    },
  ]);
  const [newTableName, setNewTableName] = useState("");

  // SQL Script state
  const [sqlScript, setSqlScript] = useState(DEFAULT_SQL_TEMPLATE);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setError(null);
      setMode("visual");
      setTables([
        {
          name: "items",
          columns: [
            { name: "id", type: "INTEGER", pk: true },
            { name: "name", type: "TEXT" },
            { name: "price", type: "REAL" },
          ],
          rows: [
            { id: 1, name: "Item Alpha", price: 100 },
            { id: 2, name: "Item Beta", price: 250 },
          ],
        },
      ]);
      setSqlScript(DEFAULT_SQL_TEMPLATE);
    }
  }, [isOpen]);

  // Handle Table Add in Visual Mode
  const handleAddTable = () => {
    const trimmed = newTableName.trim().toLowerCase();
    if (!trimmed) {
      setError("Table name cannot be empty.");
      return;
    }
    if (tables.some((t) => t.name.toLowerCase() === trimmed)) {
      setError(`Table "${trimmed}" already exists.`);
      return;
    }
    setTables((prev) => [
      ...prev,
      {
        name: trimmed,
        columns: [{ name: "id", type: "INTEGER", pk: true }],
        rows: [],
      },
    ]);
    setNewTableName("");
    setError(null);
  };

  const handleRemoveTable = (tableIndex: number) => {
    setTables((prev) => prev.filter((_, idx) => idx !== tableIndex));
  };

  const handleAddColumn = (tableIndex: number) => {
    setTables((prev) => {
      const updated = [...prev];
      const table = { ...updated[tableIndex] };
      const colNum = table.columns.length + 1;
      table.columns = [
        ...table.columns,
        { name: `col_${colNum}`, type: "TEXT" },
      ];
      updated[tableIndex] = table;
      return updated;
    });
  };

  const handleUpdateColumn = (
    tableIndex: number,
    columnIndex: number,
    updates: Partial<Column>,
  ) => {
    setTables((prev) => {
      const updated = [...prev];
      const table = { ...updated[tableIndex] };
      const columns = [...table.columns];
      columns[columnIndex] = { ...columns[columnIndex], ...updates };
      table.columns = columns;
      updated[tableIndex] = table;
      return updated;
    });
  };

  const handleRemoveColumn = (tableIndex: number, columnIndex: number) => {
    setTables((prev) => {
      const updated = [...prev];
      const table = { ...updated[tableIndex] };
      table.columns = table.columns.filter((_, idx) => idx !== columnIndex);
      updated[tableIndex] = table;
      return updated;
    });
  };

  // Live ER diagram calculation for preview
  const liveMermaid = useMemo(() => {
    return erDiagramMermaid(tables);
  }, [tables]);

  // Handle submission
  const handleSave = () => {
    setError(null);
    const datasetName = name.trim() || "Custom Dataset";
    const datasetId = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    if (mode === "visual") {
      if (tables.length === 0) {
        setError("Please add at least one table to your dataset.");
        return;
      }
      for (const t of tables) {
        if (!t.name.trim()) {
          setError("All tables must have a valid name.");
          return;
        }
        if (!t.columns || t.columns.length === 0) {
          setError(`Table "${t.name}" must have at least one column.`);
          return;
        }
      }

      const defaultQuery = tables[0]?.name
        ? `SELECT * FROM ${tables[0].name} LIMIT 10;`
        : "SELECT 1;";

      const newDataset: Dataset = {
        id: datasetId,
        name: datasetName,
        description:
          description.trim() || `Custom dataset with ${tables.length} tables`,
        schema: tables,
        defaultQuery,
        examples: [
          {
            id: 1,
            category: "DQL",
            question: `Show all records from ${tables[0].name}`,
            sql: defaultQuery,
            expected: `Query all rows from ${tables[0].name}`,
          },
        ],
        isCustom: true,
        createdAt: Date.now(),
      };

      onCreateDataset(newDataset);
      onClose();
    } else {
      // SQL mode
      try {
        const result = executeSQL(sqlScript, []);
        if (result.error) {
          setError(`SQL Execution Error: ${result.error}`);
          return;
        }
        if (!result.updatedSchema || result.updatedSchema.length === 0) {
          setError("No tables were created. Make sure your SQL contains CREATE TABLE statements.");
          return;
        }

        const schema = result.updatedSchema;
        const defaultQuery = schema[0]?.name
          ? `SELECT * FROM ${schema[0].name} LIMIT 10;`
          : "SELECT 1;";

        const newDataset: Dataset = {
          id: datasetId,
          name: datasetName,
          description:
            description.trim() || `Created via SQL (${schema.length} tables)`,
          schema,
          defaultQuery,
          examples: [
            {
              id: 1,
              category: "DQL",
              question: `Query ${schema[0].name}`,
              sql: defaultQuery,
              expected: `Sample query on ${schema[0].name}`,
            },
          ],
          isCustom: true,
          createdAt: Date.now(),
        };

        onCreateDataset(newDataset);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to execute SQL script.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-w-3xl w-full max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden border"
        style={{
          background: "var(--panel)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
              Create New Dataset
            </h2>
            <p className="text-xs opacity-75" style={{ color: "var(--muted)" }}>
              Build your custom database tables with schema definitions, primary keys, and relationships.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-sm transition-opacity hover:opacity-75"
            style={{ color: "var(--muted)" }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-lg">
              {error}
            </div>
          )}

          {/* Dataset Name and Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "var(--muted)" }}
              >
                Dataset Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bookstore, Healthcare DB"
                className="w-full p-2 text-sm rounded-lg border focus:outline-none"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "var(--muted)" }}
              >
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of your dataset"
                className="w-full p-2 text-sm rounded-lg border focus:outline-none"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
          </div>

          {/* Mode Switcher */}
          <div
            className="flex border rounded-lg overflow-hidden text-xs font-semibold"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              onClick={() => setMode("visual")}
              className="flex-1 py-2 text-center transition-colors cursor-pointer"
              style={{
                background: mode === "visual" ? "var(--accent)" : "var(--surface-subtle)",
                color: mode === "visual" ? "var(--accent-foreground)" : "var(--muted)",
              }}
            >
              Visual Table Builder
            </button>
            <button
              type="button"
              onClick={() => setMode("sql")}
              className="flex-1 py-2 text-center transition-colors cursor-pointer"
              style={{
                background: mode === "sql" ? "var(--accent)" : "var(--surface-subtle)",
                color: mode === "sql" ? "var(--accent-foreground)" : "var(--muted)",
              }}
            >
              SQL DDL Script
            </button>
          </div>

          {/* Mode 1: Visual Table Builder */}
          {mode === "visual" && (
            <div className="space-y-4">
              {/* Add Table input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTable()}
                  placeholder="New table name (e.g. orders, patients)"
                  className="flex-1 p-2 text-sm rounded-lg border focus:outline-none"
                  style={{
                    background: "var(--surface-subtle)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTable}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs border"
                  style={{
                    background: "var(--accent-gradient, var(--accent))",
                    color: "var(--accent-foreground)",
                    borderColor: "var(--accent)",
                  }}
                >
                  + Add Table
                </button>
              </div>

              {/* Tables List */}
              <div className="space-y-3">
                {tables.map((table, tIdx) => (
                  <div
                    key={tIdx}
                    className="p-3 rounded-lg border space-y-2.5"
                    style={{
                      background: "var(--surface-subtle)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono font-bold text-sm"
                          style={{ color: "var(--foreground)" }}
                        >
                          {table.name}
                        </span>
                        <span className="text-[11px] opacity-60" style={{ color: "var(--muted)" }}>
                          ({table.columns.length} columns)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddColumn(tIdx)}
                          className="text-[11px] px-2 py-1 rounded border font-medium cursor-pointer hover:opacity-90"
                          style={{
                            background: "var(--panel)",
                            borderColor: "var(--border)",
                            color: "var(--foreground)",
                          }}
                        >
                          + Column
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTable(tIdx)}
                          className="text-[11px] px-2 py-1 rounded border border-red-500/40 text-red-500 hover:bg-red-500/10 font-medium cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Columns */}
                    <div className="space-y-1.5 pl-1">
                      {table.columns.map((col, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex flex-wrap items-center gap-2 text-xs p-2 rounded border"
                          style={{
                            background: "var(--panel)",
                            borderColor: "var(--border)",
                          }}
                        >
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) =>
                              handleUpdateColumn(tIdx, cIdx, {
                                name: e.target.value.toLowerCase(),
                              })
                            }
                            placeholder="column_name"
                            className="px-2 py-1 rounded border font-mono text-xs w-28 focus:outline-none"
                            style={{
                              background: "var(--surface-subtle)",
                              borderColor: "var(--border)",
                              color: "var(--foreground)",
                            }}
                          />
                          <select
                            value={col.type}
                            onChange={(e) =>
                              handleUpdateColumn(tIdx, cIdx, {
                                type: e.target.value as ColumnType,
                              })
                            }
                            className="px-2 py-1 rounded border text-xs focus:outline-none"
                            style={{
                              background: "var(--surface-subtle)",
                              borderColor: "var(--border)",
                              color: "var(--foreground)",
                            }}
                          >
                            {COLUMN_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>

                          {/* Primary Key Checkbox */}
                          <label
                            className="flex items-center gap-1 cursor-pointer select-none text-[11px] font-semibold"
                            style={{ color: "var(--foreground)" }}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(col.pk)}
                              onChange={(e) =>
                                handleUpdateColumn(tIdx, cIdx, {
                                  pk: e.target.checked,
                                })
                              }
                              className="rounded"
                              style={{ accentColor: "var(--accent)" }}
                            />
                            PK
                          </label>

                          {/* Foreign Key Selector */}
                          <div className="flex items-center gap-1">
                            <span className="opacity-60 text-[10px]" style={{ color: "var(--muted)" }}>
                              FK →
                            </span>
                            <select
                              value={
                                col.fk
                                  ? `${col.fk.table}.${col.fk.column}`
                                  : ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) {
                                  handleUpdateColumn(tIdx, cIdx, {
                                    fk: undefined,
                                  });
                                } else {
                                  const [fTable, fCol] = val.split(".");
                                  handleUpdateColumn(tIdx, cIdx, {
                                    fk: { table: fTable, column: fCol },
                                  });
                                }
                              }}
                              className="px-1.5 py-1 rounded border text-[11px] focus:outline-none max-w-32"
                              style={{
                                background: "var(--surface-subtle)",
                                borderColor: "var(--border)",
                                color: "var(--foreground)",
                              }}
                            >
                              <option value="">None</option>
                              {tables
                                .filter((_, idx) => idx !== tIdx)
                                .map((targetT) =>
                                  targetT.columns.map((targetC) => (
                                    <option
                                      key={`${targetT.name}.${targetC.name}`}
                                      value={`${targetT.name}.${targetC.name}`}
                                    >
                                      {targetT.name}.{targetC.name}
                                    </option>
                                  )),
                                )}
                            </select>
                          </div>

                          {table.columns.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColumn(tIdx, cIdx)}
                              className="text-red-500 opacity-70 hover:opacity-100 ml-auto cursor-pointer"
                              title="Remove column"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Real-time ER Diagram preview */}
              <div
                className="p-3 rounded-lg border"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--muted)" }}
                  >
                    Live ER Diagram Preview
                  </span>
                  <span className="text-[11px] opacity-70" style={{ color: "var(--muted)" }}>
                    Auto-generated from tables &amp; relationships
                  </span>
                </div>
                <MermaidDiagramPreview source={liveMermaid} dark={dark} />
              </div>
            </div>
          )}

          {/* Mode 2: SQL Script Mode */}
          {mode === "sql" && (
            <div className="space-y-2">
              <label
                className="block text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                SQL Schema Script (CREATE TABLE &amp; INSERT)
              </label>
              <textarea
                value={sqlScript}
                onChange={(e) => setSqlScript(e.target.value)}
                rows={12}
                spellCheck={false}
                className="w-full p-3 text-xs font-mono rounded-lg border resize-y focus:outline-none"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              />
              <p className="text-[11px] opacity-70" style={{ color: "var(--muted)" }}>
                Tip: Multiple statements separated by semicolons are fully supported.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3 border-t"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer hover:opacity-90"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-opacity shadow-xs cursor-pointer hover:opacity-90 border"
            style={{
              background: "var(--accent-gradient, var(--accent))",
              color: "var(--accent-foreground)",
              borderColor: "var(--accent)",
            }}
          >
            Create Dataset
          </button>
        </div>
      </div>
    </div>
  );
}

function MermaidDiagramPreview({
  source,
  dark,
}: {
  source: string;
  dark: boolean;
}) {
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const renderId = "preview_er_" + Math.random().toString(36).slice(2, 9);
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
        diagramRef.current.innerHTML = `<p class="text-[11px] text-red-500 p-1">Diagram preview: ${err instanceof Error ? err.message : String(err)}</p>`;
      });
    return () => {
      cancelled = true;
    };
  }, [source, dark]);

  return (
    <div
      ref={diagramRef}
      className="panel min-h-24 max-h-56 overflow-auto p-2 [&_svg]:mx-auto [&_svg]:max-w-full"
      style={{
        background: "var(--panel)",
        borderColor: "var(--border)",
      }}
      aria-label="ER diagram preview"
    />
  );
}

