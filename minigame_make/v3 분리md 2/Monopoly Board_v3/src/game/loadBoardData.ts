import { parseCsv, rowsToObjects } from "../data/parseCsv";
import {
  BOARD_CELLS,
  BOARD_STAGE,
  BOARD_TILE_CONFIG,
  EVENT_DECK_STUB,
  MONOPOLY_DATA_CSV_FILENAMES,
  RANDOM_BRANCH_RULES,
  SIMULATION_DEFAULTS,
  TEXT_STRINGS,
  TILE_ENTITIES,
  PROJECT_RESOURCES,
} from "./gameDataPaths";
import type {
  BoardCellKind,
  BoardCellRow,
  BoardTile,
  DiceMultiplierConfig,
  EventDeckStubRow,
  GameTune,
  ProjectResourceRow,
  RandomBranchRules,
  StageRow,
} from "./types";
import { BOARD_CELL_KINDS } from "./types";
import { assertBoardGraphConsistent } from "./validateBoardGraph";

const rawCsv = import.meta.glob<string>("../../game_data/*.csv", {
  query: "?raw",
  import: "default",
  eager: true,
});

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

function getCsv(name: string): string {
  const suffix = `game_data/${name}`;
  for (const [path, content] of Object.entries(rawCsv)) {
    if (typeof content !== "string") continue;
    const n = normalizePath(path);
    if (n.endsWith(suffix)) return content;
  }
  throw new Error(
    `Missing CSV: ${name}. Vite glob keys: ${Object.keys(rawCsv).join(" | ")}`,
  );
}

