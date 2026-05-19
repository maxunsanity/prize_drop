/**
 * `game_data/*.csv` — **파일명·repo 상대 경로의 단일 진실(SSoT)**.
 * `loadBoardData` · 카탈로그 재료 · 문서는 여기서 파생한다.
 */

export const MONOPOLY_DATA_CSV_FILENAMES = {
  flowMeta: "00_flow_meta.csv",
  simulationDefaults: "01_simulation_defaults.csv",
  tileEntities: "02_tile_entities.csv",
  entityDesignSamples: "02b_entity_design_samples.csv",
  boardStage: "03_board_stage_economy.csv",
  boardCells: "04_board_cells.csv",
  randomBranchRules: "05_random_branch_rules.csv",
  projectResources: "06_project_resources.csv",
  textStrings: "07_text_strings.csv",
  eventDeckStub: "08_event_deck_stub.csv",
  boardTileConfig: "board_tile_config.csv",
  diceMultiplierConfig: "dice_multiplier_config.csv",
  playerResources: "player_resources.csv",
} as const;

export type MonopolyDataCsvSheetId = keyof typeof MONOPOLY_DATA_CSV_FILENAMES;

/** manifest·카탈로그 나열 순서 (기획 플로우: 메타 → 튜닝 → 보드 → 런타임 시트) */
export const MONOPOLY_CSV_ORDER: readonly MonopolyDataCsvSheetId[] = [
  "flowMeta",
  "simulationDefaults",
  "tileEntities",
  "entityDesignSamples",
  "boardStage",
  "boardCells",
  "randomBranchRules",
  "projectResources",
  "textStrings",
  "eventDeckStub",
  "boardTileConfig",
  "diceMultiplierConfig",
  "playerResources",
] as const;

function toRepoPath(filename: string): string {
  return `game_data/${filename}`;
}

export const MONOPOLY_DATA_CSV_PATHS = {
  flowMeta: toRepoPath(MONOPOLY_DATA_CSV_FILENAMES.flowMeta),
  simulationDefaults: toRepoPath(
    MONOPOLY_DATA_CSV_FILENAMES.simulationDefaults,
  ),
  tileEntities: toRepoPath(MONOPOLY_DATA_CSV_FILENAMES.tileEntities),
  entityDesignSamples: toRepoPath(
    MONOPOLY_DATA_CSV_FILENAMES.entityDesignSamples,
  ),
  boardStage: toRepoPath(MONOPOLY_DATA_CSV_FILENAMES.boardStage),
  boardCells: toRepoPath(MONOPOLY_DATA_CSV_FILENAMES.boardCells),
  randomBranchRules: toRepoPath(
    MONOPOLY_DATA_CSV_FILENAMES.randomBranchRules,
  ),
  projectResources: toRepoPath(MONOPOLY_DATA_CSV_FILENAMES.projectResources),
  textStrings: toRepoPath(MONOPOLY_DATA_CSV_FILENAMES.textStrings),
  eventDeckStub: toRepoPath(MONOPOLY_DATA_CSV_FILENAMES.eventDeckStub),
  boardTileConfig: toRepoPath(MONOPOLY_DATA_CSV_FILENAMES.boardTileConfig),
  diceMultiplierConfig: toRepoPath(
    MONOPOLY_DATA_CSV_FILENAMES.diceMultiplierConfig,
  ),
  playerResources: toRepoPath(MONOPOLY_DATA_CSV_FILENAMES.playerResources),
} as const;

/** `loadBoardData` 등 — 파일명만 넘길 때 */
export const BOARD_TILE_CONFIG = MONOPOLY_DATA_CSV_FILENAMES.boardTileConfig;
export const BOARD_STAGE = MONOPOLY_DATA_CSV_FILENAMES.boardStage;
export const BOARD_CELLS = MONOPOLY_DATA_CSV_FILENAMES.boardCells;
export const TILE_ENTITIES = MONOPOLY_DATA_CSV_FILENAMES.tileEntities;
export const SIMULATION_DEFAULTS =
  MONOPOLY_DATA_CSV_FILENAMES.simulationDefaults;
/** UI·모달·타일 요약 문구 */
export const TEXT_STRINGS = MONOPOLY_DATA_CSV_FILENAMES.textStrings;
export const RANDOM_BRANCH_RULES =
  MONOPOLY_DATA_CSV_FILENAMES.randomBranchRules;
/** `06_project_resources` — 재화 메타(런타임 타일 악센트 등) */
export const PROJECT_RESOURCES =
  MONOPOLY_DATA_CSV_FILENAMES.projectResources;
/** `08_event_deck_stub` — CHANCE·COMMUNITY 덱 */
export const EVENT_DECK_STUB = MONOPOLY_DATA_CSV_FILENAMES.eventDeckStub;
