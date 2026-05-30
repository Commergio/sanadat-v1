"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { useDashboardGreeting } from "@/components/dashboard/dashboard-welcome";

export function DashboardPageHeader() {
  const { title, description } = useDashboardGreeting();
  return <DashboardHeader title={title} description={description} />;
}
