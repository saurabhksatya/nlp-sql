"use client";

import { useEffect, useRef, useState } from "react";
import { THEME_CONFIGS, type ThemeId } from "./nlSqlTypes";

interface AppHeaderProps {
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}

export function AppHeader({ theme, onThemeChange }: AppHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTheme =
    THEME_CONFIGS.find((t) => t.id === theme) ?? THEME_CONFIGS[0];

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <header
      className="flex items-center justify-between px-5 py-3 border-b transition-colors relative z-40"
      style={{
        background: "var(--panel)",
        borderColor: "var(--border)",
      }}
    >
      {/* Brand logo & title */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs shadow-xs"
          style={{
            background: "var(--accent)",
            color: "var(--accent-foreground)",
          }}
        >
          SQL
        </div>
        <div className="flex items-baseline gap-2">
          <h1
            className="text-base font-bold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            NL→SQL Visualizer
          </h1>
        </div>
      </div>

      {/* Collapsible Theme Button & Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer shadow-xs hover:opacity-90"
          style={{
            background: "var(--surface-subtle)",
            color: "var(--foreground)",
            borderColor: "var(--border)",
          }}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Toggle theme selection menu"
        >
          {/* Palette / Theme Icon */}
          <svg
            className="w-3.5 h-3.5 opacity-80"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>

          {/* Theme Label */}
          <span className="font-semibold">Theme</span>

          {/* Active theme preview pill */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-current/20">
            <div className="flex -space-x-1 items-center">
              {currentTheme.swatches.slice(0, 3).map((color, idx) => (
                <span
                  key={idx}
                  className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20 shrink-0"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="font-medium opacity-90">
              {currentTheme.name.replace(/^\d+\.\s*/, "")}
            </span>
          </div>

          {/* Chevron */}
          <svg
            className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
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

        {/* Collapsible Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute right-0 mt-2 w-72 sm:w-80 rounded-xl p-2 shadow-2xl border transition-all z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
            role="listbox"
            aria-label="Theme options"
          >
            <div
              className="px-2 py-1.5 mb-1 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border)" }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wider opacity-60"
                style={{ color: "var(--muted)" }}
              >
                Select Theme
              </span>
              <span
                className="text-[10px] opacity-60"
                style={{ color: "var(--muted)" }}
              >
                {THEME_CONFIGS.length} themes available
              </span>
            </div>

            <div className="space-y-1">
              {THEME_CONFIGS.map((t) => {
                const isSelected = t.id === theme;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onThemeChange(t.id);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-all cursor-pointer"
                    style={{
                      background: isSelected
                        ? "var(--surface-subtle)"
                        : "transparent",
                      color: "var(--foreground)",
                      borderColor: isSelected
                        ? "var(--accent)"
                        : "transparent",
                      borderWidth: "1px",
                      borderStyle: "solid",
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Swatch palette preview */}
                      <div
                        className="flex -space-x-1 shrink-0 p-1 rounded-md border"
                        style={{
                          background: "var(--background)",
                          borderColor: "var(--border)",
                        }}
                      >
                        {t.swatches.map((color, idx) => (
                          <span
                            key={idx}
                            className="w-3 h-3 rounded-full border border-black/30 dark:border-white/30"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>

                      {/* Theme label and subtitle */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="truncate font-semibold"
                            style={{ color: "var(--foreground)" }}
                          >
                            {t.name}
                          </span>
                          {t.id === "eclipse" && (
                            <span
                              className="text-[9px] px-1.5 py-0.2 rounded-full font-mono border"
                              style={{
                                background: "var(--surface-hover)",
                                color: "var(--accent)",
                                borderColor: "var(--accent)",
                              }}
                            >
                              Default
                            </span>
                          )}
                        </div>
                        <p
                          className="text-[10px] truncate opacity-70"
                          style={{ color: "var(--muted)" }}
                        >
                          {t.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Active checkmark indicator */}
                    {isSelected && (
                      <svg
                        className="w-4 h-4 shrink-0 ml-2"
                        style={{ color: "var(--accent)" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
