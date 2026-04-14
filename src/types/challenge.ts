export interface WorkoutTemplate {
  id: string;
  name: string;
  order: number;
}

export interface CalorieEntry {
  id: string;
  amount: number;
  label?: string;
}

export interface CardioEntry {
  done: boolean;
  minutes?: number;
  caloriesBurned?: number;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  calories: CalorieEntry[];
  workout?: string; // workout template id
  cardio: CardioEntry;
  sleepHours?: number;
}

export interface ChallengeGoals {
  dailyCalories: number;
  dailySleepHours: number;
  weeklyCardios: number;
  weeklyWorkouts: number;
}

/** Marcos já celebrados (ex.: week-challenge-1-7, challenge-90-complete). */
export interface ChallengeFeedbackState {
  celebratedMilestones?: string[];
}

export interface ChallengeData {
  startDate: string | null; // YYYY-MM-DD
  goals: ChallengeGoals;
  workoutTemplates: WorkoutTemplate[];
  dayLogs: Record<string, DayLog>; // keyed by YYYY-MM-DD
  feedback?: ChallengeFeedbackState;
}
