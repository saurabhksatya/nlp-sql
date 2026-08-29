"use client";

import { useMemo } from "react";

interface VoiceButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  interimTranscript?: string;
  transcript?: string;
  audioLevel?: number;
  error?: string | null;
  autoExecute?: boolean;
  onToggleAutoExecute?: (enabled: boolean) => void;
  voiceFeedback?: boolean;
  onToggleVoiceFeedback?: (enabled: boolean) => void;
  isTranslating?: boolean;
}

export function VoiceButton({
  isListening,
  isSupported,
  onStartListening,
  onStopListening,
  interimTranscript = "",
  transcript = "",
  audioLevel = 0,
  error = null,
  autoExecute = true,
  onToggleAutoExecute,
  voiceFeedback = false,
  onToggleVoiceFeedback,
  isTranslating = false,
}: VoiceButtonProps) {
  const currentLiveSpeech = useMemo(() => {
    return (transcript + " " + interimTranscript).trim();
  }, [transcript, interimTranscript]);

  if (!isSupported) {
    return (
      <div
        className="p-2.5 rounded-lg border text-xs"
        style={{
          background: "var(--surface-subtle)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
      >
        <p className="font-semibold flex items-center gap-1.5">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Audio recording unavailable</span>
        </p>
        <p className="mt-0.5 opacity-80" style={{ color: "var(--muted)" }}>
          Your browser does not permit microphone access.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={isListening ? onStopListening : onStartListening}
          disabled={isTranslating}
          className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer shadow-xs ${
            isListening
              ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
              : isTranslating
                ? "bg-zinc-800 text-white cursor-wait opacity-75"
                : "hover:opacity-95 shadow-md"
          }`}
          style={
            !isListening && !isTranslating
              ? {
                  background: "var(--accent-gradient, var(--accent))",
                  color: "var(--accent-foreground)",
                }
              : undefined
          }
          aria-label={isListening ? "Stop listening" : "Speak to SQL"}
        >
          {isListening ? (
            <>
              {/* Pulsing mic & soundwave bars */}
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span>Listening... (Click to Stop)</span>
              <div className="flex items-center gap-0.5 ml-1.5 h-4">
                <span
                  className="w-1 bg-white rounded-full transition-all duration-100"
                  style={{
                    height: `${Math.max(4, Math.min(16, 4 + audioLevel * 0.12))}px`,
                  }}
                ></span>
                <span
                  className="w-1 bg-white rounded-full transition-all duration-100"
                  style={{
                    height: `${Math.max(4, Math.min(18, 4 + audioLevel * 0.18))}px`,
                  }}
                ></span>
                <span
                  className="w-1 bg-white rounded-full transition-all duration-100"
                  style={{
                    height: `${Math.max(4, Math.min(16, 4 + audioLevel * 0.14))}px`,
                  }}
                ></span>
                <span
                  className="w-1 bg-white rounded-full transition-all duration-100"
                  style={{
                    height: `${Math.max(4, Math.min(14, 4 + audioLevel * 0.1))}px`,
                  }}
                ></span>
              </div>
            </>
          ) : isTranslating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-1 h-4 w-4 text-current"
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
              <span>Translating Voice to SQL...</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              </svg>
              <span>Speak &amp; Run SQL</span>
            </>
          )}
        </button>
      </div>

      {/* Real-time live speech feedback container */}
      {isListening && (
        <div
          className="p-2.5 rounded-lg border text-xs animate-in fade-in duration-200"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          <div className="flex items-center justify-between font-medium mb-1">
            <span className="flex items-center gap-1.5 text-red-500 font-semibold">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              Recording Audio
            </span>
            <span className="text-[10px]" style={{ color: "var(--muted)" }}>
              {autoExecute ? "Translates when stopped" : "Dictation mode"}
            </span>
          </div>
          <p className="italic min-h-[1.25rem] opacity-90" style={{ color: "var(--foreground)" }}>
            {currentLiveSpeech ||
              "Listening to your voice... Speak your database query now."}
          </p>
        </div>
      )}

      {/* Voice Controls: Auto Execute & Text-to-Speech checkboxes */}
      <div
        className="flex flex-wrap items-center justify-between text-[11px] px-1 gap-2"
        style={{ color: "var(--muted)" }}
      >
        {onToggleAutoExecute && (
          <label className="flex items-center gap-1.5 cursor-pointer select-none hover:opacity-100">
            <input
              type="checkbox"
              checked={autoExecute}
              onChange={(e) => onToggleAutoExecute(e.target.checked)}
              className="rounded"
              style={{ accentColor: "var(--accent)" }}
            />
            <span style={{ color: "var(--foreground)" }}>Auto-Translate on stop</span>
          </label>
        )}
        {onToggleVoiceFeedback && (
          <label className="flex items-center gap-1.5 cursor-pointer select-none hover:opacity-100">
            <input
              type="checkbox"
              checked={voiceFeedback}
              onChange={(e) => onToggleVoiceFeedback(e.target.checked)}
              className="rounded"
              style={{ accentColor: "var(--accent)" }}
            />
            <span style={{ color: "var(--foreground)" }}>Read SQL summary</span>
          </label>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-500 p-2 rounded-md bg-red-500/10 border border-red-500/30 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={onStartListening}
            className="text-[11px] underline font-medium hover:text-red-400 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
