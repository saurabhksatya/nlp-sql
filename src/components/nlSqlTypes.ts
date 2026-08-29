import type { Dataset, DatasetExample, Table } from "@/lib/schema";
import type {
  PipelineStep,
  Row,
  StatementType,
  SQLCommand,
  QueryResult,
} from "@/lib/sqlEngine";

export interface NLResult {
  sql: string;
  confidence: number;
  interpretation: string;
}

export interface HistoryItem {
  id: number;
  question: string;
  sql: string;
  rows: number;
  time: string;
  statementType?: StatementType;
  command?: SQLCommand;
}

export type Tab = "result" | "schema" | "theory";

export type ThemeId = "eclipse" | "lazuli" | "pearl" | "slate" | "volt";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  subtitle: string;
  isDark: boolean;
  swatches: string[];
}

export const THEME_CONFIGS: ThemeConfig[] = [
  {
    id: "eclipse",
    name: "1. Eclipse",
    subtitle: "Vivid purple & multi-color pipeline (Default)",
    isDark: true,
    swatches: ["#09090b", "#7c3aed", "#0ea5e9", "#10b981"],
  },
  {
    id: "lazuli",
    name: "2. Lazuli",
    subtitle: "Deep midnight navy & electric blue",
    isDark: true,
    swatches: ["#0b1120", "#111a2e", "#3b82f6", "#e2e8f0"],
  },
  {
    id: "pearl",
    name: "3. Pearl",
    subtitle: "Crisp white & royal indigo",
    isDark: false,
    swatches: ["#f8fafc", "#ffffff", "#4f46e5", "#0f172a"],
  },
  {
    id: "slate",
    name: "4. Slate",
    subtitle: "Monochrome zinc & minimalist obsidian",
    isDark: true,
    swatches: ["#09090b", "#18181b", "#ffffff", "#a1a1aa"],
  },
  {
    id: "volt",
    name: "5. Volt",
    subtitle: "High contrast black, yellow, red & green",
    isDark: true,
    swatches: ["#000000", "#ffff00", "#00ff66", "#ff3333"],
  },
];



export interface InputPanelProps {
  datasets: Dataset[];
  selectedDatasetId: string;
  onDatasetChange: (id: string) => void;
  examples: DatasetExample[];
  nlInput: string;
  onNlInputChange: (value: string) => void;
  onTranslate: () => void;
  nlInfo: NLResult | null;
  sql: string;
  onSqlChange: (value: string) => void;
  onRunQuery: () => void;
  onExampleSelect: (question: string, sql: string) => void;
  onResetDatabase: () => void;
  error?: string;
  lastResult?: QueryResult | null;
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onVoiceTranslateAndRun?: (params: {
    audioBase64?: string;
    mimeType?: string;
    question?: string;
  }) => void;
  isTranslating?: boolean;
  voiceFeedback?: boolean;
  onToggleVoiceFeedback?: (enabled: boolean) => void;
  onOpenCreateModal?: () => void;
  onDeleteDataset?: (id: string) => void;
  onOpenGuide?: () => void;
  theme?: ThemeId;
}

export interface VisualizationPanelProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  steps: PipelineStep[];
  activeStep: number;
  current?: PipelineStep;
  playing: boolean;
  onPlay: () => void;
  onStepChange: (index: number) => void;
  finalRows: Row[];
  columns: string[];
  onExportCSV: () => void;
  onExportReport: () => void;
  sql: string;
  mermaidSource: string;
  schema: Table[];
  dark: boolean;
  theme?: ThemeId;
  lastResult?: QueryResult | null;
  onResetDatabase?: () => void;
}

