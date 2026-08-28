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
      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
        <p className="font-semibold flex items-center gap-1.5">
          <span>⚠️</span> Audio recording unavailable
        </p>
        <p className="mt-0.5 opacity-80">
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
          className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm ${
            isListening
              ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
              : isTranslating
                ? "bg-indigo-600/70 text-white cursor-wait"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
          }`}
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
                className="animate-spin -ml-1 mr-1 h-4 w-4 text-white"
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
              <span>🎙️ Speak & Run SQL</span>
            </>
          )}
        </button>
      </div>

      {/* Real-time live speech feedback container */}
      {isListening && (
        <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between font-medium text-indigo-700 dark:text-indigo-300 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Recording Audio
            </span>
            <span className="text-[10px] opacity-70">
              {autoExecute ? "Translates when stopped" : "Dictation mode"}
            </span>
          </div>
          <p className="italic text-slate-700 dark:text-slate-200 min-h-[1.25rem]">
            {currentLiveSpeech ||
              "Listening to your voice... Speak your database query now."}
          </p>
        </div>
      )}

      {/* Voice Controls: Auto Execute & Text-to-Speech checkboxes */}
      <div className="flex flex-wrap items-center justify-between text-[11px] opacity-80 px-1 gap-2">
        {onToggleAutoExecute && (
          <label className="flex items-center gap-1.5 cursor-pointer select-none hover:opacity-100">
            <input
              type="checkbox"
              checked={autoExecute}
              onChange={(e) => onToggleAutoExecute(e.target.checked)}
              className="accent-indigo-600 rounded"
            />
            <span>Auto-Translate on stop</span>
          </label>
        )}
        {onToggleVoiceFeedback && (
          <label className="flex items-center gap-1.5 cursor-pointer select-none hover:opacity-100">
            <input
              type="checkbox"
              checked={voiceFeedback}
              onChange={(e) => onToggleVoiceFeedback(e.target.checked)}
              className="accent-indigo-600 rounded"
            />
            <span>🔊 Read SQL summary</span>
          </label>
        )}
      </div>

      {/* Error alert if any permission or recording error occurred */}
      {error && (
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
          <p>⚠️ {error}</p>
        </div>
      )}
    </div>
  );
}
