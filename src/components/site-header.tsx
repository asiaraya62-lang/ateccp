"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import type { UserRole } from "@/lib/types";

const links = [
  { href: "/", label: "도입 현황", active: (path: string) => path === "/" },
  { href: "/plans", label: "실행 과제", active: (path: string) => path.startsWith("/plans") },
  { href: "/diagnosis", label: "본인 자가진단", active: (path: string) => path.startsWith("/diagnosis") },
  { href: "/audit", label: "감사팀", auditOnly: true, active: (path: string) => path.startsWith("/audit") },
];

export function SiteHeader({ user }: { user: { name: string; role: UserRole } | null }) {
  const path = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#d9d0c2] bg-[#f6f3ec]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={user ? "/" : "/login"} className="min-w-0">
          <p className="text-[11px] tracking-[0.18em] text-[#8a7044]">ATEC GROUP</p>
          <p className="text-sm font-semibold text-[#172233]">공정거래 CP 데스크</p>
        </Link>
        {user && path !== "/login" ? (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-[#667386]">{user.name}</p>
            <nav className="flex flex-wrap gap-1">
              {links
                .filter((link) => !link.auditOnly || user.role === "audit")
                .map((link) => {
                  const current = link.active(path);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm text-[#3d4a5c]",
                        current && "bg-[#17283a] text-white",
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
            </nav>
            <button type="button" onClick={logout} className="rounded-full px-3 py-1.5 text-sm text-[#3d4a5c]">
              나가기
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
