import { requireUser } from "@/lib/auth";
import { getActiveQuestions } from "@/lib/overview";
import { readQuestions } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;
  const questions = await readQuestions();
  return Response.json({
    updatedAt: questions.updatedAt,
    items: await getActiveQuestions(),
  });
}
