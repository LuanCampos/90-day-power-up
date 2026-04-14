import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
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
    </Routes>,
    { initialEntries: ["/workouts"] },
  );
}

function seedStartedChallenge() {
  writeRawChallengeJson({
    startDate: "2026-04-01",
    goals: DEFAULT_GOALS,
    workoutTemplates: [],
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
      expect(readPersistedChallenge().workoutTemplates).toEqual([
        { id: "test-uuid-0", name: "Pernas", order: 0 },
      ]);
    });
  });

  it("editar nome inline persiste no localStorage", async () => {
    const user = userEvent.setup();
    renderWorkouts();
    await waitFor(() => expect(localStorage.getItem("fitness-challenge-90")).not.toBeNull());

    await user.type(screen.getByPlaceholderText(/Nome do treino/i), "Costas");
    await user.click(screen.getByRole("button", { name: /Adicionar/i }));
    await waitFor(() => screen.getByDisplayValue("Costas"));

    const nameInput = screen.getByDisplayValue("Costas");
    await user.clear(nameInput);
    await user.type(nameInput, "Costas B");

    await waitFor(() => {
      expect(readPersistedChallenge().workoutTemplates[0].name).toBe("Costas B");
    });
  });

  it("remover treino pela UI persiste no localStorage", async () => {
    const user = userEvent.setup();
    renderWorkouts();
    await waitFor(() => expect(localStorage.getItem("fitness-challenge-90")).not.toBeNull());

    await user.type(screen.getByPlaceholderText(/Nome do treino/i), "A");
    await user.click(screen.getByRole("button", { name: /Adicionar/i }));
    await waitFor(() => screen.getByDisplayValue("A"));

    const row = screen.getByDisplayValue("A").closest(".group");
    expect(row).toBeTruthy();
    await user.click(within(row as HTMLElement).getByRole("button"));

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
