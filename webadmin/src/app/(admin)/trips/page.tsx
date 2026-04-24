"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { createTrip, deleteTrip, listTrips, Trip } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function TripsPage() {
  const [items, setItems] = React.useState<Trip[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    routeFrom: "",
    routeTo: "",
    departureAt: "",
    vehicleName: "",
    basePrice: "",
    rowCount: "10",
    leftCount: "2",
    rightCount: "2",
  });

  const load = React.useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listTrips(token);
      setItems(res.items || []);
    } catch (e: any) {
      setError(e?.msg || "Không tải được danh sách chuyến");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onCreate = async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      await createTrip(token, {
        routeFrom: form.routeFrom,
        routeTo: form.routeTo,
        departureAt: new Date(form.departureAt).toISOString(),
        basePrice: Number(form.basePrice || 0),
        vehicleName: form.vehicleName || undefined,
        seatLayoutConfig: {
          rowCount: Number(form.rowCount || 10),
          leftCount: Number(form.leftCount || 2),
          rightCount: Number(form.rightCount || 2),
        },
      });

      setForm((f) => ({ ...f, routeFrom: "", routeTo: "", departureAt: "", vehicleName: "", basePrice: "" }));
      await load();
    } catch (e: any) {
      setError(e?.msg || "Tạo chuyến thất bại");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (tripId: string) => {
    const token = getToken();
    if (!token) return;

    const ok = window.confirm("Bạn có chắc chắn muốn xóa chuyến này?");
    if (!ok) return;

    setDeletingId(tripId);
    setError(null);
    try {
      await deleteTrip(token, tripId);
      await load();
    } catch (e: any) {
      setError(e?.msg || "Xóa chuyến thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Chuyến xe" />

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="text-base font-semibold text-gray-800 dark:text-white/90">Tạo chuyến mới</div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <Label>Điểm đi</Label>
            <Input placeholder="VD: TP.HCM" value={form.routeFrom} onChange={(e) => setForm((f) => ({ ...f, routeFrom: e.target.value }))} />
          </div>
          <div>
            <Label>Điểm đến</Label>
            <Input placeholder="VD: Vũng Tàu" value={form.routeTo} onChange={(e) => setForm((f) => ({ ...f, routeTo: e.target.value }))} />
          </div>
          <div>
            <Label>Giờ khởi hành</Label>
            <Input type="datetime-local" value={form.departureAt} onChange={(e) => setForm((f) => ({ ...f, departureAt: e.target.value }))} />
          </div>
          <div>
            <Label>Tên xe (tuỳ chọn)</Label>
            <Input placeholder="VD: Limousine 9 chỗ" value={form.vehicleName} onChange={(e) => setForm((f) => ({ ...f, vehicleName: e.target.value }))} />
          </div>
          <div>
            <Label>Giá cơ bản</Label>
            <Input type="number" placeholder="VD: 250000" value={form.basePrice} onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))} />
          </div>
          <div>
            <Label>Số hàng ghế</Label>
            <Input type="number" value={form.rowCount} onChange={(e) => setForm((f) => ({ ...f, rowCount: e.target.value }))} />
          </div>
          <div>
            <Label>Ghế bên trái</Label>
            <Input type="number" value={form.leftCount} onChange={(e) => setForm((f) => ({ ...f, leftCount: e.target.value }))} />
          </div>
          <div>
            <Label>Ghế bên phải</Label>
            <Input type="number" value={form.rightCount} onChange={(e) => setForm((f) => ({ ...f, rightCount: e.target.value }))} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={onCreate} disabled={loading || !form.routeFrom || !form.routeTo || !form.departureAt || !form.basePrice}>
            Tạo chuyến
          </Button>
          {error ? <div className="text-sm text-error-600">{error}</div> : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Tuyến</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Khởi hành</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Số ghế</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Giá</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Trip ID</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Thao tác</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {items.map((t) => (
                <TableRow key={t._id}>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                    {t.routeFrom} → {t.routeTo}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    {new Date(t.departureAt).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{t.totalSeats ?? "-"}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    {t.basePrice} {t.currency}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-xs text-gray-500 dark:text-gray-400">{t._id}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(t._id)}
                      disabled={loading || deletingId === t._id}
                      className="text-error-600 ring-error-200 hover:bg-error-50 dark:text-error-300 dark:ring-error-800 dark:hover:bg-error-950/30"
                    >
                      {deletingId === t._id ? "Đang xóa..." : "Xóa"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!items.length ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-theme-sm text-gray-500 dark:text-gray-400" isHeader={false}>
                    {loading ? "Đang tải..." : "Chưa có chuyến"}
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
