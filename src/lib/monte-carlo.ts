import { inferBonusSettings } from "@/lib/inference";
import { bonusProbabilities } from "@/lib/likelihood";
import type { EvaluationSummary, MachineProfile } from "@/types";

export const COMPARISON_GAMES = [1000, 3000, 6000, 10000] as const;

export interface TrialRecord {
  big: number;
  reg: number;
  predictedSetting: number;
  truePosterior: number;
  posteriors: number[];
}

export interface MonteCarloReport extends EvaluationSummary {
  assumedSetting: number;
  games: number;
  countsBySetting: number[];
  truePosteriorHistogram: { label: string; count: number }[];
  meanTruePosterior: number;
}

export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 二項分布に従う回数。発生確率が小さいときは、成功までの待ち時間を足して生成する。 */
export function sampleBinomial(n: number, p: number, rng: () => number): number {
  if (n <= 0 || p <= 0) return 0;
  if (p >= 1) return n;
  if (p > 0.5) return n - sampleBinomial(n, 1 - p, rng);

  const logQ = Math.log1p(-p);
  let successes = 0;
  let consumed = 0;
  while (consumed < n) {
    const u = Math.min(Math.max(rng(), Number.MIN_VALUE), 1);
    const wait = Math.floor(Math.log(u) / logQ) + 1;
    if (!Number.isFinite(wait) || wait < 1) return successes;
    consumed += wait;
    if (consumed > n) break;
    successes += 1;
  }
  return successes;
}

export function sampleBonusCounts(
  games: number,
  pBig: number,
  pReg: number,
  rng: () => number,
): { big: number; reg: number } {
  const big = sampleBinomial(games, pBig, rng);
  const remaining = games - big;
  const conditionalReg = pBig >= 1 ? 0 : pReg / (1 - pBig);
  const reg = sampleBinomial(remaining, conditionalReg, rng);
  return { big, reg };
}

export function simulateOne(
  machine: MachineProfile,
  assumedSetting: number,
  games: number,
  rng: () => number,
): TrialRecord {
  const setting = machine.settings.find((item) => item.setting === assumedSetting);
  if (!setting) {
    throw new Error(`設定${assumedSetting}がデータにありません。`);
  }
  const { pBig, pReg } = bonusProbabilities(setting);
  const counts = sampleBonusCounts(games, pBig, pReg, rng);
  const inference = inferBonusSettings({ games, big: counts.big, reg: counts.reg }, machine);
  const trueEstimate = inference.estimates.find((item) => item.setting === assumedSetting);
  return {
    big: counts.big,
    reg: counts.reg,
    predictedSetting: inference.top.setting,
    truePosterior: trueEstimate?.posterior ?? 0,
    posteriors: inference.estimates.map((item) => item.posterior),
  };
}

export function histogramBin(probability: number): number {
  if (!Number.isFinite(probability) || probability <= 0) return 0;
  if (probability >= 1) return 9;
  return Math.min(9, Math.floor(probability * 10));
}

export function emptyHistogram(): { label: string; count: number }[] {
  return Array.from({ length: 10 }, (_, index) => ({
    label: `${index * 10}–${(index + 1) * 10}%`,
    count: 0,
  }));
}

export function finalizeMonteCarlo(
  machine: MachineProfile,
  assumedSetting: number,
  games: number,
  trials: TrialRecord[],
): MonteCarloReport {
  const countsBySetting = machine.settings.map(() => 0);
  const histogram = emptyHistogram();
  let truePosteriorSum = 0;
  for (const trial of trials) {
    const index = machine.settings.findIndex((item) => item.setting === trial.predictedSetting);
    if (index >= 0) countsBySetting[index] += 1;
    histogram[histogramBin(trial.truePosterior)].count += 1;
    truePosteriorSum += trial.truePosterior;
  }
  const total = trials.length;
  const assumedIndex = machine.settings.findIndex((item) => item.setting === assumedSetting);
  const correctCount = assumedIndex >= 0 ? countsBySetting[assumedIndex] : 0;
  return {
    assumedSetting,
    games,
    trials: total,
    correctRate: total === 0 ? 0 : correctCount / total,
    ratesByCategory: countsBySetting.map((count) => (total === 0 ? 0 : count / total)),
    countsBySetting,
    truePosteriorHistogram: histogram,
    meanTruePosterior: total === 0 ? 0 : truePosteriorSum / total,
  };
}