function num(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function loadSimulationMap(): Record<string, string> {
  const simCsv = parseCsv(getCsv(SIMULATION_DEFAULTS));
  return Object.fromEntries(
    simCsv.slice(1).map((row) => [row[0]!, row[1]!]),
  );
}

function loadTextStrings(): Record<string, string> {
  const csv = parseCsv(getCsv(TEXT_STRINGS));
  const out: Record<string, string> = {};
  for (const row of csv.slice(1)) {
    const id = row[0];
    if (id == null || id === "") continue;
    out[String(id)] = row[1] != null ? String(row[1]) : "";
  }
  return out;
}

function loadTileEntityKeys(): Set<string> {
  const csv = parseCsv(getCsv(TILE_ENTITIES));
  const keys = new Set<string>();
  for (const row of csv.slice(1)) {
    const k = row[0];
    if (k == null || String(k).trim() === "") continue;
    keys.add(String(k).trim());
  }
  return keys;
}

function isBoardCellKind(s: string): s is BoardCellKind {
  return (BOARD_CELL_KINDS as readonly string[]).includes(s);
}

function loadBoardCells(): BoardCellRow[] {
  const csv = parseCsv(getCsv(BOARD_CELLS));
  const body = csv.slice(1);
  const rows = rowsToObjects(
    ["position", "kind", "entity_key", "notes"],
    body,
  );
  const out: BoardCellRow[] = [];
  for (const r of rows) {
    const kindRaw = String(r.kind);
    if (!isBoardCellKind(kindRaw)) {
      throw new Error(`board_cells: 알 수 없는 kind "${kindRaw}"`);
    }
    out.push({
      position: num(String(r.position)),
      kind: kindRaw,
      entity_key: r.entity_key != null ? String(r.entity_key) : "",
      notes: r.notes != null ? String(r.notes) : "",
    });
  }
  return out.sort((a, b) => a.position - b.position);
}

const DEFAULT_RANDOM_BRANCH_RULES: RandomBranchRules = {
  stationShutdownCutoff: 50,
  shutdownSuccessAbove: 50,
  heistSmallCutoff: 60,
  heistMediumCutoff: 75,
  chanceMoneyCutoff: 30,
  chanceWarpCutoff: 60,
};

const RANDOM_BRANCH_RULE_FIELDS: Record<string, keyof RandomBranchRules> = {
  station_shutdown_vs_heist: "stationShutdownCutoff",
  shutdown_shield_roll: "shutdownSuccessAbove",
  heist_tier_small: "heistSmallCutoff",
  heist_tier_med_vs_large: "heistMediumCutoff",
  chance_money_branch: "chanceMoneyCutoff",
  chance_station_branch: "chanceWarpCutoff",
};

const RANDOM_BRANCH_HEADER = [
  "node_id",
  "rule_id",
  "condition",
  "note",
] as const;

function parseRandomBranchCondition(ruleId: string, condition: string): number {
  const c = condition.trim();
  const lteD100 = /^rand\.d100\(\)\s*<=\s*(\d+)\s*$/i.exec(c);
  if (lteD100) return num(lteD100[1]!);
  const gtD100 = /^rand\.d100\(\)\s*>\s*(\d+)\s*$/i.exec(c);
  if (gtD100) return num(gtD100[1]!);
  const chanceLte = /^chance_rand\s*<=\s*(\d+)\s*$/i.exec(c);
  if (chanceLte) return num(chanceLte[1]!);
  throw new Error(
    `05_random_branch_rules (${ruleId}): condition 파싱 실패 — "${condition}"`,
  );
}

function assertRandomBranchRules(r: RandomBranchRules): void {
  const { stationShutdownCutoff: sdc, shutdownSuccessAbove: ssa } = r;
  if (sdc < 1 || sdc > 99) {
    throw new Error(`random_branch: stationShutdownCutoff 범위 1–99 — ${sdc}`);
  }
  if (ssa < 0 || ssa > 99) {
    throw new Error(`random_branch: shutdownSuccessAbove 범위 0–99 — ${ssa}`);
  }
  const { heistSmallCutoff: hs, chanceMoneyCutoff: cm } = r;
  const { heistMediumCutoff: hm, chanceWarpCutoff: cw } = r;
  if (hs < 1 || hm < 1 || hs > 100 || hm > 100 || hs > hm) {
    throw new Error(
      `random_branch: heist 컷 1–100 이고 small<=medium — small=${hs} medium=${hm}`,
    );
  }
  if (cm < 1 || cw < 1 || cm >= cw || cw > 99) {
    throw new Error(
      `random_branch: chance 컷은 money<warp 이고 warp<=99(주사위 꼬리 확보) — money=${cm} warp=${cw}`,
    );
  }
}

function loadRandomBranchRules(): RandomBranchRules {
  const out: RandomBranchRules = { ...DEFAULT_RANDOM_BRANCH_RULES };
  const csv = parseCsv(getCsv(RANDOM_BRANCH_RULES));
  if (csv.length === 0) {
    throw new Error("05_random_branch_rules: 파일 비어 있음");
  }
  const head = csv[0]!.map((c) => c.trim());
  if (
    head.length !== RANDOM_BRANCH_HEADER.length ||
    !RANDOM_BRANCH_HEADER.every((h, i) => head[i] === h)
  ) {
    throw new Error(
      `05_random_branch_rules: 헤더 불일치 — 기대 [${RANDOM_BRANCH_HEADER.join(", ")}] / 실제 [${head.join(", ")}]`,
    );
  }
  const body = csv
    .slice(1)
    .filter((row) => row.some((c) => String(c).trim() !== ""));
  const seenRule = new Set<string>();
  for (const row of body) {
    const ruleId = String(row[1] ?? "").trim();
    if (ruleId === "" || ruleId === "chance_dice_branch") continue;
    const field = RANDOM_BRANCH_RULE_FIELDS[ruleId];
    if (!field) {
      throw new Error(`05_random_branch_rules: 알 수 없는 rule_id "${ruleId}"`);
    }
    if (seenRule.has(ruleId)) {
      throw new Error(`05_random_branch_rules: rule_id 중복 — ${ruleId}`);
    }
    seenRule.add(ruleId);
    const condition = String(row[2] ?? "");
    out[field] = parseRandomBranchCondition(ruleId, condition);
  }
  assertRandomBranchRules(out);
  return out;
}

const RESOURCE_COLOR_PRESET: Record<string, string> = {
  jade: "#14b8a6",
  salmon: "#fb7185",
};

function normalizeResourceColor(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("#")) return t;
  return RESOURCE_COLOR_PRESET[t] ?? t;
}

/** `tile_type` → `06_project_resources.resource_key` (타임라인 악센트용) */
function resourceKeyForTileType(tileType: string): string | null {
  switch (tileType) {
    case "GO":
      return "season_coin";
    case "CHANCE":
      return "dice";
    case "STATION":
      return "me_1";
    default:
      if (tileType.startsWith("LAND_")) return "money";
      return "money";
  }
}

