import { Provider, Patient, HistoryEntry } from "./types";

const FIRST_NAMES = [
  "Sarah", "James", "Linh", "David", "Amara", "Tom", "Priya", "Michael",
  "Fatima", "Liam", "Noor", "Chen", "Grace", "Ahmed", "Elena", "Robert",
  "Margaret", "Kofi", "Isabella", "Ravi", "Wei", "Aisha", "Connor", "Yuki",
];

const LAST_NAMES = [
  "Mitchell", "Okafor", "Tran", "Kowalski", "Osei", "Reyes", "Sharma", "Nguyen",
  "Hassan", "O'Brien", "Petrova", "Chen", "Ibrahim", "Walsh", "Nakamura", "Singh",
  "Adeyemi", "Costa", "Kim", "Murphy",
];

const SPECIALTIES = [
  "Wound Care",
  "Personal Care",
  "Mobility & Rehab",
  "Behavioural Support",
  "Medication Management",
  "Dementia Care",
  "Community Access",
  "Respite Care",
  "Continence Care",
  "Complex Care",
];

const ROLE_BY_SPECIALTY: Record<string, string[]> = {
  "Wound Care": ["Registered Nurse", "Enrolled Nurse"],
  "Personal Care": ["Support Worker", "Personal Care Assistant"],
  "Mobility & Rehab": ["Physiotherapist", "Occupational Therapist"],
  "Behavioural Support": ["Behavioural Therapist", "Support Worker"],
  "Medication Management": ["Registered Nurse", "Enrolled Nurse"],
  "Dementia Care": ["Support Worker", "Registered Nurse"],
  "Community Access": ["Support Worker", "Personal Care Assistant"],
  "Respite Care": ["Support Worker", "Personal Care Assistant"],
  "Continence Care": ["Registered Nurse", "Enrolled Nurse"],
  "Complex Care": ["Registered Nurse", "Occupational Therapist"],
};

const AVAILABILITY_OPTIONS = [
  "Mon-Fri, AM",
  "Mon-Fri, PM",
  "Mon-Sat, AM/PM",
  "Tue-Thu, AM/PM",
  "Wed-Sun, PM",
  "Mon-Wed, AM",
  "Thu-Sun, AM/PM",
];

const PATIENT_NOTES: Record<string, string[]> = {
  "Wound Care": ["Post-surgical dressing changes", "Pressure ulcer management", "Diabetic foot ulcer care"],
  "Personal Care": ["Assistance with daily living", "Bathing and dressing support", "Hoist transfer required"],
  "Mobility & Rehab": ["Post-stroke rehabilitation", "Recovering from hip replacement", "Parkinson's, mobility support"],
  "Behavioural Support": ["Autism spectrum, routine-sensitive", "Anxiety-related behavioural support", "Non-verbal, uses AAC device"],
  "Medication Management": ["Complex medication schedule", "Insulin management, Type 2 diabetes", "Multiple daily medications"],
  "Dementia Care": ["Early-stage dementia, needs prompting", "Mid-stage dementia, requires supervision", "Sundowning behaviour support"],
  "Community Access": ["Wheelchair user, requires transport support", "Enjoys weekly outings", "Social skill-building outings"],
  "Respite Care": ["Family requires scheduled respite", "Overnight respite support", "Short-term relief care"],
  "Continence Care": ["Catheter care required", "Scheduled continence support", "Skin integrity monitoring"],
  "Complex Care": ["Ventilator-dependent care", "Multiple comorbidities", "Palliative care support"],
};

const FREQUENCIES = ["Daily", "2x/week", "3x/week", "4x/week", "5x/week", "Weekly"];

const GENDERS = ["Male", "Female"];

const PATIENT_GENDER_PREFERENCES = ["No preference", "No preference", "Male", "Female"];

const ZONES = ["North Zone", "South Zone", "East Zone", "West Zone", "Central Zone"];

const LANGUAGES = [
  "English", "Mandarin", "Cantonese", "Vietnamese", "Arabic", "Hindi",
  "Spanish", "Tagalog", "Polish", "Yoruba", "Greek", "Italian",
];

function pickPreferredLanguage(): string {
  return Math.random() < 0.35 ? pick(LANGUAGES.filter((l) => l !== "English")) : "English";
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateProviders(count = 6, requiredLanguages: string[] = []): Provider[] {
  const usedNames = new Set<string>();
  const providers: Provider[] = [];

  for (let i = 0; i < count; i++) {
    let name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    while (usedNames.has(name)) {
      name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    }
    usedNames.add(name);

    const specialty = pick(SPECIALTIES);
    const role = pick(ROLE_BY_SPECIALTY[specialty]);

    // Guarantee at least one provider speaks each language a patient prefers,
    // and alternate gender so both genders are always represented.
    const guaranteedLanguage = requiredLanguages[i];
    const extraLanguage =
      guaranteedLanguage ??
      (Math.random() < 0.4 ? pick(LANGUAGES.filter((l) => l !== "English")) : null);
    const languages = extraLanguage ? ["English", extraLanguage] : ["English"];

    providers.push({
      id: `p${i + 1}`,
      name,
      role,
      specialty,
      availability: pick(AVAILABILITY_OPTIONS),
      weeklyHours: randomInt(15, 35),
      gender: GENDERS[i % GENDERS.length],
      languages,
      location: pick(ZONES),
    });
  }

  return providers;
}

export function generatePatients(count = 5): Patient[] {
  const usedNames = new Set<string>();
  const patients: Patient[] = [];

  for (let i = 0; i < count; i++) {
    let name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    while (usedNames.has(name)) {
      name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    }
    usedNames.add(name);

    const need = pick(SPECIALTIES);

    patients.push({
      id: `pt${i + 1}`,
      name,
      need,
      requiredHoursPerWeek: randomInt(3, 12),
      frequency: pick(FREQUENCIES),
      notes: pick(PATIENT_NOTES[need]),
      genderPreference: pick(PATIENT_GENDER_PREFERENCES),
      preferredLanguage: pickPreferredLanguage(),
      location: pick(ZONES),
    });
  }

  return patients;
}

export function generateHistory(
  providers: Provider[],
  patients: Patient[],
  count = 10
): HistoryEntry[] {
  const shifts = ["AM", "PM"];
  const history: HistoryEntry[] = [];

  for (let i = 0; i < count; i++) {
    const month = randomInt(1, 6);
    const day = randomInt(1, 28);
    const date = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    history.push({
      date,
      provider: pick(providers).name,
      patient: pick(patients).name,
      shift: pick(shifts),
    });
  }

  return history.sort((a, b) => a.date.localeCompare(b.date));
}

export function shuffleAll(): { providers: Provider[]; patients: Patient[]; history: HistoryEntry[] } {
  const patients = generatePatients();
  const requiredLanguages = Array.from(
    new Set(patients.map((p) => p.preferredLanguage).filter((l) => l !== "English"))
  );
  const providers = generateProviders(6, requiredLanguages);
  const history = generateHistory(providers, patients);
  return { providers, patients, history };
}
