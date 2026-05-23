/**
 * App.tsx — 앱 루트 컴포넌트
 * PHASE 5: MAP ↔ GAME 스크린 전환 + localStorage 세션
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameJsonHud } from './jsonRender/GameJsonHud.js';
import { StageMap }    from './components/StageMap.tsx';
import { bootstrapGame } from './game/bootstrapGame.js';
import { board3d }       from './three/board3d.js';
import { attachInputHandlers } from './three/inputHandler.js';
import { progressStore }  from './game/progressStore.js';
import type { StageConfig } from './game/data.js';

type AppScreen = 'MAP' | 'GAME';

export function App(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef   = useRef<(() => void) | null>(null);

  const [screen,     setScreen    ] = useState<AppScreen>('MAP');
  const [loading,    setLoading   ] = useState(false);
  const [loadPct,    setLoadPct   ] = useState(0);
  const [allStages,  setAllStages ] = useState<StageConfig[]>([]);
  const [boardReady, setBoardReady] = useState(false);

  /* ── 최초 마운트: CSV 로드만 (Three.js는 GAME 진입 시) ── */
  useEffect(() => {
    bootstrapGame()
      .then(({ allStages: stages }) => {
        setAllStages(stages);
      })
      .catch(console.error);
  }, []);

  /* ── 스테이지 플레이 진입 ── */
  const handlePlayStage = useCallback(async (stageId: number): Promise<void> => {
    setLoading(true);
    setLoadPct(0);

    // 로딩 바 애니메이션
    const ticker = setInterval(() => {
      setLoadPct(p => Math.min(p + 18, 85));
    }, 70);

    // 해당 스테이지 초기화
    const { blockConfigs } = await bootstrapGame(stageId);
    clearInterval(ticker);
    setLoadPct(100);

    // 150ms 딜레이
    await new Promise(r => setTimeout(r, 150));

    // Three.js 초기화 (처음 한 번만) or 재사용
    const container = containerRef.current;
    if (!container) return;

    if (!boardReady) {
      board3d.init(container, blockConfigs);
      const canvas = container.querySelector('#dd-board-canvas') as HTMLElement | null;
      if (canvas) {
        const detach = attachInputHandlers(canvas);
        cleanupRef.current = (): void => {
          detach();
          board3d.dispose();
        };
      }
      setBoardReady(true);
    }

    setScreen('GAME');
    setLoading(false);
  }, [boardReady]);

  /* ── 맵으로 복귀 ── */
  const handleReturnToMap = useCallback((): void => {
    setScreen('MAP');
    // 맵 상태 최신화 (별점 등)
    setAllStages(prev => [...prev]);
  }, []);

  /* ── 클리어/실패 후 진행 저장 ── */
  const handleStageComplete = useCallback((stageId: number, stars: number, score: number): void => {
    progressStore.completeStage(stageId, stars, score);
    setAllStages(prev => [...prev]); // 리렌더 트리거
  }, []);

  /* ── 언마운트 시 정리 ── */
  useEffect(() => {
    return (): void => { cleanupRef.current?.(); };
  }, []);

  return (
    <div id="dd-app">
      {/* ── Three.js 캔버스 마운트 포인트 ── */}
      {/* HUD Top(84px) ~ HUD Bottom(164px) 사이 영역에만 렌더링 */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top:    84,   /* --hud-top-h */
          bottom: 164,  /* --hud-bottom-h */
          left:   0,
          right:  0,
          /* display:none → WebGL 캔버스가 StageMap 위에 그려지는 현상 방지 */
          display:       screen === 'GAME' ? 'block' : 'none',
          pointerEvents: screen === 'GAME' ? 'auto'  : 'none',
        }}
      />

      {/* ── 로딩 오버레이 ── */}
      {loading && (
        <div id="loading-overlay">
          <div className="loading-content">
            <div className="loading-title">♠ DOUBLE DOWN ♠</div>
            <div className="loading-bar-wrap">
              <div className="loading-bar-fill" style={{ width: `${loadPct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── 스테이지 맵 ── */}
      {screen === 'MAP' && !loading && allStages.length > 0 && (
        <StageMap
          allStages={allStages}
          onPlayStage={id => { handlePlayStage(id).catch(console.error); }}
        />
      )}

      {/* ── 첫 로드 전 스플래시 ── */}
      {screen === 'MAP' && !loading && allStages.length === 0 && (
        <div id="loading-overlay">
          <div className="loading-content">
            <div className="loading-title">♠ DOUBLE DOWN ♠</div>
            <div className="loading-bar-wrap">
              <div className="loading-bar-fill" style={{ width: '30%' }} />
            </div>
          </div>
        </div>
      )}

      {/* ── 게임 HUD (GAME 스크린일 때) ── */}
      {screen === 'GAME' && !loading && (
        <GameJsonHud
          onReturnToMap={handleReturnToMap}
          onStageComplete={handleStageComplete}
        />
      )}
    </div>
  );
}
