import { useLayoutEffect, useMemo, type ReactElement } from "react";

import type { BootstrapData } from "./game/loadBoardData";
import { MonopolyGameProvider } from "./MonopolyGameContext";
import { PlayUiProvider } from "./playUiContext";
import {
  attachMonopolyGameHooks,
  detachMonopolyGameHooks,
} from "./game/gameControlBridge";
import { attachMonopolyHudSync } from "./game/syncMonopolyHud";
import { MonopolyGame } from "./game/MonopolyGame";
import { GameJsonMonopoly } from "./jsonRender/GameJsonMonopoly";
import { SeasonEndOverlay } from "./SeasonEndOverlay";
import "./wireframe.css";

export function MonopolyShell(props: {
  bootstrap: BootstrapData;
}): ReactElement {
  const { bootstrap } = props;
  const game = useMemo(() => new MonopolyGame(bootstrap), [bootstrap]);

  useLayoutEffect(() => {
    const detachHud = attachMonopolyHudSync(game);
    attachMonopolyGameHooks({
      rollDice: () => {
        game.rollDice();
      },
      ackModal: () => {
        const s = game.getSnapshot();
        if (s.phase === "result") game.confirmResult();
        else if (s.phase === "ended") game.dismissEndScreen();
        else if (s.phase === "idle" && s.modal?.kind === "notice")
          game.dismissNotice();
      },
    });
    return () => {
      detachHud();
      detachMonopolyGameHooks();
      game.destroy();
    };
  }, [game]);

  return (
    <MonopolyGameProvider game={game}>
      <PlayUiProvider>
        <>
          <GameJsonMonopoly />
          <SeasonEndOverlay />
        </>
      </PlayUiProvider>
    </MonopolyGameProvider>
  );
}
