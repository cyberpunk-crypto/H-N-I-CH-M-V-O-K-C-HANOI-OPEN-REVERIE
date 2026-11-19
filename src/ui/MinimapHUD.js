/**
 * MinimapHUD.js - Bản đồ du lịch Hà Nội cổ điển thu nhỏ & Modal Bản đồ toàn cảnh
 * Hỗ trợ la bàn chỉ hướng 4 phân khu và phím tắt Tab / M
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { GameEventBus } from '../bridge/GameEvents.js';

export const ZONES = [
  {
    id: 'ho_guom',
    name: 'Hồ Gươm & Tháp Rùa',
    subtitle: 'Khu A: Trái Tim Cổ Kính',
    desc: 'Tháp Rùa rêu phong giữa làn sương mai, Cầu Thê Húc son đỏ uốn lượn và hàng liễu rủ ven hồ.',
    coords: '(0, -120)',
    tag: 'ĐÔNG NAM'
  },
  {
    id: 'pho_co',
    name: 'Mê Cung Phố Cổ & Đường Tàu',
    subtitle: 'Khu B: 36 Phố Phường',
    desc: 'Hàng Bạc, Hàng Ngang, Hàng Đào; đường ray xe lửa rít sát vách nhà ống và quán cà phê cóc.',
    coords: '(-120, 120)',
    tag: 'TÂY BẮC'
  },
  {
    id: 'long_bien',
    name: 'Nhịp Cầu Long Biên & Sông Hồng',
    subtitle: 'Khu C: Chứng Nhân Lịch Sử',
    desc: 'Dầm thép Eiffel rỉ sét màu cánh gián vắt ngang sông Hồng và bãi bồi lau sậy bạt ngàn.',
    coords: '(120, 120)',
    tag: 'ĐÔNG BẮC'
  },
  {
    id: 'tap_the',
    name: 'Khu Tập Thể Cũ Hoàng Hôn',
    subtitle: 'Khu D: Hoài Niệm Bao Cấp',
    desc: 'Dãy nhà tập thể 5 tầng, chuồng cọp sắt vươn mình, giàn hoa giấy rực đỏ và tiếng loa phường.',
    coords: '(-120, -120)',
    tag: 'TÂY NAM'
  }
];

export class MinimapHUD {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.compactElement = null;
    this.modalElement = null;
    this.isMapOpen = false;

    this.playerHeading = 0; // độ (0 - 360)
    this.playerPos = { x: 0, z: 0 };

    this.render();
    this.bindEvents();
  }

  render() {
    // 1. Bản đồ thu nhỏ góc màn hình (Compact Minimap)
    this.compactElement = document.createElement('div');
    this.compactElement.className = 'minimap-compact-container hud-interactive';
    this.compactElement.title = 'Bấm Tab hoặc M để mở Bản Đồ Du Lịch Toàn Cảnh';
    this.compactElement.innerHTML = `
      <canvas id="minimapCanvas" class="minimap-canvas-layer" width="170" height="170"></canvas>
      <div class="compass-needle-layer">
        <svg id="compassRoseSvg" class="compass-rose" viewBox="0 0 100 100">
          <polygon points="50,10 60,50 50,42 40,50" fill="#e74c3c" stroke="#fff" stroke-width="1"/>
          <polygon points="50,90 60,50 50,58 40,50" fill="#d4af37" stroke="#fff" stroke-width="1"/>
          <circle cx="50" cy="50" r="4" fill="#121008" stroke="#d4af37" stroke-width="2"/>
        </svg>
      </div>
    `;
    this.container.appendChild(this.compactElement);

    // 2. Modal Bản Đồ Toàn Cảnh (Expanded Tourist Map)
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'tourist-map-modal hidden';
    this.modalElement.innerHTML = `
      <div class="vintage-map-frame">
        <button type="button" id="btnCloseMapModal" class="btn-close-modal" title="Đóng bản đồ">&times;</button>

        <header class="map-modal-header">
          <div>
            <h2 class="map-modal-title">BẢN ĐỒ DU LỊCH CỔ ĐIỂN HÀ NỘI</h2>
            <p class="map-modal-subtitle">4 Phân khu thế giới mở 500m x 500m &bull; Giao thông liền mạch</p>
          </div>
          <span style="font-family:var(--font-mono);font-size:0.8rem;color:#795548;background:rgba(121,85,72,0.15);padding:4px 10px;border-radius:4px;">
            PHÍM TẮT: TAB / M / ESC
          </span>
        </header>

        <div class="map-zones-grid">
          ${ZONES.map(zone => `
            <div class="zone-teleport-card" data-zone-id="${zone.id}">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span class="zone-card-title">${zone.name}</span>
                <span style="font-family:var(--font-mono);font-size:0.75rem;color:#8b2635;font-weight:700;">${zone.tag}</span>
              </div>
              <p class="zone-card-desc">${zone.desc}</p>
              <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:0.72rem;color:#6d4c41;">Tọa độ: ${zone.coords}</span>
                <button type="button" class="btn-teleport" style="padding:4px 12px;background:#8b2635;color:#fff;border-radius:3px;font-size:0.78rem;font-family:var(--font-mono)">
                  Dịch Chuyển &rarr;
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="text-align:center;font-family:var(--font-poem);font-style:italic;font-size:0.88rem;color:#5d4037;">
          &ldquo;Gió đưa cành trúc la đà, tiếng chuông Trấn Vũ canh gà Thọ Xương...&rdquo;
        </div>
      </div>
    `;
    this.container.appendChild(this.modalElement);

    this.drawMinimapCanvas();
  }

  drawMinimapCanvas() {
    const canvas = this.compactElement.querySelector('#minimapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Nền bản đồ giấy cũ ngả vàng
    ctx.fillStyle = '#1e1812';
    ctx.fillRect(0, 0, w, h);

    // Vẽ 4 góc phân khu mờ nhẹ
    // Tây Bắc (Phố Cổ)
    ctx.fillStyle = 'rgba(183, 121, 31, 0.25)';
    ctx.fillRect(0, 0, w / 2, h / 2);

    // Đông Bắc (Cầu Long Biên)
    ctx.fillStyle = 'rgba(58, 34, 24, 0.35)';
    ctx.fillRect(w / 2, 0, w / 2, h / 2);

    // Tây Nam (Khu Tập Thể)
    ctx.fillStyle = 'rgba(212, 163, 115, 0.2)';
    ctx.fillRect(0, h / 2, w / 2, h / 2);

    // Đông Nam (Hồ Gươm)
    ctx.fillStyle = 'rgba(42, 72, 54, 0.3)';
    ctx.fillRect(w / 2, h / 2, w / 2, h / 2);

    // Đường phân chia ranh giới chữ thập
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tâm Hồ Gươm (Vòng tròn mặt nước xanh lục thủy thanh bình)
    ctx.fillStyle = 'rgba(46, 134, 193, 0.45)';
    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.75, 22, 0, Math.PI * 2);
    ctx.fill();

    // Vệt nước Sông Hồng uốn lượn góc Đông Bắc
    ctx.strokeStyle = 'rgba(138, 64, 38, 0.4)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(w * 0.85, h * 0.15, 36, Math.PI * 0.6, Math.PI * 1.4);
    ctx.stroke();

    // VÒNG TRÒN LA BÀN HOÀN CHỈNH & CHỈ HƯỚNG 0° (BẮC)
    // Loại bỏ hoàn toàn chữ Phố Cổ, Long Biên, Tập Thể, Hồ Gươm theo đúng yêu cầu
    const centerX = w / 2;
    const centerY = h / 2;
    const dialRadius = w / 2 - 10;

    // Vành la bàn mạ vàng thanh mảnh
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, dialRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Vạch chia độ quanh vòng la bàn (mỗi 30 độ và 90 độ)
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg - 90) * (Math.PI / 180);
      const isMajor = (deg % 90 === 0);
      const tickLen = isMajor ? 6 : 3;
      const x1 = centerX + Math.cos(rad) * (dialRadius - tickLen);
      const y1 = centerY + Math.sin(rad) * (dialRadius - tickLen);
      const x2 = centerX + Math.cos(rad) * dialRadius;
      const y2 = centerY + Math.sin(rad) * dialRadius;

      ctx.strokeStyle = isMajor ? 'rgba(255, 215, 0, 0.9)' : 'rgba(212, 175, 55, 0.45)';
      ctx.lineWidth = isMajor ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Biểu tượng chữ "0°" ở đỉnh La bàn (Bắc)
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px "Courier Prime", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('0°', centerX, 13);
  }

  bindEvents() {
    // Click compact map để phóng to
    this.compactElement.addEventListener('click', () => {
      this.openMapModal();
    });

    // Đóng modal
    const btnClose = this.modalElement.querySelector('#btnCloseMapModal');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        btnClose.blur();
        this.closeMapModal();
      });
    }

    // Phím tắt Escape đóng bản đồ khi đang mở
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMapOpen) {
        this.closeMapModal();
      }
    });

    // Bấm các nút dịch chuyển Teleport
    const cards = this.modalElement.querySelectorAll('.zone-teleport-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const zoneId = card.dataset.zoneId;
        this.teleportToZone(zoneId);
      });
    });
  }

  toggleMapModal() {
    if (this.isMapOpen) {
      this.closeMapModal();
    } else {
      this.openMapModal();
    }
  }

  openMapModal() {
    this.isMapOpen = true;
    this.modalElement.classList.remove('hidden');
    if (window.GameAPI && typeof window.GameAPI.setPlayerMovementLock === 'function') {
      window.GameAPI.setPlayerMovementLock(true);
    }
  }

  closeMapModal() {
    this.isMapOpen = false;
    this.modalElement.classList.add('hidden');
    if (window.GameAPI && typeof window.GameAPI.setPlayerMovementLock === 'function') {
      window.GameAPI.setPlayerMovementLock(false);
    }
  }

  teleportToZone(zoneId) {
    // Bắn sự kiện theo bảng hợp đồng 3.2
    GameEventBus.emit('UI:TELEPORT_REQUEST', { zoneId });
    this.closeMapModal();
  }

  /**
   * Cập nhật góc quay của la bàn (được gọi từ Game Loop Core)
   * @param {number} headingDeg - Góc quay tính bằng độ
   */
  updateHeading(headingDeg) {
    this.playerHeading = headingDeg;
    const needle = this.compactElement.querySelector('#compassRoseSvg');
    if (needle) {
      needle.style.transform = `rotate(${-headingDeg}deg)`;
    }
  }
}
