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

export function StatCard({ label, value, icon, helper, tone = "primary" }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start gap-4 p-4 sm:p-5">
        {icon ? (
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", toneClasses[tone])}>
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="text-2xl font-semibold tracking-tight text-foreground">{value}</div>
          <div className="mt-1 text-sm text-muted-foreground">{label}</div>
          {helper ? <div className="mt-2 text-xs text-muted-foreground">{helper}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
