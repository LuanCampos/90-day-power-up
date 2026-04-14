/**
 * Mapping from exercise name (PT-BR, as used in ChallengeContext defaults)
 * to local image paths in public/exercises/.
 *
 * Each entry has 1-2 images: position 0 (start) and optionally position 1 (end).
 * Images sourced from free-exercise-db (Public Domain) and wger.de (CC-BY-SA).
 *
 * Paths are relative to public/ — resolved at runtime via `import.meta.env.BASE_URL`
 * so GitHub Pages (base = /<repo>/) works correctly.
 */

type ImagePair = [start: string, end?: string];

function img(relativePath: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base}exercises/${relativePath}`;
}

const IMAGE_MAP: Record<string, ImagePair> = {
  "Supino com halteres": [
    img("supino-com-halteres/0.jpg"),
    img("supino-com-halteres/1.jpg"),
  ],
  "Remada curvada com halteres": [
    img("remada-curvada-com-halteres/0.jpg"),
    img("remada-curvada-com-halteres/1.jpg"),
  ],
  "Elevação lateral": [
    img("elevacao-lateral/0.jpg"),
    img("elevacao-lateral/1.jpg"),
  ],
  "Flexões": [
    img("flexoes/0.jpg"),
    img("flexoes/1.jpg"),
  ],
  "Rosca alternada": [
    img("rosca-alternada/0.jpg"),
    img("rosca-alternada/1.jpg"),
  ],
  "Tríceps francês": [
    img("triceps-frances/0.jpg"),
    img("triceps-frances/1.jpg"),
  ],
  "Desenvolvimento com halteres": [
    img("desenvolvimento-com-halteres/0.jpg"),
    img("desenvolvimento-com-halteres/1.jpg"),
  ],
  "Remada unilateral com halter": [
    img("remada-unilateral-com-halter/0.jpg"),
    img("remada-unilateral-com-halter/1.jpg"),
  ],
  "Pullover com halter": [
    img("pullover-com-halter/0.jpg"),
    img("pullover-com-halter/1.jpg"),
  ],
  "Crucifixo inverso": [
    img("crucifixo-inverso/0.jpg"),
    img("crucifixo-inverso/1.jpg"),
  ],
  "Rosca martelo": [
    img("rosca-martelo/0.jpg"),
    img("rosca-martelo/1.jpg"),
  ],
  "Agachamento goblet com pausa": [
    img("agachamento-goblet-com-pausa/0.jpg"),
    img("agachamento-goblet-com-pausa/1.jpg"),
  ],
  "Levantamento terra romeno com halteres": [
    img("levantamento-terra-romeno-com-halteres/0.jpg"),
    img("levantamento-terra-romeno-com-halteres/1.jpg"),
  ],
  "Afundo reverso com halteres": [
    img("afundo-reverso-com-halteres/0.jpg"),
    img("afundo-reverso-com-halteres/1.jpg"),
  ],
  "Agachamento isométrico na parede": [
    img("agachamento-isometrico-na-parede/0.png"),
  ],
  "Elevação de panturrilha em pé": [
    img("elevacao-de-panturrilha-em-pe/0.jpg"),
    img("elevacao-de-panturrilha-em-pe/1.jpg"),
  ],
  "Agachamento búlgaro com halteres": [
    img("agachamento-bulgaro-com-halteres/0.jpg"),
    img("agachamento-bulgaro-com-halteres/1.jpg"),
  ],
  "Hip thrust no chão com halter e pausa": [
    img("hip-thrust-no-chao-com-halter-e-pausa/0.jpg"),
    img("hip-thrust-no-chao-com-halter-e-pausa/1.jpg"),
  ],
  "Stiff unilateral com halter": [
    img("stiff-unilateral-com-halter/0.png"),
  ],
  "Ponte de glúteo unilateral": [
    img("ponte-de-gluteo-unilateral/0.jpg"),
    img("ponte-de-gluteo-unilateral/1.jpg"),
  ],
  "Elevação de panturrilha unilateral": [
    img("elevacao-de-panturrilha-unilateral/0.jpeg"),
  ],
};

export interface ExerciseImageGroup {
  label: string;
  images: ImagePair;
}

/**
 * Returns image groups for a given exercise name.
 *
 * - Regular exercises: 1 group with the exercise name and its image pair.
 * - Supersets ("Superset: A + B"): 2 groups, one per sub-exercise.
 * - Unknown exercises: null (caller should gracefully skip rendering).
 */
export function getExerciseImageGroups(
  name: string,
): ExerciseImageGroup[] | null {
  if (name.startsWith("Superset:")) {
    const inner = name.replace(/^Superset:\s*/, "");
    const parts = inner.split(/\s*\+\s*/);
    const groups: ExerciseImageGroup[] = [];

    for (const part of parts) {
      const trimmed = part.trim();
      const images = IMAGE_MAP[trimmed];
      if (images) {
        groups.push({ label: trimmed, images });
      }
    }

    return groups.length > 0 ? groups : null;
  }

  const images = IMAGE_MAP[name];
  if (!images) return null;

  return [{ label: name, images }];
}
