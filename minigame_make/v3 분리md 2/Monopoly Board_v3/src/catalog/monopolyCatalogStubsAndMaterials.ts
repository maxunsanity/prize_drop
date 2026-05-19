/**
 * 카탈로그 — **registry 없는 데이터 재료** (CSV 시트 1파일 = 컴퍼넌트 1개).
 * 운영 UI(`monopolyCatalogOperationalUi`) 와는 레이어가 다르다.
 *
 * 런타임은 `board_tile_config` · `03_board_stage_economy` · `01_simulation_defaults` · `06_project_resources` · `05_random_branch_rules` · `07_text_strings` · `08_event_deck_stub` 를 로드한다.
 * 그 외 시트는 기획·Spec·향후 로더 연결용 타입 고정이다.
 */

import { z } from "zod";

import {
  MONOPOLY_DATA_CSV_PATHS,
  type MonopolyDataCsvSheetId,
} from "../game/gameDataPaths";

const csvFormat = z.literal("csv");

/** Spec 에 “이 번들이 참조하는 시트 경로”를 한 번에 싣는 shape */
export const monopolyGameDataCsvManifest = z.object({
  flowMeta: z.literal(MONOPOLY_DATA_CSV_PATHS.flowMeta),
  simulationDefaults: z.literal(MONOPOLY_DATA_CSV_PATHS.simulationDefaults),
  tileEntities: z.literal(MONOPOLY_DATA_CSV_PATHS.tileEntities),
  entityDesignSamples: z.literal(MONOPOLY_DATA_CSV_PATHS.entityDesignSamples),
  boardStage: z.literal(MONOPOLY_DATA_CSV_PATHS.boardStage),
  boardCells: z.literal(MONOPOLY_DATA_CSV_PATHS.boardCells),
  randomBranchRules: z.literal(MONOPOLY_DATA_CSV_PATHS.randomBranchRules),
  projectResources: z.literal(MONOPOLY_DATA_CSV_PATHS.projectResources),
  textStrings: z.literal(MONOPOLY_DATA_CSV_PATHS.textStrings),
  eventDeckStub: z.literal(MONOPOLY_DATA_CSV_PATHS.eventDeckStub),
  boardTileConfig: z.literal(MONOPOLY_DATA_CSV_PATHS.boardTileConfig),
  diceMultiplierConfig: z.literal(MONOPOLY_DATA_CSV_PATHS.diceMultiplierConfig),
  playerResources: z.literal(MONOPOLY_DATA_CSV_PATHS.playerResources),
});

export function dataMaterialProps(
  path: (typeof MONOPOLY_DATA_CSV_PATHS)[MonopolyDataCsvSheetId],
  role: string,
) {
  return z.object({
    format: csvFormat.describe("런타임 로더 포맷"),
    sourcePath: z
      .literal(path)
      .describe(
        "repo 기준 경로 — 변경 시 `gameDataPaths.ts`·파서·Vite glob 과 함께 수정",
      ),
    materialRole: z.literal(role).describe("기획·Spec 구분용 역할 태그"),
  });
}

