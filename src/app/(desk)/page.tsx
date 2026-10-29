import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { getCurrentUser } from "@/lib/auth";
import { getOverview } from "@/lib/overview";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!(await getCurrentUser())) redirect("/login");
  const data = await getOverview();
  return <Dashboard data={data} />;
}
