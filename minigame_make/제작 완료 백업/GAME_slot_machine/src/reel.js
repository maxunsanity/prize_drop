export class Reel {
  constructor(elementId, config) {
    this.el = document.getElementById(elementId);
    this.canvas = this.el.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.config = config;

    this.symbols = [];
    for(let i=0; i<30; i++) {
      const rnd = this.config[Math.floor(Math.random() * this.config.length)];
      this.symbols.push(rnd.emoji);
    }

    this.state = 'IDLE';
    this.speed = 0;
    this.offsetY = 0;

    this.targetIndex = -1;
    this.targetOffset = 0;

    this.resize();
  }

  resize() {
    this.canvas.width = this.el.clientWidth;
    this.canvas.height = this.el.clientHeight;
    // Calculate exactly 3 symbols visible
    this.symbolHeight = this.canvas.height / 3;
  }

  spin(targetEmoji) {
    this.state = 'SPINNING';
    this.speed = 40; // Increased spin speed

    const currentIndex = Math.floor(Math.abs(this.offsetY) / this.symbolHeight);
    this.targetIndex = (currentIndex + 20) % this.symbols.length;
    this.symbols[this.targetIndex] = targetEmoji;

    // We want the target symbol to land exactly in the MIDDLE row (index 1)
    this.targetOffset = -(this.targetIndex * this.symbolHeight) + this.symbolHeight;
  }

  stop() {
    this.state = 'STOPPING';
  }

  update() {
    if (this.state === 'IDLE') {
      this.draw();
      return;
    }

    const maxOffset = this.symbols.length * this.symbolHeight;

    if (this.state === 'SPINNING') {
      this.offsetY -= this.speed;
      if (this.offsetY <= -maxOffset) {
        this.offsetY += maxOffset;
      }
    } else if (this.state === 'STOPPING') {
      let dist = this.offsetY - this.targetOffset;
      while (dist < 0) {
        dist += maxOffset;
        this.targetOffset -= maxOffset;
      }

      // Faster stopping: increase deceleration and reduce distance threshold
      if (dist < 300) {
        this.speed = Math.max(2, this.speed * 0.85); // Sharper deceleration
      }

      this.offsetY -= this.speed;

      if (this.offsetY <= this.targetOffset) {
        this.offsetY = this.targetOffset;
        this.state = 'IDLE';
        this.offsetY = this.offsetY % maxOffset;
      }

      if (this.offsetY <= -maxOffset) {
        this.offsetY += maxOffset;
        this.targetOffset += maxOffset;
      }
    }

    this.draw();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const fontSize = Math.floor(this.symbolHeight * 0.6);
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const maxOffset = this.symbols.length * this.symbolHeight;

    for (let i = 0; i < this.symbols.length; i++) {
      let y = (i * this.symbolHeight) + this.offsetY;

      if (y < -this.symbolHeight) y += maxOffset;
      if (y > this.canvas.height + this.symbolHeight) y -= maxOffset;

      if (y > -this.symbolHeight && y < this.canvas.height + this.symbolHeight) {
        this.ctx.fillText(this.symbols[i], this.canvas.width / 2, y + this.symbolHeight / 2);
      }
    }
  }
}
