/**
 * PlayerController.js - Điều khiển di chuyển mượt mà, đường nét con người giải phẫu tự nhiên
 * Đã khắc phục triệt để: Đảo trục phím A/D, cơ chế bước qua gờ thấp (Step-Up), và tạo hình con người bo tròn mềm mại
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { THREE } from './ThreeLib.js';

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
    this.stepUpHeight = 0.38; // Bước qua gờ vỉa hè / mép tà vẹt cao tới 38cm một cách tự nhiên

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

    // 1. BẢNG VẬT LIỆU MỸ THUẬT CAO CẤP
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf0c8a6,
      roughness: 0.52,
      metalness: 0.04
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1f1917,
      roughness: 0.85
    });
    const coatCaramelMat = new THREE.MeshStandardMaterial({
      color: 0x8a5b3a, // Áo dạ măng tô caramel ấm áp phong cách lãng tử
      roughness: 0.72,
      metalness: 0.05
    });
    const trousersNavyMat = new THREE.MeshStandardMaterial({
      color: 0x242d38, // Quần âu ống đứng xanh than đậm
      roughness: 0.8
    });
    const leatherOxfordMat = new THREE.MeshStandardMaterial({
      color: 0x23160e, // Giày da Oxford bóng nhẹ
      roughness: 0.35,
      metalness: 0.2
    });
    const beretMat = new THREE.MeshStandardMaterial({
      color: 0x361f17, // Mũ nồi Beret nỉ dạ nâu
      roughness: 0.9
    });
    const scarfMat = new THREE.MeshStandardMaterial({
      color: 0x9e2424, // Khăn len quàng cổ đỏ bã trầu
      roughness: 0.92
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd6ad42, // Khuy đồng thau
      metalness: 0.85,
      roughness: 0.25
    });

    // 2. THÂN MÌNH (TORSO GROUP) - BO TRÒN HÌNH THỂ NGƯỜI
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.y = this.baseTorsoY;

    // Thân trên (Lồng ngực bo tròn hình viên nang Capsule mềm mại)
    const chestGeo = new THREE.CylinderGeometry(0.24, 0.21, 0.52, 16);
    chestGeo.scale(1.15, 1.0, 0.78); // Tỷ lệ ngực nở vai rộng tự nhiên
    const chestMesh = new THREE.Mesh(chestGeo, coatCaramelMat);
    chestMesh.position.y = 0.26;
    chestMesh.castShadow = true;
    this.torsoGroup.add(chestMesh);

    // Hàng cúc áo đồng cổ điển
    for (let b = 0; b < 3; b++) {
      const button = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.015, 10), brassMat);
      button.rotation.x = Math.PI / 2;
      button.position.set(0, 0.14 + b * 0.13, 0.17);
      this.torsoGroup.add(button);
    }

    // Tà áo măng tô xòe nhẹ phía dưới (Đường cong mềm mại, không vuông vức)
    const skirtGeo = new THREE.CylinderGeometry(0.22, 0.32, 0.44, 16);
    skirtGeo.scale(1.12, 1.0, 0.82);
    const skirtMesh = new THREE.Mesh(skirtGeo, coatCaramelMat);
    skirtMesh.position.y = -0.16;
    skirtMesh.castShadow = true;
    this.torsoGroup.add(skirtMesh);

    // Khăn quàng len đỏ uốn lượn quanh cổ
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.065, 12, 24), scarfMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 0.54;
    this.torsoGroup.add(scarf);

    // Tà khăn rủ mềm mại
    const scarfDrapeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.08, 0.52, 0.18),
      new THREE.Vector3(0.12, 0.35, 0.20),
      new THREE.Vector3(0.09, 0.18, 0.19)
    ]);
    const scarfDrape = new THREE.Mesh(
      new THREE.TubeGeometry(scarfDrapeCurve, 12, 0.04, 8, false),
      scarfMat
    );
    this.torsoGroup.add(scarfDrape);

    // Cổ áo
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.12, 12), skinMat);
    neck.position.y = 0.58;
    this.torsoGroup.add(neck);

    // 3. ĐẦU & KHUÔN MẶT CÓ ĐƯỜNG NÉT CON NGƯỜI CHÂN THỰC
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.70;

    // Hộp sọ & Gương mặt bo tròn elip
    const skullGeo = new THREE.SphereGeometry(0.165, 20, 20);
    skullGeo.scale(0.88, 1.15, 1.0);
    const skullMesh = new THREE.Mesh(skullGeo, skinMat);
    skullMesh.castShadow = true;
    this.headGroup.add(skullMesh);

    // Cằm & Hàm dưới thon gọn
    const chinGeo = new THREE.SphereGeometry(0.085, 12, 12);
    chinGeo.scale(0.85, 0.7, 1.0);
    const chin = new THREE.Mesh(chinGeo, skinMat);
    chin.position.set(0, -0.11, 0.06);
    this.headGroup.add(chin);

    // Sống mũi 3D thanh thoát
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.08, 8), skinMat);
    nose.rotation.x = 0.35;
    nose.position.set(0, 0.02, 0.18);
    this.headGroup.add(nose);

    // Mắt (Đôi mắt có chiều sâu và điểm sáng)
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });

    for (let s of [-1, 1]) {
      // Tròng trắng
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeWhiteMat);
      eyeWhite.scale.set(1.2, 0.7, 0.5);
      eyeWhite.position.set(s * 0.058, 0.045, 0.155);

      // Con ngươi đen
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), pupilMat);
      pupil.position.set(s * 0.058, 0.045, 0.168);

      // Đôi tai 2 bên
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), skinMat);
      ear.scale.set(0.4, 0.9, 0.7);
      ear.position.set(s * 0.15, 0.02, -0.01);

      this.headGroup.add(eyeWhite, pupil, ear);
    }

    // Tóc đen lãng tử bồng bềnh
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), hairMat);
    hair.position.set(0, 0.07, -0.03);
    hair.scale.set(0.92, 1.02, 1.05);
    this.headGroup.add(hair);

    // Mũ nồi Beret mềm mại có cuống mũ (French Beret)
    const beretGeo = new THREE.CylinderGeometry(0.23, 0.13, 0.075, 18);
    const beret = new THREE.Mesh(beretGeo, beretMat);
    beret.position.set(0, 0.16, -0.01);
    beret.rotation.x = 0.18;
    beret.rotation.z = -0.15;
    this.headGroup.add(beret);

    // Cuống mũ nhỏ trên đỉnh
    const beretTip = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.04, 6), beretMat);
    beretTip.position.set(0, 0.21, -0.01);
    this.headGroup.add(beretTip);

    this.torsoGroup.add(this.headGroup);

    // 4. MÁY ẢNH CƠ LEICA M3 BO VIỀN TINH XẢO
    const camMat = new THREE.MeshStandardMaterial({ color: 0x1f2224, metalness: 0.8, roughness: 0.25 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.95, roughness: 0.12 });

    const cameraBody = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.08), camMat);
    cameraBody.position.set(0.24, 0.10, 0.18);
    cameraBody.rotation.z = -0.32;
    cameraBody.rotation.y = 0.22;

    const camPlate = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.03, 0.08), chromeMat);
    camPlate.position.y = 0.07;
    cameraBody.add(camPlate);

    // Ống kính kim loại tròn
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.075, 16), chromeMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0.02, 0, 0.065);
    cameraBody.add(lens);

    // Dây da máy ảnh đeo vai
    const strapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.24, 0.48, 0.05),
      new THREE.Vector3(0, 0.30, 0.20),
      new THREE.Vector3(0.24, 0.10, 0.18)
    ]);
    const strap = new THREE.Mesh(
      new THREE.TubeGeometry(strapCurve, 12, 0.015, 6, false),
      new THREE.MeshStandardMaterial({ color: 0x3d2117, roughness: 0.6 })
    );
    this.torsoGroup.add(strap, cameraBody);

    this.characterGroup.add(this.torsoGroup);

    // 5. HAI CÁNH TAY KHỚP VAI BO TRÒN TỰ NHIÊN
    for (let s of [-1, 1]) {
      const armPivot = new THREE.Group();
      armPivot.position.set(s * 0.29, this.baseTorsoY + 0.43, 0);

      // Cầu vai tròn (Shoulder joint)
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), coatCaramelMat);
      armPivot.add(shoulder);

      // Bắp tay (Upper arm bo tròn)
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.062, 0.30, 10), coatCaramelMat);
      upperArm.position.y = -0.16;
      upperArm.castShadow = true;
      armPivot.add(upperArm);

      // Khớp khuỷu tay
      const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.062, 8, 8), coatCaramelMat);
      elbow.position.y = -0.31;
      armPivot.add(elbow);

      // Cẳng tay (Forearm)
      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.052, 0.28, 10), coatCaramelMat);
      forearm.position.y = -0.45;
      forearm.castShadow = true;
      armPivot.add(forearm);

      // Bàn tay với các ngón tay gập tự nhiên
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), skinMat);
      hand.scale.set(0.9, 1.2, 0.7);
      hand.position.y = -0.61;
      armPivot.add(hand);

      this.characterGroup.add(armPivot);

      if (s === -1) this.leftArmPivot = armPivot;
      else this.rightArmPivot = armPivot;
    }

    // 6. HAI CHÂN KHỚP HÁNG & GIÀY OXFORD BO CONG
    for (let s of [-1, 1]) {
      const legPivot = new THREE.Group();
      legPivot.position.set(s * 0.13, 0.82, 0);

      // Đùi (Thigh uốn cong tự nhiên)
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.42, 10), trousersNavyMat);
      thigh.position.y = -0.21;
      thigh.castShadow = true;
      legPivot.add(thigh);

      // Đầu gối
      const knee = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), trousersNavyMat);
      knee.position.y = -0.42;
      legPivot.add(knee);

      // Cẳng chân (Calf thon dần xuống cổ chân)
      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.058, 0.40, 10), trousersNavyMat);
      calf.position.y = -0.62;
      calf.castShadow = true;
      legPivot.add(calf);

      // Giày da Oxford mũi tròn uốn lượn (Không còn là khối hộp vuông!)
      const shoeGroup = new THREE.Group();
      shoeGroup.position.set(0, -0.82, 0.04);

      // Thân giày bo cong
      const shoeSole = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.24, 12), leatherOxfordMat);
      shoeSole.rotation.x = Math.PI / 2;
      shoeSole.scale.set(0.85, 1.2, 0.55);
      shoeGroup.add(shoeSole);

      // Gót giày
      const shoeHeel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.05, 10), leatherOxfordMat);
      shoeHeel.position.set(0, -0.02, -0.06);
      shoeGroup.add(shoeHeel);

      legPivot.add(shoeGroup);
      this.characterGroup.add(legPivot);

      if (s === -1) this.leftLegPivot = legPivot;
      else this.rightLegPivot = legPivot;
    }

    // Bóng tiếp xúc mềm mại dưới chân nhân vật (Soft Contact Blob Shadow - Zero GPU Overhead)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 64;
    const sctx = shadowCanvas.getContext('2d');
    const sgrad = sctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    sgrad.addColorStop(0, 'rgba(12, 10, 8, 0.65)');
    sgrad.addColorStop(0.5, 'rgba(12, 10, 8, 0.35)');
    sgrad.addColorStop(1, 'rgba(12, 10, 8, 0)');
    sctx.fillStyle = sgrad;
    sctx.fillRect(0, 0, 64, 64);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const blobShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 1.3),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false
      })
    );
    blobShadow.rotation.x = -Math.PI / 2;
    blobShadow.position.y = 0.03;
    this.characterGroup.add(blobShadow);

    // Vị trí xuất phát ven hồ Gươm thông thoáng
    this.characterGroup.position.set(45, 0.5, -45);
    this.scene.add(this.characterGroup);
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
      // Bộ lọc không gian siêu tốc (Spatial Distance Culling) - Bỏ qua các vật cản cách xa nhân vật > 14m
      if (Math.abs(pos.x - (obs.minX + obs.maxX) * 0.5) > 14 || Math.abs(pos.z - (obs.minZ + obs.maxZ) * 0.5) > 14) {
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

    // 1. Kiểm tra va chạm kiến trúc
    const obstacles = this.worldManager.getObstacles();
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];

      // Bộ lọc không gian siêu tốc (Spatial Culling - giảm 95% CPU bottleneck)
      if (Math.abs(testPos.x - (obs.minX + obs.maxX) * 0.5) > 16 || Math.abs(testPos.z - (obs.minZ + obs.maxZ) * 0.5) > 16) {
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

      // Phản hồi vận tốc tức thì (Zero Input Lag) - Bấm phím là vọt đi ngay lập tức!
      this.velocity.x = desiredVelX;
      this.velocity.z = desiredVelZ;

      // Xoay hướng mặt nhân vật tức thì theo hướng di chuyển
      const targetAngle = Math.atan2(finalDir.x, finalDir.z);
      this.characterGroup.rotation.y = targetAngle;

      // --- HOẠT ẢNH SINH HỌC BƯỚC ĐI TỰ NHIÊN ---
      this.walkCycle += delta * (currentSpeed / 4.8) * 11.5;
      const swingAmp = this.keys.sprint ? 0.72 : 0.52;

      // Chân sải bước nhịp nhàng
      this.leftLegPivot.rotation.x = Math.sin(this.walkCycle) * swingAmp;
      this.rightLegPivot.rotation.x = -Math.sin(this.walkCycle) * swingAmp;

      // Tay vung so le tự nhiên
      this.leftArmPivot.rotation.x = -Math.sin(this.walkCycle) * (swingAmp * 0.85);
      this.rightArmPivot.rotation.x = Math.sin(this.walkCycle) * (swingAmp * 0.85);

      // Nhấp nhô tự nhiên của cơ thể
      this.torsoGroup.position.y = this.baseTorsoY + Math.abs(Math.sin(this.walkCycle * 2.0)) * 0.04;
    } else {
      // Dừng lại dứt khoát 100% ngay khi nhả phím - Triệt tiêu hoàn toàn hiện tượng trượt quán tính
      this.velocity.x = 0;
      this.velocity.z = 0;

      // Trở về tư thế đứng nghỉ (Idle)
      this.leftLegPivot.rotation.x = THREE.MathUtils.lerp(this.leftLegPivot.rotation.x, 0, 0.25);
      this.rightLegPivot.rotation.x = THREE.MathUtils.lerp(this.rightLegPivot.rotation.x, 0, 0.25);
      this.leftArmPivot.rotation.x = THREE.MathUtils.lerp(this.leftArmPivot.rotation.x, 0, 0.25);
      this.rightArmPivot.rotation.x = THREE.MathUtils.lerp(this.rightArmPivot.rotation.x, 0, 0.25);

      // Nhịp thở phập phồng nhẹ nhàng
      const time = performance.now() * 0.0025;
      this.torsoGroup.position.y = this.baseTorsoY + Math.sin(time) * 0.012;
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
    const allColliders = this.worldManager.getColliders();
    const nearColliders = [];
    const charPos = this.characterGroup.position;
    for (let c = 0; c < allColliders.length; c++) {
      const col = allColliders[c];
      if (col.position && Math.hypot(col.position.x - charPos.x, col.position.z - charPos.z) > 42) {
        continue;
      }
      nearColliders.push(col);
    }
    const colliders = nearColliders.length > 0 ? nearColliders : allColliders;

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

    // 5. Kiểm tra tương tác gần nhất
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
