import { diffLabel, formatFixed, formatPercent, formatSigned } from "@/lib/format";
import type { InferenceResult } from "@/types";

export function ResultHero({ inference, emphasized }: { inference: InferenceResult | null; emphasized: boolean }) {
  if (!inference) {
    return <p className="text-sm text-muted">有効な入力があると、最有力の設定を表示します。</p>;
  }
  const { top, second } = inference;
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${emphasized ? "border-accent bg-accent/10" : "border-line bg-lab"}`} aria-live="polite">
      <p className="text-xs tracking-[0.16em] text-accent">最有力候補</p>
      <p className="mt-2 font-mono text-4xl text-ink">設定{top.setting}</p>
      <p className="mt-2 text-lg text-ink">推定確率 {formatPercent(top.posterior)}</p>
      <p className="mt-3 text-sm leading-6 text-muted">
        {inference.ambiguityMessage ??
          `設定${top.setting}を仮定したとき、今回のBIG ${formatFixed(top.expectedBig)}回・REG ${formatFixed(top.expectedReg)}回という期待に対し、観測データの起こりやすさが最も高くなりました。`}
      </p>
      {second ? (
        <p className="mt-2 text-sm text-muted">
          2位は設定{second.setting}（{formatPercent(second.posterior)}）です。差は {formatPercent(top.posterior - second.posterior)} です。
        </p>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-muted">
        これは設定表と多項分布を前提にした統計的な推定確率です。実機の真の設定がこの確率で当たることは保証しません。
      </p>
    </div>
  );
}

export function ScoreTable({ inference }: { inference: InferenceResult | null }) {
  if (!inference) {
    return <p className="text-sm text-muted">入力が有効になると、設定ごとの推定確率を計算します。</p>;
  }
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {inference.ranked.map((estimate, index) => (
          <div key={estimate.setting} className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-3 text-sm">
            <span className="text-muted">{index === 0 ? "1位" : `${index + 1}位`} 設定{estimate.setting}</span>
            <span className="h-2 overflow-hidden rounded-full bg-panel-2">
              <span className="block h-full rounded-full bg-accent-2" style={{ width: `${Math.max(2, estimate.posterior * 100).toFixed(2)}%` }} />
            </span>
            <span className="text-right font-mono">{formatPercent(estimate.posterior)}</span>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
          <caption className="mb-2 text-left text-xs text-muted">
            推定確率の内部合計は {formatPercent(inference.posteriorSum, 4)} です。表の百分率は四捨五入しているため、見た目の合計が100.00%から0.01ずれることがあります。
          </caption>
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              {["設定", "推定確率", "対数尤度", "尤度比", "BIG期待", "REG期待", "BIG差", "REG差"].map((label) => (
                <th key={label} className="px-3 py-2 text-right font-medium first:text-left">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inference.estimates.map((estimate) => (
              <tr key={estimate.setting} className={`border-b border-line/70 ${estimate.setting === inference.top.setting ? "bg-accent/10" : ""}`}>
                <th className="px-3 py-2 text-left font-medium">{estimate.setting}</th>
                <td className="px-3 py-2 text-right font-mono">{formatPercent(estimate.posterior)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatFixed(estimate.logLikelihood, 2)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatFixed(estimate.likelihoodRatio, 3)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatFixed(estimate.expectedBig)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatFixed(estimate.expectedReg)}</td>
                <td className={`px-3 py-2 text-right font-mono ${estimate.bigDiff > 0.05 ? "text-accent" : estimate.bigDiff < -0.05 ? "text-accent-2" : ""}`}>
                  {formatSigned(estimate.bigDiff)}
                  <span className="mt-0.5 block text-[10px] text-muted">{diffLabel(estimate.bigDiff)}</span>
                </td>
                <td className={`px-3 py-2 text-right font-mono ${estimate.regDiff > 0.05 ? "text-accent" : estimate.regDiff < -0.05 ? "text-accent-2" : ""}`}>
                  {formatSigned(estimate.regDiff)}
                  <span className="mt-0.5 block text-[10px] text-muted">{diffLabel(estimate.regDiff)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs leading-5 text-muted">
        尤度比は、最も起こりやすい設定を1としたときの相対的な起こりやすさです。事前確率がすべて同じなので、これを合計1になるよう分配したものが推定確率です。
      </p>
    </div>
  );
}
