import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusClasses: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  confirmed: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  completed: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  paid: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  pending_hotel: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  pending_payment: "bg-violet-100 text-violet-700 hover:bg-violet-100",
  awaiting_offline_payment: "bg-sky-100 text-sky-700 hover:bg-sky-100",
  awaiting_review: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  rejected: "bg-rose-100 text-rose-700 hover:bg-rose-100",
  expired: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  cancelled: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  suspended: "bg-rose-100 text-rose-700 hover:bg-rose-100",
  unpaid: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  overdue: "bg-rose-100 text-rose-700 hover:bg-rose-100",
};

export function StatusBadge({
  status,
  children,
  className,
}: {
  status: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge className={cn("border-transparent font-medium", statusClasses[status] ?? "", className)}>
      {children}
    </Badge>
  );
}
