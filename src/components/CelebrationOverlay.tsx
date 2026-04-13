import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Flame, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

interface CelebrationOverlayProps {
  type: "day" | "week" | "goal";
  message: string;
  show: boolean;
  onDone: () => void;
}

export function CelebrationOverlay({ type, message, show, onDone }: CelebrationOverlayProps) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onDone, 2500);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  const icons = {
    goal: <CheckCircle2 className="w-16 h-16 text-success" />,
    day: <Flame className="w-16 h-16 text-energy" />,
    week: <Trophy className="w-16 h-16 text-accent" />,
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="flex flex-col items-center gap-4 p-8 rounded-2xl card-elevated border border-border"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6 }}
            >
              {icons[type]}
            </motion.div>
            <p className="text-xl font-display font-bold text-foreground text-center">{message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useToastCelebration() {
  const [celebration, setCelebration] = useState<{ type: "day" | "week" | "goal"; message: string } | null>(null);

  const celebrate = (type: "day" | "week" | "goal", message: string) => {
    setCelebration({ type, message });
  };

  const overlay = celebration ? (
    <CelebrationOverlay
      type={celebration.type}
      message={celebration.message}
      show={true}
      onDone={() => setCelebration(null)}
    />
  ) : null;

  return { celebrate, overlay };
}
