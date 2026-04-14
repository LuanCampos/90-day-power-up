import { describe, expect, it } from "vitest";
import {
  areWeeklyGoalsMet,
  challengeBlockDayRange,
  challengeWeekMilestoneId,
  defaultChallengeViewBlockFirstDay,
  getChallengeBlockStats,
  getDailyCaloriesTotal,
  getWeekStats,
  isCalorieGoalMet,
  isCalorieDayReviewOk,
  isDayFullyComplete,
  isSleepGoalMet,
  isWorkoutPillarMet,
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
});

describe("isSleepGoalMet", () => {
  it("met when logged hours between 80% and 140% of goal (inclusive)", () => {
    const at80: DayLog = { ...emptyLog("2026-04-13"), sleepHours: 6.4 };
    expect(isSleepGoalMet(at80, baseGoals)).toBe(true);
    const at100: DayLog = { ...emptyLog("2026-04-13"), sleepHours: 8 };
    expect(isSleepGoalMet(at100, baseGoals)).toBe(true);
    const at140: DayLog = { ...emptyLog("2026-04-13"), sleepHours: 11.2 };
    expect(isSleepGoalMet(at140, baseGoals)).toBe(true);
  });

  it("not met below 80% or above 140% or when not logged", () => {
    const low: DayLog = { ...emptyLog("2026-04-13"), sleepHours: 6.3 };
    expect(isSleepGoalMet(low, baseGoals)).toBe(false);
    const high: DayLog = { ...emptyLog("2026-04-13"), sleepHours: 11.3 };
    expect(isSleepGoalMet(high, baseGoals)).toBe(false);
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

  it("getChallengeBlockStats uses challenge dates", () => {
    const start = "2026-04-01";
    const stats = getChallengeBlockStats(start, 1, 7, (d) =>
      d === "2026-04-02" ? { ...emptyLog(d), workout: "a", cardio: { done: true } } : emptyLog(d),
    );
    expect(stats.weekWorkouts).toBe(1);
    expect(stats.weekCardios).toBe(1);
    expect(stats.dateStrings[0]).toBe("2026-04-01");
    expect(stats.dateStrings).toHaveLength(7);
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
