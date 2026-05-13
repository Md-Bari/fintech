import React from "react";
import DashboardLayout from "@/components/shared/DashboardLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="PLATFORM_ADMIN">{children}</DashboardLayout>;
}
