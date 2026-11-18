/**
 * SettingsModal.js - Bảng Bánh Răng Cài Đặt & Hướng Dẫn Điều Khiển
 * Phong cách thiết kế Canva Vintage: Viền mạ vàng hoàng gia, giấy điệp cổ và hoài niệm Hà Nội
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { GameEventBus } from '../bridge/GameEvents.js';

export class SettingsModal {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.element = null;
    this.isOpen = false;
    this.activeTab = 'controls'; // 'controls' | 'graphics' | 'audio'

    this.render();
    this.bindEvents();
  }

  render() {
    this.element = document.createElement('div');
    this.element.id = 'hanoiSettingsModal';
    this.element.className = 'hanoi-settings-backdrop';
    this.element.style.display = 'none';

    this.element.innerHTML = `
      <div class="hanoi-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settingsDialogTitle">
        <header class="settings-dialog-header">
          <div class="settings-header-title-box">
            <svg class="settings-header-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
            <h2 id="settingsDialogTitle" class="settings-title">CÀI ĐẶT & HƯỚNG DẪN</h2>
          </div>
          <button type="button" class="btn-close-settings" id="btnCloseSettingsModal" title="Đóng bảng (Esc)">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </header>

        <nav class="settings-nav-tabs">
          <button type="button" class="settings-tab-btn active" data-tab="controls">
            <span>🎮 Hướng Dẫn Phím</span>
          </button>
          <button type="button" class="settings-tab-btn" data-tab="graphics">
            <span>✨ Đồ Họa & Nét</span>
          </button>
          <button type="button" class="settings-tab-btn" data-tab="audio">
            <span>🎵 Âm Thanh</span>
          </button>
        </nav>

        <div class="settings-body">
          <!-- TAB 1: PHÍM ĐIỀU KHIỂN -->
          <div class="settings-tab-pane active" id="tabPaneControls">
            <div class="settings-controls-grid">
              <div class="settings-control-card">
                <div class="ctrl-keys">
                  <span class="keycap">W</span><span class="keycap">A</span><span class="keycap">S</span><span class="keycap">D</span>
                </div>
                <div class="ctrl-desc">
                  <strong>Di chuyển nhân vật</strong>
                  <p>Bước đi trên phố cổ, leo thang bộ Granito A1 Kim Liên</p>
                </div>
              </div>

              <div class="settings-control-card">
                <div class="ctrl-keys">
                  <span class="keycap">Shift</span>
                </div>
                <div class="ctrl-desc">
                  <strong>Chạy nhanh</strong>
                  <p>Tăng tốc khám phá các tuyến phố và Cầu Long Biên</p>
                </div>
              </div>

              <div class="settings-control-card">
                <div class="ctrl-keys">
                  <span class="keycap">Space</span>
                </div>
                <div class="ctrl-desc">
                  <strong>Nhảy / Bước cao</strong>
                  <p>Vượt qua thềm nhà, bậc đá tam cấp và chướng ngại</p>
                </div>
              </div>

              <div class="settings-control-card">
                <div class="ctrl-keys">
                  <span class="keycap">C</span> <span class="keycap">V</span>
                </div>
                <div class="ctrl-desc">
                  <strong>Đổi góc nhìn Camera</strong>
                  <p>Góc nhìn thứ nhất (FPS) & Góc nhìn thứ ba (TPS)</p>
                </div>
              </div>

              <div class="settings-control-card highlight-card">
                <div class="ctrl-keys">
                  <span class="keycap gold">F</span>
                </div>
                <div class="ctrl-desc">
                  <strong>Chụp ảnh máy Film 35mm</strong>
                  <p>Bắt trọn khoảnh khắc hoài niệm, lưu vào Album</p>
                </div>
              </div>

              <div class="settings-control-card highlight-card">
                <div class="ctrl-keys">
                  <span class="keycap gold">E</span>
                </div>
                <div class="ctrl-desc">
                  <strong>Tương tác di sản</strong>
                  <p>Uống trà đá vỉa hè, bật đài cassette, vặn nước máy</p>
                </div>
              </div>

              <div class="settings-control-card">
                <div class="ctrl-keys">
                  <span class="keycap">Tab</span> <span class="keycap">M</span>
                </div>
                <div class="ctrl-desc">
                  <strong>Bản đồ du lịch Hà Nội</strong>
                  <p>Xem toàn cảnh 4 phân khu & dịch chuyển nhanh</p>
                </div>
              </div>

              <div class="settings-control-card">
                <div class="ctrl-keys">
                  <span class="keycap">B</span>
                </div>
                <div class="ctrl-desc">
                  <strong>Cuốn Album Ký Ức</strong>
                  <p>Mở bộ sưu tập ảnh film và tem bưu chính đã chụp</p>
                </div>
              </div>

              <div class="settings-control-card">
                <div class="ctrl-keys">
                  <span class="keycap">Enter</span>
                </div>
                <div class="ctrl-desc">
                  <strong>Kênh trò chuyện</strong>
                  <p>Giao tiếp cộng đồng và trò chuyện cùng nhân vật</p>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: ĐỒ HỌA & ĐỘ SẮC NÉT -->
          <div class="settings-tab-pane" id="tabPaneGraphics" style="display: none;">
            <div class="graphics-options-list">
              <label class="graphics-option-card active" data-quality="balanced">
                <input type="radio" name="graphicsQualityRadio" value="balanced" checked>
                <div class="opt-content">
                  <div class="opt-title-row">
                    <span class="opt-name">⚖️ Sắc Nét & Cực Mượt 60 FPS (Khuyên Dùng)</span>
                    <span class="badge-tag">Chuẩn 60 FPS</span>
                  </div>
                  <p class="opt-info">Độ phân giải 1:1 pixel gốc sắc nét tuyệt đối, không mờ ảo, đảm bảo tốc độ mượt mà 60 FPS không bao giờ giật lag.</p>
                </div>
              </label>

              <label class="graphics-option-card" data-quality="high">
                <input type="radio" name="graphicsQualityRadio" value="high">
                <div class="opt-content">
                  <div class="opt-title-row">
                    <span class="opt-name">✨ Siêu Nét Retina / 4K</span>
                    <span class="badge-tag">Card Đồ Họa Rời</span>
                  </div>
                  <p class="opt-info">Độ phân giải cao cấp cho máy tính có GPU rời mạnh mẽ.</p>
                </div>
              </label>

              <label class="graphics-option-card" data-quality="performance">
                <input type="radio" name="graphicsQualityRadio" value="performance">
                <div class="opt-content">
                  <div class="opt-title-row">
                    <span class="opt-name">⚡ Tiết Kiệm Năng Lượng (Performance)</span>
                    <span class="badge-tag">Tốc Độ Cao</span>
                  </div>
                  <p class="opt-info">Dành riêng cho máy văn phòng cấu hình yếu hoặc tiết kiệm pin.</p>
                </div>
              </label>
            </div>
          </div>

          <!-- TAB 3: ÂM THANH -->
          <div class="settings-tab-pane" id="tabPaneAudio" style="display: none;">
            <div class="audio-settings-box">
              <div class="audio-slider-row">
                <div class="audio-label-group">
                  <span>🎵 Nhạc Nền Mùa Thu (BGM)</span>
                  <span id="bgmVolumeVal" class="vol-chip">80%</span>
                </div>
                <input type="range" id="bgmVolumeSlider" min="0" max="100" value="80" class="hanoi-slider">
              </div>

              <div class="audio-slider-row">
                <div class="audio-label-group">
                  <span>🍃 Hiệu Ứng Môi Trường (SFX)</span>
                  <span id="sfxVolumeVal" class="vol-chip">90%</span>
                </div>
                <input type="range" id="sfxVolumeSlider" min="0" max="100" value="90" class="hanoi-slider">
              </div>
            </div>
          </div>
        </div>

        <footer class="settings-footer">
          <span class="settings-tip">💡 Mẹo: Bạn có thể nhấn phím <strong>Esc</strong> hoặc biểu tượng bánh răng ở góc phải để mở/đóng nhanh bảng này.</span>
          <button type="button" class="btn-done-settings" id="btnDoneSettings">Hoàn Tất</button>
        </footer>
      </div>
    `;

    this.container.appendChild(this.element);
  }

  bindEvents() {
    // 1. Nút Đóng
    const btnClose = this.element.querySelector('#btnCloseSettingsModal');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.close());
    }

    const btnDone = this.element.querySelector('#btnDoneSettings');
    if (btnDone) {
      btnDone.addEventListener('click', () => this.close());
    }

    // Đóng khi click ra ngoài backdrop
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        this.close();
      }
    });

    // 2. Chuyển đổi các Tabs
    const tabBtns = this.element.querySelectorAll('.settings-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // 3. Tùy chọn chất lượng đồ họa
    const radioInputs = this.element.querySelectorAll('input[name="graphicsQualityRadio"]');
    radioInputs.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const quality = e.target.value;
        this.setGraphicsQuality(quality);
      });
    });

    // 4. Âm lượng BGM & SFX
    const bgmSlider = this.element.querySelector('#bgmVolumeSlider');
    const bgmVal = this.element.querySelector('#bgmVolumeVal');
    if (bgmSlider) {
      bgmSlider.addEventListener('input', (e) => {
        const v = parseInt(e.target.value, 10);
        if (bgmVal) bgmVal.textContent = `${v}%`;
        GameEventBus.emit('UI:SET_AUDIO_VOLUME', { bgm: v / 100 });
      });
    }

    const sfxSlider = this.element.querySelector('#sfxVolumeSlider');
    const sfxVal = this.element.querySelector('#sfxVolumeVal');
    if (sfxSlider) {
      sfxSlider.addEventListener('input', (e) => {
        const v = parseInt(e.target.value, 10);
        if (sfxVal) sfxVal.textContent = `${v}%`;
        GameEventBus.emit('UI:SET_AUDIO_VOLUME', { sfx: v / 100 });
      });
    }
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    const tabBtns = this.element.querySelectorAll('.settings-tab-btn');
    tabBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
    });

    const panes = {
      controls: this.element.querySelector('#tabPaneControls'),
      graphics: this.element.querySelector('#tabPaneGraphics'),
      audio: this.element.querySelector('#tabPaneAudio')
    };

    Object.keys(panes).forEach(k => {
      if (panes[k]) {
        panes[k].style.display = (k === tabId) ? 'block' : 'none';
        panes[k].classList.toggle('active', k === tabId);
      }
    });
  }

  setGraphicsQuality(quality) {
    const cards = this.element.querySelectorAll('.graphics-option-card');
    cards.forEach(c => {
      c.classList.toggle('active', c.dataset.quality === quality);
    });

    if (window.gameEngine && typeof window.gameEngine.setPerformanceMode === 'function') {
      window.gameEngine.setPerformanceMode(quality);
    }

    GameEventBus.emit('UI:NOTIFICATION_TRIGGERED', {
      title: 'Độ Phân Giải & Đồ Họa',
      message: quality === 'high' ? 'Đã kích hoạt chế độ Siêu Sắc Nét 4K trong veo!' :
               quality === 'balanced' ? 'Đã kích hoạt chế độ Cân Bằng 60 FPS!' :
               'Đã kích hoạt chế độ Tiết Kiệm Tốc Độ Cao!',
      type: 'info'
    });
  }

  open(tab = 'controls') {
    this.isOpen = true;
    this.element.style.display = 'flex';
    this.switchTab(tab);
    GameEventBus.emit('UI:SETTINGS_OPENED', { open: true });
  }

  close() {
    this.isOpen = false;
    this.element.style.display = 'none';
    GameEventBus.emit('UI:SETTINGS_OPENED', { open: false });
  }

  toggle(tab = 'controls') {
    if (this.isOpen) {
      this.close();
    } else {
      this.open(tab);
    }
  }
}
