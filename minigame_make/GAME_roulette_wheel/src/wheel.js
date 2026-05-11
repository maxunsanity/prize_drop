export class Wheel {
  constructor(canvas, sections) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sections = sections;

    this.currentAngle = 0; // 누적 각도 (degrees) — 랩 안 함, 물리 계산용
    this.targetAngle = 0;  // 정지 목표 각도 (누적, degrees)
    this.speed = 0;        // degrees/frame
    this.state = 'IDLE';   // IDLE / SPINNING / STOPPED
    this.highlightId = null;
    this.onStopped = null;

    this.resize();
  }

  resize() {
    const size = this.canvas.parentElement.clientWidth;
    this.canvas.width = size;
    this.canvas.height = size;
    this.radius = size * 0.46;
    this.cx = size / 2;
    this.cy = size / 2;
  }

  spin(targetIdx) {
    if (this.state !== 'IDLE') return;

    const n = this.sections.length;
    const sectionAngle = 360 / n;
    const centerAngle = (targetIdx + 0.5) * sectionAngle;
    // 포인터(상단 270°)에 해당 섹션 중심이 오도록 필요한 회전량
    const targetOffset = ((270 - centerAngle) % 360 + 360) % 360;
    // 섹션 내 랜덤 오프셋 (±20% 범위)
    const randomOff = (Math.random() - 0.5) * sectionAngle * 0.4;

    const rotations = 3 + Math.floor(Math.random() * 3); // 3~5바퀴
    // currentAngle의 다음 360° 배수 기준으로 목표 설정
    const base = Math.ceil((this.currentAngle + 0.001) / 360) * 360;
    this.targetAngle = base + rotations * 360 + targetOffset + randomOff;

    this.speed = 15;
    this.state = 'SPINNING';
    this.highlightId = null;
  }

  highlight(sectionId) {
    this.highlightId = sectionId;
  }

  clearHighlight() {
    this.highlightId = null;
  }

  resetToIdle() {
    this.state = 'IDLE';
  }

  update() {
    if (this.state === 'IDLE' || this.state === 'STOPPED') {
      this.draw();
      return;
    }

    if (this.state === 'SPINNING') {
      const remaining = this.targetAngle - this.currentAngle;

      // 오버슈트 방지: 남은 거리보다 속도가 크면 스냅
      if (remaining <= this.speed) {
        this.currentAngle = this.targetAngle;
        this.state = 'STOPPED';
        this.draw();
        if (this.onStopped) {
          const cb = this.onStopped;
          this.onStopped = null;
          cb();
        }
        return;
      }

      // 50° 이내 진입 시 감속
      if (remaining < 50) {
        this.speed = Math.max(0.3, this.speed * 0.97);
      }

      this.currentAngle += this.speed;
      this.draw();
    }
  }

  draw() {
    const { ctx, cx, cy, sections } = this;
    const r = this.radius;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const n = sections.length;
    const sliceAngle = (2 * Math.PI) / n;
    // 그리기용 각도는 modulo — 누적값이 커도 시각적으로 정확
    const rotRad = ((this.currentAngle % 360) * Math.PI) / 180;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotRad);

    for (let i = 0; i < n; i++) {
      const startRad = i * sliceAngle;
      const endRad = (i + 1) * sliceAngle;
      const midRad = startRad + sliceAngle / 2;

      // 섹션 채우기
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, startRad, endRad);
      ctx.closePath();
      ctx.fillStyle = this.highlightId === sections[i].id ? '#f5c842' : sections[i].color;
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 라벨 텍스트
      const tx = Math.cos(midRad) * r * 0.67;
      const ty = Math.sin(midRad) * r * 0.67;
      ctx.save();
      ctx.translate(tx, ty);
      // 하단 반(sin > 0): 텍스트가 뒤집히지 않도록 보정
      const textRot = Math.sin(midRad) > 0 ? midRad - Math.PI / 2 : midRad + Math.PI / 2;
      ctx.rotate(textRot);
      ctx.fillStyle = '#222';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sections[i].label, 0, 0);
      ctx.restore();
    }

    // 외곽 링
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, 2 * Math.PI);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // 중심 허브
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.07, 0, 2 * Math.PI);
    ctx.fillStyle = '#222';
    ctx.fill();

    ctx.restore();
  }
}
