import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Dataset } from "@/lib/schema";

interface DatasetDropdownProps {
  datasets: Dataset[];
  selectedDatasetId: string;
  onChange: (id: string) => void;
  onOpenCreateModal?: () => void;
  onDeleteDataset?: (id: string) => void;
}

export function DatasetDropdown({
  datasets,
  selectedDatasetId,
  onChange,
  onOpenCreateModal,
  onDeleteDataset,
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
                {dataset.isCustom && onDeleteDataset && (
                  <button
                    type="button"
                    title="Delete custom dataset"
                    className="p-1 text-xs opacity-60 hover:opacity-100 hover:text-red-500 ml-2 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDataset(dataset.id);
                    }}
                  >
                    🗑
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
