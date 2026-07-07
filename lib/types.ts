export type Provider = {
  id: string;
  name: string;
  role: string;
  specialty: string;
  availability: string;
  weeklyHours: number;
  gender: string;
  languages: string[];
  location: string;
};

export type Patient = {
  id: string;
  name: string;
  need: string;
  requiredHoursPerWeek: number;
  frequency: string;
  notes: string;
  genderPreference: string;
  preferredLanguage: string;
  location: string;
};

export type HistoryEntry = {
  date: string;
  provider: string;
  patient: string;
  shift: string;
};

export type Weights = {
  skillMatch: number;
  availability: number;
  continuityOfCare: number;
  genderMatch: number;
  culturalMatch: number;
  travelProximity: number;
};

export type FactorScores = {
  skillMatch: number;
  availability: number;
  continuityOfCare: number;
  genderMatch: number;
  culturalMatch: number;
  travelProximity: number;
};

export type RosterAssignment = {
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  startTime: string;
  endTime: string;
  factorScores: FactorScores;
  score: number;
  reasoning: string;
};

export type RosterResult = {
  assignments: RosterAssignment[];
  summary: string;
  date: string;
};
