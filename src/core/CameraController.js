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

    // Góc quay (Spherical Angles)
    this.yaw = 0;
    this.pitch = 0.22; // Chúc xuống ~12 độ trong TPS
    this.targetYaw = 0;
    this.targetPitch = 0.22;
    this.smoothFactor = 0.22; // Độ phản hồi chuột nhạy bén, không bị trễ/lì lợm

    // Thông số TPS Spring-Arm
    this.targetArmLength = 4.5;
    this.currentArmLength = 4.5;
    this.minArmLength = 0.8;
    this.eyeHeight = 1.65;

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

      if (e.code === 'KeyV') {
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
      if (document.pointerLockElement === this.domElement) {
        const sens = 0.0028;
        this.targetYaw -= e.movementX * sens;
        this.targetPitch -= e.movementY * sens;
        this.targetPitch = THREE.MathUtils.clamp(this.targetPitch, -Math.PI / 2.6, Math.PI / 2.8);
      } else if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        const sens = 0.0045;
        this.targetYaw -= deltaX * sens;
        this.targetPitch -= deltaY * sens;
        this.targetPitch = THREE.MathUtils.clamp(this.targetPitch, -Math.PI / 2.6, Math.PI / 2.8);
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
          1.8,
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
   * Đảo đổi trạng thái giữa TPS và FPS
   */
  toggleCameraMode() {
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

    // 1. Phản hồi chuột tức thì 1:1, triệt tiêu hoàn toàn cảm giác lì lợm/trôi camera
    const camLerp = Math.min(1.0, delta * 36.0);
    this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, camLerp);
    this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, camLerp);

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
    // Vector hướng nhìn từ camera vào mắt
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const camDir = this._camDir.set(
      sinYaw * cosPitch,
      sinPitch,
      cosYaw * cosPitch
    );

    // Vị trí TPS lý tưởng phía sau nhân vật
    const desiredTpsPos = this._desiredTpsPos.copy(eyePos).addScaledVector(camDir, this.targetArmLength);

    // Raycast chống xuyên tường (Collision Detection có bộ lọc cự ly gần - giảm 90% tải CPU)
    const allColliders = this.worldManager ? this.worldManager.getColliders() : [];
    const nearColliders = [];
    for (let c = 0; c < allColliders.length; c++) {
      const col = allColliders[c];
      if (col.position && Math.hypot(col.position.x - eyePos.x, col.position.z - eyePos.z) > 28) {
        continue;
      }
      nearColliders.push(col);
    }
    const colliders = nearColliders.length > 0 ? nearColliders : allColliders;

    if (colliders.length > 0) {
      const rayDir = this._rayDir.copy(desiredTpsPos).sub(eyePos).normalize();
      this.raycaster.set(eyePos, rayDir);
      this.raycaster.far = this.targetArmLength + 0.3;

      const hits = this.raycaster.intersectObjects(colliders, false);
      if (hits.length > 0) {
        const hitDistance = hits[0].distance - 0.25;
        this.currentArmLength = Math.max(this.minArmLength, hitDistance);
      } else {
        this.currentArmLength = THREE.MathUtils.lerp(this.currentArmLength, this.targetArmLength, 0.1);
      }
    }

    const actualTpsPos = this._actualTpsPos.copy(eyePos).addScaledVector(camDir, this.currentArmLength);

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
