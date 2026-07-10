import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  helper?: ReactNode;
  tone?: "primary" | "amber" | "green" | "blue" | "slate" | "violet";
};

const iconBg: Record<string, string> = {
  primary: "bg-primary/12 text-primary",
  amber: "bg-amber-100 text-amber-600",
  green: "bg-emerald-100 text-emerald-600",
  blue: "bg-sky-100 text-sky-600",
  slate: "bg-slate-100 text-slate-600",
  violet: "bg-violet-100 text-violet-600",
};

const accentBar: Record<string, string> = {
  primary: "bg-primary",
  amber: "bg-amber-400",
  green: "bg-emerald-400",
  blue: "bg-sky-400",
  slate: "bg-slate-400",
  violet: "bg-violet-400",
};

const helperColor: Record<string, string> = {
  primary: "text-primary",
  amber: "text-amber-600",
  green: "text-emerald-600",
  blue: "text-sky-600",
  slate: "text-slate-600",
  violet: "text-violet-600",
};

export function StatCard({ label, value, icon, helper, tone = "primary" }: StatCardProps) {
  const helperStr = typeof helper === "string" ? helper : null;
  const isUp = helperStr?.startsWith("+");
  const isDown = helperStr?.startsWith("-") && helperStr.includes("%");

  return (
    <div className="stat-card group">
      <div className={cn("absolute left-0 top-0 h-full w-0.5 rounded-l-xl", accentBar[tone])} />
      <div className="flex items-start gap-4 pl-2">
        {icon ? (
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconBg[tone])}>
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</div>
          {helper ? (
            <div className={cn(
              "mt-1.5 flex items-center gap-1 text-xs font-medium",
              isUp ? "text-emerald-600" : isDown ? "text-rose-500" : helperColor[tone]
            )}>
              {isUp ? <span>↑</span> : isDown ? <span>↓</span> : null}
              {helper}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
