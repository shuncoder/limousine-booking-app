"use client";

import React from "react";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Link from "next/link";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { getToken } from "@/lib/auth";
import { analyzeRevenueWithAi, revenueByRoute, revenueOverTime } from "@/lib/api";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

function toInputDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatVnd(n: number) {
  try {
    return new Intl.NumberFormat("vi-VN").format(Math.round(Number(n) || 0)) + " đ";
  } catch {
    return String(n);
  }
}

export default function DashboardPageClient() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Tổng quan" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <QuickCard title="Chuyến xe" href="/trips" desc="Tạo/chỉnh sửa chuyến & sơ đồ ghế" />
        <QuickCard title="Vé" href="/tickets" desc="Pending/Paid/Cancelled/Expired + hoàn tiền" />
        <QuickCard title="Khuyến mãi" href="/promos" desc="Quản lý mã giảm giá" />
        <QuickCard title="Báo cáo" href="/reports" desc="Doanh thu theo tuyến & tỷ lệ lấp đầy" />
        <QuickCard title="Khiếu nại" href="/complaints" desc="Xử lý phản ánh khách hàng" />
        <QuickCard title="Người dùng" href="/users" desc="Phân quyền Admin/Staff" />
      </div>

      <div className="mt-10">
        <DashboardRevenueBlock />
      </div>
    </div>
  );
}

function QuickCard({
  title,
  href,
  desc,
}: {
  title: string;
  href: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
    >
      <div className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</div>
      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{desc}</div>
    </Link>
  );
}

