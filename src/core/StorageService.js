/**
 * StorageService.js - Quản lý lưu trữ dữ liệu cục bộ (IndexedDB & LocalStorage)
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

export class StorageService {
  constructor() {
    this.dbName = 'HanoiReverieDB';
    this.dbVersion = 1;
    this.db = null;
    this.isReady = false;
    this.readyPromise = this._initDB();
  }

  /**
   * Khởi tạo IndexedDB với các Object Stores
   */
  async _initDB() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        console.warn('[StorageService] IndexedDB không hỗ trợ, chuyển sang LocalStorage dự phòng.');
        this.isReady = true;
        resolve(null);
        return;
      }

      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store lưu ảnh film
        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
          photoStore.createIndex('timestamp', 'timestamp', { unique: false });
          photoStore.createIndex('zoneId', 'zoneId', { unique: false });
          photoStore.createIndex('isPuzzle', 'isPuzzle', { unique: false });
        }

        // Store lưu tiến trình câu đố
        if (!db.objectStoreNames.contains('puzzles')) {
          db.createObjectStore('puzzles', { keyPath: 'id' });
        }

        // Store lưu thiết lập và trạng thái
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isReady = true;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('[StorageService] Lỗi mở IndexedDB:', event.target.error);
        this.isReady = true;
        resolve(null);
      };
    });
  }

  /**
   * Đảm bảo DB đã sẵn sàng trước khi truy vấn
   */
  async ensureReady() {
    if (!this.isReady) {
      await this.readyPromise;
    }
  }

  /**
   * Lưu bức ảnh mới vào IndexedDB và đồng bộ metadata sang LocalStorage
   * @param {Object} photo - { id, dataUrl, zoneId, timestamp, isPuzzle, poemQuote, filterPreset }
   */
  async savePhoto(photo) {
    await this.ensureReady();

    // 1. Lưu vào IndexedDB (toàn bộ ảnh chất lượng cao base64)
    if (this.db) {
      try {
        const tx = this.db.transaction('photos', 'readwrite');
        const store = tx.objectStore('photos');
        store.put(photo);
      } catch (err) {
        console.error('[StorageService] Lỗi ghi IndexedDB photo:', err);
      }
    }

    // 2. Lưu bản tóm tắt vào LocalStorage (cho GameAPI.getAlbumPhotos đọc nhanh)
    try {
      const raw = localStorage.getItem('hanoi_album_photos');
      const album = raw ? JSON.parse(raw) : [];
      // Kiểm tra nếu id đã tồn tại thì cập nhật, ngược lại thêm mới vào đầu danh sách
      const existingIdx = album.findIndex(p => p.id === photo.id);
      const summaryItem = {
        id: photo.id,
        dataUrl: photo.dataUrl,
        zone: photo.zoneId,
        zoneId: photo.zoneId,
        timestamp: photo.timestamp,
        quote: photo.poemQuote || '',
        poemQuote: photo.poemQuote || '',
        isPuzzle: !!photo.isPuzzle
      };

      if (existingIdx >= 0) {
        album[existingIdx] = summaryItem;
      } else {
        album.unshift(summaryItem);
      }

      // Giữ tối đa 50 ảnh gần nhất trong LocalStorage để tránh tràn dung lượng 5MB
      if (album.length > 50) {
        album.length = 50;
      }
      localStorage.setItem('hanoi_album_photos', JSON.stringify(album));
    } catch (e) {
      console.warn('[StorageService] Không thể ghi LocalStorage hanoi_album_photos:', e);
    }

    return photo;
  }

  /**
   * Lấy toàn bộ danh sách ảnh từ IndexedDB, dự phòng LocalStorage
   * @returns {Promise<Array>}
   */
  async getPhotos() {
    await this.ensureReady();

    if (this.db) {
      try {
        return await new Promise((resolve) => {
          const tx = this.db.transaction('photos', 'readonly');
          const store = tx.objectStore('photos');
          const request = store.getAll();

          request.onsuccess = () => {
            const list = request.result || [];
            // Sắp xếp ảnh mới nhất lên đầu
            list.sort((a, b) => b.timestamp - a.timestamp);
            resolve(list);
          };

          request.onerror = () => {
            resolve(this._getPhotosFromLocalStorage());
          };
        });
      } catch (e) {
        console.warn('[StorageService] Fallback getPhotos to LocalStorage:', e);
      }
    }

    return this._getPhotosFromLocalStorage();
  }

  _getPhotosFromLocalStorage() {
    try {
      const raw = localStorage.getItem('hanoi_album_photos');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Đánh dấu câu đố thị giác đã giải quyết
   * @param {string} puzzleId 
   * @param {Object} details 
   */
  async markPuzzleSolved(puzzleId, details = {}) {
    await this.ensureReady();
    const item = {
      id: puzzleId,
      solvedAt: Date.now(),
      ...details
    };

    if (this.db) {
      try {
        const tx = this.db.transaction('puzzles', 'readwrite');
        tx.objectStore('puzzles').put(item);
      } catch (e) {
        console.error('[StorageService] Lỗi ghi puzzle vào IndexedDB:', e);
      }
    }

    try {
      const raw = localStorage.getItem('hanoi_unlocked_puzzles');
      const puzzles = raw ? JSON.parse(raw) : [];
      if (!puzzles.includes(puzzleId)) {
        puzzles.push(puzzleId);
        localStorage.setItem('hanoi_unlocked_puzzles', JSON.stringify(puzzles));
      }
    } catch (e) {
      console.warn('[StorageService] Lỗi ghi hanoi_unlocked_puzzles:', e);
    }
  }

  /**
   * Lấy danh sách ID các câu đố đã giải
   */
  getSolvedPuzzleIds() {
    try {
      const raw = localStorage.getItem('hanoi_unlocked_puzzles');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Lưu hồ sơ người chơi
   */
  saveUserProfile(profile) {
    try {
      localStorage.setItem('hanoi_user_profile', JSON.stringify(profile));
      return true;
    } catch (e) {
      console.error('[StorageService] Lỗi lưu user profile:', e);
      return false;
    }
  }

  /**
   * Lấy hồ sơ người chơi
   */
  getUserProfile() {
    try {
      const raw = localStorage.getItem('hanoi_user_profile');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Lưu cài đặt âm lượng
   */
  saveAudioSettings(settings) {
    try {
      localStorage.setItem('hanoi_audio_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('[StorageService] Lỗi lưu audio settings:', e);
    }
  }

  /**
   * Lấy cài đặt âm lượng
   */
  getAudioSettings() {
    try {
      const raw = localStorage.getItem('hanoi_audio_settings');
      return raw ? JSON.parse(raw) : { master: 0.8, bgm: 0.6, sfx: 0.9 };
    } catch {
      return { master: 0.8, bgm: 0.6, sfx: 0.9 };
    }
  }
}

export const storageService = new StorageService();
