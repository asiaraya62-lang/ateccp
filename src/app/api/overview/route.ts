import { requireUser } from "@/lib/auth";
import { getOverview } from "@/lib/overview";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;
  return Response.json(await getOverview());
}
