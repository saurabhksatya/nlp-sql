"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { InputPanel } from "@/components/InputPanel";
import type { HistoryItem, Tab } from "@/components/nlSqlTypes";
import { VisualizationPanel } from "@/components/VisualizationPanel";
import { ProjectsPanel } from "@/components/ProjectsPanel";
import { SaveProjectModal } from "@/components/SaveProjectModal";
import { UnsavedChangesModal } from "@/components/UnsavedChangesModal";
import { RenameProjectModal } from "@/components/RenameProjectModal";
import { GuideModal } from "@/components/GuideModal";
import {
  getSavedProjects,
  saveProjectToStorage,
  deleteProjectFromStorage,
  renameProjectInStorage,
  type SavedProject,
} from "@/lib/projectStorage";
import { DATASETS, erDiagramMermaid } from "@/lib/schema";
import { executeSQL, type PipelineStep, type Row } from "@/lib/sqlEngine";
import { speakText } from "@/lib/useSpeechRecognition";

export default function Home() {
  const [dark, setDark] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState("ecommerce");
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

  // Projects & Unsaved changes state
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [activeProject, setActiveProject] = useState<SavedProject | null>(null);
  const [lastSavedBaseline, setLastSavedBaseline] = useState<{
    datasetId: string;
    sql: string;
    nlInput: string;
  }>({
    datasetId: "ecommerce",
    sql: "SELECT name, city FROM customers WHERE city = 'Mumbai';",
    nlInput: "",
  });

  // Modals & Panels UI state
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<SavedProject | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [pendingNewAfterSave, setPendingNewAfterSave] = useState(false);
  const [mobileTab, setMobileTab] = useState<"input" | "canvas" | "tools">("canvas");

  const selectedDataset =
    DATASETS.find((dataset) => dataset.id === selectedDatasetId) ?? DATASETS[0];

  // Load theme from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("nlp-sql-theme");
      const isDark =
        savedTheme !== null
          ? savedTheme === "dark"
          : document.documentElement.classList.contains("dark") ||
            window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    } catch {}
  }, []);

  const toggleDark = useCallback(() => {
    setDark((previous) => {
      const next = !previous;
      document.documentElement.classList.toggle("dark", next);
      try {
        localStorage.setItem("nlp-sql-theme", next ? "dark" : "light");
      } catch {}
      return next;
    });
  }, []);

  // Load history & saved projects from localStorage on mount
  useEffect(() => {
    let loadTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      const savedHistory = localStorage.getItem("nlp-sql-history");
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as HistoryItem[];
        setHistory(parsedHistory);
      }
      const loadedProjects = getSavedProjects();
      setProjects(loadedProjects);
    } catch {
      // Ignore malformed local storage.
    }
    return () => {
      if (loadTimer) clearTimeout(loadTimer);
    };
  }, []);

  // Track if current state differs from last saved baseline
  const hasUnsavedChanges = useMemo(() => {
    return (
      selectedDatasetId !== lastSavedBaseline.datasetId ||
      sql.trim() !== lastSavedBaseline.sql.trim() ||
      nlInput.trim() !== lastSavedBaseline.nlInput.trim()
    );
  }, [selectedDatasetId, sql, nlInput, lastSavedBaseline]);

  const runQuery = useCallback(
    (query?: string, question?: string, schemaToUse?: typeof selectedDataset.schema) => {
      const q = (query ?? sql).trim();
      if (timer.current) clearInterval(timer.current);
      setPlaying(false);
      const schema = schemaToUse ?? selectedDataset.schema;
      const result = executeSQL(q, schema);
      setSteps(result.steps);
      setFinalRows(result.finalRows);
      setColumns(result.columns);
      setError(result.error);
      setActiveStep(0);
      if (!result.error && result.steps.length) {
        const item: HistoryItem = {
          id: Date.now(),
          question: question ?? nlInput ?? q,
          sql: q,
          rows: result.finalRows.length,
          time: new Date().toLocaleTimeString(),
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
    [sql, nlInput, selectedDataset],
  );

  // Run initial query on mount once
  const initialRunRef = useRef(false);
  useEffect(() => {
    if (!initialRunRef.current) {
      initialRunRef.current = true;
      runQuery("SELECT name, city FROM customers WHERE city = 'Mumbai';");
    }
  }, [runQuery]);

  const changeDataset = useCallback((id: string) => {
    const dataset = DATASETS.find((item) => item.id === id) ?? DATASETS[0];
    setSelectedDatasetId(dataset.id);
    setSql(dataset.defaultQuery);
    setNlInput("");
    setNlInfo(null);
    setSteps([]);
    setFinalRows([]);
    setColumns([]);
    setError(undefined);
    setActiveStep(0);
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
    [nlInput, runQuery, selectedDataset, voiceFeedback],
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

  // Project Management Actions
  const performCreateNewProject = useCallback(() => {
    const defaultDs = DATASETS[0];
    setSelectedDatasetId(defaultDs.id);
    setSql(defaultDs.defaultQuery);
    setNlInput("");
    setNlInfo(null);
    setTab("result");
    setActiveStep(0);
    setActiveProject(null);
    setLastSavedBaseline({
      datasetId: defaultDs.id,
      sql: defaultDs.defaultQuery,
      nlInput: "",
    });
    runQuery(defaultDs.defaultQuery, undefined, defaultDs.schema);
  }, [runQuery]);

  const handleNewProjectClick = useCallback(() => {
    if (hasUnsavedChanges) {
      setIsUnsavedModalOpen(true);
    } else {
      performCreateNewProject();
    }
  }, [hasUnsavedChanges, performCreateNewProject]);

  const handleSaveProjectClick = useCallback(() => {
    if (activeProject) {
      // Update existing project without creating duplicates
      const updatedProject: SavedProject = {
        ...activeProject,
        datasetId: selectedDatasetId,
        sql,
        nlInput,
        nlInfo,
        tab,
        activeStep,
      };
      const updatedList = saveProjectToStorage(updatedProject);
      setProjects(updatedList);
      setActiveProject(updatedProject);
      setLastSavedBaseline({
        datasetId: selectedDatasetId,
        sql,
        nlInput,
      });
    } else {
      // Open modal to name new project
      setIsSaveModalOpen(true);
    }
  }, [activeProject, selectedDatasetId, sql, nlInput, nlInfo, tab, activeStep]);

  const handleSaveModalConfirm = useCallback(
    (name: string) => {
      const projectId =
        activeProject?.id ||
        `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const projectToSave: SavedProject = {
        id: projectId,
        name,
        datasetId: selectedDatasetId,
        sql,
        nlInput,
        nlInfo,
        tab,
        activeStep,
        createdAt: activeProject?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      const updatedList = saveProjectToStorage(projectToSave);
      setProjects(updatedList);
      setActiveProject(projectToSave);
      setLastSavedBaseline({
        datasetId: selectedDatasetId,
        sql,
        nlInput,
      });
      setIsSaveModalOpen(false);

      if (pendingNewAfterSave) {
        setPendingNewAfterSave(false);
        performCreateNewProject();
      }
    },
    [
      activeProject,
      selectedDatasetId,
      sql,
      nlInput,
      nlInfo,
      tab,
      activeStep,
      pendingNewAfterSave,
      performCreateNewProject,
    ],
  );

  const handleUnsavedModalSaveAndNew = useCallback(() => {
    setIsUnsavedModalOpen(false);
    if (activeProject) {
      const updatedProject: SavedProject = {
        ...activeProject,
        datasetId: selectedDatasetId,
        sql,
        nlInput,
        nlInfo,
        tab,
        activeStep,
      };
      const updatedList = saveProjectToStorage(updatedProject);
      setProjects(updatedList);
      setActiveProject(updatedProject);
      setLastSavedBaseline({
        datasetId: selectedDatasetId,
        sql,
        nlInput,
      });
      performCreateNewProject();
    } else {
      setPendingNewAfterSave(true);
      setIsSaveModalOpen(true);
    }
  }, [
    activeProject,
    selectedDatasetId,
    sql,
    nlInput,
    nlInfo,
    tab,
    activeStep,
    performCreateNewProject,
  ]);

  const handleUnsavedModalDontSave = useCallback(() => {
    setIsUnsavedModalOpen(false);
    performCreateNewProject();
  }, [performCreateNewProject]);

  const handleLoadProject = useCallback(
    (project: SavedProject) => {
      const dataset =
        DATASETS.find((item) => item.id === project.datasetId) ?? DATASETS[0];
      setSelectedDatasetId(dataset.id);
      setSql(project.sql);
      setNlInput(project.nlInput || "");
      setNlInfo(project.nlInfo || null);
      if (project.tab) setTab(project.tab);
      if (typeof project.activeStep === "number") {
        setActiveStep(project.activeStep);
      }
      setActiveProject(project);
      setLastSavedBaseline({
        datasetId: project.datasetId,
        sql: project.sql,
        nlInput: project.nlInput || "",
      });
      runQuery(project.sql, project.nlInput || undefined, dataset.schema);
      setProjectsOpen(false);
    },
    [runQuery],
  );

  const handleRenameProject = useCallback(
    (newName: string) => {
      if (!projectToRename) return;
      const updated = renameProjectInStorage(projectToRename.id, newName);
      setProjects(updated);
      if (activeProject?.id === projectToRename.id) {
        setActiveProject((prev) => (prev ? { ...prev, name: newName } : null));
      }
      setProjectToRename(null);
    },
    [projectToRename, activeProject],
  );

  const handleDeleteProject = useCallback(
    (id: string) => {
      const updated = deleteProjectFromStorage(id);
      setProjects(updated);
      if (activeProject?.id === id) {
        setActiveProject(null);
      }
    },
    [activeProject],
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
    () => erDiagramMermaid(selectedDataset.schema),
    [selectedDataset],
  );
  const current = steps[activeStep];

  return (
    <div className="min-h-screen flex flex-col pb-16 lg:pb-0">
      {/* Current Top Bar Unchanged */}
      <AppHeader dark={dark} onToggleDark={toggleDark} />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr_340px] gap-4 p-4">
        {/* Left Sidebar: Input Panel with single Guide button at bottom-left */}
        <div className={`flex flex-col ${mobileTab !== "input" ? "hidden lg:flex" : "flex"}`}>
          <InputPanel
            datasets={DATASETS}
            selectedDatasetId={selectedDataset.id}
            onDatasetChange={changeDataset}
            examples={selectedDataset.examples}
            nlInput={nlInput}
            onNlInputChange={setNlInput}
            onTranslate={() => translateNL()}
            nlInfo={nlInfo}
            sql={sql}
            onSqlChange={setSql}
            onRunQuery={() => runQuery()}
            onExampleSelect={selectExample}
            error={error}
            history={history}
            onSelectHistory={selectHistory}
            onVoiceTranslateAndRun={(params) => translateNL(params)}
            isTranslating={isTranslating}
            voiceFeedback={voiceFeedback}
            onToggleVoiceFeedback={setVoiceFeedback}
            onOpenGuide={() => setIsGuideModalOpen(true)}
          />
        </div>

        {/* Center: Canvas / Visualization with Projects Section at Top-Left */}
        <div className={`flex flex-col gap-3 min-w-0 ${mobileTab !== "canvas" ? "hidden lg:flex" : "flex"}`}>
          {/* Top Bar for Canvas: Collapsible Projects Section directly below top bar */}
          <div className="flex items-center justify-between gap-3">
            <ProjectsPanel
              isOpen={projectsOpen}
              onToggle={() => setProjectsOpen((prev) => !prev)}
              projects={projects}
              activeProjectId={activeProject?.id ?? null}
              activeProjectName={activeProject?.name ?? ""}
              hasUnsavedChanges={hasUnsavedChanges}
              onNewProject={handleNewProjectClick}
              onSaveProject={handleSaveProjectClick}
              onSelectProject={handleLoadProject}
              onOpenRenameModal={(p) => setProjectToRename(p)}
              onDeleteProject={handleDeleteProject}
            />

            {/* Subtle Save Shortcut for fast desktop access */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveProjectClick}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                title={hasUnsavedChanges ? "Save current changes" : "Workspace is up to date"}
              >
                <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Save</span>
                {hasUnsavedChanges && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
              </button>
            </div>
          </div>

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
            schema={selectedDataset.schema}
            dark={dark}
          />
        </div>

        {/* Right Sidebar: Explanation Panel */}
        <div className={`flex flex-col ${mobileTab !== "tools" ? "hidden lg:flex" : "flex"}`}>
          <ExplanationPanel current={current} error={error} />
        </div>
      </main>

      {/* Mobile-Optimized Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between shadow-lg"
        aria-label="Mobile bottom navigation"
      >
        {/* Guide button at bottom-left */}
        <button
          type="button"
          onClick={() => setIsGuideModalOpen(true)}
          className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open user guide"
        >
          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-[11px] font-medium">Guide</span>
        </button>

        {/* Project Section / Save Project Button at the bottom for phone */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setProjectsOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle projects list"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-[11px] font-medium">Projects</span>
          </button>

          <button
            type="button"
            onClick={handleSaveProjectClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity"
            style={{ background: "var(--accent)" }}
            aria-label="Save project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>Save</span>
          </button>
        </div>

        {/* Info & Tools button */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setMobileTab((prev) => (prev === "tools" ? "canvas" : "tools"))
            }
            className={`flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
              mobileTab === "tools"
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            aria-label="Toggle info and tools"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[11px] font-medium">Info &amp; Tools</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setMobileTab((prev) => (prev === "input" ? "canvas" : "input"))
            }
            className={`flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
              mobileTab === "input"
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            aria-label="Toggle input panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-[11px] font-medium">Input</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <SaveProjectModal
        isOpen={isSaveModalOpen}
        initialName={
          activeProject?.name ||
          (nlInput ? nlInput.slice(0, 30) : `${selectedDataset.name} Query`)
        }
        onSave={handleSaveModalConfirm}
        onClose={() => {
          setIsSaveModalOpen(false);
          setPendingNewAfterSave(false);
        }}
      />

      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        onSaveAndNew={handleUnsavedModalSaveAndNew}
        onDontSave={handleUnsavedModalDontSave}
        onCancel={() => setIsUnsavedModalOpen(false)}
      />

      <RenameProjectModal
        isOpen={!!projectToRename}
        currentName={projectToRename?.name || ""}
        onRename={handleRenameProject}
        onClose={() => setProjectToRename(null)}
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
