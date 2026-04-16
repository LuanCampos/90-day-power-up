import { describe, expect, it } from "vitest";
import {
  areWeeklyGoalsMet,
  challengeBlockDayRange,
  challengeWeekMilestoneId,
  defaultChallengeViewBlockFirstDay,
  getChallengeBlockStats,
  getDailyCaloriesTotal,
  getDailySuggestion,
  getPillarSuggestion,
  getWeekDayPillarIcons,
  getWeekStats,
  isCalorieGoalMet,
  isCalorieDayReviewOk,
  isCardioPillarMet,
  isDashboardCaloriesOnTrack,
  isDashboardSleepOnTrack,
  isDashboardWeeklyCardiosOnTrack,
  isDashboardWeeklyWorkoutsOnTrack,
  isDayFullyComplete,
  isSleepGoalMet,
  isWorkoutPillarMet,
} from "@/lib/challenge-progress";
import type { ChallengeGoals, DailyScheduleEntry, DayLog } from "@/types/challenge";

const baseGoals: ChallengeGoals = {
  dailyCalories: 2000,
  dailySleepHours: 8,
  weeklyCardios: 3,
  weeklyWorkouts: 4,
};

function emptyLog(date: string): DayLog {
  return { date, calories: [] };
}

describe("getDailyCaloriesTotal", () => {
  it("sums entries", () => {
    const log: DayLog = {
      date: "2026-04-13",
      calories: [
        { id: "1", amount: 500 },
        { id: "2", amount: 300 },
      ],
    };
    expect(getDailyCaloriesTotal(log)).toBe(800);
  });

  it("coerce valores nao numericos para numero (persistencia legada)", () => {
    const log = {
      date: "2026-04-13",
      calories: [{ id: "1", amount: "600" as unknown as number }, { id: "2", amount: 100 }],
    } as DayLog;
    expect(getDailyCaloriesTotal(log)).toBe(700);
  });
});

describe("isCalorieGoalMet", () => {
  it("requires total > 0 when goal > 0", () => {
    const log = emptyLog("2026-04-13");
    expect(isCalorieGoalMet(log, baseGoals)).toBe(false);
  });

  it("met when intake between 50% and 100% of ceiling (inclusive)", () => {
    const log100: DayLog = {
      ...emptyLog("2026-04-13"),
      calories: [{ id: "1", amount: 2000 }],
    };
    expect(isCalorieGoalMet(log100, baseGoals)).toBe(true);
    const log50: DayLog = {
      ...emptyLog("2026-04-13"),
      calories: [{ id: "1", amount: 1000 }],
    };
    expect(isCalorieGoalMet(log50, baseGoals)).toBe(true);
    const log75: DayLog = {
      ...emptyLog("2026-04-13"),
      calories: [{ id: "1", amount: 1500 }],
    };
    expect(isCalorieGoalMet(log75, baseGoals)).toBe(true);
  });

  it("not met below 50% or above 100% of ceiling", () => {
    const low: DayLog = {
      ...emptyLog("2026-04-13"),
      calories: [{ id: "1", amount: 999 }],
    };
    expect(isCalorieGoalMet(low, baseGoals)).toBe(false);
    const high: DayLog = {
      ...emptyLog("2026-04-13"),
      calories: [{ id: "1", amount: 2001 }],
    };
    expect(isCalorieGoalMet(high, baseGoals)).toBe(false);
  });

  it("not met when total is strictly above ceiling (inteiro)", () => {
    const log: DayLog = {
      ...emptyLog("2026-04-13"),
      calories: [
        { id: "1", amount: 1500 },
        { id: "2", amount: 501 },
      ],
    };
    expect(isCalorieGoalMet(log, baseGoals)).toBe(false);
  });

  it("goal <= 0 treats pillar as N/A", () => {
    const log = emptyLog("2026-04-13");
    expect(isCalorieGoalMet(log, { ...baseGoals, dailyCalories: 0 })).toBe(true);
  });
});

