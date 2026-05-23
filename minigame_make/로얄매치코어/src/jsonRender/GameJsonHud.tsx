/**
 * GameJsonHud.tsx — HUD 컴포넌트
 * hudExternalStore로 상태 동기화
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { hudExternalStore } from '../game/hudExternalStore.js';
import { gameActions } from '../game/gameControlBridge.js';
import { boardCore } from '../game/BoardCore.js';
import type { GamePhase } from '../game/BoardCore.js';

/* ── 상태 훅 ── */
function useHudState(): Record<string, unknown> {
  const [state, setState] = useState<Record<string, unknown>>(
    hudExternalStore.getAll()
  );
  useEffect(() => {
    const unsub = hudExternalStore.subscribe(snap => setState({ ...snap }));
    return unsub;
  }, []);
  return state;
}

/* ── HUD 상단 ── */
function HudTop({
  state, onPause, onRestart,
}: {
  state: Record<string, unknown>;
  onPause: () => void;
  onRestart: () => void;
}): React.ReactElement {
  const moves   = state['moves.current'] as number ?? 0;
  const warning = state['moves.warning'] as boolean;
  const icon    = state['target.icon']   as string ?? '♥';
  const label   = state['target.label']  as string ?? 'COLLECT';
  const value   = state['target.value']  as string ?? '0';
  const score   = state['score.current'] as number ?? 0;

  const [movesBump,  setMovesBump ] = useState(false);
  const [targetPunch,setTargetPunch] = useState(false);
  const [scoreFlash, setScoreFlash] = useState(false);
  const prevMoves  = useRef(moves);
  const prevTarget = useRef(value);
  const prevScore  = useRef(score);

  useEffect(() => {
    if (prevMoves.current !== moves) {
      prevMoves.current = moves;
      setMovesBump(true);
      setTimeout(() => setMovesBump(false), 320);
    }
  }, [moves]);

  useEffect(() => {
    if (prevTarget.current !== value) {
      prevTarget.current = value;
      setTargetPunch(true);
      setTimeout(() => setTargetPunch(false), 280);
    }
  }, [value]);

  useEffect(() => {
    if (prevScore.current !== score) {
      prevScore.current = score;
      setScoreFlash(true);
      setTimeout(() => setScoreFlash(false), 360);
    }
  }, [score]);

  return (
    <div className="game-hud-top">
      {/* 왼쪽: 메뉴 버튼 */}
      <button className="hud-btn" onClick={onPause}>☰</button>

      <div className="hud-target">
        <span className="hud-target-icon">{icon}</span>
        <div className="hud-target-info">
          <span className="hud-target-label">{label}</span>
          <span className={`hud-target-value${targetPunch ? ' punch' : ''}`}>{value}</span>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
        <div className="hud-moves">
          <span className="hud-moves-label">MOVES</span>
          <span className={`hud-moves-value${warning ? ' warning' : ''}${movesBump ? ' bump' : ''}`}>
            {moves}
          </span>
        </div>
        <div className="hud-score">
          <span className="hud-score-label">SCORE</span>
          <span className={`hud-score-value${scoreFlash ? ' flash' : ''}`}>
            {score.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 오른쪽: 재시작 버튼 (항상 보임) */}
      <button className="hud-btn hud-restart-btn" onClick={onRestart} title="다시 시작">↺</button>
    </div>
  );
}

/* ── 스타 게이지 ── */
function StarGauge({ state }: { state: Record<string, unknown> }): React.ReactElement {
  const pct  = state['stars.pct3'] as number ?? 0;
  const stars = state['stars.count'] as number ?? 0;
  return (
    <div className="star-gauge">
      <span className="star-gauge-label">SCORE</span>
      <div className="star-gauge-bar">
        <div className="star-gauge-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="star-gauge-stars">
        {'⭐'.repeat(Math.max(0, Math.min(3, stars)))}
        {'☆'.repeat(Math.max(0, 3 - Math.min(3, stars)))}
      </div>
    </div>
  );
}

