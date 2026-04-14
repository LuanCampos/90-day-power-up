import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

type SubpageBackButtonProps = {
  onClick: () => void;
};

/** Ícone de voltar alinhado ao bloco do título (uso em cabeçalhos de subpáginas). */
export function SubpageBackButton({ onClick }: SubpageBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Voltar"
      className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
    >
      <ArrowLeft className="h-5 w-5" aria-hidden />
    </button>
  );
}

type SubpageHeaderProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  className?: string;
};

/**
 * Título centralizado com área reservada à esquerda para o voltar (ícone),
 * evitando competir visualmente com o display do título.
 */
export function SubpageHeader({ title, subtitle, onBack, className }: SubpageHeaderProps) {
  return (
    <div className={cn("relative px-5 pt-8 pb-4", className)}>
      <div className="relative">
        <SubpageBackButton onClick={onBack} />
        <div className="px-11 text-center">
          <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
}
