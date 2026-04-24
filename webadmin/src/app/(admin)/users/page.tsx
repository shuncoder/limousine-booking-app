"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Select from "@/components/form/Select";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { listUsers, updateUserRole, User } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function UsersPage() {
  const [items, setItems] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listUsers(token);
      setItems(res.items || []);
    } catch (e: any) {
      setError(e?.msg || "Không tải được người dùng");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onChangeRole = async (id: string, role: string) => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      await updateUserRole(token, id, role);
      await load();
    } catch (e: any) {
      setError(e?.msg || "Cập nhật role thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Người dùng" />
      {error ? <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/40 dark:text-error-200">{error}</div> : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Email</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Tên</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">SĐT</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Role</TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">User ID</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {items.map((u) => (
                <TableRow key={u._id}>
                  <TableCell className="px-5 py-4 text-start text-theme-sm font-semibold text-gray-800 dark:text-white/90">{u.email}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{u.name || "-"}</TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">{u.phone || "-"}</TableCell>
                  <TableCell className="px-5 py-4 text-start">
                    <Select
                      options={[
                        { value: "user", label: "User" },
                        { value: "driver", label: "Driver" },
                        { value: "staff", label: "Staff" },
                        { value: "admin", label: "Admin" },
                      ]}
                      defaultValue={u.role}
                      onChange={(value) => onChangeRole(u._id, value)}
                    />
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-xs text-gray-500 dark:text-gray-400">{u._id}</TableCell>
                </TableRow>
              ))}

              {!items.length ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-theme-sm text-gray-500 dark:text-gray-400">{loading ? "Đang tải..." : "Chưa có user"}</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
