import { countLog, logGamma } from "@/lib/probability";
import type { MachineSetting } from "@/types";

export interface BonusProbabilities {
  pBig: number;
  pReg: number;
  pNone: number;
}

export interface LikelihoodParts {
  logCoefficient: number;
  logBigTerm: number;
  logRegTerm: number;
  logNoneTerm: number;
  logLikelihood: number;
  pBig: number;
  pReg: number;
  pNone: number;
}

export function bonusProbabilities(setting: MachineSetting): BonusProbabilities {
  if (!(setting.bigDenominator > 0) || !(setting.regDenominator > 0)) {
    throw new Error(`設定${setting.setting}の確率の分母は正の数である必要があります。`);
  }
  const pBig = 1 / setting.bigDenominator;
  const pReg = 1 / setting.regDenominator;
  const pNone = 1 - pBig - pReg;
  if (!(pBig > 0) || !(pReg > 0) || !(pNone > 0)) {
    throw new Error(
      `設定${setting.setting}では、BIG確率とREG確率の合計が1未満になる必要があります。`,
    );
  }
  return { pBig, pReg, pNone };
}

export function computedCombinedProbability(setting: MachineSetting): number {
  const { pBig, pReg } = bonusProbabilities(setting);
  return pBig + pReg;
}

/** log( G! / (B! R! N!) ) = logΓ(G+1) − logΓ(B+1) − logΓ(R+1) − logΓ(N+1) */
export function logMultinomialCoefficient(games: number, big: number, reg: number): number {
  const other = games - big - reg;
  return logGamma(games + 1) - logGamma(big + 1) - logGamma(reg + 1) - logGamma(other + 1);
}

export function likelihoodParts(
  games: number,
  big: number,
  reg: number,
  pBig: number,
  pReg: number,
): LikelihoodParts {
  const pNone = 1 - pBig - pReg;
  const logCoefficient = logMultinomialCoefficient(games, big, reg);
  const logBigTerm = countLog(big, pBig);
  const logRegTerm = countLog(reg, pReg);
  const logNoneTerm = countLog(games - big - reg, pNone);
  return {
    logCoefficient,
    logBigTerm,
    logRegTerm,
    logNoneTerm,
    logLikelihood: logCoefficient + logBigTerm + logRegTerm + logNoneTerm,
    pBig,
    pReg,
    pNone,
  };
}

export function logLikelihood(games: number, big: number, reg: number, pBig: number, pReg: number): number {
  return likelihoodParts(games, big, reg, pBig, pReg).logLikelihood;
}