describe("isCalorieDayReviewOk", () => {
  it("false for today or future even when intake is in band", () => {
    const log: DayLog = {
      ...emptyLog("2026-04-13"),
      calories: [{ id: "1", amount: 1500 }],
    };
    expect(isCalorieDayReviewOk(log, baseGoals, "2026-04-13", "2026-04-13")).toBe(false);
    expect(isCalorieDayReviewOk(log, baseGoals, "2026-04-14", "2026-04-13")).toBe(false);
  });

  it("true for a past day when intake is in band", () => {
    const log: DayLog = {
      ...emptyLog("2026-04-12"),
      calories: [{ id: "1", amount: 1500 }],
    };
    expect(isCalorieDayReviewOk(log, baseGoals, "2026-04-12", "2026-04-13")).toBe(true);
  });

  it("false for a past day when outside band", () => {
    const low: DayLog = {
      ...emptyLog("2026-04-12"),
      calories: [{ id: "1", amount: 400 }],
    };
    expect(isCalorieDayReviewOk(low, baseGoals, "2026-04-12", "2026-04-13")).toBe(false);
    const high: DayLog = {
      ...emptyLog("2026-04-12"),
      calories: [{ id: "1", amount: 2100 }],
    };
    expect(isCalorieDayReviewOk(high, baseGoals, "2026-04-12", "2026-04-13")).toBe(false);
  });

  it("false quando meta de calorias desligada (evita check enganoso no resumo)", () => {
    const log: DayLog = {
      ...emptyLog("2026-04-12"),
      calories: [{ id: "1", amount: 3000 }],
    };
    expect(isCalorieDayReviewOk(log, { ...baseGoals, dailyCalories: 0 }, "2026-04-12", "2026-04-13")).toBe(false);
  });
});

describe("getWeekDayPillarIcons (Dia a Dia)", () => {
  const todayStr = "2026-04-13";

  it("futuro: nenhum check nem X", () => {
    const log = emptyLog("2026-04-14");
    expect(getWeekDayPillarIcons(log, baseGoals, 2, 2, "2026-04-14", todayStr)).toEqual({
      calories: "none",
      sleep: "none",
      workout: "none",
      cardio: "none",
    });
  });

  it("hoje: calorias sem ícone; sono sem registro sem ícone; treino e cardio pendentes sem ícone", () => {
    const log = emptyLog(todayStr);
    expect(getWeekDayPillarIcons(log, baseGoals, 2, 2, todayStr, todayStr)).toEqual({
      calories: "none",
      sleep: "none",
      workout: "none",
      cardio: "none",
    });
  });

  it("hoje: calorias na faixa ainda sem ícone (revisão só após fechar o dia)", () => {
    const log: DayLog = {
      ...emptyLog(todayStr),
      calories: [{ id: "1", amount: 1500 }],
    };
    expect(getWeekDayPillarIcons(log, baseGoals, 2, 2, todayStr, todayStr).calories).toBe("none");
  });

  it("hoje: sono registrado fora da faixa => bad", () => {
    const log: DayLog = { ...emptyLog(todayStr), sleepHours: 4 };
    expect(getWeekDayPillarIcons(log, baseGoals, 2, 2, todayStr, todayStr).sleep).toBe("bad");
  });

  it("hoje: sono no alvo => good", () => {
    const log: DayLog = { ...emptyLog(todayStr), sleepHours: 8 };
    expect(getWeekDayPillarIcons(log, baseGoals, 2, 2, todayStr, todayStr).sleep).toBe("good");
  });

  it("hoje: treino e cardio marcados => good", () => {
    const log: DayLog = {
      ...emptyLog(todayStr),
      workout: "w1",
      cardio: "c1",
    };
    const icons = getWeekDayPillarIcons(log, baseGoals, 2, 2, todayStr, todayStr);
    expect(icons.workout).toBe("good");
    expect(icons.cardio).toBe("good");
  });

  it("passado: pilares não atendidos => bad", () => {
    const log = emptyLog("2026-04-12");
    expect(getWeekDayPillarIcons(log, baseGoals, 2, 2, "2026-04-12", todayStr)).toEqual({
      calories: "bad",
      sleep: "bad",
      workout: "bad",
      cardio: "bad",
    });
  });

  it("passado: pilares atendidos => good", () => {
    const log: DayLog = {
      ...emptyLog("2026-04-12"),
      calories: [{ id: "1", amount: 1500 }],
      sleepHours: 8,
      workout: "w1",
      cardio: "c1",
    };
    expect(getWeekDayPillarIcons(log, baseGoals, 2, 2, "2026-04-12", todayStr)).toEqual({
      calories: "good",
      sleep: "good",
      workout: "good",
      cardio: "good",
    });
  });

  it("meta calorias 0 => coluna calorias sempre none", () => {
    const goals = { ...baseGoals, dailyCalories: 0 };
    const past = { ...emptyLog("2026-04-12"), calories: [{ id: "1", amount: 9000 }] };
    expect(getWeekDayPillarIcons(past, goals, 2, 2, "2026-04-12", todayStr).calories).toBe("none");
    expect(getWeekDayPillarIcons(emptyLog(todayStr), goals, 2, 2, todayStr, todayStr).calories).toBe("none");
  });

  it("sem workout templates => workout sempre none", () => {
    const log: DayLog = { ...emptyLog("2026-04-12"), workout: "w1" };
    expect(getWeekDayPillarIcons(log, baseGoals, 0, 2, "2026-04-12", todayStr).workout).toBe("none");
  });

  it("sem cardio templates => cardio sempre none", () => {
    const log: DayLog = { ...emptyLog("2026-04-12"), cardio: "c1" };
    expect(getWeekDayPillarIcons(log, baseGoals, 2, 0, "2026-04-12", todayStr).cardio).toBe("none");
  });
});

