/**
 * ToastNotification.js - Thông báo retro góc màn hình kiểu tem bưu chính Hà Nội
 * Tích hợp hệ thống Real-time Landmark & Structure Detection cho các công trình mới và lối lên cầu
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { GameEventBus } from '../bridge/GameEvents.js';

// Danh sách các công trình và lối lên cầu đặc biệt cần thông báo
export const SPECIAL_LANDMARKS = [
  {
    id: 'bridge_ramp_long_bien',
    name: 'Dốc Cầu Long Biên',
    title: 'Nhịp Cầu Lịch Sử',
    body: 'Bắt đầu bước lên nhịp Cầu Long Biên lịch sử.',
    icon: 'bridge',
    check: (pos) => {
      // Dốc dẫn thoải từ x = 10 đến x = 40, z = 55 đến 65
      return (pos.x >= 10 && pos.x <= 40 && pos.z >= 54 && pos.z <= 66);
    }
  },
  {
    id: 'bridge_the_huc',
    name: 'Cầu Thê Húc',
    title: 'Cầu Thê Húc Đỏ Son',
    body: 'Đang dạo bước trên Cầu Thê Húc son đỏ vào Đền Ngọc Sơn.',
    icon: 'bridge',
    check: (pos) => {
      // Nhịp cầu cong Cầu Thê Húc nối bờ vào đảo
      return (pos.x >= 132 && pos.x <= 162 && pos.z >= -66 && pos.z <= -40);
    }
  },
  {
    id: 'egg_coffee_shop',
    name: 'Tiệm Cà Phê Trứng',
    title: 'Tiệm Cà Phê Trứng & Trà Sen',
    body: 'Bước vào bên trong Tiệm Cà Phê Trứng cổ điển ấm áp, thơm ngát hương trà sen Tây Hồ.',
    icon: 'cafe',
    check: (pos) => {
      // Bên trong tiệm Cà Phê Trứng (-42, 46) kích thước 12x16
      return (pos.x >= -48 && pos.x <= -36 && pos.z >= 38 && pos.z <= 54);
    }
  },
  {
    id: 'mau_dich_store',
    name: 'Cửa Hàng Mậu Dịch',
    title: 'Cửa Hàng Bách Hóa Mậu Dịch',
    body: 'Bước vào bên trong Cửa Hàng Bách Hóa Mậu Dịch thời bao cấp, đầy ắp hiện vật ký ức và tem phiếu.',
    icon: 'shop',
    check: (pos) => {
      // Bên trong Cửa Hàng Bách Hóa Mậu Dịch (-66, 46) kích thước 14x16
      return (pos.x >= -73 && pos.x <= -59 && pos.z >= 38 && pos.z <= 54);
    }
  },
  {
    id: 'dac_nguyet_lau',
    name: 'Đắc Nguyệt Lâu',
    title: 'Đắc Nguyệt Lâu & Đảo Ngọc Sơn',
    body: 'Bước qua cổng Đắc Nguyệt Lâu vào khuôn viên Đền Ngọc Sơn linh thiêng.',
    icon: 'location',
    check: (pos) => {
      // Đắc Nguyệt Lâu và sân đền Ngọc Sơn
      return (pos.x >= 121 && pos.x <= 135 && pos.z >= -78 && pos.z <= -60);
    }
  },
  {
    id: 'chua_do_ngoc_son',
    name: 'Chùa Đỏ • Đền Ngọc Sơn',
    title: 'Chính Điện Đền Ngọc Sơn (Chùa Đỏ)',
    body: 'Bước vào bên trong Chùa Đỏ chiêm bái án gian thờ sơn son thếp vàng và chiêm ngưỡng Tiêu bản Cụ Rùa Hồ Gươm.',
    icon: 'location',
    check: (pos) => {
      // Bên trong Chính Điện Chùa Đỏ (111 đến 121, z = -77 đến -63)
      return (pos.x >= 111 && pos.x <= 121 && pos.z >= -77 && pos.z <= -63);
    }
  }
];

export class ToastNotification {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('toastNotificationContainer') || this.createContainer();
    this.maxToasts = 4;
    this.activeToasts = [];

    this.currentLandmarkId = null;
    this.landmarkCooldownMap = new Map();

    this.initEventListeners();
    this.startLandmarkTracker();
  }

  createContainer() {
    let el = document.getElementById('toastNotificationContainer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toastNotificationContainer';
      el.className = 'toast-notification-container';
      document.body.appendChild(el);
    }
    return el;
  }

  initEventListeners() {
    // 1. Bước vào phân khu mới
    GameEventBus.on('CORE:ZONE_ENTERED', (payload) => {
      this.show(
        payload.zoneName || 'Phân khu mới',
        payload.description || 'Bạn vừa đặt chân đến một góc ký ức Hà Nội.',
        'location'
      );
    });

    // 2. Bước vào địa danh / công trình mới (từ Core phát ra)
    GameEventBus.on('CORE:LANDMARK_ENTERED', (payload) => {
      if (payload) {
        this.show(
          payload.title || payload.name || 'Công trình mới',
          payload.body || payload.description || 'Bạn vừa bước vào một địa danh lịch sử.',
          payload.icon || 'location',
          5000
        );
      }
    });

    // 3. Giải mã thành công giao điểm thị giác
    GameEventBus.on('CORE:PUZZLE_SOLVED', (payload) => {
      this.show(
        `Ký Ức Được Phục Hồi: ${payload.title || 'Câu đố ký ức'}`,
        payload.quote || 'Giao điểm thị giác đã hé mở một lối tắt thời gian.',
        'puzzle',
        6500
      );
    });

    // 4. Chụp ảnh film thành công
    GameEventBus.on('CORE:PHOTO_CAPTURED', (payload) => {
      this.show(
        'Đã Tráng Cuộn Film',
        payload.poemQuote || 'Khoảnh khắc vừa được lưu giữ vào Album Ký Ức.',
        'camera'
      );
    });
  }

  /**
   * Bộ giám sát tọa độ người chơi theo thời gian thực
   * Tự động phát Toast khi người chơi bước lên dốc Cầu Long Biên, Cầu Thê Húc hoặc vào trong tiệm Cà phê/Mậu dịch
   */
  startLandmarkTracker() {
    setInterval(() => {
      const playerPos = this.getPlayerPosition();
      if (!playerPos) return;

      let detectedLandmark = null;
      for (const lm of SPECIAL_LANDMARKS) {
        if (lm.check(playerPos)) {
          detectedLandmark = lm;
          break;
        }
      }

      const now = Date.now();

      if (detectedLandmark) {
        if (this.currentLandmarkId !== detectedLandmark.id) {
          const lastTime = this.landmarkCooldownMap.get(detectedLandmark.id) || 0;
          // Cooldown 20 giây giữa các lần vào lại cùng 1 công trình
          if (now - lastTime > 20000) {
            this.landmarkCooldownMap.set(detectedLandmark.id, now);
            this.show(detectedLandmark.title, detectedLandmark.body, detectedLandmark.icon, 5000);
          }
          this.currentLandmarkId = detectedLandmark.id;
        }
      } else {
        // Đã ra khỏi khu vực landmark
        this.currentLandmarkId = null;
      }
    }, 450);
  }

  getPlayerPosition() {
    try {
      if (window._GameCoreInstance && window._GameCoreInstance.playerController) {
        return window._GameCoreInstance.playerController.getPosition();
      }
    } catch (e) {}
    return null;
  }

  getIconSvg(type) {
    switch (type) {
      case 'bridge':
        return `<svg style="width:20px;height:20px;fill:currentColor" viewBox="0 0 24 24"><path d="M4 18v-2h16v2H4zm0-4v-2h1.5l2.25-4.5H9v4.5h6V7.5h1.25L18.5 12H20v2H4zM2 20h20v2H2v-2z"/></svg>`;
      case 'cafe':
        return `<svg style="width:20px;height:20px;fill:currentColor" viewBox="0 0 24 24"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4v-2z"/></svg>`;
      case 'shop':
        return `<svg style="width:20px;height:20px;fill:currentColor" viewBox="0 0 24 24"><path d="M18.36 9l.6 3H5.04l.6-3h12.72M20 4H4v2h16V4zm0 3H4l-1 5v2h1v6h10v-6h4v6h2v-6h1v-2l-1-5zM6 18v-4h6v4H6z"/></svg>`;
      case 'location':
        return `<svg style="width:18px;height:18px;fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
      case 'puzzle':
        return `<svg style="width:18px;height:18px;fill:currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`;
      case 'camera':
        return `<svg style="width:18px;height:18px;fill:currentColor" viewBox="0 0 24 24"><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>`;
      default:
        return `<svg style="width:18px;height:18px;fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`;
    }
  }

  show(title, body, iconType = 'info', duration = 4800) {
    if (this.activeToasts.length >= this.maxToasts) {
      const oldest = this.activeToasts.shift();
      if (oldest && oldest.element) {
        this.dismiss(oldest.element);
      }
    }

    const toast = document.createElement('div');
    toast.className = 'retro-toast-card';
    toast.innerHTML = `
      <div class="toast-stamp-badge">HANOI &bull; TEM BƯU CHÍNH</div>
      <div class="toast-main-row">
        <div class="toast-icon-wrapper">
          ${this.getIconSvg(iconType)}
        </div>
        <div class="toast-content-wrapper">
          <div class="toast-title">${title}</div>
          <div class="toast-body">${body}</div>
        </div>
      </div>
    `;

    this.container.appendChild(toast);
    const toastObj = { element: toast, timer: null };
    this.activeToasts.push(toastObj);

    toast.addEventListener('click', () => {
      this.dismiss(toast);
    });

    toastObj.timer = setTimeout(() => {
      this.dismiss(toast);
    }, duration);
  }

  dismiss(toastElement) {
    toastElement.classList.add('fade-out');
    setTimeout(() => {
      if (toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }
      this.activeToasts = this.activeToasts.filter(t => t.element !== toastElement);
    }, 300);
  }
}
