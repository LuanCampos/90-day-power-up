import { ReactNode } from "react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
}

/** Estado vazio padronizado para listas sem dados. */
export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 text-muted-foreground"
    >
      <div className="mb-3 opacity-40">{icon}</div>
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="text-xs mt-1 text-center max-w-[16rem]">{description}</p>}
    </motion.div>
  );
}
