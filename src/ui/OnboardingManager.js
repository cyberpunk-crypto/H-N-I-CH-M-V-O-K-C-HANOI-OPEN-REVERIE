/**
 * OnboardingManager.js - Quản lý luồng tiếp cận người chơi 3 bước tuần tự:
 * 1. Age Gate (18+)
 * 2. Đăng nhập tài khoản
 * 3. Tạo nhân vật trước gương phòng tập thể cũ
 * 4. Khởi động nạp thế giới 3D với màn hình Loading Retro
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { GameEventBus } from '../bridge/GameEvents.js';
import { AgeGateModal } from './AgeGateModal.js';
import { AuthModal } from './AuthModal.js';
import { CharacterCreation } from './CharacterCreation.js';

const LOADING_POEMS = [
  "Hà Nội mùa này vắng những cơn mưa, cái rét đầu đông khăn em bay hiu hiu gió lạnh...",
  "Đang pha ấm chè mạn nóng bên hiên nhà tập thể cũ...",
  "Đang tráng cuộn film 35mm lưu giữ bóng hoàng hôn sông Hồng...",
  "Đang mở cánh cửa sổ ngắm giàn hoa giấy rực đỏ trong chiều buông...",
  "Đang chỉnh lại dây đàn và lắng nghe tiếng còi tàu xa vắng..."
];

export class OnboardingManager {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('onboardingContainer') || document.body;
    this.currentStep = null; // 'AGE_GATE' | 'AUTH' | 'CHARACTER' | 'LOADING' | 'COMPLETED'
    this.currentModal = null;
    this.userData = null;

    this.loadingOverlay = null;
    this.progressBarFill = null;
    this.progressPercentText = null;
    this.progressPoemText = null;

    this.init();
  }

  init() {
    this.listenToCoreEvents();
    this.evaluateInitialStep();
  }

  listenToCoreEvents() {
    // Lắng nghe tiến độ nạp thế giới 3D từ Core
    GameEventBus.on('CORE:WORLD_LOAD_PROGRESS', (payload) => {
      this.updateLoadingProgress(payload.progress, payload.currentAsset);
    });

    // Lắng nghe thế giới 3D đã sẵn sàng
    GameEventBus.on('CORE:WORLD_READY', (payload) => {
      this.finishOnboarding(payload);
    });
  }

  evaluateInitialStep() {
    const isAgeVerified = localStorage.getItem('hanoi_age_verified') === 'true';
    const authUser = localStorage.getItem('hanoi_auth_user');
    const userProfile = localStorage.getItem('hanoi_user_profile');

    if (!isAgeVerified) {
      this.showAgeGate();
    } else if (!authUser) {
      this.showAuth();
    } else if (!userProfile) {
      try {
        this.userData = JSON.parse(authUser);
      } catch (e) {
        this.userData = null;
      }
      this.showCharacterCreation();
    } else {
      // Người chơi cũ đã đủ hồ sơ: chuyển sang tạo thế giới ngay
      try {
        this.userData = JSON.parse(authUser);
      } catch (e) {}
      this.startWorldLoading();
    }
  }

  clearCurrentModal() {
    if (this.currentModal && typeof this.currentModal.destroy === 'function') {
      this.currentModal.destroy();
    }
    this.container.innerHTML = '';
  }

  // Bước 1: Age Gate (18+)
  showAgeGate() {
    this.currentStep = 'AGE_GATE';
    this.clearCurrentModal();

    this.currentModal = new AgeGateModal({
      onVerified: (ageData) => {
        this.showAuth();
      }
    });

    const el = this.currentModal.render();
    this.container.appendChild(el);
  }

  // Bước 2: Đăng Nhập Tài Khoản
  showAuth() {
    this.currentStep = 'AUTH';
    this.clearCurrentModal();

    this.currentModal = new AuthModal({
      onAuthSuccess: (user) => {
        this.userData = user;
        this.showCharacterCreation();
      }
    });

    const el = this.currentModal.render();
    this.container.appendChild(el);
  }

  // Bước 3: Tạo Nhân Vật Trước Gương
  showCharacterCreation() {
    this.currentStep = 'CHARACTER';
    this.clearCurrentModal();

    const initialName = this.userData?.username || '';

    this.currentModal = new CharacterCreation({
      initialName,
      onCharacterConfirmed: (profile) => {
        this.startWorldLoading();
      }
    });

    const el = this.currentModal.render();
    this.container.appendChild(el);
  }

  // Bước 4: Màn hình Loading Retro nạp thế giới 3D
  startWorldLoading() {
    this.currentStep = 'LOADING';
    this.clearCurrentModal();

    if (window.gameEngine && window.gameEngine.worldManager) {
      // Thế giới đã khởi tạo sẵn, hoàn tất nạp tức thì
      this.finishOnboarding({ spawnZone: 'ho_guom' });
      return;
    }

    this.renderLoadingScreen();

    // Hủy timer cũ nếu có
    if (this.safetyLoadingTimer) {
      clearTimeout(this.safetyLoadingTimer);
    }

    // Bộ hẹn giờ an toàn: Tự động hoàn tất và mở HUD sau tối đa 2.5 giây nếu không nhận được tín hiệu
    this.safetyLoadingTimer = setTimeout(() => {
      if (this.currentStep === 'LOADING') {
        console.log('[OnboardingManager] Bộ hẹn giờ kích hoạt: Hoàn tất nạp thế giới.');
        this.finishOnboarding({ spawnZone: 'ho_guom' });
      }
    }, 2500);

    // Gọi GameAPI để khởi động nạp 3D World Engine
    if (window.GameAPI && typeof window.GameAPI.startWorldEngine === 'function') {
      window.GameAPI.startWorldEngine();
    } else {
      GameEventBus.emit('UI:START_ENGINE_REQUEST', {});
    }
  }

  renderLoadingScreen() {
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'retro-loading-overlay';
    this.loadingOverlay.innerHTML = `
      <div class="loading-stamp-box">
        <div class="loading-spinner-retro"></div>
      </div>

      <h2 class="loading-caption-title">HÀ NỘI ĐANG MỞ RA...</h2>
      <p id="loadingPoemText" class="loading-poem-text">${LOADING_POEMS[0]}</p>

      <div class="retro-progress-track">
        <div id="retroProgressFill" class="retro-progress-fill"></div>
      </div>
      <div id="retroProgressPercent" class="retro-progress-percent">0%</div>
    `;

    this.container.appendChild(this.loadingOverlay);

    this.progressBarFill = this.loadingOverlay.querySelector('#retroProgressFill');
    this.progressPercentText = this.loadingOverlay.querySelector('#retroProgressPercent');
    this.progressPoemText = this.loadingOverlay.querySelector('#loadingPoemText');

    // Đổi câu thơ mỗi 3 giây
    let poemIdx = 0;
    this.poemInterval = setInterval(() => {
      poemIdx = (poemIdx + 1) % LOADING_POEMS.length;
      if (this.progressPoemText) {
        this.progressPoemText.textContent = LOADING_POEMS[poemIdx];
      }
    }, 3200);
  }

  updateLoadingProgress(progress, assetName) {
    const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));
    if (this.progressBarFill) {
      this.progressBarFill.style.width = `${pct}%`;
    }
    if (this.progressPercentText) {
      this.progressPercentText.textContent = `${pct}% ${assetName ? `&bull; ${assetName}` : ''}`;
    }
  }

  finishOnboarding(payload) {
    if (this.safetyLoadingTimer) {
      clearTimeout(this.safetyLoadingTimer);
      this.safetyLoadingTimer = null;
    }
    if (this.poemInterval) {
      clearInterval(this.poemInterval);
    }

    if (this.progressBarFill) {
      this.progressBarFill.style.width = '100%';
    }
    if (this.progressPercentText) {
      this.progressPercentText.textContent = '100% &bull; Ký ức đã hoàn tất!';
    }

    setTimeout(() => {
      if (this.loadingOverlay) {
        this.loadingOverlay.classList.add('fade-out');
      }
      if (this.container) {
        this.container.classList.add('hidden');
      }
      this.currentStep = 'COMPLETED';

      // Kích hoạt hiển thị HUD chính
      const hudLayer = document.getElementById('gameHudLayer');
      if (hudLayer) {
        hudLayer.classList.remove('hidden');
      }
    }, 600);
  }
}
