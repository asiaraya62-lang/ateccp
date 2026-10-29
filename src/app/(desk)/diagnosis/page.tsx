import { DiagnosisForm } from "@/components/diagnosis-form";
import { MySubmissions } from "@/components/my-submissions";
import { getCurrentUser } from "@/lib/auth";
import { getActiveQuestions, getOverview } from "@/lib/overview";
import { readSubmissions } from "@/lib/store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DiagnosisPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [overview, questions, submissions] = await Promise.all([
    getOverview(),
    getActiveQuestions(),
    readSubmissions(),
  ]);
  const mine = submissions
    .filter(
      (item) => item.companyId === user.companyId && item.employeeNo.toLowerCase() === user.employeeNo.toLowerCase(),
    )
    .reverse();
  return (
    <>
      <MySubmissions items={mine} />
      <DiagnosisForm
        account={user}
        companies={overview.companies}
        questions={questions}
        periodLabel={overview.periodLabel}
      />
    </>
  );
}
