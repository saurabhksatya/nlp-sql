"use client";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSaveAndNew: () => void;
  onDontSave: () => void;
  onCancel: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  onSaveAndNew,
  onDontSave,
  onCancel,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md p-5 shadow-2xl border rounded-xl animate-in fade-in zoom-in-95 duration-150"
        style={{
          background: "var(--panel)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
      >
        <div
          className="flex items-center justify-between pb-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2
            id="unsaved-changes-title"
            className="text-base font-bold"
            style={{ color: "var(--foreground)" }}
          >
            Unsaved Changes
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg transition-colors hover:opacity-75"
            style={{ color: "var(--muted)" }}
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 mb-6">
          <p className="text-sm opacity-90" style={{ color: "var(--foreground)" }}>
            This project has unsaved changes. What would you like to do before starting a new project?
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer hover:opacity-90"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDontSave}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            Don&apos;t Save
          </button>
          <button
            type="button"
            onClick={onSaveAndNew}
            className="px-4 py-2 text-xs font-semibold rounded-lg transition-opacity shadow-xs cursor-pointer hover:opacity-90 border"
            style={{
              background: "var(--accent-gradient, var(--accent))",
              color: "var(--accent-foreground)",
              borderColor: "var(--accent)",
            }}
          >
            Save &amp; New
          </button>
        </div>
      </div>
    </div>
  );
}
