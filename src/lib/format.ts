export function formatFixed(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("ja-JP", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatSigned(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const abs = formatFixed(Math.abs(value), digits);
  if (value > 0) return `+${formatFixed(value, digits)}`;
  if (value < 0) return `−${abs}`;
  return formatFixed(0, digits);
}

export function formatPercent(probability: number, digits = 2): string {
  if (!Number.isFinite(probability)) return "—";
  return `${(probability * 100).toLocaleString("ja-JP", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function formatOneOver(probability: number): string {
  if (!(probability > 0) || !Number.isFinite(probability)) return "—";
  const denominator = 1 / probability;
  return `1/${denominator.toLocaleString("ja-JP", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}`;
}

export function formatDenominator(denominator: number): string {
  if (!(denominator > 0) || !Number.isFinite(denominator)) return "—";
  return `1/${denominator.toLocaleString("ja-JP", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}`;
}

export function formatObservedOdds(count: number, games: number): string {
  if (count <= 0) return "0回のため 1/… は計算しません";
  return formatOneOver(count / games);
}

export function formatFeatureValue(rate: number, mode: "decimal" | "percent"): string {
  if (!Number.isFinite(rate)) return "—";
  if (mode === "percent") {
    return `${(rate * 100).toLocaleString("ja-JP", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })}%`;
  }
  return rate.toLocaleString("ja-JP", {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  });
}

export function formatCoeff(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs < 0.0001 || abs >= 100_000)) return value.toExponential(3);
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 6 });
}

export function diffLabel(diff: number): string {
  if (diff > 0.05) return "実績が多い";
  if (diff < -0.05) return "実績が少ない";
  return "ほぼ同じ";
}
