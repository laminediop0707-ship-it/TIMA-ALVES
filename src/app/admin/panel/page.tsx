import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/sessions";
import { AdminDashboard } from "./dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — Tableau de bord",
  robots: { index: false, follow: false },
};

export default async function AdminPanelPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin");

  return <AdminDashboard user={admin} />;
}
