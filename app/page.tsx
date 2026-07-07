"use client";

import { useState, ReactNode } from "react";
import providersData from "@/data/providers.json";
import patientsData from "@/data/patients.json";
import historyData from "@/data/history.json";
import { Weights, RosterResult, Provider, Patient, HistoryEntry } from "@/lib/types";
import { shuffleAll } from "@/lib/mockData";
import RosterModal from "@/components/RosterModal";

const FACTORS: { key: keyof Weights; label: string }[] = [
  { key: "skillMatch", label: "Skill Match" },
  { key: "availability", label: "Availability" },
  { key: "continuityOfCare", label: "Continuity of Care" },
  { key: "genderMatch", label: "Gender Preference" },
  { key: "culturalMatch", label: "Cultural & Language Match" },
  { key: "travelProximity", label: "Travel Proximity" },
];

function Tag({ children, emphasis = false }: { children: ReactNode; emphasis?: boolean }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${
        emphasis
          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      {children}
    </span>
  );
}

const DEFAULT_WEIGHTS: Weights = {
  skillMatch: 30,
  availability: 20,
  continuityOfCare: 20,
  genderMatch: 10,
  culturalMatch: 10,
  travelProximity: 10,
};

export default function Home() {
  const [providers, setProviders] = useState<Provider[]>(providersData);
  const [patients, setPatients] = useState<Patient[]>(patientsData);
  const [history, setHistory] = useState<HistoryEntry[]>(historyData);
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RosterResult | null>(null);

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const isValid = total === 100;

  function updateWeight(key: keyof Weights, value: number) {
    setWeights((prev) => ({ ...prev, [key]: value }));
  }

  function handleShuffle() {
    const shuffled = shuffleAll();
    setProviders(shuffled.providers);
    setPatients(shuffled.patients);
    setHistory(shuffled.history);
    setResult(null);
    setError(null);
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights, providers, patients, history }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate roster.");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Hogan Care — Roster Generator (POC)
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Review providers, patients, and history, set factor weights, then generate a roster.
            </p>
          </div>
          <button
            onClick={handleShuffle}
            className="shrink-0 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            🔀 Shuffle Data
          </button>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Service Providers
            </h2>
            <ul className="space-y-2">
              {providers.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800"
                >
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">{p.name}</div>
                    <div className="text-xs text-zinc-500">
                      {p.role} · {p.specialty}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Tag>Gender: {p.gender}</Tag>
                      <Tag>Speaks: {p.languages.join(", ")}</Tag>
                      <Tag>Zone: {p.location}</Tag>
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-zinc-500">
                    <div>{p.availability}</div>
                    <div>{p.weeklyHours}h/wk</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Patients
            </h2>
            <ul className="space-y-2">
              {patients.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800"
                >
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">{p.name}</div>
                    <div className="text-xs text-zinc-500">{p.need}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Tag emphasis={p.genderPreference !== "No preference"}>
                        Wants: {p.genderPreference}
                      </Tag>
                      <Tag emphasis={p.preferredLanguage !== "English"}>
                        Speaks: {p.preferredLanguage}
                      </Tag>
                      <Tag>Zone: {p.location}</Tag>
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-zinc-500">
                    <div>{p.frequency}</div>
                    <div>{p.requiredHoursPerWeek}h/wk</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="py-1 pr-4 font-medium">Date</th>
                  <th className="py-1 pr-4 font-medium">Provider</th>
                  <th className="py-1 pr-4 font-medium">Patient</th>
                  <th className="py-1 font-medium">Shift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {history.map((h, i) => (
                  <tr key={i} className="text-zinc-700 dark:text-zinc-300">
                    <td className="py-1 pr-4">{h.date}</td>
                    <td className="py-1 pr-4">{h.provider}</td>
                    <td className="py-1 pr-4">{h.patient}</td>
                    <td className="py-1">{h.shift}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Factor Weights
            </h2>
            <span
              className={`text-sm font-medium ${
                isValid ? "text-emerald-600" : "text-red-500"
              }`}
            >
              Total: {total}%
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FACTORS.map((f) => (
              <div key={f.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <label className="text-zinc-700 dark:text-zinc-300">{f.label}</label>
                  <span className="text-zinc-500">{weights[f.key]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={weights[f.key]}
                  onChange={(e) => updateWeight(f.key, Number(e.target.value))}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          {!isValid && (
            <p className="mt-3 text-sm text-red-500">Weights must sum to 100% to generate.</p>
          )}
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={!isValid || loading}
            className="mt-4 w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading ? "Generating…" : "Generate Roster"}
          </button>
        </section>
      </div>

      {result && (
        <RosterModal result={result} weights={weights} onClose={() => setResult(null)} />
      )}
    </div>
  );
}
