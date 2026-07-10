import { Link } from "react-router";
import {
  BarChart3,
  Building2,
  DollarSign,
  Eye,
  Receipt,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function AdminDashboard() {
  const { t } = useI18n();
  const { data: stats, refetch, isFetching } = trpc.admin.stats.useQuery();
  const { data: pendingUsers } = trpc.admin.listUsers.useQuery({
    status: "awaiting_review",
  });
  const { data: invoices } = trpc.admin.listInvoices.useQuery();

  const commission = stats ? stats.transactionsVolume * 0.05 : 0;

  // Show up to 5 most recent invoices in the summary table
  const recentInvoices = invoices?.slice(0, 5) ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Command center"
        title={t("admin.title")}
        description="Monitor platform health, verification queues, users, and claim activity from one place."
        actions={
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`me-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!stats ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </>
        ) : (
          <>
            <StatCard
              label={t("admin.agencies")}
              value={stats.agencies}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label={t("admin.hotels")}
              value={stats.hotels}
              icon={<Building2 className="h-5 w-5" />}
              tone="green"
            />
            <StatCard
              label={t("admin.transactions")}
              value={stats.transactionsCount}
              icon={<Receipt className="h-5 w-5" />}
            />
            <StatCard
              label={t("admin.volume")}
              value={`${(stats.transactionsVolume / 1000).toFixed(0)}K DZD`}
              icon={<BarChart3 className="h-5 w-5" />}
              tone="amber"
            />
          </>
        )}
      </div>

      {/* Commission Revenue Tracker */}
      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold">
          Commission Revenue Tracker
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {!stats ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </>
          ) : (
            <>
              <StatCard
                label="Active Agencies"
                value={stats.agencies}
                icon={<Users className="h-5 w-5" />}
              />
              <StatCard
                label="Active Hotels"
                value={stats.hotels}
                icon={<Building2 className="h-5 w-5" />}
                tone="green"
              />
              <StatCard
                label="Total GTV (DZD)"
                value={stats.transactionsVolume.toLocaleString("fr-DZ")}
                icon={<TrendingUp className="h-5 w-5" />}
                tone="amber"
              />
              <StatCard
                label="Platform Commission (5%)"
                value={`${commission.toLocaleString("fr-DZ", { maximumFractionDigits: 0 })} DZD`}
                icon={<DollarSign className="h-5 w-5" />}
                tone="green"
              />
            </>
          )}
        </div>
      </div>

      {/* Monthly Invoice Status */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Monthly Invoice Status</h2>
          <Button size="sm" variant="outline" asChild>
            <Link to="/admin/invoices">View all invoices</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Amount (DZD)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.hotel?.name ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invoice.period ?? invoice.issuedAt?.slice(0, 7) ?? "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {Number(
                          invoice.amount ?? invoice.totalAmount ?? 0
                        ).toLocaleString("fr-DZ")}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status}>
                          {invoice.status}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {/* Placeholder rows when no invoice data is available yet */}
                    <TableRow>
                      <TableCell className="font-medium">
                        Hotel Sofitel Algiers
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        2026-06
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        24,500
                      </TableCell>
                      <TableCell>
                        <StatusBadge status="paid">Paid</StatusBadge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Hilton Oran</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        2026-06
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        18,200
                      </TableCell>
                      <TableCell>
                        <StatusBadge status="awaiting_review">
                          Grace Period
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Riadh Palms Constantine
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        2026-06
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        9,750
                      </TableCell>
                      <TableCell>
                        <StatusBadge status="rejected">Overdue</StatusBadge>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Visibility Control Notice */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Eye className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div>
          <span className="font-semibold">Visibility Control: </span>
          Hotels with unpaid invoices (&gt;30 days) are automatically hidden.
          Monitor via{" "}
          <Link to="/admin/invoices" className="underline hover:no-underline">
            Invoice Management
          </Link>
          .
        </div>
      </div>

      {pendingUsers && pendingUsers.length > 0 ? (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Shield className="h-5 w-5 shrink-0 text-amber-600" />
          <span>
            <span className="font-semibold">{pendingUsers.length}</span> account
            {pendingUsers.length !== 1 ? "s" : ""} awaiting verification review.
          </span>
          <Button
            size="sm"
            asChild
            variant="outline"
            className="ms-auto border-amber-300 bg-amber-100 hover:bg-amber-200"
          >
            <Link to="/admin/verifications">Review now</Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          {
            title: "Review verifications",
            description:
              "Approve or reject new hotel and agency accounts awaiting review.",
            href: "/admin/verifications",
            icon: Shield,
            badge: pendingUsers?.length,
          },
          {
            title: "Manage users",
            description:
              "Search accounts, inspect roles, and suspend risky access.",
            href: "/admin/users",
            icon: Users,
            badge: undefined,
          },
          {
            title: "Review claims",
            description:
              "Resolve seeded hotel ownership requests with clear audit actions.",
            href: "/admin/claims",
            icon: Building2,
            badge: undefined,
          },
          {
            title: "Hotel invoices",
            description:
              "Generate monthly commissions, mark payments received, and track billing.",
            href: "/admin/invoices",
            icon: Receipt,
            badge: undefined,
          },
          {
            title: "Payment reviews",
            description:
              "Verify offline payment receipts submitted by agencies.",
            href: "/admin/payment-verifications",
            icon: Eye,
            badge: undefined,
          },
        ].map(action => (
          <Card key={action.href} className="transition-shadow hover:shadow-md">
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <action.icon className="h-5 w-5" />
                </div>
                {action.badge ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    {action.badge}
                  </span>
                ) : null}
              </div>
              <div className="flex-1">
                <h2 className="font-semibold">{action.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="justify-start hover:bg-primary/5"
              >
                <Link to={action.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
