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
  onDeleteDataset,
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

  return (
    <section
      className="panel p-4 flex flex-col gap-4 max-h-[calc(100vh-5rem)] relative overflow-hidden"
      aria-label="Input panel"
    >
      {/* Scrollable Main Area */}
      <div className="input-panel-scrollbar flex-1 overflow-y-auto space-y-4 pr-1">
        <div className="dataset-picker p-3">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="dataset"
              className="text-xs font-semibold uppercase tracking-wider opacity-70 block"
            >
              Choose a dataset
            </label>
            <div className="flex items-center gap-1.5">
              {onOpenCreateModal && (
                <button
                  type="button"
                  onClick={onOpenCreateModal}
                  title="Create a new custom dataset with tables"
                  className="text-[11px] px-2 py-0.5 rounded border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors font-medium cursor-pointer"
                >
                  + New
                </button>
              )}
              {onResetDatabase && (
                <button
                  type="button"
                  onClick={onResetDatabase}
                  title="Reset database tables and data to defaults"
                  className="text-[11px] px-2 py-0.5 rounded border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors font-medium cursor-pointer"
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
            onDeleteDataset={onDeleteDataset}
          />
        </div>

        {/* 1. Voice and Natural Language Query Section */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-1.5 text-sm">
              <span>1. Ask by Voice or Natural Language</span>
            </h2>
            {isListening && (
              <span className="flex items-center gap-1 text-[11px] text-rose-500 font-medium animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
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
              className="w-full panel p-2.5 pr-8 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label="Natural language input"
            />
            {isSupported && (
              <button
                type="button"
                onClick={isListening ? stopListening : handleStartVoice}
                title={isListening ? "Stop listening" : "Dictate via microphone"}
                className={`absolute right-2 top-2.5 p-1 rounded-md transition-colors ${
                  isListening
                    ? "text-rose-500 bg-rose-500/10 hover:bg-rose-500/20"
                    : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
                }`}
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
            className="w-full py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-1.5 transition-opacity cursor-pointer"
            style={{ background: "var(--accent)" }}
          >
            {isTranslating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
            <div className="mt-1 text-xs space-y-1 panel p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                  Confidence:{" "}
                  <span className="font-mono">
                    {(nlInfo.confidence * 100).toFixed(0)}%
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleReadInterpretation}
                  title="Read interpretation aloud"
                  className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  <span>Read aloud</span>
                </button>
              </div>
              <p className="opacity-80 text-slate-700 dark:text-slate-300">
                {nlInfo.interpretation}
              </p>
              <p className="font-mono opacity-50 text-[10px]">
                Generated by Gemini 2.5 Flash
              </p>
            </div>
          )}
        </div>

        {/* 2. Direct SQL Query Section */}
        <div>
          <h2 className="font-semibold mb-2 text-sm">2. Or write SQL directly</h2>
          <textarea
            value={sql}
            onChange={(event) => onSqlChange(event.target.value)}
            rows={4}
            spellCheck={false}
            className="w-full panel p-2 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-indigo-500"
            aria-label="SQL query"
          />
          <button
            onClick={onRunQuery}
            className="mt-2 w-full py-2 rounded-lg text-sm font-medium panel hover:opacity-80 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Execute SQL</span>
          </button>
          {error && (
            <p role="alert" className="mt-2 text-xs text-red-500 font-mono">
              {error}
            </p>
          )}
        </div>

        {/* Sample Inputs */}
        <div>
          <h2 className="font-semibold mb-2 text-sm">Sample Inputs</h2>
          <ul className="space-y-1.5">
            {examples.map((example) => (
              <li key={example.id}>
                <button
                  onClick={() => {
                    onExampleSelect(example.question, example.sql);
                  }}
                  className="w-full text-left text-xs panel px-2 py-1.5 hover:opacity-75 transition-opacity cursor-pointer"
                  title={`Expected: ${example.expected}`}
                >
                  <span className="opacity-50 mr-1">{example.id}.</span>{" "}
                  {example.question}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* History */}
        <div>
          <h2 className="font-semibold mb-2 text-sm">History</h2>
          {history.length === 0 && (
            <p className="text-xs opacity-50">No queries yet.</p>
          )}
          <ul className="space-y-1">
            {history.slice(0, 8).map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onSelectHistory(item)}
                  className="w-full text-left text-xs panel px-2 py-1.5 hover:opacity-75 truncate transition-opacity cursor-pointer"
                >
                  <span className="opacity-50">
                    {item.time} &middot; {item.rows} rows
                  </span>
                  <br />
                  {item.question}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Permanently pinned Guide button at bottom-left */}
      {onOpenGuide && (
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            aria-label="Open user guide and help"
          >
            <svg
              className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
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
