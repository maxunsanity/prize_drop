import type { Spec, ActionHandler } from "@json-render/core";
import type { ComponentRenderProps, ComponentRenderer } from "@json-render/react";
import {
  ActionProvider,
  Renderer,
  ValidationProvider,
  VisibilityProvider,
  StateProvider,
} from "@json-render/react";
import { useLayoutEffect, useRef, useState, useEffect, type ReactElement } from "react";

import { useMonopolyGame, useGameSnapshot } from "../MonopolyGameContext";
import {
  requestMonopolyAckModal,
  requestMonopolyRollDice,
} from "../game/gameControlBridge";
import { hudExternalStore } from "../game/hudExternalStore";
import { PHASE_TO_TEXT_ID, TEXT_COPY_IDS } from "../game/textCopyIds";
import { usePlayUi } from "../playUiContext";
import { MonopolyDiceCanvas } from "../dice/MonopolyDiceCanvas";
import type { MonopolyGame } from "../game/MonopolyGame";

/** 비오토: 결과·안내 모달 자동 닫힘 */
const MODAL_DISMISS_MS_NORMAL = 3000;
/** 오토: 모달 짧게 보고 다음 스텝 */
const MODAL_DISMISS_MS_AUTO = 1000;
const AUTO_IDLE_ROLL_DELAY_MS = 100;

const monopolyActionHandlers: Record<string, ActionHandler> = {
  monopolyRollDice: async () => {
    queueMicrotask(() => requestMonopolyRollDice());
  },
  monopolyAckModal: async () => {
    queueMicrotask(() => requestMonopolyAckModal());
  },
};

/**
 * 결과·시즌종료·안내 모달을 플레이로 닫은 뒤, 이미 idle 이고 굴림 가능이면
 * 같은 클릭에서 굴림까지 이어감 (`MonopolyShell` ack 훅과 동일 순서).
 */
function tryRollDiceIfReadyAfterAck(game: MonopolyGame): void {
  const s = game.getSnapshot();
  if (
    s.phase !== "idle" ||
    s.modal != null ||
    s.dice <= 0 ||
    s.dice < s.dice_cost
  ) {
    return;
  }
  requestMonopolyRollDice();
}

const playSpec = {
  root: "playRoot",
  elements: {
    playRoot: {
      type: "MonopolyPlayRoot",
      props: {},
      children: ["hudRow", "modalEl", "diceBlock", "rollRow", "timelineEl"],
    },
    hudRow: {
      type: "MonopolyHudChipRow",
      props: {
        diceLabel: { $state: "/hud/diceChip" },
        stageLine: { $state: "/hud/stageLine" },
        moneyLabel: { $state: "/hud/moneyChip" },
      },
      children: [],
    },
    diceBlock: {
      type: "MonopolyDiceStageBlock",
      props: {
        bodyText: { $state: "/hud/diceStageBody" },
      },
      children: [],
    },
    rollRow: {
      type: "MonopolyRollRow",
      props: {
        rollLabel: { $state: "/hud/rollBtnLabel" },
        rollDisabled: { $state: "/hud/rollDisabled" },
        rollTitle: { $state: "/hud/rollTitle" },
      },
      children: [],
      on: {
        press: { action: "monopolyRollDice" },
      },
    },
    timelineEl: {
      type: "MonopolyTimelineRail",
      props: {},
      children: [],
    },
    modalEl: {
      type: "MonopolyResultModalPanel",
      props: {
        open: { $state: "/hud/modalOpen" },
        title: { $state: "/hud/modalTitle" },
        subtitle: { $state: "/hud/modalSubtitle" },
        moneyLine: { $state: "/hud/modalMoneyLine" },
        diceLine: { $state: "/hud/modalDiceLine" },
      },
      children: [],
    },
  },
} satisfies Spec;

function MonopolyPlayRootImpl({ children }: ComponentRenderProps): ReactElement {
  return <div id="game-screen">{children}</div>;
}