describe("isSleepGoalMet", () => {
  it("met when logged hours >= 90% of goal (no upper limit)", () => {
    const at90: DayLog = { ...emptyLog("2026-04-13"), sleepHours: 7.2 };
    expect(isSleepGoalMet(at90, baseGoals)).toBe(true);
    const at100: DayLog = { ...emptyLog("2026-04-13"), sleepHours: 8 };
    expect(isSleepGoalMet(at100, baseGoals)).toBe(true);
    const wellAbove: DayLog = { ...emptyLog("2026-04-13"), sleepHours: 14 };
    expect(isSleepGoalMet(wellAbove, baseGoals)).toBe(true);
  });

  it("not met below 90% or when not logged", () => {
    const low: DayLog = { ...emptyLog("2026-04-13"), sleepHours: 7.1 };
    expect(isSleepGoalMet(low, baseGoals)).toBe(false);
    const empty = emptyLog("2026-04-13");
    expect(isSleepGoalMet(empty, baseGoals)).toBe(false);
  });

  it("goal <= 0 is N/A", () => {
    const log = emptyLog("2026-04-13");
    expect(isSleepGoalMet(log, { ...baseGoals, dailySleepHours: 0 })).toBe(true);
  });
});

describe("isWorkoutPillarMet", () => {
  it("no templates => N/A", () => {
    const log = emptyLog("2026-04-13");
    expect(isWorkoutPillarMet(log, 0)).toBe(true);
  });

  it("requires workout id when templates exist", () => {
    const log = emptyLog("2026-04-13");
    expect(isWorkoutPillarMet(log, 2)).toBe(false);
    expect(isWorkoutPillarMet({ ...log, workout: "t1" }, 2)).toBe(true);
  });
});

