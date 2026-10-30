"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };
const CHIPS = ["자가진단 어떻게 해요?", "지금 시급한 과제는?", "등급 획득하려면?", "해당 업무 없음은 언제 골라요?", "CP가 뭐예요?"];

export function CpChatbot({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `안녕하세요 ${name}님, CP 도우미예요. 자가진단 질문이나 과제 진척·등급에 대해 물어보세요.` },
  ]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(1) }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.answer ?? data.error ?? "답변을 가져오지 못했어요." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[min(560px,75vh)] w-[min(380px,92vw)] flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
            <div>
              <div className="font-semibold">CP 도우미</div>
              <div className="text-xs text-slate-300">자가진단 안내 · 진척 신호 · 등급 가이드</div>
            </div>
            <button aria-label="닫기" onClick={() => setOpen(false)}><X className="size-5" /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 leading-relaxed ${m.role === "user" ? "bg-slate-900 text-white" : "border bg-white text-slate-800"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {busy && <div className="text-xs text-slate-500">답변을 작성하고 있어요…</div>}
            <div ref={end} />
          </div>
          <div className="flex flex-wrap gap-1.5 border-t bg-white px-3 pt-2">
            {CHIPS.map((c) => (
              <button key={c} onClick={() => ask(c)} disabled={busy} className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-50">{c}</button>
            ))}
          </div>
          <form className="flex gap-2 bg-white p-3" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder="궁금한 점을 입력하세요" className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-500" />
            <button type="submit" disabled={busy || !input.trim()} aria-label="보내기" className="rounded-lg bg-slate-900 px-3 text-white disabled:opacity-40"><Send className="size-4" /></button>
          </form>
        </div>
      )}
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl hover:bg-slate-800">
        <MessageCircle className="size-5" /> CP 도우미
      </button>
    </div>
  );
}
