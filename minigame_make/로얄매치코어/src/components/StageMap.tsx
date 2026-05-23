/**
 * StageMap.tsx — 카지노 테마 스테이지 맵 로비
 * PHASE 5: 게임 루프 완성
 */

import React, { useEffect, useState } from 'react';
import type { StageConfig } from '../game/data.js';
import { progressStore } from '../game/progressStore.js';

interface StageMapProps {
  allStages:   StageConfig[];
  onPlayStage: (stageId: number) => void;
}

interface NodeState {
  status: 'locked' | 'available' | 'completed';
  stars:  number;
}

function getNodeStates(stages: StageConfig[]): NodeState[] {
  return stages.map(s => {
    const prog = progressStore.getStageProgress(s.stageId);
    const unlocked = progressStore.isUnlocked(s.stageId, stages.length);
    if (!unlocked) return { status: 'locked',    stars: 0 };
    if (prog.completed)  return { status: 'completed', stars: prog.stars };
    return { status: 'available', stars: 0 };
  });
}

/* ── 스테이지 노드 ── */
function StageNode({
  stage, nodeState, onTap, index,
}: {
  stage: StageConfig;
  nodeState: NodeState;
  onTap: () => void;
  index: number;
}): React.ReactElement {
  const { status, stars } = nodeState;

  const isLocked    = status === 'locked';
  const isCompleted = status === 'completed';
  const isAvailable = status === 'available';

  const nodeColor =
    isCompleted  ? 'linear-gradient(135deg,#16a34a,#15803d)' :
    isAvailable  ? 'linear-gradient(135deg,#f5a623,#e8940f)' :
                   'linear-gradient(135deg,#1e293b,#0f172a)';

  const borderColor =
    isCompleted  ? '#4ade80' :
    isAvailable  ? '#fbbf24' :
                   '#334155';

  return (
    <div style={{
      display:        'flex',
      flexDirection:  index % 2 === 0 ? 'row' : 'row-reverse',
      alignItems:     'center',
      gap:            16,
      marginBottom:   12,
    }}>
      {/* 스테이지 노드 버튼 */}
      <button
        onClick={isLocked ? undefined : onTap}
        disabled={isLocked}
        style={{
          width:        64,
          height:       64,
          borderRadius: '50%',
          background:   nodeColor,
          border:       `3px solid ${borderColor}`,
          boxShadow:    isAvailable
            ? '0 0 20px rgba(245,166,35,0.7), 0 4px 0 #b45309'
            : isCompleted
              ? '0 0 12px rgba(74,222,128,0.4), 0 3px 0 #14532d'
              : '0 2px 0 #0a0f1a',
          cursor:       isLocked ? 'default' : 'pointer',
          display:      'flex',
          flexDirection:'column',
          alignItems:   'center',
          justifyContent:'center',
          transition:   'transform 0.1s',
          transform:    'scale(1)',
          flexShrink:   0,
          position:     'relative',
        }}
        onPointerDown={e => {
          if (!isLocked) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.92)';
        }}
        onPointerUp={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        {isLocked ? (
          <span style={{ fontSize: 20 }}>🔒</span>
        ) : (
          <>
            <span style={{
              fontSize: 10, fontWeight: 800,
              color: isAvailable ? '#0f172a' : '#fff',
              letterSpacing: 1, lineHeight: 1,
            }}>STAGE</span>
            <span style={{
              fontSize: 22, fontWeight: 900,
              color: isAvailable ? '#0f172a' : '#fff',
              lineHeight: 1,
            }}>{stage.stageId}</span>
          </>
        )}

        {/* 완료 체크 */}
        {isCompleted && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            background: '#4ade80', borderRadius: '50%',
            width: 20, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}>✓</div>
        )}
      </button>

      {/* 스테이지 정보 */}
      <div style={{
        background:   'rgba(15,23,42,0.85)',
        borderRadius: 14,
        padding:      '10px 14px',
        border:       `1px solid ${isAvailable ? 'rgba(245,166,35,0.3)' : 'rgba(255,255,255,0.06)'}`,
        flex:         1,
        opacity:      isLocked ? 0.4 : 1,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 800, color: '#94a3b8',
          letterSpacing: 1, marginBottom: 3,
        }}>
          {stage.missionType === 'BLOCK_COLLECTION'
            ? `COLLECT × ${stage.targetBlockCount}`
            : `SCORE ${stage.targetScore}`}
        </div>
        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6 }}>
          {stage.movesGiven} MOVES · {stage.difficulty.toUpperCase()}
        </div>
        {/* 별점 */}
        <div style={{ display: 'flex', gap: 3 }}>
          {[1, 2, 3].map(i => (
            <span key={i} style={{
              fontSize: 14,
              opacity: i <= stars ? 1 : 0.2,
              filter:  i <= stars ? 'none' : 'grayscale(1)',
            }}>⭐</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 연결 경로 ── */
function PathConnector({ completed }: { completed: boolean }): React.ReactElement {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      marginBottom: 4,
    }}>
      <div style={{
        width:        3,
        height:       28,
        background:   completed
          ? 'linear-gradient(180deg,#4ade80,#16a34a)'
          : 'rgba(255,255,255,0.1)',
        borderRadius: 2,
      }} />
    </div>
  );
}

