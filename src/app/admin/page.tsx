import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/sessions";
import { AdminLogin } from "./login";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const admin = await getAdminSession();
  if (admin) redirect("/admin/panel");

  // The admin username is intentionally not hard-coded or pre-filled: the
  // credential lives only in the environment, never in the shipped HTML.
  return <AdminLogin />;
}
