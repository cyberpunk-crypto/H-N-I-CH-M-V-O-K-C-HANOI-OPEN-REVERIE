/**
 * HUD.js - Giao diện đầu gạt trạng thái & Quản lý tương tác thời gian thực
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 * Hỗ trợ chuyển đổi nhanh 4 nhân vật Việt Nam độc bản với Cooldown 600ms chống spam (Lỗi 6)
 */

import { GameEventBus } from '../bridge/GameEvents.js';
import { CHARACTERS } from './CharacterCreation.js';
import { UIManager } from './UIManager.js';

export const HUD_CONFIG = {
  COOLDOWN_MS: 600, // Cooldown tối thiểu 600ms chống spam click đổi nhân vật
  TOAST_DURATION: 3200
};

export class HUD {
  constructor(options = {}) {
    this.uiManager = options.uiManager || (typeof window !== 'undefined' ? window._UIManagerInstance : null);
    this.isSwitching = false;
    this.isSwitchingCharacter = false;
    this.lastSwitchTime = 0;
    this.cooldownMs = options.cooldownMs || HUD_CONFIG.COOLDOWN_MS;
    this.cooldownTimer = null;

    this._bindEvents();
  }

  _bindEvents() {
    GameEventBus.on('CORE:CHARACTER_SWITCHED', (payload) => {
      this.unlockSwitching();
    });
  }

  /**
   * Chuyển đổi nhân vật nhanh với kiểm tra Cooldown 600ms và khóa nút tạm thời
   * @param {string} characterId 
   * @returns {boolean} Thành công hay bị chặn do Cooldown
   */
  switchCharacter(characterId) {
    if (!characterId) return false;

    const now = Date.now();
    if (this.isSwitching || this.isSwitchingCharacter || (now - this.lastSwitchTime < this.cooldownMs)) {
      return false;
    }

    this.isSwitching = true;
    this.isSwitchingCharacter = true;
    this.lastSwitchTime = now;

    const charObj = CHARACTERS.find(c => c.id === characterId) || CHARACTERS[0];

    // Phát sự kiện chuyển đổi sang Core
    GameEventBus.emit('CORE:SWITCH_CHARACTER', { characterId });

    // Phát sự kiện cập nhật UI
    let currentUsername = 'Kẻ Mộng Mơ';
    try {
      const profile = JSON.parse(localStorage.getItem('hanoi_user_profile') || '{}');
      if (profile.username) currentUsername = profile.username;
      profile.characterId = characterId;
      profile.outfit = characterId;
      profile.characterTitle = charObj.culturalTitle || charObj.title;
      localStorage.setItem('hanoi_user_profile', JSON.stringify(profile));
    } catch (e) {}

    GameEventBus.emit('UI:CHARACTER_CONFIRMED', {
      characterName: currentUsername,
      characterId,
      characterTitle: charObj.culturalTitle || charObj.title,
      outfitId: characterId,
      cameraModel: 'leica_m3'
    });

    // Mở khóa sau timeout an toàn tối thiểu 600ms
    clearTimeout(this.cooldownTimer);
    this.cooldownTimer = setTimeout(() => {
      this.unlockSwitching();
    }, this.cooldownMs);

    return true;
  }

  unlockSwitching() {
    this.isSwitching = false;
    this.isSwitchingCharacter = false;
  }

  getCharacters() {
    return CHARACTERS;
  }
}

export { UIManager };
export default HUD;
