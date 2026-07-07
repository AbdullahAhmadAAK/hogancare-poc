import { Weights, Provider, Patient, HistoryEntry, RosterResult, FactorScores } from "./types";

const FACTOR_KEYS: (keyof Weights)[] = [
  "skillMatch",
  "availability",
  "continuityOfCare",
  "genderMatch",
  "culturalMatch",
  "travelProximity",
];

export function computeWeightedScore(factorScores: FactorScores, weights: Weights): number {
  const weightedSum = FACTOR_KEYS.reduce(
    (sum, key) => sum + factorScores[key] * weights[key],
    0
  );
  return Math.round(weightedSum / 100);
}

const WORKDAY_START_MIN = 9 * 60;
const WORKDAY_END_MIN = 17 * 60;

function parseTimeToMinutes(time: string): number | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return hours * 60 + Number(match[2]);
}

function minutesToTime(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function clampAssignmentsToWorkday(result: RosterResult): RosterResult {
  const assignments = result.assignments.map((a) => {
    const start = parseTimeToMinutes(a.startTime);
    const end = parseTimeToMinutes(a.endTime);
    if (start === null || end === null) return a;

    const duration = Math.max(end - start, 30);
    let clampedStart = Math.min(Math.max(start, WORKDAY_START_MIN), WORKDAY_END_MIN - duration);
    clampedStart = Math.max(clampedStart, WORKDAY_START_MIN);
    const clampedEnd = Math.min(clampedStart + duration, WORKDAY_END_MIN);

    if (clampedStart === start && clampedEnd === end) return a;

    return { ...a, startTime: minutesToTime(clampedStart), endTime: minutesToTime(clampedEnd) };
  });

  return { ...result, assignments };
}

export function weightsSumTo100(weights: Weights): boolean {
  const total =
    weights.skillMatch +
    weights.availability +
    weights.continuityOfCare +
    weights.genderMatch +
    weights.culturalMatch +
    weights.travelProximity;
  return total === 100;
}

export function buildRosterPrompt(
  providers: Provider[],
  patients: Patient[],
  history: HistoryEntry[],
  weights: Weights
): string {
  return `You are a rostering engine for a home/disability and elder care provider (NDIS-style). Assign one best-fit provider to each patient below for a SINGLE DAY roster.

DECISION WEIGHTS (percentages, sum to 100). When multiple providers could plausibly serve a patient, these weights tell you how much each factor should matter in choosing between them — a factor with a higher percentage should dominate the decision over a factor with a lower one. A provider who is far better on a heavily-weighted factor should be preferred over one who is only slightly better on a lightly-weighted factor:

- Skill/specialty match: ${weights.skillMatch}%
- Availability match: ${weights.availability}%
- Continuity of care (has served this patient before, per history): ${weights.continuityOfCare}%
- Gender preference match: ${weights.genderMatch}%
- Cultural & language match: ${weights.culturalMatch}%
- Travel proximity (same/near zone): ${weights.travelProximity}%

For example, if skillMatch is weighted at 80% and travelProximity at only 5%, you should pick the provider with the better skill match even if a different provider is closer geographically. If two weights are similar, treat their factors as similarly important.

Service Providers:
${JSON.stringify(providers, null, 2)}

Patients:
${JSON.stringify(patients, null, 2)}

Past interaction history:
${JSON.stringify(history, null, 2)}

For each patient, choose exactly one provider — the one that best satisfies the weighted factors above — and schedule a specific time slot for that day's visit, in "H:MM AM/PM" format (e.g. "2:00 PM" to "3:00 PM").

STRICT WORKDAY RULE: every startTime and endTime MUST be between 9:00 AM and 5:00 PM inclusive. No visit may start before 9:00 AM. No visit may end after 5:00 PM. Before finalizing, re-check every single assignment's startTime and endTime against this rule and correct any violation. Pick a session length appropriate to the patient's need (typically 1-2 hours). A single provider must never be double-booked — their assigned time slots across different patients must not overlap.

After choosing each assignment, DO NOT compute an overall weighted score yourself — that is calculated separately from the raw factor scores you provide. Instead, score the chosen provider against EACH of these six factors independently, each on a 0-100 scale, judged only on how well that specific factor is objectively satisfied (ignore the weight/importance here — just report the raw fit):

- skillMatch (0-100): how well the provider's role/specialty fits the patient's care need.
- availability (0-100): how well the provider's availability window covers this visit's time slot.
- continuityOfCare (0-100): 100 if the provider has cared for this patient before per history, scaled down otherwise; 0 if no relevant history and it's a first-time pairing.
- genderMatch (0-100): 100 if the patient has no gender preference or the provider matches the stated preference; low/0 if the provider's gender does not match an explicit preference.
- culturalMatch (0-100): 100 if the patient's preferredLanguage is English (or "No preference") or the provider speaks the patient's preferred language; low/0 if the provider does not speak the patient's required language.
- travelProximity (0-100): 100 if the provider's location matches the patient's location zone exactly; lower for different zones.

Also give a one-sentence reasoning citing which weighted factors most influenced the choice. Also produce a brief overall summary (1-2 sentences) of the day's roster.`;
}
