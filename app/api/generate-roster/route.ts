import { NextResponse } from "next/server";
import OpenAI from "openai";
import defaultProviders from "@/data/providers.json";
import defaultPatients from "@/data/patients.json";
import defaultHistory from "@/data/history.json";
import { buildRosterPrompt, weightsSumTo100, clampAssignmentsToWorkday, computeWeightedScore } from "@/lib/roster";
import { Weights, Provider, Patient, HistoryEntry, RosterResult } from "@/lib/types";

type RequestBody = {
  weights: Weights;
  providers?: Provider[];
  patients?: Patient[];
  history?: HistoryEntry[];
};

const FACTOR_SCORE_SCHEMA = {
  type: "object",
  properties: {
    skillMatch: { type: "number" },
    availability: { type: "number" },
    continuityOfCare: { type: "number" },
    genderMatch: { type: "number" },
    culturalMatch: { type: "number" },
    travelProximity: { type: "number" },
  },
  required: [
    "skillMatch",
    "availability",
    "continuityOfCare",
    "genderMatch",
    "culturalMatch",
    "travelProximity",
  ],
  additionalProperties: false,
};

const ROSTER_SCHEMA = {
  type: "object",
  properties: {
    assignments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          patientId: { type: "string" },
          patientName: { type: "string" },
          providerId: { type: "string" },
          providerName: { type: "string" },
          startTime: { type: "string" },
          endTime: { type: "string" },
          factorScores: FACTOR_SCORE_SCHEMA,
          reasoning: { type: "string" },
        },
        required: [
          "patientId",
          "patientName",
          "providerId",
          "providerName",
          "startTime",
          "endTime",
          "factorScores",
          "reasoning",
        ],
        additionalProperties: false,
      },
    },
    summary: { type: "string" },
  },
  required: ["assignments", "summary"],
  additionalProperties: false,
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set. Add it to .env.local and restart the server." },
      { status: 500 }
    );
  }

  const body: RequestBody = await request.json();
  const { weights, providers = defaultProviders, patients = defaultPatients, history = defaultHistory } = body;

  if (!weightsSumTo100(weights)) {
    return NextResponse.json(
      { error: "Weights must sum to 100." },
      { status: 400 }
    );
  }

  const prompt = buildRosterPrompt(providers, patients, history, weights);
  const client = new OpenAI({ apiKey });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: { name: "roster_result", schema: ROSTER_SCHEMA, strict: true },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "Empty response from model." }, { status: 502 });
    }

    const parsed: Omit<RosterResult, "date" | "assignments"> & {
      assignments: Omit<RosterResult["assignments"][number], "score">[];
    } = JSON.parse(content);

    const result: RosterResult = {
      summary: parsed.summary,
      date: new Date().toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      assignments: parsed.assignments.map((a) => ({
        ...a,
        score: computeWeightedScore(a.factorScores, weights),
      })),
    };

    return NextResponse.json(clampAssignmentsToWorkday(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error calling OpenAI.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
