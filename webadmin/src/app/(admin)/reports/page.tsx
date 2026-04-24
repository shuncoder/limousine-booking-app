"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { fillRateReport, revenueByRoute } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function ReportsPage() {
  const [revenue, setRevenue] = React.useState<Array<{ routeFrom: string; routeTo: string; revenue: number; tickets: number }>>([]);
  const [fill, setFill] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [r, f] = await Promise.all([revenueByRoute(token), fillRateReport(token)]);
      setRevenue(r.items || []);
      setFill(f.items || []);
    } catch (e: any) {
      setError(e?.msg || "Không tải được báo cáo");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageBreadcrumb pageTitle="Báo cáo" />
      {error ? <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/40 dark:text-error-200">{error}</div> : null}

      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-800 dark:border-white/[0.05] dark:text-white/90">
          Doanh thu theo tuyến
        </div>
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Tuyến</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Số vé</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Doanh thu</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {revenue.map((r, idx) => (
                <TableRow key={`${r.routeFrom}-${r.routeTo}-${idx}`}>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">{r.routeFrom} → {r.routeTo}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{r.tickets}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{r.revenue}</TableCell>
                </TableRow>
              ))}
              {!revenue.length ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-theme-sm text-gray-500 dark:text-gray-400">{loading ? "Đang tải..." : "Chưa có dữ liệu"}</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 text-base font-semibold text-gray-800 dark:border-white/[0.05] dark:text-white/90">
          Tỷ lệ lấp đầy ghế
        </div>
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Chuyến</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Tổng ghế</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Paid</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Pending</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Held</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Tỷ lệ (Paid)</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Tỷ lệ (Đang chiếm)</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {fill.map((x) => (
                <TableRow key={x.tripId}>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                    {x.routeFrom} → {x.routeTo}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{x.totalSeats}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{x.paid}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{x.pending}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{x.held}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{Math.round((x.fillRatePaid || 0) * 100)}%</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{Math.round((x.fillRateOccupied || 0) * 100)}%</TableCell>
                </TableRow>
              ))}
              {!fill.length ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-theme-sm text-gray-500 dark:text-gray-400">{loading ? "Đang tải..." : "Chưa có dữ liệu"}</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
