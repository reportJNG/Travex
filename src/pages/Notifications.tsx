import { BellOff, Calendar, Check } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

const NOTIFICATION_ICONS: Record<string, string> = {
  booking_request: "BR",
  booking_rejected: "RJ",
  payment_window_started: "PW",
  payment_received: "PR",
  online_confirmed: "OK",
  account_approved: "AA",
  account_rejected: "AR",
  invoice_issued: "IN",
  claim_decided: "CL",
};

export default function Notifications() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data: notifications, isLoading } = trpc.notification.list.useQuery();

  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate(),
  });
  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      toast.success("All marked as read");
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  const unreadCount = notifications?.filter((notification) => !notification.readAt).length || 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Inbox"
        title={t("notifications.title")}
        description="Review booking, payment, account, invoice, and claim updates."
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <Check className="me-2 h-4 w-4" />
              {t("notifications.markAllRead")}
            </Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <LoadingCards count={4} />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => {
                let payload: Record<string, unknown> = {};
                try {
                  payload = typeof notification.data === "string" ? JSON.parse(notification.data) : (notification.data as Record<string, unknown>);
                } catch {
                  payload = {};
                }
                const isUnread = !notification.readAt;
                const reference = typeof payload.reference === "string" ? payload.reference : "";

                return (
                  <button
                    key={notification.id}
                    type="button"
                    className={`flex w-full items-start gap-3 p-4 text-start transition-colors hover:bg-muted/60 ${
                      isUnread ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (isUnread) markRead.mutate({ notificationId: notification.id });
                    }}
                  >
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {NOTIFICATION_ICONS[notification.type] || "NT"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {t(`notifications.${notification.type}`)}
                        </span>
                        {isUnread ? <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" /> : null}
                      </span>
                      {reference ? <span className="mt-0.5 block text-xs text-muted-foreground">Ref: {reference}</span> : null}
                      <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6">
              <EmptyState icon={<BellOff className="h-6 w-6" />} title={t("notifications.empty")} description="You are all caught up." />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
