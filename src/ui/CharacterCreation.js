/**
 * CharacterCreation.js - Màn hình tạo nhân vật trước gương căn phòng tập thể cũ
 * Real-time Validation kiểm tra trùng tên (Debounce 500ms)
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { GameEventBus } from '../bridge/GameEvents.js';

export const OUTFITS = [
  {
    id: 'outfit_ao_dai',
    name: 'Áo Dài Trắng Thanh Lịch',
    desc: 'Tà áo dài trắng học trò Hà thành thướt tha trong gió',
    icon: 'M12 2C9 2 7 5 7 9v13h10V9c0-4-2-7-5-7z'
  },
  {
    id: 'outfit_winter_coat',
    name: 'Áo Phao Mùa Đông Phố Cũ',
    desc: 'Ấm áp giữa những cơn gió mùa đông bắc rét buốt',
    icon: 'M12 2L4 5v15h16V5l-8-3z'
  },
  {
    id: 'outfit_leather_jacket',
    name: 'Áo Khoác Da Bomber Cổ Điển',
    desc: 'Phong cách lãng tử phóng khoáng thập niên 90',
    icon: 'M12 3L2 6v14h20V6L12 3z'
  },
  {
    id: 'outfit_vintage_shirt',
    name: 'Sơ Mi Trắng Quần Tây Thống Nhất',
    desc: 'Thanh niên trí thức Tràng An chỉn chu, mực thước',
    icon: 'M12 2L6 5v15h12V5l-6-3z'
  }
];

export const CAMERAS = [
  { id: 'leica_m3', name: 'Leica M3 Rangefinder (1954)', focal: '50mm f/2' },
  { id: 'canonet_ql17', name: 'Canonet QL17 GIII', focal: '40mm f/1.7' },
  { id: 'zenit_e', name: 'Zenit-E Liên Xô Cơ Khí', focal: '58mm f/2 Helios' }
];

export class CharacterCreation {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.initialName = options.initialName || '';
    this.onCharacterConfirmed = options.onCharacterConfirmed || (() => {});
    this.element = null;

    this.selectedOutfitId = 'outfit_leather_jacket';
    this.selectedCameraId = 'leica_m3';
    this.isNameValid = false;
    this.currentName = this.initialName;
    this.debounceTimer = null;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'retro-modal-card character-creator-card';
    this.element.innerHTML = `
      <div class="card-corner-tr"></div>
      <div class="card-corner-bl"></div>

      <header class="brand-header">
        <div class="brand-badge">CĂN PHÒNG TẬP THỂ CŨ &bull; CHIỀU HOÀNG HÔN</div>
        <h1 class="brand-title">TRƯỚC <span>GƯƠNG KÝ ỨC</span></h1>
        <p class="brand-subtitle">Soi lại bóng hình, chọn trang phục và chuẩn bị chiếc máy ảnh film</p>
      </header>

      <div class="creator-layout">
        <!-- Khung gương soi cổ kính -->
        <div class="vintage-mirror-frame">
          <div class="mirror-overlay-dust"></div>
          <div class="mirror-reflection">
            <div class="avatar-silhouette">
              <svg viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <p id="mirrorOutfitCaption" class="mirror-caption">Áo Khoác Da Bomber Cổ Điển</p>
          </div>
        </div>

        <!-- Form nhập tên & tùy chọn -->
        <div class="character-fields">
          <!-- Ô nhập tên kèm Debounce -->
          <div class="form-group-retro">
            <label for="characterNameInput">Tên Lãng Tử / Kẻ Mộng Mơ (3 &minus; 16 ký tự)</label>
            <div class="name-input-wrapper">
              <input 
                type="text" 
                id="characterNameInput" 
                class="name-input" 
                placeholder="Nhập tên nhân vật..." 
                maxlength="16"
                value="${this.currentName}"
                autocomplete="off"
                spellcheck="false"
              />
              <div id="inputStatusIcon" class="input-status-icon"></div>
            </div>

            <div id="nameValidationMsg" class="name-validation-msg"></div>
            <div id="nameSuggestions" class="name-suggestions" style="display: none;"></div>
          </div>

          <!-- Bộ chọn 4 bộ trang phục hoài niệm -->
          <div class="outfit-selector-section">
            <div class="outfit-selector-title">Lựa chọn trang phục dạo phố</div>
            <div class="outfit-grid">
              ${OUTFITS.map(outfit => `
                <div class="outfit-card ${outfit.id === this.selectedOutfitId ? 'active' : ''}" data-outfit-id="${outfit.id}">
                  <div class="outfit-icon">
                    <svg style="width:20px;height:20px;fill:currentColor" viewBox="0 0 24 24">
                      <path d="${outfit.icon}"/>
                    </svg>
                  </div>
                  <div class="outfit-info">
                    <span class="outfit-name">${outfit.name}</span>
                    <span class="outfit-desc">${outfit.desc}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Chọn máy ảnh film -->
          <div class="form-group-retro" style="margin-top: 4px;">
            <label for="cameraSelect">Máy ảnh film 35mm mang theo</label>
            <select id="cameraSelect" class="retro-select">
              ${CAMERAS.map(cam => `
                <option value="${cam.id}" ${cam.id === this.selectedCameraId ? 'selected' : ''}>
                  ${cam.name} &bull; ${cam.focal}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Nút Bước Vào Ký Ức -->
      <button type="button" id="btnEnterReverie" class="btn-primary-retro btn-enter-reverie" disabled>
        Bước Vào Ký Ức Hà Nội
      </button>
    `;

    this.bindEvents();

    // Nếu đã có initialName thì kiểm tra ngay lập tức
    if (this.currentName) {
      this.validateName(this.currentName);
    }

    return this.element;
  }

  bindEvents() {
    const input = this.element.querySelector('#characterNameInput');
    const outfitCards = this.element.querySelectorAll('.outfit-card');
    const cameraSelect = this.element.querySelector('#cameraSelect');
    const btnEnter = this.element.querySelector('#btnEnterReverie');

    // Debounce 500ms khi gõ tên
    input.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      this.currentName = val;
      this.setCheckingState();

      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.validateName(val);
      }, 500);
    });

    // Chọn trang phục
    outfitCards.forEach(card => {
      card.addEventListener('click', () => {
        outfitCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedOutfitId = card.dataset.outfitId;

        const outfit = OUTFITS.find(o => o.id === this.selectedOutfitId);
        if (outfit) {
          const caption = this.element.querySelector('#mirrorOutfitCaption');
          caption.textContent = outfit.name;
        }
      });
    });

    // Chọn máy ảnh
    cameraSelect.addEventListener('change', (e) => {
      this.selectedCameraId = e.target.value;
    });

    // Nhấn Bước Vào Ký Ức
    btnEnter.addEventListener('click', () => {
      if (this.isNameValid) {
        this.confirmCharacter();
      }
    });
  }

  setCheckingState() {
    const input = this.element.querySelector('#characterNameInput');
    const icon = this.element.querySelector('#inputStatusIcon');
    const msg = this.element.querySelector('#nameValidationMsg');
    const btnEnter = this.element.querySelector('#btnEnterReverie');
    const suggestionsBox = this.element.querySelector('#nameSuggestions');

    input.className = 'name-input';
    icon.innerHTML = `
      <div style="width:14px;height:14px;border:2px solid rgba(212,175,55,0.4);border-top-color:#d4af37;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
    `;
    msg.textContent = 'Đang kiểm tra tính duy nhất tại phố cổ...';
    msg.className = 'name-validation-msg';
    suggestionsBox.style.display = 'none';
    btnEnter.disabled = true;
    this.isNameValid = false;
  }

  async validateName(name) {
    const input = this.element.querySelector('#characterNameInput');
    const icon = this.element.querySelector('#inputStatusIcon');
    const msg = this.element.querySelector('#nameValidationMsg');
    const btnEnter = this.element.querySelector('#btnEnterReverie');
    const suggestionsBox = this.element.querySelector('#nameSuggestions');

    if (!name || name.length < 3) {
      input.className = 'name-input is-invalid';
      input.classList.add('shake-animation');
      icon.innerHTML = `<span style="color:#e74c3c">&times;</span>`;
      msg.textContent = 'Tên nhân vật phải có ít nhất 3 ký tự.';
      msg.className = 'name-validation-msg error';
      suggestionsBox.style.display = 'none';
      btnEnter.disabled = true;
      this.isNameValid = false;
      setTimeout(() => input.classList.remove('shake-animation'), 400);
      return;
    }

    try {
      const result = await window.GameAPI.checkCharacterNameAvailability(name);

      if (result.isValid) {
        // HỢP LỆ
        input.className = 'name-input is-valid';
        icon.innerHTML = `
          <svg style="width:18px;height:18px;fill:#2ecc71" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        `;
        msg.textContent = result.message || 'Tên hợp lệ! Bạn là người duy nhất sở hữu tên này.';
        msg.className = 'name-validation-msg success';
        suggestionsBox.style.display = 'none';
        btnEnter.disabled = false;
        this.isNameValid = true;
      } else {
        // TRÙNG TÊN HOẶC KHÔNG HỢP LỆ
        input.className = 'name-input is-invalid shake-animation';
        icon.innerHTML = `
          <svg style="width:18px;height:18px;fill:#e74c3c" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        `;
        msg.textContent = result.message || 'Tên này đã có lãng tử sử dụng tại Hà Nội!';
        msg.className = 'name-validation-msg error';
        btnEnter.disabled = true;
        this.isNameValid = false;

        setTimeout(() => input.classList.remove('shake-animation'), 400);

        // Hiển thị gợi ý
        if (result.suggestions && result.suggestions.length > 0) {
          suggestionsBox.style.display = 'flex';
          suggestionsBox.innerHTML = `
            <span class="suggestions-label">Gợi ý tên độc đáo dành cho bạn:</span>
            ${result.suggestions.map(sug => `
              <button type="button" class="suggestion-chip" data-name="${sug}">${sug}</button>
            `).join('')}
          `;

          suggestionsBox.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
              const newName = chip.dataset.name;
              input.value = newName;
              this.currentName = newName;
              this.validateName(newName);
            });
          });
        } else {
          suggestionsBox.style.display = 'none';
        }
      }
    } catch (err) {
      console.error('Validation error:', err);
      msg.textContent = 'Lỗi kết nối kiểm tra tên, vui lòng thử lại.';
      msg.className = 'name-validation-msg error';
      btnEnter.disabled = true;
      this.isNameValid = false;
    }
  }

  confirmCharacter() {
    const profile = {
      username: this.currentName,
      outfit: this.selectedOutfitId,
      cameraModel: this.selectedCameraId,
      unlockedPuzzles: [],
      capturedPhotosCount: 0
    };

    // Lưu vào LocalStorage thông qua GameAPI
    window.GameAPI.saveUserProfile(profile);

    // Bắn sự kiện theo bảng hợp đồng 3.2
    GameEventBus.emit('UI:CHARACTER_CONFIRMED', {
      characterName: this.currentName,
      outfitId: this.selectedOutfitId,
      cameraModel: this.selectedCameraId
    });

    if (typeof this.onCharacterConfirmed === 'function') {
      this.onCharacterConfirmed(profile);
    }
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
