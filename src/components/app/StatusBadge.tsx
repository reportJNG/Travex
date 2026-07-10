import { cn } from "@/lib/utils";

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  approved:                { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  confirmed:               { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  completed:               { bg: "bg-slate-100",  text: "text-slate-600",   dot: "bg-slate-400"   },
  paid:                    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  pending_hotel:           { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
  pending_payment:         { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400"  },
  awaiting_offline_payment:{ bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-400"     },
  awaiting_review:         { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
  rejected:                { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-400"    },
  expired:                 { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-400"  },
  cancelled:               { bg: "bg-slate-100",  text: "text-slate-600",   dot: "bg-slate-400"   },
  suspended:               { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-400"    },
  unpaid:                  { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400"   },
  overdue:                 { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-400"    },
};

const fallback = { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" };

export function StatusBadge({
  status,
  children,
  className,
}: {
  status: string;
  children: React.ReactNode;
  className?: string;
}) {
  const cfg = statusConfig[status] ?? fallback;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.bg,
        cfg.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {children}
    </span>
  );
}
