import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  ChallengeData, DayLog, CalorieEntry, WorkoutTemplate, CardioTemplate,
  ChallengeGoals, BodyCompositionEntry, ActiveSession, WorkoutExercise,
  DailyScheduleEntry, ExerciseModality, ExerciseWeightEntry,
} from "@/types/challenge";
import { format } from "date-fns";

const STORAGE_KEY = "fitness-challenge-90";

// ── helpers for stable default IDs ──────────────────────────────────────────
let _seqId = 0;
function seqId(prefix: string) { return `${prefix}-${++_seqId}`; }

function exercise(
  name: string, sets: number, reps: string, targetMuscles: string,
  modality: ExerciseModality = "dumbbell",
): WorkoutExercise {
  return { id: seqId("ex"), name, sets, reps, targetMuscles, modality };
}

// ── default workout templates ───────────────────────────────────────────────
const defaultWorkoutTemplates: WorkoutTemplate[] = [
  {
    id: seqId("wt"),
    name: "Upper A",
    order: 0,
    focus: "Peitoral, costas médias e braços",
    estimatedMinutes: 45,
    exercises: [
      exercise("Supino com halteres", 3, "8-12", "Peitoral, tríceps, ombro anterior"),
      exercise("Remada curvada com halteres", 3, "8-12", "Costas médias, dorsal, bíceps"),
      exercise("Elevação lateral", 3, "12-15", "Deltoide lateral"),
      exercise("Flexões", 2, "até próximo da falha", "Peitoral, tríceps, ombro anterior", "bodyweight"),
      exercise("Superset: Rosca alternada + Tríceps francês", 2, "10-12 cada", "Bíceps + tríceps"),
    ],
  },
  {
    id: seqId("wt"),
    name: "Upper B",
    order: 1,
    focus: "Ombros, costas altas e dorsal",
    estimatedMinutes: 45,
    exercises: [
      exercise("Desenvolvimento com halteres", 3, "8-10", "Ombros, tríceps"),
      exercise("Remada unilateral com halter", 3, "10-12", "Costas, dorsal, bíceps"),
      exercise("Pullover com halter", 3, "10-15", "Dorsal, serrátil, caixa torácica"),
      exercise("Crucifixo inverso", 3, "12-15", "Deltoide posterior, costas altas"),
      exercise("Superset: Rosca martelo + Tríceps francês", 2, "10-12 cada", "Braquial/bíceps + tríceps"),
    ],
  },
  {
    id: seqId("wt"),
    name: "Lower A",
    order: 2,
    focus: "Quadríceps e glúteos",
    estimatedMinutes: 45,
    exercises: [
      exercise("Agachamento goblet com pausa", 3, "10-12", "Quadríceps, glúteos, core"),
      exercise("Levantamento terra romeno com halteres", 3, "8-12", "Posteriores, glúteos"),
      exercise("Afundo reverso com halteres", 3, "10-12 por perna", "Glúteos, quadríceps, adutores"),
      exercise("Agachamento isométrico na parede", 2, "30-45 s", "Quadríceps", "bodyweight"),
      exercise("Elevação de panturrilha em pé", 3, "15-20", "Panturrilhas", "bodyweight"),
    ],
  },
  {
    id: seqId("wt"),
    name: "Lower B",
    order: 3,
    focus: "Glúteos, posteriores e estabilidade",
    estimatedMinutes: 45,
    exercises: [
      exercise("Agachamento búlgaro com halteres", 3, "10-12 por perna", "Glúteos, quadríceps"),
      exercise("Hip thrust no chão com halter e pausa", 3, "12-15", "Glúteos, posteriores"),
      exercise("Stiff unilateral com halter", 3, "10-12 por perna", "Posteriores, glúteos, estabilidade"),
      exercise("Ponte de glúteo unilateral", 2, "12-15 por perna", "Glúteos", "bodyweight"),
      exercise("Elevação de panturrilha unilateral", 3, "15-20 por perna", "Panturrilhas", "bodyweight"),
    ],
  },
];

