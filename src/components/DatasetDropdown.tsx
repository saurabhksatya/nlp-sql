import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Dataset } from "@/lib/schema";

interface DatasetDropdownProps {
  datasets: Dataset[];
  selectedDatasetId: string;
  onChange: (id: string) => void;
  onOpenCreateModal?: () => void;
  onEditDataset?: (dataset: Dataset) => void;
}

export function DatasetDropdown({
  datasets,
  selectedDatasetId,
  onChange,
  onOpenCreateModal,
  onEditDataset,
}: DatasetDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDataset =
    datasets.find((dataset) => dataset.id === selectedDatasetId) ?? datasets[0];
  const selectedIndex = Math.max(
    datasets.findIndex((dataset) => dataset.id === selectedDataset?.id),
    0,
  );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectDataset = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((isOpen) => !isOpen);
      return;
    }
    if (!open || !datasets.length) return;

    let nextIndex = selectedIndex;
    if (event.key === "ArrowDown")
      nextIndex = (selectedIndex + 1) % datasets.length;
    if (event.key === "ArrowUp")
      nextIndex = (selectedIndex - 1 + datasets.length) % datasets.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = datasets.length - 1;
    if (nextIndex !== selectedIndex) {
      event.preventDefault();
      selectDataset(datasets[nextIndex].id);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="dataset-select flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="dataset-options"
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={handleKeyDown}
      >
        <span className="flex items-center gap-2 truncate">
          <span style={{ color: "var(--foreground)" }}>{selectedDataset?.name}</span>
          {selectedDataset?.isCustom && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase border"
              style={{
                background: "var(--surface-hover)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              Custom
            </span>
          )}
        </span>
        <span
          className={`dataset-chevron ${open ? "dataset-chevron-open" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          id="dataset-options"
          role="listbox"
          aria-label="Datasets"
          className="dataset-menu absolute z-20 mt-2 w-full overflow-hidden rounded-xl p-1.5 max-h-80 overflow-y-auto"
          style={{
            background: "var(--panel)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          {datasets.map((dataset) => {
            const selected = dataset.id === selectedDataset?.id;
            return (
              <div
                key={dataset.id}
                className={`dataset-option w-full rounded-lg px-3 py-2 text-left flex items-center justify-between ${
                  selected ? "dataset-option-selected" : ""
                }`}
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className="flex-1 text-left cursor-pointer"
                  onClick={() => selectDataset(dataset.id)}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="block text-sm font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {dataset.name}
                    </span>
                    {dataset.isCustom && (
                      <span
                        className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border"
                        style={{
                          background: "var(--surface-hover)",
                          borderColor: "var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        Custom
                      </span>
                    )}
                  </div>
                  <span
                    className="mt-0.5 block text-xs opacity-70 line-clamp-1"
                    style={{ color: "var(--muted)" }}
                  >
                    {dataset.description}
                  </span>
                </button>
                {onEditDataset && (
                  <button
                    type="button"
                    title={`Edit ${dataset.name}`}
                    className="p-1 px-2 text-xs rounded border border-zinc-500/30 hover:bg-zinc-500/10 text-zinc-300 ml-2 cursor-pointer shrink-0 flex items-center gap-1 font-medium transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      onEditDataset(dataset);
                    }}
                  >
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span>Edit</span>
                  </button>
                )}
              </div>
            );
          })}

          {onOpenCreateModal && (
            <div
              className="pt-1 mt-1 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                type="button"
                className="dataset-option w-full rounded-lg px-3 py-2 text-left text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                style={{ color: "var(--foreground)" }}
                onClick={() => {
                  setOpen(false);
                  onOpenCreateModal();
                }}
              >
                <span>+ Create New Dataset...</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
