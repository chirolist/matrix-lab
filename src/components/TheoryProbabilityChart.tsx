"use client";

import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, tooltipStyle } from "@/components/ChartFrame";
import { perThousand, probabilitySpread } from "@/lib/features";
import { formatFixed } from "@/lib/format";
import type { MachineProfile } from "@/types";

export function TheoryProbabilityChart({ machine }: { machine: MachineProfile }) {
  const spread = probabilitySpread(machine);
  const data = machine.settings.map((setting) => ({
    name: `設定${setting.setting}`,
    BIG: Number(perThousand(1 / setting.bigDenominator).toFixed(2)),
    REG: Number(perThousand(1 / setting.regDenominator).toFixed(2)),
  }));
  const wider = spread.reg >= spread.big ? "REG" : "BIG";
  const narrower = wider === "REG" ? "BIG" : "REG";
  return (
    <div className="space-y-3">
      <ChartFrame>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#2c3c5c" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "#93a0bd", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#93a0bd", fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ color: "#93a0bd", fontSize: 12 }} />
          <Bar dataKey="BIG" name="BIG / 1000回転" fill="#4cc3ff" radius={[6, 6, 0, 0]} />
          <Bar dataKey="REG" name="REG / 1000回転" fill="#ff8a3d" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartFrame>
      <p className="text-xs leading-5 text-muted">
        縦軸は1000回転あたりの理論回数です。確率のまま描くと 0.003 前後に固まって差が見えないため、この尺度にしています。{wider}の設定差は1000回転あたり {formatFixed(Math.max(spread.big, spread.reg))} 回、{narrower}は {formatFixed(Math.min(spread.big, spread.reg))} 回です。差が大きい項目の方が、実績のずれが設定の見分けに残りやすいです。
      </p>
    </div>
  );
}
