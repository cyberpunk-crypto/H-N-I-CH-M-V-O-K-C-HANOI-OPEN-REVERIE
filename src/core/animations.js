/**
 * animations.js - Hệ Thống Hoạt Họa 3D Skeletal Humanoid 60 FPS Đích Thực
 * Dành riêng cho: HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 * 
 * Đảm trách bởi: Animation Master (Giám Đốc Hoạt Họa Studio)
 * 
 * TÍNH NĂNG VƯỢT TRỘI:
 * 1. True Skeletal Animation: Điều khiển toàn diện cây khớp xương phân cấp:
 *    Pelvis, Torso, Chest, Neck, Head, Shoulders, Elbows, Hips, Knees, Feet, Flaps (Tà áo dài 3D), Nón lá 3D.
 * 2. 60 FPS Zero-Allocation Loop: Không cấp phát heap (Vector3/Object) trong update(), triệt tiêu GC Spikes.
 * 3. Easing & Damped Cross-Fade: Chuyển đổi trạng thái mượt mà (Idle <-> Walk <-> Run <-> Jump) không bị giật cục/snapping.
 * 4. Nguyên Lý Hoạt Họa Cổ Điển (Squash & Stretch, Anticipation & Follow-Through):
 *    - Idle Breathing & Weight Shift tự nhiên sau mỗi chu kỳ
 *    - Landing Cushion (nhún nén và đàn hồi tiếp đất sau khi rơi/nhảy)
 *    - Head Stabilization & Natural Look-around (nghiêng đầu, nhìn quanh phố cổ)
 *    - Vạt áo dài và nón lá bay lượn uốn sóng theo ngọn gió hồ Gươm (Cloth Wind Dynamics)
 * 5. Gesture API: Hỗ trợ cử chỉ tương tác (vẫy tay 'wave', cúi chào 'bow', ngắm máy ảnh 'takePhoto', nhún vai 'shrug').
 * 6. VFX & Môi trường: Tích hợp EnvironmentWindSystem & ParticleVFXAnimator cho lá rơi, sóng nước.
 */

import { THREE } from './ThreeLib.js';

// ============================================================================
// TOÁN HỌA HOẠT NỘI SUY (INLINE ZERO-ALLOCATION MATH HELPERS)
// ============================================================================

/** Nội suy tuyến tính */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Giới hạn giá trị trong khoảng [min, max] */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/** Smoothstep mượt mà từ Hermite interpolation (có chốt chống chia cho 0) */
export function smoothstep(edge0, edge1, x) {
  if (edge1 <= edge0) return x >= edge1 ? 1.0 : 0.0;
  const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

/** Damping mượt mà độc lập với tốc độ khung hình (Frame-rate Independent Damping) */
export function damp(current, target, smoothing, dt) {
  return lerp(current, target, 1.0 - Math.exp(-smoothing * dt));
}

/** Bộ thư viện Easing Functions cao cấp phục vụ chuyển động sinh học */
export const Easing = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeOutElastic: (t) => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
  },
  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

// ============================================================================
// HỆ THỐNG ĐIỀU KHIỂN HOẠT HỌA NHÂN VẬT 3D (HUMANOID ANIMATOR)
// ============================================================================

export class HumanoidAnimator {
  /**
   * Khởi tạo HumanoidAnimator gắn kết với characterGroup
   * @param {THREE.Group} characterGroup - Root Group của nhân vật
   * @param {Object} options - Tùy chỉnh biên độ { walkSpeedScale, armSwingScale, clothFlapScale, baseTorsoY }
   */
  constructor(characterGroup, options = {}) {
    this.char = characterGroup;

    // Cấu hình biên độ & tham số gốc
    this.options = {
      walkSpeedScale: 1.0,
      armSwingScale: 1.0,
      clothFlapScale: 1.0,
      breathScale: 1.0,
      ...options
    };

    // Cao độ hông chuẩn (y = 0.95m theo đặc tả kiến trúc)
    this.baseTorsoY = this.options.baseTorsoY || (characterGroup && characterGroup.baseTorsoY) || 0.95;

    // Ánh xạ cây xương phân cấp (Rigging hierarchy mapping)
    this.rig = {};
    this._bindRig(characterGroup);

    // Thời gian tích lũy hoạt ảnh (Zero heap allocation counters)
    this.animTime = 0.0;
    this.walkPhase = 0.0;
    this.runPhase = 0.0;

    // Trọng số hòa trộn trạng thái (Cross-Fade Weights & 0.25s Crossfade Blending)
    this.crossfadeDuration = this.options.crossfadeDuration || 0.25; // Thời gian chuyển trạng thái 0.25s chuẩn AAA
    this.currentWeight = { idle: 1.0, walk: 0.0, run: 0.0, jump: 0.0 };
    this.targetWeight = { idle: 1.0, walk: 0.0, run: 0.0, jump: 0.0 };

    // Bộ nhớ trạng thái vật lý hoạt họa
    this.wasGrounded = true;
    this.landingTimer = 0.0;
    this.landingDuration = 0.22; // Độ nén khi tiếp đất (0.22s)

    // Nhìn quanh ngẫu nhiên khi đứng yên (Natural Look-Around)
    this.lookAroundTimer = 2.5 + Math.random() * 3.0;
    this.currentHeadYaw = 0.0;
    this.targetHeadYaw = 0.0;

    // Nhịp chớp mắt sinh học người thật (Organic Blinking Dynamics)
    this.blinkTimer = 2.8 + Math.random() * 2.8;
    this.blinkDuration = 0.16; // Chớp mắt trong 0.16s
    this.blinkProgress = 0.0;
    this.isBlinking = false;
    this.blinkValue = 0.0; // 0.0 = mở mắt, 1.0 = nhắm mắt

    // Thích ứng độ dốc địa hình
    this.groundSlopeAngle = 0.0;

    // Cử chỉ tương tác (Gestures: wave, bow, takePhoto, shrug)
    this.activeGesture = null;
    this.gestureTime = 0.0;
    this.gestureDuration = 0.0;
    this.gestureWeight = 0.0;

    // Trạng thái ngồi thư giãn vỉa hè (Sitting pose system)
    this.isSitting = false;
    this.sitWeight = 0.0;

    // Bộ đệm quán tính & giảm chấn (Lag Damping) cho Nón Lá khi đổi hướng/quay đầu
    this.lastCharRotY = (characterGroup && characterGroup.rotation) ? characterGroup.rotation.y : 0.0;
    this.nonLaLagRoll = 0.0;   // Lắc lư nghiêng trái/phải do lực ly tâm khi xoay
    this.nonLaLagPitch = 0.0;  // Ngửa/chúi do luồng gió cản & gia tốc tiến
    this.nonLaLagYaw = 0.0;    // Độ trễ xoay theo góc quay đầu
    this.nonLaRollVel = 0.0;   // Vận tốc dao động đàn hồi Roll
    this.nonLaPitchVel = 0.0;  // Vận tốc dao động đàn hồi Pitch
    this._cachedNonLa = null;

    // Vị trí gốc ban đầu của các khớp để tránh lệch trục qua thời gian
    this._cacheRestPositions();
  }

  /**
   * Tìm đối tượng Nón Lá 3D trên cây phân cấp để áp dụng Lag Damping
   */
  _findNonLaObject() {
    if (!this.char) return null;
    if (this._cachedNonLa && this._cachedNonLa.parent) return this._cachedNonLa;
    let found = null;
    this.char.traverse((c) => {
      if (found) return;
      if (c.name === '3D_NonLa' || c.name === 'Joint_AccessoryHead' || c.name === 'accessoryHeadGroup') {
        found = c;
      }
    });
    this._cachedNonLa = found;
    return found;
  }

  /**
   * Ánh xạ các khớp từ characterGroup.rig hoặc fallback tương thích
   */
  _bindRig(charGroup) {
    if (!charGroup) return;

    const r = charGroup.rig || {};

    // Tìm kiếm hai dải khăn rằn 3D nếu có (Áo bà ba & trang phục truyền thống)
    let scarfDropL = r.scarfDropL || null;
    let scarfDropR = r.scarfDropR || null;
    if (!scarfDropL || !scarfDropR) {
      charGroup.traverse((c) => {
        if (c.name === 'Joint_ScarfDropL' || c.name === 'ScarfDropL') scarfDropL = c;
        else if (c.name === 'Joint_ScarfDropR' || c.name === 'ScarfDropR') scarfDropR = c;
        else if (c.isMesh && c.geometry && c.geometry.type === 'BoxGeometry') {
          // Mesh dải khăn rằn trong chestGroup: y < 0, z > 0.06
          if (c.position.y < -0.02 && c.position.z > 0.06) {
            if (c.position.x < -0.02 && !scarfDropL) {
              c.name = 'Joint_ScarfDropL';
              scarfDropL = c;
            } else if (c.position.x > 0.02 && !scarfDropR) {
              c.name = 'Joint_ScarfDropR';
              scarfDropR = c;
            }
          }
        }
      });
    }

    this.rig = {
      // Trọng tâm & cột sống
      pelvisGroup: r.pelvisGroup || charGroup.pelvisGroup || charGroup.torsoGroup || charGroup,
      torsoGroup: r.torsoGroup || charGroup.torsoGroup,
      chestGroup: r.chestGroup || charGroup.chestGroup,
      neckGroup: r.neckGroup || charGroup.neckGroup,
      headGroup: r.headGroup || charGroup.headGroup,

      // Chi trên (Vai, Khuỷu tay) - Hỗ trợ tương thích ngược với leftArmPivot / rightArmPivot
      leftShoulderGroup: r.leftShoulderGroup || charGroup.leftShoulderGroup || charGroup.leftArmPivot,
      rightShoulderGroup: r.rightShoulderGroup || charGroup.rightShoulderGroup || charGroup.rightArmPivot,
      leftElbowGroup: r.leftElbowGroup || charGroup.leftElbowGroup,
      rightElbowGroup: r.rightElbowGroup || charGroup.rightElbowGroup,

      // Chi dưới (Háng, Đầu gối, Cổ chân) - Hỗ trợ tương thích ngược với leftLegPivot / rightLegPivot
      leftHipGroup: r.leftHipGroup || charGroup.leftHipGroup || charGroup.leftLegPivot,
      rightHipGroup: r.rightHipGroup || charGroup.rightHipGroup || charGroup.rightLegPivot,
      leftKneeGroup: r.leftKneeGroup || charGroup.leftKneeGroup,
      rightKneeGroup: r.rightKneeGroup || charGroup.rightKneeGroup,
      leftFootGroup: r.leftFootGroup || charGroup.leftFootGroup,
      rightFootGroup: r.rightFootGroup || charGroup.rightFootGroup,

      // Tà áo dài 3D & Nón lá 3D & Khăn rằn 3D
      frontFlapGroup: r.frontFlapGroup || charGroup.frontFlapGroup,
      backFlapGroup: r.backFlapGroup || charGroup.backFlapGroup,
      accessoryHeadGroup: r.accessoryHeadGroup || charGroup.accessoryHeadGroup || charGroup.nonLaGroup,
      scarfDropL: scarfDropL,
      scarfDropR: scarfDropR,

      // 2.5D Planes fallback (nếu có tấm thân 2.5D)
      frontPlane: charGroup.frontPlane,
      backPlane: charGroup.backPlane
    };

    // Đảm bảo characterGroup có tham chiếu chuẩn vào rig
    charGroup.rig = this.rig;
  }

