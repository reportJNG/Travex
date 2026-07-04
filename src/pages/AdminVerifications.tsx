import { useState } from "react";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Mail, User, FileText } from "lucide-react";

export default function AdminVerifications() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.admin.listUsers.useQuery({ status: "awaiting_review" });

  const reviewMutation = trpc.admin.reviewAccount.useMutation({
    onSuccess: () => { toast.success("Account reviewed"); utils.admin.listUsers.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const [reasons, setReasons] = useState<Record<number, string>>({});

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Clock className="h-6 w-6" />
        {t("admin.pendingVerifications")}
        {users && users.length > 0 && (
          <Badge variant="secondary" className="ms-2">{users.length}</Badge>
        )}
      </h1>

      {users && users.length > 0 ? (
        <div className="space-y-4">
          {users.map((u: Record<string, unknown>) => {
            const profile = u.profile as Record<string, unknown> | undefined;
            return (
              <Card key={u.id as number}>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{(u.name as string) || "Unknown"}</h3>
                        <Badge variant="outline" className="capitalize">{(u.role as string) || "unknown"}</Badge>
                        <Badge className="bg-yellow-100 text-yellow-700">{t("status.awaiting_review")}</Badge>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {(u.email as string) || "No email"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {(profile?.legalName as string) || "No legal name"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          {(profile?.phone as string) || "No phone"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          Wilaya: {(profile?.wilayaCode as number) || "-"}
                        </span>
                        {profile?.taxId && (
                          <span className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            Tax ID: {profile.taxId as string}
                          </span>
                        )}
                        {profile?.licenseNumber && (
                          <span className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                            License: {profile.licenseNumber as string}
                          </span>
                        )}
                      </div>
                      <Input
                        placeholder="Rejection reason (required if rejecting)"
                        className="text-sm mt-2"
                        value={reasons[u.id as number] || ""}
                        onChange={(e) => setReasons({ ...reasons, [u.id as number]: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => reviewMutation.mutate({ userId: u.id as number, approve: true })}
                        disabled={reviewMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 me-1" />
                        {t("admin.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          const reason = reasons[u.id as number];
                          if (!reason) { toast.error("Reason is required"); return; }
                          reviewMutation.mutate({ userId: u.id as number, approve: false, reason });
                        }}
                        disabled={reviewMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 me-1" />
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
        <div className="text-center py-16 text-slate-400">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-300" />
          <p>All caught up! No pending verifications.</p>
        </div>
      )}
    </div>
  );
}
