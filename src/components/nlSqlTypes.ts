import type { NLResult } from "@/lib/nlToSql";
import type { PipelineStep, Row } from "@/lib/sqlEngine";

export interface HistoryItem {
  id: number;
  question: string;
  sql: string;
  rows: number;
  time: string;
}

export type Tab = "result" | "schema" | "theory";

export interface InputPanelProps {
  nlInput: string;
  onNlInputChange: (value: string) => void;
  onTranslate: () => void;
  nlInfo: NLResult | null;
  sql: string;
  onSqlChange: (value: string) => void;
  onRunQuery: () => void;
  onExampleSelect: (question: string, sql: string) => void;
  error?: string;
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
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
  dark: boolean;
}