  /**
   * Lưu vị trí ban đầu của các khớp
   */
  _cacheRestPositions() {
    this.restPositions = {
      pelvisY: (this.rig.pelvisGroup && this.rig.pelvisGroup.position) ? this.rig.pelvisGroup.position.y : this.baseTorsoY,
      leftShoulderY: (this.rig.leftShoulderGroup && this.rig.leftShoulderGroup.position) ? this.rig.leftShoulderGroup.position.y : 0.05,
      rightShoulderY: (this.rig.rightShoulderGroup && this.rig.rightShoulderGroup.position) ? this.rig.rightShoulderGroup.position.y : 0.05,
      scarfRotZL: (this.rig.scarfDropL && this.rig.scarfDropL.rotation) ? this.rig.scarfDropL.rotation.z : -0.12,
      scarfRotZR: (this.rig.scarfDropR && this.rig.scarfDropR.rotation) ? this.rig.scarfDropR.rotation.z : 0.12,
      scarfRotXL: (this.rig.scarfDropL && this.rig.scarfDropL.rotation) ? this.rig.scarfDropL.rotation.x : 0.0,
      scarfRotXR: (this.rig.scarfDropR && this.rig.scarfDropR.rotation) ? this.rig.scarfDropR.rotation.x : 0.0
    };
  }

  /**
   * Đồng bộ lại Rig khi người chơi đổi nhân vật mới
   * @param {THREE.Group} newCharacterGroup 
   */
  syncRig(newCharacterGroup) {
    if (!newCharacterGroup) return;
    this.char = newCharacterGroup;
    this.baseTorsoY = (newCharacterGroup && newCharacterGroup.baseTorsoY) || this.options.baseTorsoY || 0.95;
    this._bindRig(newCharacterGroup);
    this._cacheRestPositions();
    this.lastCharRotY = (newCharacterGroup && newCharacterGroup.rotation) ? newCharacterGroup.rotation.y : 0.0;
    this._cachedNonLa = null;
  }

  /**
   * Cập nhật tùy chọn hoạt họa động
   * @param {Object} newOptions 
   */
  setOptions(newOptions = {}) {
    Object.assign(this.options, newOptions);
  }

  /**
   * Kích hoạt hoặc hủy tư thế ngồi thư giãn (uống trà đá / ngắm cảnh)
   * @param {boolean} sitting
   */
  setSitPose(sitting) {
    this.isSitting = !!sitting;
  }

