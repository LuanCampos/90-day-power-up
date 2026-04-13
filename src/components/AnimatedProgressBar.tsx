import { motion } from "framer-motion";

interface AnimatedProgressBarProps {
  value: number; // 0-100
  label?: string;
  sublabel?: string;
  variant?: "success" | "energy" | "default";
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
}

export function AnimatedProgressBar({
  value,
  label,
  sublabel,
  variant = "default",
  size = "md",
  showPercentage = true,
}: AnimatedProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const isComplete = clamped >= 100;

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
          className={`h-full rounded-full ${barColors[variant]} ${isComplete ? "glow-success" : ""}`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
