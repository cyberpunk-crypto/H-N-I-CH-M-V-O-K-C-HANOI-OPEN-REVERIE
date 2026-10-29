/**
 * AgeGateModal.js - Cổng xác nhận độ tuổi 18+
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { GameEventBus } from '../bridge/GameEvents.js';

export class AgeGateModal {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.onVerified = options.onVerified || (() => {});
    this.element = null;
    this.selectedDay = 1;
    this.selectedMonth = 1;
    this.selectedYear = 2000;
    this.isAdult = false;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'retro-modal-card age-gate-card';
    this.element.innerHTML = `
      <div class="card-corner-tr"></div>
      <div class="card-corner-bl"></div>

      <header class="brand-header">
        <div class="brand-badge">HANOI OPEN REVERIE &bull; 1980-1990</div>
        <h1 class="brand-title">HÀ NỘI: <span>CHẠM VÀO KÝ ỨC</span></h1>
        <p class="brand-subtitle">Cổng xác nhận độ tuổi &mdash; Khởi đầu hành trình lãng tử</p>
      </header>

      <div class="age-gate-content">
        <div class="warning-box">
          <strong>LỜI NHẮC CỦA THỜI GIAN:</strong>
          Hà Nội về đêm chứa đựng những hoài niệm sâu lắng, những trầm tư và ký ức của thời gian. 
          Trải nghiệm không gian mở này được tối ưu hóa cảm xúc cho người trưởng thành (trên 18 tuổi).
        </div>

        <form id="ageGateForm" class="age-form">
          <div class="date-selector-row">
            <div class="date-input-group">
              <label for="birthDaySelect">Ngày sinh</label>
              <select id="birthDaySelect" class="retro-select">
                ${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}" ${i + 1 === 1 ? 'selected' : ''}>Ngày ${i + 1}</option>`).join('')}
              </select>
            </div>

            <div class="date-input-group">
              <label for="birthMonthSelect">Tháng sinh</label>
              <select id="birthMonthSelect" class="retro-select">
                ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${i + 1 === 1 ? 'selected' : ''}>Tháng ${i + 1}</option>`).join('')}
              </select>
            </div>

            <div class="date-input-group">
              <label for="birthYearSelect">Năm sinh</label>
              <select id="birthYearSelect" class="retro-select">
                <option value="" disabled selected>Chọn năm</option>
                ${this.generateYearOptions()}
              </select>
            </div>
          </div>

          <div id="ageStatusMessage" class="age-status-message" style="display: none;"></div>

          <button type="submit" id="btnConfirmAge" class="btn-primary-retro" disabled>
            Xác Nhận & Bước Tiếp
          </button>
        </form>
      </div>
    `;

    this.bindEvents();
    return this.element;
  }

  generateYearOptions() {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 100;
    let html = '';
    for (let y = currentYear; y >= startYear; y--) {
      html += `<option value="${y}">${y}</option>`;
    }
    return html;
  }

  bindEvents() {
    const daySelect = this.element.querySelector('#birthDaySelect');
    const monthSelect = this.element.querySelector('#birthMonthSelect');
    const yearSelect = this.element.querySelector('#birthYearSelect');
    const form = this.element.querySelector('#ageGateForm');

    const handleDateChange = () => {
      this.selectedDay = parseInt(daySelect.value, 10);
      this.selectedMonth = parseInt(monthSelect.value, 10);
      this.selectedYear = parseInt(yearSelect.value, 10);

      if (!isNaN(this.selectedYear)) {
        this.validateAge();
      }
    };

    daySelect.addEventListener('change', handleDateChange);
    monthSelect.addEventListener('change', handleDateChange);
    yearSelect.addEventListener('change', handleDateChange);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.isAdult) {
        this.submitVerification();
      }
    });
  }

  /**
   * Tính toán tuổi chính xác theo ngày tháng năm sinh
   */
  calculateAge(day, month, year) {
    const today = new Date();
    let age = today.getFullYear() - year;
    const m = (today.getMonth() + 1) - month;
    if (m < 0 || (m === 0 && today.getDate() < day)) {
      age--;
    }
    return age;
  }

  validateAge() {
    const statusMsg = this.element.querySelector('#ageStatusMessage');
    const confirmBtn = this.element.querySelector('#btnConfirmAge');
    const age = this.calculateAge(this.selectedDay, this.selectedMonth, this.selectedYear);

    statusMsg.style.display = 'flex';

    if (age >= 18) {
      this.isAdult = true;
      confirmBtn.disabled = false;
      statusMsg.className = 'age-status-message success';
      statusMsg.innerHTML = `
        <svg style="width:18px;height:18px;margin-right:8px;fill:#2ecc71" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        Xác nhận hợp lệ (${age} tuổi). Chào mừng lãng tử đã trưởng thành đến với Hà Nội!
      `;
    } else {
      this.isAdult = false;
      confirmBtn.disabled = true;
      statusMsg.className = 'age-status-message error shake-animation';
      statusMsg.innerHTML = `
        <svg style="width:18px;height:18px;margin-right:8px;fill:#e74c3c" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        Hà Nội đêm chưa dành cho lãng tử dưới 18 tuổi (${age} tuổi). Hẹn gặp lại bạn khi đủ 18 tuổi!
      `;
      // Xóa animation sau khi chạy xong để có thể kích hoạt lại nếu đổi ngày
      setTimeout(() => statusMsg.classList.remove('shake-animation'), 400);
    }
  }

  submitVerification() {
    try {
      localStorage.setItem('hanoi_age_verified', 'true');
    } catch (e) {
      console.warn('LocalStorage not accessible:', e);
    }

    // Bắn sự kiện theo bảng hợp đồng 3.2
    GameEventBus.emit('UI:AGE_VERIFIED', {
      birthYear: this.selectedYear,
      birthMonth: this.selectedMonth,
      birthDay: this.selectedDay,
      isAdult: true
    });

    if (typeof this.onVerified === 'function') {
      this.onVerified({
        birthYear: this.selectedYear,
        birthMonth: this.selectedMonth,
        birthDay: this.selectedDay
      });
    }
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
