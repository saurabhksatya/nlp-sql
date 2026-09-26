"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader, type NavSection } from "@/components/AppHeader";
import { PlSqlInputPanel } from "@/components/PlSqlInputPanel";
import { PlSqlVisualizationPanel } from "@/components/PlSqlVisualizationPanel";
import { DatasetModal } from "@/components/DatasetModal";
import { ImportDatasetModal } from "@/components/ImportDatasetModal";
import { GuideModal } from "@/components/GuideModal";
import { PlSqlHelpView } from "@/components/PlSqlHelpView";
import { PlSqlLearnView } from "@/components/PlSqlLearnView";
import { DevelopedByView } from "@/components/DevelopedByView";
import { DownloadView } from "@/components/DownloadView";
import { QuizView } from "@/components/QuizView";
import type { HistoryItem, Tab, ThemeId } from "@/components/nlSqlTypes";
import {
  DATASETS,
  getDefaultSchema,
  erDiagramMermaid,
  cloneSchema,
  type Table,
  type Dataset,
} from "@/lib/schema";
import {
  executePLSQL,
  buildPlSqlExplanation,
} from "@/lib/plsqlEngine";
import type { PipelineStep, Row } from "@/lib/sqlEngine";
import { speakText } from "@/lib/useSpeechRecognition";
import {
  generateMarkdownReport,
  generateTextReport,
  downloadPdfReport,
  downloadDocxReport,
  triggerFileDownload,
  type ReportExecutionData,
} from "@/lib/reportGenerator";
import {
  getPlSqlDefault,
  getPlSqlExamples,
} from "@/lib/plsqlExamples";

const CUSTOM_DATASETS_KEY = "nlp-sql-custom-datasets";

