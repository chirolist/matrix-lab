import { toFeatureVector } from "@/lib/features";
import { bonusProbabilities, computedCombinedProbability, likelihoodParts } from "@/lib/likelihood";
import { normalizeFromLog } from "@/lib/probability";
import type { BonusObservation, InferenceResult, MachineProfile, SettingEstimate } from "@/types";

/** 1位と2位の推定確率の差がこの値未満なら、断定しない。 */
export const AMBIGUITY_GAP = 0.08;

export function inferBonusSettings(
  observation: BonusObservation,
  machine: MachineProfile,
  priors?: number[],
): InferenceResult {
  if (machine.settings.length === 0) {
    throw new Error("設定データが空です。");
  }
  const { games, big, reg } = observation;
  if (!Number.isInteger(games) || games < 1 || !Number.isInteger(big) || !Number.isInteger(reg) || big < 0 || reg < 0 || big + reg > games) {
    throw new Error("観測データが不正なため、推定できません。総回転数、BIG回数、REG回数を確認してください。");
  }

  const priorList = priors ?? machine.settings.map(() => 1 / machine.settings.length);
  if (priorList.length !== machine.settings.length) {
    throw new Error("事前確率の個数が設定の数と一致しません。");
  }
  const priorSum = priorList.reduce((total, prior) => total + prior, 0);
  if (!(priorSum > 0) || priorList.some((prior) => !(prior >= 0) || !Number.isFinite(prior))) {
    throw new Error("事前確率は0以上の有限な数値で、合計が正である必要があります。");
  }

  toFeatureVector(observation);

  const drafts = machine.settings.map((setting, index) => {
    const probabilities = bonusProbabilities(setting);
    const parts = likelihoodParts(games, big, reg, probabilities.pBig, probabilities.pReg);
    const prior = priorList[index] / priorSum;
    const expectedBig = games * probabilities.pBig;
    const expectedReg = games * probabilities.pReg;
    return {
      setting: setting.setting,
      expectedBig,
      expectedReg,
      bigDiff: big - expectedBig,
      regDiff: reg - expectedReg,
      bigProbability: probabilities.pBig,
      regProbability: probabilities.pReg,
      noneProbability: probabilities.pNone,
      listedCombinedProbability: 1 / setting.combinedDenominator,
      computedCombinedProbability: computedCombinedProbability(setting),
      payoutRate: setting.payoutRate,
      logCoefficient: parts.logCoefficient,
      logBigTerm: parts.logBigTerm,
      logRegTerm: parts.logRegTerm,
      logNoneTerm: parts.logNoneTerm,
      logLikelihood: parts.logLikelihood,
      prior,
      logUnnormalized: parts.logLikelihood + Math.log(prior),
    };
  });

  const posteriors = normalizeFromLog(drafts.map((draft) => (draft.prior === 0 ? Number.NEGATIVE_INFINITY : draft.logUnnormalized)));
  const maxLog = Math.max(...drafts.map((draft) => draft.logLikelihood));
  const estimates: SettingEstimate[] = drafts.map((draft, index) => ({
    setting: draft.setting,
    expectedBig: draft.expectedBig,
    expectedReg: draft.expectedReg,
    bigDiff: draft.bigDiff,
    regDiff: draft.regDiff,
    bigProbability: draft.bigProbability,
    regProbability: draft.regProbability,
    noneProbability: draft.noneProbability,
    listedCombinedProbability: draft.listedCombinedProbability,
    computedCombinedProbability: draft.computedCombinedProbability,
    payoutRate: draft.payoutRate,
    logCoefficient: draft.logCoefficient,
    logBigTerm: draft.logBigTerm,
    logRegTerm: draft.logRegTerm,
    logNoneTerm: draft.logNoneTerm,
    logLikelihood: draft.logLikelihood,
    likelihoodRatio: Number.isFinite(draft.logLikelihood) && Number.isFinite(maxLog) ? Math.exp(draft.logLikelihood - maxLog) : 0,
    posterior: posteriors[index],
    prior: draft.prior,
  }));

  const ranked = [...estimates].sort((a, b) => b.posterior - a.posterior || a.setting - b.setting);
  const top = ranked[0];
  const second = ranked[1] ?? null;
  const gap = second ? top.posterior - second.posterior : 1;
  const ambiguous = Boolean(second) && gap < AMBIGUITY_GAP;
  const ambiguityMessage = ambiguous && second
    ? `設定${top.setting}と設定${second.setting}は推定確率が近く、このデータだけでは区別しにくいです。`
    : null;

  const posteriorSum = estimates.reduce((total, estimate) => total + estimate.posterior, 0);
  return { estimates, ranked, top, second, ambiguous, ambiguityMessage, posteriorSum };
}
