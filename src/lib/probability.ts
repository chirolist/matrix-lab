const logFactorialCache: number[] = [0];

/** log(n!) = logΓ(n+1)。整数は log の足し算で正確に積む。 */
export function logFactorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error("階乗の対数は、0以上の整数に対して計算します。");
  }
  for (let i = logFactorialCache.length; i <= n; i += 1) {
    logFactorialCache.push(logFactorialCache[i - 1] + Math.log(i));
  }
  return logFactorialCache[n];
}

/**
 * logΓ(z)。正の整数引数は log((z-1)!) と一致させる。
 * それ以外は Lanczos 近似。
 */
export function logGamma(z: number): number {
  if (!(z > 0) || !Number.isFinite(z)) {
    return Number.NaN;
  }
  if (Number.isInteger(z) && z <= 2_000_001) {
    return logFactorial(z - 1);
  }
  return lanczosLogGamma(z);
}

const LANCZOS_COEFFICIENTS = [
  676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.50734327868691,
  -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7,
];

function lanczosLogGamma(z: number): number {
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - lanczosLogGamma(1 - z);
  }
  let x = 0.9999999999998099;
  const shifted = z - 1;
  for (let i = 0; i < LANCZOS_COEFFICIENTS.length; i += 1) {
    x += LANCZOS_COEFFICIENTS[i] / (shifted + i + 1);
  }
  const t = shifted + LANCZOS_COEFFICIENTS.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x);
}

/** 回数 × log(確率)。回数 0 の項は 0 と定義し、log(0) を直接計算しない。 */
export function countLog(count: number, probability: number): number {
  if (count === 0) return 0;
  if (!(count > 0) || !Number.isFinite(count)) return Number.NEGATIVE_INFINITY;
  if (!(probability > 0) || probability > 1) return Number.NEGATIVE_INFINITY;
  return count * Math.log(probability);
}

export function logSumExp(values: number[]): number {
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (Number.isFinite(value) && value > max) max = value;
  }
  if (!Number.isFinite(max)) return Number.NEGATIVE_INFINITY;
  let sum = 0;
  for (const value of values) {
    if (Number.isFinite(value)) sum += Math.exp(value - max);
  }
  if (!(sum > 0)) return Number.NEGATIVE_INFINITY;
  return max + Math.log(sum);
}

/** 対数の値を、合計が 1 になる確率へ変換する。 */
export function normalizeFromLog(logValues: number[]): number[] {
  const pivot = logSumExp(logValues);
  if (!Number.isFinite(pivot)) return logValues.map(() => 0);
  return logValues.map((value) => (Number.isFinite(value) ? Math.exp(value - pivot) : 0));
}

export function softmax(values: number[]): number[] {
  return normalizeFromLog(values);
}
