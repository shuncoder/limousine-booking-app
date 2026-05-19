import type { Metadata } from "next";
import DashboardPageClient from "./DashboardPageClient";

export const metadata: Metadata = {
  title: "Tổng quan | XeAdmin",
  description: "Trang tổng quan quản trị",
};

export default function AdminDashboardPage() {
  return <DashboardPageClient />;
}
