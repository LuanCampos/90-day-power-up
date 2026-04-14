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
      expect(stored.workoutTemplates.length).toBeGreaterThan(0);
      expect(stored.cardioTemplates.length).toBeGreaterThan(0);
      expect(stored.weeklySchedule).toHaveLength(7);
      expect(stored.dayLogs).toEqual({});
      expect(stored.feedback?.celebratedMilestones).toEqual([]);
    });
  });

  it("reidratação: normaliza JSON parcial e regrava no storage", async () => {
    writeRawChallengeJson({
      startDate: "2026-01-01",
      goals: { dailyCalories: 1500 },
      workoutTemplates: "not-an-array",
      cardioTemplates: null,
      dayLogs: null,
      feedback: {},
    });
    renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => {
      const stored = readPersistedChallenge();
      expect(stored.startDate).toBe("2026-01-01");
      expect(stored.goals).toEqual({ ...DEFAULT_GOALS, dailyCalories: 1500 });
      expect(stored.workoutTemplates.length).toBeGreaterThan(0);
      expect(stored.cardioTemplates.length).toBeGreaterThan(0);
      expect(stored.dayLogs).toEqual({});
      expect(Array.isArray(stored.feedback?.celebratedMilestones)).toBe(true);
      expect(stored.feedback?.celebratedMilestones).toEqual([]);
    });
  });

  it("weeklySchedule: ausente no storage → default 7 entries; presente e válido → mantido", async () => {
    writeRawChallengeJson({ startDate: "2026-01-01" });
    renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => {
      const stored = readPersistedChallenge();
      expect(stored.weeklySchedule).toHaveLength(7);
      expect(stored.weeklySchedule![0].label).toBeTruthy();
    });

    const custom = Array.from({ length: 7 }, (_, i) => ({ label: `Day ${i + 1}` }));
    writeRawChallengeJson({ startDate: "2026-01-01", weeklySchedule: custom });
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => {
      expect(result.current.data.weeklySchedule).toEqual(custom);
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
      workoutTemplates: [{ id: "orphan", name: "X", order: 0, exercises: [] }],
      cardioTemplates: [],
      dayLogs: {
        "2026-04-13": {
          date: "2026-04-13",
          calories: [],
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

  it("setCardio persiste cardio template id no dia", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    act(() => {
      result.current.setCardio("2026-04-13", "ct-1");
    });
    await waitFor(() => {
      expect(readPersistedChallenge().dayLogs["2026-04-13"].cardio).toBe("ct-1");
    });
  });

  it("setCardio(undefined) remove cardio do log persistido", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    act(() => {
      result.current.setCardio("2026-04-13", "ct-1");
    });
    await waitFor(() => expect(readPersistedChallenge().dayLogs["2026-04-13"].cardio).toBe("ct-1"));
    act(() => {
      result.current.setCardio("2026-04-13", undefined);
    });
    await waitFor(() => {
      const log = readPersistedChallenge().dayLogs["2026-04-13"];
      expect("cardio" in log).toBe(false);
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
    const baseLen = readPersistedChallenge().workoutTemplates.length;
    act(() => {
      result.current.addWorkoutTemplate({ name: "Pernas", order: baseLen, exercises: [] });
    });
    await waitFor(() => {
      const tpls = readPersistedChallenge().workoutTemplates;
      expect(tpls).toHaveLength(baseLen + 1);
      const added = tpls[tpls.length - 1];
      expect(added.name).toBe("Pernas");
      expect(added.id).toBe("test-uuid-0");
    });
  });

  it("updateWorkoutTemplate altera nome mantendo id", async () => {
    const tpl: WorkoutTemplate = { id: "fixed-id", name: "Costas", order: 0, exercises: [] };
    writeRawChallengeJson({
      startDate: null,
      goals: DEFAULT_GOALS,
      workoutTemplates: [tpl],
      cardioTemplates: [],
      dayLogs: {},
      feedback: { celebratedMilestones: [] },
    });
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(readPersistedChallenge().workoutTemplates).toHaveLength(1));
    act(() => {
      result.current.updateWorkoutTemplate({ ...tpl, name: "Costas B" });
    });
    await waitFor(() => {
      expect(readPersistedChallenge().workoutTemplates[0]).toMatchObject({
        id: "fixed-id",
        name: "Costas B",
      });
    });
  });

  it("removeWorkoutTemplate remove o item da lista", async () => {
    const a: WorkoutTemplate = { id: "a", name: "A", order: 0, exercises: [] };
    const b: WorkoutTemplate = { id: "b", name: "B", order: 1, exercises: [] };
    writeRawChallengeJson({
      startDate: null,
      goals: DEFAULT_GOALS,
      workoutTemplates: [a, b],
      cardioTemplates: [],
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

  it("addCardioTemplate persiste template com id gerado", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    const baseLen = readPersistedChallenge().cardioTemplates.length;
    act(() => {
      result.current.addCardioTemplate({ name: "HIIT", order: baseLen });
    });
    await waitFor(() => {
      const tpls = readPersistedChallenge().cardioTemplates;
      expect(tpls).toHaveLength(baseLen + 1);
      const added = tpls[tpls.length - 1];
      expect(added.name).toBe("HIIT");
      expect(added.id).toBe("test-uuid-0");
    });
  });

  it("removeCardioTemplate remove o item da lista", async () => {
    writeRawChallengeJson({
      startDate: null,
      goals: DEFAULT_GOALS,
      workoutTemplates: [],
      cardioTemplates: [
        { id: "ca", name: "Core A", order: 0 },
        { id: "cb", name: "Core B", order: 1 },
      ],
      dayLogs: {},
      feedback: { celebratedMilestones: [] },
    });
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(readPersistedChallenge().cardioTemplates).toHaveLength(2));
    act(() => {
      result.current.removeCardioTemplate("ca");
    });
    await waitFor(() => {
      expect(readPersistedChallenge().cardioTemplates).toHaveLength(1);
      expect(readPersistedChallenge().cardioTemplates[0].id).toBe("cb");
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

  it("session management: start, update, clear", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    act(() => {
      result.current.startSession({
        type: "workout",
        templateId: "w1",
        date: "2026-04-13",
        exerciseProgress: {},
        currentExerciseIndex: 0,
      });
    });
    await waitFor(() => {
      expect(readPersistedChallenge().activeSession?.templateId).toBe("w1");
    });
    act(() => {
      result.current.updateSession({ currentExerciseIndex: 2 });
    });
    await waitFor(() => {
      expect(readPersistedChallenge().activeSession?.currentExerciseIndex).toBe(2);
    });
    act(() => {
      result.current.clearSession();
    });
    await waitFor(() => {
      expect(readPersistedChallenge().activeSession).toBeUndefined();
    });
  });

  it("resetChallenge volta ao estado default persistido", async () => {
    writeRawChallengeJson({
      startDate: "2026-01-01",
      goals: { ...DEFAULT_GOALS, dailyCalories: 1 },
      workoutTemplates: [{ id: "x", name: "X", order: 0, exercises: [] }],
      cardioTemplates: [{ id: "c", name: "C", order: 0 }],
      dayLogs: { "2026-04-13": { date: "2026-04-13", calories: [], cardio: "c" } },
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
      expect(stored.workoutTemplates.length).toBeGreaterThan(0);
      expect(stored.cardioTemplates.length).toBeGreaterThan(0);
      expect(stored.dayLogs).toEqual({});
      expect(stored.feedback?.celebratedMilestones).toEqual([]);
    });
  });
});

describe("ChallengeProvider reads", () => {
  it("getDayLog retorna shape default para dia sem log", async () => {
    const { result } = renderHook(() => useChallenge(), { wrapper });
    await waitFor(() => expect(localStorage.getItem(CHALLENGE_STORAGE_KEY)).not.toBeNull());
    const log = result.current.getDayLog("2026-04-13");
    expect(log.date).toBe("2026-04-13");
    expect(log.calories).toEqual([]);
    expect(log.cardio).toBeUndefined();
    expect(log.workout).toBeUndefined();
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
