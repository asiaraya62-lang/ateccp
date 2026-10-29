import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Megaphone,
  Scale,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

export type BookletRequirement = {
  no: string;
  title: string;
  icon: LucideIcon;
  points: string[];
  planIds: string[];
};

export const BOOKLET_SOURCE = "공정거래 자율준수프로그램 도입·운영 매뉴얼";

export const BOOKLET_REQUIREMENTS: BookletRequirement[] = [
  {
    no: "01",
    title: "CP기준과 절차 마련·시행",
    icon: ScrollText,
    points: [
      "임직원이 업무별 공정거래 준수사항을 알고 실천하도록 기준과 절차를 만들어 시행한다.",
      "대표이사 또는 이사회 승인을 거쳐 소속 임직원에게 공표한다.",
      "관리자와 주관부서, 임직원 역할, 편람, 운영 실태, 교육, 위반 제재를 규정에 넣는다.",
    ],
    planIds: ["p3"],
  },
  {
    no: "02",
    title: "최고경영자의 의지와 지원",
    icon: Megaphone,
    points: [
      "준수 의지와 방침을 임직원, 고객, 협력사에게 공개적으로 표명한다.",
      "선포는 한 번으로 끝내지 않고 행사, 공지, 간담회로 반복한다.",
      "운영 인력과 예산을 지원하고 성과를 관리한다.",
    ],
    planIds: ["p1", "p2", "p5"],
  },
  {
    no: "03",
    title: "자율준수관리자 임명",
    icon: BadgeCheck,
    points: [
      "이사회 등 최고 의사결정기구가 자율준수관리자를 임명한다.",
      "효과적인 CP 운영에 대한 책임을 부여한다.",
      "구매, 영업, 계약처럼 이해가 겹치는 부서의 임원은 겸직하지 않는다.",
    ],
    planIds: ["p4"],
  },
  {
    no: "04",
    title: "자율준수편람 제작·활용",
    icon: BookOpen,
    points: [
      "자율준수관리자 책임으로 법규와 CP 기준, 절차를 담아 작성한다.",
      "모든 임직원이 쉽게 보는 문서 또는 전자파일로 둔다.",
      "법규와 정책이 바뀌면 편람도 계속 고친다.",
    ],
    planIds: ["p6"],
  },
  {
    no: "05",
    title: "자율준수 교육",
    icon: GraduationCap,
    points: [
      "최고경영자와 구매, 판매 등 위반 가능성이 높은 직무에 정기 교육을 한다.",
      "기준, 절차, 법규 준수사항을 교육 내용에 넣는다.",
      "중소기업에는 권장이고, 그 밖의 기업에는 도입 요건이다.",
    ],
    planIds: ["p7", "p8"],
  },
  {
    no: "06",
    title: "내부감시체계",
    icon: ShieldCheck,
    points: [
      "위법행위의 예방과 조기 발견을 위해 감시와 감사를 계획해 운영한다.",
      "결과는 최소 연 2회 이사회 등 최고 의사결정기구에 보고한다.",
      "사전업무협의, 위험평가, 내부고발을 감시 체계에 포함한다.",
    ],
    planIds: ["p9", "p10", "p11", "p14"],
  },
  {
    no: "07",
    title: "위반 임직원 제재",
    icon: Scale,
    points: [
      "위반 정도에 맞는 제재조치를 사규로 마련해 운용한다.",
      "위반을 발견하면 대응하고, 같은 행위가 반복되지 않게 막는다.",
      "우수 임직원 포상은 매뉴얼의 권장 사항이다.",
    ],
    planIds: ["p12"],
  },
  {
    no: "08",
    title: "효과성 평가와 개선",
    icon: ClipboardCheck,
    points: [
      "CP 기준, 절차, 운용을 정기적으로 점검하고 평가한다.",
      "평가 결과에 따라 개선조치를 한다.",
    ],
    planIds: ["p13", "p15"],
  },
];

export function bookletRequirementFor(planId: string) {
  return BOOKLET_REQUIREMENTS.find((item) => item.planIds.includes(planId));
}
