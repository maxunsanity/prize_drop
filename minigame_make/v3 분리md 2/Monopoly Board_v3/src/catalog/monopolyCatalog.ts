/**
 * 모노폴리 json-render **카탈로그 진입점** — 운영 UI + CSV 재료 + 액션.
 *
 * - 운영 UI: Registry JSX 와 1:1 (`monopolyCatalogOperationalUi`).
 * - 데이터 재료: 시트 1파일 = `MonopolyDataMaterial_*` (`monopolyCatalogStubsAndMaterials`).
 */

import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

import { monopolyCatalogOperationalUiComponents } from "./monopolyCatalogOperationalUi";
import { monopolyCatalogMaterialComponents } from "./monopolyCatalogStubsAndMaterials";

export const monopolySceneCatalogComponents = {
  ...monopolyCatalogOperationalUiComponents,
  ...monopolyCatalogMaterialComponents,
};

export const monopolyCatalog = defineCatalog(schema, {
  components: monopolySceneCatalogComponents,
  actions: {
    monopolyRollDice: {
      params: z.object({}),
      description: "idle 일 때 굴림 — MonopolyGame.rollDice.",
    },
    monopolyAckModal: {
      params: z.object({}),
      description:
        "result → confirmResult, ended → dismissEndScreen, idle+안내(notice) → dismissNotice.",
    },
  },
});

export type MonopolySceneCatalogComponents = typeof monopolySceneCatalogComponents;

export { hudBindProp, emptySceneProps } from "./monopolyCatalogShared";
export {
  monopolyCatalogMaterialComponents,
  monopolyGameDataCsvManifest,
} from "./monopolyCatalogStubsAndMaterials";
export {
  MONOPOLY_DATA_CSV_FILENAMES,
  MONOPOLY_DATA_CSV_PATHS,
  MONOPOLY_CSV_ORDER,
  type MonopolyDataCsvSheetId,
} from "../game/gameDataPaths";
