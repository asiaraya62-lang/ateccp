import { requireAudit, requireAuditWrite } from "@/lib/auth";
import { readSubmissions } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAudit();
  if (denied) return denied;
  const items = await readSubmissions();
  return Response.json({ items: [...items].reverse() });
}
