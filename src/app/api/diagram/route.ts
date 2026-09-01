import { NextResponse } from "next/server";
import { z } from "zod";
import { DATASETS, erDiagramChenDot, type Table } from "@/lib/schema";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import env from "@/lib/env";
import { instance } from "@viz-js/viz";

const diagramRequestSchema = z.object({
  datasetId: z.string().optional(),
  schema: z.array(z.any()).optional(),
  format: z.enum(["dot", "svg"]).optional().default("dot"),
  prompt: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const body = diagramRequestSchema.parse(rawBody);

    let rawDot = "";

    // If user provided a natural language prompt to generate a Chen ER diagram with AI
    if (body.prompt && body.prompt.trim().length > 0) {
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "GEMINI_API_KEY is required to generate custom ER diagrams from prompts." },
          { status: 503 },
        );
      }

      const google = createGoogleGenerativeAI({ apiKey });
      const modelName = "gemini-3.6-flash";

      const systemPrompt = `You are an expert database designer. Output ONLY a valid Graphviz DOT script representing a Chen-style ER diagram according to the user's description.
Rules for Chen ER Diagram in DOT:
1. Use \`graph ER_Chen { ... }\` (undirected graph).
2. Entities: \`node [shape=box, peripheries=1]\` (or \`peripheries=2\` for weak entities).
3. Relationships: \`node [shape=diamond, peripheries=1]\` (or \`peripheries=2\` for identifying relationships).
4. Attributes: \`node [shape=ellipse]\`.
   - Primary Keys: \`<<u>PK_NAME</u>>\` (underlined HTML label).
   - Multivalued: \`peripheries=2\`.
   - Derived: \`style=dashed\`.
5. Connect Entities to Attributes with simple lines: \`ENTITY -- attr_name;\`.
6. Connect Entities to Relationships with cardinality labels on edges: \`ENTITY -- REL [label="1"];\` or \`REL -- OTHER [label="N"];\`.
7. For total participation, use \`penwidth=2.5\`.
8. Layout configuration: \`layout=dot; splines=line; nodesep=0.6; ranksep=0.8; node [fontname="Helvetica", fontsize=10]; edge [fontname="Helvetica", fontsize=10];\`
Return ONLY the raw DOT code. Do NOT wrap in markdown codeblocks (no \`\`\`dot).`;

      const response = await generateText({
        model: google(modelName),
        system: systemPrompt,
        prompt: body.prompt,
      });

      rawDot = response.text
        .replace(/^```(?:dot|graphviz)?\n?/i, "")
        .replace(/\n?```$/i, "")
        .trim();
    } else {
      // Standard schema-to-diagram conversion
      let activeSchema: Table[] = [];
      if (body.schema && body.schema.length > 0) {
        activeSchema = body.schema as Table[];
      } else if (body.datasetId) {
        const dataset = DATASETS.find((d) => d.id === body.datasetId);
        if (dataset) {
          activeSchema = dataset.schema;
        }
      } else {
        activeSchema = DATASETS[0].schema;
      }

      rawDot = erDiagramChenDot(activeSchema);
    }

    if (body.format === "svg") {
      const viz = await instance();
      const svg = viz.renderString(rawDot, { format: "svg" });
      return new Response(svg, {
        headers: { "Content-Type": "image/svg+xml" },
      });
    }

    return NextResponse.json({
      dot: rawDot,
      notation: "chen",
      format: "dot",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate ER diagram.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const datasetId = searchParams.get("datasetId") || DATASETS[0].id;
  const format = searchParams.get("format") || "dot";

  const dataset = DATASETS.find((d) => d.id === datasetId) || DATASETS[0];
  const dot = erDiagramChenDot(dataset.schema);

  if (format === "svg") {
    const viz = await instance();
    const svg = viz.renderString(dot, { format: "svg" });
    return new Response(svg, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  return NextResponse.json({
    dot,
    notation: "chen",
    format: "dot",
  });
}
