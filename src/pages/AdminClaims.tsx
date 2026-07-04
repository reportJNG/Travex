import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, CheckCircle, XCircle, MapPin } from "lucide-react";

export default function AdminClaims() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data: claims, isLoading } = trpc.admin.listClaims.useQuery();

  const decideMutation = trpc.admin.decideClaim.useMutation({
    onSuccess: () => { toast.success("Claim decided"); utils.admin.listClaims.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <FileText className="h-6 w-6" />
        {t("nav.claims")}
      </h1>

      {isLoading ? (
        <div className="p-8 text-center">Loading...</div>
      ) : claims && claims.length > 0 ? (
        <div className="space-y-4">
          {claims.map((c: Record<string, unknown>) => {
            const seededHotel = c.seededHotel as Record<string, unknown> | undefined;
            const claimant = c.claimant as Record<string, unknown> | undefined;
            return (
              <Card key={c.id as number}>
                <CardContent className="p-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Seeded Hotel */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-slate-500 text-sm uppercase">Seeded Hotel</h3>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="font-semibold text-slate-800">{(seededHotel?.name as string) || "-"}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {((seededHotel as any)?.wilaya?.nameFr) || "-"}
                        </div>
                      </div>
                    </div>

                    {/* Claimant */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-slate-500 text-sm uppercase">Claimant</h3>
                      <div className="bg-teal-50 rounded-lg p-3">
                        <div className="font-semibold text-slate-800">{(claimant?.legalName as string) || (claimant?.fullName as string) || "-"}</div>
                        <div className="text-sm text-slate-500">{(claimant?.phone as string) || "-"}</div>
                      </div>
                    </div>
                  </div>

                  {c.status === "pending" && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          if (confirm("Approve this claim? The seeded hotel will be deactivated.")) {
                            decideMutation.mutate({ claimId: c.id as number, approve: true });
                          }
                        }}
                      >
                        <CheckCircle className="h-4 w-4 me-1" />
                        Approve Takeover
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          if (confirm("Reject this claim?")) {
                            decideMutation.mutate({ claimId: c.id as number, approve: false });
                          }
                        }}
                      >
                        <XCircle className="h-4 w-4 me-1" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {c.status !== "pending" && (
                    <Badge className={c.status === "approved" ? "bg-green-100 text-green-700 mt-4" : "bg-red-100 text-red-700 mt-4"}>
                      {c.status as string}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p>No claims to review</p>
        </div>
      )}
    </div>
  );
}
