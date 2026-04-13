import { useState } from "react";
import { useChallenge } from "@/contexts/ChallengeContext";
import { format, addDays, startOfWeek, differenceInDays, isBefore, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedProgressBar } from "@/components/AnimatedProgressBar";
import { Calendar, Settings, Dumbbell, ChevronRight, Moon, Flame, Heart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { data, getDayLog, getDayNumber } = useChallenge();
  const navigate = useNavigate();

  if (!data.startDate) {
    navigate("/setup");
    return null;
  }

  const startDate = parseISO(data.startDate);
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const currentDayNum = getDayNumber(todayStr);
  const overallProgress = currentDayNum ? (currentDayNum / 90) * 100 : 0;
  const todayLog = getDayLog(todayStr);

  const totalCalories = todayLog.calories.reduce((s, c) => s + c.amount, 0);
  const calProgress = data.goals.dailyCalories > 0 ? (totalCalories / data.goals.dailyCalories) * 100 : 0;
  const sleepProgress = todayLog.sleepHours ? (todayLog.sleepHours / data.goals.dailySleepHours) * 100 : 0;

  // Weekly stats
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  let weekWorkouts = 0;
  let weekCardios = 0;
  for (let i = 0; i < 7; i++) {
    const d = format(addDays(weekStart, i), "yyyy-MM-dd");
    const log = getDayLog(d);
    if (log.workout) weekWorkouts++;
    if (log.cardio.done) weekCardios++;
  }

  const workoutProgress = data.goals.weeklyWorkouts > 0 ? (weekWorkouts / data.goals.weeklyWorkouts) * 100 : 0;
  const cardioProgress = data.goals.weeklyCardios > 0 ? (weekCardios / data.goals.weeklyCardios) * 100 : 0;

  const statCards = [
    {
      icon: <Flame className="w-5 h-5" />,
      label: "Calorias Hoje",
      value: `${totalCalories}`,
      sub: `/ ${data.goals.dailyCalories} kcal`,
      progress: calProgress,
      variant: "energy" as const,
    },
    {
      icon: <Moon className="w-5 h-5" />,
      label: "Sono",
      value: todayLog.sleepHours ? `${todayLog.sleepHours}h` : "—",
      sub: `/ ${data.goals.dailySleepHours}h`,
      progress: sleepProgress,
      variant: "success" as const,
    },
    {
      icon: <Dumbbell className="w-5 h-5" />,
      label: "Treinos (semana)",
      value: `${weekWorkouts}`,
      sub: `/ ${data.goals.weeklyWorkouts}`,
      progress: workoutProgress,
      variant: "success" as const,
    },
    {
      icon: <Heart className="w-5 h-5" />,
      label: "Cardios (semana)",
      value: `${weekCardios}`,
      sub: `/ ${data.goals.weeklyCardios}`,
      progress: cardioProgress,
      variant: "energy" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Dia {currentDayNum || "—"}<span className="text-muted-foreground font-normal text-lg"> / 90</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Overall progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl card-elevated border border-border"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl gradient-success">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">Desafio 90 Dias</p>
              <p className="text-xs text-muted-foreground">{currentDayNum ? `${90 - currentDayNum} dias restantes` : "Não iniciado"}</p>
            </div>
          </div>
          <AnimatedProgressBar value={overallProgress} variant="success" size="lg" />
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
            className="p-4 rounded-2xl card-elevated border border-border"
          >
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              {card.icon}
              <span className="text-xs font-medium">{card.label}</span>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-2xl font-display font-bold text-foreground">{card.value}</span>
              <span className="text-xs text-muted-foreground">{card.sub}</span>
            </div>
            <AnimatedProgressBar value={card.progress} variant={card.variant} size="sm" showPercentage={false} />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="px-5 space-y-3">
        <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">Ações Rápidas</h2>

        {[
          { label: "Registrar Dia Atual", sub: "Calorias, treino, cardio, sono", icon: <Calendar className="w-5 h-5" />, path: `/day/${todayStr}` },
          { label: "Resumo da Semana", sub: "Veja seu progresso semanal", icon: <Zap className="w-5 h-5" />, path: "/weekly" },
          { label: "Meus Treinos", sub: "Gerenciar templates de treino", icon: <Dumbbell className="w-5 h-5" />, path: "/workouts" },
        ].map((action, i) => (
          <motion.button
            key={action.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            onClick={() => navigate(action.path)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl card-elevated border border-border hover:border-primary/30 transition-colors group"
          >
            <div className="p-2.5 rounded-xl bg-secondary text-muted-foreground group-hover:text-primary transition-colors">
              {action.icon}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.sub}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
