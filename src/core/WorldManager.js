/**
 * WorldManager.js - Xây dựng Thế Giới Mở 500m x 500m Liền Mạch Thủ Đô Hà Nội Hoài Niệm
 * Đồ họa Kiến trúc Chân Thực, Texture AI Sắc Nét, Hệ Thống Con Người (NPC) & Va Chạm Tuyệt Đối
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { THREE } from './ThreeLib.js';
import { ZONES } from './ZoneManager.js';
import * as BufferGeometryUtils from '../lib/utils/BufferGeometryUtils.js';
import { createHanoiCharacter3D, create3DNonLa, create3DFedoraHat, create3DKhanXep } from './CharacterFactory.js';

export class WorldManager {
  constructor(sceneManager, eventBus) {
    this.sceneManager = sceneManager;
    this.scene = sceneManager.getScene();
    this.eventBus = eventBus || window.GameEventBus;

    this.worldGroup = new THREE.Group();
    this.worldGroup.name = 'HanoiOpenWorld';
    this.scene.add(this.worldGroup);

    // 1. Hệ thống va chạm cứng cáp (Chống xuyên tường, chống xuyên con người 100%)
    this.colliders = [];      // Meshes cho Raycast kiểm tra mặt đất và gờ tường
    this.obstacles = [];      // Danh sách Bounding Boxes AABB { minX, maxX, minZ, maxZ, minY, maxY }
    this.npcColliders = [];   // Danh sách tọa độ và bán kính con người { x, z, radius }

    // 2. Điểm tương tác môi trường & Cửa mở tương tác & Sinh vật sống
    this.interactables = [];
    this.animatedObjects = [];
    this.interactiveDoors = [];
    this.roamingNpcs = [];
    this.citizens = []; // Danh sách toàn bộ NPC người dân Thủ Đô
    this.lakeFish = []; // Đàn cá chép vàng & cá koi bơi lội dưới lòng Hồ Gươm

    // Lắng nghe sự kiện NPC trò chuyện để hiển thị bong bóng thoại 3D trên đầu NPC
    if (this.eventBus) {
      this.eventBus.on('UI:NPC_SPOKE', (payload) => {
        if (!payload || !payload.text) return;
        const playerPos = (window._GameCoreInstance && window._GameCoreInstance.playerController)
          ? window._GameCoreInstance.playerController.getPosition()
          : null;
        if (!playerPos) return;

        let closestNPC = null;
        let minD2 = 64.0; // Trong bán kính 8m
        for (let i = 0; i < this.citizens.length; i++) {
          const npc = this.citizens[i];
          const dx = playerPos.x - npc.position.x;
          const dz = playerPos.z - npc.position.z;
          const d2 = dx * dx + dz * dz;
          if (d2 < minD2) {
            minD2 = d2;
            closestNPC = npc;
          }
        }
        if (closestNPC && typeof closestNPC.showSpeechBubble === 'function') {
          closestNPC.showSpeechBubble(payload.text);
        }
      });
    }

    // 3. Cơ chế biến đổi không gian khi giải đố
    this.secretWallOldQuarter = null;
    this.longBienStairway = null;
    this.collectiveBougainvillea = null;
    this._npcDir = new THREE.Vector3();

    // 4. Khởi tạo Texture Loader và tải toàn bộ Texture AI chất lượng cao
    this.textureLoader = new THREE.TextureLoader();
    this.materials = {};

    this._initMaterials();
    this._buildTerrain();
    this._buildZone1HoanKiem();
    this._buildZone2OldQuarter();
    this._buildZone3LongBien();
    this._buildZone4CollectiveHousing();
    this._buildLivingCityNPCs();
    this._buildBorderAndRoads();
    this._initInteractables();
    this._initSpatialOptimization();
  }

  /**
   * Khởi tạo tối ưu hóa không gian 60 FPS (Zero Matrix Overhead & Pre-computed AABB)
   */
  _initSpatialOptimization() {
    this._cullableObjects = [];
    const wp = new THREE.Vector3();
    const sz = new THREE.Vector3();

    // Cập nhật ma trận toàn cục trước khi khóa matrixAutoUpdate
    this.worldGroup.updateMatrixWorld(true);

    this.worldGroup.traverse((child) => {
      if (child.isMesh) {
        child.matrixAutoUpdate = false;
        child.updateMatrix();

        child.getWorldPosition(wp);

        // Bỏ qua không bao giờ culling:
        // 1. Toàn bộ kết cấu Cầu Long Biên (dầm thép, trụ cầu, lan can, ray tàu, ke ga)
        // 2. Toàn bộ Toa Tàu Di Sản
        // 3. Các mặt phẳng nền tảng cốt lõi và các colliders đi bộ
        // 4. Các công trình dài quá 28m
        let p = child;
        let isImmune = child._neverCull || child._isBaseGround;
        while (p && !isImmune) {
          if (p === this.bridgeGroup || p.name === 'HeritageTrain_LongBien' || p.name === 'LongBienBridgeGroup' || p.name === 'Zone3_LongBien') {
            isImmune = true;
            break;
          }
          p = p.parent;
        }

        const name = (child.name || '').toLowerCase();
        const isCoreGround = isImmune || name.includes('ground') || name.includes('terrain') ||
          name.includes('water') || name.includes('lake') || name.includes('road') ||
          name.includes('promenade') || name.includes('island') || name.includes('courtyard') ||
          name.includes('plinth') || name.includes('floor') || name.includes('bridge') ||
          name.includes('steel') || name.includes('rail') || name.includes('truss') ||
          this.colliders.includes(child);

        if (isCoreGround) {
          child._isBaseGround = true;
          child.visible = true;
          return;
        }

        let maxDim = 6;
        if (child.geometry) {
          if (!child.geometry.boundingBox) {
            child.geometry.computeBoundingBox();
          }
          if (child.geometry.boundingBox) {
            child.geometry.boundingBox.getSize(sz);
            const sx = child.scale ? Math.abs(child.scale.x) : 1;
            const sy = child.scale ? Math.abs(child.scale.y) : 1;
            const szVal = child.scale ? Math.abs(child.scale.z) : 1;
            maxDim = Math.max(sz.x * sx, sz.y * sy, sz.z * szVal);
          }
        }

        // Vật thể dài hơn 28m (như cầu, dầm giàn, đê sông): Giữ hiển thị 100%, không culling theo điểm tâm
        if (maxDim > 28.0) {
          child._isBaseGround = true;
          child.visible = true;
          return;
        }

        // Tier culling (Đồng bộ chuẩn xác với dải sương mù hoàng hôn 65m - 155m):
        // Tier 1: Chi tiết nhỏ / đồ vật vỉa hè / đèn lồng / ghế đá (maxDim < 3.2m): hiện trong 68m (triệt tiêu pop-in trước mắt)
        // Tier 2: Công trình vừa / cây cối / gian hàng phố cổ (3.2m <= maxDim < 12m): hiện trong 125m (trong làn sương mù đậm)
        // Tier 3: Tòa nhà lớn / Khối kiến trúc đồ sộ (maxDim >= 12m): hiện trọn vẹn trong 160m (tầm nhìn camera)
        let cullDistSq = 25600; // 160m * 160m
        if (maxDim < 3.2) {
          cullDistSq = 4624; // 68m * 68m
        } else if (maxDim < 12.0) {
          cullDistSq = 15625; // 125m * 125m
        }

        this._cullableObjects.push({
          mesh: child,
          posX: wp.x,
          posZ: wp.z,
          cullDistSq: cullDistSq
        });
      }
    });

    for (let i = 0; i < this.colliders.length; i++) {
      const col = this.colliders[i];
      if (col.geometry) {
        if (!col.geometry.boundingBox) col.geometry.computeBoundingBox();
        if (col.geometry.boundingBox) {
          col.geometry.boundingBox.getSize(sz);
          if (Math.max(sz.x, sz.z) > 30) {
            col._isBaseGround = true;
          }
        }
      }
    }

    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      obs._centerX = (obs.minX + obs.maxX) * 0.5;
      obs._centerZ = (obs.minZ + obs.maxZ) * 0.5;
      obs._maxRadiusX = (obs.maxX - obs.minX) * 0.5 + 16;
      obs._maxRadiusZ = (obs.maxZ - obs.minZ) * 0.5 + 16;
    }
  }

  /**
   * Helper đăng ký khối vật cản kiến trúc (AABB Obstacle)
   */
  _addBoxObstacle(x, z, width, depth, minY = 0, maxY = 30) {
    this.obstacles.push({
      minX: x - width / 2,
      maxX: x + width / 2,
      minZ: z - depth / 2,
      maxZ: z + depth / 2,
      minY: minY,
      maxY: maxY,
      _centerX: x,
      _centerZ: z,
      _maxRadiusX: width * 0.5 + 16,
      _maxRadiusZ: depth * 0.5 + 16
    });
  }

  /**
   * Helper đăng ký vị trí va chạm hình thể con người (NPC)
   */
  _addNpcCollider(x, z, radius = 0.6) {
    this.npcColliders.push({ x, z, radius });
  }

  /**
   * Tính bình phương khoảng cách từ điểm (px, pz) tới đoạn thẳng (x1, z1)-(x2, z2)
   */
  _pointToSegmentDistSq(px, pz, x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const lenSq = dx * dx + dz * dz;
    if (lenSq === 0) return (px - x1) * (px - x1) + (pz - z1) * (pz - z1);
    let t = ((px - x1) * dx + (pz - z1) * dz) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projZ = z1 + t * dz;
    const diffX = px - projX;
    const diffZ = pz - projZ;
    return diffX * diffX + diffZ * diffZ;
  }

  /**
   * KIỂM TRA RANH GIỚI MẶT NƯỚC (CẤM TUYỆT ĐỐI KHÔNG CHẠM NƯỚC)
   * Trả về true nếu tọa độ nằm trong vùng nước không an toàn (ngoài đảo và cầu).
   */
  /**
   * KIỂM TRA CHUẨN XÁC TỌA ĐỘ VÀ ĐỘ CAO TRÊN CẦU THÊ HÚC
   * Trả về khoảng cách tới tim cầu, độ cao mặt cầu chuẩn, và cờ onBridge
   */
    /**
   * Tính toán độ cao sàn và trạng thái đi lại trên Cầu Long Biên & Ga Long Biên
   * Khắc phục triệt để 100% lỗi đi lọt tỏm xuống dưới cầu
   */
  getLongBienBridgeInfo(x, y, z) {
    // Phạm vi trục Z của Cầu Long Biên, ke ga và dốc dẫn: [53.5, 72.0]
    if (z < 53.5 || z > 72.0) return null;

    // 1. Dốc dẫn / Đường bộ hành lên Cầu Long Biên (X: -32.0 -> 20.0, Z: 54.5 -> 67.5)
    // Đường dẫn đá thoai thoải 50m nối từ Phố Cổ lên Ke Ga Long Biên (Y: 0.5 -> 10.85m)
    if (x >= -32.0 && x <= 20.0 && z >= 54.5 && z <= 67.5) {
      const t = Math.max(0, Math.min(1, (x - (-30.0)) / 50.0));
      const rampY = 0.5 + t * (10.85 - 0.5);

      // QUAN TRỌNG: Chỉ nhận diện là đang trên dốc dẫn nếu người chơi:
      // a) Đang ở gần mặt sàn dốc (độ lệch cao độ <= 1.8m)
      // b) HOẶC đang bước vào từ chân dốc ở Phố Cổ (x <= -28.0 và y <= 1.6m)
      // Triệt tiêu 100% lỗi người đi dưới chân dốc bị teleport/đi xuyên lên cao
      const nearRampFloor = Math.abs(y - rampY) <= 1.8;
      const atRampEntrance = x <= -28.0 && y <= 1.6;
      if (nearRampFloor || atRampEntrance) {
        return { onBridge: true, closestY: rampY };
      }
      return null;
    }

    // 2. Ke Ga Long Biên (X: 20.0 -> 70.0, Z: 62.5 -> 71.5)
    // Chỉ kích hoạt khi nhân vật ở trên cao độ sàn ga (y >= 8.5)
    if (x >= 20.0 && x <= 70.0 && z >= 62.5 && z <= 71.5) {
      if (y >= 8.5) {
        return { onBridge: true, closestY: 10.85 };
      }
      return null;
    }

    // 3. Sàn dầm Cầu Long Biên & 2 Làn bộ hành hai bên (X: 19.0 -> 271.0, Z: 54.0 -> 66.0)
    // Chỉ kích hoạt khi nhân vật ở trên cao độ dầm cầu (y >= 8.5)
    if (x >= 19.0 && x <= 271.0 && z >= 54.0 && z <= 66.0) {
      if (y >= 8.5) {
        // Giữa 2 ray (Z: 59.2 -> 60.8): ván gỗ bảo trì cao 10.77
        if (Math.abs(z - 60.0) <= 0.8) {
          return { onBridge: true, closestY: 10.77 };
        }
        // Hai bên làn bộ hành cánh gà (Z: 55.0 -> 59.2 và 60.8 -> 65.0): cao 10.62
        return { onBridge: true, closestY: 10.62 };
      }
      return null;
    }

    // 4. Mố cầu bờ Đông / Ga Gia Lâm (X: 235.0 -> 275.0, Z: 62.5 -> 70.0)
    if (x >= 235.0 && x <= 275.0 && z >= 62.5 && z <= 70.0) {
      if (y >= 8.5) {
        return { onBridge: true, closestY: 10.85 };
      }
      return null;
    }

    return null;
  }

getTheHucBridgeInfo(x, y, z) {
    const pts = [
      { x: 168.0, y: 0.38, z: -32.0 }, // Đường dạo vỉa hè tiếp cận
      { x: 164.0, y: 0.45, z: -36.0 }, // Quảng trường đá bờ Đông
      { x: 158.0, y: 0.65, z: -42.0 }, // Dốc nối lên đầu vòm cầu
      { x: 151.0, y: 1.42, z: -47.0 }, // Vòm lên 1
      { x: 146.0, y: 2.18, z: -52.0 }, // Đỉnh vòm cong cao nhất
      { x: 140.0, y: 1.42, z: -58.0 }, // Vòm xuống 2
      { x: 134.0, y: 0.75, z: -64.0 }, // Hạ dốc đầu đảo
      { x: 128.0, y: 0.80, z: -69.0 }  // Cập bến sân Đền Ngọc Sơn
    ];
    let minDistSq = Infinity;
    let closestX = x, closestZ = z, closestY = y;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const lenSq = dx * dx + dz * dz;
      let t = ((x - p1.x) * dx + (z - p1.z) * dz) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const projX = p1.x + t * dx;
      const projZ = p1.z + t * dz;
      const projY = p1.y + t * (p2.y - p1.y);
      const dSq = (x - projX) * (x - projX) + (z - projZ) * (z - projZ);
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestX = projX;
        closestZ = projZ;
        closestY = projY;
      }
    }
    const dist = Math.sqrt(minDistSq);
    const onBridge = (dist <= 2.4 && y >= closestY - 2.5 && y <= closestY + 3.5);
    return {
      dist,
      closestX,
      closestZ,
      closestY,
      onBridge
    };
  }

  /**
   * KIỂM TRA CHUẨN XÁC TỌA ĐỘ VÀ ĐỘ CAO TRÊN CẦU KIM QUY (CẦU DẪN RA THÁP RÙA)
   * Trả về khoảng cách tới tim cầu, độ cao mặt cầu chuẩn, và cờ onBridge
   */
  getKimQuyBridgeInfo(x, y, z) {
    const pts = [
      { x: 16.5, y: 0.38, z: -16.5 }, // Bờ hồ dạo bộ
      { x: 17.0, y: 0.45, z: -17.0 }, // Cổng Nghinh Phong Môn
      { x: 28.0, y: 0.88, z: -28.0 }, // Nhịp 1 vòm lên
      { x: 39.0, y: 1.35, z: -39.0 }, // Nhịp 2 dốc lên
      { x: 50.0, y: 1.60, z: -50.0 }, // Đỉnh vòm cong cao nhất Cầu Kim Quy
      { x: 60.0, y: 1.25, z: -60.0 }, // Nhịp 3 dốc xuống
      { x: 68.0, y: 0.85, z: -68.0 }, // Tiếp giáp Đảo Tháp Rùa
      { x: 72.0, y: 0.85, z: -72.0 }  // Sân thềm đá Tháp Rùa
    ];
    let minDistSq = Infinity;
    let closestX = x, closestZ = z, closestY = y;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const lenSq = dx * dx + dz * dz;
      let t = ((x - p1.x) * dx + (z - p1.z) * dz) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const projX = p1.x + t * dx;
      const projZ = p1.z + t * dz;
      const projY = p1.y + t * (p2.y - p1.y);
      const dSq = (x - projX) * (x - projX) + (z - projZ) * (z - projZ);
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestX = projX;
        closestZ = projZ;
        closestY = projY;
      }
    }
    const dist = Math.sqrt(minDistSq);
    const onBridge = (dist <= 2.4 && y >= closestY - 2.5 && y <= closestY + 3.5);
    return {
      dist,
      closestX,
      closestZ,
      closestY,
      onBridge
    };
  }

  isWaterAt(x, y, z) {
    // 1. Vùng Hồ Gươm (Tâm x = 80, z = -80, bán kính lòng hồ R = 84.8m)
    const dx = x - 80;
    const dz = z - (-80);
    const distSq = dx * dx + dz * dz;
    const lakeRadius = 84.8;

    if (distSq < lakeRadius * lakeRadius) {
      // Đang trong phạm vi mặt nước Hồ Gươm!
      // Kiểm tra xem có đang ở trên các khu vực an toàn (Đảo Rùa, Đảo Ngọc Sơn, Cầu Thê Húc, Cầu Kim Quy) không:

      // a. Đảo Rùa tự nhiên: bán kính 19.5m quanh (80, -80)
      if (distSq <= 19.5 * 19.5 && y >= 0.35) {
        return false; // An toàn trên Đảo Rùa
      }

      // b. Đảo Ngọc Sơn: bán kính 20.5m quanh (122, -73)
      const dNgocX = x - 122;
      const dNgocZ = z - (-73);
      if (dNgocX * dNgocX + dNgocZ * dNgocZ <= 20.5 * 20.5 && y >= 0.35) {
        return false; // An toàn trên Đảo Ngọc Sơn
      }

      // c. Cầu Thê Húc son đỏ: Hành lang an toàn nối dọc toàn bộ vòm cong Cầu Thê Húc đến Đền Ngọc Sơn
      const theHucInfo = this.getTheHucBridgeInfo(x, y, z);
      if (theHucInfo.dist <= 3.8 && y >= 0.18) {
        return false; // An toàn tuyệt đối trên Cầu Thê Húc!
      }

      // d. Cầu Kim Quy đá cổ dẫn tới Tháp Rùa: từ bờ (16, -16) đến Đảo Rùa (72, -72), bán kính an toàn 3.2m
      const dKimQuy = this._pointToSegmentDistSq(x, z, 16, -16, 72, -72);
      if (dKimQuy <= 3.2 * 3.2 && y >= 0.15) {
        return false; // An toàn tuyệt đối trên Cầu Kim Quy và lối dẫn
      }

      // Không nằm trên cầu hay đảo -> ĐÂY LÀ MẶT NƯỚC HỒ GƯƠM! CẤM BƯỚC XUỐNG!
      return true;
    }

    // 2. Vùng Sông Hồng (Phân khu 3: x từ 0 đến 250, z từ 90 đến 245)
    if (z > 95 && z < 245 && x > 0 && x < 250) {
      // Trên dầm Cầu Long Biên (z trong khoảng [56, 64] và y >= 3.6)
      if (Math.abs(z - 60) <= 4.2 && y >= 3.6) return false;
      // Trên bãi bồi phù sa sông Hồng (x từ 40 đến 200, z từ 100 đến 150, y >= 0.22)
      if (z <= 150 && x >= 40 && x <= 200 && y >= 0.22) return false;
      return true; // Rơi xuống lòng sông Hồng
    }

    return false;
  }

  /**
   * KIỂM TRA TỌA ĐỘ NẰM TRONG LÒNG NƯỚC MỞ CỦA HỒ GƯƠM
   * Trả về true NẾU VÀ CHỈ NẾU tọa độ nằm an toàn trong lòng nước sâu của Hồ Gươm,
   * cách xa tất cả bờ kè, đảo Tháp Rùa, Đảo Ngọc Sơn, Cầu Kim Quy và Cầu Thê Húc.
   * Dùng riêng để đảm bảo cá tuyệt đối KHÔNG BAO GIỜ xuất hiện trên mặt đường, đảo hay cầu.
   */
  isPointInOpenLakeWater(x, z) {
    const dx = x - 80;
    const dz = z - (-80);
    const distLakeSq = dx * dx + dz * dz;

    // Phải nằm bên trong lòng hồ (cách kè đá bờ hồ ít nhất 6.0m: R <= 78.8m)
    if (distLakeSq >= 78.8 * 78.8) return false;

    // Phải cách xa mép Đảo Tháp Rùa ít nhất 3.5m (bán kính đảo 18.5m -> cấm trong R <= 22.0m)
    if (distLakeSq <= 22.0 * 22.0) return false;

    // Phải cách xa Đảo Ngọc Sơn ít nhất 4.0m (tâm 128, -68, cấm trong R <= 29.0m)
    const dNgocX = x - 128;
    const dNgocZ = z - (-68);
    if (dNgocX * dNgocX + dNgocZ * dNgocZ <= 29.0 * 29.0) return false;

    // Phải cách xa hành lang Cầu Kim Quy ít nhất 6.0m (đoạn (16, -16) đến (72, -72))
    if (this._pointToSegmentDistSq(x, z, 16, -16, 72, -72) <= 6.0 * 6.0) return false;

    // Phải cách xa hành lang Cầu Thê Húc ít nhất 6.0m (đoạn (160, -40) đến (130, -66))
    if (this._pointToSegmentDistSq(x, z, 160, -40, 130, -66) <= 6.0 * 6.0) return false;

    return true;
  }

  /**
   * Bộ đệm texture fallback siêu nhẹ chia sẻ toàn cục (tránh cấp phát 26 canvas 512x512 gây giật lag)
   */
  _getSharedFallbackTexture() {
    if (!WorldManager._sharedFallbackTex) {
      const canvas = document.createElement('canvas');
      canvas.width = 4;
      canvas.height = 4;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#c49a65'; // Vàng ấm đặc trưng Hà Nội
      ctx.fillRect(0, 0, 4, 4);
      WorldManager._sharedFallbackTex = new THREE.CanvasTexture(canvas);
      WorldManager._sharedFallbackTex.wrapS = THREE.RepeatWrapping;
      WorldManager._sharedFallbackTex.wrapT = THREE.RepeatWrapping;
    }
    return WorldManager._sharedFallbackTex;
  }

  /**
   * Tạo texture canvas fallback nhẹ nhàng
   */
  _createCanvasFallback(drawFn, width = 64, height = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (typeof drawFn === 'function') {
      drawFn(ctx, width, height);
    } else {
      ctx.fillStyle = '#c49a65';
      ctx.fillRect(0, 0, width, height);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Tải Texture AI với fallback an toàn & nạp ảnh tức thì chống chớp nháy màn hình đen
   */
  _loadTextureWithFallback(url, fallbackFn, repeatX = 1, repeatY = 1) {
    const texture = this.textureLoader.load(
      url,
      (loaded) => {
        loaded.wrapS = THREE.RepeatWrapping;
        loaded.wrapT = THREE.RepeatWrapping;
        loaded.repeat.set(repeatX, repeatY);
        loaded.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn(`[Texture fallback]: Lỗi nạp texture ${url}`);
      }
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);

    // Gán ảnh placeholder tức thì để WebGL không render màu đen khi ảnh đang tải
    // Giữ nguyên tải ảnh trực tiếp, không đè canvas màu vàng đất

    return texture;
  }

  /**
   * Khởi tạo hệ thống vật liệu PBR đặc trưng phố phường Hà Nội
   */
  _initMaterials() {
    // 1. Tường vôi vàng Hà Nội cổ kính nứt nẻ, tróc sơn rêu đen (Texture AI 1.32MB)
    const wallTex = this._loadTextureWithFallback(
      'assets/textures/old_wall_yellow.jpg',
      (ctx, w, h) => {
        ctx.fillStyle = '#d9b265';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(160, 110, 40, 0.35)';
        for (let i = 0; i < 60; i++) {
          ctx.beginPath();
          ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 50 + 10, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(45, 60, 35, 0.5)';
        for (let i = 0; i < 40; i++) {
          ctx.fillRect(Math.random() * w, h - Math.random() * 120, Math.random() * 40 + 15, 120);
        }
      },
      3, 3
    );

    this.materials.yellowWall = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.85,
      metalness: 0.05
    });

    // 2. Mái ngói âm dương / ngói mũi hài rêu phong Hà Nội xưa
    const roofTex = this._loadTextureWithFallback(
      'assets/textures/roof_terracotta.jpg',
      (ctx, w, h) => {
        ctx.fillStyle = '#8a4025';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#4a1e10';
        ctx.lineWidth = 6;
        for (let y = 0; y < h; y += 24) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(35, 55, 25, 0.45)';
        ctx.fillRect(0, 0, w, h * 0.35);
      },
      4, 4
    );

    this.materials.roofTile = new THREE.MeshStandardMaterial({
      map: roofTex,
      roughness: 0.85,
      metalness: 0.05
    });

    // 3. Đá phủ rêu phong Tháp Rùa và Đền Ngọc Sơn (Texture AI 1.36MB)
    const mossStoneTex = this._loadTextureWithFallback(
      'assets/textures/turtle_tower_moss.jpg',
      (ctx, w, h) => {
        ctx.fillStyle = '#6e7368';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#405235';
        for (let i = 0; i < 150; i++) {
          ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 25 + 5, Math.random() * 25 + 5);
        }
      },
      2, 2
    );

    this.materials.mossStone = new THREE.MeshStandardMaterial({
      map: mossStoneTex,
      roughness: 0.95,
      metalness: 0.05
    });

    // 4. Gạch đá vỉa hè & gạch hoa lát hè phố cổ Hà Nội (Texture AI 1.35MB)
    const groundBrickTex = this._loadTextureWithFallback(
      'assets/textures/hanoi_brick_ground.jpg',
      (ctx, w, h) => {
        ctx.fillStyle = '#7a7f76';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#4a4f46';
        ctx.lineWidth = 3;
        for (let x = 0; x < w; x += 40) {
          for (let y = 0; y < h; y += 40) {
            ctx.strokeRect(x, y, 40, 40);
          }
        }
      }, 140, 140
    );

    this.materials.hanoiPavement = new THREE.MeshStandardMaterial({
      map: groundBrickTex,
      roughness: 0.82,
      metalness: 0.08
    });

    // 5. Thép dầm Eiffel Cầu Long Biên rỉ sét màu cánh gián (Texture AI 1.34MB)
    const rustySteelTex = this._loadTextureWithFallback(
      'assets/textures/rusty_iron_beam.jpg',
      (ctx, w, h) => {
        ctx.fillStyle = '#5c3520';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#8a4822';
        for (let i = 0; i < 90; i++) {
          ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 35 + 10, Math.random() * 12 + 4);
        }
      },
      2, 6
    );

    this.materials.rustySteel = new THREE.MeshStandardMaterial({
      map: rustySteelTex,
      roughness: 0.72,
      metalness: 0.45
    });

    // 6. Áp phích và biển hiệu phố cổ Hà Nội xưa (Texture AI 1.27MB & Shop Signs 553KB)
    const vintagePostersTex = this._loadTextureWithFallback(
      'assets/textures/hanoi_shop_signs.jpg',
      (ctx, w, h) => {
        ctx.fillStyle = '#eed6a8';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#b22222';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('HÀ NỘI 1986', 40, 80);
      },
      1, 1
    );

    this.materials.vintagePosters = new THREE.MeshStandardMaterial({
      map: vintagePostersTex,
      roughness: 0.6
    });

    // 7. Cửa chớp gỗ xanh Pháp cổ Hà Nội (Texture AI 311KB)
    const greenShutterTex = this._loadTextureWithFallback(
      'assets/textures/hanoi_green_shutter.jpg',
      (ctx, w, h) => {
        ctx.fillStyle = '#245446';
        ctx.fillRect(0, 0, w, h);
      },
      1, 1
    );

    this.materials.frenchGreenShutter = new THREE.MeshStandardMaterial({
      map: greenShutterTex,
      roughness: 0.65,
      metalness: 0.1
    });

    // 8. Hoa sắt lan can ban công Art Deco Pháp cổ (Texture AI PNG trong suốt 84KB)
    const balconyIronTex = this._loadTextureWithFallback(
      'assets/textures/french_balcony_iron.png',
      (ctx, w, h) => {
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, w, h);
      },
      2, 1
    );

    this.materials.frenchBalconyIron = new THREE.MeshStandardMaterial({
      map: balconyIronTex,
      transparent: true,
      alphaTest: 0.25,
      roughness: 0.5,
      metalness: 0.75,
      side: THREE.DoubleSide
    });

    // 9. Cầu Thê Húc đỏ son rực rỡ
    this.materials.theHucRed = new THREE.MeshStandardMaterial({
      color: 0xbf2c28,
      roughness: 0.45,
      metalness: 0.12
    });

    // 10. Mặt nước Hồ Gươm xanh lục thủy phẳng lặng, tự nhiên (Serene Mirror Lake)
    this.materials.lakeWater = new THREE.MeshStandardMaterial({
      color: 0x165a52, // Xanh lục thủy truyền thống Hồ Gươm thanh bình, tĩnh lặng
      roughness: 0.16,
      metalness: 0.12,
      transparent: true,
      opacity: 0.84,
      depthWrite: true
    });

    // 11. Phù sa đỏ Sông Hồng
    this.materials.redRiver = new THREE.MeshStandardMaterial({
      color: 0x8a4026,
      roughness: 0.35,
      metalness: 0.35,
      transparent: true,
      opacity: 0.92
    });

    // 12. Giàn hoa giấy đỏ hồng rực rỡ buông rủ (Texture AI PNG trong suốt 1.33MB)
    const bougainvilleaTex = this._loadTextureWithFallback(
      'assets/textures/bougainvillea_blossom.png',
      (ctx, w, h) => {
        ctx.fillStyle = '#df2952';
        ctx.fillRect(0, 0, w, h);
      },
      1, 1
    );

    this.materials.bougainvilleaRed = new THREE.MeshStandardMaterial({
      map: bougainvilleaTex,
      transparent: true,
      alphaTest: 0.2,
      roughness: 0.55,
      side: THREE.DoubleSide
    });

    // 12. Gỗ nâu cà phê cóc
    this.materials.retroWood = new THREE.MeshStandardMaterial({
      color: 0x5a3923,
      roughness: 0.72
    });

    // 13. Sắt đen chuồng cọp & dây điện
    this.materials.darkIron = new THREE.MeshStandardMaterial({
      color: 0x1e1e1e,
      roughness: 0.6,
      metalness: 0.75
    });

    // 14. Đá dốc dẫn cầu Long Biên & Thê Húc (Texture AI 504KB)
    const rampStoneTex = this._loadTextureWithFallback(
      'assets/textures/bridge_ramp_stone.jpg',
      (ctx, w, h) => {
        ctx.fillStyle = '#686a63';
        ctx.fillRect(0, 0, w, h);
      },
      4, 4
    );
    this.materials.rampStone = new THREE.MeshStandardMaterial({
      map: rampStoneTex,
      roughness: 0.88,
      metalness: 0.05
    });

    // 15. Gỗ bóng quầy bar & đôn mộc (Texture AI 140KB)
    const woodVarnishTex = this._loadTextureWithFallback(
      'assets/textures/wood_counter_varnish.jpg',
      (ctx, w, h) => {
        ctx.fillStyle = '#4a2616';
        ctx.fillRect(0, 0, w, h);
      },
      2, 2
    );
    this.materials.woodVarnish = new THREE.MeshStandardMaterial({
      map: woodVarnishTex,
      roughness: 0.45,
      metalness: 0.1
    });

    // 16. Thảm dệt Đông Dương thổ cẩm Indochine (Texture AI 453KB)
    const indochineRugTex = this._loadTextureWithFallback(
      'assets/textures/indochine_rug.jpg',
      (ctx, w, h) => {
        ctx.fillStyle = '#7a2818';
        ctx.fillRect(0, 0, w, h);
      },
      1, 1
    );
    this.materials.indochineRug = new THREE.MeshStandardMaterial({
      map: indochineRugTex,
      roughness: 0.85
    });

    // 17. Phích Rạng Đông cúc vạn thọ (Texture AI 53KB)
    const thermosTex = this._loadTextureWithFallback(
      'assets/textures/rang_dong_thermos.jpg',
      (ctx, w, h) => {
        ctx.fillStyle = '#1c728e';
        ctx.fillRect(0, 0, w, h);
      },
      1, 1
    );
    this.materials.rangDongThermos = new THREE.MeshStandardMaterial({
      map: thermosTex,
      roughness: 0.35,
      metalness: 0.3
    });

    // 18. Gốm men Bát Tràng cắm sen Tây Hồ (Texture AI 64KB)
    const ceramicTex = this._loadTextureWithFallback(
      'assets/textures/bat_trang_ceramic.jpg',
      (ctx, w, h) => {
        ctx.fillStyle = '#2f574d';
        ctx.fillRect(0, 0, w, h);
      },
      1, 1
    );
    this.materials.batTrangCeramic = new THREE.MeshStandardMaterial({
      map: ceramicTex,
      roughness: 0.25,
      metalness: 0.15
    });

    // 19. Tranh cổ động thời Bao Cấp (Texture AI 300KB)
    const sovietPosterTex = this._loadTextureWithFallback(
      'assets/textures/soviet_poster.jpg',
      (ctx, w, h) => {
        ctx.fillStyle = '#b52b27';
        ctx.fillRect(0, 0, w, h);
      },
      1, 1
    );
    this.materials.sovietPoster = new THREE.MeshStandardMaterial({
      map: sovietPosterTex,
      roughness: 0.65
    });

    // 20. Vàng thếp son cổ truyền (Đền Ngọc Sơn & Hoành phi câu đối)
    this.materials.templeGold = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.22
    });

    // 21. Đồng đúc cổ kính (Đỉnh đồng, Hạc ngự long quy, Cụ Rùa)
    this.materials.bronze = new THREE.MeshStandardMaterial({
      color: 0x8c6d48,
      metalness: 0.78,
      roughness: 0.35
    });

    // 22. Vôi vàng rêu phong Tháp Rùa theo bản vẽ Blueprint chi tiết của Sếp Tổng
    const thapRuaWallTex = this.textureLoader.load('assets/textures/thap_rua_bp_t1_front.png');
    thapRuaWallTex.wrapS = THREE.ClampToEdgeWrapping;
    thapRuaWallTex.wrapT = THREE.ClampToEdgeWrapping;
    this.materials.thapRuaWall = new THREE.MeshStandardMaterial({
      map: thapRuaWallTex,
      roughness: 0.85,
      metalness: 0.05
    });

    const thapRuaT1SideTex = this.textureLoader.load('assets/textures/thap_rua_bp_t1_side.png');
    this.materials.thapRuaT1Side = new THREE.MeshStandardMaterial({
      map: thapRuaT1SideTex,
      roughness: 0.85,
      metalness: 0.05
    });

    // 23. Bệ móng đá khối cổ Tháp Rùa (Ashlar Plinth) từ bản vẽ Blueprint
    const thapRuaPlinthTex = this.textureLoader.load('assets/textures/thap_rua_bp_ashlar.png');
    thapRuaPlinthTex.wrapS = THREE.RepeatWrapping;
    thapRuaPlinthTex.wrapT = THREE.RepeatWrapping;
    thapRuaPlinthTex.repeat.set(4, 2);
    this.materials.thapRuaPlinth = new THREE.MeshStandardMaterial({
      map: thapRuaPlinthTex,
      roughness: 0.90,
      metalness: 0.05
    });

    // 24. Mái ngói cong cổ Tháp Rùa rêu phong từ bản vẽ Blueprint
    const thapRuaRoofTopTex = this.textureLoader.load('assets/textures/thap_rua_bp_roof_tiles.png');
    thapRuaRoofTopTex.wrapS = THREE.RepeatWrapping;
    thapRuaRoofTopTex.wrapT = THREE.RepeatWrapping;
    thapRuaRoofTopTex.repeat.set(6, 6);
    this.materials.thapRuaRoof = new THREE.MeshStandardMaterial({
      map: thapRuaRoofTopTex,
      roughness: 0.78,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const thapRuaRoofMidTex = this.textureLoader.load('assets/textures/thap_rua_bp_roof_tiles.png');
    thapRuaRoofMidTex.wrapS = THREE.RepeatWrapping;
    thapRuaRoofMidTex.wrapT = THREE.RepeatWrapping;
    thapRuaRoofMidTex.repeat.set(8, 8);
    this.materials.thapRuaRoofMid = new THREE.MeshStandardMaterial({
      map: thapRuaRoofMidTex,
      roughness: 0.78,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // 25. Phù điêu hoa văn khắc nổi và Vòm Tầng 2 & Tầng 3 từ Blueprint
    const thapRuaT2Tex = this.textureLoader.load('assets/textures/thap_rua_bp_t2_front.png');
    this.materials.thapRuaFacadeT2 = new THREE.MeshStandardMaterial({
      map: thapRuaT2Tex,
      roughness: 0.82,
      metalness: 0.05
    });

    const thapRuaT2SideTex = this.textureLoader.load('assets/textures/thap_rua_bp_t2_side.png');
    this.materials.thapRuaT2Side = new THREE.MeshStandardMaterial({
      map: thapRuaT2SideTex,
      roughness: 0.82,
      metalness: 0.05
    });

    const thapRuaT3Tex = this.textureLoader.load('assets/textures/thap_rua_bp_t3_front.png');
    this.materials.thapRuaFacadeT3 = new THREE.MeshStandardMaterial({
      map: thapRuaT3Tex,
      roughness: 0.82,
      metalness: 0.05
    });

    const thapRuaT3SideTex = this.textureLoader.load('assets/textures/thap_rua_bp_t3_front.png');
    this.materials.thapRuaFacadeT3Side = new THREE.MeshStandardMaterial({
      map: thapRuaT3SideTex,
      roughness: 0.82,
      metalness: 0.05
    });

    // 26. Lan can đá ô chữ nhật từ Blueprint
    const thapRuaBalustradeTex = this.textureLoader.load('assets/textures/thap_rua_bp_balustrade.png');
    this.materials.thapRuaBalustrade = new THREE.MeshStandardMaterial({
      map: thapRuaBalustradeTex,
      transparent: true,
      alphaTest: 0.15,
      roughness: 0.88,
      side: THREE.DoubleSide
    });

    // 27. Biểu tượng Đĩa đá tròn đỉnh tháp (Summit Sun/Longevity Emblem) từ Blueprint
    const thapRuaEmblemTex = this.textureLoader.load('assets/textures/thap_rua_bp_longevity.png');
    this.materials.thapRuaEmblem = new THREE.MeshStandardMaterial({
      map: thapRuaEmblemTex,
      roughness: 0.75,
      metalness: 0.10
    });

    // 27b. Vật liệu Nội thất Blueprint: Gạch nung Bát Tràng, vôi bóc để lộ gạch đỏ, và bàn thờ cổ
    const bpBrickTex = this.textureLoader.load('assets/textures/thap_rua_bp_brick.png');
    bpBrickTex.wrapS = THREE.RepeatWrapping;
    bpBrickTex.wrapT = THREE.RepeatWrapping;
    bpBrickTex.repeat.set(6, 3);
    this.materials.thapRuaBpBrick = new THREE.MeshStandardMaterial({
      map: bpBrickTex,
      roughness: 0.85,
      metalness: 0.04
    });

    const bpMossTex = this.textureLoader.load('assets/textures/thap_rua_bp_moss.png');
    bpMossTex.wrapS = THREE.RepeatWrapping;
    bpMossTex.wrapT = THREE.RepeatWrapping;
    bpMossTex.repeat.set(3, 3);
    this.materials.thapRuaBpMoss = new THREE.MeshStandardMaterial({
      map: bpMossTex,
      roughness: 0.90,
      metalness: 0.02
    });

    const bpFloorTex = this.textureLoader.load('assets/textures/thap_rua_bp_floor_tile.png');
    bpFloorTex.wrapS = THREE.RepeatWrapping;
    bpFloorTex.wrapT = THREE.RepeatWrapping;
    bpFloorTex.repeat.set(10, 8);
    this.materials.thapRuaBpFloor = new THREE.MeshStandardMaterial({
      map: bpFloorTex,
      roughness: 0.85,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1.0,
      polygonOffsetUnits: -1.0
    });

    const bpAltarTex = this.textureLoader.load('assets/textures/thap_rua_bp_interior_altar.png');
    this.materials.thapRuaBpAltar = new THREE.MeshStandardMaterial({
      map: bpAltarTex,
      roughness: 0.80,
      metalness: 0.08
    });

    // 28. Toàn cảnh 3D Master Tháp Rùa (Alpha Cutouts hai góc nhìn hoàn chỉnh)
    const thapRuaMasterLeftTex = this.textureLoader.load('assets/textures/thap_rua_master_left.png');
    this.materials.thapRuaMasterLeft = new THREE.MeshStandardMaterial({
      map: thapRuaMasterLeftTex,
      transparent: true,
      alphaTest: 0.1,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const thapRuaMasterRightTex = this.textureLoader.load('assets/textures/thap_rua_master_right.png');
    this.materials.thapRuaMasterRight = new THREE.MeshStandardMaterial({
      map: thapRuaMasterRightTex,
      transparent: true,
      alphaTest: 0.1,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // 29. Khối Thượng Tháp Rùa (Mái ngói, Lầu Vọng Nguyệt & Đĩa nguyệt cắt chuẩn từ ảnh Master)
    const thapRuaUpperLeftTex = this.textureLoader.load('assets/textures/thap_rua_upper_left.png');
    this.materials.thapRuaUpperLeft = new THREE.MeshStandardMaterial({
      map: thapRuaUpperLeftTex,
      transparent: true,
      alphaTest: 0.12,
      roughness: 0.82,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    const thapRuaUpperRightTex = this.textureLoader.load('assets/textures/thap_rua_upper_right.png');
    this.materials.thapRuaUpperRight = new THREE.MeshStandardMaterial({
      map: thapRuaUpperRightTex,
      transparent: true,
      alphaTest: 0.12,
      roughness: 0.82,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // 30. Vật liệu Kiến trúc Ga Long Biên & Toa Tàu Hơi Nước Di Sản 1902
    this.materials.stationWall = new THREE.MeshStandardMaterial({ color: 0xe3b85b, roughness: 0.88, metalness: 0.05 });
    this.materials.stationPlaster = new THREE.MeshStandardMaterial({ color: 0xf2ddaa, roughness: 0.9, metalness: 0.02 });
    this.materials.stationRoof = new THREE.MeshStandardMaterial({ color: 0x8d3923, roughness: 0.85, metalness: 0.05 });
    this.materials.stationDoor = new THREE.MeshStandardMaterial({ color: 0x2c5138, roughness: 0.65, metalness: 0.1 });
    this.materials.stationWood = new THREE.MeshStandardMaterial({ color: 0x5c381e, roughness: 0.8, metalness: 0.05 });
    this.materials.coachExt = new THREE.MeshStandardMaterial({ color: 0x6e2617, roughness: 0.45, metalness: 0.25 });
    this.materials.coachIntWall = new THREE.MeshStandardMaterial({ color: 0xb5824c, roughness: 0.7, metalness: 0.05 });
    this.materials.coachFloor = new THREE.MeshStandardMaterial({ color: 0x3d2415, roughness: 0.5, metalness: 0.1 });
    this.materials.velvetSeat = new THREE.MeshStandardMaterial({ color: 0x821f24, roughness: 0.9, metalness: 0.0 });
    this.materials.brass = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.88 });
    this.materials.panoramicGlass = new THREE.MeshStandardMaterial({
      color: 0xe8f4f8,
      transparent: true,
      opacity: 0.28,
      roughness: 0.05,
      metalness: 0.1
    });
    this.materials.skylightGlass = new THREE.MeshStandardMaterial({
      color: 0xdaf0ff,
      transparent: true,
      opacity: 0.32,
      roughness: 0.06,
      metalness: 0.1
    });

    // Tranh Nghệ Thuật Ký Ức Ga Long Biên 1902 (Canva AI Generated Artwork)
    const canvaArtTex = this.textureLoader.load('assets/textures/canva_ga_long_bien_art.png');
    this.materials.canvaArt = new THREE.MeshStandardMaterial({
      map: canvaArtTex,
      roughness: 0.72,
      metalness: 0.08
    });

    // Tuyệt Tác Toàn Cảnh Cầu Long Biên (Canva AI Masterpiece Artwork 1680x944)
    const canvaMasterpieceTex = this.textureLoader.load('assets/textures/canva_cau_long_bien_masterpiece.png');
    this.materials.canvaMasterpiece = new THREE.MeshStandardMaterial({
      map: canvaMasterpieceTex,
      roughness: 0.70,
      metalness: 0.10
    });
  }

  /**
   * Xây dựng mặt bằng địa hình 500m x 500m với mạng lưới đường phố chân thực
   */
  _buildTerrain() {
    // 1. Nền vỉa hè lát đá xanh phố cổ
    const groundGeo = new THREE.PlaneGeometry(500, 500, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);

    const groundMesh = new THREE.Mesh(groundGeo, this.materials.hanoiPavement);
    groundMesh.receiveShadow = true;
    groundMesh.position.y = 0;
    this.worldGroup.add(groundMesh);
    this.colliders.push(groundMesh);

    // 2. LÒNG ĐƯỜNG NHỰA ĐEN THẬT CÓ VẠCH KẺ SƠN TRẮNG
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1e2024,
      roughness: 0.88,
      metalness: 0.1
    });
    const whiteStripeMat = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 });

    // Đại lộ Đông - Tây (Trục Z = 0, rộng 14m)
    const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(500, 14), asphaltMat);
    roadEW.rotation.x = -Math.PI / 2;
    roadEW.position.set(0, 0.02, 0);
    this.worldGroup.add(roadEW);

    // Vạch kẻ tim đường nét đứt
    for (let x = -240; x <= 240; x += 16) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.35), whiteStripeMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x, 0.025, 0);
      this.worldGroup.add(line);
    }

    // Phố Nam - Bắc (Trục X = 0, rộng 12m)
    const roadNS = new THREE.Mesh(new THREE.PlaneGeometry(12, 500), asphaltMat);
    roadNS.rotation.x = -Math.PI / 2;
    roadNS.position.set(0, 0.022, 0);
    this.worldGroup.add(roadNS);

    // Vạch kẻ sang đường cho người đi bộ (Zebra Crossing) tại ngã tư trung tâm
    for (let i = -5; i <= 5; i += 1.4) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 0.65), whiteStripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(i, 0.028, 9);
      this.worldGroup.add(stripe);
    }
  }

  /**
   * Tạo cánh cửa gỗ mở vào trong/ra ngoài tương tác mượt mà
   */
  _createOpenableDoor(x, z, width = 2.6, height = 2.8, title = 'Cửa Tiệm', color = 0x3d271d) {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(x, 0, z);
    this.worldGroup.add(doorGroup);

    const woodMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.65 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xc49a45, metalness: 0.8, roughness: 0.3 });

    // Cánh trái (Hinged at left)
    const leftPivot = new THREE.Group();
    leftPivot.position.set(-width / 2, 0, 0);
    const leftLeaf = new THREE.Mesh(new THREE.BoxGeometry(width / 2, height, 0.08), woodMat);
    leftLeaf.position.set(width / 4, height / 2, 0);
    leftLeaf.castShadow = true;
    leftPivot.add(leftLeaf);

    // Tay nắm đồng cánh trái
    const leftHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8), brassMat);
    leftHandle.position.set(width / 2 - 0.08, height * 0.48, 0.06);
    leftPivot.add(leftHandle);
    doorGroup.add(leftPivot);

    // Cánh phải (Hinged at right)
    const rightPivot = new THREE.Group();
    rightPivot.position.set(width / 2, 0, 0);
    const rightLeaf = new THREE.Mesh(new THREE.BoxGeometry(width / 2, height, 0.08), woodMat);
    rightLeaf.position.set(-width / 4, height / 2, 0);
    rightLeaf.castShadow = true;
    rightPivot.add(rightLeaf);

    // Tay nắm đồng cánh phải
    const rightHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8), brassMat);
    rightHandle.position.set(-width / 2 + 0.08, height * 0.48, 0.06);
    rightPivot.add(rightHandle);
    doorGroup.add(rightPivot);

    // Khung bao trên
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, 0.15, 0.18), woodMat);
    frameTop.position.set(0, height + 0.075, 0);
    doorGroup.add(frameTop);

    const doorObj = {
      group: doorGroup,
      leftPivot: leftPivot,
      rightPivot: rightPivot,
      isOpen: false,
      currentAngle: 0,
      targetAngle: 0,
      toggle: () => {
        doorObj.isOpen = !doorObj.isOpen;
        doorObj.targetAngle = doorObj.isOpen ? 1.45 : 0;
        if (this.eventBus) {
          this.eventBus.emit('CORE:ZONE_ENTERED', {
            zoneId: 'pho_co',
            zoneName: doorObj.isOpen ? `Mở Cửa: ${title}` : `Đóng Cửa: ${title}`,
            description: doorObj.isOpen ? 'Bước chân vào không gian nội thất Hà Nội xưa ấm áp.' : 'Cánh cửa gỗ khép lại.'
          });
        }
      },
      update: (delta) => {
        doorObj.currentAngle = THREE.MathUtils.lerp(doorObj.currentAngle, doorObj.targetAngle, 0.18);
        leftPivot.rotation.y = -doorObj.currentAngle;
        rightPivot.rotation.y = doorObj.currentAngle;
      }
    };

    this.interactiveDoors.push(doorObj);

    // Đăng ký tương tác phím E
    this.interactables.push({
      position: new THREE.Vector3(x, 1.0, z),
      radius: 2.8,
      promptText: `Mở cửa bước vào ${title}`,
      actionKey: 'E',
      onInteract: () => {
        doorObj.toggle();
      }
    });

    return doorGroup;
  }

  /**
   * Tạo Mái Nhà Phố Cổ & Phố Đường Tàu Hà Nội Nghệ Thuật (Canva AI Vintage Architecture)
   * - Mái dốc 2 chái ngói âm dương / ngói mũi hài rêu phong, bờ nóc đắp vữa gắn gốm nổi
   * - Đầu hồi bít đốc vôi vàng cổ kính
   * - Ban công gỗ kiểu Pháp tầng 2 với cửa chớp xanh rêu và lan can hoa sắt hướng ra đường tàu
   * - Mái hiên gập lượn sóng kẻ sọc cổ điển che mưa nắng và đèn lồng đỏ hoài niệm
   */
  _createTraditionalHanoiRoof(w, d, h, facing = -1) {
    const roofGroup = new THREE.Group();

    // 1. MÁI DỐC 2 CHÁI NGÓI ÂM DƯƠNG RÊU PHONG (Traditional Terracotta Double-pitch Gable Roof)
    const pitchH = 1.85;
    const overhang = 0.55;
    const roofW = w + overhang * 2;
    const halfD = (d * 0.5) + overhang;
    const slopeLen = Math.hypot(halfD, pitchH);
    const slopeAngle = Math.atan2(pitchH, halfD);

    // Mái dốc mặt trước
    const frontSlope = new THREE.Mesh(
      new THREE.BoxGeometry(roofW, 0.12, slopeLen),
      this.materials.roofTile
    );
    frontSlope.position.set(0, h + pitchH * 0.5, -halfD * 0.5);
    frontSlope.rotation.x = -slopeAngle;
    frontSlope.castShadow = true;
    roofGroup.add(frontSlope);

    // Mái dốc mặt sau
    const backSlope = new THREE.Mesh(
      new THREE.BoxGeometry(roofW, 0.12, slopeLen),
      this.materials.roofTile
    );
    backSlope.position.set(0, h + pitchH * 0.5, halfD * 0.5);
    backSlope.rotation.x = slopeAngle;
    backSlope.castShadow = true;
    roofGroup.add(backSlope);

    // Bờ nóc đắp vữa & kìm nóc uốn lượn (Decorative Ridge Beam)
    const ridgeBeam = new THREE.Mesh(
      new THREE.BoxGeometry(roofW + 0.3, 0.22, 0.35),
      this.materials.roofTile
    );
    ridgeBeam.position.set(0, h + pitchH + 0.11, 0);
    roofGroup.add(ridgeBeam);

    // Đầu hồi bít đốc vôi vàng (Gable walls)
    for (let side of [-1, 1]) {
      const gableShape = new THREE.Shape();
      gableShape.moveTo(-d * 0.5, 0);
      gableShape.lineTo(0, pitchH);
      gableShape.lineTo(d * 0.5, 0);
      gableShape.closePath();
      const gableGeo = new THREE.ShapeGeometry(gableShape);
      gableGeo.rotateY(side === -1 ? -Math.PI / 2 : Math.PI / 2);
      const gableMesh = new THREE.Mesh(gableGeo, this.materials.yellowWall);
      gableMesh.position.set(side * (w * 0.5), h, 0);
      roofGroup.add(gableMesh);
    }

    // 2. BAN CÔNG GỖ PHÁP CỔ HƯỚNG RA PHỐ ĐƯỜNG TÀU (French Louvered Balcony)
    const balW = Math.min(w * 0.65, 5.8);
    const balD = 1.35;
    const balH = 0.95;
    const fZ = facing >= 0 ? 1 : -1;

    // Sàn ban công
    const balFloor = new THREE.Mesh(
      new THREE.BoxGeometry(balW, 0.14, balD),
      this.materials.retroWood
    );
    balFloor.position.set(0, h * 0.72, fZ * (d * 0.5 + balD * 0.5));
    roofGroup.add(balFloor);

    // Lan can sắt hoa văn ban công
    const railMat = new THREE.MeshStandardMaterial({ color: 0x1c2b22, roughness: 0.5, metalness: 0.5 });
    const balFrontRail = new THREE.Mesh(new THREE.BoxGeometry(balW, balH, 0.05), railMat);
    balFrontRail.position.set(0, h * 0.72 + balH * 0.5, fZ * (d * 0.5 + balD));
    roofGroup.add(balFrontRail);

    for (let side of [-1, 1]) {
      const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.05, balH, balD), railMat);
      sideRail.position.set(side * (balW * 0.5), h * 0.72 + balH * 0.5, fZ * (d * 0.5 + balD * 0.5));
      roofGroup.add(sideRail);
    }

    // Cửa chớp xanh rêu kiểu Pháp mở ra ban công
    const shutterMat = new THREE.MeshStandardMaterial({ color: 0x244a35, roughness: 0.7 });
    const shutterL = new THREE.Mesh(new THREE.BoxGeometry(0.60, 1.55, 0.06), shutterMat);
    shutterL.position.set(-0.70, h * 0.72 + 0.85, fZ * (d * 0.5 + 0.03));
    roofGroup.add(shutterL);
    const shutterR = new THREE.Mesh(new THREE.BoxGeometry(0.60, 1.55, 0.06), shutterMat);
    shutterR.position.set(0.70, h * 0.72 + 0.85, fZ * (d * 0.5 + 0.03));
    roofGroup.add(shutterR);

    // Mái hiên gập lượn sóng kẻ sọc cổ điển (Vintage Striped Awning)
    // Đặt ở cao độ chuẩn Y = 3.05m ngay trên cửa đi, che nắng mưa cho lối vào
    const awningMat = new THREE.MeshStandardMaterial({ color: 0xa8322d, roughness: 0.8 });
    const awning = new THREE.Mesh(new THREE.BoxGeometry(balW + 0.6, 0.05, 1.4), awningMat);
    awning.position.set(0, 3.05, fZ * (d * 0.5 + 0.7));
    awning.rotation.x = fZ * (-0.18);
    roofGroup.add(awning);

    // Đèn lồng đỏ treo góc ban công
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0xd62828, emissive: 0x550a0a });
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.10, 0.28, 8), lanternMat);
    lantern.position.set(-balW * 0.5 + 0.2, h * 0.72 + 0.7, fZ * (d * 0.5 + balD - 0.2));
    roofGroup.add(lantern);

    return roofGroup;
  }

  /**
   * Tạo CanvasTexture vẽ biển hiệu sơn son thếp vàng di sản Hà Nội (Độ phân giải 1024x256 sắc nét)
   * Hiển thị rõ ràng: Tên hiệu lớn và Mô tả ngành nghề/mặt hàng kinh doanh cụ thể
   */
  _createShopSignboardTexture(title, subtitle, bgCol = '#7d1912', textCol = '#fce49f', borderCol = '#d4af37') {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // An toàn tuyệt đối trong môi trường test Node.js mock canvas
    if (typeof ctx.fillRect !== 'function') return null;

    // 1. Nền sơn then / sơn son hào hoa truyền thống
    ctx.fillStyle = bgCol;
    ctx.fillRect(0, 0, 1024, 256);

    // Hiệu ứng ánh sáng gradient bề mặt gỗ bóng
    if (typeof ctx.createLinearGradient === 'function') {
      const grad = ctx.createLinearGradient(0, 0, 1024, 256);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 256);
    }

    // 2. Khung viền đôi hoa văn kim nhũ phong cách phố cổ Hà Nội
    if (typeof ctx.strokeRect === 'function') {
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 8;
      ctx.strokeRect(14, 14, 1024 - 28, 256 - 28);

      ctx.strokeStyle = 'rgba(255, 235, 170, 0.65)';
      ctx.lineWidth = 3;
      ctx.strokeRect(26, 26, 1024 - 52, 256 - 52);
    }

    // Đinh tán đồng / họa tiết 4 góc
    if (typeof ctx.beginPath === 'function' && typeof ctx.arc === 'function') {
      const corners = [
        [36, 36], [1024 - 36, 36],
        [36, 256 - 36], [1024 - 36, 256 - 36]
      ];
      ctx.fillStyle = borderCol;
      corners.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 3. Tên cửa hiệu chính và mặt hàng kinh doanh
    if (typeof ctx.fillText === 'function') {
      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = borderCol;
      ctx.fillText('★ ❖ ★', 512, 48);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = textCol;
      ctx.font = 'bold 52px "Times New Roman", "Georgia", "Be Vietnam Pro", serif';
      ctx.fillText(title, 512, 106);

      // Đường gạch chỉ ngăn cách hoa văn
      ctx.shadowColor = 'transparent';
      if (typeof ctx.beginPath === 'function' && typeof ctx.stroke === 'function') {
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(180, 148);
        ctx.lineTo(844, 148);
        ctx.stroke();
      }

      // 4. Ngành nghề kinh doanh / Mặt hàng bày bán (Ghi rõ bán cái gì)
      ctx.fillStyle = '#fff9e6';
      ctx.font = 'bold 28px "Arial", "Segoe UI", "Be Vietnam Pro", sans-serif';
      ctx.fillText(subtitle, 512, 192);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  /**
   * Tạo mô hình 3D biển hiệu hoàn chỉnh gồm khung viền gỗ và mặt biển hai chiều
   */
  _createSignboard3D(w, h, title, subtitle, bgCol, textCol, borderCol) {
    const group = new THREE.Group();
    group.name = `Signboard_${title}`;

    // Khung viền gỗ dày 12cm
    const frameMat = this.materials.woodVarnish || this.materials.retroWood;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), frameMat);
    frame.castShadow = true;
    group.add(frame);

    // Xích sắt / tai móc treo biển cổ điển hai góc trên
    const ironMat = this.materials.darkIron || new THREE.MeshStandardMaterial({ color: 0x1f2428, metalness: 0.85, roughness: 0.35 });
    for (let s of [-1, 1]) {
      const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.38, 8), ironMat);
      hook.position.set(s * (w * 0.42), h * 0.5 + 0.19, 0);
      group.add(hook);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 8, 12), ironMat);
      ring.position.set(s * (w * 0.42), h * 0.5 + 0.38, 0);
      group.add(ring);
    }

    // Mặt biển vẽ tay có chữ (CanvasTexture)
    const tex = this._createShopSignboardTexture(title, subtitle, bgCol, textCol, borderCol);
    if (tex) {
      const signMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.35,
        metalness: 0.10
      });
      // Mặt trước hướng về -Z (mặt tiền nhìn từ ngoài đường vào)
      const frontPlate = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, h * 0.90), signMat);
      frontPlate.position.set(0, 0, -0.065);
      frontPlate.rotation.y = Math.PI; // quay mặt ra ngoài trục -Z
      group.add(frontPlate);

      // Mặt sau hướng về +Z
      const backPlate = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.96, h * 0.90), signMat);
      backPlate.position.set(0, 0, 0.065);
      group.add(backPlate);
    }
    return group;
  }

  _getShopSignMeta(shopType, defaultSign) {
    switch (shopType) {
      case 'thuoc_bac':
        return {
          title: 'HIỆU THUỐC BẮC GIA TRUYỀN',
          subtitle: 'Bốc Thuốc Bắc • Nam Dược Thần Hiệu • Sâm Nhung Cát Cánh',
          bgCol: '#6b1812',
          textCol: '#fbe296',
          borderCol: '#d4af37'
        };
      case 'may_do':
        return {
          title: 'MAY ĐO ÂU PHỤC PHỐ CỔ',
          subtitle: 'Âu Phục Cổ Điển • Áo Dài Di Sản • Tơ Lụa Hà Đông Cao Cấp',
          bgCol: '#172740',
          textCol: '#fae8c8',
          borderCol: '#c8a846'
        };
      case 'pho_gia_truyen':
        return {
          title: 'PHỞ GIA TRUYỀN 1954',
          subtitle: 'Phở Bò Tái Nạm Gầu • Bánh Cuốn Nóng • Quẩy Giòn Hà Nội',
          bgCol: '#851a14',
          textCol: '#fff0a8',
          borderCol: '#ffd700'
        };
      case 'bia_hoi':
        return {
          title: 'BIA HƠI HÀ NỘI CỔ',
          subtitle: 'Bia Hơi Bát Bảo • Lạc Luộc Nem Chua • Đậu Phụ Rán Mắm Tôm',
          bgCol: '#163d24',
          textCol: '#fcf0be',
          borderCol: '#58a06e'
        };
      case 'sua_dong_ho':
        return {
          title: 'SỬA ĐỒNG HỒ LIÊN XÔ',
          subtitle: 'Poljot • Vostok • Slava • Thay Pin Lau Dầu Lấy Ngay',
          bgCol: '#152433',
          textCol: '#e8c974',
          borderCol: '#cca242'
        };
      case 'cat_toc':
        return {
          title: 'CẮT TÓC BÌNH DÂN',
          subtitle: 'Cắt Tóc Nam Nữ • Cạo Mặt Ráy Tai • Gội Đầu Dưỡng Sinh',
          bgCol: '#781c16',
          textCol: '#fff5c0',
          borderCol: '#d4af37'
        };
      default:
        return {
          title: defaultSign || 'TIỆM CỔ TRUYỀN HÀ NỘI',
          subtitle: 'Kính Chào Quý Khách • Nét Đẹp Ngàn Năm Văn Hiến',
          bgCol: '#6b1d16',
          textCol: '#fce59f',
          borderCol: '#d4af37'
        };
    }
  }

  /**
   * Tạo ngôi nhà ống phố cổ mở được cửa đi vào bên trong với đầy đủ nội thất ngành nghề truyền thống:
   * 1. Hiệu Thuốc Bắc Gia Truyền
   * 2. Tiệm May Đo Âu Phục Phố Cổ
   * 3. Quán Phở Gia Truyền 1954
   * 4. Quán Bia Hơi Hà Nội Cổ
   * 5. Tiệm Sửa Đồng Hồ Liên Xô
   * 6. Tiệm Cắt Tóc Bình Dân Phố Cổ
   */
  _createEnterableShop(x, z, w, d, h, shopType, signText) {
    const shopGroup = new THREE.Group();
    shopGroup.position.set(x, 0, z);

    const wallThick = 0.35;
    const doorW = 3.2; // Cửa rộng 3.2m thênh thang
    const doorH = 3.0; // Cao 3.0m
    const frontSideW = (w - doorW - wallThick * 2) / 2;

    // Hướng mặt tiền: Dãy phía Nam đường tàu (z < 60) hướng ra +Z (phía đường ray);
    // Dãy phía Bắc đường tàu (z > 60) hướng ra -Z (phía đường ray).
    const facesPositiveZ = (z < 60);
    const facingSign = facesPositiveZ ? 1 : -1;
    const frontZ = facingSign * (d / 2);
    const frontWallZ = facingSign * (d / 2 - wallThick / 2);
    const backWallZ = -facingSign * (d / 2 - wallThick / 2);

    // 1. TƯỜNG BAO VÔI VÀNG CỔ KÍNH
    // Tường trái
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, d), this.materials.yellowWall);
    leftWall.position.set(-w / 2 + wallThick / 2, h / 2, 0);
    leftWall.castShadow = true;
    shopGroup.add(leftWall);
    this._addBoxObstacle(x - w / 2 + wallThick / 2, z, wallThick + 0.05, d, 0, h + 2);

    // Tường phải
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, d), this.materials.yellowWall);
    rightWall.position.set(w / 2 - wallThick / 2, h / 2, 0);
    rightWall.castShadow = true;
    shopGroup.add(rightWall);
    this._addBoxObstacle(x + w / 2 - wallThick / 2, z, wallThick + 0.05, d, 0, h + 2);

    // Tường sau (bức tường đặc kiên cố quay lưng lại đường phố)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(w - wallThick * 2, h, wallThick), this.materials.yellowWall);
    backWall.position.set(0, h / 2, backWallZ);
    backWall.castShadow = true;
    shopGroup.add(backWall);
    this._addBoxObstacle(x, z + backWallZ, w - wallThick * 2, wallThick + 0.05, 0, h + 2);

    // Tường trước (hai cánh gà hai bên, chừa lối cửa 3.2m ở giữa mặt tiền đón khách)
    const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(frontSideW, h, wallThick), this.materials.yellowWall);
    frontLeft.position.set(-doorW / 2 - frontSideW / 2, h / 2, frontWallZ);
    frontLeft.castShadow = true;
    shopGroup.add(frontLeft);
    this._addBoxObstacle(x - doorW / 2 - frontSideW / 2, z + frontWallZ, frontSideW + 0.05, wallThick + 0.05, 0, h + 2);

    const frontRight = new THREE.Mesh(new THREE.BoxGeometry(frontSideW, h, wallThick), this.materials.yellowWall);
    frontRight.position.set(doorW / 2 + frontSideW / 2, h / 2, frontWallZ);
    frontRight.castShadow = true;
    shopGroup.add(frontRight);
    this._addBoxObstacle(x + doorW / 2 + frontSideW / 2, z + frontWallZ, frontSideW + 0.05, wallThick + 0.05, 0, h + 2);

    // Lanh-tô trên cửa
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorW, h - doorH, wallThick), this.materials.yellowWall);
    lintel.position.set(0, doorH + (h - doorH) / 2, frontWallZ);
    shopGroup.add(lintel);

    // MÁI NHÀ TRUYỀN THỐNG HÀ NỘI KẾT HỢP CANVA AI VINTAGE:
    const traditionalRoof = this._createTraditionalHanoiRoof(w, d, h, facingSign);
    shopGroup.add(traditionalRoof);

    // Cánh cửa gỗ mở tương tác phím E ngay trước lối vào mặt tiền
    this._createOpenableDoor(x, z + frontZ, 2.8, 2.9, signText, 0x3d271d);

    // Sàn gạch bông bên trong
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w - wallThick * 2, d - wallThick * 2), this.materials.hanoiPavement);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0.04, 0);
    floor.receiveShadow = true;
    shopGroup.add(floor);
    this.colliders.push(floor);

    // Biển hiệu di sản phố cổ sơn son thiếp vàng:
    // Đặt ở mặt tiền ngay TRƯỚC CỬA, nâng cao lên Y = 4.05m trên lanh-tô cửa và trên mái hiên để người đi đường ngước nhìn thấy rõ
    const signMeta = this._getShopSignMeta(shopType, signText);
    const signBoard = this._createSignboard3D(
      w * 0.68, 1.05,
      signMeta.title, signMeta.subtitle,
      signMeta.bgCol, signMeta.textCol, signMeta.borderCol
    );
    signBoard.position.set(0, 4.05, frontZ + facingSign * 0.16);
    shopGroup.add(signBoard);

    // 2. NỘI THẤT NGHỆ THUẬT TỪNG NGÀNH NGHỀ
    this._populateShopInterior(shopGroup, x, z, w, d, shopType, facingSign);

    return shopGroup;
  }

  _populateShopInterior(shopGroup, x, z, w, d, shopType, facingSign = -1) {
    const woodMat = this.materials.woodVarnish || this.materials.retroWood;
    const backSign = facingSign >= 0 ? -1 : 1; // Hướng bức tường sau ngược với mặt tiền đón khách

    if (shopType === 'thuoc_bac') {
      // Tủ thuốc bắc 100 ngăn gỗ mun cao 2.5m dọc tường sau
      const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x24160e, roughness: 0.7 });
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(w - 2.4, 2.6, 0.8), cabinetMat);
      cabinet.position.set(0, 1.3, backSign * (d / 2 - 0.7));
      cabinet.castShadow = true;
      shopGroup.add(cabinet);
      this._addBoxObstacle(x, z + backSign * (d / 2 - 0.7), w - 2.0, 0.9, 0, 2.8);

      // Bàn quầy bốc thuốc và cân tiểu ly
      const desk = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.05, 1.1), woodMat);
      desk.position.set(0, 0.525, backSign * 0.8);
      desk.castShadow = true;
      shopGroup.add(desk);
      this._addBoxObstacle(x, z + backSign * 0.8, 3.8, 1.2, 0, 1.2);

      // Thúng thuốc bắc phơi khô bên trái
      const basketMat = new THREE.MeshStandardMaterial({ color: 0x8f734b, roughness: 0.9 });
      for (let i = 0; i < 3; i++) {
        const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.30, 0.25, 12), basketMat);
        basket.position.set(-w / 2 + 1.2, 0.15, backSign * (-1.5 + i * 1.2));
        shopGroup.add(basket);
      }
    } else if (shopType === 'may_do') {
      // Bàn may Singer chân gang cổ điển bên trái
      const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.2), woodMat);
      desk.position.set(-w / 2 + 1.8, 0.45, 0);
      desk.castShadow = true;
      shopGroup.add(desk);
      this._addBoxObstacle(x - w / 2 + 1.8, z, 2.6, 1.4, 0, 1.2);

      // Đầu máy may Singer sơn đen
      const singerHead = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.25), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7 }));
      singerHead.position.set(-w / 2 + 1.8, 1.05, 0);
      shopGroup.add(singerHead);

      // Manocanh gỗ mặc áo dài bên phải
      const mannequinMat = new THREE.MeshStandardMaterial({ color: 0xb33939, roughness: 0.7 });
      const mannequin = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.5, 10), mannequinMat);
      mannequin.position.set(w / 2 - 1.8, 0.85, 0);
      shopGroup.add(mannequin);
      this._addBoxObstacle(x + w / 2 - 1.8, z, 1.2, 1.2, 0, 1.8);

      // Kệ súc vải gấm tơ tằm dọc tường sau
      const fabricRack = new THREE.Mesh(new THREE.BoxGeometry(w - 3.0, 2.2, 0.7), woodMat);
      fabricRack.position.set(0, 1.1, backSign * (d / 2 - 0.6));
      shopGroup.add(fabricRack);
      this._addBoxObstacle(x, z + backSign * (d / 2 - 0.6), w - 2.6, 0.8, 0, 2.4);
    } else if (shopType === 'pho_gia_truyen') {
      // Quầy nấu phở và nồi gang ninh xương bốc khói dọc tường sau
      const phoCounter = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.1, 1.2), woodMat);
      phoCounter.position.set(0, 0.55, backSign * (d / 2 - 1.0));
      phoCounter.castShadow = true;
      shopGroup.add(phoCounter);
      this._addBoxObstacle(x, z + backSign * (d / 2 - 1.0), 4.8, 1.3, 0, 1.3);

      // Nồi gang ninh xương to
      const potMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.38, 0.65, 16), potMat);
      pot.position.set(-1.0, 1.45, backSign * (d / 2 - 1.0));
      shopGroup.add(pot);

      // 2 bộ bàn ăn gỗ mộc thấp bên trái và bên phải
      for (let s of [-1, 1]) {
        const table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 1.0), woodMat);
        table.position.set(s * (w / 2 - 2.2), 0.375, backSign * 0.5);
        shopGroup.add(table);
        this._addBoxObstacle(x + s * (w / 2 - 2.2), z + backSign * 0.5, 2.0, 1.2, 0, 0.9);
      }
    } else if (shopType === 'bia_hoi') {
      // Quầy rót bia hơi và 2 bom bia nhôm vòi đồng dọc tường sau
      const bar = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.05, 1.2), woodMat);
      bar.position.set(0, 0.525, backSign * (d / 2 - 1.0));
      shopGroup.add(bar);
      this._addBoxObstacle(x, z + backSign * (d / 2 - 1.0), 4.5, 1.3, 0, 1.3);

      // 2 Bom bia hơi Hà Nội bằng nhôm
      const kegMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
      for (let k of [-0.8, 0.8]) {
        const keg = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.75, 14), kegMat);
        keg.position.set(k, 1.45, backSign * (d / 2 - 1.0));
        shopGroup.add(keg);
      }

      // Kệ xếp cốc thủy tinh bọt xanh
      const glassRack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 2.2), woodMat);
      glassRack.position.set(-w / 2 + 1.0, 0.9, 0);
      shopGroup.add(glassRack);
      this._addBoxObstacle(x - w / 2 + 1.0, z, 0.8, 2.4, 0, 2.0);

      // Bàn gỗ dài uống bia
      const beerTable = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 2.8), woodMat);
      beerTable.position.set(w / 2 - 2.2, 0.375, 0);
      shopGroup.add(beerTable);
      this._addBoxObstacle(x + w / 2 - 2.2, z, 1.6, 3.0, 0, 0.9);
    } else if (shopType === 'sua_dong_ho') {
      // Bàn kỹ thuật sửa đồng hồ với đèn bàn kính lúp
      const bench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.95, 1.2), woodMat);
      bench.position.set(-w / 2 + 2.0, 0.475, backSign * 0.5);
      shopGroup.add(bench);
      this._addBoxObstacle(x - w / 2 + 2.0, z + backSign * 0.5, 2.8, 1.4, 0, 1.2);

      // Tủ kính trưng bày đồng hồ Poljot Liên Xô dọc tường sau
      const showcaseMat = new THREE.MeshStandardMaterial({ color: 0x1f2428, metalness: 0.6 });
      const showcase = new THREE.Mesh(new THREE.BoxGeometry(w - 3.2, 1.8, 0.7), showcaseMat);
      showcase.position.set(0, 0.9, backSign * (d / 2 - 0.6));
      shopGroup.add(showcase);
      this._addBoxObstacle(x, z + backSign * (d / 2 - 0.6), w - 2.8, 0.8, 0, 2.0);
    } else if (shopType === 'cat_toc') {
      // Ghế xoay cắt tóc da simili đỏ ở giữa phòng
      const chairMat = new THREE.MeshStandardMaterial({ color: 0x9e2424, roughness: 0.5 });
      const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.12, 16), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 }));
      chairBase.position.set(0, 0.06, 0);
      const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.15, 0.6), chairMat);
      chairSeat.position.set(0, 0.55, 0);
      const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.12), chairMat);
      chairBack.position.set(0, 0.95, backSign * 0.25);
      shopGroup.add(chairBase, chairSeat, chairBack);
      this._addBoxObstacle(x, z, 1.2, 1.2, 0, 1.4);

      // Gương soi lớn gắn tường sau
      const mirrorMat = new THREE.MeshStandardMaterial({ color: 0xd8e8f0, roughness: 0.1, metalness: 0.9 });
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.08), mirrorMat);
      mirror.position.set(0, 1.6, backSign * (d / 2 - 0.2));
      shopGroup.add(mirror);
      shopGroup.add(mirror);

      // Bàn để đồ cắt tóc (kéo, dao cạo, bình xịt)
      const barberDesk = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.85, 0.6), woodMat);
      barberDesk.position.set(0, 0.425, d / 2 - 0.55);
      shopGroup.add(barberDesk);
      this._addBoxObstacle(x, z + d / 2 - 0.55, 3.2, 0.8, 0, 1.0);
    }
  }

  /**
   * Phân khu 1: HỒ GƯƠM & THÁP RÙA CHUẨN LỊCH SỬ (Tọa độ x: [0, 250], z: [-250, 0])
   * Tái hiện chính xác Tháp Rùa 3 tầng vòm Gothic Đông Dương, Cầu Thê Húc 15 nhịp đỏ son, Đắc Nguyệt Lâu, Tháp Bút Tả Thanh Thiên & Đài Nghiên
   */
  _buildZone1HoanKiem() {
    const zoneGroup = new THREE.Group();
    zoneGroup.name = 'Zone1_HoanKiem';
    this.zone1Group = zoneGroup;

    // 1. Lòng Hồ Gươm (Mặt nước xanh lục thủy phẳng lặng tự nhiên dưới kè đá rêu phong)
    const waterGeo = new THREE.CircleGeometry(84.8, 64);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMesh = new THREE.Mesh(waterGeo, this.materials.lakeWater);
    waterMesh.position.set(80, 0.08, -80);
    zoneGroup.add(waterMesh);
    this.lakeWaterMesh = waterMesh;
    this.lakeShimmerMesh = null;

    // KÈ ĐÁ BỜ HỒ (STONE EMBANKMENT RETAINING WALL) TẠI R = 85.0M
    const lakeWallGeo = new THREE.CylinderGeometry(85.0, 85.0, 0.45, 64, 1, true);
    const lakeWall = new THREE.Mesh(lakeWallGeo, this.materials.mossStone);
    lakeWall.position.set(80, 0.225, -80);
    zoneGroup.add(lakeWall);

    // ĐƯỜNG DẠO BỘ VEN HỒ LÁT ĐÁ XANH CỔ ĐIỂN (PROMENADE) RỘNG 13M (r: 85.0m -> 98.0m, y = 0.38)
    const promenadeGeo = new THREE.RingGeometry(85.0, 98.0, 64);
    promenadeGeo.rotateX(-Math.PI / 2);
    const promenadeMesh = new THREE.Mesh(promenadeGeo, this.materials.mossStone);
    promenadeMesh.position.set(80, 0.38, -80);
    promenadeMesh.receiveShadow = true;
    zoneGroup.add(promenadeMesh);
    this.colliders.push(promenadeMesh); // ĐĂNG KÝ ĐỂ NGƯỜI CHƠI BƯỚC ĐI TỰ NHIÊN TRÊN ĐƯỜNG ĐÁ VEN HỒ!

    // GỜ VỈA HÈ PHÂN CÁCH ĐƯỜNG BỘ VÀ LÒNG ĐƯỜNG XE CHẠY TẠI R = 98.0M
    const curbGeo = new THREE.CylinderGeometry(98.0, 98.0, 0.35, 64, 1, true);
    const curbMesh = new THREE.Mesh(curbGeo, this.materials.mossStone);
    curbMesh.position.set(80, 0.22, -80);
    zoneGroup.add(curbMesh);

    // LÒNG ĐƯỜNG NHỰA XE CHẠY PHỐ ĐINH TIÊN HOÀNG - LÊ THÁI TỔ RỘNG 16M (r: 98.0m -> 114.0m, y = 0.10)
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x24282c, roughness: 0.9 });
    const roadGeo = new THREE.RingGeometry(98.0, 114.0, 64);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
    roadMesh.position.set(80, 0.10, -80);
    roadMesh.receiveShadow = true;
    zoneGroup.add(roadMesh);
    this.colliders.push(roadMesh);

    // Vạch kẻ đường sơn trắng phân làn xe chạy
    for (let i = 0; i < 48; i += 2) {
      const a1 = (i / 48) * Math.PI * 2;
      const stripeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 2.8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
      stripeMesh.position.set(80 + Math.cos(a1) * 106, 0.11, -80 + Math.sin(a1) * 106);
      stripeMesh.rotation.y = -a1 + Math.PI / 2;
      zoneGroup.add(stripeMesh);
    }

    // HÀNG CÂY LIỄU RỦ NGHIÊNG BÓNG MẶT HỒ & GHẾ ĐÁ NGHỈ CHÂN VEN HỒ GƯƠM
    for (let i = 0; i < 16; i++) {
      const treeAngle = (i / 16) * Math.PI * 2;
      // Tránh lối lên Cầu Thê Húc (0.38 - 0.88 rad) VÀ Cầu Kim Quy (2.05 - 2.65 rad)
      if ((treeAngle > 0.38 && treeAngle < 0.88) || (treeAngle > 2.05 && treeAngle < 2.65)) continue;
      const tx = 80 + Math.cos(treeAngle) * 91.5;
      const tz = -80 + Math.sin(treeAngle) * 91.5;

      const willow = this._createWeepingWillow(i);
      willow.position.set(tx, 0.38, tz);
      willow.rotation.y = -treeAngle + Math.PI; // Tán cành nghiêng bóng xuống mặt nước
      zoneGroup.add(willow);
      this._addBoxObstacle(tx, tz, 1.0, 1.0, 0.38, 5.0);

      // Ghế đá công viên ven hồ xen kẽ
      if (i % 2 === 0) {
        const bx = 80 + Math.cos(treeAngle + 0.14) * 88.5;
        const bz = -80 + Math.sin(treeAngle + 0.14) * 88.5;
        const bench = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.6), this.materials.mossStone);
        bench.position.set(bx, 0.60, bz);
        bench.rotation.y = -treeAngle;
        zoneGroup.add(bench);
        this._addBoxObstacle(bx, bz, 2.0, 0.8, 0.38, 1.2);
      }
    }

    // 2. LAN CAN ĐÁ HOA SEN CỔ KÍNH UỐN QUANH BỜ HỒ (HỆ THỐNG RÀO CHẮN MỸ THUẬT VEN BỜ)
    const balusterMat = this.materials.mossStone;
    const postCount = 64;
    for (let i = 0; i < postCount; i++) {
      const angle = (i / postCount) * Math.PI * 2;
      // Chừa lối dẫn lên Cầu Thê Húc (0.38 - 0.88 rad) VÀ Cầu Kim Quy dẫn ra Tháp Rùa (2.10 - 2.62 rad)
      const isTheHucOpening = angle > 0.28 && angle < 0.98;
      const isKimQuyOpening = angle > 2.10 && angle < 2.62;
      const isBridgeOpening = isTheHucOpening || isKimQuyOpening;

      const px = 80 + Math.cos(angle) * 85;
      const pz = -80 + Math.sin(angle) * 85;

      if (!isBridgeOpening) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.95, 8), balusterMat);
        post.position.set(px, 0.475, pz);
        zoneGroup.add(post);

        const lotusBud = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), balusterMat);
        lotusBud.scale.set(0.8, 1.25, 0.8);
        lotusBud.position.set(px, 1.05, pz);
        zoneGroup.add(lotusBud);

        this._addBoxObstacle(px, pz, 1.1, 1.1, 0, 1.3);

        // Nối dầm lan can đá giữa các cột kề nhau để tạo thành thành chắn mỹ thuật liên tục
        const nextAngle = ((i + 1) / postCount) * Math.PI * 2;
        const nextTheHuc = nextAngle > 0.26 && nextAngle < 1.00;
        const nextKimQuy = nextAngle > 2.08 && nextAngle < 2.64;
        if (!nextTheHuc && !nextKimQuy) {
          const nextPx = 80 + Math.cos(nextAngle) * 85;
          const nextPz = -80 + Math.sin(nextAngle) * 85;
          const segDist = Math.hypot(nextPx - px, nextPz - pz);
          const midX = (px + nextPx) / 2;
          const midZ = (pz + nextPz) / 2;
          const segRot = Math.atan2(nextPz - pz, nextPx - px);

          const railBeam = new THREE.Mesh(new THREE.BoxGeometry(segDist + 0.1, 0.42, 0.22), balusterMat);
          railBeam.position.set(midX, 0.52, midZ);
          railBeam.rotation.y = -segRot;
          zoneGroup.add(railBeam);
        }
      }
    }

    // 3. ĐẢO RÙA TỰ NHIÊN & THÁP RÙA 3 TẦNG VÒM GOTHIC - CÓ THỂ BƯỚC VÀO TRONG (WALKABLE INTERIOR)
    const turtleIsland = new THREE.Mesh(new THREE.CylinderGeometry(16, 19, 1.5, 32), this.materials.mossStone);
    turtleIsland.position.set(80, 0.75, -80);
    turtleIsland.castShadow = true;
    turtleIsland.receiveShadow = true;
    zoneGroup.add(turtleIsland);
    this.colliders.push(turtleIsland);

    // Thảm cỏ xanh trên gò Đảo Rùa (Đăng ký va chạm sàn để đế giày luôn nằm trên mặt cỏ)
    const grassMesh = new THREE.Mesh(new THREE.CylinderGeometry(15.2, 15.2, 0.2, 32), new THREE.MeshStandardMaterial({ color: 0x3d5a2d, roughness: 0.9 }));
    grassMesh.name = 'turtleIslandGrass';
    grassMesh.position.set(80, 1.54, -80);
    grassMesh.receiveShadow = true;
    grassMesh._isBaseGround = true;
    zoneGroup.add(grassMesh);
    this.colliders.push(grassMesh);

    // DỐC ĐÁ TAM CẤP CỔ NỐI LIỀN TỪ CẦU KIM QUY LÊN THẲNG SÂN THÁP RÙA (KHÔNG CÓ GỜ CAO)
    // 8 bậc đá rộng thênh thang 4.6m, mỗi bậc chỉ cao 0.09m (9cm) bước đi siêu êm ái!
    for (let st = 0; st < 8; st++) {
      const stepT = st / 7;
      const stepX = 66.0 + stepT * 10.0;
      const stepZ = -66.0 - stepT * 10.0;
      const stepY = 0.85 + stepT * 0.70;
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.22, 4.6), this.materials.mossStone);
      stepMesh.position.set(stepX, stepY - 0.05, stepZ);
      stepMesh.rotation.y = -Math.PI / 4;
      stepMesh.receiveShadow = true;
      zoneGroup.add(stepMesh);
      this.colliders.push(stepMesh);
    }

    // Sân lát đá xanh cổ nguyên khối xung quanh chân Tháp Rùa
    const islandCourtyard = new THREE.Mesh(new THREE.BoxGeometry(18.0, 0.28, 15.0), this.materials.mossStone);
    islandCourtyard.name = 'islandCourtyard';
    islandCourtyard.position.set(80, 1.54, -80);
    islandCourtyard.receiveShadow = true;
    islandCourtyard._isBaseGround = true;
    zoneGroup.add(islandCourtyard);
    this.colliders.push(islandCourtyard);

    // Lan can đá hoa sen bảo vệ quanh mép đảo phía tiếp giáp hồ
    const islandPosts = [];
    for (let a = 0; a < 14; a++) {
      const pAngle = (a / 14) * Math.PI * 2;
      // Chừa lối dẫn lên cầu Kim Quy (hướng góc 135 độ / ~2.36 rad, tọa độ X ~ 69.5, Z ~ -69.5)
      const isBridgeOpening = pAngle > 2.05 && pAngle < 2.65;
      const px = 80 + Math.cos(pAngle) * 14.8;
      const pz = -80 + Math.sin(pAngle) * 14.8;
      islandPosts.push({ a, pAngle, px, pz, isBridgeOpening });

      if (isBridgeOpening) continue;

      const balustrade = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.85, 8), this.materials.mossStone);
      balustrade.position.set(px, 1.55 + 0.425, pz);
      balustrade.castShadow = true;
      zoneGroup.add(balustrade);

      const lotus = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), this.materials.mossStone);
      lotus.position.set(px, 1.55 + 0.95, pz);
      lotus.castShadow = true;
      zoneGroup.add(lotus);

      this._addBoxObstacle(px, pz, 0.9, 0.9, 1.2, 3.2);
    }

    // Các đoạn dầm đá liên kết giữa các trụ lan can đảo tạo hàng rào kiên cố (khóa chặt 100% không đi xuyên ra hồ)
    for (let i = 0; i < 14; i++) {
      const cur = islandPosts[i];
      const next = islandPosts[(i + 1) % 14];
      if (cur.isBridgeOpening || next.isBridgeOpening) continue;

      const dx = next.px - cur.px;
      const dz = next.pz - cur.pz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);
      const midX = (cur.px + next.px) / 2;
      const midZ = (cur.pz + next.pz) / 2;

      // Thanh dầm lan can đá ngang
      const beamMesh = new THREE.Mesh(new THREE.BoxGeometry(dist, 0.18, 0.16), this.materials.mossStone);
      beamMesh.position.set(midX, 1.55 + 0.55, midZ);
      beamMesh.rotation.y = -angle;
      beamMesh.castShadow = true;
      zoneGroup.add(beamMesh);

      // Vật cản ngăn xuyên rào viền đảo tại các phân đoạn
      for (let t of [0.25, 0.50, 0.75]) {
        const ox = cur.px + dx * t;
        const oz = cur.pz + dz * t;
        this._addBoxObstacle(ox, oz, 1.4, 1.4, 1.2, 3.2);
      }
    }

    // =========================================================================
    // 🐢 THÁP RÙA 3D CHÂN THỰC 100% THEO BẢN THIẾT KẾ MASTER (AUTHENTIC 3D REPLICA)
    // Thay thế hoàn toàn mô hình tháp cũ theo sắc lệnh của Tổng Giám Đốc:
    // - Bệ móng đá khối cổ cao ráo (Ashlar Plinth) & hàng lan can thềm đá ô chữ nhật
    // - 4 Dãy tam cấp 4 phía có má gà đá vát chéo
    // - Tầng 1: 10 Vòm Gothic mở cửa đón khách, phù điêu pano hoa văn chạm khắc
    // - Nội điện tôn nghiêm: Bàn thờ đá cổ, Tượng Rùa Vàng đội bia, Đèn đồng & NPC Bác Nguyễn Văn An
    // - Gờ phân tầng và Lan can đá tầng thượng tầng 1 bao quanh
    // - Tầng 2: Vòm cuốn Gothic và ô pano phù điêu chạm nổi
    // - Mái ngói Tầng 2: Mái cong 4 góc đao vút lên truyền thống Á Đông
    // - Tầng 3: Lầu Vọng Nguyệt 4 cửa vòm đón gió
    // - Mái thượng Tầng 3: Mái cong 4 góc đao rêu phong
    // - Đỉnh chóp tháp: Bệ đá giật cấp và Đĩa nguyệt Thái Cực / Triều Dương linh thiêng
    // =========================================================================

    const towerGroup = new THREE.Group();
    towerGroup.name = 'ThapRuaGroup';
    towerGroup.position.set(80, 1.55, -80);

    const setPlaneUVs = (planeGeom, uMin, uMax, vMin, vMax) => {
      const uvAttr = planeGeom.attributes.uv;
      uvAttr.setXY(0, uMin, vMax);
      uvAttr.setXY(1, uMax, vMax);
      uvAttr.setXY(2, uMin, vMin);
      uvAttr.setXY(3, uMax, vMin);
      uvAttr.needsUpdate = true;
    };

    const createCurvedPagodaRoof = (w, d, h, flare, material) => {
      const group = new THREE.Group();

      const geom = new THREE.BufferGeometry();
      const segs = 20;
      const positions = [];
      const uvs = [];
      const indices = [];

      for (let j = 0; j <= segs; j++) {
        const v = j / segs;
        const pz = (v - 0.5) * d;
        for (let i = 0; i <= segs; i++) {
          const u = i / segs;
          const px = (u - 0.5) * w;

          const nx = Math.abs(u - 0.5) * 2;
          const nz = Math.abs(v - 0.5) * 2;
          const r = Math.max(nx, nz);

          let py = h * (1 - Math.pow(r, 1.25));
          const corner = Math.pow(nx, 3.5) * Math.pow(nz, 3.5);
          py += flare * corner;

          positions.push(px, py, pz);
          // Texture ngói âm dương lặp 4x4 tạo độ chi tiết cao
          uvs.push(u * 4, v * 4);
        }
      }

      for (let j = 0; j < segs; j++) {
        for (let i = 0; i < segs; i++) {
          const a = j * (segs + 1) + i;
          const b = j * (segs + 1) + (i + 1);
          const c = (j + 1) * (segs + 1) + i;
          const d = (j + 1) * (segs + 1) + (i + 1);
          indices.push(a, c, b);
          indices.push(b, c, d);
        }
      }

      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geom.setIndex(indices);
      geom.computeVertexNormals();

      const roofTopMesh = new THREE.Mesh(geom, material);
      roofTopMesh.castShadow = true;
      roofTopMesh.receiveShadow = true;
      group.add(roofTopMesh);

      // Khối cổ diêm / dạ mái bên dưới để mái có độ dày 3D thực thụ, không bị hổng đáy
      const soffitBox = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.94, 0.28, d * 0.94),
        this.materials.thapRuaPlinth
      );
      soffitBox.position.set(0, -0.12, 0);
      soffitBox.castShadow = true;
      group.add(soffitBox);

      // 4 Bờ đao mái uốn lượn từ đỉnh dốc xuống 4 góc và vút cong lên kiêu hãnh
      for (let cx of [-1, 1]) {
        for (let cz of [-1, 1]) {
          const cornerCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, h * 0.96, 0),
            new THREE.Vector3(cx * (w * 0.34), h * 0.42, cz * (d * 0.34)),
            new THREE.Vector3(cx * (w * 0.47), 0.14, cz * (d * 0.47)),
            new THREE.Vector3(cx * (w * 0.55), flare * 0.88 + 0.16, cz * (d * 0.55))
          ]);
          const hipMesh = new THREE.Mesh(
            new THREE.TubeGeometry(cornerCurve, 12, 0.09, 6, false),
            this.materials.thapRuaPlinth
          );
          hipMesh.castShadow = true;
          group.add(hipMesh);
        }
      }

      return group;
    };

    // 1. CHÂN ĐẾ MÓNG ĐÁ KHỐI CỔ (ASHLAR PLINTH) & SÂN THÁP
    const plinthW = 11.4;
    const plinthD = 9.2;
    const plinthH = 0.45; // Đưa mặt sân thềm lên độ cao 2.0m

    const plinthMesh = new THREE.Mesh(new THREE.BoxGeometry(plinthW, plinthH, plinthD), this.materials.thapRuaPlinth);
    plinthMesh.name = 'thapRuaPlinth';
    plinthMesh.position.set(80, 1.55 + plinthH / 2, -80); // Tâm Y = 1.775, Đỉnh Y = 2.000m chuẩn xác duy nhất, triệt tiêu 100% Z-fighting
    plinthMesh.castShadow = true;
    plinthMesh.receiveShadow = true;
    plinthMesh._isBaseGround = true;
    zoneGroup.add(plinthMesh);
    this.colliders.push(plinthMesh);

    // 4 Dãy tam cấp dẫn lên thềm đá 4 phía (Mỗi tam cấp 4 bậc, cao 11cm mỗi bậc, có má gà đá vát chéo)
    const stairConfigs = [
      { side: 'W', dirX: -1, dirZ: 0, w: 2.8, len: 1.6 },
      { side: 'E', dirX: 1, dirZ: 0, w: 2.8, len: 1.6 },
      { side: 'N', dirX: 0, dirZ: -1, w: 2.4, len: 1.6 },
      { side: 'S', dirX: 0, dirZ: 1, w: 2.4, len: 1.6 }
    ];

    stairConfigs.forEach(st => {
      const numSteps = 4;
      for (let s = 0; s < numSteps; s++) {
        const sT = s / (numSteps - 1);
        const stepH = plinthH / numSteps;
        const stepY = (s + 0.5) * stepH;
        const stepDist = (numSteps - s) * (st.len / numSteps);

        // Bậc tam cấp đá nguyên khối (Duy nhất 1 Mesh vừa hiển thị vừa đăng ký va chạm)
        const stepMesh = new THREE.Mesh(
          new THREE.BoxGeometry(
            st.dirX !== 0 ? (st.len / numSteps + 0.05) : st.w,
            stepH,
            st.dirZ !== 0 ? (st.len / numSteps + 0.05) : st.w
          ),
          this.materials.thapRuaPlinth
        );
        stepMesh.name = 'thapRuaStep';
        const posX = st.dirX !== 0 ? st.dirX * (plinthW / 2 + stepDist - 0.25) : 0;
        const posZ = st.dirZ !== 0 ? st.dirZ * (plinthD / 2 + stepDist - 0.25) : 0;
        stepMesh.position.set(80 + posX, 1.55 + stepY, -80 + posZ);
        stepMesh.castShadow = true;
        stepMesh.receiveShadow = true;
        stepMesh._isBaseGround = true;
        zoneGroup.add(stepMesh);
        this.colliders.push(stepMesh);
      }

      // Má gà đá vát dốc hai bên cạnh tam cấp (Flanking angled cheek stringers)
      for (let side of [-1, 1]) {
        const cheekW = 0.22;
        const cheekMesh = new THREE.Mesh(new THREE.BoxGeometry(cheekW, plinthH + 0.15, st.len + 0.2), this.materials.thapRuaPlinth);
        cheekMesh.rotation.x = st.dirZ !== 0 ? -st.dirZ * 0.28 : 0;
        cheekMesh.rotation.z = st.dirX !== 0 ? st.dirX * 0.28 : 0;

        const posX = st.dirX !== 0 ? st.dirX * (plinthW / 2 + st.len / 2) : side * (st.w / 2 + cheekW / 2);
        const posZ = st.dirZ !== 0 ? st.dirZ * (plinthD / 2 + st.len / 2) : side * (st.w / 2 + cheekW / 2);
        cheekMesh.position.set(posX, plinthH / 2 + 0.05, posZ);
        cheekMesh.castShadow = true;
        towerGroup.add(cheekMesh);
      }
    });

    // Lan can đá ô chữ nhật bao quanh thềm tháp (Stone Balustrade with Rectangular Panels)
    // 4 Trụ góc đá hình kim tự tháp
    for (let cx of [-plinthW / 2 + 0.25, plinthW / 2 - 0.25]) {
      for (let cz of [-plinthD / 2 + 0.25, plinthD / 2 - 0.25]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.85, 0.42), this.materials.thapRuaPlinth);
        post.position.set(cx, plinthH + 0.425, cz);
        post.castShadow = true;
        towerGroup.add(post);

        const postCap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.20, 4), this.materials.thapRuaPlinth);
        postCap.rotation.y = Math.PI / 4;
        postCap.position.set(cx, plinthH + 0.85 + 0.10, cz);
        towerGroup.add(postCap);
      }
    }

    // Các đoạn dầm lan can đá có ô chữ nhật dọc theo chu vi (chừa lối tam cấp)
    for (let sideX of [-1, 1]) {
      // Mặt dài Đông / Tây (chừa lối giữa 3.0m)
      for (let zSeg of [-2.8, 2.8]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.70, 2.2), this.materials.thapRuaPlinth);
        rail.position.set(sideX * (plinthW / 2 - 0.25), plinthH + 0.35, zSeg);
        rail.castShadow = true;
        towerGroup.add(rail);
      }
    }
    for (let sideZ of [-1, 1]) {
      // Mặt ngắn Bắc / Nam (chừa lối giữa 2.6m)
      for (let xSeg of [-3.6, 3.6]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.70, 0.24), this.materials.thapRuaPlinth);
        rail.position.set(xSeg, plinthH + 0.35, sideZ * (plinthD / 2 - 0.25));
        rail.castShadow = true;
        towerGroup.add(rail);
      }
    }

    // =========================================================================
    // VẬT CẢN LAN CAN ĐÁ THỀM THÁP RÙA, TRỤ GÓC & MÁ GÀ TAM CẤP 4 PHÍA
    // Khóa chặt 100% không cho người chơi đi xuyên qua các hàng rào lan can đá bên ngoài!
    // Tuyệt đối chỉ cho phép bước vào qua 4 lối tam cấp và 4 cửa vòm chính!
    // =========================================================================

    // 1. Lan can đá mặt Đông và Tây (X = 74.55 và X = 85.45)
    for (let sideX of [-1, 1]) {
      const rx = 80 + sideX * (plinthW / 2 - 0.25); // 74.55 hoặc 85.45
      // Cánh Bắc: Z từ -84.6 đến -81.5 (tâm Z = -83.05, dài 3.1m, dày 0.6m)
      this._addBoxObstacle(rx, -83.05, 0.60, 3.10, 1.2, 3.5);
      // Cánh Nam: Z từ -78.5 đến -75.4 (tâm Z = -76.95, dài 3.1m, dày 0.6m)
      this._addBoxObstacle(rx, -76.95, 0.60, 3.10, 1.2, 3.5);
    }

    // 2. Lan can đá mặt Bắc và Nam (Z = -84.35 và Z = -75.65)
    for (let sideZ of [-1, 1]) {
      const rz = -80 + sideZ * (plinthD / 2 - 0.25); // -84.35 hoặc -75.65
      // Cánh Tây: X từ 74.25 đến 78.60 (tâm X = 76.425, rộng 4.35m, dày 0.6m)
      this._addBoxObstacle(76.425, rz, 4.35, 0.60, 1.2, 3.5);
      // Cánh Đông: X từ 81.40 đến 85.75 (tâm X = 83.575, rộng 4.35m, dày 0.6m)
      this._addBoxObstacle(83.575, rz, 4.35, 0.60, 1.2, 3.5);
    }

    // 3. Bốn trụ góc đá hình kim tự tháp (Corner Posts)
    for (let cx of [-plinthW / 2 + 0.25, plinthW / 2 - 0.25]) {
      for (let cz of [-plinthD / 2 + 0.25, plinthD / 2 - 0.25]) {
        this._addBoxObstacle(80 + cx, -80 + cz, 0.85, 0.85, 1.2, 3.6);
      }
    }

    // 4. Tám má gà đá vát dốc hai bên cạnh tam cấp 4 phía (Stair Cheek Stringers)
    // Cạnh má gà tam cấp Tây (hướng X = 73.5)
    this._addBoxObstacle(73.5, -81.55, 1.70, 0.45, 1.2, 2.8);
    this._addBoxObstacle(73.5, -78.45, 1.70, 0.45, 1.2, 2.8);
    // Cạnh má gà tam cấp Đông (hướng X = 86.5)
    this._addBoxObstacle(86.5, -81.55, 1.70, 0.45, 1.2, 2.8);
    this._addBoxObstacle(86.5, -78.45, 1.70, 0.45, 1.2, 2.8);
    // Cạnh má gà tam cấp Bắc (hướng Z = -85.5)
    this._addBoxObstacle(78.65, -85.5, 0.45, 1.70, 1.2, 2.8);
    this._addBoxObstacle(81.35, -85.5, 0.45, 1.70, 1.2, 2.8);
    // Cạnh má gà tam cấp Nam (hướng Z = -74.5)
    this._addBoxObstacle(78.65, -74.5, 0.45, 1.70, 1.2, 2.8);
    this._addBoxObstacle(81.35, -74.5, 0.45, 1.70, 1.2, 2.8);

    // Cụm cỏ dại và cây bụi xanh mọc tự nhiên ôm lấy các góc chân móng
    for (let cx of [-plinthW / 2 - 0.4, plinthW / 2 + 0.4]) {
      for (let cz of [-plinthD / 2 - 0.4, plinthD / 2 + 0.4]) {
        const bush = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 6), new THREE.MeshStandardMaterial({ color: 0x3d5c2e, roughness: 0.88 }));
        bush.scale.set(1.4, 0.55, 1.4);
        bush.position.set(cx, 0.25, cz);
        towerGroup.add(bush);
      }
    }

    // =========================================================================
    // =========================================================================
    // 2. TẦNG 1: KIẾN TRÚC MỞ 10 VÒM CUỐN GOTHIC & PHÙ ĐIÊU TỪ ẢNH 3D MASTER
    // =========================================================================
    const t1W = 8.0;
    const t1D = 6.0;
    const t1H = 3.8;
    const t1BaseY = plinthH; // 0.45m

    // 4 Trụ góc đá rêu phong vững chãi chịu lực (Pilasters with stone capitals)
    for (let cx of [-t1W / 2 + 0.45, t1W / 2 - 0.45]) {
      for (let cz of [-t1D / 2 + 0.45, t1D / 2 - 0.45]) {
        const cornerCol = new THREE.Mesh(new THREE.BoxGeometry(0.95, t1H, 0.95), this.materials.thapRuaPlinth);
        cornerCol.position.set(cx, t1BaseY + t1H / 2, cz);
        cornerCol.castShadow = true;
        cornerCol.receiveShadow = true;
        towerGroup.add(cornerCol);

        const baseMold = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.25, 1.15), this.materials.thapRuaPlinth);
        baseMold.position.set(cx, t1BaseY + 0.125, cz);
        towerGroup.add(baseMold);

        const capMold = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.25, 1.15), this.materials.thapRuaPlinth);
        capMold.position.set(cx, t1BaseY + t1H - 0.125, cz);
        towerGroup.add(capMold);
      }
    }

    // =========================================================================
    // SÀN NỘI ĐIỆN GẠCH BÁT TRÀNG MỘC & ĐĂNG KÝ BƯỚC ĐI TỰ DO (WALKABLE INTERIOR FLOOR)
    // Sàn gạch Bát Tràng nằm gọn 100% trong lòng 4 vách tường (7.8m x 5.8m), đỉnh Y = 2.015m
    // Cao hơn mặt thềm đá ngoài 1.5cm tạo gờ bậu cửa truyền thống & triệt tiêu hoàn toàn lỗi chớp nháy (Z-fighting)
    // =========================================================================
    const walkFloorCol = new THREE.Mesh(
      new THREE.BoxGeometry(t1W - 0.2, 0.40, t1D - 0.2),
      this.materials.thapRuaBpFloor
    );
    walkFloorCol.name = 'thapRuaInteriorFloor';
    walkFloorCol.position.set(80, 1.815, -80); // Tâm Y = 1.815, đỉnh Y = 2.015m
    walkFloorCol.receiveShadow = true;
    walkFloorCol._isBaseGround = true;
    zoneGroup.add(walkFloorCol);
    this.colliders.push(walkFloorCol);

    // Bốn ngưỡng bậu cửa đá cổ kết nối thềm ngoại thất và sàn gạch nội điện
    const threshGeoW = new THREE.BoxGeometry(0.45, 0.03, 2.0);
    const threshW = new THREE.Mesh(threshGeoW, this.materials.thapRuaPlinth);
    threshW.position.set(76.0, 2.015, -80.0);
    threshW.receiveShadow = true;
    zoneGroup.add(threshW);

    const threshE = new THREE.Mesh(threshGeoW, this.materials.thapRuaPlinth);
    threshE.position.set(84.0, 2.015, -80.0);
    threshE.receiveShadow = true;
    zoneGroup.add(threshE);

    const threshGeoNS = new THREE.BoxGeometry(2.0, 0.03, 0.45);
    const threshS = new THREE.Mesh(threshGeoNS, this.materials.thapRuaPlinth);
    threshS.position.set(80.0, 2.015, -77.0);
    threshS.receiveShadow = true;
    zoneGroup.add(threshS);

    const threshN = new THREE.Mesh(threshGeoNS, this.materials.thapRuaPlinth);
    threshN.position.set(80.0, 2.015, -83.0);
    threshN.receiveShadow = true;
    zoneGroup.add(threshN);

    // =========================================================================
    // 1. CỬA VÒM MẶT TÂY (MẶT TRƯỚC - ĐÓN KHÁCH TỪ CẦU KIM QUY VÀO TRONG THÁP)
    // Cửa vòm giữa rộng 2.0m, cao 3.2m THÔNG THUỐNG ĐỂ NGƯỜI CHƠI BƯỚC VÀO TRONG!
    // =========================================================================
    const doorClearW = 2.0;
    const wingW = (t1W - doorClearW) / 2; // 3.0m mỗi cánh vách hai bên

    // Vách chịu lực hai cánh mặt Tây
    for (let sideX of [-1, 1]) {
      const wingBox = new THREE.Mesh(new THREE.BoxGeometry(wingW, t1H, 0.45), this.materials.thapRuaPlinth);
      const wingPosX = sideX * (t1W / 2 - wingW / 2);
      wingBox.position.set(wingPosX, t1BaseY + t1H / 2, t1D / 2 - 0.175);
      wingBox.castShadow = true;
      wingBox.receiveShadow = true;
      towerGroup.add(wingBox);

      // Mặt trong bộc lộ gạch đỏ Bát Tràng rêu phong theo Blueprint
      const innerWing = new THREE.Mesh(new THREE.PlaneGeometry(wingW, t1H), this.materials.thapRuaBpBrick);
      innerWing.position.set(wingPosX, t1BaseY + t1H / 2, t1D / 2 - 0.36);
      innerWing.rotation.y = Math.PI;
      towerGroup.add(innerWing);
    }
    // Gờ vòm lanh-tô trên cửa chính mặt Tây
    const westLintel = new THREE.Mesh(new THREE.BoxGeometry(doorClearW + 0.2, 0.7, 0.35), this.materials.thapRuaPlinth);
    westLintel.position.set(0, t1BaseY + t1H - 0.35, t1D / 2 - 0.175);
    westLintel.castShadow = true;
    towerGroup.add(westLintel);

    // Mặt tiền Tây chính diện phủ ảnh Blueprint tầng 1 (3 vòm Gothic)
    const westLeftPlane = new THREE.Mesh(new THREE.PlaneGeometry(wingW, t1H), this.materials.thapRuaWall);
    setPlaneUVs(westLeftPlane.geometry, 0.0, 0.375, 0.0, 1.0);
    westLeftPlane.position.set(-t1W / 2 + wingW / 2, t1BaseY + t1H / 2, t1D / 2 + 0.02);
    towerGroup.add(westLeftPlane);

    const westRightPlane = new THREE.Mesh(new THREE.PlaneGeometry(wingW, t1H), this.materials.thapRuaWall);
    setPlaneUVs(westRightPlane.geometry, 0.625, 1.0, 0.0, 1.0);
    westRightPlane.position.set(t1W / 2 - wingW / 2, t1BaseY + t1H / 2, t1D / 2 + 0.02);
    towerGroup.add(westRightPlane);

    const westLintelPlane = new THREE.Mesh(new THREE.PlaneGeometry(doorClearW, 0.7), this.materials.thapRuaWall);
    setPlaneUVs(westLintelPlane.geometry, 0.375, 0.625, 0.81, 1.0);
    westLintelPlane.position.set(0, t1BaseY + t1H - 0.35, t1D / 2 + 0.02);
    towerGroup.add(westLintelPlane);

    // =========================================================================
    // 2. CỬA VÒM MẶT ĐÔNG (MẶT SAU - NHÌN RA LÒNG HỒ GƯƠM & ĐÓN BÌNH MINH)
    // Cửa vòm giữa rộng 2.0m THÔNG SUỐT ĐỂ NGƯỜI CHƠI BƯỚC XUYÊN TỪ TÂY SANG ĐÔNG!
    // =========================================================================
    for (let sideX of [-1, 1]) {
      const eastWingBox = new THREE.Mesh(new THREE.BoxGeometry(wingW, t1H, 0.45), this.materials.thapRuaPlinth);
      const wingPosX = sideX * (t1W / 2 - wingW / 2);
      eastWingBox.position.set(wingPosX, t1BaseY + t1H / 2, -t1D / 2 + 0.175);
      eastWingBox.castShadow = true;
      eastWingBox.receiveShadow = true;
      towerGroup.add(eastWingBox);

      // Mặt trong bộc lộ gạch đỏ Bát Tràng
      const innerEastWing = new THREE.Mesh(new THREE.PlaneGeometry(wingW, t1H), this.materials.thapRuaBpBrick);
      innerEastWing.position.set(wingPosX, t1BaseY + t1H / 2, -t1D / 2 + 0.36);
      towerGroup.add(innerEastWing);
    }
    const eastLintel = new THREE.Mesh(new THREE.BoxGeometry(doorClearW + 0.2, 0.7, 0.35), this.materials.thapRuaPlinth);
    eastLintel.position.set(0, t1BaseY + t1H - 0.35, -t1D / 2 + 0.175);
    eastLintel.castShadow = true;
    towerGroup.add(eastLintel);

    const eastLeftPlane = new THREE.Mesh(new THREE.PlaneGeometry(wingW, t1H), this.materials.thapRuaWall);
    setPlaneUVs(eastLeftPlane.geometry, 0.0, 0.375, 0.0, 1.0);
    eastLeftPlane.position.set(-t1W / 2 + wingW / 2, t1BaseY + t1H / 2, -t1D / 2 - 0.02);
    eastLeftPlane.rotation.y = Math.PI;
    towerGroup.add(eastLeftPlane);

    const eastRightPlane = new THREE.Mesh(new THREE.PlaneGeometry(wingW, t1H), this.materials.thapRuaWall);
    setPlaneUVs(eastRightPlane.geometry, 0.625, 1.0, 0.0, 1.0);
    eastRightPlane.position.set(t1W / 2 - wingW / 2, t1BaseY + t1H / 2, -t1D / 2 - 0.02);
    eastRightPlane.rotation.y = Math.PI;
    towerGroup.add(eastRightPlane);

    const eastLintelPlane = new THREE.Mesh(new THREE.PlaneGeometry(doorClearW, 0.7), this.materials.thapRuaWall);
    setPlaneUVs(eastLintelPlane.geometry, 0.375, 0.625, 0.81, 1.0);
    eastLintelPlane.position.set(0, t1BaseY + t1H - 0.35, -t1D / 2 - 0.02);
    eastLintelPlane.rotation.y = Math.PI;
    towerGroup.add(eastLintelPlane);

    // =========================================================================
    // 3. CÁC CỬA VÒM MẶT BẮC & NAM (MẶT NGẮN - MỞ CỬA BƯỚC RA THỀM ĐÁ TAM CẤP HAI BÊN)
    // =========================================================================
    const sideDoorClear = 1.8;
    const sidePierLen = (t1D - sideDoorClear) / 2; // 2.1m mỗi trụ cánh hai bên

    for (let sideX of [-1, 1]) {
      const sidePosX = sideX * (t1W / 2 - 0.175);
      // Hai trụ chịu lực hai bên cửa vòm bên (độ dày 0.70m vững chãi)
      for (let sZ of [-1, 1]) {
        const pierPosZ = sZ * (t1D / 2 - sidePierLen / 2);
        const pierBox = new THREE.Mesh(new THREE.BoxGeometry(0.70, t1H, sidePierLen), this.materials.thapRuaPlinth);
        pierBox.position.set(sidePosX, t1BaseY + t1H / 2, pierPosZ);
        pierBox.castShadow = true;
        pierBox.receiveShadow = true;
        towerGroup.add(pierBox);

        // Mặt trong bộc lộ gạch đỏ
        const innerSide = new THREE.Mesh(new THREE.PlaneGeometry(sidePierLen, t1H), this.materials.thapRuaBpBrick);
        innerSide.position.set(sideX * (t1W / 2 - 0.36), t1BaseY + t1H / 2, pierPosZ);
        innerSide.rotation.y = sideX === 1 ? -Math.PI / 2 : Math.PI / 2;
        towerGroup.add(innerSide);
      }

      // Lanh-tô trên vòm cửa bên
      const sideLintel = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.7, sideDoorClear + 0.1), this.materials.thapRuaPlinth);
      sideLintel.position.set(sidePosX, t1BaseY + t1H - 0.35, 0);
      sideLintel.castShadow = true;
      towerGroup.add(sideLintel);

      // Ngoại thất mặt bên: Mở cửa vòm thông suốt 1.8m, ở ngoài nhìn thấy rõ cửa và đi vào được!
      const sidePlane1 = new THREE.Mesh(new THREE.PlaneGeometry(sidePierLen, t1H), this.materials.thapRuaT1Side);
      setPlaneUVs(sidePlane1.geometry, 0.0, 0.35, 0.0, 1.0);
      sidePlane1.position.set(sideX * (t1W / 2 + 0.02), t1BaseY + t1H / 2, -t1D / 2 + sidePierLen / 2);
      sidePlane1.rotation.y = sideX === 1 ? Math.PI / 2 : -Math.PI / 2;
      towerGroup.add(sidePlane1);

      const sidePlane2 = new THREE.Mesh(new THREE.PlaneGeometry(sidePierLen, t1H), this.materials.thapRuaT1Side);
      setPlaneUVs(sidePlane2.geometry, 0.65, 1.0, 0.0, 1.0);
      sidePlane2.position.set(sideX * (t1W / 2 + 0.02), t1BaseY + t1H / 2, t1D / 2 - sidePierLen / 2);
      sidePlane2.rotation.y = sideX === 1 ? Math.PI / 2 : -Math.PI / 2;
      towerGroup.add(sidePlane2);

      const sideLintelPlane = new THREE.Mesh(new THREE.PlaneGeometry(sideDoorClear, 0.7), this.materials.thapRuaT1Side);
      setPlaneUVs(sideLintelPlane.geometry, 0.35, 0.65, 0.81, 1.0);
      sideLintelPlane.position.set(sideX * (t1W / 2 + 0.02), t1BaseY + t1H - 0.35, 0);
      sideLintelPlane.rotation.y = sideX === 1 ? Math.PI / 2 : -Math.PI / 2;
      towerGroup.add(sideLintelPlane);
    }

    // =========================================================================
    // HỆ THỐNG VẬT CẢN TƯỜNG ĐÁ NGUYÊN KHỐI 4 PHÍA THÁP RÙA (THICK SOLID WALL OBSTACLES)
    // Độ dày 0.90m, chiều cao từ 1.0m đến 8.0m, khóa kín 100% các góc và vách tường xung quanh.
    // TUYỆT ĐỐI CHỈ MỞ 4 CỬA VÒM CHÍNH ĐỂ NGƯỜI CHƠI BƯỚC VÀO TRONG!
    // =========================================================================
    // 1. Vách tường Mặt Nam (Z = -77.0, cửa giữa X: 79.0 -> 81.0 mở rộng 2.0m)
    this._addBoxObstacle(77.25, -77.0, 3.50, 0.90, 1.0, 8.0); // Cánh Tây: X [75.50, 79.00]
    this._addBoxObstacle(82.75, -77.0, 3.50, 0.90, 1.0, 8.0); // Cánh Đông: X [81.00, 84.50]

    // 2. Vách tường Mặt Bắc (Z = -83.0, cửa giữa X: 79.0 -> 81.0 mở rộng 2.0m)
    this._addBoxObstacle(77.25, -83.0, 3.50, 0.90, 1.0, 8.0); // Cánh Tây: X [75.50, 79.00]
    this._addBoxObstacle(82.75, -83.0, 3.50, 0.90, 1.0, 8.0); // Cánh Đông: X [81.00, 84.50]

    // 3. Vách tường Mặt Tây (X = 76.0, cửa giữa Z: -80.9 -> -79.1 mở rộng 1.8m)
    this._addBoxObstacle(76.0, -82.175, 0.90, 2.55, 1.0, 8.0); // Trụ Bắc: Z [-83.45, -80.90]
    this._addBoxObstacle(76.0, -77.825, 0.90, 2.55, 1.0, 8.0); // Trụ Nam: Z [-79.10, -76.55]

    // 4. Vách tường Mặt Đông (X = 84.0, cửa giữa Z: -80.9 -> -79.1 mở rộng 1.8m)
    this._addBoxObstacle(84.0, -82.175, 0.90, 2.55, 1.0, 8.0); // Trụ Bắc: Z [-83.45, -80.90]
    this._addBoxObstacle(84.0, -77.825, 0.90, 2.55, 1.0, 8.0); // Trụ Nam: Z [-79.10, -76.55]

    // =========================================================================
    // 4. KIẾN TRÚC GỖ NỘI ĐIỆN THEO BLUEPRINT: 4 CỘT GỖ LIM, XÀ NGANG & CẦU THANG GỖ CỔ
    // =========================================================================
    // Bốn Cột Gỗ Lim tròn nâng đỡ bộ vì kèo gỗ
    const timberColMat = new THREE.MeshStandardMaterial({
      color: 0x3d2719, // Gỗ lim sẫm màu cổ kính
      roughness: 0.72,
      metalness: 0.10
    });

    for (let cx of [-2.2, 2.2]) {
      for (let cz of [-1.5, 1.5]) {
        // Chân tảng đá hoa sen
        const stoneBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.25, 12), this.materials.thapRuaPlinth);
        stoneBase.position.set(cx, t1BaseY + 0.125, cz);
        towerGroup.add(stoneBase);

        // Thân cột gỗ lim
        const timberCol = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.17, t1H - 0.25, 12), timberColMat);
        timberCol.position.set(cx, t1BaseY + 0.25 + (t1H - 0.25) / 2, cz);
        timberCol.castShadow = true;
        towerGroup.add(timberCol);
        this._addBoxObstacle(80 + cx, -80 + cz, 0.42, 0.42, 1.55 + t1BaseY, 1.55 + t1BaseY + t1H);
      }
    }

    // Hệ xà ngang và xà dọc gỗ lim liên kết khung chịu lực
    const beamY = t1BaseY + t1H - 0.25;
    for (let cz of [-1.5, 1.5]) {
      const longBeam = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.22, 0.22), timberColMat);
      longBeam.position.set(0, beamY, cz);
      longBeam.castShadow = true;
      towerGroup.add(longBeam);
    }
    for (let cx of [-2.2, 2.2]) {
      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 3.2), timberColMat);
      crossBeam.position.set(cx, beamY, 0);
      crossBeam.castShadow = true;
      towerGroup.add(crossBeam);
    }

    // CẦU THANG GỖ LIM CỔ NỐI LÊN TẦNG 2 (THEO MẶT CẮT BLUEPRINT INTERIOR CUTAWAY)
    // Tọa độ góc Đông-Bắc (x: 2.3 -> 3.2, z: -2.3 -> -0.7)
    const stairGroup = new THREE.Group();
    const numStairSteps = 10;
    const stairStepW = 0.85;
    const stairStepRise = (t1H - 0.4) / numStairSteps;
    const stairStepRun = 1.6 / numStairSteps;

    for (let s = 0; s < numStairSteps; s++) {
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(stairStepW, 0.08, stairStepRun + 0.04), timberColMat);
      stepMesh.position.set(2.7, t1BaseY + 0.04 + s * stairStepRise, -2.1 + s * stairStepRun);
      stepMesh.castShadow = true;
      stairGroup.add(stepMesh);
    }
    // Lan can và tay vịn cầu thang gỗ
    const handrail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 2.2), timberColMat);
    handrail.position.set(2.25, t1BaseY + 0.9 + (t1H - 1.2) / 2, -1.3);
    handrail.rotation.x = -Math.atan2(t1H - 0.8, 1.6);
    stairGroup.add(handrail);
    towerGroup.add(stairGroup);
    this._addBoxObstacle(80 + 2.7, -80 - 1.3, 1.0, 1.8, 1.55 + t1BaseY, 1.55 + t1BaseY + t1H);

    // =========================================================================
    // 5. NỘI ĐIỆN BÊN TRONG THÁP RÙA: BÀN THỜ KIM QUY, BIA ĐÁ CỔ, ÁNH SÁNG & ĐÈN LỒNG
    // Đặt lùi về phía sau (z = -1.4) chừa lối đi thông thoáng ở giữa để bước xuyên qua!
    // =========================================================================
    // Bàn thờ đá cổ chạm khắc hoa văn từ Blueprint
    const thapRuaAltar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.85, 0.8), this.materials.thapRuaPlinth);
    thapRuaAltar.name = 'thapRuaAltar';
    thapRuaAltar.position.set(0, t1BaseY + 0.425, -1.4);
    thapRuaAltar.castShadow = true;
    towerGroup.add(thapRuaAltar);

    // Mặt trước chạm trổ hoa văn cổ bàn thờ từ bản vẽ Blueprint
    const altarFront = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.85), this.materials.thapRuaBpAltar);
    altarFront.position.set(0, t1BaseY + 0.425, -1.4 + 0.405);
    towerGroup.add(altarFront);
    this._addBoxObstacle(80, -80 - 1.4, 2.1, 0.9, 1.55 + t1BaseY, 1.55 + t1BaseY + 1.8);

    // Tượng Thần Kim Quy (Rùa Vàng) cõng bia đá cổ
    const turtleStatue = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.32, 1.15), this.materials.templeGold);
    turtleStatue.position.set(0, t1BaseY + 0.85 + 0.16, -1.4);
    turtleStatue.castShadow = true;
    towerGroup.add(turtleStatue);

    // Tấm bia đá cổ "Quy Sơn Linh Tháp" ghi dấu nghìn năm
    const steleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.0, 0.14), this.materials.thapRuaPlinth);
    steleMesh.position.set(0, t1BaseY + 0.85 + 0.32 + 0.50, -1.4);
    steleMesh.castShadow = true;
    towerGroup.add(steleMesh);

    // Lư hương đồng tỏa khói trầm tôn nghiêm
    const incenseCenser = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.35, 8), this.materials.templeGold);
    incenseCenser.position.set(0, t1BaseY + 0.85 + 0.18, -0.9);
    towerGroup.add(incenseCenser);

    // Chân nến đồng hai bên bàn thờ
    for (let cX of [-0.65, 0.65]) {
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.45, 6), this.materials.templeGold);
      candle.position.set(cX, t1BaseY + 0.85 + 0.225, -1.4);
      towerGroup.add(candle);

      const candleFlame = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff6600,
        emissiveIntensity: 1.5
      }));
      candleFlame.position.set(cX, t1BaseY + 0.85 + 0.48, -1.4);
      towerGroup.add(candleFlame);
    }

    // Nguồn sáng vàng ấm áp thiêng liêng rọi sáng nội điện Tháp Rùa
    const towerInteriorLight = new THREE.PointLight(0xffd070, 2.2, 8);
    towerInteriorLight.position.set(80, 1.55 + t1BaseY + 2.5, -80);
    zoneGroup.add(towerInteriorLight);

    // Bốn đèn lồng đồng thả từ vì kèo bên trong
    for (let lx of [-1.8, 1.8]) {
      for (let lz of [-1.2, 1.2]) {
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.2, 4), this.materials.darkIron);
        chain.position.set(80 + lx, 1.55 + t1BaseY + 3.2, -80 + lz);
        zoneGroup.add(chain);

        const lanternMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({
          color: 0xffdf80,
          emissive: 0xffaa00,
          emissiveIntensity: 0.9
        }));
        lanternMesh.position.set(80 + lx, 1.55 + t1BaseY + 2.5, -80 + lz);
        zoneGroup.add(lanternMesh);
      }
    }

    // =========================================================================
    // 🐢 NPC NHÀ SỬ HỌC THÁP RÙA - BÁC NGUYỄN VĂN AN (ĐỨNG BÊN CẠNH BÀN THỜ)
    // =========================================================================
    const historianNPC = this._createCitizenNPC(0, 0, 0x223a5e, 'kính lão');
    historianNPC.position.set(78.5, 1.55 + t1BaseY, -76.2);
    historianNPC.rotation.y = Math.PI; // Đứng trên thềm đá mặt Tây trang nghiêm chào đón người chơi
    zoneGroup.add(historianNPC);
    this._addNpcCollider(78.5, -76.2, 0.65);

    this.interactables.push({
      position: new THREE.Vector3(78.5, 1.55 + t1BaseY, -76.2),
      radius: 3.5,
      promptText: 'Lắng nghe Lịch sử Tháp Rùa cổ kính cùng Nhà Sử Học',
      actionKey: 'E',
      onInteract: () => {
        if (window.GameAPI && window.GameAPI.openNPCDialogue) {
          window.GameAPI.openNPCDialogue({
            name: 'Bác Nguyễn Văn An',
            title: 'Nhà Nghiên Cứu Lịch Sử & Cố Vấn Văn Hóa Hà Nội',
            greeting: 'Kính chào Tổng Giám Đốc và các bạn lãng tử! Bác đã ở bên Tháp Rùa này hơn bốn mươi năm. Từng thớ đá rêu phong, từng mái ngói cong vút ở đây đều mang theo hồn thiêng ngàn năm văn hiến của Thăng Long.',
            avatar: 'assets/textures/turtle_tower_moss.jpg',
            topics: [
              { text: 'Bác có thể kể về truyền thuyết Thần Kim Quy trao gươm báu?', reply: 'Đầu thế kỷ 15, tại hồ Tả Vọng này, vua Lê Lợi đã hoàn trả gươm thần Thuận Thiên cho Rùa Vàng sau khi dẹp tan giặc ngoại xâm. Từ đó, hồ được đổi tên thành Hồ Hoàn Kiếm linh thiêng.' },
              { text: 'Kiến trúc Tháp Rùa có nét độc đáo nào về sự giao thoa Á - Âu thưa Bác?', reply: 'Tháp Rùa có 3 tầng: Tầng 1 và 2 mang các vòm cuốn Gothic Pháp thanh thoát, nhưng tầng 3 và phần mái lại lợp ngói mũi hài có bờ nóc cong vút uốn lượn theo mỹ thuật cung đình Việt. Đó là sự dung hợp văn hóa kỳ diệu cuối thế kỷ 19.' },
              { text: 'Bên trong Tháp Rùa lưu giữ những gì thưa Bác?', reply: 'Nơi đây lưu giữ Bàn Thờ Quy Sơn Linh Tháp, tượng Rùa Vàng đội bia đá và làn trầm hương nghi ngút cầu quốc thái dân an. Bước vào đây, lòng người bỗng lắng lại giữa nhịp sống hối hả ngoài kia.' }
            ],
            shopItems: [
              { name: 'Mô Hình Tháp Rùa Thu Nhỏ Mạ Đồng', price: '15 Xu', desc: 'Mô hình kỷ niệm Tháp Rùa tinh xảo mang lại may mắn', icon: '🐢' },
              { name: 'Bưu Thiếp Tháp Rùa Đổi Màu Mờ Sương', price: '10 Xu', desc: 'Bức ảnh chụp Tháp Rùa trong làn sương sớm mùa đông', icon: '📮' },
              { name: 'Sách Ảnh "Hồ Gươm - Hồn Xưa Nét Cũ"', price: '20 Xu', desc: 'Cuốn tư liệu quý giá về lịch sử Tháp Rùa và 36 phố phường', icon: '📖' },
              { name: 'Mảnh Ngói Cổ Lưu Niệm Quy Sơn', price: '12 Xu', desc: 'Vật phẩm lưu niệm văn hóa Tháp Rùa thiêng liêng', icon: '🏮' }
            ]
          });
        }
      }
    });

    // 7. Cây cổ thụ bóng mát rêu phong trên Đảo Rùa tỏa bóng bên Tháp Rùa
    const islandTree1 = this._createRealisticHeritageTree({ type: 'shade', scale: 0.95, seed: 7 });
    islandTree1.position.set(73, 1.55, -86);
    zoneGroup.add(islandTree1);
    this._addBoxObstacle(73, -86, 1.2, 1.2, 1.55, 6.0);

    const islandTree2 = this._createRealisticHeritageTree({ type: 'shade', scale: 1.05, seed: 8 });
    islandTree2.position.set(87, 1.55, -74);
    zoneGroup.add(islandTree2);
    this._addBoxObstacle(87, -74, 1.2, 1.2, 1.55, 6.0);

    // =========================================================================
    // 3. GỜ PHÂN TẦNG 1 & HÀNG LAN CAN ĐÁ TẦNG THƯỢNG TẦNG 1
    // =========================================================================
    const cornice1H = 0.35;
    const cornice1Y = t1BaseY + t1H + cornice1H / 2;
    const cornice1 = new THREE.Mesh(new THREE.BoxGeometry(t1W + 0.8, cornice1H, t1D + 0.8), this.materials.thapRuaPlinth);
    cornice1.position.set(0, cornice1Y, 0);
    cornice1.castShadow = true;
    towerGroup.add(cornice1);

    // Hàng lan can đá bao quanh ban công tầng thượng tầng 1
    const balustradeY = t1BaseY + t1H + cornice1H;
    for (let sideX of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, t1D + 0.7), this.materials.thapRuaBalustrade);
      rail.position.set(sideX * (t1W / 2 + 0.35), balustradeY + 0.325, 0);
      rail.castShadow = true;
      towerGroup.add(rail);
    }
    for (let sideZ of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(t1W + 0.7, 0.65, 0.18), this.materials.thapRuaBalustrade);
      rail.position.set(0, balustradeY + 0.325, sideZ * (t1D / 2 + 0.35));
      rail.castShadow = true;
      towerGroup.add(rail);
    }

    // =========================================================================
    // 4. THÁP RÙA: TẦNG 2 (KIẾN TRÚC 4 MẶT TỪ ẢNH 3D MASTER)
    // =========================================================================
    const t2W = 6.0;
    const t2D = 4.4;
    const t2H = 3.0;
    const t2BaseY = balustradeY;

    // Lõi thân Tầng 2
    const t2Body = new THREE.Mesh(new THREE.BoxGeometry(t2W, t2H, t2D), this.materials.thapRuaPlinth);
    t2Body.position.set(0, t2BaseY + t2H / 2, 0);
    t2Body.castShadow = true;
    towerGroup.add(t2Body);

    // Vách Mặt Tây & Mặt Đông Tầng 2 (mang hình 3 vòm Gothic & phù điêu hoa văn từ ảnh Master)
    for (let sideZ of [-1, 1]) {
      const t2Plane = new THREE.Mesh(new THREE.PlaneGeometry(t2W, t2H), this.materials.thapRuaFacadeT2);
      t2Plane.position.set(0, t2BaseY + t2H / 2, sideZ * (t2D / 2 + 0.02));
      t2Plane.rotation.y = sideZ === 1 ? 0 : Math.PI;
      towerGroup.add(t2Plane);
    }

    // Vách Mặt Bắc & Mặt Nam Tầng 2 (mang hình 2 vòm Gothic từ ảnh Master)
    for (let sideX of [-1, 1]) {
      const t2SidePlane = new THREE.Mesh(new THREE.PlaneGeometry(t2D, t2H), this.materials.thapRuaT2Side);
      t2SidePlane.position.set(sideX * (t2W / 2 + 0.02), t2BaseY + t2H / 2, 0);
      t2SidePlane.rotation.y = sideX === 1 ? Math.PI / 2 : -Math.PI / 2;
      towerGroup.add(t2SidePlane);
    }

    // =========================================================================
    // 5. MÁI NGÓI TẦNG 2: MÁI CONG 4 GÓC ĐAO VÚT LÊN (TRUYỀN THỐNG Á ĐÔNG)
    // =========================================================================
    const roof2BaseY = t2BaseY + t2H;
    const roof2W = 7.6;
    const roof2D = 6.0;
    const roof2H = 1.35;

    // Mái ngói cong 4 mặt uốn lượn có đao mái bay lên từ thuật toán Parametric Pagoda Roof
    const roof2Mesh = createCurvedPagodaRoof(roof2W, roof2D, roof2H, 0.75, this.materials.thapRuaRoofMid);
    roof2Mesh.position.set(0, roof2BaseY, 0);
    towerGroup.add(roof2Mesh);

    // =========================================================================
    // 6. THÁP RÙA: TẦNG 3 (LẦU VỌNG NGUYỆT 4 CỬA VÒM)
    // =========================================================================
    const t3W = 4.0;
    const t3D = 3.2;
    const t3H = 2.2;
    const t3BaseY = roof2BaseY + roof2H * 0.72; // Khớp chuẩn vào phần cổ diêm

    const t3Body = new THREE.Mesh(new THREE.BoxGeometry(t3W, t3H, t3D), this.materials.thapRuaPlinth);
    t3Body.position.set(0, t3BaseY + t3H / 2, 0);
    t3Body.castShadow = true;
    towerGroup.add(t3Body);

    // 4 Vách Tầng 3 phủ hoa văn cửa vòm Vọng Nguyệt từ ảnh Master
    for (let sideZ of [-1, 1]) {
      const t3Plane = new THREE.Mesh(new THREE.PlaneGeometry(t3W, t3H), this.materials.thapRuaFacadeT3);
      t3Plane.position.set(0, t3BaseY + t3H / 2, sideZ * (t3D / 2 + 0.02));
      t3Plane.rotation.y = sideZ === 1 ? 0 : Math.PI;
      towerGroup.add(t3Plane);
    }
    for (let sideX of [-1, 1]) {
      const t3SidePlane = new THREE.Mesh(new THREE.PlaneGeometry(t3D, t3H), this.materials.thapRuaFacadeT3Side);
      t3SidePlane.position.set(sideX * (t3W / 2 + 0.02), t3BaseY + t3H / 2, 0);
      t3SidePlane.rotation.y = sideX === 1 ? Math.PI / 2 : -Math.PI / 2;
      towerGroup.add(t3SidePlane);
    }

    // =========================================================================
    // 7. MÁI THƯỢNG TẦNG 3: MÁI CONG 4 GÓC ĐAO RÊU PHONG
    // =========================================================================
    const roof3BaseY = t3BaseY + t3H;
    const roof3W = 5.2;
    const roof3D = 4.4;
    const roof3H = 1.65;

    const roof3Mesh = createCurvedPagodaRoof(roof3W, roof3D, roof3H, 0.90, this.materials.thapRuaRoof);
    roof3Mesh.position.set(0, roof3BaseY, 0);
    towerGroup.add(roof3Mesh);

    // =========================================================================
    // 8. ĐỈNH CHÓP THÁP RÙA: BỆ ĐÁ GIẬT CẤP & ĐĨA NGUYỆT THÁI CỰC LINH THIÊNG
    // =========================================================================
    const summitBaseY = roof3BaseY + roof3H * 0.85;

    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 0.38, 8), this.materials.thapRuaPlinth);
    pedestal.position.set(0, summitBaseY + 0.19, 0);
    pedestal.castShadow = true;
    towerGroup.add(pedestal);

    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.18, 32), this.materials.thapRuaEmblem);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(0, summitBaseY + 0.38 + 0.58, 0);
    disc.castShadow = true;
    towerGroup.add(disc);

    // Gắn toàn bộ cụm Tháp Rùa Master vào thế giới
    zoneGroup.add(towerGroup);

    // =========================================================================
    // 🐢 CẦU KIM QUY - LỐI ĐI BỘ ĐÁ CỔ DẪN RA ĐẢO THÁP RÙA (KHÔNG CHẠM NƯỚC 100%)
    // Nối trực tiếp từ đường dạo ven hồ (17, 0.45, -17) ra tới Đảo Rùa (68, 0.85, -68)
    // Bản mặt cầu đá xanh cổ rộng 3.8m, uốn cong êm dịu, lan can chạm búp sen đá & đèn đồng
    // =========================================================================

    // 1. CỔNG NGHINH PHONG MÔN & QUẢNG TRƯỜNG ĐÁ ĐẦU CẦU PHÍA BỜ HỒ (17, 0.45, -17)
    const bridgeGatePlaza = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.25, 6.5), this.materials.mossStone);
    bridgeGatePlaza.position.set(17, 0.38, -17);
    bridgeGatePlaza.receiveShadow = true;
    zoneGroup.add(bridgeGatePlaza);
    this.colliders.push(bridgeGatePlaza);

    // Đôi cột trụ đá Nghinh Phong Môn dẫn lối lên cầu (Đặt chuẩn hai bên mạn sườn cầu, mở rộng 4.4m thênh thang)
    for (let gs of [-2.6, 2.6]) {
      const gateCol = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 3.2, 8), this.materials.mossStone);
      gateCol.position.set(17 + gs * 0.7071, 1.85, -17 + gs * 0.7071);
      gateCol.castShadow = true;
      zoneGroup.add(gateCol);

      const gateLotus = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), this.materials.templeGold || this.materials.mossStone);
      gateLotus.position.set(17 + gs * 0.7071, 3.6, -17 + gs * 0.7071);
      zoneGroup.add(gateLotus);

      this._addBoxObstacle(17 + gs * 0.7071, -17 + gs * 0.7071, 0.5, 0.5, 0, 4.0);
    }

    // 2. ĐƯỜNG CONG VÒM CẦU KIM QUY (CatmullRom Curve dài 71m bắc qua lòng hồ)
    const kimQuyCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(17, 0.45, -17),
      new THREE.Vector3(28, 0.88, -28),
      new THREE.Vector3(39, 1.35, -39),
      new THREE.Vector3(50, 1.60, -50),
      new THREE.Vector3(60, 1.25, -60),
      new THREE.Vector3(68, 0.85, -68)
    ]);

    const kimQuySegments = 22;
    const kimQuyPts = kimQuyCurve.getPoints(kimQuySegments);

    for (let i = 0; i < kimQuySegments; i++) {
      const p1 = kimQuyPts[i];
      const p2 = kimQuyPts[i + 1];
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const segLength = p1.distanceTo(p2);
      const angleY = Math.atan2(p2.z - p1.z, p2.x - p1.x);
      const anglePitch = Math.asin((p2.y - p1.y) / segLength);

      // Mặt sàn đá nguyên khối bản rộng 3.8m
      const deckMesh = new THREE.Mesh(new THREE.BoxGeometry(segLength + 0.15, 0.32, 3.8), this.materials.mossStone);
      deckMesh.position.set(mid.x, mid.y + 0.1, mid.z);
      deckMesh.rotation.y = -angleY;
      deckMesh.rotation.z = anglePitch;
      deckMesh.receiveShadow = true;
      deckMesh.castShadow = true;
      zoneGroup.add(deckMesh);
      this.colliders.push(deckMesh); // ĐĂNG KÝ VÀO COLLIDERS ĐỂ ĐI LẠI TRÊN CẦU!

      // Rào chắn lan can đá hoa sen và dầm chắn hai bên cầu (Offset vuông góc chuẩn xác 1.95m)
      const perpX = -Math.sin(angleY);
      const perpZ = Math.cos(angleY);

      for (let side of [-2.05, 2.05]) {
        // Cột đá lan can
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.90, 8), this.materials.mossStone);
        post.position.set(mid.x + perpX * side, mid.y + 0.65, mid.z + perpZ * side);
        zoneGroup.add(post);

        // Búp sen đá trên đỉnh cột
        const lotus = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), this.materials.mossStone);
        lotus.position.set(mid.x + perpX * side, mid.y + 1.15, mid.z + perpZ * side);
        zoneGroup.add(lotus);

        // Tay vịn đá nối liền
        const railBeam = new THREE.Mesh(new THREE.BoxGeometry(segLength + 0.08, 0.22, 0.18), this.materials.mossStone);
        railBeam.position.set(mid.x + perpX * side, mid.y + 0.85, mid.z + perpZ * side);
        railBeam.rotation.y = -angleY;
        railBeam.rotation.z = anglePitch;
        zoneGroup.add(railBeam);

        // Đăng ký obstacle gọn gàng trên đúng gờ lan can (không lấn vào lòng mặt cầu 3.8m)
        for (let s of [0.25, 0.75]) {
          const subX = p1.x + (p2.x - p1.x) * s + perpX * side;
          const subZ = p1.z + (p2.z - p1.z) * s + perpZ * side;
          const subY = p1.y + (p2.y - p1.y) * s;
          this._addBoxObstacle(subX, subZ, 0.45, 0.45, subY, subY + 2.2);
        }
      }

      // Đèn lồng đồng thau cổ điển chiếu sáng lung linh dọc cầu (cách mỗi 3 nhịp)
      if (i % 3 === 1) {
        for (let side of [-2.05, 2.05]) {
          const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.6, 6), this.materials.darkIron);
          lampPost.position.set(mid.x + perpX * side, mid.y + 1.0, mid.z + perpZ * side);
          zoneGroup.add(lampPost);

          const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshStandardMaterial({
            color: 0xffe082,
            emissive: 0xffaa00,
            emissiveIntensity: 0.8
          }));
          lantern.position.set(mid.x + perpX * side, mid.y + 1.8, mid.z + perpZ * side);
          zoneGroup.add(lantern);
        }
      }
    }

    // Trụ cầu đá khối chìm dưới đáy hồ đỡ dầm cầu Kim Quy
    for (let t of [0.18, 0.36, 0.54, 0.72, 0.90]) {
      const pierPt = kimQuyCurve.getPoint(t);
      const pierH = pierPt.y + 0.2;
      const pierMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, pierH, 3.6), this.materials.mossStone);
      pierMesh.position.set(pierPt.x, pierH / 2, pierPt.z);
      pierMesh.castShadow = true;
      zoneGroup.add(pierMesh);
    }

    // 3. QUẢNG TRƯỜNG ĐÁ TIẾP ĐẢO (ISLAND LANDING PLAZA) TẠI (68, 0.85, -68)
    const islandLandingPlaza = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.30, 6.0), this.materials.mossStone);
    islandLandingPlaza.position.set(67.5, 0.70, -67.5);
    islandLandingPlaza.receiveShadow = true;
    zoneGroup.add(islandLandingPlaza);
    this.colliders.push(islandLandingPlaza);

    // =========================================================================
    // 🐟 ĐÀN CÁ CHÉP VÀNG & CÁ KOI HỒ GƯƠM BƠI LỘI LONG LANH QUANH THÁP RÙA
    // =========================================================================
    const fishGoldMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00, // Vảy vàng kim óng ánh
      roughness: 0.12,
      metalness: 0.55,
      emissive: 0x553300,
      emissiveIntensity: 0.35
    });
    const fishRedMat = new THREE.MeshStandardMaterial({
      color: 0xee1111, // Đỏ chu sa truyền thống
      roughness: 0.15,
      metalness: 0.35,
      emissive: 0x550808,
      emissiveIntensity: 0.30
    });
    const fishPlatinumMat = new THREE.MeshStandardMaterial({
      color: 0xf5f6fa, // Trắng bạc bạch kim phát sáng
      roughness: 0.08,
      metalness: 0.65,
      emissive: 0x112233,
      emissiveIntensity: 0.25
    });
    const fishOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xff6b00, // Cam hoàng hôn rực rỡ
      roughness: 0.14,
      metalness: 0.45,
      emissive: 0x441c00,
      emissiveIntensity: 0.30
    });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 });
    const fishMatList = [fishGoldMat, fishRedMat, fishPlatinumMat, fishOrangeMat];

    // CÁC ĐÀN CÁ CHÉP VÀNG & CÁ KOI HOÀN KIẾM:
    // Tuyệt đối chỉ bơi ở các vùng lòng hồ nước sâu, khoáng đạt,
    // cách xa Cầu Kim Quy (>45m), Cầu Thê Húc (>50m), Đảo Rùa (>10m) và vỉa hè (>30m).
    const fishSchools = [
      // Đàn 1: Lòng hồ sâu phía Nam Tháp Rùa (Vùng nước rộng mở nhất Hồ Gươm)
      { count: 14, cx: 80, cz: -125, rMin: 6, rMax: 14, speedBase: -0.24 },
      // Đàn 2: Lòng hồ phía Đông - Đông Nam giữa Tháp Rùa và bờ Đông
      { count: 10, cx: 110, cz: -102, rMin: 5, rMax: 9, speedBase: 0.26 },
      // Đàn 3: Lòng hồ phía Tây Nam (Cách Cầu Kim Quy hơn 50m về phía Nam)
      { count: 10, cx: 52, cz: -108, rMin: 5, rMax: 9, speedBase: -0.25 }
    ];

    fishSchools.forEach((school, sIdx) => {
      for (let f = 0; f < school.count; f++) {
        const fishGroup = new THREE.Group();
        const mat = fishMatList[(sIdx + f) % fishMatList.length];

        // Thân cá chép uốn lượn thon gọn, kích thước tự nhiên
        const bodyGeo = new THREE.ConeGeometry(0.16, 0.68, 8);
        bodyGeo.rotateX(Math.PI / 2);
        bodyGeo.scale(0.55, 0.75, 1.0);
        const bodyMesh = new THREE.Mesh(bodyGeo, mat);
        fishGroup.add(bodyMesh);

        // Mắt cá đen láy
        for (let side of [-1, 1]) {
          const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
          eye.position.set(side * 0.08, 0.035, 0.22);
          fishGroup.add(eye);
        }

        // Vây lưng cá
        const dorsalGeo = new THREE.BoxGeometry(0.02, 0.12, 0.26);
        const dorsal = new THREE.Mesh(dorsalGeo, mat);
        dorsal.position.set(0, 0.10, -0.04);
        fishGroup.add(dorsal);

        // Vây bơi hai bên
        for (let side of [-1, 1]) {
          const fin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.015, 0.16), mat);
          fin.position.set(side * 0.11, -0.02, 0.12);
          fin.rotation.z = side * 0.35;
          fishGroup.add(fin);
        }

        // Đuôi cá có khớp lắc bơi lội sinh động
        const tailPivot = new THREE.Group();
        tailPivot.position.set(0, 0, -0.34);
        const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.24, 0.32), mat);
        tailFin.position.set(0, 0, -0.14);
        tailPivot.add(tailFin);
        fishGroup.add(tailPivot);

        const radius = school.rMin + Math.random() * (school.rMax - school.rMin);
        const angle = (f / school.count) * Math.PI * 2 + Math.random() * 0.5;
        const speed = school.speedBase * (0.85 + Math.random() * 0.3);

        const spawnX = school.cx + Math.cos(angle) * radius;
        const spawnZ = school.cz + Math.sin(angle) * radius;

        fishGroup.position.set(
          spawnX,
          -0.04, // Bơi ngập dưới mặt nước hồ (y = 0.08)
          spawnZ
        );
        fishGroup.visible = this.isPointInOpenLakeWater(spawnX, spawnZ);
        zoneGroup.add(fishGroup);

        this.lakeFish.push({
          group: fishGroup,
          tail: tailPivot,
          centerX: school.cx,
          centerZ: school.cz,
          orbitRadius: radius,
          orbitAngle: angle,
          orbitSpeed: speed,
          swimPhase: Math.random() * Math.PI * 2
        });
      }
    });

    // 4. QUẦN THỂ ĐỀN NGỌC SƠN, CẦU THÊ HÚC, ĐẮC NGUYỆT LÂU & CHÙA ĐỎ CHÍNH ĐIỆN
    // ĐẢO NGỌC SƠN TỰ NHIÊN (Cao mặt sân chuẩn y = 0.80m, liền mạch tuyệt đối với Cầu Thê Húc)
    // Đảo dày 1.2m từ y = -0.40m đến y = +0.80m, triệt tiêu hoàn toàn lỗi đảo nhô cao 1.6m cắt xuyên sàn cầu
    const ngocIsland = new THREE.Mesh(new THREE.CylinderGeometry(20, 23, 1.2, 32), this.materials.mossStone);
    ngocIsland.position.set(122, 0.20, -73);
    ngocIsland.castShadow = true;
    ngocIsland.receiveShadow = true;
    zoneGroup.add(ngocIsland);
    this.colliders.push(ngocIsland); // ĐĂNG KÝ VÀO COLLIDERS ĐỂ ĐI LẠI TỰ DO TRÊN ĐẢO!

    // RÀO CHẮN ĐÁ MẶT NƯỚC VEN ĐẢO NGỌC SƠN (Ngăn rơi xuống nước, chừa lối vào từ Cầu Thê Húc)
    const islandPostCount = 32;
    for (let ip = 0; ip < islandPostCount; ip++) {
      const iAngle = (ip / islandPostCount) * Math.PI * 2;
      // Chừa lối vào từ Cầu Thê Húc (Góc Đông Bắc: angle khoảng -0.15 đến 0.85)
      if (iAngle >= -0.15 && iAngle <= 0.85) continue;

      const ix = 122 + Math.cos(iAngle) * 19.5;
      const iz = -73 + Math.sin(iAngle) * 19.5;
      const rockMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 0.85, 8), this.materials.mossStone);
      rockMesh.position.set(ix, 0.95, iz);
      rockMesh.castShadow = true;
      zoneGroup.add(rockMesh);
      this._addBoxObstacle(ix, iz, 1.2, 1.2, 0, 2.0);
    }

    // =========================================================================
    // ⛩️ CẦU THÊ HÚC ĐỎ SON 15 NHỊP - NÂNG CẤP ĐẠI TRÙNG TU CHUẨN KIẾN TRÚC THĂNG LONG
    // Bản mặt cầu mở rộng 3.8m thênh thang, vòm cong thoải êm ái, 16 cặp cọc cừ gỗ lim cắm đáy hồ,
    // hàng song tiện sơn son thếp vàng búp sen thanh nhã, triệt tiêu 100% vòm ống cản trở!
    // =========================================================================

    // 1. QUẢNG TRƯỜNG ĐÁ BỜ ĐÔNG ĐẦU CẦU THÊ HÚC & THÁP BÚT - ĐÀI NGHIÊN (Walkable Shore Plaza)
    // Nối thông suốt thênh thang từ vỉa hè đường dạo bộ ven hồ và lòng đường xe chạy vào thẳng đầu cầu
    const theHucPlazaGeo = new THREE.BoxGeometry(16.0, 0.35, 16.0);
    const theHucPlaza = new THREE.Mesh(theHucPlazaGeo, this.materials.mossStone);
    theHucPlaza.position.set(164.0, 0.38, -36.0);
    theHucPlaza.receiveShadow = true;
    zoneGroup.add(theHucPlaza);
    this.colliders.push(theHucPlaza); // ĐĂNG KÝ VÀO COLLIDERS ĐỂ ĐI LẠI THÊNH THANG 100%!

    // DỐC THOẢI NỐI TỪ QUẢNG TRƯỜNG ĐÁ LÊN MẶT CẦU THÊ HÚC (Bridge Approach Ramp)
    // Nối mượt mà liên tục từ y = 0.45 lên y = 0.65 tại đầu vòm cầu (158, -42), bản rộng 4.4m
    const rampLength = Math.hypot(158 - 163, -42 - (-37)); // ~7.07m
    const rampAngle = Math.atan2(-42 - (-37), 158 - 163);
    const theHucApproachGeo = new THREE.BoxGeometry(rampLength + 1.2, 0.32, 4.4);
    const theHucApproachRamp = new THREE.Mesh(theHucApproachGeo, this.materials.theHucRed);
    theHucApproachRamp.position.set(160.5, 0.54, -39.5);
    theHucApproachRamp.rotation.y = -rampAngle;
    theHucApproachRamp.receiveShadow = true;
    zoneGroup.add(theHucApproachRamp);
    this.colliders.push(theHucApproachRamp);

    // 2. VÒM CONG 15 NHỊP CẦU THÊ HÚC UỐN LƯỢN THANH THOÁT
    const theHucCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(158, 0.58, -42),
      new THREE.Vector3(151, 1.42, -47),
      new THREE.Vector3(146, 2.18, -52), // Đỉnh vòm cong kiêu hãnh giương cao
      new THREE.Vector3(140, 1.42, -58),
      new THREE.Vector3(134, 0.72, -64)
    ]);

    const deckSegments = 16;
    const theHucPts = theHucCurve.getPoints(deckSegments);

    for (let i = 0; i < deckSegments; i++) {
      const p1 = theHucPts[i];
      const p2 = theHucPts[i + 1];
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const segLength = p1.distanceTo(p2);
      const angleY = Math.atan2(p2.z - p1.z, p2.x - p1.x);
      const anglePitch = Math.asin((p2.y - p1.y) / segLength);

      // Bản ván cầu gỗ lim đỏ son rộng 3.8m (Đi lại thênh thang tự do không bị bó hẹp)
      const deckPlank = new THREE.Mesh(new THREE.BoxGeometry(segLength + 0.28, 0.32, 3.8), this.materials.theHucRed);
      deckPlank.position.set(mid.x, mid.y + 0.1, mid.z);
      deckPlank.rotation.y = -angleY;
      deckPlank.rotation.z = anglePitch;
      deckPlank.receiveShadow = true;
      zoneGroup.add(deckPlank);
      this.colliders.push(deckPlank);

      // Rào chắn bảo vệ và lan can song tiện hai bên mép cầu (Offset chuẩn xác 1.95m vuông góc)
      const perpX = -Math.sin(angleY);
      const perpZ = Math.cos(angleY);

      for (let side of [-1.92, 1.92]) {
        // Cột trụ son đỏ
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.12, 0.95, 8), this.materials.theHucRed);
        post.position.set(mid.x + perpX * side, mid.y + 0.65, mid.z + perpZ * side);
        zoneGroup.add(post);

        // Búp sen thếp vàng trên đỉnh cột cầu
        const lotus = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), this.materials.templeGold);
        lotus.position.set(mid.x + perpX * side, mid.y + 1.15, mid.z + perpZ * side);
        zoneGroup.add(lotus);

        // Tay vịn lan can gỗ đỏ
        const handRail = new THREE.Mesh(new THREE.BoxGeometry(segLength + 0.06, 0.12, 0.10), this.materials.theHucRed);
        handRail.position.set(mid.x + perpX * side, mid.y + 0.92, mid.z + perpZ * side);
        handRail.rotation.y = -angleY;
        handRail.rotation.z = anglePitch;
        zoneGroup.add(handRail);

        // Song tiện gỗ tiện dọc
        for (let st = -1; st <= 1; st++) {
          const slat = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 6), this.materials.theHucRed);
          slat.position.set(
            mid.x + perpX * side + Math.cos(angleY) * (st * 0.45),
            mid.y + 0.55,
            mid.z + perpZ * side + Math.sin(angleY) * (st * 0.45)
          );
          zoneGroup.add(slat);
        }

        // Rào chắn bảo vệ liên tục khép kín (Solid continuous barrier - ZERO GAPS)
        // Đặt ở vị trí mép ngoài lan can (offset 2.25m), kích thước chuẩn 0.45x0.45 để không lấn vào lòng mặt cầu 3.8m
        for (let s of [0.15, 0.40, 0.65, 0.90]) {
          const obsSide = side > 0 ? 2.25 : -2.25;
          const rx = p1.x + (p2.x - p1.x) * s + perpX * obsSide;
          const rz = p1.z + (p2.z - p1.z) * s + perpZ * obsSide;
          const ry = p1.y + (p2.y - p1.y) * s;
          this._addBoxObstacle(rx, rz, 0.45, 0.45, ry, ry + 2.4);
        }
      }

      // Hai dầm cong gỗ chịu lực chạy dọc bên dưới đỡ mặt cầu
      for (let bs of [-1.4, 1.4]) {
        const stringer = new THREE.Mesh(new THREE.BoxGeometry(segLength + 0.1, 0.35, 0.22), this.materials.theHucRed);
        stringer.position.set(mid.x + perpX * bs, mid.y - 0.12, mid.z + perpZ * bs);
        stringer.rotation.y = -angleY;
        stringer.rotation.z = anglePitch;
        zoneGroup.add(stringer);
      }
    }

    // 16 CẶP CỌC CỪ GỖ LIM ĐÔI CẮM ĐÁY HỒ ĐỠ 15 NHỊP CẦU THÊ HÚC
    theHucPts.forEach(pt => {
      const pierH = pt.y + 0.25;
      for (let side of [-1.5, 1.5]) {
        const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, pierH, 8), this.materials.theHucRed);
        pile.position.set(pt.x + (side * 0.6), pierH / 2, pt.z + (side * 0.8));
        pile.castShadow = true;
        zoneGroup.add(pile);
      }
    });

    // 3. DỐC HẠ THOẢI ĐẦU CẦU PHÍA ĐẢO QUA ĐẮC NGUYỆT LÂU VÀO SÂN ĐỀN NGỌC SƠN - BẢN RỘNG 3.8M
    const islandRampGeo = new THREE.BoxGeometry(11.0, 0.28, 3.8);
    const islandRamp = new THREE.Mesh(islandRampGeo, this.materials.theHucRed);
    islandRamp.position.set(130, 0.72, -67);
    islandRamp.rotation.y = -Math.atan2(-6, -8);
    islandRamp.rotation.z = -0.04;
    islandRamp.receiveShadow = true;
    zoneGroup.add(islandRamp);
    this.colliders.push(islandRamp);

    // Rào chắn bảo vệ 2 bên mép dốc hạ đầu đảo (Chống đi xuyên/rơi xuống mép nước)
    const islRampAngle = Math.atan2(-6, -8);
    const islPerpX = -Math.sin(islRampAngle);
    const islPerpZ = Math.cos(islRampAngle);
    for (let side of [-2.25, 2.25]) {
      for (let s of [0.15, 0.38, 0.62, 0.85]) {
        const ix = 134.0 + (128.0 - 134.0) * s + islPerpX * side;
        const iz = -64.0 + (-69.0 - (-64.0)) * s + islPerpZ * side;
        const iy = 0.72 + (0.80 - 0.72) * s;
        this._addBoxObstacle(ix, iz, 0.45, 0.45, iy, iy + 2.2);
      }
    }

    // ĐẮC NGUYỆT LÂU (Lầu Đón Trăng - Cổng Đền Ngọc Sơn 2 tầng mái cong)
    // Tự căn chỉnh góc đón chính xác theo trục Cầu Thê Húc hạ dốc (vectơ (-0.8, -0.6)), mở rộng lối đi thông thoáng 4.2m
    const dacNguyetLau = new THREE.Group();
    dacNguyetLau.position.set(130, 0.9, -67);
    const bridgeAngle = Math.atan2(-6, -8); // Góc đón từ cầu
    dacNguyetLau.rotation.y = -bridgeAngle;

    // 4 cột gỗ son đặt 2 bên mép hành lang (offset vuông góc ±2.1m, mở lối giữa rộng 4.2m thênh thang)
    const localPillars = [
      [-2.1, -1.2], [-2.1, 1.2],
      [2.1, -1.2], [2.1, 1.2]
    ];
    const cosA = Math.cos(-bridgeAngle);
    const sinA = Math.sin(-bridgeAngle);

    localPillars.forEach(p => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 4.5, 8), this.materials.theHucRed);
      col.position.set(p[0], 2.25, p[1]);
      dacNguyetLau.add(col);

      // Tính tọa độ world chính xác của từng cột sau khi xoay
      const wx = 130 + (p[0] * cosA - p[1] * sinA);
      const wz = -67 + (p[0] * sinA + p[1] * cosA);
      this._addBoxObstacle(wx, wz, 0.50, 0.50, 0.5, 5.0);
    });

    const dnlRoof1 = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.4, 4), this.materials.roofTile);
    dnlRoof1.rotation.y = Math.PI / 4;
    dnlRoof1.position.y = 4.8;
    dacNguyetLau.add(dnlRoof1);
    const dnlRoof2 = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.1, 4), this.materials.roofTile);
    dnlRoof2.rotation.y = Math.PI / 4;
    dnlRoof2.position.y = 5.8;
    dacNguyetLau.add(dnlRoof2);
    zoneGroup.add(dacNguyetLau);

    // SÂN ĐỀN NGỌC SƠN & CÂY ĐA CỔ THỤ HÀNG NGHÌN NĂM
    const banyanGroup = new THREE.Group();
    banyanGroup.position.set(132, 0.8, -78);
    const banyanTrunk = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 5.5, 10), this.materials.mossStone);
    banyanTrunk.position.y = 2.75;
    banyanGroup.add(banyanTrunk);
    // Rễ phụ buông rủ
    for (let r = 0; r < 5; r++) {
      const rAngle = (r / 5) * Math.PI * 2;
      const aerialRoot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 4.8, 6), this.materials.retroWood);
      aerialRoot.position.set(Math.cos(rAngle) * 2.2, 2.4, Math.sin(rAngle) * 2.2);
      banyanGroup.add(aerialRoot);
    }
    // Tán lá xanh um tùm
    const banyanFoliage1 = new THREE.Mesh(new THREE.SphereGeometry(3.5, 12, 12), new THREE.MeshStandardMaterial({ color: 0x274a26, roughness: 0.85 }));
    banyanFoliage1.position.set(0, 6.2, 0);
    const banyanFoliage2 = new THREE.Mesh(new THREE.SphereGeometry(2.8, 10, 10), new THREE.MeshStandardMaterial({ color: 0x1f3c1e, roughness: 0.85 }));
    banyanFoliage2.position.set(1.5, 7.0, -1.2);
    banyanGroup.add(banyanFoliage1, banyanFoliage2);
    zoneGroup.add(banyanGroup);
    this._addBoxObstacle(132, -78, 2.8, 2.8, 0, 12);

    // LƯ HƯƠNG ĐÁ CỔ KHẮC HỌA TIẾT HOA SEN BÊN SÂN CHÙA ĐỎ (Chừa thẳng lối đi vào cửa chính điện)
    const incenseBurner = new THREE.Group();
    incenseBurner.position.set(124, 0.8, -75);
    const burnerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 0.5, 12), this.materials.mossStone);
    burnerBase.position.y = 0.25;
    const burnerBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 0.85, 12), this.materials.mossStone);
    burnerBowl.position.y = 0.95;
    incenseBurner.add(burnerBase, burnerBowl);
    // Khói hương trầm nghi ngút
    const smokePuff = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshStandardMaterial({ color: 0xe8e8e8, transparent: true, opacity: 0.6 }));
    smokePuff.position.set(0, 1.6, 0);
    incenseBurner.add(smokePuff);
    zoneGroup.add(incenseBurner);
    this._addBoxObstacle(124, -75, 1.3, 1.3, 0, 2.2);

    // Ghế đá nghỉ chân dưới bóng cây
    const islandBench = this._createStoneBench();
    islandBench.position.set(129, 0.8, -76);
    islandBench.rotation.y = 0.4;
    zoneGroup.add(islandBench);
    this._addBoxObstacle(129, -76, 2.0, 1.0, 0, 1.2);

    // =========================================================================
    // 🏛️ CHÙA ĐỎ / ĐỀN NGỌC SƠN CHÍNH ĐIỆN (KIẾN TRÚC MỞ CỬA BƯỚC VÀO TRONG 100%)
    // Tọa độ trung tâm: x = 116, z = -70. Kích thước 14m (chiều Z) x 10m (chiều X), cao 5.6m
    // =========================================================================
    const templeGroup = new THREE.Group();
    templeGroup.position.set(116, 0.8, -70);

    const tw = 10.0; // Chiều sâu trục X
    const td = 14.0; // Chiều rộng trục Z
    const th = 5.2;  // Chiều cao thông thủy
    const tWallThick = 0.35;

    // SÀN CHÍNH ĐIỆN LÁT GẠCH BÁT TRÀNG CỔ BÓNG (Walkable 100%)
    const templeFloorGeo = new THREE.PlaneGeometry(tw, td);
    const templeFloor = new THREE.Mesh(templeFloorGeo, this.materials.batTrangCeramic || this.materials.hanoiPavement);
    templeFloor.rotation.x = -Math.PI / 2;
    templeFloor.position.set(0, 0.08, 0);
    templeFloor.receiveShadow = true;
    templeGroup.add(templeFloor);
    this.colliders.push(templeFloor); // ĐĂNG KÝ VÀO COLLIDERS ĐỂ ĐI LẠI TRÊN SÀN CHÙA ĐỎ!

    // TƯỜNG SAU (PHÍA TÂY - HẬU CUNG)
    const backTempleWall = new THREE.Mesh(new THREE.BoxGeometry(tWallThick, th, td), this.materials.theHucRed);
    backTempleWall.position.set(-tw / 2 + tWallThick / 2, th / 2, 0);
    backTempleWall.castShadow = true;
    templeGroup.add(backTempleWall);
    this._addBoxObstacle(116 - tw / 2 + tWallThick / 2, -70, tWallThick + 0.1, td, 0, th + 2);

    // TƯỜNG HỒI BẮC (TẢ VU)
    const leftTempleWall = new THREE.Mesh(new THREE.BoxGeometry(tw - tWallThick * 2, th, tWallThick), this.materials.theHucRed);
    leftTempleWall.position.set(0, th / 2, -td / 2 + tWallThick / 2);
    leftTempleWall.castShadow = true;
    templeGroup.add(leftTempleWall);
    this._addBoxObstacle(116, -70 - td / 2 + tWallThick / 2, tw - tWallThick * 2, tWallThick + 0.1, 0, th + 2);

    // TƯỜNG HỒI NAM (HỮU VU)
    const rightTempleWall = new THREE.Mesh(new THREE.BoxGeometry(tw - tWallThick * 2, th, tWallThick), this.materials.theHucRed);
    rightTempleWall.position.set(0, th / 2, td / 2 - tWallThick / 2);
    rightTempleWall.castShadow = true;
    templeGroup.add(rightTempleWall);
    this._addBoxObstacle(116, -70 + td / 2 - tWallThick / 2, tw - tWallThick * 2, tWallThick + 0.1, 0, th + 2);

    // TƯỜNG TRƯỚC (PHÍA ĐÔNG - HƯỚNG RA SÂN & CẦU THÊ HÚC)
    // Cửa bức bàn mở toang ở gian giữa rộng 4.4m, cao 3.5m!
    const tDoorW = 4.4;
    const tFrontSideW = (td - tDoorW - tWallThick * 2) / 2; // ~4.45m mỗi cánh gà

    // Cánh gà Bắc phía trước
    const frontTempleNorth = new THREE.Mesh(new THREE.BoxGeometry(tWallThick, th, tFrontSideW), this.materials.theHucRed);
    frontTempleNorth.position.set(tw / 2 - tWallThick / 2, th / 2, -tDoorW / 2 - tFrontSideW / 2);
    frontTempleNorth.castShadow = true;
    templeGroup.add(frontTempleNorth);
    this._addBoxObstacle(116 + tw / 2 - tWallThick / 2, -70 - tDoorW / 2 - tFrontSideW / 2, tWallThick + 0.1, tFrontSideW, 0, th + 2);

    // Cánh gà Nam phía trước
    const frontTempleSouth = new THREE.Mesh(new THREE.BoxGeometry(tWallThick, th, tFrontSideW), this.materials.theHucRed);
    frontTempleSouth.position.set(tw / 2 - tWallThick / 2, th / 2, tDoorW / 2 + tFrontSideW / 2);
    frontTempleSouth.castShadow = true;
    templeGroup.add(frontTempleSouth);
    this._addBoxObstacle(116 + tw / 2 - tWallThick / 2, -70 + tDoorW / 2 + tFrontSideW / 2, tWallThick + 0.1, tFrontSideW, 0, th + 2);

    // Lanh-tô và vách gỗ son chạm hoa văn trên cửa chính điện
    const tDoorLintel = new THREE.Mesh(new THREE.BoxGeometry(tWallThick, th - 3.5, tDoorW), this.materials.theHucRed);
    tDoorLintel.position.set(tw / 2 - tWallThick / 2, 3.5 + (th - 3.5) / 2, 0);
    templeGroup.add(tDoorLintel);

    // HỆ CỘT GỖ LIM SƠN SON THIẾP VÀNG (8 CỘT CÁI & CỘT QUÂN)
    const pillarPositions = [
      [tw / 2 - 0.4, -td / 2 + 0.6], [tw / 2 - 0.4, -tDoorW / 2], [tw / 2 - 0.4, tDoorW / 2], [tw / 2 - 0.4, td / 2 - 0.6],
      [-tw / 2 + 2.2, -td / 2 + 0.6], [-tw / 2 + 2.2, -2.2], [-tw / 2 + 2.2, 2.2], [-tw / 2 + 2.2, td / 2 - 0.6]
    ];
    pillarPositions.forEach(pp => {
      // Chân tảng đá hoa sen
      const stoneBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, 0.3, 12), this.materials.mossStone);
      stoneBase.position.set(pp[0], 0.15, pp[1]);
      templeGroup.add(stoneBase);

      // Thân cột gỗ sơn son đỏ
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, th, 12), this.materials.theHucRed);
      col.position.set(pp[0], th / 2, pp[1]);
      col.castShadow = true;
      templeGroup.add(col);
    });

    // MÁI ĐAO CONG 2 TẦNG CHÙA ĐỎ ĐỀN NGỌC SƠN (TRADITIONAL TWO-TIER PAGODA ROOF)
    // Tầng mái 1 (Hạ diềm)
    const roof1 = new THREE.Mesh(new THREE.ConeGeometry(10.5, 2.6, 4), this.materials.roofTile);
    roof1.rotation.y = Math.PI / 4;
    roof1.position.set(0, th + 1.3, 0);
    roof1.scale.set(1.0, 1.0, td / tw);
    roof1.castShadow = true;
    templeGroup.add(roof1);

    // Cổ diêm phân tầng thông gió
    const roofMid = new THREE.Mesh(new THREE.BoxGeometry(tw * 0.75, 0.6, td * 0.75), this.materials.theHucRed);
    roofMid.position.set(0, th + 2.6, 0);
    templeGroup.add(roofMid);

    // Tầng mái 2 (Thượng diềm)
    const roof2 = new THREE.Mesh(new THREE.ConeGeometry(7.5, 2.2, 4), this.materials.roofTile);
    roof2.rotation.y = Math.PI / 4;
    roof2.position.set(0, th + 3.8, 0);
    roof2.scale.set(1.0, 1.0, td / tw);
    roof2.castShadow = true;
    templeGroup.add(roof2);

    // BỜ NÓC MÁI NGÓI ĐẮP ĐÔI RỒNG CHẦU MẶT NGUYỆT (LƯỠNG LONG CHẦU NGUYỆT)
    const dragonMat = this.materials.templeGold || this.materials.yellowWall;
    const moonGem = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), dragonMat);
    moonGem.position.set(0, th + 5.0, 0);
    templeGroup.add(moonGem);

    for (let ds of [-1, 1]) {
      const dragonHead = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 8), dragonMat);
      dragonHead.rotation.z = ds * Math.PI / 3;
      dragonHead.position.set(0, th + 4.9, ds * 2.8);
      templeGroup.add(dragonHead);
    }

    // BIỂN ĐẠI TỰ HOÀNH PHI TREO TRÊN CỬA CHÍNH: "LINH TỪ THĂNG LONG"
    const templeSignBoard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 3.6), this.materials.templeGold);
    templeSignBoard.position.set(tw / 2 - 0.05, 3.9, 0);
    templeGroup.add(templeSignBoard);

    // -------------------------------------------------------------------------
    // 🕯️ NỘI THẤT BÊN TRONG CHÍNH ĐIỆN CHÙA ĐỎ (ĐỀN NGỌC SƠN)
    // -------------------------------------------------------------------------

    // 1. ÁN GIAN THỜ SƠN SON THẾP VÀNG TẠI HẬU CUNG (Trung tâm x = -tw/2 + 2.0 = -3.0, z = 0)
    const altarGroup = new THREE.Group();
    altarGroup.position.set(-tw / 2 + 1.8, 0, 0);

    const ngocSonAltarTable = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.3, 4.2), this.materials.woodVarnish || this.materials.theHucRed);
    ngocSonAltarTable.position.y = 0.65;
    ngocSonAltarTable.castShadow = true;
    altarGroup.add(ngocSonAltarTable);

    // Viền chạm hoa văn rồng mạ vàng trên án gian thờ
    const altarGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.15, 4.25), this.materials.templeGold);
    altarGoldTrim.position.y = 1.25;
    altarGroup.add(altarGoldTrim);

    // Đỉnh đồng tam khí trên bàn thờ
    const incenseVessel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 0.65, 8), this.materials.bronze);
    incenseVessel.position.set(0, 1.65, 0);
    altarGroup.add(incenseVessel);

    // Nén hương đang cháy tỏa khói thơm
    const jossSticks = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), new THREE.MeshBasicMaterial({ color: 0xbf302a }));
    jossSticks.position.set(0, 2.05, 0);
    altarGroup.add(jossSticks);

    // Đôi Hạc Đồng Ngự Long Quy (Hạc đứng trên lưng rùa đồng hai bên bàn thờ)
    for (let hs of [-1.8, 1.8]) {
      const craneGroup = new THREE.Group();
      craneGroup.position.set(0.1, 0, hs);

      // Rùa đồng đội chân hạc
      const turtleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.15, 8), this.materials.bronze);
      turtleBase.position.y = 0.08;
      craneGroup.add(turtleBase);

      // Thân hạc đồng vươn cao
      const craneBody = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.4, 6), this.materials.bronze);
      craneBody.position.y = 0.8;
      craneGroup.add(craneBody);

      // Đầu hạc ngậm hoa sen
      const craneHead = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 6), this.materials.bronze);
      craneHead.rotation.x = Math.PI;
      craneHead.position.y = 1.55;
      craneGroup.add(craneHead);

      altarGroup.add(craneGroup);
    }

    // Hoành phi thếp vàng sơn son: "VĂN PHỔ TẾ" treo trên tường hậu cung
    const hoanhPhi = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 3.2), this.materials.templeGold);
    hoanhPhi.position.set(-tw / 2 + 0.25, 4.1, 0);
    templeGroup.add(hoanhPhi);

    // Câu đối lòng máng thếp vàng hai bên cột cái
    for (let cs of [-2.2, 2.2]) {
      const coupl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.8, 0.35), this.materials.templeGold);
      coupl.position.set(-tw / 2 + 2.2, 2.8, cs);
      templeGroup.add(coupl);
    }

    templeGroup.add(altarGroup);
    // Obstacle bảo vệ án gian thờ (chống đi xuyên bàn thờ)
    this._addBoxObstacle(116 - tw / 2 + 1.8, -70, 1.7, 4.4, 0, 2.8);

    // 2. TỦ KÍNH BẢO VẬT: TIÊU BẢN CỤ RÙA HỒ GƯƠM (GIAN TẢ VU)
    // Tọa độ tủ kính: x = 116.5, z = -66.2 (Bên trong chính điện, khách tham quan ngắm nhìn 360 độ)
    const turtleCaseGroup = new THREE.Group();
    turtleCaseGroup.position.set(0.5, 0, 3.8);

    // Bệ chân tủ gỗ gụ chạm khắc hoa sen
    const caseBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 2.8), this.materials.retroWood);
    caseBase.position.y = 0.225;
    caseBase.castShadow = true;
    turtleCaseGroup.add(caseBase);

    // Hộp kính cường lực trong suốt bao quanh (MeshStandardMaterial siêu nhẹ, triệt tiêu 100% Transmission Render Pass gây lag)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xe8f4f8,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.35
    });
    const glassCase = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.05, 2.75), glassMat);
    glassCase.position.y = 0.95;
    turtleCaseGroup.add(glassCase);

    // TIÊU BẢN CỤ RÙA HỒ GƯƠM (BẢO VẬT TÂM LINH THIÊNG LIÊNG - RAFETUS SWINHOEI)
    const turtleMat = new THREE.MeshStandardMaterial({ color: 0x3d4738, roughness: 0.75 }); // Da mai rêu xám huyền thoại
    const turtleShell = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 16), turtleMat);
    turtleShell.scale.set(0.9, 0.35, 1.45); // Mai dài hơn 2 mét tỷ lệ chuẩn
    turtleShell.position.set(0, 0.62, 0);
    turtleShell.castShadow = true;
    turtleCaseGroup.add(turtleShell);

    // Đầu Cụ Rùa hơi ngước lên hiền từ
    const turtleHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), turtleMat);
    turtleHead.scale.set(0.85, 0.8, 1.35);
    turtleHead.position.set(0, 0.68, 1.15);
    turtleCaseGroup.add(turtleHead);

    // 4 chi chèo bơi vững chãi
    for (let fl of [-1, 1]) {
      const flipperFront = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.4), turtleMat);
      flipperFront.position.set(fl * 0.72, 0.52, 0.75);
      flipperFront.rotation.y = fl * 0.4;
      const flipperBack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.35), turtleMat);
      flipperBack.position.set(fl * 0.68, 0.52, -0.75);
      flipperBack.rotation.y = -fl * 0.3;
      turtleCaseGroup.add(flipperFront, flipperBack);
    }

    // Biển đồng lưu danh bảo vật
    const plaqueMat = this.materials.templeGold;
    const turtlePlaque = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.95), plaqueMat);
    turtlePlaque.position.set(0.75, 0.32, 0);
    turtleCaseGroup.add(turtlePlaque);

    templeGroup.add(turtleCaseGroup);
    // Obstacle bảo vệ tủ kính Cụ Rùa (chống đi xuyên tủ kính)
    this._addBoxObstacle(116.5, -66.2, 1.8, 3.0, 0, 1.8);

    // 3. NPC CỤ THỦ TỪ ĐỀN NGỌC SƠN (ĐỨNG TẠI GIAN HỮU VU BÊN PHẢI)
    // Dáng đứng trang nghiêm, áo dài the đen, đầu đội khăn đóng
    const priestNPC = this._createCitizenNPC(-1.2, -4.2, 0x1f1f1f, 'áo dài the');
    templeGroup.add(priestNPC);
    this._addNpcCollider(116 - 1.2, -70 - 4.2, 0.65);

    // Điểm tương tác phím E trò chuyện với Cụ Thủ Từ Đền Ngọc Sơn
    this.interactables.push({
      position: new THREE.Vector3(116 - 1.2, 0.88, -70 - 4.2),
      radius: 3.0,
      promptText: 'Chiêm bái & Trò chuyện cùng Cụ Thủ Từ Đền Ngọc Sơn',
      actionKey: 'E',
      onInteract: () => {
        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Cụ Trần &bull; Thủ Từ Đền Ngọc Sơn',
            role: 'Người giữ đền và thủ hộ bảo vật thiêng liêng đất Thăng Long',
            avatar: '⛩️',
            greeting: '"A Di Đà Phật! Chào con, lãng tử đã qua Cầu Thê Húc đỏ son vào chiêm bái Đền Ngọc Sơn. Nơi đây là chốn linh quy tụ hồn thiêng sông núi giữa làn nước biếc Hồ Gươm."',
            monumentTitle: 'Đền Ngọc Sơn - Cầu Thê Húc & Tiêu Bản Cụ Rùa Hồ Gươm',
            historyText: `
              <p><strong>Đền Ngọc Sơn (Thế kỷ 19):</strong> Tọa lạc trang nghiêm trên Đảo Ngọc. Đền thờ <em>Đức Thánh Trần Hưng Đạo</em> – vị anh hùng kiệt xuất ba lần đại phá quân Nguyên Mông bảo vệ bờ cõi nước Đại Việt, và <em>Văn Xương Đế Quân</em> – vị thần chủ trì đường khoa cử học vấn của sĩ tử nước Nam.</p>
              <p><strong>Tiêu Bản Cụ Rùa Hồ Gươm:</strong> Đang ngự trang trọng trong tủ kính chính điện, là cá thể giải khổng lồ mai mềm (<em>Rafetus swinhoei</em>) từng sống hàng trăm năm trong lòng hồ, biểu tượng sống động gắn liền với sự tích Vua Lê Lợi trả gươm báu Thuận Thiên cho Rùa Vàng thế kỷ 15.</p>
              <p><strong>Cầu Thê Húc & Đắc Nguyệt Lâu:</strong> Cầu 15 nhịp sơn màu đỏ son tượng trưng cho ánh dương ban mai rực rỡ, nối qua Đắc Nguyệt Lâu (Lầu Đón Trăng) đưa khách bộ hành bước vào cõi thanh tịnh an yên.</p>
            `,
            dialogueOptions: [
              { text: 'Cụ ơi, ngôi đền này thờ những vị thần nào ạ?', reply: 'Đền thờ Đức Thánh Trần Hưng Đạo - bậc anh hùng hộ quốc an dân, và Đức Văn Xương Đế Quân - vị thần soi sáng việc học vấn, thi cử đỗ đạt cho con cháu đời đời.' },
              { text: 'Ý nghĩa của cây cầu Thê Húc màu đỏ son là gì thưa cụ?', reply: 'Thê Húc nghĩa là "Nơi giữ lại ánh sáng ban mai tinh khôi nhất của mặt trời". Cầu son 15 nhịp cong như dải lụa đỏ dẫn lối khách thập phương gột rửa bụi trần bước vào chốn linh thiêng thanh tịnh.' },
              { text: 'Cụ có thể kể về tiêu bản Cụ Rùa trong tủ kính kia không ạ?', reply: 'Đó là Cụ Rùa Hồ Gươm thiêng liêng nặng hơn hai tạ đã gắn bó cùng biết bao thế hệ người Hà Nội. Cụ là minh chứng sống cho huyền tích Thần Kim Quy và truyền thống yêu chuộng hòa bình của dân tộc ta.' }
            ],
            shopItems: [
              { name: 'Vòng Dâu Tằm Chỉ Đỏ Bình An', price: '10 Xu', desc: 'Vòng đeo may mắn cầu chúc một chuyến du hành an lành', icon: '🏮' },
              { name: 'Thẻ Quẻ Cầu May Đầu Xuân', price: '5 Xu', desc: 'Quẻ thẻ hanh thông ghi lời chúc tốt lành', icon: '📜' },
              { name: 'Lá Bùa Hộ Mệnh Bình An Thăng Long', price: '15 Xu', desc: 'Lá bùa thêu gấm đỏ may mắn trừ tà khí', icon: '🧿' },
              { name: 'Bưu Thiếp Di Tích Đền Ngọc Sơn & Cụ Rùa', price: '10 Xu', desc: 'Bức ảnh màu lưu giữ khoảnh khắc thiêng liêng bên hồ', icon: '📮' }
            ]
          });
        }
      }
    });

    zoneGroup.add(templeGroup);

    // THÁP BÚT ("TẢ THANH THIÊN" - VIẾT LÊN TRỜI XANH) ĐẦU CẦU THÊ HÚC (Trên Núi Ngọc Bội ven bờ)
    const thapButGroup = new THREE.Group();
    thapButGroup.position.set(172, 0, -28);
    // Núi Ngọc Bội bằng các phiến đá xếp chồng tự nhiên
    const ngocBoiMount = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.2, 2.2, 12), this.materials.mossStone);
    ngocBoiMount.position.y = 1.1;
    thapButGroup.add(ngocBoiMount);
    this._addBoxObstacle(172, -28, 3.2, 3.2, 0, 15);

    // Tháp 5 tầng bằng đá thon dần lên cao
    for (let f = 0; f < 5; f++) {
      const rBot = 1.1 - f * 0.15;
      const rTop = 0.95 - f * 0.15;
      const tier = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, 1.5, 4), this.materials.mossStone);
      tier.rotation.y = Math.PI / 4;
      tier.position.y = 2.2 + 0.75 + f * 1.5;
      thapButGroup.add(tier);
    }
    // Ngòi bút nhọn hướng thẳng lên trời xanh
    const penTip = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.8, 8), this.materials.mossStone);
    penTip.position.y = 10.6;
    thapButGroup.add(penTip);

    // ĐÀI NGHIÊN ĐÁ NÂNG BỞI 3 CHÚ CÓC ĐÁ
    const daiNghien = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 1.0), this.materials.mossStone);
    daiNghien.position.set(168, 2.8, -31);
    thapButGroup.add(daiNghien);
    zoneGroup.add(thapButGroup);

    // BIA KỶ NIỆM LỊCH SỬ THÁP BÚT - ĐÀI NGHIÊN & CẦU THÊ HÚC
    this.interactables.push({
      position: new THREE.Vector3(167, 0.5, -32),
      radius: 2.8,
      promptText: 'Chiêm ngưỡng Di Tích Tháp Bút & Cầu Thê Húc',
      actionKey: 'E',
      onInteract: () => {
        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Di Tích Cổ Kính &bull; Tháp Bút - Cầu Thê Húc - Đền Ngọc Sơn',
            role: 'Quần thể văn hóa tâm linh nghìn năm Thăng Long',
            avatar: '🏛️',
            greeting: '"Bạn đang đứng trước cửa đền Ngọc Sơn – nơi hội tụ hồn thiêng sông núi giữa lòng Hà Nội."',
            monumentTitle: 'Tháp Bút Tả Thanh Thiên & Cầu Thê Húc',
            historyText: `
              <p><strong>Tháp Bút (Năm 1865):</strong> Do danh sĩ Nguyễn Văn Siêu khởi xướng xây dựng trên núi Ngọc Bội. Trên thân tháp tạc ba chữ Hán đại tự <em>"TẢ THANH THIÊN"</em> (Viết lên trời xanh), ngụ ý khí phách và tâm hồn chính đại quang minh của bậc trượng phu.</p>
              <p><strong>Đài Nghiên:</strong> Đặt trên cửa cuốn dẫn vào cầu, hình nửa quả đào xẻ ngang khoét lõm, được ba con cóc đá đội trên lưng như biểu tượng của sự uyên bác và vĩnh cửu.</p>
              <p><strong>Cầu Thê Húc:</strong> Có nghĩa là <em>"Nơi đón ánh sáng ban mai tinh khôi nhất của mặt trời"</em>, nối liền bờ đông với hòn Đảo Ngọc rợp bóng cổ thụ.</p>
            `,
            dialogueOptions: [
              { text: 'Ai là người thiết kế cây cầu Thê Húc màu đỏ này?', reply: 'Cụ Nguyễn Văn Siêu đã cho dựng cây cầu gỗ 15 nhịp sơn màu đỏ son rực rỡ tượng trưng cho vầng thái dương chiếu rọi mặt nước hồ.' },
              { text: 'Ý nghĩa của ba chữ "Tả Thanh Thiên" là gì?', reply: 'Là "Viết lên trời xanh" – gửi gắm khát vọng tự do, thanh cao và tri thức cao cả của con người Việt Nam.' }
            ],
            shopItems: [
              { name: 'Bưu Thiếp Tháp Bút Cổ Điển', price: '10 Xu', desc: 'Hình ảnh Tháp Bút trên nền trời xanh mùa thu', icon: '📮' },
              { name: 'Vòng Chỉ Đỏ Bình An Đền Ngọc Sơn', price: '15 Xu', desc: 'Kỷ vật may mắn cầu chúc một chuyến dạo chơi an lành', icon: '🏮' }
            ]
          });
        }
      }
    });

    // 5. Hàng cây liễu rủ mềm mại quanh bờ hồ
    const willowSpots = [
      { x: 35, z: -40 },
      { x: 42, z: -85 },
      { x: 48, z: -130 },
      { x: 80, z: -168 },
      { x: 125, z: -160 },
      { x: 155, z: -110 }
    ];

    willowSpots.forEach((pos, idx) => {
      const willow = this._createWillowTree(idx);
      willow.position.set(pos.x, 0, pos.z);
      zoneGroup.add(willow);
      this._addBoxObstacle(pos.x, pos.z, 1.2, 1.2, 0, 8);
    });

    // 6. Ghế đá xưa ven hồ & Cột đèn phố Pháp cổ
    const benchSpots = [
      { x: 38, z: -55, rot: 0.3 },
      { x: 45, z: -105, rot: -0.2 },
      { x: 95, z: -165, rot: 1.5 }
    ];

    benchSpots.forEach(b => {
      const bench = this._createStoneBench();
      bench.position.set(b.x, 0, b.z);
      bench.rotation.y = b.rot;
      zoneGroup.add(bench);
      this._addBoxObstacle(b.x, b.z, 2.2, 1.0, 0, 1.2);
    });

    const lampSpots = [
      { x: 36, z: -68 },
      { x: 50, z: -145 },
      { x: 140, z: -140 }
    ];
    lampSpots.forEach(l => {
      const lamp = this._createFrenchStreetLamp();
      lamp.position.set(l.x, 0, l.z);
      zoneGroup.add(lamp);
      this._addBoxObstacle(l.x, l.z, 0.8, 0.8, 0, 6.0);
    });

    this.worldGroup.add(zoneGroup);
  }

  /**
   * Phân khu 2: MÊ CUNG PHỐ CỔ & CÀ PHÊ ĐƯỜNG TÀU (Tọa độ x: [-250, 0], z: [0, 250])
   * Tích hợp 2 công trình mở được cửa đi vào bên trong với nội thất hoàn chỉnh:
   * 1. Tiệm Cà Phê Trứng & Trà Sen Tây Hồ (Bác Ba Cà Phê)
   * 2. Cửa Hàng Bách Hóa Mậu Dịch Thời Bao Cấp (Cô Mậu Dịch Viên)
   */
  _buildZone2OldQuarter() {
    const zoneGroup = new THREE.Group();
    zoneGroup.name = 'Zone2_OldQuarter';
    this.zone2Group = zoneGroup;

    // 1. CÔNG TRÌNH 1: TIỆM CÀ PHÊ TRỨNG & TRÀ SEN TÂY HỒ (MỞ CỬA BƯỚC VÀO ĐƯỢC)
    const cafeShop = this._createEggCoffeeShop(-42, 46);
    zoneGroup.add(cafeShop);

    // 2. CÔNG TRÌNH 2: CỬA HÀNG BÁCH HÓA MẬU DỊCH THỜI BAO CẤP (MỞ CỬA BƯỚC VÀO ĐƯỢC)
    const baoCapStore = this._createBaoCapStore(-66, 46);
    zoneGroup.add(baoCapStore);

    // 3. TOÀN BỘ 6 CÔNG TRÌNH NHÀ PHỐ CỔ ĐỀU MỞ CỬA BƯỚC VÀO ĐƯỢC 100% VỚI ĐẦY ĐỦ NỘI THẤT VÀ GIAO DỊCH:
    const streetShops = [
      { x: -90, z: 46, w: 12, d: 16, h: 4.2, type: 'thuoc_bac', sign: 'HIỆU THUỐC BẮC GIA TRUYỀN' },
      { x: -114, z: 46, w: 14, d: 16, h: 4.2, type: 'may_do', sign: 'MAY ĐO ÂU PHỤC PHỐ CỔ' },
      // Dãy phố đối diện (Mặt Bắc phố đường tàu)
      { x: -42, z: 80, w: 12, d: 18, h: 4.2, type: 'pho_gia_truyen', sign: 'PHỞ GIA TRUYỀN 1954' },
      { x: -66, z: 80, w: 13, d: 18, h: 4.2, type: 'bia_hoi', sign: 'BIA HƠI HÀ NỘI' },
      { x: -90, z: 80, w: 12, d: 18, h: 4.2, type: 'sua_dong_ho', sign: 'SỬA ĐỒNG HỒ LIÊN XÔ' },
      { x: -114, z: 80, w: 14, d: 18, h: 4.2, type: 'cat_toc', sign: 'CẮT TÓC BÌNH DÂN' }
    ];

    streetShops.forEach(s => {
      const shopMesh = this._createEnterableShop(s.x, s.z, s.w, s.d, s.h, s.type, s.sign);
      zoneGroup.add(shopMesh);
    });

    // 4. ĐƯỜNG RAY XE LỬA DI SẢN PHỐ CỔ (Phố Cà Phê Đường Tàu Phùng Hưng nối liền Cầu Long Biên)
    // Hạ thấp toàn bộ đệm đá, tà vẹt và ray sắt đặt khít sát mặt đường tự nhiên (Y = 0.0), loại bỏ lỗi ray bay lơ lửng:
    // Từ X = -140.0 đến X = -35.0: Chạy phẳng sát mặt đất (Y = 0.0 -> 0.22)
    // Từ X = -35.0 đến X = -30.0: Dốc thoai thoải kết nối êm ái vào chân dốc Cầu Long Biên
    const Z_TRACK = 60.0;
    const flatLen = 105.0; // Từ X = -140.0 đến X = -35.0
    const flatMidX = -87.5;
    const transLen = 5.0;  // Từ X = -35.0 đến X = -30.0
    const transMidX = -32.5;
    const transAngle = 0.0997; // atan2(0.50, 5.0)

    // A. Đệm đá Ballast đường sắt (Crushed Stone Ballast Embankment sát mặt đất)
    const ballastBed = new THREE.Mesh(
      new THREE.BoxGeometry(flatLen + 1, 0.12, 3.8),
      this.materials.hanoiPavement
    );
    ballastBed.name = 'trainStreetBallastBed';
    ballastBed._isBaseGround = true;
    ballastBed.position.set(flatMidX, 0.06, Z_TRACK);
    ballastBed.receiveShadow = true;
    zoneGroup.add(ballastBed);
    this.colliders.push(ballastBed);

    // Đoạn đệm đá chuyển tiếp lên dốc cầu (-35 -> -30)
    const ballastTrans = new THREE.Mesh(
      new THREE.BoxGeometry(5.05, 0.12, 3.8),
      this.materials.hanoiPavement
    );
    ballastTrans.name = 'trainStreetBallastTrans';
    ballastTrans._isBaseGround = true;
    ballastTrans.position.set(transMidX, 0.31, Z_TRACK);
    ballastTrans.rotation.z = transAngle;
    ballastTrans.receiveShadow = true;
    zoneGroup.add(ballastTrans);
    this.colliders.push(ballastTrans);

    // B. Tà vẹt gỗ (InstancedMesh chuẩn mực)
    const trackTotalLen = 110.0;
    const tieCountZ2 = Math.floor(trackTotalLen / 0.8);
    const tieGeomZ2 = new THREE.BoxGeometry(0.35, 0.16, 2.8);
    const tieMatZ2 = this.materials.woodTie || this.materials.retroWood;
    const tieInstancedZ2 = new THREE.InstancedMesh(tieGeomZ2, tieMatZ2, tieCountZ2);
    tieInstancedZ2.name = 'trainStreetTieInstanced';
    tieInstancedZ2.frustumCulled = false;
    const dummyTie = new THREE.Object3D();
    for (let i = 0; i < tieCountZ2; i++) {
      const tx = -140.0 + i * 0.8;
      const progress = Math.max(0, Math.min(1, (tx - (-35.0)) / 5.0));
      const ty = 0.12 + progress * 0.50; // Chạy sát mặt đất Y = 0.12, rồi dốc lên 0.62 tại X = -30
      const tzAngle = progress > 0 ? transAngle : 0;
      dummyTie.position.set(tx, ty, Z_TRACK);
      dummyTie.rotation.set(0, 0, tzAngle);
      dummyTie.scale.set(1, 1, 1);
      dummyTie.updateMatrix();
      tieInstancedZ2.setMatrixAt(i, dummyTie.matrix);
    }
    zoneGroup.add(tieInstancedZ2);

    // C. Hai ray sắt song song kết nối thẳng vào chân dốc Cầu Long Biên
    const railMatZ2 = this.materials.rustySteel;
    // Đoạn phẳng (X = -140 -> -35)
    const railNorth = new THREE.Mesh(new THREE.BoxGeometry(flatLen + 1, 0.14, 0.12), railMatZ2);
    railNorth.position.set(flatMidX, 0.22, Z_TRACK + 0.5);
    railNorth.castShadow = true;
    railNorth.frustumCulled = false;
    zoneGroup.add(railNorth);

    const railSouth = new THREE.Mesh(new THREE.BoxGeometry(flatLen + 1, 0.14, 0.12), railMatZ2);
    railSouth.position.set(flatMidX, 0.22, Z_TRACK - 0.5);
    railSouth.castShadow = true;
    railSouth.frustumCulled = false;
    zoneGroup.add(railSouth);

    // Đoạn dốc nối tiếp ray lên chân cầu Long Biên (X = -35 -> -30)
    const railTransN = new THREE.Mesh(new THREE.BoxGeometry(5.05, 0.14, 0.12), railMatZ2);
    railTransN.position.set(transMidX, 0.47, Z_TRACK + 0.5);
    railTransN.rotation.z = transAngle;
    railTransN.castShadow = true;
    railTransN.frustumCulled = false;
    zoneGroup.add(railTransN);

    const railTransS = new THREE.Mesh(new THREE.BoxGeometry(5.05, 0.14, 0.12), railMatZ2);
    railTransS.position.set(transMidX, 0.47, Z_TRACK - 0.5);
    railTransS.rotation.z = transAngle;
    railTransS.castShadow = true;
    railTransS.frustumCulled = false;
    zoneGroup.add(railTransS);

    // D. Ván sàn gỗ bảo trì giữa 2 ray (đi bộ an toàn, chống lọt chân)
    const centerWalkwayZ2 = new THREE.Mesh(
      new THREE.BoxGeometry(flatLen + 1, 0.08, 0.92),
      this.materials.retroWood
    );
    centerWalkwayZ2.name = 'trainStreetCenterWalkway';
    centerWalkwayZ2._isBaseGround = true;
    centerWalkwayZ2.frustumCulled = false;
    centerWalkwayZ2.position.set(flatMidX, 0.16, Z_TRACK);
    zoneGroup.add(centerWalkwayZ2);
    this.colliders.push(centerWalkwayZ2);

    const centerTrans = new THREE.Mesh(
      new THREE.BoxGeometry(5.05, 0.08, 0.92),
      this.materials.retroWood
    );
    centerTrans.name = 'trainStreetCenterTrans';
    centerTrans._isBaseGround = true;
    centerTrans.frustumCulled = false;
    centerTrans.position.set(transMidX, 0.41, Z_TRACK);
    centerTrans.rotation.z = transAngle;
    zoneGroup.add(centerTrans);
    this.colliders.push(centerTrans);

    // E. Không gian Cà phê đường tàu: bàn ghế gỗ gập đặt chuẩn xác trên mặt đất (Y = 0.0)
    const tableMat = this.materials.retroWood;
    const stoolMat = new THREE.MeshStandardMaterial({ color: 0x2b382e, roughness: 0.7 });
    const cafeStops = [-45, -55, -68, -82, -98, -112];
    cafeStops.forEach(cx => {
      // Bàn cà phê 2 bên đường sắt (cách tim ray 2.4m, an toàn ngắm tàu)
      for (let side of [-1, 1]) {
        const cz = Z_TRACK + side * 2.4;
        const table = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 0.75), tableMat);
        table.position.set(cx, 0.325, cz); // Đặt khít trên mặt đất Y = 0.0
        table.castShadow = true;
        zoneGroup.add(table);
        this._addBoxObstacle(cx, cz, 0.9, 0.9, 0, 0.85);

        // 2 ghế đẩu
        for (let s of [-0.45, 0.45]) {
          const stool = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), stoolMat);
          stool.position.set(cx + s, 0.175, cz); // Đặt khít trên mặt đất Y = 0.0
          zoneGroup.add(stool);
        }
      }
    });

    // F. Dây cờ hoa & đèn lồng giấy giăng ngang giữa các ngôi nhà phố đường tàu
    for (let lx = -125; lx <= -40; lx += 22) {
      const stringCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(lx, 3.8, 54.0),
        new THREE.Vector3(lx, 3.4, 60.0),
        new THREE.Vector3(lx, 3.8, 66.0)
      ]);
      const stringMesh = new THREE.Mesh(
        new THREE.TubeGeometry(stringCurve, 12, 0.015, 4, false),
        new THREE.MeshBasicMaterial({ color: 0x333333 })
      );
      zoneGroup.add(stringMesh);

      const lanternGeo = new THREE.SphereGeometry(0.16, 8, 8);
      const lanternMat = new THREE.MeshStandardMaterial({
        color: 0xff3b30,
        emissive: 0x881111,
        roughness: 0.4
      });
      const lanternMesh = new THREE.Mesh(lanternGeo, lanternMat);
      lanternMesh.position.set(lx, 3.3, 60.0);
      zoneGroup.add(lanternMesh);
    }

    // 5. CỘT ĐIỆN BÊ TÔNG VÀ ĐÈN ĐƯỜNG PHỐ CỔ
    const poles = [
      { x: -54, z: 58 },
      { x: -80, z: 58 },
      { x: -106, z: 58 }
    ];

    poles.forEach(pos => {
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.55, 9.5, 0.55), this.materials.mossStone);
      pole.position.set(pos.x, 4.75, pos.z);
      pole.castShadow = true;
      zoneGroup.add(pole);
      this._addBoxObstacle(pos.x, pos.z, 0.7, 0.7, 0, 10);
    });

    // 6. BỨC TƯỜNG NGÕ CỤT BÍ MẬT (Mở khóa khi giải xong câu đố 2)
    const secretWallGeo = new THREE.BoxGeometry(0.9, 4.8, 8.0);
    this.secretWallOldQuarter = new THREE.Mesh(secretWallGeo, this.materials.yellowWall);
    this.secretWallOldQuarter.position.set(-78, 2.4, 68);
    this.secretWallOldQuarter.castShadow = true;
    zoneGroup.add(this.secretWallOldQuarter);
    this.colliders.push(this.secretWallOldQuarter);
    this._addBoxObstacle(-78, 68, 1.0, 8.2, 0, 5.0);

    this.worldGroup.add(zoneGroup);
  }

  /**
   * TẠO CÔNG TRÌNH TIỆM CÀ PHÊ TRỨNG & TRÀ SEN TÂY HỒ:
   * Quy chuẩn kiến trúc tường mỏng 0.35m, không gian thông thủy rộng thênh thang 11.3m x 15.3m (cao 4.2m)
   * Quầy bar gỗ lim 5.2m viền đồng thau, 6 phin nhôm nhỏ giọt, kệ trưng bày kịch trần,
   * máy hát đĩa than Gramophone loa kèn đồng cổ, đồng hồ quả lắc sồi, 3 bộ sofa & 4 bàn khảm ốc xà cừ,
   * thảm dệt Đông Dương thổ cẩm 4m x 6m, bình hoa sen Bát Tràng, tủ sách, gác lửng và NPC Bác Ba Cà Phê
   */
  _createEggCoffeeShop(x, z) {
    const shopGroup = new THREE.Group();
    shopGroup.position.set(x, 0, z);

    const w = 12.0;
    const d = 16.0;
    const h = 4.2; // Chiều cao thông thủy tầng 1 chuẩn kiến trúc

    // 1. TƯỜNG BAO MỎNG CHUẨN KIẾN TRÚC (DÀY 0.35M) - KHÔNG GIAN BÊN TRONG RỘNG THÊNH THANG 11.3M X 15.3M
    const wallThick = 0.35;

    // Tường trái (x = -w/2 + wallThick/2 = -5.825)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, d), this.materials.yellowWall);
    leftWall.position.set(-w / 2 + wallThick / 2, h / 2, 0);
    leftWall.castShadow = true;
    shopGroup.add(leftWall);
    this._addBoxObstacle(x - w / 2 + wallThick / 2, z, wallThick + 0.05, d, 0, h + 2);

    // Tường phải (x = w/2 - wallThick/2 = 5.825)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, d), this.materials.yellowWall);
    rightWall.position.set(w / 2 - wallThick / 2, h / 2, 0);
    rightWall.castShadow = true;
    shopGroup.add(rightWall);
    this._addBoxObstacle(x + w / 2 - wallThick / 2, z, wallThick + 0.05, d, 0, h + 2);

    // Tường sau (bức tường đặc kiên cố quay vào trong ngõ ở z = -d/2 + wallThick/2 = -7.825)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(w - wallThick * 2, h, wallThick), this.materials.yellowWall);
    backWall.position.set(0, h / 2, -d / 2 + wallThick / 2);
    backWall.castShadow = true;
    shopGroup.add(backWall);
    this._addBoxObstacle(x, z - d / 2 + wallThick / 2, w - wallThick * 2, wallThick + 0.05, 0, h + 2);

    // Tường trước (mặt tiền đón khách hướng ra đường tàu z = d/2 - wallThick/2 = +7.825)
    // Chừa khoảng cửa vào ở giữa rộng 2.8m, cao 3.0m
    const doorW = 2.8;
    const doorH = 3.0;
    const frontSideW = (w - doorW - wallThick * 2) / 2; // ~4.25m mỗi bên

    const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(frontSideW, h, wallThick), this.materials.yellowWall);
    frontLeft.position.set(-doorW / 2 - frontSideW / 2, h / 2, d / 2 - wallThick / 2);
    frontLeft.castShadow = true;
    shopGroup.add(frontLeft);
    this._addBoxObstacle(x - doorW / 2 - frontSideW / 2, z + d / 2 - wallThick / 2, frontSideW + 0.05, wallThick + 0.05, 0, h + 2);

    const frontRight = new THREE.Mesh(new THREE.BoxGeometry(frontSideW, h, wallThick), this.materials.yellowWall);
    frontRight.position.set(doorW / 2 + frontSideW / 2, h / 2, d / 2 - wallThick / 2);
    frontRight.castShadow = true;
    shopGroup.add(frontRight);
    this._addBoxObstacle(x + doorW / 2 + frontSideW / 2, z + d / 2 - wallThick / 2, frontSideW + 0.05, wallThick + 0.05, 0, h + 2);

    // Lanh-tô trên cửa vào
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorW, h - doorH, wallThick), this.materials.yellowWall);
    lintel.position.set(0, doorH + (h - doorH) / 2, d / 2 - wallThick / 2);
    shopGroup.add(lintel);

    // MÁI NHÀ TRUYỀN THỐNG HÀ NỘI KẾT HỢP CANVA AI VINTAGE (Mặt tiền hướng ra đường tàu facing = 1):
    const roof = this._createTraditionalHanoiRoof(w, d, h, 1);
    shopGroup.add(roof);

    // Biển hiệu tiệm cà phê chữ thư pháp vintage (Ghi rõ bán cà phê trứng, trà sen, hạt hướng dương):
    // Đặt ở mặt tiền ngay TRƯỚC CỬA CHÍNH, nâng cao lên Y = 4.05m trên lanh-tô cửa và trên mái hiên đón khách
    const signBoard = this._createSignboard3D(
      4.2, 1.05,
      'CÀ PHÊ TRỨNG & TRÀ SEN TÂY HỒ',
      'Cà Phê Trứng Nóng • Trà Sen Ướp Gạo • Hướng Dương Rang Tay',
      '#3b2014', '#fce292', '#d4af37'
    );
    signBoard.position.set(0, 4.05, d / 2 + 0.16);
    shopGroup.add(signBoard);

    // Cánh cửa mở tương tác tại lối vào mặt tiền đường tàu
    this._createOpenableDoor(x, z + d / 2, 2.6, 2.8, 'Tiệm Cà Phê Trứng & Trà Sen Tây Hồ', 0x3d2316);

    // 2. NỘI THẤT RỘNG RÃI & PHONG PHÚ ĐẲNG CẤP
    // Sàn gạch bông hoa chanh cổ điển bên trong (Rộng 11.3m x 15.3m)
    const floorTile = new THREE.Mesh(new THREE.PlaneGeometry(w - wallThick * 2, d - wallThick * 2), this.materials.hanoiPavement);
    floorTile.rotation.x = -Math.PI / 2;
    floorTile.position.set(0, 0.04, 0);
    shopGroup.add(floorTile);

    // Tấm thảm dệt Đông Dương (Indochine) thổ cẩm lớn 4.0m x 6.0m trải sàn trung tâm (Texture AI 453KB)
    const carpetMat = this.materials.indochineRug || new THREE.MeshStandardMaterial({ color: 0x6e2b1d, roughness: 0.85 });
    const indochineCarpet = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 6.0), carpetMat);
    indochineCarpet.rotation.x = -Math.PI / 2;
    indochineCarpet.position.set(0, 0.05, -0.5);
    shopGroup.add(indochineCarpet);

    // QUẦY BAR TRUNG TÂM GỖ LIM DÀI 5.2M VIỀN ĐỒNG THAU (Tại z = -4.2 phía tường sau)
    const barGroup = new THREE.Group();
    barGroup.position.set(0, 0, -4.2);

    const barCounter = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.05, 1.1), this.materials.woodVarnish || this.materials.retroWood);
    barCounter.position.y = 0.525;
    barCounter.castShadow = true;
    barGroup.add(barCounter);

    // Viền đồng thau sáng bóng bo quanh mặt quầy
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
    const brassTrim = new THREE.Mesh(new THREE.BoxGeometry(5.26, 0.05, 1.16), brassMat);
    brassTrim.position.y = 1.05;
    barGroup.add(brassTrim);

    // 6 Phin nhôm nhỏ giọt và cốc thủy tinh đựng kem trứng béo ngậy vàng óng
    const aluMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.85, roughness: 0.25 });
    const eggCreamMat = new THREE.MeshStandardMaterial({ color: 0xf5c842, roughness: 0.3 });
    const glassCupMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, roughness: 0.1 });

    const phinOffsets = [-2.0, -1.2, -0.4, 0.4, 1.2, 2.0];
    phinOffsets.forEach(po => {
      const phinBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.22, 12), aluMat);
      phinBase.position.set(po, 1.18, 0.15);
      barGroup.add(phinBase);

      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.15, 10), glassCupMat);
      cup.position.set(po + 0.22, 1.14, 0.15);
      barGroup.add(cup);

      const cream = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.04, 10), eggCreamMat);
      cream.position.set(po + 0.22, 1.20, 0.15);
      barGroup.add(cream);
    });

    shopGroup.add(barGroup);
    this._addBoxObstacle(x, z - 4.2, 5.4, 1.3, 0, 1.5); // AABB Obstacle quầy bar

    // KỆ TỦ TRƯNG BÀY TRÀ & CÀ PHÊ KỊCH TRẦN (Sau lưng quầy bar tại tường sau, cao 3.8m, dài 5.4m)
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(0, 0, -d / 2 + wallThick + 0.25);

    const shelfFrame = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.8, 0.45), this.materials.retroWood);
    shelfFrame.position.y = 1.9;
    shelfGroup.add(shelfFrame);

    // Các hũ thủy tinh hạt cà phê Robusta, Arabica & hũ gốm sen Tây Hồ
    for (let f = 1; f <= 4; f++) {
      const shelfY = f * 0.85;
      for (let j = -2.2; j <= 2.2; j += 0.8) {
        const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 8), glassCupMat);
        jar.position.set(j, shelfY, 0.15);
        shelfGroup.add(jar);
      }
    }
    shopGroup.add(shelfGroup);
    this._addBoxObstacle(x, z - d / 2 + wallThick + 0.25, 5.5, 0.6, 0, 4.2);

    // MÁY HÁT ĐĨA THAN LOA KÈN ĐỒNG CỔ (GRAMOPHONE) ĐẶT TRÊN ĐÔN GỖ (Dọc tường trái)
    const gramoGroup = new THREE.Group();
    gramoGroup.position.set(-w / 2 + wallThick + 1.2, 0, 0.8);

    const standPedestal = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), this.materials.retroWood);
    standPedestal.position.y = 0.4;
    gramoGroup.add(standPedestal);

    const gramoBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.5), this.materials.retroWood);
    gramoBox.position.y = 0.89;
    gramoGroup.add(gramoBox);

    const vinyl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.01, 16), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    vinyl.position.y = 0.99;
    gramoGroup.add(vinyl);

    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.65, 16), brassMat);
    horn.position.set(0.15, 1.35, 0);
    horn.rotation.z = -Math.PI / 3;
    horn.rotation.y = Math.PI / 4;
    gramoGroup.add(horn);

    shopGroup.add(gramoGroup);
    this._addBoxObstacle(x - w / 2 + wallThick + 1.2, z + 0.8, 1.0, 1.0, 0, 2.0);

    // Điểm tương tác bật máy hát đĩa than cổ (Audio Gramophone)
    this.interactables.push({
      position: new THREE.Vector3(x - w / 2 + wallThick + 1.2, 0.5, z + 0.8),
      radius: 2.2,
      promptText: 'Bật Máy Hát Đĩa Than Cổ (Nhạc Hoài Niệm)',
      actionKey: 'E',
      onInteract: () => {
        try {
          const audio = new Audio('assets/audio/gramophone_melody.mp3');
          audio.volume = 0.8;
          audio.play().catch(() => {});
          if (this.eventBus) {
            this.eventBus.emit('CORE:ZONE_ENTERED', {
              zoneName: 'Tiệm Cà Phê Trứng • Giai Điệu Máy Hát Cổ',
              description: 'Âm sắc mộc mạc từ chiếc đĩa than xoay tròn ngân vang không gian phố cổ...'
            });
          }
        } catch {}
      }
    });

    // ĐỒNG HỒ QUẢ LẮC ĐỨNG BẰNG GỖ SỒI (Dọc tường phải)
    const clockGroup = new THREE.Group();
    clockGroup.position.set(w / 2 - wallThick - 0.8, 0, 0.8);

    const clockBody = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.4, 0.45), this.materials.woodVarnish || this.materials.retroWood);
    clockBody.position.y = 1.2;
    clockGroup.add(clockBody);

    const pendulum = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12), brassMat);
    pendulum.position.set(0, 1.0, 0.2);
    clockGroup.add(pendulum);

    shopGroup.add(clockGroup);
    this._addBoxObstacle(x + w / 2 - wallThick - 0.8, z + 0.8, 0.8, 0.6, 0, 2.6);

    // Điểm tương tác lắng nghe nhịp đồng hồ quả lắc
    this.interactables.push({
      position: new THREE.Vector3(x + w / 2 - wallThick - 0.8, 0.5, z + 0.8),
      radius: 2.2,
      promptText: 'Lắng Nghe Nhịp Đập Thời Gian Quả Lắc Gỗ Sồi',
      actionKey: 'E',
      onInteract: () => {
        try {
          const audio = new Audio('assets/audio/clock_pendulum.mp3');
          audio.volume = 0.85;
          audio.play().catch(() => {});
        } catch {}
      }
    });

    // 3 BỘ SOFA BỌC NỈ RÊU / DA NÂU CỔ ĐIỂN
    // Bộ sofa 1 (Nỉ nhung xanh rêu - Phía trước bên trái)
    const mossVelvetMat = new THREE.MeshStandardMaterial({ color: 0x3d5a3e, roughness: 0.8 });
    const sofa1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 0.85), mossVelvetMat);
    sofa1.position.set(-3.5, 0.375, 3.8);
    shopGroup.add(sofa1);
    const tableS1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.42, 0.65), this.materials.retroWood);
    tableS1.position.set(-3.5, 0.21, 2.5);
    shopGroup.add(tableS1);
    this._addBoxObstacle(x - 3.5, z + 3.1, 2.4, 2.0, 0, 1.0);

    // Bộ sofa 2 (Da nâu cổ điển - Phía trước bên phải)
    const brownLeatherMat = new THREE.MeshStandardMaterial({ color: 0x54321d, roughness: 0.65 });
    const sofa2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 0.85), brownLeatherMat);
    sofa2.position.set(3.5, 0.375, 3.8);
    shopGroup.add(sofa2);
    const tableS2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.42, 0.65), this.materials.retroWood);
    tableS2.position.set(3.5, 0.21, 2.5);
    shopGroup.add(tableS2);
    this._addBoxObstacle(x + 3.5, z + 3.1, 2.4, 2.0, 0, 1.0);

    // Bộ sofa 3 (Góc tường giữa bên trái)
    const sofa3 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 2.0), brownLeatherMat);
    sofa3.position.set(-w / 2 + wallThick + 0.6, 0.375, -1.8);
    shopGroup.add(sofa3);
    this._addBoxObstacle(x - w / 2 + wallThick + 0.6, z - 1.8, 1.2, 2.2, 0, 1.0);

    // 4 BỘ BÀN TRÒN GỖ GỤ KHẢM ỐC XÀ CỪ KÈM ĐÔN MÂY TRE ĐAN
    const roundTables = [
      { rx: -1.8, rz: -1.4 },
      { rx: 1.8, rz: -1.4 },
      { rx: -1.8, rz: 1.4 },
      { rx: 1.8, rz: 1.4 }
    ];

    const motherOfPearlMat = new THREE.MeshStandardMaterial({ color: 0x362115, roughness: 0.35, metalness: 0.15 });
    const rattanMat = new THREE.MeshStandardMaterial({ color: 0x9e7c53, roughness: 0.85 });

    roundTables.forEach(rt => {
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.68, 16), motherOfPearlMat);
      table.position.set(rt.rx, 0.34, rt.rz);
      shopGroup.add(table);

      // 2 Ghế đôn mây tre đan
      for (let s of [-0.75, 0.75]) {
        const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.42, 12), rattanMat);
        stool.position.set(rt.rx + s, 0.21, rt.rz);
        shopGroup.add(stool);
      }

      // Bình gốm Bát Tràng cắm hoa sen Tây Hồ (Texture AI 64KB)
      const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.28, 8), this.materials.batTrangCeramic || new THREE.MeshStandardMaterial({ color: 0x3a6055, roughness: 0.3 }));
      vase.position.set(rt.rx, 0.82, rt.rz);
      shopGroup.add(vase);

      const lotus = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshStandardMaterial({ color: 0xeb7a9d, roughness: 0.5 }));
      lotus.position.set(rt.rx, 1.02, rt.rz);
      shopGroup.add(lotus);

      this._addBoxObstacle(x + rt.rx, z + rt.rz, 1.8, 1.2, 0, 1.0);
    });

    // TỦ SÁCH GỖ LỚN CHỨA ĐẦY TIỂU THUYẾT & TẬP THƠ HÀ NỘI XƯA
    const bookShelf = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 2.6), this.materials.retroWood);
    bookShelf.position.set(w / 2 - wallThick - 0.25, 1.6, 1.8);
    shopGroup.add(bookShelf);
    this._addBoxObstacle(x + w / 2 - wallThick - 0.25, z + 1.8, 0.6, 2.8, 0, 3.5);

    // CẦU THANG GỖ DẪN LÊN GÁC LỬNG (MEZZANINE) DỌC TƯỜNG TRÁI PHÍA SAU
    const stairX = -w / 2 + wallThick + 0.6;
    for (let st = 0; st < 9; st++) {
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.18, 0.35), this.materials.retroWood);
      stepMesh.position.set(stairX, (st + 1) * 0.24, -1.8 - st * 0.35);
      shopGroup.add(stepMesh);
      this.colliders.push(stepMesh);
    }
    // Sàn gác lửng
    const mezzanine = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 3.6), this.materials.retroWood);
    mezzanine.position.set(-w / 2 + wallThick + 1.6, 2.4, -5.2);
    shopGroup.add(mezzanine);
    this.colliders.push(mezzanine);
    this._addBoxObstacle(x - w / 2 + wallThick + 1.6, z - 5.2, 3.4, 3.8, 0, 2.3);

    // ĐÈN CHÙM ĐỒNG THẢ TRẦN & 8 ĐÈN RỌI SPOTLIGHT VÀNG ẤM
    const chandelier = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.2, 0.4, 8), brassMat);
    chandelier.position.set(0, h - 0.3, 0.0);
    shopGroup.add(chandelier);

    const mainLight = new THREE.PointLight(0xffd580, 2.4, 9);
    mainLight.position.set(0, h - 0.5, 0.0);
    shopGroup.add(mainLight);

    // 3. NPC BÁC BA CÀ PHÊ (Đứng sau quầy bar tại tường sau tiếp đón khách)
    const hostNpc = this._createCitizenNPC(0, -5.6, 0x5a3923, 'kính lão');
    shopGroup.add(hostNpc);
    this._addNpcCollider(x, z - 5.6, 0.65);

    // Điểm tương tác nói chuyện với Bác Ba Cà Phê
    this.interactables.push({
      position: new THREE.Vector3(x, 0.5, z - 2.8),
      radius: 2.8,
      promptText: 'Thưởng thức Cà Phê Trứng & Trò Chuyện',
      actionKey: 'E',
      onInteract: () => {
        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Bác Ba &bull; Cà Phê Trứng Cổ Điển',
            role: 'Chủ quán cà phê phố cổ từ năm 1946',
            avatar: '☕',
            greeting: '"Mời bạn lãng tử vào quán! Trời se lạnh thế này, uống một tách cà phê trứng đánh bông béo ngậy hay nhấp ngụm trà sen ấm lòng lắm đấy."',
            monumentTitle: 'Nét Đẹp Ẩm Thực Cà Phê Trứng & Trà Sen Hà Nội',
            historyText: `
              <p><strong>Cà phê trứng Hà Nội:</strong> Ra đời từ những năm 1946 tại phố cổ. Khi ấy sữa tươi và sữa đặc vô cùng khan hiếm, cụ Giảng – một người pha chế tài hoa tại khách sạn Metropole – đã sáng tạo nên cách dùng lòng đỏ trứng gà tươi đánh bông cùng đường và sữa để thay thế, tạo nên lớp bọt kem vàng óng mịn màng, phủ lên nền cà phê đen phin nóng hổi đậm đà.</p>
              <p><strong>Trà Sen Tây Hồ:</strong> Được mệnh danh là "Thiên cổ đệ nhất trà". Mỗi ấm trà quý phải cần tới hàng nghìn bông sen bách diệp hái từ sáng sớm tinh sương trên mặt Hồ Tây để lấy từng hạt gạo sen ướp hương kỳ công qua nhiều lần.</p>
            `,
            dialogueOptions: [
              { text: 'Bác ơi, bí quyết đánh bông kem trứng là gì vậy?', reply: 'Trứng gà phải thật tươi, đánh thật đều tay đến khi kem dẻo mịn bồng bềnh như mây, rồi rót chậm rãi lên dòng cà phê phin sôi sục!' },
              { text: 'Nghe nói quán mình có chiếc đài cassette và máy hát cổ?', reply: 'Chiếc máy hát loa kèn đồng này bác giữ từ đầu thế kỷ trước, ngày nào cũng phát nhạc Trịnh Công Sơn và Văn Cao cho khách nghe thư thái tâm hồn.' }
            ],
            shopItems: [
              { name: 'Tách Cà Phê Trứng Nóng Hổi', price: '25 Xu', desc: 'Lớp kem trứng béo ngậy ngọt ngào hòa quyện cà phê đậm đà', icon: '☕' },
              { name: 'Ấm Trà Sen Bách Diệp Tây Hồ', price: '20 Xu', desc: 'Hương sen thơm ngát thanh khiết, giải tỏa mệt mỏi', icon: '🍵' },
              { name: 'Đĩa Bánh Đậu Xanh Rồng Vàng', price: '15 Xu', desc: 'Thức quà ngọt dịu tan trên đầu lưỡi khi nhấp ngụm chè', icon: '🥮' }
            ]
          });
        }
      }
    });

    return shopGroup;
  }

  /**
   * TẠO CÔNG TRÌNH CỬA HÀNG BÁCH HÓA MẬU DỊCH THỜI BAO CẤP:
   * Quy chuẩn kiến trúc tường mỏng 0.35m, không gian thông thủy rộng thênh thang 11.3m x 15.3m (cao 4.2m)
   * Sàn gạch bông hoa chanh, 3 dãy kệ gỗ thông & thép chất đầy ca tráng men, phích Rạng Đông, hộp bánh quy Hải Châu, súc vải hoa,
   * bàn quầy thu ngân phân phối với cân đĩa đồng & bàn tính gỗ, đài Radio Cassette VEF-206, quạt tai voi,
   * xe đạp Thống Nhất khung nam màu xanh bộ đội, tranh cổ động, tem phiếu và Cô Mậu Dịch Viên
   */
  _createBaoCapStore(x, z) {
    const storeGroup = new THREE.Group();
    storeGroup.position.set(x, 0, z);

    const w = 12.0;
    const d = 16.0;
    const h = 4.2;
    const wallThick = 0.35;

    // 1. TƯỜNG BAO MỎNG CHUẨN KIẾN TRÚC (DÀY 0.35M)
    // Tường trái
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, d), this.materials.yellowWall);
    leftWall.position.set(-w / 2 + wallThick / 2, h / 2, 0);
    leftWall.castShadow = true;
    storeGroup.add(leftWall);
    this._addBoxObstacle(x - w / 2 + wallThick / 2, z, wallThick + 0.05, d, 0, h + 2);

    // Tường phải
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, d), this.materials.yellowWall);
    rightWall.position.set(w / 2 - wallThick / 2, h / 2, 0);
    rightWall.castShadow = true;
    storeGroup.add(rightWall);
    this._addBoxObstacle(x + w / 2 - wallThick / 2, z, wallThick + 0.05, d, 0, h + 2);

    // Tường sau (z = -d/2 + wallThick/2 = -7.825)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(w - wallThick * 2, h, wallThick), this.materials.yellowWall);
    backWall.position.set(0, h / 2, -d / 2 + wallThick / 2);
    backWall.castShadow = true;
    storeGroup.add(backWall);
    this._addBoxObstacle(x, z - d / 2 + wallThick / 2, w - wallThick * 2, wallThick + 0.05, 0, h + 2);

    // Tường trước (mặt tiền đón khách hướng ra đường tàu z = d/2 - wallThick/2 = +7.825)
    // Chừa khoảng cửa vào ở giữa rộng 2.8m, cao 3.0m
    const doorW = 2.8;
    const doorH = 3.0;
    const frontSideW = (w - doorW - wallThick * 2) / 2;

    const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(frontSideW, h, wallThick), this.materials.yellowWall);
    frontLeft.position.set(-doorW / 2 - frontSideW / 2, h / 2, d / 2 - wallThick / 2);
    frontLeft.castShadow = true;
    storeGroup.add(frontLeft);
    this._addBoxObstacle(x - doorW / 2 - frontSideW / 2, z + d / 2 - wallThick / 2, frontSideW + 0.05, wallThick + 0.05, 0, h + 2);

    const frontRight = new THREE.Mesh(new THREE.BoxGeometry(frontSideW, h, wallThick), this.materials.yellowWall);
    frontRight.position.set(doorW / 2 + frontSideW / 2, h / 2, d / 2 - wallThick / 2);
    frontRight.castShadow = true;
    storeGroup.add(frontRight);
    this._addBoxObstacle(x + doorW / 2 + frontSideW / 2, z + d / 2 - wallThick / 2, frontSideW + 0.05, wallThick + 0.05, 0, h + 2);

    // Lanh-tô trên cửa
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorW, h - doorH, wallThick), this.materials.yellowWall);
    lintel.position.set(0, doorH + (h - doorH) / 2, d / 2 - wallThick / 2);
    storeGroup.add(lintel);

    // MÁI NHÀ TRUYỀN THỐNG HÀ NỘI KẾT HỢP CANVA AI VINTAGE (Mặt tiền hướng ra đường tàu facing = 1):
    const roof = this._createTraditionalHanoiRoof(w, d, h, 1);
    storeGroup.add(roof);

    // Biển hiệu đỏ chữ vàng Bách Hóa Mậu Dịch (Ghi rõ phân phối lương thực, tem phiếu, nhu yếu phẩm):
    // Đặt ở mặt tiền ngay TRƯỚC CỬA CHÍNH, nâng cao lên Y = 4.05m trên lanh-tô cửa và trên mái hiên đón khách
    const signBoard = this._createSignboard3D(
      4.4, 1.05,
      'BÁCH HÓA MẬU DỊCH SỐ 18',
      'Phân Phối Lương Thực • Tem Phiếu • Đồ Gia Dụng • Dầu Hỏa',
      '#991b1b', '#fde047', '#facc15'
    );
    signBoard.position.set(0, 4.05, d / 2 + 0.16);
    storeGroup.add(signBoard);

    // Cánh cửa mở tương tác tại lối vào mặt tiền đường tàu
    this._createOpenableDoor(x, z + d / 2, 2.6, 2.8, 'Cửa Hàng Bách Hóa Mậu Dịch Số 18', 0x2e1a12);

    // 2. NỘI THẤT RỘNG THÊNH THANG 11.3M X 15.3M THỜI BAO CẤP
    const floorTile = new THREE.Mesh(new THREE.PlaneGeometry(w - wallThick * 2, d - wallThick * 2), this.materials.hanoiPavement);
    floorTile.rotation.x = -Math.PI / 2;
    floorTile.position.set(0, 0.04, 0);
    storeGroup.add(floorTile);

    // 2 DÃY KỆ GỖ THÔNG VÀ THÉP SƠN XÁM CHẠY DỌC HAI BÊN TƯỜNG (Dãy trái, Dãy phải - Hành lang giữa rộng 6.0m)
    const shelfAisleX = [-3.5, 3.5];
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x5a5f66, roughness: 0.6, metalness: 0.3 });
    const enamelMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3 }); // Ca tráng men trắng hoa hải đường
    const thermosMat = this.materials.rangDongThermos || new THREE.MeshStandardMaterial({ color: 0x1b708b, metalness: 0.4, roughness: 0.3 }); // Phích Rạng Đông (Texture AI 53KB)
    const tinBoxMat = new THREE.MeshStandardMaterial({ color: 0xc43d31, metalness: 0.5, roughness: 0.4 }); // Hộp bích quy Hải Châu
    const fabricMat = new THREE.MeshStandardMaterial({ color: 0x4a7a8c, roughness: 0.9 }); // Súc vải hoa

    shelfAisleX.forEach(ax => {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.6, 6.8), shelfMat);
      rack.position.set(ax, 1.3, -0.6);
      rack.castShadow = true;
      storeGroup.add(rack);

      // Trưng bày hiện vật trên các tầng kệ
      for (let lvl = 0.5; lvl <= 2.2; lvl += 0.8) {
        for (let rz = -2.8; rz <= 2.8; rz += 1.4) {
          // Ca tráng men
          const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 10), enamelMat);
          cup.position.set(ax - 0.2, lvl + 0.15, -0.6 + rz);
          storeGroup.add(cup);

          // Phích Rạng Đông
          const thermos = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.42, 12), thermosMat);
          thermos.position.set(ax + 0.2, lvl + 0.25, -0.6 + rz);
          storeGroup.add(thermos);

          // Hộp bích quy thiếc
          const tinBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.24), tinBoxMat);
          tinBox.position.set(ax, lvl + 0.14, -0.6 + rz + 0.5);
          storeGroup.add(tinBox);
        }
      }

      this._addBoxObstacle(x + ax, z - 0.6, 1.0, 7.0, 0, 2.8); // Obstacle từng dãy kệ (chừa hành lang rộng thênh thang 2.4m)
    });

    // BÀN QUẦY THU NGÂN PHÂN PHỐI MẬU DỊCH VIÊN (Ngang phòng tại z = -4.8 phía tường sau)
    const counterDesk = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.05, 1.2), this.materials.woodVarnish || this.materials.retroWood);
    counterDesk.position.set(0, 0.525, -4.8);
    counterDesk.castShadow = true;
    storeGroup.add(counterDesk);
    this._addBoxObstacle(x, z - 4.8, 6.0, 1.3, 0, 1.5);

    // Chiếc cân đĩa đồng cổ có bộ quả cân sắt
    const brassScaleMat = new THREE.MeshStandardMaterial({ color: 0xc49a45, metalness: 0.85, roughness: 0.25 });
    const scaleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.08, 12), brassScaleMat);
    scaleBase.position.set(-1.2, 1.09, -4.8);
    storeGroup.add(scaleBase);
    const scalePole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.38, 8), brassScaleMat);
    scalePole.position.set(-1.2, 1.28, -4.8);
    storeGroup.add(scalePole);

    // Bàn tính gảy bằng gỗ kêu lách cách
    const abacus = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.28), this.materials.retroWood);
    abacus.position.set(-0.3, 1.08, -4.8);
    storeGroup.add(abacus);

    // ĐÀI RADIO CASSETTE LIÊN XÔ VEF-206
    const radioVef = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.32, 0.22), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.5 }));
    radioVef.position.set(1.4, 1.21, -4.8);
    storeGroup.add(radioVef);

    // QUẠT TAI VOI LIÊN XÔ CÁNH CAO SU DẺO XANH NGỌC
    const fanBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.25, 12), new THREE.MeshStandardMaterial({ color: 0x4a7c6d, roughness: 0.4 }));
    fanBase.position.set(2.2, 1.18, -4.8);
    storeGroup.add(fanBase);

    // XE ĐẠP THỐNG NHẤT KHUNG NAM MÀU XANH BỘ ĐỘI DỰNG GÓC PHÒNG DANH DỰ (Gần lối vào)
    const bikeGroup = new THREE.Group();
    bikeGroup.position.set(-w / 2 + wallThick + 1.2, 0, 3.2);
    bikeGroup.rotation.y = 0.4;
    const armyGreenMat = new THREE.MeshStandardMaterial({ color: 0x2e4a2d, roughness: 0.55, metalness: 0.3 });
    const bikeFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.05), armyGreenMat);
    bikeFrame.position.y = 0.75;
    bikeGroup.add(bikeFrame);
    for (let bx of [-0.7, 0.7]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.03, 8, 20), new THREE.MeshStandardMaterial({ color: 0x222222 }));
      wheel.position.set(bx, 0.38, 0);
      bikeGroup.add(wheel);
    }
    // Chuông đồng "kính coong"
    const bikeBell = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), brassScaleMat);
    bikeBell.position.set(0.4, 0.95, 0.1);
    bikeGroup.add(bikeBell);

    storeGroup.add(bikeGroup);
    this._addBoxObstacle(x - w / 2 + wallThick + 1.2, z + 3.2, 1.8, 1.0, 0, 1.2);

    // Điểm tương tác rung chuông xe đạp Thống Nhất (Audio Bicycle Bell)
    this.interactables.push({
      position: new THREE.Vector3(x - w / 2 + wallThick + 1.2, 0.5, z + 3.2),
      radius: 2.2,
      promptText: 'Rung Chuông Xe Đạp Thống Nhất Kính Coong',
      actionKey: 'E',
      onInteract: () => {
        try {
          const audio = new Audio('assets/audio/bicycle_bell.mp3');
          audio.volume = 0.85;
          audio.play().catch(() => {});
        } catch {}
      }
    });

    // BÍCH HỌA & TRANH CỔ ĐỘNG THỜI BAO CẤP TRÊN TƯỜNG SAU (Texture AI 300KB)
    const posterMat = this.materials.sovietPoster || new THREE.MeshStandardMaterial({ color: 0xb52b27, roughness: 0.7 });
    const propagandaPoster = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.04), posterMat);
    propagandaPoster.position.set(0, 2.6, -d / 2 + wallThick + 0.03);
    storeGroup.add(propagandaPoster);

    // ĐÈN TUÝP HUỲNH QUANG DÂY XÍCH & BÓNG SỢI ĐỐT VÀNG ẤM
    const tubeLight = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8), new THREE.MeshBasicMaterial({ color: 0xdff0ff }));
    tubeLight.rotation.z = Math.PI / 2;
    tubeLight.position.set(0, h - 0.4, -0.6);
    storeGroup.add(tubeLight);

    const storePointLight = new THREE.PointLight(0xfff0dd, 2.2, 8);
    storePointLight.position.set(0, h - 0.5, -0.6);
    storeGroup.add(storePointLight);

    // 3. NPC CÔ MẬU DỊCH VIÊN (Đứng sau bàn quầy tại tường sau)
    const shopkeeper = this._createCitizenNPC(0, -5.8, 0x1e4b6e, 'áo sơ mi hoa');
    storeGroup.add(shopkeeper);
    this._addNpcCollider(x, z - 5.8, 0.65);

    // Điểm tương tác mua đồ và nghe kể chuyện bao cấp
    this.interactables.push({
      position: new THREE.Vector3(x, 0.5, z - 3.4),
      radius: 2.8,
      promptText: 'Mua Đồ Mậu Dịch & Ký Ức Thời Bao Cấp',
      actionKey: 'E',
      onInteract: () => {
        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Cô Hoa &bull; Mậu Dịch Viên Quốc Doanh',
            role: 'Cán bộ phụ trách quầy vải & văn phòng phẩm số 18',
            avatar: '🏪',
            greeting: '"Chào đồng chí lãng tử! Hôm nay cửa hàng vừa về đợt phim chụp ảnh mới và một số đồ văn phòng phẩm, mời đồng chí vào xem."',
            monumentTitle: 'Ký Ức Thời Bao Cấp & Cửa Hàng Mậu Dịch (1975 - 1986)',
            historyText: `
              <p><strong>Thời kỳ Bao Cấp tại Hà Nội:</strong> Một giai đoạn lịch sử không thể nào quên của Thủ đô. Mọi nhu yếu phẩm từ hạt gạo, lạng thịt, mét vải cho đến chiếc xích xe đạp đều được phân phối theo tiêu chuẩn bằng cuốn <em>Sổ Tem Phiếu</em>.</p>
              <p>Người Hà Nội xếp hàng từ tờ mờ sáng bằng những viên gạch, chiếc làn nhựa hoặc chiếc nón rách để giữ chỗ trước cửa hàng mậu dịch quốc doanh. Dù gian khó nhưng tình người phố xóm luôn nồng hậu, chia ngọt sẻ bùi từng mẩu than tổ ong, biếu nhau ngọn rau tươi.</p>
            `,
            dialogueOptions: [
              { text: 'Cô ơi, thời ấy muốn mua một chiếc xe đạp Thống Nhất có khó không?', reply: 'Khó lắm đồng chí ơi! Chiếc xe đạp Thống Nhất hay Phượng Hoàng thời đó có giá trị như một gia tài, phải tích lũy tem phiếu và bốc thăm nhiều năm mới được phân phối đấy!' },
              { text: 'Cuốn sổ tem phiếu gồm những loại nào vậy cô?', reply: 'Có tem gạo, tem thịt chữ E, chữ N, tem chất đốt và phiếu vải một năm chỉ được vài mét thôi!' }
            ],
            shopItems: [
              { name: 'Cuộn Phim Kodak Portra 35mm', price: '45 Xu', desc: 'Cuộn phim màu ấm áp chuyên ghi lại ký ức phố phường', icon: '🎞️' },
              { name: 'Pin Máy Ảnh Cơ LR44', price: '15 Xu', desc: 'Nguồn năng lượng để đo sáng máy ảnh film', icon: '🔋' },
              { name: 'Sổ Ký Họa Bìa Cứng Phố Cổ', price: '30 Xu', desc: 'Cuốn sổ tay gáy chỉ may thủ công ghi lại cảm xúc', icon: '📓' },
              { name: 'Bộ Bưu Thiếp Ký Ức Hà Nội', price: '10 Xu', desc: 'Hình ảnh đen trắng cầu Long Biên và Tháp Rùa', icon: '📮' }
            ]
          });
        }
      }
    });

    return storeGroup;
  }

  /**
   * Phân khu 3: NHỊP CẦU LONG BIÊN & BÃI BỒI SÔNG HỒNG (Tọa độ x: [0, 250], z: [0, 250])
   */
  /**
   * Phân khu 3: NHỊP CẦU LONG BIÊN & GA LONG BIÊN 1902 (Tọa độ x: [0, 250], z: [0, 250])
   * Tích hợp Ga Long Biên kiểu Pháp, Đoàn tàu hơi nước & Toa Panorama, Tranh Nghệ Thuật Canva 1902
   */
  /**
   * Phân khu 3: ĐẠI DI SẢN CẦU LONG BIÊN & GA LONG BIÊN 1902 (Tọa độ x: [0, 250], z: [0, 250])
   * Tái hiện nguyên bản kỳ quan dầm thép công-xôn Daydé & Pillé 1899-1902 vượt sông Hồng sang Ga Gia Lâm,
   * tích hợp Không gian Mỹ thuật Canva AI Masterpiece, Ga Long Biên Pháp cổ và Đoàn tàu hơi nước hai chiều.
   */
    /**
   * Phân khu 3: ĐẠI DI SẢN CẦU LONG BIÊN & GA LONG BIÊN 1902 (Tọa độ x: [0, 250], z: [0, 250])
   * TÁI HIỆN NGUYÊN BẢN 100% TỪ BẢN DEMO:
   * - Dầm giàn công-xôn Daydé & Pillé 1899 nhấp nhô hình rồng (7 nhịp, cao đỉnh 13.5m, võng 4.0m)
   * - 7 Trụ đá hộc & mũi rẽ nước nhọn upstream / downstream
   * - Sàn cầu đặc kín, tà vẹt gỗ, ván bảo trì, 2 ray sắt, 2 làn bộ hành cánh gà rộng 1.8m, lan can sắt
   * - Ga Long Biên cổ kính: ke ga đá xanh 50m, vạch vàng, mái che sắt hoa văn kiểu Pháp, nhà ga ngói đỏ, biển tên, đồng hồ
   * - Đoàn tàu hơi nước & Toa khách có nội thất chi tiết (ghế nhung mận chín, giá hành lý đồng, vali da, ban công đuôi tàu)
   * - Sông Hồng trũng sâu Y = -1.5m, ngăn cách tuyệt đối với Hồ Gươm bằng Đê Sông Hồng & bờ kè đá cổ (KHÔNG BỊ ĐỎ BẬT LÊN)
   * - Cầu cạn đá vòm cuốn (Vòm đá phố Gầm Cầu / Phùng Hưng) & Dốc dẫn kết nối êm ái từ Phố Cổ lên Ga Long Biên
   */
  _buildZone3LongBien() {
    const zoneGroup = new THREE.Group();
    zoneGroup.name = 'Zone3_LongBien';
    this.zone3Group = zoneGroup;

    // Helper tạo khối dầm hộp theo chuẩn bản demo (Mặc định không castShadow để tối ưu 60 FPS)
    function createBoxBeam(w, h, d, mat, shadow = false) {
      const geom = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = shadow;
      mesh.receiveShadow = shadow;
      return mesh;
    }

    // =========================================================================
    // 1. VẬT LIỆU NGUYÊN BẢN TỪ BẢN DEMO
    // =========================================================================
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x5a3e36, roughness: 0.68, metalness: 0.72 });
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x3d2822, roughness: 0.75, metalness: 0.6 });
    const stonePierMat = new THREE.MeshStandardMaterial({ color: 0x7c7365, roughness: 0.88, metalness: 0.05 });
    const woodTieMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9, metalness: 0.0 });
    const woodPlankMat = new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.85, metalness: 0.05 });
    const steelPlankMat = new THREE.MeshStandardMaterial({ color: 0x473831, roughness: 0.7, metalness: 0.55 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.35, metalness: 0.9 });
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8, metalness: 0.1 });

    const stationWallMat = new THREE.MeshStandardMaterial({ color: 0xd9a74a, roughness: 0.7 });
    const stationRoofMat = new THREE.MeshStandardMaterial({ color: 0x8b3a2b, roughness: 0.75 });
    const stationDoorMat = new THREE.MeshStandardMaterial({ color: 0x1e3a2b, roughness: 0.65 });
    const stationPlatformMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 });
    const stationWoodMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.7 });

    const coachExtMat = new THREE.MeshStandardMaterial({ color: 0x2b1e16, roughness: 0.6 });
    const coachFloorMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.5 });
    const velvetSeatMat = new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.8 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.85 });

    // =========================================================================
    // 2. PHÂN TÁCH HOÀN TOÀN HỒ GƯƠM & SÔNG HỒNG (ĐÊ SÔNG HỒNG & LÒNG SÔNG TRŨNG)
    // Sông Hồng nằm trũng ở Y = -1.5m, tuyệt đối không có mặt phẳng đỏ ở mặt đất!
    // =========================================================================
    // Mặt nước Sông Hồng phù sa đỏ sẫm tự nhiên nằm dưới lòng sông (x: 75 -> 280, z: 0 -> 250, Y = -1.5)
    const riverGeo = new THREE.PlaneGeometry(210, 260);
    riverGeo.rotateX(-Math.PI / 2);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x7a3a24,
      roughness: 0.25,
      metalness: 0.65,
      transparent: true,
      opacity: 0.94
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.position.set(180.0, -1.5, 125.0);
    zoneGroup.add(riverMesh);

    // BỜ KÈ ĐÊ SÔNG HỒNG LỊCH SỬ (Đê Trần Nhật Duật / Yên Phụ) tại x = 75.0, chạy suốt z = 0 -> 250
    // Ngăn cách hoàn toàn thành phố và Hồ Gươm với lòng Sông Hồng
    const dikeBody = createBoxBeam(8.0, 3.5, 260.0, stonePierMat);
    dikeBody.name = 'dikeBody';
    dikeBody._isBaseGround = true;
    dikeBody.position.set(75.0, 0.25, 125.0);
    zoneGroup.add(dikeBody);
    this.colliders.push(dikeBody);

    // Mái dốc đê cỏ xanh phía sông (Grass Dike Slope)
    const dikeSlopeGeo = new THREE.BoxGeometry(10.0, 0.5, 260.0);
    const dikeGrassMat = new THREE.MeshStandardMaterial({ color: 0x4a5d3e, roughness: 0.95 });
    const dikeSlope = new THREE.Mesh(dikeSlopeGeo, dikeGrassMat);
    dikeSlope.name = 'dikeSlope';
    dikeSlope._isBaseGround = true;
    dikeSlope.position.set(81.0, -0.65, 125.0);
    dikeSlope.rotation.z = -0.32;
    zoneGroup.add(dikeSlope);
    this.colliders.push(dikeSlope);

    // Bãi bồi phù sa Bãi Giữa sông Hồng nhô lên giữa lòng sông (x: 135 -> 195, z: 20 -> 230, Y = -0.5)
    const sandGeo = new THREE.BoxGeometry(60.0, 1.2, 210.0);
    const sandMat = new THREE.MeshStandardMaterial({ color: 0x937047, roughness: 0.95 });
    const sandMesh = new THREE.Mesh(sandGeo, sandMat);
    sandMesh.name = 'sandMesh';
    sandMesh._isBaseGround = true;
    sandMesh.position.set(165.0, -1.0, 125.0);
    sandMesh.receiveShadow = true;
    zoneGroup.add(sandMesh);
    this.colliders.push(sandMesh);

    // Bụi lau sậy và chuối xanh Bãi Giữa
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x4d6837, roughness: 0.9 });
    for (let rx = 140; rx <= 190; rx += 14) {
      for (let rz = 30; rz <= 220; rz += 22) {
        const reed = new THREE.Mesh(new THREE.ConeGeometry(1.2, 3.2, 6), reedMat);
        reed.position.set(rx + Math.sin(rz) * 2, 0.5, rz);
        zoneGroup.add(reed);
      }
    }

    // =========================================================================
    // 3. ĐƯỜNG DẪN LÊN CẦU LONG BIÊN & CẦU CẠN ĐÁ VÒM CUỐN (WEST APPROACH & VIADUCT)
    // Đường dẫn đá thoai thoải, rộng rãi, chắc chắn kết nối êm ái từ Phố Cổ lên Ga Long Biên
    // Thiết kế chuẩn mực, dốc êm, phủ kín không gian không có hở gầm, triệt tiêu 100% lỗi đi xuyên
    // =========================================================================
    const viaductMat = this.materials.agedBrick || stonePierMat;
    const rampLen = 50.0; // Từ X = -30.0 đến X = 20.0 (Dốc thoai thoải tự nhiên 50m)
    const rampRise = 10.85 - 0.5; // 10.35m
    const rampHypot = Math.hypot(rampLen, rampRise);
    const rampAngle = Math.atan2(rampRise, rampLen);
    const roadWidth = 12.0; // Phủ từ Z = 55.0 đến Z = 67.0 (tâm Z = 61.0)

    // Mặt đường bộ hành đá nguyên khối (Roadway Deck)
    // Độ dày 0.6m, tâm hạ nhẹ 0.29m để mặt sàn trên cùng đúng chuẩn Y = rampY từ 0.5m lên 10.85m
    const approachRoad = createBoxBeam(rampHypot, 0.6, roadWidth, stonePierMat);
    approachRoad.name = 'approachRoad';
    approachRoad._isBaseGround = true;
    approachRoad.position.set(-30.0 + rampLen / 2, 0.5 + rampRise / 2 - 0.29, 61.0);
    approachRoad.rotation.z = rampAngle;
    zoneGroup.add(approachRoad);
    this.colliders.push(approachRoad);

    // Helper tạo khối geometry đã biến đổi tọa độ (Zero draw calls overhead)
    const dummy = new THREE.Object3D();
    function getTransformedBox(w, h, d, pos, rot, lookTarget, preRotY) {
      const geom = new THREE.BoxGeometry(w, h, d);
      dummy.position.copy(pos);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      if (rot) {
        if (rot.x) dummy.rotation.x = rot.x;
        if (rot.y) dummy.rotation.y = rot.y;
        if (rot.z) dummy.rotation.z = rot.z;
      }
      if (lookTarget) {
        dummy.lookAt(lookTarget);
        if (preRotY) dummy.rotateY(preRotY);
      }
      dummy.updateMatrix();
      geom.applyMatrix4(dummy.matrix);
      return geom;
    }

    // Móng đá đặc và các vòm đá cầu cạn đỡ phía dưới dốc dẫn (chống rỗng gầm, không thể đi lọt dưới)
    const viaductPillarGeoms = [];
    for (let vx = -26; vx <= 16; vx += 5) {
      const t = Math.max(0, Math.min(1, (vx - (-30.0)) / rampLen));
      const curH = Math.max(0.8, t * rampRise);
      const g = getTransformedBox(3.0, curH, roadWidth - 0.4, new THREE.Vector3(vx, 0.5 + curH / 2 - 0.3, 61.0));
      viaductPillarGeoms.push(g);
    }
    const mergedViaductPillars = BufferGeometryUtils.mergeGeometries(viaductPillarGeoms, false);
    const viaductPillarsMesh = new THREE.Mesh(mergedViaductPillars, viaductMat);
    viaductPillarsMesh.name = 'viaductPillarsMesh';
    viaductPillarsMesh._isBaseGround = true;
    zoneGroup.add(viaductPillarsMesh);
    this.colliders.push(viaductPillarsMesh);

    // Lan can đá bảo vệ hai bên dốc dẫn (Parapet walls)
    // Mạn Bắc (Z = 67.0):
    const guardNorth = createBoxBeam(rampHypot, 1.2, 0.5, stonePierMat);
    guardNorth.position.set(-30.0 + rampLen / 2, 0.5 + rampRise / 2 + 0.5, 67.0);
    guardNorth.rotation.z = rampAngle;
    zoneGroup.add(guardNorth);

    // Mạn Nam (Z = 55.0):
    const guardSouth = createBoxBeam(rampHypot, 1.2, 0.5, stonePierMat);
    guardSouth.position.set(-30.0 + rampLen / 2, 0.5 + rampRise / 2 + 0.5, 55.0);
    guardSouth.rotation.z = rampAngle;
    zoneGroup.add(guardSouth);

    // Phân đoạn vật cản lan can theo độ dốc thực tế (5 đoạn x 10m):
    // Triệt tiêu hoàn toàn khối hộp ảo 13m che tầm nhìn và làm giật camera/khựng bước chân
    const segCount = 5;
    const segLen = rampLen / segCount;
    for (let k = 0; k < segCount; k++) {
      const segMidX = -30.0 + (k + 0.5) * segLen;
      const t = (segMidX - (-30.0)) / rampLen;
      const segFloorY = 0.5 + t * rampRise;
      // Lan can mạn Bắc & Nam cao 1.2m theo mặt sàn thực tế tại từng đoạn
      this._addBoxObstacle(segMidX, 67.0, segLen + 0.2, 0.8, segFloorY - 0.4, segFloorY + 1.6);
      this._addBoxObstacle(segMidX, 55.0, segLen + 0.2, 0.8, segFloorY - 0.4, segFloorY + 1.6);
    }

    // Thềm đá tiếp giáp êm ái dưới chân dốc dẫn tại Phố Cổ (X = -32.0 -> -30.0)
    const rampApron = createBoxBeam(3.0, 0.2, roadWidth, stonePierMat);
    rampApron.name = 'rampApron';
    rampApron._isBaseGround = true;
    rampApron.position.set(-31.5, 0.5, 61.0);
    zoneGroup.add(rampApron);
    this.colliders.push(rampApron);

    // =========================================================================
    // ĐƯỜNG SẮT NỐI DÀI TRÊN DỐC DẪN (Tà vẹt gỗ & 2 Ray sắt đồng bộ từ Phố Cổ lên Cầu Long Biên)
    // =========================================================================
    const rampTieCount = Math.floor(rampHypot / 0.8);
    const rampTieGeom = new THREE.BoxGeometry(0.35, 0.22, 2.8);
    const rampTieInstanced = new THREE.InstancedMesh(rampTieGeom, woodTieMat, rampTieCount);
    rampTieInstanced.name = 'rampTieInstanced';
    rampTieInstanced.frustumCulled = false;
    for (let i = 0; i < rampTieCount; i++) {
      const s = i * 0.8;
      const tx = -30.0 + s * Math.cos(rampAngle);
      const ty = 0.5 + s * Math.sin(rampAngle) + 0.12;
      dummy.position.set(tx, ty, 60.0);
      dummy.rotation.set(0, 0, rampAngle);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      rampTieInstanced.setMatrixAt(i, dummy.matrix);
    }
    zoneGroup.add(rampTieInstanced);

    // Hai ray sắt trên dốc dẫn (song song, cách nhau 1.0m tại Z = 59.5 và Z = 60.5)
    const rampRailN = createBoxBeam(rampHypot, 0.18, 0.12, steelPlankMat);
    rampRailN.position.set(-30.0 + rampLen / 2, 0.5 + rampRise / 2 + 0.24, 60.5);
    rampRailN.rotation.z = rampAngle;
    rampRailN.frustumCulled = false;
    zoneGroup.add(rampRailN);

    const rampRailS = createBoxBeam(rampHypot, 0.18, 0.12, steelPlankMat);
    rampRailS.position.set(-30.0 + rampLen / 2, 0.5 + rampRise / 2 + 0.24, 59.5);
    rampRailS.rotation.z = rampAngle;
    rampRailS.frustumCulled = false;
    zoneGroup.add(rampRailS);

    // Ván sàn gỗ bảo trì giữa 2 ray trên dốc dẫn (chống hụt chân, đi lại êm ái)
    const rampCenterPlank = createBoxBeam(rampHypot, 0.12, 0.92, woodPlankMat);
    rampCenterPlank.name = 'rampCenterPlank';
    rampCenterPlank._isBaseGround = true;
    rampCenterPlank.frustumCulled = false;
    rampCenterPlank.position.set(-30.0 + rampLen / 2, 0.5 + rampRise / 2 + 0.20, 60.0);
    rampCenterPlank.rotation.z = rampAngle;
    zoneGroup.add(rampCenterPlank);
    this.colliders.push(rampCenterPlank);

    // =========================================================================
    // 4. CẦU LONG BIÊN (CANTILEVER STEEL TRUSS) - NGUYÊN BẢN 100% TỪ BẢN DEMO
    // Tối ưu hóa cực đại: Gộp toàn bộ 525 thanh dàn thép thành 2 Mesh duy nhất
    // Giảm 99% Draw Calls WebGL, đưa FPS đạt mốc 60 FPS mượt mà tuyệt đối
    // =========================================================================
    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'LongBienBridgeGroup';
    this.bridgeGroup = bridgeGroup;
    zoneGroup.add(bridgeGroup);

    const SPAN_LENGTH = 36;
    const NUM_SPANS = 7;
    const BRIDGE_WIDTH = 5.2;
    const DECK_Y = 10.0;
    const HALF_LENGTH = (NUM_SPANS * SPAN_LENGTH) / 2; // 126m
    const totalBridgeLength = NUM_SPANS * SPAN_LENGTH; // 252m

    const X_CENTER = 145.0; // Tâm cầu tại x = 145.0 (Cầu trải dài từ 19.0m đến 271.0m)
    const Z_CENTER = 60.0;  // Trục tim đường sắt tại z = 60.0

    // A. 7 Trụ cầu đá hộc & Mũi rẽ nước (Pointed Cutwaters)
    const cutwaterGeoms = [];
    const cutwaterGeomBase = new THREE.CylinderGeometry(0.1, 4.7, 9.4, 3);
    cutwaterGeomBase.rotateX(Math.PI / 2);
    cutwaterGeomBase.rotateZ(Math.PI / 2);

    for (let i = 0; i <= NUM_SPANS; i++) {
      const px = X_CENTER - HALF_LENGTH + i * SPAN_LENGTH;

      const pierBody = createBoxBeam(4.8, DECK_Y + 1.2, 9.4, stonePierMat);
      pierBody.name = 'LongBien_pier_' + i;
      pierBody._isBaseGround = true;
      pierBody.frustumCulled = false;
      pierBody.position.set(px, (DECK_Y + 1.2) / 2 - 1.0, Z_CENTER);
      bridgeGroup.add(pierBody);
      this.colliders.push(pierBody);

      // Cutwater upstream
      const upGeo = cutwaterGeomBase.clone();
      upGeo.scale(0.6, 1.0, 0.7);
      upGeo.translate(px, (DECK_Y + 1.2) / 2 - 1.0, Z_CENTER - 6.0);
      cutwaterGeoms.push(upGeo);

      // Cutwater downstream
      const downGeo = cutwaterGeomBase.clone();
      downGeo.scale(0.6, 1.0, 0.7);
      downGeo.rotateZ(Math.PI);
      downGeo.translate(px, (DECK_Y + 1.2) / 2 - 1.0, Z_CENTER + 6.0);
      cutwaterGeoms.push(downGeo);
    }

    const mergedCutwaters = BufferGeometryUtils.mergeGeometries(cutwaterGeoms, false);
    const cutwaterMesh = new THREE.Mesh(mergedCutwaters, stonePierMat);
    cutwaterMesh.name = 'LongBien_cutwaters';
    cutwaterMesh.frustumCulled = false;
    cutwaterMesh._neverCull = true;
    bridgeGroup.add(cutwaterMesh);

    // Mảng thu gom hình học thép để gộp siêu tốc
    const steelGeoms = [];
    const darkSteelGeoms = [];

    // B. Sàn dầm cầu chính đặc kín không hở (ĐĂNG KÝ VÀO COLLIDERS CHỐNG LỌT XUYÊN CẦU 100%)
    steelGeoms.push(getTransformedBox(totalBridgeLength + 8, 1.2, 0.5, new THREE.Vector3(X_CENTER, DECK_Y, Z_CENTER - BRIDGE_WIDTH / 2)));
    steelGeoms.push(getTransformedBox(totalBridgeLength + 8, 1.2, 0.5, new THREE.Vector3(X_CENTER, DECK_Y, Z_CENTER + BRIDGE_WIDTH / 2)));

    const solidSubDeck = createBoxBeam(totalBridgeLength + 8, 0.35, BRIDGE_WIDTH - 0.2, steelPlankMat);
    solidSubDeck.name = 'bridgeSolidSubDeck';
    solidSubDeck._isBaseGround = true;
    solidSubDeck.frustumCulled = false;
    solidSubDeck.position.set(X_CENTER, DECK_Y + 0.50, Z_CENTER);
    bridgeGroup.add(solidSubDeck);
    this.colliders.push(solidSubDeck); // KHÓA SÀN CẦU CHÍNH

    // C. Tà vẹt gỗ (InstancedMesh 1 Draw Call)
    const tieCount = Math.floor(totalBridgeLength / 0.8);
    const tieGeom = new THREE.BoxGeometry(0.35, 0.22, 2.8);
    const tieInstanced = new THREE.InstancedMesh(tieGeom, woodTieMat, tieCount);
    tieInstanced.name = 'LongBien_tieInstanced';
    tieInstanced.frustumCulled = false;
    for (let i = 0; i < tieCount; i++) {
      const tx = X_CENTER - HALF_LENGTH + i * 0.8;
      dummy.position.set(tx, DECK_Y + 0.65, Z_CENTER);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      tieInstanced.setMatrixAt(i, dummy.matrix);
    }
    bridgeGroup.add(tieInstanced);

    // D. Ván sàn bảo trì giữa 2 ray (ĐĂNG KÝ VÀO COLLIDERS)
    const centerInspectionWalkway = createBoxBeam(totalBridgeLength + 8, 0.12, 0.92, woodPlankMat);
    centerInspectionWalkway.name = 'bridgeCenterWalkway';
    centerInspectionWalkway._isBaseGround = true;
    centerInspectionWalkway.frustumCulled = false;
    centerInspectionWalkway.position.set(X_CENTER, DECK_Y + 0.77, Z_CENTER);
    bridgeGroup.add(centerInspectionWalkway);
    this.colliders.push(centerInspectionWalkway);

    // E. Hai ray sắt
    steelGeoms.push(getTransformedBox(totalBridgeLength + 8, 0.18, 0.12, new THREE.Vector3(X_CENTER, DECK_Y + 0.82, Z_CENTER - 0.5)));
    steelGeoms.push(getTransformedBox(totalBridgeLength + 8, 0.18, 0.12, new THREE.Vector3(X_CENTER, DECK_Y + 0.82, Z_CENTER + 0.5)));

    // F. Làn bộ hành 2 bên cánh gà (ĐĂNG KÝ VÀO COLLIDERS CHỐNG LỌT XUYÊN 100%)
    const sideWalkwayWidth = 1.8;
    const walk1 = createBoxBeam(totalBridgeLength + 8, 0.20, sideWalkwayWidth, deckMat);
    walk1.name = 'bridgeWalkwayNorth';
    walk1._isBaseGround = true;
    walk1.frustumCulled = false;
    walk1.position.set(X_CENTER, DECK_Y + 0.62, Z_CENTER - (BRIDGE_WIDTH / 2 + sideWalkwayWidth / 2 + 0.1));
    bridgeGroup.add(walk1);
    this.colliders.push(walk1); // KHÓA SÀN ĐI BỘ MẠN BẮC

    const walk2 = walk1.clone();
    walk2.name = 'bridgeWalkwaySouth';
    walk2._isBaseGround = true;
    walk2.frustumCulled = false;
    walk2.position.z = Z_CENTER + (BRIDGE_WIDTH / 2 + sideWalkwayWidth / 2 + 0.1);
    bridgeGroup.add(walk2);
    this.colliders.push(walk2); // KHÓA SÀN ĐI BỘ MẠN NAM

    // G. Cầu nối đi bộ ngang tại các trụ (Gộp chung 1 Mesh)
    const crossPlankGeoms = [];
    for (let i = 0; i <= NUM_SPANS; i++) {
      const cx = X_CENTER - HALF_LENGTH + i * SPAN_LENGTH;
      crossPlankGeoms.push(getTransformedBox(2.5, 0.14, BRIDGE_WIDTH + sideWalkwayWidth * 2, new THREE.Vector3(cx, DECK_Y + 0.76, Z_CENTER)));
    }
    const mergedCrossPlanks = BufferGeometryUtils.mergeGeometries(crossPlankGeoms, false);
    const crossPlanksMesh = new THREE.Mesh(mergedCrossPlanks, woodPlankMat);
    crossPlanksMesh.name = 'bridgeCrossPlanks';
    crossPlanksMesh._isBaseGround = true;
    crossPlanksMesh.frustumCulled = false;
    bridgeGroup.add(crossPlanksMesh);
    this.colliders.push(crossPlanksMesh);

    // H. Lan can dầm sắt bảo vệ ngoài cùng
    const railingPostGeom = new THREE.BoxGeometry(0.08, 1.1, 0.08);
    const railingPostCount = Math.floor(totalBridgeLength / 2.0);
    const railPosts1 = new THREE.InstancedMesh(railingPostGeom, darkSteelMat, railingPostCount);
    railPosts1.name = 'LongBien_railPosts1';
    railPosts1.frustumCulled = false;
    const railPosts2 = new THREE.InstancedMesh(railingPostGeom, darkSteelMat, railingPostCount);
    railPosts2.name = 'LongBien_railPosts2';
    railPosts2.frustumCulled = false;

    for (let i = 0; i < railingPostCount; i++) {
      const rx = X_CENTER - HALF_LENGTH + i * 2.0;
      dummy.position.set(rx, DECK_Y + 1.15, Z_CENTER - (BRIDGE_WIDTH / 2 + sideWalkwayWidth + 0.1));
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      railPosts1.setMatrixAt(i, dummy.matrix);

      dummy.position.z = Z_CENTER + BRIDGE_WIDTH / 2 + sideWalkwayWidth + 0.1;
      dummy.updateMatrix();
      railPosts2.setMatrixAt(i, dummy.matrix);
    }
    bridgeGroup.add(railPosts1);
    bridgeGroup.add(railPosts2);

    darkSteelGeoms.push(getTransformedBox(totalBridgeLength + 8, 0.08, 0.12, new THREE.Vector3(X_CENTER, DECK_Y + 1.65, Z_CENTER - (BRIDGE_WIDTH / 2 + sideWalkwayWidth + 0.1))));
    darkSteelGeoms.push(getTransformedBox(totalBridgeLength + 8, 0.08, 0.12, new THREE.Vector3(X_CENTER, DECK_Y + 1.65, Z_CENTER + BRIDGE_WIDTH / 2 + sideWalkwayWidth + 0.1)));

    // Khóa chắn vật lý hai mép ngoài lan can để người chơi không bao giờ rơi ra ngoài cầu
    // Mạn Nam: Chạy suốt chiều dài cầu
    this._addBoxObstacle(X_CENTER, Z_CENTER - (BRIDGE_WIDTH / 2 + sideWalkwayWidth + 0.1), totalBridgeLength + 10, 0.6, DECK_Y, DECK_Y + 3.0);
    // Mạn Bắc: CHỈ trên đoạn vượt sông Hồng (X: 70.0 -> 245.0), KHÔNG chắn ngang Ke Ga Long Biên (X: 20 -> 70) hay Ga Gia Lâm (X: 245 -> 275)
    this._addBoxObstacle(157.5, Z_CENTER + (BRIDGE_WIDTH / 2 + sideWalkwayWidth + 0.1), 175.0, 0.6, DECK_Y, DECK_Y + 3.0);

    // I. 7 NHỊP DÀN THÉP DẦM CHÌA UỐN LƯỢN (CANTILEVER ARCHES) - CHUẨN DEMO (GỘP HÌNH HỌC)
    for (let s = 0; s < NUM_SPANS; s++) {
      const spanStartX = X_CENTER - HALF_LENGTH + s * SPAN_LENGTH;
      const spanEndX = spanStartX + SPAN_LENGTH;
      const spanMidX = (spanStartX + spanEndX) / 2;
      const H_PEAK = 13.5;
      const H_VALLEY = 4.0;
      const SUBDIVISIONS = 8;
      const dx = SPAN_LENGTH / SUBDIVISIONS;

      for (let side = -1; side <= 1; side += 2) {
        const sideZ = Z_CENTER + side * (BRIDGE_WIDTH / 2);
        const topPoints = [];

        for (let j = 0; j <= SUBDIVISIONS; j++) {
          const px = spanStartX + j * dx;
          const t = (px - spanMidX) / (SPAN_LENGTH / 2);
          const curveHeight = H_VALLEY + (H_PEAK - H_VALLEY) * (t * t);
          topPoints.push(new THREE.Vector3(px, DECK_Y + curveHeight, sideZ));

          const postHeight = curveHeight;
          steelGeoms.push(getTransformedBox(0.4, postHeight, 0.4, new THREE.Vector3(px, DECK_Y + postHeight / 2, sideZ)));

          if (side === 1) {
            steelGeoms.push(getTransformedBox(0.3, 0.3, BRIDGE_WIDTH, new THREE.Vector3(px, DECK_Y + curveHeight, Z_CENTER)));
          }
        }

        for (let j = 0; j < SUBDIVISIONS; j++) {
          const p1 = topPoints[j];
          const p2 = topPoints[j + 1];
          const segDist = p1.distanceTo(p2);
          const segMid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

          steelGeoms.push(getTransformedBox(segDist, 0.45, 0.45, segMid, null, p2, Math.PI / 2));

          const bottomP1 = new THREE.Vector3(p1.x, DECK_Y + 0.6, sideZ);
          const bottomP2 = new THREE.Vector3(p2.x, DECK_Y + 0.6, sideZ);

          const diag1Dist = bottomP1.distanceTo(p2);
          const diag1Mid = new THREE.Vector3().addVectors(bottomP1, p2).multiplyScalar(0.5);
          darkSteelGeoms.push(getTransformedBox(diag1Dist, 0.28, 0.28, diag1Mid, null, p2, Math.PI / 2));

          const diag2Dist = p1.distanceTo(bottomP2);
          const diag2Mid = new THREE.Vector3().addVectors(p1, bottomP2).multiplyScalar(0.5);
          darkSteelGeoms.push(getTransformedBox(diag2Dist, 0.28, 0.28, diag2Mid, null, bottomP2, Math.PI / 2));
        }
      }
    }

    // GỘP TOÀN BỘ 500+ DẦM THÉP THÀNH 2 MESH DUY NHẤT (SIÊU NHẸ GPU & KHÔNG BAO GIỜ BỊ ẨN KHI ĐI ĐẾN ĐẦU CẦU BỜ ĐÔNG)
    const mergedSteelGeo = BufferGeometryUtils.mergeGeometries(steelGeoms, false);
    const mergedSteelMesh = new THREE.Mesh(mergedSteelGeo, steelMat);
    mergedSteelMesh.name = 'LongBien_mergedSteelMesh';
    mergedSteelMesh.frustumCulled = false;
    mergedSteelMesh._neverCull = true;
    mergedSteelMesh._isBaseGround = true;
    bridgeGroup.add(mergedSteelMesh);

    const mergedDarkSteelGeo = BufferGeometryUtils.mergeGeometries(darkSteelGeoms, false);
    const mergedDarkSteelMesh = new THREE.Mesh(mergedDarkSteelGeo, darkSteelMat);
    mergedDarkSteelMesh.name = 'LongBien_mergedDarkSteelMesh';
    mergedDarkSteelMesh.frustumCulled = false;
    mergedDarkSteelMesh._neverCull = true;
    mergedDarkSteelMesh._isBaseGround = true;
    bridgeGroup.add(mergedDarkSteelMesh);

    // J. Đèn lồng chiếu sáng cầu (Gộp toàn bộ 14 đèn thành 1 Mesh)
    const lampGeomBase = new THREE.SphereGeometry(0.25, 12, 12);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffe082 });
    const lampGeoms = [];
    for (let i = 0; i < NUM_SPANS; i++) {
      const lx = X_CENTER - HALF_LENGTH + (i + 0.5) * SPAN_LENGTH;
      for (let side = -1; side <= 1; side += 2) {
        const lg = lampGeomBase.clone();
        lg.translate(lx, DECK_Y + 1.8, Z_CENTER + side * (BRIDGE_WIDTH / 2 + sideWalkwayWidth));
        lampGeoms.push(lg);

        // 2 nguồn sáng điểm chính phủ đều toàn cầu (nhịp 2 và nhịp 5)
        if ((i === 2 || i === 5) && side === 1) {
          const lampLight = new THREE.PointLight(0xffb74d, 2.0, 48);
          lampLight.position.set(lx, DECK_Y + 3.2, Z_CENTER);
          bridgeGroup.add(lampLight);
        }
      }
    }
    const mergedLamps = BufferGeometryUtils.mergeGeometries(lampGeoms, false);
    const allLampsMesh = new THREE.Mesh(mergedLamps, lampMat);
    allLampsMesh.name = 'LongBien_allLampsMesh';
    allLampsMesh.frustumCulled = false;
    bridgeGroup.add(allLampsMesh);

    // KHÓA FRUSTUM CULLING TOÀN BỘ CẦU LONG BIÊN:
    // Triệt tiêu 100% hiện tượng mất hình dầm thép, ray tàu, tà vẹt khi đi về cuối cầu
    bridgeGroup.traverse(child => {
      if (child.isMesh || child.isInstancedMesh) {
        child.frustumCulled = false;
        child._neverCull = true;
        child._isBaseGround = true;
      }
    });

    // =========================================================================
    // 5. GA LONG BIÊN CỔ KÍNH - NGUYÊN BẢN 100% TỪ BẢN DEMO
    // Nằm ở đầu cầu phía Tây (X: 20.0m -> 70.0m, Z: 64.8m)
    // =========================================================================
    const stationGroup = new THREE.Group();
    zoneGroup.add(stationGroup);

    const PLATFORM_X_START = 20.0;
    const PLATFORM_X_END = 70.0;
    const PLATFORM_LEN = PLATFORM_X_END - PLATFORM_X_START; // 50m
    const PLATFORM_Z = Z_CENTER + 4.8; // 64.8m (sát cạnh đường ray)
    const PLATFORM_WIDTH = 4.2;
    const PLATFORM_Y = DECK_Y + 0.85; // 10.85m

    // Ke ga đá xanh (Raised Stone Platform) - ĐĂNG KÝ VÀO COLLIDERS CHỐNG SỤT CHÂN 100%
    const platformMesh = createBoxBeam(PLATFORM_LEN, 0.85, PLATFORM_WIDTH, stationPlatformMat);
    platformMesh.position.set((PLATFORM_X_START + PLATFORM_X_END) / 2, DECK_Y + 0.425, PLATFORM_Z);
    stationGroup.add(platformMesh);
    this.colliders.push(platformMesh);

    // Vạch vàng an toàn mép ke ga (Safety Line)
    const safetyLine = createBoxBeam(PLATFORM_LEN, 0.02, 0.15, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    safetyLine.position.set((PLATFORM_X_START + PLATFORM_X_END) / 2, PLATFORM_Y + 0.01, PLATFORM_Z - PLATFORM_WIDTH / 2 + 0.2);
    stationGroup.add(safetyLine);

    // Mái che Ke Ga Cổ Kính (Ornate Heritage Platform Canopy)
    const canopyPostsCount = 6;
    for (let p = 0; p < canopyPostsCount; p++) {
      const px = PLATFORM_X_START + 5 + p * 8;
      const post = createBoxBeam(0.25, 3.8, 0.25, darkSteelMat);
      post.position.set(px, PLATFORM_Y + 1.9, PLATFORM_Z + 1.2);
      stationGroup.add(post);

      const bracket = createBoxBeam(0.12, 0.8, 2.8, darkSteelMat);
      bracket.position.set(px, PLATFORM_Y + 3.4, PLATFORM_Z);
      bracket.rotateZ(0.1);
      stationGroup.add(bracket);

      if (p === 1 || p === 4) {
        const stationLamp = new THREE.PointLight(0xffddaa, 1.8, 24);
        stationLamp.position.set(px, PLATFORM_Y + 3.1, PLATFORM_Z);
        stationGroup.add(stationLamp);
      }

      const lampSphere = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfff0b3 }));
      lampSphere.position.set(px, PLATFORM_Y + 3.1, PLATFORM_Z);
      stationGroup.add(lampSphere);
    }

    // Tấm mái che ngói sẫm nghiêng
    const canopyRoof = createBoxBeam(PLATFORM_LEN - 4, 0.15, 3.8, stationRoofMat);
    canopyRoof.position.set((PLATFORM_X_START + PLATFORM_X_END) / 2, PLATFORM_Y + 3.8, PLATFORM_Z + 0.2);
    canopyRoof.rotateX(0.08);
    stationGroup.add(canopyRoof);

    // Nhà ga chính kiểu Pháp (Station Building Facade)
    const stationBuilding = createBoxBeam(28, 6.2, 5.0, stationWallMat);
    stationBuilding.position.set(40.0, PLATFORM_Y + 3.1, PLATFORM_Z + 4.8);
    stationGroup.add(stationBuilding);
    this._addBoxObstacle(40.0, PLATFORM_Z + 4.8, 29.0, 5.5, PLATFORM_Y, PLATFORM_Y + 7.0);
    // Rào chắn bảo vệ mép sau ke ga Long Biên (Z = 67.0)
    this._addBoxObstacle(45.0, PLATFORM_Z + PLATFORM_WIDTH / 2 + 0.1, PLATFORM_LEN, 0.5, PLATFORM_Y, PLATFORM_Y + 3.0);

    // Mái ngói dốc nhà ga
    const stationRoof = createBoxBeam(30, 1.8, 5.8, stationRoofMat);
    stationRoof.position.set(40.0, PLATFORM_Y + 6.8, PLATFORM_Z + 4.8);
    stationGroup.add(stationRoof);

    // Cửa ra vào bằng gỗ xanh lá sẫm Pháp
    for (let d = -2; d <= 2; d++) {
      const doorMesh = createBoxBeam(1.8, 3.2, 0.2, stationDoorMat);
      doorMesh.position.set(40.0 + d * 5.2, PLATFORM_Y + 1.6, PLATFORM_Z + 2.3);
      stationGroup.add(doorMesh);
    }

    // Biển tên nhà ga cổ kính: "GA LONG BIÊN • GARE DE LONG BIÊN"
    // Bác Hùng Gác Cầu Long Biên & Bảo Vệ Nhà Ga Di Sản
    const signBoard = createBoxBeam(12, 1.1, 0.2, new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }));
    signBoard.position.set(40.0, PLATFORM_Y + 4.5, PLATFORM_Z + 2.2);
    stationGroup.add(signBoard);

    // Đồng hồ tròn treo ke ga đặc trưng
    const clockGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.15, 24);
    clockGeom.rotateX(Math.PI / 2);
    const clockMesh = new THREE.Mesh(clockGeom, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    clockMesh.position.set(55.0, PLATFORM_Y + 3.2, PLATFORM_Z + 1.2);
    stationGroup.add(clockMesh);

    // Ghế chờ bằng gỗ trên ke ga
    for (let b = 0; b < 3; b++) {
      const bench = createBoxBeam(3.2, 0.5, 0.8, stationWoodMat);
      bench.position.set(30.0 + b * 14, PLATFORM_Y + 0.35, PLATFORM_Z + 1.2);
      stationGroup.add(bench);
    }

    // =========================================================================
    // 🎨 6. GIAN TRIỂN LÃM TUYỆT TÁC TOÀN CẢNH CANVA AI MASTERPIECE
    // Đặt trang trọng trên ke Ga Long Biên (x = 35.0, z = 67.2)
    // =========================================================================
    const canvaPavilion = new THREE.Group();
    canvaPavilion.position.set(35.0, PLATFORM_Y, PLATFORM_Z + 2.2);

    const frameMesh = createBoxBeam(3.6, 2.1, 0.16, this.materials.woodVarnish || stationWoodMat);
    frameMesh.position.set(0, 1.6, 0);
    canvaPavilion.add(frameMesh);

    const masterCanvas = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.85), this.materials.canvaMasterpiece);
    masterCanvas.position.set(0, 1.6, -0.09);
    masterCanvas.rotation.y = Math.PI; // Hướng về phía ke ga
    canvaPavilion.add(masterCanvas);

    const spotlight = new THREE.SpotLight(0xfffaed, 3.5, 8, Math.PI / 4, 0.4);
    spotlight.position.set(0, 3.2, -1.8);
    spotlight.target = masterCanvas;
    canvaPavilion.add(spotlight);
    stationGroup.add(canvaPavilion);

    // Điểm tương tác ngắm tranh Canva Masterpiece
    this.interactables.push({
      id: 'canva_long_bien_masterpiece',
      name: 'Kiệt Tác Sơn Dầu Cầu Long Biên (Canva AI)',
      position: new THREE.Vector3(35.0, PLATFORM_Y + 1.0, PLATFORM_Z + 0.5),
      promptText: 'Chiêm ngưỡng Kiệt tác Sơn dầu Cầu Long Biên • Canva AI',
      onInteract: () => {
        if (this.eventBus) {
          this.eventBus.emit('CORE:NOTIFICATION', {
            message: '🎨 Kiệt Tác Hội Họa Cầu Long Biên Hoàng Hôn: Tác phẩm sơn dầu tái hiện lịch sử hào hùng và vẻ đẹp trầm mặc của Thủ Đô.'
          });
        }
      }
    });

    // =========================================================================
    // 7. KE GA GIA LÂM BỜ ĐÔNG SÔNG HỒNG (X: 245 -> 275)
    // =========================================================================
    const glPlatform = createBoxBeam(30.0, 0.85, 4.2, stationPlatformMat);
    glPlatform.position.set(260.0, DECK_Y + 0.425, PLATFORM_Z);
    zoneGroup.add(glPlatform);
    this.colliders.push(glPlatform);

    // Rào chắn mép sau và gờ chặn cuối đường ray bờ Đông Ga Gia Lâm
    this._addBoxObstacle(260.0, PLATFORM_Z + 2.2, 30.0, 0.6, PLATFORM_Y, PLATFORM_Y + 3.0);
    this._addBoxObstacle(275.5, 61.0, 1.0, 15.0, DECK_Y, DECK_Y + 4.0);

    const glCanopy = createBoxBeam(28.0, 0.15, 3.8, stationRoofMat);
    glCanopy.position.set(260.0, PLATFORM_Y + 3.8, PLATFORM_Z + 0.2);
    zoneGroup.add(glCanopy);

    // =========================================================================
    // 8. KHỞI TẠO ĐOÀN TÀU CỔ & NỘI THẤT TOA TÀU - NGUYÊN BẢN 100% DEMO
    // =========================================================================
    this.bridgeDeckY = DECK_Y;
    this.trainFloorY = DECK_Y + 1.25; // 11.25m
    this.trainStationWestX = 50.0;     // Dừng tại ke Ga Long Biên
    this.trainStationEastX = 250.0;    // Dừng tại ke Ga Gia Lâm
    this.trainPosX = this.trainStationWestX;
    this.trainSpeed = 0;
    this.trainCruiseSpeed = 7.5;
    this.trainDirection = 1;
    this.trainState = 'AT_STATION_WEST';
    this.stationDwellTimer = 0;
    this.isPlayerRidingTrain = false;

    this._initDemoTrain(zoneGroup, DECK_Y, Z_CENTER);

    // Đảm bảo miễn trừ tuyệt đối Culling cho 100% mesh trong Zone 3 (Cầu Long Biên, Dầm thép giàn, Ray, Tà vẹt, Ga, Tàu)
    zoneGroup.traverse((child) => {
      if (child.isMesh) {
        child._neverCull = true;
        child._isBaseGround = true;
      }
    });

    this.worldGroup.add(zoneGroup);
    return zoneGroup;
  }

  _buildZone4CollectiveHousing() {
    const zoneGroup = new THREE.Group();
    zoneGroup.name = 'Zone4_CollectiveHousing';
    this.zone4Group = zoneGroup;

    // 1. Dãy nhà tập thể 5 tầng lắp ghép Kim Liên đồ sộ
    const blocks = [
      { x: -50, z: -55, w: 32, d: 16, h: 18 },
      { x: -95, z: -55, w: 36, d: 16, h: 18 },
      { x: -65, z: -105, w: 42, d: 16, h: 18 }
    ];

    blocks.forEach((b, idx) => {
      const blockMesh = this._createDetailedCollectiveBlock(b.w, b.h, b.d, `NHÀ TẬP THỂ A${idx + 1}`);
      blockMesh.position.set(b.x, 0, b.z);
      zoneGroup.add(blockMesh);
      // ĐĂNG KÝ VA CHẠM CỨNG CÁP: CHỐNG ĐI XUYÊN TOÀN BỘ KHU NHÀ TẬP THỂ!
      this._addBoxObstacle(b.x, b.z, b.w + 0.4, b.d + 0.4, 0, b.h + 2.0);
    });

    // 2. Bàn cờ tướng đá dưới sân chung
    const chessTable = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.75, 16), this.materials.mossStone);
    chessTable.position.set(-75, 0.375, -78);
    chessTable.castShadow = true;
    zoneGroup.add(chessTable);
    this._addBoxObstacle(-75, -78, 2.4, 2.4, 0, 1.2); // Chống xuyên bàn cờ tướng!

    // 3. Cây bàng già lá đỏ cuối thu góc sân
    const bangTree = this._createBangTree();
    bangTree.position.set(-68, 0, -74);
    zoneGroup.add(bangTree);
    this._addBoxObstacle(-68, -74, 1.5, 1.5, 0, 10.0); // Chống xuyên gốc bàng!

    // 4. Loa truyền thanh phường trên cột bê tông
    const speakerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 9.0, 8), this.materials.darkIron);
    speakerPole.position.set(-58, 4.5, -75);
    zoneGroup.add(speakerPole);
    this._addBoxObstacle(-58, -75, 0.6, 0.6, 0, 9.5);

    this.worldGroup.add(zoneGroup);
  }

  /**
   * HỆ THỐNG CON NGƯỜI THÀNH PHỐ SỐNG ĐỘNG (LIVING CITY NPCS)
   * Tích hợp NPC bán hàng rong tự động di chuyển theo lộ trình (Autonomous Roaming Vendors)
   * và hệ thống đối thoại, giao dịch mậu dịch, thuyết minh lịch sử
   */
  _buildLivingCityNPCs() {
    const npcGroup = new THREE.Group();
    npcGroup.name = 'LivingHanoiNPCs';

    // 1. CHỊ LAN - GÁNH HÀNG HOA TƯƠI DẠO VEN HỒ (TUẦN TRA TRÊN ĐƯỜNG ĐÁ KHÔ RÁO VEN HỒ, TUYỆT ĐỐI KHÔNG DƯỚI NƯỚC)
    const lakeR = 89.0; // Bán kính đường đi bộ ven hồ r: 85.0m -> 98.0m (tâm 80, -80)
    const flowerWaypoints = [];
    for (let i = 0; i < 12; i++) {
      const theta = (i / 12) * Math.PI * 2;
      flowerWaypoints.push(new THREE.Vector3(
        80 + Math.cos(theta) * lakeR,
        0.45,
        -80 + Math.sin(theta) * lakeR
      ));
    }

    const initX = flowerWaypoints[0].x;
    const initZ = flowerWaypoints[0].z;
    const flowerVendorMesh = this._createFlowerVendorNPC(initX, initZ, 0.45);
    npcGroup.add(flowerVendorMesh);

    // Đăng ký collider ban đầu trên vỉa hè ven hồ
    const flowerColliderIndex = this.npcColliders.length;
    this._addNpcCollider(initX, initZ, 0.7);

    this.roamingNpcs.push({
      id: 'chi_lan_hoa',
      name: 'Chị Lan &bull; Gánh Hàng Hoa Ven Hồ',
      mesh: flowerVendorMesh,
      colliderIndex: flowerColliderIndex,
      waypoints: flowerWaypoints,
      currentWpIndex: 0,
      speed: 1.1,
      walkCycle: 0,
      radius: 2.8,
      promptText: 'Mua Hoa Sen / Nghe Chuyện Hồ Gươm',
      isInteracting: false,
      interactTimeout: null,
      update: (delta) => {
        const npc = this.roamingNpcs[0];
        if (npc.isInteracting) return;

        const currentPos = flowerVendorMesh.position;
        const targetWp = flowerWaypoints[npc.currentWpIndex];
        const dist = currentPos.distanceTo(targetWp);

        if (dist <= 1.2) {
          npc.currentWpIndex = (npc.currentWpIndex + 1) % flowerWaypoints.length;
        } else {
          const dir = this._npcDir.subVectors(targetWp, currentPos).normalize();
          currentPos.addScaledVector(dir, npc.speed * delta);
          currentPos.y = 0.45; // Luôn đi trên mặt đường đá bờ hồ khô ráo, tuyệt đối không chìm xuống nước

          const targetAngle = Math.atan2(dir.x, dir.z);
          flowerVendorMesh.rotation.y = THREE.MathUtils.lerp(flowerVendorMesh.rotation.y, targetAngle, 0.12);

          npc.walkCycle += delta * 5.2;
          if (flowerVendorMesh.userData.leftLeg && flowerVendorMesh.userData.rightLeg) {
            flowerVendorMesh.userData.leftLeg.rotation.x = Math.sin(npc.walkCycle) * 0.45;
            flowerVendorMesh.userData.rightLeg.rotation.x = -Math.sin(npc.walkCycle) * 0.45;
          }
          if (flowerVendorMesh.userData.pole) {
            flowerVendorMesh.userData.pole.rotation.z = Math.sin(npc.walkCycle * 2) * 0.04;
          }

          if (this.npcColliders[npc.colliderIndex]) {
            this.npcColliders[npc.colliderIndex].x = currentPos.x;
            this.npcColliders[npc.colliderIndex].z = currentPos.z;
          }
        }
      },
      onInteract: (playerPos) => {
        const npc = this.roamingNpcs[0];
        npc.isInteracting = true;
        if (npc.interactTimeout) clearTimeout(npc.interactTimeout);
        npc.interactTimeout = setTimeout(() => { npc.isInteracting = false; }, 18000);

        const dx = playerPos.x - flowerVendorMesh.position.x;
        const dz = playerPos.z - flowerVendorMesh.position.z;
        flowerVendorMesh.rotation.y = Math.atan2(dx, dz);

        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Chị Lan &bull; Gánh Hàng Hoa Ven Hồ',
            role: 'Người buôn hoa chợ sớm Quảng Bá',
            avatar: '🌸',
            greeting: '"Chào bạn lãng tử! Sáng sớm nay tôi vừa dong xe lên chợ hoa Quảng Bá từ lúc ba giờ sáng. Hoa sen Hồ Tây chớm đông thơm ngát lắm, bạn có muốn chọn một bó lưu giữ ký ức không?"',
            monumentTitle: 'Truyền Thuyết Hồ Gươm & Tháp Rùa Cổ Kính',
            historyText: `
              <p><strong>Sự tích Hồ Hoàn Kiếm (Hồ Tả Vọng):</strong> Nơi Vua Lê Thái Tổ (Lê Lợi) sau khi đánh đuổi giặc Minh xâm lược đã ngự thuyền rồng trên hồ. Thần Kim Quy (Rùa Vàng) nổi lên đòi lại thanh Thuận Thiên Kiếm – thanh kiếm thần đã trao cho ngài cứu nước. Nhà vua trao trả kiếm và từ đó hồ đổi tên thành Hồ Hoàn Kiếm (Hồ Trả Gươm).</p>
              <p><strong>Tháp Rùa:</strong> Được xây dựng vào cuối thế kỷ 19 trên gò đảo Rùa giữa hồ. Kiến trúc Tháp Rùa là sự giao thoa độc đáo giữa phong cách Gothic phương Tây (với các vòm cuốn nhọn 2 tầng) và mái cong truyền thống phương Đông, trở thành biểu tượng thiêng liêng lắng đọng ngàn năm văn hiến Thủ đô.</p>
            `,
            dialogueOptions: [
              { text: 'Chị lấy hoa từ chợ hoa nào thế?', reply: 'Từ chợ hoa đêm Quảng Bá bên đê Nghi Tàm đấy bạn, hoa về ngát hương cả một dải đê trong sương lạnh.' },
              { text: 'Cảm giác gánh hoa dạo quanh bờ hồ thế nào?', reply: 'Thanh bình lắm! Mỗi sáng nhìn mặt nước hồ xanh biếc và Tháp Rùa lấp ló trong sương sớm, thấy lòng nhẹ tênh.' }
            ],
            shopItems: [
              { name: 'Bó Sen Bách Diệp Hồ Tây', price: '20 Xu', desc: 'Bó sen hồng thắm gói trong lá sen ngát hương sương sớm', icon: '🪷' },
              { name: 'Bó Cúc Họa Mi Đầu Đông', price: '18 Xu', desc: 'Sắc trắng tinh khôi báo hiệu mùa gió heo may về', icon: '🌼' },
              { name: 'Bưu Thiếp Tháp Rùa Mờ Sương', price: '10 Xu', desc: 'Bức ảnh chụp góc Tháp Rùa lúc bình minh', icon: '📮' }
            ]
          });
        }
      }
    });

    // 2. BÁC HÙNG - BÁN BÁNH MÌ DẠO XE ĐẠP CỔ (TỰ ĐỘNG DI CHUYỂN DỌC PHỐ CỔ & ĐƯỜNG TÀU)
    const banhMiVendorMesh = this._createBanhMiVendorNPC(-32, 38);
    npcGroup.add(banhMiVendorMesh);

    const banhMiColliderIndex = this.npcColliders.length;
    this._addNpcCollider(-32, 38, 0.75);

    const banhMiWaypoints = [
      new THREE.Vector3(-32, 0, 38),
      new THREE.Vector3(-60, 0, 38),
      new THREE.Vector3(-105, 0, 38),
      new THREE.Vector3(-105, 0, 66),
      new THREE.Vector3(-60, 0, 66),
      new THREE.Vector3(-32, 0, 66)
    ];

    this.roamingNpcs.push({
      id: 'bac_hung_banh_mi',
      name: 'Bác Hùng &bull; Bánh Mì Nóng Giòn Phố Cổ',
      mesh: banhMiVendorMesh,
      colliderIndex: banhMiColliderIndex,
      waypoints: banhMiWaypoints,
      currentWpIndex: 0,
      speed: 1.25,
      cycleAngle: 0,
      radius: 2.8,
      promptText: 'Mua Bánh Mì Pa-tê / Nghe Chuyện Phố Cổ',
      isInteracting: false,
      interactTimeout: null,
      update: (delta) => {
        const npc = this.roamingNpcs[1];
        if (npc.isInteracting) return;

        const currentPos = banhMiVendorMesh.position;
        const targetWp = banhMiWaypoints[npc.currentWpIndex];
        const dist = currentPos.distanceTo(targetWp);

        if (dist <= 1.2) {
          npc.currentWpIndex = (npc.currentWpIndex + 1) % banhMiWaypoints.length;
        } else {
          const dir = this._npcDir.subVectors(targetWp, currentPos).normalize();
          currentPos.addScaledVector(dir, npc.speed * delta);
          currentPos.y = 0.45; // Luôn đi trên mặt đường đá bờ hồ khô ráo, tuyệt đối không chìm xuống nước

          const targetAngle = Math.atan2(dir.x, dir.z);
          banhMiVendorMesh.rotation.y = THREE.MathUtils.lerp(banhMiVendorMesh.rotation.y, targetAngle, 0.12);

          npc.cycleAngle += delta * (npc.speed / 0.36);
          if (banhMiVendorMesh.userData.wheels) {
            banhMiVendorMesh.userData.wheels.forEach(w => {
              w.rotation.x = npc.cycleAngle;
            });
          }

          if (this.npcColliders[npc.colliderIndex]) {
            this.npcColliders[npc.colliderIndex].x = currentPos.x;
            this.npcColliders[npc.colliderIndex].z = currentPos.z;
          }
        }
      },
      onInteract: (playerPos) => {
        const npc = this.roamingNpcs[1];
        npc.isInteracting = true;
        if (npc.interactTimeout) clearTimeout(npc.interactTimeout);
        npc.interactTimeout = setTimeout(() => { npc.isInteracting = false; }, 18000);

        const dx = playerPos.x - banhMiVendorMesh.position.x;
        const dz = playerPos.z - banhMiVendorMesh.position.z;
        banhMiVendorMesh.rotation.y = Math.atan2(dx, dz);

        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Bác Hùng &bull; Bánh Mì Nóng Giòn Phố Cổ',
            role: 'Người bán bánh mì dạo xe đạp Thống Nhất',
            avatar: '🥖',
            greeting: '"Bánh mì nóng giòn đây! Lãng tử đi dạo phố đói bụng chưa, ghé làm chiếc bánh mì pa-tê ruốc nóng hổi giòn rụm nào!"',
            monumentTitle: 'Văn Hóa Ẩm Thực Phố Cổ & Phố Đường Tàu Hà Nội',
            historyText: `
              <p><strong>Bánh mì Hà Nội:</strong> Từ chiếc baguette du nhập thời Pháp, người Hà Nội đã biến tấu thành chiếc bánh mì thon gọn, vỏ ngoài nướng trên than hồng giòn rụm, ruột mềm thơm xốp. Nhân pa-tê gan tự làm béo ngậy, kèm thịt xá xíu, chả lụa, dưa góp dưa chuột chua ngọt và chút ớt bột truyền thống.</p>
              <p>Tiếng rao <em>"Ai bánh mì nóng giòn đây..."</em> vọng qua những con ngõ sâu hun hút đã trở thành âm thanh ký ức nuôi dưỡng tâm hồn biết bao thế hệ người Hà Nội.</p>
            `,
            dialogueOptions: [
              { text: 'Bác đạp xe bán quanh phố từ mấy giờ?', reply: 'Từ năm giờ chiều lúc tan tầm cho tới khuya bạn ơi, phố lên đèn bánh mì nóng mới đắt khách!' },
              { text: 'Bí quyết để pa-tê thơm béo là gì bác?', reply: 'Gan lợn tươi ngâm sữa tươi khử tanh, hấp cùng mỡ khổ và hành khô phi thơm nức mũi cả góc phố.' }
            ],
            shopItems: [
              { name: 'Bánh Mì Pa-tê Ruốc Nóng Giòn', price: '20 Xu', desc: 'Vỏ giòn rụm, pa-tê béo ngậy cùng dưa góp chua ngọt hấp dẫn', icon: '🥖' },
              { name: 'Bánh Tiêu Chiên Vừng Thơm Phức', price: '10 Xu', desc: 'Món quà vặt tuổi thơ vàng ươm rắc vừng', icon: '🥯' },
              { name: 'Chai Sữa Đậu Nành Nóng', price: '12 Xu', desc: 'Thức uống ấm lòng giữa chiều đông Hà Nội', icon: '🥛' }
            ]
          });
        }
      }
    });

    // 3. BÀ CỤ BÁN TRÀ ĐÁ CÓC VỈA HÈ PHỐ CỔ
    const teaVendor = this._createTeaStallVendorNPC(-50, 58);
    npcGroup.add(teaVendor);
    this._addNpcCollider(-50, 58, 0.85);

    // 4. HAI CỤ GIÀ ĐÁNH CỜ TƯỚNG SÂN TẬP THỂ
    const chessPlayers = this._createChessPlayersNPC(-75, -78);
    npcGroup.add(chessPlayers);
    this._addNpcCollider(-75, -78, 1.2);

    // 5. BÁC DÂN PHỐ CỔ DẠO BỘ
    const walker1 = this._createCitizenNPC(38, -70, 0x8a452a, 'nón phớt');
    npcGroup.add(walker1);
    this._addNpcCollider(38, -70, 0.6);

    // 6. THANH NIÊN UỐNG CÀ PHÊ NGẮM TÀU
    const coffeePatron = this._createCoffeePatronNPC(-53, 55);
    npcGroup.add(coffeePatron);
    this._addNpcCollider(-53, 55, 0.6);

    this.worldGroup.add(npcGroup);
  }

  /**
   * Tạo NPC Bác Bán Bánh Mì Dạo với Xe Đạp Thống Nhất và Hòm Bánh Mì Kính
   * Mô hình hướng mặt chuẩn trục +Z, bánh xe đặt trong mặt phẳng Y-Z lăn mượt mà không bị vặn xoắn
   */
  _createBanhMiVendorNPC(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xefc49e, roughness: 0.6 });
    const clothMat = new THREE.MeshStandardMaterial({ color: 0x3d4f5d, roughness: 0.8 }); // Áo sơ mi xanh công nhân
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x242424, roughness: 0.9 });
    const woodMat = this.materials.retroWood;
    const bikeMat = new THREE.MeshStandardMaterial({ color: 0x24543d, metalness: 0.5, roughness: 0.4 }); // Sơn xe đạp xanh Thống Nhất

    // KHUNG XE ĐẠP CỔ DỌC THEO TRỤC Z (HƯỚNG ĐI CHÍNH +Z)
    const bikeFrame = new THREE.Group();
    const mainBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.6), bikeMat);
    mainBar.position.set(0, 0.72, 0);
    bikeFrame.add(mainBar);

    // Ghi đông ngang trục X phía trước (z = 0.65)
    const handleBar = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 }));
    handleBar.position.set(0, 0.98, 0.65);
    bikeFrame.add(handleBar);

    // Yên xe đạp
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.24), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    saddle.position.set(0, 0.82, -0.25);
    bikeFrame.add(saddle);

    // Hai bánh xe đạp (Bánh trước z = +0.68, Bánh sau z = -0.68)
    const wheels = [];
    for (let bz of [-0.68, 0.68]) {
      const wheelGeo = new THREE.TorusGeometry(0.36, 0.032, 10, 24);
      wheelGeo.rotateY(Math.PI / 2); // Xoay vành bánh xe vào mặt phẳng Y-Z lăn theo chiều tiến!
      const wheel = new THREE.Mesh(wheelGeo, new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 }));
      wheel.position.set(0, 0.36, bz);
      bikeFrame.add(wheel);
      wheels.push(wheel);
    }
    group.userData.wheels = wheels;
    group.add(bikeFrame);

    // HÒM GỖ ĐỰNG BÁNH MÌ TRÊN GÁC-BA-GA PHÍA SAU (z = -0.55)
    const breadBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.52, 0.72), woodMat);
    breadBox.position.set(0, 1.05, -0.55);
    group.add(breadBox);

    // Tấm kính nhìn thấy bánh mì vàng giòn bên hông
    const glassWindow = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.35), new THREE.MeshStandardMaterial({ color: 0xaad8e6, transparent: true, opacity: 0.7 }));
    glassWindow.position.set(0.23, 1.05, -0.55);
    glassWindow.rotation.y = Math.PI / 2;
    group.add(glassWindow);

    // Những chiếc bánh mì vàng ruộm
    const breadMat = new THREE.MeshStandardMaterial({ color: 0xdca145, roughness: 0.7 });
    for (let b = 0; b < 3; b++) {
      const baguette = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.22, 4, 8), breadMat);
      baguette.rotation.x = 0.3;
      baguette.position.set(0.12, 1.02, -0.62 + b * 0.08);
      group.add(baguette);
    }

    // NGƯỜI BÁN BÁNH MÌ (BÁC HÙNG)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.8, 10), clothMat);
    body.position.set(0, 1.25, -0.05);
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), skinMat);
    head.position.set(0, 1.76, -0.05);
    group.add(head);

    // Mũ cối bộ đội cổ
    const helmet = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.16, 12), new THREE.MeshStandardMaterial({ color: 0x3d4a2d }));
    helmet.position.set(0, 1.86, -0.05);
    group.add(helmet);

    // Hai chân đạp xe nhịp nhàng
    const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.65, 8), pantsMat);
    lLeg.position.set(0.14, 0.65, 0.05);
    lLeg.rotation.x = 0.4;
    const rLeg = lLeg.clone();
    rLeg.position.set(-0.14, 0.65, -0.15);
    rLeg.rotation.x = -0.4;
    group.add(lLeg, rLeg);

    this.citizens.push(group);
    return group;
  }

  /**
   * Tạo NPC Chị gánh hàng hoa tươi (Đòn gánh tre, nón lá, thúng hoa sen hồng & cúc vàng)
   */
  _createFlowerVendorNPC(x, z, rotY) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xefc49e, roughness: 0.6 });
    const clothMat = new THREE.MeshStandardMaterial({ color: 0x6e432b, roughness: 0.8 }); // Áo bà ba nâu
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.9 }); // Quần lụa đen
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xd9b37c, roughness: 0.9 }); // Nón lá & quang gánh

    // Thân người dáng nữ duyên dáng
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.9, 10), clothMat);
    body.position.y = 1.05;
    body.castShadow = true;
    group.add(body);

    // Hai chân
    const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.65, 8), pantsMat);
    lLeg.position.set(-0.1, 0.35, 0);
    const rLeg = lLeg.clone();
    rLeg.position.x = 0.1;
    group.add(lLeg, rLeg);
    group.userData.leftLeg = lLeg;
    group.userData.rightLeg = rLeg;

    // Đầu & Nón lá che nghiêng
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), skinMat);
    head.position.y = 1.62;
    group.add(head);

    const nonLa = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.22, 16), strawMat);
    nonLa.position.set(0, 1.76, 0.02);
    nonLa.rotation.x = 0.15;
    nonLa.castShadow = true;
    group.add(nonLa);

    // Đòn gánh tre uốn cong vắt qua vai
    const poleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.95, 1.35, 0),
      new THREE.Vector3(0, 1.52, 0),
      new THREE.Vector3(0.95, 1.35, 0)
    ]);
    const poleMesh = new THREE.Mesh(new THREE.TubeGeometry(poleCurve, 12, 0.03, 6, false), strawMat);
    poleMesh.castShadow = true;
    group.add(poleMesh);
    group.userData.pole = poleMesh;

    // Hai thúng hoa sen hồng & cúc vàng hai đầu đòn gánh
    for (let side of [-1, 1]) {
      // Dây quang gánh
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.75, 4), strawMat);
      rope.position.set(side * 0.95, 0.98, 0);
      group.add(rope);

      // Thúng tre tròn
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.25, 12), strawMat);
      basket.position.set(side * 0.95, 0.55, 0);
      group.add(basket);

      // Bó hoa sen hồng và cúc vàng rực rỡ
      const flowerColor = side === -1 ? 0xec729c : 0xf4be26;
      const flowerMat = new THREE.MeshStandardMaterial({ color: flowerColor, roughness: 0.5 });
      for (let f = 0; f < 8; f++) {
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), flowerMat);
        flower.position.set(
          side * 0.95 + (Math.random() - 0.5) * 0.35,
          0.72 + Math.random() * 0.12,
          (Math.random() - 0.5) * 0.35
        );
        group.add(flower);
      }
    }

    this.citizens.push(group);
    return group;
  }

  /**
   * Tạo ghế đẩu gỗ mộc chân thực phong cách Canva retro
   * 4 chân choãi góc nhẹ, mặt ghế dày dặn vân gỗ cổ, giằng mộng ngang
   */
  _createRealisticWoodenStool(w = 0.36, h = 0.32, d = 0.36) {
    const group = new THREE.Group();
    const woodMat = this.materials.woodVarnish || this.materials.retroWood || new THREE.MeshStandardMaterial({ color: 0x543622, roughness: 0.75 });

    // 1. Mặt ghế gỗ nguyên tấm, góc vát nhẹ mộc mạc
    const topPlank = new THREE.Mesh(new THREE.BoxGeometry(w, 0.038, d), woodMat);
    topPlank.position.y = h - 0.019;
    topPlank.castShadow = true;
    topPlank.receiveShadow = true;
    group.add(topPlank);

    // Khe chỉ rãnh xẻ giữa mặt ghế (kiểu ghế mộc truyền thống)
    const grooveMat = new THREE.MeshStandardMaterial({ color: 0x2e1a0f, roughness: 0.9 });
    const groove = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.005, 0.012), grooveMat);
    groove.position.set(0, h - 0.002, 0);
    group.add(groove);

    // 2. 4 chân gỗ tiện vuông choãi nhẹ tạo thế vững chãi
    const legW = 0.042;
    const legH = h - 0.038;
    const legGeo = new THREE.BoxGeometry(legW, legH, legW);
    const legSpreadX = w * 0.36;
    const legSpreadZ = d * 0.36;

    for (let lx of [-1, 1]) {
      for (let lz of [-1, 1]) {
        const leg = new THREE.Mesh(legGeo, woodMat);
        leg.position.set(lx * legSpreadX, legH / 2, lz * legSpreadZ);
        leg.rotation.z = -lx * 0.055; // Choãi nhẹ sang 2 bên
        leg.rotation.x = lz * 0.055;
        leg.castShadow = true;
        group.add(leg);
      }
    }

    // 3. Các thanh giằng chân ngang liên kết mộng gỗ
    const rungGeoX = new THREE.BoxGeometry(w * 0.72, 0.024, 0.024);
    const rungGeoZ = new THREE.BoxGeometry(0.024, 0.024, d * 0.72);
    for (let rz of [-1, 1]) {
      const rung = new THREE.Mesh(rungGeoX, woodMat);
      rung.position.set(0, legH * 0.38, rz * (legSpreadZ * 0.88));
      group.add(rung);
    }
    for (let rx of [-1, 1]) {
      const rung = new THREE.Mesh(rungGeoZ, woodMat);
      rung.position.set(rx * (legSpreadX * 0.88), legH * 0.44, 0);
      group.add(rung);
    }

    return group;
  }

  /**
   * Tạo Quán Trà Đá Vỉa Hè Chân Thực & NPC Bà Cụ Tính (Phong cách Canva Retro)
   * Tích hợp 4 ghế đẩu gỗ mộc có thể ngồi tương tác phím [E] mượt mà 60 FPS
   */
  _createTeaStallVendorNPC(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const woodMat = this.materials.woodVarnish || this.materials.retroWood || new THREE.MeshStandardMaterial({ color: 0x543622, roughness: 0.75 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xd9b37c, roughness: 0.9 });

    // 1. CHIẾC BÀN GỖ VỈA HÈ CỔ MỘC MẠC (Đặt tại tâm 0, 0, 0)
    const tableW = 1.05;
    const tableD = 0.68;
    const tableH = 0.46;
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(tableW, 0.04, tableD), woodMat);
    tableTop.position.y = tableH - 0.02;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    group.add(tableTop);

    // 4 Chân bàn gỗ vuông và giằng liên kết mộng
    const tLegW = 0.05;
    const tLegH = tableH - 0.04;
    for (let lx of [-1, 1]) {
      for (let lz of [-1, 1]) {
        const tLeg = new THREE.Mesh(new THREE.BoxGeometry(tLegW, tLegH, tLegW), woodMat);
        tLeg.position.set(lx * (tableW * 0.42), tLegH / 2, lz * (tableD * 0.40));
        tLeg.castShadow = true;
        group.add(tLeg);
      }
    }
    // Giằng ngang chân bàn
    const tRung = new THREE.Mesh(new THREE.BoxGeometry(tableW * 0.82, 0.03, 0.03), woodMat);
    tRung.position.set(0, tLegH * 0.35, 0);
    group.add(tRung);

    this._addBoxObstacle(x, z, tableW + 0.1, tableD + 0.1, 0, tableH + 0.3);

    // 2. PHÍCH NƯỚC RẠNG ĐÔNG ĐỎ VINTAGE (Vỏ sắt sơn đỏ, quai nhôm chữ U, nút bần gỗ)
    const thermosGroup = new THREE.Group();
    thermosGroup.position.set(-0.32, tableH, -0.16);

    const thermosRedMat = new THREE.MeshStandardMaterial({ color: 0xbd1e24, roughness: 0.35, metalness: 0.45 });
    const aluMat = new THREE.MeshStandardMaterial({ color: 0xd0d5dd, metalness: 0.85, roughness: 0.25 });
    const corkMat = new THREE.MeshStandardMaterial({ color: 0x936738, roughness: 0.9 });

    // Thân phích
    const tBody = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.088, 0.32, 16), thermosRedMat);
    tBody.position.y = 0.16;
    tBody.castShadow = true;
    thermosGroup.add(tBody);

    // Vai và nắp nhôm
    const tShoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.082, 0.05, 16), aluMat);
    tShoulder.position.y = 0.345;
    thermosGroup.add(tShoulder);

    const tCap = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.046, 0.08, 14), aluMat);
    tCap.position.y = 0.41;
    thermosGroup.add(tCap);

    // Nút bần gỗ
    const tCork = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 0.04, 10), corkMat);
    tCork.position.y = 0.47;
    thermosGroup.add(tCork);

    // Quai xách nhôm chữ U
    const tHandle = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.007, 8, 16, Math.PI), aluMat);
    tHandle.position.set(0, 0.32, 0);
    tHandle.rotation.x = Math.PI;
    thermosGroup.add(tHandle);

    group.add(thermosGroup);

    // 3. ẤM TÍCH MEN LAM BÁT TRÀNG TRONG GIÀNH MÂY TRE ĐAN GIỮ NHIỆT
    const teaCosyGroup = new THREE.Group();
    teaCosyGroup.position.set(-0.10, tableH, -0.15);

    // Giành tre bọc ngoài
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.135, 0.20, 14), strawMat);
    basket.position.y = 0.10;
    basket.castShadow = true;
    teaCosyGroup.add(basket);

    // Nắp giành tre
    const basketLid = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 14), strawMat);
    basketLid.position.y = 0.215;
    teaCosyGroup.add(basketLid);

    // Vòi ấm tích sứ men lam thò ra
    const ceramicMat = this.materials.batTrangCeramic || new THREE.MeshStandardMaterial({ color: 0x224b6e, roughness: 0.25 });
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.10, 8), ceramicMat);
    spout.position.set(0.11, 0.16, 0.04);
    spout.rotation.z = -Math.PI / 4;
    teaCosyGroup.add(spout);

    // Quai đồng ấm tích
    const potHandle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.006, 6, 12, Math.PI), brassMat);
    potHandle.position.set(0, 0.23, 0);
    teaCosyGroup.add(potHandle);

    group.add(teaCosyGroup);

    // 4. KHAY CỐC THỦY TINH MẮT LIẾC / HOA DÂU VIỀN BỌT XANH HẢI PHÒNG (NƯỚC CHÈ VÀNG HỔ PHÁCH)
    const trayGroup = new THREE.Group();
    trayGroup.position.set(0.18, tableH, -0.08);

    // Khay nhôm mờ
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.015, 0.24), aluMat);
    tray.position.y = 0.008;
    trayGroup.add(tray);

    // Cốc thủy tinh bọt xanh tái chế kinh điển
    const greenGlassMat = new THREE.MeshStandardMaterial({
      color: 0x82bfa8,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.76
    });
    const teaLiquidMat = new THREE.MeshStandardMaterial({
      color: 0xc48020,
      roughness: 0.2,
      transparent: true,
      opacity: 0.90
    });

    const cupPositions = [
      [-0.08, -0.05],
      [0.08, -0.05],
      [-0.08, 0.05],
      [0.08, 0.05]
    ];
    cupPositions.forEach(([cx, cz]) => {
      // Thành cốc viền bọt xanh dày dặn
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.030, 0.085, 10), greenGlassMat);
      cup.position.set(cx, 0.05, cz);
      cup.castShadow = true;
      trayGroup.add(cup);

      // Nước chè sóng sánh bên trong
      const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.028, 0.065, 8), teaLiquidMat);
      tea.position.set(cx, 0.045, cz);
      trayGroup.add(tea);
    });

    group.add(trayGroup);

    // 5. ĐIẾU CÀY TRE NỨA LÊN NƯỚC CÁNH GIÁN & BAO DIÊM THỐNG NHẤT
    const pipeGroup = new THREE.Group();
    pipeGroup.position.set(0.42, 0.08, 0.18);
    pipeGroup.rotation.z = 0.25;

    // Thân ống nứa ngả màu mật mía bóng loáng
    const bambooMat = new THREE.MeshStandardMaterial({ color: 0x5c3218, roughness: 0.35, metalness: 0.15 });
    const pipeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.62, 12), bambooMat);
    pipeBody.position.y = 0.31;
    pipeBody.castShadow = true;
    pipeGroup.add(pipeBody);

    // Vành đồng bịt đầu điếu
    const pipeRing = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.04, 12), brassMat);
    pipeRing.position.y = 0.60;
    pipeGroup.add(pipeRing);

    // Nõ điếu mun đen bóng tiện hoa văn
    const ebonyMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.4 });
    const pipeNo = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 8), ebonyMat);
    pipeNo.position.set(0.035, 0.46, 0);
    pipeNo.rotation.z = -Math.PI / 3;
    pipeGroup.add(pipeNo);

    group.add(pipeGroup);

    // Bát điếu gốm da lươn & ống đóm nứa bên chân bàn
    const spittoonMat = new THREE.MeshStandardMaterial({ color: 0x4a3423, roughness: 0.5 });
    const spittoon = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.12, 10), spittoonMat);
    spittoon.position.set(0.36, 0.06, 0.38);
    group.add(spittoon);

    // Bao diêm Thống Nhất in chim bồ câu hòa bình
    const matchMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.7 });
    const matchBox = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.02, 0.038), matchMat);
    matchBox.position.set(0.25, tableH + 0.01, 0.18);
    group.add(matchBox);

    // 6. ĐĨA KẸO LẠC RẮC VỪNG TRẮNG, KẸO DỒI & THUỐC LÁ THĂNG LONG
    const plateGroup = new THREE.Group();
    plateGroup.position.set(0.05, tableH, 0.18);

    const plateMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.4 });
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.018, 12), plateMat);
    plate.position.y = 0.009;
    plateGroup.add(plate);

    // Thanh kẹo lạc vừng trắng
    const peanutCandyMat = new THREE.MeshStandardMaterial({ color: 0xba762a, roughness: 0.65 });
    for (let p = 0; p < 3; p++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.025), peanutCandyMat);
      bar.position.set(-0.03 + p * 0.03, 0.022, (p % 2) * 0.01);
      bar.rotation.y = p * 0.3;
      plateGroup.add(bar);
    }

    // Kẹo dồi giòn bọc đường trắng
    const doiCandyMat = new THREE.MeshStandardMaterial({ color: 0xededed, roughness: 0.6 });
    const doiCandy = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8), doiCandyMat);
    doiCandy.rotation.z = Math.PI / 2;
    doiCandy.position.set(0.01, 0.032, -0.02);
    plateGroup.add(doiCandy);

    // Bao thuốc lá Thăng Long bao thiếc
    const thangLongMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    const cigPack = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.022, 0.09), thangLongMat);
    cigPack.position.set(-0.16, tableH + 0.011, 0.16);
    group.add(cigPack);

    group.add(plateGroup);

    // 7. GHẾ ĐẨU CỦA CỤ TÍNH & NPC CỤ TÍNH (Ngồi nhân từ tại z = +0.65 hướng về bàn)
    const grandmaStool = this._createRealisticWoodenStool(0.36, 0.32, 0.36);
    grandmaStool.position.set(0, 0, 0.65);
    group.add(grandmaStool);

    try {
      const model = createHanoiCharacter3D('char_co_gai_ao_ba_ba');
      // Hạ thấp mô hình nhân vật để khung chậu khớp chính xác trên mặt ghế đẩu gỗ (cao 0.32m), chân buông chạm đất
      model.position.set(0, -0.60, 0.65);
      model.rotation.y = Math.PI; // Quay mặt về phía Bắc nhìn vào bàn
      model.traverse(child => {
        if (child.isMesh && child.geometry instanceof THREE.CircleGeometry) {
          child.visible = false;
        }
      });

      // Uốn khớp vào tư thế ngồi hiền từ
      const lHip = model.getObjectByName('Joint_L_Hip');
      const rHip = model.getObjectByName('Joint_R_Hip');
      const lKnee = model.getObjectByName('Joint_L_Knee');
      const rKnee = model.getObjectByName('Joint_R_Knee');
      const lShoulder = model.getObjectByName('Joint_L_Shoulder');
      const rShoulder = model.getObjectByName('Joint_R_Shoulder');
      const lElbow = model.getObjectByName('Joint_L_Elbow');
      const rElbow = model.getObjectByName('Joint_R_Elbow');
      if (lHip) lHip.rotation.x = -Math.PI / 2.15;
      if (rHip) rHip.rotation.x = -Math.PI / 2.15;
      if (lKnee) lKnee.rotation.x = Math.PI / 2.05;
      if (rKnee) rKnee.rotation.x = Math.PI / 2.05;
      if (lShoulder) lShoulder.rotation.x = -0.22;
      if (rShoulder) rShoulder.rotation.x = -0.22;
      if (lElbow) lElbow.rotation.x = 0.45;
      if (rElbow) rElbow.rotation.x = 0.45;

      group.add(model);

      const chestBone = model.getObjectByName('Joint_Chest');
      const headBone = model.getObjectByName('Joint_Head');
      this.animatedObjects.push({
        update: (time) => {
          const b = Math.sin(time * 2.1) * 0.015;
          if (chestBone) chestBone.scale.set(1 + b, 1 + b * 0.5, 1 + b);
          if (headBone) headBone.rotation.x = Math.sin(time * 0.9) * 0.02;
        }
      });
    } catch (e) {
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xdfb48c, roughness: 0.6 });
      const jacketMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.85 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.65, 8), jacketMat);
      body.position.set(0, 0.65, 0.65);
      group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), skinMat);
      head.position.set(0, 1.10, 0.70);
      group.add(head);
    }

    // 8. 4 CHIẾC GHẾ ĐẨU GỖ VỈA HÈ CHO KHÁCH NGỒI TƯƠNG TÁC (SIT SPOTS)
    const sitConfigs = [
      { lx: 0.0, lz: -0.68, rotY: 0, name: 'Ghế chính diện quán Trà đá' },
      { lx: -0.76, lz: 0.0, rotY: Math.PI / 2, name: 'Ghế bên trái quán Trà đá' },
      { lx: 0.76, lz: 0.0, rotY: -Math.PI / 2, name: 'Ghế bên phải quán Trà đá' },
      { lx: -0.56, lz: -0.56, rotY: Math.PI / 4, name: 'Ghế góc hè quán Trà đá' }
    ];

    sitConfigs.forEach((cfg, idx) => {
      const stoolMesh = this._createRealisticWoodenStool(0.36, 0.32, 0.36);
      stoolMesh.position.set(cfg.lx, 0, cfg.lz);
      stoolMesh.rotation.y = cfg.rotY;
      group.add(stoolMesh);

      const worldX = x + cfg.lx;
      const worldZ = z + cfg.lz;

      // Đăng ký tương tác ngồi ghế phím E
      this.interactables.push({
        position: new THREE.Vector3(worldX, 0.35, worldZ),
        radius: 1.25,
        promptText: 'Ngồi uống nước chè vỉa hè',
        actionKey: 'E',
        isSitSpot: true,
        sitSpot: {
          x: worldX,
          y: 0.0,
          seatY: 0.05,
          rotationY: cfg.rotY,
          name: cfg.name
        }
      });
    });

    this.citizens.push(group);
    return group;
  }

  /**
   * Tạo NPC Hai cụ già đánh cờ tướng
   */
  _createChessPlayersNPC(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe2ba95, roughness: 0.6 });
    const silverHairMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.9 });
    const shirtMat1 = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 }); // Áo sơ mi trắng
    const shirtMat2 = new THREE.MeshStandardMaterial({ color: 0x2b4257, roughness: 0.8 }); // Áo len xanh thẫm

    // Cụ ông 1 (Ngồi bên trái, tay vuốt chòm râu bạc đăm chiêu)
    const p1Body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.7, 10), shirtMat1);
    p1Body.position.set(-0.85, 0.68, 0);
    p1Body.rotation.y = Math.PI / 2;
    group.add(p1Body);

    const p1Head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), skinMat);
    p1Head.position.set(-0.85, 1.15, 0.04);
    group.add(p1Head);

    // Chòm râu bạc hiền từ của cụ 1
    const p1Beard = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 6), silverHairMat);
    p1Beard.position.set(-0.85, 1.02, 0.14);
    p1Beard.rotation.x = -0.25;
    group.add(p1Beard);

    const p1Hair = new THREE.Mesh(new THREE.SphereGeometry(0.145, 10, 10), silverHairMat);
    p1Hair.position.set(-0.85, 1.18, 0.02);
    group.add(p1Hair);

    // Cụ ông 2 (Ngồi bên phải, tay giơ quân cờ)
    const p2Body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.7, 10), shirtMat2);
    p2Body.position.set(0.85, 0.68, 0);
    p2Body.rotation.y = -Math.PI / 2;
    group.add(p2Body);

    const p2Head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), skinMat);
    p2Head.position.set(0.85, 1.15, -0.04);
    group.add(p2Head);

    const p2Hair = new THREE.Mesh(new THREE.SphereGeometry(0.145, 10, 10), silverHairMat);
    p2Hair.position.set(0.85, 1.18, -0.06);
    group.add(p2Hair);

    // Cánh tay cụ 2 giơ quân cờ
    const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.35, 6);
    const armMesh = new THREE.Mesh(armGeo, shirtMat2);
    armMesh.position.set(0.60, 0.92, 0);
    armMesh.rotation.z = Math.PI / 3;
    group.add(armMesh);

    // Các quân cờ tướng trên mặt bàn
    for (let i = 0; i < 12; i++) {
      const piece = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.015, 8),
        new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xcc3333 : 0x222222 })
      );
      piece.position.set((Math.random() - 0.5) * 0.7, 0.76, (Math.random() - 0.5) * 0.7);
      group.add(piece);
    }

    this.citizens.push(group);
    return group;
  }

  /**
   * Tạo NPC Khách ngồi uống cà phê ngắm tàu (Seated Realistic Human Patron)
   */
  _createCoffeePatronNPC(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Ghế đẩu gỗ
    const stool = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.35, 0.38), this.materials.retroWood);
    stool.position.y = 0.175;
    group.add(stool);

    // Bàn cà phê nhỏ
    const table = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.60, 0.65), this.materials.retroWood);
    table.position.set(0, 0.30, 0.60);
    group.add(table);

    // Tách cà phê phin nhôm trên bàn
    const coffeeCup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.07, 8), new THREE.MeshStandardMaterial({ color: 0xd9d9d9, metalness: 0.7 }));
    coffeeCup.position.set(0, 0.635, 0.55);
    group.add(coffeeCup);

    // Mô hình người 3D điêu khắc ngồi uống cà phê
    try {
      const model = createHanoiCharacter3D('char_nam_tri_thuc_suit');
      // Hạ thấp mô hình ngồi vừa khít mặt ghế đẩu gỗ (cao 0.35m), không bay lơ lửng
      model.position.set(0, -0.55, 0);
      model.traverse(child => {
        if (child.isMesh && child.geometry instanceof THREE.CircleGeometry) {
          child.visible = false;
        }
      });

      // Uốn khớp hông và đầu gối vào tư thế ngồi thư thái
      const lHip = model.getObjectByName('Joint_L_Hip');
      const rHip = model.getObjectByName('Joint_R_Hip');
      const lKnee = model.getObjectByName('Joint_L_Knee');
      const rKnee = model.getObjectByName('Joint_R_Knee');
      const lArm = model.getObjectByName('Joint_L_UpperArm');
      const rArm = model.getObjectByName('Joint_R_UpperArm');

      if (lHip) lHip.rotation.x = -Math.PI / 2.2;
      if (rHip) rHip.rotation.x = -Math.PI / 2.2;
      if (lKnee) lKnee.rotation.x = Math.PI / 2.1;
      if (rKnee) rKnee.rotation.x = Math.PI / 2.1;
      if (lArm) lArm.rotation.x = 0.5;
      if (rArm) rArm.rotation.x = 0.5;

      group.add(model);

      // Hoạt ảnh thở
      const chestBone = model.getObjectByName('Joint_Chest');
      const headBone = model.getObjectByName('Joint_Head');
      const phase = Math.random() * Math.PI * 2;

      this.animatedObjects.push({
        update: (time) => {
          const b = Math.sin(time * 2.0 + phase) * 0.015;
          if (chestBone) chestBone.scale.set(1 + b, 1 + b * 0.5, 1 + b);
          if (headBone) headBone.rotation.y = Math.sin(time * 0.4 + phase) * 0.05;
        }
      });
    } catch (e) {
      console.warn('[WorldManager] Seated patron fallback:', e);
    }

    this.citizens.push(group);
    return group;
  }

  /**
   * Tạo NPC Người Dân Hà Nội Điêu Khắc 3D Chân Thực (True 3D Realistic Humanoid NPC)
   * Tích hợp giải phẫu người Á Đông, trang phục di sản đa lớp PBR,
   * Hoạt ảnh thở sinh học (Idle Breathing) & Tương tác ánh mắt nhìn người chơi khi lại gần
   */
  _createCitizenNPC(x, z, coatColor, hatType, roleType) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Xác định archetype nhân vật chuẩn văn hóa Thăng Long - Hà Nội
    let charId = 'char_nam_tri_thuc_suit';
    if (hatType === 'áo dài the' || roleType === 'priest') {
      charId = 'char_nam_ao_dai_gam';
    } else if (hatType === 'áo sơ mi hoa' || roleType === 'shopkeeper') {
      charId = 'char_co_gai_ao_ba_ba';
    } else if (hatType === 'nón lá' || roleType === 'flower_vendor') {
      charId = 'char_nu_sinh_ao_dai';
    } else if (hatType === 'kính lão' || roleType === 'historian') {
      charId = 'char_nam_tri_thuc_suit';
    } else if (hatType === 'nón phớt' || roleType === 'walker') {
      charId = 'char_nam_tri_thuc_suit';
    }

    let model = null;
    try {
      model = createHanoiCharacter3D(charId);
      // Nâng nhẹ đế chân 0.045m chống lún
      model.position.set(0, 0.045, 0);
      group.add(model);
    } catch (err) {
      console.warn('[WorldManager] Lỗi nạp mô hình NPC 3D, sử dụng fallback:', err);
      const fallbackBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.95, 8), new THREE.MeshStandardMaterial({ color: coatColor || 0x223a5e }));
      fallbackBody.position.y = 1.05;
      group.add(fallbackBody);
      const fallbackHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), new THREE.MeshStandardMaterial({ color: 0xefc49e }));
      fallbackHead.position.y = 1.62;
      group.add(fallbackHead);
    }

    // Cơ chế Bong bóng thoại 3D trực quan trên đầu NPC khi trò chuyện
    group.showSpeechBubble = (text) => {
      if (typeof document === 'undefined') return;
      if (group._bubbleSprite) {
        group.remove(group._bubbleSprite);
        if (group._bubbleSprite.material.map) group._bubbleSprite.material.map.dispose();
        group._bubbleSprite.material.dispose();
        group._bubbleSprite = null;
      }
      if (group._bubbleTimer) clearTimeout(group._bubbleTimer);

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(255, 252, 240, 0.96)';
      ctx.strokeStyle = '#c49a45';
      ctx.lineWidth = 6;

      const r = 24, w = 480, h = 175, bx = 16, by = 14;
      ctx.beginPath();
      ctx.moveTo(bx + r, by);
      ctx.lineTo(bx + w - r, by);
      ctx.quadraticCurveTo(bx + w, by, bx + w, by + r);
      ctx.lineTo(bx + w, by + h - r);
      ctx.quadraticCurveTo(bx + w, by + h, bx + w - r, by + h);
      ctx.lineTo(bx + w / 2 + 22, by + h);
      ctx.lineTo(bx + w / 2, by + h + 36);
      ctx.lineTo(bx + w / 2 - 22, by + h);
      ctx.lineTo(bx + r, by + h);
      ctx.quadraticCurveTo(bx, by + h, bx, by + h - r);
      ctx.lineTo(bx, by + r);
      ctx.quadraticCurveTo(bx, by, bx + r, by);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1c1714';
      ctx.font = 'bold 26px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const maxChars = 24;
      if (text.length > maxChars) {
        ctx.fillText(text.substring(0, maxChars), 256, 75);
        ctx.fillText(text.substring(maxChars, maxChars * 2), 256, 120);
      } else {
        ctx.fillText(text, 256, 95);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      group._bubbleSprite = new THREE.Sprite(spriteMat);
      group._bubbleSprite.scale.set(2.4, 1.2, 1);
      group._bubbleSprite.position.set(0, 2.38, 0);
      group.add(group._bubbleSprite);

      group._bubbleTimer = setTimeout(() => {
        if (group._bubbleSprite) {
          group.remove(group._bubbleSprite);
          group._bubbleSprite = null;
        }
      }, 6500);
    };

    // Hoạt ảnh sinh học: Nhịp thở ngực & Chuyển động nhìn người chơi khi đến gần
    const chestBone = model ? model.getObjectByName('Joint_Chest') : null;
    const headBone = model ? model.getObjectByName('Joint_Head') : null;
    const animPhase = (x * 17.3 + z * 31.7) % (Math.PI * 2);

    group.userData.idleAnimate = (time, delta, playerPos) => {
      // 1. Nhịp thở tự nhiên
      const breath = Math.sin(time * 2.2 + animPhase) * 0.016;
      if (chestBone) {
        chestBone.scale.set(1.0 + breath, 1.0 + breath * 0.5, 1.0 + breath);
      }
      // 2. Chuyển động ánh mắt nhìn theo người chơi khi lại gần (trong phạm vi 6m)
      if (headBone) {
        headBone.rotation.x = Math.sin(time * 1.1 + animPhase) * 0.02;
        if (playerPos) {
          const dx = playerPos.x - group.position.x;
          const dz = playerPos.z - group.position.z;
          const d2 = dx * dx + dz * dz;
          if (d2 < 36.0 && d2 > 0.5) {
            const worldAngle = Math.atan2(dx, dz);
            const localAngle = worldAngle - group.rotation.y;
            const clamped = THREE.MathUtils.clamp(localAngle, -0.65, 0.65);
            headBone.rotation.y = THREE.MathUtils.lerp(headBone.rotation.y, clamped, 0.06);
          } else {
            headBone.rotation.y = THREE.MathUtils.lerp(headBone.rotation.y, Math.sin(time * 0.6 + animPhase) * 0.04, 0.04);
          }
        }
      }
    };

    this.animatedObjects.push({
      update: (time, delta) => {
        const playerPos = (window._GameCoreInstance && window._GameCoreInstance.playerController)
          ? window._GameCoreInstance.playerController.getPosition()
          : null;
        if (group.userData.idleAnimate) {
          group.userData.idleAnimate(time, delta, playerPos);
        }
      }
    });

    this.citizens.push(group);
    return group;
  }

  /**
   * Tạo Cây Cổ Thụ Hà Nội Chân Thực Chuẩn 3D (Realistic Hanoi Heritage Tree)
   * Thân gỗ gồ ghề vặn xoắn tự nhiên, rễ cuồn cuộn trồi mặt đất, cành chạc ba phân tầng,
   * và các cụm tán lá bồng bềnh đa tầng màu sắc tươi tắn chân thực!
   */
  _createRealisticHeritageTree(options = {}) {
    const {
      type = 'willow',      // 'willow' (liễu rủ ven hồ), 'shade' (cây bóng mát cổ thụ), 'bang' (cây bàng lá đỏ)
      trunkRadius = 0.36,
      treeHeight = 5.8,
      scale = 1.0,
      seed = 0
    } = options;

    const group = new THREE.Group();
    group.scale.setScalar(scale);

    // 1. RỄ CÂY CUỒN CUỘN TRỒI TRÊN MẶT ĐẤT (ORGANIC SURFACE ROOTS)
    const rootMat = this.materials.retroWood || new THREE.MeshStandardMaterial({ color: 0x3b271a, roughness: 0.92 });
    const numRoots = 5;
    for (let r = 0; r < numRoots; r++) {
      const rootAngle = (r / numRoots) * Math.PI * 2 + (seed * 0.7);
      const rootDist = 1.4 + Math.sin(r * 2.3 + seed) * 0.35;
      const rootCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.40, 0),
        new THREE.Vector3(Math.cos(rootAngle) * (rootDist * 0.5), 0.16, Math.sin(rootAngle) * (rootDist * 0.5)),
        new THREE.Vector3(Math.cos(rootAngle) * rootDist, 0.02, Math.sin(rootAngle) * rootDist)
      ]);
      const rootMesh = new THREE.Mesh(new THREE.TubeGeometry(rootCurve, 8, trunkRadius * 0.42, 6, false), rootMat);
      rootMesh.castShadow = true;
      group.add(rootMesh);
    }

    // 2. THÂN CÂY CHÍNH VẶN XOẮN TỰ NHIÊN (GNARLED MAIN TRUNK)
    const leanX = Math.sin(seed * 1.7) * 0.35 + (type === 'willow' ? 0.45 : 0.1);
    const leanZ = Math.cos(seed * 2.1) * 0.35;
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(leanX * 0.3, treeHeight * 0.25, leanZ * 0.3),
      new THREE.Vector3(leanX * 0.7, treeHeight * 0.50, leanZ * 0.7),
      new THREE.Vector3(leanX, treeHeight * 0.65, leanZ)
    ]);
    const trunkMesh = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 10, trunkRadius, 8, false), rootMat);
    trunkMesh.castShadow = true;
    group.add(trunkMesh);

    // 3. CÁC CÀNH CHÍNH VƯƠN TỎA RA CÁC HƯỚNG (PRIMARY BOUGHS)
    const forkY = treeHeight * 0.65;
    const boughAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
    const boughEnds = [];

    boughAngles.forEach((baseAngle, idx) => {
      const angle = baseAngle + Math.sin(idx + seed) * 0.35;
      const reach = 1.9 + Math.cos(idx * 1.5 + seed) * 0.4;
      const boughEnd = new THREE.Vector3(
        leanX + Math.cos(angle) * reach,
        forkY + 1.2 + Math.sin(idx * 2.0) * 0.35,
        leanZ + Math.sin(angle) * reach
      );
      boughEnds.push({ pos: boughEnd, angle: angle });

      const boughCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(leanX, forkY, leanZ),
        new THREE.Vector3(
          leanX + Math.cos(angle) * (reach * 0.5),
          forkY + 0.75,
          leanZ + Math.sin(angle) * (reach * 0.5)
        ),
        boughEnd
      ]);
      const boughMesh = new THREE.Mesh(new THREE.TubeGeometry(boughCurve, 8, trunkRadius * 0.52, 6, false), rootMat);
      boughMesh.castShadow = true;
      group.add(boughMesh);
    });

    // 4. VẬT LIỆU TÁN LÁ BỒNG BỀNH ĐA TẦNG MÀU SẮC TỰ NHIÊN (VOLUMETRIC FOLIAGE MATERIALS)
    let foliageMatShadow, foliageMatMid, foliageMatHighlight;

    if (type === 'bang') {
      // Cây bàng già lá đỏ cuối thu rực rỡ
      foliageMatShadow = new THREE.MeshStandardMaterial({ color: 0x6e1b12, roughness: 0.88 });
      foliageMatMid = new THREE.MeshStandardMaterial({ color: 0xa82b18, roughness: 0.85 });
      foliageMatHighlight = new THREE.MeshStandardMaterial({ color: 0xcc4b20, roughness: 0.80 });
    } else {
      // Liễu rủ & Cây xanh bóng mát Hà Nội
      foliageMatShadow = new THREE.MeshStandardMaterial({ color: 0x1d3a15, roughness: 0.88 });
      foliageMatMid = new THREE.MeshStandardMaterial({ color: 0x365f22, roughness: 0.85 });
      foliageMatHighlight = new THREE.MeshStandardMaterial({ color: 0x528230, roughness: 0.80 });
    }

    // 5. CÁC CỤM TÁN LÁ BỒNG BỀNH HÌNH KHỐI HỮU CƠ (ORGANIC FOLIAGE CLOUDS)
    // Đỉnh vòm tán trên cùng
    const topCloud = new THREE.Mesh(new THREE.SphereGeometry(2.0, 10, 8), foliageMatHighlight);
    topCloud.position.set(leanX, forkY + 1.85, leanZ);
    topCloud.scale.set(1.2, 0.72, 1.2);
    topCloud.castShadow = true;
    group.add(topCloud);

    // Tán lá theo từng cành chính
    boughEnds.forEach((bough, bIdx) => {
      // Cụm tán chính đầu cành
      const clumpRadius = 1.6 + (bIdx % 2) * 0.3;
      const clumpMesh = new THREE.Mesh(
        new THREE.SphereGeometry(clumpRadius, 10, 8),
        bIdx % 2 === 0 ? foliageMatMid : foliageMatShadow
      );
      clumpMesh.position.copy(bough.pos);
      clumpMesh.scale.set(1.25, 0.68, 1.25);
      clumpMesh.castShadow = true;
      group.add(clumpMesh);

      // Cụm phụ đệm bên dưới và vươn ra ngoài
      const subPos = new THREE.Vector3(
        bough.pos.x + Math.cos(bough.angle) * 0.75,
        bough.pos.y - 0.40,
        bough.pos.z + Math.sin(bough.angle) * 0.75
      );
      const subMesh = new THREE.Mesh(
        new THREE.SphereGeometry(clumpRadius * 0.8, 8, 6),
        foliageMatHighlight
      );
      subMesh.position.copy(subPos);
      subMesh.scale.set(1.15, 0.65, 1.15);
      subMesh.castShadow = true;
      group.add(subMesh);
    });

    // 6. DẢI LIỄU RỦ THƠ MỘNG BUÔNG BÓNG XUỐNG MẶT NƯỚC (NẾU LÀ CÂY LIỄU)
    if (type === 'willow') {
      const vineMat = new THREE.MeshStandardMaterial({
        color: 0x487530,
        roughness: 0.82
      });
      const numVines = 18;
      for (let v = 0; v < numVines; v++) {
        const vAngle = (v / numVines) * Math.PI * 2;
        const vDist = 2.4 + Math.sin(v * 3.1) * 0.45;
        const vx = leanX + Math.cos(vAngle) * vDist;
        const vz = leanZ + Math.sin(vAngle) * vDist;
        const vyStart = forkY + 0.8 + Math.cos(v * 2.2) * 0.35;
        const vineLen = 2.8 + Math.sin(v * 1.7) * 0.65;

        // Dải liễu mềm mại thon dài rủ bóng
        const vineGeo = new THREE.CylinderGeometry(0.08, 0.02, vineLen, 5);
        const vineMesh = new THREE.Mesh(vineGeo, vineMat);
        vineMesh.position.set(vx, vyStart - vineLen / 2, vz);
        vineMesh.rotation.z = Math.sin(vAngle) * 0.12;
        vineMesh.rotation.x = Math.cos(vAngle) * 0.12;
        group.add(vineMesh);
      }
    }

    return group;
  }

  /**
   * Tạo Cây Liễu Rủ Ven Hồ Gươm (Thân gỗ cong nghiêng, rễ cuộn, cành lá buông rủ soi bóng nước hồ chân thực)
   */
  _createWeepingWillow(seed = 0) {
    return this._createRealisticHeritageTree({ type: 'willow', seed: seed });
  }

  /**
   * Tạo ngôi nhà ống kiến trúc Hà Nội xưa chân thực có đầy đủ chi tiết:
   * Vôi vàng, mái ngói âm dương, cửa chớp gỗ xanh, hoa sắt ban công và biển hiệu vẽ tay
   */
  _createDetailedHanoiHouse(width, height, depth, signText) {
    const houseGroup = new THREE.Group();

    // 1. Thân nhà vôi vàng cổ kính
    const bodyGeo = new THREE.BoxGeometry(width, height, depth);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.materials.yellowWall);
    bodyMesh.position.y = height / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    houseGroup.add(bodyMesh);
    this.colliders.push(bodyMesh);

    // 2. Mái ngói mũi hài / ngói âm dương rêu phong nhấp nhô
    const roofGeo = new THREE.ConeGeometry(width * 0.72, 2.6, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMesh = new THREE.Mesh(roofGeo, this.materials.roofTile);
    roofMesh.position.set(0, height + 1.3, 0);
    roofMesh.scale.set(1, 1, depth / (width * 0.72));
    roofMesh.castShadow = true;
    houseGroup.add(roofMesh);

    // Bờ nóc mái ngói truyền thống uốn cong có con kìm nóc
    const ridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-width * 0.42, height + 2.65, 0),
      new THREE.Vector3(0, height + 2.50, 0),
      new THREE.Vector3(width * 0.42, height + 2.65, 0)
    ]);
    const ridgeMesh = new THREE.Mesh(new THREE.TubeGeometry(ridgeCurve, 12, 0.12, 6, false), this.materials.roofTile);
    houseGroup.add(ridgeMesh);

    // 3. Cửa tầng 1 (Cửa đi bằng gỗ có ô kính trên)
    const doorGeo = new THREE.BoxGeometry(2.4, 3.2, 0.12);
    const door = new THREE.Mesh(doorGeo, this.materials.frenchGreenShutter);
    door.position.set(0, 1.6, depth / 2 + 0.06);
    houseGroup.add(door);

    // Mái hiên di động kẻ sọc ấm áp che nắng trước hiên tầng 1
    const awningGeo = new THREE.PlaneGeometry(width * 0.72, 2.2);
    const awningMat = new THREE.MeshStandardMaterial({
      color: 0xc44c29, // Sọc cam gạch nung ấm áp
      roughness: 0.75,
      side: THREE.DoubleSide
    });
    const awning = new THREE.Mesh(awningGeo, awningMat);
    awning.rotation.x = -Math.PI / 3.2;
    awning.position.set(0, 3.3, depth / 2 + 0.95);
    houseGroup.add(awning);

    // 4. Các tầng trên có Cửa chớp gỗ xanh Pháp cổ
    const floors = Math.floor(height / 3.8);
    for (let f = 1; f < floors; f++) {
      const floorY = f * 3.8 + 1.2;

      // Cửa sổ chớp xanh 2 bên
      for (let s of [-1, 1]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 0.1), this.materials.frenchGreenShutter);
        win.position.set(s * (width * 0.28), floorY, depth / 2 + 0.06);
        houseGroup.add(win);
      }

      // Cục nóng điều hòa treo tường (chi tiết đời thực Hà Nội)
      if (f === 1) {
        const acUnit = new THREE.Mesh(
          new THREE.BoxGeometry(0.72, 0.52, 0.32),
          new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.45 })
        );
        acUnit.position.set(width * 0.38, floorY + 0.3, depth / 2 + 0.18);
        const fanCircle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 0.02, 12),
          new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        fanCircle.rotation.x = Math.PI / 2;
        fanCircle.position.set(width * 0.38, floorY + 0.3, depth / 2 + 0.35);
        houseGroup.add(acUnit, fanCircle);
      }

      // Ban công hoa sắt uốn lượn nghệ thuật kiểu Pháp
      const balconyBase = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, 0.2, 1.2), this.materials.mossStone);
      balconyBase.position.set(0, floorY - 1.0, depth / 2 + 0.6);
      balconyBase.castShadow = true;
      houseGroup.add(balconyBase);

      const balconyRail = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.85, 0.85), this.materials.frenchBalconyIron);
      balconyRail.position.set(0, floorY - 0.55, depth / 2 + 1.15);
      houseGroup.add(balconyRail);
    }

    // 5. Biển hiệu vẽ tay phong cách retro hoài niệm
    if (signText) {
      const signBoard = new THREE.Mesh(new THREE.BoxGeometry(width * 0.65, 0.95, 0.08), this.materials.vintagePosters);
      signBoard.position.set(0, 3.8, depth / 2 + 0.12);
      houseGroup.add(signBoard);
    }

    return houseGroup;
  }

  /**
   * Tạo tòa nhà tập thể 5 tầng kiểu Kim Liên / Giảng Võ
   */
  _createDetailedCollectiveBlock(width, height, depth, blockName) {
    const blockGroup = new THREE.Group();

    // Khối nhà bê tông tấm lớn màu vàng hoàng cúc cũ kỹ
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), this.materials.yellowWall);
    bodyMesh.position.y = height / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    blockGroup.add(bodyMesh);
    this.colliders.push(bodyMesh);

    // Mái bằng bê tông có gờ chắn nước
    const roofBorder = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, 0.8, depth + 0.6), this.materials.mossStone);
    roofBorder.position.y = height + 0.4;
    blockGroup.add(roofBorder);

    // Hệ thống "Chuồng Cọp" sắt cơi nới nhô ra ngoài
    const floors = 5;
    const floorH = height / floors;

    for (let f = 1; f < floors; f++) {
      const y = f * floorH + floorH * 0.45;
      for (let s of [-1, 1]) {
        // Lồng chuồng cọp sắt
        const cage = new THREE.Mesh(new THREE.BoxGeometry(width * 0.35, floorH * 0.8, 1.4), this.materials.darkIron);
        cage.position.set(s * (width * 0.25), y, depth / 2 + 0.7);
        blockGroup.add(cage);

        // Giàn hoa giấy đỏ rực rủ từ chuồng cọp
        if (Math.random() > 0.3) {
          const flower = new THREE.Mesh(new THREE.BoxGeometry(width * 0.36, 0.6, 1.5), this.materials.bougainvilleaRed);
          flower.position.set(s * (width * 0.25), y - 0.4, depth / 2 + 0.75);
          blockGroup.add(flower);
        }
      }
    }

    return blockGroup;
  }

  /**
   * Tạo dầm thép Eiffel nhịp Cầu Long Biên
   */
  /**
   * Tạo dầm thép Eiffel Daydé & Pillé Cầu Long Biên chân thực (Cantilever Lattice Truss Module)
   * Nhịp công-xôn uốn lượn đặc trưng: đỉnh tháp cao 13.5m tại trụ, thoải dần xuống 6.2m tại giữa nhịp
   * Tích hợp giàn liên kết ngang đỉnh vòm (overhead sway portals) và giá đỡ công-xôn cánh gà hai bên
   */
  _createEiffelTrussSpan(length = 34.0, height = 13.5) {
    const trussGroup = new THREE.Group();
    const beamMat = this.materials.rustySteel;
    const woodMat = this.materials.retroWood || this.materials.woodVarnish;
    const stoneMat = this.materials.mossStone;

    const halfL = length / 2;
    const lowH = 6.2;
    const peakH = height;

    // Helper tạo dầm hộp
    const box = (w, h, d, mat = beamMat) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    };

    // 1. HAI DẦM GIÀN THÉP CHÍNH HAI BÊN ĐƯỜNG RAY (Z = -2.85 và Z = +2.85)
    for (let zSide of [-2.85, 2.85]) {
      // Dầm hạ (Bottom Chord) chạy thẳng suốt chiều dài nhịp
      const bottomChord = box(length + 0.2, 0.45, 0.35);
      bottomChord.position.set(0, 0.22, zSide);
      trussGroup.add(bottomChord);

      // Dầm thượng (Top Chord) dạng cánh vòm uốn lượn Daydé & Pillé: cao ở 2 đầu trụ, võng ở giữa
      // Nửa trái: từ x = -halfL (cao peakH) dốc xuống x = 0 (cao lowH)
      const slopeLen = Math.hypot(halfL, peakH - lowH);
      const slopeAngle = Math.atan2(peakH - lowH, halfL);

      const topChordL = box(slopeLen + 0.1, 0.38, 0.30);
      topChordL.position.set(-halfL / 2, (peakH + lowH) / 2, zSide);
      topChordL.rotation.z = slopeAngle;
      trussGroup.add(topChordL);

      // Nửa phải: từ x = 0 (cao lowH) dốc lên x = +halfL (cao peakH)
      const topChordR = box(slopeLen + 0.1, 0.38, 0.30);
      topChordR.position.set(halfL / 2, (peakH + lowH) / 2, zSide);
      topChordR.rotation.z = -slopeAngle;
      trussGroup.add(topChordR);

      // Các thanh đứng & thanh giằng xiên chữ X chia thành 8 khoang nhịp (Bays)
      const numBays = 8;
      const bayW = length / numBays;

      for (let b = 0; b <= numBays; b++) {
        const bx = -halfL + b * bayW;
        // Chiều cao tại vị trí x
        const bayH = lowH + (Math.abs(bx) / halfL) * (peakH - lowH);

        // Thanh đứng chính (Vertical Posts)
        const post = box(0.24, bayH, 0.24);
        post.position.set(bx, bayH / 2, zSide);
        trussGroup.add(post);

        // Thanh chéo chữ X đan trong từng khoang (trừ mép ngoài cùng)
        if (b < numBays) {
          const nextX = bx + bayW;
          const nextH = lowH + (Math.abs(nextX) / halfL) * (peakH - lowH);
          const midH = (bayH + nextH) / 2;
          const diagLen = Math.hypot(bayW, midH);
          const diagAngle = Math.atan2(midH, bayW);

          const diag1 = box(diagLen, 0.14, 0.14);
          diag1.position.set(bx + bayW / 2, midH / 2, zSide);
          diag1.rotation.z = diagAngle;
          trussGroup.add(diag1);

          const diag2 = box(diagLen, 0.14, 0.14);
          diag2.position.set(bx + bayW / 2, midH / 2, zSide);
          diag2.rotation.z = -diagAngle;
          trussGroup.add(diag2);
        }
      }

      // Bản táp đinh tán liên kết (Rivet gusset plates) tại các điểm nút
      for (let b = 0; b <= numBays; b += 2) {
        const bx = -halfL + b * bayW;
        const bayH = lowH + (Math.abs(bx) / halfL) * (peakH - lowH);
        const gusset = box(0.55, 0.55, 0.38);
        gusset.position.set(bx, bayH - 0.2, zSide);
        trussGroup.add(gusset);
      }
    }

    // 2. GIÀN LIÊN KẾT NGANG ĐỈNH VÒM (OVERHEAD TRANSVERSE SWAY PORTALS)
    // Nối hai dầm thép Bắc - Nam trên nóc, tạo thành đường hầm thép Eiffel kỳ vĩ khi tàu chạy qua
    for (let ox of [-halfL, -halfL * 0.6, -halfL * 0.25, 0, halfL * 0.25, halfL * 0.6, halfL]) {
      const hAtX = lowH + (Math.abs(ox) / halfL) * (peakH - lowH);
      // Xà ngang đỉnh
      const portalBeam = box(0.28, 0.28, 5.7);
      portalBeam.position.set(ox, hAtX, 0);
      trussGroup.add(portalBeam);

      // Chống nẹp góc vòm giàn gió
      for (let s of [-1, 1]) {
        const knee = box(0.18, 1.2, 0.18);
        knee.position.set(ox, hAtX - 0.5, s * 2.3);
        knee.rotation.x = s * 0.65;
        trussGroup.add(knee);
      }
    }

    // 3. GIÁ ĐỠ DẦM CÔNG-XÔN CÁNH GÀ HAI BÊN (CANTILEVER WALKWAY BRACKETS)
    // Đỡ hai hành lang đi bộ & xe đạp mở rộng phía ngoài thành cầu
    for (let cx = -halfL + 2; cx <= halfL - 2; cx += 4.25) {
      for (let s of [-1, 1]) {
        const bracket = box(0.18, 0.20, 1.8);
        bracket.position.set(cx, 0.15, s * 3.8);
        trussGroup.add(bracket);

        // Thanh chống chéo xiên góc 45 độ đỡ dầm dưới
        const strut = box(0.14, 1.25, 0.14);
        strut.position.set(cx, -0.45, s * 3.4);
        strut.rotation.x = s * 0.78;
        trussGroup.add(strut);
      }
    }

    return trussGroup;
  }

  _createWillowTree(seed = 1) {
    return this._createRealisticHeritageTree({ type: 'shade', seed: seed });
  }

  /**
   * Cây bàng già lá đỏ cuối thu chân thực (Góc sân tập thể)
   */
  _createBangTree(seed = 5) {
    return this._createRealisticHeritageTree({ type: 'bang', seed: seed });
  }

  /**
   * Ghế đá ven hồ
   */
  _createStoneBench() {
    const group = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.6), this.materials.mossStone);
    slab.position.y = 0.5;
    group.add(slab);
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, 0.5), this.materials.mossStone);
    leg1.position.set(-0.75, 0.22, 0);
    const leg2 = leg1.clone();
    leg2.position.x = 0.75;
    group.add(leg1, leg2);
    return group;
  }

  /**
   * Cột đèn đường Pháp cổ
   */
  _createFrenchStreetLamp() {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 5.0, 8), this.materials.darkIron);
    pole.position.y = 2.5;
    pole.castShadow = true;
    group.add(pole);

    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffea9f, roughness: 0.3 }));
    lantern.position.y = 5.2;
    group.add(lantern);

    return group;
  }

  /**
   * Khởi tạo đường biên giới và ranh giới bản đồ
   */
  _buildBorderAndRoads() {
    // Rào chắn bảo vệ biên 500m x 500m
    const borderMat = this.materials.mossStone;
    const size = 500;
    const wallH = 4.0;
    const thick = 2.0;

    // Biên 4 phía
    this._addBoxObstacle(0, 250, size, thick, 0, wallH);
    this._addBoxObstacle(0, -250, size, thick, 0, wallH);
    this._addBoxObstacle(250, 0, thick, size, 0, wallH);
    this._addBoxObstacle(-250, 0, thick, size, 0, wallH);
  }

  /**
   * Khởi tạo danh sách các điểm tương tác tĩnh (Quán trà đá, Bàn cờ tướng)
   */
  _initInteractables() {
    // 1. Quán trà đá vỉa hè & Trò chuyện với Cụ Tính
    this.interactables.push({
      position: new THREE.Vector3(-50, 0.6, 58.65),
      radius: 2.2,
      promptText: 'Trò chuyện cùng Cụ Tính & Nghe Kể Chuyện Phố Cổ',
      actionKey: 'E',
      onInteract: () => {
        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Bà Cụ Tính &bull; Quán Nước Chè Xanh Phố Cổ',
            role: 'Cụ bà mở quán nước chè bên hiên phố hơn 40 năm',
            avatar: '👵',
            greeting: '"Lãng tử vào làm chén nước chè tươi hay cốc trà đá cho đỡ khát nào cháu! Ngồi xuống chiếc ghế đẩu nghỉ chân một lát nhé!"',
            monumentTitle: 'Văn Hóa Trà Đá & Quán Nước Vỉa Hè Hà Nội',
            historyText: `
              <p>Quán nước chè vỉa hè là linh hồn của đời sống thị dân Hà Nội. Chỉ cần vài chiếc ghế đẩu mộc mạc, chiếc ấm tích bọc trong giành tre giữ nhiệt, vài thanh kẹo lạc, bao diêm Thống Nhất và hàng trăm câu chuyện nhân sinh từ thế sự tới chuyện gia đình được sẻ chia ấm áp.</p>
            `,
            dialogueOptions: [
              { text: 'Bà bán quán ở góc phố này lâu chưa ạ?', reply: 'Từ ngày giải phóng Thủ đô bà đã theo mẹ đun nước chè xanh bán cho khách bộ hành rồi cháu ạ.' },
              { text: 'Chè xanh này bà ủ thế nào mà ngon thế?', reply: 'Lá chè xanh bánh tẻ rửa sạch, vò nhẹ cho giập rồi hãm bằng nước sôi già trong ấm tích bọc vải xốp, màu nước xanh vàng sóng sánh thơm ngát.' }
            ],
            shopItems: [
              { name: 'Cốc Trà Đá Mát Lạnh', price: '5 Xu', desc: 'Vị chát dịu hậu ngọt thanh tao', icon: '🧊' },
              { name: 'Chén Nước Chè Xanh Nóng', price: '5 Xu', desc: 'Ấm lòng ngày đông giá rét', icon: '🍵' },
              { name: 'Thanh Kẹo Lạc Giòn Rụm', price: '5 Xu', desc: 'Vị bùi của lạc hòa quyện mật mía ngọt ngào', icon: '🥜' },
              { name: 'Thanh Kẹo Dồi Giòn Tan', price: '5 Xu', desc: 'Kẹo dồi bọc vừng thơm bùi ngọt dịu', icon: '🍬' }
            ]
          });
        }
      }
    });

    // 2. Bàn cờ tướng sân khu tập thể
    this.interactables.push({
      position: new THREE.Vector3(-75, 0.5, -78),
      radius: 2.5,
      promptText: 'Xem ván cờ thế khu tập thể',
      actionKey: 'E',
      onInteract: () => {
        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Hai Cụ Già &bull; Kỳ Thủ Sân Tập Thể Kim Liên',
            role: 'Các bác hưu trí chiều chiều luận cờ',
            avatar: '♟️',
            greeting: '"Chiếu tướng! Nước cờ này hiểm hóc lắm lãng tử ơi, vào xem các cụ phá thế trận nào!"',
            monumentTitle: 'Ký Ức Khu Tập Thể Cũ Hà Nội (Kim Liên - Giảng Võ)',
            historyText: `
              <p>Những khu tập thể lắp ghép 4-5 tầng xây dựng từ viện trợ hữu nghị thập niên 60-70 mang đậm dấu ấn kiến trúc xã hội chủ nghĩa. Sân chung rộng lớn dưới bóng cây bàng là nơi sinh hoạt cộng đồng: trẻ em bắn bi trốn tìm, người lớn chơi cờ tướng, tưới cây, trò chuyện thắm đượm tình làng nghĩa xóm.</p>
            `,
            dialogueOptions: [
              { text: 'Thế cờ này bên nào đang chiếm ưu thế vậy cụ?', reply: 'Bên Đỏ đang dùng Mã kẹp Cổ, bên Đen còn Pháo gánh nhưng sơ hở đường Xe, ván này căng thẳng lắm!' },
              { text: 'Sống ở khu tập thể ngày xưa thế nào ạ?', reply: 'Ấm cúng lắm cháu! Nhà nào nấu cá kho thơm lừng cả hành lang, mất điện thì cả dãy mang chiếu ra sân hóng gió trò chuyện thâu đêm.' }
            ],
            shopItems: [
              { name: 'Bộ Quân Cờ Tướng Gỗ Hương', price: '30 Xu', desc: 'Quân cờ tiện tay tròn nhẵn bóng', icon: '♟️' },
              { name: 'Quạt Nan Xòe Mùa Hè', price: '10 Xu', desc: 'Chiếc quạt nan tre đơn sơ mát rượi', icon: '🪭' }
            ]
          });
        }
      }
    });

    // 3. Tương tác bên trong Hiệu Thuốc Bắc Gia Truyền
    this.interactables.push({
      position: new THREE.Vector3(-90, 0.5, 46.8),
      radius: 2.8,
      promptText: 'Thăm Thầy Lang & Bốc Thuốc Bổ Dưỡng Sinh',
      actionKey: 'E',
      onInteract: () => {
        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Cụ Lang Triệu &bull; Hiệu Thuốc Bắc Gia Truyền',
            role: 'Thầy thuốc Y học cổ truyền phố Lãn Ông hơn 50 năm kinh nghiệm',
            avatar: '🌿',
            greeting: '"Thiện tai! Lãng tử đi dạo gió sương hồ Gươm, vào đây nhấp ngụm trà atiso và để cụ bắt mạch bốc chén thuốc ấm tạng nhé!"',
            monumentTitle: 'Phố Thuốc Bắc Lãn Ông & Y Học Dân Tộc Cổ Truyền',
            historyText: `
              <p>Phố Lãn Ông là con phố Đông y sầm uất bậc nhất Hà thành từ thời phong kiến. Nơi đây thoang thoảng mùi quế chi, cam thảo, thục địa từ các bao tải thảo mộc phơi nắng bên hiên. Chiếc tủ thuốc 100 ngăn gỗ mun và chiếc dao cầu thái thuốc là hình ảnh biểu trưng của sự ân cần cứu người giúp đời.</p>
            `,
            dialogueOptions: [
              { text: 'Thưa cụ, phố Lãn Ông có tự bao giờ ạ?', reply: 'Từ thế kỷ 18 cháu ạ! Các danh y thời Lê đã quy tụ về đây mở hiệu bốc thuốc trị bệnh cứu người, lấy tên Hải Thượng Lãn Ông Lê Hữu Trác làm kim chỉ nam y đức.' },
              { text: 'Mùi hương ngào ngạt trong tiệm là vị thuốc gì thế ạ?', reply: 'Đó là hương hồi, quế chi, hoa cúc khô và thục địa hầm chín, uống vào thư thái gân cốt, giải tỏa âu lo cuộc sống.' }
            ],
            shopItems: [
              { name: 'Gói Thuốc Bổ Dưỡng Sinh', price: '25 Xu', desc: 'Kỷ tử, đương quy, thục địa bồi bổ khí huyết', icon: '🍵' },
              { name: 'Túi Thảo Mộc Thơm Phố Cổ', price: '15 Xu', desc: 'Hương thơm tự nhiên giúp thư giãn an giấc', icon: '🌿' }
            ]
          });
        }
      }
    });

    // 4. Tương tác bên trong Tiệm May Đo Âu Phục Phố Cổ
    this.interactables.push({
      position: new THREE.Vector3(-114, 0.5, 46.8),
      radius: 2.8,
      promptText: 'May đo Áo Dài & Âu Phục Cổ Điển',
      actionKey: 'E',
      onInteract: () => {
        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Cô Mai &bull; Nghệ Nhân May Đo Lụa Hà Đông',
            role: 'Thợ may áo dài truyền thống gia truyền phố Lương Văn Can',
            avatar: '🧵',
            greeting: '"Chào lãng tử! Ghé xem các súc lụa Vạn Phúc óng ả và may một tà áo dài hay bộ âu phục dạo phố mùa đông nhé!"',
            monumentTitle: 'Nghề May Đo Thủ Công & Tà Áo Dài Hà Nội Xưa',
            historyText: `
              <p>Phố Hàng Trống, Lương Văn Can nổi tiếng với các tay kéo cự phách. Chiếc máy khâu Singer chân gang đạp nhịp nhàng, đường kim mũi chỉ uốn lượn tôn vinh cốt cách thanh lịch, đoan trang của người Hà Nội.</p>
            `,
            dialogueOptions: [
              { text: 'Áo dài Hà Nội xưa có nét gì đặc biệt hả cô?', reply: 'Tà áo dài cổ điển dài thướt tha, eo buông nhẹ nhàng quý phái, may bằng lụa tơ tằm Vạn Phúc mềm mại như mây thu hồ Gươm vậy.' }
            ],
            shopItems: [
              { name: 'Xấp Vải Lụa Tơ Tằm Hà Đông', price: '45 Xu', desc: 'Lụa dệt hoa cúc óng ánh mềm mại', icon: '👘' },
              { name: 'Thước Dây Thợ May Cổ', price: '10 Xu', desc: 'Thước bọc đồng kỷ niệm nghề may phố cổ', icon: '📏' }
            ]
          });
        }
      }
    });

    // 5. Tương tác bên trong Quán Phở Gia Truyền 1954
    this.interactables.push({
      position: new THREE.Vector3(-42, 0.5, 79.2),
      radius: 2.8,
      promptText: 'Thưởng thức Phở Bò Tái Lăn Gừng Nóng Hổi',
      actionKey: 'E',
      onInteract: () => {
        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Bác Cả Phở &bull; Đệ Nhất Phở Bò Gia Truyền 1954',
            role: 'Nghệ nhân phở gia truyền gánh phở xưa từ năm 1954',
            avatar: '🍜',
            greeting: '"Lãng tử vào làm bát tái lăn gừng nóng hổi nào! Nước dùng ninh từ xương ống bò 18 tiếng thơm lừng mùi quế hồi gừng nướng!"',
            monumentTitle: 'Văn Hóa Ẩm Thực Phở Hà Nội - Di Sản Ẩm Thực Thế Giới',
            historyText: `
              <p>Phở là tinh hoa của ẩm thực Hà thành. Bánh phở mỏng mềm dẻo, thịt bò tươi thái mỏng xào lăn thơm phức mùi gừng, hành hoa chẻ xanh biếc, nước dùng trong veo mà ngọt thanh sâu lắng làm xiêu lòng bất kỳ ai ghé thăm Thủ đô.</p>
            `,
            dialogueOptions: [
              { text: 'Bí quyết nước phở ngọt thanh thế này là gì hả bác?', reply: 'Xương bò tươi rửa sạch, ninh liu riu lửa suốt đêm, hớt bọt liên tục và nướng thơm hoa hồi, thảo quả, gừng củ già thả vào.' }
            ],
            shopItems: [
              { name: 'Bát Phở Bò Tái Lăn Gừng Nóng', price: '35 Xu', desc: 'Đậm đà phong vị Hà thành nguyên bản', icon: '🍜' },
              { name: 'Đĩa Quẩy Giòn Rụm', price: '10 Xu', desc: 'Thả vào bát nước phở ăn giòn tan béo ngậy', icon: '🥖' }
            ]
          });
        }
      }
    });

    // 6. Tương tác bên trong Quán Bia Hơi Hà Nội Cổ
    this.interactables.push({
      position: new THREE.Vector3(-66, 0.5, 79.2),
      radius: 2.8,
      promptText: 'Nâng Vại Bia Hơi Bọt Xanh & Ăn Lạc Luộc',
      actionKey: 'E',
      onInteract: () => {
        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Chú Tuấn &bull; Quán Bia Hơi Cổ Phố Đường Tàu',
            role: 'Người rót bia gắn bó với bom bia hơi Hà Nội hơn 30 năm',
            avatar: '🍺',
            greeting: '"Dô! Làm cốc bia hơi mát lạnh xóa tan mệt mỏi đường dài lãng tử ơi! Bia tươi vừa nhập từ nhà máy bia Hoàng Hoa Thám sáng nay đấy!"',
            monumentTitle: 'Văn Hóa Bia Hơi Vỉa Hè & Cốc Thủy Tinh Xanh Huyền Thoại',
            historyText: `
              <p>Cốc thủy tinh bọt xanh dày cộp sản xuất tại Hợp tác xã Thủy tinh Dân Chủ thập niên 70 đã trở thành biểu tượng văn hóa bất tử của bia hơi Hà Nội. Tiếng chạm cốc lanh canh, bọt trắng mịn dâng trào kết nối mọi khoảng cách giữa người với người.</p>
            `,
            dialogueOptions: [
              { text: 'Tại sao bia hơi Hà Nội lại uống bằng cốc thủy tinh bọt xanh này chú?', reply: 'Cốc thủy tinh tái chế dày dặn giữ nhiệt độ lạnh rất lâu, bọt bia nổi đều và cầm chắc tay, uống ngụm bia qua vành cốc dày thấy sảng khoái gấp bội!' }
            ],
            shopItems: [
              { name: 'Vại Bia Hơi Bọt Mịn', price: '15 Xu', desc: 'Vị men tươi thanh mát mát lạnh', icon: '🍺' },
              { name: 'Đĩa Lạc Luộc Nóng Hổi', price: '10 Xu', desc: 'Hạt lạc mẩy bùi bùi chấm muối tiêu ớt', icon: '🥜' }
            ]
          });
        }
      }
    });

    // 7. Tương tác bên trong Tiệm Sửa Đồng Hồ Liên Xô
    this.interactables.push({
      position: new THREE.Vector3(-90, 0.5, 79.2),
      radius: 2.8,
      promptText: 'Gặp Bác Thợ Sửa Đồng Hồ & Nghe Tiếng Tích Tắc',
      actionKey: 'E',
      onInteract: () => {
        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Bác Thợ Kim &bull; Chuyên Gia Đồng Hồ Cơ Liên Xô',
            role: 'Nghệ nhân vi cơ khí lau dầu sửa chữa đồng hồ cơ cổ',
            avatar: '⏱️',
            greeting: '"Tích tắc... tích tắc... Chào lãng tử! Đồng hồ cơ học là cỗ máy đong đếm ký ức. Lại đây ngắm những cỗ máy Poljot và Seiko bền bỉ nửa thế kỷ nhé!"',
            monumentTitle: 'Nghề Sửa Đồng Hồ Cổ & Ký Ức Thời Gian Hà Nội',
            historyText: `
              <p>Chiếc kính lúp đeo mắt, chiếc nhíp gắp mảnh dẻ và lọ dầu cá voi lau bánh răng là hình ảnh quen thuộc của những người thợ sửa đồng hồ phố Hàng Bông, Hàng Gai. Từng bánh răng nhỏ li ti quay nhịp nhàng nhắc nhở con người trân quý từng phút giây cuộc sống.</p>
            `,
            dialogueOptions: [
              { text: 'Chiếc đồng hồ Poljot này chạy được bao lâu rồi hả bác?', reply: 'Từ năm 1972 thời bom đạn đấy cháu! Bác lau dầu định kỳ, bánh răng đồng thau vẫn ăn khớp chuẩn từng phần trăm giây.' }
            ],
            shopItems: [
              { name: 'Lọ Dầu Lau Đồng Hồ Cơ Cổ', price: '15 Xu', desc: 'Dầu bôi trơn vi cơ khí chống hao mòn', icon: '🛢️' },
              { name: 'Kính Lúp Thợ Đồng Hồ', price: '20 Xu', desc: 'Kính phóng đại soi rõ từng chi tiết nhỏ', icon: '🔍' }
            ]
          });
        }
      }
    });

    // 8. Tương tác bên trong Tiệm Cắt Tóc Bình Dân Phố Cổ
    this.interactables.push({
      position: new THREE.Vector3(-114, 0.5, 79.2),
      radius: 2.8,
      promptText: 'Ngồi Ghế Da Cắt Tóc & Cạo Mặt Thảnh Thơi',
      actionKey: 'E',
      onInteract: () => {
        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Chú Chiến &bull; Thợ Cắt Tóc Bình Dân Hà Thành',
            role: 'Tay kéo điêu luyện hơn 35 năm bên hè phố cổ',
            avatar: '💈',
            greeting: '"Mời lãng tử ngồi lên ghế! Cắt tỉa lại mái tóc lãng tử cho gọn gàng, cạo mặt êm ru rồi ta vừa hàn huyên chuyện phố xá ngày đông nhé!"',
            monumentTitle: 'Tiệm Cắt Tóc Vỉa Hè & Nét Bình Yên Đời Thị Dân',
            historyText: `
              <p>Chiếc ghế da simili đỏ xoay tròn êm ru, tấm gương bầu dục soi rõ tán cây rọi nắng, chiếc tông đơ lách cách nhịp nhàng và khăn ấm thoang thoảng mùi xà phòng cạo râu là nét bình dị, an yên đặc trưng của cuộc sống phố phường Hà Nội.</p>
            `,
            dialogueOptions: [
              { text: 'Chú gắn bó với chiếc kéo này lâu chưa?', reply: 'Hơn ba mươi năm rồi cháu ạ! Từ thời thanh niên cắt cho bộ đội xuất ngũ đến nay, khách quen qua đây như anh em trong nhà.' }
            ],
            shopItems: [
              { name: 'Hộp Sáp Vuốt Tóc Hương Hoa Bưởi', price: '20 Xu', desc: 'Hương bưởi tự nhiên mộc mạc thơm dịu', icon: '🧴' },
              { name: 'Chiếc Lược Sừng Trâu Tiện Tay', price: '15 Xu', desc: 'Lược sừng đen bóng mượt răng đều', icon: '🪮' }
            ]
          });
        }
      }
    });
  }

  /**
   * Cập nhật animation các vật thể sống động, cửa mở và NPC bán hàng rong di chuyển
   */
  update(delta, playerPos) {
    // Cập nhật đoàn tàu di sản Ga Long Biên
    this._updateTrain(delta, playerPos);

    const time = performance.now() * 0.001;

    // 0. CULLING CẤP PHÂN KHU TỐI ƯU 60 FPS (Không bao giờ ẩn Cầu Long Biên)
    if (playerPos) {
      const px = playerPos.x;
      const pz = playerPos.z;

      // CẦU LONG BIÊN (Zone 3) là kỳ quan chân trời của Thủ Đô Hà Nội:
      // Toàn bộ 252m dầm thép đã được gộp tối ưu chỉ ~35 draw calls -> LUÔN HIỆN 100%
      // Giúp người chơi đứng từ xa khắp Phố Cổ, Hồ Gươm đều thấy nhịp cầu hùng vĩ
      // và triệt tiêu 100% hiện tượng giật lag / khựng hình khi lại gần hay chạy trên cầu
      if (this.zone3Group) this.zone3Group.visible = true;

      // Phố Cổ (Zone 2) - Trung tâm kết nối, luôn hiện trừ khi đi rất xa ra giữa sông Hồng (px > 120m)
      if (this.zone2Group) {
        this.zone2Group.visible = (px <= 120.0);
      }

      // Hồ Gươm (Zone 1 - 766 mesh):
      // Chỉ ẩn khi người chơi đã lên cầu Long Biên đi sâu ra ngoài sông Hồng (pz >= 50m && px >= 50m)
      // Giúp dạo chơi ở Phố Cổ và dốc dẫn không bao giờ bị khựng hình do bật/tắt Hồ Gươm
      if (this.zone1Group) {
        this.zone1Group.visible = !(pz >= 50.0 && px >= 50.0);
      }

      // Khu Tập Thể (Zone 4): Chỉ ẩn khi người chơi ở trên cầu Long Biên hoặc bờ đông Gia Lâm (pz >= 50m)
      if (this.zone4Group) {
        this.zone4Group.visible = (pz < 50.0);
      }
    }

    // 0b. Culling khoảng cách siêu nhẹ đa tầng (Throttling mỗi 6 frames, giảm 65% Draw Calls)
    if (playerPos && this._cullableObjects) {
      if (this._cullCounter === undefined) this._cullCounter = 0;
      this._cullCounter++;
      if (this._cullCounter === 1 || this._cullCounter % 6 === 0) {
        const px = playerPos.x;
        const pz = playerPos.z;
        for (let i = 0; i < this._cullableObjects.length; i++) {
          const item = this._cullableObjects[i];
          const dx = px - item.posX;
          const dz = pz - item.posZ;
          const d2 = dx * dx + dz * dz;
          item.mesh.visible = (d2 <= item.cullDistSq);
        }
      }
    }

    // 1. Cập nhật các vật thể có animation
    for (let i = 0; i < this.animatedObjects.length; i++) {
      if (this.animatedObjects[i].update) {
        this.animatedObjects[i].update(time, delta);
      }
    }

    // 2. Cập nhật cửa mở mượt mà
    for (let i = 0; i < this.interactiveDoors.length; i++) {
      if (this.interactiveDoors[i].update) {
        this.interactiveDoors[i].update(delta);
      }
    }

    // 3. Cập nhật các NPC bán hàng rong tự động di chuyển (Autonomous Roaming Vendors)
    for (let i = 0; i < this.roamingNpcs.length; i++) {
      if (this.roamingNpcs[i].update) {
        this.roamingNpcs[i].update(delta);
      }
    }

    // 4. Cập nhật đàn cá chép vàng & cá koi bơi lội sinh động dưới lòng Hồ Gươm (Culling khoảng cách > 130m)
    const distToLakeSq = playerPos ? (playerPos.x - 80) * (playerPos.x - 80) + (playerPos.z - (-80)) * (playerPos.z - (-80)) : 0;
    if (distToLakeSq < 130 * 130) {
      for (let i = 0; i < this.lakeFish.length; i++) {
        const fish = this.lakeFish[i];
        fish.orbitAngle += fish.orbitSpeed * delta;
        const r = fish.orbitRadius + Math.sin(time * 1.2 + fish.swimPhase) * 1.2;
        const targetX = fish.centerX + Math.cos(fish.orbitAngle) * r;
        const targetZ = fish.centerZ + Math.sin(fish.orbitAngle) * r;

        // KIỂM TRA BẢO VỆ CHẮC CHẮN: Cá CHỈ bơi trong lòng nước mở, tuyệt đối không xuất hiện trên bờ, đảo hay cầu
        const inSafeWater = this.isPointInOpenLakeWater(targetX, targetZ);
        fish.group.visible = inSafeWater;

        if (inSafeWater) {
          fish.group.position.x = targetX;
          fish.group.position.z = targetZ;
          // Bơi chìm dưới mặt nước hồ tĩnh lặng (-0.04m, nước phẳng ở mức 0.08m)
          fish.group.position.y = -0.04 + Math.sin(time * 1.6 + fish.swimPhase) * 0.01;

          // Hướng quay tiếp tuyến quỹ đạo kèm uốn lượn hình sin nhẹ nhàng
          const tangent = fish.orbitAngle + (Math.PI / 2) * Math.sign(fish.orbitSpeed);
          const serpentine = Math.sin(time * 3.2 + fish.swimPhase) * 0.10;
          fish.group.rotation.y = -tangent + Math.PI / 2 + serpentine;

          // Vẫy đuôi cá nhịp nhàng tự nhiên
          if (fish.tail) {
            fish.tail.rotation.y = Math.sin(time * 5.5 + fish.swimPhase) * 0.35;
          }
        }
      }
    } else {
      for (let i = 0; i < this.lakeFish.length; i++) {
        this.lakeFish[i].group.visible = false;
      }
    }
  }

  /**
   * Kiểm tra tương tác gần nhất (Ưu tiên NPC bán hàng rong đang di chuyển)
   */
  checkNearbyInteraction(playerPos) {
    // 1. Kiểm tra các NPC bán hàng rong đang tuần tra trên đường
    for (let npc of this.roamingNpcs) {
      if (npc.mesh && playerPos.distanceTo(npc.mesh.position) <= (npc.radius || 2.8)) {
        return {
          position: npc.mesh.position,
          radius: npc.radius || 2.8,
          promptText: npc.promptText || 'Trò chuyện / Mua hàng',
          actionKey: 'E',
          onInteract: () => {
            if (npc.onInteract) npc.onInteract(playerPos);
          }
        };
      }
    }

    // 2. Kiểm tra danh sách interactables tĩnh
    for (let item of this.interactables) {
      if (playerPos.distanceTo(item.position) <= item.radius) {
        return item;
      }
    }
    return null;
  }

  /**
   * Danh sách vật cản kiến trúc cứng cáp (AABB)
   */
  getObstacles() {
    return this.obstacles;
  }

  /**
   * Danh sách va chạm con người (NPCs)
   */
  getNpcColliders() {
    return this.npcColliders;
  }

  /**
   * Danh sách colliders cho Raycast
   */
  getColliders() {
    return this.colliders;
  }

  /**
   * =========================================================================
   * 🚂 HỆ THỐNG ĐOÀN TÀU HƠI NƯỚC & TOA PANORAMA DI SẢN CẦU LONG BIÊN 1902
   * =========================================================================
   */
  /**
   * =========================================================================
   * 🚂 HỆ THỐNG ĐOÀN TÀU HƠI NƯỚC DI SẢN KHỨ HỒI LONG BIÊN <-> GIA LÂM
   * Không bao giờ bị mất hình (frustumCulled = false, camera.far = 500m)
   * Chạy trọn vẹn hành trình hai chiều qua cầu Long Biên
   * =========================================================================
   */
  _initDemoTrain(parentGroup, DECK_Y, TRACK_Z) {
    this.trainGroup = new THREE.Group();
    this.trainGroup.name = 'HeritageTrain_LongBien';
    parentGroup.add(this.trainGroup);

    const trainMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.8 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.85 });
    const coachExtMat = new THREE.MeshStandardMaterial({ color: 0x2b1e16, roughness: 0.6 });
    const coachFloorMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.5 });
    const velvetSeatMat = new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.8 });

    const createBox = (w, h, d, mat) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    // 1. ĐẦU MÁY HƠI NƯỚC (STEAM LOCOMOTIVE) - NGUYÊN BẢN DEMO
    const locoGroup = new THREE.Group();
    locoGroup.position.set(0, 0, TRACK_Z);

    const boilerGeom = new THREE.CylinderGeometry(1.0, 1.0, 4.6, 20);
    boilerGeom.rotateZ(Math.PI / 2);
    const boiler = new THREE.Mesh(boilerGeom, trainMat);
    boiler.position.set(0.5, DECK_Y + 2.2, 0);
    boiler.castShadow = true;
    locoGroup.add(boiler);

    const cab = createBox(2.4, 2.6, 2.2, trainMat);
    cab.position.set(-2.4, DECK_Y + 2.5, 0);
    locoGroup.add(cab);

    const chimneyGeom = new THREE.CylinderGeometry(0.3, 0.22, 1.1, 16);
    const chimney = new THREE.Mesh(chimneyGeom, brassMat);
    chimney.position.set(2.0, DECK_Y + 3.4, 0);
    locoGroup.add(chimney);

    const headlightMesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfff5cc }));
    headlightMesh.position.set(3.2, DECK_Y + 2.2, 0);
    locoGroup.add(headlightMesh);

    const headlightLight = new THREE.PointLight(0xfff5cc, 2.5, 30);
    headlightLight.position.set(3.4, DECK_Y + 2.2, 0);
    locoGroup.add(headlightLight);

    for (let wx of [-1.5, 0.2, 1.8]) {
      for (let wz of [-1.0, 1.0]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 16), trainMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(wx, DECK_Y + 0.55, wz);
        locoGroup.add(wheel);
      }
    }
    this.trainGroup.add(locoGroup);

    // 2. TOA TÀU CHỞ KHÁCH CỔ KÍNH CÓ NỘI THẤT CHI TIẾT - NGUYÊN BẢN DEMO
    const coachGroup = new THREE.Group();
    coachGroup.position.set(-8.0, 0, TRACK_Z);

    const COACH_LEN = 9.6;
    const COACH_WIDTH = 2.6;
    const COACH_HEIGHT = 2.6;
    const COACH_FLOOR_Y = DECK_Y + 1.25; // 11.25m

    const coachFloor = createBox(COACH_LEN, 0.2, COACH_WIDTH, coachFloorMat);
    coachFloor.position.y = COACH_FLOOR_Y;
    coachGroup.add(coachFloor);

    const coachRoof = createBox(COACH_LEN + 0.4, 0.18, COACH_WIDTH + 0.3, coachExtMat);
    coachRoof.position.y = COACH_FLOOR_Y + COACH_HEIGHT;
    coachGroup.add(coachRoof);

    const windowCount = 5;
    const winSpacing = COACH_LEN / windowCount;

    for (let side = -1; side <= 1; side += 2) {
      const wz = side * (COACH_WIDTH / 2);
      const lowerWall = createBox(COACH_LEN, 0.9, 0.12, coachExtMat);
      lowerWall.position.set(0, COACH_FLOOR_Y + 0.45, wz);
      coachGroup.add(lowerWall);

      const upperWall = createBox(COACH_LEN, 0.5, 0.12, coachExtMat);
      upperWall.position.set(0, COACH_FLOOR_Y + COACH_HEIGHT - 0.25, wz);
      coachGroup.add(upperWall);

      for (let w = 0; w <= windowCount; w++) {
        const wx = -COACH_LEN / 2 + w * winSpacing;
        const post = createBox(0.35, 1.2, 0.12, coachExtMat);
        post.position.set(wx, COACH_FLOOR_Y + 1.5, wz);
        coachGroup.add(post);
      }
    }

    const frontWallL = createBox(0.15, COACH_HEIGHT, 0.8, coachExtMat);
    frontWallL.position.set(COACH_LEN / 2, COACH_FLOOR_Y + COACH_HEIGHT / 2, -0.9);
    coachGroup.add(frontWallL);

    const frontWallR = createBox(0.15, COACH_HEIGHT, 0.8, coachExtMat);
    frontWallR.position.set(COACH_LEN / 2, COACH_FLOOR_Y + COACH_HEIGHT / 2, 0.9);
    coachGroup.add(frontWallR);

    const backWallL = createBox(0.15, COACH_HEIGHT, 0.8, coachExtMat);
    backWallL.position.set(-COACH_LEN / 2, COACH_FLOOR_Y + COACH_HEIGHT / 2, -0.9);
    coachGroup.add(backWallL);

    const backWallR = createBox(0.15, COACH_HEIGHT, 0.8, coachExtMat);
    backWallR.position.set(-COACH_LEN / 2, COACH_FLOOR_Y + COACH_HEIGHT / 2, 0.9);
    coachGroup.add(backWallR);

    // 8 Ghế bọc nhung mận chín & Giá để hành lý bằng đồng & Vali da cổ
    for (let r = 0; r < 4; r++) {
      const rx = -COACH_LEN / 2 + 1.5 + r * 2.1;

      const seatL = createBox(0.9, 0.45, 0.75, velvetSeatMat);
      seatL.position.set(rx, COACH_FLOOR_Y + 0.32, -0.85);
      coachGroup.add(seatL);

      const seatBackL = createBox(0.12, 0.75, 0.75, velvetSeatMat);
      seatBackL.position.set(rx - 0.4, COACH_FLOOR_Y + 0.8, -0.85);
      coachGroup.add(seatBackL);

      const luggageRackL = createBox(1.0, 0.05, 0.65, brassMat);
      luggageRackL.position.set(rx, COACH_FLOOR_Y + 2.0, -0.9);
      coachGroup.add(luggageRackL);

      const suitcaseL = createBox(0.55, 0.25, 0.4, new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 }));
      suitcaseL.position.set(rx, COACH_FLOOR_Y + 2.15, -0.9);
      coachGroup.add(suitcaseL);

      const seatR = createBox(0.9, 0.45, 0.75, velvetSeatMat);
      seatR.position.set(rx, COACH_FLOOR_Y + 0.32, 0.85);
      coachGroup.add(seatR);

      const seatBackR = createBox(0.12, 0.75, 0.75, velvetSeatMat);
      seatBackR.position.set(rx - 0.4, COACH_FLOOR_Y + 0.8, 0.85);
      coachGroup.add(seatBackR);

      const luggageRackR = createBox(1.0, 0.05, 0.65, brassMat);
      luggageRackR.position.set(rx, COACH_FLOOR_Y + 2.0, 0.9);
      coachGroup.add(luggageRackR);
    }

    const coachCabinLight = new THREE.PointLight(0xffeaad, 1.4, 10);
    coachCabinLight.position.set(0, COACH_FLOOR_Y + 2.2, 0);
    coachGroup.add(coachCabinLight);

    for (let l = -1; l <= 1; l++) {
      const lampGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff3cc }));
      lampGlobe.position.set(l * 2.8, COACH_FLOOR_Y + 2.3, 0);
      coachGroup.add(lampGlobe);
    }
    this.trainGroup.add(coachGroup);

    // 3. TOA QUAN SÁT LỘ THIÊN PHÍA SAU (Observation Open Vestibule)
    const observationCar = new THREE.Group();
    observationCar.position.set(-15.5, 0, TRACK_Z);

    const obsFloor = createBox(4.2, 0.2, 2.4, coachFloorMat);
    obsFloor.position.y = COACH_FLOOR_Y;
    observationCar.add(obsFloor);

    const obsRailBack = createBox(0.08, 0.9, 2.4, brassMat);
    obsRailBack.position.set(-2.1, COACH_FLOOR_Y + 0.55, 0);
    observationCar.add(obsRailBack);

    const obsRailL = createBox(4.2, 0.9, 0.08, brassMat);
    obsRailL.position.set(0, COACH_FLOOR_Y + 0.55, -1.15);
    observationCar.add(obsRailL);

    const obsRailR = createBox(4.2, 0.9, 0.08, brassMat);
    obsRailR.position.set(0, COACH_FLOOR_Y + 0.55, 1.15);
    observationCar.add(obsRailR);
    this.trainGroup.add(observationCar);

    // KHẮC PHỤC TRIỆT ĐỂ LỖI MẤT HÌNH ĐOÀN TÀU (100% MESH frustumCulled = false)
    this.trainGroup.traverse((m) => {
      if (m.isMesh) {
        m.frustumCulled = false;
      }
    });

    // Bụi hơi nước (Steam Particles) - Tối ưu 60 FPS chia sẻ 1 Material duy nhất
    this.steamParticles = [];
    const steamGeom = new THREE.SphereGeometry(0.35, 6, 6);
    const steamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
    for (let i = 0; i < 10; i++) {
      const p = new THREE.Mesh(steamGeom, steamMat);
      p.visible = false;
      p.frustumCulled = false;
      this.trainGroup.add(p);
      this.steamParticles.push({
        mesh: p,
        life: 0,
        maxLife: 1.8,
        vel: new THREE.Vector3(-0.8, 0.8, 0)
      });
    }

    this.steamSpawnTimer = 0;

    // Đăng ký tương tác Lên / Xuống Tàu
    this.trainInteractable = {
      position: new THREE.Vector3(this.trainPosX - 8.0, this.trainFloorY, 64.0),
      radius: 4.5,
      promptText: 'Bước Lên Toa Tàu Di Sản • Khởi Hành Vượt Sông Hồng',
      actionKey: 'E',
      onInteract: () => {
        const pc = (window._GameCoreInstance && window._GameCoreInstance.playerController) || (window.gameEngine && window.gameEngine.playerController);
        if (pc) {
          if (!this.isPlayerRidingTrain) {
            this.boardTrain(pc);
          } else {
            this.leaveTrain(pc);
          }
        }
      }
    };
    this.interactables.push(this.trainInteractable);
  }

  /**
   * Cập nhật chuyển động đoàn tàu hai chiều khứ hồi (Ga Long Biên <-> Ga Gia Lâm)
   * Không bao giờ bị mất hình hay biến mất giữa chừng
   */
  _updateTrain(delta, playerPos) {
    if (!this.trainGroup) return;

    if (this.trainState === 'AT_STATION_WEST') {
      this.trainSpeed = 0;
      this.trainPosX = this.trainStationWestX;
      this.trainDirection = 1;
      this.stationDwellTimer += delta;

      if (this.stationDwellTimer > 25.0) {
        this.trainState = 'DEPARTING_EAST';
        this.stationDwellTimer = 0;
        if (this.eventBus) {
          this.eventBus.emit('CORE:NOTIFICATION', {
            message: 'Đoàn tàu hơi nước khởi hành từ Ga Long Biên vượt Sông Hồng sang Ga Gia Lâm!'
          });
        }
      }
    } else if (this.trainState === 'DEPARTING_EAST') {
      this.trainSpeed = Math.min(this.trainCruiseSpeed, this.trainSpeed + delta * 2.2);
      this.trainPosX += this.trainSpeed * delta;
      if (this.trainSpeed >= this.trainCruiseSpeed) {
        this.trainState = 'CRUISING_EAST';
      }
    } else if (this.trainState === 'CRUISING_EAST') {
      this.trainPosX += this.trainSpeed * delta;
      if (this.trainPosX >= this.trainStationEastX - 25.0) {
        this.trainState = 'ARRIVING_EAST';
      }
    } else if (this.trainState === 'ARRIVING_EAST') {
      this.trainSpeed = Math.max(1.5, this.trainSpeed - delta * 2.5);
      this.trainPosX += this.trainSpeed * delta;
      if (this.trainPosX >= this.trainStationEastX) {
        this.trainPosX = this.trainStationEastX;
        this.trainSpeed = 0;
        this.trainState = 'AT_STATION_EAST';
        this.stationDwellTimer = 0;
        if (this.eventBus) {
          this.eventBus.emit('CORE:NOTIFICATION', {
            message: 'Ga Gia Lâm: Tàu đã cập bến bờ Đông sông Hồng. Chuẩn bị khởi hành chuyến về Ga Long Biên!'
          });
        }
      }
    } else if (this.trainState === 'AT_STATION_EAST') {
      this.trainSpeed = 0;
      this.trainPosX = this.trainStationEastX;
      this.trainDirection = -1;
      this.stationDwellTimer += delta;

      if (this.stationDwellTimer > 12.0) {
        this.trainState = 'DEPARTING_WEST';
        this.stationDwellTimer = 0;
        if (this.eventBus) {
          this.eventBus.emit('CORE:NOTIFICATION', {
            message: 'Đoàn tàu khởi hành từ Ga Gia Lâm vượt Sông Hồng trở về Ga Long Biên!'
          });
        }
      }
    } else if (this.trainState === 'DEPARTING_WEST') {
      this.trainSpeed = Math.min(this.trainCruiseSpeed, this.trainSpeed + delta * 2.2);
      this.trainPosX -= this.trainSpeed * delta;
      if (this.trainSpeed >= this.trainCruiseSpeed) {
        this.trainState = 'CRUISING_WEST';
      }
    } else if (this.trainState === 'CRUISING_WEST') {
      this.trainPosX -= this.trainSpeed * delta;
      if (this.trainPosX <= this.trainStationWestX + 25.0) {
        this.trainState = 'ARRIVING_WEST';
      }
    } else if (this.trainState === 'ARRIVING_WEST') {
      this.trainSpeed = Math.max(1.5, this.trainSpeed - delta * 2.5);
      this.trainPosX -= this.trainSpeed * delta;
      if (this.trainPosX <= this.trainStationWestX) {
        this.trainPosX = this.trainStationWestX;
        this.trainSpeed = 0;
        this.trainState = 'AT_STATION_WEST';
        this.stationDwellTimer = 0;
        if (this.eventBus) {
          this.eventBus.emit('CORE:NOTIFICATION', {
            message: 'Ga Long Biên: Tàu đã cập ke ga số 1 an toàn. Mời hành khách lên/xuống tàu!'
          });
        }
      }
    }

    this.trainGroup.position.x = this.trainPosX;

    if (this.trainInteractable) {
      this.trainInteractable.position.set(this.trainPosX - 8.0, this.trainFloorY, 64.0);
      if (this.isPlayerRidingTrain) {
        this.trainInteractable.promptText = 'Bước Xuống Tàu (Ga Long Biên / Cầu / Gia Lâm)';
      } else {
        this.trainInteractable.promptText = 'Bước Lên Toa Tàu Di Sản • Khởi Hành Vượt Sông Hồng';
      }
    }

    // Sinh khói hơi nước từ ống khói đầu máy
    this.steamSpawnTimer += delta;
    if (this.steamSpawnTimer > 0.08 && this.steamParticles) {
      this.steamSpawnTimer = 0;
      for (let p of this.steamParticles) {
        if (!p.mesh.visible) {
          p.mesh.visible = true;
          p.life = 0;
          p.mesh.position.set(2.0, this.bridgeDeckY + 3.8, 60.0);
          p.mesh.scale.set(0.6, 0.6, 0.6);
          p.vel.x = this.trainDirection === 1 ? -0.8 : 0.8;
          break;
        }
      }
    }

    if (this.steamParticles) {
      for (let p of this.steamParticles) {
        if (p.mesh.visible) {
          p.life += delta;
          p.mesh.position.addScaledVector(p.vel, delta);
          const scale = 0.6 + (p.life / p.maxLife) * 2.2;
          p.mesh.scale.set(scale, scale, scale);
          if (p.life >= p.maxLife) p.mesh.visible = false;
        }
      }
    }
  }

  /**
   * Bước lên đoàn tàu di sản
   */
  boardTrain(playerController) {
    playerController = playerController || (window._GameCoreInstance && window._GameCoreInstance.playerController) || (window.gameEngine && window.gameEngine.playerController);
    if (!playerController) return;
    this.isPlayerRidingTrain = true;
    playerController._trainRelX = 0;
    playerController._trainRelZ = 0;
    const coachCenterX = this.trainPosX - 8.0;

    playerController.characterGroup.position.set(coachCenterX, this.trainFloorY + 0.05, 60.0);
    playerController.characterGroup.rotation.y = Math.PI / 2;
    playerController.velocity.set(0, 0, 0);
    playerController.isGrounded = true;

    if (this.trainState === 'AT_STATION_WEST') {
      this.trainState = 'DEPARTING_EAST';
    } else if (this.trainState === 'AT_STATION_EAST') {
      this.trainState = 'DEPARTING_WEST';
    }

    if (this.eventBus) {
      this.eventBus.emit('CORE:NOTIFICATION', {
        message: 'Bạn đã lên Toa Tàu Di Sản! Di chuột để quay 360° ngắm sông & hai bên tàu. Dùng [WASD] dạo bước trong toa & ra ban công đuôi tàu. Bấm [V] đổi góc ngắm, [E] xuống tàu.'
      });
    }

    const camCtrl = (window._GameCoreInstance && window._GameCoreInstance.cameraController) || (window.gameEngine && window.gameEngine.cameraController);
    if (camCtrl) {
      camCtrl.trainCameraMode = 'INSIDE_COACH';
    }
  }

  /**
   * Bước xuống đoàn tàu an toàn
   */
  leaveTrain(playerController) {
    playerController = playerController || (window._GameCoreInstance && window._GameCoreInstance.playerController) || (window.gameEngine && window.gameEngine.playerController);
    if (!playerController) return;
    this.isPlayerRidingTrain = false;
    const coachCenterX = this.trainPosX - 8.0;

    if (this.trainPosX < 74.0) {
      playerController.characterGroup.position.set(coachCenterX, 10.85, 64.8);
    } else if (this.trainPosX > 220.0) {
      playerController.characterGroup.position.set(coachCenterX, 10.85, 64.8);
    } else {
      playerController.characterGroup.position.set(coachCenterX, 10.62, 63.8);
    }
    playerController.characterGroup.rotation.y = Math.PI / 2;
    playerController.velocity.set(0, 0, 0);
    playerController.isGrounded = true;

    if (this.eventBus) {
      this.eventBus.emit('CORE:NOTIFICATION', {
        message: 'Bạn đã xuống tàu an toàn.'
      });
    }

    const camCtrl = (window._GameCoreInstance && window._GameCoreInstance.cameraController) || (window.gameEngine && window.gameEngine.cameraController);
    if (camCtrl) {
      camCtrl.setCameraMode('TPS');
    }
  }

  /**
   * Điều khiển người chơi khi đang trên toa tàu (Tự do di chuyển trong toa tàu và ban công đuôi tàu)
   */
  handleTrainPlayerUpdate(delta, playerController) {
    if (playerController._trainRelX === undefined) {
      playerController._trainRelX = 0;
      playerController._trainRelZ = 0;
    }
    const keys = playerController.keys;
    const localMoveX = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0);
    const localMoveZ = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);

    const walkSpeed = keys.sprint ? 3.8 : 2.2;
    playerController._trainRelX += localMoveX * walkSpeed * delta;
    playerController._trainRelZ += localMoveZ * walkSpeed * delta;

    // Giới hạn không gian di chuyển:
    // [-9.2, -4.5] là ban công lộ thiên đuôi tàu
    // [-4.5, +4.2] là bên trong toa tàu ngắm cảnh
    playerController._trainRelX = Math.max(-9.2, Math.min(4.2, playerController._trainRelX));

    if (playerController._trainRelX < -4.6) {
      playerController._trainRelZ = Math.max(-0.95, Math.min(0.95, playerController._trainRelZ));
    } else {
      playerController._trainRelZ = Math.max(-0.92, Math.min(0.92, playerController._trainRelZ));
    }

    const coachCenterX = this.trainPosX - 8.0;
    playerController.characterGroup.position.set(
      coachCenterX + playerController._trainRelX,
      this.trainFloorY + 0.05,
      60.0 + playerController._trainRelZ
    );

    if (localMoveX !== 0 || localMoveZ !== 0) {
      playerController.characterGroup.rotation.y = Math.atan2(localMoveZ, localMoveX);
    }
  }

  resolveTrainCollision(pos, radius = 0.35) {
    if (this.isPlayerRidingTrain) return;
    // Bỏ qua tuyệt đối nếu người chơi đang đi bộ dưới mặt đất / gầm cầu (Y < 8.5m)
    if (pos.y < 8.5 || pos.y > 15.0) return;
    const trainMinX = this.trainPosX - 17.5;
    const trainMaxX = this.trainPosX + 4.5;
    const trainMinZ = 60.0 - 1.5;
    const trainMaxZ = 60.0 + 1.5;

    if (pos.x + radius > trainMinX && pos.x - radius < trainMaxX &&
        pos.z + radius > trainMinZ && pos.z - radius < trainMaxZ) {
      const pushLeft = (pos.x + radius) - trainMinX;
      const pushRight = trainMaxX - (pos.x - radius);
      const pushBack = (pos.z + radius) - trainMinZ;
      const pushFront = trainMaxZ - (pos.z - radius);
      const minPush = Math.min(pushLeft, pushRight, pushBack, pushFront);
      if (minPush === pushLeft) pos.x = trainMinX - radius - 0.05;
      else if (minPush === pushRight) pos.x = trainMaxX + radius + 0.05;
      else if (minPush === pushBack) pos.z = trainMinZ - radius - 0.05;
      else pos.z = trainMaxZ + radius + 0.05;
    }
  }

}
