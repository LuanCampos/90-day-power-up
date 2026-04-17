import { useState } from "react";
import { useChallenge } from "@/contexts/ChallengeContext";
import { useNavigate, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { AnimatedProgressBar } from "@/components/AnimatedProgressBar";
import {
  areWeeklyGoalsMet,
  challengeBlockDayRange,
  defaultChallengeViewBlockFirstDay,
  getChallengeBlockStats,
  getDailyCaloriesTotal,
  getDailySuggestion,
  getWeekDayPillarIcons,
  type WeekDayPillarIcon,
} from "@/lib/challenge-progress";
import { SubpageHeader } from "@/components/SubpageHeader";
import { cn } from "@/lib/utils";
import { sectionHeadingClass } from "@/lib/page-ui";
import { Check, X, Flame, Moon, Dumbbell, HeartPulse, ChevronLeft, ChevronRight, Trophy } from "lucide-react";

export default function WeeklySummaryPage() {
  const { data, getDayLog, getDayNumber } = useChallenge();
  const navigate = useNavigate();

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const defaultBlockFirst = defaultChallengeViewBlockFirstDay(data.startDate, todayStr, getDayNumber);
  const [viewBlockFirstDay, setViewBlockFirstDay] = useState<number | null>(null);
  const blockFirstDay = viewBlockFirstDay ?? defaultBlockFirst;
  const { firstDay: blockFirst, lastDay: blockLast } = challengeBlockDayRange(blockFirstDay);

  const { weekWorkouts, weekCardios, dateStrings } = data.startDate
    ? getChallengeBlockStats(data.startDate, blockFirst, blockLast, getDayLog)
    : { weekWorkouts: 0, weekCardios: 0, dateStrings: [] as string[] };
  const weekGoalsMet = areWeeklyGoalsMet(weekWorkouts, weekCardios, data.goals);

  const days = dateStrings.map((dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    const log = getDayLog(dateStr);
    const dayNum = getDayNumber(dateStr);
    const totalCal = getDailyCaloriesTotal(log);
    const workoutTemplate = log.workout ? data.workoutTemplates.find(t => t.id === log.workout) : null;
    const cardioTemplate = log.cardio ? data.cardioTemplates.find(t => t.id === log.cardio) : null;
    const scheduleEntry = dayNum != null ? getDailySuggestion(dayNum, data.weeklySchedule) : null;
    const pillarIcons = getWeekDayPillarIcons(log, data.goals, data.workoutTemplates.length, data.cardioTemplates.length, dateStr, todayStr, scheduleEntry);

    return { d, dateStr, dayNum, log, totalCal, workoutTemplate, cardioTemplate, pillarIcons };
  });

  const prevBlockFirst = blockFirstDay - 7;
  const nextBlockFirst = blockFirstDay + 7;
  const hasPrevWeek = prevBlockFirst >= 1;
  const hasNextWeek = nextBlockFirst <= 85;

  const PillarIcon = ({ state }: { state: WeekDayPillarIcon }) => {
    if (state === "good") {
      return <Check className="w-3.5 h-3.5 shrink-0 text-success" aria-hidden />;
    }
    if (state === "bad") {
      return <X className="w-3.5 h-3.5 shrink-0 text-energy" aria-hidden />;
    }
    return <span className="inline-block h-3.5 w-3.5 shrink-0" aria-hidden />;
  };

  if (!data.startDate) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <SubpageHeader title="Resumo da Semana" onBack={() => navigate("/")} />

      {/* Week navigation */}
      <div className="px-5 pb-4">
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => hasPrevWeek && setViewBlockFirstDay(prevBlockFirst)}
            disabled={!hasPrevWeek}
            className="p-2 rounded-xl text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <p className="text-sm text-muted-foreground text-center px-1">
            <span className="font-medium text-foreground">Dias {blockFirst}–{blockLast}</span>
            <span className="block text-xs mt-0.5">
              {format(days[0]?.d ?? new Date(), "d MMM", { locale: ptBR })} — {format(days[days.length - 1]?.d ?? new Date(), "d MMM", { locale: ptBR })}
            </span>
          </p>
          <button
            type="button"
            onClick={() => hasNextWeek && setViewBlockFirstDay(nextBlockFirst)}
            disabled={!hasNextWeek}
            className="p-2 rounded-xl text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Week goals met banner */}
      {weekGoalsMet && (data.goals.weeklyWorkouts > 0 || data.goals.weeklyCardios > 0) && (
        <div className="px-5 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4"
          >
            <div className="rounded-xl bg-accent/20 p-2 text-accent">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">Semana no alvo</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Você atingiu as metas semanais de treinos e cardios nesta semana.
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Weekly stats */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl card-elevated border border-border space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Dumbbell className="w-4 h-4 text-pillar-workout" />
            <span className="text-xs font-medium">Treinos</span>
          </div>
          <AnimatedProgressBar
            value={data.goals.weeklyWorkouts > 0 ? (weekWorkouts / data.goals.weeklyWorkouts) * 100 : 0}
            label={`${weekWorkouts}/${data.goals.weeklyWorkouts}`}
            variant="pillar-workout"
            size="sm"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 rounded-2xl card-elevated border border-border space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <HeartPulse className="w-4 h-4 text-pillar-cardio" />
            <span className="text-xs font-medium">Cardios</span>
          </div>
          <AnimatedProgressBar
            value={data.goals.weeklyCardios > 0 ? (weekCardios / data.goals.weeklyCardios) * 100 : 0}
            label={`${weekCardios}/${data.goals.weeklyCardios}`}
            variant="pillar-cardio"
            size="sm"
          />
        </motion.div>
      </div>

      {/* Day by day */}
      <div className="px-5 space-y-3">
        <h2 className={sectionHeadingClass}>Dia a Dia</h2>
        {days.map((day, i) => (
          <motion.button
            key={day.dateStr}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/day/${day.dateStr}`)}
            className="w-full p-4 rounded-2xl card-elevated border border-border text-left hover:border-primary/30 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-2 flex-wrap">
                {day.dayNum != null && (
                  <span className="text-base font-display font-bold text-foreground tabular-nums">
                    Dia {day.dayNum}
                  </span>
                )}
                <span
                  className={cn(
                    day.dayNum != null ? "text-xs text-muted-foreground" : "text-sm font-medium text-foreground",
                  )}
                >
                  {format(day.d, "d MMM", { locale: ptBR })}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>

            {/* Pillar indicators - single row */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 shrink-0">
                <Flame className="w-3.5 h-3.5 shrink-0 text-pillar-calories" />
                <span className="text-muted-foreground tabular-nums">{day.totalCal} kcal</span>
                <PillarIcon state={day.pillarIcons.calories} />
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Moon className="w-3.5 h-3.5 shrink-0 text-pillar-sleep" />
                <span className="text-muted-foreground tabular-nums">
                  {day.log.sleepHours ? `${day.log.sleepHours}h` : "—"}
                </span>
                <PillarIcon state={day.pillarIcons.sleep} />
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <Dumbbell className="w-3.5 h-3.5 shrink-0 text-pillar-workout" />
                <span className="min-w-0 truncate text-muted-foreground">
                  {day.workoutTemplate ? day.workoutTemplate.name : "—"}
                </span>
                <PillarIcon state={day.pillarIcons.workout} />
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <HeartPulse className="w-3.5 h-3.5 shrink-0 text-pillar-cardio" />
                <span className="min-w-0 truncate text-muted-foreground">{day.cardioTemplate ? day.cardioTemplate.name : "—"}</span>
                <PillarIcon state={day.pillarIcons.cardio} />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
