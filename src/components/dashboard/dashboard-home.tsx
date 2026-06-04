"use client";

import { QuickActionsHero } from "@/components/dashboard/quick-actions-hero";
import { DocumentsTimeline } from "@/components/dashboard/documents-timeline";
import { FirstDocumentOnboarding } from "@/components/dashboard/first-document-onboarding";
import { MonthlyActivity } from "@/components/dashboard/monthly-activity";
import { SubscriptionCompact } from "@/components/dashboard/subscription-compact";
import { AnnouncementBanners } from "@/components/dashboard/announcement-banners";
import { SubscriptionAlert } from "@/components/dashboard/subscription-alert";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { DashboardStats } from "@/lib/types";

interface DashboardHomeProps {
  stats: DashboardStats;
  loadError?: boolean;
}

function hasAnyDocuments(stats: DashboardStats): boolean {
  return (
    stats.recentDocuments.length > 0 ||
    stats.totalReceipts > 0 ||
    stats.totalPayments > 0 ||
    stats.totalInvoices > 0
  );
}

export function DashboardHome({ stats, loadError = false }: DashboardHomeProps) {
  const showTimeline = hasAnyDocuments(stats);

  if (loadError) {
    return (
      <main className="flex-1 space-y-8 bg-muted/20 p-4 lg:p-8">
        <EmptyState
          title="Unable to load dashboard"
          description="Could not load tenant dashboard data from Supabase. Please refresh and try again."
          variant="documents"
          actionLabel="Refresh"
          actionHref="/dashboard"
        />
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-8 bg-muted/20 p-4 lg:p-8">
      <AnnouncementBanners />
      <SubscriptionAlert />

      <QuickActionsHero />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {showTimeline ? (
            <DocumentsTimeline documents={stats.recentDocuments} />
          ) : (
            <FirstDocumentOnboarding />
          )}
        </div>

        <aside className="space-y-6">
          <MonthlyActivity compact data={stats.monthlyActivity} />
          <SubscriptionCompact />
        </aside>
      </div>
    </main>
  );
}
