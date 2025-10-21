// ttk.ts
// ======================================================
// Minimal-Input Bernoulli TTK Model (No-Recovery Mode)
// TypeScript port for use in React apps
// ======================================================

/** Random source with uniform [0,1) and standard normal N(0,1) draws. */
export interface RNG {
  random(): number;          // uniform [0,1)
  gauss(): number;           // standard normal using Box–Muller (cached)
}

/** Deterministic seedable RNG (Mulberry32). */
export function makeRng(seed?: number): RNG {
  let s = (seed ?? Math.floor(Math.random() * 2 ** 32)) >>> 0;

  const uniform = () => {
    // Mulberry32
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // Box–Muller with one-sample cache for efficiency
  let hasSpare = false;
  let spare = 0;
  const gauss = () => {
    if (hasSpare) {
      hasSpare = false;
      return spare;
    }
    let u = 0, v = 0, r = 0;
    // Avoid 0 values
    do {
      u = 2 * uniform() - 1;
      v = 2 * uniform() - 1;
      r = u * u + v * v;
    } while (r === 0 || r >= 1);
    const f = Math.sqrt((-2 * Math.log(r)) / r);
    spare = v * f;
    hasSpare = true;
    return u * f;
  };

  return { random: uniform, gauss };
}

/** Generate deterministic seed from string for reproducible results. */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// ---------- types ----------
export type Vec2 = [number, number];

export interface SimulateDuelArgs {
  HP?: number;            // default: 100
  damage_per_hit: number;
  RPM: number;
  distance: number;       // same units as target_radius
  target_radius?: number; // effective hit radius (default: 0.17m)
  precision_raw: number;  // (default range 20..76, higher is better)
  control_raw: number;    // (default range 8..65, higher is better)
  sigma_player_deg?: number; // player skill jitter (default: 0.2 degrees)
  max_shots?: number;
  p_samples?: number;
  rng?: RNG;              // optional seeded RNG; defaults to Math.random-backed RNG
}

export interface DuelResult {
  ttk: number;            // time to kill
  shots_taken: number;    // total shots fired
  hits: number;           // shots that hit
  misses: number;         // shots that missed
}

export interface EvaluateArgs extends SimulateDuelArgs {
  trials?: number;        // default: 400
  kill_window?: number;   // seconds (default: 1.0)
}

export interface EvalResult {
  TTK: number;            // Theoretical TTK with 100% hit rate (s)
  ETTK: number;           // Expected TTK (s)
  "Kill@W": number;       // Probability of kill within kill_window
  "AUC@W": number;        // Area-under-curve of win prob / window
  avgShots: number;       // Average shots taken (across successful kills)
  avgHits: number;        // Average hits landed
  avgMisses: number;      // Average misses
  accuracy: number;       // Hit percentage (avgHits / avgShots)
}

// ---------- helpers ----------
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const normalize = (value: number, vmin: number, vmax: number) => {
  if (vmax === vmin) return 0;
  const x = (value - vmin) / (vmax - vmin);
  return clamp(x, 0, 1);
};
const deg2rad = (deg: number) => (deg * Math.PI) / 180;

// ---------- game-stat → model mappings (tune these ranges if needed) ----------
// Base weapon spread (constant, representing minimal inherent inaccuracy)
const SIGMA0_DEG = 0.06; // degrees
const SIGMA0 = deg2rad(SIGMA0_DEG); // radians

export function map_precision_to_bloom(
  precision_raw: number,
  precision_min = 20.0,
  precision_max = 76.0,
  k_bloom_min_deg_per_shot = 0.12, // best precision (tightest spread)
  k_bloom_max_deg_per_shot = 0.15  // worst precision (loosest spread)
): number {
  // output: radians/shot
  const pNorm = normalize(precision_raw, precision_min, precision_max); // 0..1, higher is better
  const kBloomDeg =
    k_bloom_min_deg_per_shot + (1 - pNorm) * (k_bloom_max_deg_per_shot - k_bloom_min_deg_per_shot);
  return deg2rad(kBloomDeg);
}

export function map_control_to_drift(
  control_raw: number,
  control_min = 8.0,
  control_max = 65.0,
  // deterministic recoil drift step magnitude (deg/shot)
  k_drift_min_deg_per_shot = 0.05, // best control (minimal drift)
  k_drift_max_deg_per_shot = 0.16  // worst control (maximal drift)
): number {
  // output: radians/shot
  const cNorm = normalize(control_raw, control_min, control_max); // 0..1, higher is better
  const kDriftDeg =
    k_drift_min_deg_per_shot + (1 - cNorm) * (k_drift_max_deg_per_shot - k_drift_min_deg_per_shot);
  return deg2rad(kDriftDeg);
}

export function controlNorm(control_raw: number, lo=8, hi=65): number {
    const x = (control_raw - lo) / (hi - lo);
    return Math.max(0, Math.min(1, x));
}

// ---------- player compensation (derived from single skill slider) ----------
export function alpha_from_skill(sigma_player_deg: number): number {
  // Map player jitter to compensation fraction α∈[0,0.9].
  // Smaller jitter -> higher compensation.
  const alpha = 1.0 - (sigma_player_deg / 0.30) ** 2; // 0.30° is a soft scaling reference
  return clamp(alpha, 0.0, 0.98);
}

// ---------- recoil pattern (replace with real pattern if you have it) ----------
export function recoil_step_vector(
  _n: number,
  k_drift: number,
  rng: RNG
): Vec2 {
  // Deterministic per-shot step (radians) with small random yaw wobble each shot.
  const yawScale = (rng.random() - 0.5) * 0.2; // ±10% sideways wobble
  return [k_drift * yawScale, k_drift];        // (dx, dy)
}

// ---------- total spread (variance) ----------
export function sigma_total_for_shot(
  sigma0: number,
  k_bloom: number,
  sigma_player: number
): number {
  // Angular std dev (radians).
  // Bloom is per-shot constant (not cumulative). Recoil drift (mu) handles pattern growth.
  // Total variance combines: base spread + bloom + player jitter
  return Math.sqrt(sigma0 ** 2 + k_bloom ** 2 + sigma_player ** 2);
}

// ---------- drift update ----------
function update_mu_with_feedback(
    mu: Vec2,
    u: Vec2,
    alpha: number,
    dt: number
): Vec2 {
  const kappa = 4;                      // 1/s, tune 6–16
  const keep  = Math.exp(-kappa * dt);   // decay toward 0
  return [mu[0]*keep + (1-alpha)*u[0],
          mu[1]*keep + (1-alpha)*u[1]];
}

// --- skill & distance aware drift cap (radians) ---
function drift_cap_for_skill_and_control(
  alpha: number,      // 0..~0.999 (higher = better)
  cNorm: number,
  R_over_d: number    // target_radius / distance (radians approx for small angles)
): number {
  const mix = 0.5 * alpha + 0.5 * cNorm;

  // Absolute cap (deg) so there's always *some* limit even at very small targets/far range
  const Mabs_min_deg = 0.03; // best player can't drift past ~0.03°
  const Mabs_max_deg = 0.25; // worst player can drift up to ~0.25°
  const Mabs_deg = Mabs_max_deg - mix * (Mabs_max_deg - Mabs_min_deg);

  // Relative cap as a multiple of the target's angular radius.
  // Better player keeps mean drift within a smaller multiple of the target.
  const k_rel_best = 0.9;   // ~60% of target radius for top players
  const k_rel_worst = 1.6;  // up to 160% for low-skill
  const k_rel = k_rel_worst - mix * (k_rel_worst - k_rel_best);

  // Final cap is the larger of absolute floor and relative-to-target cap.
  const M_rel_rad = k_rel * R_over_d;
  const M_abs_rad = deg2rad(Mabs_deg);
  return Math.max(M_abs_rad, M_rel_rad);
}

// --- draw stochastic drift cap (radians) ---
function draw_stochastic_cap(meanM: number, cNorm: number, rng: RNG): number {
  // Relative stddev for the cap shrinks with control (0.20→0.05).
  const relSigma = 0.20 - 0.15 * cNorm;
  // Lognormal-ish multiplicative noise; clamp tails for stability.
  const z = rng.gauss();                          // N(0,1)
  const mult = Math.exp(relSigma * z);
  return meanM * clamp(mult, 0.7, 1.5);
}

// --- apply geometric clamp to mu, preserving direction ---
function clampMuToRadius(mu: Vec2, M: number): Vec2 {
  const m = Math.hypot(mu[0], mu[1]);
  if (m <= M) return mu;
  const s = M / (m + 1e-12);
  return [mu[0] * s, mu[1] * s];
}


// ---------- per-shot hit probability (MC approx to non-central case) ----------
export function per_shot_hit_probability(
  mu: Vec2,
  sigma: number,
  R_over_d: number,
  samples: number,
  rng: RNG
): number {
  if (sigma <= 0) {
    return (mu[0] * mu[0] + mu[1] * mu[1]) <= R_over_d * R_over_d ? 1.0 : 0.0;
  }
  let hits = 0;
  for (let i = 0; i < samples; i++) {
    const x = mu[0] + sigma * rng.gauss();
    const y = mu[1] + sigma * rng.gauss();
    if (x * x + y * y <= R_over_d * R_over_d) hits++;
  }
  return hits / samples;
}

// ---------- single duel simulation ----------
export function simulate_duel_minimal(args: SimulateDuelArgs): DuelResult | undefined {
  const {
    HP = 100,
    damage_per_hit,
    RPM,
    distance,
    target_radius = 0.17,
    precision_raw,
    control_raw,
    sigma_player_deg = 0.1,
    max_shots = 50,
    p_samples = 800,
    rng = makeRng() // default non-seeded RNG
  } = args;

  const r = RPM / 60.0;
  const dt = 1.0 / r;
  const H = Math.ceil(HP / damage_per_hit);
  const R_over_d = target_radius / Math.max(1e-9, distance);

  // map stats
  const sigma0 = SIGMA0; // constant base spread
  const k_bloom = map_precision_to_bloom(precision_raw);
  const k_drift = map_control_to_drift(control_raw);
  const sigma_player = deg2rad(sigma_player_deg);
  const alpha = alpha_from_skill(sigma_player_deg);
  const cNorm = controlNorm(control_raw);

  let mu: Vec2 = [0.0, 0.0]; // mean drift (radians)
  let hits = 0;

  for (let n = 1; n <= max_shots; n++) {
    // total spread for this shot
    const sigma_n = sigma_total_for_shot(sigma0, k_bloom, sigma_player);

    // per-shot hit probability at this distance (with current mu)
    const p_n = per_shot_hit_probability(mu, sigma_n, R_over_d, p_samples, rng);

    // fire
    if (rng.random() < p_n) {
      hits += 1;
      if (hits >= H) {
        return {
          ttk: (n - 1) * dt, // first shot at t=0
          shots_taken: n,
          hits,
          misses: n - hits
        };
      }
    }

    // apply recoil drift for next shot (no recovery)
    const u_step = recoil_step_vector(n, k_drift, rng);
    mu = update_mu_with_feedback(mu, u_step, alpha, dt);

    // stochastic drift cap: draw per-shot, varies with control quality
    const meanM = drift_cap_for_skill_and_control(alpha, cNorm, R_over_d);
    const M = draw_stochastic_cap(meanM, cNorm, rng);
    mu = clampMuToRadius(mu, M);
  }
  return undefined; // no kill within max_shots
}

// ---------- batch evaluation ----------
export function evaluate_weapon_minimal(args: EvaluateArgs): EvalResult {
  const { trials = 100, kill_window = 1.0, RPM, HP = 100, damage_per_hit } = args;

  const r = RPM / 60.0;
  const dt = 1.0 / r;
  const steps = Math.max(1, Math.ceil(kill_window / dt));

  // Calculate theoretical TTK with 100% hit rate
  const H = Math.ceil(HP / damage_per_hit);
  const theoreticalTTK = (H - 1) * dt; // First shot at t=0

  const ttkSamples: number[] = [];
  const cumWins = new Array<number>(steps + 1).fill(0);
  const shotSamples: number[] = [];
  const hitSamples: number[] = [];
  const missSamples: number[] = [];

  // Use one RNG across trials unless a custom one is provided
  const rng = args.rng ?? makeRng();

  for (let i = 0; i < trials; i++) {
    const result = simulate_duel_minimal({ ...args, rng });
    if (result !== undefined) {
      ttkSamples.push(result.ttk);
      shotSamples.push(result.shots_taken);
      hitSamples.push(result.hits);
      missSamples.push(result.misses);
      const idx = Math.min(steps, Math.floor(result.ttk / dt));
      for (let j = idx; j <= steps; j++) cumWins[j] += 1;
    }
  }

  if (ttkSamples.length === 0) {
    return {
      TTK: theoreticalTTK,
      ETTK: Infinity,
      "Kill@W": 0.0,
      "AUC@W": 0.0,
      avgShots: 0,
      avgHits: 0,
      avgMisses: 0,
      accuracy: 0
    };
  }

  ttkSamples.sort((a, b) => a - b);
  const mean =
    ttkSamples.reduce((acc, x) => acc + x, 0) / ttkSamples.length;
  const killW = cumWins[steps] / trials;

  // trapezoid rule on the coarse shot-time grid
  let auc = 0.0;
  for (let i = 1; i <= steps; i++) {
    const pPrev = cumWins[i - 1] / trials;
    const pCurr = cumWins[i] / trials;
    auc += ((pPrev + pCurr) / 2.0) * dt;
  }
  const aucW = auc / kill_window;

  // Calculate shot statistics
  const avgShots = shotSamples.reduce((acc, x) => acc + x, 0) / shotSamples.length;
  const avgHits = hitSamples.reduce((acc, x) => acc + x, 0) / hitSamples.length;
  const avgMisses = missSamples.reduce((acc, x) => acc + x, 0) / missSamples.length;
  const accuracy = avgShots > 0 ? avgHits / avgShots : 0;

  return {
    TTK: theoreticalTTK,
    ETTK: mean,
    "Kill@W": killW,
    "AUC@W": aucW,
    avgShots,
    avgHits,
    avgMisses,
    accuracy
  };
}
