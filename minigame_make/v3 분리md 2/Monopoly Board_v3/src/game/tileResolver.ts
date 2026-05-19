import { TEXT_COPY_IDS } from "./textCopyIds";
import type {
  BoardCellRow,
  BoardTile,
  EventDeckStubRow,
  GameTune,
  RandomBranchRules,
  ResolveOutcome,
  StageRuntime,
} from "./types";
import { allowedTileTypesForCell } from "./validateBoardGraph";

export type Rng = {
  /** [0, 1) */
  unit: () => number;
};

/** CSV `07_text_strings` 조회 — `MonopolyGame.textLine` 과 동일 시그니처 */
export type TextLine = (
  id: string,
  vars?: Record<string, string | number>,
  fallback?: string,
) => string;

function d100(rng: Rng): number {
  return 1 + Math.floor(rng.unit() * 100);
}

function scaled(
  base: number,
  stage: StageRuntime,
  multiplierValue: number,
): number {
  return Math.round(base * stage.scale * multiplierValue);
}

function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

function assertTileMatchesCell(tile: BoardTile, cell: BoardCellRow): void {
  const allowed = allowedTileTypesForCell(cell);
  if (!allowed.includes(tile.tile_type)) {
    throw new Error(
      `런타임 보드 불일치 tile_index=${tile.tile_index}: cells.kind=${cell.kind} tile_type=${tile.tile_type} (허용: ${allowed.join(", ")})`,
    );
  }
}

function pickWeightedCard(
  cards: readonly EventDeckStubRow[],
  rng: Rng,
): EventDeckStubRow {
  const total = cards.reduce((s, c) => s + Math.max(0, c.weight), 0);
  if (total <= 0) {
    throw new Error("event_deck: 가중치 합이 0");
  }
  let roll = rng.unit() * total;
  for (const c of cards) {
    const w = Math.max(0, c.weight);
    roll -= w;
    if (roll < 0) return c;
  }
  return cards[cards.length - 1]!;
}

/** `community_payout` 배율 — 비어 있거나 잘못된 값이면 1 */
function communityPayoutMult(arg: string): number {
  const s = arg.trim();
  if (s === "") return 1;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return 1;
  return n;
}

/** `warp_station` 목적지 — 빈 문자열이면 15, 잘못된 값이면 15 */
function chanceWarpDestination(arg: string): number {
  const s = arg.trim();
  if (s === "") return 15;
  const n = Math.floor(Number(s));
  if (!Number.isFinite(n)) return 15;
  return ((n % 40) + 40) % 40;
}

function resolveChanceFromDeck(
  tile: BoardTile,
  stage: StageRuntime,
  multiplierValue: number,
  rng: Rng,
  tx: TextLine,
  chanceDeck: readonly EventDeckStubRow[],
): ResolveOutcome {
  const card = pickWeightedCard(chanceDeck, rng);
  switch (card.effect_kind) {
    case "money_from_tile": {
      const m = scaled(tile.base_reward, stage, multiplierValue);
      const detail = tx(
        TEXT_COPY_IDS.tileChanceMoney,
        { m: fmt(m) },
        `복불복 돈 +${m}`,
      );
      return {
        moneyDelta: m,
        diceDelta: 0,
        summary: `${card.title_stub} — ${detail}`,
        warpTo: null,
        jailAttemptsSet: null,
      };
    }
    case "warp_station": {
      const dest = chanceWarpDestination(card.effect_arg);
      const detail = tx(TEXT_COPY_IDS.tileChanceWarp, {}, "복불복 → 정거장 이동");
      return {
        moneyDelta: 0,
        diceDelta: 0,
        summary: `${card.title_stub} — ${detail}`,
        warpTo: dest,
        jailAttemptsSet: null,
      };
    }
    case "dice_bonus": {
      const add = stage.chance_dice_base;
      const detail = tx(
        TEXT_COPY_IDS.tileChanceDice,
        { add },
        `복불복 주사위 +${add}`,
      );
      return {
        moneyDelta: 0,
        diceDelta: add,
        summary: `${card.title_stub} — ${detail}`,
        warpTo: null,
        jailAttemptsSet: null,
      };
    }
    default:
      throw new Error(
        `chance card ${card.card_id}: effect_kind "${card.effect_kind}"`,
      );
  }
}

