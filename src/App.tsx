import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { reactRouterFutureFlags } from "@/lib/react-router-future";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChallengeProvider } from "@/contexts/ChallengeContext";
import { ScrollToTop } from "@/components/ScrollToTop";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const SetupPage = lazy(() => import("./pages/SetupPage"));
const DayDetailPage = lazy(() => import("./pages/DayDetailPage"));
const WorkoutsPage = lazy(() => import("./pages/WorkoutsPage"));
const WorkoutDetailPage = lazy(() => import("./pages/WorkoutDetailPage"));
const WorkoutSessionPage = lazy(() => import("./pages/WorkoutSessionPage"));
const CardiosPage = lazy(() => import("./pages/CardiosPage"));
const CardioDetailPage = lazy(() => import("./pages/CardioDetailPage"));
const CardioSessionPage = lazy(() => import("./pages/CardioSessionPage"));
const WeeklySummaryPage = lazy(() => import("./pages/WeeklySummaryPage"));
const BodyCompositionPage = lazy(() => import("./pages/BodyCompositionPage"));
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
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/setup" element={<SetupPage />} />
              <Route path="/day/:date" element={<DayDetailPage />} />
              <Route path="/workouts" element={<WorkoutsPage />} />
              <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
              <Route path="/session/workout/:id" element={<WorkoutSessionPage />} />
              <Route path="/cardios" element={<CardiosPage />} />
              <Route path="/cardios/:id" element={<CardioDetailPage />} />
              <Route path="/session/cardio/:id" element={<CardioSessionPage />} />
              <Route path="/weekly" element={<WeeklySummaryPage />} />
              <Route path="/body" element={<BodyCompositionPage />} />
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
