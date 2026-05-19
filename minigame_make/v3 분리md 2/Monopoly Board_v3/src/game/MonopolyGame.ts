import { loadBootstrapData } from "./loadBoardData";
import { findStageRow, stageRowToRuntime } from "./stageSync";
import { formatLine } from "./textFormat";
import { TEXT_COPY_IDS } from "./textCopyIds";
import { resolveWithWarps } from "./tileResolver";
import type {
  BoardCellRow,
  BoardTile,
  DiceMultiplierConfig,
  EventDeckStubRow,
  GamePhase,
  GameSnapshot,
  GameTune,
  ModalPayload,
  RandomBranchRules,
  StageRuntime,
} from "./types";
import type { Rng } from "./tileResolver";

/** 일반 이동: 타임라인이 한 칸 옮길 때마다 대기 */
const TIMELINE_STEP_MS = 500;
/** 감옥 탈출 등 — 타임라인 스텝 없이 단발 처리 */
const JAIL_RESOLVE_MS = 350;
const MODAL_DELAY_MS = 200;
const TILE_STEP_PX = 68;

function defaultRng(): Rng {
  return { unit: () => Math.random() };
}

function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

export class MonopolyGame {
  private listeners = new Set<() => void>();
  private tiles: BoardTile[];
  /** `04_board_cells` — index === position */
  private readonly boardCells: readonly BoardCellRow[];
  /** 복불복(CHANCE) — `08_event_deck_stub` 중 deck_kind=chance, weight>0 */
  private readonly chanceDeck: readonly EventDeckStubRow[];
  /** 사회기금(COMMUNITY) — deck_kind=community, weight>0 */
  private readonly communityDeck: readonly EventDeckStubRow[];
  /** `05_random_branch_rules` — 정거장·복불복(덱 없음) d100 컷 */
  private readonly randomBranchRules: RandomBranchRules;
  private tune: GameTune;
  private stageId: number;
  private stage: StageRuntime;
  private rng: Rng;

  private phase: GamePhase = "idle";
  private dice: number;
  private money: number;
  private pos: number;
  private roll = 0;
  private d1 = 0;
  private d2 = 0;
  /** 주사위 3D 연출 트리거 — 굴림마다 증가 */
  private roll_epoch = 0;
  private jail_attempts = 0;

  private rollStartPos = 0;
  /** rolling 중 완료한 타임라인 스텝 수 (1…roll, 연출·스냅샷용) */
  private rollVisualStep = 0;
  private timelineOffsetPx = 0;

  private pendingMoney = 0;
  private pendingDice = 0;
  private modal: ModalPayload | null = null;

  private landTimer: ReturnType<typeof setTimeout> | null = null;
  private modalTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly textById: Record<string, string>;
  private readonly diceMultiplierConfig: readonly DiceMultiplierConfig[];
  private multiplierId: number;

  constructor(data: ReturnType<typeof loadBootstrapData>, rng?: Rng) {
    this.textById = data.textById;
    this.diceMultiplierConfig = data.diceMultiplierConfig;
    this.multiplierId = data.initialDiceMultiplierId;
    this.tiles = data.tiles;
    this.boardCells = data.boardCells;
    this.chanceDeck = [...data.eventDeckStub]
      .filter((c) => c.deck_kind === "chance" && c.weight > 0)
      .sort(
        (a, b) => a.priority - b.priority || a.card_id.localeCompare(b.card_id),
      );
    this.communityDeck = [...data.eventDeckStub]
      .filter((c) => c.deck_kind === "community" && c.weight > 0)
      .sort(
        (a, b) => a.priority - b.priority || a.card_id.localeCompare(b.card_id),
      );
    this.randomBranchRules = data.randomBranchRules;
    this.tune = data.tune;
    this.stageId = data.initialStageId;
    const row = findStageRow(
      data.stages,
      Math.max(1, Math.min(10, this.stageId)),
    );
    this.stage = stageRowToRuntime(row);
    this.dice = data.initialDice;
    this.money = data.initialMoney;
    this.pos = ((data.initialPos % 40) + 40) % 40;
    this.rng = rng ?? defaultRng();
  }

