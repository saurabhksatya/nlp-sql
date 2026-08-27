import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { DATASETS } from "@/lib/schema";
import { parseSQL } from "@/lib/sqlEngine";
import { loadEnvVariable } from "@/lib/env";

const requestSchema = z.object({
  question: z.string().trim().min(1).max(1000),
  datasetId: z.string().min(1),
});

const responseSchema = z.object({
  sql: z.string().min(1),
  interpretation: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const dataset = DATASETS.find((item) => item.id === body.datasetId);
    if (!dataset) {
      return NextResponse.json({ error: "Unknown dataset." }, { status: 400 });
    }

    const google = createGoogleGenerativeAI({
      apiKey: loadEnvVariable("GEMINI_API_KEY"),
    });
    const systemPrompt = `You translate natural-language questions into SQL for a small educational query engine.
Only use tables and columns from the supplied schema.
The "sql" field must contain a single SELECT statement.
Supported SQL: SELECT, INNER/LEFT JOIN, one WHERE condition, GROUP BY, HAVING, ORDER BY, and LIMIT.
Do not use subqueries, INSERT, UPDATE, DELETE, DDL, comments, or markdown fences.
Schema:\n${JSON.stringify(dataset.schema, null, 2)}`;

    const result = await Promise.race([
      generateObject({
        model: google("gemini-3.5-flash-lite"),
        schema: responseSchema,
        system: systemPrompt,
        prompt: body.question,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI timeout")), 10000),
      ),
    ]);

    try {
      parseSQL(result.object.sql, dataset.schema);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Generated SQL is unsupported.";
      return NextResponse.json(
        { error: `The LLM returned unusable SQL: ${message}` },
        { status: 422 },
      );
    }

    return NextResponse.json({
      sql: result.object.sql,
      confidence: 1,
      interpretation: result.object.interpretation,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Translation failed.";
    const status = message.startsWith("Missing required environment variable")
      ? 503
      : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