function MonopolyHudChipRowImpl({
  element,
}: ComponentRenderProps): ReactElement {
  const p = element.props as {
    diceLabel?: unknown;
    stageLine?: unknown;
    moneyLabel?: unknown;
  };
  const game = useMonopolyGame();
  const lblDice = game.textLine(TEXT_COPY_IDS.hudLblDice, {}, "주사위");
  const lblStage = game.textLine(TEXT_COPY_IDS.hudLblStage, {}, "스테이지");
  const lblMoney = game.textLine(TEXT_COPY_IDS.hudLblMoney, {}, "머니");
  return (
    <header id="jr-hud">
      <div className="wire-hud-slot">
        <span>{lblDice}</span>
        {String(p.diceLabel ?? "")}
      </div>
      <div className="wire-hud-slot">
        <span>{lblStage}</span>
        {String(p.stageLine ?? "")}
      </div>
      <div className="wire-hud-slot">
        <span>{lblMoney}</span>
        {String(p.moneyLabel ?? "")}
      </div>
    </header>
  );
}

function MonopolyRollRowImpl({
  element,
}: ComponentRenderProps): ReactElement {
  const p = element.props as {
    rollLabel?: unknown;
    rollDisabled?: unknown;
    rollTitle?: unknown;
  };
  const rollDisabled = Boolean(p.rollDisabled);
  const game = useMonopolyGame();
  const snap = useGameSnapshot();
  const { autoRoll, setAutoRoll, autoRollRef } = usePlayUi();

  useEffect(() => {
    if (!autoRoll) return;
    if (snap.phase !== "idle" || snap.modal != null) return;

    const tid = window.setTimeout(() => {
      if (!autoRollRef.current) return;
      const s = game.getSnapshot();
      if (s.phase !== "idle" || s.modal != null) return;
      if (s.dice <= 0) {
        setAutoRoll(false);
        return;
      }
      if (s.dice < s.dice_cost) {
        game.abortAutoRollDueToDiceShortage();
        setAutoRoll(false);
        return;
      }
      requestMonopolyRollDice();
    }, AUTO_IDLE_ROLL_DELAY_MS);
    return () => window.clearTimeout(tid);
  }, [
    autoRoll,
    autoRollRef,
    snap.phase,
    snap.modal,
    snap.dice,
    snap.dice_cost,
    snap.jail_attempts,
    game,
    setAutoRoll,
  ]);

  useEffect(() => {
    if (snap.phase === "idle" && snap.modal?.kind === "notice" && autoRoll) {
      setAutoRoll(false);
    }
  }, [snap.phase, snap.modal?.kind, autoRoll, setAutoRoll]);

  const multLabel =
    snap.dice_multiplier_presets.find((x) => x.selected)?.display_label ?? "×1";
  const snapBlocked = snap.phase !== "idle" || snap.modal != null;
  const multLooksDisabled = snapBlocked;

  const multHint = game.textLine(
    TEXT_COPY_IDS.hudMultiplierHint,
    {},
    "배수 · 탭으로 순환",
  );
  const autoLabel = game.textLine(TEXT_COPY_IDS.hudAutoBtn, {}, "AUTO");
  const autoHint = game.textLine(
    TEXT_COPY_IDS.hudAutoHint,
    {},
    "자동 굴림 · 다시 누르면 해제",
  );

  const onMultClick = () => {
    if (snapBlocked) return;
    game.cycleDiceMultiplier();
  };

  return (
    <div className="wire-roll-row">
      <div className="wire-roll-row__side wire-roll-row__side--left">
        <button
          type="button"
          id="auto-btn"
          className={[
            "wire-auto-toggle",
            autoRoll ? "wire-auto-toggle--on" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          title={autoHint}
          aria-label={autoHint}
          aria-pressed={autoRoll}
          onClick={() => setAutoRoll((v) => !v)}
        >
          {autoLabel}
        </button>
      </div>
      <div className="wire-roll-row__center">
        <div className="wire-roll wire-roll--primary">
          <button
            type="button"
            id="roll-btn"
            className={autoRoll ? "roll-btn--auto-active" : undefined}
            title={String(p.rollTitle ?? "")}
            disabled={rollDisabled}
            onClick={() => {
              const s = game.getSnapshot();
              if (
                (s.phase === "result" || s.phase === "ended") &&
                s.modal != null
              ) {
                requestMonopolyAckModal();
                tryRollDiceIfReadyAfterAck(game);
                return;
              }
              if (s.phase === "idle" && s.modal?.kind === "notice") {
                requestMonopolyAckModal();
                tryRollDiceIfReadyAfterAck(game);
                return;
              }
              if (!rollDisabled) requestMonopolyRollDice();
            }}
          >
            {String(p.rollLabel ?? "")}
          </button>
        </div>
      </div>
      <div className="wire-roll-row__side wire-roll-row__side--right">
        <button
          type="button"
          id="mult-btn"
          className={[
            "wire-mult-toggle",
            multLooksDisabled ? "wire-mult-toggle--disabled" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-disabled={multLooksDisabled}
          title={multHint}
          aria-label={multHint}
          onClick={onMultClick}
        >
          {multLabel}
        </button>
      </div>
    </div>
  );
}

function MonopolyDiceStageBlockImpl({
  element,
}: ComponentRenderProps): ReactElement {
  const p = element.props as { bodyText?: unknown };
  const game = useMonopolyGame();
  const aria = game.textLine(
    TEXT_COPY_IDS.ariaDiceRegion,
    {},
    "주사위 영역",
  );
  return (
    <section className="wire-dice-stage" aria-label={aria}>
      <div id="dice-canvas">
        <MonopolyDiceCanvas assistCaption={String(p.bodyText ?? "")} />
      </div>
    </section>
  );
}

/** 타일 width 64 + flex `gap: 4` — `MonopolyGame` 의 `TILE_STEP_PX`(68) 과 동기 */
const TIMELINE_TILE_STEP_PX = 68;
const TIMELINE_TILE_HALF_PX = 32;

/** 보드 한 바퀴 — `getSnapshot().strip` 길이 */
const BOARD_RING_LEN = 40;
/**
 * 동일 40칸 링을 DOM 가로로 반복 배치하는 횟수.
 * `worldSlot`은 장시간 플레이에서 매우 커질 수 있고, `bufferOrigin`만 40칸 단위로 O(1) 이동해
 * 가시 슬롯 인덱스를 버퍼 안전 구간에 둔다.
 */
const TIMELINE_LOOP_COPIES = 5;

const TIMELINE_SLOT_COUNT = TIMELINE_LOOP_COPIES * BOARD_RING_LEN;

/** 화살표 기준 중앙 슬롯이 타임라인 양 끝에 너무 붙으면 `bufferOrigin` 시프트 */
const TIMELINE_EDGE_CUSHION_SLOTS = 12;

/**
 * `displayCenter = worldSlot - bufferOrigin` 이
 * `[cushion, slotCount - 1 - cushion]` 에 들도록 `bufferOrigin`을 `ringLen` 배수만큼 조정 (O(1)).
 */
function rebalanceTimelineBuffer(
  worldSlot: number,
  bufferOrigin: number,
  slotCount: number,
  ringLen: number,
  cushion: number,
): { worldSlot: number; bufferOrigin: number } {
  const minD = cushion;
  const maxD = slotCount - 1 - cushion;
  const d = worldSlot - bufferOrigin;
  if (d >= minD && d <= maxD) return { worldSlot, bufferOrigin };

  if (d > maxD) {
    const n = Math.ceil((d - maxD) / ringLen);
    return { worldSlot, bufferOrigin: bufferOrigin + n * ringLen };
  }
  const n = Math.ceil((minD - d) / ringLen);
  return { worldSlot, bufferOrigin: bufferOrigin - n * ringLen };
}

function initialTimelineScroll(pos: number): {
  worldSlot: number;
  bufferOrigin: number;
} {
  const worldSlot = BOARD_RING_LEN + pos;
  return rebalanceTimelineBuffer(
    worldSlot,
    0,
    TIMELINE_SLOT_COUNT,
    BOARD_RING_LEN,
    TIMELINE_EDGE_CUSHION_SLOTS,
  );
}

function ringDistance(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, BOARD_RING_LEN - d);
}

function TimelineTile(props: {
  tileIndex: number;
  label: string;
  icon: string;
  variant: "current" | "dim" | "normal";
  accentColor?: string;
  /** 굴림 중 한 칸 옮길 때마다 “눌렸다가 살짝 커짐” 연출 */
  stepPop?: boolean;
}): ReactElement {
  const { tileIndex, label, icon, variant, accentColor, stepPop } = props;
  const cls = [
    variant === "current"
      ? "timeline-tile current"
      : variant === "dim"
        ? "timeline-tile dim"
        : "timeline-tile",
    stepPop ? "timeline-tile--step-pop" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const style =
    accentColor != null && accentColor !== ""
      ? { borderLeft: `3px solid ${accentColor}` as const }
      : undefined;
  return (
    <div className={cls} style={style}>
      <span className="tile-idx">{tileIndex}</span>
      <span className="tile-icon" aria-hidden>
        {icon}
      </span>
      <span className="tile-name">{label}</span>
    </div>
  );
}

function MonopolyTimelineRailImpl(): ReactElement {
  const game = useMonopolyGame();
  const snap = useGameSnapshot();

  const prevPosRef = useRef(snap.pos);
  const [scroll, setScroll] = useState(() => initialTimelineScroll(snap.pos));
  const [recenterSnap, setRecenterSnap] = useState(false);

  useLayoutEffect(() => {
    const prev = prevPosRef.current;
    const cur = snap.pos;
    if (prev === cur) return;

    let bufferShifted = false;
    setScroll((s) => {
      let worldSlot = s.worldSlot;
      let bufferOrigin = s.bufferOrigin;

      const forward = (prev + 1) % BOARD_RING_LEN === cur;
      const back = (prev - 1 + BOARD_RING_LEN) % BOARD_RING_LEN === cur;

      if (forward) worldSlot += 1;
      else if (back) worldSlot -= 1;
      else {
        worldSlot = BOARD_RING_LEN + cur;
        bufferOrigin = 0;
      }

      const next = rebalanceTimelineBuffer(
        worldSlot,
        bufferOrigin,
        TIMELINE_SLOT_COUNT,
        BOARD_RING_LEN,
        TIMELINE_EDGE_CUSHION_SLOTS,
      );
      bufferShifted = next.bufferOrigin !== s.bufferOrigin;
      return next;
    });
    prevPosRef.current = cur;

    if (bufferShifted) {
      setRecenterSnap(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setRecenterSnap(false));
      });
    }
  }, [snap.pos]);

  const displayCenter = scroll.worldSlot - scroll.bufferOrigin;

  const trackMarginLeft = `calc(50% - ${
    TIMELINE_TILE_HALF_PX + displayCenter * TIMELINE_TILE_STEP_PX
  }px)`;

  const phaseWord = game.textLine(
    PHASE_TO_TEXT_ID[snap.phase],
    {},
    snap.phase,
  );
  const foot = game.textLine(
    TEXT_COPY_IDS.hudTimelineFoot,
    { pos: snap.pos, phase: phaseWord },
    `pos ${snap.pos} · phase ${snap.phase}`,
  );

  return (
    <div id="timeline-wrap">
      <div className="wire-timeline-label">{foot}</div>
      <div className="wire-timeline-viewport">
        <div className="timeline-current-arrow" aria-hidden />
        <div
          id="timeline-track"
          className={[
            snap.phase === "rolling" ? "is-rolling" : "",
            recenterSnap ? "timeline-track--recenter-snap" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ marginLeft: trackMarginLeft }}
        >
          {Array.from({ length: TIMELINE_SLOT_COUNT }, (_, i) => {
            const t = snap.strip[i % BOARD_RING_LEN]!;
            return (
              <TimelineTile
                key={
                  i === displayCenter && snap.phase === "rolling"
                    ? `tile-${i}-r${snap.animRoll}`
                    : `tile-${i}`
                }
                tileIndex={t.tile_index}
                label={t.display_name}
                icon={t.icon}
                accentColor={t.accent_color}
                variant={
                  t.tile_index === snap.pos
                    ? "current"
                    : ringDistance(t.tile_index, snap.pos) > 5
                      ? "dim"
                      : "normal"
                }
                stepPop={
                  snap.phase === "rolling" &&
                  snap.animRoll > 0 &&
                  i === displayCenter
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MonopolyResultModalPanelImpl({
  element,
}: ComponentRenderProps): ReactElement {
  const p = element.props as {
    open?: unknown;
    title?: unknown;
    subtitle?: unknown;
    moneyLine?: unknown;
    diceLine?: unknown;
  };
  const open = Boolean(p.open);
  const snap = useGameSnapshot();
  const { autoRoll } = usePlayUi();

  const dismissKey = snap.modal
    ? `${snap.phase}-${snap.roll_epoch}-${snap.modal.kind}-${snap.modal.title}-${snap.modal.subtitle}`
    : "";

  useEffect(() => {
    if (!open || snap.modal == null) return;
    const ms = autoRoll ? MODAL_DISMISS_MS_AUTO : MODAL_DISMISS_MS_NORMAL;
    const id = window.setTimeout(() => {
      requestMonopolyAckModal();
    }, ms);
    return () => window.clearTimeout(id);
  }, [open, autoRoll, dismissKey]);

  return (
    <div
      id="jr-result-modal"
      className={open ? "is-visible" : ""}
      aria-hidden={!open}
      role="status"
      aria-live="polite"
    >
      {open ? (
        <div className="wire-modal-panel">
          <div className="wire-label">{String(p.title ?? "")}</div>
          <p style={{ margin: "6px 0", fontSize: 13 }}>
            {String(p.subtitle ?? "")}
          </p>
          <p style={{ margin: "4px 0", fontSize: 12, color: "#555" }}>
            {String(p.moneyLine ?? "")}
          </p>
          <p style={{ margin: "4px 0", fontSize: 12, color: "#555" }}>
            {String(p.diceLine ?? "")}
          </p>
        </div>
      ) : null}
    </div>
  );
}

const fallback: ComponentRenderer = ({ element }) => {
  if (import.meta.env.DEV)
    console.warn("[json-render] 미등록 타입:", element.type);
  return null;
};

const registry: Record<string, ComponentRenderer> = {
  MonopolyPlayRoot: (p) => <MonopolyPlayRootImpl {...p} />,
  MonopolyHudChipRow: (p) => <MonopolyHudChipRowImpl {...p} />,
  MonopolyRollRow: (p) => <MonopolyRollRowImpl {...p} />,
  MonopolyDiceStageBlock: (p) => <MonopolyDiceStageBlockImpl {...p} />,
  MonopolyTimelineRail: () => <MonopolyTimelineRailImpl />,
  MonopolyResultModalPanel: (p) => <MonopolyResultModalPanelImpl {...p} />,
};

/** declarative 트리 — StateProvider / ActionProvider 포함. Provider 밖에서 Timeline 이 Context 를 쓰면 안 된다. */
export function GameJsonMonopoly(): ReactElement {
  return (
    <StateProvider store={hudExternalStore}>
      <ActionProvider handlers={monopolyActionHandlers}>
        <VisibilityProvider>
          <ValidationProvider>
            <Renderer spec={playSpec} registry={registry} fallback={fallback} />
          </ValidationProvider>
        </VisibilityProvider>
      </ActionProvider>
    </StateProvider>
  );
}
