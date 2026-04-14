import { useEffect, useRef, useState } from "react";
import { useChallenge } from "@/contexts/ChallengeContext";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { format, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedProgressBar } from "@/components/AnimatedProgressBar";
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
  isSleepGoalMet,
} from "@/lib/challenge-progress";
import { ArrowLeft, Plus, X, Flame, Dumbbell, Heart, Moon, Check, ChevronLeft, ChevronRight } from "lucide-react";

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
  const calRatio = dailyCalGoal > 0 ? totalCalories / dailyCalGoal : 0;
  const caloriesRemaining = dailyCalGoal > 0 ? Math.max(0, dailyCalGoal - totalCalories) : null;
  const caloriesClosedDayOk =
    dailyCalGoal > 0 && date < todayStr && isCalorieDayReviewOk(log, data.goals, date, todayStr);
  const caloriesTodayInBand =
    dailyCalGoal > 0 && date === todayStr && isCalorieGoalMet(log, data.goals);

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
      <div className="px-5 pt-8 pb-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar</span>
        </button>

        <div className={`flex items-center ${focusSection ? "justify-center" : "justify-between"}`}>
          {!focusSection && (
            <button
              onClick={() => canGoPrev && navigate(`/day/${prevDate}`)}
              disabled={!canGoPrev}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {dayNum ? `Dia ${dayNum}` : date}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          {!focusSection && (
            <button
              onClick={() => canGoNext && navigate(`/day/${nextDate}`)}
              disabled={!canGoNext}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 space-y-5">
        {(showAll || focusSection === "calories") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl card-elevated border border-border space-y-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-energy" />
              <h2 className="font-display font-semibold text-foreground">Calorias</h2>
              <span className="ml-auto text-2xl font-display font-bold text-foreground tabular-nums">
                {caloriesRemaining !== null ? caloriesRemaining : totalCalories}
              </span>
              <span className="text-sm text-muted-foreground">
                {caloriesRemaining !== null ? "restantes" : "kcal"}
              </span>
            </div>
            {caloriesClosedDayOk && (
              <p className="text-xs font-medium text-success">No alvo (50–100% da meta)</p>
            )}
            {caloriesTodayInBand && (
              <p className="text-xs text-muted-foreground">Entre 50% e 100% da meta (o dia ainda não fechou).</p>
            )}
            {dailyCalGoal > 0 && totalCalories > 0 && calRatio > 1 && (
              <p className="text-xs font-medium text-destructive">Acima da meta diária</p>
            )}
            {dailyCalGoal > 0 && totalCalories > 0 && calRatio < 0.5 && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-500">Abaixo de 50% da meta</p>
            )}
            {dailyCalGoal > 0 && date === todayStr && totalCalories === 0 && (
              <p className="text-xs text-muted-foreground">Registre as calorias ao longo do dia.</p>
            )}
            {caloriesRemaining !== null && (
              <p className="text-xs text-muted-foreground">{totalCalories} / {dailyCalGoal} kcal consumidas</p>
            )}
            <AnimatedProgressBar
              value={dailyCalGoal > 0 ? (totalCalories / dailyCalGoal) * 100 : 0}
              variant="energy"
              size="sm"
              showPercentage={false}
              successRange={dailyCalGoal > 0 ? { min: 50, max: 100 } : undefined}
              completeHighlight={date < todayStr}
            />
            <AnimatePresence>
              {log.calories.map((entry) => (
                <motion.div key={entry.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <span className="text-sm text-foreground">{entry.amount} kcal</span>
                    {entry.label && <span className="ml-2 text-xs text-muted-foreground">{entry.label}</span>}
                  </div>
                  <button onClick={() => removeCalorie(date, entry.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="flex gap-2">
              <Input placeholder="kcal" type="number" value={calAmount} onChange={(e) => setCalAmount(e.target.value)} className="w-24 bg-secondary border-border" />
              <Input placeholder="Descrição (opcional)" value={calLabel} onChange={(e) => setCalLabel(e.target.value)} className="flex-1 bg-secondary border-border" />
              <Button onClick={handleAddCalorie} size="icon" className="gradient-energy text-primary-foreground border-0 shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {(showAll || focusSection === "workout") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl card-elevated border border-border space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-5 h-5 text-success" />
              <h2 className="font-display font-semibold text-foreground">Treino</h2>
              {log.workout && data.workoutTemplates.length > 0 && (
                <span className="ml-auto text-xs font-medium text-success">Feito hoje</span>
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
                      className={`p-3 rounded-xl text-sm font-medium transition-all border ${
                        isSelectedToday
                          ? "border-success bg-success/10 text-success"
                          : doneThisWeek
                            ? "border-success/30 bg-success/5 text-muted-foreground"
                            : "border-border bg-secondary text-muted-foreground hover:border-primary/30"
                      }`}>
                      <div className="flex items-center gap-1 justify-center">
                        {(isSelectedToday || doneThisWeek) && <Check className="w-3 h-3 inline" />}
                        <span>{t.name}</span>
                      </div>
                      {doneThisWeek && !isSelectedToday && (
                        <span className="text-[10px] text-success/60 block mt-0.5">feito na semana</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {(showAll || focusSection === "cardio") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-2xl card-elevated border border-border space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5 text-fire" />
              <h2 className="font-display font-semibold text-foreground">Cardio</h2>
            </div>
            <Button onClick={() => handleCardio(!log.cardio.done)}
              variant={log.cardio.done ? "default" : "outline"}
              className={log.cardio.done ? "gradient-energy text-primary-foreground border-0" : "border-border"}>
              {log.cardio.done ? "✓ Feito" : "Feito hoje"}
            </Button>
            {log.cardio.done && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex gap-2 pt-2">
                <Input placeholder="Minutos" type="number" value={cardioMinutes}
                  onChange={(e) => { setCardioMinutes(e.target.value); setCardio(date, { done: true, minutes: parseInt(e.target.value) || undefined, caloriesBurned: parseInt(cardioCals) || undefined }); }}
                  className="w-28 bg-secondary border-border" />
                <Input placeholder="kcal queimadas" type="number" value={cardioCals}
                  onChange={(e) => { setCardioCals(e.target.value); setCardio(date, { done: true, minutes: parseInt(cardioMinutes) || undefined, caloriesBurned: parseInt(e.target.value) || undefined }); }}
                  className="flex-1 bg-secondary border-border" />
              </motion.div>
            )}
          </motion.div>
        )}

        {(showAll || focusSection === "sleep") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-5 rounded-2xl card-elevated border border-border space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Moon className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold text-foreground">Sono</h2>
              {isSleepGoalMet(log, data.goals) && data.goals.dailySleepHours > 0 && (
                <span className="ml-auto text-xs font-medium text-success">Meta atingida</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Horas de sono" type="number" step="0.5" value={sleepInput} onChange={(e) => setSleepInput(e.target.value)} className="w-32 bg-secondary border-border" />
              <Button onClick={handleSleep} className="gradient-success text-primary-foreground border-0">Salvar</Button>
            </div>
            {log.sleepHours && data.goals.dailySleepHours > 0 && (
              <AnimatedProgressBar
                value={(log.sleepHours / data.goals.dailySleepHours) * 100}
                label={`${log.sleepHours}h`}
                sublabel={`/ ${data.goals.dailySleepHours}h`}
                variant="success"
                size="sm"
                successRange={{ min: 80, max: 140 }}
              />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
