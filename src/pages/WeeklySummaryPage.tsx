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
  isCalorieDayReviewOk,
  isSleepGoalMet,
} from "@/lib/challenge-progress";
import { ArrowLeft, Check, X, Flame, Moon, Dumbbell, Heart, ChevronLeft, ChevronRight, Trophy } from "lucide-react";

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
    const totalCal = log.calories.reduce((s, c) => s + c.amount, 0);
    const calMet = isCalorieDayReviewOk(log, data.goals, dateStr, todayStr);
    const sleepMet = isSleepGoalMet(log, data.goals);
    const workoutTemplate = log.workout ? data.workoutTemplates.find(t => t.id === log.workout) : null;

    return { d, dateStr, dayNum, log, totalCal, calMet, sleepMet, workoutTemplate };
  });

  const prevBlockFirst = blockFirstDay - 7;
  const nextBlockFirst = blockFirstDay + 7;
  const hasPrevWeek = prevBlockFirst >= 1;
  const hasNextWeek = nextBlockFirst <= 85;

  const StatusIcon = ({ met }: { met: boolean }) => met
    ? <Check className="w-4 h-4 text-success" />
    : <X className="w-4 h-4 text-muted-foreground/40" />;

  if (!data.startDate) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-8 pb-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar</span>
        </button>
        <h1 className="text-2xl font-display font-bold text-foreground">Resumo da Semana</h1>

        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            onClick={() => hasPrevWeek && setViewBlockFirstDay(prevBlockFirst)}
            disabled={!hasPrevWeek}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
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
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {weekGoalsMet && (data.goals.weeklyWorkouts > 0 || data.goals.weeklyCardios > 0) && (
        <div className="px-5 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-4"
          >
            <div className="rounded-xl bg-success/20 p-2 text-success">
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

      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl card-elevated border border-border space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Dumbbell className="w-4 h-4" />
            <span className="text-xs">Treinos</span>
          </div>
          <AnimatedProgressBar
            value={data.goals.weeklyWorkouts > 0 ? (weekWorkouts / data.goals.weeklyWorkouts) * 100 : 0}
            label={`${weekWorkouts}/${data.goals.weeklyWorkouts}`}
            variant="success"
            size="sm"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 rounded-2xl card-elevated border border-border space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="w-4 h-4" />
            <span className="text-xs">Cardios</span>
          </div>
          <AnimatedProgressBar
            value={data.goals.weeklyCardios > 0 ? (weekCardios / data.goals.weeklyCardios) * 100 : 0}
            label={`${weekCardios}/${data.goals.weeklyCardios}`}
            variant="energy"
            size="sm"
          />
        </motion.div>
      </div>

      <div className="px-5 space-y-3">
        <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">Dia a Dia</h2>
        {days.map((day, i) => (
          <motion.button
            key={day.dateStr}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/day/${day.dateStr}`)}
            className="w-full p-4 rounded-2xl card-elevated border border-border text-left hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-medium text-foreground capitalize">
                  {format(day.d, "EEEE", { locale: ptBR })}
                </span>
                {day.dayNum && (
                  <span className="ml-2 text-xs text-muted-foreground">Dia {day.dayNum}</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{format(day.d, "dd/MM")}</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-energy" />
                <span className={day.calMet ? "text-success" : "text-muted-foreground"}>{day.totalCal} kcal</span>
                <StatusIcon met={day.calMet} />
              </div>
              <div className="flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-primary" />
                <span className={day.sleepMet ? "text-success" : "text-muted-foreground"}>
                  {day.log.sleepHours ? `${day.log.sleepHours}h` : "—"}
                </span>
                <StatusIcon met={day.sleepMet} />
              </div>
              <div className="flex items-center gap-1">
                <Dumbbell className="w-3.5 h-3.5 text-success" />
                <span className={day.workoutTemplate ? "text-success" : "text-muted-foreground"}>
                  {day.workoutTemplate ? day.workoutTemplate.name : "—"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-fire" />
                <span className={day.log.cardio.done ? "text-success" : "text-muted-foreground"}>
                  {day.log.cardio.done ? "\u2713" : "—"}
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
