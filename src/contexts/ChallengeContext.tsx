import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ChallengeData, DayLog, CalorieEntry, CardioEntry, WorkoutTemplate, ChallengeGoals } from "@/types/challenge";
import { format } from "date-fns";

const STORAGE_KEY = "fitness-challenge-90";

const defaultGoals: ChallengeGoals = {
  dailyCalories: 2000,
  dailySleepHours: 8,
  weeklyCardios: 3,
  weeklyWorkouts: 4,
};

const defaultData: ChallengeData = {
  startDate: null,
  goals: defaultGoals,
  workoutTemplates: [],
  dayLogs: {},
  feedback: { celebratedMilestones: [] },
};

function goalNumber(value: unknown, fallback: number): number {
  if (value === undefined || value === null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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
    workoutTemplates: Array.isArray(parsed.workoutTemplates) ? parsed.workoutTemplates : [],
    dayLogs: parsed.dayLogs && typeof parsed.dayLogs === "object" ? parsed.dayLogs : {},
    feedback: {
      celebratedMilestones: Array.isArray(celebrated) ? [...celebrated] : [],
    },
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
  setCardio: (date: string, cardio: CardioEntry) => void;
  setSleep: (date: string, hours: number) => void;
  addWorkoutTemplate: (template: Omit<WorkoutTemplate, "id">) => void;
  updateWorkoutTemplate: (template: WorkoutTemplate) => void;
  removeWorkoutTemplate: (id: string) => void;
  getDayNumber: (date: string) => number | null;
  resetChallenge: () => void;
  addCelebratedMilestone: (milestoneId: string) => void;
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
    return data.dayLogs[date] || {
      date,
      calories: [],
      cardio: { done: false },
    };
  }, [data.dayLogs]);

  const updateDayLog = useCallback((date: string, updater: (log: DayLog) => DayLog) => {
    setData(prev => {
      const existing = prev.dayLogs[date] || { date, calories: [], cardio: { done: false } };
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

  const setCardio = useCallback((date: string, cardio: CardioEntry) => {
    updateDayLog(date, log => ({ ...log, cardio }));
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

  const getDayNumber = useCallback((date: string): number | null => {
    if (!data.startDate) return null;
    const start = new Date(data.startDate + "T00:00:00");
    const current = new Date(date + "T00:00:00");
    const diff = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0 || diff >= 90) return null;
    return diff + 1;
  }, [data.startDate]);

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

  return (
    <ChallengeContext.Provider value={{
      data, setStartDate, setGoals, getDayLog, addCalorie, removeCalorie,
      setWorkout, setCardio, setSleep, addWorkoutTemplate, updateWorkoutTemplate,
      removeWorkoutTemplate, getDayNumber, resetChallenge, addCelebratedMilestone,
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
