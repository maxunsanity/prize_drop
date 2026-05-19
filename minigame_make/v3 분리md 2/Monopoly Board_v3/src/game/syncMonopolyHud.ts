import type { MonopolyGame } from "./MonopolyGame";
import { PHASE_TO_TEXT_ID, TEXT_COPY_IDS } from "./textCopyIds";
import { hudExternalStore } from "./hudExternalStore";

function diceStageText(game: MonopolyGame): string {
  const s = game.getSnapshot();
  const phaseWord = game.textLine(
    PHASE_TO_TEXT_ID[s.phase],
    {},
    s.phase,
  );
  if (s.phase === "ended") {
    return phaseWord;
  }
  if (s.phase === "idle" && s.roll === 0) {
    const idle = game.textLine(TEXT_COPY_IDS.hudDiceStageIdle, {}, "idle");
    return `${phaseWord} · ${idle}`;
  }
  if (s.roll > 0) {
    return `${phaseWord} — ${s.d1} · ${s.d2} = ${s.roll}`;
  }
  return `${phaseWord} — ${s.d1} · ${s.d2}`;
}

function pushFromGame(game: MonopolyGame): void {
  const s = game.getSnapshot();
  const modalOpen =
    s.modal != null &&
    (s.phase === "result" ||
      s.phase === "ended" ||
      (s.phase === "idle" && s.modal.kind === "notice"));

  const jailSuffix =
    s.jail_attempts > 0
      ? game.textLine(
          TEXT_COPY_IDS.hudStageJailSuffix,
          { n: s.jail_attempts },
          ` · 감옥 ${s.jail_attempts}`,
        )
      : "";
  const stageLine = game.textLine(
    TEXT_COPY_IDS.hudStageLine,
    { stage: s.stage_id, suffix: jailSuffix },
    `S${s.stage_id}${jailSuffix}`,
  );

  hudExternalStore.update({
    "/hud/diceChip": s.dice.toLocaleString("ko-KR"),
    "/hud/stageLine": stageLine,
    "/hud/moneyChip": s.money.toLocaleString("ko-KR"),
    "/hud/diceStageBody": diceStageText(game),
    "/hud/rollBtnLabel": s.jail_attempts > 0
      ? game.textLine(TEXT_COPY_IDS.hudRollJail, {}, "탈출")
      : game.textLine(TEXT_COPY_IDS.hudRollIdle, {}, "▶"),
    "/hud/rollDisabled":
      s.phase === "rolling" ||
      s.phase === "moving" ||
      (s.phase === "ended" && s.modal == null) ||
      (s.phase === "idle" &&
        s.dice < s.dice_cost &&
        s.modal?.kind !== "notice"),
    "/hud/rollTitle":
      s.jail_attempts > 0
        ? game.textLine(TEXT_COPY_IDS.hudRollTitleJail, {}, "탈출 시도")
        : game.textLine(TEXT_COPY_IDS.hudRollTitleIdle, {}, "굴리기"),
    "/hud/modalOpen": modalOpen,
    "/hud/modalTitle": s.modal?.title ?? "",
    "/hud/modalSubtitle": s.modal?.subtitle ?? "",
    "/hud/modalMoneyLine": s.modal?.moneyLine ?? "",
    "/hud/modalDiceLine": s.modal?.diceLine ?? "",
  });
}

/** 구독 해제 함수 반환 — 마운트 시 한 번 호출하면 된다. */
export function attachMonopolyHudSync(game: MonopolyGame): () => void {
  pushFromGame(game);
  return game.subscribe(() => pushFromGame(game));
}
