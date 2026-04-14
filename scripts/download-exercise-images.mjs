/**
 * One-time script to download exercise reference images.
 * Sources:
 *   - free-exercise-db (GitHub CDN, Public Domain)
 *   - wger.de API (CC-BY-SA) for exercises not in free-exercise-db
 *
 * Run: node scripts/download-exercise-images.mjs
 */
import { mkdirSync, createWriteStream, existsSync } from "fs";
import { join } from "path";
import { get as httpsGet } from "https";
import { get as httpGet } from "http";

const DEST = join(process.cwd(), "public", "exercises");

const FREE_DB_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

const WGER_MEDIA = "https://wger.de/media/exercise-images";

/** slug: kebab-case sem acentos */
function slug(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── mapping ────────────────────────────────────────────────────────────────

const FREE_DB_EXERCISES = [
  { name: "Supino com halteres", id: "Dumbbell_Bench_Press" },
  { name: "Remada curvada com halteres", id: "Bent_Over_Two-Dumbbell_Row" },
  { name: "Elevação lateral", id: "Side_Lateral_Raise" },
  { name: "Flexões", id: "Pushups" },
  { name: "Rosca alternada", id: "Alternate_Incline_Dumbbell_Curl" },
  { name: "Tríceps francês", id: "Standing_Dumbbell_Triceps_Extension" },
  { name: "Desenvolvimento com halteres", id: "Dumbbell_Shoulder_Press" },
  { name: "Remada unilateral com halter", id: "One-Arm_Dumbbell_Row" },
  { name: "Pullover com halter", id: "Bent-Arm_Dumbbell_Pullover" },
  {
    name: "Crucifixo inverso",
    id: "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench",
  },
  { name: "Rosca martelo", id: "Alternate_Hammer_Curl" },
  { name: "Agachamento goblet com pausa", id: "Goblet_Squat" },
  {
    name: "Levantamento terra romeno com halteres",
    id: "Stiff-Legged_Dumbbell_Deadlift",
  },
  { name: "Afundo reverso com halteres", id: "Dumbbell_Rear_Lunge" },
  { name: "Elevação de panturrilha em pé", id: "Standing_Dumbbell_Calf_Raise" },
  { name: "Agachamento búlgaro com halteres", id: "Split_Squat_with_Dumbbells" },
  { name: "Hip thrust no chão com halter e pausa", id: "Barbell_Glute_Bridge" },
  { name: "Ponte de glúteo unilateral", id: "Single_Leg_Glute_Bridge" },
];

const WGER_EXERCISES = [
  {
    name: "Agachamento isométrico na parede",
    urls: [
      `${WGER_MEDIA}/1194/074e1766-4208-4a67-a211-9721772d99b0.png`,
    ],
  },
  {
    name: "Stiff unilateral com halter",
    urls: [
      `${WGER_MEDIA}/1736/aa724cc5-c485-4f3e-9d2a-0c6ae4baefbe.png`,
    ],
  },
  {
    name: "Elevação de panturrilha unilateral",
    urls: [
      `${WGER_MEDIA}/1620/edd40e39-e337-4460-a8dd-6127d40ddd16.jpeg`,
    ],
  },
];

// ── download helpers ───────────────────────────────────────────────────────

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const getter = url.startsWith("https") ? httpsGet : httpGet;

    const req = getter(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const file = createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    });
    req.on("error", reject);
  });
}

async function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("Downloading exercise images...\n");

  for (const ex of FREE_DB_EXERCISES) {
    const dir = join(DEST, slug(ex.name));
    await ensureDir(dir);

    for (const idx of [0, 1]) {
      const url = `${FREE_DB_BASE}/${ex.id}/${idx}.jpg`;
      const dest = join(dir, `${idx}.jpg`);
      if (existsSync(dest)) {
        console.log(`  SKIP ${slug(ex.name)}/${idx}.jpg (exists)`);
        continue;
      }
      try {
        await download(url, dest);
        console.log(`  OK   ${slug(ex.name)}/${idx}.jpg`);
      } catch (err) {
        console.error(`  FAIL ${slug(ex.name)}/${idx}.jpg — ${err.message}`);
      }
    }
  }

  for (const ex of WGER_EXERCISES) {
    const dir = join(DEST, slug(ex.name));
    await ensureDir(dir);

    for (let i = 0; i < ex.urls.length; i++) {
      const ext = ex.urls[i].split(".").pop();
      const dest = join(dir, `${i}.${ext}`);
      if (existsSync(dest)) {
        console.log(`  SKIP ${slug(ex.name)}/${i}.${ext} (exists)`);
        continue;
      }
      try {
        await download(ex.urls[i], dest);
        console.log(`  OK   ${slug(ex.name)}/${i}.${ext} (wger)`);
      } catch (err) {
        console.error(`  FAIL ${slug(ex.name)}/${i}.${ext} — ${err.message}`);
      }
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
