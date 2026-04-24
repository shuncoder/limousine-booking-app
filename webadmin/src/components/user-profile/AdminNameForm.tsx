"use client";

import React from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { getToken } from "@/lib/auth";
import { getMe, updateAdminProfile } from "@/lib/api";

export default function AdminNameForm() {
  const [username, setUsername] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  React.useEffect(() => {
    const run = async () => {
      const token = getToken();
      if (!token) {
        setError("Phiên đăng nhập đã hết hạn");
        setLoading(false);
        return;
      }

      try {
        const me = await getMe(token);
        setUsername(String(me?.username || ""));
        setFullName(String(me?.name || "").trim());
      } catch (e: unknown) {
        const msg = typeof e === "object" && e && "msg" in e ? String((e as { msg?: unknown }).msg || "") : "";
        setError(msg || "Không tải được thông tin admin");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const onSave = async () => {
    const token = getToken();
    if (!token) {
      setError("Phiên đăng nhập đã hết hạn");
      return;
    }

    const cleanName = fullName.trim();
    if (!cleanName) {
      setError("Họ và tên không được để trống");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await updateAdminProfile(token, { name: cleanName });
      const savedName = String(res.user?.name || cleanName).trim();
      setFullName(savedName);
      setSuccess("Cập nhật họ tên thành công");
    } catch (e: unknown) {
      const msg = typeof e === "object" && e && "msg" in e ? String((e as { msg?: unknown }).msg || "") : "";
      setError(msg || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">Thông tin admin</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Username (bảng User)</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" disabled />
        </div>
        <div>
          <Label>Họ và tên (bảng AdminProfile)</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nhập họ và tên" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={onSave} disabled={loading || saving}>
          {saving ? "Đang lưu..." : "Lưu hồ sơ"}
        </Button>
        {loading ? <div className="text-sm text-gray-500 dark:text-gray-400">Đang tải...</div> : null}
        {error ? <div className="text-sm text-error-600">{error}</div> : null}
        {success ? <div className="text-sm text-success-600">{success}</div> : null}
      </div>
    </div>
  );
}
