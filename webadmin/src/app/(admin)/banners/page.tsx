"use client";

import React from "react";
import Image from "next/image";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { deleteBanner, listBanners, resolveAssetUrl, uploadBanner, type BannerItem } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function BannersPage() {
  const [items, setItems] = React.useState<BannerItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const load = React.useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await listBanners(token);
      setItems(Array.isArray(res.items) ? res.items : []);
    } catch (e: unknown) {
      const msg = typeof e === "object" && e && "msg" in e ? String((e as { msg?: unknown }).msg || "") : "Không tải được banner";
      setError(msg || "Không tải được banner");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onPickFile = () => {
    fileInputRef.current?.click();
  };

  const onUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const token = getToken();
    const file = e.target.files?.[0];
    if (!token || !file) return;

    setUploading(true);
    setError(null);
    try {
      await uploadBanner(token, file);
      await load();
    } catch (err: unknown) {
      const msg = typeof err === "object" && err && "msg" in err ? String((err as { msg?: unknown }).msg || "") : "Upload banner thất bại";
      setError(msg || "Upload banner thất bại");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const onDelete = async (bannerId: string) => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      await deleteBanner(token, bannerId);
      await load();
    } catch (e: unknown) {
      const msg = typeof e === "object" && e && "msg" in e ? String((e as { msg?: unknown }).msg || "") : "Xóa banner thất bại";
      setError(msg || "Xóa banner thất bại");
      setLoading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Banner" />

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-gray-800 dark:text-white/90">Quản lý banner</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Số lượng hiện tại: {items.length}</div>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
            <Button onClick={onPickFile} disabled={loading || uploading}>
              {uploading ? "Đang upload..." : "Thêm banner"}
            </Button>
          </div>
        </div>

        {error ? <div className="mt-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-950/40 dark:text-error-200">{error}</div> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item._id} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="relative h-44 w-full bg-gray-100 dark:bg-gray-900">
              <Image
                src={resolveAssetUrl(item.imageUrl)}
                alt="Banner"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(item.createdAt).toLocaleString("vi-VN")}</span>
              <Button size="sm" onClick={() => onDelete(item._id)} disabled={loading || uploading}>
                Xóa
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!loading && items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Chưa có banner nào. Hãy upload ảnh đầu tiên.
        </div>
      ) : null}
    </div>
  );
}
