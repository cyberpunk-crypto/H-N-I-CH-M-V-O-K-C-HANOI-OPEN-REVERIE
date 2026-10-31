/**
 * PlayerController.js - Điều khiển di chuyển mượt mà chuẩn GTA V Third-Person Locomotion
 * 
 * Các tính năng nâng cấp theo chỉ lệnh /lam-game của Sếp Tổng:
 * 1. SỬA LỖI ĐI NGƯỢC (MOONWALKING): targetAngle = Math.atan2(finalDir.x, finalDir.z) + Math.PI;
 * 2. TÁCH BIỆT RÕ RÀNG 4 NHÂN VẬT KHÁC NHAU:
 *    - char_nu_sinh_ao_dai: Michelle.glb lụa trắng (0xffffff), quần trắng (0xf5f5f5), Nón Lá 3D.
 *    - char_co_gai_ao_ba_ba: Michelle.glb Áo bà ba hồng (0xffb6c1), quần đen (0x1a1a1a), Khăn rằn 3D, Nón Lá 3D.
 *    - char_nam_tri_thuc_suit: Soldier.glb Suit xám than/navy (0x2b303a), sơ mi trắng, giày da đen bóng.
 *    - char_nam_ao_dai_gam: Soldier.glb Áo dài gấm xanh thẫm (0x16213e) viền vàng kim (0xd4af37), Khăn Xếp 3D.
 * 3. CHỐNG XUYÊN LAN CAN CẦU (CAPSULE HORIZONTAL COLLIDER): Tim cầu <= 1.6m, chống đâm xuyên bụng.
 * 4. CĂN GÓC CAMERA BAN ĐẦU: Spawn tại (16.5, 0.5, -16.5), yaw = 0.785 rad (45 độ).
 * 
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { THREE } from './ThreeLib.js';
import { GLTFLoader } from '../lib/loaders/GLTFLoader.js';
import { createHanoiCharacter3D, CHARACTERS_META } from './CharacterFactory.js';
import { HumanoidAnimator } from './animations.js';

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
    this._gltfLoader = new GLTFLoader();
    this._textureLoader = new THREE.TextureLoader();
    this._gltfMixer = null;
    this._animActions = null;
    this._currentAnim = 'idle';
    this._isGltfReady = false;
    this._gltfCache = {};

    // Điểm tương tác
    this.activeInteractable = null;

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

    this.currentCharacterId = savedCharId;
    this.setCharacter(this.currentCharacterId);

    // Vị trí xuất phát trên đường dạo ven hồ Gươm dẫn thẳng lên Cầu Kim Quy
    this.characterGroup.position.set(16.5, 0.5, -16.5);
    this.characterGroup.rotation.y = 0.785; // 45 độ theo trục cầu
    this.characterGroup.quaternion.setFromAxisAngle(this._worldUp, 0.785);
    this.scene.add(this.characterGroup);

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
   * Tạo mô hình 3D Nón Lá truyền thống Việt Nam (Organic Conical Hat)
   */
  _create3DNonLa() {
    const nonLaGroup = new THREE.Group();
    nonLaGroup.name = '3D_NonLa';

    const outerConeGeo = new THREE.ConeGeometry(20, 11, 32, 1, true);
    const nonLaMat = new THREE.MeshStandardMaterial({
      color: 0xf3e5ab,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    const outerCone = new THREE.Mesh(outerConeGeo, nonLaMat);
    outerCone.position.y = 5.5;
    outerCone.castShadow = true;
    nonLaGroup.add(outerCone);

    const rimGeo = new THREE.TorusGeometry(20, 0.6, 8, 32);
    rimGeo.rotateX(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({ color: 0x8b5a2b }));
    rimMesh.castShadow = true;
    nonLaGroup.add(rimMesh);

    nonLaGroup.position.set(0, 14, -1);
    nonLaGroup.rotation.set(-0.05, 0, 0);
    return nonLaGroup;
  }

  /**
   * Tạo mô hình 3D Khăn Rằn truyền thống Nam Bộ / Phố Thị
   */
  _create3DKhanRan() {
    const khanGroup = new THREE.Group();
    khanGroup.name = '3D_KhanRan';

    const scarfMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0,
      roughness: 0.75,
      metalness: 0.05
    });

    // Vòng khăn quàng cổ
    const collarRingGeo = new THREE.TorusGeometry(10, 2.5, 8, 24);
    collarRingGeo.rotateX(Math.PI / 2);
    const collarRing = new THREE.Mesh(collarRingGeo, scarfMat);
    collarRing.position.set(0, -1, 0);
    collarRing.castShadow = true;
    khanGroup.add(collarRing);

    // Hai vạt khăn rủ chéo trước ngực
    const stripGeo = new THREE.BoxGeometry(3.5, 18, 0.8);
    const leftStrip = new THREE.Mesh(stripGeo, scarfMat);
    leftStrip.position.set(-4, -9, 5);
    leftStrip.rotation.set(0.12, 0, 0.12);
    leftStrip.castShadow = true;
    khanGroup.add(leftStrip);

    const rightStrip = new THREE.Mesh(stripGeo, scarfMat);
    rightStrip.position.set(4, -9, 5);
    rightStrip.rotation.set(0.12, 0, -0.12);
    rightStrip.castShadow = true;
    khanGroup.add(rightStrip);

    khanGroup.position.set(0, 3, 0);
    return khanGroup;
  }

  /**
   * Tạo mô hình 3D Khăn Xếp (Khăn Đóng) truyền thống Thăng Long
   */
  _create3DKhanXep() {
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
      const ringGeo = new THREE.TorusGeometry(12 + i * 0.35, 1.8, 8, 32);
      ringGeo.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, i === 2 ? goldTrim : turbanMat);
      ring.position.set(0, 14 + i * 1.8, 0);
      ring.scale.set(1.0, 1.0, 1.08);
      ring.castShadow = true;
      turbanGroup.add(ring);
    }

    turbanGroup.position.set(0, 2, 1);
    return turbanGroup;
  }

  /**
   * Tải mô hình 3D Skinned Humanoid thật (Mixamo Michelle / Soldier) với đầy đủ AnimationMixer
   * Tách biệt rõ ràng 4 nhân vật khác nhau theo lệnh của Sếp Tổng
   */
  async _load3DHumanoidCharacter(characterId) {
    this._isGltfReady = false;
    try {
      const isFemale = characterId === 'char_nu_sinh_ao_dai' || characterId === 'char_co_gai_ao_ba_ba';
      const modelPath = isFemale ? 'assets/characters/Michelle.glb' : 'assets/characters/Soldier.glb';

      let texPath = 'assets/characters/texture_nu_sinh_ao_dai.png?v=3.1.2';
      if (characterId === 'char_co_gai_ao_ba_ba') {
        texPath = 'assets/characters/texture_co_gai_ao_ba_ba.png?v=3.1.2';
      } else if (characterId === 'char_nam_tri_thuc_suit') {
        texPath = 'assets/characters/texture_nam_tri_thuc_suit.png?v=3.1.2';
      } else if (characterId === 'char_nam_ao_dai_gam') {
        texPath = 'assets/characters/texture_nam_ao_dai_gam.png?v=3.1.2';
      }

      const textureLoader = this._textureLoader || new THREE.TextureLoader();

      // Tải model chính, animations và texture trang phục Việt Nam song song
      const [gltf, soldierGltf, customTex] = await Promise.all([
        new Promise((res, rej) => this._gltfLoader.load(modelPath, res, undefined, rej)),
        isFemale ? new Promise((res, rej) => this._gltfLoader.load('assets/characters/Soldier.glb', res, undefined, rej)) : null,
        new Promise((res, rej) => textureLoader.load(texPath, res, undefined, rej)).catch(e => {
          console.warn('[PlayerController] Cảnh báo nạp texture:', e);
          return null;
        })
      ]);

      const animGltf = isFemale ? soldierGltf : gltf;
      const model = gltf.scene;
      model.name = isFemale ? 'Michelle3D' : 'Soldier3D';

      if (customTex) {
        customTex.flipY = false;
        if (THREE.SRGBColorSpace) customTex.colorSpace = THREE.SRGBColorSpace;
      }

      if (isFemale) {
        // Fix góc xoay FBX ngược của Michelle để hướng thẳng lên trời
        const charNode = model.getObjectByName('Character');
        if (charNode) {
          charNode.quaternion.set(-0.70710678, 0, 0, 0.70710678);
        }
      }

      // Giữ nguyên hình học và lưới, khoác texture trang phục Việt Nam sắc nét
      model.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;

          c.material = c.material ? c.material.clone() : new THREE.MeshStandardMaterial();
          if (customTex) {
            c.material.map = customTex;
          }
          c.material.color.setHex(0xffffff);

          if (characterId === 'char_nu_sinh_ao_dai') {
            c.material.roughness = 0.42;
            c.material.metalness = 0.05;
          } else if (characterId === 'char_co_gai_ao_ba_ba') {
            c.material.roughness = 0.52;
            c.material.metalness = 0.02;
          } else if (characterId === 'char_nam_tri_thuc_suit') {
            c.material.roughness = 0.68;
            c.material.metalness = 0.08;
          } else if (characterId === 'char_nam_ao_dai_gam') {
            c.material.roughness = 0.38;
            c.material.metalness = 0.28;
          }
          c.material.needsUpdate = true;
        }
      });

      // Gắn phụ kiện đầu tương ứng từng nhân vật
      let headBone = null;
      model.traverse(c => {
        if (c.name && c.name.toLowerCase().includes('head') && !c.name.toLowerCase().includes('top') && !c.name.toLowerCase().includes('end')) {
          headBone = c;
        }
      });

      if (headBone) {
        if (characterId === 'char_nu_sinh_ao_dai') {
          headBone.add(this._create3DNonLa());
        } else if (characterId === 'char_co_gai_ao_ba_ba') {
          headBone.add(this._create3DNonLa());
          headBone.add(this._create3DKhanRan());
        } else if (characterId === 'char_nam_ao_dai_gam') {
          headBone.add(this._create3DKhanXep());
        }
        // char_nam_tri_thuc_suit không đội nón lá hay khăn xếp, để lộ đầu tóc suit lịch lãm
      }

      // Thiết lập AnimationMixer 60 FPS
      const mixer = new THREE.AnimationMixer(model);
      const idleClip = animGltf.animations.find(a => a.name === 'Idle');
      const walkClip = animGltf.animations.find(a => a.name === 'Walk');
      const runClip = animGltf.animations.find(a => a.name === 'Run');

      const idleAction = idleClip ? mixer.clipAction(idleClip) : null;
      const walkAction = walkClip ? mixer.clipAction(walkClip) : null;
      const runAction = runClip ? mixer.clipAction(runClip) : null;

      if (idleAction) idleAction.play();

      // Xóa bỏ hoàn toàn hình khối cũ, thay thế bằng mô hình 3D thực
      while (this.characterGroup.children.length > 0) {
        this.characterGroup.remove(this.characterGroup.children[0]);
      }
      this.characterGroup.add(model);

      this._gltfMixer = mixer;
      this._animActions = {
        idle: idleAction,
        walk: walkAction,
        run: runAction
      };
      this._currentAnim = 'idle';
      this._isGltfReady = true;

      console.log(`[PlayerController] Đã kích hoạt Nhân Vật 3D Skinned Mesh (${characterId}) & MoCap Animation Mixer!`);
    } catch (err) {
      console.warn('[PlayerController] Lỗi tải 3D GLTF humanoid:', err);
    }
  }

  /**
   * Đổi nhân vật 3D sang 1 trong 4 nhân vật thực tế
   * @param {string} characterId - 'char_nu_sinh_ao_dai' | 'char_co_gai_ao_ba_ba' | 'char_nam_tri_thuc_suit' | 'char_nam_ao_dai_gam'
   */
  setCharacter(characterId) {
    if (!characterId) return Promise.resolve();
    this.currentCharacterId = characterId;
    this._isGltfReady = false;

    // Giữ nguyên tọa độ và góc xoay hiện tại
    const curPos = this.characterGroup ? this.characterGroup.position.clone() : new THREE.Vector3(16.5, 0.5, -16.5);
    const curRot = this.characterGroup ? this.characterGroup.rotation.y : 0.785;

    // Tải mô hình 3D Skinned Mesh thật với AnimationMixer & Nón Lá
    this._gltfLoadingPromise = this._load3DHumanoidCharacter(characterId).then(() => {
      if (this.characterGroup) {
        this.characterGroup.position.copy(curPos);
        this.characterGroup.rotation.y = curRot;
        this.characterGroup.quaternion.setFromAxisAngle(this._worldUp, curRot);
      }
    });

    return this._gltfLoadingPromise;
  }

  /**
   * Đăng ký sự kiện bàn phím
   */
  _bindKeyboardEvents() {
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
        case 'KeyF':
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
  }

  /**
   * Nhảy hoặc leo trèo Parkour
   */
  _handleJumpOrParkour() {
    if (!this.isGrounded || this.isParkouring) return;

    // Kiểm tra gờ tường phía trước mặt
    const colliders = this.worldManager.getColliders();
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.characterGroup.rotation.y);
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

    // Nhảy tự do
    this.velocity.y = this.jumpForce;
    this.isGrounded = false;
    this.isJumping = true;
  }

  _handleInteract() {
    if (this.activeInteractable && this.activeInteractable.onInteract) {
      this.activeInteractable.onInteract();
    }
  }

  setLocked(locked) {
    this.isLocked = !!locked;
    if (this.isLocked) {
      this.keys.forward = false;
      this.keys.backward = false;
      this.keys.left = false;
      this.keys.right = false;
      this.keys.sprint = false;
      this.velocity.set(0, 0, 0);
      this.isJumping = false;
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
    const r = this.playerRadius;
    const pY = pos.y;
    const obstacles = this.worldManager.getObstacles();

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      // Bộ lọc không gian chuẩn xác theo AABB (Spatial Distance Culling) - hoạt động tốt cả với vật cản dài
      const halfX = (obs.maxX - obs.minX) * 0.5;
      const halfZ = (obs.maxZ - obs.minZ) * 0.5;
      const centerX = (obs.minX + obs.maxX) * 0.5;
      const centerZ = (obs.minZ + obs.maxZ) * 0.5;
      if (Math.abs(pos.x - centerX) > (halfX + 14) || Math.abs(pos.z - centerZ) > (halfZ + 14)) {
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

    // 2. CHỐNG XUYÊN LAN CAN CẦU KIM QUY (CAPSULE HORIZONTAL COLLIDER - max dist 1.6m)
    if (this.worldManager.getTheHucBridgeInfo) {
      const bridgeInfo = this.worldManager.getTheHucBridgeInfo(pos.x, pos.y, pos.z);
      if (bridgeInfo && Math.abs(pos.y - bridgeInfo.closestY) <= 1.6) {
        const maxBridgeDist = 1.6;
        if (bridgeInfo.dist > maxBridgeDist && bridgeInfo.dist < 5.0) {
          const clampFactor = maxBridgeDist / bridgeInfo.dist;
          pos.x = bridgeInfo.closestX + (pos.x - bridgeInfo.closestX) * clampFactor;
          pos.z = bridgeInfo.closestZ + (pos.z - bridgeInfo.closestZ) * clampFactor;
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
    const npcs = this.worldManager.getNpcColliders();
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

    // 1. Chống xuyên lan can Cầu Kim Quy (giữ khoảng cách tim cầu <= 1.6m)
    if (this.worldManager.getTheHucBridgeInfo) {
      const bridgeInfo = this.worldManager.getTheHucBridgeInfo(testPos.x, testPos.y, testPos.z);
      if (bridgeInfo && Math.abs(testPos.y - bridgeInfo.closestY) <= 1.5) {
        if (bridgeInfo.dist > 1.6 && bridgeInfo.dist < 5.0) {
          return true; // Không cho người chơi đi lọt qua thanh lan can đâm xuyên bụng
        }
      }
    }

    // 2. Kiểm tra va chạm kiến trúc
    const obstacles = this.worldManager.getObstacles();
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];

      // Bộ lọc không gian chuẩn xác theo AABB (Spatial Culling) - bảo vệ trọn vẹn cả cầu dài và tường dài
      const halfX = (obs.maxX - obs.minX) * 0.5;
      const halfZ = (obs.maxZ - obs.minZ) * 0.5;
      const centerX = (obs.minX + obs.maxX) * 0.5;
      const centerZ = (obs.minZ + obs.maxZ) * 0.5;
      if (Math.abs(testPos.x - centerX) > (halfX + 16) || Math.abs(testPos.z - centerZ) > (halfZ + 16)) {
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
      // SỬA LỖI ĐI NGƯỢC (MOONWALKING): targetAngle = Math.atan2(finalDir.x, finalDir.z) + Math.PI
      const targetAngle = Math.atan2(finalDir.x, finalDir.z) + Math.PI;
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
    const colliders = this.worldManager.getColliders();
    const charPos = this.characterGroup.position;

    this._rayOrigin.copy(charPos);
    this._rayOrigin.y += 1.4;
    this.raycaster.set(this._rayOrigin, this.downVector);
    this.raycaster.far = 4.0;

    // Zero Heap Allocation: Tái sử dụng mảng _groundHits
    this._groundHits.length = 0;
    this.raycaster.intersectObjects(colliders, false, this._groundHits);

    // Kiểm tra thông tin độ cong chính xác trên Cầu Kim Quy / Thê Húc
    let bridgeGroundY = null;
    if (this.worldManager.getTheHucBridgeInfo) {
      const bridgeInfo = this.worldManager.getTheHucBridgeInfo(charPos.x, charPos.y, charPos.z);
      if (bridgeInfo && bridgeInfo.onBridge) {
        bridgeGroundY = bridgeInfo.closestY;
      }
    }

    if (this._groundHits.length > 0 || bridgeGroundY !== null) {
      let groundY = (this._groundHits.length > 0) ? this._groundHits[0].point.y : 0;
      if (bridgeGroundY !== null) {
        if (this._groundHits.length === 0 || Math.abs(groundY - bridgeGroundY) > 0.35) {
          groundY = bridgeGroundY;
        } else {
          groundY = Math.max(groundY, bridgeGroundY);
        }
      }

      const verticalDiff = groundY - charPos.y;

      // Nếu đang chủ động nhảy lên cao (Space):
      if (this.isJumping && this.velocity.y > 0) {
        charPos.y += this.velocity.y * delta;
        this.isGrounded = false;
      } else {
        // Foot Ground Snapping (Cầu Thê Húc, dốc Cầu Long Biên & vỉa hè):
        if (verticalDiff >= -this.maxStepDown && verticalDiff <= this.stepUpHeight) {
          if (Math.abs(verticalDiff) < 0.02) {
            charPos.y = groundY;
          } else if (verticalDiff > 0) {
            // Leo lên dốc / bước lên vỉa hè: nâng chân êm ái
            charPos.y = THREE.MathUtils.lerp(charPos.y, groundY, Math.min(1.0, 24.0 * delta));
            if (Math.abs(groundY - charPos.y) < 0.02) charPos.y = groundY;
          } else {
            // Bước xuống dốc cầu Thê Húc cong: Down-Snapping dính sát mặt cầu
            if (this.isGrounded) {
              charPos.y = groundY; // Triệt tiêu 100% hiện tượng nhảy tưng tưng / rơi hẫng xuống dốc
            } else {
              charPos.y = THREE.MathUtils.lerp(charPos.y, groundY, Math.min(1.0, 24.0 * delta));
            }
          }
          this.velocity.y = 0;
          this.isGrounded = true;
          this.isJumping = false;
        } else if (verticalDiff < -this.maxStepDown) {
          // Hẫng vực sâu hơn 55cm: rơi tự do
          charPos.y += this.velocity.y * delta;
          this.isGrounded = false;
        } else {
          // Tường quá cao: không leo, rơi trọng lực
          charPos.y += this.velocity.y * delta;
          this.isGrounded = false;
        }
      }

      // Bảo vệ: chân không lọt dưới đất
      if (charPos.y < groundY) {
        charPos.y = groundY;
        this.velocity.y = 0;
        this.isGrounded = true;
        this.isJumping = false;
      }
    } else {
      if (charPos.y + this.velocity.y * delta <= 0.0) {
        charPos.y = 0.0;
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
      if (horizSpeed > 0.15) {
        targetAnim = this.keys.sprint ? 'run' : 'walk';
      }

      if (this._currentAnim !== targetAnim && this._animActions[targetAnim]) {
        const prev = this._animActions[this._currentAnim];
        const next = this._animActions[targetAnim];
        if (prev && next) {
          next.reset().fadeIn(0.22).play();
          prev.fadeOut(0.22);
          this._currentAnim = targetAnim;
        }
      }
      this._gltfMixer.update(delta);
    } else if (this.humanoidAnimator) {
      const moveSpeed = this.velocity.length();
      this.humanoidAnimator.update(delta, moveSpeed, this.isGrounded);
    }

    // 6. Kiểm tra tương tác gần nhất
    const nearby = this.worldManager.checkNearbyInteraction(this.characterGroup.position);
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
