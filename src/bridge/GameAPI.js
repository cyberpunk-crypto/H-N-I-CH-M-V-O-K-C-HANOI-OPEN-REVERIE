/**
 * GameAPI.js - Contract API toàn cục giữa Coder Chính và UI Polish
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

const RESERVED_NAMES = [
  'admin', 'hanoian', 'kemongmo', 'thaprua', 'longbien', 
  'hoanghon', 'phoco', 'trangan', 'nguoihanoi', 'boss'
];

const globalScope = typeof window !== 'undefined' ? window : globalThis;

globalScope.GameAPI = {
  /**
   * Kiểm tra tính hợp lệ và trùng lặp của tên nhân vật theo thời gian thực (Debounce)
   * @param {string} rawName - Tên người dùng nhập vào
   * @returns {Promise<{ isValid: boolean, message: string, suggestions: string[] }>}
   */
  checkCharacterNameAvailability: async (rawName) => {
    const trimmed = (rawName || '').trim();
    if (trimmed.length < 3) {
      return {
        isValid: false,
        message: 'Tên nhân vật phải có ít nhất 3 ký tự.',
        suggestions: []
      };
    }
    if (trimmed.length > 16) {
      return {
        isValid: false,
        message: 'Tên nhân vật không được vượt quá 16 ký tự.',
        suggestions: []
      };
    }

    const regex = /^[a-zA-Z0-9_\s\u00C0-\u1EF9]+$/;
    if (!regex.test(trimmed)) {
      return {
        isValid: false,
        message: 'Tên không được chứa ký tự đặc biệt lạ.',
        suggestions: []
      };
    }

    // Kiểm tra trong danh sách đã đặt trước hoặc LocalStorage đã có
    const normalized = trimmed.toLowerCase();
    const existingUsers = JSON.parse(localStorage.getItem('hanoi_registered_names') || '[]');
    
    // Nếu chính là tên hiện tại của người chơi đang sở hữu, thì luôn hợp lệ
    let currentProfile = null;
    try {
      currentProfile = JSON.parse(localStorage.getItem('hanoi_user_profile') || 'null');
    } catch (e) {}
    const isCurrentPlayerName = !!(currentProfile && currentProfile.username && currentProfile.username.toLowerCase() === normalized);

    const isTaken = !isCurrentPlayerName && (RESERVED_NAMES.includes(normalized) || existingUsers.includes(normalized));

    if (isTaken) {
      const year = new Date().getFullYear();
      const suggestions = [
        `${trimmed}_${year % 100}`,
        `LãngTử_${trimmed}`,
        `${trimmed}_PhốCổ`
      ];
      return {
        isValid: false,
        message: `Tên "${trimmed}" đã có người sử dụng tại Hà Nội!`,
        suggestions
      };
    }

    return {
      isValid: true,
      message: 'Tên hợp lệ! Bạn là người duy nhất sở hữu tên này.',
      suggestions: []
    };
  },

  /**
   * Lưu hoặc cập nhật hồ sơ người chơi vào LocalStorage
   * @param {Object} profile - { username, outfit, unlockedPuzzles, capturedPhotosCount }
   * @returns {boolean} Thành công hay thất bại
   */
  saveUserProfile: (profile) => {
    try {
      localStorage.setItem('hanoi_user_profile', JSON.stringify(profile));
      if (profile.username) {
        const existingUsers = JSON.parse(localStorage.getItem('hanoi_registered_names') || '[]');
        if (!existingUsers.includes(profile.username.toLowerCase())) {
          existingUsers.push(profile.username.toLowerCase());
          localStorage.setItem('hanoi_registered_names', JSON.stringify(existingUsers));
        }
      }
      return true;
    } catch (e) {
      console.error('Failed to save user profile:', e);
      return false;
    }
  },

  /**
   * Lấy toàn bộ danh sách ảnh đã chụp từ Album Database (LocalStorage / IndexedDB)
   * @returns {Promise<Array<{ id: string, dataUrl: string, zone: string, timestamp: number, quote: string }>>}
   */
  getAlbumPhotos: async () => {
    try {
      const raw = localStorage.getItem('hanoi_album_photos');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to get album photos:', e);
      return [];
    }
  },

  /**
   * Khóa hoặc mở khóa điều khiển di chuyển nhân vật (khi đang mở modal UI)
   * @param {boolean} locked - true: không cho WASD di chuyển; false: cho phép
   */
  setPlayerMovementLock: (locked) => {
    const engine = window._GameCoreInstance || window.gameEngine;
    if (engine && engine.playerController) {
      engine.playerController.setLocked(locked);
    }
  },

  /**
   * Lấy trạng thái hiện tại của hệ thống camera
   * @returns {{ mode: 'TPS' | 'FPS', fov: number, isAiming: boolean }}
   */
  getCameraStatus: () => {
    if (window._GameCoreInstance && window._GameCoreInstance.cameraController) {
      return window._GameCoreInstance.cameraController.getStatus();
    }
    return { mode: 'TPS', fov: 65, isAiming: false };
  },

  /**
   * Yêu cầu chụp ảnh màn hình WebGL hiện tại với bộ lọc film vintage
   * @param {string} filterPreset - 'portra' | 'tri-x' | 'sepia' | 'cyber-hanoi'
   * @returns {Promise<string>} Base64 Data URL của ảnh chụp
   */
  captureFilmPhoto: async (filterPreset = 'portra') => {
    if (window._GameCoreInstance && window._GameCoreInstance.photoSystem) {
      return await window._GameCoreInstance.photoSystem.capture(filterPreset);
    }
    return null;
  },

  /**
   * Khởi động nhanh quá trình nạp thế giới 3D
   */
  startWorldEngine: () => {
    if (globalScope._GameCoreInstance) {
      globalScope._GameCoreInstance.initWorld();
    } else {
      globalScope.GameEventBus.emit('UI:START_ENGINE_REQUEST', {});
    }
  }
};

export const GameAPI = globalScope.GameAPI;