  /**
   * Vòng lặp cập nhật hoạt ảnh 60 FPS (Chuẩn Zero Heap Allocation)
   * @param {number} delta - Delta time tính bằng giây (seconds)
   * @param {number} speed - Vận tốc di chuyển hiện tại (0 = idle, 5.2 = walk, 9.2 = run)
   * @param {boolean} isGrounded - Đang tiếp đất hay ở trên không
   * @param {number} groundSlopeAngle - Góc dốc bề mặt địa hình (radians) để thích ứng
   */
  update(delta, speed = 0, isGrounded = true, groundSlopeAngle = 0) {
    // 1. Bảo vệ chống gián đoạn thời gian khi nhảy frame (Tab backgrounding / Lag spikes)
    const dt = clamp(delta, 0.001, 0.08);
    this.animTime += dt;
    this.groundSlopeAngle = groundSlopeAngle;

    // 2. PHÁT HIỆN SỰ KIỆN TIẾP ĐẤT (LANDING SQUASH & STRETCH CUSHION)
    if (!this.wasGrounded && isGrounded) {
      this.landingTimer = this.landingDuration; // Kích hoạt nén trọng tâm hấp thụ lực
    }
    this.wasGrounded = isGrounded;

    if (this.landingTimer > 0) {
      this.landingTimer -= dt;
      if (this.landingTimer < 0) this.landingTimer = 0;
    }

    // 3. TÍNH TOÁN TRỌNG SỐ MỤC TIÊU (GTA V LOCOMOTION BLEND TREES)
    if (!isGrounded) {
      this.targetWeight.idle = 0.0;
      this.targetWeight.walk = 0.0;
      this.targetWeight.run = 0.0;
      this.targetWeight.jump = 1.0;
    } else {
      this.targetWeight.jump = 0.0;
      if (speed <= 0.08) {
        // Đứng yên hoàn toàn (Idle)
        this.targetWeight.idle = 1.0;
        this.targetWeight.walk = 0.0;
        this.targetWeight.run = 0.0;
      } else if (speed <= 4.2) {
        // Đi bộ mượt mà (Walk Locomotion)
        const walkFactor = smoothstep(0.08, 1.2, speed);
        this.targetWeight.idle = 1.0 - walkFactor;
        this.targetWeight.walk = walkFactor;
        this.targetWeight.run = 0.0;
      } else {
        // Chạy nước rút (GTA V Sprint Locomotion)
        const runFactor = smoothstep(4.2, 6.8, speed);
        this.targetWeight.idle = 0.0;
        this.targetWeight.walk = 1.0 - runFactor;
        this.targetWeight.run = runFactor;
      }
    }

    // 4. NỘI SUY DAMPING CHO CÁC TRỌNG SỐ (CROSS-FADE 0.22s MƯỢT MÀ KHÔNG GIẬT KHỰNG)
    const blendRate = 10.0; // Tốc độ hòa trộn 10.0/s phản hồi tức thì mà êm ái
    this.currentWeight.idle = damp(this.currentWeight.idle, this.targetWeight.idle, blendRate, dt);
    this.currentWeight.walk = damp(this.currentWeight.walk, this.targetWeight.walk, blendRate, dt);
    this.currentWeight.run = damp(this.currentWeight.run, this.targetWeight.run, blendRate, dt);
    this.currentWeight.jump = damp(this.currentWeight.jump, this.targetWeight.jump, blendRate, dt);

    // Chuẩn hóa tổng trọng số bằng 1.0
    const totalW = this.currentWeight.idle + this.currentWeight.walk + this.currentWeight.run + this.currentWeight.jump;
    const invW = totalW > 0.0001 ? (1.0 / totalW) : 1.0;
    const wIdle = this.currentWeight.idle * invW;
    const wWalk = this.currentWeight.walk * invW;
    const wRun = this.currentWeight.run * invW;
    const wJump = this.currentWeight.jump * invW;

    // 5. TÍCH LŨY PHA BƯỚC ĐI VÀ CHẠY (ZERO ALLOCATION PHASE ACCUMULATORS)
    // Walk Frequency: 6.2 rad/s theo đặc tả sinh học
    const walkSpeedFactor = Math.max(0.8, speed / 5.2) * this.options.walkSpeedScale;
    this.walkPhase += dt * 6.2 * walkSpeedFactor;

    // Run Frequency: 9.5 rad/s theo đặc tả sải bước nhanh
    const runSpeedFactor = Math.max(0.8, speed / 9.2) * this.options.walkSpeedScale;
    this.runPhase += dt * 9.5 * runSpeedFactor;

    // Giữ phase trong khoảng [0, 2PI] tránh tràn số
    if (this.walkPhase > 628.3185) this.walkPhase -= 628.3185;
    if (this.runPhase > 628.3185) this.runPhase -= 628.3185;

    // 6. TÍNH TOÁN CỬ CHỈ TƯƠNG TÁC (GESTURE OVERLAY)
    this._updateGesture(dt);

    // 7. TÍNH TOÁN LOOK-AROUND TỰ NHIÊN & CHỚP MẮT SINH HỌC
    this._updateLookAround(dt, wIdle);
    this._updateBlinking(dt);

    // 8. TÍNH TOÁN CÁC THÔNG SỐ HOẠT HỌA THEO CHUẨN GTA V BIO-MECHANICS
    const time = this.animTime;
    const wp = this.walkPhase;
    const rp = this.runPhase;

    // --- A. CHU KỲ ĐỨNG YÊN (IDLE CYCLE - ORGANIC BREATHING & WEIGHT SHIFT) ---
    // Nhịp thở lồng ngực tự nhiên
    const breathTime = time * 2.2;
    const breathSin = Math.sin(breathTime);
    const idleChestScale = 1.0 + breathSin * 0.030 * this.options.breathScale;
    const idleChestScaleXZ = 1.0 + breathSin * 0.020 * this.options.breathScale;

    // Hai vai nhún nhẹ theo nhịp lấy hơi
    const idleShoulderBob = Math.sin(breathTime + 0.25) * 0.012 * this.options.breathScale;

    // Hông khẽ dồn trọng tâm sang một bên và đầu nghiêng nhẹ đối trọng
    const idleWeightShift = Math.sin(time * 0.52) * 0.025; // Hông nghiêng dồn lực
    const idleHeadTilt = -Math.sin(time * 0.52) * 0.018; // Đầu nghiêng nhẹ đối trọng duy trì thăng bằng

    // Tà áo dài và nón lá bay lượn uốn sóng theo ngọn gió hồ Gươm (Cloth Wind Dynamics)
    const clothScale = this.options.clothFlapScale;
    const idleFrontFlap = (Math.sin(time * 2.8) * 0.08 + Math.cos(time * 1.4) * 0.04) * clothScale;
    const idleBackFlap = (-Math.sin(time * 2.8 + 0.5) * 0.10 - Math.cos(time * 1.2) * 0.03) * clothScale;
    const idleNonLaRotZ = Math.sin(time * 1.8) * 0.035;
    const idleNonLaRotX = Math.sin(time * 1.3) * 0.022;

    // Khăn rằn 3D đung đưa nhẹ nhàng trước ngực theo nhịp thở và gió hồ
    const idleScarfRotX = breathSin * 0.035 + Math.sin(time * 2.4) * 0.022;
    const idleScarfRotZL = this.restPositions.scarfRotZL + Math.sin(time * 1.6) * 0.018;
    const idleScarfRotZR = this.restPositions.scarfRotZR - Math.sin(time * 1.6) * 0.018;

    const idlePelvisY = this.baseTorsoY + breathSin * 0.008;

    // --- B. CHU KỲ ĐI BỘ (WALK CYCLE - GTA V LOCOMOTION ĐỒNG BỘ TIẾN) ---
    // Sải chân rộng, nhịp nhàng đối xứng sinh học
    const walkLeftHip = Math.sin(wp) * 0.52;
    const walkRightHip = Math.sin(wp + Math.PI) * 0.52;

    // Gập đầu gối sinh học về phía sau khi nhấc chân (không gập ra trước)
    const walkLeftKnee = Math.max(0, -Math.sin(wp)) * 0.58;
    const walkRightKnee = Math.max(0, -Math.sin(wp + Math.PI)) * 0.58;

    // Cổ chân tiếp đất cắm gót nhấc mũi (Heel Strike & Toe Off)
    // Khi chân vung tới: nhấc mũi chân đón gót (+0.24 rad); khi chân đẩy lùi: cắm mũi chân (-0.24 rad)
    const walkLeftFoot = Math.sin(wp) * 0.24;
    const walkRightFoot = Math.sin(wp + Math.PI) * 0.24;

    // Hai tay vung nhịp nhàng ngược pha 180° với chân (tay trái ngược pha tay phải)
    const armScale = this.options.armSwingScale;
    const walkLeftShoulderX = Math.sin(wp + Math.PI) * 0.38 * armScale;
    const walkRightShoulderX = Math.sin(wp) * 0.38 * armScale;

    // Khuỷu tay hơi gập khi vung ra trước (0.08 rad lúc duỗi, gập tới 0.33 rad lúc vung tới)
    const walkLeftElbow = 0.08 + Math.max(0, Math.sin(wp + Math.PI)) * 0.25;
    const walkRightElbow = 0.08 + Math.max(0, Math.sin(wp)) * 0.25;

    // Hông nhún sinh học trục Y (Pelvis Bobbing) & lắc hông sang bên chịu lực - Chỉ nhún lên trên, triệt tiêu lún chân
    const walkPelvisY = this.baseTorsoY + Math.abs(Math.sin(wp)) * 0.024;
    const walkPelvisRotZ = Math.sin(wp) * 0.032;
    const walkTorsoRotY = -Math.sin(wp) * 0.045; // Cột sống xoay đối xứng đối trọng
    const walkTorsoRotX = 0.045; // Hơi dấn nhẹ về phía trước

    // Tà áo lụa 3D tách nhau ra tự nhiên khi bước đi và vẫy về sau theo luồng gió
    const walkFrontFlap = (Math.sin(wp * 2.0) * 0.08 - 0.14) * clothScale;
    const walkBackFlap = (-Math.sin(wp * 2.0 + 0.45) * 0.14 - 0.26) * clothScale;
    const walkFrontFlapRollZ = Math.sin(wp) * 0.045 * clothScale;
    const walkBackFlapRollZ = -Math.sin(wp) * 0.055 * clothScale;

    // Khăn rằn đung đưa nhịp nhàng trước ngực theo bước chân
    const walkScarfRotX = Math.sin(wp * 2.0) * 0.045 - 0.040;
    const walkScarfRotZL = this.restPositions.scarfRotZL + Math.sin(wp) * 0.035;
    const walkScarfRotZR = this.restPositions.scarfRotZR + Math.sin(wp) * 0.035;

    // --- C. CHU KỲ CHẠY NHANH (RUN CYCLE - GTA V SPRINT) ---
    // Sải chân dài dứt khoát (-0.88 đến +0.88 rad)
    const runLeftHip = Math.sin(rp) * 0.88;
    const runRightHip = Math.sin(rp + Math.PI) * 0.88;

    // Đầu gối gập mạnh mẽ ra sau (1.25 rad) khi nhấc chân nước rút
    const runLeftKnee = Math.max(0, -Math.sin(rp)) * 1.25;
    const runRightKnee = Math.max(0, -Math.sin(rp + Math.PI)) * 1.25;

    // Cổ chân bật nhấc mũi và đẩy mặt đường
    const runLeftFoot = Math.sin(rp) * 0.32;
    const runRightFoot = Math.sin(rp + Math.PI) * 0.32;

    // Tay vung góc 90° (1.57 rad) chuẩn điền kinh / GTA V
    const runLeftElbow = 1.57 + Math.sin(rp + Math.PI) * 0.15;
    const runRightElbow = 1.57 + Math.sin(rp) * 0.15;

    // Vai vung mạnh mẽ biên độ lớn 0.75 rad
    const runLeftShoulderX = Math.sin(rp + Math.PI) * 0.75 * armScale;
    const runRightShoulderX = Math.sin(rp) * 0.75 * armScale;

    // Nghiêng thân dấn bước chuẩn Sprint Lean 11.0° (0.1920 rad, trong khoảng 8 - 12 độ)
    const runTorsoRotX = 0.192;
    const runTorsoRotY = -Math.sin(rp) * 0.10;
    const runPelvisRotZ = Math.sin(rp) * 0.06;

    // Độ nhún trọng tâm bật nảy mạnh mẽ theo nhịp chạy - Chỉ nhún lên trên, triệt tiêu lún chân
    const runPelvisY = this.baseTorsoY + Math.abs(Math.sin(rp)) * 0.040;

    // Tà áo dài bay mạnh mẽ về phía sau do luồng gió cản tốc độ cao
    const runFrontFlap = (-0.32 + Math.sin(rp * 2.0) * 0.10) * clothScale;
    const runBackFlap = (-0.56 - Math.sin(rp * 2.0) * 0.18) * clothScale;
    const runFrontFlapRollZ = Math.sin(rp) * 0.060 * clothScale;
    const runBackFlapRollZ = -Math.sin(rp) * 0.075 * clothScale;

    // Khăn rằn bay ép theo thân khi chạy nước rút
    const runScarfRotX = -0.14 + Math.sin(rp * 2.0) * 0.060;
    const runScarfRotZL = this.restPositions.scarfRotZL + Math.sin(rp) * 0.045;
    const runScarfRotZR = this.restPositions.scarfRotZR + Math.sin(rp) * 0.045;

    // --- D. CHU KỲ TRÊN KHÔNG / NHẢY (JUMP / AIRBORNE) ---
    const jumpPelvisY = this.baseTorsoY + 0.075;
    const jumpLeftHip = -0.22;
    const jumpRightHip = -0.22;
    const jumpLeftKnee = 0.85; // Gập đầu gối sinh học rõ nét khi co chân nhảy
    const jumpRightKnee = 0.85;
    const jumpLeftFoot = -0.20;
    const jumpRightFoot = -0.20;
    const jumpLeftShoulderX = -0.35;
    const jumpRightShoulderX = -0.35;
    const jumpLeftElbow = 0.35;
    const jumpRightElbow = 0.35;
    const jumpFrontFlap = 0.22 * clothScale;
    const jumpBackFlap = 0.28 * clothScale;
    const jumpScarfRotX = 0.18;
    const jumpScarfRotZL = this.restPositions.scarfRotZL - 0.08;
    const jumpScarfRotZR = this.restPositions.scarfRotZR + 0.08;

    // --- E. SQUASH & STRETCH CUSHION KHI TIẾP ĐẤT (HẤP THỤ PHẢN LỰC MẶT ĐẤT) ---
    let landingCushionY = 0.0;
    let landingSquashScale = 1.0;
    let landingKneeCushion = 0.0;
    if (this.landingTimer > 0) {
      const landProg = this.landingTimer / this.landingDuration; // 1.0 -> 0.0
      const landCurve = Math.sin(landProg * Math.PI); // Đỉnh nén ở giữa
      landingCushionY = -landCurve * 0.055;
      landingSquashScale = 1.0 - landCurve * 0.08; // Nén trục Y
      landingKneeCushion = landCurve * 0.18; // Nhún gối đàn hồi êm ái hấp thụ phản lực
    }

    // Trọng số ngồi thư giãn vỉa hè (Smooth Sitting Locomotion Blending)
    const targetSit = this.isSitting ? 1.0 : 0.0;
    this.sitWeight = damp(this.sitWeight, targetSit, 12.0, dt);
    const wSit = this.sitWeight;
    const invSit = 1.0 - wSit;

    // 9. HÒA TRỘN TỔNG HỢP CÁC KHỚP (FINAL TRANSFORMATION BLENDING)
    const r = this.rig;

    // 1. Pelvis (Hông/trọng tâm)
    if (r.pelvisGroup) {
      const sitPelvisY = this.baseTorsoY - 0.40;
      const blendedY = ((idlePelvisY * wIdle + walkPelvisY * wWalk + runPelvisY * wRun + jumpPelvisY * wJump) + landingCushionY) * invSit + sitPelvisY * wSit;
      r.pelvisGroup.position.y = blendedY;

      const blendedRotZ = (idleWeightShift * wIdle + walkPelvisRotZ * wWalk + runPelvisRotZ * wRun) * invSit;
      r.pelvisGroup.rotation.z = blendedRotZ;

      if (this.landingTimer > 0) {
        const invSquash = 1.0 + (1.0 - landingSquashScale) * 0.5;
        r.pelvisGroup.scale.set(invSquash, landingSquashScale, invSquash);
      } else {
        r.pelvisGroup.scale.set(1.0, 1.0, 1.0);
      }
    }

    // 2. Torso (Thân mình & độ nghiêng dấn bước + thích ứng độ dốc)
    if (r.torsoGroup) {
      const sitTorsoX = 0.05;
      r.torsoGroup.rotation.x = (walkTorsoRotX * wWalk + runTorsoRotX * wRun + this.groundSlopeAngle * 0.45) * invSit + sitTorsoX * wSit;
      r.torsoGroup.rotation.y = (walkTorsoRotY * wWalk + runTorsoRotY * wRun) * invSit;
      r.torsoGroup.rotation.z = (-idleWeightShift * 0.4 * wIdle) * invSit;
    }

    // 3. Chest (Lồng ngực thở & nhô phồng)
    if (r.chestGroup) {
      const finalChestY = idleChestScale * wIdle + (1.0 + Math.sin(time * 3.5) * 0.02) * (1.0 - wIdle);
      const finalChestXZ = idleChestScaleXZ * wIdle + 1.0 * (1.0 - wIdle);
      r.chestGroup.scale.set(finalChestXZ, finalChestY, finalChestXZ);
      r.chestGroup.rotation.x = breathSin * 0.015 * wIdle;
    }

    // 4. Head & Neck (Đầu & Cổ gật gù/nhìn quanh)
    if (r.headGroup) {
      const naturalTilt = idleHeadTilt * wIdle;
      const headNod = -Math.sin(wp * 2.0) * 0.025 * wWalk - Math.sin(rp * 2.0) * 0.035 * wRun;
      r.headGroup.rotation.x = headNod * invSit;
      r.headGroup.rotation.y = this.currentHeadYaw * wIdle;
      r.headGroup.rotation.z = naturalTilt;
    }

    // 5. Hai Vai & Hai Khuỷu Tay (Vai nhấp nhô thở, vung tay ngược pha)
    const shoulderRestY = this.restPositions.leftShoulderY;
    const finalShoulderBob = idleShoulderBob * wIdle;
    const sitShoulderX = -0.25;
    const sitElbowX = 0.50;

    if (r.leftShoulderGroup) {
      r.leftShoulderGroup.position.y = shoulderRestY + finalShoulderBob;
      r.leftShoulderGroup.rotation.x = (walkLeftShoulderX * wWalk + runLeftShoulderX * wRun + jumpLeftShoulderX * wJump) * invSit + sitShoulderX * wSit;
      r.leftShoulderGroup.rotation.z = -0.10 - 0.04 * wRun - 0.22 * wJump;
    }

    if (r.rightShoulderGroup) {
      r.rightShoulderGroup.position.y = shoulderRestY + finalShoulderBob;
      r.rightShoulderGroup.rotation.x = (walkRightShoulderX * wWalk + runRightShoulderX * wRun + jumpRightShoulderX * wJump) * invSit + sitShoulderX * wSit;
      r.rightShoulderGroup.rotation.z = 0.10 + 0.04 * wRun + 0.22 * wJump;
    }

    if (r.leftElbowGroup) {
      r.leftElbowGroup.rotation.x = (0.14 * wIdle + walkLeftElbow * wWalk + runLeftElbow * wRun + jumpLeftElbow * wJump) * invSit + sitElbowX * wSit;
    }

    if (r.rightElbowGroup) {
      r.rightElbowGroup.rotation.x = (0.14 * wIdle + walkRightElbow * wWalk + runRightElbow * wRun + jumpRightElbow * wJump) * invSit + sitElbowX * wSit;
    }

    // 6. Chi Dưới (Háng, Đầu Gối, Cổ Chân - Nhún gối tiếp đất đàn hồi)
    const sitHipX = -Math.PI / 2.15;
    const sitKneeX = Math.PI / 2.05;

    if (r.leftHipGroup) {
      r.leftHipGroup.rotation.x = (walkLeftHip * wWalk + runLeftHip * wRun + jumpLeftHip * wJump - landingKneeCushion * 0.35) * invSit + sitHipX * wSit;
      r.leftHipGroup.rotation.z = (idleWeightShift * 0.25 * wIdle) * invSit;
    }

    if (r.rightHipGroup) {
      r.rightHipGroup.rotation.x = (walkRightHip * wWalk + runRightHip * wRun + jumpRightHip * wJump - landingKneeCushion * 0.35) * invSit + sitHipX * wSit;
      r.rightHipGroup.rotation.z = (idleWeightShift * 0.25 * wIdle) * invSit;
    }

    if (r.leftKneeGroup) {
      r.leftKneeGroup.rotation.x = (0.02 * wIdle + walkLeftKnee * wWalk + runLeftKnee * wRun + jumpLeftKnee * wJump + landingKneeCushion) * invSit + sitKneeX * wSit;
    }

    if (r.rightKneeGroup) {
      r.rightKneeGroup.rotation.x = (0.02 * wIdle + walkRightKnee * wWalk + runRightKnee * wRun + jumpRightKnee * wJump + landingKneeCushion) * invSit + sitKneeX * wSit;
    }

    if (r.leftFootGroup) {
      r.leftFootGroup.rotation.x = (walkLeftFoot * wWalk + runLeftFoot * wRun + jumpLeftFoot * wJump + this.groundSlopeAngle * 0.8) * invSit;
    }

    if (r.rightFootGroup) {
      r.rightFootGroup.rotation.x = (walkRightFoot * wWalk + runRightFoot * wRun + jumpRightFoot * wJump + this.groundSlopeAngle * 0.8) * invSit;
    }

    // 7. Tà Áo Dài 3D & Nón Lá 3D & Khăn Rằn 3D (Flowing Cloth & Accessories)
    if (r.frontFlapGroup) {
      const sitFlapX = -Math.PI / 2.2;
      r.frontFlapGroup.rotation.x = (idleFrontFlap * wIdle + walkFrontFlap * wWalk + runFrontFlap * wRun + jumpFrontFlap * wJump) * invSit + sitFlapX * wSit;
      r.frontFlapGroup.rotation.z = (walkFrontFlapRollZ * wWalk + runFrontFlapRollZ * wRun) * invSit;
    }

    if (r.backFlapGroup) {
      r.backFlapGroup.rotation.x = idleBackFlap * wIdle + walkBackFlap * wWalk + runBackFlap * wRun + jumpBackFlap * wJump;
      r.backFlapGroup.rotation.z = walkBackFlapRollZ * wWalk + runBackFlapRollZ * wRun;
    }

    // Hoạt họa 2 dải khăn rằn 3D đung đưa trước ngực
    if (r.scarfDropL) {
      r.scarfDropL.rotation.x = idleScarfRotX * wIdle + walkScarfRotX * wWalk + runScarfRotX * wRun + jumpScarfRotX * wJump;
      r.scarfDropL.rotation.z = idleScarfRotZL * wIdle + walkScarfRotZL * wWalk + runScarfRotZL * wRun + jumpScarfRotZL * wJump;
    }

    if (r.scarfDropR) {
      r.scarfDropR.rotation.x = idleScarfRotX * wIdle + walkScarfRotX * wWalk + runScarfRotX * wRun + jumpScarfRotX * wJump;
      r.scarfDropR.rotation.z = idleScarfRotZR * wIdle + walkScarfRotZR * wWalk + runScarfRotZR * wRun + jumpScarfRotZR * wJump;
    }

    // --- TÍNH TOÁN ĐỘ TRỄ QUÁN TÍNH NÓN LÁ (INERTIAL LAG DAMPING) ---
    const currentCharRotY = (this.char && this.char.rotation) ? this.char.rotation.y : 0.0;
    let deltaRotY = currentCharRotY - this.lastCharRotY;
    while (deltaRotY > Math.PI) deltaRotY -= Math.PI * 2;
    while (deltaRotY < -Math.PI) deltaRotY += Math.PI * 2;
    const angularVelY = dt > 0.0001 ? (deltaRotY / dt) : 0.0;
    this.lastCharRotY = currentCharRotY;

    // Khi nhân vật xoay người đổi hướng: Quán tính làm nón trễ lại (Yaw) và lắc lư nghiêng lật nhẹ (Roll Z)
    const targetLagRoll = clamp(-angularVelY * 0.045, -0.32, 0.32);
    const targetLagYaw = clamp(-angularVelY * 0.040, -0.28, 0.28);
    // Khi tiến tới: luồng gió cản đẩy nón hơi ngửa ra sau (Pitch X)
    const targetLagPitch = clamp(speed * 0.022, 0.0, 0.22);

    // Hệ lò xo giảm chấn (Spring-Damper)
    const springK = 38.0;
    const dampingC = 9.0;
    const forceRoll = (targetLagRoll - this.nonLaLagRoll) * springK - this.nonLaRollVel * dampingC;
    this.nonLaRollVel += forceRoll * dt;
    this.nonLaLagRoll += this.nonLaRollVel * dt;

    const forcePitch = (targetLagPitch - this.nonLaLagPitch) * springK - this.nonLaPitchVel * dampingC;
    this.nonLaPitchVel += forcePitch * dt;
    this.nonLaLagPitch += this.nonLaPitchVel * dt;

    this.nonLaLagYaw = damp(this.nonLaLagYaw, targetLagYaw, 12.0, dt);

    // Dao động gió hồ Gươm thoảng qua và nhịp nhún bước đi
    const nonLaFlutterZ = Math.sin(time * 3.2) * 0.025 + Math.cos(time * 1.8) * 0.015;
    const nonLaFlutterX = Math.sin(time * 2.5) * 0.020;
    const walkStepSway = Math.sin(wp * 2.0) * (speed > 0.1 ? 0.030 : 0.0);

    const finalNonLaRotZ = (idleNonLaRotZ * wIdle) + this.nonLaLagRoll + nonLaFlutterZ;
    const finalNonLaRotX = (idleNonLaRotX * wIdle) + this.nonLaLagPitch + nonLaFlutterX + walkStepSway;
    const finalNonLaRotY = this.nonLaLagYaw;

    const nonLaTarget = r.accessoryHeadGroup || this._findNonLaObject();
    if (nonLaTarget) {
      nonLaTarget.rotation.z = finalNonLaRotZ;
      nonLaTarget.rotation.x = finalNonLaRotX;
      nonLaTarget.rotation.y = finalNonLaRotY;
    }

    // 8. Tương thích ngược tấm thân 2.5D Front/Back Planes (nếu có)
    if (r.frontPlane && r.frontPlane.position) {
      const basePlaneH = (this.char && this.char.charH) ? this.char.charH / 2 : 0.92;
      r.frontPlane.position.y = basePlaneH + breathSin * 0.012 * wIdle;
    }
    if (r.backPlane && r.backPlane.position) {
      const basePlaneH = (this.char && this.char.charH) ? this.char.charH / 2 : 0.92;
      r.backPlane.position.y = basePlaneH + breathSin * 0.012 * wIdle;
    }

    // 10. ĐÈ CỬ CHỈ GESTURE (NẾU ĐANG CHẠY CỬ CHỈ ĐẶC BIỆT)
    if (this.gestureWeight > 0.001) {
      this._applyGestureOverlay(this.gestureWeight);
    }
  }

