import { promises as fs } from "fs";
import path from "path";
import type { Company, PlanItem, Question, StaffUser, Submission } from "./types";

const dataDir = path.join(process.cwd(), "data");

type Wrapped<T> = { updatedAt: string | null; items: T[] };

let chain: Promise<unknown> = Promise.resolve();

function withLock<T>(task: () => Promise<T>) {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readFile<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(dataDir, name), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function isReadOnlyStoreError(error: unknown) {
  const code = (error as NodeJS.ErrnoException)?.code;
  return code === "EROFS" || code === "EACCES" || code === "EPERM" || code === "ENOSPC";
}

async function writeFile(name: string, value: unknown) {
  await fs.mkdir(dataDir, { recursive: true });
  const file = path.join(dataDir, name);
  const temp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(temp, file);
}

export function readCompanies() {
  return readFile<Wrapped<Company>>("companies.json", { updatedAt: null, items: [] });
}

export function readPlans() {
  return readFile<Wrapped<PlanItem>>("plans.json", { updatedAt: null, items: [] });
}

export function readQuestions() {
  return readFile<Wrapped<Question>>("questions.json", { updatedAt: null, items: [] });
}

export function readSubmissions() {
  return readFile<Submission[]>("submissions.json", []);
}

export function readUsers() {
  return readFile<Wrapped<StaffUser>>("users.json", { updatedAt: null, items: [] });
}

export function updateUsers(change: (items: StaffUser[]) => StaffUser[] | Promise<StaffUser[]>) {
  return withLock(async () => {
    const current = await readFile<Wrapped<StaffUser>>("users.json", { updatedAt: null, items: [] });
    const items = await change(current.items);
    await writeFile("users.json", { updatedAt: new Date().toISOString(), items });
    return items;
  });
}

export function saveCompanies(items: Company[]) {
  return withLock(() =>
    writeFile("companies.json", { updatedAt: new Date().toISOString(), items }),
  );
}

export function savePlans(items: PlanItem[]) {
  return withLock(() => writeFile("plans.json", { updatedAt: new Date().toISOString(), items }));
}

export function saveQuestions(items: Question[]) {
  return withLock(() =>
    writeFile("questions.json", { updatedAt: new Date().toISOString(), items }),
  );
}

export function saveSubmissions(items: Submission[]) {
  return withLock(() => writeFile("submissions.json", items));
}

export function updateSubmissions(change: (items: Submission[]) => Submission[] | Promise<Submission[]>) {
  return withLock(async () => {
    const items = await readFile<Submission[]>("submissions.json", []);
    const next = await change(items);
    await writeFile("submissions.json", next);
    return next;
  });
}
