/**
 * ViewfinderHUD.js - Khung ngắm máy ảnh cơ khí 35mm hoài niệm
 * Thước đo căn góc câu đố thị giác (Perspective Alignment Indicator)
 * Nút chụp Shutter kim loại và hiệu ứng màn trập chớp đen
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { GameEventBus } from '../bridge/GameEvents.js';

export class ViewfinderHUD {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.element = null;
    this.flashOverlay = null;
    this.currentMode = 'TPS'; // 'TPS' | 'FPS'

    this.alignmentScore = 0;
    this.isAligned = false;
    this.currentPuzzle = null;

    this.render();
    this.bindEvents();
    this.initAudioSFX();
  }

  initAudioSFX() {
    this.shutterAudio = new Audio('assets/audio/shutter_click.mp3');
    this.shutterAudio.volume = 0.85;
  }

  render() {
    // 1. Lớp phủ chớp màn trập toàn màn hình
    this.flashOverlay = document.createElement('div');
    this.flashOverlay.className = 'shutter-flash-overlay';
    document.body.appendChild(this.flashOverlay);

    // 2. Khung ngắm HUD chính
    this.element = document.createElement('div');
    this.element.id = 'viewfinderHudLayer';
    this.element.className = 'viewfinder-hud-layer hidden';
    this.element.innerHTML = `
      <!-- 4 góc khung kim loại -->
      <div class="viewfinder-corner top-left"></div>
      <div class="viewfinder-corner top-right"></div>
      <div class="viewfinder-corner bottom-left"></div>
      <div class="viewfinder-corner bottom-right"></div>

      <!-- Lưới Rule of Thirds -->
      <div class="rule-of-thirds-grid">
        <div class="grid-line-v1"></div>
        <div class="grid-line-v2"></div>
        <div class="grid-line-h1"></div>
        <div class="grid-line-h2"></div>
      </div>

      <!-- Tâm ngắm hoa tiêu tròn / Split-prism -->
      <div id="centerFocusReticle" class="center-focus-reticle">
        <div class="reticle-crosshair"></div>
      </div>

      <!-- Thước đo căn góc câu đố thị giác -->
      <div id="puzzleMeterContainer" class="puzzle-alignment-meter-container" style="display: none;">
        <div id="puzzleStatusPill" class="puzzle-status-pill">ĐANG CĂN GÓC THỊ GIÁC...</div>
        <div class="puzzle-gauge-bar">
          <div id="puzzleGaugeFill" class="puzzle-gauge-fill"></div>
        </div>
      </div>

      <!-- Thông số quang học góc trên -->
      <div class="viewfinder-top-info">
        <div class="camera-preset-badge">LEICA M3 &bull; KODAK PORTRA 400</div>
        <div style="display:flex;gap:16px;">
          <span>EXP: <strong>24 / 36</strong></span>
          <span>BAT: <strong>&bull;&bull;&bull;</strong></span>
        </div>
      </div>

      <!-- Nút chụp Shutter cơ học kim loại bên phải -->
      <div class="shutter-btn-wrapper">
        <button type="button" id="btnVirtualShutter" class="shutter-btn-metal" title="Bấm chụp ảnh (Phím Space)">
          <div class="shutter-inner-ring">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
          </div>
        </button>
        <span class="shutter-hint-key">[SPACE / CLICK]</span>
      </div>

      <!-- Thông số quang học góc dưới -->
      <div class="viewfinder-bottom-info">
        <div class="exposure-meter">
          <span>&minus;2</span>
          <span>&bull;</span>
          <span>&minus;1</span>
          <span>&bull;</span>
          <span style="color:#2ecc71;font-weight:700;">0</span>
          <span>&bull;</span>
          <span>+1</span>
          <span>&bull;</span>
          <span>+2</span>
        </div>

        <div style="display:flex;align-items:center;gap:20px;">
          <span>f/2.0</span>
          <span>1/250s</span>
          <span>50mm</span>
          <button type="button" id="btnExitViewfinder" class="btn-exit-viewfinder">
            &larr; Thu Ống Kính (Phím V)
          </button>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
  }

  bindEvents() {
    // Nút chụp ảo
    const btnShutter = this.element.querySelector('#btnVirtualShutter');
    btnShutter.addEventListener('click', () => {
      this.triggerShutter();
    });

    // Nút thoát Viewfinder chuyển về TPS
    const btnExit = this.element.querySelector('#btnExitViewfinder');
    btnExit.addEventListener('click', () => {
      this.switchCameraMode('TPS');
    });

    // Bấm phím V để chuyển đổi TPS <-> FPS
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'v' || e.key === 'V') {
        const nextMode = this.currentMode === 'FPS' ? 'TPS' : 'FPS';
        this.switchCameraMode(nextMode);
      } else if (e.key === ' ' && this.currentMode === 'FPS') {
        // Space chụp ảnh khi đang trong FPS
        e.preventDefault();
        this.triggerShutter();
      }
    });

    // Lắng nghe sự kiện Core thông báo đã lerp xong Camera Mode
    GameEventBus.on('CORE:CAMERA_MODE_CHANGED', (payload) => {
      this.handleCameraModeChanged(payload.mode);
    });

    // Lắng nghe sự kiện Core phát hiện góc nhìn câu đố
    GameEventBus.on('CORE:PUZZLE_DETECTED', (payload) => {
      this.handlePuzzleDetected(payload);
    });
  }

  switchCameraMode(targetMode) {
    // Bắn sự kiện theo bảng hợp đồng 3.2
    GameEventBus.emit('UI:SWITCH_CAMERA_MODE', { targetMode });
  }

  handleCameraModeChanged(mode) {
    this.currentMode = mode;
    if (mode === 'FPS') {
      this.element.classList.remove('hidden');
    } else {
      this.element.classList.add('hidden');
      this.resetPuzzleIndicator();
    }
  }

  handlePuzzleDetected(payload) {
    if (this.currentMode !== 'FPS') return;

    const meterContainer = this.element.querySelector('#puzzleMeterContainer');
    const statusPill = this.element.querySelector('#puzzleStatusPill');
    const gaugeFill = this.element.querySelector('#puzzleGaugeFill');

    this.currentPuzzle = payload;
    this.alignmentScore = payload.alignmentScore || 0;
    this.isAligned = !!payload.isAligned;

    meterContainer.style.display = 'flex';

    const pct = Math.round(this.alignmentScore * 100);
    gaugeFill.style.width = `${pct}%`;

    if (this.isAligned || this.alignmentScore >= 0.95) {
      meterContainer.classList.add('aligned');
      this.element.classList.add('puzzle-aligned');
      statusPill.textContent = 'KÝ ỨC HỘI TỤ &bull; BẤM CHỤP NGAY!';
    } else {
      meterContainer.classList.remove('aligned');
      this.element.classList.remove('puzzle-aligned');
      statusPill.textContent = `CĂN GÓC NHÌN: ${pct}%`;
    }
  }

  resetPuzzleIndicator() {
    const meterContainer = this.element.querySelector('#puzzleMeterContainer');
    meterContainer.style.display = 'none';
    meterContainer.classList.remove('aligned');
    this.element.classList.remove('puzzle-aligned');
  }

  triggerShutter() {
    // Phát âm thanh màn trập
    try {
      this.shutterAudio.currentTime = 0;
      this.shutterAudio.play().catch(() => {});
    } catch (e) {}

    // Hiệu ứng chớp màn trập
    this.flashOverlay.classList.remove('active');
    void this.flashOverlay.offsetWidth; // Force reflow
    this.flashOverlay.classList.add('active');

    // Bắn sự kiện theo bảng hợp đồng 3.2
    GameEventBus.emit('UI:TRIGGER_SHUTTER', {
      timestamp: Date.now()
    });
  }
}
