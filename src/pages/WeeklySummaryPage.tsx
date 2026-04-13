import { useState } from "react";
import { useChallenge } from "@/contexts/ChallengeContext";
import { useNavigate } from "react-router-dom";
import { format, addDays, startOfWeek, subWeeks, addWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { AnimatedProgressBar } from "@/components/AnimatedProgressBar";
import {
  areWeeklyGoalsMet,
  getWeekStats,
  isCalorieGoalMet,
  isSleepGoalMet,
} from "@/lib/challenge-progress";
import { ArrowLeft, Check, X, Flame, Moon, Dumbbell, Heart, ChevronLeft, ChevronRight, Trophy } from "lucide-react";

export default function WeeklySummaryPage() {
  const { data, getDayLog, getDayNumber } = useChallenge();
  const navigate = useNavigate();

  const [referenceDate, setReferenceDate] = useState(new Date());
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });

  const { weekWorkouts, weekCardios } = getWeekStats(weekStart, getDayLog);
  const weekGoalsMet = areWeeklyGoalsMet(weekWorkouts, weekCardios, data.goals);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const dateStr = format(d, "yyyy-MM-dd");
    const log = getDayLog(dateStr);
    const dayNum = getDayNumber(dateStr);
    const totalCal = log.calories.reduce((s, c) => s + c.amount, 0);
    const calMet = isCalorieGoalMet(log, data.goals);
    const sleepMet = isSleepGoalMet(log, data.goals);
    const workoutTemplate = log.workout ? data.workoutTemplates.find(t => t.id === log.workout) : null;

    return { d, dateStr, dayNum, log, totalCal, calMet, sleepMet, workoutTemplate };
  });

  const prevWeekStart = subWeeks(weekStart, 1);
  const nextWeekStart = addWeeks(weekStart, 1);
  const hasPrevWeek = data.startDate && Array.from({ length: 7 }, (_, i) => getDayNumber(format(addDays(prevWeekStart, i), "yyyy-MM-dd"))).some(n => n !== null);
  const hasNextWeek = data.startDate && Array.from({ length: 7 }, (_, i) => getDayNumber(format(addDays(nextWeekStart, i), "yyyy-MM-dd"))).some(n => n !== null);

  const StatusIcon = ({ met }: { met: boolean }) => met
    ? <Check className="w-4 h-4 text-success" />
    : <X className="w-4 h-4 text-muted-foreground/40" />;

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
            onClick={() => hasPrevWeek && setReferenceDate(addDays(prevWeekStart, 3))}
            disabled={!hasPrevWeek}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, "d MMM", { locale: ptBR })} — {format(addDays(weekStart, 6), "d MMM", { locale: ptBR })}
          </p>
          <button
            onClick={() => hasNextWeek && setReferenceDate(addDays(nextWeekStart, 3))}
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
