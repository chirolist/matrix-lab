"use client";

import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, tooltipStyle } from "@/components/ChartFrame";
import type { BonusObservation, InferenceResult } from "@/types";

export function ExpectedValuesChart({ observation, inference }: { observation: BonusObservation | null; inference: InferenceResult | null }) {
  if (!observation || !inference) {
    return <p className="text-sm text-muted">入力が有効になると、実績と期待回数を比べるグラフを表示します。</p>;
  }
  const data = inference.estimates.map((estimate) => ({
    name: `設定${estimate.setting}`,
    BIG期待: Number(estimate.expectedBig.toFixed(2)),
    BIG実績: observation.big,
    REG期待: Number(estimate.expectedReg.toFixed(2)),
    REG実績: observation.reg,
  }));
  return (
    <ChartFrame heightClass="h-80">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#2c3c5c" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#93a0bd", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#93a0bd", fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ color: "#93a0bd", fontSize: 12 }} />
        <Bar dataKey="BIG期待" fill="#4cc3ff" radius={[6, 6, 0, 0]} />
        <Bar dataKey="BIG実績" fill="#d7f4ff" radius={[6, 6, 0, 0]} />
        <Bar dataKey="REG期待" fill="#ff8a3d" radius={[6, 6, 0, 0]} />
        <Bar dataKey="REG実績" fill="#ffd0b5" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartFrame>
  );
}
