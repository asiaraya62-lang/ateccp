import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlanIndex } from "@/components/plan-index";
import { getCurrentUser } from "@/lib/auth";
import { getOverview } from "@/lib/overview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "실행 과제 · 에이텍그룹 공정거래 CP 데스크",
};

export default async function PlansPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const data = await getOverview();
  return <PlanIndex data={data} />;
}
