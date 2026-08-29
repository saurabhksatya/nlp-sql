import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { DATASETS } from "@/lib/schema";
import { parseSQL } from "@/lib/sqlEngine";
import env from "@/lib/env";

const requestSchema = z
  .object({
    question: z.string().trim().max(1000).optional(),
    audioBase64: z.string().min(1).optional(),
    mimeType: z.string().optional(),
    datasetId: z.string().min(1),
  })
  .refine((data) => Boolean(data.question || data.audioBase64), {
    message: "Either question or audioBase64 must be provided.",
  });

const textResponseSchema = z.object({
  sql: z.string().min(1),
  interpretation: z.string().min(1),
});

const audioResponseSchema = z.object({
  question: z
    .string()
    .describe("Transcribed natural language question spoken in the audio"),
  sql: z.string().describe("Generated SQL SELECT query"),
  interpretation: z
    .string()
    .describe("Brief 1-sentence interpretation of the query"),
});

export async function POST(request: Request) {
  try {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured in .env. Please add your GEMINI_API_KEY to enable AI query translation.",
        },
        { status: 503 },
      );
    }

    const rawBody = await request.json();
    const body = requestSchema.parse(rawBody);
    const dataset = DATASETS.find((item) => item.id === body.datasetId);
    if (!dataset) {
      return NextResponse.json({ error: "Unknown dataset." }, { status: 400 });
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const systemPrompt = `You translate natural-language database questions into SQL for an educational query engine.
Only use tables and columns from the supplied schema.
The "sql" field must contain a single SELECT statement.
Supported SQL: SELECT, INNER/LEFT JOIN, one WHERE condition, GROUP BY, HAVING, ORDER BY, and LIMIT.
Do not use subqueries, INSERT, UPDATE, DELETE, DDL, comments, or markdown fences.
Schema:\n${JSON.stringify(dataset.schema, null, 2)}`;

    let generatedSql = "";
    let interpretation = "";
    let transcribedQuestion = body.question || "";

    if (body.audioBase64) {
      // Direct audio voice-to-SQL processing via Gemini multimodal capabilities
      const result = await Promise.race([
        generateObject({
          model: google("gemini-2.5-flash"),
          schema: audioResponseSchema,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Listen to the spoken audio and translate it into a valid SQL query matching the schema. Provide the transcribed question and interpretation.",
                },
                {
                  type: "file",
                  data: body.audioBase64,
                  mediaType: body.mimeType || "audio/webm",
                },
              ],
            },
          ],
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI voice timeout")), 15000),
        ),
      ]);

      generatedSql = result.object.sql;
      interpretation = result.object.interpretation;
      transcribedQuestion = result.object.question;
    } else {
      // Text question translation
      const result = await Promise.race([
        generateObject({
          model: google("gemini-2.5-flash"),
          schema: textResponseSchema,
          system: systemPrompt,
          prompt: body.question!,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI timeout")), 10000),
        ),
      ]);

      generatedSql = result.object.sql;
      interpretation = result.object.interpretation;
    }

    try {
      parseSQL(generatedSql, dataset.schema);
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
      question: transcribedQuestion,
      sql: generatedSql,
      confidence: 1,
      interpretation,
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