  private currentMultiplierRow(): DiceMultiplierConfig {
    const row = this.diceMultiplierConfig.find(
      (r) => r.multiplier_id === this.multiplierId,
    );
    if (!row) {
      const d = this.diceMultiplierConfig.find((r) => r.is_default)!;
      this.multiplierId = d.multiplier_id;
      return d;
    }
    return row;
  }

  private resetToDefaultMultiplier(): void {
    const d = this.diceMultiplierConfig.find((r) => r.is_default);
    if (d) this.multiplierId = d.multiplier_id;
  }

  private showDiceShortageNotice(): void {
    this.resetToDefaultMultiplier();
    this.modal = {
      title: this.textLine(TEXT_COPY_IDS.modalDiceShortageTitle, {}, "안내"),
      subtitle: this.textLine(
        TEXT_COPY_IDS.modalDiceShortageBody,
        {},
        "주사위가 모자릅니다",
      ),
      moneyLine: "",
      diceLine: this.textLine(
        TEXT_COPY_IDS.modalDiceShortageHint,
        { dice: fmt(this.dice) },
        `배수를 ×1로 맞췄어요. (남은 주사위 ${fmt(this.dice)})`,
      ),
      kind: "notice",
    };
    this.notify();
  }

  /** idle · 안내 모달 닫기 */
  dismissNotice(): void {
    if (this.phase !== "idle") return;
    if (this.modal?.kind !== "notice") return;
    this.modal = null;
    this.notify();
  }

  /** 배수 단일 버튼 — ×1→…→×100→×1 (multiplier_value 오름차순). idle 이고 다른 모달 없을 때만. */
  cycleDiceMultiplier(): void {
    if (this.phase !== "idle") return;
    if (this.modal != null) return;
    const sorted = [...this.diceMultiplierConfig].sort(
      (a, b) =>
        a.multiplier_value - b.multiplier_value ||
        a.multiplier_id - b.multiplier_id,
    );
    if (sorted.length === 0) return;
    const idx = sorted.findIndex((r) => r.multiplier_id === this.multiplierId);
    const i = idx >= 0 ? idx : 0;
    const next = sorted[(i + 1) % sorted.length]!;
    this.multiplierId = next.multiplier_id;
    this.notify();
  }

  /** 오토 롤 중 배수 비용 미달 → ×1 + 안내 모달 */
  abortAutoRollDueToDiceShortage(): void {
    if (this.phase !== "idle") return;
    if (this.dice <= 0) return;
    if (this.dice < this.activeDiceCost()) {
      this.showDiceShortageNotice();
    }
  }

  /** HUD 칩 — 선택 중인 배수 프리셋 변경 (idle 만). */
  setDiceMultiplier(multiplierId: number): void {
    if (this.phase !== "idle") return;
    if (!this.diceMultiplierConfig.some((r) => r.multiplier_id === multiplierId)) {
      return;
    }
    this.multiplierId = multiplierId;
    this.notify();
  }

  private activeDiceCost(): number {
    return this.currentMultiplierRow().dice_cost;
  }

  private activeMultiplierValue(): number {
    return this.currentMultiplierRow().multiplier_value;
  }

  /** `07_text_strings.csv` 문구 — UI·tileResolver 공통 */
  textLine(
    id: string,
    vars?: Record<string, string | number>,
    fallback?: string,
  ): string {
    return formatLine(this.textById, id, vars ?? {}, fallback ?? id);
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    for (const fn of this.listeners) fn();
  }

