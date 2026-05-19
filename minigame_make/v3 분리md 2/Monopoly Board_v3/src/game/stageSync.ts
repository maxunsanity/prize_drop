import type { StageRow, StageRuntime } from "./types";

export function stageRowToRuntime(row: StageRow): StageRuntime {
  return {
    scale: row.scale,
    shutdown_base_reward: row.shutdown_base_reward,
    shutdown_hit_rate: row.shutdown_hit_rate,
    shutdown_blocked_rate: row.shutdown_blocked_rate,
    heist_reward_small: row.heist_reward_small,
    heist_reward_medium: row.heist_reward_medium,
    heist_reward_large: row.heist_reward_large,
    heist_rate_small: row.heist_rate_small,
    heist_rate_medium: row.heist_rate_medium,
    heist_rate_large: row.heist_rate_large,
    chance_dice_base: row.chance_dice_base,
  };
}

export function findStageRow(
  stages: StageRow[],
  stageId: number,
): StageRow {
  const row = stages.find((s) => s.stage_id === stageId);
  if (!row) throw new Error(`Unknown stage_id: ${stageId}`);
  return row;
}
