import { addDays, format, getISOWeek, getISOWeekYear } from "date-fns";
import type { ChallengeGoals, DayLog } from "@/types/challenge";

export function getDailyCaloriesTotal(log: DayLog): number {
  return log.calories.reduce((s, c) => s + c.amount, 0);
}

/** Alinhado ao WeeklySummary: meta batida só com consumo > 0. Meta <= 0 desliga o pilar. */
export function isCalorieGoalMet(log: DayLog, goals: ChallengeGoals): boolean {
  if (goals.dailyCalories <= 0) return true;
  const total = getDailyCaloriesTotal(log);
  return total >= goals.dailyCalories && total > 0;
}

/** Meta <= 0 desliga o pilar. */
export function isSleepGoalMet(log: DayLog, goals: ChallengeGoals): boolean {
  if (goals.dailySleepHours <= 0) return true;
  return (log.sleepHours || 0) >= goals.dailySleepHours;
}

export function isCardioDoneForDay(log: DayLog): boolean {
  return log.cardio.done;
}

/** Sem templates cadastrados, o pilar treino não exige seleção. */
export function isWorkoutPillarMet(log: DayLog, workoutTemplateCount: number): boolean {
  if (workoutTemplateCount <= 0) return true;
  return Boolean(log.workout);
}

export function isDayFullyComplete(
  log: DayLog,
  goals: ChallengeGoals,
  workoutTemplateCount: number,
): boolean {
  return (
    isCalorieGoalMet(log, goals) &&
    isSleepGoalMet(log, goals) &&
    isWorkoutPillarMet(log, workoutTemplateCount) &&
    isCardioDoneForDay(log)
  );
}

export function getWeekStats(
  weekStartMonday: Date,
  getDayLog: (date: string) => DayLog,
): { weekWorkouts: number; weekCardios: number; dateStrings: string[] } {
  const dateStrings: string[] = [];
  let weekWorkouts = 0;
  let weekCardios = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStartMonday, i);
    const dateStr = format(d, "yyyy-MM-dd");
    dateStrings.push(dateStr);
    const log = getDayLog(dateStr);
    if (log.workout) weekWorkouts++;
    if (log.cardio.done) weekCardios++;
  }
  return { weekWorkouts, weekCardios, dateStrings };
}

/** Metas semanais <= 0 ignoram esse eixo. */
export function areWeeklyGoalsMet(
  weekWorkouts: number,
  weekCardios: number,
  goals: ChallengeGoals,
): boolean {
  const workoutsOk = goals.weeklyWorkouts <= 0 || weekWorkouts >= goals.weeklyWorkouts;
  const cardiosOk = goals.weeklyCardios <= 0 || weekCardios >= goals.weeklyCardios;
  return workoutsOk && cardiosOk;
}

export function getWeekCelebrationKey(weekStartMonday: Date): string {
  return `${getISOWeekYear(weekStartMonday)}-W${String(getISOWeek(weekStartMonday)).padStart(2, "0")}`;
}

export function weekMilestoneId(weekStartMonday: Date): string {
  return `week-${getWeekCelebrationKey(weekStartMonday)}`;
}

export const CHALLENGE_COMPLETE_MILESTONE_ID = "challenge-90-complete";

export function hasCelebratedMilestone(
  celebrated: string[] | undefined,
  milestoneId: string,
): boolean {
  return Boolean(celebrated?.includes(milestoneId));
}
