class TactSlider {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.min      = options.min      ?? 0;
    this.max      = options.max      ?? 100;
    this.value    = options.value    ?? this.min;
    this.step     = options.step     ?? 0;
    this.onChange = options.onChange ?? null;
    this.label    = options.label    ?? '';
    this.unit     = options.unit     ?? '';
    this.steps    = options.steps    ?? null;  // array of step labels
    this.vertical = options.vertical ?? false;
    this.formatValue = options.formatValue ?? null;

    this._dragging = false;

    this._build();
    this._bindEvents();
    this._render();
  }

  // ── DOM ──────────────────────────────────────────────────────────────────────

  _build() {
    const stepsHtml = this.steps
      ? `<div class="slider-steps">${this.steps.map(s =>
          `<span class="slider-step-label">${s}</span>`).join('')}</div>`
      : '';

    this.container.innerHTML = `
      <div class="slider-wrap${this.vertical ? ' slider-vertical' : ''}">
        <div class="slider-label">${this.label}</div>
        <div class="slider-track-area" touch-action="none" style="touch-action:none;user-select:none;">
          <div class="slider-track">
            <div class="slider-fill"></div>
            <div class="slider-thumb"></div>
          </div>
        </div>
        ${stepsHtml}
        <div class="slider-value-display">
          <span class="slider-value-num">--</span>
          <span class="slider-unit">${this.unit}</span>
        </div>
      </div>`;

    this.trackArea  = this.container.querySelector('.slider-track-area');
    this.trackEl    = this.container.querySelector('.slider-track');
    this.fillEl     = this.container.querySelector('.slider-fill');
    this.thumbEl    = this.container.querySelector('.slider-thumb');
    this.valueEl    = this.container.querySelector('.slider-value-num');
    this.wrapEl     = this.container.querySelector('.slider-wrap');
  }

  // ── Events ───────────────────────────────────────────────────────────────────

  _bindEvents() {
    this.trackArea.addEventListener('pointerdown',   this._onDown.bind(this));
    this.trackArea.addEventListener('pointermove',   this._onMove.bind(this));
    this.trackArea.addEventListener('pointerup',     this._onUp.bind(this));
    this.trackArea.addEventListener('pointercancel', this._onUp.bind(this));
  }

  _valueFromPointer(e) {
    const rect = this.trackEl.getBoundingClientRect();
    if (this.vertical) {
      const t = 1 - clamp((e.clientY - rect.top) / rect.height, 0, 1);
      return this.min + t * (this.max - this.min);
    } else {
      const t = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      return this.min + t * (this.max - this.min);
    }
  }

  _onDown(e) {
    e.preventDefault();
    this.trackArea.setPointerCapture(e.pointerId);
    this._dragging = true;
    this.setValue(this._valueFromPointer(e));
  }

  _onMove(e) {
    if (!this._dragging) return;
    e.preventDefault();
    this.setValue(this._valueFromPointer(e));
  }

  _onUp(e) {
    if (!this._dragging) return;
    this._dragging = false;
    this.trackArea.releasePointerCapture(e.pointerId);
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  setValue(val, silent = false) {
    const prev = this.value;

    if (this.step > 0) {
      val = Math.round((val - this.min) / this.step) * this.step + this.min;
    }
    val = clamp(val, this.min, this.max);

    if (this.step > 0 && Math.floor(val / this.step) !== Math.floor(prev / this.step)) {
      vibrate(6);
    }

    this.value = val;
    this._render();

    if (!silent && this.onChange) {
      this.onChange(this.value);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  _render() {
    const t = (this.value - this.min) / (this.max - this.min);
    const pct = (t * 100).toFixed(2) + '%';

    if (this.vertical) {
      this.fillEl.style.height  = pct;
      this.fillEl.style.width   = '100%';
      this.fillEl.style.bottom  = '0';
      this.fillEl.style.top     = 'auto';
      this.thumbEl.style.bottom = `calc(${pct} - 12px)`;
      this.thumbEl.style.left   = '50%';
      this.thumbEl.style.transform = 'translateX(-50%)';
    } else {
      this.fillEl.style.width   = pct;
      this.thumbEl.style.left   = `calc(${pct} - 12px)`;
    }

    // Value display
    if (this.steps && this.step > 0) {
      const idx = Math.round((this.value - this.min) / this.step);
      this.valueEl.textContent = this.steps[idx] ?? this.value;
    } else if (this.formatValue) {
      this.valueEl.textContent = this.formatValue(this.value);
    } else if (this.step >= 1) {
      this.valueEl.textContent = Math.round(this.value);
    } else {
      this.valueEl.textContent = this.value.toFixed(1);
    }
  }
}
