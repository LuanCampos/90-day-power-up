import React from "react";
import { Routes, Route } from "react-router-dom";
import { format } from "date-fns";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearChallengeStorage,
  installSequentialUuidMock,
  readPersistedChallenge,
  renderWithChallengeRouter,
} from "@/test/challenge-test-utils";
import SetupPage from "@/pages/SetupPage";

function renderSetup() {
  return renderWithChallengeRouter(
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/" element={<div />} />
    </Routes>,
    { initialEntries: ["/setup"] },
  );
}

beforeEach(() => {
  clearChallengeStorage();
  installSequentialUuidMock();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SetupPage", () => {
  it("Começar Desafio persiste startDate no localStorage (data selecionada no calendário = hoje por padrão)", async () => {
    const user = userEvent.setup();
    const expectedStart = format(new Date(), "yyyy-MM-dd");
    renderSetup();
    await waitFor(() => expect(localStorage.getItem("fitness-challenge-90")).not.toBeNull());

    await user.click(screen.getByRole("button", { name: /Começar Desafio/i }));

    await waitFor(() => {
      expect(readPersistedChallenge().startDate).toBe(expectedStart);
    });
  });
});
