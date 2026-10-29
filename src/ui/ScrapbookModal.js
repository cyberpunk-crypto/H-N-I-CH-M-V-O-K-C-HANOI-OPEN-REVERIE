/**
 * ScrapbookModal.js - Cuốn Album Ký Ức Hà Nội bìa da cổ điển
 * Lưu giữ ảnh film 35mm, tem bưu chính và tản văn hoài niệm
 * Có tính năng tải ảnh về máy tính cá nhân
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { GameEventBus } from '../bridge/GameEvents.js';

const SAMPLE_MEMORIES = [
  {
    id: 'sample_turtle_mist',
    dataUrl: 'assets/photos/memory_turtle_mist.jpg',
    zone: 'Hồ Gươm & Tháp Rùa',
    timestamp: Date.now() - 86400000 * 2,
    quote: 'Sương sớm bảng lảng phủ mờ bóng Tháp Rùa, rặng liễu rủ khẽ chạm mặt gương hồ tĩnh lặng.'
  },
  {
    id: 'sample_train_street',
    dataUrl: 'assets/photos/memory_train_street.jpg',
    zone: 'Phố Đường Tàu',
    timestamp: Date.now() - 86400000,
    quote: 'Tiếng còi tàu xé toạc con ngõ hẹp, vệt khói bảng lảng trên những mái ngói rêu phong Phùng Hưng.'
  },
  {
    id: 'sample_long_bien',
    dataUrl: 'assets/photos/memory_long_bien.jpg',
    zone: 'Cầu Long Biên',
    timestamp: Date.now() - 43200000,
    quote: 'Hoàng hôn nhuộm đỏ rực dầm thép Eiffel hoen rỉ, gió sông Hồng thổi lồng lộng qua bãi lau.'
  },
  {
    id: 'sample_apartment',
    dataUrl: 'assets/photos/memory_apartment.jpg',
    zone: 'Khu Tập Thể Cũ',
    timestamp: Date.now() - 7200000,
    quote: 'Chuồng cọp sắt vươn mình đón nắng chiều muộn, giàn hoa giấy nở bung rực rỡ bên hiên vôi vàng.'
  }
];

export class ScrapbookModal {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.element = null;
    this.isOpen = false;
    this.photos = [];

    this.render();
    this.initPhotos();
    this.bindEvents();
  }

  async initPhotos() {
    try {
      if (window.GameAPI && typeof window.GameAPI.getAlbumPhotos === 'function') {
        const stored = await window.GameAPI.getAlbumPhotos();
        if (stored && stored.length > 0) {
          this.photos = stored;
        } else {
          this.photos = [...SAMPLE_MEMORIES];
        }
      } else {
        this.photos = [...SAMPLE_MEMORIES];
      }
    } catch (e) {
      this.photos = [...SAMPLE_MEMORIES];
    }
    this.renderPhotoGrid();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'scrapbook-modal hidden';
    this.element.innerHTML = `
      <div class="leather-album-binder">
        <div class="album-spine-line"></div>
        <button type="button" id="btnCloseAlbum" class="btn-close-modal" title="Đóng Album">&times;</button>

        <header class="album-header-bar">
          <div>
            <h2 class="album-title-text">CUỐN ALBUM KÝ ỨC HÀ NỘI</h2>
            <p class="album-subtitle-text">Bộ sưu tập những lát cắt thời gian ngưng đọng qua ống kính 35mm</p>
          </div>
          <span style="font-family:var(--font-mono);font-size:0.8rem;color:var(--c-yellow-cuc);background:rgba(212,175,55,0.15);padding:6px 12px;border-radius:4px;border:1px solid rgba(212,175,55,0.3)">
            PHÍM TẮT: B / ESC
          </span>
        </header>

        <div id="albumPhotoGrid" class="album-photo-grid">
          <!-- Các tấm ảnh polaroid dán tem sẽ được render ở đây -->
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
  }

  renderPhotoGrid() {
    const grid = this.element.querySelector('#albumPhotoGrid');
    if (!grid) return;

    if (this.photos.length === 0) {
      grid.innerHTML = `
        <div class="empty-album-msg">
          <svg style="width:48px;height:48px;fill:var(--c-yellow-cuc)" viewBox="0 0 24 24">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          <p>Chưa có bức ảnh nào được chụp. Hãy dạo phố và bấm phím V để săn khoảnh khắc!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.photos.map((item, idx) => {
      // Random góc xoay nhẹ tạo cảm giác dán thủ công (-2 đến +2 độ)
      const rot = ((idx % 5) - 2) * 1.2;
      const dateStr = new Date(item.timestamp || Date.now()).toLocaleDateString('vi-VN');

      return `
        <div class="polaroid-photo-card" style="--rot: ${rot}deg;" data-photo-id="${item.id}">
          <div class="polaroid-img-frame">
            <img src="${item.dataUrl}" alt="Ký ức Hà Nội" loading="lazy" />
            <div class="polaroid-stamp"></div>
          </div>
          <p class="polaroid-caption">&ldquo;${item.quote || 'Khoảnh khắc ngưng đọng giữa phố phường Hà Nội.'}&rdquo;</p>
          <div class="polaroid-meta">
            <span>${item.zone || 'Hà Nội'} &bull; ${dateStr}</span>
            <button type="button" class="btn-download-photo" data-url="${item.dataUrl}" data-id="${item.id}" title="Tải ảnh về máy">
              Tải Về &darr;
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Gắn sự kiện download cho từng ảnh
    grid.querySelectorAll('.btn-download-photo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = btn.dataset.url;
        const id = btn.dataset.id;
        this.downloadPhoto(url, id);
      });
    });
  }

  downloadPhoto(dataUrl, photoId) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `HaNoi_KyUc_${photoId || Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  bindEvents() {
    // Đóng Album
    const btnClose = this.element.querySelector('#btnCloseAlbum');
    btnClose.addEventListener('click', () => {
      this.closeAlbum();
    });

    // Phím tắt B / Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'b' || e.key === 'B') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        this.toggleAlbum();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.closeAlbum();
      }
    });

    // Lắng nghe sự kiện Core gửi ảnh chụp mới
    GameEventBus.on('CORE:PHOTO_CAPTURED', (payload) => {
      this.addPhoto({
        id: payload.photoId || `photo_${Date.now()}`,
        dataUrl: payload.dataUrl,
        zone: payload.zoneId || 'Hà Nội',
        timestamp: payload.timestamp || Date.now(),
        quote: payload.poemQuote || 'Một thoáng Hà Nội vừa ngưng đọng trong ống kính.'
      });
    });
  }

  addPhoto(photoObj) {
    this.photos.unshift(photoObj);
    this.renderPhotoGrid();

    // Lưu vào LocalStorage
    try {
      localStorage.setItem('hanoi_album_photos', JSON.stringify(this.photos));
    } catch (e) {}
  }

  toggleAlbum() {
    if (this.isOpen) {
      this.closeAlbum();
    } else {
      this.openAlbum();
    }
  }

  openAlbum() {
    this.isOpen = true;
    this.element.classList.remove('hidden');

    if (window.GameAPI && typeof window.GameAPI.setPlayerMovementLock === 'function') {
      window.GameAPI.setPlayerMovementLock(true);
    }

    GameEventBus.emit('UI:OPEN_SCRAPBOOK', { open: true });
  }

  closeAlbum() {
    this.isOpen = false;
    this.element.classList.add('hidden');

    if (window.GameAPI && typeof window.GameAPI.setPlayerMovementLock === 'function') {
      window.GameAPI.setPlayerMovementLock(false);
    }

    GameEventBus.emit('UI:OPEN_SCRAPBOOK', { open: false });
  }
}
