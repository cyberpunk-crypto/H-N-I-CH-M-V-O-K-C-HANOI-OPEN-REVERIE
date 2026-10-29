/**
 * GameEvents.js - Hệ thống Bus sự kiện tập trung
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 * Kết nối giữa Core Engine (3D) và Giao diện người dùng (UI)
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Đăng ký lắng nghe sự kiện
   * @param {string} eventName 
   * @param {Function} callback 
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);
    return () => this.off(eventName, callback);
  }

  /**
   * Hủy lắng nghe sự kiện
   * @param {string} eventName 
   * @param {Function} callback 
   */
  off(eventName, callback) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).delete(callback);
    }
  }

  /**
   * Kích hoạt phát sự kiện kèm dữ liệu
   * @param {string} eventName 
   * @param {any} payload 
   */
  emit(eventName, payload) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[GameEventBus Error in listener for "${eventName}"]:`, error);
        }
      });
    }
  }
}

// Khởi tạo EventBus toàn cục duy nhất
if (!window.GameEventBus) {
  window.GameEventBus = new EventBus();
}

export const GameEventBus = window.GameEventBus;
