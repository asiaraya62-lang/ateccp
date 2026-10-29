import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xs tracking-wide text-[#8a7044]">404</p>
      <h1 className="mt-2 text-2xl font-semibold">페이지를 찾지 못했습니다</h1>
      <p className="mt-3 text-sm leading-7 text-[#5c6b7c]">
        주소가 바뀌었거나, 요청한 실행 과제가 없습니다.
      </p>
      <p className="mt-6 flex gap-4 text-sm">
        <Link href="/plans" className="text-[#1d3b57] underline underline-offset-4">
          실행 과제 목록
        </Link>
        <Link href="/" className="text-[#1d3b57] underline underline-offset-4">
          도입 현황
        </Link>
      </p>
    </div>
  );
}
