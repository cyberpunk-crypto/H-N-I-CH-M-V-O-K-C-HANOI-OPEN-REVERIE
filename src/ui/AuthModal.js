/**
 * AuthModal.js - Đăng nhập tài khoản (Google 1-Click, Vintage ID, Guest)
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { GameEventBus } from '../bridge/GameEvents.js';

export class AuthModal {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.onAuthSuccess = options.onAuthSuccess || (() => {});
    this.element = null;
    this.currentMode = 'login'; // 'login' | 'register'
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'retro-modal-card auth-modal-card';
    this.element.innerHTML = `
      <div class="card-corner-tr"></div>
      <div class="card-corner-bl"></div>

      <header class="brand-header">
        <div class="brand-badge">SỔ ĐĂNG KÝ CƯ TRÚ PHỐ CỔ</div>
        <h1 class="brand-title">ĐĂNG NHẬP <span>TÀI KHOẢN</span></h1>
        <p class="brand-subtitle">Chọn danh phận để lưu giữ cuốn album ký ức của riêng bạn</p>
      </header>

      <div class="auth-content">
        <!-- Nút Đăng nhập 1-Click Google mô phỏng -->
        <button type="button" id="btnGoogleLogin" class="btn-google-sso">
          <svg style="width:20px;height:20px" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Đăng nhập nhanh với Google
        </button>

        <div class="divider-retro">
          <span>hoặc dùng thẻ căn cước vintage</span>
        </div>

        <!-- Form Đăng nhập / Đăng ký thẻ căn cước -->
        <form id="vintageAuthForm" class="vintage-id-form">
          <div class="form-group-retro">
            <label for="authEmailInput">Hòm thư điện tử (Email)</label>
            <input type="email" id="authEmailInput" class="retro-input" placeholder="langtu@phoco.hanoi" required>
          </div>

          <div class="form-group-retro">
            <label for="authPasswordInput">Mật khẩu bảo mật</label>
            <input type="password" id="authPasswordInput" class="retro-input" placeholder="••••••••" required minlength="6">
          </div>

          <button type="submit" id="btnSubmitAuth" class="btn-primary-retro">
            Mở Khóa Hành Trình
          </button>
        </form>

        <!-- Dạo chơi ẩn danh (Guest) -->
        <button type="button" id="btnGuestLogin" class="btn-guest-retro">
          &sim; Dạo chơi ẩn danh (Khách mộng mơ) &sim;
        </button>
      </div>
    `;

    this.bindEvents();
    return this.element;
  }

  bindEvents() {
    const btnGoogle = this.element.querySelector('#btnGoogleLogin');
    const form = this.element.querySelector('#vintageAuthForm');
    const btnGuest = this.element.querySelector('#btnGuestLogin');

    // Google 1-Click
    btnGoogle.addEventListener('click', () => {
      this.handleGoogleLogin();
    });

    // Form Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = this.element.querySelector('#authEmailInput').value.trim();
      const pwd = this.element.querySelector('#authPasswordInput').value.trim();
      if (email && pwd) {
        this.handleEmailLogin(email);
      }
    });

    // Guest Mode
    btnGuest.addEventListener('click', () => {
      this.handleGuestLogin();
    });
  }

  handleGoogleLogin() {
    const mockNames = ['LãngTửHàThành', 'BảoNam_PhốCổ', 'ThuTrang_HồGươm', 'ViệtHùng_TràngAn'];
    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const userId = `gg_${Date.now().toString(36)}`;

    const user = {
      userId,
      username: randomName,
      authType: 'google'
    };

    this.completeAuth(user);
  }

  handleEmailLogin(email) {
    const defaultName = email.split('@')[0] || 'LãngTử';
    const userId = `em_${Date.now().toString(36)}`;

    const user = {
      userId,
      username: defaultName,
      authType: 'email'
    };

    this.completeAuth(user);
  }

  handleGuestLogin() {
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const userId = `guest_${Date.now().toString(36)}`;

    const user = {
      userId,
      username: `KẻMộngMơ_${randomDigits}`,
      authType: 'guest'
    };

    this.completeAuth(user);
  }

  completeAuth(user) {
    try {
      localStorage.setItem('hanoi_auth_user', JSON.stringify(user));
    } catch (e) {
      console.warn('LocalStorage not accessible:', e);
    }

    // Bắn sự kiện theo bảng hợp đồng 3.2
    GameEventBus.emit('UI:AUTH_SUCCESS', {
      userId: user.userId,
      username: user.username,
      authType: user.authType
    });

    if (typeof this.onAuthSuccess === 'function') {
      this.onAuthSuccess(user);
    }
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
