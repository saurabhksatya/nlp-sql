"use client";

import { useCallback, useState } from "react";
import type { InputPanelProps } from "./nlSqlTypes";
import { DatasetDropdown } from "./DatasetDropdown";
import { VoiceButton } from "./VoiceButton";
import {
  useVoiceRecognition,
  speakText,
  type VoiceAudioResult,
} from "@/lib/useSpeechRecognition";

export function InputPanel({
  datasets,
  selectedDatasetId,
  onDatasetChange,
  examples,
  nlInput,
  onNlInputChange,
  onTranslate,
  nlInfo,
  sql,
  onSqlChange,
  onRunQuery,
  onExampleSelect,
  onResetDatabase,
  error,
  history,
  onSelectHistory,
  onVoiceTranslateAndRun,
  isTranslating = false,
  voiceFeedback = false,
  onToggleVoiceFeedback,
  onOpenCreateModal,
  onEditDataset,
  onOpenGuide,
}: InputPanelProps) {
  const [autoExecute, setAutoExecute] = useState(true);

  // Handle completion of audio recording / speech
  const handleAudioReady = useCallback(
    (result: VoiceAudioResult) => {
      if (result.transcript) {
        onNlInputChange(result.transcript);
      }
      if (autoExecute && onVoiceTranslateAndRun) {
        onVoiceTranslateAndRun({
          audioBase64: result.audioBase64,
          mimeType: result.mimeType,
          question: result.transcript || nlInput,
        });
      }
    },
    [autoExecute, nlInput, onNlInputChange, onVoiceTranslateAndRun],
  );

  const {
    isListening,
    transcript,
    interimTranscript,
    audioLevel,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
  } = useVoiceRecognition({
    onAudioReady: handleAudioReady,
    onInterimResult: (interim) => {
      if (interim && !autoExecute) {
        onNlInputChange(interim);
      }
    },
    autoStopSilenceMs: 2500,
  });

  const handleStartVoice = () => {
    startListening(handleAudioReady);
  };

  const handleReadInterpretation = () => {
    if (nlInfo?.interpretation) {
      speakText(nlInfo.interpretation);
    }
  };

  const activeDataset = datasets.find((d) => d.id === selectedDatasetId) ?? datasets[0];

  return (
    <section
      className="panel p-4 flex flex-col gap-4 max-h-[calc(100vh-5rem)] relative overflow-hidden"
      style={{
        background: "var(--panel)",
        borderColor: "var(--border)",
        color: "var(--foreground)",
      }}
      aria-label="Input panel"
    >
      {/* Scrollable Main Area with generous, balanced spacing */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {/* Choose a Dataset Card */}
        <div
          className="p-3.5 rounded-xl border space-y-2.5"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center justify-between">
            <label
              htmlFor="dataset"
              className="text-xs font-bold uppercase tracking-wider block"
              style={{ color: "var(--muted)" }}
            >
              Choose a dataset
            </label>
            <div className="flex items-center gap-1.5">
              {onEditDataset && activeDataset && (
                <button
                  type="button"
                  onClick={() => onEditDataset(activeDataset)}
                  title="Edit currently selected dataset"
                  className="text-[11px] px-2 py-0.5 rounded border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition-colors font-medium cursor-pointer flex items-center gap-1"
                >
                  <svg
                    className="w-3 h-3 opacity-80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>Edit</span>
                </button>
              )}
              {onOpenCreateModal && (
                <button
                  type="button"
                  onClick={onOpenCreateModal}
                  title="Create a new custom dataset with tables"
                  className="text-[11px] px-2 py-0.5 rounded border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 transition-colors font-medium cursor-pointer"
                >
                  + New
                </button>
              )}
              {onResetDatabase && (
                <button
                  type="button"
                  onClick={onResetDatabase}
                  title="Reset database tables and data to defaults"
                  className="text-[11px] px-2 py-0.5 rounded border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors font-medium cursor-pointer"
                >
                  Reset DB
                </button>
              )}
            </div>
          </div>
          <DatasetDropdown
            datasets={datasets}
            selectedDatasetId={selectedDatasetId}
            onChange={onDatasetChange}
            onOpenCreateModal={onOpenCreateModal}
            onEditDataset={onEditDataset}
          />
        </div>

        {/* 1. Voice and Natural Language Query Section */}
        <div
          className="p-3.5 rounded-xl border flex flex-col gap-3"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center justify-between">
            <h2
              className="font-bold flex items-center gap-1.5 text-sm"
              style={{ color: "var(--foreground)" }}
            >
              <span>1. Ask by Voice or Natural Language</span>
            </h2>
            {isListening && (
              <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Recording
              </span>
            )}
          </div>

          {/* Dedicated Direct Voice-to-SQL Button & Controls */}
          <VoiceButton
            isListening={isListening}
            isSupported={isSupported}
            onStartListening={handleStartVoice}
            onStopListening={stopListening}
            transcript={transcript}
            interimTranscript={interimTranscript}
            audioLevel={audioLevel}
            error={speechError}
            autoExecute={autoExecute}
            onToggleAutoExecute={setAutoExecute}
            voiceFeedback={voiceFeedback}
            onToggleVoiceFeedback={onToggleVoiceFeedback}
            isTranslating={isTranslating}
          />

          {/* Natural Language Textarea with Inline Dictation Mic */}
          <div className="relative">
            <textarea
              value={nlInput}
              onChange={(event) => onNlInputChange(event.target.value)}
              placeholder='Speak via mic above or type (e.g. "How many customers are there?")'
              rows={2}
              className="w-full p-2.5 pr-8 text-sm resize-y rounded-lg border focus:outline-none"
              style={{
                background: "var(--panel)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              aria-label="Natural language input"
            />
            {isSupported && (
              <button
                type="button"
                onClick={isListening ? stopListening : handleStartVoice}
                title={isListening ? "Stop listening" : "Dictate via microphone"}
                className="absolute right-2 top-2.5 p-1 rounded-md transition-colors"
                style={{
                  color: isListening ? "#ef4444" : "var(--muted)",
                  background: isListening ? "rgba(239, 68, 68, 0.15)" : "transparent",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                  <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                </svg>
              </button>
            )}
          </div>

          <button
            onClick={onTranslate}
            disabled={!nlInput.trim() || isTranslating}
            className="w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5 transition-opacity cursor-pointer shadow-xs"
            style={{
              background: "var(--accent-gradient, var(--accent))",
              color: "var(--accent-foreground)",
            }}
          >
            {isTranslating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Translating to SQL...</span>
              </>
            ) : (
              <span className="flex items-center gap-1.5">
                <span>Translate &amp; Run</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            )}
          </button>

          {/* Translation results & interpretation */}
          {nlInfo && (
            <div
              className="mt-1 text-xs space-y-1.5 p-3 rounded-lg border"
              style={{
                background: "var(--panel)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                  Confidence:{" "}
                  <span className="font-mono font-bold" style={{ color: "var(--accent)" }}>
                    {(nlInfo.confidence * 100).toFixed(0)}%
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleReadInterpretation}
                  title="Read interpretation aloud"
                  className="flex items-center gap-1 text-[11px] hover:underline cursor-pointer"
                  style={{ color: "var(--muted)" }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  <span>Read aloud</span>
                </button>
              </div>
              <p className="opacity-90 leading-relaxed" style={{ color: "var(--foreground)" }}>
                {nlInfo.interpretation}
              </p>
            </div>
          )}
        </div>

        {/* 2. Direct SQL Query Section */}
        <div
          className="p-3.5 rounded-xl border flex flex-col gap-3"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center justify-between">
            <h2
              className="font-bold text-sm"
              style={{ color: "var(--foreground)" }}
            >
              2. Or write SQL directly
            </h2>
          </div>
          <textarea
            value={sql}
            onChange={(event) => onSqlChange(event.target.value)}
            rows={4}
            spellCheck={false}
            className="w-full p-2.5 text-sm font-mono resize-y rounded-lg border focus:outline-none"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
            aria-label="SQL query"
          />
          <button
            onClick={onRunQuery}
            className="w-full py-2 rounded-lg text-sm font-semibold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:opacity-90"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <span>Execute SQL</span>
          </button>
          {error && (
            <p role="alert" className="text-xs text-red-500 font-mono p-2 rounded-md bg-red-500/10 border border-red-500/30">
              {error}
            </p>
          )}
        </div>

        {/* Sample Inputs */}
        <div
          className="p-3.5 rounded-xl border space-y-2.5"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
          }}
        >
          <h2
            className="font-bold text-sm"
            style={{ color: "var(--foreground)" }}
          >
            Sample Inputs
          </h2>
          <ul className="space-y-1.5">
            {examples.map((example) => (
              <li key={example.id}>
                <button
                  onClick={() => {
                    onExampleSelect(example.question, example.sql);
                  }}
                  className="w-full text-left text-xs p-2.5 rounded-lg border transition-colors cursor-pointer hover:opacity-90"
                  style={{
                    background: "var(--panel)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                  title={`Expected: ${example.expected}`}
                >
                  <span className="opacity-50 font-mono mr-1">{example.id}.</span>{" "}
                  {example.question}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* History */}
        <div
          className="p-3.5 rounded-xl border space-y-2.5"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
          }}
        >
          <h2
            className="font-bold text-sm"
            style={{ color: "var(--foreground)" }}
          >
            History
          </h2>
          {history.length === 0 && (
            <p className="text-xs opacity-50" style={{ color: "var(--muted)" }}>
              No queries yet.
            </p>
          )}
          <ul className="space-y-1.5">
            {history.slice(0, 8).map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onSelectHistory(item)}
                  className="w-full text-left text-xs p-2.5 rounded-lg border truncate transition-colors cursor-pointer hover:opacity-90"
                  style={{
                    background: "var(--panel)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  <span className="opacity-60 font-mono text-[10px]" style={{ color: "var(--muted)" }}>
                    {item.time} &middot; {item.rows} rows
                  </span>
                  <br />
                  <span className="font-semibold">{item.question}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Permanently pinned Guide button at bottom-left */}
      {onOpenGuide && (
        <div
          className="pt-2 border-t shrink-0 flex items-center justify-between"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer hover:opacity-90"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
            aria-label="Open user guide and help"
          >
            <svg
              className="w-4 h-4 opacity-80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span>Guide</span>
          </button>
        </div>
      )}
    </section>
  );
}
