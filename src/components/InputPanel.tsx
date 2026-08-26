import { EXAMPLES } from "@/lib/examples";
import type { InputPanelProps } from "./nlSqlTypes";

export function InputPanel({
  nlInput,
  onNlInputChange,
  onTranslate,
  nlInfo,
  sql,
  onSqlChange,
  onRunQuery,
  onExampleSelect,
  error,
  history,
  onSelectHistory,
}: InputPanelProps) {
  return (
    <section
      className="panel p-4 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-5rem)]"
      aria-label="Input panel"
    >
      <div>
        <h2 className="font-semibold mb-2">1. Ask in Natural Language</h2>
        <textarea
          value={nlInput}
          onChange={(event) => onNlInputChange(event.target.value)}
          placeholder='e.g. "How many customers are there?"'
          rows={2}
          className="w-full panel p-2 text-sm resize-y"
          aria-label="Natural language input"
        />
        <button
          onClick={onTranslate}
          disabled={!nlInput.trim()}
          className="mt-2 w-full py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          Translate & Run ▶
        </button>
        {nlInfo && (
          <div className="mt-2 text-xs space-y-1">
            <p>
              Confidence:{" "}
              <span className="font-mono">
                {(nlInfo.confidence * 100).toFixed(0)}%
              </span>
            </p>
            <p className="opacity-70">{nlInfo.interpretation}</p>
            {nlInfo.matchedRules.length > 0 && (
              <p className="font-mono opacity-60">
                rules: {nlInfo.matchedRules.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-2">2. Or write SQL directly</h2>
        <textarea
          value={sql}
          onChange={(event) => onSqlChange(event.target.value)}
          rows={4}
          spellCheck={false}
          className="w-full panel p-2 text-sm font-mono resize-y"
          aria-label="SQL query"
        />
        <button
          onClick={onRunQuery}
          className="mt-2 w-full py-2 rounded-lg text-sm font-medium panel hover:opacity-80"
        >
          Execute SQL ⚡
        </button>
        {error && (
          <p role="alert" className="mt-2 text-xs text-red-500 font-mono">
            ✗ {error}
          </p>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-2">Sample Inputs</h2>
        <ul className="space-y-1.5">
          {EXAMPLES.map((example) => (
            <li key={example.id}>
              <button
                onClick={() => {
                  onExampleSelect(example.question, example.sql);
                }}
                className="w-full text-left text-xs panel px-2 py-1.5 hover:opacity-75"
                title={`Expected: ${example.expected}`}
              >
                <span className="opacity-50 mr-1">{example.id}.</span>{" "}
                {example.question}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="font-semibold mb-2">History</h2>
        {history.length === 0 && (
          <p className="text-xs opacity-50">No queries yet.</p>
        )}
        <ul className="space-y-1">
          {history.slice(0, 8).map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSelectHistory(item)}
                className="w-full text-left text-xs panel px-2 py-1.5 hover:opacity-75 truncate"
              >
                <span className="opacity-50">
                  {item.time} · {item.rows} rows
                </span>
                <br />
                {item.question}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
