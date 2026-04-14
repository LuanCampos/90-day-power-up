import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearChallengeStorage,
  DEFAULT_GOALS,
  installSequentialUuidMock,
  readPersistedChallenge,
  renderWithChallengeRouter,
  writeRawChallengeJson,
} from "@/test/challenge-test-utils";
import { ChallengeProvider } from "@/contexts/ChallengeContext";
import { reactRouterFutureFlags } from "@/lib/react-router-future";
import SettingsPage from "@/pages/SettingsPage";
import SetupPage from "@/pages/SetupPage";

function renderSettings() {
  return renderWithChallengeRouter(
    <Routes>
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/" element={<div />} />
    </Routes>,
    { initialEntries: ["/settings"] },
  );
}

function seedStartedChallenge() {
  writeRawChallengeJson({
    startDate: "2026-04-01",
    goals: DEFAULT_GOALS,
    workoutTemplates: [],
    cardioTemplates: [],
    dayLogs: {},
    feedback: { celebratedMilestones: [] },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SettingsPage", () => {
  beforeEach(() => {
    clearChallengeStorage();
    installSequentialUuidMock();
    seedStartedChallenge();
  });

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

describe("SettingsPage redirect", () => {
  beforeEach(() => {
    clearChallengeStorage();
    installSequentialUuidMock();
  });

  it("sem startDate redireciona para /setup", async () => {
    render(
      <MemoryRouter initialEntries={["/settings"]} future={reactRouterFutureFlags}>
        <ChallengeProvider>
          <Routes>
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/setup" element={<SetupPage />} />
          </Routes>
        </ChallengeProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Desafio 90 Dias/i })).toBeInTheDocument();
    });
  });
});
