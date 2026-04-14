import { useEffect, useRef } from "react";
import { useChallenge } from "@/contexts/ChallengeContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { AnimatedProgressBar } from "@/components/AnimatedProgressBar";
import { useCelebration } from "@/components/CelebrationOverlay";
import {
  areWeeklyGoalsMet,
  challengeBlockDayRange,
  challengeWeekMilestoneId,
  CHALLENGE_COMPLETE_MILESTONE_ID,
  getChallengeBlockStats,
  getDailyCaloriesTotal,
  hasCelebratedMilestone,
  isDashboardCaloriesOnTrack,
  isDashboardSleepOnTrack,
  isDashboardWeeklyCardiosOnTrack,
  isDashboardWeeklyWorkoutsOnTrack,
  isDayFullyComplete,
} from "@/lib/challenge-progress";
import { Settings, Dumbbell, ChevronRight, Moon, Flame, Heart, Zap, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Navigate } from "react-router-dom";

export default function Dashboard() {
  const { data, getDayLog, getDayNumber, addCelebratedMilestone } = useChallenge();
  const navigate = useNavigate();
  const { celebrate, overlay } = useCelebration();
  const lastWeekFireRef = useRef<string | null>(null);
  const challengeFireRef = useRef(false);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (!data.startDate) return;
    const todayNum = getDayNumber(todayStr);
    if (todayNum == null) return;
    const { firstDay, lastDay } = challengeBlockDayRange(todayNum);
    const { weekWorkouts: ww, weekCardios: wc } = getChallengeBlockStats(data.startDate, firstDay, lastDay, getDayLog);
    if (!areWeeklyGoalsMet(ww, wc, data.goals)) return;
    const id = challengeWeekMilestoneId(firstDay, lastDay);
    if (lastWeekFireRef.current === id) return;
    if (hasCelebratedMilestone(data.feedback?.celebratedMilestones, id)) return;
    lastWeekFireRef.current = id;
    addCelebratedMilestone(id);
    celebrate("week", "Semana fechada: metas de treino e cardio batidas!");
  }, [
    data.startDate,
    data.dayLogs,
    data.goals,
    data.feedback?.celebratedMilestones,
    getDayLog,
    getDayNumber,
    todayStr,
    addCelebratedMilestone,
    celebrate,
  ]);

  useEffect(() => {
    if (!data.startDate) return;
    if (getDayNumber(todayStr) !== 90) return;
    if (hasCelebratedMilestone(data.feedback?.celebratedMilestones, CHALLENGE_COMPLETE_MILESTONE_ID)) return;
    if (challengeFireRef.current) return;
    challengeFireRef.current = true;
    addCelebratedMilestone(CHALLENGE_COMPLETE_MILESTONE_ID);
    celebrate("challenge", "Parabéns! Você completou os 90 dias do desafio.");
  }, [
    data.startDate,
    data.feedback?.celebratedMilestones,
    getDayNumber,
    todayStr,
    addCelebratedMilestone,
    celebrate,
  ]);

  if (!data.startDate) {
    return <Navigate to="/setup" replace />;
  }

  const today = new Date();
  const currentDayNum = getDayNumber(todayStr);
  const overallProgress = currentDayNum ? (currentDayNum / 90) * 100 : 0;
  const todayLog = getDayLog(todayStr);

  const blockRange = currentDayNum != null ? challengeBlockDayRange(currentDayNum) : null;
  const { weekWorkouts, weekCardios } =
    blockRange != null
      ? getChallengeBlockStats(data.startDate, blockRange.firstDay, blockRange.lastDay, getDayLog)
      : { weekWorkouts: 0, weekCardios: 0 };

  const totalCalories = getDailyCaloriesTotal(todayLog);
  const dailyCalGoal = data.goals.dailyCalories;
  const caloriesOverBudget = dailyCalGoal > 0 && totalCalories > dailyCalGoal;
  const calProgress = dailyCalGoal > 0 ? (totalCalories / dailyCalGoal) * 100 : 0;
  const sleepProgress =
    todayLog.sleepHours && data.goals.dailySleepHours > 0
      ? (todayLog.sleepHours / data.goals.dailySleepHours) * 100
      : 0;

  const workoutProgress = data.goals.weeklyWorkouts > 0 ? (weekWorkouts / data.goals.weeklyWorkouts) * 100 : 0;
  const cardioProgress = data.goals.weeklyCardios > 0 ? (weekCardios / data.goals.weeklyCardios) * 100 : 0;

  const todayComplete = isDayFullyComplete(todayLog, data.goals, data.workoutTemplates.length);

  const caloriesOnTrack = isDashboardCaloriesOnTrack(todayLog, data.goals);
  const sleepOnTrack = isDashboardSleepOnTrack(todayLog, data.goals);
  const workoutOnTrack = isDashboardWeeklyWorkoutsOnTrack(
    todayLog,
    weekWorkouts,
    data.goals,
    data.workoutTemplates.length,
  );
  const cardioOnTrack = isDashboardWeeklyCardiosOnTrack(todayLog, weekCardios, data.goals);

  const statCards = [
    {
      icon: <Flame className="w-5 h-5 text-pillar-calories" />,
      label: "Calorias Hoje",
      value:
        dailyCalGoal <= 0
          ? `${totalCalories}`
          : caloriesOverBudget
            ? `${totalCalories - dailyCalGoal}`
            : `${Math.max(0, dailyCalGoal - totalCalories)}`,
      sub: dailyCalGoal <= 0 ? "kcal" : caloriesOverBudget ? "excedentes" : "restantes",
      valueEnergy: caloriesOverBudget,
      progress: calProgress,
      variant: (caloriesOnTrack ? "success" : "energy") as const,
      path: `/day/${todayStr}?section=calories`,
      completeHighlight: false,
      warnAbove: dailyCalGoal > 0 ? 100 : undefined,
      calWarnOrange: true,
    },
    {
      icon: <Moon className="w-5 h-5 text-pillar-sleep" />,
      label: "Sono Hoje",
      value: todayLog.sleepHours ? `${todayLog.sleepHours}h` : "—",
      sub: `/ ${data.goals.dailySleepHours}h`,
      progress: sleepProgress,
      variant: (sleepOnTrack ? "success" : "energy") as const,
      path: `/day/${todayStr}?section=sleep`,
      sleepSuccessRange: data.goals.dailySleepHours > 0 ? { min: 80, max: 140 } : undefined,
      sleepWarnAbove: data.goals.dailySleepHours > 0 ? 140 : undefined,
    },
    {
      icon: <Dumbbell className="w-5 h-5 text-pillar-workout" />,
      label: "Treinos (semana)",
      value: `${weekWorkouts}`,
      sub: `/ ${data.goals.weeklyWorkouts}`,
      progress: workoutProgress,
      variant: (workoutOnTrack ? "success" : "energy") as const,
      path: `/day/${todayStr}?section=workout`,
    },
    {
      icon: <Heart className="w-5 h-5 text-pillar-cardio" />,
      label: "Cardios (semana)",
      value: `${weekCardios}`,
      sub: `/ ${data.goals.weeklyCardios}`,
      progress: cardioProgress,
      variant: (cardioOnTrack ? "success" : "energy") as const,
      path: `/day/${todayStr}?section=cardio`,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {overlay}
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Dia {currentDayNum || "—"}<span className="text-muted-foreground font-normal text-lg"> / 90</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(today, "d MMM", { locale: ptBR })}
            </p>
            {todayComplete && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium text-success">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Hoje completo
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

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

      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
        {statCards.map((card, i) => (
          <motion.button
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
            onClick={() => navigate(card.path)}
            className="p-4 rounded-2xl card-elevated border border-border text-left hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              {card.icon}
              <span className="text-xs font-medium">{card.label}</span>
            </div>
            <div className="flex items-baseline gap-1 mb-3">
              <span
                className={`text-2xl font-display font-bold ${"valueEnergy" in card && card.valueEnergy ? "text-energy" : "text-foreground"}`}
              >
                {card.value}
              </span>
              <span className="text-xs text-muted-foreground">{card.sub}</span>
            </div>
            <AnimatedProgressBar
              value={card.progress}
              variant={card.variant}
              size="sm"
              showPercentage={false}
              successRange={"sleepSuccessRange" in card ? card.sleepSuccessRange : undefined}
              completeHighlight={"completeHighlight" in card ? card.completeHighlight : true}
              warnAbove={
                "warnAbove" in card ? card.warnAbove : "sleepWarnAbove" in card ? card.sleepWarnAbove : undefined
              }
              warnOverStyle={"calWarnOrange" in card && card.calWarnOrange ? "energy" : "destructive"}
            />
          </motion.button>
        ))}
      </div>

      <div className="px-5 space-y-3">
        <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">Ações Rápidas</h2>

        {[
          { label: "Registrar Dia", sub: "Calorias, treino, cardio, sono", icon: <Calendar className="w-5 h-5 text-action-day" />, path: `/day/${todayStr}` },
          { label: "Resumo da Semana", sub: "Veja seu progresso semanal", icon: <Zap className="w-5 h-5 text-action-weekly" />, path: "/weekly" },
          { label: "Meus Treinos", sub: "Gerenciar templates de treino", icon: <Dumbbell className="w-5 h-5 text-pillar-workout" />, path: "/workouts" },
        ].map((action, i) => (
          <motion.button
            key={action.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            onClick={() => navigate(action.path)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl card-elevated border border-border hover:border-primary/30 transition-colors group"
          >
            <div className="p-2.5 rounded-xl bg-secondary group-hover:bg-muted/50 transition-colors">
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
