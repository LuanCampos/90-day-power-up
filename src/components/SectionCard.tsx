import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Card padronizado para seções de CRUD / registro. */
export function SectionCard({ children, className, delay = 0 }: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={cn(
        "p-5 rounded-2xl card-elevated border border-border space-y-4",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
