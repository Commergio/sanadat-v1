import { redirect } from "@/i18n/navigation";

export default async function AdminNotificationsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/admin/messages", locale });
}
