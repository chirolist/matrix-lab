"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import { ResponsiveContainer } from "recharts";

function subscribe() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export function ChartFrame({ children, heightClass = "h-72" }: { children: ReactElement; heightClass?: string }) {
  const ready = useIsClient();
  return (
    <div className={`${heightClass} w-full min-w-0`}>
      {ready ? (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

export const tooltipStyle = {
  background: "#101826",
  border: "1px solid #2c3c5c",
  borderRadius: 12,
  color: "#e7eefc",
  fontSize: 12,
};
