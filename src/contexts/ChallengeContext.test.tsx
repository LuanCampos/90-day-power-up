import React, { type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChallengeProvider, useChallenge } from "@/contexts/ChallengeContext";
import {
  CHALLENGE_STORAGE_KEY,
  clearChallengeStorage,
  DEFAULT_GOALS,
  installSequentialUuidMock,
  readPersistedChallenge,
  writeRawChallengeJson,
} from "@/test/challenge-test-utils";
import type { ChallengeGoals, WorkoutTemplate } from "@/types/challenge";

const wrapper = ({ children }: { children: ReactNode }) => (
  <ChallengeProvider>{children}</ChallengeProvider>
);

beforeEach(() => {
  clearChallengeStorage();
  installSequentialUuidMock();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ChallengeProvider persistence", () => {
  it("bootstrap: persiste defaults quando storage está vazio", async () => {
    renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => {
      const stored = readPersistedChallenge();
      expect(stored.startDate).toBeNull();
      expect(stored.goals).toEqual(DEFAULT_GOALS);
      expect(stored.workoutTemplates).toEqual([]);
      expect(stored.dayLogs).toEqual({});
      expect(stored.feedback?.celebratedMilestones).toEqual([]);
    });
  });

  it("reidratação: normaliza JSON parcial e regrava no storage", async () => {
    writeRawChallengeJson({
      startDate: "2026-01-01",
      goals: { dailyCalories: 1500 },
      workoutTemplates: "not-an-array",
      dayLogs: null,
      feedback: {},
    });
    renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => {
      const stored = readPersistedChallenge();
      expect(stored.startDate).toBe("2026-01-01");
      expect(stored.goals).toEqual({ ...DEFAULT_GOALS, dailyCalories: 1500 });
      expect(stored.workoutTemplates).toEqual([]);
      expect(stored.dayLogs).toEqual({});
      expect(Array.isArray(stored.feedback?.celebratedMilestones)).toBe(true);
      expect(stored.feedback?.celebratedMilestones).toEqual([]);
    });
  });

  it("setStartDate persiste startDate", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    act(() => {
      result.current.setStartDate("2026-04-01");
    });
    await waitFor(() => {
      expect(readPersistedChallenge().startDate).toBe("2026-04-01");
    });
  });

  it("setGoals persiste metas completas", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    const next: ChallengeGoals = {
      dailyCalories: 1800,
      dailySleepHours: 7,
      weeklyCardios: 2,
      weeklyWorkouts: 5,
    };
    act(() => {
      result.current.setGoals(next);
    });
    await waitFor(() => {
      expect(readPersistedChallenge().goals).toEqual(next);
    });
  });

  it("addCalorie persiste entrada com id e campos", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    act(() => {
      result.current.addCalorie("2026-04-13", { amount: 400, label: "Almoço" });
    });
    await waitFor(() => {
      const log = readPersistedChallenge().dayLogs["2026-04-13"];
      expect(log.calories).toHaveLength(1);
      expect(log.calories[0]).toEqual({
        id: "test-uuid-0",
        amount: 400,
        label: "Almoço",
      });
    });
  });

  it("removeCalorie remove só o id alvo e preserva outro dia", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    act(() => {
      result.current.addCalorie("2026-04-13", { amount: 100 });
      result.current.addCalorie("2026-04-13", { amount: 200 });
      result.current.addCalorie("2026-04-14", { amount: 300 });
    });
    await waitFor(() => {
      expect(readPersistedChallenge().dayLogs["2026-04-13"].calories).toHaveLength(2);
    });
    act(() => {
      result.current.removeCalorie("2026-04-13", "test-uuid-0");
    });
    await waitFor(() => {
      const stored = readPersistedChallenge();
      expect(stored.dayLogs["2026-04-13"].calories).toEqual([
        { id: "test-uuid-1", amount: 200 },
      ]);
      expect(stored.dayLogs["2026-04-14"].calories).toEqual([
        { id: "test-uuid-2", amount: 300 },
      ]);
    });
  });

  it("setWorkout persiste template id no dia", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    act(() => {
      result.current.setWorkout("2026-04-13", "tpl-1");
    });
    await waitFor(() => {
      expect(readPersistedChallenge().dayLogs["2026-04-13"].workout).toBe("tpl-1");
    });
  });

  it("setWorkout(undefined) remove workout do log persistido", async () => {
    writeRawChallengeJson({
      startDate: null,
      goals: DEFAULT_GOALS,
      workoutTemplates: [],
      dayLogs: {
        "2026-04-13": {
          date: "2026-04-13",
          calories: [],
          cardio: { done: false },
          workout: "tpl-1",
        },
      },
      feedback: { celebratedMilestones: [] },
    });
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(readPersistedChallenge().dayLogs["2026-04-13"].workout).toBe("tpl-1"));
    act(() => {
      result.current.setWorkout("2026-04-13", undefined);
    });
    await waitFor(() => {
      const log = readPersistedChallenge().dayLogs["2026-04-13"];
      expect("workout" in log).toBe(false);
    });
  });

  it("setCardio persiste done, minutes e caloriesBurned", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    act(() => {
      result.current.setCardio("2026-04-13", {
        done: true,
        minutes: 30,
        caloriesBurned: 250,
      });
    });
    await waitFor(() => {
      expect(readPersistedChallenge().dayLogs["2026-04-13"].cardio).toEqual({
        done: true,
        minutes: 30,
        caloriesBurned: 250,
      });
    });
  });

  it("setSleep persiste sleepHours", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    act(() => {
      result.current.setSleep("2026-04-13", 7.5);
    });
    await waitFor(() => {
      expect(readPersistedChallenge().dayLogs["2026-04-13"].sleepHours).toBe(7.5);
    });
  });

  it("addWorkoutTemplate persiste template com id gerado", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    act(() => {
      result.current.addWorkoutTemplate({ name: "Pernas", order: 0 });
    });
    await waitFor(() => {
      expect(readPersistedChallenge().workoutTemplates).toEqual([
        { id: "test-uuid-0", name: "Pernas", order: 0 },
      ]);
    });
  });

  it("updateWorkoutTemplate altera nome mantendo id", async () => {
    const tpl: WorkoutTemplate = { id: "fixed-id", name: "Costas", order: 0 };
    writeRawChallengeJson({
      startDate: null,
      goals: DEFAULT_GOALS,
      workoutTemplates: [tpl],
      dayLogs: {},
      feedback: { celebratedMilestones: [] },
    });
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(readPersistedChallenge().workoutTemplates).toHaveLength(1));
    act(() => {
      result.current.updateWorkoutTemplate({ ...tpl, name: "Costas B" });
    });
    await waitFor(() => {
      expect(readPersistedChallenge().workoutTemplates[0]).toEqual({
        id: "fixed-id",
        name: "Costas B",
        order: 0,
      });
    });
  });

  it("removeWorkoutTemplate remove o item da lista", async () => {
    const a: WorkoutTemplate = { id: "a", name: "A", order: 0 };
    const b: WorkoutTemplate = { id: "b", name: "B", order: 1 };
    writeRawChallengeJson({
      startDate: null,
      goals: DEFAULT_GOALS,
      workoutTemplates: [a, b],
      dayLogs: {},
      feedback: { celebratedMilestones: [] },
    });
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(readPersistedChallenge().workoutTemplates).toHaveLength(2));
    act(() => {
      result.current.removeWorkoutTemplate("a");
    });
    await waitFor(() => {
      expect(readPersistedChallenge().workoutTemplates).toEqual([b]);
    });
  });

  it("removeWorkoutTemplate não remove dayLogs com workout id órfão (comportamento atual)", async () => {
    writeRawChallengeJson({
      startDate: null,
      goals: DEFAULT_GOALS,
      workoutTemplates: [{ id: "orphan", name: "X", order: 0 }],
      dayLogs: {
        "2026-04-13": {
          date: "2026-04-13",
          calories: [],
          cardio: { done: false },
          workout: "orphan",
        },
      },
      feedback: { celebratedMilestones: [] },
    });
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(readPersistedChallenge().workoutTemplates).toHaveLength(1));
    act(() => {
      result.current.removeWorkoutTemplate("orphan");
    });
    await waitFor(() => {
      const stored = readPersistedChallenge();
      expect(stored.workoutTemplates).toEqual([]);
      expect(stored.dayLogs["2026-04-13"].workout).toBe("orphan");
    });
  });

  it("addCelebratedMilestone persiste id em feedback", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    act(() => {
      result.current.addCelebratedMilestone("week-challenge-1-7");
    });
    await waitFor(() => {
      expect(readPersistedChallenge().feedback?.celebratedMilestones).toEqual(["week-challenge-1-7"]);
    });
  });

  it("addCelebratedMilestone não duplica o mesmo id", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    act(() => {
      result.current.addCelebratedMilestone("m-1");
      result.current.addCelebratedMilestone("m-1");
    });
    await waitFor(() => {
      expect(readPersistedChallenge().feedback?.celebratedMilestones).toEqual(["m-1"]);
    });
  });

  it("resetChallenge volta ao estado default persistido", async () => {
    writeRawChallengeJson({
      startDate: "2026-01-01",
      goals: { ...DEFAULT_GOALS, dailyCalories: 1 },
      workoutTemplates: [{ id: "x", name: "X", order: 0 }],
      dayLogs: { "2026-04-13": { date: "2026-04-13", calories: [], cardio: { done: true } } },
      feedback: { celebratedMilestones: ["x"] },
    });
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(readPersistedChallenge().startDate).toBe("2026-01-01"));
    act(() => {
      result.current.resetChallenge();
    });
    await waitFor(() => {
      const stored = readPersistedChallenge();
      expect(stored.startDate).toBeNull();
      expect(stored.goals).toEqual(DEFAULT_GOALS);
      expect(stored.workoutTemplates).toEqual([]);
      expect(stored.dayLogs).toEqual({});
      expect(stored.feedback?.celebratedMilestones).toEqual([]);
    });
  });
});

describe("ChallengeProvider reads", () => {
  it("getDayLog retorna shape default para dia sem log", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    expect(result.current.getDayLog("2026-04-13")).toEqual({
      date: "2026-04-13",
      calories: [],
      cardio: { done: false },
    });
  });

  it("getDayNumber retorna null sem startDate", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    expect(result.current.getDayNumber("2026-04-01")).toBeNull();
  });

  it("getDayNumber retorna dia dentro do intervalo e null fora", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    act(() => {
      result.current.setStartDate("2026-04-01");
    });
    await waitFor(() => expect(readPersistedChallenge().startDate).toBe("2026-04-01"));
    expect(result.current.getDayNumber("2026-04-01")).toBe(1);
    expect(result.current.getDayNumber("2026-04-13")).toBe(13);
    expect(result.current.getDayNumber("2026-03-31")).toBeNull();
    expect(result.current.getDayNumber("2026-06-29")).toBe(90);
    expect(result.current.getDayNumber("2026-06-30")).toBeNull();
  });
});
