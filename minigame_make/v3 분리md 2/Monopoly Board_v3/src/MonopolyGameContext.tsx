import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type ReactElement,
} from "react";

import type { MonopolyGame } from "./game/MonopolyGame";
import type { GameSnapshot } from "./game/types";

const MonopolyGameContext = createContext<MonopolyGame | null>(null);

export function MonopolyGameProvider(props: {
  game: MonopolyGame;
  children: ReactNode;
}): ReactElement {
  const { game, children } = props;
  return (
    <MonopolyGameContext.Provider value={game}>
      {children}
    </MonopolyGameContext.Provider>
  );
}

export function useMonopolyGame(): MonopolyGame {
  const g = useContext(MonopolyGameContext);
  if (!g) throw new Error("useMonopolyGame: Provider 밖에서 사용됨");
  return g;
}

/** `getSnapshot()`은 매 호출 새 객체 — `useSyncExternalStore`에 넣지 말 것 */
export function useGameSnapshot(): GameSnapshot {
  const game = useMonopolyGame();
  const [snap, setSnap] = useState(() => game.getSnapshot());
  useEffect(() => {
    setSnap(game.getSnapshot());
    return game.subscribe(() => {
      setSnap(game.getSnapshot());
    });
  }, [game]);
  return snap;
}