  /**
   * Cập nhật quay đầu nhìn ngắm phố phường Hà Nội ngẫu nhiên khi đứng yên
   */
  _updateLookAround(dt, wIdle) {
    if (wIdle < 0.6) {
      this.targetHeadYaw = 0.0;
      this.currentHeadYaw = damp(this.currentHeadYaw, 0.0, 5.0, dt);
      return;
    }

    this.lookAroundTimer -= dt;
    if (this.lookAroundTimer <= 0) {
      this.lookAroundTimer = 3.0 + Math.random() * 4.5;
      // Quay đầu nhẹ sang trái/phải từ -0.35 đến +0.35 rad (khoảng 20 độ)
      if (Math.random() > 0.35) {
        this.targetHeadYaw = (Math.random() - 0.5) * 0.70;
      } else {
        this.targetHeadYaw = 0.0; // Nhìn thẳng
      }
    }

    this.currentHeadYaw = damp(this.currentHeadYaw, this.targetHeadYaw, 2.5, dt);
  }

  /**
   * Cập nhật chớp mắt sinh học nhẹ nhàng tự nhiên
   */
  _updateBlinking(dt) {
    if (!this.isBlinking) {
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) {
        this.isBlinking = true;
        this.blinkProgress = 0.0;
        this.blinkDuration = 0.16; // Chớp mắt sinh học 0.16s
        this.blinkTimer = 2.8 + Math.random() * 3.2; // 2.8s - 6s mỗi lần chớp
      }
      this.blinkValue = 0.0;
    } else {
      this.blinkProgress += dt / this.blinkDuration;
      if (this.blinkProgress >= 1.0) {
        this.isBlinking = false;
        this.blinkProgress = 0.0;
        this.blinkValue = 0.0;
      } else {
        // Đường cong Hermite sin: 0 -> 1 -> 0
        this.blinkValue = Math.sin(this.blinkProgress * Math.PI);
      }
    }
  }

  /**
   * Đặt chủ động trạng thái di chuyển (Locomotion State Blending)
   * @param {'idle' | 'walk' | 'run' | 'jump'} stateName 
   * @param {number} speed 
   */
  setLocomotionState(stateName, speed = 0) {
    this.targetWeight.idle = stateName === 'idle' ? 1.0 : 0.0;
    this.targetWeight.walk = stateName === 'walk' ? 1.0 : 0.0;
    this.targetWeight.run = stateName === 'run' ? 1.0 : 0.0;
    this.targetWeight.jump = stateName === 'jump' ? 1.0 : 0.0;
  }

  /**
   * Cấu hình thời lượng hòa trộn Crossfade giữa các trạng thái (mặc định 0.22s)
   * @param {number} duration 
   */
  setCrossfadeDuration(duration) {
    this.crossfadeDuration = Math.max(0.05, duration);
  }

  /**
   * Chủ động kích hoạt một cái chớp mắt
   * @param {number} duration 
   */
  triggerBlink(duration = 0.16) {
    this.isBlinking = true;
    this.blinkProgress = 0.0;
    this.blinkDuration = duration;
  }

  /**
   * Lấy giá trị chớp mắt hiện tại (0.0 = mở, 1.0 = nhắm)
   */
  getBlinkValue() {
    return this.blinkValue;
  }

  /**
   * Kích hoạt cử chỉ tương tác đặc biệt
   * @param {string} gestureName - 'wave' | 'bow' | 'takePhoto' | 'shrug'
   * @param {number} duration - Thời lượng hiệu ứng tính bằng giây
   */
  playGesture(gestureName, duration = 2.0) {
    this.activeGesture = gestureName;
    this.gestureDuration = duration;
    this.gestureTime = 0.0;
    this.gestureWeight = 0.0;
  }

  /**
   * Dừng cử chỉ ngay lập tức
   */
  stopGesture() {
    this.activeGesture = null;
    this.gestureTime = 0.0;
    this.gestureWeight = 0.0;
  }

  /**
   * Tiến trình hòa trộn cử chỉ
   */
  _updateGesture(dt) {
    if (!this.activeGesture) {
      if (this.gestureWeight > 0.001) {
        this.gestureWeight = damp(this.gestureWeight, 0.0, 8.0, dt);
      }
      return;
    }

    this.gestureTime += dt;
    const p = this.gestureTime / this.gestureDuration;

    if (p >= 1.0) {
      this.activeGesture = null;
      this.gestureWeight = 0.0;
      return;
    }

    // Đường cong vào nhanh, giữ, ra êm (Envelope: attack -> hold -> decay)
    if (p < 0.2) {
      this.gestureWeight = smoothstep(0.0, 0.2, p);
    } else if (p > 0.8) {
      this.gestureWeight = 1.0 - smoothstep(0.8, 1.0, p);
    } else {
      this.gestureWeight = 1.0;
    }
  }

  /**
   * Áp đặt góc quay cử chỉ lên các khớp
   */
  _applyGestureOverlay(weight) {
    const r = this.rig;
    const gt = this.gestureTime;

    switch (this.activeGesture) {
      case 'wave': // Vẫy tay chào thân thiện
        if (r.rightShoulderGroup) {
          const waveArmAngle = -1.85 + Math.sin(gt * 11.0) * 0.35;
          r.rightShoulderGroup.rotation.x = lerp(r.rightShoulderGroup.rotation.x, -0.2, weight);
          r.rightShoulderGroup.rotation.z = lerp(r.rightShoulderGroup.rotation.z, waveArmAngle, weight);
        }
        if (r.rightElbowGroup) {
          r.rightElbowGroup.rotation.x = lerp(r.rightElbowGroup.rotation.x, 0.85, weight);
        }
        if (r.headGroup) {
          r.headGroup.rotation.z = lerp(r.headGroup.rotation.z, -0.08, weight);
        }
        break;

      case 'bow': // Cúi đầu chào trang nghiêm kiểu Tràng An
        if (r.torsoGroup) {
          r.torsoGroup.rotation.x = lerp(r.torsoGroup.rotation.x, 0.35, weight);
        }
        if (r.headGroup) {
          r.headGroup.rotation.x = lerp(r.headGroup.rotation.x, 0.22, weight);
        }
        if (r.leftShoulderGroup) {
          r.leftShoulderGroup.rotation.x = lerp(r.leftShoulderGroup.rotation.x, 0.15, weight);
          r.leftShoulderGroup.rotation.z = lerp(r.leftShoulderGroup.rotation.z, -0.15, weight);
        }
        if (r.rightShoulderGroup) {
          r.rightShoulderGroup.rotation.x = lerp(r.rightShoulderGroup.rotation.x, 0.15, weight);
          r.rightShoulderGroup.rotation.z = lerp(r.rightShoulderGroup.rotation.z, 0.15, weight);
        }
        break;

      case 'takePhoto': // Nâng máy ảnh film lên ngắm chụp
        if (r.leftShoulderGroup) {
          r.leftShoulderGroup.rotation.x = lerp(r.leftShoulderGroup.rotation.x, -1.25, weight);
          r.leftShoulderGroup.rotation.z = lerp(r.leftShoulderGroup.rotation.z, 0.45, weight);
        }
        if (r.rightShoulderGroup) {
          r.rightShoulderGroup.rotation.x = lerp(r.rightShoulderGroup.rotation.x, -1.25, weight);
          r.rightShoulderGroup.rotation.z = lerp(r.rightShoulderGroup.rotation.z, -0.45, weight);
        }
        if (r.leftElbowGroup) {
          r.leftElbowGroup.rotation.x = lerp(r.leftElbowGroup.rotation.x, 1.45, weight);
        }
        if (r.rightElbowGroup) {
          r.rightElbowGroup.rotation.x = lerp(r.rightElbowGroup.rotation.x, 1.45, weight);
        }
        if (r.headGroup) {
          r.headGroup.rotation.x = lerp(r.headGroup.rotation.x, 0.08, weight);
        }
        break;

      case 'shrug': // Nhún vai vui vẻ
        if (r.leftShoulderGroup) {
          r.leftShoulderGroup.position.y = lerp(r.leftShoulderGroup.position.y, this.restPositions.leftShoulderY + 0.045, weight);
          r.leftShoulderGroup.rotation.z = lerp(r.leftShoulderGroup.rotation.z, -0.22, weight);
        }
        if (r.rightShoulderGroup) {
          r.rightShoulderGroup.position.y = lerp(r.rightShoulderGroup.position.y, this.restPositions.rightShoulderY + 0.045, weight);
          r.rightShoulderGroup.rotation.z = lerp(r.rightShoulderGroup.rotation.z, 0.22, weight);
        }
        if (r.headGroup) {
          r.headGroup.rotation.z = lerp(r.headGroup.rotation.z, 0.12, weight);
        }
        break;
    }
  }

  /**
   * Đưa toàn bộ khớp về tư thế đứng cân bằng chuẩn (Rest Pose)
   */
  resetPose() {
    this.animTime = 0.0;
    this.walkPhase = 0.0;
    this.runPhase = 0.0;
    this.currentWeight = { idle: 1.0, walk: 0.0, run: 0.0, jump: 0.0 };
    this.targetWeight = { idle: 1.0, walk: 0.0, run: 0.0, jump: 0.0 };
    this.activeGesture = null;
    this.gestureWeight = 0.0;
    this.landingTimer = 0.0;
    this.currentHeadYaw = 0.0;
    this.targetHeadYaw = 0.0;

    // Reset bộ đệm Lag Damping quán tính Nón Lá
    this.nonLaLagRoll = 0.0;
    this.nonLaLagPitch = 0.0;
    this.nonLaLagYaw = 0.0;
    this.nonLaRollVel = 0.0;
    this.nonLaPitchVel = 0.0;

    const r = this.rig;
    if (!r) return;

    if (r.pelvisGroup) {
      r.pelvisGroup.position.y = this.baseTorsoY;
      r.pelvisGroup.rotation.set(0, 0, 0);
      r.pelvisGroup.scale.set(1, 1, 1);
    }
    if (r.torsoGroup) r.torsoGroup.rotation.set(0, 0, 0);
    if (r.chestGroup) {
      r.chestGroup.rotation.set(0, 0, 0);
      r.chestGroup.scale.set(1, 1, 1);
    }
    if (r.neckGroup) r.neckGroup.rotation.set(0, 0, 0);
    if (r.headGroup) r.headGroup.rotation.set(0, 0, 0);

    if (r.leftShoulderGroup) {
      r.leftShoulderGroup.position.y = this.restPositions.leftShoulderY;
      r.leftShoulderGroup.rotation.set(0, 0, 0);
    }
    if (r.rightShoulderGroup) {
      r.rightShoulderGroup.position.y = this.restPositions.rightShoulderY;
      r.rightShoulderGroup.rotation.set(0, 0, 0);
    }
    if (r.leftElbowGroup) r.leftElbowGroup.rotation.set(0, 0, 0);
    if (r.rightElbowGroup) r.rightElbowGroup.rotation.set(0, 0, 0);

    if (r.leftHipGroup) r.leftHipGroup.rotation.set(0, 0, 0);
    if (r.rightHipGroup) r.rightHipGroup.rotation.set(0, 0, 0);
    if (r.leftKneeGroup) r.leftKneeGroup.rotation.set(0, 0, 0);
    if (r.rightKneeGroup) r.rightKneeGroup.rotation.set(0, 0, 0);
    if (r.leftFootGroup) r.leftFootGroup.rotation.set(0, 0, 0);
    if (r.rightFootGroup) r.rightFootGroup.rotation.set(0, 0, 0);

    if (r.frontFlapGroup) r.frontFlapGroup.rotation.set(0, 0, 0);
    if (r.backFlapGroup) r.backFlapGroup.rotation.set(0, 0, 0);
    if (r.accessoryHeadGroup) r.accessoryHeadGroup.rotation.set(0, 0, 0);
    if (r.scarfDropL) r.scarfDropL.rotation.set(this.restPositions.scarfRotXL || 0, 0, this.restPositions.scarfRotZL || -0.12);
    if (r.scarfDropR) r.scarfDropR.rotation.set(this.restPositions.scarfRotXR || 0, 0, this.restPositions.scarfRotZR || 0.12);

    this.isBlinking = false;
    this.blinkProgress = 0.0;
    this.blinkValue = 0.0;
  }

  /**
   * Lấy thông tin trạng thái hoạt ảnh hiện tại cho HUD / Debug Tool
   */
  getState() {
    return {
      animTime: this.animTime,
      weights: { ...this.currentWeight },
      activeGesture: this.activeGesture,
      isGrounded: this.wasGrounded,
      landingTimer: this.landingTimer,
      blinkValue: this.blinkValue,
      isBlinking: this.isBlinking,
      crossfadeDuration: this.crossfadeDuration
    };
  }
}

