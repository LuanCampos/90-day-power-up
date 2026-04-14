import type { ReactElement } from "react";
import React from "react";
import { render } from "@testing-library/react";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ChallengeProvider } from "@/contexts/ChallengeContext";
import { reactRouterFutureFlags } from "@/lib/react-router-future";
import type { ChallengeData } from "@/types/challenge";

/** Must stay in sync with `STORAGE_KEY` in `ChallengeContext.tsx`. */
export const CHALLENGE_STORAGE_KEY = "fitness-challenge-90";

export const DEFAULT_GOALS: ChallengeData["goals"] = {
  dailyCalories: 2000,
  dailySleepHours: 8,
  weeklyCardios: 3,
  weeklyWorkouts: 4,
};

export function clearChallengeStorage() {
  localStorage.removeItem(CHALLENGE_STORAGE_KEY);
}

export function readPersistedChallenge(): ChallengeData {
  const raw = localStorage.getItem(CHALLENGE_STORAGE_KEY);
  if (raw === null) throw new Error("Expected challenge data in localStorage");
  return JSON.parse(raw) as ChallengeData;
}

export function writeRawChallengeJson(value: unknown) {
  localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(value));
}

let uuidCounter = 0;

/** Deterministic ids for `addCalorie` / `addWorkoutTemplate`. */
export function installSequentialUuidMock() {
  uuidCounter = 0;
  vi.stubGlobal("crypto", {
    randomUUID: () => `test-uuid-${uuidCounter++}`,
  });
}

export function renderWithChallengeRouter(
  ui: ReactElement,
  options?: { initialEntries?: string[] },
) {
  const initialEntries = options?.initialEntries ?? ["/"];
  return render(
    <MemoryRouter initialEntries={initialEntries} future={reactRouterFutureFlags}>
      <ChallengeProvider>{ui}</ChallengeProvider>
    </MemoryRouter>,
  );
}
