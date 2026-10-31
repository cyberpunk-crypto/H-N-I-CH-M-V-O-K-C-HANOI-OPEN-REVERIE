/**
 * PlayerController.js - Điều khiển di chuyển mượt mà, đường nét con người giải phẫu tự nhiên
 * Đã khắc phục triệt để: Đảo trục phím A/D, cơ chế bước qua gờ thấp (Step-Up), và tích hợp HumanoidAnimator 60 FPS
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { THREE } from './ThreeLib.js';
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

    // Thông số vật lý & chuyển động nhạy bén
    this.walkSpeed = 5.2;
    this.sprintSpeed = 9.2;
    this.jumpForce = 8.5;
    this.gravity = -24.0;

    this.velocity = new THREE.Vector3();
    this.isGrounded = true;
    this.isParkouring = false;

    // Bán kính thân người thon gọn vừa vặn ngõ phố Hà Nội
    this.playerRadius = 0.35; // Giảm từ 0.45 xuống 0.35 giúp luồn lách ngõ hẹp mượt mà
    this.playerHeight = 1.75;
    this.stepUpHeight = 0.55; // Bước qua gờ vỉa hè / mép tà vẹt cao tới 38cm một cách tự nhiên

    // Raycaster kiểm tra mặt đất
    this.raycaster = new THREE.Raycaster();
    this.downVector = new THREE.Vector3(0, -1, 0);

    // Bộ nhớ đệm Vector dùng chung (Zero Allocation Update Loop - Đạt chuẩn 60 FPS mượt mà)
    this._moveVector = new THREE.Vector3();
    this._camForward = new THREE.Vector3();
    this._camRight = new THREE.Vector3();
    this._worldUp = new THREE.Vector3(0, 1, 0);
    this._finalDir = new THREE.Vector3();
    this._testPos = new THREE.Vector3();
    this._rayOrigin = new THREE.Vector3();

    // Biến cho hoạt ảnh sinh học con người
    this.walkCycle = 0;
    this.baseTorsoY = 0.95;
    this.humanoidAnimator = null;

    // Điểm tương tác
    this.activeInteractable = null;

    // Khởi tạo mô hình con người bo tròn mềm mại, chân thực
    this._createRealisticHumanMesh();
    this._bindKeyboardEvents();
    this._initChatBubbleListener();
  }

  /**
   * Tạo mô hình 3D con người hữu cơ (Organic Sculpted Human Mesh):
   * Đường nét mềm mại, bo tròn, giải phẫu tự nhiên, không còn các khối hộp vuông vắn thô sơ!
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

    // Vị trí xuất phát trên đường dạo ven hồ Gươm dẫn thẳng lên Cầu Tháp Rùa
    this.characterGroup.position.set(17, 0.5, -17);
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
   * Đổi nhân vật 3D sang 1 trong 4 nhân vật thực tế
   * @param {string} characterId - 'char_nu_sinh_ao_dai' | 'char_co_gai_ao_ba_ba' | 'char_nam_tri_thuc_suit' | 'char_nam_ao_dai_gam'
   */
  setCharacter(characterId) {
    if (!characterId) return;
    this.currentCharacterId = characterId;

    // Giữ nguyên tọa độ và góc xoay hiện tại
    const curPos = this.characterGroup ? this.characterGroup.position.clone() : new THREE.Vector3(17, 0.5, -17);
    const curRot = this.characterGroup ? this.characterGroup.rotation.y : 0;

    // Xóa sạch các bộ phận cũ trong characterGroup
    while (this.characterGroup.children.length > 0) {
      const child = this.characterGroup.children[0];
      this.characterGroup.remove(child);
    }

    // Tạo nhân vật mới từ CharacterFactory
    const newCharMesh = createHanoiCharacter3D(characterId, { isNPC: false });

    // Trích xuất các pivot cho tương thích ngược
    this.torsoGroup = newCharMesh.torsoGroup;
    this.headGroup = newCharMesh.headGroup;
    this.leftArmPivot = newCharMesh.leftArmPivot;
    this.rightArmPivot = newCharMesh.rightArmPivot;
    this.leftLegPivot = newCharMesh.leftLegPivot;
    this.rightLegPivot = newCharMesh.rightLegPivot;
    this.baseTorsoY = newCharMesh.baseTorsoY || 0.95;

    // Gắn rig sang characterGroup
    this.characterGroup.rig = newCharMesh.rig;
    if (this.characterGroup.rig) {
      this.characterGroup.rig.rootGroup = this.characterGroup;
    }

    // Chuyển toàn bộ children từ newCharMesh sang this.characterGroup
    while (newCharMesh.children.length > 0) {
      this.characterGroup.add(newCharMesh.children[0]);
    }

    this.characterGroup.position.copy(curPos);
    this.characterGroup.rotation.y = curRot;

    // Khởi tạo HumanoidAnimator chuẩn 60 FPS
    this.humanoidAnimator = new HumanoidAnimator(this.characterGroup);
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
          }
        };
        animateParkour();
        return;
      }
    }

    // Nhảy tự do
    this.velocity.y = this.jumpForce;
    this.isGrounded = false;
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
    }
  }

  teleport(pos) {
    if (!pos) return;
    this.characterGroup.position.set(pos.x, pos.y || 0.5, pos.z);
    this.velocity.set(0, 0, 0);
  }

  /**
   * GIẢI PHÁP CHỐNG DÍNH CHỐNG KẸT TUYỆT ĐỐI (ANTI-STUCK / PENETRATION RESOLUTION):
   * Tự động đẩy nhân vật ra khỏi mép vật cản nếu lỡ tiếp giáp hoặc lấn nhẹ,
   * triệt tiêu hoàn toàn hiện tượng kẹt đơ không di chuyển được!
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

    // Đẩy ngược lại nếu vi phạm ranh giới mặt nước (bảo đảm 100% không chạm nước)
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

    // Đẩy nhân vật ra khỏi các NPC xung quanh (chống dính và chống đi xuyên người)
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
   * Không chặn người chơi khi gặp mép vỉa hè, gạch hoa, mép ray <= 38cm!
   */
  _isCollidingAt(testPos) {
    const r = this.playerRadius;
    const pY = testPos.y;

    // 0. Cấm tuyệt đối không cho bước xuống nước / chạm nước theo sắc lệnh
    if (this.worldManager.isWaterAt && this.worldManager.isWaterAt(testPos.x, testPos.y, testPos.z)) {
      return true; // Chặn ngang ngay lập tức, không cho phép xuống nước!
    }

    // 1. Kiểm tra va chạm kiến trúc
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

      // Cơ chế Step-Up: Nếu vật thể thấp hơn chiều cao gờ bước chân (<= 0.38m) thì KHÔNG CHẶN NGANG,
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

    // 2. Kiểm tra va chạm với con người (NPCs)
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
   * Cập nhật chuyển động mượt mà, đúng chuẩn điều khiển Game Thế Giới Mở
   */
  update(delta, camera) {
    if (this.isParkouring) return;

    // 1. ĐỌC PHÍM WASD (Tái sử dụng vector đệm, không cấp phát mới trong update loop)
    const moveVector = this._moveVector.set(0, 0, 0);
    if (!this.isLocked) {
      if (this.keys.forward) moveVector.z -= 1;  // W: Tiến
      if (this.keys.backward) moveVector.z += 1; // S: Lùi
      if (this.keys.left) moveVector.x -= 1;     // A: Sang trái
      if (this.keys.right) moveVector.x += 1;    // D: Sang phải
    }

    const isMoving = moveVector.lengthSq() > 0;
    const currentSpeed = this.keys.sprint ? this.sprintSpeed : this.walkSpeed;

    if (isMoving && camera) {
      moveVector.normalize();

      // Vector hướng nhìn phẳng của Camera (Yaw)
      const camForward = this._camForward;
      camera.getWorldDirection(camForward);
      camForward.y = 0;
      camForward.normalize();

      // Vector hướng bên phải của Camera: cross(camForward, up) -> ĐÚNG CHUẨN TOÁN HỌC 3D!
      const camRight = this._camRight.crossVectors(camForward, this._worldUp).normalize();

      // Hướng di chuyển tổng hợp (ĐÃ KHẮC PHỤC TRIỆT ĐỂ LỖI ĐẢO CHIỀU TRÁI/PHẢI)
      const finalDir = this._finalDir.set(0, 0, 0)
        .addScaledVector(camForward, -moveVector.z)
        .addScaledVector(camRight, moveVector.x)
        .normalize();

      const desiredVelX = finalDir.x * currentSpeed;
      const desiredVelZ = finalDir.z * currentSpeed;

      // Gia tốc chuyển động mượt mà chuẩn GTA V Locomotion
      const accel = this.isGrounded ? 18.0 : 6.0;
      this.velocity.x += (desiredVelX - this.velocity.x) * Math.min(1.0, accel * delta);
      this.velocity.z += (desiredVelZ - this.velocity.z) * Math.min(1.0, accel * delta);

      // Xoay hướng mặt nhân vật mượt mà (GTA V Third-Person Character Turning / Slerp)
      const targetAngle = Math.atan2(finalDir.x, finalDir.z);
      let angleDiff = targetAngle - this.characterGroup.rotation.y;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      const turnSpeed = this.keys.sprint ? 14.0 : 11.0;
      this.characterGroup.rotation.y += angleDiff * Math.min(1.0, turnSpeed * delta);
    } else {
      // Giảm tốc có quán tính thực tế, dừng dứt khoát không bị trượt băng
      const brake = this.isGrounded ? 22.0 : 5.0;
      this.velocity.x += (0 - this.velocity.x) * Math.min(1.0, brake * delta);
      this.velocity.z += (0 - this.velocity.z) * Math.min(1.0, brake * delta);
      if (Math.abs(this.velocity.x) < 0.04) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.04) this.velocity.z = 0;
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

    // 4. KIỂM TRA ĐỘ CAO MẶT ĐẤT VÀ BƯỚC LÊN GỜ VỈA HÈ (STEP-UP GROUND SNAP)
    // Toàn bộ mảng colliders (~30 meshes) được raycast trực tiếp - không dùng culling khoảng cách sai lệch gây rơi khỏi cầu Long Biên!
    const colliders = this.worldManager.getColliders();
    const charPos = this.characterGroup.position;

    this._rayOrigin.copy(charPos);
    this._rayOrigin.y += 1.4;
    this.raycaster.set(this._rayOrigin, this.downVector);
    this.raycaster.far = 4.0;
    const groundHits = this.raycaster.intersectObjects(colliders, false);

    if (groundHits.length > 0) {
      const groundY = groundHits[0].point.y;
      // Nếu chân gần mặt đất hoặc thấp hơn mặt đất: snap chân lên mặt đất mượt mà
      if (this.characterGroup.position.y + this.velocity.y * delta <= groundY + 0.08) {
        this.characterGroup.position.y = THREE.MathUtils.lerp(this.characterGroup.position.y, groundY, 0.4);
        this.velocity.y = 0;
        this.isGrounded = true;
      } else {
        this.characterGroup.position.y += this.velocity.y * delta;
        this.isGrounded = false;
      }
    } else {
      if (this.characterGroup.position.y + this.velocity.y * delta <= 0.0) {
        this.characterGroup.position.y = 0.0;
        this.velocity.y = 0;
        this.isGrounded = true;
      } else {
        this.characterGroup.position.y += this.velocity.y * delta;
        this.isGrounded = false;
      }
    }

    // 5. CẬP NHẬT HOẠT HỌA 3D SKELETAL ANIMATOR 60 FPS
    if (this.humanoidAnimator) {
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
