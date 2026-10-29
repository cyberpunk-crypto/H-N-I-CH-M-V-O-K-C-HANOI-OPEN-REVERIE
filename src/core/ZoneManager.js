/**
 * ZoneManager.js - Quản lý 4 phân khu Thế Giới Mở Hà Nội (500m x 500m)
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

export const ZONES = {
  ho_guom: {
    id: 'ho_guom',
    name: 'Hồ Gươm & Tháp Rùa Cổ Kính',
    description: 'Mặt nước phẳng lặng in bóng Tháp Rùa rêu phong, Cầu Thê Húc son đỏ rực rỡ và hàng liễu rủ ven hồ.',
    ambientTrack: 'assets/audio/ambient_lake.mp3',
    bounds: { minX: 0, maxX: 250, minZ: -250, maxZ: 0 },
    spawnPoint: { x: 17, y: 0.5, z: -17 },
    themeColor: '#e67e22'
  },
  pho_co: {
    id: 'pho_co',
    name: 'Mê Cung Phố Cổ & Cà Phê Đường Tàu',
    description: 'Dãy nhà ống quét vôi vàng bong tróc, đường ray uốn lượn sát hiên nhà, chằng chịt dây điện phố xưa.',
    ambientTrack: 'assets/audio/ambient_street.mp3',
    bounds: { minX: -250, maxX: 0, minZ: 0, maxZ: 250 },
    spawnPoint: { x: -55, y: 0.5, z: 55 },
    themeColor: '#f39c12'
  },
  long_bien: {
    id: 'long_bien',
    name: 'Nhịp Cầu Long Biên & Bãi Bồi Sông Hồng',
    description: 'Dầm thép Eiffel rỉ sét màu cánh gián vươn dài, gió lồng lộng thổi qua bạt ngàn lau sậy phù sa.',
    ambientTrack: 'assets/audio/ambient_train.mp3',
    bounds: { minX: 0, maxX: 250, minZ: 0, maxZ: 250 },
    spawnPoint: { x: 55, y: 4.2, z: 55 },
    themeColor: '#d35400'
  },
  tap_the: {
    id: 'tap_the',
    name: 'Khu Tập Thể Cũ Hoàng Hôn',
    description: 'Khối nhà 5 tầng Kim Liên rêu phong, những chiếc chuồng cọp cơi nới sắt hoen rỉ và giàn hoa giấy đỏ rực rỡ.',
    ambientTrack: 'assets/audio/ambient_street.mp3',
    bounds: { minX: -250, maxX: 0, minZ: -250, maxZ: 0 },
    spawnPoint: { x: -65, y: 0.5, z: -65 },
    themeColor: '#c0392b'
  }
};

export class ZoneManager {
  constructor(eventBus) {
    this.eventBus = eventBus || window.GameEventBus;
    this.currentZoneId = null;
  }

  /**
   * Xác định phân khu theo tọa độ (x, z)
   * @param {Object} pos - { x, z }
   * @returns {Object} Thông tin zone
   */
  getZoneAt(pos) {
    const x = pos.x;
    const z = pos.z;

    if (x >= 0 && z < 0) {
      return ZONES.ho_guom;
    } else if (x < 0 && z >= 0) {
      return ZONES.pho_co;
    } else if (x >= 0 && z >= 0) {
      return ZONES.long_bien;
    } else {
      return ZONES.tap_the;
    }
  }

  /**
   * Kiểm tra và phát sự kiện khi người chơi chuyển từ khu này sang khu khác
   * @param {Object} currentPos - { x, y, z }
   */
  update(currentPos) {
    if (!currentPos) return;

    const zone = this.getZoneAt(currentPos);
    if (!zone) return;

    if (zone.id !== this.currentZoneId) {
      const prevZoneId = this.currentZoneId;
      this.currentZoneId = zone.id;

      if (this.eventBus) {
        this.eventBus.emit('CORE:ZONE_ENTERED', {
          zoneId: zone.id,
          zoneName: zone.name,
          description: zone.description,
          ambientTrack: zone.ambientTrack
        });
      }
    }
  }

  /**
   * Lấy vị trí hồi sinh / dịch chuyển của một phân khu
   * @param {string} zoneId 
   * @returns {Object} { x, y, z }
   */
  getSpawnPoint(zoneId) {
    const zone = ZONES[zoneId];
    return zone ? { ...zone.spawnPoint } : { x: 50, y: 0.5, z: -50 };
  }

  /**
   * Lấy ID phân khu hiện tại
   */
  getCurrentZoneId() {
    return this.currentZoneId || 'ho_guom';
  }
}
