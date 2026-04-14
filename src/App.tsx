import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { reactRouterFutureFlags } from "@/lib/react-router-future";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChallengeProvider } from "@/contexts/ChallengeContext";
import Dashboard from "./pages/Dashboard";
import SetupPage from "./pages/SetupPage";
import DayDetailPage from "./pages/DayDetailPage";
import WorkoutsPage from "./pages/WorkoutsPage";
import WeeklySummaryPage from "./pages/WeeklySummaryPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const routerBasename =
  import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "");

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <ChallengeProvider>
        <BrowserRouter basename={routerBasename} future={reactRouterFutureFlags}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/day/:date" element={<DayDetailPage />} />
            <Route path="/workouts" element={<WorkoutsPage />} />
            <Route path="/weekly" element={<WeeklySummaryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ChallengeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
