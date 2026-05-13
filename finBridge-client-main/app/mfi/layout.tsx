import React from "react";
import DashboardLayout from "@/components/shared/DashboardLayout";

export default function MFILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="MFI_ADMIN">{children}</DashboardLayout>;
}
