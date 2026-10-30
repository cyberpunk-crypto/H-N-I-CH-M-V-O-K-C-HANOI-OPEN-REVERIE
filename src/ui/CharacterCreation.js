/**
 * CharacterCreation.js - Màn hình tạo nhân vật trước gương căn phòng tập thể cũ
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 * Hỗ trợ 4 nhân vật 3D thực tế theo thiết kế của Tổng Giám Đốc
 */

import { GameEventBus } from '../bridge/GameEvents.js';
import { CHARACTERS_META } from '../core/CharacterFactory.js';

export const CHARACTERS = CHARACTERS_META;
export const OUTFITS = CHARACTERS_META; // Giữ tương thích ngược

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

    this.selectedOutfitId = 'char_nu_sinh_ao_dai';
    this.selectedCameraId = 'leica_m3';
    this.isNameValid = false;
    this.currentName = this.initialName;
    this.debounceTimer = null;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'retro-modal-card character-creator-card';
    
    const selectedChar = CHARACTERS.find(c => c.id === this.selectedOutfitId) || CHARACTERS[0];

    this.element.innerHTML = `
      <div class="card-corner-tr"></div>
      <div class="card-corner-bl"></div>

      <header class="brand-header">
        <div class="brand-badge">CĂN PHÒNG TẬP THỂ CŨ &bull; CHIỀU HOÀNG HÔN</div>
        <h1 class="brand-title">TRƯỚC <span>GƯƠNG KÝ ỨC</span></h1>
        <p class="brand-subtitle">Chọn nhân vật 3D đại diện, trang phục và chuẩn bị chiếc máy ảnh film dạo phố</p>
      </header>

      <div class="creator-layout">
        <!-- Khung gương soi cổ kính -->
        <div class="vintage-mirror-frame">
          <div class="mirror-overlay-dust"></div>
          <div class="mirror-reflection">
            <div class="avatar-silhouette" style="display:flex;align-items:center;justify-content:center;width:140px;height:140px;margin:0 auto;border-radius:50%;overflow:hidden;border:3px solid #d4af37;box-shadow:0 0 20px rgba(212,175,55,0.4);background:#1a1c20;">
              <img id="mirrorCharacterPreview" src="${selectedChar.avatar}" alt="${selectedChar.name}" style="width:100%;height:100%;object-fit:cover;">
            </div>
            <p id="mirrorOutfitCaption" class="mirror-caption" style="margin-top:10px;font-weight:700;color:#ffdf99;">${selectedChar.name}</p>
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

          <!-- Bộ chọn 4 nhân vật 3D hoài niệm từ ảnh thực tế -->
          <div class="outfit-selector-section">
            <div class="outfit-selector-title">Lựa chọn 4 nhân vật 3D khám phá Hà Nội</div>
            <div class="outfit-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              ${CHARACTERS.map(char => `
                <div class="outfit-card ${char.id === this.selectedOutfitId ? 'active' : ''}" data-outfit-id="${char.id}" style="display:flex;align-items:center;padding:8px 10px;border-radius:8px;cursor:pointer;background:rgba(255,255,255,0.04);border:1px solid rgba(212,175,55,0.2);transition:all 0.2s ease;">
                  <div class="outfit-avatar-box" style="width:46px;height:46px;border-radius:50%;overflow:hidden;border:2px solid #d4af37;flex-shrink:0;background:#202228;">
                    <img src="${char.avatar}" alt="${char.name}" style="width:100%;height:100%;object-fit:cover;">
                  </div>
                  <div class="outfit-info" style="margin-left:10px;overflow:hidden;">
                    <span class="outfit-name" style="display:block;font-size:13px;font-weight:700;color:#ffdf99;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${char.name}</span>
                    <span class="outfit-desc" style="display:block;font-size:11px;color:#cfc5b8;opacity:0.85;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${char.desc}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Chọn máy ảnh film -->
          <div class="form-group-retro" style="margin-top: 6px;">
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

    // Chọn nhân vật
    outfitCards.forEach(card => {
      card.addEventListener('click', () => {
        outfitCards.forEach(c => {
          c.classList.remove('active');
          c.style.borderColor = 'rgba(212,175,55,0.2)';
          c.style.background = 'rgba(255,255,255,0.04)';
        });
        card.classList.add('active');
        card.style.borderColor = '#d4af37';
        card.style.background = 'rgba(212,175,55,0.15)';

        this.selectedOutfitId = card.dataset.outfitId;

        const charObj = CHARACTERS.find(o => o.id === this.selectedOutfitId);
        if (charObj) {
          const caption = this.element.querySelector('#mirrorOutfitCaption');
          if (caption) caption.textContent = charObj.name;
          const previewImg = this.element.querySelector('#mirrorCharacterPreview');
          if (previewImg) previewImg.src = charObj.avatar;
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
        input.className = 'name-input is-invalid';
        input.classList.add('shake-animation');
        icon.innerHTML = `<span style="color:#e74c3c">&times;</span>`;
        msg.textContent = result.message || 'Tên này đã có lãng tử sử dụng tại Hà Nội!';
        msg.className = 'name-validation-msg error';
        btnEnter.disabled = true;
        this.isNameValid = false;

        setTimeout(() => input.classList.remove('shake-animation'), 400);

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
      characterId: this.selectedOutfitId,
      outfit: this.selectedOutfitId,
      cameraModel: this.selectedCameraId,
      unlockedPuzzles: [],
      capturedPhotosCount: 0
    };

    window.GameAPI.saveUserProfile(profile);

    GameEventBus.emit('UI:CHARACTER_CONFIRMED', {
      characterName: this.currentName,
      characterId: this.selectedOutfitId,
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
