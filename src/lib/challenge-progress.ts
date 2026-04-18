import { addDays, format } from "date-fns";
import type { ChallengeGoals, DailyScheduleEntry, DayLog } from "@/types/challenge";

export function getDailyCaloriesTotal(log: DayLog): number {
  return log.calories.reduce((s, c) => s + (Number(c.amount) || 0), 0);
}

/**
 * Pilar de calorias no dia atual: meta é teto (deficit). OK = consumo entre 50% e 100% da meta, com registro (> 0).
 * Abaixo de 50% ou acima do teto não conta como atingido. Meta <= 0 desliga o pilar.
 */
export function isCalorieGoalMet(log: DayLog, goals: ChallengeGoals): boolean {
  const ceiling = Number(goals.dailyCalories);
  if (!Number.isFinite(ceiling) || ceiling <= 0) return true;
  const total = getDailyCaloriesTotal(log);
  if (!Number.isFinite(total) || total <= 0) return false;
  return total >= 0.5 * ceiling && total <= ceiling;
}

/**
 * Check no resumo semanal / revisão: só faz sentido "OK" depois que o dia terminou.
 * Mesma faixa 50–100% da meta como teto; hoje e futuros retornam false.
 * Sem meta de calorias (<= 0): não exibir como atingido no resumo (evita falso positivo).
 */
export function isCalorieDayReviewOk(
  log: DayLog,
  goals: ChallengeGoals,
  dayDateStr: string,
  todayStr: string,
): boolean {
  const ceiling = Number(goals.dailyCalories);
  if (!Number.isFinite(ceiling) || ceiling <= 0) return false;
  if (dayDateStr >= todayStr) return false;
  return isCalorieGoalMet(log, goals);
}

/**
 * Check no resumo / revisão: "OK" para dias passados com sono ≥ 90% da meta.
 * Meta <= 0 → não exibir como atingido. Hoje e futuros → false.
 */
export function isSleepDayReviewOk(
  log: DayLog,
  goals: ChallengeGoals,
  dayDateStr: string,
  todayStr: string,
): boolean {
  if (goals.dailySleepHours <= 0) return false;
  if (dayDateStr >= todayStr) return false;
  return isSleepGoalMet(log, goals);
}

/**
 * Sono: precisa estar registrado no app (> 0 h) e ≥ 90% da meta.
 * Meta <= 0 desliga o pilar.
 */
export function isSleepGoalMet(log: DayLog, goals: ChallengeGoals): boolean {
  if (goals.dailySleepHours <= 0) return true;
  const hours = log.sleepHours;
  if (hours == null || hours <= 0) return false;
  const ratio = hours / goals.dailySleepHours;
  return ratio >= 0.9;
}

export function isCardioDoneForDay(log: DayLog): boolean {
  return Boolean(log.cardio);
}

/** Sem templates cadastrados, o pilar cardio não exige seleção. */
export function isCardioPillarMet(log: DayLog, cardioTemplateCount: number): boolean {
  if (cardioTemplateCount <= 0) return true;
  return Boolean(log.cardio);
}

/** Sem templates cadastrados, o pilar treino não exige seleção. */
export function isWorkoutPillarMet(log: DayLog, workoutTemplateCount: number): boolean {
  if (workoutTemplateCount <= 0) return true;
  return Boolean(log.workout);
}

/** Ícone na lista "Dia a Dia" do resumo: check, X ou vazio (pendente / N/A). */
export type WeekDayPillarIcon = "good" | "bad" | "none";

function sleepHoursProvided(log: DayLog): boolean {
  const h = log.sleepHours;
  return h != null && h > 0;
}

export function weekSummaryPillarCaloriesIcon(
  log: DayLog,
  goals: ChallengeGoals,
  dayDateStr: string,
  todayStr: string,
): WeekDayPillarIcon {
  const ceiling = Number(goals.dailyCalories);
  if (!Number.isFinite(ceiling) || ceiling <= 0) return "none";
  if (dayDateStr >= todayStr) return "none";
  return isCalorieGoalMet(log, goals) ? "good" : "bad";
}

