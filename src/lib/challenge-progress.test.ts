import { describe, expect, it } from "vitest";
import {
  areWeeklyGoalsMet,
  getDailyCaloriesTotal,
  getWeekCelebrationKey,
  getWeekStats,
  isCalorieGoalMet,
  isDayFullyComplete,
  isSleepGoalMet,
  isWorkoutPillarMet,
  weekMilestoneId,
} from "@/lib/challenge-progress";
import type { ChallengeGoals, DayLog } from "@/types/challenge";

const baseGoals: ChallengeGoals = {
  dailyCalories: 2000,
  dailySleepHours: 8,
  weeklyCardios: 3,
  weeklyWorkouts: 4,
};

function emptyLog(date: string): DayLog {
  return { date, calories: [], cardio: { done: false } };
}

describe("getDailyCaloriesTotal", () => {
  it("sums entries", () => {
    const log: DayLog = {
      date: "2026-04-13",
      calories: [
        { id: "1", amount: 500 },
        { id: "2", amount: 300 },
      ],
      cardio: { done: false },
    };
    expect(getDailyCaloriesTotal(log)).toBe(800);
  });
});

describe("isCalorieGoalMet", () => {
  it("requires total > 0 when goal > 0", () => {
    const log = emptyLog("2026-04-13");
    expect(isCalorieGoalMet(log, baseGoals)).toBe(false);
  });

  it("met when >= goal with positive intake", () => {
    const log: DayLog = {
      ...emptyLog("2026-04-13"),
      calories: [{ id: "1", amount: 2000 }],
    };
    expect(isCalorieGoalMet(log, baseGoals)).toBe(true);
  });

  it("goal <= 0 treats pillar as N/A", () => {
    const log = emptyLog("2026-04-13");
    expect(isCalorieGoalMet(log, { ...baseGoals, dailyCalories: 0 })).toBe(true);
  });
});

describe("isSleepGoalMet", () => {
  it("met when hours >= goal", () => {
    const log: DayLog = { ...emptyLog("2026-04-13"), sleepHours: 8 };
    expect(isSleepGoalMet(log, baseGoals)).toBe(true);
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

describe("isDayFullyComplete", () => {
  it("true when all pillars met", () => {
    const log: DayLog = {
      date: "2026-04-13",
      calories: [{ id: "1", amount: 2000 }],
      workout: "w1",
      cardio: { done: true },
      sleepHours: 8,
    };
    expect(isDayFullyComplete(log, baseGoals, 1)).toBe(true);
  });

  it("false if cardio missing", () => {
    const log: DayLog = {
      date: "2026-04-13",
      calories: [{ id: "1", amount: 2000 }],
      workout: "w1",
      cardio: { done: false },
      sleepHours: 8,
    };
    expect(isDayFullyComplete(log, baseGoals, 1)).toBe(false);
  });
});

describe("getWeekStats", () => {
  it("counts workouts and cardios across 7 days", () => {
    const logs: Record<string, DayLog> = {
      "2026-04-13": { ...emptyLog("2026-04-13"), workout: "a", cardio: { done: true } },
      "2026-04-14": { ...emptyLog("2026-04-14"), cardio: { done: true } },
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

describe("week keys", () => {
  it("stable milestone id for a Monday", () => {
    const monday = new Date("2026-04-13T12:00:00");
    expect(getWeekCelebrationKey(monday)).toMatch(/^\d{4}-W\d{2}$/);
    expect(weekMilestoneId(monday)).toBe(`week-${getWeekCelebrationKey(monday)}`);
  });
});
