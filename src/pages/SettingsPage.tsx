import { useState } from "react";
import { useChallenge } from "@/contexts/ChallengeContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/sonner";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export default function SettingsPage() {
  const { data, setGoals, resetChallenge } = useChallenge();
  const navigate = useNavigate();
  const [goals, setLocalGoals] = useState(data.goals);
  const [showReset, setShowReset] = useState(false);
  const { isStandalone, canPrompt, isIos, promptInstall } = usePwaInstall();

  const handleSave = () => {
    setGoals(goals);
    toast.success("Metas salvas.");
    navigate("/");
  };

  const handleReset = () => {
    resetChallenge();
    navigate("/setup");
  };

  const fields = [
    { label: "Meta de calorias por dia", key: "dailyCalories" as const, suffix: "kcal" },
    { label: "Meta de horas de sono por dia", key: "dailySleepHours" as const, suffix: "horas" },
    { label: "Meta de cardios por semana", key: "weeklyCardios" as const, suffix: "vezes" },
    { label: "Meta de treinos por semana", key: "weeklyWorkouts" as const, suffix: "vezes" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-8 pb-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar</span>
        </button>
        <h1 className="text-2xl font-display font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Ajuste suas metas do desafio</p>
      </div>

      <div className="px-5 space-y-4">
        {fields.map((field, i) => (
          <motion.div
            key={field.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl card-elevated border border-border space-y-2"
          >
            <label className="text-sm font-medium text-foreground">{field.label}</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={goals[field.key]}
                onChange={(e) => setLocalGoals({ ...goals, [field.key]: parseFloat(e.target.value) || 0 })}
                className="bg-secondary border-border"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">{field.suffix}</span>
            </div>
          </motion.div>
        ))}

        <Button onClick={handleSave} className="w-full h-12 rounded-xl gradient-success text-primary-foreground font-display font-semibold border-0 mt-6">
          Salvar Metas
        </Button>

        {!isStandalone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: fields.length * 0.05 + 0.05 }}
            className="p-4 rounded-2xl card-elevated border border-border mt-6"
          >
            <div className="flex gap-4 items-start">
              <img
                src={`${import.meta.env.BASE_URL}brand/pwa-icon.svg`}
                alt=""
                width={64}
                height={64}
                className="w-16 h-16 rounded-xl shrink-0 object-cover border border-border shadow-sm"
              />
              <div className="space-y-3 min-w-0 flex-1">
                <div>
                  <h2 className="text-sm font-medium text-foreground">Instalar aplicativo</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adicione o 90 Day Power Up à tela inicial para abrir como um app.
                  </p>
                </div>
                {isIos ? (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    No Safari, toque em <span className="text-foreground/90">Compartilhar</span> e depois em{" "}
                    <span className="text-foreground/90">Adicionar à Tela de Início</span>.
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto rounded-xl"
                    onClick={async () => {
                      const outcome = await promptInstall();
                      if (outcome === "unavailable") {
                        toast.info("Use o ícone de instalação na barra de endereços do navegador.");
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Instalar na tela inicial
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div className="pt-8 border-t border-border mt-8">
          {!showReset ? (
            <Button variant="outline" onClick={() => setShowReset(true)} className="w-full border-destructive/30 text-destructive hover:bg-destructive/10">
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetar Desafio
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-destructive text-center">Tem certeza? Todos os dados serão apagados.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowReset(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleReset} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirmar</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
