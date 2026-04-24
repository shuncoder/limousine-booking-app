"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { adminListTickets, approveRefund, Ticket } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function TicketsPage() {
  const [items, setItems] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminListTickets(token);
      setItems(res.items || []);
    } catch (e: any) {
      setError(e?.msg || "Không tải được danh sách vé");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onApproveRefund = async (id: string) => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await approveRefund(token, id);
      await load();
    } catch (e: any) {
      setError(e?.msg || "Duyệt hoàn tiền thất bại");
    } finally {
      setLoading(false);
    }
  };

  const badgeColor = (status: string) => {
    if (status === "paid") return "success";
    if (status === "pending") return "warning";
    if (status === "cancelled") return "error";
    if (status === "expired") return "error";
    return "warning";
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Vé" />

      {error ? <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/40 dark:text-error-200">{error}</div> : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Trạng thái</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Chuyến</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Ghế</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Khách</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Số tiền</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Hoàn tiền</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Ticket ID</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {items.map((t) => {
                const trip = typeof t.tripId === "string" ? null : t.tripId;
                const user = typeof t.userId === "string" ? null : t.userId;

                return (
                  <TableRow key={t._id}>
                    <TableCell className="px-5 py-4 text-start">
                      <Badge size="sm" color={badgeColor(t.status)}>
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                      {trip ? `${trip.routeFrom} → ${trip.routeTo}` : "-"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{t.seatId}</TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                      {user ? `${user.name || ""} ${user.email ? `(${user.email})` : ""}`.trim() : "-"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                      {t.totalAmount} {t.currency}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <span>{t.refundStatus || "none"}</span>
                        {t.refundStatus === "requested" ? (
                          <Button size="sm" onClick={() => onApproveRefund(t._id)} disabled={loading}>
                            Duyệt
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-xs text-gray-500 dark:text-gray-400">{t._id}</TableCell>
                  </TableRow>
                );
              })}

              {!items.length ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-theme-sm text-gray-500 dark:text-gray-400">
                    {loading ? "Đang tải..." : "Chưa có vé"}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