  getSnapshot(): GameSnapshot {
    /** 0→39 한 줄 보드(뷰가 스크롤/중앙 정렬로 현재 칸을 맞춤) */
    const strip = [...this.tiles]
      .sort((a, b) => a.tile_index - b.tile_index)
      .map((t) => ({
      tile_index: t.tile_index,
      display_name: t.display_name,
      icon: t.icon,
      tile_type: t.tile_type,
      accent_color: t.accent_color,
    }));
    const mult = this.currentMultiplierRow();
    const dicePresets = this.diceMultiplierConfig.map((r) => ({
      multiplier_id: r.multiplier_id,
      multiplier_value: r.multiplier_value,
      display_label: r.display_label,
      dice_cost: r.dice_cost,
      affordable: this.dice >= r.dice_cost,
      selected: r.multiplier_id === this.multiplierId,
    }));
    return {
      phase: this.phase,
      roll_epoch: this.roll_epoch,
      dice: this.dice,
      dice_cost: mult.dice_cost,
      multiplier_value: mult.multiplier_value,
      dice_multiplier_current_id: this.multiplierId,
      dice_multiplier_presets: dicePresets,
      money: this.money,
      pos: this.pos,
      roll: this.roll,
      d1: this.d1,
      d2: this.d2,
      stage_id: this.stageId,
      jail_attempts: this.jail_attempts,
      timelineOffsetPx: this.timelineOffsetPx,
      modal: this.modal,
      tune: this.tune,
      stage: this.stage,
      animRoll:
        this.phase === "rolling"
          ? this.rollVisualStep
          : this.phase === "moving"
            ? this.roll
            : 0,
      animFromPos:
        this.phase === "rolling" || this.phase === "moving"
          ? this.rollStartPos
          : this.pos,
      strip,
    };
  }

  /** idle에서: 일반 굴림. 감옥 중이면 탈출 시도. */
  rollDice(): void {
    if (this.phase !== "idle") return;
    if (this.landTimer) clearTimeout(this.landTimer);
    if (this.modalTimer) clearTimeout(this.modalTimer);
    this.landTimer = null;
    this.modalTimer = null;
    if (this.jail_attempts > 0) {
      this.tryJailEscape();
      return;
    }
    if (this.dice < this.activeDiceCost()) {
      if (this.dice <= 0) {
        this.phase = "ended";
        this.modal = {
          title: this.textLine(
            TEXT_COPY_IDS.modalSeasonEndTitle,
            {},
            "시즌 종료",
          ),
          subtitle: this.textLine(
            TEXT_COPY_IDS.modalSeasonEndNoDice,
            {},
            "주사위가 부족합니다",
          ),
          moneyLine: this.textLine(
            TEXT_COPY_IDS.modalMoneyHold,
            { money: fmt(this.money) },
            `보유 💰 ${fmt(this.money)}`,
          ),
          diceLine: this.textLine(
            TEXT_COPY_IDS.modalDiceRemaining,
            { dice: fmt(this.dice) },
            `남은 주사위 ${fmt(this.dice)}`,
          ),
          kind: "neutral",
        };
      } else {
        this.showDiceShortageNotice();
      }
      this.notify();
      return;
    }

    this.dice -= this.activeDiceCost();
    this.d1 = 1 + Math.floor(this.rng.unit() * 6);
    this.d2 = 1 + Math.floor(this.rng.unit() * 6);
    this.roll = this.d1 + this.d2;
    this.roll_epoch += 1;
    this.rollStartPos = this.pos;
    this.rollVisualStep = 0;
    this.phase = "rolling";
    this.notify();

    this.scheduleTimelineStep(1);
  }

  /** `nextStep`: 이번 틱에서 진행할 스텝 번호(1-based). `roll`칸 다 옮긴 뒤 `finishLanding`. */
  private scheduleTimelineStep(nextStep: number): void {
    if (this.phase !== "rolling") return;
    this.landTimer = setTimeout(() => {
      if (this.phase !== "rolling") return;
      if (nextStep > this.roll) {
        this.finishLanding();
        return;
      }
      this.pos = (this.pos + 1) % 40;
      this.timelineOffsetPx -= TILE_STEP_PX;
      this.rollVisualStep = nextStep;
      this.notify();
      this.scheduleTimelineStep(nextStep + 1);
    }, TIMELINE_STEP_MS);
  }

