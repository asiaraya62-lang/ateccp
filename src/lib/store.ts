import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import type { Company, PlanItem, Question, ScheduleItem, StaffUser, Submission } from "./types";

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

function redisUrl() {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
}

function redisToken() {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
}

let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  const url = redisUrl();
  const token = redisToken();
  if (!url || !token) return null;
  if (!redisClient) redisClient = new Redis({ url, token });
  return redisClient;
}

const keyFor = (name: string) => `cp:${name}`;

async function readLocalFile<T>(name: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(dataDir, name), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// Redis when configured (Vercel); local data/*.json otherwise (local dev).
// On first read the Redis key is seeded from the bundled data/*.json file.
async function readFile<T>(name: string, fallback: T): Promise<T> {
  const redis = getRedis();
  if (!redis) return readLocalFile(name, fallback);
  const stored = await redis.get<T>(keyFor(name));
  if (stored !== null && stored !== undefined) return stored;
  const seed = await readLocalFile(name, fallback);
  await redis.set(keyFor(name), seed, { nx: true });
  const after = await redis.get<T>(keyFor(name));
  return after ?? seed;
}

export function isReadOnlyStoreError(error: unknown) {
  const code = (error as NodeJS.ErrnoException)?.code;
  return code === "EROFS" || code === "EACCES" || code === "EPERM" || code === "ENOSPC";
}

async function writeFile(name: string, value: unknown) {
  const redis = getRedis();
  if (redis) {
    await redis.set(keyFor(name), value);
    return;
  }
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

// 기준평가표 v2(정보교환 담합) 신규 문항: Redis에 없으면 기존 문항·편집 내용은 그대로 두고 추가만 한다.
const MIGRATED_QUESTION_IDS = ["s51", "s52", "s53", "s54", "s55", "s56"];
const MIGRATED_HINT_IDS = ["s09", "s10", "s14"];

export async function readQuestions() {
  const current = await readFile<Wrapped<Question>>("questions.json", { updatedAt: null, items: [] });
  if (!getRedis()) return current;
  const missing = MIGRATED_QUESTION_IDS.filter((id) => !current.items.some((item) => item.id === id));
  if (missing.length === 0) return current;
  return withLock(async () => {
    const latest = await readFile<Wrapped<Question>>("questions.json", { updatedAt: null, items: [] });
    const seed = await readLocalFile<Wrapped<Question>>("questions.json", { updatedAt: null, items: [] });
    const add = seed.items.filter(
      (item) => MIGRATED_QUESTION_IDS.includes(item.id) && !latest.items.some((existing) => existing.id === item.id),
    );
    if (add.length === 0) return latest;
    const items = latest.items.map((item) => {
      const fromSeed = seed.items.find((s) => s.id === item.id);
      return MIGRATED_HINT_IDS.includes(item.id) && !item.hint && fromSeed?.hint ? { ...item, hint: fromSeed.hint } : item;
    });
    const next = { updatedAt: new Date().toISOString(), items: [...items, ...add] };
    await writeFile("questions.json", next);
    return next;
  });
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

export function readSchedule() {
  return readFile<Wrapped<ScheduleItem>>("schedule.json", { updatedAt: null, items: [] });
}

export function updateSchedule(change: (items: ScheduleItem[]) => ScheduleItem[] | Promise<ScheduleItem[]>) {
  return withLock(async () => {
    const current = await readFile<Wrapped<ScheduleItem>>("schedule.json", { updatedAt: null, items: [] });
    const items = await change(current.items);
    await writeFile("schedule.json", { updatedAt: new Date().toISOString(), items });
    return items;
  });
}
