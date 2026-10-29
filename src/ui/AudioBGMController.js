/**
 * AudioBGMController.js - Nút bật tắt nhạc và thanh điều chỉnh âm lượng hoài niệm
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { GameEventBus } from '../bridge/GameEvents.js';

export class AudioBGMController {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.element = null;

    // Đọc thiết lập âm lượng đã lưu
    const saved = this.loadSavedSettings();
    this.master = saved.master ?? 0.8;
    this.bgm = saved.bgm ?? 0.7;
    this.sfx = saved.sfx ?? 0.9;
    this.isMuted = saved.isMuted ?? false;
    this.isPopoverOpen = false;

    this.render();
  }

  loadSavedSettings() {
    try {
      const raw = localStorage.getItem('hanoi_audio_settings');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('hanoi_audio_settings', JSON.stringify({
        master: this.master,
        bgm: this.bgm,
        sfx: this.sfx,
        isMuted: this.isMuted
      }));
    } catch (e) {}
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'audio-controller-widget hud-interactive';
    this.element.innerHTML = `
      <button type="button" id="btnVinylToggle" class="btn-vinyl-toggle ${!this.isMuted ? 'playing' : ''}" title="Bật/Tắt Nhạc Hoài Niệm">
        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 3" fill="none"/>
        </svg>
      </button>

      <div id="audioVolumePopover" class="audio-volume-popover hidden">
        <span style="font-size:0.75rem;font-family:var(--font-mono);color:var(--c-yellow-cuc)">ÂM LƯỢNG</span>
        <input 
          type="range" 
          id="bgmVolumeSlider" 
          class="vintage-volume-slider" 
          min="0" 
          max="1" 
          step="0.05" 
          value="${this.isMuted ? 0 : this.bgm}"
        />
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
    this.emitVolume();
  }

  bindEvents() {
    const btnToggle = this.element.querySelector('#btnVinylToggle');
    const popover = this.element.querySelector('#audioVolumePopover');
    const slider = this.element.querySelector('#bgmVolumeSlider');

    // Click vào đĩa than để bật / tắt popover & mute toggle
    btnToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isPopoverOpen = !this.isPopoverOpen;
      popover.classList.toggle('hidden', !this.isPopoverOpen);
    });

    // Kéo thanh âm lượng
    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.bgm = val;
      this.master = val > 0 ? 0.8 : 0;
      this.isMuted = val === 0;

      if (this.isMuted) {
        btnToggle.classList.remove('playing');
      } else {
        btnToggle.classList.add('playing');
      }

      this.saveSettings();
      this.emitVolume();
    });

    // Ẩn popover khi click ra ngoài
    document.addEventListener('click', (e) => {
      if (this.isPopoverOpen && !this.element.contains(e.target)) {
        this.isPopoverOpen = false;
        popover.classList.add('hidden');
      }
    });
  }

  emitVolume() {
    const effectiveBgm = this.isMuted ? 0 : this.bgm;
    const effectiveMaster = this.isMuted ? 0 : this.master;

    // Bắn sự kiện theo bảng hợp đồng 3.2
    GameEventBus.emit('UI:SET_AUDIO_VOLUME', {
      master: effectiveMaster,
      bgm: effectiveBgm,
      sfx: this.sfx
    });
  }
}
