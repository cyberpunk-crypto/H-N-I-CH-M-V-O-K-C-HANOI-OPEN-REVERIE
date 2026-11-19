/**
 * SettingsModal.js - Bảng Bánh Răng Cài Đặt, Cụm Hành Trình Khám Phá & Chu Kỳ Ngày - Đêm
 * Phong cách thiết kế Canva Vintage: Viền mạ vàng hoàng gia, giấy điệp cổ và hoài niệm Hà Nội
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 * 
 * Tích hợp toàn diện:
 * 1. Cụm Hành Trình: Máy Ảnh, Bản Đồ, Album Ký Ức, và 4 Nhân Vật Việt Nam độc bản
 * 2. Bộ điều khiển Chu kỳ Ngày - Đêm Mùa Thu & Bầu trời Hà Nội
 * 3. Hướng dẫn phím điều khiển, Đồ họa sắc nét 60 FPS, Âm thanh BGM/SFX
 */

import { GameEventBus } from '../bridge/GameEvents.js';
import { CHARACTERS } from './CharacterCreation.js';

export class SettingsModal {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.element = null;
    this.isOpen = false;
    this.activeTab = 'journey'; // 'journey' | 'daynight' | 'controls' | 'graphics' | 'audio'
    this.currentCharacterId = 'char_nu_sinh_ao_dai';
    this.currentDayNightMode = 'cycle';
    this.currentCycleDuration = 24; // phút (Mặc định 24 phút: 1 giờ game = 1 phút thực tế)
    this.currentTimeOfDay = 9.5; // giờ

