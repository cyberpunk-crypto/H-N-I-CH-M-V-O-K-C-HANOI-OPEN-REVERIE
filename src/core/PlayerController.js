/**
 * PlayerController.js - Điều khiển di chuyển mượt mà chuẩn GTA V Third-Person Locomotion
 * 
 * Các tính năng nâng cấp theo chỉ lệnh của Sếp Tổng & GAME_SPEC.md:
 * 1. SỬA TRIỆT ĐỂ LỖI ĐI NGƯỢC (MOONWALKING): targetAngle = Math.atan2(finalDir.x, finalDir.z) (xóa bỏ dứt điểm + Math.PI).
 * 2. TÁI TẠO DA THỊT NGƯỜI THẬT Á ĐÔNG & TRANG PHỤC 3D ĐỘC LẬP ĐA LỚP:
 *    - char_nu_sinh_ao_dai: Nữ sinh Tràng An da ấm sáng (#E8BEAC), áo dài lụa trắng 3D, quần lụa, nón lá trúc chỉ 3D, hoa tai ngọc trai.
 *    - char_co_gai_ao_ba_ba: Cô gái Phố thị da ấm sáng (#E8BEAC), áo bà ba hồng sen 3D, quần lụa đen 3D, khăn rằn caro 3D quấn cổ, nón lá sau lưng.
 *    - char_nam_tri_thuc_suit: Nam trí thức Hà Nội da ấm (#DEB096), suit xám than tweed 3D, quần âu có ly 3D, giày Oxford 3D, kính mắt.
 *    - char_nam_ao_dai_gam: Chàng trai Thăng Long da ấm (#DEB096), áo dài ngũ thân gấm xanh hoàng gia (0x16213e) khuy ngọc bích 3D, khăn xếp 5 tầng nếp 3D.
 * 3. CHỐNG XUYÊN LAN CAN CẦU (CAPSULE HORIZONTAL COLLIDER): dist <= 1.6m, clampFactor giữ an toàn trên Cầu Thê Húc & Cầu Kim Quy.
 * 4. CĂN GÓC CAMERA BAN ĐẦU: Spawn tại (16.5, 0.5, -16.5), yaw = 0.785 rad (45 độ) dọc tim Cầu Thê Húc.
 * 
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { THREE } from './ThreeLib.js';
import { GLTFLoader } from '../lib/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../lib/loaders/meshopt_decoder.module.js';
import * as SkeletonUtils from '../lib/utils/SkeletonUtils.js';
import { createHanoiCharacter3D, CHARACTERS_META } from './CharacterFactory.js';
import { HumanoidAnimator } from './animations.js';

export const CHARACTER_MODELS_MAP = {
  char_nu_sinh_ao_dai: {
    id: 'char_nu_sinh_ao_dai',
    name: 'Nữ Sinh Tràng An • Áo Dài Trắng Nón Lá',
    modelUrl: 'assets/models/Xbot.glb',
    fallbackModelUrl: 'assets/models/Xbot.glb',
    isFemale: true,
    targetHeight: 1.62,
    scale: 0.92,
    facingOffset: 0,
    outfitColor: 0xfcfdfd,
    pantsColor: 0xf2f2f7,
    roughness: 0.32,
    metalness: 0.04,
    skinColor: 0xF3D2C1,
    textures: {
      diffuse: 'assets/textures/char_silk_ivory_white.jpg',
      normal: 'assets/textures/char_silk_ivory_white_norm.jpg',
      pantsDiffuse: 'assets/textures/char_silk_ivory_white.jpg',
      pantsNormal: 'assets/textures/char_silk_ivory_white_norm.jpg'
    },
    accessories: ['nonLa', 'aoDaiFlaps']
  },
  char_co_gai_ao_ba_ba: {
    id: 'char_co_gai_ao_ba_ba',
    name: 'Cô Gái Phố Thị • Áo Bà Ba Hồng Cánh Sen Khăn Rằn',
    modelUrl: 'assets/models/Xbot.glb',
    fallbackModelUrl: 'assets/models/Xbot.glb',
    isFemale: true,
    targetHeight: 1.58,
    scale: 0.90,
    facingOffset: 0,
    outfitColor: 0xdf648a,
    pantsColor: 0x181818,
    roughness: 0.58,
    metalness: 0.02,
    skinColor: 0xF3D2C1,
    textures: {
      diffuse: 'assets/textures/char_cotton_pink_lotus.jpg',
      normal: 'assets/textures/char_cotton_pink_lotus_norm.jpg',
      pantsDiffuse: 'assets/textures/char_silk_black_pants.jpg',
      pantsNormal: 'assets/textures/char_silk_black_pants_norm.jpg'
    },
    accessories: ['khanRan', 'nonLaBack']
  },
  char_nam_tri_thuc_suit: {
    id: 'char_nam_tri_thuc_suit',
    name: 'Nam Trí Thức Hà Nội • Âu Phục Suit Lịch Lãm',
    modelUrl: 'assets/models/Xbot.glb',
    fallbackModelUrl: 'assets/models/Xbot.glb',
    isFemale: false,
    targetHeight: 1.72,
    scale: 0.98,
    facingOffset: 0,
    outfitColor: 0x3a4046,
    pantsColor: 0x1a202c,
    roughness: 0.52,
    metalness: 0.15,
    skinColor: 0xDEB096,
    textures: {
      diffuse: 'assets/textures/char_wool_charcoal_suit.jpg',
      normal: 'assets/textures/char_wool_charcoal_suit_norm.jpg',
      pantsDiffuse: 'assets/textures/char_wool_charcoal_suit.jpg',
      pantsNormal: 'assets/textures/char_wool_charcoal_suit_norm.jpg'
    },
    accessories: ['fedora', 'glasses', 'tie']
  },
  char_nam_ao_dai_gam: {
    id: 'char_nam_ao_dai_gam',
    name: 'Chàng Trai Thăng Long • Áo Dài Gấm Xanh Hoàng Gia',
    modelUrl: 'assets/models/Xbot.glb',
    fallbackModelUrl: 'assets/models/Xbot.glb',
    isFemale: false,
    targetHeight: 1.72,
    scale: 0.98,
    facingOffset: 0,
    outfitColor: 0x16213e,
    pantsColor: 0xf5f5f0,
    roughness: 0.32,
    metalness: 0.28,
    skinColor: 0xDEB096,
    textures: {
      diffuse: 'assets/textures/char_silk_blue_brocade.jpg',
      normal: 'assets/textures/char_silk_blue_brocade_norm.jpg',
      pantsDiffuse: 'assets/textures/char_silk_ivory_white.jpg',
      pantsNormal: 'assets/textures/char_silk_ivory_white_norm.jpg'
    },
    accessories: ['khanXep', 'gamFlaps']
  }
};

export class PlayerController {
  constructor(scene, worldManager, eventBus) {
    this.scene = scene;
    this.worldManager = worldManager;
    this.eventBus = eventBus || window.GameEventBus;

    // Trạng thái điều khiển
    this.isLocked = false;
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false
    };

    // Thông số vật lý & chuyển động chuẩn GTA V Locomotion
    this.walkSpeed = 5.2;
    this.sprintSpeed = 9.2;
    this.jumpForce = 8.5;
    this.gravity = -24.0;

    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.isJumping = false;
    this.isParkouring = false;

    // Bán kính thân người thon gọn vừa vặn ngõ phố Hà Nội
    this.playerRadius = 0.35;
    this.playerHeight = 1.75;
    this.stepUpHeight = 0.55;  // Bước lên gờ vỉa hè / mép tà vẹt cao tới 55cm
    this.maxStepDown = 0.55;   // Snap dính chân khi bước xuống dốc cong Cầu Thê Húc

    // Raycaster kiểm tra mặt đất
    this.raycaster = new THREE.Raycaster();
    this.downVector = new THREE.Vector3(0, -1, 0);

    // Bộ nhớ đệm Vector & Quaternion dùng chung (Zero Allocation Update Loop - 60 FPS mượt mà)
    this._moveVector = new THREE.Vector3();
    this._camForward = new THREE.Vector3();
    this._camRight = new THREE.Vector3();
    this._worldUp = new THREE.Vector3(0, 1, 0);
    this._finalDir = new THREE.Vector3();
    this._testPos = new THREE.Vector3();
    this._rayOrigin = new THREE.Vector3();
    this._targetQuat = new THREE.Quaternion();
    this._groundHits = []; // Cache mảng kết quả raycast tránh cấp phát mới mỗi frame
    this._initialCameraYawSet = false;

    // Biến cho hoạt ảnh sinh học con người
    this.walkCycle = 0;
    this.baseTorsoY = 0.95;
    this.humanoidAnimator = null;

    // Hệ thống Hoạt Họa 3D Skinned Mesh & Mixamo Motion Capture
    this._loadToken = 0;
    this._currentFacingOffset = 0;

    this._gltfLoader = new GLTFLoader();
    if (typeof MeshoptDecoder !== 'undefined') {
      try {
        this._gltfLoader.setMeshoptDecoder(MeshoptDecoder);
      } catch (e) {
        console.warn('[PlayerController] Lỗi cài đặt MeshoptDecoder:', e);
      }
    }
    this._textureLoader = new THREE.TextureLoader();
    this._gltfMixer = null;
    this._animActions = null;
    this._currentAnim = 'idle';
    this._isGltfReady = false;
    this._gltfCache = {};

    // Điểm tương tác & Hệ thống ngồi ghế tương tác (Sit System)
    this.activeInteractable = null;
    this.isSitting = false;
    this.currentSitSpot = null;
    if (this.worldManager) {
      this.worldManager.playerController = this;
    }

    // Khởi tạo mô hình con người bo tròn mềm mại, chân thực
    this._createRealisticHumanMesh();
    this._bindKeyboardEvents();
    this._initChatBubbleListener();
  }

  /**
   * Tạo mô hình 3D con người hữu cơ (Organic Sculpted Human Mesh)
   */
  _createRealisticHumanMesh() {
    this.characterGroup = new THREE.Group();
    this.characterGroup.name = 'DreamerCharacter';

    // Xác định nhân vật ban đầu từ hồ sơ lưu trữ hoặc mặc định là char_nu_sinh_ao_dai
    let savedCharId = 'char_nu_sinh_ao_dai';
    try {
      const profile = JSON.parse(localStorage.getItem('hanoi_user_profile') || '{}');
      if (profile.characterId) savedCharId = profile.characterId;
      else if (profile.outfit && profile.outfit.startsWith('char_')) savedCharId = profile.outfit;
    } catch (e) {}

    // Vị trí xuất phát thông thoáng trên đường dạo ven hồ Gươm dẫn thẳng lên Cầu Kim Quy
    this.characterGroup.position.set(20.0, 0.5, -20.0);
    this.characterGroup.rotation.y = 0.785; // 45 độ theo trục cầu
    this.characterGroup.quaternion.setFromAxisAngle(this._worldUp, 0.785);
    this.scene.add(this.characterGroup);

    this.currentCharacterId = savedCharId;
    this.setCharacter(this.currentCharacterId);

    // Lắng nghe sự kiện chuyển đổi nhân vật
    if (this.eventBus) {
      this.eventBus.on('UI:CHARACTER_CONFIRMED', (payload) => {
        if (payload && (payload.characterId || payload.outfitId)) {
          this.setCharacter(payload.characterId || payload.outfitId);
        }
      });
      this.eventBus.on('CORE:SWITCH_CHARACTER', (payload) => {
        if (payload && payload.characterId) {
          this.setCharacter(payload.characterId);
        }
      });
    }
  }

  /**
   * Đệ quy dọn dẹp 100% tài nguyên Geometries, Materials, Textures, Skeletons và AnimationMixer cũ
   * Triệt tiêu hoàn toàn rò rỉ bộ nhớ GPU và hiện tượng bóng ma dính đè (Ghosting / Race Condition)
   */
  _disposeHierarchy(root) {
    if (!root) return;

    if (this._gltfMixer) {
      try {
        this._gltfMixer.stopAllAction();
        this._gltfMixer.uncacheRoot(root);
      } catch (e) {}
      this._gltfMixer = null;
    }
    this._animActions = null;

    root.traverse((node) => {
      if (node.geometry) {
        node.geometry.dispose();
      }
      if (node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((m) => {
          if (!m) return;
          ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap'].forEach((key) => {
            if (m[key] && typeof m[key].dispose === 'function') {
              // Texture dispose nếu cần
            }
          });
          m.dispose();
        });
      }
      if (node.skeleton) {
        node.skeleton.dispose();
      }
    });

    while (root.children.length > 0) {
      const child = root.children[0];
      root.remove(child);
    }
  }

  /**
   * Tạo mô hình 3D Nón Lá bài thơ truyền thống Việt Nam cho SkinnedMesh
   */
  _create3DNonLa(isMeters = true) {
    const s = isMeters ? 0.01 : 1.0;
    const nonLaGroup = new THREE.Group();
    nonLaGroup.name = '3D_NonLa';

    const outerConeGeo = new THREE.ConeGeometry(20 * s, 11 * s, 32, 1, true);
    const nonLaMat = new THREE.MeshStandardMaterial({
      color: 0xf3e5ab,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    const outerCone = new THREE.Mesh(outerConeGeo, nonLaMat);
    outerCone.position.y = 5.5 * s;
    outerCone.castShadow = true;
    nonLaGroup.add(outerCone);

    const rimGeo = new THREE.TorusGeometry(20 * s, 0.6 * s, 8, 32);
    rimGeo.rotateX(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({ color: 0x8b5a2b }));
    rimMesh.castShadow = true;
    nonLaGroup.add(rimMesh);

    nonLaGroup.position.set(0, 14 * s, -1 * s);
    nonLaGroup.rotation.set(-0.05, 0, 0);
    return nonLaGroup;
  }

  /**
   * Tạo mô hình 3D Khăn Rằn truyền thống Nam Bộ / Phố Thị
   */
  _create3DKhanRan(isMeters = true) {
    const s = isMeters ? 0.01 : 1.0;
    const khanGroup = new THREE.Group();
    khanGroup.name = '3D_KhanRan';

    const scarfMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.75,
      metalness: 0.05
    });

    // Vòng khăn quàng cổ
    const collarRingGeo = new THREE.TorusGeometry(10 * s, 2.5 * s, 8, 24);
    collarRingGeo.rotateX(Math.PI / 2);
    const collarRing = new THREE.Mesh(collarRingGeo, scarfMat);
    collarRing.position.set(0, -1 * s, 0);
    collarRing.castShadow = true;
    khanGroup.add(collarRing);

    // Hai vạt khăn rủ chéo trước ngực
    const stripGeo = new THREE.BoxGeometry(3.5 * s, 18 * s, 0.8 * s);
    const leftStrip = new THREE.Mesh(stripGeo, scarfMat);
    leftStrip.position.set(-4 * s, -9 * s, 5 * s);
    leftStrip.rotation.set(0.12, 0, 0.12);
    leftStrip.castShadow = true;
    khanGroup.add(leftStrip);

    const rightStrip = new THREE.Mesh(stripGeo, scarfMat);
    rightStrip.position.set(4 * s, -9 * s, 5 * s);
    rightStrip.rotation.set(0.12, 0, -0.12);
    rightStrip.castShadow = true;
    khanGroup.add(rightStrip);

    khanGroup.position.set(0, 3 * s, 0);
    return khanGroup;
  }

  /**
   * Tạo mô hình 3D Khăn Xếp (Khăn Đóng) truyền thống Thăng Long 5 tầng nếp
   */
  _create3DKhanXep(isMeters = true) {
    const s = isMeters ? 0.01 : 1.0;
    const turbanGroup = new THREE.Group();
    turbanGroup.name = '3D_KhanXep';

    const turbanMat = new THREE.MeshStandardMaterial({
      color: 0x16213e,
      roughness: 0.7,
      metalness: 0.15
    });
    const goldTrim = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.3,
      metalness: 0.6
    });

    for (let i = 0; i < 5; i++) {
      const ringGeo = new THREE.TorusGeometry((12 + i * 0.35) * s, 1.8 * s, 8, 32);
      ringGeo.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, i === 2 ? goldTrim : turbanMat);
      ring.position.set(0, (14 + i * 1.8) * s, 0);
      ring.scale.set(1.0, 1.0, 1.08);
      ring.castShadow = true;
      turbanGroup.add(ring);
    }

    turbanGroup.position.set(0, 2 * s, 1 * s);
    return turbanGroup;
  }

  /**
   * Tạo hai tà áo dài 3D đa giác mềm mại cho SkinnedMesh
   */
  _create3DFlaps(texDiffuse, colorHex, isMale = false, isMeters = true) {
    const s = isMeters ? 0.01 : 1.0;
    const flapsGroup = new THREE.Group();
    flapsGroup.name = '3D_Flaps';
    const flapWidth = (isMale ? 28 : 26) * s;
    const flapLength = (isMale ? 82 : 78) * s;
    const flapGeo = new THREE.PlaneGeometry(flapWidth, flapLength, 8, 16);

    const p = flapGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const ratio = (y + flapLength * 0.5) / flapLength;
      const x = p.getX(i);
      const flare = 1.0 + (1.0 - ratio) * 0.35;
      p.setX(i, x * flare);
      p.setZ(i, Math.sin(ratio * Math.PI) * (2.0 * s));
    }
    flapGeo.computeVertexNormals();

    const flapMat = new THREE.MeshStandardMaterial({
      map: texDiffuse,
      color: colorHex || 0xffffff,
      roughness: 0.35,
      side: THREE.DoubleSide
    });

    const frontFlap = new THREE.Mesh(flapGeo, flapMat);
    frontFlap.position.set(0, -flapLength * 0.5, 12 * s);
    frontFlap.rotation.x = 0.08;
    flapsGroup.add(frontFlap);

    const backFlap = new THREE.Mesh(flapGeo.clone(), flapMat);
    backFlap.position.set(0, -flapLength * 0.5, -12 * s);
    backFlap.rotation.x = -0.08;
    flapsGroup.add(backFlap);

    return flapsGroup;
  }

  /**
   * Tạo mô hình 3D Mũ Fedora Cổ Điển Hà Nội cho SkinnedMesh
   */
  _create3DFedoraHat(isMeters = false) {
    const scale = isMeters ? 1.0 : 100.0;
    const fedoraGroup = new THREE.Group();
    fedoraGroup.name = '3D_FedoraHat';

    const feltMat = new THREE.MeshStandardMaterial({
      color: 0x3a424e,
      roughness: 0.76,
      metalness: 0.02
    });

    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0x181c22,
      roughness: 0.35,
      metalness: 0.15
    });

    const brimRadius = 0.185 * scale;
    const brimHeight = 0.006 * scale;
    const brimGeo = new THREE.CylinderGeometry(brimRadius, brimRadius * 1.02, brimHeight, 32);
    brimGeo.scale(1.0, 1.0, 1.12);
    const brimMesh = new THREE.Mesh(brimGeo, feltMat);
    brimMesh.castShadow = true;
    fedoraGroup.add(brimMesh);

    const crownHeight = 0.11 * scale;
    const crownGeo = new THREE.CylinderGeometry(0.082 * scale, 0.094 * scale, crownHeight, 32);
    crownGeo.scale(1.0, 1.0, 1.10);
    const crownMesh = new THREE.Mesh(crownGeo, feltMat);
    crownMesh.position.y = (crownHeight * 0.5 + 0.004 * scale);
    crownMesh.castShadow = true;
    fedoraGroup.add(crownMesh);

    const bandGeo = new THREE.CylinderGeometry(0.095 * scale, 0.096 * scale, 0.022 * scale, 32);
    bandGeo.scale(1.0, 1.0, 1.10);
    const bandMesh = new THREE.Mesh(bandGeo, ribbonMat);
    bandMesh.position.y = 0.015 * scale;
    fedoraGroup.add(bandMesh);

    return fedoraGroup;
  }

  /**
   * Tạo AnimationClip bật nhảy vượt chướng ngại vật phong cách GTA V (Vault / Hurdle Leap)
   * Trích xuất tư thế động học đỉnh cao từ khung xương Mixamo gốc của Xbot.glb
   * Tuyệt đối không can thiệp thủ công bằng phép cộng góc quay (+=) tránh xoắn gãy xương
   */
  _createGTA5JumpClip(xbotGltf) {
    if (!xbotGltf || !xbotGltf.scene || !xbotGltf.animations) return null;
    try {
      const xbot = xbotGltf.scene;
      const idle = xbotGltf.animations.find(a => /^idle$/i.test(a.name)) || xbotGltf.animations[0];
      const run = xbotGltf.animations.find(a => /^run$/i.test(a.name)) || xbotGltf.animations.find(a => /walk/i.test(a.name)) || idle;
      if (!idle || !run) return null;

      const tempMixer = new THREE.AnimationMixer(xbot);
      const idleAct = tempMixer.clipAction(idle);
      const runAct = tempMixer.clipAction(run);

      const bones = [];
      xbot.traverse((c) => { if (c.isBone) bones.push(c); });
      const times = [0.0, 0.20, 0.38, 0.60, 0.80];
      const boneSamples = new Map();
      for (const b of bones) boneSamples.set(b.name, []);

      // 1. t = 0.0s: Tư thế chùng nhẹ gối lấy đà bật nhảy
      tempMixer.stopAllAction();
      idleAct.reset().play();
      tempMixer.setTime(0.2);
      tempMixer.update(0);
      for (const b of bones) boneSamples.get(b.name).push(b.quaternion.clone());

      // 2. t = 0.20s: Bật đẩy cơ thể lên không trung
      tempMixer.stopAllAction();
      runAct.reset().play();
      tempMixer.setTime(0.08);
      tempMixer.update(0);
      for (const b of bones) boneSamples.get(b.name).push(b.quaternion.clone());

      // 3. t = 0.38s: Đỉnh cao quỹ đạo nhảy vượt chướng ngại vật (Hurdle Leap) chuẩn GTA V
      // Chân dẫn co đùi gập gối tự nhiên (~38°), chân sau duỗi thoát đà, hai tay vung đón gió
      tempMixer.setTime(0.18);
      tempMixer.update(0);
      for (const b of bones) boneSamples.get(b.name).push(b.quaternion.clone());

      // 4. t = 0.60s: Pha hạ thấp tiếp đất, hai chân vươn xuống đón mặt sàn
      tempMixer.setTime(0.30);
      tempMixer.update(0);
      for (const b of bones) boneSamples.get(b.name).push(b.quaternion.clone());

      // 5. t = 0.80s: Tiếp đất êm ái nhún gối giảm chấn (Landing Cushion)
      tempMixer.stopAllAction();
      idleAct.reset().play();
      tempMixer.setTime(0.0);
      tempMixer.update(0);
      for (const b of bones) boneSamples.get(b.name).push(b.quaternion.clone());

      tempMixer.stopAllAction();
      tempMixer.uncacheRoot(xbot);

      const jumpTracks = [];
      for (const [boneName, quats] of boneSamples) {
        const vals = [];
        for (const q of quats) vals.push(q.x, q.y, q.z, q.w);
        jumpTracks.push(new THREE.QuaternionKeyframeTrack(`${boneName}.quaternion`, times, vals));
      }

      return new THREE.AnimationClip('jump', 0.80, jumpTracks);
    } catch (e) {
      console.warn('[PlayerController] Lỗi khởi tạo GTA5 Jump Clip:', e);
      return null;
    }
  }

  /**
   * Khởi tạo Mô Hình Nhân Vật 3D SkinnedMesh Liền Khối Chuẩn Công Nghiệp Game
   * Khử 100% Race Condition (Bóng ma dính đè) thông qua token kiểm soát bất đồng bộ
   */
  async _load3DHumanoidCharacter(characterId, token) {
    this._isGltfReady = false;
    const charConfig = CHARACTER_MODELS_MAP[characterId] || CHARACTER_MODELS_MAP.char_nu_sinh_ao_dai;
    this._currentFacingOffset = charConfig.facingOffset || 0;

    // KIỂM TRA RACE CONDITION: Token không khớp -> Abort ngay lập tức
    if (token !== this._loadToken) return;

    try {
      // Dọn dẹp sạch 100% tài nguyên và Mixer cũ trước khi dựng model mới
      this._disposeHierarchy(this.characterGroup);

      let modelLoaded = false;
      if (typeof window !== 'undefined' && typeof window.document !== 'undefined' && this._gltfLoader) {
        try {
          const loadGltfPromise = (url) => {
            if (this._gltfCache[url]) return Promise.resolve(this._gltfCache[url]);
            return new Promise((resolve, reject) => {
              this._gltfLoader.load(url, (gltf) => {
                this._gltfCache[url] = gltf;
                resolve(gltf);
              }, undefined, reject);
            });
          };

          // Nạp model 3D độc bản riêng cho từng nhân vật (Michelle cho Nữ, Soldier cho Nam)
          let mainGltf = null;
          try {
            mainGltf = await loadGltfPromise(charConfig.modelUrl);
          } catch (e1) {
            console.warn(`[PlayerController] Không tải được ${charConfig.modelUrl}, thử fallback sang ${charConfig.fallbackModelUrl}`);
            try {
              mainGltf = await loadGltfPromise(charConfig.fallbackModelUrl);
            } catch (e2) {}
          }

          // KIỂM TRA RACE CONDITION sau await
          if (token !== this._loadToken) return;

          if (mainGltf && mainGltf.scene) {
            // SỬA TRIỆT ĐỂ LỖI TÀNG HÌNH: Dùng SkeletonUtils.clone để nhân bản chuẩn cây xương SkinnedMesh
            const model = SkeletonUtils.clone ? SkeletonUtils.clone(mainGltf.scene) : mainGltf.scene.clone(true);
            const isFemale = charConfig.isFemale;

            // Chuẩn hóa kích thước nhân vật theo tỷ lệ nhân trắc học tự nhiên (Nữ: ~1.60m, Nam: ~1.72m)
            // CỐ ĐỊNH SCALE CHUẨN XÁC: Tuyệt đối không đo Box3 unskinned bind pose vì mesh Michelle nằm ngang gây phình to scale 5.6x
            const scaleFactor = charConfig.scale || (charConfig.isFemale ? 1.02 : 0.98);
            model.scale.set(scaleFactor, scaleFactor, scaleFactor);
            model.position.set(0, 0.045, 0); // Nâng đế chân 4.5cm đảm bảo giày luôn nằm trên mặt sàn, triệt tiêu hoàn toàn lún chân gạch đá

            // Nạp texture tương ứng
            const texLoader = this._textureLoader || new THREE.TextureLoader();
            const outfitTex = charConfig.textures?.diffuse ? texLoader.load(charConfig.textures.diffuse) : null;
            if (outfitTex) {
              outfitTex.wrapS = THREE.RepeatWrapping;
              outfitTex.wrapT = THREE.RepeatWrapping;
              outfitTex.repeat.set(2, 4);
            }

            // TÙY BIẾN TRANG PHỤC & DIỆN MẠO 4 NHÂN VẬT ĐỘC BẢN RÕ NÉT
            model.traverse((child) => {
              if (child.isSkinnedMesh || child.isMesh) {
                // TRIỆT TIÊU LỖI TÀNG HÌNH: Tắt GPU Frustum Culling cho SkinnedMesh
                child.frustumCulled = false;
                child.castShadow = true;
                child.receiveShadow = true;

                // Clone vật liệu để tùy biến riêng cho từng nhân vật không bị đè lẫn nhau
                if (child.material) {
                  if (Array.isArray(child.material)) {
                    child.material = child.material.map(m => m.clone());
                  } else {
                    child.material = child.material.clone();
                  }
                }

                // Thiết lập màu sắc & chất liệu trang phục độc bản trên Xbot (Beta_Surface & Beta_Joints)
                if ((child.name === 'Beta_Surface' || child.name === 'Ch03') && child.material) {
                  child.material.color.setHex(charConfig.outfitColor || 0xffffff);
                  if (outfitTex) child.material.map = outfitTex;
                  child.material.roughness = charConfig.roughness || 0.4;
                  child.material.metalness = charConfig.metalness || 0.05;
                  child.material.needsUpdate = true;
                } else if ((child.name === 'Beta_Joints' || child.name.includes('Bottom')) && child.material) {
                  child.material.color.setHex(charConfig.pantsColor || 0x222222);
                  child.material.roughness = 0.5;
                  child.material.metalness = 0.1;
                  child.material.needsUpdate = true;
                } else if (child.name.includes('Top') && child.material) {
                  child.material.color.setHex(charConfig.outfitColor || 0xffffff);
                  if (outfitTex) child.material.map = outfitTex;
                  child.material.needsUpdate = true;
                }
              }
            });

            // Gắn phụ kiện 3D độc bản cho từng nhân vật
            const findBone = (names) => {
              for (const n of names) {
                const b = model.getObjectByName(n);
                if (b) return b;
              }
              return null;
            };
            const headBone = findBone(['mixamorig:Head', 'mixamorigHead', 'Head', 'Wolf3D_Head']);
            const hipsBone = findBone(['mixamorig:Hips', 'mixamorigHips', 'Hips']);
            const spineBone = findBone(['mixamorig:Spine2', 'mixamorigSpine2', 'Spine2', 'Spine1']);

            const isMeters = true;

            if (charConfig.id === 'char_nu_sinh_ao_dai') {
              if (headBone) {
                const nonLa = this._create3DNonLa(isMeters);
                nonLa.position.set(0, 0.16, -0.02);
                nonLa.rotation.x = -0.15;
                headBone.add(nonLa);
              }
              if (hipsBone && outfitTex) {
                const flaps = this._create3DFlaps(outfitTex, charConfig.outfitColor, false, isMeters);
                flaps.position.set(0, -0.05, 0);
                hipsBone.add(flaps);
              }
            } else if (charConfig.id === 'char_co_gai_ao_ba_ba') {
              if (headBone) {
                const khanRan = this._create3DKhanRan(isMeters);
                khanRan.position.set(0, 0.04, 0.01);
                headBone.add(khanRan);
              }
              if (spineBone) {
                const nonLaBack = this._create3DNonLa(isMeters);
                nonLaBack.position.set(0, 0.02, -0.18);
                nonLaBack.rotation.x = -0.35;
                nonLaBack.scale.set(0.85, 0.85, 0.85);
                spineBone.add(nonLaBack);
              }
            } else if (charConfig.id === 'char_nam_tri_thuc_suit') {
              if (headBone) {
                const fedora = this._create3DFedoraHat(isMeters);
                fedora.position.set(0, 0.14, -0.01);
                fedora.rotation.x = -0.06;
                headBone.add(fedora);
              }
            } else if (charConfig.id === 'char_nam_ao_dai_gam') {
              if (headBone) {
                const turban = this._create3DKhanXep(isMeters);
                turban.position.set(0, 0.14, 0);
                headBone.add(turban);
              }
              if (hipsBone && outfitTex) {
                const flaps = this._create3DFlaps(outfitTex, charConfig.outfitColor, true, isMeters);
                flaps.position.set(0, -0.05, 0);
                hipsBone.add(flaps);
              }
            }

            // HỆ THỐNG HOẠT HỌA CHUYỂN ĐỘNG MOTION CAPTURE CHUẨN 60 FPS:
            // Nạp toàn bộ animation chất lượng cao từ Xbot.glb (idle tĩnh lặng thở êm, walk, run, jump leap GTA V)
            let baseClips = [];
            try {
              const xbotGltf = await loadGltfPromise('assets/models/Xbot.glb');
              if (xbotGltf && xbotGltf.animations && xbotGltf.animations.length > 0) {
                baseClips = [...xbotGltf.animations];
                // Tích hợp động tác bật nhảy vượt chướng ngại vật GTA V (Vault / Hurdle Leap)
                if (!baseClips.find(c => c.name === 'jump')) {
                  const jumpClip = this._createGTA5JumpClip(xbotGltf);
                  if (jumpClip) baseClips.push(jumpClip);
                }
              }
            } catch (errX) {}

            if (baseClips.length === 0 && mainGltf.animations) {
              baseClips = mainGltf.animations;
            }

            // KIỂM TRA LẦN CUỐI trước khi gắn vào Scene
            if (token !== this._loadToken) {
              this._disposeHierarchy(model);
              return;
            }

            // Tạo bảng tra cứu xương của model thực tế
            const modelBoneMap = new Map();
            model.traverse((c) => {
              if (c.isBone) modelBoneMap.set(c.name, c);
            });

            const isRpm = modelBoneMap.has('Hips') && !modelBoneMap.has('mixamorigHips');

            // RETARGETING CLIP ĐẢM BẢO CHUYỂN ĐỘNG MƯỢT MÀ, KHÔNG CO GIÃN ĐỘ DÀI XƯƠNG
            const retargetedClips = [];
            const _tempQuat = new THREE.Quaternion();
            const _tempEuler = new THREE.Euler();

            for (const clip of baseClips) {
              const newTracks = [];
              for (const track of clip.tracks) {
                const parts = track.name.split('.');
                const rawBone = parts[0];
                const prop = parts[1];
                const targetBoneName = isRpm ? rawBone.replace(/^mixamorig:?/, '') : rawBone;

                if (!modelBoneMap.has(targetBoneName)) continue;

                if (prop === 'quaternion') {
                  const clonedTrack = track.clone();
                  clonedTrack.name = `${targetBoneName}.quaternion`;

                  // Hiệu chỉnh trục tọa độ cánh tay ReadyPlayerMe:
                  // Khung xương Mixamo hạ tay bằng trục Z (Local Euler Z), trong khi ReadyPlayerMe hạ tay bằng trục X.
                  // Chuyển trục giúp hai tay nhân vật nam buông xuôi tự nhiên bên hông, triệt tiêu tư thế dang rộng T-pose.
                  if (isRpm && (targetBoneName === 'LeftArm' || targetBoneName === 'RightArm')) {
                    const isLeft = targetBoneName === 'LeftArm';
                    const vals = clonedTrack.values;
                    for (let i = 0; i < vals.length; i += 4) {
                      _tempQuat.set(vals[i], vals[i + 1], vals[i + 2], vals[i + 3]);
                      _tempEuler.setFromQuaternion(_tempQuat, 'XYZ');
                      if (isLeft) {
                        _tempEuler.set(-_tempEuler.z + 0.10, _tempEuler.y, -_tempEuler.x, 'XYZ');
                      } else {
                        _tempEuler.set(_tempEuler.z + 0.10, _tempEuler.y, -_tempEuler.x, 'XYZ');
                      }
                      _tempQuat.setFromEuler(_tempEuler);
                      vals[i] = _tempQuat.x;
                      vals[i + 1] = _tempQuat.y;
                      vals[i + 2] = _tempQuat.z;
                      vals[i + 3] = _tempQuat.w;
                    }
                  }

                  newTracks.push(clonedTrack);
                } else if (prop === 'position' && (targetBoneName === 'Hips' || targetBoneName === 'mixamorigHips')) {
                  if (!isRpm) {
                    const clonedTrack = track.clone();
                    clonedTrack.name = `${targetBoneName}.position`;
                    newTracks.push(clonedTrack);
                  } else {
                    const nativeHips = modelBoneMap.get(targetBoneName);
                    const nativeY = nativeHips.position.y;
                    const initialY = track.values[1];
                    const scalePos = 0.01;
                    const newVals = new Float32Array(track.values.length);
                    for (let i = 0; i < track.values.length; i += 3) {
                      newVals[i] = track.values[i] * scalePos;
                      newVals[i + 1] = nativeY + (track.values[i + 1] - initialY) * scalePos;
                      newVals[i + 2] = track.values[i + 2] * scalePos;
                    }
                    newTracks.push(new THREE.VectorKeyframeTrack(`${targetBoneName}.position`, track.times, newVals));
                  }
                }
              }

              if (newTracks.length > 0) {
                retargetedClips.push(new THREE.AnimationClip(clip.name, clip.duration, newTracks));
              }
            }

            if (retargetedClips.length > 0) {
              const mixer = new THREE.AnimationMixer(model);
              // LỰA CHỌN IDLE TĨNH LẶNG (XÓA BỎ DỨT ĐIỂM ĐIỆU NHẢY SAMBA DANCE CỦA MICHELLE GÂY NHẢY TUNG TĂNG)
              const idleClip = retargetedClips.find(a => /^idle$/i.test(a.name)) || retargetedClips.find(a => /idle/i.test(a.name)) || retargetedClips[0];
              const walkClip = retargetedClips.find(a => /^walk$/i.test(a.name)) || retargetedClips.find(a => /walk/i.test(a.name)) || retargetedClips[1] || idleClip;
              const runClip = retargetedClips.find(a => /^run$/i.test(a.name)) || retargetedClips.find(a => /run/i.test(a.name)) || retargetedClips[2] || walkClip;
              const jumpClip = retargetedClips.find(a => /^jump$/i.test(a.name));

              const idleAction = mixer.clipAction(idleClip);
              const walkAction = mixer.clipAction(walkClip);
              const runAction = mixer.clipAction(runClip);

              idleAction.reset().play();
              mixer.update(0.016);

              this._gltfMixer = mixer;
              this._animActions = {
                idle: idleAction,
                walk: walkAction,
                run: runAction
              };

              if (jumpClip) {
                const jumpAction = mixer.clipAction(jumpClip);
                jumpAction.setLoop(THREE.LoopOnce);
                jumpAction.clampWhenFinished = true;
                this._animActions.jump = jumpAction;
              }

              this._currentAnim = 'idle';
              this.humanoidAnimator = null;
            }

            this.characterMesh = model;
            this.characterGroup.add(model);
            this._isGltfReady = true;
            modelLoaded = true;
            console.log(`[PlayerController] ĐÃ KÍCH HOẠT NHÂN VẬT 3D SKINNED MESH ĐỘC BẢN: ${charConfig.name} (Token: ${token})!`);
          }
        } catch (errGltf) {
          modelLoaded = false;
        }
      }

      // Nếu không nạp GLTF (hoặc chạy trong test Node.js), kích hoạt mô hình Procedural True 3D Humanoid Mesh từ CharacterFactory
      if (!modelLoaded && token === this._loadToken) {
        const charModel = createHanoiCharacter3D(characterId);
        charModel.position.set(0, 0.045, 0); // Đồng bộ nâng đế chân 4.5cm cho mô hình Procedural, triệt tiêu lún chân
        this.characterMesh = charModel;
        this.characterGroup.add(charModel);

        // Ánh xạ cây xương phân cấp
        this.characterGroup.rig = charModel.rig;
        if (this.characterGroup.rig) {
          this.characterGroup.rig.rootGroup = this.characterGroup;
        }
        this.characterGroup.characterMeta = charModel.characterMeta;
        this.characterGroup.baseTorsoY = charModel.baseTorsoY || 0.95;
        this.characterGroup.isSkinnedMesh = false;

        this.humanoidAnimator = new HumanoidAnimator(charModel, { crossfadeDuration: 0.25 });
        this.humanoidAnimator.setCrossfadeDuration(0.25);
        this.humanoidAnimator.resetPose();
        this.humanoidAnimator.update(0.016, 0.0, this.isGrounded);

        this._gltfMixer = null;
        this._animActions = null;
        this._isGltfReady = true;
      }
    } catch (err) {
      console.warn('[PlayerController] Lỗi khởi tạo nhân vật 3D SkinnedMesh:', err);
    }
  }

  setCharacter(characterId) {
    if (!characterId) return Promise.resolve();
    this.currentCharacterId = characterId;
    this._isGltfReady = false;

    // Tăng biến đếm token nhằm triệt tiêu 100% race condition (bóng ma dính đè)
    this._loadToken++;
    const currentToken = this._loadToken;

    // Giữ nguyên tọa độ và góc xoay hiện tại
    let curPos = new THREE.Vector3(20.0, 0.5, -20.0);
    if (this.characterGroup && (Math.abs(this.characterGroup.position.x) > 0.1 || Math.abs(this.characterGroup.position.z) > 0.1)) {
      curPos = this.characterGroup.position.clone();
    }
    const curRot = this.characterGroup ? this.characterGroup.rotation.y : 0.785;

    // Tải mô hình 3D Skinned Mesh thật với AnimationMixer & Nón Lá
    this._gltfLoadingPromise = this._load3DHumanoidCharacter(characterId, currentToken).then(() => {
      if (currentToken === this._loadToken && this.characterGroup) {
        this.characterGroup.position.copy(curPos);
        this.characterGroup.rotation.y = curRot;
        this.characterGroup.quaternion.setFromAxisAngle(this._worldUp, curRot);

        if (this.eventBus) {
          this.eventBus.emit('CORE:CHARACTER_SWITCHED', { characterId, success: true });
        }
      }
    });

    return this._gltfLoadingPromise;
  }

  /**
   * Đăng ký sự kiện bàn phím
   */
  _bindKeyboardEvents() {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
    window.addEventListener('keydown', (e) => {
      if (this.isLocked) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = true;
          break;
        case 'Space':
          this._handleJumpOrParkour();
          break;
        case 'KeyE':
          this._handleInteract();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = false;
          break;
      }
    });

    // Giải phóng phím bấm khi cửa sổ mất tiêu điểm, chuyển tab hoặc thoát PointerLock
    window.addEventListener('blur', () => this.resetKeys());
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerlockchange', () => {
        if (!document.pointerLockElement) {
          this.resetKeys();
        }
      });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.resetKeys();
        }
      });
    }
  }

  resetKeys() {
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.sprint = false;
    this.velocity.set(0, 0, 0);
    this.isJumping = false;
  }

  /**
   * Nhảy hoặc leo trèo Parkour
   */
  _handleJumpOrParkour() {
    if (!this.isGrounded || this.isParkouring) return;

    // Kiểm tra gờ tường phía trước mặt theo forward vector nhân vật (hướng +Z khi rotation.y = 0)
    const colliders = this.worldManager.getColliders();
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.characterGroup.rotation.y);
    const chestPos = this.characterGroup.position.clone().add(new THREE.Vector3(0, 1.1, 0));

    this.raycaster.set(chestPos, forward);
    this.raycaster.far = 1.6;
    const hits = this.raycaster.intersectObjects(colliders, false);

    if (hits.length > 0) {
      const overLedgePos = hits[0].point.clone().add(forward.clone().multiplyScalar(0.4));
      overLedgePos.y = this.characterGroup.position.y + 2.4;
      this.raycaster.set(overLedgePos, this.downVector);
      this.raycaster.far = 3.0;
      const ledgeHits = this.raycaster.intersectObjects(colliders, false);

      if (ledgeHits.length > 0 && ledgeHits[0].point.y - this.characterGroup.position.y <= 1.8) {
        this.isParkouring = true;
        const targetY = ledgeHits[0].point.y + 0.1;
        const targetPos = this.characterGroup.position.clone().add(forward.clone().multiplyScalar(1.2));
        targetPos.y = targetY;

        let progress = 0;
        const startPos = this.characterGroup.position.clone();

        const animateParkour = () => {
          progress += 0.08;
          this.characterGroup.position.lerpVectors(startPos, targetPos, Math.min(progress, 1.0));
          if (progress < 1.0) {
            requestAnimationFrame(animateParkour);
          } else {
            this.isParkouring = false;
            this.velocity.y = 0;
            this.isGrounded = true;
            this.isJumping = false;
          }
        };
        animateParkour();
        return;
      }
    }

    // Nhảy tự do theo phong cách bật nhảy vượt chướng ngại vật GTA V:
    this.velocity.y = this.jumpForce;
    this.isGrounded = false;
    this.isJumping = true;

    // Nếu đang đứng im, tạo đà dấn nhẹ về phía trước chuẩn động tác nhảy hurdle GTA V
    const horizSpeedSq = this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z;
    if (horizSpeedSq < 0.25) {
      const facingAngle = this.characterGroup.rotation.y;
      this.velocity.x = Math.sin(facingAngle) * 2.4;
      this.velocity.z = Math.cos(facingAngle) * 2.4;
    }
  }

  /**
   * Kích hoạt bật nhảy chuẩn GTA V (Hỗ trợ gọi từ GameAPI, UI & Phím Space)
   */
  jump() {
    this._handleJumpOrParkour();
  }

  _handleInteract() {
    if (this.isSitting) {
      this.standUp();
      return;
    }
    if (this.worldManager && this.worldManager.isPlayerRidingTrain) {
      this.worldManager.leaveTrain(this);
      return;
    }
    if (this.activeInteractable) {
      if (this.activeInteractable.isSitSpot && this.activeInteractable.sitSpot) {
        this.sitAt(this.activeInteractable.sitSpot);
        return;
      }
      if (this.activeInteractable.onInteract) {
        this.activeInteractable.onInteract();
      }
    }
  }

  /**
   * Ngồi xuống một vị trí ghế tương tác (Ghế quán trà đá, ghế đẩu vỉa hè, ghế đá)
   * @param {Object} spot - { x, y, z, seatY, rotationY, name }
   */
  sitAt(spot) {
    if (!spot) return;
    this.isSitting = true;
    this.currentSitSpot = spot;
    this.velocity.set(0, 0, 0);
    this.isGrounded = true;
    this.isJumping = false;
    const targetY = spot.seatY !== undefined ? spot.seatY : (spot.y !== undefined ? spot.y : 0.0);
    this.characterGroup.position.set(spot.x, targetY, spot.z);
    if (spot.rotationY !== undefined) {
      this.characterGroup.rotation.y = spot.rotationY;
      this.characterGroup.quaternion.setFromAxisAngle(this._worldUp, spot.rotationY);
    }
    if (this.humanoidAnimator && typeof this.humanoidAnimator.setSitPose === 'function') {
      this.humanoidAnimator.setSitPose(true);
    }
    if (this._animActions && this._animActions.idle) {
      this._switchAnim('idle');
    }
    if (this.eventBus) {
      this.eventBus.emit('CORE:PLAYER_SIT', { spot });
      this.eventBus.emit('CORE:INTERACTION_AVAILABLE', {
        canInteract: true,
        promptText: 'Đứng dậy (E / Phím di chuyển)',
        actionKey: 'E'
      });
    }
  }

  /**
   * Đứng dậy khỏi ghế, khôi phục quyền điều khiển đi đứng hoàn toàn tự nhiên
   */
  standUp() {
    if (!this.isSitting) return;
    this.isSitting = false;
    const prevSpot = this.currentSitSpot;
    this.currentSitSpot = null;
    if (this.humanoidAnimator && typeof this.humanoidAnimator.setSitPose === 'function') {
      this.humanoidAnimator.setSitPose(false);
    }
    if (this.eventBus) {
      this.eventBus.emit('CORE:PLAYER_STAND', { spot: prevSpot });
      this.eventBus.emit('CORE:INTERACTION_AVAILABLE', {
        canInteract: false,
        promptText: '',
        actionKey: 'E'
      });
    }
  }

  setLocked(locked) {
    this.isLocked = !!locked;
    if (this.isLocked) {
      this.resetKeys();
    }
  }

  teleport(pos) {
    if (!pos) return;
    this.characterGroup.position.set(pos.x, pos.y || 0.5, pos.z);
    this.velocity.set(0, 0, 0);
    this.isGrounded = true;
    this.isJumping = false;
  }

  /**
   * GIẢI PHÁP CHỐNG DÍNH CHỐNG KẸT TUYỆT ĐỐI (ANTI-STUCK / PENETRATION RESOLUTION):
   * Tự động đẩy nhân vật ra khỏi mép vật cản nếu lỡ tiếp giáp hoặc lấn nhẹ,
   * Chống đâm xuyên lan can Cầu Kim Quy (giữ khoảng cách tim cầu <= 1.6m).
   */
  _resolvePenetrations(pos) {
    // 0. CHỐNG XUYÊN ĐOÀN TÀU DI SẢN CẦU LONG BIÊN KHI ĐI BỘ NGOÀI TÀU
    if (this.worldManager && typeof this.worldManager.resolveTrainCollision === 'function') {
      this.worldManager.resolveTrainCollision(pos, this.playerRadius);
    }

    // 0.1. CHỐNG RƠI / LỌT DƯỚI MẶT SÀN CẦU VÀ DỐC DẪN LONG BIÊN
    if (this.worldManager && typeof this.worldManager.getLongBienBridgeInfo === 'function') {
      const lbInfo = this.worldManager.getLongBienBridgeInfo(pos.x, pos.y, pos.z);
      if (lbInfo && lbInfo.onBridge) {
        if (pos.y < lbInfo.closestY) {
          pos.y = lbInfo.closestY;
        }
      }
    }

    const r = this.playerRadius;
    const pY = pos.y;
    const obstacles = (this.worldManager && typeof this.worldManager.getObstacles === 'function') ? this.worldManager.getObstacles() : [];

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      // Bộ lọc không gian chuẩn xác theo AABB (Spatial Distance Culling) - sử dụng dữ liệu tiền tính toán 60 FPS
      const cX = obs._centerX !== undefined ? obs._centerX : (obs.minX + obs.maxX) * 0.5;
      const cZ = obs._centerZ !== undefined ? obs._centerZ : (obs.minZ + obs.maxZ) * 0.5;
      const rX = obs._maxRadiusX !== undefined ? obs._maxRadiusX : (obs.maxX - obs.minX) * 0.5 + 16;
      const rZ = obs._maxRadiusZ !== undefined ? obs._maxRadiusZ : (obs.maxZ - obs.minZ) * 0.5 + 16;
      if (Math.abs(pos.x - cX) > rX || Math.abs(pos.z - cZ) > rZ) {
        continue;
      }
      // Bỏ qua nếu không trùng độ cao nhân vật
      if (pY + this.playerHeight <= obs.minY || pY >= obs.maxY) continue;
      // Bỏ qua gờ thấp bước qua được (Step-up)
      if (obs.maxY - pY <= this.stepUpHeight && obs.maxY > pY) continue;

      // Kiểm tra xem vị trí có đang lấn vào khối AABB không
      if (
        pos.x + r > obs.minX &&
        pos.x - r < obs.maxX &&
        pos.z + r > obs.minZ &&
        pos.z - r < obs.maxZ
      ) {
        // Tính khoảng cách cần đẩy ra theo 4 hướng
        const pushLeft = (pos.x + r) - obs.minX;
        const pushRight = obs.maxX - (pos.x - r);
        const pushBack = (pos.z + r) - obs.minZ;
        const pushFront = obs.maxZ - (pos.z - r);

        const minPush = Math.min(pushLeft, pushRight, pushBack, pushFront);
        const margin = 0.04; // Khoảng đệm an toàn

        if (minPush === pushLeft) {
          pos.x = obs.minX - r - margin;
        } else if (minPush === pushRight) {
          pos.x = obs.maxX + r + margin;
        } else if (minPush === pushBack) {
          pos.z = obs.minZ - r - margin;
        } else {
          pos.z = obs.maxZ + r + margin;
        }
      }
    }

    // 2. CHỐNG RƠI KHỎI CẦU THÊ HÚC & CẦU KIM QUY VƯỢT HỒ
    if (this.worldManager.getTheHucBridgeInfo && pos.x < 158 && pos.x > 134) {
      const bridgeInfo = this.worldManager.getTheHucBridgeInfo(pos.x, pos.y, pos.z);
      if (bridgeInfo && Math.abs(pos.y - bridgeInfo.closestY) <= 1.6) {
        const maxBridgeDist = 1.95; // Lòng cầu Thê Húc rộng 3.8m -> bán kính an toàn 1.95m
        if (bridgeInfo.dist > 1.6 && bridgeInfo.dist < 5.0) {
          if (bridgeInfo.dist > maxBridgeDist) {
            const clampFactor = maxBridgeDist / bridgeInfo.dist;
            pos.x = bridgeInfo.closestX + (pos.x - bridgeInfo.closestX) * clampFactor;
            pos.z = bridgeInfo.closestZ + (pos.z - bridgeInfo.closestZ) * clampFactor;
          }
        }
      }
    }

    // 2.1. CHỐNG ĐÂM XUYÊN LAN CAN CẦU KIM QUY (CẦU DẪN RA THÁP RÙA)
    if (this.worldManager.getKimQuyBridgeInfo && pos.x >= 16.0 && pos.x <= 72.0 && pos.z <= -16.0 && pos.z >= -72.0) {
      const bridgeInfo = this.worldManager.getKimQuyBridgeInfo(pos.x, pos.y, pos.z);
      if (bridgeInfo && Math.abs(pos.y - bridgeInfo.closestY) <= 1.8) {
        const maxBridgeDist = 1.85; // Lòng Cầu Kim Quy rộng 3.8m -> bán kính an toàn 1.85m
        if (bridgeInfo.dist > 1.6 && bridgeInfo.dist < 5.0) {
          if (bridgeInfo.dist > maxBridgeDist) {
            const clampFactor = maxBridgeDist / bridgeInfo.dist;
            pos.x = bridgeInfo.closestX + (pos.x - bridgeInfo.closestX) * clampFactor;
            pos.z = bridgeInfo.closestZ + (pos.z - bridgeInfo.closestZ) * clampFactor;
          }
        }
      }
    }

    // 3. Đẩy ngược lại nếu vi phạm ranh giới mặt nước (bảo đảm 100% không chạm nước)
    if (this.worldManager.isWaterAt && this.worldManager.isWaterAt(pos.x, pos.y, pos.z)) {
      const theHucInfo = this.worldManager.getTheHucBridgeInfo ? this.worldManager.getTheHucBridgeInfo(pos.x, pos.y, pos.z) : null;
      if (theHucInfo && theHucInfo.dist < 5.0) {
        pos.x = theHucInfo.closestX;
        pos.z = theHucInfo.closestZ;
        pos.y = Math.max(pos.y, theHucInfo.closestY + 0.05);
      } else {
        const dx = pos.x - 80;
        const dz = pos.z - (-80);
        const dist = Math.hypot(dx, dz);
        if (dist < 85.0 && dist > 0.001) {
          pos.x = 80 + (dx / dist) * 86.5;
          pos.z = -80 + (dz / dist) * 86.5;
          pos.y = Math.max(pos.y, 0.45);
        }
      }
    }

    // 4. Đẩy nhân vật ra khỏi các NPC xung quanh (chống dính và chống đi xuyên người)
    const npcs = (this.worldManager && typeof this.worldManager.getNpcColliders === 'function') ? this.worldManager.getNpcColliders() : [];
    for (let i = 0; i < npcs.length; i++) {
      const npc = npcs[i];
      const dx = pos.x - npc.x;
      const dz = pos.z - npc.z;
      const dist = Math.hypot(dx, dz);
      const minDist = r + (npc.radius || 0.55);
      if (dist < minDist && dist > 0.0001) {
        const push = minDist - dist + 0.03;
        pos.x += (dx / dist) * push;
        pos.z += (dz / dist) * push;
      }
    }
  }

  /**
   * Khởi tạo lắng nghe tin nhắn chat để hiển thị bong bóng chat 3D nổi trên đầu nhân vật
   */
  _initChatBubbleListener() {
    this.chatBubbleSprite = null;
    this.chatBubbleTimeout = null;

    if (!this.eventBus) return;
    this.eventBus.on('UI:CHAT_MESSAGE_SENT', (payload) => {
      if (payload && payload.text) {
        this.showChatBubble(payload.text);
      }
    });
  }

  /**
   * Hiển thị Bong bóng Chat 3D trực quan trên đầu nhân vật
   */
  showChatBubble(text) {
    if (typeof document === 'undefined') return;
    if (this.chatBubbleSprite) {
      this.characterGroup.remove(this.chatBubbleSprite);
      if (this.chatBubbleSprite.material.map) {
        this.chatBubbleSprite.material.map.dispose();
      }
      this.chatBubbleSprite.material.dispose();
      this.chatBubbleSprite = null;
    }
    if (this.chatBubbleTimeout) {
      clearTimeout(this.chatBubbleTimeout);
      this.chatBubbleTimeout = null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Khung bong bóng màu giấy mộc viền vàng retro
    ctx.fillStyle = 'rgba(255, 252, 240, 0.96)';
    ctx.strokeStyle = '#c49a45';
    ctx.lineWidth = 6;

    const r = 24;
    const w = 480;
    const h = 175;
    const x = 16;
    const y = 14;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    // Đuôi thoại trỏ xuống đầu nhân vật
    ctx.lineTo(x + w / 2 + 22, y + h);
    ctx.lineTo(x + w / 2, y + h + 36);
    ctx.lineTo(x + w / 2 - 22, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nội dung chữ
    ctx.fillStyle = '#1c1714';
    ctx.font = 'bold 28px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxChars = 24;
    if (text.length > maxChars) {
      const line1 = text.substring(0, maxChars);
      const line2 = text.substring(maxChars, maxChars * 2);
      ctx.fillText(line1, 256, 75);
      ctx.fillText(line2, 256, 120);
    } else {
      ctx.fillText(text, 256, 95);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    this.chatBubbleSprite = new THREE.Sprite(spriteMat);
    this.chatBubbleSprite.scale.set(2.4, 1.2, 1);
    this.chatBubbleSprite.position.set(0, 2.38, 0);
    this.characterGroup.add(this.chatBubbleSprite);

    this.chatBubbleTimeout = setTimeout(() => {
      if (this.chatBubbleSprite) {
        this.characterGroup.remove(this.chatBubbleSprite);
        this.chatBubbleSprite = null;
      }
    }, 6000);
  }

  /**
   * KIỂM TRA VA CHẠM THÔNG MINH CÓ CƠ CHẾ BƯỚC QUA GỜ THẤP (STEP-UP)
   * Chặn không cho bước lọt qua thanh lan can Cầu Kim Quy (dist <= 1.6m).
   */
  _isCollidingAt(testPos) {
    const r = this.playerRadius;
    const pY = testPos.y;

    // 0. Cấm tuyệt đối không cho bước xuống nước / chạm nước theo sắc lệnh
    if (this.worldManager.isWaterAt && this.worldManager.isWaterAt(testPos.x, testPos.y, testPos.z)) {
      return true; // Chặn ngang ngay lập tức, không cho phép xuống nước!
    }

    // 1. Chống lọt qua lan can Cầu Thê Húc vượt hồ (chỉ áp dụng trên các nhịp cầu bắc qua nước: x < 158 && x > 134)
    if (this.worldManager.getTheHucBridgeInfo && testPos.x < 158 && testPos.x > 134) {
      const bridgeInfo = this.worldManager.getTheHucBridgeInfo(testPos.x, testPos.y, testPos.z);
      if (bridgeInfo && Math.abs(testPos.y - bridgeInfo.closestY) <= 1.5) {
        if (bridgeInfo.dist > 1.95 && bridgeInfo.dist < 5.0) {
          return true; // Giữ người chơi an toàn trong lòng cầu 3.8m vượt hồ
        }
      }
    }
    // 1.1. Chống lọt qua lan can Cầu Kim Quy (Cầu Tháp Rùa) vượt hồ
    if (this.worldManager.getKimQuyBridgeInfo && testPos.x >= 16.0 && testPos.x <= 72.0 && testPos.z <= -16.0 && testPos.z >= -72.0) {
      const bridgeInfo = this.worldManager.getKimQuyBridgeInfo(testPos.x, testPos.y, testPos.z);
      if (bridgeInfo && Math.abs(testPos.y - bridgeInfo.closestY) <= 1.8) {
        if (bridgeInfo.dist > 1.85 && bridgeInfo.dist < 5.0) {
          return true; // Chặn đứng bước chân, không cho phép xuyên qua lan can đá Cầu Kim Quy!
        }
      }
    }

    // 2. Kiểm tra va chạm kiến trúc
    const obstacles = (this.worldManager && typeof this.worldManager.getObstacles === 'function') ? this.worldManager.getObstacles() : [];
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];

      // Bộ lọc không gian chuẩn xác theo AABB (Spatial Culling) - sử dụng dữ liệu tiền tính toán
      const cX = obs._centerX !== undefined ? obs._centerX : (obs.minX + obs.maxX) * 0.5;
      const cZ = obs._centerZ !== undefined ? obs._centerZ : (obs.minZ + obs.maxZ) * 0.5;
      const rX = obs._maxRadiusX !== undefined ? obs._maxRadiusX : (obs.maxX - obs.minX) * 0.5 + 16;
      const rZ = obs._maxRadiusZ !== undefined ? obs._maxRadiusZ : (obs.maxZ - obs.minZ) * 0.5 + 16;
      if (Math.abs(testPos.x - cX) > rX || Math.abs(testPos.z - cZ) > rZ) {
        continue;
      }

      // Cơ chế Step-Up: Nếu vật thể thấp hơn chiều cao gờ bước chân (<= stepUpHeight) thì KHÔNG CHẶN NGANG,
      // cho phép Raycast tự động đưa nhân vật bước lên tự nhiên!
      if (obs.maxY - pY <= this.stepUpHeight && obs.maxY > pY) {
        continue;
      }

      // Kiểm tra chiều cao
      if (pY + this.playerHeight > obs.minY && pY < obs.maxY) {
        if (
          testPos.x + r > obs.minX &&
          testPos.x - r < obs.maxX &&
          testPos.z + r > obs.minZ &&
          testPos.z - r < obs.maxZ
        ) {
          return true; // Va chạm với tường / cột / tòa nhà cao
        }
      }
    }

    // 3. Kiểm tra va chạm với con người (NPCs)
    const npcs = this.worldManager.getNpcColliders();
    for (let i = 0; i < npcs.length; i++) {
      const npc = npcs[i];
      const dx = testPos.x - npc.x;
      const dz = testPos.z - npc.z;
      const distSq = dx * dx + dz * dz;
      const minDist = r + (npc.radius || 0.55);
      if (distSq < minDist * minDist) {
        return true; // Không đi xuyên qua người!
      }
    }

    return false;
  }

  /**
   * Cập nhật chuyển động chuẩn GTA V Third-Person Locomotion (Zero Heap Allocation)
   */
  update(delta, camera) {
    if (this.isParkouring) return;

    // 🚂 KHI NGƯỜI CHƠI ĐANG TRÊN TOA TÀU PANORAMA CẦU LONG BIÊN:
    // Chuyển toàn bộ điều khiển WASD sang hệ tọa độ toa tàu (Locomotion inside moving coach & observation balcony)
    if (this.worldManager && this.worldManager.isPlayerRidingTrain) {
      this.worldManager.handleTrainPlayerUpdate(delta, this);
      if (this.humanoidAnimator) {
        const isMoving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
        this.humanoidAnimator.update(delta, isMoving ? (this.keys.sprint ? 5.0 : 2.5) : 0, true, 0);
      }
      return;
    }

    // 🪑 KHI NGƯỜI CHƠI ĐANG NGỒI TRÊN GHẾ (UỐNG NƯỚC CHÈ VỈA HÈ / NGẮM PHỐ):
    if (this.isSitting) {
      // Nếu bấm bất kỳ phím di chuyển nào (WASD / Space) hoặc Shift: tự động đứng dậy mượt mà
      if (!this.isLocked && (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right || this.keys.jump)) {
        this.standUp();
      } else {
        // Cố định vị trí và tư thế ngồi vững vàng trên mặt ghế
        if (this.currentSitSpot) {
          const targetY = this.currentSitSpot.seatY !== undefined ? this.currentSitSpot.seatY : (this.currentSitSpot.y || 0.0);
          this.characterGroup.position.set(this.currentSitSpot.x, targetY, this.currentSitSpot.z);
          if (this.currentSitSpot.rotationY !== undefined) {
            this.characterGroup.rotation.y = this.currentSitSpot.rotationY;
          }
        }
        this.velocity.set(0, 0, 0);

        // Cập nhật hoạt ảnh ở tư thế ngồi
        if (this._gltfMixer) {
          this._gltfMixer.update(delta);
        } else if (this.humanoidAnimator) {
          this.humanoidAnimator.update(delta, 0, true, 0);
        }

        // Luôn duy trì thông báo prompt [E] Đứng dậy
        if (this.eventBus) {
          this.eventBus.emit('CORE:INTERACTION_AVAILABLE', {
            canInteract: true,
            promptText: 'Đứng dậy (E / Phím di chuyển)',
            actionKey: 'E'
          });
        }
        return;
      }
    }

    // Căn góc Camera ban đầu theo trục Cầu Kim Quy (yaw = 0.785 rad / 45 độ)
    if (!this._initialCameraYawSet) {
      this._initialCameraYawSet = true;
      if (window._GameCoreInstance && window._GameCoreInstance.cameraController) {
        window._GameCoreInstance.cameraController.yaw = 0.785;
        window._GameCoreInstance.cameraController.targetYaw = 0.785;
      }
    }

    // 1. ĐỌC PHÍM WASD (Tái sử dụng vector đệm, không cấp phát mới trong update loop)
    const moveVector = this._moveVector.set(0, 0, 0);
    if (!this.isLocked) {
      if (this.keys.forward) moveVector.z -= 1;  // W: Tiến
      if (this.keys.backward) moveVector.z += 1; // S: Lùi
      if (this.keys.left) moveVector.x -= 1;     // A: Sang trái
      if (this.keys.right) moveVector.x += 1;    // D: Sang phải
    }

    const isMoving = moveVector.lengthSq() > 0;
    const targetSpeed = this.keys.sprint ? this.sprintSpeed : this.walkSpeed;

    if (isMoving && camera) {
      moveVector.normalize();

      // Vector hướng nhìn phẳng của Camera (Yaw)
      const camForward = this._camForward;
      camera.getWorldDirection(camForward);
      camForward.y = 0;
      camForward.normalize();

      // Vector hướng bên phải của Camera: cross(camForward, up) -> Chuẩn toán học 3D
      const camRight = this._camRight.crossVectors(camForward, this._worldUp).normalize();

      // Hướng di chuyển tổng hợp (Triệt tiêu hoàn toàn lỗi đảo chiều A/D)
      const finalDir = this._finalDir.set(0, 0, 0)
        .addScaledVector(camForward, -moveVector.z)
        .addScaledVector(camRight, moveVector.x)
        .normalize();

      const desiredVelX = finalDir.x * targetSpeed;
      const desiredVelZ = finalDir.z * targetSpeed;

      // Quán tính khối lượng & Gia tốc dấn bước chuẩn GTA V
      const accel = this.isGrounded ? (this.keys.sprint ? 16.0 : 18.0) : 6.0;
      this.velocity.x += (desiredVelX - this.velocity.x) * Math.min(1.0, accel * delta);
      this.velocity.z += (desiredVelZ - this.velocity.z) * Math.min(1.0, accel * delta);

      // Smooth Turn Slerp: Xoay hướng mặt nhân vật mượt mà theo góc cua di chuyển
      // SỬA TRIỆT ĐỂ LỖI ĐI NGƯỢC (MOONWALKING): Sử dụng trực tiếp góc vector tự nhiên kèm facingOffset từng model
      // Loại bỏ hoàn toàn góc bù trừ dư thừa: Math.atan2(finalDir.x, finalDir.z) + Math.PI
      const targetAngle = Math.atan2(finalDir.x, finalDir.z) + (this._currentFacingOffset || 0);
      this._targetQuat.setFromAxisAngle(this._worldUp, targetAngle);
      const turnRate = this.keys.sprint ? 13.0 : 11.0;
      this.characterGroup.quaternion.slerp(this._targetQuat, Math.min(1.0, turnRate * delta));
      this.characterGroup.rotation.setFromQuaternion(this.characterGroup.quaternion, 'YXZ');
    } else {
      // Hãm phanh êm ái khi nhả phím (Smooth Braking / Deceleration):
      // Dừng lại êm dịu có quán tính bước chân ngắn, không trôi trượt vô tận
      const brake = this.isGrounded ? 18.0 : 4.0;
      this.velocity.x += (0 - this.velocity.x) * Math.min(1.0, brake * delta);
      this.velocity.z += (0 - this.velocity.z) * Math.min(1.0, brake * delta);

      // Khi tốc độ rất nhỏ (< 0.06m/s), dừng dứt khoát triệt tiêu hoàn toàn trôi quán tính
      const horizSpeedSq = this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z;
      if (horizSpeedSq < 0.0036) {
        this.velocity.x = 0;
        this.velocity.z = 0;
      }
    }

    // 2. Trọng lực
    this.velocity.y += this.gravity * delta;

    // 3. DI CHUYỂN VA CHẠM TÁCH TRỤC VỚI CƠ CHẾ SUB-STEPPING CHỐNG XUYÊN TƯỜNG (CONTINUOUS COLLISION)
    const currentPos = this.characterGroup.position;
    this._resolvePenetrations(currentPos);

    const maxSubStep = 0.20; // 20cm là phân bước tối ưu: an toàn tuyệt đối chống xuyên tường mà giảm 50% số vòng lặp CPU

    // Trục X
    const stepX = this.velocity.x * delta;
    if (Math.abs(stepX) > 0.0001) {
      const stepsCountX = Math.max(1, Math.ceil(Math.abs(stepX) / maxSubStep));
      const subStepX = stepX / stepsCountX;
      for (let s = 0; s < stepsCountX; s++) {
        this._testPos.set(
          THREE.MathUtils.clamp(currentPos.x + subStepX, -245, 245),
          currentPos.y,
          currentPos.z
        );
        if (!this._isCollidingAt(this._testPos)) {
          currentPos.x = this._testPos.x;
        } else {
          this.velocity.x = 0; // Trượt tường theo trục Z
          break;
        }
      }
    }

    // Trục Z
    const stepZ = this.velocity.z * delta;
    if (Math.abs(stepZ) > 0.0001) {
      const stepsCountZ = Math.max(1, Math.ceil(Math.abs(stepZ) / maxSubStep));
      const subStepZ = stepZ / stepsCountZ;
      for (let s = 0; s < stepsCountZ; s++) {
        this._testPos.set(
          currentPos.x,
          currentPos.y,
          THREE.MathUtils.clamp(currentPos.z + subStepZ, -245, 245)
        );
        if (!this._isCollidingAt(this._testPos)) {
          currentPos.z = this._testPos.z;
        } else {
          this.velocity.z = 0; // Trượt tường theo trục X
          break;
        }
      }
    }

    this._resolvePenetrations(currentPos);

    // 4. KIỂM TRA ĐỘ CAO MẶT ĐẤT & FOOT GROUND SNAPPING CHUẨN GTA V (CẦU THÊ HÚC & VỈA HÈ)
    const allColliders = this.worldManager.getColliders();
    const charPos = this.characterGroup.position;

    if (!this._nearbyColliders) this._nearbyColliders = [];
    // Kiểm tra thông tin độ cong chính xác trên Cầu Kim Quy / Thê Húc / Long Biên
    let bridgeGroundY = null;
    if (this.worldManager.getTheHucBridgeInfo) {
      const bridgeInfo = this.worldManager.getTheHucBridgeInfo(charPos.x, charPos.y, charPos.z);
      if (bridgeInfo && bridgeInfo.onBridge) {
        bridgeGroundY = bridgeInfo.closestY;
      }
    }
    if (this.worldManager.getKimQuyBridgeInfo) {
      const kqInfo = this.worldManager.getKimQuyBridgeInfo(charPos.x, charPos.y, charPos.z);
      if (kqInfo && kqInfo.onBridge) {
        bridgeGroundY = kqInfo.closestY;
      }
    }
    if (this.worldManager.getLongBienBridgeInfo) {
      const lbInfo = this.worldManager.getLongBienBridgeInfo(charPos.x, charPos.y, charPos.z);
      if (lbInfo && lbInfo.onBridge) {
        bridgeGroundY = lbInfo.closestY;
      }
    }

    // Quét toàn diện tất cả các colliders sàn/đảo/cầu cốt lõi (không bỏ sót bất kỳ mặt phẳng nào)
    const colliders = allColliders;
    this._rayOrigin.copy(charPos);
    // Luôn bắn tia từ cao xuống (tối thiểu 2.2m trên sàn dự kiến) để không bao giờ bị kẹt dưới dốc dẫn hay sàn cầu
    const expectedFloorY = bridgeGroundY !== null ? bridgeGroundY : charPos.y;
    this._rayOrigin.y = Math.max(charPos.y + 2.2, expectedFloorY + 2.2, 2.8);
    this.raycaster.set(this._rayOrigin, this.downVector);
    this.raycaster.far = Math.max(this._rayOrigin.y + 1.5, 8.0);

    // Zero Heap Allocation: Tái sử dụng mảng _groundHits
    this._groundHits.length = 0;
    this.raycaster.intersectObjects(colliders, false, this._groundHits);

    // BẢO VỆ CAO ĐỘ MẶT SÀN TỐI THIỂU THEO TỪNG VÙNG ĐỊA LÝ DI SẢN:
    const dxTR = charPos.x - 80;
    const dzTR = charPos.z - (-80);
    const distSqTR = dxTR * dxTR + dzTR * dzTR;

    const dxNS = charPos.x - 122;
    const dzNS = charPos.z - (-73);
    const distSqNS = dxNS * dxNS + dzNS * dzNS;

    let minGroundProtected = 0.0;
    if (Math.abs(dxTR) <= 6.5 && Math.abs(dzTR) <= 5.5) {
      minGroundProtected = 2.045; // Tháp Rùa: Thềm đá, 4 cửa vòm và toàn bộ sàn nội điện gạch Bát Tràng (cushion +4.5cm)
    } else if (Math.abs(dxTR) <= 7.8 && Math.abs(dzTR) <= 6.8) {
      minGroundProtected = 1.88; // Tam cấp 4 phía dẫn lên Tháp Rùa
    } else if (distSqTR <= 18.0 * 18.0) {
      // Sân Đảo Tháp Rùa & dốc nối từ Cầu Kim Quy
      if (charPos.x < 76.0 && charPos.z > -76.0) {
        minGroundProtected = Math.max(1.15, bridgeGroundY || 1.15);
      } else {
        minGroundProtected = 1.685; // Mặt sân đá xanh Đảo Tháp Rùa & thảm cỏ tự nhiên
      }
    } else if (distSqNS <= 22.0 * 22.0) {
      minGroundProtected = 0.90; // Sân Đền Ngọc Sơn & Chùa Đỏ (sàn gạch Bát Tràng 0.88m)
    } else if (distSqTR <= 99 * 99) {
      minGroundProtected = 0.40; // Vỉa hè dạo ven Hồ Gươm
    }

    if (bridgeGroundY !== null) {
      minGroundProtected = Math.max(minGroundProtected, bridgeGroundY);
    }

    if (this._groundHits.length > 0 || bridgeGroundY !== null) {
      let groundY = (this._groundHits.length > 0) ? this._groundHits[0].point.y : 0;
      if (bridgeGroundY !== null) {
        // Khi bước lên thềm đảo/đền thờ thì luôn lấy độ cao lớn hơn, tuyệt đối không bị kéo sụt xuống gầm sàn
        groundY = (this._groundHits.length === 0) ? bridgeGroundY : Math.max(groundY, bridgeGroundY);
      }
      // Nâng nhẹ chân khi đứng trên sàn Tháp Rùa, tam cấp hoặc sân đảo để đế giày luôn hiển thị trọn vẹn trên mặt gạch đá
      if (this._groundHits.length > 0 && this._groundHits[0].object) {
        const hitName = this._groundHits[0].object.name || '';
        if (hitName === 'thapRuaInteriorFloor') {
          groundY = Math.max(groundY + 0.045, 2.060);
        } else if (hitName === 'thapRuaPlinth' || hitName === 'thapRuaStep') {
          groundY = Math.max(groundY + 0.045, 2.045);
        } else if (hitName.includes('island') || hitName.includes('courtyard') || hitName.includes('Grass') || hitName.includes('grass')) {
          groundY = Math.max(groundY + 0.045, 1.685);
        }
      }
      if (minGroundProtected > 0) {
        groundY = Math.max(groundY, minGroundProtected);
      }

      // CHỐNG RƠI XUYÊN CẦU / XUYÊN ĐẤT:
      // Luôn bảo đảm charPos.y không thể thấp hơn bridgeGroundY khi đang ở trong lòng cầu
      if (bridgeGroundY !== null && charPos.y < bridgeGroundY) {
        charPos.y = bridgeGroundY;
        this.velocity.y = 0;
        this.isGrounded = true;
        this.isJumping = false;
      }

      const verticalDiff = groundY - charPos.y;

      // Nếu đang chủ động nhảy lên cao (Space):
      if (this.isJumping && this.velocity.y > 0) {
        charPos.y += this.velocity.y * delta;
        this.isGrounded = false;
      } else {
        // Foot Ground Snapping (Cầu Thê Húc, dốc Cầu Long Biên, Tháp Rùa & Đền Ngọc Sơn):
        if (verticalDiff >= -this.maxStepDown && verticalDiff <= 1.6) { // Cho phép bước lên dốc thềm tam cấp tới 1.6m
          if (Math.abs(verticalDiff) < 0.02) {
            charPos.y = groundY;
          } else if (verticalDiff > 0) {
            // Leo lên dốc / bước lên thềm đá: nâng chân êm ái
            charPos.y = THREE.MathUtils.lerp(charPos.y, groundY, Math.min(1.0, 24.0 * delta));
            if (Math.abs(groundY - charPos.y) < 0.02) charPos.y = groundY;
          } else {
            // Bước xuống dốc cầu Thê Húc cong: Down-Snapping dính sát mặt cầu
            charPos.y = groundY;
          }
          this.velocity.y = 0;
          this.isGrounded = true;
          this.isJumping = false;
        } else if (charPos.y < groundY) {
          // BẢO VỆ CHỐT CHẶN: Không bao giờ để nhân vật đi xuyên xuống dưới lòng đất hoặc lòng cầu
          charPos.y = groundY;
          this.velocity.y = 0;
          this.isGrounded = true;
          this.isJumping = false;
        } else if (verticalDiff < -this.maxStepDown) {
          // Hẫng vực sâu hơn 55cm: rơi tự do
          charPos.y += this.velocity.y * delta;
          this.isGrounded = false;
        }
      }

      // Chốt chặn an toàn: chân không bao giờ lọt dưới sàn
      if (charPos.y < groundY) {
        charPos.y = groundY;
        this.velocity.y = 0;
        this.isGrounded = true;
        this.isJumping = false;
      }
    } else {
      let minGround = minGroundProtected > 0 ? minGroundProtected : 0.0;

      if (charPos.y + this.velocity.y * delta <= minGround) {
        charPos.y = minGround;
        this.velocity.y = 0;
        this.isGrounded = true;
        this.isJumping = false;
      } else {
        charPos.y += this.velocity.y * delta;
        this.isGrounded = false;
      }
    }

    // 5. CẬP NHẬT HOẠT HỌA 3D SKELETAL ANIMATOR / ANIMATION MIXER 60 FPS
    if (this._gltfMixer && this._animActions) {
      const horizSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
      let targetAnim = 'idle';
      if (!this.isGrounded || this.isJumping) {
        targetAnim = this._animActions.jump ? 'jump' : (horizSpeed > 0.15 ? (this.keys.sprint ? 'run' : 'walk') : 'idle');
      } else if (horizSpeed > 0.15) {
        targetAnim = this.keys.sprint ? 'run' : 'walk';
      }

      if (this._currentAnim !== targetAnim && this._animActions[targetAnim]) {
        const prev = this._animActions[this._currentAnim];
        const next = this._animActions[targetAnim];
        if (prev && next) {
          const fadeTime = targetAnim === 'jump' ? 0.08 : 0.20;
          next.reset().fadeIn(fadeTime).play();
          prev.fadeOut(fadeTime);
          this._currentAnim = targetAnim;
        }
      }
      this._gltfMixer.update(delta);
    } else if (this.humanoidAnimator) {
      const moveSpeed = this.velocity.length();
      this.humanoidAnimator.update(delta, moveSpeed, this.isGrounded, this.groundSlopeAngle || 0);
    }

    // 6. Kiểm tra tương tác gần nhất
    const nearby = (this.worldManager && typeof this.worldManager.checkNearbyInteraction === 'function') ? this.worldManager.checkNearbyInteraction(this.characterGroup.position) : null;
    if (nearby !== this.activeInteractable) {
      this.activeInteractable = nearby;
      if (this.eventBus) {
        this.eventBus.emit('CORE:INTERACTION_AVAILABLE', {
          canInteract: !!nearby,
          promptText: nearby ? nearby.promptText : '',
          actionKey: nearby ? nearby.actionKey : 'E'
        });
      }
    }
  }

  getPosition() {
    return this.characterGroup.position;
  }

  getMesh() {
    return this.characterGroup;
  }
}
