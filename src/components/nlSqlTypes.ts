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
  lastResult?: QueryResult | null;
  onResetDatabase?: () => void;
}
