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
import WorkoutsPage from "@/pages/WorkoutsPage";
import SetupPage from "@/pages/SetupPage";

function renderWorkouts() {
  return renderWithChallengeRouter(
    <Routes>
      <Route path="/workouts" element={<WorkoutsPage />} />
      <Route path="/workouts/:id" element={<div>Detail</div>} />
    </Routes>,
    { initialEntries: ["/workouts"] },
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

describe("WorkoutsPage", () => {
  beforeEach(() => {
    clearChallengeStorage();
    installSequentialUuidMock();
    seedStartedChallenge();
  });

  it("adicionar treino pela UI persiste no localStorage", async () => {
    const user = userEvent.setup();
    renderWorkouts();
    await waitFor(() => expect(localStorage.getItem("fitness-challenge-90")).not.toBeNull());

    await user.type(screen.getByPlaceholderText(/Nome do treino/i), "Pernas");
    await user.click(screen.getByRole("button", { name: /Adicionar/i }));

    await waitFor(() => {
      const tpls = readPersistedChallenge().workoutTemplates;
      expect(tpls).toHaveLength(1);
      expect(tpls[0]).toMatchObject({ id: "test-uuid-0", name: "Pernas" });
    });
  });

  it("remover treino pela UI persiste no localStorage", async () => {
    const user = userEvent.setup();
    renderWorkouts();
    await waitFor(() => expect(localStorage.getItem("fitness-challenge-90")).not.toBeNull());

    await user.type(screen.getByPlaceholderText(/Nome do treino/i), "A");
    await user.click(screen.getByRole("button", { name: /Adicionar/i }));
    await waitFor(() => screen.getByText("A"));

    await user.click(screen.getByRole("button", { name: /Remover treino A/i }));

    await waitFor(() => {
      expect(readPersistedChallenge().workoutTemplates).toEqual([]);
    });
  });
});

describe("WorkoutsPage redirect", () => {
  beforeEach(() => {
    clearChallengeStorage();
    installSequentialUuidMock();
  });

  it("sem startDate redireciona para /setup", async () => {
    render(
      <MemoryRouter initialEntries={["/workouts"]} future={reactRouterFutureFlags}>
        <ChallengeProvider>
          <Routes>
            <Route path="/workouts" element={<WorkoutsPage />} />
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
