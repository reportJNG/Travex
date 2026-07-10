import {
  BadgeCheck,
  Bell,
  BellOff,
  Building2,
  CalendarCheck,
  Check,
  CreditCard,
  FileText,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

type NotifStyle = { icon: React.ElementType; bg: string; text: string };

const NOTIFICATION_STYLE: Record<string, NotifStyle> = {
  booking_request: {
    icon: CalendarCheck,
    bg: "bg-primary/10",
    text: "text-primary",
  },
  booking_rejected: { icon: XCircle, bg: "bg-rose-100", text: "text-rose-600" },
  payment_window_started: {
    icon: CreditCard,
    bg: "bg-sky-100",
    text: "text-sky-600",
  },
  payment_received: {
    icon: BadgeCheck,
    bg: "bg-emerald-100",
    text: "text-emerald-600",
  },
  online_confirmed: {
    icon: BadgeCheck,
    bg: "bg-emerald-100",
    text: "text-emerald-600",
  },
  account_approved: {
    icon: ShieldAlert,
    bg: "bg-emerald-100",
    text: "text-emerald-600",
  },
  account_rejected: {
    icon: ShieldAlert,
    bg: "bg-rose-100",
    text: "text-rose-600",
  },
  invoice_issued: {
    icon: FileText,
    bg: "bg-amber-100",
    text: "text-amber-600",
  },
  claim_decided: {
    icon: Building2,
    bg: "bg-violet-100",
    text: "text-violet-600",
  },
};

const DEFAULT_STYLE: NotifStyle = {
  icon: Bell,
  bg: "bg-muted",
  text: "text-muted-foreground",
};

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

function getNotificationDetail(
  type: string,
  data: Record<string, unknown>
): string | null {
  const ref =
    typeof data.reference === "string" ? `Ref: ${data.reference}` : null;
  const hotel = typeof data.hotelName === "string" ? data.hotelName : null;
  const period = typeof data.period === "string" ? data.period : null;

  if (
    type === "booking_request" ||
    type === "booking_rejected" ||
    type === "payment_window_started" ||
    type === "payment_received" ||
    type === "online_confirmed"
  ) {
    return [ref, hotel].filter(Boolean).join(" · ");
  }
  if (type === "invoice_issued") {
    return [period, ref].filter(Boolean).join(" · ");
  }
  return ref;
}

export default function Notifications() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data: notifications, isLoading } = trpc.notification.list.useQuery();

  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });
  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      toast.success("All marked as read");
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  const unreadCount = notifications?.filter(n => !n.readAt).length || 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Inbox"
        title={t("notifications.title")}
        description="Booking, payment, account, invoice, and claim updates."
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <Check className="me-2 h-4 w-4" />
              {t("notifications.markAllRead")}
            </Button>
          ) : null
        }
      />

      {unreadCount > 0 ? (
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-primary">
          {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <LoadingCards count={4} />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map(notification => {
                let payload: Record<string, unknown> = {};
                try {
                  payload =
                    typeof notification.data === "string"
                      ? JSON.parse(notification.data)
                      : (notification.data as Record<string, unknown>) || {};
                } catch {
                  payload = {};
                }
                const isUnread = !notification.readAt;
                const detail = getNotificationDetail(
                  notification.type,
                  payload
                );
                const style =
                  NOTIFICATION_STYLE[notification.type] ?? DEFAULT_STYLE;
                const Icon = style.icon;

                return (
                  <button
                    key={notification.id}
                    type="button"
                    className={`group flex w-full items-start gap-4 px-4 py-4 text-start transition-colors hover:bg-muted/50 ${
                      isUnread ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (isUnread)
                        markRead.mutate({ notificationId: notification.id });
                    }}
                  >
                    <span
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${style.bg} ${style.text} transition-transform group-hover:scale-105`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {t(`notifications.${notification.type}`) ||
                            notification.type}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {timeAgo(notification.createdAt)}
                        </span>
                      </span>
                      {detail ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {detail}
                        </span>
                      ) : null}
                      {isUnread ? (
                        <span className="mt-1 block text-xs font-medium text-primary">
                          Tap to mark as read
                        </span>
                      ) : null}
                    </span>
                    {isUnread ? (
                      <span
                        className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                        aria-label="Unread"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                icon={<BellOff className="h-6 w-6" />}
                title={t("notifications.empty")}
                description="You are all caught up. New notifications will appear here."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
