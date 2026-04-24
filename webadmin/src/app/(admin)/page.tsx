import type { Metadata } from "next";
import React from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tổng quan | XeAdmin",
  description: "Trang tổng quan quản trị",
};

export default function Dashboard() {
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
      <div className="text-base font-semibold text-gray-800 dark:text-white/90">
        {title}
      </div>
      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{desc}</div>
    </Link>
  );
}