describe("isCardioPillarMet", () => {
  it("no templates => N/A", () => {
    const log = emptyLog("2026-04-13");
    expect(isCardioPillarMet(log, 0)).toBe(true);
  });

  it("requires cardio id when templates exist", () => {
    const log = emptyLog("2026-04-13");
    expect(isCardioPillarMet(log, 2)).toBe(false);
    expect(isCardioPillarMet({ ...log, cardio: "c1" }, 2)).toBe(true);
  });
});

describe("isDayFullyComplete", () => {
  it("true when all pillars met", () => {
    const log: DayLog = {
      date: "2026-04-13",
      calories: [{ id: "1", amount: 2000 }],
      workout: "w1",
      cardio: "c1",
      sleepHours: 8,
    };
    expect(isDayFullyComplete(log, baseGoals, 1, 1)).toBe(true);
  });

  it("false if cardio missing", () => {
    const log: DayLog = {
      date: "2026-04-13",
      calories: [{ id: "1", amount: 2000 }],
      workout: "w1",
      sleepHours: 8,
    };
    expect(isDayFullyComplete(log, baseGoals, 1, 1)).toBe(false);
  });

  it("true if no cardio templates (pillar auto-met)", () => {
    const log: DayLog = {
      date: "2026-04-13",
      calories: [{ id: "1", amount: 2000 }],
      workout: "w1",
      sleepHours: 8,
    };
    expect(isDayFullyComplete(log, baseGoals, 1, 0)).toBe(true);
  });
});

describe("Dashboard stat card on-track (verde vs laranja)", () => {
  it("isDashboardCaloriesOnTrack espelha isCalorieGoalMet", () => {
    const ok: DayLog = { ...emptyLog("2026-04-13"), calories: [{ id: "1", amount: 1500 }] };
    expect(isDashboardCaloriesOnTrack(ok, baseGoals)).toBe(true);
    const low: DayLog = { ...emptyLog("2026-04-13"), calories: [{ id: "1", amount: 100 }] };
    expect(isDashboardCaloriesOnTrack(low, baseGoals)).toBe(false);
  });

  it("isDashboardSleepOnTrack espelha isSleepGoalMet", () => {
    const ok: DayLog = { ...emptyLog("2026-04-13"), sleepHours: 8 };
    expect(isDashboardSleepOnTrack(ok, baseGoals)).toBe(true);
    expect(isDashboardSleepOnTrack(emptyLog("2026-04-13"), baseGoals)).toBe(false);
  });

  it("treinos: verde com meta do bloco batida ou treino hoje", () => {
    const noToday = emptyLog("2026-04-13");
    expect(isDashboardWeeklyWorkoutsOnTrack(noToday, 3, baseGoals, 2)).toBe(false);
    expect(isDashboardWeeklyWorkoutsOnTrack({ ...noToday, workout: "a" }, 3, baseGoals, 2)).toBe(true);
    expect(isDashboardWeeklyWorkoutsOnTrack(noToday, 4, baseGoals, 2)).toBe(true);
    expect(isDashboardWeeklyWorkoutsOnTrack(noToday, 0, baseGoals, 0)).toBe(true);
    expect(isDashboardWeeklyWorkoutsOnTrack(noToday, 0, { ...baseGoals, weeklyWorkouts: 0 }, 2)).toBe(true);
  });

  it("cardios: verde com meta do bloco batida ou cardio hoje", () => {
    const noToday = emptyLog("2026-04-13");
    expect(isDashboardWeeklyCardiosOnTrack(noToday, 2, baseGoals, 2)).toBe(false);
    expect(isDashboardWeeklyCardiosOnTrack({ ...noToday, cardio: "c1" }, 2, baseGoals, 2)).toBe(true);
    expect(isDashboardWeeklyCardiosOnTrack(noToday, 3, baseGoals, 2)).toBe(true);
    expect(isDashboardWeeklyCardiosOnTrack(noToday, 0, { ...baseGoals, weeklyCardios: 0 }, 2)).toBe(true);
    expect(isDashboardWeeklyCardiosOnTrack(noToday, 0, baseGoals, 0)).toBe(true);
  });
});

