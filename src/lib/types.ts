export type UserRole = "employee" | "audit";

export type StaffUser = {
  id: string;
  employeeNo: string;
  name: string;
  email: string;
  companyId: string;
  department: string;
  role: UserRole;
  approved: boolean;
  readOnly?: boolean;
  passwordHash: string;
  createdAt: string;
};

export type PublicUser = Omit<StaffUser, "passwordHash">;

export type Company = {
  id: string;
  name: string;
  short: string;
  focus: string;
  headcount: number;
};

export type PlanItem = {
  id: string;
  domain: "C" | "D" | "O" | "E";
  code: string;
  title: string;
  detail: string;
  owner: string;
  current: number;
  targetYear: number;
  targetLong: number;
  weight: number;
};

export type QuestionType = "scale" | "text";

export type Question = {
  id: string;
  category: string;
  prompt: string;
  type: QuestionType;
  required: boolean;
  active: boolean;
  order: number;
  hint: string;
};

export type AnswerSnapshot = {
  questionId: string;
  prompt: string;
  type: QuestionType;
  value: string;
};

export type EmailStatus = "sent" | "queued" | "failed";

export type Submission = {
  id: string;
  submittedAt: string;
  period: string;
  reason: "monthly" | "audit";
  companyId: string;
  companyName: string;
  department: string;
  name: string;
  employeeNo: string;
  email: string;
  answers: AnswerSnapshot[];
  complaint: string;
  improvement: string;
  score: number | null;
  answeredScale: number;
  notApplicable: number;
  attention: { questionId: string; prompt: string; value: string }[];
  emailStatus: EmailStatus;
  emailDetail: string;
};

export type DomainStat = {
  id: string;
  roman: string;
  name: string;
  blurb: string;
  current: number;
  target: number;
  longTarget: number;
  itemCount: number;
};

export type CompanyStat = Company & {
  submitted: number;
  rate: number;
};

export type RoadmapItem = {
  year: string;
  title: string;
  detail: string;
  state: "now" | "next";
};

export type Overview = {
  period: string;
  periodLabel: string;
  todayLabel: string;
  daysLeft: number;
  mailConfigured: boolean;
  plansUpdatedAt: string | null;
  questionsUpdatedAt: string | null;
  scaleCount: number;
  textCount: number;
  overall: { current: number; target: number; longTarget: number };
  domains: DomainStat[];
  plans: PlanItem[];
  companies: CompanyStat[];
  monthSubmissionCount: number;
  roadmap: RoadmapItem[];
  horizon: { near: string; long: string };
};