export function weekSummaryPillarSleepIcon(
  log: DayLog,
  goals: ChallengeGoals,
  dayDateStr: string,
  todayStr: string,
): WeekDayPillarIcon {
  if (goals.dailySleepHours <= 0) return "none";
  if (dayDateStr > todayStr) return "none";
  if (dayDateStr === todayStr) {
    if (!sleepHoursProvided(log)) return "none";
    return isSleepGoalMet(log, goals) ? "good" : "bad";
  }
  return isSleepGoalMet(log, goals) ? "good" : "bad";
}

export function weekSummaryPillarWorkoutIcon(
  log: DayLog,
  workoutTemplateCount: number,
  dayDateStr: string,
  todayStr: string,
  wasScheduled: boolean = true,
): WeekDayPillarIcon {
  if (workoutTemplateCount <= 0) return "none";
  if (dayDateStr > todayStr) return "none";
  if (dayDateStr === todayStr) {
    return log.workout ? "good" : "none";
  }
  if (log.workout) return "good";
  // Dia de descanso (sem agendamento) não conta como falha.
  if (!wasScheduled) return "none";
  return "bad";
}

export function weekSummaryPillarCardioIcon(
  log: DayLog,
  cardioTemplateCount: number,
  dayDateStr: string,
  todayStr: string,
  wasScheduled: boolean = true,
): WeekDayPillarIcon {
  if (cardioTemplateCount <= 0) return "none";
  if (dayDateStr > todayStr) return "none";
  if (dayDateStr === todayStr) {
    return log.cardio ? "good" : "none";
  }
  if (log.cardio) return "good";
  if (!wasScheduled) return "none";
  return "bad";
}

export function getWeekDayPillarIcons(
  log: DayLog,
  goals: ChallengeGoals,
  workoutTemplateCount: number,
  cardioTemplateCount: number,
  dayDateStr: string,
  todayStr: string,
  scheduleEntry?: DailyScheduleEntry | null,
): Record<"calories" | "sleep" | "workout" | "cardio", WeekDayPillarIcon> {
  // Se há schedule definido, dia sem treino/cardio agendado é descanso.
  // Sem schedule (undefined), assume agendado para manter retrocompatibilidade.
  const workoutScheduled = scheduleEntry === undefined ? true : Boolean(scheduleEntry?.workoutId);
  const cardioScheduled = scheduleEntry === undefined ? true : Boolean(scheduleEntry?.cardioId);
  return {
    calories: weekSummaryPillarCaloriesIcon(log, goals, dayDateStr, todayStr),
    sleep: weekSummaryPillarSleepIcon(log, goals, dayDateStr, todayStr),
    workout: weekSummaryPillarWorkoutIcon(log, workoutTemplateCount, dayDateStr, todayStr, workoutScheduled),
    cardio: weekSummaryPillarCardioIcon(log, cardioTemplateCount, dayDateStr, todayStr, cardioScheduled),
  };
}

export function isDayFullyComplete(
  log: DayLog,
  goals: ChallengeGoals,
  workoutTemplateCount: number,
  cardioTemplateCount: number,
): boolean {
  return (
    isCalorieGoalMet(log, goals) &&
    isSleepGoalMet(log, goals) &&
    isWorkoutPillarMet(log, workoutTemplateCount) &&
    isCardioPillarMet(log, cardioTemplateCount)
  );
}

/** Dashboard: barra verde quando calorias de hoje estão na faixa ideal (ou meta desligada). */
export function isDashboardCaloriesOnTrack(log: DayLog, goals: ChallengeGoals): boolean {
  return isCalorieGoalMet(log, goals);
}

/** Dashboard: barra verde quando sono de hoje está na faixa ideal (ou meta desligada). */
export function isDashboardSleepOnTrack(log: DayLog, goals: ChallengeGoals): boolean {
  return isSleepGoalMet(log, goals);
}

/**
 * Dashboard — treinos (bloco): verde se meta semanal desligada, não há templates,
 * já atingiu os treinos do bloco, ou registrou treino hoje.
 */
export function isDashboardWeeklyWorkoutsOnTrack(
  todayLog: DayLog,
  weekWorkoutCount: number,
  goals: ChallengeGoals,
  workoutTemplateCount: number,
): boolean {
  if (goals.weeklyWorkouts <= 0) return true;
  if (workoutTemplateCount <= 0) return true;
  return weekWorkoutCount >= goals.weeklyWorkouts || Boolean(todayLog.workout);
}

