import { z } from "zod";

import { emptySceneProps, hudBindProp } from "./monopolyCatalogShared";

/**
 * 모노폴리 **운영 UI** 카탈로그 조각 — json-render Registry 와 1:1.
 *
 * 타입 이름 결정(고정):
 * - MonopolyPlayRoot
 * - MonopolyHudChipRow
 * - MonopolyRollRow (AUTO 토글 + 플레이 + 배수 순환 — 롱프레스 없음)
 * - MonopolyDiceStageBlock
 * - MonopolyTimelineRail (데이터는 Context 의 스냅샷; Spec 은 props 빈 객체)
 * - MonopolyResultModalPanel
 */
export const monopolyCatalogOperationalUiComponents = {
  MonopolyPlayRoot: {
    props: emptySceneProps,
    slots: ["default"],
    description: "플레이 단위 최상위 — #game-screen 레이아웃.",
    example: {},
  },

  MonopolyHudChipRow: {
    props: z.object({
      diceLabel: hudBindProp.describe("{ $state: \"/hud/diceChip\" }"),
      stageLine: hudBindProp.describe("{ $state: \"/hud/stageLine\" }"),
      moneyLabel: hudBindProp.describe("{ $state: \"/hud/moneyChip\" }"),
    }),
    slots: [],
    description: "헤더 3칩 — dice / stage / money.",
    example: {
      diceLabel: "12",
      stageLine: "S1",
      moneyLabel: "3,000",
    },
  },

  MonopolyRollRow: {
    props: z.object({
      rollLabel: hudBindProp.describe("{ $state: \"/hud/rollBtnLabel\" }"),
      rollDisabled: hudBindProp.describe("{ $state: \"/hud/rollDisabled\" }"),
      rollTitle: hudBindProp.describe("{ $state: \"/hud/rollTitle\" }"),
    }),
    slots: [],
    description:
      "하단 3열: **AUTO**(플레이 바로 왼쪽) · **플레이(144px)·중앙** · **배수**(오른쪽).",
    example: { rollLabel: "▶", rollDisabled: false, rollTitle: "굴리기" },
  },

  MonopolyDiceStageBlock: {
    props: z.object({
      bodyText: hudBindProp.describe("{ $state: \"/hud/diceStageBody\" }"),
    }),
    slots: [],
    description: "중앙 주사위 — Three.js(`MonopolyDiceCanvas`). HUD 문구는 접근성 캡션.",
    example: { bodyText: "idle" },
  },

  MonopolyTimelineRail: {
    props: emptySceneProps,
    slots: [],
    description:
      "보드 타일 스트립 — **렌더는 MonopolyGameContext + 스냅샷 구독**. Spec props 는 비움.",
    example: {},
  },

  MonopolyResultModalPanel: {
    props: z.object({
      open: hudBindProp.describe("{ $state: \"/hud/modalOpen\" }"),
      title: hudBindProp.describe("{ $state: \"/hud/modalTitle\" }"),
      subtitle: hudBindProp.describe("{ $state: \"/hud/modalSubtitle\" }"),
      moneyLine: hudBindProp.describe("{ $state: \"/hud/modalMoneyLine\" }"),
      diceLine: hudBindProp.describe("{ $state: \"/hud/modalDiceLine\" }"),
    }),
    slots: [],
    description:
      "HUD 바로 아래 인플로우 패널 — 확인 버튼 없음 · 3초(오토 1초) 후 자동 monopolyAckModal · 플레이 버튼으로도 닫힘.",
    example: {
      open: true,
      title: "칸 이름",
      subtitle: "설명",
      moneyLine: "",
      diceLine: "",
    },
  },
};
