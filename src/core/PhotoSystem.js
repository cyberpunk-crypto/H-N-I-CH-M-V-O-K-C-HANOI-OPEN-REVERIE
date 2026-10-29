/**
 * PhotoSystem.js - Hệ thống Chụp Ảnh Film 35mm, Hậu Kỳ Grain & Tem Ký Ức Hà Nội
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { storageService } from './StorageService.js';

const HANOI_POEMS = [
  'Gió thổi mùa thu hương cốm mới, lòng bâng khuâng nhớ một góc phố quen.',
  'Chiều buông nhịp dầm Long Biên, khói hoàng hôn quyện sông Hồng đỏ nặng.',
  'Tiếng còi tàu rít trong ngõ nhỏ, thức dậy một trời ký ức xa xưa.',
  'Mái ngói rêu phong còn đọng lại bao giọt thời gian thầm lặng.',
  'Hà Nội mùa này vắng những cơn mưa, cái rét đầu đông khẽ luồn qua tóc.',
  'Một chén trà thơm bên hè phố, nghe tiếng thu rơi giữa lòng người.'
];

export class PhotoSystem {
  constructor(renderer, scene, camera, zoneManager, perspectivePuzzle, eventBus) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.zoneManager = zoneManager;
    this.perspectivePuzzle = perspectivePuzzle;
    this.eventBus = eventBus || window.GameEventBus;

    this.isCapturing = false;

    // Âm thanh màn trập cơ học
    this.shutterAudio = new Audio('assets/audio/shutter_click.mp3');
    this.shutterAudio.volume = 0.85;

    this._bindEvents();
  }

  _bindEvents() {
    // 1. Phím Space trong FPS hoặc nút Trigger Shutter
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        const camStatus = window.GameAPI ? window.GameAPI.getCameraStatus() : null;
        if (camStatus && camStatus.mode === 'FPS') {
          // Khi đang ở góc nhìn máy ảnh film, bấm Space là chụp ảnh
          e.preventDefault();
          this.capture('portra');
        }
      }
    });

    // 2. Lắng nghe sự kiện chụp ảnh từ UI
    if (this.eventBus) {
      this.eventBus.on('UI:TRIGGER_SHUTTER', (payload) => {
        const filter = (payload && payload.filter) || 'portra';
        this.capture(filter);
      });
    }
  }

  /**
   * Chụp khung hình từ WebGL Canvas và áp dụng hậu kỳ film
   * @param {string} filterPreset - 'portra' | 'tri-x' | 'sepia' | 'cyber-hanoi'
   * @returns {Promise<string>} Base64 Data URL của bức ảnh hoàn chỉnh
   */
  async capture(filterPreset = 'portra') {
    if (this.isCapturing) return null;
    this.isCapturing = true;

    try {
      // 1. Phát âm thanh màn trập đanh thép của Leica M3
      try {
        this.shutterAudio.currentTime = 0;
        this.shutterAudio.play().catch(() => {});
      } catch {}

      // 2. Hiệu ứng chớp màn trập cơ học (Flash Shutter)
      this._flashShutterEffect();

      // 3. Render 1 frame nguyên bản sắc nét
      this.renderer.render(this.scene, this.camera);
      const rawDataUrl = this.renderer.domElement.toDataURL('image/jpeg', 0.92);

      // 4. Kiểm tra xem có đang căn đúng câu đố Giao Điểm Thị Giác không
      let isPuzzle = false;
      let solvedPuzzleData = null;
      if (this.perspectivePuzzle) {
        solvedPuzzleData = this.perspectivePuzzle.checkShutterCapture();
        if (solvedPuzzleData) {
          isPuzzle = true;
        }
      }

      // 5. Xác định phân khu hiện tại và câu thơ tương ứng
      const currentZoneId = this.zoneManager ? this.zoneManager.getCurrentZoneId() : 'ho_guom';
      const randomQuote = solvedPuzzleData 
        ? solvedPuzzleData.quote 
        : HANOI_POEMS[Math.floor(Math.random() * HANOI_POEMS.length)];

      // 6. Xử lý hậu kỳ Film Grain & In tem Ký Ức bằng Canvas 2D
      const processedDataUrl = await this._applyVintageDarkroom(rawDataUrl, filterPreset, {
        zoneId: currentZoneId,
        quote: randomQuote,
        isPuzzle
      });

      const photoId = 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      const timestamp = Date.now();

      const photoRecord = {
        photoId,
        id: photoId,
        dataUrl: processedDataUrl,
        zoneId: currentZoneId,
        timestamp,
        isPuzzle,
        poemQuote: randomQuote,
        filterPreset
      };

      // 7. Lưu trữ ảnh vào StorageService (IndexedDB + LocalStorage)
      await storageService.savePhoto(photoRecord);

      // 8. Bắn sự kiện hoàn tất chụp ảnh sang UI
      if (this.eventBus) {
        this.eventBus.emit('CORE:PHOTO_CAPTURED', {
          photoId,
          dataUrl: processedDataUrl,
          zoneId: currentZoneId,
          timestamp,
          isPuzzle,
          poemQuote: randomQuote
        });
      }

      this.isCapturing = false;
      return processedDataUrl;
    } catch (err) {
      console.error('[PhotoSystem] Lỗi khi chụp và xử lý ảnh film:', err);
      this.isCapturing = false;
      return null;
    }
  }

  /**
   * Hiệu ứng chớp đen màn trập chớp nhoáng (0.08 giây)
   */
  _flashShutterEffect() {
    const flashDiv = document.createElement('div');
    flashDiv.style.position = 'fixed';
    flashDiv.style.top = '0';
    flashDiv.style.left = '0';
    flashDiv.style.width = '100vw';
    flashDiv.style.height = '100vh';
    flashDiv.style.backgroundColor = '#000000';
    flashDiv.style.opacity = '0.9';
    flashDiv.style.zIndex = '99999';
    flashDiv.style.pointerEvents = 'none';
    flashDiv.style.transition = 'opacity 0.08s ease-out';

    document.body.appendChild(flashDiv);

    setTimeout(() => {
      flashDiv.style.opacity = '0';
      setTimeout(() => {
        if (flashDiv.parentNode) {
          flashDiv.parentNode.removeChild(flashDiv);
        }
      }, 100);
    }, 40);
  }

  /**
   * Phòng tối tráng phim giả lập (Vintage Darkroom)
   * Áp dụng tông màu Kodak Portra / Ilford Tri-X, hạt film grain, tem con tem và chữ thơ
   */
  _applyVintageDarkroom(rawDataUrl, filterPreset, meta) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // 1. Vẽ ảnh gốc
        ctx.drawImage(img, 0, 0);

        // 2. Lấy dữ liệu Pixel để áp dụng bộ lọc màu & hạt film
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const len = data.length;

        const isPortra = filterPreset === 'portra';
        const isTriX = filterPreset === 'tri-x';
        const isSepia = filterPreset === 'sepia';

        for (let i = 0; i < len; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          // Nhiễu hạt film grain ngẫu nhiên (Silver Halide Grain)
          const grain = (Math.random() - 0.5) * 22;

          if (isTriX) {
            // Đen trắng tương phản cao Ilford Tri-X 400
            let gray = 0.299 * r + 0.587 * g + 0.114 * b + grain;
            gray = ((gray - 128) * 1.25) + 128; // Tăng contrast
            gray = Math.max(0, Math.min(255, gray));
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          } else if (isSepia) {
            // Nâu sepia hoài cổ thập niên 80
            const tr = (r * 0.393 + g * 0.769 + b * 0.189) + grain;
            const tg = (r * 0.349 + g * 0.686 + b * 0.168) + grain * 0.8;
            const tb = (r * 0.272 + g * 0.534 + b * 0.131) + grain * 0.6;
            data[i] = Math.max(0, Math.min(255, tr));
            data[i + 1] = Math.max(0, Math.min(255, tg));
            data[i + 2] = Math.max(0, Math.min(255, tb));
          } else {
            // Kodak Portra: Vàng cam hoàng hôn ấm, nâng nhẹ tông da và rêu
            r = r * 1.08 + grain + 8;
            g = g * 1.02 + grain + 4;
            b = b * 0.92 + grain - 4;
            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
          }
        }
        ctx.putImageData(imgData, 0, 0);

        // 3. Hiệu ứng tối 4 góc ống kính (Vignetting)
        const vignetteGrad = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
          canvas.width / 2, canvas.height / 2, canvas.width * 0.75
        );
        vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignetteGrad.addColorStop(1, 'rgba(20, 10, 5, 0.45)');
        ctx.fillStyle = vignetteGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 4. Viền tem và con dấu Bưu Chính Hà Nội
        const stampW = Math.max(160, canvas.width * 0.18);
        const stampH = stampW * 0.65;
        const stampX = canvas.width - stampW - 30;
        const stampY = 30;

        // Nền tem phong cách bưu chính xưa
        ctx.fillStyle = '#f4ecd8';
        ctx.strokeStyle = '#c49a6c';
        ctx.lineWidth = 3;
        ctx.fillRect(stampX, stampY, stampW, stampH);
        ctx.strokeRect(stampX, stampY, stampW, stampH);

        // Chữ trên tem
        ctx.fillStyle = '#8a3324';
        ctx.font = 'bold ' + Math.round(stampH * 0.22) + 'px "Courier New", serif';
        ctx.textAlign = 'center';
        ctx.fillText('BƯU CHÍNH HÀ NỘI', stampX + stampW / 2, stampY + stampH * 0.38);

        ctx.fillStyle = '#555555';
        ctx.font = Math.round(stampH * 0.18) + 'px monospace';
        const dateStr = '10/1989 - VIỆT NAM';
        ctx.fillText(dateStr, stampX + stampW / 2, stampY + stampH * 0.68);

        // 5. In chữ thư pháp / thơ ngẫu hứng góc dưới ảnh
        const bannerH = Math.max(48, canvas.height * 0.08);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, canvas.height - bannerH, canvas.width, bannerH);

        ctx.fillStyle = '#ffd580';
        ctx.font = 'italic ' + Math.round(bannerH * 0.38) + 'px "Times New Roman", serif';
        ctx.textAlign = 'left';
        ctx.fillText(`“${meta.quote}”`, 35, canvas.height - bannerH * 0.42);

        // Trả về Data URL ảnh film
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      };
      img.src = rawDataUrl;
    });
  }
}
