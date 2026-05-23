/**
 * audioSystem.ts — Web Audio API 기반 SFX
 * FX.md §14 Web Audio 합성 스펙
 * 파일 없이 오실레이터만으로 모든 사운드 합성
 */

/* ── AudioContext 싱글톤 ── */
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!_ctx) {
    try {
      _ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  // iOS Safari: 사용자 제스처 후 resume 필요
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

/* ── 기본 SFX 합성기 ── */
function playSFX(
  freq: number,
  type: OscillatorType,
  duration: number,
  gain = 0.15,
  freqEnd?: number,
): void {
  const ctx = getCtx();
  if (!ctx) return;

  const osc  = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const master = ctx.createGain();
  master.gain.value = 0.4; // 마스터 볼륨

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(0.001, freqEnd),
      ctx.currentTime + duration
    );
  }

  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gainNode);
  gainNode.connect(master);
  master.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/* ── 복합 SFX (여러 오실레이터 합성) ── */
function playChord(
  freqs: number[],
  type: OscillatorType,
  duration: number,
  gain = 0.08,
): void {
  freqs.forEach((f, i) => {
    setTimeout(() => playSFX(f, type, duration, gain), i * 15);
  });
}

/* ── 사운드 이벤트 맵 ── */
export const audio = {
  /** 블록 탭 */
  tap(): void {
    playSFX(440, 'sine', 0.08, 0.10);
  },

  /** 스왑 실패 */
  swapFail(): void {
    playSFX(220, 'sine', 0.20, 0.12, 180);
  },

  /** 3매치 폭발 */
  match3(combo = 1): void {
    const baseFreq = 440;
    const freq = baseFreq * Math.pow(1.05, combo - 1); // 콤보마다 5% 피치 상승
    playSFX(freq, 'triangle', 0.12, 0.14);
  },

  /** 콤보 (연속 체인) */
  combo(count: number): void {
    const baseFreq = 523;
    const freq = baseFreq * Math.pow(1.05, count - 1);
    playSFX(freq, 'triangle', 0.15, 0.18);
    if (count >= 3) {
      // 화음 추가
      setTimeout(() => playSFX(freq * 1.25, 'sine', 0.12, 0.08), 30);
    }
  },

  /** 줄무늬 레이저 */
  laser(): void {
    playSFX(987, 'sawtooth', 0.20, 0.12, 200);
  },

  /** 봉지 폭탄 1차 */
  wrappedPhase1(): void {
    playSFX(100, 'triangle', 0.35, 0.20, 60);
    setTimeout(() => playSFX(220, 'sine', 0.15, 0.12), 50);
  },

  /** 봉지 폭탄 2차 */
  wrappedPhase2(): void {
    playSFX(70, 'triangle', 0.40, 0.22, 40);
  },

  /** 미러볼 아크 */
  colorBombArc(): void {
    playSFX(660, 'sine', 0.15, 0.10, 880);
  },

  /** 미러볼 연쇄 폭발 */
  colorBombChain(idx: number): void {
    const freqs = [523, 587, 659, 698, 784, 880, 988];
    const f = freqs[idx % freqs.length];
    playSFX(f, 'triangle', 0.10, 0.10);
  },

  /** 아이템 사용 */
  itemUse(): void {
    playChord([440, 554, 659], 'sine', 0.25, 0.08);
  },

  /** 스테이지 클리어 */
  stageClear(): void {
    const melody = [523, 659, 784, 1047];
    melody.forEach((f, i) => {
      setTimeout(() => playSFX(f, 'sine', 0.4, 0.15), i * 150);
    });
  },

  /** 별 1개 */
  star(idx: number): void {
    const freqs = [784, 988, 1175];
    setTimeout(() => {
      playSFX(freqs[idx] ?? 784, 'sine', 0.5, 0.12);
    }, idx * 400);
  },

  /** 보너스 타임 */
  bonusTime(): void {
    playChord([523, 659, 784, 1047], 'triangle', 0.5, 0.10);
  },

  /** 스폰 (블록 생성) */
  spawn(): void {
    // 아주 조용한 틱
    playSFX(880, 'sine', 0.04, 0.04);
  },

  /** 마스터 볼륨 */
  setEnabled(enabled: boolean): void {
    const ctx = getCtx();
    if (!ctx) return;
    if (!enabled) ctx.suspend().catch(() => {});
    else ctx.resume().catch(() => {});
  },
};

/* ── 첫 인터랙션 시 AudioContext 활성화 ── */
export function initAudio(): void {
  const activate = (): void => {
    getCtx();
    document.removeEventListener('pointerdown', activate);
    document.removeEventListener('keydown', activate);
  };
  document.addEventListener('pointerdown', activate, { once: true });
  document.addEventListener('keydown', activate, { once: true });
}
