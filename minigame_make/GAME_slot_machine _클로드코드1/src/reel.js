const SYMBOL_HEIGHT = 80; // reel height 240px / 3 rows

export class Reel {
  constructor(elementId, config) {
    this.el     = document.getElementById(elementId);
    this.canvas = this.el.querySelector('canvas');
    this.ctx    = this.canvas.getContext('2d');
    this.config = config;

    // 30-symbol circular pool
    this.symbols = Array.from({ length: 30 }, () =>
      config[Math.floor(Math.random() * config.length)].emoji
    );

    this.state       = 'IDLE';
    this.speed       = 0;
    this.offsetY     = 0;
    this.targetOffset = 0;
    this.targetEmoji = null;

    this._initCanvas();
    this.draw();
  }

  _initCanvas() {
    this.canvas.width  = this.el.clientWidth  || 100;
    this.canvas.height = this.el.clientHeight || 240;
  }

  resize() {
    this._initCanvas();
    this.draw();
  }

  // Called at spin() time — stores target emoji, starts spinning
  spin(targetEmoji) {
    this.targetEmoji = targetEmoji;
    this.state = 'SPINNING';
    this.speed = 8;
  }

  // Called at stop-time — places targetEmoji 3-4 symbols ahead and decelerates
  stop() {
    const maxOffset    = this.symbols.length * SYMBOL_HEIGHT;
    const currentIndex = (Math.ceil(Math.abs(this.offsetY) / SYMBOL_HEIGHT)) % this.symbols.length;

    // Place target 3 symbols ahead of current scroll position
    const targetIndex = (currentIndex + 3) % this.symbols.length;
    this.symbols[targetIndex] = this.targetEmoji;

    // offsetY where targetIndex is in center row: SYMBOL_HEIGHT * (1 - targetIndex)
    let targetOffset = SYMBOL_HEIGHT * (1 - targetIndex);

    // Ensure targetOffset < offsetY (ahead in scroll direction = more negative)
    while (targetOffset > this.offsetY) targetOffset -= maxOffset;
    // Guarantee at least 1.5 symbol distance so deceleration is visible
    while (this.offsetY - targetOffset < SYMBOL_HEIGHT * 1.5) targetOffset -= maxOffset;

    this.targetOffset = targetOffset;
    this.state = 'STOPPING';
  }

  // SM-ANI-006: dim/undim this reel
  dim(on) {
    this.el.classList.toggle('dimmed', on);
  }

  update() {
    const maxOffset = this.symbols.length * SYMBOL_HEIGHT;

    if (this.state === 'SPINNING') {
      this.offsetY -= this.speed;
      if (this.offsetY <= -maxOffset) this.offsetY += maxOffset;

    } else if (this.state === 'STOPPING') {
      const dist = this.offsetY - this.targetOffset; // always > 0

      // Decelerate when within 2 symbols of target
      if (dist <= SYMBOL_HEIGHT * 2) {
        this.speed = Math.max(2, this.speed * 0.88);
      }

      this.offsetY -= this.speed;

      // Snap when arrived
      if (this.offsetY <= this.targetOffset + 0.5) {
        this.offsetY = this.targetOffset % maxOffset; // normalize
        if (this.offsetY > 0) this.offsetY -= maxOffset;
        this.state = 'IDLE';
        this.speed = 0;
      }

      // Wrap-around safety (keeps both values in sync)
      if (this.offsetY <= -maxOffset) {
        this.offsetY      += maxOffset;
        this.targetOffset += maxOffset;
      }
    }

    this.draw();
  }

  draw() {
    const { ctx, canvas, symbols } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const maxOffset = symbols.length * SYMBOL_HEIGHT;
    ctx.font         = `${Math.floor(SYMBOL_HEIGHT * 0.62)}px serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < symbols.length; i++) {
      let y = i * SYMBOL_HEIGHT + this.offsetY;

      // Wrap into visible window
      while (y < -SYMBOL_HEIGHT)                 y += maxOffset;
      while (y > canvas.height + SYMBOL_HEIGHT)  y -= maxOffset;

      if (y > -SYMBOL_HEIGHT && y < canvas.height + SYMBOL_HEIGHT) {
        ctx.fillText(symbols[i], canvas.width / 2, y + SYMBOL_HEIGHT / 2);
      }
    }
  }
}
