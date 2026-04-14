import { addDays, format, getISOWeek, getISOWeekYear } from "date-fns";
import type { ChallengeGoals, DayLog } from "@/types/challenge";

export function getDailyCaloriesTotal(log: DayLog): number {
  return log.calories.reduce((s, c) => s + c.amount, 0);
}

/**
 * Pilar de calorias no dia atual: meta é teto (deficit). OK = consumo entre 50% e 100% da meta, com registro (> 0).
 * Abaixo de 50% ou acima de 100% não conta como atingido. Meta <= 0 desliga o pilar.
 */
export function isCalorieGoalMet(log: DayLog, goals: ChallengeGoals): boolean {
  if (goals.dailyCalories <= 0) return true;
  const total = getDailyCaloriesTotal(log);
  if (total <= 0) return false;
  const ratio = total / goals.dailyCalories;
  return ratio >= 0.5 && ratio <= 1;
}

/**
 * Check no resumo semanal / revisão: só faz sentido “OK” depois que o dia terminou.
 * Mesma faixa 50–100% da meta como teto; hoje e futuros retornam false.
 */
export function isCalorieDayReviewOk(
  log: DayLog,
  goals: ChallengeGoals,
  dayDateStr: string,
  todayStr: string,
): boolean {
  if (goals.dailyCalories <= 0) return true;
  if (dayDateStr >= todayStr) return false;
  return isCalorieGoalMet(log, goals);
}

/**
 * Sono: precisa estar registrado no app (> 0 h) e entre 80% e 140% da meta (inclusive).
 * Meta <= 0 desliga o pilar.
 */
export function isSleepGoalMet(log: DayLog, goals: ChallengeGoals): boolean {
  if (goals.dailySleepHours <= 0) return true;
  const hours = log.sleepHours;
  if (hours == null || hours <= 0) return false;
  const ratio = hours / goals.dailySleepHours;
  return ratio >= 0.8 && ratio <= 1.4;
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