/* ── 아이템 슬롯 ── */
function ItemSlots({ state }: { state: Record<string, unknown> }): React.ReactElement {
  const items = [
    { key: 'hammer', icon: '🔨', label: 'HAMMER', action: 'item.use.HAMMER' },
    { key: 'hand',   icon: '✋', label: 'HAND',   action: 'item.use.HAND'   },
    { key: 'claw',   icon: '🦞', label: 'CLAW',   action: 'item.use.CLAW'   },
  ] as const;

  return (
    <div className="item-slots">
      {items.map(item => {
        const count  = state[`item.${item.key}.count`]  as number  ?? 3;
        const active = state[`item.${item.key}.active`] as boolean ?? false;
        return (
          <div
            key={item.key}
            className={`item-slot${active ? ' active' : ''}`}
            onClick={() => gameActions[item.action]()}
            style={{ position: 'relative' }}
          >
            <div className="item-slot-icon">
              {item.icon}
            </div>
            {count > 0 && (
              <span style={{
                position: 'absolute', top: 0, right: 0,
                background: '#f5a623', color: '#0f172a',
                fontSize: 9, fontWeight: 900,
                borderRadius: '50%', width: 16, height: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {count}
              </span>
            )}
            <span className="item-slot-label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── HUD 하단 (기본 — 아이템 슬롯 내장) ── */
function HudBottom({ state }: { state: Record<string, unknown> }): React.ReactElement {
  return (
    <div className="game-hud-bottom">
      <StarGauge state={state} />
      <ItemSlots state={state} />
    </div>
  );
}
// HudBottom은 EntryModal에서 참조하지 않지만 향후 활용 여지 있어 보존
void HudBottom;

/* ── 엔트리 모달 ── */
function EntryModal({
  state, onStart, onMap,
}: {
  state: Record<string, unknown>;
  onStart: () => void;
  onMap: () => void;
}): React.ReactElement {
  const icon  = state['target.icon']  as string ?? '♥';
  const label = state['target.label'] as string ?? 'COLLECT';
  const value = state['target.value'] as string ?? '0';
  const moves = state['moves.current'] as number ?? 25;
  const stageId = state['stage.id'] as number ?? 1;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-title">STAGE {stageId}</div>
        <div className="mission-box">
          <span className="mission-label">MISSION</span>
          <span className="mission-icon">{icon}</span>
          <span className="mission-value">
            {label === 'COLLECT' ? `${value} × ${icon}` : `${value} pts`}
          </span>
          <span className="mission-sub">{moves} MOVES</span>
        </div>
        <div className="wallet-row">
          <div className="wallet-chip">
            <span>🪙</span>
            <span className="wallet-chip-value">500</span>
          </div>
          <div className="wallet-chip">
            <span>💎</span>
            <span className="wallet-chip-value">0</span>
          </div>
        </div>
        <button className="btn-primary" onClick={onStart}>▶ PLAY!</button>
        <button className="btn-ghost" onClick={onMap}>🗺 Map</button>
      </div>
    </div>
  );
}

/* ── 성공 모달 (별 통!통!통! 순차 팝) ── */
function SuccessModal({
  stars, score, onNext, onRetry, onMap,
}: {
  stars: number; score: number;
  onNext: () => void; onRetry: () => void; onMap: () => void;
}): React.ReactElement {
  const [poppedStars, setPoppedStars] = useState(0);

  useEffect(() => {
    let idx = 0;
    const pop = (): void => {
      if (idx >= stars) return;
      idx++;
      setPoppedStars(idx);
      setTimeout(pop, 380);
    };
    const t = setTimeout(pop, 400);
    return () => clearTimeout(t);
  }, [stars]);

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-title">✨ STAGE CLEAR!</div>
        <div className="star-reveal">
          {[1, 2, 3].map(i => (
            <span
              key={i}
              className={`star${i <= poppedStars ? ' pop' : ''}`}
              style={{ fontSize: 44, opacity: i <= poppedStars ? 1 : 0.2 }}
            >
              {i <= stars ? '⭐' : '☆'}
            </span>
          ))}
        </div>
        <div className="reward-row">
          <span>🪙</span>
          <span className="reward-coin">+{score.toLocaleString()}</span>
        </div>
        <button className="btn-gold" onClick={onNext}>NEXT STAGE →</button>
        <button className="btn-ghost" onClick={onRetry}>Play Again</button>
        <button className="btn-ghost" onClick={onMap}>🗺 Map</button>
      </div>
    </div>
  );
}

/* ── 실패 모달 ── */
function FailModal({ onRetry, onMap }: { onRetry: () => void; onMap: () => void }): React.ReactElement {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="fail-icon">😢</div>
        <div className="modal-title">OUT OF MOVES</div>
        <div className="fail-remaining">
          <div className="fail-remaining-label">Continue with coins?</div>
          <div className="fail-remaining-value">+5 MOVES · 900 🪙</div>
        </div>
        <button className="btn-gold">🪙 Continue</button>
        <button className="btn-ghost" onClick={onRetry}>Try Again</button>
        <button className="btn-ghost" onClick={onMap}>🗺 Map</button>
      </div>
    </div>
  );
}

/* ── 일시정지 모달 ── */
function PauseModal({
  onResume,
  onRestart,
  onMap,
}: {
  onResume: () => void;
  onRestart: () => void;
  onMap: () => void;
}): React.ReactElement {
  return (
    <div className="modal-overlay" style={{ zIndex: 55 }}>
      <div className="modal-card">
        <div className="modal-title" style={{ fontSize: 20, letterSpacing: 2 }}>⏸ 일시정지</div>
        <button className="btn-primary" onClick={onResume}>▶ 계속하기</button>
        <button className="btn-ghost" onClick={onRestart}>↺ 다시 시작</button>
        <button className="btn-ghost" onClick={onMap}>🗺 스테이지 맵</button>
      </div>
    </div>
  );
}

/* ── 재시작 확인 모달 ── */
function RestartConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}): React.ReactElement {
  return (
    <div className="modal-overlay" style={{ zIndex: 55 }}>
      <div className="modal-card">
        <div style={{ fontSize: 36 }}>🔄</div>
        <div className="modal-title" style={{ fontSize: 18 }}>다시 시작할까요?</div>
        <div style={{ fontSize: 11, color: 'var(--slate)', textAlign: 'center', lineHeight: 1.5 }}>
          현재 진행 상황이 초기화됩니다.
        </div>
        <button className="btn-gold" onClick={onConfirm}>↺ 다시 시작</button>
        <button className="btn-ghost" onClick={onCancel}>취소</button>
      </div>
    </div>
  );
}

/* ── 보너스 타임 배너 ── */
function BonusTimeBanner({ onDone }: { onDone: () => void }): React.ReactElement {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => { setVisible(false); onDone(); }, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);
  return (
    <div style={{
      position: 'absolute', top: '18%', left: 0, right: 0,
      display: 'flex', justifyContent: 'center', zIndex: 30,
      pointerEvents: 'none',
      transition: 'opacity 0.3s, transform 0.4s',
      opacity: visible ? 1 : 0,
      transform: visible ? 'scale(1)' : 'scale(0.7)',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #f5a623, #e8940f)',
        borderRadius: 18, padding: '14px 36px',
        border: '2px solid rgba(255,255,255,0.3)',
        boxShadow: '0 0 40px rgba(245,166,35,0.7)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 3, color: '#0f172a', marginBottom: 2 }}>
          ✨ BONUS TIME ✨
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>
          남은 이동 소모 중!
        </div>
      </div>
    </div>
  );
}

/* ── 아이템 Announce 오버레이 (FX.md §10) ── */
interface AnnounceData {
  icon: string;
  name: string;
  desc: string;
}
function ItemAnnounce({ data, onDone }: { data: AnnounceData; onDone: () => void }): React.ReactElement {
  const [phase, setPhase] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 0: 딤 + 아이콘 팝
    timerRef.current = setTimeout(() => setPhase(1), 100);   // 이름 fade
    timerRef.current = setTimeout(() => setPhase(2), 300);   // 설명 fade
    timerRef.current = setTimeout(() => setPhase(3), 900);   // 힌트 blink
    timerRef.current = setTimeout(() => { onDone(); }, 2000); // 완료
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [onDone]);

  return (
    <div id="item-announce-overlay" className="active">
      <div id="announce-icon" className="show">{data.icon}</div>
      <div id="announce-name" className={phase >= 1 ? 'show' : ''}>{data.name}</div>
      <div id="announce-desc" className={phase >= 2 ? 'show' : ''}>{data.desc}</div>
      <div id="announce-hint" className={phase >= 3 ? 'show' : ''}>TAP TO USE!</div>
    </div>
  );
}

const ITEM_ANNOUNCE_DATA: Record<string, AnnounceData> = {
  HAMMER: { icon: '🔨', name: 'HAMMER', desc: '블록 1개를 즉시 파괴합니다.\n어디든 탭하세요.' },
  HAND:   { icon: '✋', name: 'HAND',   desc: '블록을 어디든 이동시킵니다.\n이동할 블록을 탭하세요.' },
  CLAW:   { icon: '🦞', name: 'CLAW',   desc: '2개의 블록을 연속 파괴합니다.\n첫 번째 블록을 탭하세요.' },
};

/* ── 메인 HUD 컴포넌트 ── */
export function GameJsonHud({
  onReturnToMap,
  onStageComplete,
}: {
  onReturnToMap: () => void;
  onStageComplete: (stageId: number, stars: number, score: number) => void;
}): React.ReactElement {
  const state = useHudState();
  const [gameStarted, setGameStarted] = useState(false);
  const [successData, setSuccessData] = useState<{ stars: number; score: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const [bonusTimeActive, setBonusTimeActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [announceItem, setAnnounceItem] = useState<AnnounceData | null>(null);
  const pendingItemRef = useRef<'HAMMER' | 'HAND' | 'CLAW' | null>(null);

  useEffect(() => {
    const unsub = boardCore.on(e => {
      if (e.type === 'SUCCESS') {
        const stageId = boardCore.stageConfig?.stageId ?? 1;
        onStageComplete(stageId, e.stars, e.score);
        setSuccessData({ stars: e.stars, score: e.score });
        setBonusTimeActive(false);
      } else if (e.type === 'FAIL') {
        setFailed(true);
        setBonusTimeActive(false);
      } else if (e.type === 'BONUS_TIME_START') {
        setBonusTimeActive(true);
      } else if (e.type === 'BONUS_TIME_END') {
        setBonusTimeActive(false);
      }
    });
    return unsub;
  }, [onStageComplete]);

  const handleStart = useCallback((): void => {
    setGameStarted(true);
    setSuccessData(null);
    setFailed(false);
  }, []);

  const handleRetry = useCallback((): void => {
    gameActions['modal.retry']();
    setSuccessData(null);
    setFailed(false);
    setBonusTimeActive(false);
    setPaused(false);
    setShowRestartConfirm(false);
    setGameStarted(true);
  }, []);

  const handlePause = useCallback((): void => {
    setPaused(true);
  }, []);

  const handleResume = useCallback((): void => {
    setPaused(false);
  }, []);

  // ↺ 버튼 클릭 → 확인 모달
  const handleRestartRequest = useCallback((): void => {
    setShowRestartConfirm(true);
  }, []);

  const handleNext = useCallback((): void => {
    gameActions['modal.next']();
    setSuccessData(null);
    setFailed(false);
    setBonusTimeActive(false);
    setGameStarted(false); // 다음 스테이지 엔트리 모달 표시
  }, []);

  // 아이템 클릭 → announce 시퀀스 후 실제 활성화
  const handleItemClick = useCallback((itemKey: 'HAMMER' | 'HAND' | 'CLAW'): void => {
    const data = ITEM_ANNOUNCE_DATA[itemKey];
    if (!data) return;
    pendingItemRef.current = itemKey;
    setAnnounceItem(data);
  }, []);

  const handleAnnounceDone = useCallback((): void => {
    setAnnounceItem(null);
    // announce 완료 후 실제 아이템 활성화
    if (pendingItemRef.current) {
      const key = `item.use.${pendingItemRef.current}` as
        'item.use.HAMMER' | 'item.use.HAND' | 'item.use.CLAW';
      gameActions[key]();
      pendingItemRef.current = null;
    }
  }, []);

  const phase = state['stage.phase'] as GamePhase | undefined;
  void phase;

  return (
    <>
      {/* 비네팅 */}
      <div id="vignette-overlay" />

      {/* 게임 진행 중 HUD — bonusTime에도 HudTop은 유지 (↺ 버튼 항상 접근 가능) */}
      {gameStarted && !successData && !failed && (
        <>
          <HudTop
            state={state}
            onPause={handlePause}
            onRestart={handleRestartRequest}
          />
          {!bonusTimeActive && (
            <HudBottomWithAnnounce state={state} onItemClick={handleItemClick} />
          )}
        </>
      )}

      {/* 일시정지 모달 */}
      {paused && !showRestartConfirm && (
        <PauseModal
          onResume={handleResume}
          onRestart={() => { setPaused(false); setShowRestartConfirm(true); }}
          onMap={onReturnToMap}
        />
      )}

      {/* 재시작 확인 모달 */}
      {showRestartConfirm && (
        <RestartConfirmModal
          onConfirm={handleRetry}
          onCancel={() => setShowRestartConfirm(false)}
        />
      )}

      {/* 보너스 타임 배너 */}
      {bonusTimeActive && (
        <BonusTimeBanner onDone={() => setBonusTimeActive(false)} />
      )}

      {/* 아이템 announce */}
      {announceItem && (
        <ItemAnnounce data={announceItem} onDone={handleAnnounceDone} />
      )}

      {/* 아이템 오버레이 없을 때 기본 빈 오버레이 (CSS transition용) */}
      {!announceItem && (
        <div id="item-announce-overlay">
          <div id="announce-icon" /><div id="announce-name" />
          <div id="announce-desc" /><div id="announce-hint">TAP TO USE!</div>
        </div>
      )}

      {/* 모달 */}
      {!gameStarted && !successData && !failed && (
        <EntryModal state={state} onStart={handleStart} onMap={onReturnToMap} />
      )}
      {successData && (
        <SuccessModal
          stars={successData.stars}
          score={successData.score}
          onNext={handleNext}
          onRetry={handleRetry}
          onMap={onReturnToMap}
        />
      )}
      {failed && <FailModal onRetry={handleRetry} onMap={onReturnToMap} />}
    </>
  );
}

/* ── 아이템 슬롯 (announce 연결 버전) ── */
function HudBottomWithAnnounce({
  state,
  onItemClick,
}: {
  state: Record<string, unknown>;
  onItemClick: (item: 'HAMMER' | 'HAND' | 'CLAW') => void;
}): React.ReactElement {
  const items = [
    { key: 'hammer' as const, icon: '🔨', label: 'HAMMER', itemKey: 'HAMMER' as const },
    { key: 'hand'   as const, icon: '✋', label: 'HAND',   itemKey: 'HAND'   as const },
    { key: 'claw'   as const, icon: '🦞', label: 'CLAW',   itemKey: 'CLAW'   as const },
  ];
  return (
    <div className="game-hud-bottom">
      <StarGauge state={state} />
      <div className="item-slots">
        {items.map(item => {
          const count  = state[`item.${item.key}.count`]  as number  ?? 3;
          const active = state[`item.${item.key}.active`] as boolean ?? false;
          return (
            <div
              key={item.key}
              className={`item-slot${active ? ' active' : ''}`}
              onClick={() => onItemClick(item.itemKey)}
              style={{ position: 'relative' }}
            >
              <div className="item-slot-icon">{item.icon}</div>
              {count > 0 && (
                <span style={{
                  position: 'absolute', top: 0, right: 0,
                  background: '#f5a623', color: '#0f172a',
                  fontSize: 9, fontWeight: 900,
                  borderRadius: '50%', width: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{count}</span>
              )}
              <span className="item-slot-label">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
