import { parseCsv, rowsToObjects } from "./parseCsv";

const rawSheets = import.meta.glob<string>("../../game_data/*.csv", {
  query: "?raw",
  import: "default",
  eager: true,
});

export type FlowMeta = {
  flow_name: string;
  version: string;
  exported_at: string;
  node_count: string;
  edge_count: string;
  source_json: string;
};

export type LoadedMonopolyData = {
  flowMeta: FlowMeta | null;
  simulationDefaults: Record<"key" | "value" | "attr_type", string>[];
  tileEntities: Record<
    "entity_key" | "base_reward" | "display_name" | "description",
    string
  >[];
  entityDesignSamples: Record<
    "entity_key" | "design_sample_cell_index",
    string
  >[];
  boardStage: Record<string, string>[];
  boardCells: Record<"position" | "kind" | "entity_key" | "notes", string>[];
  randomBranchRules: Record<string, string>[];
  projectResources: Record<string, string>[];
};

function loadSheet<T extends string>(
  filename: string,
  headers: readonly T[],
): Record<T, string>[] {
  const path = `../../game_data/${filename}`;
  const text = rawSheets[path];
  if (!text) return [];
  const matrix = parseCsv(text);
  if (matrix.length < 2) return [];
  const head = matrix[0]!;
  if (head.length !== headers.length || head.some((h, i) => h !== headers[i])) {
    console.warn("CSV header mismatch:", filename, head, headers);
  }
  const body = matrix.slice(1);
  return rowsToObjects([...headers], body);
}

export function loadGameData(): LoadedMonopolyData {
  const flowRows = loadSheet("00_flow_meta.csv", [
    "flow_name",
    "version",
    "exported_at",
    "node_count",
    "edge_count",
    "source_json",
  ] as const);

  return {
    flowMeta: flowRows[0] ?? null,
    simulationDefaults: loadSheet("01_simulation_defaults.csv", [
      "key",
      "value",
      "attr_type",
    ] as const),
    tileEntities: loadSheet("02_tile_entities.csv", [
      "entity_key",
      "base_reward",
      "display_name",
      "description",
    ] as const),
    entityDesignSamples: loadSheet("02b_entity_design_samples.csv", [
      "entity_key",
      "design_sample_cell_index",
    ] as const),
    boardStage: loadSheet("03_board_stage_economy.csv", [
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
    ] as const),
    boardCells: loadSheet("04_board_cells.csv", [
      "position",
      "kind",
      "entity_key",
      "notes",
    ] as const),
    randomBranchRules: loadSheet("05_random_branch_rules.csv", [
      "node_id",
      "rule_id",
      "condition",
      "note",
    ] as const),
    projectResources: loadSheet("06_project_resources.csv", [
      "resource_key",
      "name",
      "description",
      "color",
      "icon",
      "order",
      "project_slug",
    ] as const),
  };
}
