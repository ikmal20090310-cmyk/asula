export interface UserProfile {
  name: string;
  age: number;
  height: number;
  weight: number;
  gender: 'Male' | 'Female';
  maxHR: number;
  restingHR: number;
  vo2max: number;
  hrZones: HRZone[];
}

export interface HRZone {
  zone: number;
  name: string;
  min: number;
  max: number;
  color: string;
}

export interface DailyMetrics {
  date: string;
  vitalityScore: number;
  recoveryScore: number;
  avgHR: number;
  restingHR: number;
  sleepHR: number;
  sleepDuration: number;
  deepSleep: number;
  remSleep: number;
  lightSleep: number;
  awake: number;
  sleepRespRate: number;
  spo2: number;
  stressLevel: number;
  hrv: number;
  // Activity metrics (optional, from MiFitness)
  calories?: number;
  steps?: number;
  distance?: number;
}

export type SportType = 'running' | 'cycling' | 'strength' | 'swimming' | 'walking' | 'hiking' | 'other';

export interface RunSession {
  id: string;
  date: string;
  duration: number;
  distance: number;
  pace: number;
  avgHR: number;
  maxHR: number;
  vo2max: number;
  elevationGain: number;
  elevationLoss: number;
  steps: number;
  calories: number;
  cadence: number;
  strideLength: number;
  gct: number;
  verticalOscillation: number;
  verticalRatio: number;
  trainingLoad: number;
  startHR: number;
  endHR: number;
  recoveryRate: number;
  hrZoneDistribution: number[];
  sportType: SportType;
}

export interface WeeklyData {
  week: string;
  totalDistance: number;
  totalTime: number;
  avgRecovery: number;
  avgSleep: number;
  trainingLoad: number;
  runs: number;
}

export interface Target {
  id: string;
  title: string;
  current: number;
  goal: number;
  unit: string;
  deadline: string;
  progress: number;
}

export interface JournalArticle {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  pubmedId: string;
  topic: string;
  keyTakeaways: string[];
  userCorrelation: string;
  summary: string;
}

export interface TrainingSchedule {
  day: string;
  date: string;
  type: 'Easy Run' | 'Interval' | 'Long Run' | 'Tempo' | 'Strength' | 'Rest' | 'Recovery';
  description: string;
  duration: string;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  references?: string[];
}
