import { Clock, FileText, RefreshCw } from "lucide-react";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";

import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const ACTION_COLORS: Record<string, string> = {
  approve: "text-emerald-700 bg-emerald-50",
  reject: "text-rose-700 bg-rose-50",
  suspend: "text-orange-700 bg-orange-50",
  mark_paid: "text-sky-700 bg-sky-50",
  generate_invoices: "text-violet-700 bg-violet-50",
  claim_approve: "text-emerald-700 bg-emerald-50",
  claim_reject: "text-rose-700 bg-rose-50",
};

export default function AdminAuditLogs() {
  const { t } = useI18n();
  const { data: logs, isLoading, refetch, isFetching } = trpc.admin.listAuditLogs.useQuery({
    page: 1,
    limit: 100,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title={t("admin.auditLogs")}
        description="Complete record of admin actions — approvals, rejections, suspensions, claim decisions, and invoice marks."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`me-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {isLoading ? (
        <LoadingCards count={6} />
      ) : logs && logs.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="p-0">
            <div className="divide-y">
              {(logs as Record<string, unknown>[]).map((log) => {
                const actor = log.actor as Record<string, unknown> | undefined;
                const actorName =
                  (actor?.fullName as string) ||
                  (actor?.legalName as string) ||
                  "System";
                const actionColor = ACTION_COLORS[log.action as string] ?? "text-slate-700 bg-slate-50";
                return (
                  <div key={log.id as string} className="flex items-start gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:px-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${actionColor}`}>
                          {(log.action as string)?.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm text-muted-foreground capitalize">
                          {(log.entityType as string)?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        by <span className="font-medium text-foreground">{actorName}</span>
                      </p>
                      {log.reason ? (
                        <p className="mt-1 text-xs italic text-muted-foreground">
                          "{log.reason as string}"
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-end">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        {timeAgo(log.createdAt as string)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No audit logs yet"
          description="Admin actions like approvals, rejections, and claim decisions will appear here."
        />
      )}
    </div>
  );
}
