import { type ReactElement } from "react";

import { useMonopolyGame, useGameSnapshot } from "./MonopolyGameContext";
import { TEXT_COPY_IDS } from "./game/textCopyIds";

/**
 * 시즌 종료 모달을 닫은 뒤(`phase === ended` & `modal === null`) 안내 오버레이.
 * 미니게임 프로토타입: 확인 시 페이지 새로고침으로 재시작.
 */
export function SeasonEndOverlay(): ReactElement {
  const game = useMonopolyGame();
  const snap = useGameSnapshot();

  const visible = snap.phase === "ended" && snap.modal === null;
  const title = game.textLine(
    TEXT_COPY_IDS.modalSeasonEndTitle,
    {},
    "시즌 종료",
  );
  const farewell = game.textLine(
    TEXT_COPY_IDS.modalSeasonEndFarewell,
    {},
    "다음 시즌에 또 만나요",
  );
  const moneyLine = game.textLine(
    TEXT_COPY_IDS.modalEndMoneyShort,
    { money: snap.money.toLocaleString("ko-KR") },
    `💰 ${snap.money}`,
  );
  const diceLine = game.textLine(
    TEXT_COPY_IDS.modalEndDiceShort,
    { dice: snap.dice.toLocaleString("ko-KR") },
    `🎲 ${snap.dice}`,
  );
  const btn = game.textLine(TEXT_COPY_IDS.btnModalConfirm, {}, "확인");

  return (
    <div
      id="season-end-screen"
      className={visible ? "wire-open" : ""}
      aria-hidden={!visible}
      role="dialog"
      aria-labelledby="season-end-title"
    >
      {visible ? (
        <div className="wire-season-panel">
          <h2 id="season-end-title" style={{ margin: "0 0 8px", fontSize: 18 }}>
            {title}
          </h2>
          <p style={{ margin: "0 0 12px", color: "#555" }}>{farewell}</p>
          <p style={{ margin: "4px 0", fontSize: 13 }}>{moneyLine}</p>
          <p style={{ margin: "4px 0 16px", fontSize: 13 }}>{diceLine}</p>
          <button
            type="button"
            className="m-confirm-btn"
            onClick={() => {
              window.location.reload();
            }}
          >
            {btn}
          </button>
        </div>
      ) : null}
    </div>
  );
}