const PROJECT_RESOURCE_HEADERS = [
  "resource_key",
  "name",
  "description",
  "color",
  "icon",
  "order",
  "project_slug",
] as const;

function loadProjectResources(): ProjectResourceRow[] {
  const csv = parseCsv(getCsv(PROJECT_RESOURCES));
  if (csv.length === 0) throw new Error("06_project_resources: 파일 비어 있음");
  const head = csv[0]!.map((c) => c.trim());
  if (
    head.length !== PROJECT_RESOURCE_HEADERS.length ||
    !PROJECT_RESOURCE_HEADERS.every((h, i) => head[i] === h)
  ) {
    throw new Error(
      `06_project_resources: 헤더 불일치 — 기대 [${PROJECT_RESOURCE_HEADERS.join(", ")}] / 실제 [${head.join(", ")}]`,
    );
  }
  const body = csv
    .slice(1)
    .filter((row) => row.some((c) => String(c).trim() !== ""));
  const seen = new Set<string>();
  const out: ProjectResourceRow[] = [];
  for (const r of rowsToObjects([...PROJECT_RESOURCE_HEADERS], body)) {
    const resource_key = String(r.resource_key ?? "").trim();
    if (resource_key === "") continue;
    if (seen.has(resource_key)) {
      throw new Error(`06_project_resources: resource_key 중복 — ${resource_key}`);
    }
    seen.add(resource_key);
    out.push({
      resource_key,
      name: String(r.name ?? "").trim(),
      description: String(r.description ?? "").trim(),
      color: String(r.color ?? "").trim(),
      icon: String(r.icon ?? "").trim(),
      order: num(String(r.order)),
      project_slug: String(r.project_slug ?? "").trim(),
    });
  }
  return out;
}

function attachTileResourceAccents(
  tiles: BoardTile[],
  byKey: ReadonlyMap<string, ProjectResourceRow>,
): BoardTile[] {
  return tiles.map((t) => {
    const rk = resourceKeyForTileType(t.tile_type);
    const row = rk ? byKey.get(rk) : undefined;
    if (!row?.color) return t;
    const accent = normalizeResourceColor(row.color);
    return { ...t, accent_color: accent };
  });
}

const CHANCE_EFFECT_KINDS = new Set([
  "money_from_tile",
  "warp_station",
  "dice_bonus",
]);

const COMMUNITY_EFFECT_KINDS = new Set([
  "community_payout",
  "dice_bonus",
  "warp_go",
  "warp_station",
]);

const EVENT_DECK_STUB_HEADERS = [
  "card_id",
  "deck_kind",
  "title_stub",
  "effect_kind",
  "effect_arg",
  "notes",
  "weight",
  "priority",
] as const;

function loadEventDeckStub(): EventDeckStubRow[] {
  const csv = parseCsv(getCsv(EVENT_DECK_STUB));
  if (csv.length === 0) {
    throw new Error("08_event_deck_stub: 파일 비어 있음");
  }
  const head = csv[0]!.map((c) => c.trim());
  if (
    head.length !== EVENT_DECK_STUB_HEADERS.length ||
    !EVENT_DECK_STUB_HEADERS.every((h, i) => head[i] === h)
  ) {
    throw new Error(
      `08_event_deck_stub: 헤더 불일치 — 기대 [${EVENT_DECK_STUB_HEADERS.join(", ")}] / 실제 [${head.join(", ")}]`,
    );
  }
  const body = csv
    .slice(1)
    .filter((row) => row.some((c) => String(c).trim() !== ""));
  if (body.length === 0) return [];

  const rows = rowsToObjects([...EVENT_DECK_STUB_HEADERS], body);
  const seen = new Set<string>();
  const out: EventDeckStubRow[] = [];
  for (const r of rows) {
    const id = String(r.card_id).trim();
    if (id === "") throw new Error("08_event_deck_stub: card_id 비어 있음");
    if (seen.has(id)) {
      throw new Error(`08_event_deck_stub: card_id 중복 — ${id}`);
    }
    seen.add(id);
    const deck = String(r.deck_kind).trim();
    if (deck !== "chance" && deck !== "community") {
      throw new Error(
        `08_event_deck_stub: deck_kind 은 chance|community 만 — ${deck} (${id})`,
      );
    }
    const w = num(String(r.weight));
    if (w < 0) throw new Error(`08_event_deck_stub: weight < 0 (${id})`);
    const effect = String(r.effect_kind ?? "").trim();
    if (deck === "chance") {
      if (!CHANCE_EFFECT_KINDS.has(effect)) {
        throw new Error(
          `08_event_deck_stub (${id}): chance effect_kind 는 money_from_tile|warp_station|dice_bonus — got "${effect}"`,
        );
      }
    } else if (deck === "community") {
      if (!COMMUNITY_EFFECT_KINDS.has(effect)) {
        throw new Error(
          `08_event_deck_stub (${id}): community effect_kind 는 community_payout|dice_bonus|warp_go|warp_station — got "${effect}"`,
        );
      }
    }
    out.push({
      card_id: id,
      deck_kind: deck,
      title_stub: String(r.title_stub ?? "").trim(),
      effect_kind: effect,
      effect_arg: String(r.effect_arg ?? "").trim(),
      notes: String(r.notes ?? "").trim(),
      weight: w,
      priority: num(String(r.priority)),
    });
  }
  return out;
}

