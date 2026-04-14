/**
 * Mapping from exercise name (PT-BR, as used in ChallengeContext defaults)
 * to local image paths in public/exercises/.
 *
 * Each entry has 1-2 images: position 0 (start) and optionally position 1 (end).
 * Images sourced from free-exercise-db (Public Domain) and wger.de (CC-BY-SA).
 */

type ImagePair = [start: string, end?: string];

const IMAGE_MAP: Record<string, ImagePair> = {
  "Supino com halteres": [
    "/exercises/supino-com-halteres/0.jpg",
    "/exercises/supino-com-halteres/1.jpg",
  ],
  "Remada curvada com halteres": [
    "/exercises/remada-curvada-com-halteres/0.jpg",
    "/exercises/remada-curvada-com-halteres/1.jpg",
  ],
  "Elevação lateral": [
    "/exercises/elevacao-lateral/0.jpg",
    "/exercises/elevacao-lateral/1.jpg",
  ],
  "Flexões": [
    "/exercises/flexoes/0.jpg",
    "/exercises/flexoes/1.jpg",
  ],
  "Rosca alternada": [
    "/exercises/rosca-alternada/0.jpg",
    "/exercises/rosca-alternada/1.jpg",
  ],
  "Tríceps francês": [
    "/exercises/triceps-frances/0.jpg",
    "/exercises/triceps-frances/1.jpg",
  ],
  "Desenvolvimento com halteres": [
    "/exercises/desenvolvimento-com-halteres/0.jpg",
    "/exercises/desenvolvimento-com-halteres/1.jpg",
  ],
  "Remada unilateral com halter": [
    "/exercises/remada-unilateral-com-halter/0.jpg",
    "/exercises/remada-unilateral-com-halter/1.jpg",
  ],
  "Pullover com halter": [
    "/exercises/pullover-com-halter/0.jpg",
    "/exercises/pullover-com-halter/1.jpg",
  ],
  "Crucifixo inverso": [
    "/exercises/crucifixo-inverso/0.jpg",
    "/exercises/crucifixo-inverso/1.jpg",
  ],
  "Rosca martelo": [
    "/exercises/rosca-martelo/0.jpg",
    "/exercises/rosca-martelo/1.jpg",
  ],
  "Agachamento goblet com pausa": [
    "/exercises/agachamento-goblet-com-pausa/0.jpg",
    "/exercises/agachamento-goblet-com-pausa/1.jpg",
  ],
  "Levantamento terra romeno com halteres": [
    "/exercises/levantamento-terra-romeno-com-halteres/0.jpg",
    "/exercises/levantamento-terra-romeno-com-halteres/1.jpg",
  ],
  "Afundo reverso com halteres": [
    "/exercises/afundo-reverso-com-halteres/0.jpg",
    "/exercises/afundo-reverso-com-halteres/1.jpg",
  ],
  "Agachamento isométrico na parede": [
    "/exercises/agachamento-isometrico-na-parede/0.png",
  ],
  "Elevação de panturrilha em pé": [
    "/exercises/elevacao-de-panturrilha-em-pe/0.jpg",
    "/exercises/elevacao-de-panturrilha-em-pe/1.jpg",
  ],
  "Agachamento búlgaro com halteres": [
    "/exercises/agachamento-bulgaro-com-halteres/0.jpg",
    "/exercises/agachamento-bulgaro-com-halteres/1.jpg",
  ],
  "Hip thrust no chão com halter e pausa": [
    "/exercises/hip-thrust-no-chao-com-halter-e-pausa/0.jpg",
    "/exercises/hip-thrust-no-chao-com-halter-e-pausa/1.jpg",
  ],
  "Stiff unilateral com halter": [
    "/exercises/stiff-unilateral-com-halter/0.png",
  ],
  "Ponte de glúteo unilateral": [
    "/exercises/ponte-de-gluteo-unilateral/0.jpg",
    "/exercises/ponte-de-gluteo-unilateral/1.jpg",
  ],
  "Elevação de panturrilha unilateral": [
    "/exercises/elevacao-de-panturrilha-unilateral/0.jpeg",
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
