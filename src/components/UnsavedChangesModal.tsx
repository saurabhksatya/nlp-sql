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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      onClick={onCancel}
    >
      <div
        className="panel w-full max-w-md p-5 shadow-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h2 id="unsaved-changes-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Unsaved Changes
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 mb-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This project has unsaved changes.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDontSave}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            Don&apos;t Save
          </button>
          <button
            type="button"
            onClick={onSaveAndNew}
            className="px-4 py-2 text-xs font-medium rounded-lg text-white transition-opacity"
            style={{ background: "var(--accent)" }}
          >
            Save &amp; New
          </button>
        </div>
      </div>
    </div>
  );
}
