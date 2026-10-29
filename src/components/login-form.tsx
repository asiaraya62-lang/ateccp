"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Company } from "@/lib/types";

const fieldClass = "mt-1.5 h-11 bg-white";

export function LoginForm({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "request">("login");
  const [employeeNo, setEmployeeNo] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setError("");
    setDone("");
    setPending(true);
    try {
      const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login"
            ? { employeeNo, password }
            : { employeeNo, password, name, email, companyId, department },
        ),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "요청을 처리하지 못했습니다.");
      if (mode === "login") {
        router.replace("/");
        router.refresh();
        return;
      }
      setDone("신청을 받았습니다. 감사팀이 승인한 뒤에 로그인할 수 있습니다.");
      setMode("login");
      setPassword("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "요청을 처리하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs tracking-wide text-[#8a7044]">ATEC GROUP</p>
      <h1 className="mt-2 text-3xl font-semibold">공정거래 CP 데스크</h1>
      <p className="mt-2 text-sm leading-6 text-[#4d5b6c]">
        승인된 직원만 들어갑니다. 로그인하면 도입 현황이 열립니다.
      </p>
      <div className="mt-6 flex gap-2">
        {(
          [
            ["login", "로그인"],
            ["request", "접속 신청"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`rounded-full px-3 py-1.5 text-sm ${mode === value ? "bg-[#17283a] text-white" : "text-[#3d4a5c]"}`}
            onClick={() => {
              setMode(value);
              setError("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <form
        className="mt-4 rounded-2xl border border-[#e4ddd2] bg-white p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {mode === "request" ? (
          <>
            <Label htmlFor="name">이름</Label>
            <Input id="name" className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} />
            <Label htmlFor="email" className="mt-4">
              이메일
            </Label>
            <Input id="email" type="email" className={fieldClass} value={email} onChange={(event) => setEmail(event.target.value)} />
            <Label htmlFor="company" className="mt-4">
              회사
            </Label>
            <select
              id="company"
              className="mt-1.5 h-11 w-full rounded-lg border border-input bg-white px-3 text-sm"
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <Label htmlFor="department" className="mt-4">
              부서
            </Label>
            <Input id="department" className={fieldClass} value={department} onChange={(event) => setDepartment(event.target.value)} />
          </>
        ) : null}
        <Label htmlFor="employeeNo" className={mode === "request" ? "mt-4" : undefined}>
          사번
        </Label>
        <Input id="employeeNo" className={fieldClass} value={employeeNo} onChange={(event) => setEmployeeNo(event.target.value)} autoComplete="username" />
        <Label htmlFor="password" className="mt-4">
          비밀번호
        </Label>
        <Input
          id="password"
          type="password"
          className={fieldClass}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        {error ? <p className="mt-3 text-sm text-[#8d3b32]">{error}</p> : null}
        {done ? <p className="mt-3 text-sm text-[#1d3b57]">{done}</p> : null}
        <Button className="mt-5 h-11 px-5" type="submit" disabled={pending}>
          {mode === "login" ? "들어가기" : "승인 요청"}
        </Button>
      </form>
    </div>
  );
}