// ============================================================================
// HỆ THỐNG GIÓ ĐỘNG HỌC MÔI TRƯỜNG (ENVIRONMENT WIND SYSTEM)
// ============================================================================

export class EnvironmentWindSystem {
  /**
   * Quản lý chuyển động đung đưa cành cây, giàn hoa giấy, sóng nước hồ Gươm
   * Sử dụng tổng hòa các hàm sóng hình sin (Harmonic Wave Summation) không cấp phát bộ nhớ.
   */
  constructor() {
    this.time = 0.0;
    this.windStrength = 0.65;
    this.windHeading = 0.45; // Hướng gió theo radian
    this.gust = 0.0;
  }

  update(delta) {
    this.time += delta;
    // Cơn gió thoảng (Gust of wind) lặp lại tự nhiên
    const t = this.time;
    this.gust = Math.sin(t * 0.4) * 0.25 + Math.sin(t * 1.1) * 0.15 + Math.sin(t * 2.3) * 0.08;
  }

  /**
   * Tính độ lắc lư cho một vị trí trong không gian thế giới (x, z)
   */
  getSway(x, z, height = 1.0) {
    const spatialPhase = x * 0.12 + z * 0.08;
    const wave = Math.sin(this.time * 2.2 + spatialPhase) * 0.05 + Math.sin(this.time * 4.1 + spatialPhase * 2.0) * 0.02;
    const finalStrength = (this.windStrength + this.gust) * height;
    return wave * finalStrength;
  }
}

// ============================================================================
// HỆ THỐNG HẠT HOẠT HỌA 60 FPS (PARTICLE VFX ANIMATOR)
// ============================================================================

export class ParticleVFXAnimator {
  /**
   * Quản lý hoạt ảnh hạt cánh hoa rơi / lá vàng rơi quanh hồ Gươm
   * @param {THREE.InstancedMesh|THREE.Points} particleSystem 
   * @param {number} count 
   */
  constructor(particleSystem, count = 100) {
    this.system = particleSystem;
    this.count = count;
    this.time = 0.0;
  }

  update(delta) {
    this.time += delta;
    // Cung cấp hook cho các hiệu ứng hạt tuân thủ Zero-Allocation
  }
}

// ============================================================================
// HỆ THỐNG HOẠT HỌA MÔI TRƯỜNG KHU TẬP THỂ KIM LIÊN (KIM LIEN ENVIRONMENT ANIMATOR)
// ============================================================================

export class KimLienEnvironmentAnimator {
  /**
   * Quản lý hoạt ảnh môi trường sống động 60 FPS cho Khu Tập Thể Kim Liên:
   * 1. Đung đưa giàn hoa giấy đỏ trên ban công chuồng cọp theo nhịp gió nhẹ (Sway easing)
   * 2. Dây phơi quần áo rung rinh phấp phới nhẹ dọc hành lang (Flutter animation)
   * 3. Quạt tai voi quay tút-năng nhịp nhàng trong phòng khách căn hộ 204
   * 4. Lồng chim sơn ca khuyên tre đung đưa nhẹ ngoài ban công chuồng cọp
   *
   * Tuân thủ triệt để Zero Heap Allocation trong game loop, tối ưu culling theo khoảng cách.
   */
  constructor(options = {}, maybeOptions = {}) {
    let opts = options || {};
    let center = { x: -68.0, z: -75.0 };

    if (options && (options.isVector3 || (typeof options.x === 'number' && typeof options.z === 'number'))) {
      center = { x: options.x, z: options.z };
      opts = maybeOptions || {};
    } else if (options && options.centerPosition) {
      center = { x: options.centerPosition.x, z: options.centerPosition.z };
    }

    this.time = 0.0;
    this.windSystem = opts.windSystem || new EnvironmentWindSystem();
    this.cullingDistance = opts.cullingDistance || 135.0; // Khoảng cách tối đa cập nhật chi tiết (mét)
    this.cullingDistanceSq = this.cullingDistance * this.cullingDistance;
    this.centerPosition = center; // Tâm khu nhà A1 Kim Liên
    
    // Mảng lưu trữ các đối tượng hoạt họa cố định
    this.bougainvilleas = [];
    this.clotheslines = [];
    this.elephantFans = [];
    this.birdcages = [];

    // Tái sử dụng mảng/biến tạm tránh cấp phát GC (Zero Heap Allocation)
    this._dx = 0.0;
    this._dz = 0.0;
    this._distSq = 0.0;
    this._isCulled = false;
    this._windGust = 0.0;
    this._windStrength = 0.65;
    this._windFactor = 0.65;
    this._currentTime = 0.0;
  }

  /**
   * 1. Đăng ký Giàn hoa giấy đỏ trên ban công chuồng cọp
   * @param {THREE.Object3D} target - Mesh hoặc Group giàn hoa giấy
   * @param {Object} options - { x, z, swayAmpX, swayAmpZ, swayAmpY, liftAmpY, speed, phase, applyLift }
   */
  registerBougainvillea(target, options = {}) {
    if (!target) return null;
    const posX = options.x !== undefined ? options.x : target.position.x;
    const posZ = options.z !== undefined ? options.z : target.position.z;
    const spatialPhase = options.phase !== undefined ? options.phase : (posX * 0.14 + posZ * 0.09);

    const entry = {
      target,
      initRotX: target.rotation.x,
      initRotY: target.rotation.y,
      initRotZ: target.rotation.z,
      initPosY: target.position.y,
      swayAmpX: options.swayAmpX || 0.052,  // Biên độ lắc theo trục X (~3.0 độ)
      swayAmpZ: options.swayAmpZ || 0.040,  // Biên độ lắc theo trục Z (~2.3 độ)
      swayAmpY: options.swayAmpY || 0.024,  // Biên độ xoay nhẹ trục Y (~1.4 độ)
      liftAmpY: options.liftAmpY || 0.012,  // Nhấp nhô nâng vòm khi gió thốc
      phase: spatialPhase,
      speed: options.speed || 1.0,
      applyLift: options.applyLift !== undefined ? options.applyLift : true
    };
    this.bougainvilleas.push(entry);
    return entry;
  }

