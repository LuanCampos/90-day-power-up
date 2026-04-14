import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ActionIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** "neutral" = default muted, "danger" = hover vermelha */
  intent?: "neutral" | "danger";
}

/**
 * Botão de ação icônico padronizado (editar, deletar, etc.).
 * Tamanho fixo 32×32, canto arredondado, fundo transparente,
 * hover sutil. Sempre visível (funciona em mobile).
 */
export const ActionIconButton = forwardRef<HTMLButtonElement, ActionIconButtonProps>(
  ({ className, intent = "neutral", ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
        "text-muted-foreground hover:bg-muted/60",
        intent === "danger"
          ? "hover:text-destructive active:bg-destructive/10"
          : "hover:text-foreground active:bg-muted/80",
        className,
      )}
      {...props}
    />
  ),
);
ActionIconButton.displayName = "ActionIconButton";
