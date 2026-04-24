"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Label from "@/components/form/Label";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { adminListComplaints, Complaint, updateComplaint } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function ComplaintsPage() {
  const [items, setItems] = React.useState<Complaint[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [edit, setEdit] = React.useState<Record<string, { status: string; resolutionNote: string }>>({});

  const load = React.useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminListComplaints(token);
      setItems(res.items || []);
    } catch (e: any) {
      setError(e?.msg || "Không tải được khiếu nại");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onSave = async (id: string) => {
    const token = getToken();
    if (!token) return;

    const patch = edit[id];
    if (!patch) return;

    setLoading(true);
    setError(null);
    try {
      await updateComplaint(token, id, patch);
      await load();
    } catch (e: any) {
      setError(e?.msg || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Khiếu nại" />

      {error ? <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/40 dark:text-error-200">{error}</div> : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Tiêu đề</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Nội dung</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Trạng thái</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Ghi chú xử lý</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Hành động</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {items.map((c) => {
                const current = edit[c._id] || { status: c.status, resolutionNote: c.resolutionNote || "" };

                return (
                  <TableRow key={c._id}>
                    <TableCell className="px-5 py-4 text-start text-theme-sm font-semibold text-gray-800 dark:text-white/90">{c.subject}</TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{c.message}</TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <Label className="sr-only">Trạng thái</Label>
                      <Select
                        options={[
                          { value: "open", label: "Mới" },
                          { value: "in_progress", label: "Đang xử lý" },
                          { value: "resolved", label: "Đã xử lý" },
                          { value: "rejected", label: "Từ chối" },
                        ]}
                        defaultValue={current.status}
                        onChange={(value) => setEdit((m) => ({ ...m, [c._id]: { ...current, status: value } }))}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <Input
                        placeholder="Ghi chú..."
                        value={current.resolutionNote}
                        onChange={(e) => setEdit((m) => ({ ...m, [c._id]: { ...current, resolutionNote: e.target.value } }))}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <Button size="sm" onClick={() => onSave(c._id)} disabled={loading}>
                        Lưu
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {!items.length ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-theme-sm text-gray-500 dark:text-gray-400">{loading ? "Đang tải..." : "Chưa có khiếu nại"}</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
