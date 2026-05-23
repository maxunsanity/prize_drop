/**
 * bootstrapGame.ts — CSV 로딩 + BoardCore 초기화
 * App.tsx에서 한 번만 호출
 */

import { loadStageConfigs, loadBlockConfigs, storage } from './data.js';
import { boardCore } from './BoardCore.js';
import type { StageConfig, BlockConfig } from './data.js';

export interface GameBootData {
  stageConfig: StageConfig;
  blockConfigs: BlockConfig[];
  allStages: StageConfig[];
}

let _bootData: GameBootData | null = null;

export async function bootstrapGame(stageId?: number): Promise<GameBootData> {
  const [allStages, blockConfigs] = await Promise.all([
    loadStageConfigs(),
    loadBlockConfigs(),
  ]);

  const targetStage = stageId ?? storage.getStage();
  const stageConfig = allStages.find(s => s.stageId === targetStage) ?? allStages[0];

  boardCore.init(stageConfig, blockConfigs);

  _bootData = { stageConfig, blockConfigs, allStages };
  return _bootData;
}

export function getBootData(): GameBootData | null {
  return _bootData;
}