export default function PlSqlPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeId>("slate");
  const [activeSection, setActiveSection] = useState<NavSection>("workspace");
  const [customDatasets, setCustomDatasets] = useState<Dataset[]>([]);
  const [deletedBuiltinIds, setDeletedBuiltinIds] = useState<string[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("ecommerce");
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [datasetToEdit, setDatasetToEdit] = useState<Dataset | null>(null);

  const allDatasets = useMemo(() => {
    const activeBuiltins = DATASETS.filter(
      (d) => !deletedBuiltinIds.includes(d.id),
    );
    return [...activeBuiltins, ...customDatasets];
  }, [deletedBuiltinIds, customDatasets]);

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
  const [plsql, setPlsql] = useState<string>(() => getPlSqlDefault("ecommerce"));
  const [nlInfo, setNlInfo] = useState<{
    sql: string;
    confidence: number;
    interpretation: string;
  } | null>(null);
  const [isTranslatingVoice, setIsTranslatingVoice] = useState(false);
  const [isTranslatingText, setIsTranslatingText] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [finalRows, setFinalRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [dbmsOutput, setDbmsOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tab, setTab] = useState<Tab>("result");
  const [hasExecuted, setHasExecuted] = useState(false);
  const [lastExecutionData, setLastExecutionData] =
    useState<ReportExecutionData | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Modals & Panels UI state
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"input" | "canvas">("canvas");

  // Dynamic Central Panel Height & Window Height Measurement
  const centerPanelRef = useRef<HTMLDivElement>(null);
  const [centerHeight, setCenterHeight] = useState<number | undefined>(undefined);
  const [windowHeight, setWindowHeight] = useState<number | undefined>(undefined);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setWindowHeight(window.innerHeight);
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const el = centerPanelRef.current;
    if (!el) return;

    const measureHeight = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 0) {
        setCenterHeight(h);
      }
    };

    measureHeight();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => {
        measureHeight();
      });
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, [tab, activeSection, steps, finalRows, dbmsOutput]);

  const availableScreenHeight =
    isMounted && windowHeight ? Math.max(350, windowHeight - 84) : undefined;
  const isCenterTallerThanScreen = Boolean(
    availableScreenHeight &&
    centerHeight &&
    centerHeight > availableScreenHeight,
  );
  const sidePanelMinHeight =
    isMounted && availableScreenHeight
      ? availableScreenHeight
      : "calc(100vh - 5.25rem)";
  const sidePanelMaxHeight =
    isMounted && isCenterTallerThanScreen ? centerHeight : undefined;
  const sidePanelHeight =
    isMounted && isCenterTallerThanScreen
      ? centerHeight
      : availableScreenHeight || "calc(100vh - 5.25rem)";

  const isDark = useMemo(() => theme !== "pearl", [theme]);

  const applyThemeToDOM = useCallback((nextTheme: ThemeId) => {
    const isThemeDark = nextTheme !== "pearl";
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.documentElement.setAttribute("data-page", "plsql");
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

  // Ensure data-page="plsql" is set on documentElement while on PL/SQL page
  useEffect(() => {
    document.documentElement.setAttribute("data-page", "plsql");
    return () => {
      document.documentElement.removeAttribute("data-page");
    };
  }, []);

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      let savedTheme = localStorage.getItem("nlp-sql-theme") || "slate";
      const legacyMap: Record<string, ThemeId> = {
        "blue-light": "pearl",
        greyscale: "slate",
        dark: "slate",
        light: "pearl",
      };
      if (legacyMap[savedTheme]) savedTheme = legacyMap[savedTheme];
      const valid: ThemeId[] = ["slate", "pearl"];
      const activeTheme = valid.includes(savedTheme as ThemeId)
        ? (savedTheme as ThemeId)
        : "slate";
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
      const savedDeleted = localStorage.getItem("nlp-sql-deleted-builtins");
      if (savedDeleted) {
        const parsed = JSON.parse(savedDeleted);
        if (Array.isArray(parsed)) {
          setDeletedBuiltinIds(parsed);
        }
      }
    } catch {}

    try {
      const savedHistory = localStorage.getItem("nlp-plsql-history");
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as HistoryItem[];
        setHistory(parsedHistory);
      }
    } catch {}
  }, []);

  // Run PL/SQL execution
  const runScript = useCallback(
    (script?: string, question?: string, schemaToUse?: Table[]) => {
      const q = (script ?? plsql).trim();
      if (!q) {
        setError("Please enter a PL/SQL script before executing.");
        return;
      }
      if (timer.current) clearInterval(timer.current);
      setPlaying(false);
      const schema = schemaToUse ?? activeSchema;
      const startTime = performance.now();
      const result = executePLSQL(q, schema);
      const durationMs = Math.round(performance.now() - startTime);

      setSteps(result.steps);
      setFinalRows(result.finalRows);
      setColumns(result.columns);
      setDbmsOutput(result.dbmsOutput);
      setError(result.error);
      setActiveStep(0);

      if (!result.error && result.updatedSchema) {
        setActiveSchema(result.updatedSchema);
      }

      const explanation = buildPlSqlExplanation(
        q,
        schema,
        result.steps,
        result.finalRows,
        result.columns,
        result.dbmsOutput,
      );

      setHasExecuted(true);

      const execData: ReportExecutionData = {
        sql: q,
        nlQuestion: question,
        inputMode: question ? "nl" : "sql",
        datasetName: selectedDataset.name,
        tables: schema.map((t) => t.name),
        steps: result.steps,
        finalRows: result.finalRows,
        columns: result.columns,
        explanation,
        error: result.error,
        executionDurationMs: durationMs,
        timestamp: new Date().toLocaleString(),
        statementType: "DQL",
        command: "SELECT",
      };
      setLastExecutionData(execData);

      if (!result.error && result.steps.length) {
        const displayQuestion = (question ?? nlInput ?? q).trim() || q;
        const item: HistoryItem = {
          id: Date.now(),
          question: displayQuestion,
          sql: q,
          rows: result.finalRows.length,
          time: new Date().toLocaleTimeString(),
          statementType: "DQL",
          command: "SELECT",
        };
        setHistory((previous) => {
          const next = [item, ...previous].slice(0, 100);
          try {
            localStorage.setItem("nlp-plsql-history", JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    },
    [plsql, nlInput, activeSchema, selectedDataset.name],
  );

  // Initial execution on mount once
  const initialRunRef = useRef(false);
  useEffect(() => {
    if (!initialRunRef.current) {
      initialRunRef.current = true;
      runScript(getPlSqlDefault("ecommerce"));
    }
  }, [runScript]);

  const changeDataset = useCallback(
    (id: string) => {
      const dataset =
        allDatasets.find((item) => item.id === id) ?? allDatasets[0];
      setSelectedDatasetId(dataset.id);
      setActiveSchema(getDefaultSchema(dataset.id, allDatasets));
      const defaultScript = getPlSqlDefault(dataset.id);
      setPlsql(defaultScript);
      setNlInput("");
      setNlInfo(null);
      setSteps([]);
      setFinalRows([]);
      setColumns([]);
      setDbmsOutput([]);
      setError(undefined);
      setActiveStep(0);
      setHasExecuted(false);
      setLastExecutionData(null);
    },
    [allDatasets],
  );

  const resetDatabase = useCallback(() => {
    if (deletedBuiltinIds.length > 0) {
      setDeletedBuiltinIds([]);
      try {
        localStorage.removeItem("nlp-sql-deleted-builtins");
      } catch {}
    }
    setActiveSchema(getDefaultSchema(selectedDataset.id, allDatasets));
    const defaultScript = getPlSqlDefault(selectedDataset.id);
    setPlsql(defaultScript);
    setNlInput("");
    setNlInfo(null);
    setSteps([]);
    setFinalRows([]);
    setColumns([]);
    setDbmsOutput([]);
    setError(undefined);
    setActiveStep(0);
    setHasExecuted(false);
    setLastExecutionData(null);
  }, [selectedDataset, allDatasets, deletedBuiltinIds.length]);

  const handleDeleteDataset = useCallback(
    (id: string) => {
      if (allDatasets.length <= 1) {
        alert("At least one dataset must remain in the application.");
        return;
      }

      const isCustom = customDatasets.some((d) => d.id === id);
      if (isCustom) {
        setCustomDatasets((prev) => {
          const next = prev.filter((d) => d.id !== id);
          try {
            localStorage.setItem(CUSTOM_DATASETS_KEY, JSON.stringify(next));
          } catch {}
          return next;
        });
      } else {
        setDeletedBuiltinIds((prev) => {
          const next = [...prev, id];
          try {
            localStorage.setItem(
              "nlp-sql-deleted-builtins",
              JSON.stringify(next),
            );
          } catch {}
          return next;
        });
      }

      if (selectedDatasetId === id) {
        const remaining = allDatasets.filter((d) => d.id !== id);
        if (remaining.length > 0) {
          changeDataset(remaining[0].id);
        }
      }
    },
    [allDatasets, customDatasets, selectedDatasetId, changeDataset],
  );

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
    setPlsql(getPlSqlDefault(savedDataset.id));
    setNlInput("");
    setNlInfo(null);
    setSteps([]);
    setFinalRows([]);
    setColumns([]);
    setDbmsOutput([]);
    setError(undefined);
    setActiveStep(0);
    setTab("schema");
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

  // Gemini API Translation for PL/SQL
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
      const mimeType = typeof params === "object" ? params.mimeType : undefined;

      if (!questionToTranslate && !audioBase64) {
        setError("Please enter a PL/SQL requirement or question.");
        return;
      }
      if (questionToTranslate) {
        setNlInput(questionToTranslate);
      }
      setError(undefined);
      setNlInfo(null);
      const isVoiceTranslation = Boolean(audioBase64);
      setIsTranslatingVoice(isVoiceTranslation);
      setIsTranslatingText(!isVoiceTranslation);

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
            mode: "plsql",
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
          throw new Error(result.error ?? "Gemini PL/SQL translation failed.");
        }

        if (result.question) {
          setNlInput(result.question);
          questionToTranslate = result.question;
        }

        const llmResult = {
          sql: result.sql,
          confidence: result.confidence ?? 1.0,
          interpretation: result.interpretation ?? "Generated PL/SQL block.",
        };

        setNlInfo(llmResult);
        setPlsql(llmResult.sql);
        runScript(llmResult.sql, questionToTranslate);

        if (voiceFeedback && llmResult.interpretation) {
          speakText(llmResult.interpretation);
        }
      } catch (err: any) {
        setError(
          err?.message || "Unable to generate a valid PL/SQL block from this prompt. Try adding more procedural details.",
        );
      } finally {
        setIsTranslatingVoice(false);
        setIsTranslatingText(false);
      }
    },
    [nlInput, runScript, selectedDataset, activeSchema, voiceFeedback],
  );

  const selectExample = useCallback(
    (question: string, script: string) => {
      setNlInput(question);
      setPlsql(script);
      runScript(script, question);
    },
    [runScript],
  );

  const selectHistory = useCallback(
    (item: HistoryItem) => {
      setPlsql(item.sql);
      runScript(item.sql, item.question);
    },
    [runScript],
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
    download(new Blob([csv], { type: "text/csv" }), "plsql_output.csv");
  }, [finalRows, columns]);

  const exportReport = useCallback(() => {
    if (!hasExecuted || !lastExecutionData) {
      alert("Execute a PL/SQL block first to generate an execution report.");
      return;
    }
    const markdown = generateMarkdownReport(lastExecutionData);
    triggerFileDownload(
      new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
      "plsql-execution-report.md",
    );
  }, [hasExecuted, lastExecutionData]);

  const current = steps[activeStep];
  const mermaidSource = useMemo(
    () => erDiagramMermaid(activeSchema),
    [activeSchema],
  );

  // Left panel resizer state
  const [leftWidth, setLeftWidth] = useState(330);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isResizingLeft) {
        const rawWidth = e.clientX - 16;
        if (rawWidth < 250) {
          setLeftCollapsed(true);
          setLeftWidth(250);
        } else {
          setLeftCollapsed(false);
          setLeftWidth(Math.min(rawWidth, 600));
        }
      }
    },
    [isResizingLeft],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizingLeft(false);
  }, []);

  useEffect(() => {
    if (isResizingLeft) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizingLeft, handleMouseMove, handleMouseUp]);

  return (
    <div
      data-page="plsql"
      className="page-plsql h-screen flex flex-col overflow-hidden pb-16 lg:pb-0 select-none"
    >
      {/* Top Bar with Navigation & Theme Selector */}
      <AppHeader
        theme={theme}
        onThemeChange={handleThemeChange}
        activeSection={activeSection}
        onSectionChange={(section) => {
          if (section === "quiz") {
            router.push("/plsql/quiz");
            return;
          }
          setActiveSection(section);
        }}
        mode="plsql"
      />

      {/* Primary Content Viewport Container */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden w-full relative">
        {/* Main Workspace */}
        <main
          className={`flex-1 min-h-0 flex flex-col lg:flex-row items-start gap-0 p-4 relative overflow-y-auto ${
            activeSection === "workspace" ? "flex" : "hidden"
          }`}
        >
          {/* Left Sidebar: PL/SQL Input Panel */}
          <div
            style={{ width: leftCollapsed ? "0px" : `${leftWidth}px` }}
            className={`flex flex-col shrink-0 transition-[width] duration-150 ease-out overflow-hidden ${
              mobileTab !== "input" ? "hidden lg:flex" : "flex w-full"
            }`}
          >
            <div className="pr-2 h-full flex flex-col">
              <PlSqlInputPanel
                datasets={allDatasets}
                selectedDatasetId={selectedDatasetId}
                activeSchema={activeSchema}
                onDatasetChange={changeDataset}
                onOpenCreateModal={handleOpenCreateModal}
                onOpenImportModal={() => setIsImportModalOpen(true)}
                onEditDataset={handleOpenEditModal}
                onDeleteDataset={handleDeleteDataset}
                onOpenGuide={() => setIsGuideModalOpen(true)}
                examples={getPlSqlExamples(selectedDatasetId)}
                nlInput={nlInput}
                onNlInputChange={setNlInput}
                onTranslate={() => translateNL()}
                nlInfo={nlInfo}
                plsql={plsql}
                onPlSqlChange={(newCode) => {
                  setPlsql(newCode);
                  if (error) setError(undefined);
                }}
                onRunScript={() => runScript()}
                onExampleSelect={selectExample}
                onResetDatabase={resetDatabase}
                error={error}
                history={history}
                onSelectHistory={selectHistory}
                onVoiceTranslateAndRun={(params) => translateNL(params)}
                isTranslatingVoice={isTranslatingVoice}
                isTranslatingText={isTranslatingText}
                voiceFeedback={voiceFeedback}
                onToggleVoiceFeedback={setVoiceFeedback}
                theme={theme}
                minPanelHeight={sidePanelMinHeight}
                maxPanelHeight={sidePanelMaxHeight}
                panelHeight={sidePanelHeight}
              />
            </div>
          </div>

          {/* Resizer Slider Handle */}
          <div
            onMouseDown={() => setIsResizingLeft(true)}
            className="hidden lg:flex w-3 hover:w-4 items-center justify-center cursor-col-resize group relative z-10 shrink-0 transition-all self-stretch"
            title="Drag to resize panel or click arrow to collapse"
          >
            <div className={`w-1.5 h-12 rounded-full transition-colors flex items-center justify-center ${
              isDark
                ? "bg-zinc-600/40 group-hover:bg-[#FF5B39]"
                : "bg-orange-400 hover:bg-[#FF5B39] group-hover:bg-[#FF5B39] shadow-xs"
            }`}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLeftCollapsed((prev) => !prev);
                }}
                title={leftCollapsed ? "Expand Left Panel" : "Collapse Left Panel"}
                className="text-[9px] px-0.5 py-2 rounded bg-[var(--panel)] border border-[var(--border)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-bold shadow-xs text-[var(--foreground)]"
              >
                {leftCollapsed ? "▶" : "◀"}
              </button>
            </div>
          </div>

          {/* Center: Canvas / Visualization */}
          <div
            ref={centerPanelRef}
            className={`flex-1 flex flex-col gap-3 min-w-0 px-1 ${
              mobileTab !== "canvas" ? "hidden lg:flex" : "flex"
            }`}
          >
            <PlSqlVisualizationPanel
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
              dbmsOutput={dbmsOutput}
              onExportCSV={exportCSV}
              onExportReport={exportReport}
              plsql={plsql}
              mermaidSource={mermaidSource}
              schema={activeSchema}
              dark={isDark}
              theme={theme}
              hasExecuted={hasExecuted}
            />
          </div>
        </main>

        {/* Major Section Views */}
        {activeSection === "download" && (
          <DownloadView
            dataset={selectedDataset}
            activeSchema={activeSchema}
            lastExecutionData={lastExecutionData}
            finalRows={finalRows}
            columns={columns}
            history={history}
            theme={theme}
            hasExecuted={hasExecuted}
            onBackToWorkspace={() => setActiveSection("workspace")}
          />
        )}
        {activeSection === "quiz" && (
          <QuizView
            mode="plsql"
            onBackToWorkspace={() => setActiveSection("workspace")}
          />
        )}
        {activeSection === "learn" && (
          <PlSqlLearnView onBackToWorkspace={() => setActiveSection("workspace")} />
        )}
        {activeSection === "help" && (
          <PlSqlHelpView onBackToWorkspace={() => setActiveSection("workspace")} />
        )}
        {activeSection === "developedBy" && <DevelopedByView />}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between shadow-lg"
        aria-label="Mobile bottom navigation"
      >
        <button
          type="button"
          onClick={() => setActiveSection("help")}
          className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">Help</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMobileTab("canvas")}
            className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg transition-colors cursor-pointer"
            style={{
              background: mobileTab === "canvas" ? "var(--surface-hover)" : "transparent",
              color: "var(--foreground)",
            }}
          >
            <span className="text-xs font-medium">Canvas</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("input")}
            className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg transition-colors cursor-pointer"
            style={{
              background: mobileTab === "input" ? "var(--surface-hover)" : "transparent",
              color: "var(--foreground)",
            }}
          >
            <span className="text-xs font-medium">Input</span>
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

      <ImportDatasetModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportDataset={handleSaveDataset}
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
