"use client";

import { useEffect, useRef, useState } from "react";
import type { SavedProject } from "@/lib/projectStorage";

interface ProjectsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  projects: SavedProject[];
  activeProjectId: string | null;
  activeProjectName: string;
  hasUnsavedChanges: boolean;
  onNewProject: () => void;
  onSaveProject: () => void;
  onSelectProject: (project: SavedProject) => void;
  onOpenRenameModal: (project: SavedProject) => void;
  onDeleteProject: (id: string) => void;
}

export function ProjectsPanel({
  isOpen,
  onToggle,
  projects,
  activeProjectId,
  activeProjectName,
  hasUnsavedChanges,
  onNewProject,
  onSaveProject,
  onSelectProject,
  onOpenRenameModal,
  onDeleteProject,
}: ProjectsPanelProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close project action dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  return (
    <div className="relative inline-block text-left z-30" ref={panelRef}>
      {/* Compact Unobtrusive Collapsible Trigger Button */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shadow-xs cursor-pointer hover:opacity-90"
        style={{
          background: isOpen ? "var(--surface-hover)" : "var(--panel)",
          color: "var(--foreground)",
          borderColor: "var(--border)",
        }}
        aria-expanded={isOpen}
        aria-label="Toggle projects panel"
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
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>

        <span className="font-semibold">Projects</span>

        {activeProjectName && (
          <span className="hidden sm:inline-flex items-center gap-1 opacity-80 max-w-[140px] truncate">
            / {activeProjectName}
          </span>
        )}

        {hasUnsavedChanges && (
          <span
            className="w-2 h-2 rounded-full bg-amber-500"
            title="Unsaved changes"
            aria-label="Unsaved changes"
          />
        )}

        <svg
          className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded ChatGPT-style Projects Panel / Dropdown */}
      {isOpen && (
        <>
          {/* Overlay for mobile / backdrop click */}
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={onToggle}
          />

          <div
            className="absolute left-0 top-full mt-2 w-80 sm:w-88 rounded-xl border shadow-2xl z-40 p-3 animate-in fade-in zoom-in-95 duration-150"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
            role="region"
            aria-label="Projects list"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between pb-2.5 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--foreground)" }}
                >
                  Projects ({projects.length})
                </span>
                {hasUnsavedChanges && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium border"
                    style={{
                      background: "var(--surface-subtle)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                  >
                    Unsaved
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onToggle}
                className="p-1 rounded-md transition-colors hover:opacity-75"
                style={{ color: "var(--muted)" }}
                aria-label="Close projects panel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-2.5 mb-3">
              <button
                type="button"
                onClick={() => {
                  onNewProject();
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer hover:opacity-90"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Project</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSaveProject();
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-opacity shadow-xs cursor-pointer hover:opacity-90"
                style={{
                  background: "var(--accent-gradient, var(--accent))",
                  color: "var(--accent-foreground)",
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Save Project</span>
              </button>
            </div>

            {/* Current Project Info Bar */}
            <div
              className="px-2.5 py-1.5 rounded-lg border mb-2 flex items-center justify-between text-[11px]"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
              }}
            >
              <span style={{ color: "var(--muted)" }}>Current:</span>
              <span
                className="font-semibold truncate max-w-[180px]"
                style={{ color: "var(--foreground)" }}
              >
                {activeProjectName || "Untitled Project"}
              </span>
            </div>

            {/* Projects List (ChatGPT Sidebar Style) */}
            <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
              {projects.length === 0 ? (
                <div className="py-6 text-center text-xs opacity-70" style={{ color: "var(--muted)" }}>
                  <p>No saved projects yet.</p>
                  <p className="mt-1 text-[11px] opacity-80">Click Save Project to save current workspace.</p>
                </div>
              ) : (
                projects.map((p) => {
                  const isActive = p.id === activeProjectId;
                  const isMenuOpen = openMenuId === p.id;

                  return (
                    <div
                      key={p.id}
                      className="group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer border"
                      style={{
                        background: isActive ? "var(--surface-subtle)" : "transparent",
                        borderColor: isActive ? "var(--accent)" : "transparent",
                        color: "var(--foreground)",
                      }}
                      onClick={() => onSelectProject(p)}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate block font-medium" style={{ color: "var(--foreground)" }}>
                            {p.name}
                          </span>
                          {isActive && (
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: "var(--accent)" }}
                            />
                          )}
                        </div>
                        <div
                          className="flex items-center gap-2 mt-0.5 text-[10px] opacity-70"
                          style={{ color: "var(--muted)" }}
                        >
                          <span className="capitalize">{p.datasetId}</span>
                          <span>&middot;</span>
                          <span>{formatRelativeTime(p.updatedAt)}</span>
                        </div>
                      </div>

                      {/* Three-dots menu trigger */}
                      <div className="relative shrink-0" ref={isMenuOpen ? menuRef : null}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : p.id);
                          }}
                          className="p-1 rounded-md transition-colors hover:opacity-100 opacity-60"
                          style={{ color: "var(--foreground)" }}
                          aria-label={`Options for ${p.name}`}
                          aria-haspopup="true"
                          aria-expanded={isMenuOpen}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>

                        {/* Dropdown menu for Rename / Delete */}
                        {isMenuOpen && (
                          <div
                            className="absolute right-0 top-full mt-1 w-32 rounded-lg border shadow-xl z-50 py-1 text-xs animate-in fade-in zoom-in-95 duration-100"
                            style={{
                              background: "var(--panel)",
                              borderColor: "var(--border)",
                              color: "var(--foreground)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onOpenRenameModal(p);
                              }}
                              className="w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors hover:bg-[var(--surface-hover)]"
                              style={{ color: "var(--foreground)" }}
                            >
                              <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              <span>Rename</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onDeleteProject(p.id);
                              }}
                              className="w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors text-red-500 hover:bg-red-500/10"
                            >
                              <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return "";
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
