"use client";

import { formatFeatureValue } from "@/lib/format";
import type { BonusObservation, FeatureVector as FeatureVectorValue } from "@/types";

const INPUT_LABELS = [
  { symbol: "G", name: "総回転数" },
  { symbol: "B", name: "BIG回数" },
  { symbol: "R", name: "REG回数" },
];

const FEATURE_LABELS = [
  { symbol: "B/G", name: "BIG頻度", used: true },
  { symbol: "R/G", name: "REG頻度", used: true },
  { symbol: "(B+R)/G", name: "合成頻度", used: false },
];

function Column({
  title,
  caption,
  values,
  labels,
  activeIndex,
}: {
  title: string;
  caption: string;
  values: string[];
  labels: { symbol: string; name: string; used?: boolean }[];
  activeIndex: number;
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-ink">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted">{caption}</p>
      <div className="mt-3 overflow-x-auto">
        <div className="inline-flex min-w-full items-stretch gap-2">
          <div className="w-3 rounded-full bg-line" aria-hidden="true" />
          <div className="grid flex-1 gap-2">
            {values.map((value, index) => {
              const label = labels[index];
              const active = activeIndex >= 0;
              return (
                <div
                  key={label?.symbol ?? index}
                  className={`grid grid-cols-[5.5rem_1fr] items-center gap-3 rounded-xl border px-3 py-2 ${
                    active ? "border-accent bg-accent/10" : "border-line bg-lab"
                  }`}
                >
                  <div>
                    <p className="font-mono text-xs text-accent-2">{label?.symbol}</p>
                    <p className="text-xs text-muted">{label?.name}</p>
                  </div>
                  <p className="text-right font-mono text-lg text-ink">{value}</p>
                </div>
              );
            })}
          </div>
          <div className="w-3 rounded-full bg-line" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

export function FeatureVector({
  observation,
  features,
  mode,
  onMode,
  vectorActive,
  featureActive,
}: {
  observation: BonusObservation | null;
  features: FeatureVectorValue | null;
  mode: "decimal" | "percent";
  onMode: (mode: "decimal" | "percent") => void;
  vectorActive: boolean;
  featureActive: boolean;
}) {
  const inputValues = observation
    ? [observation.games.toLocaleString("ja-JP"), observation.big.toLocaleString("ja-JP"), observation.reg.toLocaleString("ja-JP")]
    : ["—", "—", "—"];
  const featureValues = features ? features.display.map((value) => formatFeatureValue(value, mode)) : ["—", "—", "—"];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="特徴量の表示形式">
        <button
          type="button"
          aria-pressed={mode === "decimal"}
          onClick={() => onMode("decimal")}
          className={`rounded-full px-3 py-1.5 text-xs ${mode === "decimal" ? "bg-accent text-lab" : "border border-line text-muted"}`}
        >
          小数
        </button>
        <button
          type="button"
          aria-pressed={mode === "percent"}
          onClick={() => onMode("percent")}
          className={`rounded-full px-3 py-1.5 text-xs ${mode === "percent" ? "bg-accent text-lab" : "border border-line text-muted"}`}
        >
          百分率
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div id="vector" className={`scroll-mt-28 rounded-2xl ${vectorActive ? "ring-1 ring-accent" : ""}`}>
          <Column
            title="入力ベクトル x"
            caption="観測した3つの数を、そのまま縦に並べたものです。ベクトルは、複数の数値を順番つきでひとまとめにしたものです。"
            values={inputValues}
            labels={INPUT_LABELS}
            activeIndex={vectorActive ? 0 : -1}
          />
        </div>
        <div id="features" className={`scroll-mt-28 rounded-2xl ${featureActive ? "ring-1 ring-accent" : ""}`}>
          <Column
            title="特徴量ベクトル z"
            caption="回数そのものより、回転数あたりの頻度の方が設定と比べやすいので、割算で変換します。合成頻度はBIGとREGの合計なので、分類の入力には使いません。"
            values={featureValues}
            labels={FEATURE_LABELS}
            activeIndex={featureActive ? 1 : -1}
          />
        </div>
      </div>
      <ul className="grid gap-2 text-xs text-muted sm:grid-cols-3">
        {FEATURE_LABELS.map((label) => (
          <li key={label.symbol} className="rounded-xl border border-line px-3 py-2">
            {label.name}: {label.used ? "分類に使う" : "表示のみ（重複するため不使用）"}
          </li>
        ))}
      </ul>
    </div>
  );
}
