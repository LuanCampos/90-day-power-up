import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { reactRouterFutureFlags } from "@/lib/react-router-future";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChallengeProvider } from "@/contexts/ChallengeContext";
import { clearChallengeStorage, installSequentialUuidMock } from "@/test/challenge-test-utils";
import Dashboard from "@/pages/Dashboard";
import SetupPage from "@/pages/SetupPage";

vi.mock("@/components/CelebrationOverlay", () => ({
  useCelebration: () => ({
    celebrate: vi.fn(),
    overlay: null,
  }),
}));

beforeEach(() => {
  clearChallengeStorage();
  installSequentialUuidMock();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Dashboard redirect", () => {
  it("sem startDate redireciona para /setup", async () => {
    render(
      <MemoryRouter initialEntries={["/"]} future={reactRouterFutureFlags}>
        <ChallengeProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
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
