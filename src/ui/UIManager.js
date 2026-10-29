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
import { DialogueModal } from './DialogueModal.js';
import { ChatBoxHUD } from './ChatBoxHUD.js';

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
        if (confirm('Bạn có muốn đổi nhân vật hoặc tạo lại nhân vật mới không?')) {
          localStorage.removeItem('hanoi_user_profile');
          const hudLayer = document.getElementById('gameHudLayer');
          if (hudLayer) hudLayer.classList.add('hidden');
          if (this.onboarding) {
            this.onboarding.showCharacterCreation();
          }
        }
      });
    }
  }

  bindCoreHudEvents() {
    const zoneNameEl = document.getElementById('hudCurrentZoneName');
    const playerNameEl = document.getElementById('hudCurrentPlayerName');
    const promptContainer = document.getElementById('interactionPromptContainer');
    const promptTextEl = document.getElementById('interactionPromptText');

    // Cập nhật tên người chơi khi xác nhận nhân vật
    GameEventBus.on('UI:CHARACTER_CONFIRMED', (payload) => {
      if (playerNameEl && payload.characterName) {
        playerNameEl.textContent = `Lãng tử: ${payload.characterName}`;
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
      if (profile.username && playerNameEl) {
        playerNameEl.textContent = `Lãng tử: ${profile.username}`;
      }
    } catch (e) {}
  }
}

// Khởi tạo tự động khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  window._UIManagerInstance = new UIManager();
});
