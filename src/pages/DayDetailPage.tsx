import { useEffect, useRef, useState } from "react";
import { useChallenge } from "@/contexts/ChallengeContext";
import { useParams, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { format, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedProgressBar } from "@/components/AnimatedProgressBar";
import { SectionCard } from "@/components/SectionCard";
import { ActionIconButton } from "@/components/ActionIconButton";
import { useCelebration } from "@/components/CelebrationOverlay";
import {
  areWeeklyGoalsMet,
  challengeBlockDayRange,
  challengeWeekMilestoneId,
  getChallengeBlockStats,
  getDailyCaloriesTotal,
  hasCelebratedMilestone,
  isCalorieGoalMet,
  isCalorieDayReviewOk,
  isDayFullyComplete,
  isDashboardSleepOnTrack,
  isSleepGoalMet,
} from "@/lib/challenge-progress";
import { SubpageHeader } from "@/components/SubpageHeader";
import { cn } from "@/lib/utils";
import { sectionHeadingClass } from "@/lib/page-ui";
import { Plus, Trash2, Flame, Dumbbell, Heart, Moon, Check, ChevronLeft, ChevronRight } from "lucide-react";

export default function DayDetailPage() {
  const { date } = useParams<{ date: string }>();
  const [searchParams] = useSearchParams();
  const focusSection = searchParams.get("section");
  const navigate = useNavigate();
  const {
    data, getDayLog, getDayNumber, addCalorie, removeCalorie,
    setWorkout, setCardio, setSleep, addCelebratedMilestone,
  } = useChallenge();
  const { celebrate, overlay } = useCelebration();

  const safeDate = date || "";
  const dayNum = getDayNumber(safeDate);
  const log = getDayLog(safeDate);

  const [calAmount, setCalAmount] = useState("");
  const [calLabel, setCalLabel] = useState("");
  const [sleepInput, setSleepInput] = useState(log.sleepHours?.toString() || "");
  const [cardioMinutes, setCardioMinutes] = useState(log.cardio.minutes?.toString() || "");
  const [cardioCals, setCardioCals] = useState(log.cardio.caloriesBurned?.toString() || "");

  const prevDayCompleteRef = useRef<{ date: string; complete: boolean } | null>(null);
  const lastWeekFireRef = useRef<string | null>(null);

  useEffect(() => {
    const complete = isDayFullyComplete(log, data.goals, data.workoutTemplates.length);
    const prev = prevDayCompleteRef.current;
    if (!prev || prev.date !== safeDate) {
      prevDayCompleteRef.current = { date: safeDate, complete };
      return;
    }
    if (!prev.complete && complete) {
      celebrate("day", "Dia completo! Todas as metas de hoje estão em dia.");
    }
    prevDayCompleteRef.current = { date: safeDate, complete };
  }, [log, data.goals, data.workoutTemplates.length, safeDate, celebrate]);

  useEffect(() => {
    if (!date || !data.startDate) return;
    const todayStrEff = format(new Date(), "yyyy-MM-dd");
    const detailDayNum = getDayNumber(date);
    const todayNumEff = getDayNumber(todayStrEff);
    if (detailDayNum == null || todayNumEff == null) return;
    const detailBlock = challengeBlockDayRange(detailDayNum);
    const todayBlock = challengeBlockDayRange(todayNumEff);
    if (detailBlock.firstDay !== todayBlock.firstDay) return;
    const { weekWorkouts, weekCardios } = getChallengeBlockStats(
      data.startDate,
      detailBlock.firstDay,
      detailBlock.lastDay,
      getDayLog,
    );
    if (!areWeeklyGoalsMet(weekWorkouts, weekCardios, data.goals)) return;
    const id = challengeWeekMilestoneId(detailBlock.firstDay, detailBlock.lastDay);
    if (lastWeekFireRef.current === id) return;
    if (hasCelebratedMilestone(data.feedback?.celebratedMilestones, id)) return;
    lastWeekFireRef.current = id;
    addCelebratedMilestone(id);
    celebrate("week", "Semana fechada: metas de treino e cardio batidas!");
  }, [
    date,
    data.startDate,
    data.dayLogs,
    data.goals,
    data.feedback?.celebratedMilestones,
    getDayLog,
    getDayNumber,
    addCelebratedMilestone,
    celebrate,
  ]);

  if (!date) return null;
  if (!data.startDate) {
    return <Navigate to="/setup" replace />;
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const currentDate = parseISO(date);
  const prevDate = format(addDays(currentDate, -1), "yyyy-MM-dd");
  const nextDate = format(addDays(currentDate, 1), "yyyy-MM-dd");
  const prevDayNum = getDayNumber(prevDate);
  const nextDayNum = getDayNumber(nextDate);
  const canGoPrev = prevDayNum !== null;
  const canGoNext = nextDayNum !== null;

  const weekWorkoutIds = new Set<string>();
  if (dayNum != null && data.startDate) {
    const { firstDay, lastDay } = challengeBlockDayRange(dayNum);
    const base = new Date(data.startDate + "T00:00:00");
    for (let dNum = firstDay; dNum <= lastDay; dNum++) {
      const d = format(addDays(base, dNum - 1), "yyyy-MM-dd");
      if (d === date) continue;
      const dayLog = getDayLog(d);
      if (dayLog.workout) weekWorkoutIds.add(dayLog.workout);
    }
  }

  const handleAddCalorie = () => {
    const amount = parseInt(calAmount);
    if (isNaN(amount) || amount <= 0) return;
    addCalorie(date, { amount, label: calLabel || undefined });
    setCalAmount("");
    setCalLabel("");
  };

  const totalCalories = getDailyCaloriesTotal(log);
  const dailyCalGoal = data.goals.dailyCalories;
  const caloriesOverBudget = dailyCalGoal > 0 && totalCalories > dailyCalGoal;
  const caloriesHeadlineNumber =
    dailyCalGoal <= 0 ? totalCalories : caloriesOverBudget ? totalCalories - dailyCalGoal : Math.max(0, dailyCalGoal - totalCalories);
  const caloriesHeadlineSuffix = dailyCalGoal <= 0 ? "kcal" : caloriesOverBudget ? "excedentes" : "restantes";
  const caloriesClosedDayOk =
    dailyCalGoal > 0 && date < todayStr && isCalorieDayReviewOk(log, data.goals, date, todayStr);

  const handleSleep = () => {
    const hours = parseFloat(sleepInput);
    if (isNaN(hours) || hours <= 0) return;
    const wasMet = isSleepGoalMet(log, data.goals);
    const nextLog = { ...log, sleepHours: hours };
    setSleep(date, hours);
    if (!wasMet && isSleepGoalMet(nextLog, data.goals)) {
      celebrate("goal", "Meta de sono atingida!");
    }
  };

  const handleCardio = (done: boolean) => {
    const turningOn = done && !log.cardio.done;
    setCardio(date, {
      done,
      minutes: parseInt(cardioMinutes) || undefined,
      caloriesBurned: parseInt(cardioCals) || undefined,
    });
    if (turningOn) celebrate("goal", "Cardio registrado!");
  };

  const showAll = !focusSection;

  return (
    <div className="min-h-screen bg-background pb-24">
      {overlay}
      <SubpageHeader title="Registrar Dia" onBack={() => navigate("/")} />

      {/* Day navigation */}
      <div className="px-5 pb-4">
        <div className="relative mt-3 min-h-10">
          {!focusSection && (
            <button
              type="button"
              onClick={() => canGoPrev && navigate(`/day/${prevDate}`)}
              disabled={!canGoPrev}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <p className="px-11 text-center text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{dayNum != null ? `Dia ${dayNum}` : date}</span>
            <span className="mt-0.5 block text-xs">
              {format(currentDate, "d MMM", { locale: ptBR })}
            </span>
          </p>
          {!focusSection && (
            <button
              type="button"
              onClick={() => canGoNext && navigate(`/day/${nextDate}`)}
              disabled={!canGoNext}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* ── CALORIAS ── */}
        {(showAll || focusSection === "calories") && (
          <SectionCard>
            <div className="flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div className="flex min-w-0 items-center gap-2">
                <Flame className="h-5 w-5 shrink-0 text-pillar-calories" />
                <h2 className={sectionHeadingClass}>Calorias</h2>
              </div>
              <div className="flex shrink-0 items-baseline gap-1.5 tabular-nums">
                <span
                  className={`text-2xl font-display font-bold ${caloriesOverBudget ? "text-energy" : "text-foreground"}`}
                >
                  {caloriesHeadlineNumber}
                </span>
                <span className="text-sm text-muted-foreground">{caloriesHeadlineSuffix}</span>
              </div>
            </div>

            {caloriesClosedDayOk && (
              <p className="text-xs font-medium text-success">No alvo (50–100% da meta)</p>
            )}
            {dailyCalGoal > 0 && totalCalories > dailyCalGoal && (
              <p className="text-xs font-medium text-energy">Acima da meta diária</p>
            )}
            {dailyCalGoal > 0 && totalCalories > 0 && totalCalories < 0.5 * dailyCalGoal && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-500">Abaixo de 50% da meta</p>
            )}
            {dailyCalGoal > 0 && date === todayStr && totalCalories === 0 && (
              <p className="text-xs text-muted-foreground">Registre as calorias ao longo do dia.</p>
            )}
            {dailyCalGoal > 0 && (
              <p className="text-xs text-muted-foreground">{totalCalories} / {dailyCalGoal} kcal consumidas</p>
            )}

            <AnimatedProgressBar
              value={dailyCalGoal > 0 ? (totalCalories / dailyCalGoal) * 100 : 0}
              variant={dailyCalGoal > 0 && isCalorieGoalMet(log, data.goals) ? "success" as const : "energy" as const}
              size="sm"
              showPercentage={false}
              successRange={dailyCalGoal > 0 ? { min: 50, max: 100 } : undefined}
              completeHighlight={date < todayStr}
              warnAbove={dailyCalGoal > 0 ? 100 : undefined}
              warnOverStyle="energy"
            />

            {/* Calorie entries list */}
            <AnimatePresence>
              {log.calories.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground tabular-nums">{entry.amount} kcal</span>
                    {entry.label && (
                      <span className="ml-2 text-xs text-muted-foreground truncate">{entry.label}</span>
                    )}
                  </div>
                  <ActionIconButton
                    intent="danger"
                    onClick={() => removeCalorie(date, entry.id)}
                    aria-label="Remover entrada"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </ActionIconButton>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add calorie form */}
            <div className="flex w-full flex-wrap items-center gap-2">
              <Input
                placeholder="kcal"
                type="number"
                value={calAmount}
                onChange={(e) => setCalAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCalorie()}
                className="h-10 w-[5.5rem] shrink-0 bg-secondary border-border sm:w-24"
              />
              <Input
                placeholder="Descrição (opcional)"
                value={calLabel}
                onChange={(e) => setCalLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCalorie()}
                className="h-10 min-w-[8rem] flex-1 bg-secondary border-border"
              />
              <Button
                type="button"
                variant="cta"
                onClick={handleAddCalorie}
                size="icon"
                className="shrink-0"
                aria-label="Adicionar calorias"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </SectionCard>
        )}

        {/* ── TREINO ── */}
        {(showAll || focusSection === "workout") && (
          <SectionCard delay={0.08}>
            <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <Dumbbell className="h-5 w-5 shrink-0 text-pillar-workout" />
                <h2 className={sectionHeadingClass}>Treino</h2>
              </div>
              {log.workout && data.workoutTemplates.length > 0 && (
                <span className="shrink-0 text-xs font-medium text-success">Feito hoje</span>
              )}
            </div>
            {data.workoutTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum treino cadastrado.{" "}
                <button onClick={() => navigate("/workouts")} className="text-primary underline">Cadastrar treinos</button>
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {data.workoutTemplates.map((t) => {
                  const isSelectedToday = log.workout === t.id;
                  const doneThisWeek = weekWorkoutIds.has(t.id);
                  return (
                    <button key={t.id} onClick={() => {
                      const newId = isSelectedToday ? undefined : t.id;
                      setWorkout(date, newId);
                      if (newId) celebrate("goal", `Treino "${t.name}" registrado!`);
                    }}
                      className={cn(
                        "p-3 rounded-xl text-sm font-medium transition-all border active:scale-[0.97]",
                        isSelectedToday
                          ? "border-success bg-success/10 text-success"
                          : doneThisWeek
                            ? "border-success/30 bg-success/5 text-muted-foreground"
                            : "border-border bg-secondary text-muted-foreground hover:border-primary/30",
                      )}>
                      <div className="flex items-center gap-1.5 justify-center">
                        {(isSelectedToday || doneThisWeek) && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{t.name}</span>
                      </div>
                      {doneThisWeek && !isSelectedToday && (
                        <span className="text-[10px] text-success/60 block mt-0.5">feito na semana</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        {/* ── CARDIO ── */}
        {(showAll || focusSection === "cardio") && (
          <SectionCard delay={0.16}>
            <div className="flex w-full items-center gap-2">
              <Heart className="h-5 w-5 shrink-0 text-pillar-cardio" />
              <h2 className={sectionHeadingClass}>Cardio</h2>
            </div>
            <Button
              onClick={() => handleCardio(!log.cardio.done)}
              variant={log.cardio.done ? "pillarCardio" : "outline"}
              className={cn(
                "w-full sm:w-auto active:scale-[0.97] transition-all",
                !log.cardio.done && "rounded-xl border-border hover:bg-muted/70 hover:text-foreground",
              )}
            >
              {log.cardio.done ? (
                <>
                  <Check className="w-4 h-4" />
                  Feito
                </>
              ) : (
                "Feito hoje"
              )}
            </Button>
            {log.cardio.done && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex w-full flex-wrap items-center gap-2 pt-1"
              >
                <Input
                  placeholder="Minutos"
                  type="number"
                  value={cardioMinutes}
                  onChange={(e) => {
                    setCardioMinutes(e.target.value);
                    setCardio(date, {
                      done: true,
                      minutes: parseInt(e.target.value) || undefined,
                      caloriesBurned: parseInt(cardioCals) || undefined,
                    });
                  }}
                  className="h-10 w-[7rem] shrink-0 bg-secondary border-border sm:w-28"
                />
                <Input
                  placeholder="kcal queimadas"
                  type="number"
                  value={cardioCals}
                  onChange={(e) => {
                    setCardioCals(e.target.value);
                    setCardio(date, {
                      done: true,
                      minutes: parseInt(cardioMinutes) || undefined,
                      caloriesBurned: parseInt(e.target.value) || undefined,
                    });
                  }}
                  className="h-10 min-w-0 flex-1 bg-secondary border-border"
                />
              </motion.div>
            )}
          </SectionCard>
        )}

        {/* ── SONO ── */}
        {(showAll || focusSection === "sleep") && (
          <SectionCard delay={0.24}>
            <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <Moon className="h-5 w-5 shrink-0 text-pillar-sleep" />
                <h2 className={sectionHeadingClass}>Sono</h2>
              </div>
              {isSleepGoalMet(log, data.goals) && data.goals.dailySleepHours > 0 && (
                <span className="shrink-0 text-xs font-medium text-success">Sono no alvo</span>
              )}
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="Horas de sono"
                type="number"
                step="0.5"
                value={sleepInput}
                onChange={(e) => setSleepInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSleep()}
                className="h-10 min-w-0 w-full bg-secondary border-border sm:max-w-[12rem] sm:flex-1"
              />
              <Button variant="cta" onClick={handleSleep} className="w-full shrink-0 sm:w-auto active:scale-[0.97]">
                Salvar
              </Button>
            </div>
            {log.sleepHours && data.goals.dailySleepHours > 0 && (
              <AnimatedProgressBar
                value={(log.sleepHours / data.goals.dailySleepHours) * 100}
                label={`${log.sleepHours}h`}
                sublabel={`/ ${data.goals.dailySleepHours}h`}
                variant={isDashboardSleepOnTrack(log, data.goals) ? "success" : "energy"}
                size="sm"
                successRange={{ min: 80, max: 140 }}
                warnAbove={140}
              />
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}
