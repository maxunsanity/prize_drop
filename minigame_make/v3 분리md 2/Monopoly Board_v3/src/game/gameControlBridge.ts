/**
 * `MonopolyGame` 과 React+json-render 액션 핸들러 사이 얇은 다리.
 */

const noop = (): void =>
  console.warn("[monopoly-bridge] 게임 훅 미연결");

let rollDiceHook: () => void = noop;
let ackModalHook: () => void = noop;

export function attachMonopolyGameHooks(cmd: {
  rollDice: () => void;
  ackModal: () => void;
}): void {
  rollDiceHook = cmd.rollDice;
  ackModalHook = cmd.ackModal;
}

export function detachMonopolyGameHooks(): void {
  rollDiceHook = noop;
  ackModalHook = noop;
}

/** 카탈로그 액션 `monopolyRollDice`. */
export function requestMonopolyRollDice(): void {
  rollDiceHook();
}

/** 카탈로그 액션 `monopolyAckModal` — result 면 confirm, ended 면 dismiss. */
export function requestMonopolyAckModal(): void {
  ackModalHook();
}