// ── default cardio templates ────────────────────────────────────────────────
const defaultCardioTemplates: CardioTemplate[] = [
  { id: seqId("ct"), name: "Core A", order: 0, objective: "Estabilidade do tronco e resistência abdominal", intensity: "Moderada" },
  { id: seqId("ct"), name: "Core B", order: 1, objective: "Maior foco em controlo do abdómen e região inferior", intensity: "Moderada" },
  { id: seqId("ct"), name: "Core C", order: 2, objective: "Oblíquos, controlo lateral e estabilidade global", intensity: "Moderada a alta" },
  { id: seqId("ct"), name: "Core leve", order: 3, objective: "Activação, técnica e recuperação", intensity: "Leve" },
];

// ── default weekly schedule (matches treino-upper-lower-casa plan) ───────────
function buildDefaultWeeklySchedule(
  wt: WorkoutTemplate[],
  ct: CardioTemplate[],
): DailyScheduleEntry[] {
  const w = (order: number) => wt.find(t => t.order === order)?.id;
  const c = (order: number) => ct.find(t => t.order === order)?.id;
  return [
    { workoutId: w(0), cardioId: c(0), label: "Upper A + Core A" },
    { workoutId: w(2), cardioId: c(1), label: "Lower A + Core B" },
    {                   cardioId: c(3), label: "Descanso + Core leve" },
    { workoutId: w(1), cardioId: c(2), label: "Upper B + Core C" },
    { workoutId: w(3), cardioId: c(0), label: "Lower B + Core A" },
    {                   cardioId: c(3), label: "Descanso ativo + Core leve" },
    {                   cardioId: c(3), label: "Descanso total + Core leve" },
  ];
}

const defaultWeeklySchedule = buildDefaultWeeklySchedule(
  defaultWorkoutTemplates,
  defaultCardioTemplates,
);

const defaultGoals: ChallengeGoals = {
  dailyCalories: 1600,
  dailySleepHours: 8,
  weeklyCardios: 3,
  weeklyWorkouts: 4,
};

const defaultData: ChallengeData = {
  startDate: null,
  goals: defaultGoals,
  workoutTemplates: defaultWorkoutTemplates,
  cardioTemplates: defaultCardioTemplates,
  weeklySchedule: defaultWeeklySchedule,
  dayLogs: {},
  feedback: { celebratedMilestones: [] },
};

function goalNumber(value: unknown, fallback: number): number {
  if (value === undefined || value === null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function workoutsHaveNewShape(templates: unknown[]): boolean {
  return templates.every(
    (t) => t && typeof t === "object" && "exercises" in t && Array.isArray((t as Record<string, unknown>).exercises),
  );
}

function resolveTemplates<T>(saved: T[] | undefined, defaults: T[], isValid: (items: T[]) => boolean): T[] {
  if (!Array.isArray(saved)) return defaults;
  if (saved.length === 0) return saved;
  return isValid(saved) ? saved : defaults;
}

function normalizeLoadedChallengeData(parsed: Partial<ChallengeData>): ChallengeData {
  const celebrated = parsed.feedback?.celebratedMilestones;
  const pg = (parsed.goals && typeof parsed.goals === "object" ? parsed.goals : {}) as Partial<ChallengeGoals>;

  return {
    startDate: parsed.startDate ?? null,
    goals: {
      ...defaultGoals,
      ...pg,
      dailyCalories: goalNumber(pg.dailyCalories, defaultGoals.dailyCalories),
      dailySleepHours: goalNumber(pg.dailySleepHours, defaultGoals.dailySleepHours),
      weeklyCardios: goalNumber(pg.weeklyCardios, defaultGoals.weeklyCardios),
      weeklyWorkouts: goalNumber(pg.weeklyWorkouts, defaultGoals.weeklyWorkouts),
    },
    workoutTemplates: resolveTemplates(parsed.workoutTemplates as WorkoutTemplate[] | undefined, defaultWorkoutTemplates, workoutsHaveNewShape),
    cardioTemplates: resolveTemplates(parsed.cardioTemplates as CardioTemplate[] | undefined, defaultCardioTemplates, () => true),
    dayLogs: parsed.dayLogs && typeof parsed.dayLogs === "object" ? parsed.dayLogs : {},
    feedback: {
      celebratedMilestones: Array.isArray(celebrated) ? [...celebrated] : [],
    },
    bodyComposition: Array.isArray(parsed.bodyComposition) ? parsed.bodyComposition : [],
    activeSession: parsed.activeSession ?? undefined,
    weeklySchedule: Array.isArray(parsed.weeklySchedule) && parsed.weeklySchedule.length === 7
      ? parsed.weeklySchedule
      : defaultWeeklySchedule,
    exerciseWeightLogs: parsed.exerciseWeightLogs && typeof parsed.exerciseWeightLogs === "object"
      ? parsed.exerciseWeightLogs
      : undefined,
  };
}

function loadData(): ChallengeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ChallengeData>;
      return normalizeLoadedChallengeData(parsed);
    }
  } catch {
    // ignore invalid or missing persisted data
  }
  return defaultData;
}

