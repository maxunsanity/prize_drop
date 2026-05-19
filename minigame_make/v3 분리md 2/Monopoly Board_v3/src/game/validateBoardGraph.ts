import type { BoardCellRow, BoardTile } from "./types";

const LAND_TYPES: readonly string[] = [
  "LAND_S1",
  "LAND_S2",
  "LAND_S3",
  "LAND_S4",
  "LAND_S5",
  "LAND_S6",
  "LAND_S7",
  "LAND_S8",
];

/** `04_board_cells.kind` 가 `board_tile_config.tile_type` 과 어떻게 대응하는지 */
export function allowedTileTypesForCell(cell: BoardCellRow): string[] {
  switch (cell.kind) {
    case "go_landing":
      return ["GO"];
    case "property":
      return [...LAND_TYPES];
    case "community_chest":
      return ["COMMUNITY"];
    case "tax_low":
      return ["TAX_LOW"];
    case "tax_high":
      return ["TAX_HIGH"];
    case "station":
      return ["STATION"];
    case "chance":
      return ["CHANCE"];
    case "corner_visit":
      return ["CORNER_VISIT"];
    case "corner_park":
      return ["CORNER_PARK"];
    case "utility":
      return ["UTILITY_1", "UTILITY_2"];
    case "jail_visit":
      return ["CORNER_JAIL"];
  }
}

/**
 * `board_tile_config` · `02_tile_entities` 와 `04_board_cells` 교차 검증.
 * 불일치 시 부트가即 실패해 데이터 깨짐을 막는다.
 */
export function assertBoardGraphConsistent(
  tiles: BoardTile[],
  cells: BoardCellRow[],
  entityKeys: Set<string>,
): void {
  if (tiles.length !== 40)
    throw new Error(`board_tile_config: 내부 기대 40칸, 실제 ${tiles.length}`);
  if (cells.length !== 40) {
    throw new Error(`board_cells: 40행 기대, 실제 ${cells.length}`);
  }

  const byPos = new Map<number, BoardCellRow>();
  for (const c of cells) {
    if (c.position < 0 || c.position > 39) {
      throw new Error(`board_cells: position 범위 오류 ${c.position}`);
    }
    if (byPos.has(c.position)) {
      throw new Error(`board_cells: position ${c.position} 중복`);
    }
    byPos.set(c.position, c);
  }
  if (byPos.size !== 40) {
    throw new Error("board_cells: 0–39 전 구간을 채워야 함");
  }

  for (let i = 0; i < cells.length; i++) {
    if (cells[i]!.position !== i) {
      throw new Error(
        `board_cells: position 오름차순 40행 기대 — ${i}번째 행 position=${cells[i]!.position}`,
      );
    }
  }

  for (let p = 0; p < 40; p++) {
    const cell = byPos.get(p)!;
    const tile = tiles[p];
    if (!tile || tile.tile_index !== p) {
      throw new Error(`board_tile_config: tile_index ${p} 행 없음 또는 불일치`);
    }
    const allowed = allowedTileTypesForCell(cell);
    if (!allowed.includes(tile.tile_type)) {
      throw new Error(
        `보드 정합 오류 position ${p}: cells.kind=${cell.kind} 인데 tile_type=${tile.tile_type} (허용: ${allowed.join(", ")})`,
      );
    }
    const ek = cell.entity_key.trim();
    if (ek !== "" && !entityKeys.has(ek)) {
      throw new Error(
        `board_cells position ${p}: entity_key "${ek}" 가 02_tile_entities 에 없음`,
      );
    }
  }
}
