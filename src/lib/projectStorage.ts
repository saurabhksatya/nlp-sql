import type { NLResult, Tab } from "@/components/nlSqlTypes";

export interface SavedProject {
  id: string;
  name: string;
  datasetId: string;
  sql: string;
  nlInput: string;
  nlInfo: NLResult | null;
  tab?: Tab;
  activeStep?: number;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "nlp-sql-projects";
const LEGACY_STORAGE_KEY = "tryautomata-projects";

export function getSavedProjects(): SavedProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }
    return [];
  } catch (error) {
    console.error("Failed to load saved projects:", error);
    return [];
  }
}

export function saveProjectToStorage(project: SavedProject): SavedProject[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getSavedProjects();
    const existingIndex = current.findIndex((p) => p.id === project.id);
    let updated: SavedProject[];

    const projectToSave: SavedProject = {
      ...project,
      updatedAt: Date.now(),
      createdAt: project.createdAt || Date.now(),
    };

    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = projectToSave;
    } else {
      updated = [projectToSave, ...current];
    }

    updated.sort((a, b) => b.updatedAt - a.updatedAt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Failed to save project:", error);
    return [];
  }
}

export function deleteProjectFromStorage(id: string): SavedProject[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getSavedProjects();
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Failed to delete project:", error);
    return [];
  }
}

export function renameProjectInStorage(id: string, newName: string): SavedProject[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getSavedProjects();
    const target = current.find((p) => p.id === id);
    if (!target) return current;

    target.name = newName.trim();
    target.updatedAt = Date.now();

    const updated = [...current].sort((a, b) => b.updatedAt - a.updatedAt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error("Failed to rename project:", error);
    return [];
  }
}
