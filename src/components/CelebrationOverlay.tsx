/* eslint-disable react-refresh/only-export-components -- hook + helpers live with overlay for cohesion */
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck2, CheckCircle2, Sparkles, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export type CelebrationType = "goal" | "day" | "week" | "challenge";

interface CelebrationOverlayProps {
  type: CelebrationType;
  message: string;
  show: boolean;
  durationMs: number;
  onDismiss: () => void;
}

const DURATION_BY_TYPE: Record<CelebrationType, number> = {
  goal: 2600,
  day: 3400,
  week: 3800,
  challenge: 4500,
};

export function getCelebrationDuration(type: CelebrationType): number {
  return DURATION_BY_TYPE[type];
}

export function CelebrationOverlay({ type, message, show, durationMs, onDismiss }: CelebrationOverlayProps) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [show, durationMs, onDismiss]);

  const icons = {
    goal: <CheckCircle2 className="w-16 h-16 text-success" />,
    day: <CalendarCheck2 className="w-16 h-16 text-success" />,
    week: <Trophy className="w-16 h-16 text-success" />,
    challenge: <Sparkles className="w-16 h-16 text-success" />,
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={onDismiss}
          role="presentation"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 shadow-lg card-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6 }}
            >
              {icons[type]}
            </motion.div>
            <p className="text-center font-display text-xl font-bold text-foreground">{message}</p>
            <Button
              type="button"
              variant="secondary"
              className="w-full rounded-xl hover:bg-secondary/70"
              onClick={onDismiss}
            >
              Continuar
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type CelebrationPayload = { type: CelebrationType; message: string };

/**
 * Overlay de celebração (não é toast). Use `celebrate` após conquistas; use Sonner para ações rotineiras.
 */
export function useCelebration() {
  const [celebration, setCelebration] = useState<CelebrationPayload | null>(null);

  const dismiss = useCallback(() => setCelebration(null), []);

  const celebrate = useCallback((type: CelebrationType, message: string) => {
    setCelebration({ type, message });
  }, []);

  const overlay = celebration ? (
    <CelebrationOverlay
      type={celebration.type}
      message={celebration.message}
      show={true}
      durationMs={getCelebrationDuration(celebration.type)}
      onDismiss={dismiss}
    />
  ) : null;

  return { celebrate, dismiss, overlay };
}

/** @deprecated Use `useCelebration` */
export const useToastCelebration = useCelebration;
