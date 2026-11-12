/**
 * CameraController.js - Hệ thống Camera Kép hoàn chỉnh (TPS Spring-Arm & FPS Viewfinder 35mm)
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { THREE } from './ThreeLib.js';

export class CameraController {
  constructor(camera, domElement, playerController, worldManager, eventBus) {
    this.camera = camera;
    this.domElement = domElement;
    this.playerController = playerController;
    this.worldManager = worldManager;
    this.eventBus = eventBus || window.GameEventBus;

    // Trạng thái Camera
    this.mode = 'TPS'; // 'TPS' hoặc 'FPS'
    this.targetMode = 'TPS';
    this.isTransitioning = false;
    this.transitionProgress = 0; // 0.0 (TPS) -> 1.0 (FPS)
    this.transitionDuration = 0.3; // 0.3s theo chuẩn Game Spec
    this.isRightMouseDown = false;

    // Góc quay (Spherical Angles) - Căn góc ban đầu hướng theo trục Cầu Kim Quy (yaw = 0.785 rad / 45 độ)
    this.yaw = 0.785;
    this.pitch = 0.22; // Chúc xuống ~12 độ trong TPS
    this.targetYaw = 0.785;
    this.targetPitch = 0.22;
    this.smoothFactor = 0.22; // Độ phản hồi chuột nhạy bén, không bị trễ/lì lợm

    // Thông số TPS Spring-Arm
    this.targetArmLength = 4.2;
    this.currentArmLength = 4.2;
    this.minArmLength = 0.35; // Cho phép co sát vai nhân vật, triệt tiêu 100% hiện tượng camera lọt vào trong tường
    this.eyeHeight = 1.58;

    // Thông số FOV
    this.tpsFov = 65;
    this.fpsFov = 45;

    // Head-bobbing & Nhịp thở
    this.bobbingTime = 0;
    this.bobbingOffset = new THREE.Vector3();

    // Raycast chống xuyên tường
    this.raycaster = new THREE.Raycaster();

    // Bộ nhớ đệm Vector dùng chung (Zero Allocation Update Loop - 60 FPS)
    this._eyePos = new THREE.Vector3();
    this._camDir = new THREE.Vector3();
    this._desiredTpsPos = new THREE.Vector3();
    this._rayDir = new THREE.Vector3();
    this._actualTpsPos = new THREE.Vector3();
    this._actualFpsPos = new THREE.Vector3();
    this._forwardTarget = new THREE.Vector3();
    this._lookTarget = new THREE.Vector3();

    this._bindEvents();
  }

  /**
   * Đăng ký chuột & phím tắt chuyển đổi Camera
   */
  _bindEvents() {
    // 1. Phím V chuyển đổi qua lại giữa TPS và FPS
    window.addEventListener('keydown', (e) => {
      if (this.playerController && this.playerController.isLocked) return;

      if (e.code === 'KeyV' || e.code === 'KeyC') {
        this.toggleCameraMode();
      }
    });

    // 2. Giữ chuột phải để ngắm nhanh FPS, nhả ra quay về TPS
    this.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        // Chuột phải
        e.preventDefault();
        this.isRightMouseDown = true;
        this.setCameraMode('FPS');
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2 && this.isRightMouseDown) {
        this.isRightMouseDown = false;
        // Nếu chuyển sang FPS bằng chuột phải thì nhả ra về TPS
        if (this.mode === 'FPS') {
          this.setCameraMode('TPS');
        }
      }
    });

    // Chặn menu chuột phải mặc định trên canvas
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    // 3. Xoay chuột điều khiển góc nhìn
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    // Nhấp chuột vào khung canvas để khóa tâm chuột (Pointer Lock) - chuẩn game 3D PC không bị trễ chuột
    this.domElement.addEventListener('click', () => {
      if (document.pointerLockElement !== this.domElement) {
        try { this.domElement.requestPointerLock(); } catch (_) {}
      }
    });

    this.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0 || e.button === 2) {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      // Hỗ trợ cả PointerLock trực tiếp hoặc kéo rê chuột tự do
      const minPitch = (this.mode === 'TPS') ? -0.42 : -Math.PI / 2.6;
      if (document.pointerLockElement === this.domElement) {
        const sens = 0.0028;
        this.targetYaw -= e.movementX * sens;
        this.targetPitch -= e.movementY * sens;
        this.targetPitch = THREE.MathUtils.clamp(this.targetPitch, minPitch, Math.PI / 2.8);
      } else if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        const sens = 0.0045;
        this.targetYaw -= deltaX * sens;
        this.targetPitch -= deltaY * sens;
        this.targetPitch = THREE.MathUtils.clamp(this.targetPitch, minPitch, Math.PI / 2.8);
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Cuộn chuột phóng to / thu nhỏ khoảng cách camera TPS
    window.addEventListener('wheel', (e) => {
      if (this.mode === 'TPS') {
        this.targetArmLength = THREE.MathUtils.clamp(
          this.targetArmLength + e.deltaY * 0.005,
          2.0,
          7.0
        );
      }
    }, { passive: true });

    // 4. Lắng nghe sự kiện chuyển đổi từ UI
    if (this.eventBus) {
      this.eventBus.on('UI:SWITCH_CAMERA_MODE', (payload) => {
        if (payload && payload.targetMode) {
          this.setCameraMode(payload.targetMode);
        }
      });
    }
  }

  /**
   * Đảo đổi trạng thái giữa TPS và FPS (hoặc đổi góc ngắm cảnh khi đang trên tàu)
   */
  toggleCameraMode() {
    if (this.worldManager && this.worldManager.isPlayerRidingTrain) {
      const trainModes = ['INSIDE_COACH', 'OBSERVATION_DECK', 'TPS_TRAIN', 'LOCOMOTIVE_CAB'];
      const curIdx = trainModes.indexOf(this.trainCameraMode || 'INSIDE_COACH');
      const nextIdx = (curIdx + 1) % trainModes.length;
      this.trainCameraMode = trainModes[nextIdx];
      const titles = {
        INSIDE_COACH: '🪟 Toa Kính Panorama 360° (Di chuột ngắm sông & hai bên tàu)',
        OBSERVATION_DECK: '✨ Ban Công Lộ Thiên Đuôi Tàu 360° (Ngắm đường ray & vòm cầu)',
        TPS_TRAIN: '🎥 Camera Tự Do 360° Quanh Tàu (Cuộn chuột zoom)',
        LOCOMOTIVE_CAB: '🚂 Buồng Lái Đầu Máy Hơi Nước 360°'
      };
      if (this.eventBus) {
        this.eventBus.emit('CORE:NOTIFICATION', {
          message: `${titles[this.trainCameraMode]} • Bấm [V] đổi góc`
        });
      }
      return;
    }
    const next = this.mode === 'TPS' ? 'FPS' : 'TPS';
    this.setCameraMode(next);
  }

  /**
   * Thiết lập chế độ Camera mục tiêu
   * @param {'TPS' | 'FPS'} targetMode 
   */
  setCameraMode(targetMode) {
    if (this.targetMode === targetMode) return;
    this.targetMode = targetMode;
    this.isTransitioning = true;
  }

  /**
   * Cubic Bezier Easing: cubic-bezier(0.25, 1, 0.5, 1) cho chuyển đổi êm dịu
   */
  _easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Cập nhật vị trí và góc nhìn camera mỗi frame
   * @param {number} delta 
   */
  update(delta) {
    if (!this.playerController) return;

    const playerPos = this.playerController.getPosition();
    const playerMesh = this.playerController.getMesh();

    // 1. Phản hồi chuột tức thì 1:1 theo thời gian thực - Triệt tiêu 100% cảm giác lì lợm/trôi camera
    this.yaw = this.targetYaw;
    const minPitch = (this.mode === 'TPS') ? -0.42 : -Math.PI / 2.6;
    this.targetPitch = THREE.MathUtils.clamp(this.targetPitch, minPitch, Math.PI / 2.8);
    this.pitch = this.targetPitch;

    // Vector hướng nhìn 3D tính từ góc chuột (Hỗ trợ quay tự do 360 độ theo mọi góc nhìn)
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const lookDir = this._camDir.set(
      sinYaw * cosPitch,
      sinPitch,
      cosYaw * cosPitch
    );

    // 🚂 GÓC NHÌN PHONG CẢNH KHI ĐI TRÊN TOA TÀU DI SẢN CẦU LONG BIÊN (360° TỰ DO MỌI GÓC NHÌN)
    if (this.worldManager && this.worldManager.isPlayerRidingTrain) {
      const mode = this.trainCameraMode || 'INSIDE_COACH';
      const coachX = this.worldManager.trainPosX - 8.0;
      const coachY = (this.worldManager.trainFloorY !== undefined ? this.worldManager.trainFloorY : 11.25); // Sàn toa tàu di sản
      
      if (mode === 'INSIDE_COACH') {
        // TOA KÍNH PANORAMA 360°: Người chơi ngồi hoặc đứng trong toa, di chuột ngắm 360 độ:
        // Quay trái ngắm Sông Hồng, quay phải ngắm Bãi Giữa & thành phố, ngửa lên ngắm dầm Eiffel qua giếng trời
        const eyePos = this._eyePos.set(playerPos.x, coachY + 1.45, playerPos.z);
        const lookTarget = this._lookTarget.copy(eyePos).add(lookDir);
        this.camera.position.copy(eyePos);
        this.camera.lookAt(lookTarget);
        this.camera.fov = 68;
        this.camera.updateProjectionMatrix();
        if (playerMesh) playerMesh.visible = false; // Ẩn mô hình người chơi để tầm nhìn kính 100% thoáng đãng
        return;
      } else if (mode === 'OBSERVATION_DECK') {
        // BAN CÔNG LỘ THIÊN ĐUÔI TÀU 360°
        const deckPos = this._eyePos.set(coachX - 7.6, coachY + 1.55, 60.0);
        const lookTarget = this._lookTarget.copy(deckPos).add(lookDir);
        this.camera.position.copy(deckPos);
        this.camera.lookAt(lookTarget);
        this.camera.fov = 70;
        this.camera.updateProjectionMatrix();
        if (playerMesh) playerMesh.visible = true;
        return;
      } else if (mode === 'TPS_TRAIN') {
        // CAMERA TỰ DO QUAY QUANH ĐOÀN TÀU 360° (Orbiting Chase Cam)
        const focusPos = this._lookTarget.set(coachX, coachY + 1.2, 60.0);
        const armLen = this.currentArmLength || 6.5;
        const camPos = this._eyePos.copy(focusPos).sub(lookDir.clone().multiplyScalar(armLen));
        this.camera.position.copy(camPos);
        this.camera.lookAt(focusPos);
        this.camera.fov = 65;
        this.camera.updateProjectionMatrix();
        if (playerMesh) playerMesh.visible = true;
        return;
      } else if (mode === 'LOCOMOTIVE_CAB') {
        // BUỒNG LÁI ĐẦU MÁY HƠI NƯỚC 360°
        const cabPos = this._eyePos.set(this.worldManager.trainPosX - 1.2, coachY + 1.6, 60.0);
        const lookTarget = this._lookTarget.copy(cabPos).add(lookDir);
        this.camera.position.copy(cabPos);
        this.camera.lookAt(lookTarget);
        this.camera.fov = 68;
        this.camera.updateProjectionMatrix();
        if (playerMesh) playerMesh.visible = false;
        return;
      }
    } else {
      this.targetArmLength = 4.2;
    }

    // 2. Xử lý chuyển đổi mượt mà giữa TPS và FPS (0.3s)
    if (this.isTransitioning) {
      const step = delta / this.transitionDuration;
      if (this.targetMode === 'FPS') {
        this.transitionProgress = Math.min(1.0, this.transitionProgress + step);
        if (this.transitionProgress >= 1.0) {
          this.mode = 'FPS';
          this.isTransitioning = false;
          if (this.eventBus) {
            this.eventBus.emit('CORE:CAMERA_MODE_CHANGED', { mode: 'FPS', fov: this.fpsFov });
          }
        }
      } else {
        this.transitionProgress = Math.max(0.0, this.transitionProgress - step);
        if (this.transitionProgress <= 0.0) {
          this.mode = 'TPS';
          this.isTransitioning = false;
          if (this.eventBus) {
            this.eventBus.emit('CORE:CAMERA_MODE_CHANGED', { mode: 'TPS', fov: this.tpsFov });
          }
        }
      }
    }

    const t = this._easeOutCubic(this.transitionProgress);

    // 3. FOV Interpolation
    const currentFov = THREE.MathUtils.lerp(this.tpsFov, this.fpsFov, t);
    if (Math.abs(this.camera.fov - currentFov) > 0.05) {
      this.camera.fov = currentFov;
      this.camera.updateProjectionMatrix();
    }

    // 4. Ẩn Model nhân vật khi chuyển sang FPS để không che khuất tầm nhìn
    if (playerMesh) {
      playerMesh.visible = (this.transitionProgress < 0.85);
    }

    // 5. Tọa độ mắt nhân vật (Eye Position)
    const eyePos = this._eyePos.copy(playerPos);
    eyePos.y += this.eyeHeight;

    // 6. Tính toán vị trí mong muốn trong TPS với Spring-Arm
    // camDir đã được tính toán đồng bộ theo (yaw, pitch) phía trên
    const camDir = this._camDir;

    // Vị trí TPS lý tưởng phía sau nhân vật
    const desiredTpsPos = this._desiredTpsPos.copy(eyePos).addScaledVector(camDir, this.targetArmLength);

    // CHỐNG CAMERA NHÌN XUYÊN TƯỜNG / XUYÊN NHÀ KHI LẠI GẦN CÔNG TRÌNH:
    // Kết hợp Ray-AABB với toàn bộ 480+ khối kiến trúc nhà cửa và Raycast colliders
    let minAllowedArm = this.targetArmLength;
    const rayDir = this._rayDir.copy(desiredTpsPos).sub(eyePos).normalize();
    const maxRayDist = this.targetArmLength + 0.3;
    const eX = eyePos.x;
    const eZ = eyePos.z;

    // A. Kiểm tra va chạm với các khối kiến trúc / nhà phố / đền chùa (AABB Obstacles)
    const obstacles = (this.worldManager && typeof this.worldManager.getObstacles === 'function') ? this.worldManager.getObstacles() : [];
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      // Bỏ qua các vật thể nằm hoàn toàn dưới thắt lưng nhân vật (không phải tường chắn tầm nhìn)
      if (obs.maxY <= eyePos.y - 0.45) continue;

      const cX = obs._centerX !== undefined ? obs._centerX : (obs.minX + obs.maxX) * 0.5;
      const cZ = obs._centerZ !== undefined ? obs._centerZ : (obs.minZ + obs.maxZ) * 0.5;
      const maxR = Math.max(obs.maxX - obs.minX, obs.maxZ - obs.minZ) * 0.5 + maxRayDist;
      if (Math.abs(eX - cX) > maxR || Math.abs(eZ - cZ) > maxR) continue;

      // Slab test tìm điểm giao cắt gần nhất giữa tia camera và hộp AABB của nhà
      let tMin = 0.0;
      let tMax = maxRayDist;

      // Trục X
      if (Math.abs(rayDir.x) < 1e-6) {
        if (eyePos.x < obs.minX || eyePos.x > obs.maxX) continue;
      } else {
        const invD = 1.0 / rayDir.x;
        let t1 = (obs.minX - eyePos.x) * invD;
        let t2 = (obs.maxX - eyePos.x) * invD;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) continue;
      }

      // Trục Y
      if (Math.abs(rayDir.y) < 1e-6) {
        if (eyePos.y < obs.minY || eyePos.y > obs.maxY) continue;
      } else {
        const invD = 1.0 / rayDir.y;
        let t1 = (obs.minY - eyePos.y) * invD;
        let t2 = (obs.maxY - eyePos.y) * invD;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) continue;
      }

      // Trục Z
      if (Math.abs(rayDir.z) < 1e-6) {
        if (eyePos.z < obs.minZ || eyePos.z > obs.maxZ) continue;
      } else {
        const invD = 1.0 / rayDir.z;
        let t1 = (obs.minZ - eyePos.z) * invD;
        let t2 = (obs.maxZ - eyePos.z) * invD;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) continue;
      }

      if (tMin < minAllowedArm) {
        minAllowedArm = Math.max(this.minArmLength, tMin - 0.45);
      }
    }

    // B. Kiểm tra va chạm raycast với các colliders lưới hình học đứng (tường/vách)
    // Bỏ qua tuyệt đối toàn bộ mặt phẳng sàn, đường dạo, dốc dẫn, sàn cầu để không làm giật camera/khựng hình khi di chuyển
    const allColliders = this.worldManager ? this.worldManager.getColliders() : [];
    if (!this._nearColliders) this._nearColliders = [];
    this._nearColliders.length = 0;
    for (let c = 0; c < allColliders.length; c++) {
      const col = allColliders[c];
      if (col._isBaseGround || col._isGroundFloor || col._neverCull) continue;
      const cName = (col.name || '').toLowerCase();
      if (cName.includes('ground') || cName.includes('terrain') || cName.includes('road') ||
          cName.includes('deck') || cName.includes('floor') || cName.includes('plinth') ||
          cName.includes('step') || cName.includes('plank') || cName.includes('slope') ||
          cName.includes('dike') || cName.includes('sand') || cName.includes('apron') ||
          cName.includes('plaza') || cName.includes('promenade') || cName.includes('island') ||
          cName.includes('bridge') || cName.includes('viaduct') || cName.includes('pillar') ||
          cName.includes('cutwater') || cName.includes('rail') || cName.includes('tie')) continue;
      if (col.position) {
        const dx = col.position.x - eX;
        const dz = col.position.z - eZ;
        if (dx * dx + dz * dz > 784) continue; // 28m * 28m
      }
      this._nearColliders.push(col);
    }
    const colliders = this._nearColliders;

    if (colliders.length > 0) {
      this.raycaster.set(eyePos, rayDir);
      this.raycaster.far = maxRayDist;

      const hits = this.raycaster.intersectObjects(colliders, false);
      if (hits.length > 0) {
        const hitDistance = hits[0].distance - 0.40;
        if (hitDistance < minAllowedArm) {
          minAllowedArm = Math.max(this.minArmLength, hitDistance);
        }
      }
    }

    if (minAllowedArm < this.currentArmLength) {
      // Co ngắn tay cần camera tức thì khi chạm tường - Triệt tiêu 100% hiện tượng nhìn xuyên vào trong nhà
      this.currentArmLength = minAllowedArm;
    } else {
      this.currentArmLength = THREE.MathUtils.lerp(this.currentArmLength, this.targetArmLength, 0.1);
    }

    const actualTpsPos = this._actualTpsPos.copy(eyePos).addScaledVector(camDir, this.currentArmLength);

    // CHỐNG TRIỆT ĐỂ LỖI CAMERA CHÚC XUỐNG DƯỚI ĐẤT / NHÌN XUYÊN NỀN VÀ XUYÊN NHÀ:
    // Kiểm tra cao độ mặt đất / mặt sàn cầu tại vị trí camera TPS
    let groundAtCam = 0.0;
    if (this.worldManager && typeof this.worldManager.checkBridgeSurface === 'function') {
      const brCheck = this.worldManager.checkBridgeSurface(actualTpsPos.x, actualTpsPos.y, actualTpsPos.z);
      if (brCheck && brCheck.onBridge) {
        groundAtCam = Math.max(groundAtCam, brCheck.closestY);
      }
    }
    // Camera phải luôn cao hơn mặt đất tối thiểu 0.35m và cao hơn bàn chân nhân vật tối thiểu 0.25m
    const minCamY = Math.max(groundAtCam + 0.35, playerPos.y + 0.25, 0.35);
    if (actualTpsPos.y < minCamY) {
      actualTpsPos.y = minCamY;
    }

    // 7. Head-Bobbing & Nhịp thở người cầm máy trong FPS
    this.bobbingOffset.set(0, 0, 0);
    if (this.transitionProgress > 0.1) {
      this.bobbingTime += delta;
      // Nhịp thở nhẹ nhàng mô phỏng ngắm kính máy ảnh cơ
      const breath = Math.sin(this.bobbingTime * 2.0) * 0.015;
      this.bobbingOffset.y = breath * this.transitionProgress;
    }

    const actualFpsPos = this._actualFpsPos.copy(eyePos).add(this.bobbingOffset);

    // 8. Nội suy mượt mà vị trí Camera cuối cùng
    this.camera.position.lerpVectors(actualTpsPos, actualFpsPos, t);

    // 9. Điểm nhìn mục tiêu (LookAt)
    if (this.transitionProgress >= 0.95) {
      // Trong FPS: Hướng nhìn thẳng ra xa theo góc quay
      const forwardTarget = this._forwardTarget.copy(actualFpsPos).addScaledVector(camDir, -10.0);
      this.camera.lookAt(forwardTarget);
    } else {
      // Trong TPS: Nhìn vào điểm ngang tầm mắt/vai nhân vật
      const lookTarget = this._lookTarget.copy(eyePos);
      lookTarget.y -= 0.15;
      this.camera.lookAt(lookTarget);
    }
  }

  /**
   * Lấy trạng thái hiện tại của camera cho GameAPI
   */
  getStatus() {
    return {
      mode: this.mode,
      fov: Math.round(this.camera.fov),
      isAiming: (this.mode === 'FPS' || this.isRightMouseDown)
    };
  }

  /**
   * Lấy vector hướng nhìn hiện tại của camera
   */
  getDirection() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    return dir;
  }
}
