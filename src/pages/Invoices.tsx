import { Download, Receipt } from "lucide-react";
import { EmptyState } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/i18n";

export default function Invoices() {
  const { t } = useI18n();
  const invoices = [
    { id: 1, period: "2026-06", total: 125000, status: "unpaid", dueDate: "2026-07-10" },
    { id: 2, period: "2026-05", total: 98000, status: "paid", dueDate: "2026-06-10" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title={t("invoices.title")}
        description="Track commission invoices, due dates, and payment state for the agency account."
      />

      <Card>
        <CardContent className="p-0">
          {invoices.length ? (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("invoices.period")}</TableHead>
                      <TableHead className="text-right">{t("invoices.amount")}</TableHead>
                      <TableHead>{t("invoices.status")}</TableHead>
                      <TableHead>{t("invoices.dueDate")}</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.period}</TableCell>
                        <TableCell className="text-right">{invoice.total.toLocaleString()} DZD</TableCell>
                        <TableCell>
                          <StatusBadge status={invoice.status}>{t(`invoices.status.${invoice.status}`)}</StatusBadge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{invoice.dueDate}</TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" aria-label="Download invoice">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-3 p-4 md:hidden">
                {invoices.map((invoice) => (
                  <Card key={invoice.id}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{invoice.period}</div>
                          <div className="text-sm text-muted-foreground">{t("invoices.dueDate")}: {invoice.dueDate}</div>
                        </div>
                        <StatusBadge status={invoice.status}>{t(`invoices.status.${invoice.status}`)}</StatusBadge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold">{invoice.total.toLocaleString()} DZD</div>
                        <Button size="sm" variant="outline">
                          <Download className="me-1 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="p-6">
              <EmptyState icon={<Receipt className="h-6 w-6" />} title="No invoices yet" description="Invoices will appear once monthly commission statements are generated." />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
