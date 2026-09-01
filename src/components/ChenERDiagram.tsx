"use client";

import { useRef, useState } from "react";
import type { Table } from "@/lib/schema";

interface ChenERDiagramProps {
  schema: Table[];
}

export function ChenERDiagram({ schema }: ChenERDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!schema || schema.length === 0) {
    return (
      <div className="p-4 text-xs text-[var(--muted)] text-center">
        No schema available for ER diagram.
      </div>
    );
  }

  const isEcommerce = schema.some((t) => t.name.toLowerCase() === "customers");
  const isLibrary = schema.some((t) => t.name.toLowerCase() === "members");
  const isHealthcare = schema.some((t) => t.name.toLowerCase() === "patients");

  const downloadSVG = () => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "er_diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPNG = () => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 1180;
      canvas.height = 720;
      if (ctx) {
        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = "er_diagram.png";
        a.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const diagramContent = (
    <div ref={containerRef} className="relative w-full">
      {/* Legend & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs opacity-95 px-1">
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-blue-600 rounded-xs inline-block"></span>
            <span style={{ color: "var(--foreground)" }}>Entity</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-emerald-600 rotate-45 inline-block"></span>
            <span style={{ color: "var(--foreground)" }}>Relationship</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 border border-slate-400 rounded-full inline-block"></span>
            <span style={{ color: "var(--foreground)" }}>Attribute</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-bold underline text-amber-400">PK</span>
            <span style={{ color: "var(--foreground)" }}>Primary Key</span>
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadSVG}
            className="px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download SVG</span>
          </button>
          <button
            type="button"
            onClick={downloadPNG}
            className="px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download PNG</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            title="Full Screen View"
            aria-label="Full Screen View"
            className="p-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Perfectly Spaced Chen ER Canvas */}
      <div className="w-full overflow-x-auto p-4 bg-black/40 rounded-xl border border-[var(--border)] min-h-[480px]">
        <svg
          viewBox="0 0 1180 720"
          className="w-full h-auto min-w-[980px]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
            </filter>
          </defs>

          {isEcommerce ? (
            <EcommerceChenER />
          ) : isLibrary ? (
            <LibraryChenER />
          ) : isHealthcare ? (
            <HealthcareChenER />
          ) : (
            <GenericChenER schema={schema} />
          )}
        </svg>
      </div>
    </div>
  );

  return (
    <>
      {diagramContent}

      {/* Fullscreen Modal Backdrop */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          onClick={() => setIsFullscreen(false)}
        >
          <div
            className="w-full max-w-6xl max-h-[95vh] p-6 rounded-2xl border bg-black/95 flex flex-col gap-4 overflow-auto shadow-2xl"
            style={{ borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
                Entity-Relationship Diagram (Full Screen)
              </h2>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1 rounded-lg text-xs font-semibold border transition-colors hover:bg-[var(--surface-hover)] cursor-pointer"
                style={{
                  background: "var(--panel)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                ✕ Close
              </button>
            </div>
            {diagramContent}
          </div>
        </div>
      )}
    </>
  );
}

// 1. E-Commerce Chen ER Diagram (Fixed spacing: Attributes & Relationships clear of each other)
function EcommerceChenER() {
  return (
    <g>
      {/* Connector lines to CUSTOMERS Attributes */}
      <line x1="190" y1="74" x2="50" y2="170" stroke="#475569" strokeWidth="2" />
      <line x1="190" y1="74" x2="130" y2="170" stroke="#475569" strokeWidth="2" />
      <line x1="190" y1="74" x2="210" y2="170" stroke="#475569" strokeWidth="2" />
      <line x1="190" y1="74" x2="290" y2="170" stroke="#475569" strokeWidth="2" />

      {/* Relationship: CUSTOMERS PLACES ORDERS */}
      <line x1="190" y1="74" x2="420" y2="170" stroke="#475569" strokeWidth="2" />
      <line x1="420" y1="170" x2="420" y2="310" stroke="#475569" strokeWidth="2" />

      {/* Connectors to ORDERS Attributes */}
      <line x1="420" y1="334" x2="160" y2="450" stroke="#475569" strokeWidth="2" />
      <line x1="420" y1="334" x2="260" y2="450" stroke="#475569" strokeWidth="2" />
      <line x1="420" y1="334" x2="180" y2="334" stroke="#475569" strokeWidth="2" />
      <line x1="420" y1="334" x2="260" y2="230" stroke="#475569" strokeWidth="2" />

      {/* Relationship: ORDERS CONTAINS ORDER_ITEMS */}
      <line x1="420" y1="334" x2="420" y2="460" stroke="#475569" strokeWidth="2" />
      <line x1="420" y1="460" x2="660" y2="570" stroke="#475569" strokeWidth="2" />

      {/* Relationship: PRODUCTS CONTAINS ORDER_ITEMS */}
      <line x1="910" y1="334" x2="910" y2="460" stroke="#475569" strokeWidth="2" />
      <line x1="910" y1="460" x2="660" y2="570" stroke="#475569" strokeWidth="2" />

      {/* Connectors to PRODUCTS Attributes (positioned above PRODUCTS at y=220) */}
      <line x1="910" y1="334" x2="740" y2="220" stroke="#475569" strokeWidth="2" />
      <line x1="910" y1="334" x2="820" y2="220" stroke="#475569" strokeWidth="2" />
      <line x1="910" y1="334" x2="900" y2="220" stroke="#475569" strokeWidth="2" />
      <line x1="910" y1="334" x2="995" y2="220" stroke="#475569" strokeWidth="2" />

      {/* Connectors to ORDER_ITEMS Attributes (positioned below at y=670) */}
      <line x1="660" y1="594" x2="500" y2="670" stroke="#475569" strokeWidth="2" />
      <line x1="660" y1="594" x2="600" y2="670" stroke="#475569" strokeWidth="2" />
      <line x1="660" y1="594" x2="720" y2="670" stroke="#475569" strokeWidth="2" />
      <line x1="660" y1="594" x2="830" y2="670" stroke="#475569" strokeWidth="2" />

      {/* Cardinality Text Labels */}
      <text x="310" y="115" fill="#60a5fa" fontSize="16" fontWeight="bold">1</text>
      <text x="430" y="245" fill="#60a5fa" fontSize="16" fontWeight="bold">N</text>
      <text x="430" y="400" fill="#60a5fa" fontSize="16" fontWeight="bold">1</text>
      <text x="540" y="525" fill="#60a5fa" fontSize="16" fontWeight="bold">N</text>
      <text x="920" y="400" fill="#60a5fa" fontSize="16" fontWeight="bold">1</text>
      <text x="780" y="525" fill="#60a5fa" fontSize="16" fontWeight="bold">N</text>

      {/* === 1. ENTITY RECTANGLES === */}
      <g filter="url(#shadow)">
        <rect x="120" y="50" width="140" height="48" rx="6" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2.5" />
        <text x="190" y="80" fill="#ffffff" fontSize="15" fontWeight="bold" textAnchor="middle">CUSTOMERS</text>
      </g>

      <g filter="url(#shadow)">
        <rect x="350" y="310" width="140" height="48" rx="6" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2.5" />
        <text x="420" y="340" fill="#ffffff" fontSize="15" fontWeight="bold" textAnchor="middle">ORDERS</text>
      </g>

      <g filter="url(#shadow)">
        <rect x="840" y="310" width="140" height="48" rx="6" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2.5" />
        <text x="910" y="340" fill="#ffffff" fontSize="15" fontWeight="bold" textAnchor="middle">PRODUCTS</text>
      </g>

      <g filter="url(#shadow)">
        <rect x="580" y="570" width="160" height="48" rx="6" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2.5" />
        <text x="660" y="600" fill="#ffffff" fontSize="15" fontWeight="bold" textAnchor="middle">ORDER_ITEMS</text>
      </g>

      {/* === 2. RELATIONSHIP DIAMONDS === */}
      <g filter="url(#shadow)">
        <polygon points="420,140 475,170 420,200 365,170" fill="#065f46" stroke="#10b981" strokeWidth="2.5" />
        <text x="420" y="175" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">PLACES</text>
      </g>

      <g filter="url(#shadow)">
        <polygon points="420,430 478,460 420,490 362,460" fill="#065f46" stroke="#10b981" strokeWidth="2.5" />
        <text x="420" y="465" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">CONTAINS</text>
      </g>

      <g filter="url(#shadow)">
        <polygon points="910,430 968,460 910,490 852,460" fill="#065f46" stroke="#10b981" strokeWidth="2.5" />
        <text x="910" y="465" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">CONTAINS</text>
      </g>

      {/* === 3. ATTRIBUTE OVALS === */}
      {/* Customers Attributes */}
      <g filter="url(#shadow)">
        <ellipse cx="50" cy="170" rx="35" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="50" y="175" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" textDecoration="underline">ID</text>
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="130" cy="170" rx="35" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="130" y="175" fill="#ffffff" fontSize="13" textAnchor="middle">NAME</text>
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="210" cy="170" rx="35" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="210" y="175" fill="#ffffff" fontSize="13" textAnchor="middle">CITY</text>
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="290" cy="170" rx="48" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="290" y="175" fill="#ffffff" fontSize="12" textAnchor="middle">SIGNUP_YEAR</text>
      </g>

      {/* Orders Attributes */}
      <g filter="url(#shadow)">
        <ellipse cx="160" cy="450" rx="35" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="160" y="455" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" textDecoration="underline">ID</text>
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="260" cy="450" rx="52" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="260" y="455" fill="#ffffff" fontSize="12" textAnchor="middle">CUSTOMER_ID</text>
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="180" cy="334" rx="52" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="180" y="339" fill="#ffffff" fontSize="12" textAnchor="middle">ORDER_DATE</text>
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="260" cy="230" rx="56" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="260" y="235" fill="#ffffff" fontSize="12" textAnchor="middle">TOTAL_AMOUNT</text>
      </g>

      {/* Products Attributes (positioned ABOVE Products at y=220) */}
      <g filter="url(#shadow)">
        <ellipse cx="740" cy="220" rx="32" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="740" y="225" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" textDecoration="underline">ID</text>
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="820" cy="220" rx="38" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="820" y="225" fill="#ffffff" fontSize="12" textAnchor="middle">NAME</text>
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="900" cy="220" rx="42" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="900" y="225" fill="#ffffff" fontSize="12" textAnchor="middle">CATEGORY</text>
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="995" cy="220" rx="38" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="995" y="225" fill="#ffffff" fontSize="12" textAnchor="middle">PRICE</text>
      </g>

      {/* Order_Items Attributes (positioned BELOW Order_Items at y=670) */}
      <g filter="url(#shadow)">
        <ellipse cx="500" cy="670" rx="32" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="500" y="675" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" textDecoration="underline">ID</text>
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="600" cy="670" rx="45" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="600" y="675" fill="#ffffff" fontSize="12" textAnchor="middle">ORDER_ID</text>
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="720" cy="670" rx="48" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="720" y="675" fill="#ffffff" fontSize="12" textAnchor="middle">PRODUCT_ID</text>
      </g>
      <g filter="url(#shadow)">
        <ellipse cx="830" cy="670" rx="45" ry="22" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
        <text x="830" y="675" fill="#ffffff" fontSize="12" textAnchor="middle">QUANTITY</text>
      </g>
    </g>
  );
}

// 2. Library Chen ER Diagram
function LibraryChenER() {
  return (
    <g>
      <line x1="200" y1="80" x2="450" y2="80" stroke="#475569" strokeWidth="2" />
      <line x1="450" y1="80" x2="450" y2="240" stroke="#475569" strokeWidth="2" />
      <line x1="700" y1="80" x2="450" y2="80" stroke="#475569" strokeWidth="2" />

      <line x1="200" y1="80" x2="100" y2="180" stroke="#475569" strokeWidth="2" />
      <line x1="200" y1="80" x2="200" y2="180" stroke="#475569" strokeWidth="2" />
      <line x1="200" y1="80" x2="300" y2="180" stroke="#475569" strokeWidth="2" />

      <line x1="700" y1="80" x2="600" y2="180" stroke="#475569" strokeWidth="2" />
      <line x1="700" y1="80" x2="700" y2="180" stroke="#475569" strokeWidth="2" />
      <line x1="700" y1="80" x2="800" y2="180" stroke="#475569" strokeWidth="2" />

      <text x="310" y="70" fill="#60a5fa" fontSize="15" fontWeight="bold">1</text>
      <text x="460" y="170" fill="#60a5fa" fontSize="15" fontWeight="bold">N</text>
      <text x="590" y="70" fill="#60a5fa" fontSize="15" fontWeight="bold">1</text>

      <rect x="135" y="55" width="130" height="46" rx="6" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2.5" />
      <text x="200" y="83" fill="#ffffff" fontSize="15" fontWeight="bold" textAnchor="middle">MEMBERS</text>

      <rect x="385" y="240" width="130" height="46" rx="6" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2.5" />
      <text x="450" y="268" fill="#ffffff" fontSize="15" fontWeight="bold" textAnchor="middle">LOANS</text>

      <rect x="635" y="55" width="130" height="46" rx="6" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2.5" />
      <text x="700" y="83" fill="#ffffff" fontSize="15" fontWeight="bold" textAnchor="middle">BOOKS</text>

      <polygon points="450,55 500,80 450,105 400,80" fill="#065f46" stroke="#10b981" strokeWidth="2.5" />
      <text x="450" y="85" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">BORROWS</text>

      <ellipse cx="100" cy="180" rx="35" ry="20" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
      <text x="100" y="185" fill="#ffffff" fontSize="13" textDecoration="underline" textAnchor="middle">ID</text>

      <ellipse cx="200" cy="180" rx="38" ry="20" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
      <text x="200" y="185" fill="#ffffff" fontSize="13" textAnchor="middle">NAME</text>

      <ellipse cx="300" cy="180" rx="48" ry="20" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
      <text x="300" y="185" fill="#ffffff" fontSize="12" textAnchor="middle">MEMBERSHIP</text>

      <ellipse cx="600" cy="180" rx="35" ry="20" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
      <text x="600" y="185" fill="#ffffff" fontSize="13" textDecoration="underline" textAnchor="middle">ID</text>

      <ellipse cx="700" cy="180" rx="38" ry="20" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
      <text x="700" y="185" fill="#ffffff" fontSize="13" textAnchor="middle">TITLE</text>

      <ellipse cx="800" cy="180" rx="38" ry="20" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
      <text x="800" y="185" fill="#ffffff" fontSize="13" textAnchor="middle">GENRE</text>
    </g>
  );
}

// 3. Healthcare Chen ER Diagram
function HealthcareChenER() {
  return (
    <g>
      <line x1="200" y1="80" x2="450" y2="80" stroke="#475569" strokeWidth="2" />
      <line x1="450" y1="80" x2="450" y2="240" stroke="#475569" strokeWidth="2" />
      <line x1="700" y1="80" x2="450" y2="80" stroke="#475569" strokeWidth="2" />

      <line x1="200" y1="80" x2="100" y2="180" stroke="#475569" strokeWidth="2" />
      <line x1="200" y1="80" x2="200" y2="180" stroke="#475569" strokeWidth="2" />
      <line x1="200" y1="80" x2="300" y2="180" stroke="#475569" strokeWidth="2" />

      <line x1="700" y1="80" x2="600" y2="180" stroke="#475569" strokeWidth="2" />
      <line x1="700" y1="80" x2="700" y2="180" stroke="#475569" strokeWidth="2" />
      <line x1="700" y1="80" x2="800" y2="180" stroke="#475569" strokeWidth="2" />

      <text x="310" y="70" fill="#60a5fa" fontSize="15" fontWeight="bold">1</text>
      <text x="460" y="170" fill="#60a5fa" fontSize="15" fontWeight="bold">N</text>
      <text x="590" y="70" fill="#60a5fa" fontSize="15" fontWeight="bold">1</text>

      <rect x="135" y="55" width="130" height="46" rx="6" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2.5" />
      <text x="200" y="83" fill="#ffffff" fontSize="15" fontWeight="bold" textAnchor="middle">PATIENTS</text>

      <rect x="385" y="240" width="130" height="46" rx="6" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2.5" />
      <text x="450" y="268" fill="#ffffff" fontSize="15" fontWeight="bold" textAnchor="middle">VISITS</text>

      <rect x="635" y="55" width="130" height="46" rx="6" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2.5" />
      <text x="700" y="83" fill="#ffffff" fontSize="15" fontWeight="bold" textAnchor="middle">DOCTORS</text>

      <polygon points="450,55 500,80 450,105 400,80" fill="#065f46" stroke="#10b981" strokeWidth="2.5" />
      <text x="450" y="85" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle">VISITS</text>

      <ellipse cx="100" cy="180" rx="35" ry="20" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
      <text x="100" y="185" fill="#ffffff" fontSize="13" textDecoration="underline" textAnchor="middle">ID</text>

      <ellipse cx="200" cy="180" rx="38" ry="20" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
      <text x="200" y="185" fill="#ffffff" fontSize="13" textAnchor="middle">NAME</text>

      <ellipse cx="300" cy="180" rx="35" ry="20" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
      <text x="300" y="185" fill="#ffffff" fontSize="13" textAnchor="middle">CITY</text>

      <ellipse cx="600" cy="180" rx="35" ry="20" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
      <text x="600" y="185" fill="#ffffff" fontSize="13" textDecoration="underline" textAnchor="middle">ID</text>

      <ellipse cx="700" cy="180" rx="38" ry="20" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
      <text x="700" y="185" fill="#ffffff" fontSize="13" textAnchor="middle">NAME</text>

      <ellipse cx="800" cy="180" rx="45" ry="20" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
      <text x="800" y="185" fill="#ffffff" fontSize="12" textAnchor="middle">SPECIALTY</text>
    </g>
  );
}

// 4. Generic Custom Dataset Chen ER Generator
function GenericChenER({ schema }: { schema: Table[] }) {
  const startX = 150;
  const startY = 80;

  return (
    <g>
      {schema.map((table, idx) => {
        const x = startX + (idx % 3) * 270;
        const y = startY + Math.floor(idx / 3) * 220;

        return (
          <g key={table.name}>
            {table.columns.slice(0, 5).map((col, cIdx) => {
              const attrX = x - 70 + cIdx * 45;
              const attrY = y + 100;
              return (
                <line
                  key={col.name}
                  x1={x + 65}
                  y1={y + 20}
                  x2={attrX}
                  y2={attrY}
                  stroke="#475569"
                  strokeWidth="2"
                />
              );
            })}

            <rect
              x={x}
              y={y}
              width={140}
              height={46}
              rx="6"
              fill="#1e3a8a"
              stroke="#3b82f6"
              strokeWidth="2.5"
            />
            <text
              x={x + 70}
              y={y + 28}
              fill="#ffffff"
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
            >
              {table.name.toUpperCase()}
            </text>

            {table.columns.slice(0, 5).map((col, cIdx) => {
              const attrX = x - 70 + cIdx * 45;
              const attrY = y + 100;
              return (
                <g key={col.name}>
                  <ellipse
                    cx={attrX}
                    cy={attrY}
                    rx="35"
                    ry="20"
                    fill="#1e293b"
                    stroke="#64748b"
                    strokeWidth="2"
                  />
                  <text
                    x={attrX}
                    y={attrY + 5}
                    fill="#ffffff"
                    fontSize="12"
                    fontWeight={col.pk ? "bold" : "normal"}
                    textDecoration={col.pk ? "underline" : undefined}
                    textAnchor="middle"
                  >
                    {col.name.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