function resolveCommunityFromDeck(
  stage: StageRuntime,
  tune: GameTune,
  multiplierValue: number,
  rng: Rng,
  tx: TextLine,
  communityDeck: readonly EventDeckStubRow[],
): ResolveOutcome {
  const card = pickWeightedCard(communityDeck, rng);
  switch (card.effect_kind) {
    case "community_payout": {
      const mult = communityPayoutMult(card.effect_arg);
      const m = scaled(tune.community_reward * mult, stage, multiplierValue);
      const detail = tx(
        TEXT_COPY_IDS.tileCommunity,
        { m: fmt(m) },
        `사회기금 +${m}`,
      );
      return {
        moneyDelta: m,
        diceDelta: 0,
        summary: `${card.title_stub} — ${detail}`,
        warpTo: null,
        jailAttemptsSet: null,
      };
    }
    case "dice_bonus": {
      const add = stage.chance_dice_base;
      const detail = tx(
        TEXT_COPY_IDS.tileCommunityDice,
        { add },
        `사회기금 · 주사위 +${add}`,
      );
      return {
        moneyDelta: 0,
        diceDelta: add,
        summary: `${card.title_stub} — ${detail}`,
        warpTo: null,
        jailAttemptsSet: null,
      };
    }
    case "warp_go": {
      const m = scaled(tune.go_reward, stage, multiplierValue);
      const detail = tx(
        TEXT_COPY_IDS.tileCommunityGo,
        { m: fmt(m) },
        `사회기금 · GO +${m}`,
      );
      return {
        moneyDelta: m,
        diceDelta: 0,
        summary: `${card.title_stub} — ${detail}`,
        warpTo: 0,
        jailAttemptsSet: null,
        skipNextGoLandingMoney: true,
      };
    }
    case "warp_station": {
      const dest = chanceWarpDestination(card.effect_arg);
      const detail = tx(
        TEXT_COPY_IDS.tileCommunityWarp,
        {},
        "사회기금 → 지정 칸 이동",
      );
      return {
        moneyDelta: 0,
        diceDelta: 0,
        summary: `${card.title_stub} — ${detail}`,
        warpTo: dest,
        jailAttemptsSet: null,
      };
    }
    default:
      throw new Error(
        `community card ${card.card_id}: effect_kind "${card.effect_kind}"`,
      );
  }
}

/**
 * 단일 칸 착지 — **`04_board_cells.kind` 가 분기**, 수치·이름은 `board_tile_config` 타일.
 */
