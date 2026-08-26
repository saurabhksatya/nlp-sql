interface AppHeaderProps {
  dark: boolean;
  onToggleDark: () => void;
}

export function AppHeader({ dark, onToggleDark }: AppHeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b"
      style={{ borderColor: "var(--border)" }}
    >
      <h1 className="text-lg font-bold">NL to SQL</h1>
      <button
        onClick={onToggleDark}
        className="px-3 py-1.5 rounded-lg text-sm panel hover:opacity-80"
        aria-label="Toggle dark mode"
      >
        {dark ? "☀️ Light" : "🌙 Dark"}
      </button>
    </header>
  );
}
