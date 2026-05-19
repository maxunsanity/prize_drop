import type { BootstrapData } from "./game/loadBoardData";
import { loadBootstrapData } from "./game/loadBoardData";
import { MonopolyGame } from "./game/MonopolyGame";

export function createMonopolyGame(data: BootstrapData): MonopolyGame {
  return new MonopolyGame(data);
}

/** 테스트·스크립트용 — UI 는 `loadBootstrapData` 단일 호출을 권장 */
export function bootstrapGame(): MonopolyGame {
  return createMonopolyGame(loadBootstrapData());
}

export type { BootstrapData } from "./game/loadBoardData";
