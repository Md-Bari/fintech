import React from "react";
import DashboardLayout from "@/components/shared/DashboardLayout";

export default function EntrepreneurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="ENTREPRENEUR">{children}</DashboardLayout>;
}
