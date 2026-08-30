"use client";

import { useEffect, useRef, useState } from "react";
import type { Table, Dataset } from "@/lib/schema";
import { generateDatasetSQL, generateTableCSV } from "@/lib/exportUtils";

interface ExportDatasetProps {
  dataset: Dataset;
  activeSchema: Table[];
}

export function ExportDataset({ dataset, activeSchema }: ExportDatasetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

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
    const sqlContent = generateDatasetSQL(dataset.name, activeSchema);
    const filename = `${dataset.name.toLowerCase().replace(/[^\w]/g, "_")}_schema.sql`;
    downloadFile(sqlContent, filename, "application/sql");
    setIsOpen(false);
  };

  const handleExportTableCSV = (table: Table) => {
    const csvContent = generateTableCSV(table);
    downloadFile(csvContent, `${table.name}.csv`, "text/csv");
    setIsOpen(false);
  };

  const handleExportAllCSV = () => {
    activeSchema.forEach((table) => {
      const csvContent = generateTableCSV(table);
      downloadFile(csvContent, `${table.name}.csv`, "text/csv");
    });
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left z-30">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs hover:opacity-90"
        style={{
          background: "var(--surface-subtle)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Export Dataset Options"
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
        <svg
          className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 w-64 rounded-xl border shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-150"
          style={{
            background: "var(--panel)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
          role="menu"
        >
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider opacity-60">
            Export &quot;{dataset.name}&quot; Dataset
          </div>

          <div className="my-1 border-t" style={{ borderColor: "var(--border)" }} />

          {/* Export SQL Option */}
          <button
            type="button"
            role="menuitem"
            onClick={handleExportSQL}
            className="w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
          >
            <svg className="w-4 h-4 text-emerald-500 opacity-90 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            <div>
              <div className="font-semibold" style={{ color: "var(--foreground)" }}>
                SQL Script (.sql)
              </div>
              <div className="text-[10px] opacity-70" style={{ color: "var(--muted)" }}>
                CREATE TABLE &amp; INSERT statements
              </div>
            </div>
          </button>

          <div className="my-1 border-t" style={{ borderColor: "var(--border)" }} />

          {/* Export CSV Option */}
          <div className="px-2 py-1 text-[11px] font-semibold opacity-70">
            CSV Format (.csv)
          </div>

          {activeSchema.length > 1 && (
            <button
              type="button"
              role="menuitem"
              onClick={handleExportAllCSV}
              className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer hover:bg-[var(--surface-hover)] font-medium text-emerald-500"
            >
              <svg className="w-4 h-4 opacity-90 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Export All Tables ({activeSchema.length} CSVs)</span>
            </button>
          )}

          {activeSchema.map((table) => (
            <button
              key={table.name}
              type="button"
              role="menuitem"
              onClick={() => handleExportTableCSV(table)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer hover:bg-[var(--surface-hover)]"
            >
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-mono text-[11px]">{table.name}.csv</span>
              </span>
              <span className="text-[10px] opacity-60">
                {table.rows?.length ?? 0} rows
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
