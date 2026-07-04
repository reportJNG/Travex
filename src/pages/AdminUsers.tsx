import { useState } from "react";
import { Ban, Building2, CheckCircle, Plane, Search, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

const roleOptions = ["all", "agency", "hotel", "super_admin"] as const;

export default function AdminUsers() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<(typeof roleOptions)[number]>("all");

  const { data: users, isLoading } = trpc.admin.listUsers.useQuery({
    search: search || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
    page: 1,
    limit: 50,
  });

  const setStatus = trpc.admin.setUserStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      utils.admin.listUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const roleIcon = (role: string) => {
    if (role === "super_admin") return <Shield className="h-4 w-4 text-slate-700" />;
    if (role === "hotel") return <Building2 className="h-4 w-4 text-primary" />;
    return <Plane className="h-4 w-4 text-sky-600" />;
  };

  const renderActions = (user: Record<string, unknown>) => {
    const status = user.status as string;
    const role = user.role as string;
    const userId = user.id as string;
    const name = (user.name as string) || "this user";

    if (status === "approved" && role !== "super_admin") {
      return (
        <ConfirmAction
          title="Suspend user?"
          description={`Suspend ${name}. They will lose access until approved again.`}
          confirmLabel={t("admin.suspend")}
          destructive
          onConfirm={() => setStatus.mutate({ userId, status: "suspended" })}
        >
          <Button size="sm" variant="outline" disabled={setStatus.isPending}>
            <Ban className="me-1 h-4 w-4" />
            {t("admin.suspend")}
          </Button>
        </ConfirmAction>
      );
    }
    if (status === "suspended") {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setStatus.mutate({ userId, status: "approved" })}
          disabled={setStatus.isPending}
        >
          <CheckCircle className="me-1 h-4 w-4" />
          {t("admin.approve")}
        </Button>
      );
    }
    return <span className="text-xs text-muted-foreground">No action</span>;
  };

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title={t("admin.users")}
        description="Search accounts, review roles, and manage access without breaking the marketplace flow."
      />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
            <Input
              placeholder={t("admin.search")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role} className="capitalize">
                  {role === "all" ? "All roles" : role.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <LoadingCards count={4} />
            </div>
          ) : users && users.length > 0 ? (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: Record<string, unknown>) => {
                      const profile = user.profile as Record<string, unknown> | undefined;
                      return (
                        <TableRow key={user.id as string}>
                          <TableCell>
                            <div className="max-w-64 truncate font-medium">{(user.name as string) || "-"}</div>
                            <div className="max-w-64 truncate text-xs text-muted-foreground">{(profile?.legalName as string) || "-"}</div>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5 capitalize">
                              {roleIcon((user.role as string) || "")}
                              {(user.role as string)?.replace("_", " ")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={user.status as string}>{t(`status.${user.status as string}`)}</StatusBadge>
                          </TableCell>
                          <TableCell className="max-w-64 truncate text-muted-foreground">{(user.email as string) || "-"}</TableCell>
                          <TableCell>
                            <div className="flex justify-end">{renderActions(user)}</div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-3 p-4 md:hidden">
                {users.map((user: Record<string, unknown>) => {
                  const profile = user.profile as Record<string, unknown> | undefined;
                  return (
                    <Card key={user.id as string}>
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold">{(user.name as string) || "-"}</h3>
                            <p className="truncate text-sm text-muted-foreground">{(user.email as string) || "-"}</p>
                            <p className="truncate text-xs text-muted-foreground">{(profile?.legalName as string) || "-"}</p>
                          </div>
                          <StatusBadge status={user.status as string}>{t(`status.${user.status as string}`)}</StatusBadge>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5 text-sm capitalize">
                            {roleIcon((user.role as string) || "")}
                            {(user.role as string)?.replace("_", " ")}
                          </span>
                          {renderActions(user)}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-6">
              <EmptyState icon={<Users className="h-6 w-6" />} title="No users found" description="Try a different search or role filter." />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