  private tryJailEscape(): void {
    if (this.landTimer) clearTimeout(this.landTimer);
    if (this.modalTimer) clearTimeout(this.modalTimer);
    this.landTimer = null;
    this.modalTimer = null;

    if (this.dice < this.activeDiceCost()) {
      if (this.dice <= 0) {
        this.phase = "ended";
        this.modal = {
          title: this.textLine(
            TEXT_COPY_IDS.modalSeasonEndTitle,
            {},
            "시즌 종료",
          ),
          subtitle: this.textLine(
            TEXT_COPY_IDS.modalSeasonEndJailNoDice,
            {},
            "감옥 탈출 비용 주사위 부족",
          ),
          moneyLine: this.textLine(
            TEXT_COPY_IDS.modalEndMoneyShort,
            { money: fmt(this.money) },
            `💰 ${fmt(this.money)}`,
          ),
          diceLine: this.textLine(
            TEXT_COPY_IDS.modalEndDiceShort,
            { dice: fmt(this.dice) },
            `🎲 ${fmt(this.dice)}`,
          ),
          kind: "neutral",
        };
      } else {
        this.showDiceShortageNotice();
      }
      this.notify();
      return;
    }
    this.dice -= this.activeDiceCost();
    this.d1 = 1 + Math.floor(this.rng.unit() * 6);
    this.d2 = 1 + Math.floor(this.rng.unit() * 6);
    this.roll = this.d1 + this.d2;
    this.roll_epoch += 1;
    this.phase = "rolling";
    this.notify();

    this.landTimer = setTimeout(() => {
      const dub = this.d1 === this.d2;
      let money = 0;
      let summary: string;
      if (dub) {
        const gain = Math.round(
          this.tune.go_reward * this.stage.scale * this.activeMultiplierValue(),
        );
        money = gain;
        this.jail_attempts = 0;
        summary = this.textLine(
          TEXT_COPY_IDS.jailEscapeDouble,
          { gain: fmt(gain) },
          `더블! 탈출 +${gain}`,
        );
      } else {
        const fine = Math.round(
          this.tune.jail_fine * this.activeMultiplierValue(),
        );
        this.money -= fine;
        this.jail_attempts = Math.max(0, this.jail_attempts - 1);
        summary = this.textLine(
          TEXT_COPY_IDS.jailEscapeFail,
          {
            fine,
            attempts: this.jail_attempts,
          },
          `실패 −${fine} (남은 시도 ${this.jail_attempts})`,
        );
      }
      this.phase = "result";
      this.pendingMoney = dub ? money : 0;
      this.pendingDice = 0;
      this.modal = {
        title: this.textLine(TEXT_COPY_IDS.modalJailTitle, {}, "감옥"),
        subtitle: summary,
        moneyLine: dub
          ? this.textLine(
              TEXT_COPY_IDS.modalJailPendingGain,
              { money: fmt(money) },
              `적용 예정 +${fmt(money)}`,
            )
          : this.textLine(
              TEXT_COPY_IDS.modalJailAfterDeduct,
              { money: fmt(this.money) },
              `즉시 차감 후 ${fmt(this.money)}`,
            ),
        diceLine: this.textLine(
          TEXT_COPY_IDS.modalJailDiceLine,
          {
            d1: this.d1,
            d2: this.d2,
            roll: this.roll,
          },
          `🎲 ${this.d1} + ${this.d2} = ${this.roll}`,
        ),
        kind: dub ? "reward" : "deduct",
      };
      this.roll = 0;
      this.notify();
    }, JAIL_RESOLVE_MS);
  }

