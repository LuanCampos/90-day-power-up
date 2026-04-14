import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { reactRouterFutureFlags } from "@/lib/react-router-future";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChallengeProvider } from "@/contexts/ChallengeContext";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const SetupPage = lazy(() => import("./pages/SetupPage"));
const DayDetailPage = lazy(() => import("./pages/DayDetailPage"));
const WorkoutsPage = lazy(() => import("./pages/WorkoutsPage"));
const WeeklySummaryPage = lazy(() => import("./pages/WeeklySummaryPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Carregando…
    </div>
  );
}

const queryClient = new QueryClient();

const routerBasename =
  import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "");

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <ChallengeProvider>
        <BrowserRouter basename={routerBasename} future={reactRouterFutureFlags}>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/setup" element={<SetupPage />} />
              <Route path="/day/:date" element={<DayDetailPage />} />
              <Route path="/workouts" element={<WorkoutsPage />} />
              <Route path="/weekly" element={<WeeklySummaryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ChallengeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
