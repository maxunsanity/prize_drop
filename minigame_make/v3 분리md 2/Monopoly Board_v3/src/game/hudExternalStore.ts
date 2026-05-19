import { createStateStore } from "@json-render/core";

/**
 * json-render Spec 의 `{ $state: "/hud/…" }` 와 1:1 — `syncMonopolyHud` 가 스냅샷에서 갱신한다.
 */
export const hudExternalStore = createStateStore({
  hud: {
    diceChip: "0",
    stageLine: "S1",
    moneyChip: "0",
    diceStageBody: "idle",
    rollBtnLabel: "▶",
    rollDisabled: false,
    rollTitle: "굴리기",
    modalOpen: false,
    modalTitle: "",
    modalSubtitle: "",
    modalMoneyLine: "",
    modalDiceLine: "",
  },
});
