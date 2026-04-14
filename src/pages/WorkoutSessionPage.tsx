import { useEffect, useMemo } from "react";
import { useChallenge } from "@/contexts/ChallengeContext";
import { useParams, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCelebration } from "@/components/CelebrationOverlay";
import { AnimatedProgressBar } from "@/components/AnimatedProgressBar";
import { SubpageHeader } from "@/components/SubpageHeader";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check, Dumbbell, Target } from "lucide-react";

export default function WorkoutSessionPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date") || "";
  const navigate = useNavigate();
  const { data, setWorkout, startSession, updateSession, clearSession } = useChallenge();
  const { celebrate, overlay } = useCelebration();

  const template = data.workoutTemplates.find(t => t.id === id);
  const session = data.activeSession;

  const isResuming = session?.type === "workout" && session.templateId === id && session.date === dateParam;

  useEffect(() => {
    if (!template || !dateParam || isResuming) return;
    const progress: Record<string, boolean[]> = {};
    for (const ex of template.exercises) {
      progress[ex.id] = Array(ex.sets).fill(false);
    }
    startSession({
      type: "workout",
      templateId: template.id,
      date: dateParam,
      exerciseProgress: progress,
      currentExerciseIndex: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id, dateParam]);

  const activeSession = isResuming ? session : data.activeSession;

  const currentIndex = activeSession?.currentExerciseIndex ?? 0;
  const exerciseProgress = activeSession?.exerciseProgress ?? {};

  const exercises = useMemo(() => template?.exercises ?? [], [template?.exercises]);
  const currentExercise = exercises[currentIndex];

  const totalSets = useMemo(
    () => exercises.reduce((sum, ex) => sum + ex.sets, 0),
    [exercises],
  );
  const completedSets = useMemo(
    () => Object.values(exerciseProgress).reduce(
      (sum, sets) => sum + sets.filter(Boolean).length, 0,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeSession?.exerciseProgress],
  );

  if (!data.startDate) return <Navigate to="/setup" replace />;
  if (!template || exercises.length === 0) return <Navigate to={`/day/${dateParam}`} replace />;

  const currentSets = exerciseProgress[currentExercise?.id] ?? [];
  const allCurrentSetsDone = currentSets.length > 0 && currentSets.every(Boolean);
  const isLastExercise = currentIndex === exercises.length - 1;
  const allDone = completedSets === totalSets;

  const toggleSet = (setIndex: number) => {
    if (!currentExercise) return;
    const updated = [...currentSets];
    updated[setIndex] = !updated[setIndex];
    updateSession({
      exerciseProgress: { ...exerciseProgress, [currentExercise.id]: updated },
    });
  };

  const goTo = (index: number) => {
    if (index >= 0 && index < exercises.length) {
      updateSession({ currentExerciseIndex: index });
    }
  };

  const handleComplete = () => {
    setWorkout(dateParam, template.id);
    clearSession();
    celebrate("day", `Treino "${template.name}" concluído!`);
    setTimeout(() => navigate(`/day/${dateParam}`), 3500);
  };

  const progressPct = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      {overlay}
      <SubpageHeader
        title={template.name}
        onBack={() => navigate(`/day/${dateParam}`)}
      />

      <div className="px-5 flex-1 flex flex-col">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Exercício {currentIndex + 1} de {exercises.length}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {completedSets}/{totalSets} séries
            </span>
          </div>
          <AnimatedProgressBar
            value={progressPct}
            variant={allDone ? "success" : "energy"}
            size="sm"
            showPercentage={false}
          />
        </div>

        {/* Exercise card */}
        {currentExercise && (
          <motion.div
            key={currentExercise.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border card-elevated p-6 space-y-5 flex-1"
          >
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 text-pillar-workout">
                <Dumbbell className="w-5 h-5" />
                <span className="text-xs font-medium uppercase tracking-wider">Exercício {currentIndex + 1}</span>
              </div>
              <h2 className="text-xl font-display font-bold text-foreground">{currentExercise.name}</h2>
              <p className="text-sm text-muted-foreground">
                {currentExercise.sets} x {currentExercise.reps}
              </p>
              {currentExercise.targetMuscles && (
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 pt-1">
                  <Target className="w-3 h-3" />
                  {currentExercise.targetMuscles}
                </p>
              )}
            </div>

            {/* Set checkmarks */}
            <div className="flex items-center justify-center gap-3 pt-4">
              {currentSets.map((done, si) => (
                <motion.button
                  key={si}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleSet(si)}
                  className={cn(
                    "w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all",
                    done
                      ? "border-success bg-success/15 text-success"
                      : "border-border bg-secondary text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {done ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span className="text-lg font-bold tabular-nums">{si + 1}</span>
                  )}
                </motion.button>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {allCurrentSetsDone
                ? "Todas as séries concluídas!"
                : "Toque para marcar cada série"}
            </p>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 pt-6 pb-4">
          <Button
            variant="outline"
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="rounded-xl active:scale-[0.97]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          {isLastExercise && allDone ? (
            <Button
              variant="cta"
              onClick={handleComplete}
              className="flex-1 rounded-xl active:scale-[0.97]"
            >
              <Check className="w-4 h-4 mr-1" />
              Concluir Treino
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => goTo(currentIndex + 1)}
              disabled={isLastExercise}
              className="rounded-xl active:scale-[0.97]"
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
