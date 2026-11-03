/**
 * ViewfinderHUD.js - Khung ngắm máy ảnh cơ khí film 35mm hoài niệm Hà Nội
 * Hiển thị thông số ISO, tốc độ màn trập, khẩu độ, thước căn góc câu đố thị giác
 * Nút chụp Shutter kim loại, Album ký ức Thăng Long và bảng gợi ý phím điều khiển
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

    // Danh sách thông số máy ảnh cơ khí film 35mm
    this.isoList = [100, 200, 400, 800, 1600];
    this.isoIndex = 2; // ISO 400 mặc định (Kodak Portra 400)

    this.shutterList = ['1/60s', '1/125s', '1/250s', '1/500s', '1/1000s'];
    this.shutterIndex = 2; // 1/250s

    this.apertureList = ['f/1.4', 'f/2.0', 'f/2.8', 'f/4.0', 'f/5.6'];
    this.apertureIndex = 1; // f/2.0

    this.filmStockList = [
      'LEICA M3 &bull; KODAK PORTRA 400',
      'CANONET QL17 &bull; FUJIFILM PROVIA 100F',
      'ZENIT-E &bull; ILFORD HP5 PLUS (ĐEN TRẮNG HÀ NỘI)'
    ];
    this.filmIndex = 0;

    this.photosCount = 0;
    this.loadSavedPhotosCount();

    this.render();
    this.bindEvents();
    this.initAudioSFX();
  }

  loadSavedPhotosCount() {
    try {
      const album = JSON.parse(localStorage.getItem('hanoi_film_album') || '[]');
      this.photosCount = Array.isArray(album) ? album.length : 0;
    } catch (e) {
      this.photosCount = 0;
    }
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
      <!-- 4 góc khung kim loại vintage -->
      <div class="viewfinder-corner top-left"></div>
      <div class="viewfinder-corner top-right"></div>
      <div class="viewfinder-corner bottom-left"></div>
      <div class="viewfinder-corner bottom-right"></div>

      <!-- Lưới Rule of Thirds điện ảnh -->
      <div class="rule-of-thirds-grid">
        <div class="grid-line-v1"></div>
        <div class="grid-line-v2"></div>
        <div class="grid-line-h1"></div>
        <div class="grid-line-h2"></div>
      </div>

      <!-- Tâm ngắm hoa tiêu tròn / Split-prism rangefinder -->
      <div id="centerFocusReticle" class="center-focus-reticle">
        <div class="reticle-crosshair"></div>
      </div>

      <!-- Thước đo căn góc câu đố thị giác (Perspective Alignment Indicator) -->
      <div id="puzzleMeterContainer" class="puzzle-alignment-meter-container" style="display: none;">
        <div id="puzzleStatusPill" class="puzzle-status-pill">ĐANG CĂN GÓC THỊ GIÁC...</div>
        <div class="puzzle-gauge-bar">
          <div id="puzzleGaugeFill" class="puzzle-gauge-fill"></div>
        </div>
      </div>

      <!-- Dải thông số góc trên: Loại film, ISO, Album Ký Ức, Kiểu film -->
      <header class="viewfinder-top-info">
        <div class="top-info-left">
          <button type="button" id="btnCycleFilm" class="camera-preset-badge" title="Đổi cuộn phim hoài niệm">
            <span id="filmPresetLabel">${this.filmStockList[this.filmIndex]}</span>
          </button>
          
          <button type="button" id="btnCycleIso" class="viewfinder-param-pill" title="Điều chỉnh độ nhạy sáng ISO">
            ISO <strong id="valIsoDisplay">${this.isoList[this.isoIndex]}</strong>
          </button>
        </div>

        <div class="top-info-right">
          <button type="button" id="btnViewfinderAlbum" class="btn-viewfinder-album" title="Mở Cuốn Album Ký Ức Thăng Long (Phím B)">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
            </svg>
            <span>Album Ký Ức Thăng Long</span>
            <span class="hotkey-chip">B</span>
          </button>

          <div class="film-counter-badge">
            <span>EXP: <strong id="valExpCount">${Math.min(36, this.photosCount)}</strong> / 36</span>
            <span class="bat-status" title="Pin máy ảnh cơ">BAT: <strong>&bull;&bull;&bull;</strong></span>
          </div>
        </div>
      </header>

      <!-- Nút chụp Shutter cơ học kim loại cổ điển bên phải -->
      <div class="shutter-btn-wrapper">
        <button type="button" id="btnVirtualShutter" class="shutter-btn-metal" title="Bấm chụp ảnh film (Phím F hoặc Space)">
          <div class="shutter-inner-ring">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
          </div>
        </button>
        <span class="shutter-hint-key">[F / SPACE / CLICK]</span>
      </div>

      <!-- Dải gợi ý phím điều khiển trung tâm phía trên thước đo đáy -->
      <div class="viewfinder-key-hints">
        <span class="key-hint-pill"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Di chuyển</span>
        <span class="key-hint-pill"><kbd>Shift</kbd> Chạy</span>
        <span class="key-hint-pill"><kbd>Space</kbd> Nhảy</span>
        <span class="key-hint-pill"><kbd>C</kbd> / <kbd>V</kbd> Đổi góc nhìn</span>
        <span class="key-hint-pill highlight-gold"><kbd>F</kbd> Chụp ảnh film</span>
        <span class="key-hint-pill"><kbd>B</kbd> Album Ký Ức</span>
      </div>

      <!-- Dải thông số quang học góc dưới: Đo sáng, Khẩu độ, Tốc độ, Thu ống kính -->
      <footer class="viewfinder-bottom-info">
        <div class="exposure-meter" title="Thước đo sáng chuẩn EV">
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

        <div class="bottom-controls-group">
          <button type="button" id="btnCycleAperture" class="viewfinder-param-pill" title="Điều chỉnh khẩu độ ống kính">
            <span id="valApertureDisplay">${this.apertureList[this.apertureIndex]}</span>
          </button>

          <button type="button" id="btnCycleShutter" class="viewfinder-param-pill" title="Điều chỉnh tốc độ màn trập">
            <span id="valShutterDisplay">${this.shutterList[this.shutterIndex]}</span>
          </button>

          <span class="viewfinder-focal-label">50mm f/2 Summicron</span>

          <button type="button" id="btnExitViewfinder" class="btn-exit-viewfinder" title="Thu ống kính quay lại góc nhìn nhân vật (Phím C hoặc V)">
            &larr; Thu Ống Kính (Phím C / V)
          </button>
        </div>
      </footer>
    `;

    this.container.appendChild(this.element);
  }

  bindEvents() {
    // Nút chụp ảo
    const btnShutter = this.element.querySelector('#btnVirtualShutter');
    if (btnShutter) {
      btnShutter.addEventListener('click', () => {
        this.triggerShutter();
      });
    }

    // Nút thoát Viewfinder chuyển về TPS
    const btnExit = this.element.querySelector('#btnExitViewfinder');
    if (btnExit) {
      btnExit.addEventListener('click', () => {
        this.switchCameraMode('TPS');
      });
    }

    // Nút mở Album Ký Ức Thăng Long
    const btnAlbum = this.element.querySelector('#btnViewfinderAlbum');
    if (btnAlbum) {
      btnAlbum.addEventListener('click', () => {
        GameEventBus.emit('UI:OPEN_SCRAPBOOK', { open: true });
      });
    }

    // Tương tác đổi thông số ISO
    const btnIso = this.element.querySelector('#btnCycleIso');
    const valIso = this.element.querySelector('#valIsoDisplay');
    if (btnIso) {
      btnIso.addEventListener('click', () => {
        this.isoIndex = (this.isoIndex + 1) % this.isoList.length;
        if (valIso) valIso.textContent = this.isoList[this.isoIndex];
      });
    }

    // Tương tác đổi cuộn phim
    const btnFilm = this.element.querySelector('#btnCycleFilm');
    const filmLabel = this.element.querySelector('#filmPresetLabel');
    if (btnFilm) {
      btnFilm.addEventListener('click', () => {
        this.filmIndex = (this.filmIndex + 1) % this.filmStockList.length;
        if (filmLabel) filmLabel.innerHTML = this.filmStockList[this.filmIndex];
      });
    }

    // Tương tác đổi tốc độ màn trập
    const btnShutterSpeed = this.element.querySelector('#btnCycleShutter');
    const valShutter = this.element.querySelector('#valShutterDisplay');
    if (btnShutterSpeed) {
      btnShutterSpeed.addEventListener('click', () => {
        this.shutterIndex = (this.shutterIndex + 1) % this.shutterList.length;
        if (valShutter) valShutter.textContent = this.shutterList[this.shutterIndex];
      });
    }

    // Tương tác đổi khẩu độ
    const btnAperture = this.element.querySelector('#btnCycleAperture');
    const valAperture = this.element.querySelector('#valApertureDisplay');
    if (btnAperture) {
      btnAperture.addEventListener('click', () => {
        this.apertureIndex = (this.apertureIndex + 1) % this.apertureList.length;
        if (valAperture) valAperture.textContent = this.apertureList[this.apertureIndex];
      });
    }

    // Bàn phím: Hỗ trợ phím C & V để đổi camera, F & Space để chụp ảnh, B để mở Album
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();

      // Đổi góc nhìn: phím C hoặc V
      if (key === 'c' || key === 'v') {
        const nextMode = this.currentMode === 'FPS' ? 'TPS' : 'FPS';
        this.switchCameraMode(nextMode);
      } 
      // Chụp ảnh khi đang trong khung ngắm FPS: phím F hoặc Space
      else if ((key === 'f' || key === ' ') && this.currentMode === 'FPS') {
        e.preventDefault();
        this.triggerShutter();
      } 
      // Mở Album Ký Ức: phím B
      else if (key === 'b') {
        GameEventBus.emit('UI:OPEN_SCRAPBOOK', { open: true });
      }
      // Thoát Viewfinder: phím Escape
      else if (key === 'escape' && this.currentMode === 'FPS') {
        this.switchCameraMode('TPS');
      }
    });

    // Lắng nghe sự kiện Core thông báo đã lerp xong Camera Mode
    GameEventBus.on('CORE:CAMERA_MODE_CHANGED', (payload) => {
      if (payload && payload.mode) {
        this.handleCameraModeChanged(payload.mode);
      }
    });

    // Lắng nghe sự kiện Core phát hiện góc nhìn câu đố
    GameEventBus.on('CORE:PUZZLE_DETECTED', (payload) => {
      this.handlePuzzleDetected(payload);
    });

    // Lắng nghe sự kiện ảnh được chụp để cập nhật bộ đếm kiểu ảnh
    GameEventBus.on('CORE:PHOTO_CAPTURED', () => {
      this.photosCount++;
      const expCountEl = this.element.querySelector('#valExpCount');
      if (expCountEl) {
        expCountEl.textContent = Math.min(36, this.photosCount);
      }
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

    if (meterContainer) meterContainer.style.display = 'flex';

    const pct = Math.round(this.alignmentScore * 100);
    if (gaugeFill) gaugeFill.style.width = `${pct}%`;

    if (this.isAligned || this.alignmentScore >= 0.95) {
      if (meterContainer) meterContainer.classList.add('aligned');
      this.element.classList.add('puzzle-aligned');
      if (statusPill) statusPill.textContent = 'KÝ ỨC HỘI TỤ &bull; BẤM CHỤP NGAY (F / SPACE)!';
    } else {
      if (meterContainer) meterContainer.classList.remove('aligned');
      this.element.classList.remove('puzzle-aligned');
      if (statusPill) statusPill.textContent = `CĂN GÓC THỊ GIÁC: ${pct}%`;
    }
  }

  resetPuzzleIndicator() {
    const meterContainer = this.element.querySelector('#puzzleMeterContainer');
    if (meterContainer) {
      meterContainer.style.display = 'none';
      meterContainer.classList.remove('aligned');
    }
    this.element.classList.remove('puzzle-aligned');
  }

  triggerShutter() {
    // Phát âm thanh màn trập
    try {
      this.shutterAudio.currentTime = 0;
      this.shutterAudio.play().catch(() => {});
    } catch (e) {}

    // Hiệu ứng chớp màn trập
    if (this.flashOverlay) {
      this.flashOverlay.classList.remove('active');
      void this.flashOverlay.offsetWidth; // Force reflow
      this.flashOverlay.classList.add('active');
    }

    // Bắn sự kiện theo bảng hợp đồng 3.2
    GameEventBus.emit('UI:TRIGGER_SHUTTER', {
      timestamp: Date.now()
    });
  }
}
