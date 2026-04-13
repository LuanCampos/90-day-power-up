import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ChallengeProvider>
        <BrowserRouter>
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
