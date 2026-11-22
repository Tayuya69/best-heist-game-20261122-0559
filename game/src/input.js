// input.js — keyboard + mouse state for the thief.
// Arrow keys / WASD move, Shift sneaks, click walks to a point, M mutes,
// Enter starts, R retries, P pauses. Prevents the page scrolling on arrows.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };
    this.canvas = canvas;
    this.onKey = null; // set by main.js: (code) => void, for one-shot keys
    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) {
        this.keys.add(event.code);
        if (this.onKey) this.onKey(event.code);
      }
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    window.addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('mousemove', (event) => {
      const pos = this.toCanvas(event);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
    });
    canvas.addEventListener('mousedown', (event) => {
      const pos = this.toCanvas(event);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
      this.mouse.clicked = true;
      this.mouse.clickX = pos.x;
      this.mouse.clickY = pos.y;
    });
  }

  isDown(code) {
    return this.keys.has(code);
  }

  // Convert a pointer event to canvas coordinates (the canvas may be scaled).
  toCanvas(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  consumeClick() {
    if (!this.mouse.clicked) return null;
    this.mouse.clicked = false;
    return { x: this.mouse.clickX, y: this.mouse.clickY };
  }
}
