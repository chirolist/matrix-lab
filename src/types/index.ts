/** 数値を一列に並べたもの。画面では縦ベクトルとしても表示する。 */
export type Vector = number[];

/** 数値を縦横に並べたもの。matrix[行][列]。 */
export type Matrix = number[][];

/** 分類先の1カテゴリ。ジャグラーなら「設定1」などが対応する。 */
export interface Category {
  id: string;
  name: string;
  index: number;
}

/** 分類に使う数値的な特徴の定義。 */
export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  /** 合成頻度のように、他の特徴の足し算で再現できるものは false。 */
  usedInClassification: boolean;
}

/** 1件の観測サンプル。分野ごとに values の中身が変わる。 */
export interface Sample {
  id: string;
  values: Record<string, number>;
  labelId?: string;
}

/** サンプル集合と、特徴・カテゴリの定義。 */
export interface Dataset {
  id: string;
  name: string;
  description: string;
  features: FeatureDefinition[];
  categories: Category[];
}

export type ModelKind = "multinomial-bonus" | "neural-network";

/** 分類手法。確率モデルとニューラルネットは役割が違うので分けて持つ。 */
export interface ModelInfo {
  id: string;
  name: string;
  kind: ModelKind;
  /** 教師データで重みを更新済みか。統計モデルは学習ではなく式で定義する。 */
  trained: boolean;
  description: string;
}

/** 精度評価の要約。モンテカルロ結果もこの形に寄せる。 */
export interface EvaluationSummary {
  trials: number;
  correctRate: number;
  ratesByCategory: number[];
}

/** 機種の1つの設定。確率は分母で持つ（1/287.4 なら 287.4）。 */
export interface MachineSetting {
  setting: number;
  bigDenominator: number;
  regDenominator: number;
  /**
   * 表に載っている合成確率の分母。表示と検証だけに使い、推定計算には使わない。
   * BIGとREGを二重に数えないため。
   */
  combinedDenominator: number;
  /** 機械割。0.959 は 95.9%。参考表示であり、推定には使わない。 */
  payoutRate: number;
}

/** 機種（または分類問題）の基準データ。ファイルを差し替えれば別データにできる。 */
export interface MachineProfile {
  id: string;
  name: string;
  description: string;
  sourceNote: string;
  settings: MachineSetting[];
}

export interface BonusObservation {
  games: number;
  big: number;
  reg: number;
}

export interface FeatureVector {
  bigRate: number;
  regRate: number;
  combinedRate: number;
  /** 分類に使う独立な特徴。[BIG頻度, REG頻度] */
  independent: Vector;
  /** 画面表示用。[BIG頻度, REG頻度, 合成頻度] */
  display: Vector;
}

export interface SettingExpectation {
  setting: number;
  expectedBig: number;
  expectedReg: number;
  bigDiff: number;
  regDiff: number;
  bigProbability: number;
  regProbability: number;
  noneProbability: number;
  listedCombinedProbability: number;
  computedCombinedProbability: number;
  payoutRate: number;
}

export interface SettingEstimate extends SettingExpectation {
  logCoefficient: number;
  logBigTerm: number;
  logRegTerm: number;
  logNoneTerm: number;
  logLikelihood: number;
  /** 最大の尤度を 1 とした比率。事前確率が等しいとき、事後確率の比と一致する。 */
  likelihoodRatio: number;
  posterior: number;
  prior: number;
}

export interface InferenceResult {
  estimates: SettingEstimate[];
  ranked: SettingEstimate[];
  top: SettingEstimate;
  second: SettingEstimate | null;
  ambiguous: boolean;
  ambiguityMessage: string | null;
  posteriorSum: number;
}

export interface MultiplyTerm {
  col: number;
  a: number;
  x: number;
  product: number;
}

export interface MatrixMultiplyStep {
  row: number;
  terms: MultiplyTerm[];
  sum: number;
}

export interface MatrixVectorProduct {
  y: Vector;
  steps: MatrixMultiplyStep[];
}
