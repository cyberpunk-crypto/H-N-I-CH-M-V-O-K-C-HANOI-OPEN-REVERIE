/**
 * WorldManager.js - Xây dựng Thế Giới Mở 500m x 500m Liền Mạch Thủ Đô Hà Nội Hoài Niệm
 * Đồ họa Kiến trúc Chân Thực, Texture AI Sắc Nét, Hệ Thống Con Người (NPC) & Va Chạm Tuyệt Đối
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { THREE } from './ThreeLib.js';
import { ZONES } from './ZoneManager.js';

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
    this.lakeFish = []; // Đàn cá chép vàng & cá koi bơi lội dưới lòng Hồ Gươm

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
      maxY: maxY
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
  isWaterAt(x, y, z) {
    // 1. Vùng Hồ Gươm (Tâm x = 80, z = -80, bán kính lòng hồ R = 84.8m)
    const dx = x - 80;
    const dz = z - (-80);
    const distSq = dx * dx + dz * dz;
    const lakeRadius = 84.8;

    if (distSq < lakeRadius * lakeRadius) {
      // Đang trong phạm vi mặt nước Hồ Gươm!
      // Kiểm tra xem có đang ở trên các khu vực an toàn (Đảo Rùa, Đảo Ngọc Sơn, Cầu Thê Húc, Cầu Kim Quy) không:

      // a. Đảo Rùa tự nhiên: bán kính 17.5m quanh (80, -80)
      if (distSq <= 17.5 * 17.5 && y >= 0.55) {
        return false; // An toàn trên Đảo Rùa
      }

      // b. Đảo Ngọc Sơn: bán kính 24m quanh (128, -68)
      const dNgocX = x - 128;
      const dNgocZ = z - (-68);
      if (dNgocX * dNgocX + dNgocZ * dNgocZ <= 24.5 * 24.5 && y >= 0.55) {
        return false; // An toàn trên Đảo Ngọc Sơn
      }

      // c. Cầu Thê Húc son đỏ: từ bờ (160, -40) đến Đắc Nguyệt Lâu (132, -66), bán kính an toàn 2.4m
      const dTheHuc = this._pointToSegmentDistSq(x, z, 160, -40, 132, -66);
      if (dTheHuc <= 2.4 * 2.4 && y >= 0.45) {
        return false; // An toàn trên Cầu Thê Húc
      }

      // d. Cầu Kim Quy đá cổ dẫn tới Tháp Rùa: từ bờ (17, -17) đến Đảo Rùa (68, -68), bán kính an toàn 2.4m
      const dKimQuy = this._pointToSegmentDistSq(x, z, 17, -17, 68, -68);
      if (dKimQuy <= 1.82 * 1.82 && y >= 0.35) {
        return false; // An toàn trên Cầu Kim Quy
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
   * Tạo texture canvas giả lập độ phân giải cao làm fallback nếu file ảnh chưa tải kịp
   */
  _createCanvasFallback(drawFn, width = 512, height = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Tải Texture AI với fallback an toàn
   */
  _loadTextureWithFallback(url, fallbackFn, repeatX = 1, repeatY = 1) {
    const fallbackTex = this._createCanvasFallback(fallbackFn);
    fallbackTex.repeat.set(repeatX, repeatY);

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
        console.warn(`[Texture fallback]: Dùng canvas texture thay thế cho ${url}`);
      }
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
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
      },
      12, 12
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

    // 10. Mặt nước Hồ Gươm xanh lục bảo phẳng lặng
    this.materials.lakeWater = new THREE.MeshStandardMaterial({
      color: 0x16423f,
      roughness: 0.08,
      metalness: 0.9,
      transparent: true,
      opacity: 0.88
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
    const doorH = 3.2;
    const frontSideW = (w - doorW - wallThick * 2) / 2;

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

    // Tường sau
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(w - wallThick * 2, h, wallThick), this.materials.yellowWall);
    backWall.position.set(0, h / 2, d / 2 - wallThick / 2);
    backWall.castShadow = true;
    shopGroup.add(backWall);
    this._addBoxObstacle(x, z + d / 2 - wallThick / 2, w - wallThick * 2, wallThick + 0.05, 0, h + 2);

    // Tường trước (hai cánh gà hai bên, chừa lối cửa 3.2m ở giữa)
    const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(frontSideW, h, wallThick), this.materials.yellowWall);
    frontLeft.position.set(-doorW / 2 - frontSideW / 2, h / 2, -d / 2 + wallThick / 2);
    frontLeft.castShadow = true;
    shopGroup.add(frontLeft);
    this._addBoxObstacle(x - doorW / 2 - frontSideW / 2, z - d / 2 + wallThick / 2, frontSideW + 0.05, wallThick + 0.05, 0, h + 2);

    const frontRight = new THREE.Mesh(new THREE.BoxGeometry(frontSideW, h, wallThick), this.materials.yellowWall);
    frontRight.position.set(doorW / 2 + frontSideW / 2, h / 2, -d / 2 + wallThick / 2);
    frontRight.castShadow = true;
    shopGroup.add(frontRight);
    this._addBoxObstacle(x + doorW / 2 + frontSideW / 2, z - d / 2 + wallThick / 2, frontSideW + 0.05, wallThick + 0.05, 0, h + 2);

    // Lanh-tô trên cửa
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorW, h - doorH, wallThick), this.materials.yellowWall);
    lintel.position.set(0, doorH + (h - doorH) / 2, -d / 2 + wallThick / 2);
    shopGroup.add(lintel);

    // Mái ngói mũi hài truyền thống nhấp nhô
    const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.72, 2.6, 4), this.materials.roofTile);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, h + 1.3, 0);
    roof.scale.set(1, 1, d / (w * 0.72));
    roof.castShadow = true;
    shopGroup.add(roof);

    // Cánh cửa gỗ mở tương tác phím E
    this._createOpenableDoor(x, z - d / 2, 2.8, 3.0, signText, 0x3d271d);

    // Sàn gạch bông bên trong
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w - wallThick * 2, d - wallThick * 2), this.materials.hanoiPavement);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0.04, 0);
    floor.receiveShadow = true;
    shopGroup.add(floor);
    this.colliders.push(floor);

    // Biển hiệu gỗ sơn son vẽ tay chữ vàng
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(w * 0.65, 0.95, 0.15), new THREE.MeshStandardMaterial({ color: 0x8a2318, roughness: 0.5 }));
    signBoard.position.set(0, 3.5, -d / 2 - 0.1);
    shopGroup.add(signBoard);

    // 2. NỘI THẤT NGHỆ THUẬT TỪNG NGÀNH NGHỀ
    this._populateShopInterior(shopGroup, x, z, w, d, shopType);

    return shopGroup;
  }

  _populateShopInterior(shopGroup, x, z, w, d, shopType) {
    const woodMat = this.materials.woodVarnish || this.materials.retroWood;

    if (shopType === 'thuoc_bac') {
      // Tủ thuốc bắc 100 ngăn gỗ mun cao 2.5m dọc tường sau
      const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x24160e, roughness: 0.7 });
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(w - 2.4, 2.6, 0.8), cabinetMat);
      cabinet.position.set(0, 1.3, d / 2 - 0.7);
      cabinet.castShadow = true;
      shopGroup.add(cabinet);
      this._addBoxObstacle(x, z + d / 2 - 0.7, w - 2.0, 0.9, 0, 2.8);

      // Bàn quầy bốc thuốc và cân tiểu ly
      const desk = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.05, 1.1), woodMat);
      desk.position.set(0, 0.525, 0.8);
      desk.castShadow = true;
      shopGroup.add(desk);
      this._addBoxObstacle(x, z + 0.8, 3.8, 1.2, 0, 1.2);

      // Thúng thuốc bắc phơi khô bên trái
      const basketMat = new THREE.MeshStandardMaterial({ color: 0x8f734b, roughness: 0.9 });
      for (let i = 0; i < 3; i++) {
        const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.30, 0.25, 12), basketMat);
        basket.position.set(-w / 2 + 1.2, 0.15, -1.5 + i * 1.2);
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
      fabricRack.position.set(0, 1.1, d / 2 - 0.6);
      shopGroup.add(fabricRack);
      this._addBoxObstacle(x, z + d / 2 - 0.6, w - 2.6, 0.8, 0, 2.4);
    } else if (shopType === 'pho_gia_truyen') {
      // Quầy nấu phở và nồi gang ninh xương bốc khói dọc tường sau
      const phoCounter = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.1, 1.2), woodMat);
      phoCounter.position.set(0, 0.55, d / 2 - 1.0);
      phoCounter.castShadow = true;
      shopGroup.add(phoCounter);
      this._addBoxObstacle(x, z + d / 2 - 1.0, 4.8, 1.3, 0, 1.3);

      // Nồi gang ninh xương to
      const potMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.38, 0.65, 16), potMat);
      pot.position.set(-1.0, 1.45, d / 2 - 1.0);
      shopGroup.add(pot);

      // 2 bộ bàn ăn gỗ mộc thấp bên trái và bên phải
      for (let s of [-1, 1]) {
        const table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 1.0), woodMat);
        table.position.set(s * (w / 2 - 2.2), 0.375, -0.5);
        shopGroup.add(table);
        this._addBoxObstacle(x + s * (w / 2 - 2.2), z - 0.5, 2.0, 1.2, 0, 0.9);
      }
    } else if (shopType === 'bia_hoi') {
      // Quầy rót bia hơi và 2 bom bia nhôm vòi đồng dọc tường sau
      const bar = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.05, 1.2), woodMat);
      bar.position.set(0, 0.525, d / 2 - 1.0);
      shopGroup.add(bar);
      this._addBoxObstacle(x, z + d / 2 - 1.0, 4.5, 1.3, 0, 1.3);

      // 2 Bom bia hơi Hà Nội bằng nhôm
      const kegMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
      for (let k of [-0.8, 0.8]) {
        const keg = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.75, 14), kegMat);
        keg.position.set(k, 1.45, d / 2 - 1.0);
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
      bench.position.set(-w / 2 + 2.0, 0.475, 0.5);
      shopGroup.add(bench);
      this._addBoxObstacle(x - w / 2 + 2.0, z + 0.5, 2.8, 1.4, 0, 1.2);

      // Tủ kính trưng bày đồng hồ Poljot Liên Xô dọc tường sau
      const showcaseMat = new THREE.MeshStandardMaterial({ color: 0x1f2428, metalness: 0.6 });
      const showcase = new THREE.Mesh(new THREE.BoxGeometry(w - 3.2, 1.8, 0.7), showcaseMat);
      showcase.position.set(0, 0.9, d / 2 - 0.6);
      shopGroup.add(showcase);
      this._addBoxObstacle(x, z + d / 2 - 0.6, w - 2.8, 0.8, 0, 2.0);
    } else if (shopType === 'cat_toc') {
      // Ghế xoay cắt tóc da simili đỏ ở giữa phòng
      const chairMat = new THREE.MeshStandardMaterial({ color: 0x9e2424, roughness: 0.5 });
      const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.12, 16), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 }));
      chairBase.position.set(0, 0.06, 0.4);
      const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.15, 0.6), chairMat);
      chairSeat.position.set(0, 0.55, 0.4);
      const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.12), chairMat);
      chairBack.position.set(0, 0.95, 0.65);
      shopGroup.add(chairBase, chairSeat, chairBack);
      this._addBoxObstacle(x, z + 0.4, 1.2, 1.2, 0, 1.4);

      // Gương soi lớn gắn tường sau
      const mirrorMat = new THREE.MeshStandardMaterial({ color: 0xd8e8f0, roughness: 0.1, metalness: 0.9 });
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.08), mirrorMat);
      mirror.position.set(0, 1.6, d / 2 - 0.2);
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

    // 1. Lòng Hồ Gươm (Mặt nước xanh lục bảo phẳng lặng dưới kè đá)
    const waterGeo = new THREE.CircleGeometry(84.8, 64);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMesh = new THREE.Mesh(waterGeo, this.materials.lakeWater);
    waterMesh.position.set(80, 0.08, -80);
    zoneGroup.add(waterMesh);

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
      if (treeAngle > 0.38 && treeAngle < 0.88) continue; // Tránh lối lên cầu Thê Húc
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
      const isTheHucOpening = angle > 0.38 && angle < 0.88;
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
        const nextTheHuc = nextAngle > 0.36 && nextAngle < 0.90;
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

    // Thảm cỏ xanh trên gò Đảo Rùa
    const grassMesh = new THREE.Mesh(new THREE.CylinderGeometry(15.2, 15.2, 0.2, 32), new THREE.MeshStandardMaterial({ color: 0x3d5a2d, roughness: 0.9 }));
    grassMesh.position.set(80, 1.55, -80);
    zoneGroup.add(grassMesh);

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
    const islandCourtyard = new THREE.Mesh(new THREE.BoxGeometry(18.0, 0.25, 15.0), this.materials.mossStone);
    islandCourtyard.position.set(80, 1.50, -80);
    islandCourtyard.receiveShadow = true;
    zoneGroup.add(islandCourtyard);
    this.colliders.push(islandCourtyard);

    // Lan can đá hoa sen bảo vệ quanh mép đảo phía tiếp giáp hồ
    for (let a = 0; a < 14; a++) {
      const pAngle = (a / 14) * Math.PI * 2;
      // Chừa lối dẫn lên cầu Kim Quy (hướng góc 225 độ / ~3.92 rad)
      if (pAngle > 3.4 && pAngle < 4.4) continue;
      const px = 80 + Math.cos(pAngle) * 14.8;
      const pz = -80 + Math.sin(pAngle) * 14.8;
      const balustrade = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.85, 8), this.materials.mossStone);
      balustrade.position.set(px, 1.55 + 0.425, pz);
      zoneGroup.add(balustrade);
      const lotus = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), this.materials.mossStone);
      lotus.position.set(px, 1.55 + 0.95, pz);
      zoneGroup.add(lotus);
      this._addBoxObstacle(px, pz, 0.7, 0.7, 1.55, 3.2);
    }

    // =========================================================================
    // THÁP RÙA TẦNG 1: KIẾN TRÚC MỞ 10 VÒM CUỐN GOTHIC BƯỚC ĐƯỢC VÀO TẬN BÊN TRONG
    // (Open Walkable Gothic Architecture with Ancient Altar, Stela & Incense)
    // =========================================================================
    const t1Width = 8.8;
    const t1Depth = 6.4;
    const t1Height = 3.6;

    // Sàn đá cổ bên trong nội điện Tháp Rùa
    const t1Floor = new THREE.Mesh(new THREE.BoxGeometry(t1Width, 0.22, t1Depth), this.materials.mossStone);
    t1Floor.position.set(80, 1.55, -80);
    t1Floor.receiveShadow = true;
    zoneGroup.add(t1Floor);
    this.colliders.push(t1Floor);

    // 4 Trụ góc đá rêu phong vững chãi chịu lực cho Tháp
    for (let cx of [-3.5, 3.5]) {
      for (let cz of [-2.3, 2.3]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, t1Height, 1.5), this.materials.mossStone);
        pillar.position.set(80 + cx, 1.55 + t1Height / 2, -80 + cz);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        zoneGroup.add(pillar);
        this._addBoxObstacle(80 + cx, -80 + cz, 1.65, 1.55, 1.55, 5.5);
      }
    }

    // VÁCH CỬA MẶT TÂY (Hướng đón khách đi từ Cầu Kim Quy vào Tháp Rùa): 3 Vòm Gothic mở rộng
    for (let vx of [-1.25, 1.25]) {
      const pierW = new THREE.Mesh(new THREE.BoxGeometry(0.6, t1Height, 0.4), this.materials.mossStone);
      pierW.position.set(80 + vx, 1.55 + t1Height / 2, -80 + 3.05);
      pierW.castShadow = true;
      zoneGroup.add(pierW);
      this._addBoxObstacle(80 + vx, -80 + 3.05, 0.65, 0.45, 1.55, 5.5);
    }

    // VÁCH CỬA MẶT ĐÔNG (Hướng nhìn ra hồ phía Đông đón bình minh): 3 Vòm Gothic mở thoáng
    for (let vx of [-1.25, 1.25]) {
      const pierE = new THREE.Mesh(new THREE.BoxGeometry(0.6, t1Height, 0.4), this.materials.mossStone);
      pierE.position.set(80 + vx, 1.55 + t1Height / 2, -80 - 3.05);
      pierE.castShadow = true;
      zoneGroup.add(pierE);
      this._addBoxObstacle(80 + vx, -80 - 3.05, 0.65, 0.45, 1.55, 5.5);
    }

    // VÁCH CỬA MẶT BẮC & NAM (Mặt ngắn 2 vòm): Trụ giữa
    for (let xSide of [-1, 1]) {
      const pierSide = new THREE.Mesh(new THREE.BoxGeometry(0.4, t1Height, 0.6), this.materials.mossStone);
      pierSide.position.set(80 + xSide * 4.25, 1.55 + t1Height / 2, -80);
      pierSide.castShadow = true;
      zoneGroup.add(pierSide);
      this._addBoxObstacle(80 + xSide * 4.25, -80, 0.45, 0.65, 1.55, 5.5);
    }

    // Vòm cuốn Gothic trang trí trên đầu các cửa vào
    for (let zSide of [-1, 1]) {
      for (let vx of [-2.4, 0, 2.4]) {
        const archTop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.75, 0.35), this.materials.mossStone);
        archTop.position.set(80 + vx, 1.55 + t1Height - 0.35, -80 + zSide * 3.05);
        zoneGroup.add(archTop);
      }
    }
    for (let xSide of [-1, 1]) {
      for (let vz of [-1.4, 1.4]) {
        const archTop = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.75, 1.3), this.materials.mossStone);
        archTop.position.set(80 + xSide * 4.25, 1.55 + t1Height - 0.35, -80 + vz);
        zoneGroup.add(archTop);
      }
    }

    // =========================================================================
    // NỘI ĐIỆN BÊN TRONG THÁP RÙA: BÀN THỜ KIM QUY, BIA ĐÁ CỔ, ÁNH SÁNG & ĐÈN LỒNG
    // =========================================================================
    // 1. Bàn thờ đá cổ thâm nghiêm
    const thapRuaAltar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.85, 1.1), this.materials.mossStone);
    thapRuaAltar.position.set(80, 1.55 + 0.425, -80.9);
    thapRuaAltar.castShadow = true;
    zoneGroup.add(thapRuaAltar);
    this._addBoxObstacle(80, -80.9, 2.3, 1.2, 1.55, 3.2);

    // 2. Tượng Thần Kim Quy (Rùa Vàng) cõng bia đá cổ
    const turtleStatue = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 1.3), this.materials.templeGold);
    turtleStatue.position.set(80, 1.55 + 0.85 + 0.175, -80.9);
    turtleStatue.castShadow = true;
    zoneGroup.add(turtleStatue);

    // 3. Tấm bia đá cổ "Quy Sơn Linh Tháp" ghi dấu nghìn năm
    const steleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.15), this.materials.mossStone);
    steleMesh.position.set(80, 1.55 + 0.85 + 0.35 + 0.55, -80.9);
    steleMesh.castShadow = true;
    zoneGroup.add(steleMesh);

    // 4. Lư hương đồng tỏa khói trầm tôn nghiêm
    const incenseCenser = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.35, 8), this.materials.templeGold);
    incenseCenser.position.set(80, 1.55 + 0.85 + 0.18, -80.3);
    zoneGroup.add(incenseCenser);

    // 5. Nguồn sáng vàng ấm áp thiêng liêng rọi sáng nội điện Tháp Rùa
    const towerInteriorLight = new THREE.PointLight(0xffdf80, 1.8, 14);
    towerInteriorLight.position.set(80, 3.8, -80);
    zoneGroup.add(towerInteriorLight);

    // 6. Bốn đèn lồng đồng thả từ vòm trần bên trong
    for (let lx of [-1.8, 1.8]) {
      for (let lz of [-1.2, 1.2]) {
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.2, 4), this.materials.darkIron);
        chain.position.set(80 + lx, 4.6, -80 + lz);
        zoneGroup.add(chain);

        const lanternMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({
          color: 0xffdf80,
          emissive: 0xffaa00,
          emissiveIntensity: 0.9
        }));
        lanternMesh.position.set(80 + lx, 3.9, -80 + lz);
        zoneGroup.add(lanternMesh);
      }
    }

    // =========================================================================
    // 🐢 NPC NHÀ SỬ HỌC THÁP RÙA - BÁC NGUYỄN VĂN AN (ĐỨNG TRONG NỘI ĐIỆN)
    // =========================================================================
    const historianNPC = this._createCitizenNPC(0, 0, 0x223a5e, 'kính lão');
    historianNPC.position.set(80, 1.55, -79.2);
    historianNPC.rotation.y = Math.PI; // Hướng mặt đón khách bước vào cửa chính
    zoneGroup.add(historianNPC);
    this._addNpcCollider(80, -79.2, 0.65);

    this.interactables.push({
      position: new THREE.Vector3(80, 1.55, -79.2),
      radius: 3.2,
      promptText: 'Lắng nghe Lịch sử Tháp Rùa cổ kính cùng Nhà Sử Học',
      actionKey: 'E',
      onInteract: () => {
        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Bác Nguyễn Văn An • Nhà Nghiên Cứu Lịch Sử Tháp Rùa',
            role: 'Chuyên gia Viện Lịch Sử & Người gìn giữ ký ức Tháp Rùa Hồ Gươm',
            avatar: '🐢',
            greeting: '"Kính chào bạn trẻ! Thật quý hóa khi được đón bạn bước chân vào tận bên trong chốn thâm nghiêm của Tháp Rùa - trái tim ngàn năm linh thiêng của Thủ đô."',
            monumentTitle: 'Tháp Rùa Hồ Gươm - Dấu Ấn Lịch Sử & Biểu Tượng Ngàn Năm Thăng Long',
            historyText: `
              <p><strong>Giai thoại Hồ Tả Vọng & Thần Kim Quy (Năm 1428):</strong> Sau khi lãnh đạo khởi nghĩa Lam Sơn toàn thắng đuổi sạch giặc Minh, Đức Vua Lê Thái Tổ (Lê Lợi) ngự thuyền rồng dạo chơi trên hồ Tả Vọng. Rùa Vàng khổng lồ nổi lên đòi lại thanh gươm thần Thuận Thiên cứu nước. Nhà vua rút gươm trao trả, Rùa ngậm gươm rồi lặn sâu xuống đáy hồ. Từ đó, hồ đổi tên thành <em>Hồ Hoàn Kiếm (Hồ Trả Gươm)</em>.</p>
              <p><strong>Lịch sử Xây dựng Tháp Rùa (Năm 1886):</strong> Được xây dựng trên gò Đảo Rùa (Quy Sơn) giữa hồ. Kiến trúc Tháp Rùa là sự kết tinh giao thoa Á - Âu độc đáo bậc nhất: hai tầng dưới mang hệ vòm cuốn nhọn phong cách <em>Gothic phương Tây</em>, trong khi tầng trên cùng và mái cong lợp ngói vảy lại mang đậm bản sắc <em>truyền thống phong kiến Á Đông</em>.</p>
              <p><strong>Trái Tim của Thủ Đô Hà Nội:</strong> Dù trải qua mưa bom bão đạn và bao thăng trầm thời gian, bóng Tháp Rùa rêu phong soi bóng xuống làn nước xanh lục thủy vẫn mãi là biểu tượng thiêng liêng về lòng yêu chuộng hòa bình và khí phách bất khuất của dân tộc Việt Nam.</p>
            `,
            dialogueOptions: [
              { text: 'Bác ơi, sự tích Vua Lê Lợi trả gươm thần diễn ra chính xác ở đâu ạ?', reply: 'Chính tại làn nước hồ nơi chúng ta đang đứng đây! Vua Lê Lợi ngự thuyền rồng, Rùa Vàng nổi lên đòi gươm rồi bơi về hướng hang sâu dưới lòng hồ. Đó là lời nhắc nhở thiêng liêng về truyền thống yêu chuộng hòa bình của dân tộc ta.' },
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

    // Gờ phân tầng chỉ viền tầng 1
    const cornice1 = new THREE.Mesh(new THREE.BoxGeometry(t1Width + 0.6, 0.35, t1Depth + 0.6), this.materials.mossStone);
    cornice1.position.set(80, 1.55 + t1Height + 0.175, -80);
    zoneGroup.add(cornice1);


    // THÁP RÙA: TẦNG 2 (Thu nhỏ tỷ lệ, vòm cuốn Gothic thanh thoát)
    const t2Width = 6.4;
    const t2Depth = 4.4;
    const t2Height = 2.8;
    const t2Mesh = new THREE.Mesh(new THREE.BoxGeometry(t2Width, t2Height, t2Depth), this.materials.mossStone);
    t2Mesh.position.set(80, 5.5 + t2Height / 2, -80);
    t2Mesh.castShadow = true;
    zoneGroup.add(t2Mesh);

    // Vòm cửa Tầng 2
    for (let zSide of [-1, 1]) {
      for (let vx of [-1.6, 0, 1.6]) {
        const archMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.2), gothicDarkMat);
        archMesh.position.set(80 + vx, 6.7, -80 + zSide * (t2Depth / 2 + 0.05));
        zoneGroup.add(archMesh);
      }
    }

    // Gờ phân tầng 2
    const cornice2 = new THREE.Mesh(new THREE.BoxGeometry(t2Width + 0.5, 0.3, t2Depth + 0.5), this.materials.mossStone);
    cornice2.position.set(80, 5.5 + t2Height + 0.15, -80);
    zoneGroup.add(cornice2);

    // THÁP RÙA: TẦNG 3 (Lầu Vọng Nguyệt)
    const t3Width = 3.8;
    const t3Depth = 2.8;
    const t3Height = 2.2;
    const t3Mesh = new THREE.Mesh(new THREE.BoxGeometry(t3Width, t3Height, t3Depth), this.materials.mossStone);
    t3Mesh.position.set(80, 8.75 + t3Height / 2, -80);
    t3Mesh.castShadow = true;
    zoneGroup.add(t3Mesh);

    // Cửa sổ tròn Vọng Nguyệt mở về hướng Đông
    const roundWindow = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 16), gothicDarkMat);
    roundWindow.rotation.x = Math.PI / 2;
    roundWindow.position.set(80, 9.85, -80 + t3Depth / 2 + 0.05);
    zoneGroup.add(roundWindow);

    // MÁI THÁP RÙA: Mái ngói dốc 4 mặt cổ kính với hoa văn đầu rồng rêu phong
    const roofBase = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.8, 4), this.materials.roofTile);
    roofBase.rotation.y = Math.PI / 4;
    roofBase.position.set(80, 11.8, -80);
    zoneGroup.add(roofBase);

    // Đỉnh chóp ngọc tháp
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 1.2, 8), this.materials.mossStone);
    spire.position.set(80, 12.9, -80);
    zoneGroup.add(spire);

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

    // Đôi cột trụ đá Nghinh Phong Môn dẫn lối lên cầu
    for (let gs of [-2.2, 2.2]) {
      const gateCol = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 3.2, 8), this.materials.mossStone);
      gateCol.position.set(17 + gs * 0.707, 1.85, -17 - gs * 0.707);
      gateCol.castShadow = true;
      zoneGroup.add(gateCol);

      const gateLotus = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), this.materials.templeGold || this.materials.mossStone);
      gateLotus.position.set(17 + gs * 0.707, 3.6, -17 - gs * 0.707);
      zoneGroup.add(gateLotus);

      this._addBoxObstacle(17 + gs * 0.707, -17 - gs * 0.707, 0.8, 0.8, 0, 4.0);
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

      for (let side of [-1.92, 1.92]) {
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

        // Đăng ký obstacle dày đặc liên tục chống xuyên lan can cầu Kim Quy (4 khối chồng lấn mỗi nhịp)
        for (let s of [0.125, 0.375, 0.625, 0.875]) {
          const subX = p1.x + (p2.x - p1.x) * s + perpX * side;
          const subZ = p1.z + (p2.z - p1.z) * s + perpZ * side;
          const subY = p1.y + (p2.y - p1.y) * s;
          this._addBoxObstacle(subX, subZ, 1.3, 1.3, subY, subY + 2.2);
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
    // 🐟 ĐÀN CÁ CHÉP VÀNG & CÁ KOI HỒ GƯƠM BƠI LỘI DƯỚI MẶT NƯỚC (LIVING LAKE FISH)
    // =========================================================================
    const fishGoldMat = new THREE.MeshStandardMaterial({ color: 0xff8c00, roughness: 0.35, metalness: 0.2 });
    const fishRedMat = new THREE.MeshStandardMaterial({ color: 0xd63031, roughness: 0.35, metalness: 0.2 });
    const fishCalicoMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const fishMatList = [fishGoldMat, fishRedMat, fishCalicoMat];

    const fishSchools = [
      { count: 7, cx: 80, cz: -80, rMin: 22, rMax: 32, speedBase: 0.22 },
      { count: 7, cx: 45, cz: -45, rMin: 10, rMax: 18, speedBase: -0.28 },
      { count: 7, cx: 142, cz: -55, rMin: 12, rMax: 20, speedBase: 0.25 },
      { count: 7, cx: 85, cz: -45, rMin: 18, rMax: 30, speedBase: -0.20 }
    ];

    fishSchools.forEach((school, sIdx) => {
      for (let f = 0; f < school.count; f++) {
        const fishGroup = new THREE.Group();
        const mat = fishMatList[(sIdx + f) % fishMatList.length];

        // Thân cá chép uốn lượn hình thoi
        const bodyGeo = new THREE.ConeGeometry(0.18, 0.85, 6);
        bodyGeo.rotateX(Math.PI / 2);
        bodyGeo.scale(0.55, 0.75, 1.0);
        const bodyMesh = new THREE.Mesh(bodyGeo, mat);
        fishGroup.add(bodyMesh);

        // Vây lưng cá
        const dorsalGeo = new THREE.BoxGeometry(0.02, 0.16, 0.30);
        const dorsal = new THREE.Mesh(dorsalGeo, mat);
        dorsal.position.set(0, 0.14, -0.05);
        fishGroup.add(dorsal);

        // Vây bơi hai bên
        for (let side of [-1, 1]) {
          const fin = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.02, 0.15), mat);
          fin.position.set(side * 0.12, -0.04, 0.15);
          fin.rotation.z = side * 0.3;
          fishGroup.add(fin);
        }

        // Đuôi cá có khớp lắc
        const tailPivot = new THREE.Group();
        tailPivot.position.set(0, 0, -0.42);
        const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.35), mat);
        tailFin.position.set(0, 0, -0.15);
        tailPivot.add(tailFin);
        fishGroup.add(tailPivot);

        const radius = school.rMin + Math.random() * (school.rMax - school.rMin);
        const angle = (f / school.count) * Math.PI * 2 + Math.random() * 0.5;
        const speed = school.speedBase * (0.85 + Math.random() * 0.3);

        fishGroup.position.set(
          school.cx + Math.cos(angle) * radius,
          0.04,
          school.cz + Math.sin(angle) * radius
        );
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
    // ĐẢO NGỌC SƠN TỰ NHIÊN (Rộng 44m, cao y = 0.8m)
    const ngocIsland = new THREE.Mesh(new THREE.CylinderGeometry(22, 25, 1.6, 32), this.materials.mossStone);
    ngocIsland.position.set(128, 0.8, -68);
    ngocIsland.castShadow = true;
    ngocIsland.receiveShadow = true;
    zoneGroup.add(ngocIsland);
    this.colliders.push(ngocIsland); // ĐĂNG KÝ VÀO COLLIDERS ĐỂ ĐI LẠI TỰ DO TRÊN ĐẢO!

    // RÀO CHẮN ĐÁ MẶT NƯỚC VEN ĐẢO NGỌC SƠN (Ngăn rơi xuống nước, chừa lối vào từ Cầu Thê Húc)
    const islandPostCount = 32;
    for (let ip = 0; ip < islandPostCount; ip++) {
      const iAngle = (ip / islandPostCount) * Math.PI * 2;
      // Chừa lối vào từ Cầu Thê Húc (Góc Đông Nam: angle khoảng 0.05 đến 0.65)
      if (iAngle > 0.05 && iAngle < 0.65) continue;

      const ix = 128 + Math.cos(iAngle) * 21.5;
      const iz = -68 + Math.sin(iAngle) * 21.5;
      const rockMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 0.85, 8), this.materials.mossStone);
      rockMesh.position.set(ix, 1.05, iz);
      rockMesh.castShadow = true;
      zoneGroup.add(rockMesh);
      this._addBoxObstacle(ix, iz, 1.2, 1.2, 0, 2.0);
    }

    // =========================================================================
    // ⛩️ CẦU THÊ HÚC ĐỎ SON 15 NHỊP - NÂNG CẤP ĐẠI TRÙNG TU CHUẨN KIẾN TRÚC THĂNG LONG
    // Bản mặt cầu mở rộng 3.8m thênh thang, vòm cong thoải êm ái, 16 cặp cọc cừ gỗ lim cắm đáy hồ,
    // hàng song tiện sơn son thếp vàng búp sen thanh nhã, triệt tiêu 100% vòm ống cản trở!
    // =========================================================================

    // 1. DỐC TIẾP CẬN THOẢI ĐẦU CẦU PHÍA BỜ HỒ (Thê Húc Bridge Approach Ramp) - BẢN RỘNG 3.8M
    const theHucApproachGeo = new THREE.BoxGeometry(11.0, 0.28, 3.8);
    const theHucApproachRamp = new THREE.Mesh(theHucApproachGeo, this.materials.theHucRed);
    theHucApproachRamp.position.set(162, 0.52, -39);
    theHucApproachRamp.rotation.y = -Math.atan2(-6, -8);
    theHucApproachRamp.rotation.z = 0.05; // Độ dốc thoải < 8% nối êm từ hè lên mặt cầu
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
      const deckPlank = new THREE.Mesh(new THREE.BoxGeometry(segLength + 0.12, 0.24, 3.8), this.materials.theHucRed);
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

        // Obstacle bảo vệ chống ngã xuống nước
        this._addBoxObstacle(mid.x + perpX * side, mid.z + perpZ * side, 0.5, 0.5, mid.y, mid.y + 1.8);
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

    // ĐẮC NGUYỆT LÂU (Lầu Đón Trăng - Cổng Đền Ngọc Sơn 2 tầng mái cong)
    const dacNguyetLau = new THREE.Group();
    dacNguyetLau.position.set(130, 0.9, -67);
    const dnlPillars = [
      [-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]
    ];
    dnlPillars.forEach(p => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 4.5, 8), this.materials.theHucRed);
      col.position.set(p[0], 2.25, p[1]);
      dacNguyetLau.add(col);
      // Obstacle nhỏ cho từng cột để người chơi không đi xuyên cột mà vẫn bước đi thênh thang ở giữa
      this._addBoxObstacle(130 + p[0], -67 + p[1], 0.55, 0.55, 0, 5.0);
    });
    const dnlRoof1 = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.4, 4), this.materials.roofTile);
    dnlRoof1.rotation.y = Math.PI / 4;
    dnlRoof1.position.y = 4.8;
    dacNguyetLau.add(dnlRoof1);
    const dnlRoof2 = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.1, 4), this.materials.roofTile);
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
    thapButGroup.position.set(168, 0, -30);
    // Núi Ngọc Bội bằng các phiến đá xếp chồng tự nhiên
    const ngocBoiMount = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.8, 2.2, 12), this.materials.mossStone);
    ngocBoiMount.position.y = 1.1;
    thapButGroup.add(ngocBoiMount);
    this._addBoxObstacle(168, -30, 4.2, 4.2, 0, 15);

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
    daiNghien.position.set(165, 2.8, -34);
    thapButGroup.add(daiNghien);
    zoneGroup.add(thapButGroup);

    // BIA KỶ NIỆM LỊCH SỬ THÁP BÚT - ĐÀI NGHIÊN & CẦU THÊ HÚC
    this.interactables.push({
      position: new THREE.Vector3(166, 0.5, -34),
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

    // 4. ĐƯỜNG RAY XE LỬA UỐN LƯỢN (Phố Cà Phê Đường Tàu Phùng Hưng)
    const trackCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-180, 0.15, 32),
      new THREE.Vector3(-110, 0.15, 56),
      new THREE.Vector3(-55, 0.15, 60),
      new THREE.Vector3(0, 0.15, 58),
      new THREE.Vector3(60, 4.0, 60)
    ]);

    const pts = trackCurve.getPoints(60);
    for (let side of [-1, 1]) {
      const railPts = pts.map(p => new THREE.Vector3(p.x, p.y + 0.12, p.z + side * 0.75));
      const railGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 60, 0.08, 6, false);
      const railMesh = new THREE.Mesh(railGeo, this.materials.rustySteel);
      railMesh.castShadow = true;
      zoneGroup.add(railMesh);
    }

    // Tà vẹt gỗ
    for (let i = 0; i < pts.length - 1; i += 2) {
      const p = pts[i];
      const nextP = pts[i + 1] || p;
      const angle = Math.atan2(nextP.z - p.z, nextP.x - p.x);
      const sleeper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 2.2), this.materials.retroWood);
      sleeper.position.set(p.x, p.y + 0.04, p.z);
      sleeper.rotation.y = -angle;
      zoneGroup.add(sleeper);
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

    // Tường sau (z = d/2 - wallThick/2 = 7.825)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(w - wallThick * 2, h, wallThick), this.materials.yellowWall);
    backWall.position.set(0, h / 2, d / 2 - wallThick / 2);
    backWall.castShadow = true;
    shopGroup.add(backWall);
    this._addBoxObstacle(x, z + d / 2 - wallThick / 2, w - wallThick * 2, wallThick + 0.05, 0, h + 2);

    // Tường trước (z = -d/2 + wallThick/2 = -7.825) - Chừa khoảng cửa vào ở giữa rộng 2.8m, cao 3.0m
    const doorW = 2.8;
    const doorH = 3.0;
    const frontSideW = (w - doorW - wallThick * 2) / 2; // ~4.25m mỗi bên

    const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(frontSideW, h, wallThick), this.materials.yellowWall);
    frontLeft.position.set(-doorW / 2 - frontSideW / 2, h / 2, -d / 2 + wallThick / 2);
    frontLeft.castShadow = true;
    shopGroup.add(frontLeft);
    this._addBoxObstacle(x - doorW / 2 - frontSideW / 2, z - d / 2 + wallThick / 2, frontSideW + 0.05, wallThick + 0.05, 0, h + 2);

    const frontRight = new THREE.Mesh(new THREE.BoxGeometry(frontSideW, h, wallThick), this.materials.yellowWall);
    frontRight.position.set(doorW / 2 + frontSideW / 2, h / 2, -d / 2 + wallThick / 2);
    frontRight.castShadow = true;
    shopGroup.add(frontRight);
    this._addBoxObstacle(x + doorW / 2 + frontSideW / 2, z - d / 2 + wallThick / 2, frontSideW + 0.05, wallThick + 0.05, 0, h + 2);

    // Lanh-tô trên cửa vào
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorW, h - doorH, wallThick), this.materials.yellowWall);
    lintel.position.set(0, doorH + (h - doorH) / 2, -d / 2 + wallThick / 2);
    shopGroup.add(lintel);

    // Mái ngói nhấp nhô phía trên
    const roof = new THREE.Mesh(new THREE.ConeGeometry(9.0, 2.5, 4), this.materials.roofTile);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, h + 1.25, 0);
    shopGroup.add(roof);

    // Biển hiệu tiệm cà phê chữ thư pháp vintage
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 0.15), this.materials.vintagePosters);
    signBoard.position.set(0, 3.4, -d / 2 - 0.08);
    shopGroup.add(signBoard);

    // Cánh cửa mở tương tác tại lối vào
    this._createOpenableDoor(x, z - d / 2, 2.6, 2.8, 'Tiệm Cà Phê Trứng & Trà Sen Tây Hồ', 0x3d2316);

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

    // QUẦY BAR TRUNG TÂM GỖ LIM DÀI 5.2M VIỀN ĐỒNG THAU (Texture AI Wood Varnish 140KB)
    const barGroup = new THREE.Group();
    barGroup.position.set(0, 0, 3.2);

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
    this._addBoxObstacle(x, z + 3.2, 5.4, 1.3, 0, 1.5); // AABB Obstacle quầy bar

    // KỆ TỦ TRƯNG BÀY TRÀ & CÀ PHÊ KỊCH TRẦN (Sau lưng quầy bar, cao 3.8m, dài 5.4m)
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(0, 0, d / 2 - wallThick - 0.25);

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
    this._addBoxObstacle(x, z + d / 2 - wallThick - 0.25, 5.5, 0.6, 0, 4.2);

    // MÁY HÁT ĐĨA THAN LOA KÈN ĐỒNG CỔ (GRAMOPHONE) ĐẶT TRÊN ĐÔN GỖ
    const gramoGroup = new THREE.Group();
    gramoGroup.position.set(-w / 2 + wallThick + 1.2, 0, 5.2);

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
    this._addBoxObstacle(x - w / 2 + wallThick + 1.2, z + 5.2, 1.0, 1.0, 0, 2.0);

    // Điểm tương tác bật máy hát đĩa than cổ (Audio Gramophone)
    this.interactables.push({
      position: new THREE.Vector3(x - w / 2 + wallThick + 1.2, 0.5, z + 5.2),
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

    // ĐỒNG HỒ QUẢ LẮC ĐỨNG BẰNG GỖ SỒI
    const clockGroup = new THREE.Group();
    clockGroup.position.set(w / 2 - wallThick - 0.8, 0, 6.2);

    const clockBody = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.4, 0.45), this.materials.woodVarnish || this.materials.retroWood);
    clockBody.position.y = 1.2;
    clockGroup.add(clockBody);

    const pendulum = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12), brassMat);
    pendulum.position.set(0, 1.0, 0.2);
    clockGroup.add(pendulum);

    shopGroup.add(clockGroup);
    this._addBoxObstacle(x + w / 2 - wallThick - 0.8, z + 6.2, 0.8, 0.6, 0, 2.6);

    // Điểm tương tác lắng nghe nhịp đồng hồ quả lắc
    this.interactables.push({
      position: new THREE.Vector3(x + w / 2 - wallThick - 0.8, 0.5, z + 6.2),
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
    sofa1.position.set(-3.5, 0.375, -4.5);
    shopGroup.add(sofa1);
    const tableS1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.42, 0.65), this.materials.retroWood);
    tableS1.position.set(-3.5, 0.21, -3.2);
    shopGroup.add(tableS1);
    this._addBoxObstacle(x - 3.5, z - 3.8, 2.4, 2.0, 0, 1.0);

    // Bộ sofa 2 (Da nâu cổ điển - Phía trước bên phải)
    const brownLeatherMat = new THREE.MeshStandardMaterial({ color: 0x54321d, roughness: 0.65 });
    const sofa2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 0.85), brownLeatherMat);
    sofa2.position.set(3.5, 0.375, -4.5);
    shopGroup.add(sofa2);
    const tableS2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.42, 0.65), this.materials.retroWood);
    tableS2.position.set(3.5, 0.21, -3.2);
    shopGroup.add(tableS2);
    this._addBoxObstacle(x + 3.5, z - 3.8, 2.4, 2.0, 0, 1.0);

    // Bộ sofa 3 (Góc tường giữa bên trái)
    const sofa3 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.75, 2.0), brownLeatherMat);
    sofa3.position.set(-w / 2 + wallThick + 0.6, 0.375, 0.2);
    shopGroup.add(sofa3);
    this._addBoxObstacle(x - w / 2 + wallThick + 0.6, z + 0.2, 1.2, 2.2, 0, 1.0);

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

    // CẦU THANG GỖ DẪN LÊN GÁC LỬNG (MEZZANINE) DỌC TƯỜNG TRÁI
    const stairX = -w / 2 + wallThick + 0.6;
    for (let st = 0; st < 9; st++) {
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.18, 0.35), this.materials.retroWood);
      stepMesh.position.set(stairX, (st + 1) * 0.24, 1.8 + st * 0.35);
      shopGroup.add(stepMesh);
      this.colliders.push(stepMesh);
    }
    // Sàn gác lửng
    const mezzanine = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 3.6), this.materials.retroWood);
    mezzanine.position.set(-w / 2 + wallThick + 1.6, 2.4, 5.8);
    shopGroup.add(mezzanine);
    this.colliders.push(mezzanine);
    this._addBoxObstacle(x - w / 2 + wallThick + 1.6, z + 5.8, 3.4, 3.8, 0, 2.3);

    // ĐÈN CHÙM ĐỒNG THẢ TRẦN & 8 ĐÈN RỌI SPOTLIGHT VÀNG ẤM
    const chandelier = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.2, 0.4, 8), brassMat);
    chandelier.position.set(0, h - 0.3, -0.5);
    shopGroup.add(chandelier);

    const mainLight = new THREE.PointLight(0xffd580, 2.6, 18);
    mainLight.position.set(0, h - 0.5, -0.5);
    shopGroup.add(mainLight);

    // 3. NPC BÁC BA CÀ PHÊ (Đứng sau quầy bar tiếp đón khách)
    const hostNpc = this._createCitizenNPC(0, 4.4, 0x5a3923, 'kính lão');
    shopGroup.add(hostNpc);
    this._addNpcCollider(x, z + 4.4, 0.65);

    // Điểm tương tác nói chuyện với Bác Ba Cà Phê
    this.interactables.push({
      position: new THREE.Vector3(x, 0.5, z + 2.0),
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

    // Tường sau
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(w - wallThick * 2, h, wallThick), this.materials.yellowWall);
    backWall.position.set(0, h / 2, d / 2 - wallThick / 2);
    backWall.castShadow = true;
    storeGroup.add(backWall);
    this._addBoxObstacle(x, z + d / 2 - wallThick / 2, w - wallThick * 2, wallThick + 0.05, 0, h + 2);

    // Tường trước có cửa 2.8m ở giữa
    const doorW = 2.8;
    const doorH = 3.0;
    const frontSideW = (w - doorW - wallThick * 2) / 2;

    const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(frontSideW, h, wallThick), this.materials.yellowWall);
    frontLeft.position.set(-doorW / 2 - frontSideW / 2, h / 2, -d / 2 + wallThick / 2);
    frontLeft.castShadow = true;
    storeGroup.add(frontLeft);
    this._addBoxObstacle(x - doorW / 2 - frontSideW / 2, z - d / 2 + wallThick / 2, frontSideW + 0.05, wallThick + 0.05, 0, h + 2);

    const frontRight = new THREE.Mesh(new THREE.BoxGeometry(frontSideW, h, wallThick), this.materials.yellowWall);
    frontRight.position.set(doorW / 2 + frontSideW / 2, h / 2, -d / 2 + wallThick / 2);
    frontRight.castShadow = true;
    storeGroup.add(frontRight);
    this._addBoxObstacle(x + doorW / 2 + frontSideW / 2, z - d / 2 + wallThick / 2, frontSideW + 0.05, wallThick + 0.05, 0, h + 2);

    // Lanh-tô trên cửa
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorW, h - doorH, wallThick), this.materials.yellowWall);
    lintel.position.set(0, doorH + (h - doorH) / 2, -d / 2 + wallThick / 2);
    storeGroup.add(lintel);

    // Mái ngói
    const roof = new THREE.Mesh(new THREE.ConeGeometry(9.0, 2.5, 4), this.materials.roofTile);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, h + 1.25, 0);
    storeGroup.add(roof);

    // Biển hiệu đỏ chữ vàng Bách Hóa Mậu Dịch
    const signMat = new THREE.MeshStandardMaterial({ color: 0x9e2424, roughness: 0.5 });
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.95, 0.15), signMat);
    signBoard.position.set(0, 3.4, -d / 2 - 0.08);
    storeGroup.add(signBoard);

    // Cánh cửa mở tương tác
    this._createOpenableDoor(x, z - d / 2, 2.6, 2.8, 'Cửa Hàng Bách Hóa Mậu Dịch Số 18', 0x2e1a12);

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

    // BÀN QUẦY THU NGÂN PHÂN PHỐI MẬU DỊCH VIÊN (Ngang phòng tại z = 4.8)
    const counterDesk = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.05, 1.2), this.materials.woodVarnish || this.materials.retroWood);
    counterDesk.position.set(0, 0.525, 4.8);
    counterDesk.castShadow = true;
    storeGroup.add(counterDesk);
    this._addBoxObstacle(x, z + 4.8, 6.0, 1.3, 0, 1.5);

    // Chiếc cân đĩa đồng cổ có bộ quả cân sắt
    const brassScaleMat = new THREE.MeshStandardMaterial({ color: 0xc49a45, metalness: 0.85, roughness: 0.25 });
    const scaleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.08, 12), brassScaleMat);
    scaleBase.position.set(-1.2, 1.09, 4.8);
    storeGroup.add(scaleBase);
    const scalePole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.38, 8), brassScaleMat);
    scalePole.position.set(-1.2, 1.28, 4.8);
    storeGroup.add(scalePole);

    // Bàn tính gảy bằng gỗ kêu lách cách
    const abacus = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.28), this.materials.retroWood);
    abacus.position.set(-0.3, 1.08, 4.8);
    storeGroup.add(abacus);

    // ĐÀI RADIO CASSETTE LIÊN XÔ VEF-206
    const radioVef = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.32, 0.22), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.5 }));
    radioVef.position.set(1.4, 1.21, 4.8);
    storeGroup.add(radioVef);

    // QUẠT TAI VOI LIÊN XÔ CÁNH CAO SU DẺO XANH NGỌC
    const fanBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.25, 12), new THREE.MeshStandardMaterial({ color: 0x4a7c6d, roughness: 0.4 }));
    fanBase.position.set(2.2, 1.18, 4.8);
    storeGroup.add(fanBase);

    // XE ĐẠP THỐNG NHẤT KHUNG NAM MÀU XANH BỘ ĐỘI DỰNG GÓC PHÒNG DANH DỰ
    const bikeGroup = new THREE.Group();
    bikeGroup.position.set(-w / 2 + wallThick + 1.2, 0, -4.5);
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
    this._addBoxObstacle(x - w / 2 + wallThick + 1.2, z - 4.5, 1.8, 1.0, 0, 1.2);

    // Điểm tương tác rung chuông xe đạp Thống Nhất (Audio Bicycle Bell)
    this.interactables.push({
      position: new THREE.Vector3(x - w / 2 + wallThick + 1.2, 0.5, z - 4.5),
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

    // BÍCH HỌA & TRANH CỔ ĐỘNG THỜI BAO CẤP TRÊN TƯỜNG (Texture AI 300KB)
    const posterMat = this.materials.sovietPoster || new THREE.MeshStandardMaterial({ color: 0xb52b27, roughness: 0.7 });
    const propagandaPoster = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.04), posterMat);
    propagandaPoster.position.set(0, 2.6, d / 2 - wallThick - 0.03);
    storeGroup.add(propagandaPoster);

    // ĐÈN TUÝP HUỲNH QUANG DÂY XÍCH & BÓNG SỢI ĐỐT VÀNG ẤM
    const tubeLight = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8), new THREE.MeshBasicMaterial({ color: 0xdff0ff }));
    tubeLight.rotation.z = Math.PI / 2;
    tubeLight.position.set(0, h - 0.4, -0.6);
    storeGroup.add(tubeLight);

    const storePointLight = new THREE.PointLight(0xfff0dd, 2.4, 18);
    storePointLight.position.set(0, h - 0.5, -0.6);
    storeGroup.add(storePointLight);

    // 3. NPC CÔ MẬU DỊCH VIÊN (Đứng sau bàn quầy)
    const shopkeeper = this._createCitizenNPC(0, 5.8, 0x1e4b6e, 'áo sơ mi hoa');
    storeGroup.add(shopkeeper);
    this._addNpcCollider(x, z + 5.8, 0.65);

    // Điểm tương tác mua đồ và nghe kể chuyện bao cấp
    this.interactables.push({
      position: new THREE.Vector3(x, 0.5, z + 3.6),
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
  _buildZone3LongBien() {
    const zoneGroup = new THREE.Group();
    zoneGroup.name = 'Zone3_LongBien';

    // 1. Mặt sông Hồng phù sa đỏ rực
    const riverGeo = new THREE.PlaneGeometry(240, 150);
    riverGeo.rotateX(-Math.PI / 2);
    const riverMesh = new THREE.Mesh(riverGeo, this.materials.redRiver);
    riverMesh.position.set(125, 0.15, 165);
    zoneGroup.add(riverMesh);

    // Bãi bồi phù sa lau sậy
    const sandGeo = new THREE.PlaneGeometry(160, 60);
    sandGeo.rotateX(-Math.PI / 2);
    const sandMesh = new THREE.Mesh(sandGeo, new THREE.MeshStandardMaterial({ color: 0xb5956a, roughness: 0.9 }));
    sandMesh.position.set(120, 0.25, 130);
    zoneGroup.add(sandMesh);

    // 2. DẦM THÉP EIFFEL CẦU LONG BIÊN VÀ HỆ THỐNG TIẾP CẬN (RAMP & CẦU THANG BỘ)
    const bridgeY = 4.2;

    // Gờ tiếp đất bản rộng 6.5m nối đất lên đầu dốc dẫn phía Tây (x = 5.0 đến x = 11.0)
    const startLip = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.40, 6.5), this.materials.rampStone || this.materials.hanoiPavement);
    startLip.position.set(8.0, 0.15, 60.0);
    startLip.rotation.z = 0.05;
    startLip.receiveShadow = true;
    zoneGroup.add(startLip);
    this.colliders.push(startLip);

    // DỐC DẪN CHÍNH (MAIN INCLINE RAMP) BẢN RỘNG 6.5M - LIỀN MẠCH 100% TỪ x = 10.0 LÊN x = 36.0
    // Khắc phục triệt để lỗi rơi khỏi cầu: Ramp rộng 6.5m khớp tuyệt đối với mặt dầm cầu, chồng lấn 1m lên dầm chính
    const rampLength = 26.0;
    const rampRise = bridgeY - 0.15; // 4.05m
    const rampHypot = Math.hypot(rampLength, rampRise); // ~26.31m
    const rampAngle = Math.atan2(rampRise, rampLength); // ~0.154 rad

    const rampGeo = new THREE.BoxGeometry(rampHypot, 0.55, 6.5);
    const mainRamp = new THREE.Mesh(rampGeo, this.materials.rampStone || this.materials.hanoiPavement);
    mainRamp.position.set(10.0 + rampLength / 2, 0.15 + rampRise / 2, 60.0);
    mainRamp.rotation.z = rampAngle; // Dốc nghiêng lên chuẩn xác
    mainRamp.castShadow = true;
    mainRamp.receiveShadow = true;
    zoneGroup.add(mainRamp);
    this.colliders.push(mainRamp); // ĐĂNG KÝ VÀO COLLIDERS ĐỂ NGƯỜI CHƠI BƯỚC ĐI MƯỢT MÀ LÊN CẦU!

    // Rào chắn dầm thép bảo vệ hai bên dốc dẫn (Chống rơi 100%)
    for (let side of [-3.3, 3.3]) {
      const rampGuard = new THREE.Mesh(new THREE.BoxGeometry(rampHypot, 1.25, 0.22), this.materials.rustySteel);
      rampGuard.position.set(10.0 + rampLength / 2, 0.15 + rampRise / 2 + 0.7, 60.0 + side);
      rampGuard.rotation.z = rampAngle;
      rampGuard.castShadow = true;
      zoneGroup.add(rampGuard);
      this._addBoxObstacle(10.0 + rampLength / 2, 60.0 + side, rampLength + 1.0, 0.5, 0, bridgeY + 2.5);
    }

    // CẦU THANG BỘ GẠCH ĐÁ PHỤ TRỢ (PEDESTRIAN STONE STAIRCASE)
    const stairXStart = 12.0;
    const stairZ = 60.0 + 4.2;
    const numSteps = 24;
    const stepHeight = (bridgeY - 0.1) / numSteps; // ~0.17m
    const stepDepth = (35.0 - stairXStart) / numSteps; // ~0.95m

    const stairStoneMat = this.materials.mossStone;
    for (let s = 0; s < numSteps; s++) {
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(stepDepth + 0.05, 0.22, 1.6), stairStoneMat);
      stepMesh.position.set(stairXStart + s * stepDepth + stepDepth / 2, 0.1 + (s + 1) * stepHeight, stairZ);
      stepMesh.receiveShadow = true;
      zoneGroup.add(stepMesh);
      this.colliders.push(stepMesh);
    }

    // Tay vịn cầu thang sắt sơn chống rỉ màu nâu đỏ
    const stairRail = new THREE.Mesh(new THREE.BoxGeometry(rampHypot, 0.08, 0.08), this.materials.rustySteel);
    stairRail.position.set(stairXStart + (35.0 - stairXStart) / 2, 0.1 + rampRise / 2 + 1.0, stairZ + 0.85);
    stairRail.rotation.z = rampAngle;
    zoneGroup.add(stairRail);

    // MẶT SÀN DẦM CẦU CHÍNH TRÊN CAO (Nối tiếp liền mạch từ x = 35.0 đến x = 220.0)
    const mainDeckLength = 220.0 - 35.0; // 185m
    const mainDeckCenter = 35.0 + mainDeckLength / 2; // 127.5m

    const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(mainDeckLength, 0.6, 6.5), this.materials.rustySteel);
    bridgeDeck.position.set(mainDeckCenter, bridgeY, 60);
    bridgeDeck.castShadow = true;
    bridgeDeck.receiveShadow = true;
    zoneGroup.add(bridgeDeck);
    this.colliders.push(bridgeDeck);

    // ĐƯỜNG RAY XE LỬA VÀ TÀ VẸT GỖ CHẠY DỌC GIỮA CẦU LONG BIÊN
    // 2 thanh ray thép rỉ màu nâu đậm
    for (let rz of [-0.75, 0.75]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(mainDeckLength, 0.16, 0.10), this.materials.rustySteel);
      rail.position.set(mainDeckCenter, bridgeY + 0.35, 60 + rz);
      rail.castShadow = true;
      zoneGroup.add(rail);
    }
    // Hàng tà vẹt gỗ xếp đều đặn dưới thanh ray
    const tieMat = this.materials.retroWood || this.materials.woodVarnish;
    const tieGeo = new THREE.BoxGeometry(0.24, 0.12, 2.2);
    for (let rx = 36; rx <= 218; rx += 2.0) {
      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.set(rx, bridgeY + 0.32, 60);
      tie.castShadow = true;
      zoneGroup.add(tie);
    }

    // Hành lang gỗ đi bộ hai bên dầm cầu
    const walkMat = this.materials.rampStone || this.materials.hanoiPavement;
    for (let wz of [-2.3, 2.3]) {
      const walkDeck = new THREE.Mesh(new THREE.BoxGeometry(mainDeckLength, 0.12, 1.8), walkMat);
      walkDeck.position.set(mainDeckCenter, bridgeY + 0.32, 60 + wz);
      walkDeck.receiveShadow = true;
      zoneGroup.add(walkDeck);
    }

    // Trụ cầu bê tông khổng lồ cắm sâu lòng đất đỡ mặt cầu từ phía dưới
    for (let x = 35; x <= 200; x += 36) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(4.0, bridgeY, 7.5), this.materials.mossStone);
      pier.position.set(x, bridgeY / 2, 60);
      pier.castShadow = true;
      zoneGroup.add(pier);
      this._addBoxObstacle(x, 60, 4.4, 7.9, 0, bridgeY - 0.2); // Chống xuyên trụ dưới gầm cầu, mặt cầu trên cao thông suốt!

      // Nhịp dầm thép Eiffel vươn cao
      const trussSpan = this._createEiffelTrussSpan(34, 12);
      trussSpan.position.set(x + 18, bridgeY + 0.3, 60);
      zoneGroup.add(trussSpan);
    }

    // Lan can thành cầu hai bên suốt chiều dài cầu
    for (let zSide of [-3.1, 3.1]) {
      const railGuard = new THREE.Mesh(new THREE.BoxGeometry(mainDeckLength, 1.2, 0.2), this.materials.rustySteel);
      railGuard.position.set(mainDeckCenter, bridgeY + 0.9, 60 + zSide);
      railGuard.castShadow = true;
      zoneGroup.add(railGuard);
      this._addBoxObstacle(mainDeckCenter, 60 + zSide, mainDeckLength, 0.5, bridgeY, bridgeY + 2.0); // Chống rơi khỏi cầu!
    }

    // DỐC HẠ CẦU PHÍA ĐÔNG XUỐNG BÃI GIỮA SÔNG HỒNG (Nối từ x = 220, y = 4.2 xuống bãi bồi x = 245, y = 0.25)
    const exitRampLength = 25.0;
    const exitRampDrop = bridgeY - 0.25; // 3.95m
    const exitRampHypot = Math.hypot(exitRampLength, exitRampDrop);
    const exitRampAngle = -Math.atan2(exitRampDrop, exitRampLength);

    const exitRampGeo = new THREE.BoxGeometry(exitRampHypot, 0.45, 4.5);
    const exitRamp = new THREE.Mesh(exitRampGeo, this.materials.rampStone || this.materials.hanoiPavement);
    exitRamp.position.set(220.0 + exitRampLength / 2, 0.25 + exitRampDrop / 2, 60.0);
    exitRamp.rotation.z = exitRampAngle;
    exitRamp.castShadow = true;
    exitRamp.receiveShadow = true;
    zoneGroup.add(exitRamp);
    this.colliders.push(exitRamp); // ĐĂNG KÝ VÀO COLLIDERS ĐỂ ĐI XUỐNG BÃI GIỮA SÔNG HỒNG!

    // Lan can dầm thép bảo vệ hai bên dốc hạ
    for (let side of [-2.35, 2.35]) {
      const exitGuard = new THREE.Mesh(new THREE.BoxGeometry(exitRampHypot, 1.1, 0.18), this.materials.rustySteel);
      exitGuard.position.set(220.0 + exitRampLength / 2, 0.25 + exitRampDrop / 2 + 0.65, 60.0 + side);
      exitGuard.rotation.z = exitRampAngle;
      zoneGroup.add(exitGuard);
      this._addBoxObstacle(220.0 + exitRampLength / 2, 60.0 + side, exitRampLength + 0.5, 0.4, 0, bridgeY + 2.0);
    }

    this.worldGroup.add(zoneGroup);
  }

  /**
   * Phân khu 4: KHU TẬP THỂ CŨ HOÀNG HÔN (Tọa độ x: [-250, 0], z: [-250, 0])
   */
  _buildZone4CollectiveHousing() {
    const zoneGroup = new THREE.Group();
    zoneGroup.name = 'Zone4_CollectiveHousing';

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

    // 1. CHỊ LAN - GÁNH HÀNG HOA TƯƠI DẠO VEN HỒ (TỰ ĐỘNG DI CHUYỂN QUANH BỜ HỒ GƯƠM)
    const flowerVendorMesh = this._createFlowerVendorNPC(42, -48, 0.4);
    npcGroup.add(flowerVendorMesh);

    // Đăng ký collider ban đầu
    const flowerColliderIndex = this.npcColliders.length;
    this._addNpcCollider(42, -48, 0.7);

    // Lộ trình tuần tra quanh bờ Hồ Gươm (8 Waypoints)
    const flowerWaypoints = [
      new THREE.Vector3(42, 0, -48),
      new THREE.Vector3(46, 0, -88),
      new THREE.Vector3(52, 0, -130),
      new THREE.Vector3(88, 0, -160),
      new THREE.Vector3(130, 0, -152),
      new THREE.Vector3(154, 0, -98),
      new THREE.Vector3(122, 0, -42),
      new THREE.Vector3(72, 0, -35)
    ];

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

    return group;
  }

  /**
   * Tạo NPC Bà cụ bán quán trà đá vỉa hè
   */
  _createTeaStallVendorNPC(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdfb48c, roughness: 0.6 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.85 }); // Áo chần bông nâu
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xd9b37c, roughness: 0.9 });

    // Ghế đẩu gỗ bà cụ ngồi
    const stool = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.32, 0.35), this.materials.retroWood);
    stool.position.set(0, 0.16, 0);
    group.add(stool);

    // Bà cụ ngồi dáng vẻ nhân từ
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.65, 8), jacketMat);
    body.position.set(0, 0.65, 0);
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), skinMat);
    head.position.set(0, 1.10, 0.05);
    group.add(head);

    const nonLa = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.18, 14), strawMat);
    nonLa.position.set(0, 1.22, 0.06);
    group.add(nonLa);

    // Bàn trà đá nhỏ
    const teaTable = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.65), this.materials.retroWood);
    teaTable.position.set(0.65, 0.225, 0.1);
    group.add(teaTable);

    // Cốc thủy tinh trà xanh màu hổ phách
    const cupMat = new THREE.MeshStandardMaterial({ color: 0xcc9933, roughness: 0.2, transparent: true, opacity: 0.85 });
    for (let c = 0; c < 2; c++) {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.08, 8), cupMat);
      cup.position.set(0.50 + c * 0.12, 0.49, -0.05);
      group.add(cup);
    }

    // Phích nước Rạng Đông vỏ sắt đỏ huyền thoại
    const thermosMat = new THREE.MeshStandardMaterial({ color: 0xcc292b, metalness: 0.7, roughness: 0.3 });
    const thermos = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.35, 10), thermosMat);
    thermos.position.set(0.85, 0.62, 0.22);
    group.add(thermos);

    // Ấm tích ủ trong giành tre
    const teaCosy = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.22, 10), strawMat);
    teaCosy.position.set(0.52, 0.56, 0.18);
    group.add(teaCosy);

    // Đĩa kẹo lạc & bao thuốc lá
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.02, 10), skinMat);
    plate.position.set(0.70, 0.46, -0.08);
    group.add(plate);

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

    return group;
  }

  /**
   * Tạo NPC Khách ngồi uống cà phê
   */
  _createCoffeePatronNPC(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const stool = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), this.materials.retroWood);
    stool.position.y = 0.175;
    group.add(stool);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.25, 0.65, 8), new THREE.MeshStandardMaterial({ color: 0x3d4a36 }));
    body.position.y = 0.68;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), new THREE.MeshStandardMaterial({ color: 0xefc49e }));
    head.position.y = 1.12;
    group.add(head);

    return group;
  }

  /**
   * Tạo NPC Người dân đi bộ
   */
  _createCitizenNPC(x, z, coatColor, hatType) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const coatMat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.75 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xefc49e, roughness: 0.6 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.95, 8), coatMat);
    body.position.y = 1.05;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), skinMat);
    head.position.y = 1.62;
    group.add(head);

    if (hatType === 'nón phớt') {
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0x221815 }));
      hat.position.y = 1.76;
      group.add(hat);
    }

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
  _createEiffelTrussSpan(length, height) {
    const trussGroup = new THREE.Group();
    const beamMat = this.materials.rustySteel;

    // Khung dầm vòm thép uốn
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-length / 2, 0, 0),
      new THREE.Vector3(-length / 4, height * 0.75, 0),
      new THREE.Vector3(0, height, 0),
      new THREE.Vector3(length / 4, height * 0.75, 0),
      new THREE.Vector3(length / 2, 0, 0)
    ]);

    for (let zSide of [-2.8, 2.8]) {
      const arch = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.22, 6, false), beamMat);
      arch.position.z = zSide;
      arch.castShadow = true;
      trussGroup.add(arch);

      // Các thanh đan chéo chữ X dầm Eiffel
      for (let x = -length / 2 + 4; x <= length / 2 - 4; x += 6) {
        const diag1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, height * 0.75, 4), beamMat);
        diag1.position.set(x, height * 0.38, zSide);
        diag1.rotation.z = Math.PI / 4;
        trussGroup.add(diag1);

        const diag2 = diag1.clone();
        diag2.rotation.z = -Math.PI / 4;
        trussGroup.add(diag2);
      }
    }

    return trussGroup;
  }

  /**
   * Cây bóng mát cổ thụ chân thực (Phố cổ & ven hồ)
   */
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
    // 1. Quán trà đá cóc vỉa hè
    this.interactables.push({
      position: new THREE.Vector3(-50, 0.5, 58),
      radius: 2.5,
      promptText: 'Ngồi uống chén trà đá vỉa hè',
      actionKey: 'E',
      onInteract: () => {
        if (this.eventBus) {
          this.eventBus.emit('UI:OPEN_DIALOGUE', {
            name: 'Bà Cụ &bull; Quán Nước Chè Xanh Phố Cổ',
            role: 'Cụ bà mở quán nước chè bên hiên phố hơn 40 năm',
            avatar: '👵',
            greeting: '"Lãng tử vào làm chén nước chè tươi hay cốc trà đá cho đỡ khát nào cháu!"',
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
              { name: 'Thanh Kẹo Lạc Giòn Rụm', price: '5 Xu', desc: 'Vị bùi của lạc hòa quyện mật mía ngọt ngào', icon: '🥜' }
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
  update(delta) {
    const time = performance.now() * 0.001;

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

    // 4. Cập nhật đàn cá chép vàng & cá koi bơi lội sinh động dưới lòng Hồ Gươm
    for (let i = 0; i < this.lakeFish.length; i++) {
      const fish = this.lakeFish[i];
      fish.orbitAngle += fish.orbitSpeed * delta;
      const r = fish.orbitRadius + Math.sin(time * 1.5 + fish.swimPhase) * 2.2;
      fish.group.position.x = fish.centerX + Math.cos(fish.orbitAngle) * r;
      fish.group.position.z = fish.centerZ + Math.sin(fish.orbitAngle) * r;
      fish.group.position.y = 0.04 + Math.sin(time * 2.2 + fish.swimPhase) * 0.012;

      // Hướng quay tiếp tuyến quỹ đạo kèm uốn lượn hình sin
      const tangent = fish.orbitAngle + (Math.PI / 2) * Math.sign(fish.orbitSpeed);
      const serpentine = Math.sin(time * 4.2 + fish.swimPhase) * 0.14;
      fish.group.rotation.y = -tangent + Math.PI / 2 + serpentine;

      // Vẫy đuôi cá nhịp nhàng tự nhiên
      if (fish.tail) {
        fish.tail.rotation.y = Math.sin(time * 7.5 + fish.swimPhase) * 0.45;
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
}
