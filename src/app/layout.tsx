import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NL→SQL Visualizer — Learn Natural Language to SQL",
  description:
    "Interactive teaching tool: translate natural language into SQL, execute it step-by-step, and visualize the relational algebra pipeline.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let saved = localStorage.getItem('nlp-sql-theme') || 'eclipse';
                const legacyMap = {
                  'colorful-dark': 'eclipse',
                  'blue-dark': 'lazuli',
                  'blue-light': 'pearl',
                  'greyscale': 'slate',
                  'high-contrast': 'volt',
                  'dark': 'eclipse',
                  'light': 'pearl'
                };
                if (legacyMap[saved]) saved = legacyMap[saved];
                const validThemes = ['eclipse', 'lazuli', 'pearl', 'slate', 'volt'];
                const theme = validThemes.includes(saved) ? saved : 'eclipse';
                
                document.documentElement.setAttribute('data-theme', theme);
                document.documentElement.classList.add('theme-' + theme);
                if (theme !== 'pearl') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
