import { redirect } from "next/navigation";
import { ScheduleBoard } from "@/components/schedule-board";
import { getCurrentUser, isReadOnlyUser } from "@/lib/auth";
import { sortSchedule } from "@/lib/schedule";
import { readSchedule } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await readSchedule();
  return <ScheduleBoard initial={sortSchedule(data.items)} canEdit={user.role === "audit" && !isReadOnlyUser(user)} />;
}
