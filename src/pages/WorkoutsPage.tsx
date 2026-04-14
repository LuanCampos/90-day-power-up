import { useState } from "react";
import { useChallenge } from "@/contexts/ChallengeContext";
import { useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubpageHeader } from "@/components/SubpageHeader";
import { Plus, Trash2, Dumbbell } from "lucide-react";
import { toast } from "@/components/ui/sonner";

export default function WorkoutsPage() {
  const { data, addWorkoutTemplate, updateWorkoutTemplate, removeWorkoutTemplate } = useChallenge();
  const navigate = useNavigate();
  const [newName, setNewName] = useState("");

  if (!data.startDate) {
    return <Navigate to="/setup" replace />;
  }

  const handleAdd = () => {
    if (!newName.trim()) return;
    addWorkoutTemplate({ name: newName.trim(), order: data.workoutTemplates.length });
    setNewName("");
    toast.success("Treino adicionado.");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <SubpageHeader title="Meus Treinos" onBack={() => navigate("/")} />

      <div className="px-5 space-y-5">
        <AnimatePresence>
          {data.workoutTemplates.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-4 rounded-2xl card-elevated border border-border group"
            >
              <div className="p-2 rounded-xl bg-secondary text-muted-foreground">
                <Dumbbell className="w-4 h-4 text-pillar-workout" />
              </div>
              <div className="flex-1">
                <Input
                  value={t.name}
                  onChange={(e) => updateWorkoutTemplate({ ...t, name: e.target.value })}
                  className="bg-transparent border-0 p-0 h-auto text-foreground font-medium focus-visible:ring-0"
                />
              </div>
              <span className="text-xs text-muted-foreground">Treino {i + 1}</span>
              <button
                onClick={() => removeWorkoutTemplate(t.id)}
                className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add new */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 pt-4">
          <Input
            placeholder="Nome do treino (ex: Pernas)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 bg-secondary border-border"
          />
          <Button variant="cta" onClick={handleAdd} className="hover:opacity-95">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
