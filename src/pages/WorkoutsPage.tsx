import { useState } from "react";
import { useChallenge } from "@/contexts/ChallengeContext";
import { useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubpageHeader } from "@/components/SubpageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ActionIconButton } from "@/components/ActionIconButton";
import { Plus, Trash2, Dumbbell, ChevronRight } from "lucide-react";
import { toast } from "@/components/ui/sonner";

export default function WorkoutsPage() {
  const { data, addWorkoutTemplate, removeWorkoutTemplate } = useChallenge();
  const navigate = useNavigate();
  const [newName, setNewName] = useState("");

  if (!data.startDate) {
    return <Navigate to="/setup" replace />;
  }

  const handleAdd = () => {
    if (!newName.trim()) return;
    addWorkoutTemplate({ name: newName.trim(), order: data.workoutTemplates.length, exercises: [] });
    setNewName("");
    toast.success("Treino adicionado.");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <SubpageHeader title="Meus Treinos" onBack={() => navigate("/")} />

      <div className="px-5 space-y-3">
        {data.workoutTemplates.length === 0 && (
          <EmptyState
            icon={<Dumbbell className="w-12 h-12" />}
            title="Nenhum treino cadastrado"
            description="Adicione seus treinos para poder registrá-los nos dias do desafio."
          />
        )}

        <AnimatePresence>
          {data.workoutTemplates.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-4 rounded-2xl card-elevated border border-border cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => navigate(`/workouts/${t.id}`)}
            >
              <div className="p-2 rounded-xl bg-secondary shrink-0">
                <Dumbbell className="w-4 h-4 text-pillar-workout" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{t.name}</p>
                <div className="flex items-center gap-2 mt-0.5 min-w-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {t.exercises.length} exercício{t.exercises.length !== 1 ? "s" : ""}
                  </span>
                  {t.focus && (
                    <span className="text-xs text-muted-foreground truncate">· {t.focus}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              <ActionIconButton
                intent="danger"
                onClick={(e) => { e.stopPropagation(); removeWorkoutTemplate(t.id); }}
                aria-label={`Remover treino ${t.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </ActionIconButton>
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 pt-2">
          <Input
            placeholder="Nome do treino (ex: Pernas)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 bg-secondary border-border"
          />
          <Button variant="cta" onClick={handleAdd} className="active:scale-[0.97]">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
