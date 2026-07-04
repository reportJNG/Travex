import { CheckCircle, Clock, FileText, Mail, User, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

export default function AdminVerifications() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.admin.listUsers.useQuery({ status: "awaiting_review" });
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const reviewMutation = trpc.admin.reviewAccount.useMutation({
    onSuccess: () => {
      toast.success("Account reviewed");
      utils.admin.listUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title={t("admin.pendingVerifications")}
        description="Approve complete business profiles and capture a clear reason when rejecting an account."
      />

      {isLoading ? (
        <LoadingCards count={4} />
      ) : users && users.length > 0 ? (
        <div className="space-y-4">
          {users.map((user: Record<string, unknown>) => {
            const profile = user.profile as Record<string, unknown> | undefined;
            const userId = user.id as string;
            const taxId = typeof profile?.taxId === "string" ? profile.taxId : "";
            const licenseNumber = typeof profile?.licenseNumber === "string" ? profile.licenseNumber : "";
            return (
              <Card key={userId}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-semibold">{(user.name as string) || "Unknown"}</h3>
                        <span className="rounded-md border px-2 py-1 text-xs capitalize">{(user.role as string) || "unknown"}</span>
                        <StatusBadge status="awaiting_review">{t("status.awaiting_review")}</StatusBadge>
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{(user.email as string) || "No email"}</span>
                        <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{(profile?.legalName as string) || "No legal name"}</span>
                        <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />{(profile?.phone as string) || "No phone"}</span>
                        <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Wilaya: {(profile?.wilayaCode as number) || "-"}</span>
                        {taxId ? <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Tax ID: {taxId}</span> : null}
                        {licenseNumber ? <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />License: {licenseNumber}</span> : null}
                      </div>
                      <Input
                        placeholder="Rejection reason (required if rejecting)"
                        value={reasons[userId] || ""}
                        onChange={(event) => setReasons({ ...reasons, [userId]: event.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                      <Button
                        size="sm"
                        onClick={() => reviewMutation.mutate({ userId, approve: true })}
                        disabled={reviewMutation.isPending}
                      >
                        <CheckCircle className="me-1 h-4 w-4" />
                        {t("admin.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const reason = reasons[userId]?.trim();
                          if (!reason) {
                            toast.error("Reason is required");
                            return;
                          }
                          reviewMutation.mutate({ userId, approve: false, reason });
                        }}
                        disabled={reviewMutation.isPending}
                      >
                        <XCircle className="me-1 h-4 w-4" />
                        {t("admin.reject")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Clock className="h-6 w-6" />}
          title="All caught up"
          description="There are no pending account verifications right now."
        />
      )}
    </div>
  );
}
