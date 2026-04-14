import React from "react";
import { Routes, Route } from "react-router-dom";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearChallengeStorage,
  installSequentialUuidMock,
  readPersistedChallenge,
  renderWithChallengeRouter,
} from "@/test/challenge-test-utils";
import WorkoutsPage from "@/pages/WorkoutsPage";

function renderWorkouts() {
  return renderWithChallengeRouter(
    <Routes>
      <Route path="/workouts" element={<WorkoutsPage />} />
    </Routes>,
    { initialEntries: ["/workouts"] },
  );
}

beforeEach(() => {
  clearChallengeStorage();
  installSequentialUuidMock();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WorkoutsPage", () => {
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