function truthyCell(s: string | undefined): boolean {
  const t = String(s ?? "").trim().toLowerCase();
  return t === "true" || t === "1" || t === "yes";
}

function loadDiceMultiplierConfig(): DiceMultiplierConfig[] {
  const csv = parseCsv(
    getCsv(MONOPOLY_DATA_CSV_FILENAMES.diceMultiplierConfig),
  );
  const body = csv.slice(1);
  const rows = rowsToObjects(
    [
      "multiplier_id",
      "multiplier_value",
      "display_label",
      "dice_cost",
      "is_default",
    ],
    body,
  );
  const out: DiceMultiplierConfig[] = rows.map((r) => ({
    multiplier_id: num(String(r.multiplier_id)),
    multiplier_value: num(String(r.multiplier_value)),
    display_label: String(r.display_label ?? "").trim(),
    dice_cost: num(String(r.dice_cost)),
    is_default: truthyCell(String(r.is_default)),
  }));
  const defs = out.filter((x) => x.is_default);
  if (defs.length !== 1) {
    throw new Error(
      `dice_multiplier_config: is_default=true 행이 정확히 1개여야 함 (현재 ${defs.length})`,
    );
  }
  const ids = new Set(out.map((x) => x.multiplier_id));
  if (ids.size !== out.length) {
    throw new Error("dice_multiplier_config: multiplier_id 중복");
  }
  for (const r of out) {
    if (r.dice_cost <= 0 || r.multiplier_value <= 0) {
      throw new Error(
        "dice_multiplier_config: dice_cost·multiplier_value 는 1 이상",
      );
    }
  }
  return [...out].sort((a, b) => a.multiplier_value - b.multiplier_value);
}

function loadInitialDiceMultiplierId(raw: string): number {
  const csv = parseCsv(raw);
  if (csv.length < 2) {
    throw new Error("player_resources: 헤더 + 1행 필요");
  }
  const h = String(csv[0]![0]).trim();
  if (h !== "dice_multiplier_current") {
    throw new Error(
      `player_resources: 첫 열은 dice_multiplier_current (실제: ${h})`,
    );
  }
  return num(String(csv[1]![0]));
}

export type BootstrapData = {
  tiles: BoardTile[];
  /** `04_board_cells` — tile_config / entity 와 검증됨 */
  boardCells: BoardCellRow[];
  stages: StageRow[];
  tune: GameTune;
  /** `dice_multiplier_config` — 9단 프리셋 */
  diceMultiplierConfig: DiceMultiplierConfig[];
  /** `player_resources.dice_multiplier_current` — 없거나 불일치 시 is_default */
  initialDiceMultiplierId: number;
  initialDice: number;
  initialMoney: number;
  initialPos: number;
  initialStageId: number;
  textById: Record<string, string>;
  /** `08_event_deck_stub` — CHANCE·COMMUNITY 가중 뽑기 */
  eventDeckStub: EventDeckStubRow[];
  /** `05_random_branch_rules` — 정거장·복불복(덱 없음) d100 컷 */
  randomBranchRules: RandomBranchRules;
  /** `06_project_resources` — 재화 메타·타일 악센트 소스 */
  projectResources: ProjectResourceRow[];
};

