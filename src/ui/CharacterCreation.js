/**
 * CharacterCreation.js - Màn hình tạo nhân vật & Chọn diện mạo người 3D trước gương phòng tập thể cũ
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 * Hỗ trợ 4 nhân vật 3D Việt Nam độc bản hoàn chỉnh chuẩn mực văn hóa Thăng Long
 * Tích hợp Debounce 500ms kiểm tra tên và Cooldown 600ms chống spam click (Khắc phục triệt để Lỗi 6)
 */

import { GameEventBus } from '../bridge/GameEvents.js';
import { CHARACTERS_META } from '../core/CharacterFactory.js';

export const DEFAULT_CHARACTERS = [
  {
    id: 'char_nu_sinh_ao_dai',
    name: 'Nữ Sinh Tràng An • Áo Dài Trắng Nón Lá',
    shortName: 'Nữ Sinh Tràng An',
    title: 'Biểu Tượng Vẻ Đẹp Thuần Khiết Đất Thăng Long',
    culturalTitle: 'Nữ Sinh Tràng An • Thuần Khiết Thăng Long',
    badge: 'Hồ Gươm & Tháp Rùa',
    culturalHeritage: 'Đền Ngọc Sơn & Cầu Thê Húc "Ngưng Tụ Ánh Sáng Mặt Trời"',
    outfitFeature: 'Áo dài lụa tơ tằm trắng ngà, quần lụa suông rộng, nón lá bài thơ nan tre vàng óng, hoa tai ngọc trai xà cừ',
    desc: 'Tà áo dài trắng học trò thướt tha trong gió sớm hồ Gươm, chiếc nón lá bài thơ che nghiêng e ấp, nét thanh lịch nghìn năm Thăng Long.',
    avatar: 'assets/characters/avatar_char_nu_sinh_ao_dai.png'
  },
  {
    id: 'char_co_gai_ao_ba_ba',
    name: 'Cô Gái Phố Thị • Áo Bà Ba Hồng Cánh Sen Khăn Rằn',
    shortName: 'Cô Gái Phố Thị',
    title: 'Thiếu Nữ Phố Hàng Tảo Tần Đôn Hậu',
    culturalTitle: 'Cô Gái Phố Thị • Tảo Tần Đôn Hậu',
    badge: '36 Phố Phường',
    culturalHeritage: '36 Phố Phường Hà Nội & Cửa Ô Quan Chưởng Cổ Kính',
    outfitFeature: 'Áo bà ba đũi tơ tằm hồng cánh sen xẻ tà hông, quần lụa đen bóng mờ, khăn rằn caro dệt thủ công, nón lá đeo sau lưng',
    desc: 'Chiếc áo bà ba màu hồng cánh sen dịu dàng, khăn rằn quàng cổ mộc mạc, nón lá đeo sau lưng, nụ cười rạng rỡ đón khách phương xa.',
    avatar: 'assets/characters/avatar_char_co_gai_ao_ba_ba.png'
  },
  {
    id: 'char_nam_tri_thuc_suit',
    name: 'Nam Trí Thức Hà Nội • Âu Phục Suit Lịch Lãm',
    shortName: 'Nam Trí Thức Hà Nội',
    title: 'KTS Trí Thức Hà Thành Hào Hoa Lịch Lãm',
    culturalTitle: 'Nam Trí Thức Hà Nội • Hào Hoa Lịch Lãm',
    badge: 'Cầu Long Biên',
    culturalHeritage: 'Cầu Long Biên Thép Eiffel (1898 - 1902) & Ký Ức Sông Hồng',
    outfitFeature: 'Âu phục Suit xám than dạ tweed cao cấp, ve áo Notch Lapel 3D, cà vạt đỏ mận vintage, quần âu có nếp ly, giày da Oxford',
    desc: 'Bộ âu phục suit xám than lịch lãm chỉn chu, cà vạt thanh lịch, giày da bóng lộn, phong thái trí thức hiện đại giao thoa ký ức hào hoa.',
    avatar: 'assets/characters/avatar_char_nam_tri_thuc_suit.png'
  },
  {
    id: 'char_nam_ao_dai_gam',
    name: 'Chàng Trai Thăng Long • Áo Dài Gấm Xanh Hoàng Gia',
    shortName: 'Chàng Trai Thăng Long',
    title: 'Quý Ông Tràng An Nho Nhã Di Sản',
    culturalTitle: 'Chàng Trai Thăng Long • Di Sản Kinh Kỳ',
    badge: 'Di Sản Tràng An',
    culturalHeritage: 'Tháp Rùa Cổ Kính (1886) & Khí Phách Văn Hiến Thăng Long',
    outfitFeature: 'Áo dài ngũ thân gấm dệt hoa văn hoàng gia xanh lam, 5 khuy ngọc bích xanh ngọc, quần âu trắng mực thước, khăn xếp 5 tầng nếp',
    desc: 'Áo dài ngũ thân cách tân gấm dệt hoa văn cổ ngũ thân xanh lam hoàng gia, quần âu trắng mực thước, cốt cách quý ông Tràng An lịch thiệp uyên bác.',
    avatar: 'assets/characters/avatar_char_nam_ao_dai_gam.png'
  }
];