export const monopolyCatalogMaterialComponents = {
  MonopolyDataMaterial_FlowMeta: {
    props: dataMaterialProps(MONOPOLY_DATA_CSV_PATHS.flowMeta, "flow_export_meta"),
    description:
      "00 플로우 메타 — 플로우 이름·내보낸 시각·노드/엣지 수·원본 JSON.",
    example: {
      format: "csv",
      sourcePath: MONOPOLY_DATA_CSV_PATHS.flowMeta,
      materialRole: "flow_export_meta",
    },
  },

  MonopolyDataMaterial_SimulationDefaults: {
    props: dataMaterialProps(
      MONOPOLY_DATA_CSV_PATHS.simulationDefaults,
      "key_value_tune_init",
    ),
    description:
      "01 시뮬 초깃값 — dice·money·pos·튜닝·max_deduction_ratio 등. `dice_count` 제거됨(배수는 `dice_multiplier_config`). `loadBootstrapData`.",
    example: {
      format: "csv",
      sourcePath: MONOPOLY_DATA_CSV_PATHS.simulationDefaults,
      materialRole: "key_value_tune_init",
    },
  },

  MonopolyDataMaterial_TileEntities: {
    props: dataMaterialProps(
      MONOPOLY_DATA_CSV_PATHS.tileEntities,
      "entity_definitions",
    ),
    description: "02 타일 엔티티 정의 — entity_key·보상·표시명·설명.",
    example: {
      format: "csv",
      sourcePath: MONOPOLY_DATA_CSV_PATHS.tileEntities,
      materialRole: "entity_definitions",
    },
  },

  MonopolyDataMaterial_EntityDesignSamples: {
    props: dataMaterialProps(
      MONOPOLY_DATA_CSV_PATHS.entityDesignSamples,
      "entity_sample_cell_map",
    ),
    description:
      "02b 엔티티별 샘플 보드 셀 인덱스 — 연출/디자인 참조.",
    example: {
      format: "csv",
      sourcePath: MONOPOLY_DATA_CSV_PATHS.entityDesignSamples,
      materialRole: "entity_sample_cell_map",
    },
  },

  MonopolyDataMaterial_BoardStage: {
    props: dataMaterialProps(
      MONOPOLY_DATA_CSV_PATHS.boardStage,
      "runtime_stage_scaling",
    ),
    description:
      "03 스테이지 경제 — `scale`·셧다운·강탈·`chance_dice_base` 10행. `loadBootstrapData` 전용, 플로우 추출과 동일 파일명.",
    example: {
      format: "csv",
      sourcePath: MONOPOLY_DATA_CSV_PATHS.boardStage,
      materialRole: "runtime_stage_scaling",
    },
  },

  MonopolyDataMaterial_BoardCells: {
    props: dataMaterialProps(
      MONOPOLY_DATA_CSV_PATHS.boardCells,
      "position_entity_graph",
    ),
    description:
      "04 보드 셀 그래프 — position·kind·entity_key. 런타임 `tileResolver` 가 kind 로 착지 분기. 모서리는 `corner_visit`(10)·`corner_park`(20).",
    example: {
      format: "csv",
      sourcePath: MONOPOLY_DATA_CSV_PATHS.boardCells,
      materialRole: "position_entity_graph",
    },
  },

  MonopolyDataMaterial_RandomBranchRules: {
    props: dataMaterialProps(
      MONOPOLY_DATA_CSV_PATHS.randomBranchRules,
      "flow_branch_conditions",
    ),
    description:
      "05 랜덤 분기 컷 — 정거장(셧다운/강탈)·복불복 덱 없을 때 d100 임계값. `condition` 은 `rand.d100()<=N` / `>N` / `chance_rand<=N` 형태만 파싱. `loadBootstrapData` → `tileResolver`.",
    example: {
      format: "csv",
      sourcePath: MONOPOLY_DATA_CSV_PATHS.randomBranchRules,
      materialRole: "flow_branch_conditions",
    },
  },

  MonopolyDataMaterial_ProjectResources: {
    props: dataMaterialProps(
      MONOPOLY_DATA_CSV_PATHS.projectResources,
      "resource_catalog",
    ),
    description: "06 프로젝트 리소스 — 재화·색·아이콘 슬러그. `loadBootstrapData`가 검증 후 타일 `accent_color`에 반영.",
    example: {
      format: "csv",
      sourcePath: MONOPOLY_DATA_CSV_PATHS.projectResources,
      materialRole: "resource_catalog",
    },
  },

  MonopolyDataMaterial_TextStrings: {
    props: dataMaterialProps(
      MONOPOLY_DATA_CSV_PATHS.textStrings,
      "ui_modal_tile_copy",
    ),
    description:
      "07 UI·모달·HUD·타일 요약 문구 — text_id,value,locale. `MonopolyGame.textLine` 가 소비.",
    example: {
      format: "csv",
      sourcePath: MONOPOLY_DATA_CSV_PATHS.textStrings,
      materialRole: "ui_modal_tile_copy",
    },
  },

  MonopolyDataMaterial_EventDeckStub: {
    props: dataMaterialProps(
      MONOPOLY_DATA_CSV_PATHS.eventDeckStub,
      "event_deck_skeleton",
    ),
    description:
      "08 이벤트 덱 — `deck_kind=chance|community` + weight>0 행을 `MonopolyGame`이 정렬해 각각 복불복·사회기금 착지에 가중 뽑기. effect_kind/effect_arg는 로더 검증.",
    example: {
      format: "csv",
      sourcePath: MONOPOLY_DATA_CSV_PATHS.eventDeckStub,
      materialRole: "event_deck_skeleton",
    },
  },

  MonopolyDataMaterial_BoardTileConfig: {
    props: dataMaterialProps(
      MONOPOLY_DATA_CSV_PATHS.boardTileConfig,
      "runtime_40_tile_table",
    ),
    description:
      "40칸 타일 표 — tile_index·tile_type·보상·이름·아이콘. 런타임 `loadBootstrapData` 핵심.",
    example: {
      format: "csv",
      sourcePath: MONOPOLY_DATA_CSV_PATHS.boardTileConfig,
      materialRole: "runtime_40_tile_table",
    },
  },

  MonopolyDataMaterial_DiceMultiplierConfig: {
    props: dataMaterialProps(
      MONOPOLY_DATA_CSV_PATHS.diceMultiplierConfig,
      "dice_multiplier_presets",
    ),
    description:
      "주사위 배수 9단 프리셋 — multiplier_id·value·display_label·dice_cost·is_default(정확히 1행). DB 테이블과 동형.",
    example: {
      format: "csv",
      sourcePath: MONOPOLY_DATA_CSV_PATHS.diceMultiplierConfig,
      materialRole: "dice_multiplier_presets",
    },
  },

  MonopolyDataMaterial_PlayerResources: {
    props: dataMaterialProps(
      MONOPOLY_DATA_CSV_PATHS.playerResources,
      "player_runtime_fields",
    ),
    description:
      "플레이어 런타임 필드 — `dice_multiplier_current`(multiplier_id). 서버 `player_resources`와 동형.",
    example: {
      format: "csv",
      sourcePath: MONOPOLY_DATA_CSV_PATHS.playerResources,
      materialRole: "player_runtime_fields",
    },
  },
} as const;