function DashboardRevenueBlock() {
  const today = React.useMemo(() => new Date(), []);
  const defaultTo = React.useMemo(() => toInputDate(today), [today]);
  const defaultFrom = React.useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 90);
    return toInputDate(d);
  }, [today]);

  const [from, setFrom] = React.useState(defaultFrom);
  const [to, setTo] = React.useState(defaultTo);
  const [granularity] = React.useState<"day" | "month">("day");
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const [timeline, setTimeline] = React.useState<{ period: string; revenue: number; tickets: number }[]>(
    []
  );
  const [routes, setRoutes] = React.useState<
    { routeFrom: string; routeTo: string; revenue: number; tickets: number }[]
  >([]);

  const [aiQuestion, setAiQuestion] = React.useState("");
  const [aiBusy, setAiBusy] = React.useState(false);
  const [aiText, setAiText] = React.useState<string | null>(null);
  const [aiErr, setAiErr] = React.useState<string | null>(null);

  const loadCharts = React.useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setErr(null);
    try {
      const fromIso = new Date(from + "T00:00:00").toISOString();
      const toIso = new Date(to + "T23:59:59").toISOString();
      const [tRes, rRes] = await Promise.all([
        revenueOverTime(token, { from: fromIso, to: toIso, granularity }),
        revenueByRoute(token, { from: fromIso, to: toIso }),
      ]);
      setTimeline(tRes.items || []);
      const top = [...(rRes.items || [])].sort((a, b) => b.revenue - a.revenue).slice(0, 12);
      setRoutes(top);
    } catch (e: unknown) {
      const msg = (e as { msg?: string })?.msg || "Không tải được biểu đồ.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }, [from, to, granularity]);

  React.useEffect(() => {
    void loadCharts();
  }, [loadCharts]);

  const lineOptions: ApexOptions = React.useMemo(
    () => ({
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "area",
        height: 340,
        toolbar: { show: false },
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 2 },
      fill: {
        type: "gradient",
        gradient: { opacityFrom: 0.45, opacityTo: 0 },
      },
      xaxis: {
        categories: timeline.map((x) => x.period),
        labels: { rotate: timeline.length > 14 ? -45 : 0 },
      },
      yaxis: {
        labels: {
          formatter: (v: number | string) => formatVnd(Number(v)),
          style: { colors: "#6B7280" },
        },
      },
      tooltip: {
        y: {
          formatter: (v: number) => formatVnd(v),
        },
      },
      colors: ["#465FFF"],
      grid: { strokeDashArray: 4 },
    }),
    [timeline]
  );

  const lineSeries = React.useMemo(
    () => [
      {
        name: "Doanh thu vé đã TT",
        data: timeline.map((x) => x.revenue),
      },
    ],
    [timeline]
  );

  const barCategories = routes.map((r) => `${r.routeFrom.slice(0, 10)}…→…${r.routeTo.slice(0, 10)}`);

  const barOptions: ApexOptions = React.useMemo(
    () => ({
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "bar",
        height: 340,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: { horizontal: false, columnWidth: "52%", borderRadius: 6 },
      },
      dataLabels: { enabled: false },
      colors: ["#465fff"],
      xaxis: {
        categories: barCategories,
        labels: {
          rotate: -35,
          maxHeight: 100,
          style: { fontSize: "11px" },
        },
      },
      yaxis: {
        labels: {
          formatter: (v: number | string) => formatVnd(Number(v)),
          style: { colors: "#6B7280" },
        },
      },
      tooltip: {
        custom: ({
          series,
          seriesIndex,
          dataPointIndex,
        }: {
          series: number[][];
          seriesIndex: number;
          dataPointIndex: number;
        }) => {
          const r = routes[dataPointIndex];
          if (!r) return "";
          const val = series[seriesIndex]?.[dataPointIndex] ?? 0;
          return `<div style="padding:8px;font-size:12px">
              <strong>${r.routeFrom} → ${r.routeTo}</strong><br/>
              Doanh thu: ${formatVnd(val)}<br/>
              Vé: ${r.tickets}
            </div>`;
        },
      },
      grid: { strokeDashArray: 4 },
    }),
    [barCategories.join("|"), routes]
  );

  const barSeries = React.useMemo(
    () => [{ name: "Doanh thu", data: routes.map((x) => x.revenue) }],
    [routes]
  );

  const runAi = async () => {
    const token = getToken();
    if (!token) return;
    setAiBusy(true);
    setAiErr(null);
    try {
      const fromIso = new Date(from + "T00:00:00").toISOString();
      const toIso = new Date(to + "T23:59:59").toISOString();
      const res = await analyzeRevenueWithAi(token, {
        question: aiQuestion.trim() || undefined,
        from: fromIso,
        to: toIso,
      });
      setAiText(res.analysis);
    } catch (e: unknown) {
      const msg = (e as { msg?: string })?.msg || "Gọi AI thất bại.";
      setAiErr(msg);
      setAiText(null);
    } finally {
      setAiBusy(false);
    }
  };

  const chartReady = !loading && !err && timeline.length > 0;
  const barReady = !loading && !err && routes.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Phân tích doanh thu (vé đã thanh toán)
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Chọn khoảng ngày, xem đường theo thời gian và cột theo tuyến. Phần AI dùng dữ liệu tổng hợp từ
          backend và khóa <code className="text-xs">OPENAI_API_KEY</code> trong .env máy chủ API.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
          <div>
            <Label>Từ ngày</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label>Đến ngày</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="md:col-span-2 flex gap-3">
            <Button size="sm" onClick={() => void loadCharts()} disabled={loading}>
              {loading ? "Đang tải…" : "Cập nhật biểu đồ"}
            </Button>
          </div>
        </div>
      </div>

      {err ? (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/40 dark:text-error-300">
          {err}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] md:p-5">
          <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            Doanh thu theo thời gian (đường / vùng)
          </h3>
          {!chartReady ? (
            <EmptyChart loading={loading} />
          ) : (
            <div className="max-w-full overflow-x-auto">
              <ReactApexChart
                key={`line-${from}-${to}`}
                options={lineOptions}
                series={lineSeries}
                type="area"
                height={340}
              />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] md:p-5">
          <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            Top tuyến — doanh thu (cột)
          </h3>
          {!barReady ? (
            <EmptyChart loading={loading} />
          ) : (
            <div className="max-w-full overflow-x-auto">
              <ReactApexChart
                key={`bar-${from}-${to}`}
                options={barOptions}
                series={barSeries}
                type="bar"
                height={340}
              />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03] md:p-5">
        <h3 className="mb-2 text-base font-semibold text-gray-800 dark:text-white/90">
          Phân tích AI
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Backend gửi các số liệu tổng hợp (không có thông tin cá nhân khách). Bạn có thể hỏi tùy ý —
          để trống sẽ dùng câu hỏi mặc định.
        </p>
        <TextArea
          rows={4}
          placeholder='Ví dụ: "Tuyến nào đáng để tăng chuyến cuối tuần?" hoặc để trống.'
          value={aiQuestion}
          onChange={(v) => setAiQuestion(v)}
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <Button onClick={() => void runAi()} disabled={aiBusy}>
            {aiBusy ? "Đang phân tích…" : "Chạy phân tích AI"}
          </Button>
        </div>
        {aiErr ? (
          <p className="mt-3 text-sm text-error-600 dark:text-error-400">{aiErr}</p>
        ) : null}
        {aiText ? (
          <pre className="mt-4 max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-800 dark:bg-white/[0.06] dark:text-white/90">
            {aiText}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

function EmptyChart({ loading }: { loading: boolean }) {
  return (
    <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
      {loading ? "Đang tải…" : "Chưa có dữ liệu trong khoảng thời gian đã chọn."}
    </div>
  );
}