// Hợp nhất dữ liệu văn hóa phong phú
export const CHARACTERS = DEFAULT_CHARACTERS.map(c => {
  const meta = (CHARACTERS_META || []).find(m => m.id === c.id || (m.legacyIds && m.legacyIds.includes(c.id)));
  return meta ? { ...meta, ...c } : c;
});

export const OUTFITS = CHARACTERS; // Giữ tương thích ngược

export const CAMERAS = [
  { id: 'leica_m3', name: 'Leica M3 Rangefinder (1954)', focal: '50mm f/2 Summicron' },
  { id: 'canonet_ql17', name: 'Canonet QL17 GIII (1972)', focal: '40mm f/1.7' },
  { id: 'zenit_e', name: 'Zenit-E Liên Xô Cơ Khí (1965)', focal: '58mm f/2 Helios 44-2' }
];

export class CharacterCreation {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - Container gắn kết
   * @param {string} options.initialName - Tên ban đầu nếu có
   * @param {string} options.initialCharacterId - ID nhân vật ban đầu
   * @param {string} options.initialCameraId - ID máy ảnh ban đầu
   * @param {boolean} options.isRecreate - Có phải đang mở từ nút HUD để đổi nhân vật không
   * @param {Function} options.onClose - Callback khi đóng / hủy modal
   * @param {Function} options.onCharacterConfirmed - Callback khi xác nhận
   */
  constructor(options = {}) {
    this.container = options.container || (typeof document !== 'undefined' ? document.body : null);
    this.initialName = options.initialName || `KẻMộngMơ_${Math.floor(100 + Math.random() * 900)}`;
    this.initialCharacterId = options.initialCharacterId || options.initialOutfitId || 'char_nu_sinh_ao_dai';
    this.initialCameraId = options.initialCameraId || 'leica_m3';
    this.isRecreate = !!options.isRecreate;
    this.onClose = options.onClose || (() => {});
    this.onCharacterConfirmed = options.onCharacterConfirmed || (() => {});
    this.element = null;

    this.selectedCharacterId = this.initialCharacterId;
    this.selectedOutfitId = this.selectedCharacterId; // alias
    this.selectedCameraId = this.initialCameraId;
    this.isNameValid = false;
    this.currentName = this.initialName;
    this.debounceTimer = null;

    // Cơ chế Debounce / Cooldown chống spam click (Khắc phục Lỗi 6)
    this.isSwitching = false;
    this.isSwitchingCharacter = false; // alias đồng bộ đặc tả
    this.lastSwitchTime = 0;
    this.COOLDOWN_MS = 600; // Tối thiểu 600ms chống race condition
    this.switchCooldownTimer = null;

    // Lắng nghe sự kiện Core đã chuyển đổi xong
    this._onCharacterSwitched = (payload) => {
      this.unlockSwitching();
    };
    GameEventBus.on('CORE:CHARACTER_SWITCHED', this._onCharacterSwitched);
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'retro-modal-card character-creator-card';
    
    const selectedChar = CHARACTERS.find(c => c.id === this.selectedCharacterId) || CHARACTERS[0];

    this.element.innerHTML = `
      <div class="card-corner-tr"></div>
      <div class="card-corner-bl"></div>

      ${this.isRecreate ? `
        <button type="button" class="btn-modal-close" id="btnCloseCharacterModal" title="Đóng & tiếp tục dạo phố">
          &times;
        </button>
      ` : ''}

      <header class="brand-header">
        <div class="brand-badge">${this.isRecreate ? 'ĐỔI DIỆN MẠO 3D &bull; KHÁM PHÁ HÀ NỘI' : 'CĂN PHÒNG TẬP THỂ CŨ &bull; CHIỀU HOÀNG HÔN'}</div>
        <h1 class="brand-title">TRƯỚC <span>GƯƠNG KÝ ỨC</span></h1>
        <p class="brand-subtitle">${this.isRecreate ? 'Chọn 1 trong 4 nhân vật Việt Nam độc bản và chuyển đổi tức thì trong thế giới 3D' : 'Chọn nhân vật Việt Nam đại diện, trang phục đặc trưng và chuẩn bị máy ảnh film dạo phố'}</p>
      </header>

      <div class="creator-layout">
        <!-- Khung gương soi cổ kính -->
        <div class="vintage-mirror-frame">
          <div class="mirror-overlay-dust"></div>
          <div class="mirror-status-badge">MÔ HÌNH 3D VIỆT NAM &bull; <span id="mirrorBadgeText">${selectedChar.badge || 'HÀ NỘI'}</span></div>
          <div class="mirror-reflection">
            <div class="avatar-silhouette">
              <img id="mirrorCharacterPreview" class="mirror-avatar-img" src="${selectedChar.avatar}" alt="${selectedChar.name}">
            </div>
            <p id="mirrorOutfitCaption" class="mirror-caption">${selectedChar.name}</p>
            <p id="mirrorCulturalTitle" class="mirror-cultural-title">${selectedChar.title || selectedChar.culturalTitle}</p>
            <div class="mirror-costume-box">
              <span class="costume-label">Trang phục đặc trưng:</span>
              <p id="mirrorOutfitFeature" class="costume-detail">${selectedChar.outfitFeature}</p>
            </div>
            <div class="mirror-heritage-box">
              <span class="heritage-label">Di sản văn hóa:</span>
              <p id="mirrorHeritageDesc" class="heritage-detail">${selectedChar.culturalHeritage || selectedChar.desc}</p>
            </div>
          </div>
        </div>

        <!-- Form nhập tên & tùy chọn -->
        <div class="character-fields">
          <!-- Ô nhập tên kèm Debounce 500ms -->
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

          <!-- Bộ chọn 4 nhân vật 3D Việt Nam độc bản -->
          <div class="outfit-selector-section">
            <div class="outfit-selector-title">4 Nhân Vật Việt Nam Độc Bản • Chọn Diện Mạo</div>
            <div class="outfit-grid" id="outfitGridContainer">
              ${CHARACTERS.map(char => {
                const isActive = (char.id === this.selectedCharacterId);
                return `
                  <div class="outfit-card ${isActive ? 'active' : ''}" 
                       data-character-id="${char.id}" 
                       data-outfit-id="${char.id}"
                       tabindex="0"
                       role="button"
                       aria-pressed="${isActive}">
                    <div class="outfit-avatar-box">
                      <img src="${char.avatar}" alt="${char.name}">
                    </div>
                    <div class="outfit-info">
                      <div class="outfit-badge-row">
                        <span class="outfit-badge">${char.badge || 'Hà Nội 3D'}</span>
                      </div>
                      <span class="outfit-name">${char.name}</span>
                      <span class="outfit-title-tag">${char.shortName}</span>
                      <span class="outfit-costume-hint">${char.outfitFeature}</span>
                    </div>
                    <div class="outfit-check-icon">
                      <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Chọn máy ảnh film -->
          <div class="form-group-retro">
            <label for="cameraSelect">Máy ảnh film 35mm mang theo dạo phố</label>
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

      <!-- Khung nút hành động -->
      <div class="creator-actions-row">
        ${this.isRecreate ? `
          <button type="button" id="btnCancelCharacterModal" class="btn-secondary-retro">
            Hủy & Tiếp Tục Dạo Phố
          </button>
        ` : ''}
        <button type="button" id="btnEnterReverie" class="btn-primary-retro btn-enter-reverie" disabled>
          ${this.isRecreate ? 'Xác Nhận Đổi Nhân Vật' : 'Bước Vào Ký Ức Hà Nội'}
        </button>
      </div>
    `;

    this.bindEvents();

    // Tự động kiểm tra tên ban đầu nếu đã có
    if (this.currentName && this.currentName.length >= 3) {
      this.validateName(this.currentName);
    }

    return this.element;
  }

  bindEvents() {
    const input = this.element.querySelector('#characterNameInput');
    const outfitCards = this.element.querySelectorAll('.outfit-card');
    const cameraSelect = this.element.querySelector('#cameraSelect');
    const btnEnter = this.element.querySelector('#btnEnterReverie');
    const btnClose = this.element.querySelector('#btnCloseCharacterModal');
    const btnCancel = this.element.querySelector('#btnCancelCharacterModal');

    // Debounce 500ms khi gõ tên
    input.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      this.currentName = val;

      const icon = this.element.querySelector('#inputStatusIcon');
      const msg = this.element.querySelector('#nameValidationMsg');
      const suggestionsBox = this.element.querySelector('#nameSuggestions');

      if (!val) {
        clearTimeout(this.debounceTimer);
        input.className = 'name-input';
        if (icon) icon.innerHTML = '';
        if (msg) {
          msg.textContent = 'Vui lòng nhập tên lãng tử (3 - 16 ký tự).';
          msg.className = 'name-validation-msg';
        }
        if (suggestionsBox) suggestionsBox.style.display = 'none';
        btnEnter.disabled = true;
        this.isNameValid = false;
        return;
      }

      if (val.length < 3) {
        clearTimeout(this.debounceTimer);
        input.className = 'name-input';
        if (icon) icon.innerHTML = '';
        if (msg) {
          msg.textContent = `Tên nhân vật cần tối thiểu 3 ký tự (đang có ${val.length})...`;
          msg.className = 'name-validation-msg';
        }
        if (suggestionsBox) suggestionsBox.style.display = 'none';
        btnEnter.disabled = true;
        this.isNameValid = false;
        return;
      }

      // Đã đủ >= 3 ký tự: hiện trạng thái đang kiểm tra và kích hoạt debounce 500ms
      this.setCheckingState();

      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.validateName(val);
      }, 500);
    });

    // Chọn nhân vật 3D với Debounce & Cooldown chống spam
    outfitCards.forEach(card => {
      const charId = card.dataset.characterId || card.dataset.outfitId;
      card.addEventListener('click', () => {
        this.selectCharacter(charId);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectCharacter(charId);
        }
      });
    });

    // Chọn máy ảnh
    cameraSelect.addEventListener('change', (e) => {
      this.selectedCameraId = e.target.value;
    });

    // Nhấn Xác Nhận / Bước Vào Ký Ức
    btnEnter.addEventListener('click', () => {
      if (this.isNameValid) {
        this.confirmCharacter();
      }
    });

    // Đóng / Hủy modal khi đang mở trong game
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        if (typeof this.onClose === 'function') {
          this.onClose();
        }
      });
    }

    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        if (typeof this.onClose === 'function') {
          this.onClose();
        }
      });
    }
  }

  selectCharacter(charId) {
    if (!charId) return;
    if (charId === this.selectedCharacterId) return;

    // 1. KIỂM TRA COOLDOWN & CỜ isSwitching CHỐNG SPAM CLICK (TRIỆT TIÊU LỖI 6)
    const now = Date.now();
    if (this.isSwitching || this.isSwitchingCharacter || (now - this.lastSwitchTime < this.COOLDOWN_MS)) {
      return;
    }

    this.isSwitching = true;
    this.isSwitchingCharacter = true;
    this.lastSwitchTime = now;
    this.selectedCharacterId = charId;
    this.selectedOutfitId = charId; // alias

    // 2. KHÓA TẠM THỜI VÀ LÀM MỜ NHẸ CÁC THẺ KHÁC ĐỂ TRÁNH CLICK LIÊN HỒI
    const outfitGrid = this.element.querySelector('#outfitGridContainer') || this.element.querySelector('.outfit-grid');
    if (outfitGrid) {
      outfitGrid.classList.add('switching-cooldown');
    }

    const outfitCards = this.element.querySelectorAll('.outfit-card');
    outfitCards.forEach(card => {
      const isSelected = (card.dataset.characterId === charId || card.dataset.outfitId === charId);
      card.classList.toggle('active', isSelected);
      card.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      if (!isSelected) {
        card.classList.add('disabled-state');
      } else {
        card.classList.remove('disabled-state');
      }
    });

    const charObj = CHARACTERS.find(o => o.id === charId) || CHARACTERS[0];
    if (charObj) {
      const previewImg = this.element.querySelector('#mirrorCharacterPreview');
      if (previewImg) {
        previewImg.style.opacity = '0.35';
        previewImg.src = charObj.avatar;
        setTimeout(() => { previewImg.style.opacity = '1'; }, 150);
      }
      const caption = this.element.querySelector('#mirrorOutfitCaption');
      if (caption) caption.textContent = charObj.name;

      const culturalTitle = this.element.querySelector('#mirrorCulturalTitle');
      if (culturalTitle) culturalTitle.textContent = charObj.title || charObj.culturalTitle;

      const outfitFeature = this.element.querySelector('#mirrorOutfitFeature');
      if (outfitFeature) outfitFeature.textContent = charObj.outfitFeature || charObj.desc;

      const heritageDesc = this.element.querySelector('#mirrorHeritageDesc');
      if (heritageDesc) heritageDesc.textContent = charObj.culturalHeritage || charObj.desc;

      const badge = this.element.querySelector('#mirrorBadgeText');
      if (badge) badge.textContent = charObj.badge || 'HÀ NỘI';

      // Hiệu ứng gương soi chuyển diện mạo
      const mirrorFrame = this.element.querySelector('.vintage-mirror-frame');
      if (mirrorFrame) {
        mirrorFrame.classList.add('mirror-switching');
        setTimeout(() => mirrorFrame.classList.remove('mirror-switching'), 450);
      }

      // Nếu đang trong chế độ Recreate (mở trong game), phát luôn tín hiệu xem trước
      if (this.isRecreate) {
        GameEventBus.emit('CORE:SWITCH_CHARACTER', { characterId: charId });
      }
    }

    // 3. THIẾT LẬP TIMER COOLDOWN TỐI THIỂU 600MS MỞ KHÓA
    clearTimeout(this.switchCooldownTimer);
    this.switchCooldownTimer = setTimeout(() => {
      this.unlockSwitching();
    }, this.COOLDOWN_MS);
  }

  unlockSwitching() {
    this.isSwitching = false;
    this.isSwitchingCharacter = false;

    if (!this.element) return;
    const outfitGrid = this.element.querySelector('#outfitGridContainer') || this.element.querySelector('.outfit-grid');
    if (outfitGrid) {
      outfitGrid.classList.remove('switching-cooldown');
    }

    const outfitCards = this.element.querySelectorAll('.outfit-card');
    outfitCards.forEach(card => {
      card.classList.remove('disabled-state');
    });

    const btnEnter = this.element.querySelector('#btnEnterReverie');
    if (btnEnter && this.isNameValid) {
      btnEnter.disabled = false;
      btnEnter.classList.remove('disabled-state');
    }
  }

  setCheckingState() {
    const input = this.element.querySelector('#characterNameInput');
    const icon = this.element.querySelector('#inputStatusIcon');
    const msg = this.element.querySelector('#nameValidationMsg');
    const btnEnter = this.element.querySelector('#btnEnterReverie');
    const suggestionsBox = this.element.querySelector('#nameSuggestions');

    if (input) input.className = 'name-input';
    if (icon) {
      icon.innerHTML = `
        <div style="width:14px;height:14px;border:2px solid rgba(212,175,55,0.4);border-top-color:#d4af37;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
      `;
    }
    if (msg) {
      msg.textContent = 'Đang kiểm tra tính duy nhất tại phố cổ...';
      msg.className = 'name-validation-msg';
    }
    if (suggestionsBox) suggestionsBox.style.display = 'none';
    if (btnEnter) btnEnter.disabled = true;
    this.isNameValid = false;
  }

  async validateName(name) {
    const input = this.element.querySelector('#characterNameInput');
    const icon = this.element.querySelector('#inputStatusIcon');
    const msg = this.element.querySelector('#nameValidationMsg');
    const btnEnter = this.element.querySelector('#btnEnterReverie');
    const suggestionsBox = this.element.querySelector('#nameSuggestions');

    if (!name || name.length < 3) {
      if (input) {
        input.className = 'name-input is-invalid';
        input.classList.add('shake-animation');
        setTimeout(() => input.classList.remove('shake-animation'), 400);
      }
      if (icon) icon.innerHTML = `<span style="color:#e74c3c;font-weight:bold;">&times;</span>`;
      if (msg) {
        msg.textContent = 'Tên nhân vật phải có ít nhất 3 ký tự.';
        msg.className = 'name-validation-msg error';
      }
      if (suggestionsBox) suggestionsBox.style.display = 'none';
      if (btnEnter) btnEnter.disabled = true;
      this.isNameValid = false;
      return;
    }

    try {
      const result = await window.GameAPI.checkCharacterNameAvailability(name);

      if (result.isValid) {
        if (input) input.className = 'name-input is-valid';
        if (icon) {
          icon.innerHTML = `
            <svg style="width:18px;height:18px;fill:#2ecc71" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          `;
        }
        if (msg) {
          msg.textContent = result.message || 'Tên hợp lệ! Bạn là người duy nhất sở hữu tên này.';
          msg.className = 'name-validation-msg success';
        }
        if (suggestionsBox) suggestionsBox.style.display = 'none';
        if (btnEnter) btnEnter.disabled = false;
        this.isNameValid = true;
      } else {
        if (input) {
          input.className = 'name-input is-invalid';
          input.classList.add('shake-animation');
          setTimeout(() => input.classList.remove('shake-animation'), 400);
        }
        if (icon) icon.innerHTML = `<span style="color:#e74c3c;font-weight:bold;">&times;</span>`;
        if (msg) {
          msg.textContent = result.message || 'Tên này đã có lãng tử sử dụng tại Hà Nội!';
          msg.className = 'name-validation-msg error';
        }
        if (btnEnter) btnEnter.disabled = true;
        this.isNameValid = false;

        if (result.suggestions && result.suggestions.length > 0 && suggestionsBox) {
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
              if (input) input.value = newName;
              this.currentName = newName;
              this.validateName(newName);
            });
          });
        } else if (suggestionsBox) {
          suggestionsBox.style.display = 'none';
        }
      }
    } catch (err) {
      console.error('Validation error:', err);
      if (msg) {
        msg.textContent = 'Lỗi kết nối kiểm tra tên, vui lòng thử lại.';
        msg.className = 'name-validation-msg error';
      }
      if (btnEnter) btnEnter.disabled = true;
      this.isNameValid = false;
    }
  }

  confirmCharacter() {
    if (!this.isNameValid) return;
    if (this.isSwitching || this.isSwitchingCharacter) return;

    const now = Date.now();
    if (now - this.lastSwitchTime < this.COOLDOWN_MS) return;

    this.isSwitching = true;
    this.isSwitchingCharacter = true;
    this.lastSwitchTime = now;

    const btnEnter = this.element.querySelector('#btnEnterReverie');
    if (btnEnter) {
      btnEnter.disabled = true;
      btnEnter.classList.add('disabled-state');
    }

    const charObj = CHARACTERS.find(c => c.id === this.selectedCharacterId) || CHARACTERS[0];
    const characterTitle = charObj ? (charObj.culturalTitle || charObj.title || charObj.shortName) : 'Lãng Tử';

    const profile = {
      username: this.currentName,
      characterId: this.selectedCharacterId,
      characterTitle: characterTitle,
      outfit: this.selectedCharacterId,
      cameraModel: this.selectedCameraId,
      unlockedPuzzles: [],
      capturedPhotosCount: 0
    };

    if (typeof window !== 'undefined' && window.GameAPI && typeof window.GameAPI.saveUserProfile === 'function') {
      window.GameAPI.saveUserProfile(profile);
    }

    // Bắn sự kiện chuyển đổi nhân vật tức thời sang Core Engine
    GameEventBus.emit('CORE:SWITCH_CHARACTER', {
      characterId: this.selectedCharacterId
    });

    // Bắn sự kiện chốt nhân vật sang Core Engine & UI
    GameEventBus.emit('UI:CHARACTER_CONFIRMED', {
      characterName: this.currentName,
      characterId: this.selectedCharacterId,
      characterTitle: characterTitle,
      outfitId: this.selectedCharacterId,
      cameraModel: this.selectedCameraId
    });

    if (typeof this.onCharacterConfirmed === 'function') {
      this.onCharacterConfirmed(profile);
    }

    clearTimeout(this.switchCooldownTimer);
    this.switchCooldownTimer = setTimeout(() => {
      this.unlockSwitching();
    }, this.COOLDOWN_MS);
  }

  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.switchCooldownTimer) {
      clearTimeout(this.switchCooldownTimer);
      this.switchCooldownTimer = null;
    }
    if (this._onCharacterSwitched) {
      GameEventBus.off('CORE:CHARACTER_SWITCHED', this._onCharacterSwitched);
      this._onCharacterSwitched = null;
    }
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}
