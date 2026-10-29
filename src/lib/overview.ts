import { mailConfigured } from "./email";
import { HORIZON, ROADMAP, participation, rollupPlans } from "./metrics";
import { daysLeftInMonth, seoulPeriod, seoulPeriodLabel, seoulStamp } from "./period";
import { readCompanies, readPlans, readQuestions, readSubmissions } from "./store";
import type { Overview, Question } from "./types";

export async function getOverview(): Promise<Overview> {
  const [companies, plans, questions, submissions] = await Promise.all([
    readCompanies(),
    readPlans(),
    readQuestions(),
    readSubmissions(),
  ]);
  const period = seoulPeriod();
  const rolled = rollupPlans(plans.items);
  const active = questions.items.filter((item) => item.active);
  return {
    period,
    periodLabel: seoulPeriodLabel(period),
    todayLabel: seoulStamp(),
    daysLeft: daysLeftInMonth(),
    mailConfigured: mailConfigured(),
    plansUpdatedAt: plans.updatedAt,
    questionsUpdatedAt: questions.updatedAt,
    scaleCount: active.filter((item) => item.type === "scale").length,
    textCount: active.filter((item) => item.type === "text").length,
    overall: rolled.overall,
    domains: rolled.domains,
    plans: plans.items,
    companies: participation(companies.items, submissions, period),
    monthSubmissionCount: submissions.filter((item) => item.period === period).length,
    roadmap: ROADMAP,
    horizon: HORIZON,
  };
}

export async function getActiveQuestions(): Promise<Question[]> {
  const questions = await readQuestions();
  return questions.items.filter((item) => item.active).sort((a, b) => a.order - b.order);
}
