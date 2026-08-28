import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { DATASETS, type Table } from "@/lib/schema";
import { parseSQL } from "@/lib/sqlEngine";
import env from "@/lib/env";

const requestSchema = z
  .object({
    question: z.string().trim().max(1000).optional(),
    audioBase64: z.string().min(1).optional(),
    mimeType: z.string().optional(),
    datasetId: z.string().min(1),
    schema: z.array(z.any()).optional(),
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
  sql: z.string().describe("Generated SQL query matching the schema"),
  interpretation: z
    .string()
    .describe("Brief 1-sentence interpretation of the query"),
});

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const body = requestSchema.parse(rawBody);
    const dataset = DATASETS.find((item) => item.id === body.datasetId);
    const currentSchema: Table[] =
      body.schema && body.schema.length > 0
        ? (body.schema as Table[])
        : (dataset?.schema ?? []);

    if (!currentSchema.length && !dataset) {
      return NextResponse.json(
        { error: "Unknown dataset or empty schema." },
        { status: 400 },
      );
    }

    // Fast-path: if question is already a direct SQL statement, validate and return directly
    if (body.question) {
      const q = body.question.trim().replace(/;+$/, "");
      if (
        /^(select|insert\s+into|insert|update|delete\s+from|delete|create\s+table|drop\s+table|alter\s+table|truncate)\b/i.test(
          q,
        )
      ) {
        try {
          parseSQL(q, currentSchema);
          return NextResponse.json({
            question: body.question,
            sql: q + ";",
            confidence: 1.0,
            interpretation: `Direct SQL execution: ${q.slice(0, 50)}...`,
          });
        } catch {
          // If direct parse failed, let LLM interpret it
        }
      }
    }

    const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });

    const systemPrompt = `You translate natural-language database questions or instructions into standard SQL for an educational database engine.
Tables and schema available in this database:
${JSON.stringify(currentSchema, null, 2)}

Supported SQL Statements:
- DQL: SELECT [DISTINCT] col1, col2 / aggregates (COUNT, SUM, AVG, MIN, MAX) FROM table [JOIN other ON left=right] [WHERE col op val] [GROUP BY col] [HAVING agg op val] [ORDER BY col [ASC|DESC]] [LIMIT n]
- DML: INSERT INTO table (col1, col2, ...) VALUES (val1, val2, ...);
- DML: UPDATE table SET col1 = val1, col2 = val2 [WHERE col op val];
- DML: DELETE FROM table [WHERE col op val];
- DDL: CREATE TABLE table (col1 TYPE [PRIMARY KEY] [REFERENCES other(col)], ...);
- DDL: ALTER TABLE table ADD COLUMN col TYPE; or ALTER TABLE table DROP COLUMN col; or ALTER TABLE table RENAME TO new_name;
- DDL: DROP TABLE table;
- DDL: TRUNCATE TABLE table;

Use exact table and column names matching the schema (case-insensitive). Return only valid SQL matching the engine's supported syntax. Do not output markdown fences or comments.`;

    let generatedSql = "";
    let interpretation = "";
    let transcribedQuestion = body.question || "";

    const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    if (body.audioBase64) {
      // Direct audio voice-to-SQL processing via Gemini multimodal capabilities
      const result = await Promise.race([
        generateObject({
          model: google(modelName),
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
          setTimeout(() => reject(new Error("AI voice timeout")), 30000),
        ),
      ]);

      generatedSql = result.object.sql;
      interpretation = result.object.interpretation;
      transcribedQuestion = result.object.question;
    } else {
      // Text question translation
      const result = await Promise.race([
        generateObject({
          model: google(modelName),
          schema: textResponseSchema,
          system: systemPrompt,
          prompt: body.question!,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI timeout")), 30000),
        ),
      ]);

      generatedSql = result.object.sql;
      interpretation = result.object.interpretation;
    }

    try {
      parseSQL(generatedSql, currentSchema);
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
