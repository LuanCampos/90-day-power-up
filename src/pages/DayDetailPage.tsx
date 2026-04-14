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
  getDailySuggestion,
  hasCelebratedMilestone,
  isCalorieGoalMet,
  isCalorieDayReviewOk,
  isDayFullyComplete,
  isDashboardSleepOnTrack,
  isSleepDayReviewOk,
  isSleepGoalMet,
} from "@/lib/challenge-progress";
import { SubpageHeader } from "@/components/SubpageHeader";
import { cn } from "@/lib/utils";
import { sectionHeadingClass } from "@/lib/page-ui";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus, Trash2, Flame, Dumbbell, Heart, Moon, Check, ChevronLeft, ChevronRight,
  Play, CheckCircle, CalendarClock,
} from "lucide-react";

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

  // Action dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTarget, setDialogTarget] = useState<{ type: "workout" | "cardio"; templateId: string } | null>(null);

  const prevDayCompleteRef = useRef<{ date: string; complete: boolean } | null>(null);
  const lastWeekFireRef = useRef<string | null>(null);

  useEffect(() => {
    const complete = isDayFullyComplete(log, data.goals, data.workoutTemplates.length, data.cardioTemplates.length);
    const prev = prevDayCompleteRef.current;
    if (!prev || prev.date !== safeDate) {
      prevDayCompleteRef.current = { date: safeDate, complete };
      return;
    }
    if (!prev.complete && complete) {
      celebrate("day", "Dia completo! Todas as metas de hoje estão em dia.");
    }
    prevDayCompleteRef.current = { date: safeDate, complete };
  }, [log, data.goals, data.workoutTemplates.length, data.cardioTemplates.length, safeDate, celebrate]);

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

  // Weekly template usage tracking
  const weekWorkoutIds = new Set<string>();
  const weekCardioIds = new Set<string>();
  if (dayNum != null && data.startDate) {
    const { firstDay, lastDay } = challengeBlockDayRange(dayNum);
    const base = new Date(data.startDate + "T00:00:00");
    for (let dNum = firstDay; dNum <= lastDay; dNum++) {
      const d = format(addDays(base, dNum - 1), "yyyy-MM-dd");
      if (d === date) continue;
      const dayLog = getDayLog(d);
      if (dayLog.workout) weekWorkoutIds.add(dayLog.workout);
      if (dayLog.cardio) weekCardioIds.add(dayLog.cardio);
    }
  }

  // Daily suggestion based on 7-day cycle
  const suggestion = dayNum != null ? getDailySuggestion(dayNum, data.weeklySchedule) : null;

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

  const dailySleepGoal = data.goals.dailySleepHours;
  const sleepHours = log.sleepHours ?? 0;
  const sleepRatio = dailySleepGoal > 0 && sleepHours > 0 ? sleepHours / dailySleepGoal : 0;
  const sleepClosedDayOk =
    dailySleepGoal > 0 && date < todayStr && isSleepDayReviewOk(log, data.goals, date, todayStr);

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

  // Template tap handlers
  const handleWorkoutTap = (templateId: string) => {
    const isSelected = log.workout === templateId;
    if (isSelected) {
      setWorkout(date, undefined);
      return;
    }
    setDialogTarget({ type: "workout", templateId });
    setDialogOpen(true);
  };

  const handleCardioTap = (templateId: string) => {
    const isSelected = log.cardio === templateId;
    if (isSelected) {
      setCardio(date, undefined);
      return;
    }
    setDialogTarget({ type: "cardio", templateId });
    setDialogOpen(true);
  };

  const handleMarkDone = () => {
    if (!dialogTarget) return;
    if (dialogTarget.type === "workout") {
      setWorkout(date, dialogTarget.templateId);
      const t = data.workoutTemplates.find(w => w.id === dialogTarget.templateId);
      celebrate("goal", `Treino "${t?.name}" registrado!`);
    } else {
      setCardio(date, dialogTarget.templateId);
      celebrate("goal", "Cardio registrado!");
    }
    setDialogOpen(false);
    setDialogTarget(null);
  };

  const handleDoNow = () => {
    if (!dialogTarget) return;
    setDialogOpen(false);
    if (dialogTarget.type === "workout") {
      navigate(`/session/workout/${dialogTarget.templateId}?date=${date}`);
    } else {
      navigate(`/session/cardio/${dialogTarget.templateId}?date=${date}`);
    }
    setDialogTarget(null);
  };

  // Active session resume
  const activeSession = data.activeSession;
  const hasWorkoutSession = activeSession?.type === "workout" && activeSession.date === date;
  const hasCardioSession = activeSession?.type === "cardio" && activeSession.date === date;

  const showAll = !focusSection;

  const dialogTemplateLabel = dialogTarget
    ? dialogTarget.type === "workout"
      ? data.workoutTemplates.find(w => w.id === dialogTarget.templateId)?.name
      : data.cardioTemplates.find(c => c.id === dialogTarget.templateId)?.name
    : "";

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

      {/* Suggestion banner */}
      {suggestion && showAll && (
        <div className="px-5 pb-2">
          <div className={cn(
            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm",
            suggestion.workoutId
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
          )}>
            <CalendarClock className="h-4 w-4 shrink-0" />
            <div>
              <span className="font-medium">Sugestão do dia:</span>{" "}
              <span>{suggestion.label}</span>
            </div>
          </div>
        </div>
      )}

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

            {/* Resume banner */}
            {hasWorkoutSession && activeSession && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/session/workout/${activeSession.templateId}?date=${date}`)}
                  className="w-full border-pillar-workout/30 text-pillar-workout hover:bg-pillar-workout/10 rounded-xl"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Retomar treino em andamento
                </Button>
              </motion.div>
            )}

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
                  const isSuggested = !isSelectedToday && !doneThisWeek && suggestion?.workoutId === t.id;
                  return (
                    <button key={t.id} onClick={() => handleWorkoutTap(t.id)}
                      className={cn(
                        "p-3 rounded-xl text-sm font-medium transition-all border active:scale-[0.97]",
                        isSelectedToday
                          ? "border-success bg-success/10 text-success"
                          : doneThisWeek
                            ? "border-success/30 bg-success/5 text-muted-foreground"
                            : isSuggested
                              ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20 text-muted-foreground"
                              : "border-border bg-secondary text-muted-foreground hover:border-primary/30",
                      )}>
                      <div className="flex items-center gap-1.5 justify-center">
                        {(isSelectedToday || doneThisWeek) && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{t.name}</span>
                      </div>
                      {doneThisWeek && !isSelectedToday && (
                        <span className="text-[10px] text-success/60 block mt-0.5">feito na semana</span>
                      )}
                      {isSuggested && (
                        <span className="text-[10px] text-primary/70 block mt-0.5">sugerido</span>
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
            <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <Heart className="h-5 w-5 shrink-0 text-pillar-cardio" />
                <h2 className={sectionHeadingClass}>Cardio</h2>
              </div>
              {log.cardio && data.cardioTemplates.length > 0 && (
                <span className="shrink-0 text-xs font-medium text-success">Feito hoje</span>
              )}
            </div>

            {/* Resume banner */}
            {hasCardioSession && activeSession && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/session/cardio/${activeSession.templateId}?date=${date}`)}
                  className="w-full border-pillar-cardio/30 text-pillar-cardio hover:bg-pillar-cardio/10 rounded-xl"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Retomar cardio em andamento
                </Button>
              </motion.div>
            )}

            {data.cardioTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum cardio cadastrado.{" "}
                <button onClick={() => navigate("/cardios")} className="text-primary underline">Cadastrar cardios</button>
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {data.cardioTemplates.map((t) => {
                  const isSelectedToday = log.cardio === t.id;
                  const doneThisWeek = weekCardioIds.has(t.id);
                  const isSuggested = !isSelectedToday && !doneThisWeek && suggestion?.cardioId === t.id;
                  return (
                    <button key={t.id} onClick={() => handleCardioTap(t.id)}
                      className={cn(
                        "p-3 rounded-xl text-sm font-medium transition-all border active:scale-[0.97]",
                        isSelectedToday
                          ? "border-success bg-success/10 text-success"
                          : doneThisWeek
                            ? "border-success/30 bg-success/5 text-muted-foreground"
                            : isSuggested
                              ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20 text-muted-foreground"
                              : "border-border bg-secondary text-muted-foreground hover:border-primary/30",
                      )}>
                      <div className="flex items-center gap-1.5 justify-center">
                        {(isSelectedToday || doneThisWeek) && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{t.name}</span>
                      </div>
                      {doneThisWeek && !isSelectedToday && (
                        <span className="text-[10px] text-success/60 block mt-0.5">feito na semana</span>
                      )}
                      {isSuggested && (
                        <span className="text-[10px] text-primary/70 block mt-0.5">sugerido</span>
                      )}
                    </button>
                  );
                })}
              </div>
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

            {sleepClosedDayOk && (
              <p className="text-xs font-medium text-success">No alvo (≥ 90% da meta)</p>
            )}
            {dailySleepGoal > 0 && sleepHours > 0 && sleepRatio < 0.9 && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-500">Abaixo de 90% da meta</p>
            )}
            {dailySleepGoal > 0 && date === todayStr && sleepHours === 0 && (
              <p className="text-xs text-muted-foreground">Registre as horas de sono do dia.</p>
            )}
            {dailySleepGoal > 0 && sleepHours > 0 && (
              <p className="text-xs text-muted-foreground">{sleepHours}h / {dailySleepGoal}h dormidas</p>
            )}

            {log.sleepHours && dailySleepGoal > 0 && (
              <AnimatedProgressBar
                value={(log.sleepHours / dailySleepGoal) * 100}
                label={`${log.sleepHours}h`}
                sublabel={`/ ${dailySleepGoal}h`}
                variant={isDashboardSleepOnTrack(log, data.goals) ? "success" : "energy"}
                size="sm"
                successRange={{ min: 90, max: Infinity }}
              />
            )}
          </SectionCard>
        )}
      </div>

      {/* Action dialog: Marcar como feito / Fazer agora */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{dialogTemplateLabel}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleMarkDone}
              className="w-full h-12 rounded-xl active:scale-[0.97]"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Marcar como feito
            </Button>
            {dialogTarget && (
              dialogTarget.type === "workout" ||
              data.cardioTemplates.find(c => c.id === dialogTarget.templateId)?.youtubeLink
            ) && (
              <Button
                variant="cta"
                onClick={handleDoNow}
                className="w-full h-12 rounded-xl active:scale-[0.97]"
              >
                <Play className="w-5 h-5 mr-2" />
                Fazer agora
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
