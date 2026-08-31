"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { InputPanel } from "@/components/InputPanel";
import { DatasetModal } from "@/components/DatasetModal";
import type { HistoryItem, Tab, ThemeId } from "@/components/nlSqlTypes";
import { VisualizationPanel } from "@/components/VisualizationPanel";
import { GuideModal } from "@/components/GuideModal";
import {
  DATASETS,
  getDefaultSchema,
  erDiagramMermaid,
  cloneSchema,
  type Table,
  type Dataset,
} from "@/lib/schema";
import { executeSQL, type PipelineStep, type Row } from "@/lib/sqlEngine";
import { speakText } from "@/lib/useSpeechRecognition";

const CUSTOM_DATASETS_KEY = "nlp-sql-custom-datasets";

export default function Home() {
  const [theme, setTheme] = useState<ThemeId>("eclipse");
  const [customDatasets, setCustomDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("ecommerce");
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [datasetToEdit, setDatasetToEdit] = useState<Dataset | null>(null);

  const allDatasets = useMemo(
    () => [...DATASETS, ...customDatasets],
    [customDatasets],
  );

  const selectedDataset = useMemo(
    () =>
      allDatasets.find((dataset) => dataset.id === selectedDatasetId) ??
      allDatasets[0],
    [allDatasets, selectedDatasetId],
  );

  // Dynamic active database schema per dataset session
  const [activeSchema, setActiveSchema] = useState<Table[]>(() =>
    getDefaultSchema("ecommerce"),
  );

  const [nlInput, setNlInput] = useState("");
  const [sql, setSql] = useState(
    "SELECT name, city FROM customers WHERE city = 'Mumbai';",
  );
  const [nlInfo, setNlInfo] = useState<{
    sql: string;
    confidence: number;
    interpretation: string;
  } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [finalRows, setFinalRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tab, setTab] = useState<Tab>("result");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Modals & Panels UI state
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"input" | "canvas" | "tools">("canvas");

  const isDark = useMemo(() => theme !== "pearl", [theme]);

  const applyThemeToDOM = useCallback((nextTheme: ThemeId) => {
    const isThemeDark = nextTheme !== "pearl";
    document.documentElement.setAttribute("data-theme", nextTheme);
    const allThemeClasses = [
      "theme-eclipse",
      "theme-lazuli",
      "theme-pearl",
      "theme-slate",
      "theme-volt",
      "theme-colorful-dark",
      "theme-blue-dark",
      "theme-blue-light",
      "theme-greyscale",
      "theme-high-contrast",
    ];
    document.documentElement.classList.remove(...allThemeClasses);
    document.documentElement.classList.add(`theme-${nextTheme}`);
    document.documentElement.classList.toggle("dark", isThemeDark);
  }, []);

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      let savedTheme = localStorage.getItem("nlp-sql-theme") || "eclipse";
      const legacyMap: Record<string, ThemeId> = {
        "colorful-dark": "eclipse",
        "blue-dark": "lazuli",
        "blue-light": "pearl",
        "greyscale": "slate",
        "high-contrast": "volt",
        "dark": "eclipse",
        "light": "pearl",
      };
      if (legacyMap[savedTheme]) savedTheme = legacyMap[savedTheme];
      const valid: ThemeId[] = ["eclipse", "lazuli", "pearl", "slate", "volt"];
      const activeTheme = valid.includes(savedTheme as ThemeId)
        ? (savedTheme as ThemeId)
        : "eclipse";
      setTheme(activeTheme);
      applyThemeToDOM(activeTheme);
    } catch {}
  }, [applyThemeToDOM]);

  const handleThemeChange = useCallback(
    (nextTheme: ThemeId) => {
      setTheme(nextTheme);
      applyThemeToDOM(nextTheme);
      try {
        localStorage.setItem("nlp-sql-theme", nextTheme);
      } catch {}
    },
    [applyThemeToDOM],
  );

  // Load history & custom datasets from localStorage on mount
  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem(CUSTOM_DATASETS_KEY);
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom) as Dataset[];
        if (Array.isArray(parsed)) {
          setCustomDatasets(parsed);
        }
      }
    } catch {}

    try {
      const savedHistory = localStorage.getItem("nlp-sql-history");
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as HistoryItem[];
        setHistory(parsedHistory);
      }
    } catch {}
  }, []);

  const runQuery = useCallback(
    (query?: string, question?: string, schemaToUse?: Table[]) => {
      const q = (query ?? sql).trim();
      if (timer.current) clearInterval(timer.current);
      setPlaying(false);
      const schema = schemaToUse ?? activeSchema;
      const result = executeSQL(q, schema);
      setSteps(result.steps);
      setFinalRows(result.finalRows);
      setColumns(result.columns);
      setError(result.error);
      setActiveStep(0);

      // If DDL or DML modified the schema or rows, update activeSchema state
      if (!result.error && result.updatedSchema) {
        setActiveSchema(result.updatedSchema);
      }

      if (!result.error && result.steps.length) {
        const item: HistoryItem = {
          id: Date.now(),
          question: question ?? nlInput ?? q,
          sql: q,
          rows: result.finalRows.length,
          time: new Date().toLocaleTimeString(),
          statementType: result.statementType,
          command: result.command,
        };
        setHistory((previous) => {
          const next = [item, ...previous].slice(0, 30);
          try {
            localStorage.setItem("nlp-sql-history", JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    },
    [sql, nlInput, activeSchema],
  );

  // Run initial query on mount once
  const initialRunRef = useRef(false);
  useEffect(() => {
    if (!initialRunRef.current) {
      initialRunRef.current = true;
      runQuery("SELECT name, city FROM customers WHERE city = 'Mumbai';");
    }
  }, [runQuery]);

  const changeDataset = useCallback(
    (id: string) => {
      const dataset = allDatasets.find((item) => item.id === id) ?? allDatasets[0];
      setSelectedDatasetId(dataset.id);
      setActiveSchema(getDefaultSchema(dataset.id, allDatasets));
      setSql(dataset.defaultQuery);
      setNlInput("");
      setNlInfo(null);
      setSteps([]);
      setFinalRows([]);
      setColumns([]);
      setError(undefined);
      setActiveStep(0);
    },
    [allDatasets],
  );

  const resetDatabase = useCallback(() => {
    setActiveSchema(getDefaultSchema(selectedDataset.id, allDatasets));
    setSql(selectedDataset.defaultQuery);
    setNlInput("");
    setNlInfo(null);
    setSteps([]);
    setFinalRows([]);
    setColumns([]);
    setError(undefined);
    setActiveStep(0);
  }, [selectedDataset, allDatasets]);

  const handleOpenCreateModal = useCallback(() => {
    setDatasetToEdit(null);
    setIsDatasetModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((dataset: Dataset) => {
    setDatasetToEdit(dataset);
    setIsDatasetModalOpen(true);
  }, []);

  const handleSaveDataset = useCallback((savedDataset: Dataset) => {
    setCustomDatasets((prev) => {
      const existingIdx = prev.findIndex((d) => d.id === savedDataset.id);
      let next: Dataset[];
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = savedDataset;
      } else {
        next = [savedDataset, ...prev];
      }
      try {
        localStorage.setItem(CUSTOM_DATASETS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setSelectedDatasetId(savedDataset.id);
    setActiveSchema(cloneSchema(savedDataset.schema));
    setSql(savedDataset.defaultQuery);
    setNlInput("");
    setNlInfo(null);
    setSteps([]);
    setFinalRows([]);
    setColumns([]);
    setError(undefined);
    setActiveStep(0);
    setTab("schema");
  }, []);

  const handleDeleteDataset = useCallback((id: string) => {
    setCustomDatasets((prev) => {
      const next = prev.filter((d) => d.id !== id);
      try {
        localStorage.setItem(CUSTOM_DATASETS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setDatasetToEdit((current) => (current?.id === id ? null : current));
    // If deleting the currently selected dataset, fall back to first built-in
    setSelectedDatasetId((current) => (current === id ? "ecommerce" : current));
  }, []);

  const play = useCallback(() => {
    if (!steps.length) return;
    if (playing) {
      if (timer.current) clearInterval(timer.current);
      setPlaying(false);
      return;
    }
    setPlaying(true);
    let index = activeStep >= steps.length - 1 ? -1 : activeStep - 1;
    timer.current = setInterval(() => {
      index += 1;
      setActiveStep(index);
      if (index >= steps.length - 1) {
        if (timer.current) clearInterval(timer.current);
        setPlaying(false);
      }
    }, 1200);
  }, [steps, playing, activeStep]);

  useEffect(
    () => () => void (timer.current && clearInterval(timer.current)),
    [],
  );

  const translateNL = useCallback(
    async (
      params?:
        | string
        | { question?: string; audioBase64?: string; mimeType?: string },
    ) => {
      let questionToTranslate =
        typeof params === "string"
          ? params.trim()
          : (params?.question ?? nlInput).trim();
      const audioBase64 =
        typeof params === "object" ? params.audioBase64 : undefined;
      const mimeType =
        typeof params === "object" ? params.mimeType : undefined;

      if (!questionToTranslate && !audioBase64) return;
      if (questionToTranslate) {
        setNlInput(questionToTranslate);
      }
      setError(undefined);
      setNlInfo(null);
      setIsTranslating(true);
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: questionToTranslate || undefined,
            audioBase64,
            mimeType,
            datasetId: selectedDataset.id,
            schema: activeSchema,
          }),
        });
        const result = (await response.json()) as {
          question?: string;
          sql?: string;
          confidence?: number;
          interpretation?: string;
          error?: string;
        };
        if (!response.ok || !result.sql) {
          throw new Error(result.error ?? "LLM translation failed.");
        }
        if (result.question) {
          setNlInput(result.question);
          questionToTranslate = result.question;
        }
        const llmResult = {
          sql: result.sql,
          confidence: result.confidence ?? 1.0,
          interpretation: result.interpretation ?? "Generated query.",
        };
        setNlInfo(llmResult);
        setSql(llmResult.sql);
        runQuery(
          llmResult.sql,
          questionToTranslate || result.question || "Voice query",
        );
        if (voiceFeedback && llmResult.interpretation) {
          speakText(llmResult.interpretation);
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "LLM translation failed.",
        );
      } finally {
        setIsTranslating(false);
      }
    },
    [nlInput, runQuery, selectedDataset, activeSchema, voiceFeedback],
  );

  const selectExample = useCallback(
    (question: string, query: string) => {
      setNlInput(question);
      setSql(query);
      runQuery(query, question);
    },
    [runQuery],
  );

  const selectHistory = useCallback(
    (item: HistoryItem) => {
      setSql(item.sql);
      runQuery(item.sql, item.question);
    },
    [runQuery],
  );

  const exportCSV = useCallback(() => {
    if (!finalRows.length) return;
    const escapeValue = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [
      columns.map(escapeValue).join(","),
      ...finalRows.map((row) =>
        columns.map((column) => escapeValue(row[column])).join(","),
      ),
    ].join("\n");
    download(new Blob([csv], { type: "text/csv" }), "results.csv");
  }, [finalRows, columns]);

  const exportReport = useCallback(() => {
    const markdown = [
      "# NL→SQL Execution Report",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Query",
      "```sql\n" + sql + "\n```",
      error ? `\n**Error:** ${error}` : "",
      "",
      "## Pipeline Steps",
      ...steps.map(
        (step, index) =>
          `${index + 1}. **${step.stage}** — ${step.title}: ${step.detail} (${step.rowCount} rows)`,
      ),
      "",
      "## Final Result",
      "| " + columns.join(" | ") + " |",
      "|" + columns.map(() => "---").join("|") + "|",
      ...finalRows.map(
        (row) =>
          "| " + columns.map((column) => row[column] ?? "").join(" | ") + " |",
      ),
    ].join("\n");
    download(new Blob([markdown], { type: "text/markdown" }), "report.md");
  }, [sql, steps, finalRows, columns, error]);

  const mermaidSource = useMemo(
    () => erDiagramMermaid(activeSchema),
    [activeSchema],
  );
  const current = steps[activeStep];

  return (
    <div className="min-h-screen flex flex-col pb-16 lg:pb-0">
      {/* Top Bar with Collapsible Theme Selector */}
      <AppHeader theme={theme} onThemeChange={handleThemeChange} />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr_340px] gap-4 p-4">
        {/* Left Sidebar: Input Panel with single Guide button at bottom-left */}
        <div className={`flex flex-col ${mobileTab !== "input" ? "hidden lg:flex" : "flex"}`}>
          <InputPanel
            datasets={allDatasets}
            selectedDatasetId={selectedDataset.id}
            onDatasetChange={changeDataset}
            onOpenCreateModal={handleOpenCreateModal}
            onEditDataset={handleOpenEditModal}
            examples={selectedDataset.examples}
            nlInput={nlInput}
            onNlInputChange={setNlInput}
            onTranslate={() => translateNL()}
            nlInfo={nlInfo}
            sql={sql}
            onSqlChange={setSql}
            onRunQuery={() => runQuery()}
            onExampleSelect={selectExample}
            onResetDatabase={resetDatabase}
            error={error}
            history={history}
            onSelectHistory={selectHistory}
            onVoiceTranslateAndRun={(params) => translateNL(params)}
            isTranslating={isTranslating}
            voiceFeedback={voiceFeedback}
            onToggleVoiceFeedback={setVoiceFeedback}
            onOpenGuide={() => setIsGuideModalOpen(true)}
            theme={theme}
          />
        </div>

        {/* Center: Canvas / Visualization */}
        <div className={`flex flex-col gap-3 min-w-0 ${mobileTab !== "canvas" ? "hidden lg:flex" : "flex"}`}>
          <VisualizationPanel
            tab={tab}
            onTabChange={setTab}
            steps={steps}
            activeStep={activeStep}
            current={current}
            playing={playing}
            onPlay={play}
            onStepChange={setActiveStep}
            finalRows={finalRows}
            columns={columns}
            onExportCSV={exportCSV}
            onExportReport={exportReport}
            sql={sql}
            mermaidSource={mermaidSource}
            schema={activeSchema}
            dark={isDark}
            theme={theme}
          />
        </div>

        {/* Right Sidebar: Explanation Panel with Export Dataset Section Box */}
        <div className={`flex flex-col ${mobileTab !== "tools" ? "hidden lg:flex" : "flex"}`}>
          <ExplanationPanel
            current={current}
            error={error}
            dataset={selectedDataset}
            activeSchema={activeSchema}
          />
        </div>
      </main>

      {/* Mobile-Optimized Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between shadow-lg"
        aria-label="Mobile bottom navigation"
      >
        {/* Guide button at bottom-left */}
        <button
          type="button"
          onClick={() => setIsGuideModalOpen(true)}
          className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Open user guide"
        >
          <svg className="w-5 h-5 text-zinc-900 dark:text-zinc-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-[11px] font-medium">Guide</span>
        </button>

        {/* Info & Tools button */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setMobileTab((prev) => (prev === "tools" ? "canvas" : "tools"))
            }
            className="flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            style={{
              background: mobileTab === "tools" ? "var(--surface-hover)" : "transparent",
              color: "var(--foreground)",
            }}
            aria-label="Toggle info and tools"
          >
            <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[11px] font-medium">Info &amp; Tools</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setMobileTab((prev) => (prev === "input" ? "canvas" : "input"))
            }
            className="flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            style={{
              background: mobileTab === "input" ? "var(--surface-hover)" : "transparent",
              color: "var(--foreground)",
            }}
            aria-label="Toggle input panel"
          >
            <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-[11px] font-medium">Input</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <DatasetModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        onCreateDataset={handleSaveDataset}
        onDeleteDataset={handleDeleteDataset}
        datasetToEdit={datasetToEdit}
        dark={isDark}
      />

      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
