export interface WorkoutExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  targetMuscles: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  order: number;
  focus?: string;
  estimatedMinutes?: number;
  exercises: WorkoutExercise[];
}

export interface CardioTemplate {
  id: string;
  name: string;
  order: number;
  youtubeLink?: string;
  objective?: string;
  intensity?: string;
  estimatedMinutes?: number;
}

export interface ActiveSession {
  type: 'workout' | 'cardio';
  templateId: string;
  date: string;
  exerciseProgress: Record<string, boolean[]>;
  currentExerciseIndex: number;
}

export interface CalorieEntry {
  id: string;
  amount: number;
  label?: string;
}

export interface DayLog {
  date: string;
  calories: CalorieEntry[];
  workout?: string;
  cardio?: string;
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

export interface BodyCompositionEntry {
  week: number;
  date: string;
  weight?: number;
  bodyFatPct?: number;
  musclePct?: number;
  visceralFat?: number;
}

export interface DailyScheduleEntry {
  workoutId?: string;
  cardioId?: string;
  label: string;
}

export interface ChallengeData {
  startDate: string | null;
  goals: ChallengeGoals;
  workoutTemplates: WorkoutTemplate[];
  cardioTemplates: CardioTemplate[];
  dayLogs: Record<string, DayLog>;
  feedback?: ChallengeFeedbackState;
  bodyComposition?: BodyCompositionEntry[];
  activeSession?: ActiveSession;
  weeklySchedule?: DailyScheduleEntry[];
}
