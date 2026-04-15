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
  getPillarSuggestion,
  hasCelebratedMilestone,
  isDashboardCaloriesOnTrack,
  isDashboardSleepOnTrack,
  isDashboardWeeklyCardiosOnTrack,
  isDashboardWeeklyWorkoutsOnTrack,
  isDayFullyComplete,
} from "@/lib/challenge-progress";
import { Settings, Dumbbell, ChevronRight, Moon, Flame, HeartPulse, Zap, Calendar, CheckCircle2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Navigate } from "react-router-dom";
import { sectionHeadingClass } from "@/lib/page-ui";

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

  const isWeekFirstDay = currentDayNum != null && (currentDayNum - 1) % 7 === 0;
  const bodyCompTargetWeek = currentDayNum != null ? Math.floor((currentDayNum - 1) / 7) : null;
  const hasBodyCompEntry =
    bodyCompTargetWeek != null &&
    (data.bodyComposition ?? []).some((e) => e.week === bodyCompTargetWeek);
  const showBodyCompReminder = isWeekFirstDay && bodyCompTargetWeek != null && !hasBodyCompEntry;
  const overallProgress = currentDayNum ? (currentDayNum / 90) * 100 : 0;
  const todayLog = getDayLog(todayStr);

  const blockRange = currentDayNum != null ? challengeBlockDayRange(currentDayNum) : null;
  const blockStats =
    blockRange != null
      ? getChallengeBlockStats(data.startDate, blockRange.firstDay, blockRange.lastDay, getDayLog)
      : null;
  const weekWorkouts = blockStats?.weekWorkouts ?? 0;
  const weekCardios = blockStats?.weekCardios ?? 0;

  const workoutHint = currentDayNum != null && data.weeklySchedule
    ? getPillarSuggestion({
        pillar: "workout",
        dayNumber: currentDayNum,
        todayLog,
        schedule: data.weeklySchedule,
        blockDoneIds: blockStats?.weekWorkoutIds ?? new Set(),
        templates: data.workoutTemplates,
      })
    : null;
  const cardioHint = currentDayNum != null && data.weeklySchedule
    ? getPillarSuggestion({
        pillar: "cardio",
        dayNumber: currentDayNum,
        todayLog,
        schedule: data.weeklySchedule,
        blockDoneIds: blockStats?.weekCardioIds ?? new Set(),
        templates: data.cardioTemplates,
      })
    : null;

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

  const todayComplete = isDayFullyComplete(todayLog, data.goals, data.workoutTemplates.length, data.cardioTemplates.length);

  const caloriesOnTrack = isDashboardCaloriesOnTrack(todayLog, data.goals);
  const sleepOnTrack = isDashboardSleepOnTrack(todayLog, data.goals);
  const workoutOnTrack = isDashboardWeeklyWorkoutsOnTrack(
    todayLog,
    weekWorkouts,
    data.goals,
    data.workoutTemplates.length,
  );
  const cardioOnTrack = isDashboardWeeklyCardiosOnTrack(todayLog, weekCardios, data.goals, data.cardioTemplates.length);

  function hintFromSuggestion(s: typeof workoutHint, pillarLabel: string): { text: string; color: string } | null {
    if (!s) return null;
    switch (s.status) {
      case "suggested":
        return { text: `${s.templateName ?? pillarLabel} sugerido`, color: "text-primary" };
      case "rest":
        return { text: "Descanso", color: "text-muted-foreground" };
      case "catchup-single":
        return { text: `${s.templateName ?? pillarLabel} pendente`, color: "text-primary" };
      case "catchup-multi":
        return { text: `${s.pendingCount} pendentes`, color: "text-primary" };
      default:
        return null;
    }
  }

  const workoutCardHint = hintFromSuggestion(workoutHint, "Treino");
  const cardioCardHint = hintFromSuggestion(cardioHint, "Cardio");

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
      variant: caloriesOnTrack ? "success" as const : "energy" as const,
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
      variant: sleepOnTrack ? "success" as const : "energy" as const,
      path: `/day/${todayStr}?section=sleep`,
      sleepSuccessRange: data.goals.dailySleepHours > 0 ? { min: 90, max: Infinity } : undefined,
    },
    {
      icon: <Dumbbell className="w-5 h-5 text-pillar-workout" />,
      label: "Treinos (semana)",
      value: `${weekWorkouts}`,
      sub: `/ ${data.goals.weeklyWorkouts}`,
      progress: workoutProgress,
      variant: workoutOnTrack ? "success" as const : "energy" as const,
      path: `/day/${todayStr}?section=workout`,
      hint: workoutCardHint,
    },
    {
      icon: <HeartPulse className="w-5 h-5 text-pillar-cardio" />,
      label: "Cardios (semana)",
      value: `${weekCardios}`,
      sub: `/ ${data.goals.weeklyCardios}`,
      progress: cardioProgress,
      variant: cardioOnTrack ? "success" as const : "energy" as const,
      path: `/day/${todayStr}?section=cardio`,
      hint: cardioCardHint,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {overlay}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Dia {currentDayNum || "—"}<span className="text-muted-foreground font-normal text-lg"> / 90</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(today, "d MMM", { locale: ptBR })}
            </p>
            {todayComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium text-success"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Hoje completo
              </motion.div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
            className="rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
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

      {showBodyCompReminder && (
        <div className="px-5 mb-4">
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => navigate("/body")}
            className="w-full flex items-start gap-4 p-5 rounded-2xl border-2 border-blue-400/40 bg-blue-400/5 hover:bg-blue-400/10 active:scale-[0.98] transition-all text-left"
          >
            <div className="p-3 rounded-xl bg-blue-400/15 shrink-0">
              <Scale className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground text-base">
                Hora de registrar suas medidas!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {bodyCompTargetWeek === 0
                  ? "Registre seu baseline antes de começar."
                  : `Registre os dados da Semana ${bodyCompTargetWeek}.`}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
          </motion.button>
        </div>
      )}

      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
        {statCards.map((card, i) => (
          <motion.button
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
            onClick={() => navigate(card.path)}
            className="p-4 rounded-2xl card-elevated border border-border text-left hover:border-primary/30 active:scale-[0.97] transition-all"
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
              warnAbove={"warnAbove" in card ? card.warnAbove : undefined}
              warnOverStyle={"calWarnOrange" in card && card.calWarnOrange ? "energy" : "destructive"}
            />
            {"hint" in card && card.hint && (
              <p className={`text-[10px] font-medium truncate mt-1.5 ${card.hint.color}`}>
                {card.hint.text}
              </p>
            )}
          </motion.button>
        ))}
      </div>

      <div className="px-5 space-y-3">
        <h2 className={sectionHeadingClass}>Ações Rápidas</h2>

        {[
          { label: "Registrar Dia", sub: "Calorias, treino, cardio, sono", icon: <Calendar className="w-5 h-5 text-action-day" />, path: `/day/${todayStr}` },
          { label: "Resumo da Semana", sub: "Veja seu progresso semanal", icon: <Zap className="w-5 h-5 text-action-weekly" />, path: "/weekly" },
          { label: "Composição Corporal", sub: "Acompanhe sua evolução semanal", icon: <Scale className="w-5 h-5 text-blue-400" />, path: "/body" },
          { label: "Meus Treinos", sub: "Gerenciar templates de treino", icon: <Dumbbell className="w-5 h-5 text-pillar-workout" />, path: "/workouts" },
          { label: "Meus Cardios", sub: "Gerenciar templates de cardio", icon: <HeartPulse className="w-5 h-5 text-pillar-cardio" />, path: "/cardios" },
        ].map((action, i) => (
          <motion.button
            key={action.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            onClick={() => navigate(action.path)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl card-elevated border border-border hover:border-primary/30 active:scale-[0.98] transition-all group"
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
