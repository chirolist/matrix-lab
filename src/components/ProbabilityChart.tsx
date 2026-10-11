"use client";

import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, tooltipStyle } from "@/components/ChartFrame";
import type { InferenceResult } from "@/types";

export function ProbabilityChart({ inference }: { inference: InferenceResult | null }) {
  if (!inference) return <p className="text-sm text-muted">入力が有効になると、推定確率のグラフを表示します。</p>;
  const data = inference.estimates.map((estimate) => ({
    name: `設定${estimate.setting}`,
    probability: Number((estimate.posterior * 100).toFixed(2)),
    setting: estimate.setting,
  }));
  return (
    <ChartFrame>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#2c3c5c" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#93a0bd", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: "#93a0bd", fontSize: 12 }} axisLine={false} tickLine={false} unit="%" width={48} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [`${Number(value).toLocaleString("ja-JP")}%`, "推定確率"]}
        />
        <Bar dataKey="probability" radius={[8, 8, 0, 0]} isAnimationActive>
          {data.map((item) => (
            <Cell key={item.setting} fill={item.setting === inference.top.setting ? "#ff8a3d" : "#4cc3ff"} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}
