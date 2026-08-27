"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { InputPanel } from "@/components/InputPanel";
import type { HistoryItem, Tab } from "@/components/nlSqlTypes";
import { VisualizationPanel } from "@/components/VisualizationPanel";
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
  const selectedDataset =
    DATASETS.find((dataset) => dataset.id === selectedDatasetId) ?? DATASETS[0];

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

  useEffect(() => {
    let loadHistory: ReturnType<typeof setTimeout> | undefined;
    try {
      const savedHistory = localStorage.getItem("nlp-sql-history");
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as HistoryItem[];
        loadHistory = setTimeout(() => setHistory(parsedHistory), 0);
      }
    } catch {
      // Ignore malformed or unavailable local storage.
    }
    return () => {
      if (loadHistory) clearTimeout(loadHistory);
    };
  }, []);

  const runQuery = useCallback(
    (query?: string, question?: string) => {
      const q = (query ?? sql).trim();
      if (timer.current) clearInterval(timer.current);
      setPlaying(false);
      const result = executeSQL(q, selectedDataset.schema);
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
    <div className="min-h-screen flex flex-col">
      <AppHeader dark={dark} onToggleDark={toggleDark} />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr_340px] gap-4 p-4">
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
        />
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
        <ExplanationPanel current={current} error={error} />
      </main>
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
