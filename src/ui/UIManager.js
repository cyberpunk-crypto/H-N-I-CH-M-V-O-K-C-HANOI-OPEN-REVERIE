/**
 * UIManager.js - Trình điều phối trung tâm toàn bộ giao diện người dùng
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { GameEventBus } from '../bridge/GameEvents.js';
import { OnboardingManager } from './OnboardingManager.js';
import { ViewfinderHUD } from './ViewfinderHUD.js';
import { MinimapHUD } from './MinimapHUD.js';
import { ScrapbookModal } from './ScrapbookModal.js';
import { ToastNotification } from './ToastNotification.js';
import { AudioBGMController } from './AudioBGMController.js';
import { DialogueModal } from './DialogueModal.js?v=3.9';
import { ChatBoxHUD } from './ChatBoxHUD.js';
import { CHARACTERS } from './CharacterCreation.js';

export class UIManager {
  constructor() {
    this.onboarding = null;
    this.viewfinder = null;
    this.minimap = null;
    this.scrapbook = null;
    this.toast = null;
    this.audioController = null;
    this.dialogue = null;
    this.chatbox = null;
    this.currentCharacterId = 'char_nu_sinh_ao_dai';

    // Cơ chế Debounce / Cooldown chống spam click đổi nhân vật (Khắc phục Lỗi 6)
    this.isSwitching = false;
    this.isSwitchingCharacter = false; // alias đồng bộ đặc tả
    this.lastSwitchTime = 0;
    this.SWITCH_COOLDOWN_MS = 600; // Cooldown tối thiểu 600ms chống race condition
    this.switchCooldownTimer = null;

    this.init();
  }

  init() {
    // 1. Hệ thống thông báo retro
    this.toast = new ToastNotification();

    // 2. Hệ thống âm thanh hoài niệm
    this.audioController = new AudioBGMController({
      container: document.getElementById('audioControllerContainer') || document.body
    });

    // 3. Khung ngắm máy ảnh 35mm
    this.viewfinder = new ViewfinderHUD({
      container: document.getElementById('viewfinderContainer') || document.body
    });

    // 4. Bản đồ du lịch cổ điển & la bàn
    this.minimap = new MinimapHUD({
      container: document.getElementById('minimapContainer') || document.body
    });

    // 5. Cuốn Album Ký Ức Hà Nội
    this.scrapbook = new ScrapbookModal({
      container: document.getElementById('scrapbookContainer') || document.body
    });

    // 6. Hộp thoại NPC & Thuyết minh Lịch sử & Quầy hàng xưa
    this.dialogue = new DialogueModal({
      container: document.getElementById('dialogueContainer') || document.body
    });

    // 7. Khung Chat cộng đồng & Giao tiếp người chơi
    this.chatbox = new ChatBoxHUD({
      container: document.getElementById('chatboxContainer') || document.body
    });

    // 8. Luồng Onboarding 3 bước tuần tự
    this.onboarding = new OnboardingManager({
      container: document.getElementById('onboardingContainer') || document.body
    });

    this.bindHudTopBarEvents();
    this.bindQuickCharacterSwitcher();
    this.bindGlobalKeyboardShortcuts();
    this.bindCoreHudEvents();
  }

  bindHudTopBarEvents() {
    // Nút mở Bản Đồ trên HUD
    const btnMap = document.getElementById('btnOpenMapHud');
    if (btnMap) {
      btnMap.addEventListener('click', () => {
        if (this.minimap) {
          this.minimap.openMapModal();
        }
      });
    }

    // Nút mở Album Ký Ức trên HUD
    const btnAlbum = document.getElementById('btnOpenScrapbookHud');
    if (btnAlbum) {
      btnAlbum.addEventListener('click', () => {
        if (this.scrapbook) {
          this.scrapbook.openAlbum();
        }
      });
    }

    // Nút bật máy ảnh film trên HUD
    const btnCamera = document.getElementById('btnToggleCameraHud');
    if (btnCamera) {
      btnCamera.addEventListener('click', () => {
        if (this.viewfinder) {
          this.viewfinder.switchCameraMode(this.viewfinder.currentMode === 'FPS' ? 'TPS' : 'FPS');
        }
      });
    }

    // Nút đổi nhân vật / tạo lại nhân vật
    const btnRecreate = document.getElementById('btnRecreateCharacterHud');
    if (btnRecreate) {
      btnRecreate.addEventListener('click', () => {
        if (this.onboarding) {
          this.onboarding.showCharacterCreation({ isRecreate: true });
        }
      });
    }
  }

  bindQuickCharacterSwitcher() {
    const quickBar = document.getElementById('quickCharacterBar');
    if (!quickBar) return;

    const buttons = quickBar.querySelectorAll('.btn-quick-char');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const charId = btn.dataset.charId;
        if (!charId) return;

        this.switchCharacterQuickly(charId);
      });
    });

    // Lắng nghe sự kiện Core đã chuyển đổi xong nhân vật
    GameEventBus.on('CORE:CHARACTER_SWITCHED', (payload) => {
      this.unlockQuickSwitcher();
      if (payload && payload.characterId) {
        this.updateQuickSwitcherActiveState(payload.characterId);
      }
    });
  }

  switchCharacterQuickly(charId) {
    if (!charId || charId === this.currentCharacterId) return;

    // 1. KIỂM TRA COOLDOWN 600MS & CỜ isSwitching CHỐNG SPAM CLICK (KHẮC PHỤC LỖI 6)
    const now = Date.now();
    if (this.isSwitching || this.isSwitchingCharacter || (now - this.lastSwitchTime < this.SWITCH_COOLDOWN_MS)) {
      return;
    }

    this.isSwitching = true;
    this.isSwitchingCharacter = true;
    this.lastSwitchTime = now;
    this.currentCharacterId = charId;

    // 2. KHÓA TẠM THỜI VÀ LÀM MỜ NHẸ CÁC NÚT ĐỂ NGĂN BẤM LIÊN HỒI GÂY RACE CONDITION
    const quickBar = document.getElementById('quickCharacterBar');
    if (quickBar) {
      quickBar.classList.add('switching-cooldown');
      const buttons = quickBar.querySelectorAll('.btn-quick-char');
      buttons.forEach(btn => {
        const isTarget = (btn.dataset.charId === charId);
        btn.classList.toggle('active', isTarget);
        if (!isTarget) {
          btn.classList.add('disabled-state');
        } else {
          btn.classList.remove('disabled-state');
          btn.classList.add('switching-pulse');
        }
      });
    }

    const charObj = CHARACTERS.find(c => c.id === charId) || CHARACTERS[0];

    // Cập nhật LocalStorage profile
    let currentUsername = 'Kẻ Mộng Mơ';
    try {
      const profile = JSON.parse(localStorage.getItem('hanoi_user_profile') || '{}');
      if (profile.username) currentUsername = profile.username;
      profile.characterId = charId;
      profile.outfit = charId;
      profile.characterTitle = charObj.culturalTitle || charObj.title;
      localStorage.setItem('hanoi_user_profile', JSON.stringify(profile));
    } catch (e) {}

    // Bắn sự kiện chuyển đổi nhân vật tức thời sang Core Engine
    GameEventBus.emit('CORE:SWITCH_CHARACTER', { characterId: charId });

    // Bắn sự kiện cập nhật hồ sơ UI
    GameEventBus.emit('UI:CHARACTER_CONFIRMED', {
      characterName: currentUsername,
      characterId: charId,
      characterTitle: charObj.culturalTitle || charObj.title,
      outfitId: charId,
      cameraModel: 'leica_m3'
    });

    // 3. THÔNG BÁO TOAST TINH TẾ VỚI AVATAR VÀ THÔNG TIN TRANG PHỤC HÀ NỘI
    if (this.toast) {
      this.toast.show({
        title: 'Hóa Thân Nhân Vật',
        message: `${charObj.name} — ${charObj.culturalTitle || charObj.title}`,
        type: 'info',
        duration: 3200
      });
    }

    // 4. THIẾT LẬP TIMER COOLDOWN TỐI THIỂU 600MS ĐỂ MỞ KHÓA NÚT BẤM
    clearTimeout(this.switchCooldownTimer);
    this.switchCooldownTimer = setTimeout(() => {
      this.unlockQuickSwitcher();
    }, this.SWITCH_COOLDOWN_MS);
  }

  unlockQuickSwitcher() {
    this.isSwitching = false;
    this.isSwitchingCharacter = false;

    const quickBar = document.getElementById('quickCharacterBar');
    if (quickBar) {
      quickBar.classList.remove('switching-cooldown');
      const buttons = quickBar.querySelectorAll('.btn-quick-char');
      buttons.forEach(btn => {
        btn.classList.remove('disabled-state');
        btn.classList.remove('switching-pulse');
      });
    }
  }

  updateQuickSwitcherActiveState(charId) {
    this.currentCharacterId = charId;
    const quickBar = document.getElementById('quickCharacterBar');
    if (!quickBar) return;

    const buttons = quickBar.querySelectorAll('.btn-quick-char');
    buttons.forEach(btn => {
      const match = (btn.dataset.charId === charId);
      btn.classList.toggle('active', match);
    });
  }

  bindGlobalKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();

      // Phím Tab hoặc M mở Bản đồ
      if (key === 'm' || (key === 'tab' && !e.shiftKey)) {
        e.preventDefault();
        if (this.minimap) {
          if (typeof this.minimap.toggleMapModal === 'function') {
            this.minimap.toggleMapModal();
          } else {
            this.minimap.openMapModal();
          }
        }
      }
      // Phím B mở Album Ký Ức Thăng Long
      else if (key === 'b') {
        if (this.scrapbook) {
          if (typeof this.scrapbook.toggleAlbum === 'function') {
            this.scrapbook.toggleAlbum();
          } else {
            this.scrapbook.openAlbum();
          }
        }
      }
    });
  }

  bindCoreHudEvents() {
    const zoneNameEl = document.getElementById('hudCurrentZoneName');
    const playerNameEl = document.getElementById('hudCurrentPlayerName');
    const promptContainer = document.getElementById('interactionPromptContainer');
    const promptTextEl = document.getElementById('interactionPromptText');

    const updatePlayerNameDisplay = (username, charId, charTitle) => {
      const charObj = CHARACTERS.find(c => c.id === charId || (c.legacyIds && c.legacyIds.includes(charId))) || CHARACTERS[0];
      const title = charTitle || (charObj ? (charObj.culturalTitle || charObj.title || charObj.shortName) : 'Lãng Tử');
      const name = username || 'Kẻ Mộng Mơ';

      if (playerNameEl) {
        playerNameEl.textContent = `${title}: ${name}`;
      }

      const avatarBadgeEl = document.getElementById('hudPlayerAvatarBadge');
      if (avatarBadgeEl && charObj && charObj.avatar) {
        avatarBadgeEl.innerHTML = `<img src="${charObj.avatar}" alt="${title}" style="width:100%;height:100%;border-radius:4px;object-fit:cover;" />`;
      }

      this.updateQuickSwitcherActiveState(charId);
    };

    // Cập nhật tên và danh xưng người chơi khi xác nhận nhân vật
    GameEventBus.on('UI:CHARACTER_CONFIRMED', (payload) => {
      if (payload) {
        updatePlayerNameDisplay(payload.characterName, payload.characterId, payload.characterTitle);
      }
    });

    // Lắng nghe sự kiện chuyển đổi nhân vật
    GameEventBus.on('CORE:SWITCH_CHARACTER', (payload) => {
      if (payload && payload.characterId) {
        this.updateQuickSwitcherActiveState(payload.characterId);
      }
    });

    // Cập nhật tên phân khu khi di chuyển
    GameEventBus.on('CORE:ZONE_ENTERED', (payload) => {
      if (zoneNameEl && payload.zoneName) {
        zoneNameEl.textContent = payload.zoneName;
      }
    });

    // Lắng nghe sự kiện mở hộp thoại NPC từ Core
    GameEventBus.on('UI:OPEN_DIALOGUE', (payload) => {
      if (this.dialogue && payload) {
        this.dialogue.open(payload);
      }
    });

    // Gợi ý tương tác gần ghế đá, quán nước, v.v.
    GameEventBus.on('CORE:INTERACTION_AVAILABLE', (payload) => {
      if (!promptContainer) return;

      if (payload.canInteract) {
        promptContainer.style.display = 'block';
        if (promptTextEl) {
          promptTextEl.innerHTML = `<span class="keycap">${payload.actionKey || 'E'}</span> ${payload.promptText || 'Tương tác'}`;
        }
      } else {
        promptContainer.style.display = 'none';
      }
    });

    // Đọc thông tin người chơi từ Storage nếu đã có
    try {
      const profile = JSON.parse(localStorage.getItem('hanoi_user_profile') || '{}');
      if (profile.username) {
        updatePlayerNameDisplay(profile.username, profile.characterId || profile.outfit, profile.characterTitle);
      }
    } catch (e) {}
  }
}

// Khởi tạo tự động khi DOM sẵn sàng
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window._UIManagerInstance = new UIManager();
  });
}
