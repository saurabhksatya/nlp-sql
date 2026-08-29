"use client";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-2xl max-h-[85vh] flex flex-col p-6 shadow-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h2 id="guide-modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              User Guide &amp; Features
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close guide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="mt-4 space-y-6 overflow-y-auto pr-1 text-sm text-slate-700 dark:text-slate-300">
          {/* Frequently Asked Questions / Procedural Steps */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3">
              Frequently Asked Questions &amp; How-To
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs mb-1">
                  How do I run a voice query?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Click the microphone button under Ask by Voice or Natural Language, speak your database question clearly, and click stop or pause. The engine transcribes your speech, links schema columns, and runs the query automatically.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs mb-1">
                  How do I write or edit SQL directly?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Scroll to the direct SQL editor, modify or write your query (e.g. SELECT, WHERE, GROUP BY), and click Execute SQL to generate step-by-step pipeline output immediately.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs mb-1">
                  How do I inspect intermediate pipeline steps?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Click any stage button (FROM, JOIN, WHERE, GROUP BY, etc.) in the Execution Pipeline section or press Animate to watch step-by-step table transformations in sequence.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs mb-1">
                  How do I save and manage projects?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Open the Projects menu from the top-left of the canvas (or bottom navigation on mobile) and click Save Project. Your queries, schema dataset, and results persist in browser storage. Click New Project to start fresh; unsaved changes will prompt for confirmation. Use the three-dots menu on any saved project to Rename or Delete it.
                </p>
              </div>
            </div>
          </div>

          {/* Key Features Section - Step by Step */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3">
              Key Features &amp; Workflow
            </h3>
            <div className="space-y-2.5">
              <div className="flex gap-3 items-start p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    Multimodal Voice &amp; Natural Language
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Real-time audio level equalizer, speech recognition, schema linking, and Gemini query translation.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    Relational Algebra Pipeline Engine
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Local in-browser relational execution: table scan, filter predicates, hash aggregations, projection, and limits.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    Interactive Schema &amp; ER Diagrams
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Multiple pre-loaded relational datasets with primary/foreign key tracking and Mermaid ER diagrams.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    ChatGPT-Style Project Workspace
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Persistent workspace snapshots, unsaved change alerts, project duplication avoidance, and export to CSV or Markdown.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg text-white transition-opacity"
            style={{ background: "var(--accent)" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
