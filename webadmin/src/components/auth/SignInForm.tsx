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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const data = await adminLogin(email, password);
      setToken(data.token);
      const me = await getMe(data.token);
      if (me?.role !== "admin") {
        throw { msg: "Forbidden" };
      }
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
              Đăng nhập tài khoản quản trị viên ứng dụng đặt xe limousine
            </p>
          </div>
          <div>
            <form onSubmit={onSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    placeholder="admin@gmail.com"
                    type="email"
                    defaultValue={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    defaultValue={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error ? (
                  <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/40 dark:text-error-200">
                    {error}
                  </div>
                ) : null}
                <div>
                  <Button className="w-full" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
