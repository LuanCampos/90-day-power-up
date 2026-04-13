import { useState } from "react";
import { useChallenge } from "@/contexts/ChallengeContext";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { format, addDays, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedProgressBar } from "@/components/AnimatedProgressBar";
import { useToastCelebration } from "@/components/CelebrationOverlay";
import { ArrowLeft, Plus, X, Flame, Dumbbell, Heart, Moon, Check, ChevronLeft, ChevronRight } from "lucide-react";

export default function DayDetailPage() {
  const { date } = useParams<{ date: string }>();
  const [searchParams] = useSearchParams();
  const focusSection = searchParams.get("section");
  const navigate = useNavigate();
  const {
    data, getDayLog, getDayNumber, addCalorie, removeCalorie,
    setWorkout, setCardio, setSleep,
  } = useChallenge();
  const { celebrate, overlay } = useToastCelebration();

  const safeDate = date || "";
  const dayNum = getDayNumber(safeDate);
  const log = getDayLog(safeDate);

  const [calAmount, setCalAmount] = useState("");
  const [calLabel, setCalLabel] = useState("");
  const [sleepInput, setSleepInput] = useState(log.sleepHours?.toString() || "");
  const [cardioMinutes, setCardioMinutes] = useState(log.cardio.minutes?.toString() || "");
  const [cardioCals, setCardioCals] = useState(log.cardio.caloriesBurned?.toString() || "");

  if (!date) return null;

  const currentDate = parseISO(date);
  const prevDate = format(addDays(currentDate, -1), "yyyy-MM-dd");
  const nextDate = format(addDays(currentDate, 1), "yyyy-MM-dd");
  const prevDayNum = getDayNumber(prevDate);
  const nextDayNum = getDayNumber(nextDate);
  const canGoPrev = prevDayNum !== null;
  const canGoNext = nextDayNum !== null;

  // Get workouts already done this week
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekWorkoutIds = new Set<string>();
  for (let i = 0; i < 7; i++) {
    const d = format(addDays(weekStart, i), "yyyy-MM-dd");
    if (d === date) continue; // exclude current day
    const dayLog = getDayLog(d);
    if (dayLog.workout) weekWorkoutIds.add(dayLog.workout);
  }

  const handleAddCalorie = () => {
    const amount = parseInt(calAmount);
    if (isNaN(amount) || amount <= 0) return;
    addCalorie(date, { amount, label: calLabel || undefined });
    setCalAmount("");
    setCalLabel("");
    const newTotal = log.calories.reduce((s, c) => s + c.amount, 0) + amount;
    if (newTotal >= data.goals.dailyCalories && log.calories.reduce((s, c) => s + c.amount, 0) < data.goals.dailyCalories) {
      celebrate("goal", "Meta de calorias atingida! 🔥");
    }
  };

  const totalCalories = log.calories.reduce((s, c) => s + c.amount, 0);

  const handleSleep = () => {
    const hours = parseFloat(sleepInput);
    if (!isNaN(hours) && hours > 0) {
      setSleep(date, hours);
      if (hours >= data.goals.dailySleepHours) {
        celebrate("goal", "Meta de sono atingida! 😴");
      }
    }
  };

  const handleCardio = (done: boolean) => {
    setCardio(date, {
      done,
      minutes: parseInt(cardioMinutes) || undefined,
      caloriesBurned: parseInt(cardioCals) || undefined,
    });
    if (done) celebrate("goal", "Cardio registrado! 💪");
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

        {/* Day navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => canGoPrev && navigate(`/day/${prevDate}${focusSection ? `?section=${focusSection}` : ""}`)}
            disabled={!canGoPrev}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {dayNum ? `Dia ${dayNum}` : date}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <button
            onClick={() => canGoNext && navigate(`/day/${nextDate}${focusSection ? `?section=${focusSection}` : ""}`)}
            disabled={!canGoNext}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Calories */}
        {(showAll || focusSection === "calories") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl card-elevated border border-border space-y-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-energy" />
              <h2 className="font-display font-semibold text-foreground">Calorias</h2>
              <span className="ml-auto text-2xl font-display font-bold text-foreground">{totalCalories}</span>
              <span className="text-sm text-muted-foreground">kcal</span>
            </div>
            <AnimatedProgressBar
              value={data.goals.dailyCalories > 0 ? (totalCalories / data.goals.dailyCalories) * 100 : 0}
              variant="energy" size="sm" showPercentage={false}
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

        {/* Workout */}
        {(showAll || focusSection === "workout") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl card-elevated border border-border space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-5 h-5 text-success" />
              <h2 className="font-display font-semibold text-foreground">Treino</h2>
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
                      if (newId) celebrate("goal", `Treino "${t.name}" registrado! 💪`);
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

        {/* Cardio */}
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

        {/* Sleep */}
        {(showAll || focusSection === "sleep") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-5 rounded-2xl card-elevated border border-border space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Moon className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold text-foreground">Sono</h2>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Horas de sono" type="number" step="0.5" value={sleepInput} onChange={(e) => setSleepInput(e.target.value)} className="w-32 bg-secondary border-border" />
              <Button onClick={handleSleep} className="gradient-success text-primary-foreground border-0">Salvar</Button>
            </div>
            {log.sleepHours && (
              <AnimatedProgressBar value={(log.sleepHours / data.goals.dailySleepHours) * 100} label={`${log.sleepHours}h`} sublabel={`/ ${data.goals.dailySleepHours}h`} variant="success" size="sm" />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
