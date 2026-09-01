"use client";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col p-6 shadow-2xl border rounded-xl animate-in fade-in zoom-in-95 duration-150"
        style={{
          background: "var(--panel)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-modal-title"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-3 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h2 id="guide-modal-title" className="text-base font-bold" style={{ color: "var(--foreground)" }}>
              User Guide &amp; Features
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg transition-colors hover:opacity-75"
            style={{ color: "var(--muted)" }}
            aria-label="Close guide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="mt-4 space-y-6 overflow-y-auto pr-1 text-sm">
          {/* Frequently Asked Questions / Procedural Steps */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
              Frequently Asked Questions &amp; How-To
            </h3>
            <div className="space-y-3">
              <div
                className="p-3.5 rounded-lg border"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                }}
              >
                <h4 className="font-bold text-xs mb-1" style={{ color: "var(--foreground)" }}>
                  How do I run a voice query?
                </h4>
                <p className="text-xs leading-relaxed opacity-85" style={{ color: "var(--foreground)" }}>
                  Click the microphone button under Ask by Voice or Natural Language, speak your database question clearly, and click stop or pause. The engine transcribes your speech, links schema columns, and runs the query automatically.
                </p>
              </div>

              <div
                className="p-3.5 rounded-lg border"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                }}
              >
                <h4 className="font-bold text-xs mb-1" style={{ color: "var(--foreground)" }}>
                  How do I write or edit SQL directly?
                </h4>
                <p className="text-xs leading-relaxed opacity-85" style={{ color: "var(--foreground)" }}>
                  Scroll to the direct SQL editor, modify or write your query (e.g. SELECT, WHERE, GROUP BY), and click Execute SQL to generate step-by-step pipeline output immediately.
                </p>
              </div>

              <div
                className="p-3.5 rounded-lg border"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                }}
              >
                <h4 className="font-bold text-xs mb-1" style={{ color: "var(--foreground)" }}>
                  How do I inspect intermediate pipeline steps?
                </h4>
                <p className="text-xs leading-relaxed opacity-85" style={{ color: "var(--foreground)" }}>
                  Click any stage button (FROM, JOIN, WHERE, GROUP BY, etc.) in the Execution Pipeline section or press Animate to watch step-by-step table transformations in sequence.
                </p>
              </div>

              <div
                className="p-3.5 rounded-lg border"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                }}
              >
                <h4 className="font-bold text-xs mb-1" style={{ color: "var(--foreground)" }}>
                  How do I save and manage projects?
                </h4>
                <p className="text-xs leading-relaxed opacity-85" style={{ color: "var(--foreground)" }}>
                  Open the Projects menu from the top-left of the canvas (or bottom navigation on mobile) and click Save Project. Your queries, schema dataset, and results persist in browser storage. Click New Project to start fresh; unsaved changes will prompt for confirmation. Use the three-dots menu on any saved project to Rename or Delete it.
                </p>
              </div>
            </div>
          </div>

          {/* Key Features Section - Step by Step */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>
              Key Features &amp; Workflow
            </h3>
            <div className="space-y-2.5">
              <div
                className="flex gap-3 items-start p-3 rounded-lg border"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                }}
              >
                <div
                  className="flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs shrink-0"
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-foreground)",
                  }}
                >
                  1
                </div>
                <div>
                  <h4 className="font-bold text-xs mb-0.5" style={{ color: "var(--foreground)" }}>
                    Natural Language to SQL Translation
                  </h4>
                  <p className="text-xs opacity-85 leading-relaxed" style={{ color: "var(--foreground)" }}>
                    Converts natural speech and questions into valid SQL queries with detailed grammatical interpretations and confidence levels.
                  </p>
                </div>
              </div>

              <div
                className="flex gap-3 items-start p-3 rounded-lg border"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                }}
              >
                <div
                  className="flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs shrink-0"
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-foreground)",
                  }}
                >
                  2
                </div>
                <div>
                  <h4 className="font-bold text-xs mb-0.5" style={{ color: "var(--foreground)" }}>
                    Visual Relational Algebra Engine
                  </h4>
                  <p className="text-xs opacity-85 leading-relaxed" style={{ color: "var(--foreground)" }}>
                    Visualizes how database engines evaluate relational queries through selection (WHERE), projection (SELECT), join, and grouping (GROUP BY) operators.
                  </p>
                </div>
              </div>

              <div
                className="flex gap-3 items-start p-3 rounded-lg border"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                }}
              >
                <div
                  className="flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs shrink-0"
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-foreground)",
                  }}
                >
                  3
                </div>
                <div>
                  <h4 className="font-bold text-xs mb-0.5" style={{ color: "var(--foreground)" }}>
                    DDL, DML &amp; Custom Datasets
                  </h4>
                  <p className="text-xs opacity-85 leading-relaxed" style={{ color: "var(--foreground)" }}>
                    Supports live table creation, mutations, insertions, custom schemas, and exports to CSV or formatted markdown reports.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="pt-3 mt-4 border-t flex justify-end shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg shadow-xs cursor-pointer hover:opacity-90"
            style={{
              background: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
