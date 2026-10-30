import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { getCurrentUser } from "@/lib/auth";
import { getOverview } from "@/lib/overview";
import { upcoming } from "@/lib/schedule";
import { readSchedule } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!(await getCurrentUser())) redirect("/login");
  const [data, schedule] = await Promise.all([getOverview(), readSchedule()]);
  return <Dashboard data={data} upcoming={upcoming(schedule.items, 4)} />;
}
