import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Dataset } from "@/lib/schema";

interface DatasetDropdownProps {
  datasets: Dataset[];
  selectedDatasetId: string;
  onChange: (id: string) => void;
}

export function DatasetDropdown({
  datasets,
  selectedDatasetId,
  onChange,
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
        <span>{selectedDataset?.name}</span>
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
          className="dataset-menu absolute z-20 mt-2 w-full overflow-hidden rounded-xl p-1.5"
        >
          {datasets.map((dataset) => {
            const selected = dataset.id === selectedDataset?.id;
            return (
              <button
                key={dataset.id}
                type="button"
                role="option"
                aria-selected={selected}
                className={`dataset-option w-full rounded-lg px-3 py-2 text-left ${selected ? "dataset-option-selected" : ""}`}
                onClick={() => selectDataset(dataset.id)}
              >
                <span className="block text-sm font-semibold">
                  {dataset.name}
                </span>
                <span className="mt-0.5 block text-xs opacity-60">
                  {dataset.description}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