function saveData(data: ChallengeData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface ChallengeContextType {
  data: ChallengeData;
  setStartDate: (date: string) => void;
  setGoals: (goals: ChallengeGoals) => void;
  getDayLog: (date: string) => DayLog;
  addCalorie: (date: string, entry: Omit<CalorieEntry, "id">) => void;
  removeCalorie: (date: string, entryId: string) => void;
  setWorkout: (date: string, workoutId: string | undefined) => void;
  setCardio: (date: string, cardioId: string | undefined) => void;
  setSleep: (date: string, hours: number) => void;
  addWorkoutTemplate: (template: Omit<WorkoutTemplate, "id">) => void;
  updateWorkoutTemplate: (template: WorkoutTemplate) => void;
  removeWorkoutTemplate: (id: string) => void;
  addCardioTemplate: (template: Omit<CardioTemplate, "id">) => void;
  updateCardioTemplate: (template: CardioTemplate) => void;
  removeCardioTemplate: (id: string) => void;
  getDayNumber: (date: string) => number | null;
  setBodyComposition: (entry: BodyCompositionEntry) => void;
  removeBodyComposition: (week: number) => void;
  resetChallenge: () => void;
  addCelebratedMilestone: (milestoneId: string) => void;
  saveExerciseWeights: (date: string, weights: Record<string, number>) => void;
  startSession: (session: ActiveSession) => void;
  updateSession: (updates: Partial<ActiveSession>) => void;
  clearSession: () => void;
}

const ChallengeContext = createContext<ChallengeContextType | null>(null);

export function ChallengeProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ChallengeData>(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const setStartDate = useCallback((date: string) => {
    setData(prev => ({ ...prev, startDate: date }));
  }, []);

  const setGoals = useCallback((goals: ChallengeGoals) => {
    setData(prev => ({ ...prev, goals }));
  }, []);

  const getDayLog = useCallback((date: string): DayLog => {
    return data.dayLogs[date] || { date, calories: [] };
  }, [data.dayLogs]);

  const updateDayLog = useCallback((date: string, updater: (log: DayLog) => DayLog) => {
    setData(prev => {
      const existing = prev.dayLogs[date] || { date, calories: [] };
      return {
        ...prev,
        dayLogs: { ...prev.dayLogs, [date]: updater(existing) },
      };
    });
  }, []);

  const addCalorie = useCallback((date: string, entry: Omit<CalorieEntry, "id">) => {
    updateDayLog(date, log => ({
      ...log,
      calories: [...log.calories, { ...entry, id: crypto.randomUUID() }],
    }));
  }, [updateDayLog]);

  const removeCalorie = useCallback((date: string, entryId: string) => {
    updateDayLog(date, log => ({
      ...log,
      calories: log.calories.filter(c => c.id !== entryId),
    }));
  }, [updateDayLog]);

  const setWorkout = useCallback((date: string, workoutId: string | undefined) => {
    updateDayLog(date, log => ({ ...log, workout: workoutId }));
  }, [updateDayLog]);

  const setCardio = useCallback((date: string, cardioId: string | undefined) => {
    updateDayLog(date, log => ({ ...log, cardio: cardioId }));
  }, [updateDayLog]);

  const setSleep = useCallback((date: string, hours: number) => {
    updateDayLog(date, log => ({ ...log, sleepHours: hours }));
  }, [updateDayLog]);

  const addWorkoutTemplate = useCallback((template: Omit<WorkoutTemplate, "id">) => {
    setData(prev => ({
      ...prev,
      workoutTemplates: [...prev.workoutTemplates, { ...template, id: crypto.randomUUID() }],
    }));
  }, []);

  const updateWorkoutTemplate = useCallback((template: WorkoutTemplate) => {
    setData(prev => ({
      ...prev,
      workoutTemplates: prev.workoutTemplates.map(t => t.id === template.id ? template : t),
    }));
  }, []);

  const removeWorkoutTemplate = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      workoutTemplates: prev.workoutTemplates.filter(t => t.id !== id),
    }));
  }, []);

  const addCardioTemplate = useCallback((template: Omit<CardioTemplate, "id">) => {
    setData(prev => ({
      ...prev,
      cardioTemplates: [...prev.cardioTemplates, { ...template, id: crypto.randomUUID() }],
    }));
  }, []);

  const updateCardioTemplate = useCallback((template: CardioTemplate) => {
    setData(prev => ({
      ...prev,
      cardioTemplates: prev.cardioTemplates.map(t => t.id === template.id ? template : t),
    }));
  }, []);

  const removeCardioTemplate = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      cardioTemplates: prev.cardioTemplates.filter(t => t.id !== id),
    }));
  }, []);

  const getDayNumber = useCallback((date: string): number | null => {
    if (!data.startDate) return null;
    const start = new Date(data.startDate + "T00:00:00");
    const current = new Date(date + "T00:00:00");
    const diff = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0 || diff >= 90) return null;
    return diff + 1;
  }, [data.startDate]);

  const setBodyComposition = useCallback((entry: BodyCompositionEntry) => {
    setData(prev => {
      const existing = prev.bodyComposition ?? [];
      const idx = existing.findIndex(e => e.week === entry.week);
      const updated = idx >= 0
        ? existing.map((e, i) => (i === idx ? entry : e))
        : [...existing, entry];
      updated.sort((a, b) => a.week - b.week);
      return { ...prev, bodyComposition: updated };
    });
  }, []);

  const removeBodyComposition = useCallback((week: number) => {
    setData(prev => ({
      ...prev,
      bodyComposition: (prev.bodyComposition ?? []).filter(e => e.week !== week),
    }));
  }, []);

  const resetChallenge = useCallback(() => {
    setData(defaultData);
  }, []);

  const addCelebratedMilestone = useCallback((milestoneId: string) => {
    setData(prev => {
      const existing = prev.feedback?.celebratedMilestones ?? [];
      if (existing.includes(milestoneId)) return prev;
      return {
        ...prev,
        feedback: {
          ...prev.feedback,
          celebratedMilestones: [...existing, milestoneId],
        },
      };
    });
  }, []);

  const saveExerciseWeights = useCallback((date: string, weights: Record<string, number>) => {
    setData(prev => {
      const logs = { ...(prev.exerciseWeightLogs ?? {}) };
      for (const [exId, weight] of Object.entries(weights)) {
        if (weight > 0) {
          const existing = logs[exId] ?? [];
          logs[exId] = [...existing, { date, weight }];
        }
      }
      return { ...prev, exerciseWeightLogs: logs };
    });
  }, []);

  const startSession = useCallback((session: ActiveSession) => {
    setData(prev => ({ ...prev, activeSession: session }));
  }, []);

  const updateSession = useCallback((updates: Partial<ActiveSession>) => {
    setData(prev => {
      if (!prev.activeSession) return prev;
      return { ...prev, activeSession: { ...prev.activeSession, ...updates } };
    });
  }, []);

  const clearSession = useCallback(() => {
    setData(prev => {
      const { activeSession: _, ...rest } = prev;
      return { ...rest, activeSession: undefined };
    });
  }, []);

  return (
    <ChallengeContext.Provider value={{
      data, setStartDate, setGoals, getDayLog, addCalorie, removeCalorie,
      setWorkout, setCardio, setSleep,
      addWorkoutTemplate, updateWorkoutTemplate, removeWorkoutTemplate,
      addCardioTemplate, updateCardioTemplate, removeCardioTemplate,
      getDayNumber, setBodyComposition, removeBodyComposition,
      resetChallenge, addCelebratedMilestone,
      saveExerciseWeights, startSession, updateSession, clearSession,
    }}>
      {children}
    </ChallengeContext.Provider>
  );
}

export function useChallenge() {
  const ctx = useContext(ChallengeContext);
  if (!ctx) throw new Error("useChallenge must be used within ChallengeProvider");
  return ctx;
}