  private finishLanding(): void {
    if (this.phase !== "rolling") return;

    const posOld = this.rollStartPos;
    const roll = this.roll;
    const landed = this.pos;

    let money = 0;
    if (landed < posOld) {
      money += Math.round(
        this.tune.go_reward * this.stage.scale * this.activeMultiplierValue(),
      );
    }

    const resolved = resolveWithWarps(
      this.tiles,
      this.boardCells,
      this.chanceDeck,
      this.communityDeck,
      landed,
      this.stage,
      this.tune,
      this.randomBranchRules,
      this.activeMultiplierValue(),
      roll,
      this.money + money,
      this.rng,
      5,
      (id, vars, fb) => this.textLine(id, vars, fb),
    );
    money += resolved.moneyDelta;
    if (resolved.jailAttemptsSet != null)
      this.jail_attempts = resolved.jailAttemptsSet;

    this.pos = resolved.finalPos;

    this.pendingMoney = money;
    this.pendingDice = resolved.diceDelta;

    const title =
      this.tiles[this.pos]?.display_name ??
      this.textLine(TEXT_COPY_IDS.modalDefaultResultTitle, {}, "결과");
    const subtitle = resolved.summaries.join(" → ");
    const kind: ModalPayload["kind"] =
      this.pendingMoney < 0
        ? "deduct"
        : this.pendingMoney > 0 || this.pendingDice > 0
          ? "reward"
          : "neutral";

    this.phase = "moving";
    this.notify();

    this.modalTimer = setTimeout(() => {
      this.phase = "result";
      this.modal = {
        title,
        subtitle,
        moneyLine:
          this.pendingMoney === 0
            ? this.textLine(
                TEXT_COPY_IDS.modalMoneyNoChange,
                {},
                "머니 변동 없음",
              )
            : this.pendingMoney > 0
              ? this.textLine(
                  TEXT_COPY_IDS.modalPendingGainLine,
                  { money: fmt(this.pendingMoney) },
                  `적용 예정 +${fmt(this.pendingMoney)}`,
                )
              : this.textLine(
                  TEXT_COPY_IDS.modalPendingLossLine,
                  { money: fmt(this.pendingMoney) },
                  `적용 예정 ${fmt(this.pendingMoney)}`,
                ),
        diceLine:
          this.pendingDice === 0
            ? this.textLine(
                TEXT_COPY_IDS.modalDiceRollOnly,
                { d1: this.d1, d2: this.d2, roll },
                `주사위 ${this.d1} + ${this.d2} = ${roll}`,
              )
            : this.textLine(
                TEXT_COPY_IDS.modalDiceBonusLine,
                {
                  pd: this.pendingDice,
                  d1: this.d1,
                  d2: this.d2,
                  roll,
                },
                `🎲 +${this.pendingDice} · 굴림 ${this.d1}+${this.d2}=${roll}`,
              ),
        kind,
      };
      this.notify();
    }, MODAL_DELAY_MS);
  }

  confirmResult(): void {
    if (this.phase !== "result") return;
    this.money += this.pendingMoney;
    this.dice += this.pendingDice;
    this.pendingMoney = 0;
    this.pendingDice = 0;
    this.modal = null;
    this.roll = 0;
    this.rollVisualStep = 0;
    this.d1 = 0;
    this.d2 = 0;

    if (this.dice <= 0) {
      this.phase = "ended";
      this.modal = {
        title: this.textLine(
          TEXT_COPY_IDS.modalSeasonEndTitle,
          {},
          "시즌 종료",
        ),
        subtitle: this.textLine(
          TEXT_COPY_IDS.modalSeasonEndFarewell,
          {},
          "다음 시즌에 또 만나요",
        ),
        moneyLine: this.textLine(
          TEXT_COPY_IDS.modalEndMoneyShort,
          { money: fmt(this.money) },
          `💰 ${fmt(this.money)}`,
        ),
        diceLine: this.textLine(
          TEXT_COPY_IDS.modalEndDiceShort,
          { dice: fmt(this.dice) },
          `🎲 ${fmt(this.dice)}`,
        ),
        kind: "neutral",
      };
    } else if (this.dice < this.activeDiceCost()) {
      this.phase = "idle";
      this.showDiceShortageNotice();
    } else {
      this.phase = "idle";
    }
    this.notify();
  }

  dismissEndScreen(): void {
    if (this.phase !== "ended") return;
    this.modal = null;
    this.notify();
  }

  destroy(): void {
    if (this.landTimer) clearTimeout(this.landTimer);
    if (this.modalTimer) clearTimeout(this.modalTimer);
  }
}
