/** `05_random_branch_rules` — 정거장·복불복(덱 없음) 등 d100 분기 컷 */
export type RandomBranchRules = {
  stationShutdownCutoff: number;
  /** 셧다운: d100 가 이 값 초과일 때 성공 */
  shutdownSuccessAbove: number;
  heistSmallCutoff: number;
  heistMediumCutoff: number;
  chanceMoneyCutoff: number;
  chanceWarpCutoff: number;
};

export type GamePhase = "idle" | "rolling" | "moving" | "result" | "ended";

export type TileType = string;

export type BoardTile = {
  tile_index: number;
  tile_type: TileType;
  base_reward: number;
  display_name: string;
  icon: string;
  /** `06_project_resources.color` — 타일 종류→재화 매핑 시 타임라인 악센트 */
  accent_color?: string;
};

/** `06_project_resources.csv` */
export type ProjectResourceRow = {
  resource_key: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  order: number;
  project_slug: string;
};

export const BOARD_CELL_KINDS = [
  "go_landing",
  "property",
  "community_chest",
  "tax_low",
  "tax_high",
  "station",
  "chance",
  "corner_visit",
  "corner_park",
  "utility",
  "jail_visit",
] as const;

export type BoardCellKind = (typeof BOARD_CELL_KINDS)[number];

/** `04_board_cells.csv` 한 행 — 기획 그래프(SSoT). */
export type BoardCellRow = {
  position: number;
  kind: BoardCellKind;
  /** 비어 있으면 해당 칸 종류에서 엔티티 키 없음 */
  entity_key: string;
  notes: string;
};

/**
 * `08_event_deck_stub.csv` — 복불복·커뮤니티 **이벤트 카드 덱**.
 */
export type EventDeckStubRow = {
  card_id: string;
  /** 행이 있을 때 `chance` | `community` 만 허용 */
  deck_kind: string;
  title_stub: string;
  /**
   * chance: `money_from_tile` | `warp_station` | `dice_bonus`
   * community: `community_payout` | `dice_bonus` | `warp_go` | `warp_station`
   */
  effect_kind: string;
  /** `warp_station` 일 때 도착 칸(0–39). 비우면 15. */
  effect_arg: string;
  notes: string;
  weight: number;
  priority: number;
};

export type StageRow = {
  stage_id: number;
  scale: number;
  shutdown_base_reward: number;
  shutdown_hit_rate: number;
  shutdown_blocked_rate: number;
  heist_reward_small: number;
  heist_reward_medium: number;
  heist_reward_large: number;
  heist_rate_small: number;
  heist_rate_medium: number;
  heist_rate_large: number;
  chance_dice_base: number;
};

export type GameTune = {
  jail_fine: number;
  /** 세금 등 차감 상한: `MIN(계산 차감, floor(money * ratio))` */
  max_deduction_ratio: number;
  tax_low_value: number;
  tax_high_value: number;
  go_reward: number;
  park_reward: number;
  community_reward: number;
};

/** `dice_multiplier_config` 테이블(또는 동일 구조 CSV) 한 행 */
export type DiceMultiplierConfig = {
  multiplier_id: number;
  multiplier_value: number;
  display_label: string;
  dice_cost: number;
  is_default: boolean;
};

export type DiceMultiplierPresetSnapshot = {
  multiplier_id: number;
  multiplier_value: number;
  display_label: string;
  dice_cost: number;
  /** 현재 보유 주사위로 해당 단계 비용을 낼 수 있는지 */
  affordable: boolean;
  selected: boolean;
};

export type StageRuntime = {
  scale: number;
  shutdown_base_reward: number;
  shutdown_hit_rate: number;
  shutdown_blocked_rate: number;
  heist_reward_small: number;
  heist_reward_medium: number;
  heist_reward_large: number;
  heist_rate_small: number;
  heist_rate_medium: number;
  heist_rate_large: number;
  chance_dice_base: number;
};

export type ResolveOutcome = {
  moneyDelta: number;
  diceDelta: number;
  summary: string;
  warpTo: number | null;
  jailAttemptsSet: number | null;
  /** 다음 칸이 go_landing이면 보상 생략 (사회기금「GO 이동」등 한 번만 지급) */
  skipNextGoLandingMoney?: boolean;
};

export type ModalPayload = {
  title: string;
  subtitle: string;
  moneyLine: string;
  diceLine: string;
  kind: "reward" | "deduct" | "neutral" | "notice";
};

export type GameSnapshot = {
  phase: GamePhase;
  /** `MonopolyDiceCanvas` 가 굴림 연출 시작 타이밍을 놓치지 않도록 증가하는 토큰 */
  roll_epoch: number;
  dice: number;
  /** 선택된 배수의 주사위 소모량 = 이번 굴림 비용 */
  dice_cost: number;
  /** 선택된 배수의 보상·할증 계수(프리셋에선 보통 dice_cost와 동일) */
  multiplier_value: number;
  dice_multiplier_current_id: number;
  dice_multiplier_presets: DiceMultiplierPresetSnapshot[];
  money: number;
  pos: number;
  roll: number;
  d1: number;
  d2: number;
  stage_id: number;
  jail_attempts: number;
  timelineOffsetPx: number;
  modal: ModalPayload | null;
  tune: GameTune;
  stage: StageRuntime;
  /** rolling: 완료한 타임라인 칸 수(0…roll). moving: 이번 굴린 합(연출 잔여 호환). */
  animRoll: number;
  animFromPos: number;
  /** 타임라인 40칸 전체(순서=보드 0…39, UI가 현재 pos를 중앙에 둠) */
  strip: {
    tile_index: number;
    display_name: string;
    icon: string;
    tile_type: string;
    accent_color?: string;
  }[];
};
