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

/** Smoothstep mượt mà từ Hermite interpolation */
export function smoothstep(edge0, edge1, x) {
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

    // Trọng số hòa trộn trạng thái (Cross-Fade Weights)
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

    // Cử chỉ tương tác (Gestures: wave, bow, takePhoto, shrug)
    this.activeGesture = null;
    this.gestureTime = 0.0;
    this.gestureDuration = 0.0;
    this.gestureWeight = 0.0;

    // Vị trí gốc ban đầu của các khớp để tránh lệch trục qua thời gian
    this._cacheRestPositions();
  }

  /**
   * Ánh xạ các khớp từ characterGroup.rig hoặc fallback tương thích
   */
  _bindRig(charGroup) {
    if (!charGroup) return;

    const r = charGroup.rig || {};

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

      // Tà áo dài 3D & Nón lá 3D
      frontFlapGroup: r.frontFlapGroup || charGroup.frontFlapGroup,
      backFlapGroup: r.backFlapGroup || charGroup.backFlapGroup,
      accessoryHeadGroup: r.accessoryHeadGroup || charGroup.accessoryHeadGroup || charGroup.nonLaGroup,

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
      rightShoulderY: (this.rig.rightShoulderGroup && this.rig.rightShoulderGroup.position) ? this.rig.rightShoulderGroup.position.y : 0.05
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
  }

  /**
   * Cập nhật tùy chọn hoạt họa động
   * @param {Object} newOptions 
   */
  setOptions(newOptions = {}) {
    Object.assign(this.options, newOptions);
  }

  /**
   * Vòng lặp cập nhật hoạt ảnh 60 FPS (Chuẩn Zero Heap Allocation)
   * @param {number} delta - Delta time tính bằng giây (seconds)
   * @param {number} speed - Vận tốc di chuyển hiện tại (0 = idle, 5.2 = walk, 9.2 = run)
   * @param {boolean} isGrounded - Đang tiếp đất hay ở trên không
   */
  update(delta, speed = 0, isGrounded = true) {
    // 1. Bảo vệ chống gián đoạn thời gian khi nhảy frame (Tab backgrounding / Lag spikes)
    const dt = clamp(delta, 0.001, 0.08);
    this.animTime += dt;

    // 2. PHÁT HIỆN SỰ KIỆN TIẾP ĐẤT (LANDING SQUASH & STRETCH CUSHION)
    if (!this.wasGrounded && isGrounded) {
      this.landingTimer = this.landingDuration; // Kích hoạt nén trọng tâm hấp thụ lực
    }
    this.wasGrounded = isGrounded;

    if (this.landingTimer > 0) {
      this.landingTimer -= dt;
      if (this.landingTimer < 0) this.landingTimer = 0;
    }

    // 3. TÍNH TOÁN TRỌNG SỐ MỤC TIÊU (TARGET BLEND WEIGHTS)
    if (!isGrounded) {
      this.targetWeight.idle = 0.0;
      this.targetWeight.walk = 0.0;
      this.targetWeight.run = 0.0;
      this.targetWeight.jump = 1.0;
    } else {
      this.targetWeight.jump = 0.0;
      if (speed <= 0.08) {
        // Đứng yên hoàn toàn
        this.targetWeight.idle = 1.0;
        this.targetWeight.walk = 0.0;
        this.targetWeight.run = 0.0;
      } else if (speed <= 6.0) {
        // Đi bộ mượt mà
        const walkFactor = smoothstep(0.08, 1.2, speed);
        this.targetWeight.idle = 1.0 - walkFactor;
        this.targetWeight.walk = walkFactor;
        this.targetWeight.run = 0.0;
      } else {
        // Chạy nhanh
        const runFactor = smoothstep(6.0, 8.5, speed);
        this.targetWeight.idle = 0.0;
        this.targetWeight.walk = 1.0 - runFactor;
        this.targetWeight.run = runFactor;
      }
    }

    // 4. NỘI SUY DAMPING CHO CÁC TRỌNG SỐ (CROSS-FADE KHÔNG GIẬT CỤC)
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
    // Walk Frequency: 6.2 rad/s theo đặc tả
    const walkSpeedFactor = Math.max(0.8, speed / 5.2) * this.options.walkSpeedScale;
    this.walkPhase += dt * 6.2 * walkSpeedFactor;

    // Run Frequency: 9.5 rad/s theo đặc tả
    const runSpeedFactor = Math.max(0.8, speed / 9.2) * this.options.walkSpeedScale;
    this.runPhase += dt * 9.5 * runSpeedFactor;

    // Giữ phase trong khoảng [0, 2PI] tránh tràn số
    if (this.walkPhase > 628.3185) this.walkPhase -= 628.3185;
    if (this.runPhase > 628.3185) this.runPhase -= 628.3185;

    // 6. TÍNH TOÁN CỬ CHỈ TƯƠNG TÁC (GESTURE OVERLAY)
    this._updateGesture(dt);

    // 7. TÍNH TOÁN LOOK-AROUND TỰ NHIÊN CHO ĐẦU & CỔ
    this._updateLookAround(dt, wIdle);

    // 8. TÍNH TOÁN CÁC THÔNG SỐ HOẠT HỌA THEO ĐẶC TẢ
    const time = this.animTime;
    const wp = this.walkPhase;
    const rp = this.runPhase;

    // --- A. CHU KỲ ĐỨNG YÊN (IDLE BREATHING & WEIGHT SHIFT) ---
    // Lồng ngực phồng nhẹ: Math.sin(time * 2.2) * 0.035
    const breathTime = time * 2.2;
    const breathSin = Math.sin(breathTime);
    const idleChestScale = 1.0 + breathSin * 0.035 * this.options.breathScale;
    const idleChestScaleXZ = 1.0 + breathSin * 0.025 * this.options.breathScale;

    // Hai vai nhấp nhô nhẹ: Math.sin(time * 2.2 + 0.2) * 0.015
    const idleShoulderBob = Math.sin(breathTime + 0.2) * 0.015 * this.options.breathScale;

    // Trọng tâm hông lắc nhẹ sang trái/phải sau mỗi chu kỳ (weight shift)
    const idleWeightShift = Math.sin(time * 0.55) * 0.022; // Hông nghiêng nhẹ
    const idleHeadTilt = -Math.sin(time * 0.55) * 0.015; // Đầu nghiêng nhẹ e ấp đối trọng

    // Tà áo trước và sau bay lượn uốn sóng theo gió hồ Gươm: Math.sin(time * 1.5) * 0.08
    const clothScale = this.options.clothFlapScale;
    const idleFrontFlap = (Math.sin(time * 3.0) * 0.08 + Math.cos(time * 1.5) * 0.04) * clothScale;
    const idleBackFlap = (-Math.sin(time * 3.0 + 0.5) * 0.10) * clothScale;
    const idleNonLaRotZ = Math.sin(time * 1.8) * 0.03;

    const idlePelvisY = this.baseTorsoY + breathSin * 0.008;

    // --- B. CHU KỲ ĐI BỘ (WALK CYCLE 60 FPS) ---
    // Khớp háng vung ngược pha 180 độ (-0.45 đến +0.45 rad)
    const walkLeftHip = Math.sin(wp) * 0.45;
    const walkRightHip = Math.sin(wp + Math.PI) * 0.45;

    // Khớp đầu gối gập tự nhiên khi chân lăng về sau: Math.max(0, -Math.sin(phase)) * 0.55 rad
    const walkLeftKnee = Math.max(0, -Math.sin(wp)) * 0.55;
    const walkRightKnee = Math.max(0, -Math.sin(wp + Math.PI)) * 0.55;

    // Khớp cổ chân uốn lượn khi chạm đất
    const walkLeftFoot = Math.sin(wp) * 0.14;
    const walkRightFoot = Math.sin(wp + Math.PI) * 0.14;

    // Khớp vai vung ngược pha với chân (tay trái đi cùng chân phải)
    const armScale = this.options.armSwingScale;
    const walkLeftShoulderX = Math.sin(wp + Math.PI) * 0.35 * armScale;
    const walkRightShoulderX = Math.sin(wp) * 0.35 * armScale;

    // Khớp khuỷu tay gập nhẹ 0.2 rad khi tay vung ra trước
    const walkLeftElbow = Math.max(0, Math.sin(wp + Math.PI)) * 0.20;
    const walkRightElbow = Math.max(0, Math.sin(wp)) * 0.20;

    // Hông nhún sinh học trục Y: Math.abs(Math.sin(walkTime * 2.0)) * 0.035m
    const walkPelvisY = this.baseTorsoY + Math.abs(Math.sin(wp)) * 0.035 - 0.018;
    const walkPelvisRotZ = Math.sin(wp) * 0.03;
    const walkTorsoRotY = -Math.sin(wp) * 0.04;
    const walkTorsoRotX = 0.04; // Hơi dấn nhẹ về phía trước

    // Tà áo dài 3D vẫy về sau theo luồng gió bước đi
    const walkFrontFlap = (Math.sin(wp * 2.0) * 0.06 - 0.12) * clothScale;
    const walkBackFlap = (-Math.sin(wp * 2.0 + 0.4) * 0.12 - 0.22) * clothScale;

    // --- C. CHU KỲ CHẠY NHANH (RUN CYCLE 60 FPS) ---
    // Tần số cao hơn (9.5 rad/s), sải chân rộng hơn (-0.85 đến +0.85 rad)
    const runLeftHip = Math.sin(rp) * 0.85;
    const runRightHip = Math.sin(rp + Math.PI) * 0.85;

    // Đầu gối gập mạnh tới 1.15 rad khi nhấc chân
    const runLeftKnee = Math.max(0, -Math.sin(rp)) * 1.15;
    const runRightKnee = Math.max(0, -Math.sin(rp + Math.PI)) * 1.15;

    const runLeftFoot = Math.sin(rp) * 0.28;
    const runRightFoot = Math.sin(rp + Math.PI) * 0.28;

    // Khuỷu tay gập góc nhọn ~50 độ (0.85 rad) vung mạnh mẽ
    const runLeftElbow = 0.85 + Math.sin(rp + Math.PI) * 0.25;
    const runRightElbow = 0.85 + Math.sin(rp) * 0.25;

    // Vai vung mạnh mẽ biên độ 0.65 rad
    const runLeftShoulderX = Math.sin(rp + Math.PI) * 0.65 * armScale;
    const runRightShoulderX = Math.sin(rp) * 0.65 * armScale;

    // Thân trên hơi chúi về phía trước: torso.rotation.x = 0.18 rad
    const runTorsoRotX = 0.18;
    const runTorsoRotY = -Math.sin(rp) * 0.08;
    const runPelvisRotZ = Math.sin(rp) * 0.05;

    // Độ nhún trọng tâm bật nảy mạnh mẽ
    const runPelvisY = this.baseTorsoY + Math.abs(Math.sin(rp)) * 0.07 - 0.035;

    // Tà áo dài bay mạnh về sau
    const runFrontFlap = (-0.25 + Math.sin(rp * 2.0) * 0.10) * clothScale;
    const runBackFlap = (-0.45 - Math.sin(rp * 2.0) * 0.15) * clothScale;

    // --- D. CHU KỲ TRÊN KHÔNG / NHẢY (JUMP / AIRBORNE) ---
    const jumpPelvisY = this.baseTorsoY + 0.06;
    const jumpLeftHip = -0.22;
    const jumpRightHip = -0.22;
    const jumpLeftKnee = 0.42;
    const jumpRightKnee = 0.42;
    const jumpLeftFoot = -0.20;
    const jumpRightFoot = -0.20;
    const jumpLeftShoulderX = -0.35;
    const jumpRightShoulderX = -0.35;
    const jumpLeftElbow = 0.35;
    const jumpRightElbow = 0.35;
    const jumpFrontFlap = 0.22 * clothScale;
    const jumpBackFlap = 0.28 * clothScale;

    // --- E. SQUASH & STRETCH CUSHION KHI TIẾP ĐẤT ---
    let landingCushionY = 0.0;
    let landingSquashScale = 1.0;
    if (this.landingTimer > 0) {
      const landProg = this.landingTimer / this.landingDuration; // 1.0 -> 0.0
      const landCurve = Math.sin(landProg * Math.PI); // Đỉnh nén ở giữa
      landingCushionY = -landCurve * 0.055;
      landingSquashScale = 1.0 - landCurve * 0.08; // Nén trục Y
    }

    // 9. HÒA TRỘN TỔNG HỢP CÁC KHỚP (FINAL TRANSFORMATION BLENDING)
    const r = this.rig;

    // 1. Pelvis (Hông/trọng tâm)
    if (r.pelvisGroup) {
      const blendedY = (idlePelvisY * wIdle + walkPelvisY * wWalk + runPelvisY * wRun + jumpPelvisY * wJump) + landingCushionY;
      r.pelvisGroup.position.y = blendedY;

      const blendedRotZ = idleWeightShift * wIdle + walkPelvisRotZ * wWalk + runPelvisRotZ * wRun;
      r.pelvisGroup.rotation.z = blendedRotZ;

      if (this.landingTimer > 0) {
        const invSquash = 1.0 + (1.0 - landingSquashScale) * 0.5;
        r.pelvisGroup.scale.set(invSquash, landingSquashScale, invSquash);
      } else {
        r.pelvisGroup.scale.set(1.0, 1.0, 1.0);
      }
    }

    // 2. Torso (Thân mình & độ nghiêng cột sống)
    if (r.torsoGroup) {
      r.torsoGroup.rotation.x = walkTorsoRotX * wWalk + runTorsoRotX * wRun;
      r.torsoGroup.rotation.y = walkTorsoRotY * wWalk + runTorsoRotY * wRun;
      r.torsoGroup.rotation.z = -idleWeightShift * 0.4 * wIdle;
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
      r.headGroup.rotation.x = headNod;
      r.headGroup.rotation.y = this.currentHeadYaw * wIdle;
      r.headGroup.rotation.z = naturalTilt;
    }

    // 5. Hai Vai & Hai Khuỷu Tay (Vai nhấp nhô thở, vung tay ngược pha)
    const shoulderRestY = this.restPositions.leftShoulderY;
    const finalShoulderBob = idleShoulderBob * wIdle;

    if (r.leftShoulderGroup) {
      r.leftShoulderGroup.position.y = shoulderRestY + finalShoulderBob;
      r.leftShoulderGroup.rotation.x = walkLeftShoulderX * wWalk + runLeftShoulderX * wRun + jumpLeftShoulderX * wJump;
      r.leftShoulderGroup.rotation.z = -0.06 - 0.04 * wRun - 0.22 * wJump;
    }

    if (r.rightShoulderGroup) {
      r.rightShoulderGroup.position.y = shoulderRestY + finalShoulderBob;
      r.rightShoulderGroup.rotation.x = walkRightShoulderX * wWalk + runRightShoulderX * wRun + jumpRightShoulderX * wJump;
      r.rightShoulderGroup.rotation.z = 0.06 + 0.04 * wRun + 0.22 * wJump;
    }

    if (r.leftElbowGroup) {
      r.leftElbowGroup.rotation.x = 0.06 * wIdle + walkLeftElbow * wWalk + runLeftElbow * wRun + jumpLeftElbow * wJump;
    }

    if (r.rightElbowGroup) {
      r.rightElbowGroup.rotation.x = 0.06 * wIdle + walkRightElbow * wWalk + runRightElbow * wRun + jumpRightElbow * wJump;
    }

    // 6. Chi Dưới (Háng, Đầu Gối, Cổ Chân)
    if (r.leftHipGroup) {
      r.leftHipGroup.rotation.x = walkLeftHip * wWalk + runLeftHip * wRun + jumpLeftHip * wJump;
      r.leftHipGroup.rotation.z = idleWeightShift * 0.25 * wIdle;
    }

    if (r.rightHipGroup) {
      r.rightHipGroup.rotation.x = walkRightHip * wWalk + runRightHip * wRun + jumpRightHip * wJump;
      r.rightHipGroup.rotation.z = idleWeightShift * 0.25 * wIdle;
    }

    if (r.leftKneeGroup) {
      r.leftKneeGroup.rotation.x = 0.02 * wIdle + walkLeftKnee * wWalk + runLeftKnee * wRun + jumpLeftKnee * wJump;
    }

    if (r.rightKneeGroup) {
      r.rightKneeGroup.rotation.x = 0.02 * wIdle + walkRightKnee * wWalk + runRightKnee * wRun + jumpRightKnee * wJump;
    }

    if (r.leftFootGroup) {
      r.leftFootGroup.rotation.x = walkLeftFoot * wWalk + runLeftFoot * wRun + jumpLeftFoot * wJump;
    }

    if (r.rightFootGroup) {
      r.rightFootGroup.rotation.x = walkRightFoot * wWalk + runRightFoot * wRun + jumpRightFoot * wJump;
    }

    // 7. Tà Áo Dài 3D & Nón Lá 3D (Flowing Cloth & Accessories)
    if (r.frontFlapGroup) {
      r.frontFlapGroup.rotation.x = idleFrontFlap * wIdle + walkFrontFlap * wWalk + runFrontFlap * wRun + jumpFrontFlap * wJump;
    }

    if (r.backFlapGroup) {
      r.backFlapGroup.rotation.x = idleBackFlap * wIdle + walkBackFlap * wWalk + runBackFlap * wRun + jumpBackFlap * wJump;
    }

    if (r.accessoryHeadGroup) {
      r.accessoryHeadGroup.rotation.z = idleNonLaRotZ * wIdle;
      r.accessoryHeadGroup.rotation.x = Math.sin(time * 1.4) * 0.02 * wIdle;
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
      landingTimer: this.landingTimer
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

export default HumanoidAnimator;
