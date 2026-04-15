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
import DayDetailPage from "@/pages/DayDetailPage";
import SetupPage from "@/pages/SetupPage";

vi.mock("@/components/CelebrationOverlay", () => ({
  useCelebration: () => ({
    celebrate: vi.fn(),
    overlay: null,
  }),
}));

function seedDayDetailFixture() {
  writeRawChallengeJson({
    startDate: "2026-04-01",
    goals: DEFAULT_GOALS,
    workoutTemplates: [{ id: "tpl-1", name: "Upper", order: 0, exercises: [] }],
    cardioTemplates: [{ id: "ct-1", name: "Core A", order: 0 }],
    dayLogs: {},
    feedback: { celebratedMilestones: [] },
  });
}

function renderDayDetail() {
  return renderWithChallengeRouter(
    <Routes>
      <Route path="/day/:date" element={<DayDetailPage />} />
      <Route path="/session/workout/:id" element={<div>Workout Session</div>} />
      <Route path="/session/cardio/:id" element={<div>Cardio Session</div>} />
    </Routes>,
    { initialEntries: ["/day/2026-04-13"] },
  );
}

function getCaloriesCard() {
  const heading = screen.getByRole("heading", { name: /Calorias/i });
  const card = heading.closest(".rounded-2xl");
  if (!card) throw new Error("Calories card not found");
  return card as HTMLElement;
}

describe("DayDetailPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("com desafio iniciado", () => {
    beforeEach(() => {
      clearChallengeStorage();
      installSequentialUuidMock();
      seedDayDetailFixture();
    });

  it("adicionar calorias pela UI persiste no localStorage", async () => {
    const user = userEvent.setup();
    renderDayDetail();
    await waitFor(() => expect(readPersistedChallenge().startDate).toBe("2026-04-01"));

    await user.type(screen.getByPlaceholderText("kcal"), "500");
    await user.type(screen.getByPlaceholderText(/Descrição/i), "Lanche");
    const calCard = getCaloriesCard();
    const buttons = within(calCard).getAllByRole("button");
    await user.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(readPersistedChallenge().dayLogs["2026-04-13"].calories).toEqual([
        { id: "test-uuid-0", amount: 500, label: "Lanche" },
      ]);
    });
  });

  it("remover caloria pela UI persiste no localStorage", async () => {
    const user = userEvent.setup();
    writeRawChallengeJson({
      startDate: "2026-04-01",
      goals: DEFAULT_GOALS,
      workoutTemplates: [],
      cardioTemplates: [],
      dayLogs: {
        "2026-04-13": {
          date: "2026-04-13",
          calories: [{ id: "keep-me", amount: 100 }],
        },
      },
      feedback: { celebratedMilestones: [] },
    });
    renderDayDetail();
    await waitFor(() => screen.getByText("100 kcal"));

    const calCard = getCaloriesCard();
    await user.click(within(calCard).getAllByRole("button")[0]);

    await waitFor(() => {
      expect(readPersistedChallenge().dayLogs["2026-04-13"].calories).toEqual([]);
    });
  });

  it("salvar sono pela UI persiste no localStorage", async () => {
    const user = userEvent.setup();
    renderDayDetail();
    await waitFor(() => expect(readPersistedChallenge().startDate).toBe("2026-04-01"));

    await user.type(screen.getByPlaceholderText(/Horas de sono/i), "7.5");
    await user.click(screen.getByRole("button", { name: /^Salvar$/i }));

    await waitFor(() => {
      expect(readPersistedChallenge().dayLogs["2026-04-13"].sleepHours).toBe(7.5);
    });
  });

  it("selecionar treino abre dialog e 'Marcar como feito' persiste workout id", async () => {
    const user = userEvent.setup();
    renderDayDetail();
    await waitFor(() => screen.getByRole("button", { name: /Upper/i }));

    await user.click(screen.getByRole("button", { name: /Upper/i }));
    await waitFor(() => screen.getByText(/Marcar como feito/i));
    await user.click(screen.getByText(/Marcar como feito/i));

    await waitFor(() => {
      expect(readPersistedChallenge().dayLogs["2026-04-13"].workout).toBe("tpl-1");
    });
  });

  it("exibe banner de pendência quando há catch-up no bloco", async () => {
    renderDayDetail();
    await waitFor(() => screen.getByText(/Pendente da semana/i));
    expect(screen.getByText(/Pendente da semana/i)).toBeInTheDocument();
  });

  it("exibe banner de sugestão do dia quando não há catch-up", async () => {
    writeRawChallengeJson({
      startDate: "2026-04-01",
      goals: DEFAULT_GOALS,
      workoutTemplates: [{ id: "w1", name: "Upper", order: 0, exercises: [] }],
      cardioTemplates: [{ id: "c1", name: "Core A", order: 0 }],
      weeklySchedule: [
        { label: "Descanso" },
        { label: "Descanso" },
        { label: "Descanso" },
        { label: "Descanso" },
        { label: "Descanso" },
        { workoutId: "w1", cardioId: "c1", label: "Upper + Core A" },
        { label: "Descanso" },
      ],
      dayLogs: {},
      feedback: { celebratedMilestones: [] },
    });
    renderDayDetail();
    await waitFor(() => screen.getByText(/Sugestão do dia/i));
    expect(screen.getByText(/Sugestão do dia/i)).toBeInTheDocument();
  });

  it("cardio sem youtube link abre dialog e 'Marcar como feito' persiste cardio id", async () => {
    const user = userEvent.setup();
    renderDayDetail();
    await waitFor(() => screen.getByRole("button", { name: /Core A/i }));

    await user.click(screen.getByRole("button", { name: /Core A/i }));
    await waitFor(() => screen.getByText(/Marcar como feito/i));
    await user.click(screen.getByText(/Marcar como feito/i));

    await waitFor(() => {
      expect(readPersistedChallenge().dayLogs["2026-04-13"].cardio).toBe("ct-1");
    });
  });
  });

  describe("redirect", () => {
    beforeEach(() => {
      clearChallengeStorage();
      installSequentialUuidMock();
    });

    it("sem startDate redireciona para /setup", async () => {
      render(
        <MemoryRouter initialEntries={["/day/2026-04-13"]} future={reactRouterFutureFlags}>
          <ChallengeProvider>
            <Routes>
              <Route path="/day/:date" element={<DayDetailPage />} />
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
});
