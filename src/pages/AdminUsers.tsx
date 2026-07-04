import { useState } from "react";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Users, Shield, Building2, Plane, Ban } from "lucide-react";

export default function AdminUsers() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>();

  const { data: users, isLoading } = trpc.admin.listUsers.useQuery({
    search: search || undefined,
    role: roleFilter as any,
    page: 1,
    limit: 50,
  });

  const setStatus = trpc.admin.setUserStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); utils.admin.listUsers.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const roleIcon = (role: string) => {
    if (role === "super_admin") return <Shield className="h-4 w-4 text-purple-600" />;
    if (role === "hotel") return <Building2 className="h-4 w-4 text-teal-600" />;
    return <Plane className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Users className="h-6 w-6" />
        {t("admin.users")}
      </h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t("admin.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {["agency", "hotel", "super_admin"].map((r) => (
            <Badge
              key={r}
              variant={roleFilter === r ? "default" : "outline"}
              className="cursor-pointer capitalize"
              onClick={() => setRoleFilter(roleFilter === r ? undefined : r)}
            >
              {r.replace("_", " ")}
            </Badge>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Email</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: Record<string, unknown>) => {
                    const profile = u.profile as Record<string, unknown> | undefined;
                    return (
                      <tr key={u.id as number} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{(u.name as string) || "-"}</div>
                          <div className="text-xs text-slate-500">{(profile?.legalName as string) || "-"}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1.5">
                            {roleIcon((u.role as string) || "")}
                            <span className="capitalize">{(u.role as string)?.replace("_", " ")}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={
                            (u.status as string) === "approved" ? "bg-green-100 text-green-700" :
                            (u.status as string) === "awaiting_review" ? "bg-yellow-100 text-yellow-700" :
                            (u.status as string) === "rejected" ? "bg-red-100 text-red-700" :
                            "bg-orange-100 text-orange-700"
                          }>
                            {t(`status.${u.status as string}`) || u.status as string}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{(u.email as string) || "-"}</td>
                        <td className="py-3 px-4 text-right">
                          {(u.status as string) === "approved" && (u.role as string) !== "super_admin" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-orange-600 hover:text-orange-700"
                              onClick={() => {
                                if (confirm(`Suspend ${u.name}?`)) {
                                  setStatus.mutate({ userId: u.id as number, status: "suspended" });
                                }
                              }}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          {(u.status as string) === "suspended" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => setStatus.mutate({ userId: u.id as number, status: "approved" })}
                            >
                              Approve
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p>No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
