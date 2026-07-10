import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  helper?: ReactNode;
  tone?: "primary" | "amber" | "green" | "blue" | "slate";
};

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-emerald-100 text-emerald-700",
  blue: "bg-sky-100 text-sky-700",
  slate: "bg-slate-100 text-slate-700",
};

const helperToneClasses = {
  primary: "text-primary",
  amber: "text-amber-600",
  green: "text-emerald-600",
  blue: "text-sky-600",
  slate: "text-slate-600",
};

export function StatCard({ label, value, icon, helper, tone = "primary" }: StatCardProps) {
  const helperStr = typeof helper === "string" ? helper : null;
  const isPositiveTrend = helperStr?.startsWith("+");
  const isNegativeTrend = helperStr?.startsWith("-") && helperStr.includes("%");

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="flex items-start gap-4 p-4 sm:p-5">
        {icon ? (
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", toneClasses[tone])}>
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
          <div className="mt-1 text-sm text-muted-foreground">{label}</div>
          {helper ? (
            <div className={cn(
              "mt-2 text-xs font-medium",
              isPositiveTrend ? "text-emerald-600" :
              isNegativeTrend ? "text-rose-500" :
              helperToneClasses[tone]
            )}>
              {isPositiveTrend ? "↑ " : isNegativeTrend ? "↓ " : ""}
              {helper}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
