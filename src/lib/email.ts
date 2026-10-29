import nodemailer from "nodemailer";
import { scaleLabel } from "./scale";
import { seoulPeriodLabel, seoulStamp } from "./period";
import type { Submission } from "./types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function block(title: string, body: string) {
  return `${title}\n${body.trim() || "없음"}\n`;
}

export function renderSubmission(submission: Submission) {
  const reason = submission.reason === "monthly" ? "월례 정기" : "감사팀 요청";
  const lines = [
    "에이텍그룹 공정거래 CP 본인 자가진단이 제출되었습니다.",
    "",
    `접수번호: ${submission.id}`,
    `제출시각: ${seoulStamp(new Date(submission.submittedAt))} (서울)`,
    `대상기간: ${seoulPeriodLabel(submission.period)}`,
    `구분: ${reason}`,
    `회사: ${submission.companyName}`,
    `부서: ${submission.department}`,
    `이름: ${submission.name}`,
    `사번: ${submission.employeeNo}`,
    `이메일: ${submission.email}`,
    `준수 점수: ${submission.score === null ? "산출 없음" : `${submission.score}점`}`,
    `응답 객관식: ${submission.answeredScale}문항 / 해당 없음: ${submission.notApplicable}문항`,
    "",
    block(
      "[주의 문항]",
      submission.attention.length
        ? submission.attention
            .map((item) => `- ${item.prompt} → ${scaleLabel(item.value)}`)
            .join("\n")
        : "없음",
    ),
    block(
      "[주관식]",
      submission.answers
        .filter((answer) => answer.type === "text")
        .map((answer) => `- ${answer.prompt}\n  ${answer.value}`)
        .join("\n"),
    ),
    block("[불만 사항]", submission.complaint),
    block("[개선 사항]", submission.improvement),
    "",
    "[객관식 전체]",
    ...submission.answers
      .filter((answer) => answer.type === "scale")
      .map((answer) => `- ${answer.prompt} → ${scaleLabel(answer.value)}`),
  ];
  const text = lines.join("\n");
  const html = `<pre style="font-family:Pretendard,sans-serif;white-space:pre-wrap;line-height:1.55">${escapeHtml(text)}</pre>`;
  const subject = `[CP 자가진단] ${submission.companyName} ${submission.name} ${seoulPeriodLabel(submission.period)} ${reason}`;
  return { subject, text, html };
}

export function mailConfigured() {
  const to = process.env.CP_MAIL_TO;
  const from = process.env.CP_MAIL_FROM;
  if (!to || !from) return false;
  if (process.env.RESEND_API_KEY) return true;
  return Boolean(process.env.SMTP_HOST);
}

export async function sendSubmission(submission: Submission) {
  const to = process.env.CP_MAIL_TO;
  const from = process.env.CP_MAIL_FROM;
  const message = renderSubmission(submission);
  if (!to || !from || !mailConfigured()) {
    return {
      emailStatus: "queued" as const,
      emailDetail: "메일 서버가 아직 연결되지 않아 감사팀 수신함에 보관했습니다.",
    };
  }

  try {
    if (process.env.RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: message.subject,
          text: message.text,
          html: message.html,
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail.slice(0, 300));
      }
    } else {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      await transporter.sendMail({
        from,
        to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
    }
    return { emailStatus: "sent" as const, emailDetail: `${to} 로 발송했습니다.` };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "메일 발송에 실패했습니다.";
    return { emailStatus: "failed" as const, emailDetail: detail };
  }
}
