"use client";

import { RosterResult, Weights, FactorScores } from "@/lib/types";

type Props = {
  result: RosterResult;
  weights: Weights;
  onClose: () => void;
};

const FACTOR_LABELS: { key: keyof FactorScores; label: string }[] = [
  { key: "skillMatch", label: "Skill Match" },
  { key: "availability", label: "Availability" },
  { key: "continuityOfCare", label: "Continuity" },
  { key: "genderMatch", label: "Gender" },
  { key: "culturalMatch", label: "Culture/Lang" },
  { key: "travelProximity", label: "Proximity" },
];

function toMinutes(time: string): number {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return hours * 60 + Number(match[2]);
}

export default function RosterModal({ result, weights, onClose }: Props) {
  const total = result.assignments.length;
  const totalScore = result.assignments.reduce((sum, a) => sum + a.score, 0);
  const avgScore = total ? Math.round(totalScore / total) : 0;
  const sortedAssignments = [...result.assignments].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Generated Roster
            </h2>
            <p className="text-xs text-zinc-500">{result.date} · single-day roster (9 AM–5 PM)</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">{result.summary}</p>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {sortedAssignments.map((a) => (
              <div key={a.patientId} className="flex flex-col gap-2 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {a.patientName}
                  </span>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {a.score}/100
                  </span>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-mono text-xs text-zinc-500">
                    {a.startTime} – {a.endTime}
                  </span>{" "}
                  · Assigned: <span className="font-medium">{a.providerName}</span>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-500">{a.reasoning}</div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-zinc-50 px-3 py-2 text-[11px] text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400 sm:grid-cols-3">
                  {FACTOR_LABELS.map((f) => {
                    const raw = a.factorScores[f.key];
                    const weight = weights[f.key];
                    const contribution = Math.round((raw * weight) / 100);
                    return (
                      <div key={f.key} className="flex items-center justify-between gap-2">
                        <span>{f.label}</span>
                        <span className="font-mono">
                          {raw}×{weight}%={contribution}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {total} assignments · avg score {avgScore}/100
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Back
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Confirm Roster
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
