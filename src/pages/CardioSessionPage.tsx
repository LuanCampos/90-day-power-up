import { useEffect, useMemo } from "react";
import { useChallenge } from "@/contexts/ChallengeContext";
import { useParams, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCelebration } from "@/components/CelebrationOverlay";
import { SubpageHeader } from "@/components/SubpageHeader";
import { Check } from "lucide-react";

function extractYoutubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    }
    const v = parsed.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}`;
    if (parsed.pathname.startsWith("/embed/")) return url;
  } catch {
    // not a valid URL
  }
  return null;
}

export default function CardioSessionPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date") || "";
  const navigate = useNavigate();
  const { data, setCardio, startSession, clearSession } = useChallenge();
  const { celebrate, overlay } = useCelebration();

  const template = data.cardioTemplates.find(t => t.id === id);

  const embedUrl = useMemo(
    () => (template?.youtubeLink ? extractYoutubeEmbedUrl(template.youtubeLink) : null),
    [template?.youtubeLink],
  );

  useEffect(() => {
    if (!template || !dateParam) return;
    const session = data.activeSession;
    if (session?.type === "cardio" && session.templateId === id && session.date === dateParam) return;
    startSession({
      type: "cardio",
      templateId: template.id,
      date: dateParam,
      exerciseProgress: {},
      currentExerciseIndex: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.id, dateParam]);

  if (!data.startDate) return <Navigate to="/setup" replace />;
  if (!template) return <Navigate to={`/day/${dateParam}`} replace />;

  const handleComplete = () => {
    setCardio(dateParam, template.id);
    clearSession();
    celebrate("day", `Cardio "${template.name}" concluído!`);
    setTimeout(() => navigate(`/day/${dateParam}`), 3500);
  };

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      {overlay}
      <SubpageHeader title={template.name} onBack={() => navigate(`/day/${dateParam}`)} />

      <div className="px-5 flex-1 flex flex-col items-center">
        {/* Objective & intensity */}
        {(template.objective || template.intensity) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            {template.objective && (
              <p className="text-sm text-muted-foreground">{template.objective}</p>
            )}
            {template.intensity && (
              <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-pillar-cardio/10 text-pillar-cardio font-medium">
                {template.intensity}
              </span>
            )}
          </motion.div>
        )}

        {/* YouTube embed */}
        {embedUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl overflow-hidden border border-border shadow-sm mb-6"
          >
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={embedUrl}
                title={template.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </motion.div>
        )}

        {!embedUrl && template.youtubeLink && (
          <p className="text-sm text-muted-foreground mb-6">
            Link inválido: {template.youtubeLink}
          </p>
        )}

        <div className="flex-1" />

        {/* Complete button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-lg pb-4"
        >
          <Button
            variant="cta"
            onClick={handleComplete}
            className="w-full h-14 text-base rounded-xl active:scale-[0.97]"
          >
            <Check className="w-5 h-5 mr-2" />
            Concluir Cardio
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