/* ── StageMap 메인 ── */
export function StageMap({ allStages, onPlayStage }: StageMapProps): React.ReactElement {
  const [nodeStates, setNodeStates] = useState<NodeState[]>(() => getNodeStates(allStages));
  const progress = progressStore.get();
  const coins = progress.coins;

  // 마운트 시 최신 상태 리로드
  useEffect(() => {
    setNodeStates(getNodeStates(allStages));
  }, [allStages]);

  return (
    <div style={{
      position:    'absolute',
      inset:       0,
      background:  'radial-gradient(circle at 50% 35%, #0e3d26 0%, #051c11 100%)',
      display:     'flex',
      flexDirection:'column',
      overflowY:   'auto',
      overflowX:   'hidden',
    }}>
      {/* 헤더 */}
      <div style={{
        padding:        '20px 20px 12px',
        background:     'rgba(0,0,0,0.4)',
        borderBottom:   '1px solid rgba(245,166,35,0.2)',
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        flexShrink:     0,
        position:       'sticky',
        top:            0,
        zIndex:         10,
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#f5a623', letterSpacing: 2 }}>
            ♠ DOUBLE DOWN ♠
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: 1 }}>
            STAGE SELECT
          </div>
        </div>
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          8,
          background:   'rgba(15,23,42,0.9)',
          border:       '1px solid rgba(245,166,35,0.3)',
          borderRadius: 14,
          padding:      '6px 14px',
        }}>
          <span style={{ fontSize: 18 }}>🪙</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24' }}>
            {coins.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 스테이지 노드 목록 */}
      <div style={{ padding: '16px 20px 40px', flex: 1 }}>
        {allStages.map((stage, i) => (
          <React.Fragment key={stage.stageId}>
            <StageNode
              stage={stage}
              nodeState={nodeStates[i]}
              index={i}
              onTap={() => {
                progressStore.setCurrentStage(stage.stageId);
                onPlayStage(stage.stageId);
              }}
            />
            {i < allStages.length - 1 && (
              <PathConnector completed={nodeStates[i]?.status === 'completed'} />
            )}
          </React.Fragment>
        ))}

        {/* 더 많은 스테이지 예고 */}
        <div style={{
          textAlign:    'center',
          padding:      '20px 0',
          color:        '#334155',
          fontSize:     13,
          fontWeight:   700,
          letterSpacing:1,
        }}>
          • • • MORE STAGES COMING • • •
        </div>
      </div>
    </div>
  );
}
