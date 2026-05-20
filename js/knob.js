class TactKnob {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    this.min      = options.min      ?? 0;
    this.max      = options.max      ?? 100;
    this.value    = options.value    ?? this.min;
    this.step     = options.step     ?? 0;          // 0 = continuous
    this.angleMin = options.angleMin ?? -135;
    this.angleMax = options.angleMax ?? 135;
    this.onChange = options.onChange ?? null;
    this.label    = options.label    ?? '';
    this.unit     = options.unit     ?? '';
    this.disabled = options.disabled ?? false;
    this.offValue = options.offValue ?? null;       // value that means "off"
    this.formatValue = options.formatValue ?? null; // custom display formatter

    this._dragging  = false;
    this._prevAngle = null;
    this._totalDelta = 0;

    this._build();
    this._bindEvents();
    this._render();
  }

  // ── DOM ─────────────────────────────────────────────────────────────────────

  _build() {
    const SIZE = 120;
    const CX = SIZE / 2;
    const R_TRACK = 48;
    const R_PROGRESS = 48;

    this.container.innerHTML = `
      <div class="knob-wrap">
        <svg class="knob-svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}"
             touch-action="none" style="touch-action:none;user-select:none;">
          <!-- Track arc -->
          <path class="knob-track"
                d="${describeArc(CX, CX, R_TRACK, this.angleMin, this.angleMax)}"
                fill="none" stroke="#E0DED8" stroke-width="4" stroke-linecap="round"/>
          <!-- Progress arc -->
          <path class="knob-progress"
                d=""
                fill="none" stroke="#1D9E75" stroke-width="4" stroke-linecap="round"/>
          <!-- Knob body -->
          <circle class="knob-body" cx="${CX}" cy="${CX}" r="32"
                  fill="#1C1C1E" stroke="#3A3A3C" stroke-width="1.5"/>
          <!-- Pointer line -->
          <line class="knob-pointer"
                x1="${CX}" y1="${CX}" x2="${CX}" y2="${CX - 22}"
                stroke="white" stroke-width="2" stroke-linecap="round"/>
          <!-- Center dot -->
          <circle class="knob-center" cx="${CX}" cy="${CX}" r="3" fill="#6E6E73"/>
        </svg>
        <div class="knob-label">${this.label}</div>
        <div class="knob-value-display">
          <span class="knob-value-num">--</span>
          <span class="knob-unit">${this.unit}</span>
        </div>
      </div>`;

    this.svg        = this.container.querySelector('.knob-svg');
    this.trackEl    = this.container.querySelector('.knob-track');
    this.progressEl = this.container.querySelector('.knob-progress');
    this.bodyEl     = this.container.querySelector('.knob-body');
    this.pointerEl  = this.container.querySelector('.knob-pointer');
    this.valueEl    = this.container.querySelector('.knob-value-num');
    this.wrapEl     = this.container.querySelector('.knob-wrap');
  }

  // ── Events ───────────────────────────────────────────────────────────────────

  _bindEvents() {
    this.svg.addEventListener('pointerdown', this._onDown.bind(this));
    this.svg.addEventListener('pointermove', this._onMove.bind(this));
    this.svg.addEventListener('pointerup',   this._onUp.bind(this));
    this.svg.addEventListener('pointercancel', this._onUp.bind(this));
  }

  _center() {
    const rect = this.svg.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  _onDown(e) {
    if (this.disabled) return;
    e.preventDefault();
    this.svg.setPointerCapture(e.pointerId);
    this._dragging = true;
    const c = this._center();
    this._prevAngle = angleTo(c.x, c.y, e.clientX, e.clientY);
    this._totalDelta = 0;
  }

  _onMove(e) {
    if (!this._dragging) return;
    e.preventDefault();
    const c = this._center();
    const angle = angleTo(c.x, c.y, e.clientX, e.clientY);
    let delta = angle - this._prevAngle;

    // Unwrap crossing ±180
    if (delta > 180)  delta -= 360;
    if (delta < -180) delta += 360;

    this._prevAngle = angle;
    this._totalDelta += delta;

    const angleRange = this.angleMax - this.angleMin;
    const valueRange = this.max - this.min;
    const newValue = this.value + (delta / angleRange) * valueRange;
    this.setValue(clamp(newValue, this.min, this.max));
  }

  _onUp(e) {
    if (!this._dragging) return;
    this._dragging = false;
    this.svg.releasePointerCapture(e.pointerId);
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  setValue(val, silent = false) {
    const prev = this.value;

    if (this.step > 0) {
      val = Math.round((val - this.min) / this.step) * this.step + this.min;
    }
    val = clamp(val, this.min, this.max);

    if (val === this.value && prev === this.value) {
      this._render();
      return;
    }

    if (this.step > 0 && Math.floor(val / this.step) !== Math.floor(prev / this.step)) {
      vibrate(8);
    }

    this.value = val;
    this._render();

    if (!silent && this.onChange) {
      this.onChange(this.value);
    }
  }

  setDisabled(val) {
    this.disabled = val;
    this._render();
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  _render() {
    const SIZE = 120;
    const CX = SIZE / 2;
    const R = 48;

    const t = (this.value - this.min) / (this.max - this.min);
    const currentAngle = this.angleMin + t * (this.angleMax - this.angleMin);

    // Rotate knob body via pointer line
    this.pointerEl.setAttribute('transform',
      `rotate(${currentAngle}, ${CX}, ${CX})`);

    // Progress arc
    if (Math.abs(currentAngle - this.angleMin) > 0.5) {
      this.progressEl.setAttribute('d',
        describeArc(CX, CX, R, this.angleMin, currentAngle));
      this.progressEl.style.display = '';
    } else {
      this.progressEl.style.display = 'none';
    }

    // Value display
    const isOff = this.offValue !== null && this.value <= this.offValue;
    if (isOff) {
      this.valueEl.textContent = 'OFF';
      this.wrapEl.classList.add('knob-off');
    } else {
      this.wrapEl.classList.remove('knob-off');
      if (this.formatValue) {
        this.valueEl.textContent = this.formatValue(this.value);
      } else if (this.step >= 1 || this.step === 0) {
        this.valueEl.textContent = Math.round(this.value);
      } else {
        this.valueEl.textContent = this.value.toFixed(1);
      }
    }

    // Disabled state
    this.wrapEl.classList.toggle('knob-disabled', this.disabled);
  }
}