describe("getWeekStats", () => {
  it("counts workouts and cardios across 7 days", () => {
    const logs: Record<string, DayLog> = {
      "2026-04-13": { ...emptyLog("2026-04-13"), workout: "a", cardio: "c1" },
      "2026-04-14": { ...emptyLog("2026-04-14"), cardio: "c2" },
    };
    const weekStart = new Date("2026-04-13T12:00:00");
    const stats = getWeekStats(weekStart, (d) => logs[d] || emptyLog(d));
    expect(stats.weekWorkouts).toBe(1);
    expect(stats.weekCardios).toBe(2);
    expect(stats.dateStrings).toHaveLength(7);
    expect(stats.dateStrings[0]).toBe("2026-04-13");
  });
});

describe("areWeeklyGoalsMet", () => {
  it("both axes must pass when goals > 0", () => {
    expect(areWeeklyGoalsMet(4, 3, baseGoals)).toBe(true);
    expect(areWeeklyGoalsMet(3, 3, baseGoals)).toBe(false);
  });

  it("goal0 skips axis", () => {
    expect(areWeeklyGoalsMet(0, 0, { ...baseGoals, weeklyWorkouts: 0, weeklyCardios: 0 })).toBe(true);
  });
});

describe("challenge week block", () => {
  it("groups days 1–7, 8–14, … and ends with 85–90", () => {
    expect(challengeBlockDayRange(1)).toEqual({ firstDay: 1, lastDay: 7 });
    expect(challengeBlockDayRange(7)).toEqual({ firstDay: 1, lastDay: 7 });
    expect(challengeBlockDayRange(8)).toEqual({ firstDay: 8, lastDay: 14 });
    expect(challengeBlockDayRange(90)).toEqual({ firstDay: 85, lastDay: 90 });
  });

  it("milestone id is stable per block", () => {
    expect(challengeWeekMilestoneId(1, 7)).toBe("week-challenge-1-7");
    expect(challengeWeekMilestoneId(85, 90)).toBe("week-challenge-85-90");
  });

  it("getChallengeBlockStats uses challenge dates and returns ID sets", () => {
    const start = "2026-04-01";
    const stats = getChallengeBlockStats(start, 1, 7, (d) =>
      d === "2026-04-02" ? { ...emptyLog(d), workout: "a", cardio: "c1" } : emptyLog(d),
    );
    expect(stats.weekWorkouts).toBe(1);
    expect(stats.weekCardios).toBe(1);
    expect(stats.dateStrings[0]).toBe("2026-04-01");
    expect(stats.dateStrings).toHaveLength(7);
    expect(stats.weekWorkoutIds).toEqual(new Set(["a"]));
    expect(stats.weekCardioIds).toEqual(new Set(["c1"]));
  });

  it("getChallengeBlockStats counts days (not unique IDs) for weekWorkouts/weekCardios", () => {
    const start = "2026-04-01";
    const stats = getChallengeBlockStats(start, 1, 7, (d) => {
      if (d === "2026-04-01") return { ...emptyLog(d), workout: "a", cardio: "c1" };
      if (d === "2026-04-03") return { ...emptyLog(d), workout: "a", cardio: "c1" };
      return emptyLog(d);
    });
    expect(stats.weekWorkouts).toBe(2);
    expect(stats.weekCardios).toBe(2);
    expect(stats.weekWorkoutIds).toEqual(new Set(["a"]));
    expect(stats.weekCardioIds).toEqual(new Set(["c1"]));
  });

  it("defaultChallengeViewBlockFirstDay picks block from today or edges", () => {
    const gd = (d: string) => {
      if (d < "2026-04-01" || d > "2026-06-29") return null;
      const start = new Date("2026-04-01T00:00:00");
      const cur = new Date(d + "T00:00:00");
      const diff = Math.floor((cur.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff < 90 ? diff + 1 : null;
    };
    expect(defaultChallengeViewBlockFirstDay("2026-04-01", "2026-04-10", gd)).toBe(8);
    expect(defaultChallengeViewBlockFirstDay("2026-04-01", "2026-03-01", gd)).toBe(1);
    expect(defaultChallengeViewBlockFirstDay("2026-04-01", "2026-07-15", gd)).toBe(85);
  });
});

describe("getDailySuggestion", () => {
  const schedule: DailyScheduleEntry[] = [
    { workoutId: "w1", cardioId: "c1", label: "Upper A + Core A" },
    { workoutId: "w2", cardioId: "c2", label: "Lower A + Core B" },
    {                   cardioId: "c4", label: "Descanso + Core leve" },
    { workoutId: "w3", cardioId: "c3", label: "Upper B + Core C" },
    { workoutId: "w4", cardioId: "c1", label: "Lower B + Core A" },
    {                   cardioId: "c4", label: "Descanso ativo + Core leve" },
    {                   cardioId: "c4", label: "Descanso total + Core leve" },
  ];

  it("day 1 maps to index 0", () => {
    expect(getDailySuggestion(1, schedule)).toEqual(schedule[0]);
  });

  it("day 7 maps to index 6", () => {
    expect(getDailySuggestion(7, schedule)).toEqual(schedule[6]);
  });

  it("cycles every 7 days: day 8 maps to index 0", () => {
    expect(getDailySuggestion(8, schedule)).toEqual(schedule[0]);
  });

  it("day 90 maps to index 5 ((90-1)%7 = 5)", () => {
    expect(getDailySuggestion(90, schedule)).toEqual(schedule[5]);
  });

  it("returns null for undefined schedule", () => {
    expect(getDailySuggestion(1, undefined)).toBeNull();
  });

  it("returns null for wrong-length schedule", () => {
    expect(getDailySuggestion(1, [])).toBeNull();
    expect(getDailySuggestion(1, [schedule[0]])).toBeNull();
  });
});

describe("getPillarSuggestion", () => {
  const schedule: DailyScheduleEntry[] = [
    { workoutId: "w1", cardioId: "c1", label: "Upper A + Core A" },
    { workoutId: "w2", cardioId: "c2", label: "Lower A + Core B" },
    {                   cardioId: "c4", label: "Descanso + Core leve" },
    { workoutId: "w3", cardioId: "c3", label: "Upper B + Core C" },
    { workoutId: "w4", cardioId: "c1", label: "Lower B + Core A" },
    {                   cardioId: "c4", label: "Descanso ativo" },
    {                   cardioId: "c4", label: "Descanso total" },
  ];

  const workoutTemplates = [
    { id: "w1", name: "Upper A" },
    { id: "w2", name: "Lower A" },
    { id: "w3", name: "Upper B" },
    { id: "w4", name: "Lower B" },
  ];

  const cardioTemplates = [
    { id: "c1", name: "Core A" },
    { id: "c2", name: "Core B" },
    { id: "c3", name: "Core C" },
    { id: "c4", name: "Core Leve" },
  ];

  it("returns 'suggested' when schedule has workout for today and not done", () => {
    const result = getPillarSuggestion({
      pillar: "workout",
      dayNumber: 1,
      todayLog: emptyLog("2026-04-01"),
      schedule,
      blockDoneIds: new Set(),
      templates: workoutTemplates,
    });
    expect(result).toEqual({ status: "suggested", templateId: "w1", templateName: "Upper A" });
  });

  it("returns 'done' when today's log already has the pillar registered", () => {
    const result = getPillarSuggestion({
      pillar: "workout",
      dayNumber: 1,
      todayLog: { ...emptyLog("2026-04-01"), workout: "w1" },
      schedule,
      blockDoneIds: new Set(),
      templates: workoutTemplates,
    });
    expect(result).toEqual({ status: "done" });
  });

  it("returns 'done' when workout logged on a rest day", () => {
    const result = getPillarSuggestion({
      pillar: "workout",
      dayNumber: 3,
      todayLog: { ...emptyLog("2026-04-03"), workout: "w2" },
      schedule,
      blockDoneIds: new Set(),
      templates: workoutTemplates,
    });
    expect(result).toEqual({ status: "done" });
  });

  it("returns 'rest' when it's a rest day and all scheduled workouts are done", () => {
    const result = getPillarSuggestion({
      pillar: "workout",
      dayNumber: 3,
      todayLog: emptyLog("2026-04-03"),
      schedule,
      blockDoneIds: new Set(["w1", "w2", "w3", "w4"]),
      templates: workoutTemplates,
    });
    expect(result).toEqual({ status: "rest" });
  });

  it("returns 'catchup-single' when rest day with 1 pending workout", () => {
    const result = getPillarSuggestion({
      pillar: "workout",
      dayNumber: 3,
      todayLog: emptyLog("2026-04-03"),
      schedule,
      blockDoneIds: new Set(["w1", "w2", "w4"]),
      templates: workoutTemplates,
    });
    expect(result).toEqual({
      status: "catchup-single",
      templateId: "w3",
      templateName: "Upper B",
    });
  });

  it("returns 'catchup-multi' when rest day with 2+ pending workouts", () => {
    const result = getPillarSuggestion({
      pillar: "workout",
      dayNumber: 3,
      todayLog: emptyLog("2026-04-03"),
      schedule,
      blockDoneIds: new Set(["w1"]),
      templates: workoutTemplates,
    });
    expect(result).toEqual({
      status: "catchup-multi",
      pendingIds: ["w2", "w3", "w4"],
      pendingCount: 3,
    });
  });

  it("uses the real current day when evaluating a future rest-day page", () => {
    const result = getPillarSuggestion({
      pillar: "workout",
      dayNumber: 3,
      referenceDayNumber: 2,
      todayLog: emptyLog("2026-04-03"),
      schedule,
      blockDoneIds: new Set(["w1"]),
      templates: workoutTemplates,
    });
    expect(result).toEqual({ status: "rest" });
  });

  it("marks a viewed past scheduled day as pending once it is overdue in real time", () => {
    const result = getPillarSuggestion({
      pillar: "workout",
      dayNumber: 1,
      referenceDayNumber: 3,
      todayLog: emptyLog("2026-04-01"),
      schedule,
      blockDoneIds: new Set(),
      templates: workoutTemplates,
    });
    expect(result).toEqual({
      status: "catchup-single",
      templateId: "w1",
      templateName: "Upper A",
    });
  });

  it("works for cardio pillar — suggested", () => {
    const result = getPillarSuggestion({
      pillar: "cardio",
      dayNumber: 1,
      todayLog: emptyLog("2026-04-01"),
      schedule,
      blockDoneIds: new Set(),
      templates: cardioTemplates,
    });
    expect(result).toEqual({ status: "suggested", templateId: "c1", templateName: "Core A" });
  });

  it("cardio on rest day (day 3 has cardio c4 but no workout) — 'suggested' for cardio", () => {
    const result = getPillarSuggestion({
      pillar: "cardio",
      dayNumber: 3,
      todayLog: emptyLog("2026-04-03"),
      schedule,
      blockDoneIds: new Set(),
      templates: cardioTemplates,
    });
    expect(result).toEqual({ status: "suggested", templateId: "c4", templateName: "Core Leve" });
  });

  it("returns null when schedule is invalid", () => {
    expect(getPillarSuggestion({
      pillar: "workout",
      dayNumber: 1,
      todayLog: emptyLog("2026-04-01"),
      schedule: [],
      blockDoneIds: new Set(),
      templates: workoutTemplates,
    })).toBeNull();
  });
});
