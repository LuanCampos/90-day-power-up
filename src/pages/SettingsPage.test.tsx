import React from "react";
import { Routes, Route } from "react-router-dom";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearChallengeStorage,
  DEFAULT_GOALS,
  installSequentialUuidMock,
  readPersistedChallenge,
  renderWithChallengeRouter,
} from "@/test/challenge-test-utils";
import SettingsPage from "@/pages/SettingsPage";

function renderSettings() {
  return renderWithChallengeRouter(
    <Routes>
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/" element={<div />} />
    </Routes>,
    { initialEntries: ["/settings"] },
  );
}

beforeEach(() => {
  clearChallengeStorage();
  installSequentialUuidMock();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SettingsPage", () => {
  it("Salvar Metas persiste goals no localStorage", async () => {
    const user = userEvent.setup();
    renderSettings();
    await waitFor(() => expect(localStorage.getItem("fitness-challenge-90")).not.toBeNull());

    const spinbuttons = screen.getAllByRole("spinbutton");
    expect(spinbuttons.length).toBeGreaterThanOrEqual(4);
    await user.clear(spinbuttons[0]);
    await user.type(spinbuttons[0], "2200");

    await user.click(screen.getByRole("button", { name: /Salvar Metas/i }));

    await waitFor(() => {
      const stored = readPersistedChallenge();
      expect(stored.goals.dailyCalories).toBe(2200);
      expect(stored.goals.dailySleepHours).toBe(DEFAULT_GOALS.dailySleepHours);
      expect(stored.goals.weeklyCardios).toBe(DEFAULT_GOALS.weeklyCardios);
      expect(stored.goals.weeklyWorkouts).toBe(DEFAULT_GOALS.weeklyWorkouts);
    });
  });
});
