import type { ReactNode } from "react";

interface SectionCardProps {
  id?: string;
  kicker: string;
  title: string;
  description?: string;
  icon: ReactNode;
  active?: boolean;
  dimmed?: boolean;
  children: ReactNode;
}

export function SectionCard({ id, kicker, title, description, icon, active = false, dimmed = false, children }: SectionCardProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 rounded-2xl border bg-panel/90 p-4 shadow-xl shadow-black/20 transition sm:p-6 ${
        active ? "border-accent" : "border-line"
      } ${dimmed ? "opacity-40" : ""}`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-xl border border-line bg-panel-2 p-2 text-accent-2">{icon}</div>
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-accent">{kicker}</p>
          <h2 className="text-lg font-medium text-ink">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
