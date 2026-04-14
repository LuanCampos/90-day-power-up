import { useState } from "react";
import { useChallenge } from "@/contexts/ChallengeContext";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubpageHeader } from "@/components/SubpageHeader";
import { SectionCard } from "@/components/SectionCard";
import { ActionIconButton } from "@/components/ActionIconButton";
import { sectionHeadingClass } from "@/lib/page-ui";
import { Plus, Trash2, Dumbbell, Target, Clock } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import type { WorkoutExercise } from "@/types/challenge";

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, updateWorkoutTemplate } = useChallenge();

  const template = data.workoutTemplates.find(t => t.id === id);

  const [newExName, setNewExName] = useState("");
  const [newExSets, setNewExSets] = useState("3");
  const [newExReps, setNewExReps] = useState("");
  const [newExMuscles, setNewExMuscles] = useState("");

  if (!data.startDate) return <Navigate to="/setup" replace />;
  if (!template) return <Navigate to="/workouts" replace />;

  const update = (patch: Partial<typeof template>) => {
    updateWorkoutTemplate({ ...template, ...patch });
  };

  const addExercise = () => {
    if (!newExName.trim() || !newExReps.trim()) return;
    const ex: WorkoutExercise = {
      id: crypto.randomUUID(),
      name: newExName.trim(),
      sets: Math.max(1, parseInt(newExSets) || 3),
      reps: newExReps.trim(),
      targetMuscles: newExMuscles.trim(),
    };
    update({ exercises: [...template.exercises, ex] });
    setNewExName("");
    setNewExSets("3");
    setNewExReps("");
    setNewExMuscles("");
    toast.success("Exercício adicionado.");
  };

  const updateExercise = (exId: string, patch: Partial<WorkoutExercise>) => {
    update({
      exercises: template.exercises.map(e =>
        e.id === exId ? { ...e, ...patch } : e,
      ),
    });
  };

  const removeExercise = (exId: string) => {
    update({ exercises: template.exercises.filter(e => e.id !== exId) });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <SubpageHeader title={template.name} onBack={() => navigate("/workouts")} />

      <div className="px-5 space-y-5">
        {/* Meta info */}
        <SectionCard>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome</label>
              <Input
                value={template.name}
                onChange={e => update({ name: e.target.value })}
                className="mt-1 bg-secondary border-border"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Target className="w-3 h-3" /> Foco
                </label>
                <Input
                  value={template.focus || ""}
                  onChange={e => update({ focus: e.target.value || undefined })}
                  placeholder="Ex: Peitoral, costas"
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <div className="w-24">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Min
                </label>
                <Input
                  type="number"
                  value={template.estimatedMinutes ?? ""}
                  onChange={e => update({ estimatedMinutes: parseInt(e.target.value) || undefined })}
                  placeholder="45"
                  className="mt-1 bg-secondary border-border"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Exercises list */}
        <div>
          <h2 className={sectionHeadingClass + " flex items-center gap-2 mb-3"}>
            <Dumbbell className="w-4 h-4 text-pillar-workout" />
            Exercícios ({template.exercises.length})
          </h2>

          <div className="space-y-2">
            <AnimatePresence>
              {template.exercises.map((ex, i) => (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-3 rounded-2xl card-elevated border border-border space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 text-xs font-bold text-muted-foreground tabular-nums w-5 text-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0 space-y-2">
                      <Input
                        value={ex.name}
                        onChange={e => updateExercise(ex.id, { name: e.target.value })}
                        className="bg-transparent border-0 p-0 h-auto text-foreground font-medium focus-visible:ring-0"
                        placeholder="Nome do exercício"
                      />
                      <div className="flex gap-2">
                        <div className="w-16">
                          <Input
                            type="number"
                            value={ex.sets}
                            onChange={e => updateExercise(ex.id, { sets: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="bg-secondary border-border text-xs h-7 text-center"
                            min={1}
                          />
                          <span className="text-[10px] text-muted-foreground text-center block mt-0.5">séries</span>
                        </div>
                        <div className="flex-1">
                          <Input
                            value={ex.reps}
                            onChange={e => updateExercise(ex.id, { reps: e.target.value })}
                            className="bg-secondary border-border text-xs h-7"
                            placeholder="8-12"
                          />
                          <span className="text-[10px] text-muted-foreground block mt-0.5">reps</span>
                        </div>
                      </div>
                      <Input
                        value={ex.targetMuscles}
                        onChange={e => updateExercise(ex.id, { targetMuscles: e.target.value })}
                        className="bg-secondary border-border text-xs h-7"
                        placeholder="Músculos alvo"
                      />
                    </div>
                    <ActionIconButton
                      intent="danger"
                      onClick={() => removeExercise(ex.id)}
                      aria-label={`Remover ${ex.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </ActionIconButton>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add exercise form */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-3 rounded-2xl border border-dashed border-border space-y-2">
            <Input
              placeholder="Nome do exercício"
              value={newExName}
              onChange={e => setNewExName(e.target.value)}
              className="bg-secondary border-border"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Séries"
                value={newExSets}
                onChange={e => setNewExSets(e.target.value)}
                className="w-20 bg-secondary border-border"
                min={1}
              />
              <Input
                placeholder="Reps (ex: 8-12)"
                value={newExReps}
                onChange={e => setNewExReps(e.target.value)}
                className="flex-1 bg-secondary border-border"
              />
            </div>
            <Input
              placeholder="Músculos alvo (opcional)"
              value={newExMuscles}
              onChange={e => setNewExMuscles(e.target.value)}
              className="bg-secondary border-border"
            />
            <Button
              variant="cta"
              onClick={addExercise}
              disabled={!newExName.trim() || !newExReps.trim()}
              className="w-full active:scale-[0.97]"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Exercício
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
