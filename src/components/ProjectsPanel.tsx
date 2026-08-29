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
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shadow-xs ${
          isOpen
            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700"
            : "panel hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
        }`}
        aria-expanded={isOpen}
        aria-label="Toggle projects panel"
      >
        <svg
          className="w-4 h-4 text-slate-500 dark:text-slate-400"
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
          <span className="hidden sm:inline-flex items-center gap-1 opacity-75 max-w-[140px] truncate">
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
            className="fixed inset-0 z-30 bg-black/20 md:hidden"
            onClick={onToggle}
          />

          <div
            className="absolute left-0 top-full mt-2 w-80 sm:w-88 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-40 p-3 animate-in fade-in zoom-in-95 duration-150"
            role="region"
            aria-label="Projects list"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Projects ({projects.length})
                </span>
                {hasUnsavedChanges && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium">
                    Unsaved
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onToggle}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 transition-colors"
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
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-medium rounded-lg text-white transition-opacity"
                style={{ background: "var(--accent)" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Save Project</span>
              </button>
            </div>

            {/* Current Project Info Bar */}
            <div className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 mb-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Current:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                {activeProjectName || "Untitled Project"}
              </span>
            </div>

            {/* Projects List (ChatGPT Sidebar Style) */}
            <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
              {projects.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  <p>No saved projects yet.</p>
                  <p className="mt-1 text-[11px] opacity-75">Click Save Project to save current workspace.</p>
                </div>
              ) : (
                projects.map((p) => {
                  const isActive = p.id === activeProjectId;
                  const isMenuOpen = openMenuId === p.id;

                  return (
                    <div
                      key={p.id}
                      className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                        isActive
                          ? "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200 font-medium"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent text-slate-700 dark:text-slate-300"
                      }`}
                      onClick={() => onSelectProject(p)}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate block font-medium">
                            {p.name}
                          </span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] opacity-60">
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
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
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
                            className="absolute right-0 top-full mt-1 w-32 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50 py-1 text-xs animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onOpenRenameModal(p);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
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
                              className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                            >
                              <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
