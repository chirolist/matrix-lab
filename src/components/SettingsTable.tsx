import { diffLabel, formatDenominator, formatFixed, formatOneOver, formatPercent, formatSigned } from "@/lib/format";
import { computedCombinedProbability } from "@/lib/likelihood";
import type { InferenceResult, MachineProfile } from "@/types";

function DiffCell({ value }: { value: number }) {
  const tone = value > 0.05 ? "text-accent" : value < -0.05 ? "text-accent-2" : "text-muted";
  return (
    <td className={`px-3 py-2 text-right font-mono ${tone}`}>
      {formatSigned(value)}
      <span className="mt-0.5 block text-[10px]">{diffLabel(value)}</span>
    </td>
  );
}

export function SettingsTable({ machine, inference }: { machine: MachineProfile; inference: InferenceResult | null }) {
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <caption className="mb-2 text-left text-sm text-ink">設定ごとの理論値</caption>
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th className="px-3 py-2 font-medium">設定</th>
              <th className="px-3 py-2 text-right font-medium">BIG確率</th>
              <th className="px-3 py-2 text-right font-medium">REG確率</th>
              <th className="px-3 py-2 text-right font-medium">合成（掲載）</th>
              <th className="px-3 py-2 text-right font-medium">合成（計算）</th>
              <th className="px-3 py-2 text-right font-medium">機械割</th>
            </tr>
          </thead>
          <tbody>
            {machine.settings.map((setting) => {
              const computed = computedCombinedProbability(setting);
              return (
                <tr key={setting.setting} className="border-b border-line/70">
                  <th className="px-3 py-2 font-medium text-ink">{setting.setting}</th>
                  <td className="px-3 py-2 text-right font-mono">{formatDenominator(setting.bigDenominator)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatDenominator(setting.regDenominator)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatDenominator(setting.combinedDenominator)}</td>
                  <td className="px-3 py-2 text-right font-mono">{computed ? formatOneOver(computed) : "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatPercent(setting.payoutRate, 1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs leading-5 text-muted">
        合成（計算）は 1 / (BIG確率 + REG確率) です。掲載値との差は、表の四捨五入によるものです。推定では合成確率も機械割も使わず、BIGとREGを別々の結果として扱います。
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
          <caption className="mb-2 text-left text-sm text-ink">入力した総回転数での期待回数</caption>
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th className="px-3 py-2 font-medium">設定</th>
              <th className="px-3 py-2 text-right font-medium">BIG期待回数</th>
              <th className="px-3 py-2 text-right font-medium">REG期待回数</th>
              <th className="px-3 py-2 text-right font-medium">BIG実績との差</th>
              <th className="px-3 py-2 text-right font-medium">REG実績との差</th>
            </tr>
          </thead>
          <tbody>
            {inference ? (
              inference.estimates.map((estimate) => (
                <tr key={estimate.setting} className="border-b border-line/70">
                  <th className="px-3 py-2 font-medium text-ink">{estimate.setting}</th>
                  <td className="px-3 py-2 text-right font-mono">{formatFixed(estimate.expectedBig)}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatFixed(estimate.expectedReg)}</td>
                  <DiffCell value={estimate.bigDiff} />
                  <DiffCell value={estimate.regDiff} />
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-muted">
                  入力が有効になると、期待回数を計算します。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs leading-5 text-muted">
        期待回数は「総回転数 × その設定の確率」です。差は「実績 − 期待」で、オレンジは実績が多い、青は実績が少ないことを示します。符号も一緒に書いてあるので、色だけには頼りません。
      </p>
    </div>
  );
}
