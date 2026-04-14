import { useState, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useChallenge } from "@/contexts/ChallengeContext";
import { BodyCompositionEntry } from "@/types/challenge";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { SubpageHeader } from "@/components/SubpageHeader";
import { SectionCard } from "@/components/SectionCard";
import { EmptyState } from "@/components/EmptyState";
import { ActionIconButton } from "@/components/ActionIconButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AreaChart, Area, LabelList, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { sectionHeadingClass } from "@/lib/page-ui";
import { toast } from "@/components/ui/sonner";
import {
  Scale,
  Plus,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
  Minus,
  Weight,
  Droplets,
  Dumbbell,
  Activity,
} from "lucide-react";

const METRIC_COLORS = {
  weight: "hsl(210, 80%, 55%)",
  bodyFatPct: "hsl(30, 90%, 55%)",
  musclePct: "hsl(150, 70%, 45%)",
  visceralFat: "hsl(0, 75%, 55%)",
} as const;

const METRIC_LABELS: Record<string, string> = {
  weight: "Peso",
  bodyFatPct: "% Gordura",
  musclePct: "% Músculo",
  visceralFat: "Gordura Visceral",
};

const METRIC_UNITS: Record<string, string> = {
  weight: "kg",
  bodyFatPct: "%",
  musclePct: "%",
  visceralFat: "",
};

const METRIC_ICONS = {
  weight: Weight,
  bodyFatPct: Droplets,
  musclePct: Dumbbell,
  visceralFat: Activity,
};

type MetricKey = "weight" | "bodyFatPct" | "musclePct" | "visceralFat";
const ALL_METRICS: MetricKey[] = ["weight", "bodyFatPct", "musclePct", "visceralFat"];

function weekLabel(week: number): string {
  return week === 0 ? "Baseline" : `S${week}`;
}

function weekFullLabel(week: number): string {
  return week === 0 ? "Baseline" : `Semana ${week}`;
}

interface DeltaInfo {
  key: MetricKey;
  baseline: number;
  latest: number;
  delta: number;
  positive: boolean;
}

function computeDeltas(entries: BodyCompositionEntry[]): DeltaInfo[] {
  if (entries.length < 2) return [];
  const sorted = [...entries].sort((a, b) => a.week - b.week);
  const baseline = sorted[0];
  const latest = sorted[sorted.length - 1];
  if (baseline.week === latest.week) return [];

  const result: DeltaInfo[] = [];
  for (const key of ALL_METRICS) {
    const bv = baseline[key];
    const lv = latest[key];
    if (bv != null && lv != null) {
      const delta = lv - bv;
      const positive = key === "musclePct" ? delta >= 0 : delta <= 0;
      result.push({ key, baseline: bv, latest: lv, delta, positive });
    }
  }
  return result;
}

function formatDelta(delta: number, unit: string): string {
  const sign = delta > 0 ? "+" : "";
  const formatted = Number.isInteger(delta) ? delta.toString() : delta.toFixed(1);
  return `${sign}${formatted}${unit ? ` ${unit}` : ""}`;
}

function buildChartData(entries: BodyCompositionEntry[]) {
  return [...entries]
    .sort((a, b) => a.week - b.week)
    .map((e) => ({
      week: weekLabel(e.week),
      weight: e.weight ?? null,
      bodyFatPct: e.bodyFatPct ?? null,
      musclePct: e.musclePct ?? null,
      visceralFat: e.visceralFat ?? null,
    }));
}

interface FormState {
  week: number;
  weight: string;
  bodyFatPct: string;
  musclePct: string;
  visceralFat: string;
}

function emptyForm(week: number): FormState {
  return { week, weight: "", bodyFatPct: "", musclePct: "", visceralFat: "" };
}

function entryToForm(entry: BodyCompositionEntry): FormState {
  return {
    week: entry.week,
    weight: entry.weight?.toString() ?? "",
    bodyFatPct: entry.bodyFatPct?.toString() ?? "",
    musclePct: entry.musclePct?.toString() ?? "",
    visceralFat: entry.visceralFat?.toString() ?? "",
  };
}