/** Dashboard — cardios (bloco): verde se meta desligada, sem templates, bloco completo ou cardio registrado hoje. */
export function isDashboardWeeklyCardiosOnTrack(
  todayLog: DayLog,
  weekCardioCount: number,
  goals: ChallengeGoals,
  cardioTemplateCount: number,
): boolean {
  if (goals.weeklyCardios <= 0) return true;
  if (cardioTemplateCount <= 0) return true;
  return weekCardioCount >= goals.weeklyCardios || Boolean(todayLog.cardio);
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
    if (log.cardio) weekCardios++;
  }
  return { weekWorkouts, weekCardios, dateStrings };
}

/** Blocos de 7 dias do desafio: dias 1–7, 8–14, …; o último é 85–90 (6 dias). */
export function challengeBlockDayRange(challengeDayNum: number): { firstDay: number; lastDay: number } {
  const firstDay = Math.floor((challengeDayNum - 1) / 7) * 7 + 1;
  const lastDay = Math.min(firstDay + 6, 90);
  return { firstDay, lastDay };
}

export function getChallengeBlockStats(
  challengeStartDate: string,
  firstDay: number,
  lastDay: number,
  getDayLog: (date: string) => DayLog,
): {
  weekWorkouts: number;
  weekCardios: number;
  weekWorkoutIds: Set<string>;
  weekCardioIds: Set<string>;
  dateStrings: string[];
} {
  const base = new Date(challengeStartDate + "T00:00:00");
  const dateStrings: string[] = [];
  const weekWorkoutIds = new Set<string>();
  const weekCardioIds = new Set<string>();
  let weekWorkouts = 0;
  let weekCardios = 0;
  for (let d = firstDay; d <= lastDay; d++) {
    const dateStr = format(addDays(base, d - 1), "yyyy-MM-dd");
    dateStrings.push(dateStr);
    const log = getDayLog(dateStr);
    if (log.workout) {
      weekWorkouts++;
      weekWorkoutIds.add(log.workout);
    }
    if (log.cardio) {
      weekCardios++;
      weekCardioIds.add(log.cardio);
    }
  }
  return { weekWorkouts, weekCardios, weekWorkoutIds, weekCardioIds, dateStrings };
}

