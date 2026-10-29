import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PlanDetail } from "@/components/plan-detail";
import { getCurrentUser } from "@/lib/auth";
import { getOverview } from "@/lib/overview";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  if (!(await getCurrentUser())) return { title: "실행 과제 · 에이텍그룹 공정거래 CP 데스크" };
  const { id } = await params;
  const data = await getOverview();
  const plan = data.plans.find((item) => item.id === id);
  if (!plan) return { title: "실행 과제 · 에이텍그룹 공정거래 CP 데스크" };
  return { title: `${plan.code} ${plan.title} · 에이텍그룹 공정거래 CP 데스크` };
}

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) redirect("/login");
  const { id } = await params;
  const data = await getOverview();
  const plan = data.plans.find((item) => item.id === id);
  if (!plan) notFound();
  return <PlanDetail data={data} plan={plan} />;
}