export function loadBootstrapData(): BootstrapData {
  const tileCsv = parseCsv(getCsv(BOARD_TILE_CONFIG));
  const tileHead = tileCsv[0]!;
  const tileBody = tileCsv.slice(1);
  const tileRows = rowsToObjects(
    tileHead as unknown as (keyof BoardTile)[],
    tileBody,
  );
  const tilesBare: BoardTile[] = tileRows.map((r) => ({
    tile_index: num(String(r.tile_index)),
    tile_type: String(r.tile_type),
    base_reward: num(String(r.base_reward)),
    display_name: String(r.display_name),
    icon: String(r.icon),
  }));
  if (tilesBare.length !== 40)
    throw new Error(
      `board_tile_config: expected 40 rows, got ${tilesBare.length}`,
    );

  const boardCells = loadBoardCells();
  const tileEntityKeys = loadTileEntityKeys();
  assertBoardGraphConsistent(tilesBare, boardCells, tileEntityKeys);

  const projectResources = loadProjectResources();
  const resourceByKey = new Map(
    projectResources.map((r) => [r.resource_key, r]),
  );
  const tiles = attachTileResourceAccents(tilesBare, resourceByKey);

  const stageCsv = parseCsv(getCsv(BOARD_STAGE));
  const stageBody = stageCsv.slice(1);
  const stageRows = rowsToObjects(
    [
      "stage_id",
      "scale",
      "shutdown_base_reward",
      "shutdown_hit_rate",
      "shutdown_blocked_rate",
      "heist_reward_small",
      "heist_reward_medium",
      "heist_reward_large",
      "heist_rate_small",
      "heist_rate_medium",
      "heist_rate_large",
      "chance_dice_base",
    ],
    stageBody,
  );
  const stages: StageRow[] = stageRows.map((r) => ({
    stage_id: num(r.stage_id),
    scale: num(r.scale),
    shutdown_base_reward: num(r.shutdown_base_reward),
    shutdown_hit_rate: num(r.shutdown_hit_rate),
    shutdown_blocked_rate: num(r.shutdown_blocked_rate),
    heist_reward_small: num(r.heist_reward_small),
    heist_reward_medium: num(r.heist_reward_medium),
    heist_reward_large: num(r.heist_reward_large),
    heist_rate_small: num(r.heist_rate_small),
    heist_rate_medium: num(r.heist_rate_medium),
    heist_rate_large: num(r.heist_rate_large),
    chance_dice_base: num(r.chance_dice_base),
  }));

  const sim = loadSimulationMap();
  const tune: GameTune = {
    jail_fine: num(String(sim.jail_fine)),
    max_deduction_ratio: num(String(sim.max_deduction_ratio)),
    tax_low_value: num(String(sim.tax_low_value)),
    tax_high_value: num(String(sim.tax_high_value)),
    go_reward: num(String(sim.go_reward)),
    park_reward: num(String(sim.park_reward)),
    community_reward: num(String(sim.community_reward)),
  };
  if (
    !Number.isFinite(tune.max_deduction_ratio) ||
    tune.max_deduction_ratio <= 0 ||
    tune.max_deduction_ratio > 1
  ) {
    throw new Error("max_deduction_ratio must be in (0, 1]");
  }

  const diceMultiplierConfig = loadDiceMultiplierConfig();
  let initialDiceMultiplierId = loadInitialDiceMultiplierId(
    getCsv(MONOPOLY_DATA_CSV_FILENAMES.playerResources),
  );
  if (!diceMultiplierConfig.some((r) => r.multiplier_id === initialDiceMultiplierId)) {
    initialDiceMultiplierId = diceMultiplierConfig.find((r) => r.is_default)!
      .multiplier_id;
  }

  const textById = loadTextStrings();
  const eventDeckStub = loadEventDeckStub();
  const randomBranchRules = loadRandomBranchRules();

  return {
    tiles,
    boardCells,
    stages,
    tune,
    diceMultiplierConfig,
    initialDiceMultiplierId,
    initialDice: num(String(sim.dice)),
    initialMoney: num(String(sim.money)),
    initialPos: num(String(sim.pos)),
    initialStageId: num(String(sim.stage_id)),
    textById,
    eventDeckStub,
    randomBranchRules,
    projectResources,
  };
}