export function resolveTileLanding(
  tile: BoardTile,
  cell: BoardCellRow,
  stage: StageRuntime,
  tune: GameTune,
  branchRules: RandomBranchRules,
  multiplierValue: number,
  landRoll: number,
  playerMoneyForCap: number,
  rng: Rng,
  tx: TextLine,
  chanceDeck: readonly EventDeckStubRow[],
  communityDeck: readonly EventDeckStubRow[],
  skipGoLandingMoney: boolean,
): ResolveOutcome {
  assertTileMatchesCell(tile, cell);
  const sc = stage.scale;
  const mv = multiplierValue;

  switch (cell.kind) {
    case "go_landing": {
      if (skipGoLandingMoney) {
        return {
          moneyDelta: 0,
          diceDelta: 0,
          summary: tx(
            TEXT_COPY_IDS.tileGoLandingSkip,
            {},
            "GO",
          ),
          warpTo: null,
          jailAttemptsSet: null,
        };
      }
      const m = scaled(tune.go_reward, stage, mv);
      return {
        moneyDelta: m,
        diceDelta: 0,
        summary: tx(
          TEXT_COPY_IDS.tileGoLanding,
          { m: fmt(m) },
          `GO 착지 +${m}`,
        ),
        warpTo: null,
        jailAttemptsSet: null,
      };
    }
    case "property": {
      const m = scaled(tile.base_reward, stage, mv);
      return {
        moneyDelta: m,
        diceDelta: 0,
        summary: tx(
          TEXT_COPY_IDS.tileLandReward,
          { name: tile.display_name, m: fmt(m) },
          `${tile.display_name} +${m}`,
        ),
        warpTo: null,
        jailAttemptsSet: null,
      };
    }
    case "community_chest": {
      if (communityDeck.length > 0) {
        return resolveCommunityFromDeck(
          stage,
          tune,
          mv,
          rng,
          tx,
          communityDeck,
        );
      }
      const m = scaled(tune.community_reward, stage, mv);
      return {
        moneyDelta: m,
        diceDelta: 0,
        summary: tx(
          TEXT_COPY_IDS.tileCommunity,
          { m: fmt(m) },
          `사회기금 +${m}`,
        ),
        warpTo: null,
        jailAttemptsSet: null,
      };
    }
    case "station": {
      const branch = d100(rng);
      if (branch <= branchRules.stationShutdownCutoff) {
        const ok = d100(rng) > branchRules.shutdownSuccessAbove;
        const base = stage.shutdown_base_reward;
        const rate = ok ? stage.shutdown_hit_rate : stage.shutdown_blocked_rate;
        const m = Math.round(base * rate * sc * mv);
        return {
          moneyDelta: m,
          diceDelta: 0,
          summary: ok
            ? tx(
                TEXT_COPY_IDS.tileStationShutdownOk,
                { m: fmt(m) },
                `정거장 셧다운 성공 +${m}`,
              )
            : tx(
                TEXT_COPY_IDS.tileStationShutdownBlock,
                { m: fmt(m) },
                `정거장 셧다운 막힘 +${m}`,
              ),
          warpTo: null,
          jailAttemptsSet: null,
        };
      }
      const tier = d100(rng);
      let m: number;
      let label: string;
      if (tier <= branchRules.heistSmallCutoff) {
        m = Math.round(
          stage.heist_reward_small * stage.heist_rate_small * sc * mv,
        );
        label = tx(TEXT_COPY_IDS.tileLabelHeistS, {}, "강탈(소)");
      } else if (tier <= branchRules.heistMediumCutoff) {
        m = Math.round(
          stage.heist_reward_medium * stage.heist_rate_medium * sc * mv,
        );
        label = tx(TEXT_COPY_IDS.tileLabelHeistM, {}, "강탈(중)");
      } else {
        m = Math.round(
          stage.heist_reward_large * stage.heist_rate_large * sc * mv,
        );
        label = tx(TEXT_COPY_IDS.tileLabelHeistL, {}, "강탈(대)");
      }
      return {
        moneyDelta: m,
        diceDelta: 0,
        summary: tx(
          TEXT_COPY_IDS.tileStationHeist,
          { label, m: fmt(m) },
          `정거장 ${label} +${m}`,
        ),
        warpTo: null,
        jailAttemptsSet: null,
      };
    }
    case "chance": {
      if (chanceDeck.length > 0) {
        return resolveChanceFromDeck(
          tile,
          stage,
          mv,
          rng,
          tx,
          chanceDeck,
        );
      }
      const r = d100(rng);
      if (r <= branchRules.chanceMoneyCutoff) {
        const m = scaled(tile.base_reward, stage, mv);
        return {
          moneyDelta: m,
          diceDelta: 0,
          summary: tx(
            TEXT_COPY_IDS.tileChanceMoney,
            { m: fmt(m) },
            `복불복 돈 +${m}`,
          ),
          warpTo: null,
          jailAttemptsSet: null,
        };
      }
      if (r <= branchRules.chanceWarpCutoff) {
        return {
          moneyDelta: 0,
          diceDelta: 0,
          summary: tx(
            TEXT_COPY_IDS.tileChanceWarp,
            {},
            "복불복 → 정거장 이동",
          ),
          warpTo: 15,
          jailAttemptsSet: null,
        };
      }
      const add = stage.chance_dice_base;
      return {
        moneyDelta: 0,
        diceDelta: add,
        summary: tx(
          TEXT_COPY_IDS.tileChanceDice,
          { add },
          `복불복 주사위 +${add}`,
        ),
        warpTo: null,
        jailAttemptsSet: null,
      };
    }
    case "utility": {
      const m = Math.round(landRoll * tile.base_reward * sc * mv);
      return {
        moneyDelta: m,
        diceDelta: 0,
        summary: tx(
          TEXT_COPY_IDS.tileLandReward,
          { name: tile.display_name, m: fmt(m) },
          `${tile.display_name} +${m}`,
        ),
        warpTo: null,
        jailAttemptsSet: null,
      };
    }
    case "corner_visit": {
      const m = scaled(tile.base_reward, stage, mv);
      return {
        moneyDelta: m,
        diceDelta: 0,
        summary: tx(
          TEXT_COPY_IDS.tileCornerVisit,
          { m: fmt(m) },
          `기차역 +${m}`,
        ),
        warpTo: null,
        jailAttemptsSet: null,
      };
    }
    case "corner_park": {
      const m = scaled(tune.park_reward, stage, mv);
      return {
        moneyDelta: m,
        diceDelta: 0,
        summary: tx(
          TEXT_COPY_IDS.tileCornerPark,
          { m: fmt(m) },
          `주차장 +${m}`,
        ),
        warpTo: null,
        jailAttemptsSet: null,
      };
    }
    case "jail_visit":
      return {
        moneyDelta: 0,
        diceDelta: 0,
        summary: tx(TEXT_COPY_IDS.tileJailEnter, {}, "감옥 입장"),
        warpTo: null,
        jailAttemptsSet: 3,
      };
    case "tax_low": {
      const raw = Math.round(tune.tax_low_value * mv);
      const capMax = Math.floor(playerMoneyForCap * tune.max_deduction_ratio);
      const applied = Math.min(raw, Math.max(0, capMax));
      return {
        moneyDelta: -applied,
        diceDelta: 0,
        summary: tx(
          TEXT_COPY_IDS.tileTaxLow,
          { v: applied },
          `세금(저) −${applied}`,
        ),
        warpTo: null,
        jailAttemptsSet: null,
      };
    }
    case "tax_high": {
      const raw = Math.round(tune.tax_high_value * mv);
      const capMax = Math.floor(playerMoneyForCap * tune.max_deduction_ratio);
      const applied = Math.min(raw, Math.max(0, capMax));
      return {
        moneyDelta: -applied,
        diceDelta: 0,
        summary: tx(
          TEXT_COPY_IDS.tileTaxHigh,
          { v: applied },
          `세금(고) −${applied}`,
        ),
        warpTo: null,
        jailAttemptsSet: null,
      };
    }
  }
}