/** Primeiro dia do bloco (1, 8, 15, …) ao abrir o resumo: hoje no desafio, ou bloco 1 antes, ou último bloco depois do dia 90. */
export function defaultChallengeViewBlockFirstDay(
  startDate: string | null,
  todayStr: string,
  getDayNumber: (d: string) => number | null,
): number {
  const n = getDayNumber(todayStr);
  if (n != null) return challengeBlockDayRange(n).firstDay;
  if (!startDate) return 1;
  const end = format(addDays(new Date(startDate + "T00:00:00"), 89), "yyyy-MM-dd");
  if (todayStr > end) return challengeBlockDayRange(90).firstDay;
  return 1;
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

export function challengeWeekMilestoneId(firstDay: number, lastDay: number): string {
  return `week-challenge-${firstDay}-${lastDay}`;
}

export const CHALLENGE_COMPLETE_MILESTONE_ID = "challenge-90-complete";

export function hasCelebratedMilestone(
  celebrated: string[] | undefined,
  milestoneId: string,
): boolean {
  return Boolean(celebrated?.includes(milestoneId));
}

/** Returns the suggested workout/cardio for a given challenge day based on the 7-day cycle. */
export function getDailySuggestion(
  dayNumber: number,
  schedule: DailyScheduleEntry[] | undefined,
): DailyScheduleEntry | null {
  if (!schedule || schedule.length !== 7) return null;
  const index = (dayNumber - 1) % 7;
  return schedule[index] ?? null;
}

// ── Pillar suggestion (dashboard badges & day-detail catch-up) ──────────────

export type PillarSuggestionStatus =
  | "suggested"
  | "done"
  | "rest"
  | "catchup-single"
  | "catchup-multi";

export interface PillarSuggestion {
  status: PillarSuggestionStatus;
  templateId?: string;
  templateName?: string;
  pendingIds?: string[];
  pendingCount?: number;
}

export function getCurrentDayPillarPending(params: {
  pillar: "workout" | "cardio";
  currentDayNumber: number;
  schedule: DailyScheduleEntry[];
  blockDoneIds: Set<string>;
  templates: { id: string; name: string }[];
}): PillarSuggestion | null {
  const { pillar, currentDayNumber, schedule, blockDoneIds, templates } = params;

  if (schedule.length !== 7) return null;

  const { firstDay: blockFirst, lastDay: blockLast } = challengeBlockDayRange(currentDayNumber);
  const overdueThroughDay = Math.min(currentDayNumber - 1, blockLast);
  if (overdueThroughDay < blockFirst) return null;

  const overdueScheduledIds = new Set<string>();
  for (let day = blockFirst; day <= overdueThroughDay; day++) {
    const scheduledEntry = getDailySuggestion(day, schedule);
    const id = pillar === "workout" ? scheduledEntry?.workoutId : scheduledEntry?.cardioId;
    if (id) overdueScheduledIds.add(id);
  }

  const pendingIds = [...overdueScheduledIds].filter((id) => !blockDoneIds.has(id));
  if (pendingIds.length === 0) return null;

  if (pendingIds.length === 1) {
    const t = templates.find((t) => t.id === pendingIds[0]);
    return {
      status: "catchup-single",
      templateId: pendingIds[0],
      templateName: t?.name,
    };
  }

  return {
    status: "catchup-multi",
    pendingIds,
    pendingCount: pendingIds.length,
  };
}

/**
 * Determines the suggestion state for a single pillar (workout or cardio).
 *
 * `referenceDayNumber` is the real current challenge day used to decide whether
 * something is still upcoming or already overdue in the viewed 7-day block.
 *
 * - `suggested` — scheduled for the viewed day, but not overdue yet
 * - `done` — the viewed day's log already has this pillar registered
 * - `rest` — no overdue exercises for this pillar in the viewed block
 * - `catchup-single` — exactly 1 overdue exercise in the viewed block
 * - `catchup-multi` — 2+ overdue exercises in the viewed block
 */
export function getPillarSuggestion(params: {
  pillar: "workout" | "cardio";
  dayNumber: number;
  referenceDayNumber?: number | null;
  todayLog: DayLog;
  schedule: DailyScheduleEntry[];
  blockDoneIds: Set<string>;
  templates: { id: string; name: string }[];
}): PillarSuggestion | null {
  const {
    pillar,
    dayNumber,
    referenceDayNumber = dayNumber,
    todayLog,
    schedule,
    blockDoneIds,
    templates,
  } = params;

  if (schedule.length !== 7) return null;

  const entry = getDailySuggestion(dayNumber, schedule);
  if (!entry) return null;

  const dayTemplateId = pillar === "workout" ? entry.workoutId : entry.cardioId;
  const loggedId = pillar === "workout" ? todayLog.workout : todayLog.cardio;
  const { firstDay: blockFirst, lastDay: blockLast } = challengeBlockDayRange(dayNumber);

  const overdueThroughDay =
    referenceDayNumber == null || referenceDayNumber <= blockFirst || dayNumber > referenceDayNumber
      ? null
      : Math.min(dayNumber, referenceDayNumber - 1, blockLast);

  if (dayTemplateId) {
    if (loggedId) return { status: "done" };
    const t = templates.find((t) => t.id === dayTemplateId);
    if (referenceDayNumber != null && dayNumber < referenceDayNumber) {
      return { status: "catchup-single", templateId: dayTemplateId, templateName: t?.name };
    }
    return { status: "suggested", templateId: dayTemplateId, templateName: t?.name };
  }

  if (loggedId) return { status: "done" };
  if (overdueThroughDay == null || overdueThroughDay < blockFirst) return { status: "rest" };

  const overdueDayCount = overdueThroughDay - blockFirst + 1;
  const overdueScheduledIds = new Set<string>();
  for (let i = 0; i < overdueDayCount; i++) {
    const scheduledEntry = schedule[i];
    const id = pillar === "workout" ? scheduledEntry.workoutId : scheduledEntry.cardioId;
    if (id) overdueScheduledIds.add(id);
  }

  const pendingIds = [...overdueScheduledIds].filter((id) => !blockDoneIds.has(id));

  if (pendingIds.length === 0) return { status: "rest" };

  if (pendingIds.length === 1) {
    const t = templates.find((t) => t.id === pendingIds[0]);
    return {
      status: "catchup-single",
      templateId: pendingIds[0],
      templateName: t?.name,
    };
  }

  return {
    status: "catchup-multi",
    pendingIds,
    pendingCount: pendingIds.length,
  };
}
