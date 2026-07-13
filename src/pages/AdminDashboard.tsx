import { Link } from "react-router";
import {
  BarChart3,
  Building2,
  CheckCircle,
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

const quickActions = [
  {
    title: "Vérifications",
    description: "Approuver ou rejeter les nouveaux comptes en attente de révision.",
    href: "/admin/verifications",
    icon: Shield,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Gestion des utilisateurs",
    description: "Rechercher des comptes, inspecter les rôles et suspendre les accès à risque.",
    href: "/admin/users",
    icon: Users,
    color: "bg-sky-100 text-sky-600",
  },
  {
    title: "Réclamations hôtels",
    description: "Résoudre les demandes de propriété des hôtels seeded avec des actions d'audit claires.",
    href: "/admin/claims",
    icon: Building2,
    color: "bg-violet-100 text-violet-600",
  },
  {
    title: "Factures hôtels",
    description: "Générer les commissions mensuelles, marquer les paiements reçus et suivre la facturation.",
    href: "/admin/invoices",
    icon: Receipt,
    color: "bg-amber-100 text-amber-600",
  },
  {
    title: "Révisions de paiements",
    description: "Vérifier les reçus de paiement offline soumis par les agences.",
    href: "/admin/payment-verifications",
    icon: Eye,
    color: "bg-emerald-100 text-emerald-600",
  },
];

export default function AdminDashboard() {
  const { t } = useI18n();
  const { data: stats, refetch, isFetching } = trpc.admin.stats.useQuery();
  const { data: pendingUsers } = trpc.admin.listUsers.useQuery({ status: "awaiting_review" });
  const { data: invoices } = trpc.admin.listInvoices.useQuery();
  const { data: pendingPayments } = trpc.admin.listPaymentVerifications.useQuery({
    status: "awaiting_admin_payment_verification",
  });

  const commission = stats ? stats.transactionsVolume * 0.05 : 0;
  const recentInvoices = invoices?.slice(0, 5) ?? [];
  const overdueInvoices = invoices?.filter((invoice: any) => invoice.status === "overdue").length ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Centre de commande"
        title={t("admin.title")}
        description="Surveillez la santé de la plateforme, les files d'attente de vérification, les utilisateurs et l'activité des réclamations."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`me-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        }
      />

      {/* Pending review alert */}
      {((pendingUsers?.length ?? 0) > 0 || (pendingPayments?.length ?? 0) > 0 || overdueInvoices > 0) && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900 lg:flex-row lg:items-center">
          <CheckCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold">Files à traiter : </span>
            {(pendingUsers?.length ?? 0)} comptes, {(pendingPayments?.length ?? 0)} paiements, {overdueInvoices} factures en retard.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild variant="outline" className="border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-800">
              <Link to="/admin/verifications">Comptes</Link>
            </Button>
            <Button size="sm" asChild variant="outline" className="border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-800">
              <Link to="/admin/payment-verifications">Paiements</Link>
            </Button>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard label={t("admin.agencies")} value={stats.agencies} icon={<Users className="h-5 w-5" />} />
            <StatCard label={t("admin.hotels")} value={stats.hotels} icon={<Building2 className="h-5 w-5" />} tone="green" />
            <StatCard label={t("admin.transactions")} value={stats.transactionsCount} icon={<BarChart3 className="h-5 w-5" />} tone="blue" />
            <StatCard
              label={t("admin.volume")}
              value={`${(stats.transactionsVolume / 1000).toFixed(0)}K DZD`}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="amber"
            />
          </>
        )}
      </div>

      {/* Commission & Revenue */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Volume total (GTV)"
              value={`${stats.transactionsVolume.toLocaleString("fr-DZ")} DZD`}
              icon={<TrendingUp className="h-5 w-5" />}
              tone="blue"
            />
            <StatCard
              label="Commission plateforme (5%)"
              value={`${commission.toLocaleString("fr-DZ", { maximumFractionDigits: 0 })} DZD`}
              icon={<DollarSign className="h-5 w-5" />}
              tone="green"
            />
            <StatCard
              label="Comptes à vérifier"
              value={pendingUsers?.length ?? 0}
              icon={<Shield className="h-5 w-5" />}
              tone="amber"
            />
            <StatCard
              label="Paiements à vérifier"
              value={pendingPayments?.length ?? 0}
              icon={<Eye className="h-5 w-5" />}
              tone="violet"
            />
          </>
        )}
      </div>

      {/* Visibility notice */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3.5 text-sm text-sky-800">
        <Eye className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <div>
          <span className="font-semibold">Contrôle de visibilité : </span>
          Les hôtels avec des factures impayées (&gt;30 jours) sont automatiquement masqués.
          Suivez via{" "}
          <Link to="/admin/invoices" className="font-medium underline hover:no-underline">
            Gestion des factures
          </Link>
          .
        </div>
      </div>

      {/* Recent invoices */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Statut des factures mensuelles</h2>
          <Button size="sm" variant="outline" asChild>
            <Link to="/admin/invoices">Voir toutes les factures</Link>
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hôtel</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Période</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Montant (DZD)</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.length > 0 ? (
                    recentInvoices.map((invoice: any) => (
                      <TableRow key={invoice.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium py-3">{invoice.hotel?.name ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground py-3">
                          {invoice.period ?? invoice.issuedAt?.slice(0, 7) ?? "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-3">
                          {Number(invoice.amount ?? invoice.totalAmount ?? 0).toLocaleString("fr-DZ")}
                        </TableCell>
                        <TableCell className="py-3">
                          <StatusBadge status={invoice.status}>{invoice.status}</StatusBadge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <>
                      {[
                        { name: "Dar El Marsa Tunis", period: "2026-06", amount: "31 400", status: "paid", label: "Payé" },
                        { name: "Royal Oran Business", period: "2026-06", amount: "18 200", status: "awaiting_review", label: "En grâce" },
                        { name: "Constantine Bridge Hotel", period: "2026-06", amount: "9 750", status: "rejected", label: "En retard" },
                      ].map(row => (
                        <TableRow key={row.name} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium py-3">{row.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground py-3">{row.period}</TableCell>
                          <TableCell className="text-right font-mono text-sm py-3">{row.amount}</TableCell>
                          <TableCell className="py-3">
                            <StatusBadge status={row.status}>{row.label}</StatusBadge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Actions rapides</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {quickActions.map(action => (
            <Link
              key={action.href}
              to={action.href}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/20 hover:shadow-md"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