    this.render();
    this.bindEvents();
    this._listenToGameEvents();
  }

  _listenToGameEvents() {
    GameEventBus.on('CORE:CHARACTER_SWITCHED', (payload) => {
      if (payload && payload.characterId) {
        this.updateActiveCharacter(payload.characterId);
      }
    });

    GameEventBus.on('CORE:DAY_NIGHT_UPDATED', (payload) => {
      if (payload) {
        if (typeof payload.timeOfDay === 'number') {
          this.currentTimeOfDay = payload.timeOfDay;
          this._updateDayNightDisplay(payload.timeOfDay, payload.phaseName);
        }
      }
    });
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
            <h2 id="settingsDialogTitle" class="settings-title">CÀI ĐẶT & HÀNH TRÌNH KHÁM PHÁ</h2>
          </div>
          <button type="button" class="btn-close-settings" id="btnCloseSettingsModal" title="Đóng bảng (Esc)">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </header>

        <nav class="settings-nav-tabs">
          <button type="button" class="settings-tab-btn active" data-tab="journey">
            <span>🌟 Hành Trình & Nhân Vật</span>
          </button>
          <button type="button" class="settings-tab-btn" data-tab="daynight">
            <span>⛅ Ngày & Đêm Mùa Thu</span>
          </button>
          <button type="button" class="settings-tab-btn" data-tab="controls">
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
          <!-- TAB 1: HÀNH TRÌNH & 4 NHÂN VẬT VIỆT NAM ĐỘC BẢN -->
          <div class="settings-tab-pane active" id="tabPaneJourney">
            <!-- Cụm công cụ khám phá nhanh -->
            <div class="settings-section-title">
              <span>📸 Cụm Công Cụ Khám Phá Hà Nội</span>
              <small style="color:var(--c-yellow-cuc);font-family:var(--font-mono);font-size:0.75rem;">Thu gọn từ HUD để góc nhìn thông thoáng</small>
            </div>
            <div class="journey-tools-row">
              <button type="button" class="btn-journey-tool" id="btnSettingsCamera" title="Chuyển góc nhìn camera (Phím C hoặc V)">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                </svg>
                <div class="tool-text">
                  <strong>Máy Ảnh Film 35mm</strong>
                  <span>Đổi góc nhìn thứ nhất / thứ ba (Phím C / V)</span>
                </div>
              </button>

              <button type="button" class="btn-journey-tool" id="btnSettingsMap" title="Mở bản đồ du lịch cổ điển (Phím Tab hoặc M)">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
                </svg>
                <div class="tool-text">
                  <strong>Bản Đồ Du Lịch Hà Nội</strong>
                  <span>Toàn cảnh 4 phân khu & dịch chuyển (Phím M)</span>
                </div>
              </button>

              <button type="button" class="btn-journey-tool" id="btnSettingsAlbum" title="Mở cuốn Album Ký Ức (Phím B)">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                </svg>
                <div class="tool-text">
                  <strong>Cuốn Album Ký Ức</strong>
                  <span>Bộ sưu tập ảnh film & tem cổ Thăng Long (Phím B)</span>
                </div>
              </button>
            </div>

            <!-- Cụm đổi 4 nhân vật Việt Nam độc bản -->
            <div class="settings-section-title" style="margin-top:18px;">
              <span>👥 Hóa Thân 4 Nhân Vật Việt Nam Độc Bản</span>
              <small style="color:var(--c-yellow-cuc);font-family:var(--font-mono);font-size:0.75rem;">Mỗi nhân vật mang một ký ức và dáng vẻ văn hóa riêng biệt</small>
            </div>
            <div class="settings-character-grid">
              ${CHARACTERS.map(c => `
                <div class="settings-char-card ${c.id === this.currentCharacterId ? 'active' : ''}" data-char-id="${c.id}">
                  <div class="char-card-avatar">
                    <img src="${c.avatar}" alt="${c.name}">
                  </div>
                  <div class="char-card-info">
                    <span class="char-card-name">${c.name}</span>
                    <span class="char-card-title">${c.culturalTitle || c.title}</span>
                    <p class="char-card-desc">${c.desc}</p>
                    <button type="button" class="btn-select-char" data-char-id="${c.id}">
                      ${c.id === this.currentCharacterId ? '✓ Đang Hóa Thân' : 'Hóa Thân &rarr;'}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- TAB 2: THỜI GIAN & CHU KỲ NGÀY - ĐÊM MÙA THU -->
          <div class="settings-tab-pane" id="tabPaneDayNight" style="display: none;">
            <div class="settings-section-title">
              <span>⛅ Tùy Chỉnh Không Khí & Chu Kỳ Ngày - Đêm</span>
              <small style="color:var(--c-yellow-cuc);font-family:var(--font-mono);font-size:0.75rem;">Trời mùa thu Hà Nội man mác, mây bồng bềnh và đèn đêm ấm áp</small>
            </div>

            <div class="daynight-presets-grid">
              <button type="button" class="btn-dn-preset active" data-dn-mode="cycle">
                <span class="preset-icon">🔄</span>
                <strong>Tự Động Luân Phiên</strong>
                <p>Sáng &bull; Trưa &bull; Chiều Hoàng Hôn &bull; Đêm Trăng</p>
              </button>

              <button type="button" class="btn-dn-preset" data-dn-mode="day">
                <span class="preset-icon">☀️</span>
                <strong>Sáng Mùa Thu Hà Nội</strong>
                <p>Trời xanh trong trẻo, sương sớm dịu dàng, lá sấu rơi</p>
              </button>

              <button type="button" class="btn-dn-preset" data-dn-mode="sunset">
                <span class="preset-icon">🌇</span>
                <strong>Chiều Tà Hoàng Hôn</strong>
                <p>Nắng mật ong vàng rực rỡ, sắc tím chiều Hồ Gươm</p>
              </button>

              <button type="button" class="btn-dn-preset" data-dn-mode="night">
                <span class="preset-icon">🌙</span>
                <strong>Đêm Trăng Phố Cổ</strong>
                <p>Thắp sáng toàn bộ cột đèn đường, đèn lồng & Cầu Thê Húc</p>
              </button>
            </div>

            <!-- Tùy chỉnh tốc độ chu kỳ -->
            <div class="daynight-controls-box" style="margin-top:16px;">
              <div class="audio-slider-row">
                <div class="audio-label-group">
                  <span>⏱️ Tốc Độ Chu Kỳ Ngày - Đêm (Thời lượng 24 giờ trong game)</span>
                  <span id="cycleDurationVal" class="vol-chip">${this.currentCycleDuration} Phút</span>
                </div>
                <div class="duration-chips-row">
                  <button type="button" class="btn-duration-chip" data-min="12">12 Phút (Nhanh)</button>
                  <button type="button" class="btn-duration-chip active" data-min="24">24 Phút (Mặc Định)</button>
                  <button type="button" class="btn-duration-chip" data-min="36">36 Phút (Thư Thái)</button>
                  <button type="button" class="btn-duration-chip" data-min="48">48 Phút (Dài Lâu)</button>
                </div>
              </div>

              <!-- Thanh trượt điều chỉnh giờ thủ công -->
              <div class="audio-slider-row" style="margin-top:14px;">
                <div class="audio-label-group">
                  <span>🕒 Kéo Giờ Trong Ngày (0h00 - 24h00)</span>
                  <span id="timeOfDayVal" class="vol-chip">${this._formatHourString(this.currentTimeOfDay)}</span>
                </div>
                <input type="range" id="timeOfDaySlider" min="0" max="24" step="0.25" value="${this.currentTimeOfDay}" class="hanoi-slider">
              </div>
            </div>
          </div>

          <!-- TAB 3: PHÍM ĐIỀU KHIỂN -->
          <div class="settings-tab-pane" id="tabPaneControls" style="display: none;">
            <div class="settings-controls-grid">
              <div class="settings-control-card">
                <div class="ctrl-keys">
                  <span class="keycap">W</span><span class="keycap">A</span><span class="keycap">S</span><span class="keycap">D</span>
                </div>
                <div class="ctrl-desc">
                  <strong>Di chuyển nhân vật</strong>
                  <p>Bước đi trên phố cổ, leo đại cầu thang Ga Long Biên</p>
                </div>
              </div>

              <div class="settings-control-card">
                <div class="ctrl-keys">
                  <span class="keycap">Shift</span>
                </div>
                <div class="ctrl-desc">
                  <strong>Chạy nhanh</strong>
                  <p>Tăng tốc khám phá đại lộ di sản Cầu Long Biên ↔ Thê Húc</p>
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
                  <p>Uống trà đá vỉa hè, bật đài cassette, chiêm ngưỡng tranh sơn dầu di sản</p>
                </div>
              </div>

              <div class="settings-control-card">
                <div class="ctrl-keys">
                  <span class="keycap">Tab</span> <span class="keycap">M</span>
                </div>
                <div class="ctrl-desc">
                  <strong>Bản đồ du lịch Hà Nội</strong>
                  <p>La bàn chỉ hướng 0° Bắc & dịch chuyển nhanh</p>
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

          <!-- TAB 4: ĐỒ HỌA & ĐỘ SẮC NÉT -->
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

          <!-- TAB 5: ÂM THANH -->
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
          <span class="settings-tip">💡 Mẹo: Nhấn <strong>Esc</strong> hoặc biểu tượng bánh răng ở góc phải để mở/đóng nhanh bảng này.</span>
          <button type="button" class="btn-done-settings" id="btnDoneSettings">Hoàn Tất</button>
        </footer>
      </div>
    `;

    this.container.appendChild(this.element);
  }

  bindEvents() {
    // 1. Nút Đóng
    const btnClose = this.element.querySelector('#btnCloseSettingsModal');
    if (btnClose) btnClose.addEventListener('click', () => this.close());

    const btnDone = this.element.querySelector('#btnDoneSettings');
    if (btnDone) btnDone.addEventListener('click', () => this.close());

    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) this.close();
    });

    // 2. Chuyển đổi Tabs
    const tabBtns = this.element.querySelectorAll('.settings-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // 3. Cụm công cụ hành trình: Máy ảnh, Bản đồ, Album
    const btnCam = this.element.querySelector('#btnSettingsCamera');
    if (btnCam) {
      btnCam.addEventListener('click', () => {
        this.close();
        if (window._UIManagerInstance && window._UIManagerInstance.viewfinder) {
          const vf = window._UIManagerInstance.viewfinder;
          vf.switchCameraMode(vf.currentMode === 'FPS' ? 'TPS' : 'FPS');
        }
      });
    }

    const btnMap = this.element.querySelector('#btnSettingsMap');
    if (btnMap) {
      btnMap.addEventListener('click', () => {
        this.close();
        if (window._UIManagerInstance && window._UIManagerInstance.minimap) {
          window._UIManagerInstance.minimap.openMapModal();
        }
      });
    }

    const btnAlbum = this.element.querySelector('#btnSettingsAlbum');
    if (btnAlbum) {
      btnAlbum.addEventListener('click', () => {
        this.close();
        if (window._UIManagerInstance && window._UIManagerInstance.scrapbook) {
          window._UIManagerInstance.scrapbook.openAlbum();
        }
      });
    }

    // 4. Chọn 4 nhân vật Việt Nam độc bản
    const charCards = this.element.querySelectorAll('.settings-char-card');
    charCards.forEach(card => {
      card.addEventListener('click', () => {
        const charId = card.dataset.charId;
        this.selectCharacter(charId);
      });
    });

    // 5. Chu kỳ Ngày - Đêm Presets
    const presetBtns = this.element.querySelectorAll('.btn-dn-preset');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.dnMode;
        presetBtns.forEach(b => b.classList.toggle('active', b === btn));
        this.currentDayNightMode = mode;
        GameEventBus.emit('UI:SET_DAY_NIGHT_MODE', {
          mode,
          durationMinutes: this.currentCycleDuration
        });
      });
    });

    // 6. Thời lượng chu kỳ ngày đêm
    const durChips = this.element.querySelectorAll('.btn-duration-chip');
    durChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const mins = parseInt(chip.dataset.min, 10);
        durChips.forEach(c => c.classList.toggle('active', c === chip));
        this.currentCycleDuration = mins;
        const durVal = this.element.querySelector('#cycleDurationVal');
        if (durVal) durVal.textContent = `${mins} Phút`;
        GameEventBus.emit('UI:SET_DAY_NIGHT_MODE', {
          mode: this.currentDayNightMode,
          durationMinutes: mins
        });
      });
    });

    // 7. Thanh kéo giờ trong ngày
    const timeSlider = this.element.querySelector('#timeOfDaySlider');
    if (timeSlider) {
      timeSlider.addEventListener('input', (e) => {
        const hour = parseFloat(e.target.value);
        this.currentTimeOfDay = hour;
        const timeVal = this.element.querySelector('#timeOfDayVal');
        if (timeVal) timeVal.textContent = this._formatHourString(hour);
        GameEventBus.emit('UI:SET_DAY_NIGHT_MODE', {
          timeOfDay: hour
        });
      });
    }

    // 8. Tùy chọn chất lượng đồ họa
    const radioInputs = this.element.querySelectorAll('input[name="graphicsQualityRadio"]');
    radioInputs.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const quality = e.target.value;
        this.setGraphicsQuality(quality);
      });
    });

    // 9. Âm lượng BGM & SFX
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

  selectCharacter(charId) {
    if (!charId) return;
    this.updateActiveCharacter(charId);

    // Kích hoạt qua UIManager instance hoặc GameEventBus
    if (window._UIManagerInstance && typeof window._UIManagerInstance.switchCharacter === 'function') {
      window._UIManagerInstance.switchCharacter(charId);
    } else {
      GameEventBus.emit('CORE:SWITCH_CHARACTER', { characterId: charId });
    }
  }

  updateActiveCharacter(charId) {
    this.currentCharacterId = charId;
    const charCards = this.element.querySelectorAll('.settings-char-card');
    charCards.forEach(card => {
      const match = (card.dataset.charId === charId);
      card.classList.toggle('active', match);
      const btn = card.querySelector('.btn-select-char');
      if (btn) btn.textContent = match ? '✓ Đang Hóa Thân' : 'Hóa Thân →';
    });
  }

  _formatHourString(hourFloat) {
    const totalMinutes = Math.floor(hourFloat * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const hStr = h < 10 ? `0${h}` : `${h}`;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${hStr}h${mStr}`;
  }

  _updateDayNightDisplay(hour, phaseName) {
    const timeVal = this.element.querySelector('#timeOfDayVal');
    const timeSlider = this.element.querySelector('#timeOfDaySlider');
    if (timeVal) timeVal.textContent = this._formatHourString(hour);
    if (timeSlider && Math.abs(parseFloat(timeSlider.value) - hour) > 0.4) {
      timeSlider.value = hour;
    }
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    const tabBtns = this.element.querySelectorAll('.settings-tab-btn');
    tabBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
    });

    const panes = {
      journey: this.element.querySelector('#tabPaneJourney'),
      daynight: this.element.querySelector('#tabPaneDayNight'),
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

  open(tab = 'journey') {
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

  toggle(tab = 'journey') {
    if (this.isOpen) {
      this.close();
    } else {
      this.open(tab);
    }
  }
}
