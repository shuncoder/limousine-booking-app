"use client";

import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  demoteDriver,
  Driver,
  listDrivers,
  listUsersFiltered,
  promoteUserToDriver,
  User,
} from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function DriversPage() {
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const [promoteOpen, setPromoteOpen] = React.useState(false);
  const [promoteSearch, setPromoteSearch] = React.useState("");
  const [promoteCandidates, setPromoteCandidates] = React.useState<User[]>([]);
  const [promoteLoading, setPromoteLoading] = React.useState(false);
  const [promoteError, setPromoteError] = React.useState<string | null>(null);
  const [promotingId, setPromotingId] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (q?: string) => {
      const token = getToken();
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await listDrivers(token, q);
        setDrivers(res.items || []);
      } catch (e) {
        const msg = (e as { msg?: string })?.msg || "Không tải được danh sách tài xế";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    load();
  }, [load]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search.trim() || undefined);
  };

  const openPromote = async () => {
    setPromoteOpen(true);
    setPromoteSearch("");
    setPromoteError(null);
    await loadCandidates("");
  };

  const closePromote = () => {
    setPromoteOpen(false);
    setPromoteCandidates([]);
    setPromoteSearch("");
    setPromoteError(null);
  };

  const loadCandidates = async (q: string) => {
    const token = getToken();
    if (!token) return;
    setPromoteLoading(true);
    setPromoteError(null);
    try {
      const res = await listUsersFiltered(token, { role: "user", q: q || undefined });
      setPromoteCandidates(res.items || []);
    } catch (e) {
      const msg = (e as { msg?: string })?.msg || "Không tải được danh sách người dùng";
      setPromoteError(msg);
    } finally {
      setPromoteLoading(false);
    }
  };

  const handlePromote = async (userId: string) => {
    const token = getToken();
    if (!token) return;
    setPromotingId(userId);
    setPromoteError(null);
    try {
      await promoteUserToDriver(token, userId);
      await load();
      closePromote();
    } catch (e) {
      const msg = (e as { msg?: string })?.msg || "Thăng cấp tài xế thất bại";
      setPromoteError(msg);
    } finally {
      setPromotingId(null);
    }
  };

  const handleDemote = async (driver: Driver) => {
    const token = getToken();
    if (!token) return;
    const ok = window.confirm(
      `Gỡ vai trò tài xế của ${driver.name || driver.email}? Người dùng sẽ trở lại role "user".`
    );
    if (!ok) return;

    setLoading(true);
    setError(null);
    try {
      await demoteDriver(token, driver._id);
      await load();
    } catch (e) {
      const msg = (e as { msg?: string })?.msg || "Gỡ tài xế thất bại";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Tài xế" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={onSearch} className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button size="sm" variant="outline" onClick={() => load(search.trim() || undefined)}>
            Tìm
          </Button>
        </form>
        <Button onClick={openPromote}>+ Thêm tài xế</Button>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/40 dark:text-error-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Tài xế
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Email
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  SĐT
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Driver ID
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Ngày tạo
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {drivers.map((d) => (
                <TableRow key={d._id}>
                  <TableCell className="px-5 py-4 text-start">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                        {(d.name || d.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">
                          {d.name || "(Chưa đặt tên)"}
                        </div>
                        <div className="text-theme-xs text-gray-500 dark:text-gray-400">
                          Driver
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    {d.email}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                    {d.phone || "-"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-xs text-gray-500 dark:text-gray-400">
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-white/[0.06]">
                      {d._id}
                    </code>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start text-theme-xs text-gray-500 dark:text-gray-400">
                    {d.createdAt ? new Date(d.createdAt).toLocaleString("vi-VN") : "-"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-start">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDemote(d)}
                      className="text-error-600 ring-error-200 hover:bg-error-50 dark:text-error-300 dark:ring-error-800 dark:hover:bg-error-950/30"
                    >
                      Gỡ tài xế
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!drivers.length ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-theme-sm text-gray-500 dark:text-gray-400">
                    {loading ? "Đang tải..." : "Chưa có tài xế nào."}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={promoteOpen} onClose={closePromote} className="max-w-[640px] m-4">
        <div className="p-6 lg:p-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Chọn người dùng để thăng cấp tài xế
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Người dùng được chọn sẽ chuyển sang role <code>driver</code> và có thể nhận chuyến.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <Input
              placeholder="Tìm theo email, tên, số điện thoại..."
              value={promoteSearch}
              onChange={(e) => setPromoteSearch(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadCandidates(promoteSearch.trim())}
              disabled={promoteLoading}
            >
              Tìm
            </Button>
          </div>

          {promoteError ? (
            <div className="mt-3 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/40 dark:text-error-200">
              {promoteError}
            </div>
          ) : null}

          <div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {promoteLoading ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Đang tải...</div>
            ) : promoteCandidates.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Không tìm thấy người dùng phù hợp.
              </div>
            ) : (
              promoteCandidates.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-white/[0.06] dark:bg-white/[0.02]"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {u.name || "(Chưa đặt tên)"} <span className="text-xs font-normal text-gray-500">• {u.email}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      SĐT: {u.phone || "-"} • Role hiện tại: {u.role}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handlePromote(u._id)}
                    disabled={promotingId === u._id || u.role === "admin"}
                  >
                    {promotingId === u._id ? "Đang xử lý..." : "Thăng cấp"}
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button size="sm" variant="outline" onClick={closePromote}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