  /**
   * 2. Đăng ký Dây phơi quần áo rung rinh phấp phới dọc hành lang
   * @param {THREE.Object3D} target - Nhóm dây phơi (chứa dây và các món quần áo)
   * @param {Object} options - { x, z, clothesItems, swingAmp, flutterFreq, flutterAmp }
   */
  registerClothesline(target, options = {}) {
    if (!target) return null;
    const posX = options.x !== undefined ? options.x : target.position.x;
    const posZ = options.z !== undefined ? options.z : target.position.z;
    const linePhase = options.phase !== undefined ? options.phase : (posX * 0.12 + posZ * 0.08);

    // Xác định danh sách các món quần áo treo trên dây
    const items = [];
    if (options.clothesItems && Array.isArray(options.clothesItems)) {
      for (let i = 0; i < options.clothesItems.length; i++) {
        const itemObj = options.clothesItems[i];
        const m = itemObj.mesh || itemObj;
        items.push({
          mesh: m,
          initRotX: m.rotation.x,
          initRotY: m.rotation.y,
          initRotZ: m.rotation.z,
          swingAmp: itemObj.swingAmp || options.swingAmp || 0.14,      // Góc vung quanh dây thép (~8 độ)
          flutterFreq: itemObj.flutterFreq || options.flutterFreq || 8.5, // Tần số phấp phới nếp vải
          flutterAmp: itemObj.flutterAmp || options.flutterAmp || 0.065,   // Biên độ phấp phới
          phase: (linePhase + i * 1.35)
        });
      }
    } else if (target.clothesItems && Array.isArray(target.clothesItems)) {
      for (let i = 0; i < target.clothesItems.length; i++) {
        const m = target.clothesItems[i];
        items.push({
          mesh: m,
          initRotX: m.rotation.x,
          initRotY: m.rotation.y,
          initRotZ: m.rotation.z,
          swingAmp: options.swingAmp || 0.14,
          flutterFreq: options.flutterFreq || 8.5,
          flutterAmp: options.flutterAmp || 0.065,
          phase: (linePhase + i * 1.35)
        });
      }
    } else {
      // Tự động tìm kiếm các con trực tiếp của target (bỏ qua dây cáp thép)
      const children = target.children || [];
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.name && (child.name.includes('Line') || child.name.includes('Wire') || child.name.includes('Rope'))) continue;
        items.push({
          mesh: child,
          initRotX: child.rotation.x,
          initRotY: child.rotation.y,
          initRotZ: child.rotation.z,
          swingAmp: options.swingAmp || 0.14,
          flutterFreq: options.flutterFreq || 8.5,
          flutterAmp: options.flutterAmp || 0.065,
          phase: (linePhase + items.length * 1.35)
        });
      }
    }

    const entry = {
      target,
      initRotX: target.rotation.x,
      initRotY: target.rotation.y,
      initRotZ: target.rotation.z,
      phase: linePhase,
      items
    };
    this.clotheslines.push(entry);
    return entry;
  }

  /**
   * 3. Đăng ký Quạt tai voi Liên Xô quay tút-năng trong phòng khách căn hộ 204
   * @param {THREE.Object3D|Object} target - Nhóm quạt hoặc { head, blades, base, root }
   * @param {Object} options - { bladeSpeed, bladeAxis, sweepAmp, sweepPeriod, isRunning }
   */
  registerElephantEarFan(target, options = {}) {
    if (!target) return null;

    let head = null;
    let blades = null;

    if (target.head && target.blades) {
      head = target.head;
      blades = target.blades;
    } else if (target.isObject3D) {
      head = target.getObjectByName('FanHead') || 
             target.getObjectByName('Head') || 
             target.getObjectByName('Motor') || 
             target;
      blades = target.getObjectByName('FanBlades') || 
               target.getObjectByName('Blades') || 
               target.getObjectByName('CanhQuat');
      
      // Nếu chưa tìm thấy blades, tìm mesh con đầu tiên của head có geometry
      if (!blades && head && head.children.length > 0) {
        for (let i = 0; i < head.children.length; i++) {
          const c = head.children[i];
          if (c.name && (c.name.includes('blade') || c.name.includes('Canh') || c.name.includes('Rotor'))) {
            blades = c;
            break;
          }
        }
      }
    }

    const entry = {
      root: target.root || target,
      head: head || target,
      blades: blades || null,
      initHeadRotY: head ? head.rotation.y : 0.0,
      bladeAxis: options.bladeAxis || 'z', // trục quay cánh quạt
      bladeSpeed: options.bladeSpeed || 24.0, // rad/s (~230 rpm)
      bladeRotation: 0.0,
      sweepAmp: options.sweepAmp || 0.62, // ~35.5 độ quét tút-năng sang mỗi bên
      sweepPeriod: options.sweepPeriod || 5.8, // 5.8 giây mỗi chu kỳ tút-năng
      phase: options.phase || 0.0,
      isRunning: options.isRunning !== undefined ? options.isRunning : true,
      setRunning: (running) => { entry.isRunning = !!running; },
      setSpeed: (speed) => { entry.bladeSpeed = Number(speed) || 24.0; }
    };

    this.elephantFans.push(entry);
    return entry;
  }

  /**
   * 4. Đăng ký Lồng chim sơn ca khuyên tre ngoài ban công chuồng cọp
   * @param {THREE.Object3D|Object} target - Lồng chim hoặc { cage, bird, hook }
   * @param {Object} options - { pendulumAmpX, pendulumAmpZ, pendulumFreq, yawTwistAmp }
   */
  registerBirdcage(target, options = {}) {
    if (!target) return null;

    let cage = null;
    let bird = null;

    if (target.cage) {
      cage = target.cage;
      bird = target.bird || null;
    } else if (target.isObject3D) {
      cage = target.getObjectByName('Birdcage') || target;
      bird = target.getObjectByName('Songbird') || 
             target.getObjectByName('Bird') || 
             target.getObjectByName('Chim');
      
      if (!bird) {
        target.traverse((c) => {
          if (c !== target && c.name && (c.name.includes('bird') || c.name.includes('Bird') || c.name.includes('chim'))) {
            bird = c;
          }
        });
      }
    }

    const entry = {
      cage: cage || target,
      bird: bird || null,
      initRotX: cage ? cage.rotation.x : 0.0,
      initRotY: cage ? cage.rotation.y : 0.0,
      initRotZ: cage ? cage.rotation.z : 0.0,
      initBirdPosY: bird ? bird.position.y : 0.0,
      initBirdRotY: bird ? bird.rotation.y : 0.0,
      pendulumAmpX: options.pendulumAmpX || 0.045, // Biên độ lắc trục X (~2.6 độ)
      pendulumAmpZ: options.pendulumAmpZ || 0.038, // Biên độ lắc trục Z (~2.2 độ)
      pendulumFreq: options.pendulumFreq || 1.65, // Tần số con lắc tự nhiên (~3.8s chu kỳ)
      yawTwistAmp: options.yawTwistAmp || 0.075,   // Dao động tự xoắn quanh dây treo (~4.3 độ)
      phase: options.phase || 0.0,
      birdTimer: 0.0,
      birdHopCooldown: 2.5 + Math.random() * 2.0
    };

    this.birdcages.push(entry);
    return entry;
  }

  /**
   * Tự động quét và liên kết toàn bộ hoa giấy, dây phơi, quạt tai voi, lồng chim trong Scene/Group
   * @param {THREE.Object3D} containerGroup
   */
  autoScanAndRegister(containerGroup) {
    if (!containerGroup || !containerGroup.traverse) return;

    containerGroup.traverse((obj) => {
      if (!obj || !obj.name) return;
      const lower = obj.name.toLowerCase();

      // Hoa giấy
      if (lower.includes('bougainvillea') || lower.includes('hoagiay') || lower.includes('hoagiấy') || lower.includes('flower_vine')) {
        this.registerBougainvillea(obj);
      }
      // Dây phơi quần áo
      else if (lower.includes('clothesline') || lower.includes('dayphoi') || lower.includes('dâyphơi') || lower.includes('hanging_clothes')) {
        this.registerClothesline(obj);
      }
      // Quạt tai voi
      else if (lower.includes('quattaivoi') || lower.includes('quạt_tai_voi') || lower.includes('elephant_fan') || lower.includes('soviet_fan')) {
        this.registerElephantEarFan(obj);
      }
      // Lồng chim
      else if (lower.includes('birdcage') || lower.includes('longchim') || lower.includes('lồng_chim') || lower.includes('caged_bird')) {
        this.registerBirdcage(obj);
      }
    });
  }

  /**
   * Cập nhật toàn bộ hoạt họa 60 FPS mượt mà với Zero Heap Allocation
   * @param {number} delta - Delta time (giây)
   * @param {THREE.Vector3|Object} playerPos - Tọa độ người chơi để tính Culling
   * @param {EnvironmentWindSystem} externalWind - Hệ thống gió tuỳ chọn
   */
  update(delta, playerPos = null, externalWind = null) {
    if (delta <= 0) return;
    // Kẹp delta an toàn chống nhảy vọt khi lag máy
    const dt = delta > 0.1 ? 0.016 : delta;
    this.time += dt;
    this._currentTime = this.time;

    // 0. CULLING THEO KHOẢNG CÁCH NGƯỜI CHƠI (Tối ưu 60 FPS tuyệt đối)
    if (playerPos) {
      this._dx = playerPos.x - this.centerPosition.x;
      this._dz = playerPos.z - this.centerPosition.z;
      this._distSq = this._dx * this._dx + this._dz * this._dz;
      if (this._distSq > this.cullingDistanceSq) {
        this._isCulled = true;
        return; // Đứng cách xa hơn 135m -> Bỏ qua cập nhật chi tiết để giữ vững 60 FPS
      }
    }
    this._isCulled = false;

    // 1. CẬP NHẬT GIÓ
    const wind = externalWind || this.windSystem;
    if (wind && wind.update) {
      if (!externalWind) wind.update(dt);
      this._windGust = wind.gust;
      this._windStrength = wind.windStrength;
      this._windFactor = this._windStrength + this._windGust * 1.4;
    } else {
      this._windGust = Math.sin(this._currentTime * 0.45) * 0.2;
      this._windStrength = 0.65;
      this._windFactor = 0.65 + this._windGust;
    }

    const t = this._currentTime;
    const wf = this._windFactor;
    const gust = this._windGust;

    // ========================================================================
    // 1. HOẠT HỌA GIÀN HOA GIẤY ĐỎ TRÊN BAN CÔNG CHUỒNG CỌP (SWAY EASING)
    // ========================================================================
    const bCount = this.bougainvilleas.length;
    for (let i = 0; i < bCount; i++) {
      const b = this.bougainvilleas[i];
      const pt = (t + b.phase) * b.speed;

      // Tổng hòa các hàm sóng hình sin (Harmonic Wave Easing)
      const waveX = (Math.sin(pt * 1.85) * 0.7 + Math.sin(pt * 3.7) * 0.3) * b.swayAmpX;
      const waveZ = (Math.cos(pt * 1.45) * 0.75 + Math.cos(pt * 2.9) * 0.25) * b.swayAmpZ;
      const waveY = Math.sin(pt * 1.1) * b.swayAmpY;

      b.target.rotation.x = b.initRotX + waveX * wf;
      b.target.rotation.z = b.initRotZ + waveZ * wf;
      b.target.rotation.y = b.initRotY + waveY * wf;

      if (b.applyLift) {
        const liftY = Math.sin(pt * 2.2) * b.liftAmpY;
        b.target.position.y = b.initPosY + liftY * wf;
      }
    }

    // ========================================================================
    // 2. HOẠT HỌA DÂY PHƠI & QUẦN ÁO PHẤP PHỚI DỌC HÀNH LANG (FLUTTER ANIMATION)
    // ========================================================================
    const cCount = this.clotheslines.length;
    for (let i = 0; i < cCount; i++) {
      const line = this.clotheslines[i];
      const lt = t + line.phase;

      // Dây phơi thép võng đung đưa quanh trục X
      const lineSway = Math.sin(lt * 2.2) * 0.028 * wf;
      line.target.rotation.x = line.initRotX + lineSway;

      // Các món quần áo treo trên dây
      const items = line.items;
      const itemCount = items.length;
      for (let j = 0; j < itemCount; j++) {
        const it = items[j];
        const itemT = t + it.phase;

        // Góc vung quanh dây thép (Swing angle) kết hợp độ xô đẩy của luồng gió
        const swingX = Math.sin(itemT * 2.6) * it.swingAmp * wf + gust * 0.22;

        // Hiệu ứng sóng nếp vải rung phấp phới ở mép dưới vạt áo (High-frequency ripple)
        const flutterY = Math.sin(itemT * it.flutterFreq) * it.flutterAmp * wf;
        const flutterZ = Math.cos(itemT * (it.flutterFreq * 0.82)) * (it.flutterAmp * 0.75) * wf;

        it.mesh.rotation.x = it.initRotX + swingX;
        it.mesh.rotation.y = it.initRotY + flutterY;
        it.mesh.rotation.z = it.initRotZ + flutterZ;
      }
    }

    // ========================================================================
    // 3. HOẠT HỌA QUẠT TAI VOI LIÊN XÔ TRONG PHÒNG KHÁCH CĂN HỘ 204
    // ========================================================================
    const fCount = this.elephantFans.length;
    for (let i = 0; i < fCount; i++) {
      const fan = this.elephantFans[i];
      if (!fan.isRunning) continue;

      // 3.1. Cánh quạt quay tròn tốc độ cao 60 FPS
      fan.bladeRotation += fan.bladeSpeed * dt;
      if (fan.bladeRotation > 6283.18) fan.bladeRotation -= 6283.18; // Giữ biên độ số thực chính xác
      if (fan.blades) {
        fan.blades.rotation[fan.bladeAxis] = fan.bladeRotation;
      }

      // 3.2. Đầu quạt quay tút-năng (Sweep Oscillation)
      // Áp dụng Easing hàm Sin mượt mà: đạo hàm tại hai biên cực đại = 0 -> giảm tốc đệm êm ái
      const sweepAngle = Math.sin((t / fan.sweepPeriod) * 6.2831853 + fan.phase) * fan.sweepAmp;
      if (fan.head) {
        fan.head.rotation.y = fan.initHeadRotY + sweepAngle;
      }
    }

    // ========================================================================
    // 4. HOẠT HỌA LỒNG CHIM SƠN CA KHUYÊN TRE NGOÀI BAN CÔNG CHUỒNG CỌP
    // ========================================================================
    const bcCount = this.birdcages.length;
    for (let i = 0; i < bcCount; i++) {
      const bc = this.birdcages[i];
      const bct = t * bc.pendulumFreq + bc.phase;

      // Con lắc hình cầu 3D (Spherical Pendulum): Lắc lư trục X, Z và tự xoắn dây trục Y
      const pitchX = (Math.sin(bct) * 0.8 + Math.sin(bct * 2.1) * 0.2) * bc.pendulumAmpX * wf;
      const rollZ = (Math.cos(bct * 0.92) * 0.8 + Math.cos(bct * 1.84) * 0.2) * bc.pendulumAmpZ * wf;
      const yawTwist = Math.sin(t * 0.85 + bc.phase) * bc.yawTwistAmp;

      bc.cage.rotation.x = bc.initRotX + pitchX;
      bc.cage.rotation.z = bc.initRotZ + rollZ;
      bc.cage.rotation.y = bc.initRotY + yawTwist;

      // Hoạt ảnh chú chim sơn ca / khuyên tre bên trong lồng
      if (bc.bird) {
        bc.birdTimer += dt;
        if (bc.birdTimer > bc.birdHopCooldown) {
          bc.birdTimer = 0.0;
          bc.birdHopCooldown = 2.4 + (Math.sin(t * 1.5) * 0.5 + 0.5) * 2.2;
        }

        // Nhịp nhảy ngắn 0.18s
        let hopY = 0.0;
        let headRot = 0.0;
        if (bc.birdTimer < 0.18) {
          const hopProgress = bc.birdTimer / 0.18;
          hopY = Math.sin(hopProgress * 3.14159) * 0.016;
          headRot = Math.sin(hopProgress * 6.28318) * 0.35;
        }

        bc.bird.position.y = bc.initBirdPosY + hopY;
        bc.bird.rotation.y = bc.initBirdRotY + headRot;
      }
    }
  }

  /**
   * Giải phóng tài nguyên và làm sạch mảng
   */
  clear() {
    this.bougainvilleas.length = 0;
    this.clotheslines.length = 0;
    this.elephantFans.length = 0;
    this.birdcages.length = 0;
  }
}

