"use client";

import { useState, useEffect, useRef } from "react";

interface RenameProjectModalProps {
  isOpen: boolean;
  currentName: string;
  onRename: (newName: string) => void;
  onClose: () => void;
}

export function RenameProjectModal({
  isOpen,
  currentName,
  onRename,
  onClose,
}: RenameProjectModalProps) {
  const [name, setName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onRename(name.trim());
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
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
        aria-labelledby="rename-project-title"
      >
        <div
          className="flex items-center justify-between pb-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <h2
            id="rename-project-title"
            className="text-base font-bold"
            style={{ color: "var(--foreground)" }}
          >
            Rename Project
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg transition-colors hover:opacity-75"
            style={{ color: "var(--muted)" }}
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="rename-project-input"
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--foreground)" }}
            >
              New Project Name
            </label>
            <input
              id="rename-project-input"
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
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
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-xs font-semibold rounded-lg disabled:opacity-40 transition-opacity shadow-xs cursor-pointer hover:opacity-90 border"
              style={{
                background: "var(--accent-gradient, var(--accent))",
                color: "var(--accent-foreground)",
                borderColor: "var(--accent)",
              }}
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
