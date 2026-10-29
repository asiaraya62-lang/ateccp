import { redirect } from "next/navigation";
import { AuditConsole } from "@/components/audit-console";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "audit") redirect("/");
  return <AuditConsole />;
}
