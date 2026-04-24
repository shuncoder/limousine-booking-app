"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin, getMe } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function SignInForm() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // 🔥 gọi API với username
      const data = await adminLogin(username, password);

      // lưu token
      setToken(data.token);

      // lấy thông tin user
      const me = await getMe(data.token);

      // check quyền
      if (!me?.role || !["admin", "staff"].includes(me.role)) {
        throw { msg: "Bạn không có quyền truy cập" };
      }

      // chuyển trang
      router.replace("/");
    } catch (err: unknown) {
      const msg =
        typeof err === "object" && err !== null && "msg" in err
          ? String((err as { msg?: unknown }).msg || "")
          : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: unknown }).message || "")
          : "";

      setError(msg || "Đăng nhập thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Đăng Nhập Quản Trị Viên XeAdmin
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Đăng nhập bằng username để quản lý hệ thống
            </p>
          </div>

          <form onSubmit={onSubmit}>
            <div className="space-y-6">
              
              {/* USERNAME */}
              <div>
                <Label>
                  Username <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="admin123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* PASSWORD */}
              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/40 dark:text-error-200">
                  {error}
                </div>
              )}

              {/* BUTTON */}
              <div>
                <Button className="w-full" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}