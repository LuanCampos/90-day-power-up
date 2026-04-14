import { useChallenge } from "@/contexts/ChallengeContext";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { SubpageHeader } from "@/components/SubpageHeader";
import { SectionCard } from "@/components/SectionCard";
import { ExternalLink, Youtube, Target, Zap, Clock } from "lucide-react";

export default function CardioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, updateCardioTemplate } = useChallenge();

  const template = data.cardioTemplates.find(t => t.id === id);

  if (!data.startDate) return <Navigate to="/setup" replace />;
  if (!template) return <Navigate to="/cardios" replace />;

  const update = (patch: Partial<typeof template>) => {
    updateCardioTemplate({ ...template, ...patch });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <SubpageHeader title={template.name} onBack={() => navigate("/cardios")} />

      <div className="px-5 space-y-5">
        <SectionCard>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome</label>
              <Input
                value={template.name}
                onChange={e => update({ name: e.target.value })}
                className="mt-1 bg-secondary border-border"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Youtube className="w-3 h-3" /> Link do YouTube
              </label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={template.youtubeLink || ""}
                  onChange={e => update({ youtubeLink: e.target.value || undefined })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1 bg-secondary border-border"
                />
                {template.youtubeLink && (
                  <motion.a
                    href={template.youtubeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors shrink-0"
                    whileTap={{ scale: 0.95 }}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </motion.a>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Target className="w-3 h-3" /> Objetivo
              </label>
              <Input
                value={template.objective || ""}
                onChange={e => update({ objective: e.target.value || undefined })}
                placeholder="Ex: Estabilidade do tronco"
                className="mt-1 bg-secondary border-border"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Intensidade
                </label>
                <Input
                  value={template.intensity || ""}
                  onChange={e => update({ intensity: e.target.value || undefined })}
                  placeholder="Ex: Moderada"
                  className="mt-1 bg-secondary border-border"
                />
              </div>
              <div className="w-24">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Min
                </label>
                <Input
                  type="number"
                  value={template.estimatedMinutes ?? ""}
                  onChange={e => update({ estimatedMinutes: parseInt(e.target.value) || undefined })}
                  placeholder="20"
                  className="mt-1 bg-secondary border-border"
                />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
