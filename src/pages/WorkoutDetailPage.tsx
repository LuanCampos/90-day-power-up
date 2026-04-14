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
import { Plus, Trash2, Dumbbell, Target, Clock, TrendingUp } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AreaChart, Area, ResponsiveContainer, LabelList } from "recharts";
import type { WorkoutExercise, ExerciseModality, ExerciseWeightEntry } from "@/types/challenge";

function ModalityToggle({
  value,
  onChange,
  size = "sm",
}: {
  value: ExerciseModality;
  onChange: (v: ExerciseModality) => void;
  size?: "sm" | "md";
}) {
  const opts: { key: ExerciseModality; emoji: string; label: string }[] = [
    { key: "dumbbell", emoji: "🏋️", label: "Halteres" },
    { key: "bodyweight", emoji: "🤸", label: "Peso do Corpo" },
  ];
  const isSm = size === "sm";
  return (
    <div className="flex rounded-lg overflow-hidden border border-border">
      {opts.map(o => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            "flex items-center gap-1 transition-colors",
            isSm ? "px-2 py-0.5 text-[11px]" : "px-3 py-1.5 text-xs",
            value === o.key
              ? "bg-primary text-primary-foreground font-medium"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80",
          )}
        >
          <span>{o.emoji}</span>
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

const CHART_COLOR = "#f97316";

function WeightEvolutionChart({ entries }: { entries: ExerciseWeightEntry[] }) {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const chartData = sorted.map(e => ({
    label: format(parseISO(e.date), "dd/MMM", { locale: ptBR }),
    weight: e.weight,
  }));

  const lastWeight = sorted[sorted.length - 1].weight;

  return (
    <div className="mt-2 pt-2 border-t border-border/50">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Evolução de carga
        </span>
        <span className="text-[10px] font-semibold text-foreground">
          Última: {lastWeight} kg
        </span>
      </div>
      <div className="h-14">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 14, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="grad-exercise-weight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.3} />
                <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="weight"
              stroke={CHART_COLOR}
              strokeWidth={2}
              fill="url(#grad-exercise-weight)"
              connectNulls
              dot={{ r: 3, fill: CHART_COLOR, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: CHART_COLOR, strokeWidth: 0 }}
            >
              <LabelList
                dataKey="weight"
                position="top"
                style={{ fontSize: 9, fill: CHART_COLOR, fontWeight: 600 }}
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, updateWorkoutTemplate } = useChallenge();

  const template = data.workoutTemplates.find(t => t.id === id);

  const [newExName, setNewExName] = useState("");
  const [newExSets, setNewExSets] = useState("3");
  const [newExReps, setNewExReps] = useState("");
  const [newExMuscles, setNewExMuscles] = useState("");
  const [newExModality, setNewExModality] = useState<ExerciseModality>("dumbbell");

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
      modality: newExModality,
    };
    update({ exercises: [...template.exercises, ex] });
    setNewExName("");
    setNewExSets("3");
    setNewExReps("");
    setNewExMuscles("");
    setNewExModality("dumbbell");
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

  const getWeightEntries = (exId: string): ExerciseWeightEntry[] =>
    data.exerciseWeightLogs?.[exId] ?? [];

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
              {template.exercises.map((ex, i) => {
                const modality = ex.modality ?? "dumbbell";
                const isDumbbell = modality === "dumbbell";
                const weightEntries = isDumbbell ? getWeightEntries(ex.id) : [];

                return (
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
                        <ModalityToggle
                          value={modality}
                          onChange={v => updateExercise(ex.id, { modality: v })}
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
                        {isDumbbell && <WeightEvolutionChart entries={weightEntries} />}
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
                );
              })}
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
            <ModalityToggle value={newExModality} onChange={setNewExModality} size="md" />
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