function parseOptionalNumber(val: string): number | undefined {
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

export default function BodyCompositionPage() {
  const { data, setBodyComposition, removeBodyComposition, getDayNumber } = useChallenge();
  const navigate = useNavigate();

  const entries = useMemo(() => data.bodyComposition ?? [], [data.bodyComposition]);
  const entryByWeek = useMemo(() => {
    const map = new Map<number, BodyCompositionEntry>();
    for (const e of entries) map.set(e.week, e);
    return map;
  }, [entries]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(0));
  const [editingWeek, setEditingWeek] = useState<number | null>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const currentDayNum = getDayNumber(todayStr);

  const chartData = useMemo(() => buildChartData(entries), [entries]);
  const deltas = useMemo(() => computeDeltas(entries), [entries]);

  function currentTargetWeek(): number {
    if (currentDayNum != null) {
      const w = Math.floor((currentDayNum - 1) / 7);
      return Math.min(w, 13);
    }
    return 0;
  }

  function openAdd() {
    const preferred = currentTargetWeek();
    const week = !entryByWeek.has(preferred) ? preferred : findFirstEmptyWeek();
    setForm(emptyForm(week));
    setEditingWeek(null);
    setDialogOpen(true);
  }

  function openEdit(entry: BodyCompositionEntry) {
    setForm(entryToForm(entry));
    setEditingWeek(entry.week);
    setDialogOpen(true);
  }

  function findFirstEmptyWeek(): number {
    for (let w = 0; w <= 13; w++) {
      if (!entryByWeek.has(w)) return w;
    }
    return 0;
  }

  function handleSave() {
    const weight = parseOptionalNumber(form.weight);
    const bodyFatPct = parseOptionalNumber(form.bodyFatPct);
    const musclePct = parseOptionalNumber(form.musclePct);
    const visceralFat = parseOptionalNumber(form.visceralFat);

    if (weight == null && bodyFatPct == null && musclePct == null && visceralFat == null) {
      toast.error("Preencha pelo menos uma medida.");
      return;
    }

    setBodyComposition({
      week: form.week,
      date: format(new Date(), "yyyy-MM-dd"),
      weight,
      bodyFatPct,
      musclePct,
      visceralFat,
    });

    toast.success(editingWeek != null ? "Medida atualizada." : "Medida registrada.");
    setDialogOpen(false);
  }

  function handleDelete(week: number) {
    removeBodyComposition(week);
    toast.success("Medida removida.");
  }

  if (!data.startDate) {
    return <Navigate to="/setup" replace />;
  }

  const sortedEntries = [...entries].sort((a, b) => a.week - b.week);

  return (
    <div className="min-h-screen bg-background pb-24">
      <SubpageHeader title="Composição Corporal" onBack={() => navigate("/")} />

      <div className="px-5 space-y-5">
        {/* Unified metric cards: delta + mini-chart */}
        {chartData.length >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h2 className={sectionHeadingClass}>Evolução</h2>
            <div className="grid grid-cols-2 gap-3">
              {ALL_METRICS.map((key, i) => {
                const metricData = chartData.filter((d) => d[key] != null);
                if (metricData.length === 0) return null;
                const MetricIcon = METRIC_ICONS[key];
                const currentVal = metricData[metricData.length - 1][key];
                const delta = deltas.find((d) => d.key === key);
                const hasChart = metricData.length >= 2;
                const DeltaIcon = delta
                  ? delta.delta > 0
                    ? TrendingUp
                    : delta.delta < 0
                      ? TrendingDown
                      : Minus
                  : null;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-2xl card-elevated border border-border"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <MetricIcon className="w-3.5 h-3.5 shrink-0" style={{ color: METRIC_COLORS[key] }} />
                      <span className="text-xs font-medium text-muted-foreground truncate">
                        {METRIC_LABELS[key]}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-display font-bold text-foreground tabular-nums">
                        {currentVal}
                      </span>
                      <span className="text-xs text-muted-foreground">{METRIC_UNITS[key]}</span>
                    </div>

                    {delta && DeltaIcon && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={cn(
                            "text-xs font-medium tabular-nums",
                            delta.positive ? "text-success" : "text-energy",
                          )}
                        >
                          {formatDelta(delta.delta, METRIC_UNITS[key])}
                        </span>
                        <DeltaIcon
                          className={cn("w-3 h-3 shrink-0", delta.positive ? "text-success" : "text-energy")}
                        />
                      </div>
                    )}

                    {hasChart && (
                      <>
                        <div className="h-14 mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metricData} margin={{ top: 14, right: 8, bottom: 0, left: 8 }}>
                              <defs>
                                <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={METRIC_COLORS[key]} stopOpacity={0.3} />
                                  <stop offset="100%" stopColor={METRIC_COLORS[key]} stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                              <Area
                                type="monotone"
                                dataKey={key}
                                stroke={METRIC_COLORS[key]}
                                strokeWidth={2}
                                fill={`url(#grad-${key})`}
                                connectNulls
                                dot={{ r: 3, fill: METRIC_COLORS[key], strokeWidth: 0 }}
                                activeDot={{ r: 4, fill: METRIC_COLORS[key], strokeWidth: 0 }}
                              >
                                <LabelList
                                  dataKey={key}
                                  position="top"
                                  style={{ fontSize: 9, fill: METRIC_COLORS[key], fontWeight: 600 }}
                                />
                              </Area>
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                          <span>{metricData[0].week}</span>
                          <span>{metricData[metricData.length - 1].week}</span>
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Entries list + add button */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className={sectionHeadingClass}>Registros</h2>
            <Button variant="cta" size="sm" onClick={openAdd} className="rounded-xl active:scale-[0.97]">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>

          {sortedEntries.length === 0 && (
            <EmptyState
              icon={<Scale className="w-12 h-12" />}
              title="Nenhuma medida registrada"
              description="Adicione seu baseline para começar a acompanhar sua evolução."
            />
          )}

          {sortedEntries.map((entry, i) => (
            <motion.div
              key={entry.week}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-4 rounded-2xl card-elevated border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-base font-display font-bold text-foreground">
                    {weekFullLabel(entry.week)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">{entry.date}</span>
                </div>
                <div className="flex gap-0.5">
                  <ActionIconButton onClick={() => openEdit(entry)} aria-label="Editar medida">
                    <Pencil className="w-3.5 h-3.5" />
                  </ActionIconButton>
                  <ActionIconButton intent="danger" onClick={() => handleDelete(entry.week)} aria-label="Remover medida">
                    <Trash2 className="w-3.5 h-3.5" />
                  </ActionIconButton>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                {ALL_METRICS.map((key) => {
                  const val = entry[key];
                  const MetricIcon = METRIC_ICONS[key];
                  return (
                    <div key={key} className="flex items-center gap-1.5 min-w-0">
                      <MetricIcon
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: METRIC_COLORS[key] }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-muted-foreground leading-tight truncate">{METRIC_LABELS[key]}</span>
                        <span className="font-medium text-foreground tabular-nums text-sm leading-tight">
                          {val != null ? `${val}${METRIC_UNITS[key] ? ` ${METRIC_UNITS[key]}` : ""}` : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingWeek != null ? "Editar Medida" : "Nova Medida"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Semana</label>
              <Select
                value={form.week.toString()}
                onValueChange={(v) => setForm((f) => ({ ...f, week: parseInt(v, 10) }))}
                disabled={editingWeek != null}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 14 }, (_, w) => (
                    <SelectItem key={w} value={w.toString()}>
                      {weekFullLabel(w)}
                      {entryByWeek.has(w) && editingWeek !== w ? " (já registrado)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {ALL_METRICS.map((key) => {
              const MetricIcon = METRIC_ICONS[key];
              return (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MetricIcon className="w-4 h-4" style={{ color: METRIC_COLORS[key] }} />
                    {METRIC_LABELS[key]}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="any"
                      placeholder="—"
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="bg-secondary border-border"
                    />
                    {METRIC_UNITS[key] && (
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {METRIC_UNITS[key]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            <Button variant="cta" onClick={handleSave} className="w-full h-12 active:scale-[0.97]">
              {editingWeek != null ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
