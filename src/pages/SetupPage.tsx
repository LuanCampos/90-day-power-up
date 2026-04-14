import { useState } from "react";
import { useChallenge } from "@/contexts/ChallengeContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

export default function SetupPage() {
  const { setStartDate } = useChallenge();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleStart = () => {
    if (date) {
      setStartDate(format(date, "yyyy-MM-dd"));
      toast.success("Desafio iniciado! Bom começo.");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-success flex items-center justify-center glow-success">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Desafio 90 Dias</h1>
          <p className="text-muted-foreground">Escolha a data de início do seu desafio fitness</p>
        </div>

        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className={cn("p-3 pointer-events-auto rounded-2xl card-elevated border border-border")}
          />
        </div>

        {date && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-muted-foreground"
          >
            Dia 1 será em <span className="text-foreground font-medium">{format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </motion.p>
        )}

        <Button variant="cta" onClick={handleStart} disabled={!date} className="w-full h-12 text-base">
          Começar Desafio
        </Button>
      </motion.div>
    </div>
  );
}