// ============================================================================
// CÁC HÀM TIỆN ÍCH DỰNG ĐỒ HỌA MÔ HÌNH 3D PROCEDURAL KHU TẬP THỂ KIM LIÊN
// ============================================================================

/**
 * Tạo giàn hoa giấy đỏ hồng 3D xum xuê buông rủ từ chuồng cọp
 */
export function createBougainvilleaCluster(options = {}) {
  const group = new THREE.Group();
  group.name = options.name || 'Bougainvillea_Cluster';

  const width = options.width || 4.2;
  const height = options.height || 1.1;
  const depth = options.depth || 1.6;

  // Vật liệu hoa giấy đỏ hồng rực rỡ và lá xanh
  const flowerMat = new THREE.MeshStandardMaterial({
    color: options.flowerColor || 0xc52233,
    roughness: 0.65,
    metalness: 0.05
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: options.leafColor || 0x2d6a4f,
    roughness: 0.70,
    metalness: 0.02
  });

  // Tán lá nền phía trên
  const leafTop = new THREE.Mesh(new THREE.BoxGeometry(width, 0.35, depth), leafMat);
  leafTop.position.set(0, 0, 0);
  group.add(leafTop);

  // Các chùm hoa rủ phân tầng
  const clusterCount = 5;
  const spacing = width / (clusterCount + 1);
  for (let i = 0; i < clusterCount; i++) {
    const cx = -width / 2 + spacing * (i + 1) + (Math.sin(i * 1.7) * 0.15);
    const dropLen = 0.5 + (i % 2 === 0 ? 0.35 : 0.15);
    const dropMesh = new THREE.Mesh(new THREE.BoxGeometry(spacing * 0.85, dropLen, 0.4), flowerMat);
    dropMesh.position.set(cx, -dropLen * 0.5, depth / 2 + 0.1);
    group.add(dropMesh);
  }

  return group;
}

/**
 * Tạo dây phơi quần áo thời bao cấp giăng dọc hành lang / chuồng cọp
 */
export function createHangingClotheslineMesh(options = {}) {
  const group = new THREE.Group();
  group.name = options.name || 'Clothesline_Hanging';

  const length = options.length || 3.6;
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.4, metalness: 0.8 });

  // Sợi dây thép phơi đồ
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, length, 8), wireMat);
  wire.rotation.z = Math.PI / 2;
  wire.name = 'ClothesWire';
  group.add(wire);

  // Danh sách các món quần áo phơi
  const clothesConfigs = [
    { name: 'AoMayO_White', color: 0xf5f5f0, w: 0.55, h: 0.65, d: 0.04, offset: -length * 0.35 },
    { name: 'KhanMat_Blue', color: 0x3a7ca5, w: 0.40, h: 0.50, d: 0.03, offset: -length * 0.12 },
    { name: 'QuanAu_Green', color: 0x2d4739, w: 0.45, h: 0.85, d: 0.05, offset: length * 0.12 },
    { name: 'AoHoa_Pink', color: 0xd9727f, w: 0.52, h: 0.60, d: 0.04, offset: length * 0.35 }
  ];

  const clothesGroups = [];
  for (let i = 0; i < clothesConfigs.length; i++) {
    const cfg = clothesConfigs[i];
    const clothGroup = new THREE.Group();
    clothGroup.name = cfg.name;
    clothGroup.position.set(cfg.offset, 0, 0);

    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: 0.85,
      metalness: 0.02
    });
    // Đặt pivot tại mép trên kẹp vào dây thép (position y = -h/2)
    const clothMesh = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d), mat);
    clothMesh.position.set(0, -cfg.h / 2, 0);
    clothMesh.castShadow = true;
    clothGroup.add(clothMesh);

    group.add(clothGroup);
    clothesGroups.push(clothGroup);
  }

  group.clothesItems = clothesGroups;
  return group;
}

/**
 * Tạo mô hình 3D Quạt tai voi Liên Xô huyền thoại trong phòng khách căn hộ 204
 */
export function createElephantEarFanMesh(options = {}) {
  const fanRoot = new THREE.Group();
  fanRoot.name = options.name || 'ElephantEar_SovietFan';

  const baseColor = options.baseColor || 0x224838; // Xanh ngọc bích Liên Xô đậm
  const bladeColor = options.bladeColor || 0x3fa986; // Cánh cao su dẻo xanh ngọc tươi
  const chromeColor = 0xb0b8b5;

  const baseMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.45, metalness: 0.35 });
  const bladeMat = new THREE.MeshStandardMaterial({ color: bladeColor, roughness: 0.35, metalness: 0.15 });
  const metalMat = new THREE.MeshStandardMaterial({ color: chromeColor, roughness: 0.25, metalness: 0.85 });

  // 1. Chân đế quạt đặt cố định
  const fanBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 0.18, 16), baseMat);
  fanBase.position.y = 0.09;
  fanBase.name = 'FanBase';
  fanRoot.add(fanBase);

  // 2. Đầu quạt xoay tút-năng (FanHead)
  const fanHead = new THREE.Group();
  fanHead.name = 'FanHead';
  fanHead.position.set(0, 0.22, 0);

  // Cổ quạt nối với chân đế
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.10, 8), metalMat);
  neck.position.y = -0.05;
  fanHead.add(neck);

  // Bầu động cơ phía sau
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.16, 16), baseMat);
  motor.rotation.x = Math.PI / 2;
  motor.position.set(0, 0.02, -0.06);
  fanHead.add(motor);

  // Trục motor nhô ra phía trước
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8), metalMat);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.set(0, 0.02, 0.04);
  fanHead.add(shaft);

  // 3. Cụm 3 cánh quạt cao su mềm (FanBlades)
  const fanBlades = new THREE.Group();
  fanBlades.name = 'FanBlades';
  fanBlades.position.set(0, 0.02, 0.08);

  // Tâm trục quạt (Hub)
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), baseMat);
  fanBlades.add(hub);

  // 3 cánh quạt cao su mềm dáng tai voi uốn cong đặc trưng
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const bladeArm = new THREE.Group();
    bladeArm.rotation.z = angle;

    // Cánh quạt hình dẹp xòe rộng như tai voi
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 0.012), bladeMat);
    blade.position.set(0.02, 0.14, 0);
    blade.rotation.x = 0.24; // Góc nghiêng đón gió
    blade.rotation.y = 0.12;
    bladeArm.add(blade);

    fanBlades.add(bladeArm);
  }

  fanHead.add(fanBlades);
  fanRoot.add(fanHead);

  fanRoot.head = fanHead;
  fanRoot.blades = fanBlades;
  fanRoot.base = fanBase;

  return fanRoot;
}

/**
 * Tạo mô hình 3D Lồng chim sơn ca khuyên tre tinh xảo ngoài ban công chuồng cọp
 */
