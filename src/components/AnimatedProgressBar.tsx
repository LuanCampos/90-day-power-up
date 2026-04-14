import { motion } from "framer-motion";

interface AnimatedProgressBarProps {
  value: number; // 0-100 (pode passar >100; largura exibida continua limitada a 100)
  label?: string;
  sublabel?: string;
  variant?: "success" | "energy" | "default";
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  /** Se definido, o brilho “completo” aplica quando value está em [min, max] (inclusive), usando o valor bruto. */
  successRange?: { min: number; max: number };
  /** Quando false, nunca aplica estilo de “completo” (ex.: calorias no dia atual antes de fechar o dia). */
  completeHighlight?: boolean;
  /** Valor bruto acima do qual a barra vira alerta e nunca é “completa” (ex.: 100 = % acima da meta de calorias). */
  warnAbove?: number;
}

export function AnimatedProgressBar({
  value,
  label,
  sublabel,
  variant = "default",
  size = "md",
  showPercentage = true,
  successRange,
  completeHighlight = true,
  warnAbove,
}: AnimatedProgressBarProps) {
  const raw = value;
  const clamped = Math.min(100, Math.max(0, value));
  const isOverBudget = warnAbove != null && raw > warnAbove;
  const isComplete =
    isOverBudget
      ? false
      : completeHighlight === false
        ? false
        : successRange
          ? raw >= successRange.min && raw <= successRange.max
          : clamped >= 100;

  const heights = { sm: "h-2", md: "h-3", lg: "h-4" };
  const barColors = {
    default: "gradient-progress",
    success: "gradient-success",
    energy: "gradient-energy",
  };

  return (
    <div className="space-y-1.5">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          <div>
            {label && <span className="font-medium text-foreground">{label}</span>}
            {sublabel && <span className="ml-2 text-muted-foreground text-xs">{sublabel}</span>}
          </div>
          {showPercentage && (
            <span className={`font-display font-semibold ${isComplete ? "text-success" : "text-muted-foreground"}`}>
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${heights[size]} rounded-full bg-secondary overflow-hidden`}>
        <motion.div
          className={`h-full rounded-full ${isOverBudget ? "bg-destructive" : barColors[variant]} ${isComplete ? "glow-success" : ""}`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