export function resolveWithWarps(
  tiles: BoardTile[],
  cellsByPosition: readonly BoardCellRow[],
  chanceDeck: readonly EventDeckStubRow[],
  communityDeck: readonly EventDeckStubRow[],
  startPos: number,
  stage: StageRuntime,
  tune: GameTune,
  branchRules: RandomBranchRules,
  multiplierValue: number,
  landRoll: number,
  startingMoney: number,
  rng: Rng,
  maxWarps: number,
  tx: TextLine,
): {
  moneyDelta: number;
  diceDelta: number;
  finalPos: number;
  summaries: string[];
  jailAttemptsSet: number | null;
} {
  if (cellsByPosition.length !== 40) {
    throw new Error(`boardCells: 40행 기대, 실제 ${cellsByPosition.length}`);
  }

  let pos = startPos;
  let moneyDelta = 0;
  let diceDelta = 0;
  const summaries: string[] = [];
  let jailAttemptsSet: number | null = null;
  let skipGoLandingMoney = false;
  let wallet = startingMoney;
  for (let w = 0; w <= maxWarps; w++) {
    const tile = tiles[pos];
    if (!tile) throw new Error(`No tile at ${pos}`);
    const cell = cellsByPosition[pos];
    if (!cell || cell.position !== pos) {
      throw new Error(`board_cells 없음 또는 position 불일치: ${pos}`);
    }
    const o = resolveTileLanding(
      tile,
      cell,
      stage,
      tune,
      branchRules,
      multiplierValue,
      landRoll,
      wallet,
      rng,
      tx,
      chanceDeck,
      communityDeck,
      skipGoLandingMoney,
    );
    skipGoLandingMoney = !!o.skipNextGoLandingMoney;
    wallet += o.moneyDelta;
    moneyDelta += o.moneyDelta;
    diceDelta += o.diceDelta;
    summaries.push(o.summary);
    if (o.jailAttemptsSet != null) jailAttemptsSet = o.jailAttemptsSet;
    if (o.warpTo == null) break;
    pos = o.warpTo;
  }
  return { moneyDelta, diceDelta, finalPos: pos, summaries, jailAttemptsSet };
}