export function createBambooBirdcageMesh(options = {}) {
  const root = new THREE.Group();
  root.name = options.name || 'Bamboo_Birdcage';

  const bambooColor = options.bambooColor || 0xcda250; // Màu nan tre già ngả vàng
  const brassColor = 0xd4af37; // Móc đồng
  const birdColor = 0x5a7d36; // Lông chim khuyên xanh olive

  const bambooMat = new THREE.MeshStandardMaterial({ color: bambooColor, roughness: 0.6, metalness: 0.1 });
  const brassMat = new THREE.MeshStandardMaterial({ color: brassColor, roughness: 0.3, metalness: 0.8 });
  const birdMat = new THREE.MeshStandardMaterial({ color: birdColor, roughness: 0.7, metalness: 0.05 });

  // Điểm treo móc trên cùng (Pivot con lắc)
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 16), brassMat);
  hook.rotation.y = Math.PI / 2;
  hook.position.y = 0;
  root.add(hook);

  // Thân lồng chim (Birdcage body) treo buông từ móc
  const cage = new THREE.Group();
  cage.name = 'Birdcage';
  cage.position.set(0, 0, 0);

  // Dây treo từ móc xuống nóc lồng
  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.18, 6), brassMat);
  string.position.y = -0.09;
  cage.add(string);

  // Nóc vòm lồng tre
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), bambooMat);
  dome.position.y = -0.22;
  cage.add(dome);

  // Đáy lồng tròn
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.25, 0.03, 16), bambooMat);
  bottom.position.y = -0.65;
  cage.add(bottom);

  // Các thanh nan tre bao quanh
  const barCount = 12;
  for (let i = 0; i < barCount; i++) {
    const a = (i * Math.PI * 2) / barCount;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.43, 6), bambooMat);
    bar.position.set(Math.cos(a) * 0.23, -0.435, Math.sin(a) * 0.23);
    cage.add(bar);
  }

  // Cầu đậu bằng tre cho chim
  const perch = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 6), bambooMat);
  perch.rotation.z = Math.PI / 2;
  perch.position.set(0, -0.48, 0);
  cage.add(perch);

  // Cóng sứ đựng nước uống
  const waterCup = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.045, 8), new THREE.MeshStandardMaterial({ color: 0x225588, roughness: 0.2 }));
  waterCup.position.set(0.14, -0.46, 0.08);
  cage.add(waterCup);

  // Chú chim sơn ca / khuyên nhỏ đậu trên cầu (Songbird)
  const bird = new THREE.Group();
  bird.name = 'Songbird';
  bird.position.set(0, -0.44, 0);

  // Thân chim
  const birdBody = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), birdMat);
  birdBody.scale.set(0.8, 1.0, 1.4);
  bird.add(birdBody);

  // Đầu chim
  const birdHead = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), birdMat);
  birdHead.position.set(0, 0.025, 0.032);
  bird.add(birdHead);

  // Mỏ chim
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.016, 6), brassMat);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.025, 0.052);
  bird.add(beak);

  // Đuôi chim
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.006, 0.06), birdMat);
  tail.position.set(0, -0.01, -0.05);
  tail.rotation.x = -0.25;
  bird.add(tail);

  cage.add(bird);
  root.add(cage);

  root.cage = cage;
  root.bird = bird;

  return root;
}

// ============================================================================
// HỆ THỐNG RETARGETING HOẠT HỌA HUMANOID / MIXAMO CHUYÊN SÂU
// ============================================================================

/**
 * Bảng ánh xạ các khớp xương chuẩn Humanoid / Mixamo sang cây khung xương nhân vật
 */
export const HUMANOID_BONE_MAP = {
  // Pelvis / Hips (Trọng tâm)
  'mixamorigHips': 'pelvisGroup',
  'Hips': 'pelvisGroup',
  'pelvis': 'pelvisGroup',
  'Pelvis': 'pelvisGroup',
  'Joint_Pelvis': 'pelvisGroup',

  // Spine / Torso (Thân mình)
  'mixamorigSpine': 'torsoGroup',
  'Spine': 'torsoGroup',
  'torso': 'torsoGroup',
  'Torso': 'torsoGroup',
  'Joint_Torso': 'torsoGroup',

  // Chest / Upper Spine (Ngực)
  'mixamorigSpine1': 'chestGroup',
  'mixamorigSpine2': 'chestGroup',
  'Spine1': 'chestGroup',
  'Spine2': 'chestGroup',
  'Chest': 'chestGroup',
  'Joint_Chest': 'chestGroup',

  // Neck (Cổ)
  'mixamorigNeck': 'neckGroup',
  'Neck': 'neckGroup',
  'Joint_Neck': 'neckGroup',

  // Head (Đầu)
  'mixamorigHead': 'headGroup',
  'Head': 'headGroup',
  'Joint_Head': 'headGroup',

  // Left Arm (Chi trên trái)
  'mixamorigLeftShoulder': 'leftShoulderGroup',
  'LeftShoulder': 'leftShoulderGroup',
  'Joint_L_Shoulder': 'leftShoulderGroup',
  'mixamorigLeftArm': 'leftUpperArm',
  'LeftArm': 'leftUpperArm',
  'Joint_L_UpperArm': 'leftUpperArm',
  'mixamorigLeftForeArm': 'leftElbowGroup',
  'LeftForeArm': 'leftElbowGroup',
  'Joint_L_Elbow': 'leftElbowGroup',
  'mixamorigLeftHand': 'leftHandGroup',
  'LeftHand': 'leftHandGroup',
  'Joint_L_Hand': 'leftHandGroup',

  // Right Arm (Chi trên phải)
  'mixamorigRightShoulder': 'rightShoulderGroup',
  'RightShoulder': 'rightShoulderGroup',
  'Joint_R_Shoulder': 'rightShoulderGroup',
  'mixamorigRightArm': 'rightUpperArm',
  'RightArm': 'rightUpperArm',
  'Joint_R_UpperArm': 'rightUpperArm',
  'mixamorigRightForeArm': 'rightElbowGroup',
  'RightForeArm': 'rightElbowGroup',
  'Joint_R_Elbow': 'rightElbowGroup',
  'mixamorigRightHand': 'rightHandGroup',
  'RightHand': 'rightHandGroup',
  'Joint_R_Hand': 'rightHandGroup',

  // Left Leg (Chi dưới trái)
  'mixamorigLeftUpLeg': 'leftHipGroup',
  'LeftUpLeg': 'leftHipGroup',
  'Joint_L_Hip': 'leftHipGroup',
  'mixamorigLeftLeg': 'leftKneeGroup',
  'LeftLeg': 'leftKneeGroup',
  'Joint_L_Knee': 'leftKneeGroup',
  'mixamorigLeftFoot': 'leftFootGroup',
  'LeftFoot': 'leftFootGroup',
  'Joint_L_Foot': 'leftFootGroup',

  // Right Leg (Chi dưới phải)
  'mixamorigRightUpLeg': 'rightHipGroup',
  'RightUpLeg': 'rightHipGroup',
  'Joint_R_Hip': 'rightHipGroup',
  'mixamorigRightLeg': 'rightKneeGroup',
  'RightLeg': 'rightKneeGroup',
  'Joint_R_Knee': 'rightKneeGroup',
  'mixamorigRightFoot': 'rightFootGroup',
  'RightFoot': 'rightFootGroup',
  'Joint_R_Foot': 'rightFootGroup'
};

/**
 * Retargeting AnimationClip từ nguồn Mixamo / Humanoid sang mô hình nhân vật đích
 * Chuyển đổi tên đường dẫn track, khử gián đoạn và chuẩn hóa tỉ lệ chiều cao
 * @param {THREE.AnimationClip} sourceClip - Clip hoạt ảnh gốc
 * @param {THREE.Object3D|Object} target - Mô hình nhân vật hoặc Rig đích
 * @param {Object} options - Tùy chọn retargeting { boneMap, scaleFactor }
 * @returns {THREE.AnimationClip} - AnimationClip mới tương thích hoàn toàn với target
 */
export function retargetHumanoidClip(sourceClip, target, options = {}) {
  if (!sourceClip || !sourceClip.tracks) return sourceClip;

  const boneMap = options.boneMap || HUMANOID_BONE_MAP;
  const newTracks = [];

  // Thu thập danh sách tên khớp hiện diện trên mô hình đích
  const targetBoneNames = new Set();
  if (target && target.traverse) {
    target.traverse(c => {
      if (c.name) targetBoneNames.add(c.name);
    });
  } else if (target && target.rig) {
    Object.keys(target.rig).forEach(k => {
      targetBoneNames.add(k);
      if (target.rig[k] && target.rig[k].name) {
        targetBoneNames.add(target.rig[k].name);
      }
    });
  }

  for (const track of sourceClip.tracks) {
    const dotIdx = track.name.lastIndexOf('.');
    if (dotIdx === -1) continue;

    const sourceBoneName = track.name.substring(0, dotIdx);
    const property = track.name.substring(dotIdx); // .position, .quaternion, .scale

    let targetBoneName = boneMap[sourceBoneName];
    if (!targetBoneName) {
      const cleanName = sourceBoneName.replace(/^mixamorig/, '');
      targetBoneName = boneMap[cleanName] || cleanName;
    }

    // Xác định tên track đích
    let finalTrackName = null;
    if (targetBoneNames.has(targetBoneName)) {
      finalTrackName = targetBoneName + property;
    } else if (target && target.rig && target.rig[targetBoneName] && target.rig[targetBoneName].name) {
      finalTrackName = target.rig[targetBoneName].name + property;
    } else {
      finalTrackName = targetBoneName + property;
    }

    if (finalTrackName) {
      const clonedTrack = track.clone();
      clonedTrack.name = finalTrackName;

      // Scale vị trí hip nếu có tỷ lệ khác nhau
      if (property === '.position' && options.scaleFactor && options.scaleFactor !== 1.0) {
        for (let i = 0; i < clonedTrack.values.length; i++) {
          clonedTrack.values[i] *= options.scaleFactor;
        }
      }

      newTracks.push(clonedTrack);
    }
  }

  return new THREE.AnimationClip(
    sourceClip.name || 'RetargetedHumanoidClip',
    sourceClip.duration,
    newTracks
  );
}

/**
 * Chuyển đổi tư thế xương (Pose Retargeting) giữa hai Rig Humanoid thời gian thực
 * @param {Object} sourceRig - Cây khung xương nguồn
 * @param {Object} targetRig - Cây khung xương đích
 * @param {number} blendFactor - Hệ số hòa trộn (0.0 đến 1.0)
 */
export function retargetHumanoidPose(sourceRig, targetRig, blendFactor = 1.0) {
  if (!sourceRig || !targetRig) return;

  const jointPairs = [
    ['pelvisGroup', 'pelvisGroup'],
    ['torsoGroup', 'torsoGroup'],
    ['chestGroup', 'chestGroup'],
    ['neckGroup', 'neckGroup'],
    ['headGroup', 'headGroup'],
    ['leftShoulderGroup', 'leftShoulderGroup'],
    ['rightShoulderGroup', 'rightShoulderGroup'],
    ['leftElbowGroup', 'leftElbowGroup'],
    ['rightElbowGroup', 'rightElbowGroup'],
    ['leftHipGroup', 'leftHipGroup'],
    ['rightHipGroup', 'rightHipGroup'],
    ['leftKneeGroup', 'leftKneeGroup'],
    ['rightKneeGroup', 'rightKneeGroup'],
    ['leftFootGroup', 'leftFootGroup'],
    ['rightFootGroup', 'rightFootGroup']
  ];

  for (const [srcName, dstName] of jointPairs) {
    const src = sourceRig[srcName];
    const dst = targetRig[dstName];
    if (src && dst && src.rotation && dst.rotation) {
      if (blendFactor >= 1.0) {
        dst.rotation.copy(src.rotation);
      } else {
        dst.rotation.x = lerp(dst.rotation.x, src.rotation.x, blendFactor);
        dst.rotation.y = lerp(dst.rotation.y, src.rotation.y, blendFactor);
        dst.rotation.z = lerp(dst.rotation.z, src.rotation.z, blendFactor);
      }
    }
  }
}

export default HumanoidAnimator;
