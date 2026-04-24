"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { createPromo, deletePromo, listPromos, Promo, updatePromo } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function PromosPage() {
  const [items, setItems] = React.useState<Promo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    code: "",
    type: "percent",
    value: "10",
    active: true,
  });

  const load = React.useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listPromos(token);
      setItems(res.items || []);
    } catch (e: any) {
      setError(e?.msg || "Không tải được khuyến mãi");
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
      await createPromo(token, {
        code: form.code,
        type: form.type as any,
        value: Number(form.value || 0),
        active: form.active,
        startsAt: null,
        endsAt: null,
        maxUses: null,
      } as any);

      setForm({ code: "", type: "percent", value: "10", active: true });
      await load();
    } catch (e: any) {
      setError(e?.msg || "Tạo mã thất bại");
    } finally {
      setLoading(false);
    }
  };

  const onToggleActive = async (promo: Promo) => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      await updatePromo(token, promo._id, { active: !promo.active });
      await load();
    } catch (e: any) {
      setError(e?.msg || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (promoId: string) => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      await deletePromo(token, promoId);
      await load();
    } catch (e: any) {
      setError(e?.msg || "Xóa thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Khuyến mãi" />

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="text-base font-semibold text-gray-800 dark:text-white/90">Tạo mã giảm giá</div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <Label>Mã</Label>
            <Input placeholder="VD: GIAM10" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          </div>
          <div>
            <Label>Loại</Label>
            <Select
              options={[
                { value: "percent", label: "%" },
                { value: "fixed", label: "Số tiền" },
              ]}
              defaultValue={form.type}
              onChange={(value) => setForm((f) => ({ ...f, type: value }))}
            />
          </div>
          <div>
            <Label>Giá trị</Label>
            <Input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={onCreate} disabled={loading || !form.code}>Tạo mã</Button>
          {error ? <div className="text-sm text-error-600">{error}</div> : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Mã</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Loại</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Giá trị</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Đã dùng</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Trạng thái</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Hành động</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {items.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="px-5 py-4 text-start text-theme-sm font-semibold text-gray-800 dark:text-white/90">{p.code}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{p.type}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{p.value}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{p.usedCount ?? 0}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{p.active ? "Đang bật" : "Tắt"}</TableCell>
                  <TableCell className="px-5 py-4 text-start">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => onToggleActive(p)} disabled={loading}>
                        {p.active ? "Tắt" : "Bật"}
                      </Button>
                      <Button size="sm" onClick={() => onDelete(p._id)} disabled={loading}>
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {!items.length ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-theme-sm text-gray-500 dark:text-gray-400">
                    {loading ? "Đang tải..." : "Chưa có mã"}
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
