/**
 * test_3d_humanoid_system.mjs - Comprehensive QA/QC Test Suite
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 * 
 * Kiểm định 4 tầng:
 * 1. Khởi tạo mô hình 3D cho cả 4 nhân vật chuẩn GDD.
 * 2. Xác nhận 100% KHÔNG có 2D billboard/plane trên cơ thể nhân vật người chơi.
 * 3. Kiểm định cấu trúc cây xương Rigging phân cấp hoàn chỉnh (Pelvis -> Torso -> Chest -> Neck -> Head, Arms, Legs, Flaps).
 * 4. Kiểm định HumanoidAnimator 60 FPS qua các chu kỳ: Idle, Walk, Run, Jump, Landing Cushion.
 * 5. Xác nhận Zero Heap Allocation trong game loop.
 * 6. Toàn vẹn tài nguyên PBR texture và NPC bảo tồn.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 0. Thiết lập môi trường Mock an toàn cho Node.js
if (typeof window === 'undefined') {
  globalThis.window = globalThis;
}
if (typeof localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

// 1. Nhập Three.js và các module cốt lõi
import * as THREE from '../src/lib/three.module.js';
import { createHanoiCharacter3D, CHARACTERS_META, findCharacterMeta } from '../src/core/CharacterFactory.js';
import { HumanoidAnimator, lerp, clamp, smoothstep, damp, Easing } from '../src/core/animations.js';
import { GameAPI } from '../src/bridge/GameAPI.js';
import { GameEventBus } from '../src/bridge/GameEvents.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testLogs = [];

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    testLogs.push(`  [PASS] ${message}`);
  } else {
    failedTests++;
    testLogs.push(`  [FAIL] ${message}`);
    console.error(`FAILED: ${message}`);
  }
}

console.log('================================================================');
console.log(' QA/QC AUDIT SUITE: HỆ THỐNG NHÂN VẬT 3D HUMANOID & HOẠT HỌA 60 FPS');
console.log(' Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// CHẶNG 1: KHỞI TẠO MÔ HÌNH 3D CHO CẢ 4 NHÂN VẬT CHUẨN GDD
// -----------------------------------------------------------------------------
console.log('--- CHẶNG 1: Khởi Tạo 4 Nhân Vật 3D ---');

const EXPECTED_CHAR_IDS = [
  'char_nu_sinh_ao_dai',
  'char_co_gai_ao_ba_ba',
  'char_nam_tri_thuc_suit',
  'char_nam_ao_dai_gam'
];

assert(CHARACTERS_META.length === 4, `Đúng 4 metadata nhân vật trong CHARACTERS_META (thực tế: ${CHARACTERS_META.length})`);

const charactersMap = new Map();

for (const charId of EXPECTED_CHAR_IDS) {
  const meta = findCharacterMeta(charId);
  assert(meta && meta.id === charId, `Tìm thấy metadata cho [${charId}]: "${meta ? meta.name : 'N/A'}"`);

  const charGroup = createHanoiCharacter3D(charId);
  assert(charGroup instanceof THREE.Group, `createHanoiCharacter3D("${charId}") trả về THREE.Group`);
  assert(charGroup.name === `HanoiCharacter_${charId}`, `Tên nhóm đúng quy ước: ${charGroup.name}`);
  assert(charGroup.rig !== undefined && charGroup.rig !== null, `charGroup có thuộc tính rig hợp lệ`);
  assert(charGroup.baseTorsoY === 0.95, `Cao độ trọng tâm baseTorsoY = 0.95m chuẩn kiến trúc`);

  charactersMap.set(charId, charGroup);
}

// -----------------------------------------------------------------------------
// CHẶNG 2: XÁC NHẬN KHÔNG CÓ BẤT KỲ 2D PLANE/BILLBOARD NÀO TRÊN CƠ THỂ
// -----------------------------------------------------------------------------
console.log('\n--- CHẶNG 2: Kiểm Định Xóa Bỏ Hoàn Toàn 2D Billboard / Cutout ---');

for (const [charId, charGroup] of charactersMap.entries()) {
  assert(charGroup.frontPlane === undefined, `[${charId}] KHÔNG CÓ thuộc tính frontPlane 2.5D`);
  assert(charGroup.backPlane === undefined, `[${charId}] KHÔNG CÓ thuộc tính backPlane 2.5D`);

  let spriteCount = 0;
  let has2DPlaneBody = false;

  charGroup.traverse((child) => {
    if (child.isSprite) {
      spriteCount++;
    }
    // Kiểm tra xem có mesh dạng mặt phẳng 2D làm thân (torso / head) không
    if (child.isMesh && child.geometry instanceof THREE.PlaneGeometry) {
      // Chỉ cho phép PlaneGeometry làm tà áo (flap) mềm uốn cong
      const isFlap = child.parent && (
        child.parent.name === 'Joint_FrontFlap' || 
        child.parent.name === 'Joint_BackFlap' ||
        child.parent.name === 'ClothingGroup'
      );
      if (!isFlap) {
        has2DPlaneBody = true;
      }
    }
  });

  assert(spriteCount === 0, `[${charId}] Không chứa bất kỳ THREE.Sprite nào (Sprite count: ${spriteCount})`);
  assert(!has2DPlaneBody, `[${charId}] Không dùng mặt phẳng 2D PlaneGeometry cho thân người`);

  // Xác nhận thân, đầu, chân, tay đều là hình khối 3D thật sự
  const rig = charGroup.rig;
  const torsoMesh = rig.torsoGroup.children.find(c => c.isMesh);
  const headMesh = rig.headGroup.children.find(c => c.isMesh);
  const upperLegMesh = rig.leftUpperLeg.children.find(c => c.isMesh);
  const upperArmMesh = rig.leftUpperArm.children.find(c => c.isMesh);

  assert(torsoMesh && torsoMesh.geometry instanceof THREE.CylinderGeometry, `[${charId}] Thân mình (Torso) là hình trụ 3D CylinderGeometry`);
  assert(headMesh && headMesh.geometry instanceof THREE.SphereGeometry, `[${charId}] Đầu & mặt là hình cầu 3D SphereGeometry`);
  assert(upperLegMesh && upperLegMesh.geometry instanceof THREE.CylinderGeometry, `[${charId}] Đùi (Thigh) là hình trụ 3D CylinderGeometry`);
  assert(upperArmMesh && upperArmMesh.geometry instanceof THREE.CylinderGeometry, `[${charId}] Bắp tay (Arm) là hình trụ 3D CylinderGeometry`);
}

// -----------------------------------------------------------------------------
// CHẶNG 3: KIỂM ĐỊNH CÂY KHUNG XƯƠNG PHÂN CẤP (SKELETAL RIG HIERARCHY)
// -----------------------------------------------------------------------------
console.log('\n--- CHẶNG 3: Kiểm Định Khớp Phân Cấp Cây Xương (Rig Hierarchy) ---');

const REQUIRED_JOINTS = [
  'pelvisGroup',
  'torsoGroup',
  'chestGroup',
  'neckGroup',
  'headGroup',
  'leftShoulderGroup',
  'rightShoulderGroup',
  'leftElbowGroup',
  'rightElbowGroup',
  'leftHipGroup',
  'rightHipGroup',
  'leftKneeGroup',
  'rightKneeGroup',
  'leftFootGroup',
  'rightFootGroup',
  'frontFlapGroup',
  'backFlapGroup'
];

for (const [charId, charGroup] of charactersMap.entries()) {
  const rig = charGroup.rig;
  let allJointsExist = true;

  for (const jointName of REQUIRED_JOINTS) {
    if (!rig[jointName] || !(rig[jointName] instanceof THREE.Group)) {
      allJointsExist = false;
      assert(false, `[${charId}] Thiếu khớp ${jointName}`);
    }
  }

  assert(allJointsExist, `[${charId}] Đầy đủ toàn bộ 17 khớp xương phân cấp`);

  // Kiểm tra quan hệ cha - con phân cấp giải phẫu học
  assert(rig.pelvisGroup.parent === charGroup, `[${charId}] Pelvis là con trực tiếp của characterGroup`);
  assert(rig.torsoGroup.parent === rig.pelvisGroup, `[${charId}] Torso gắn liền với Pelvis`);
  assert(rig.chestGroup.parent === rig.torsoGroup, `[${charId}] Chest gắn liền với Torso`);
  assert(rig.neckGroup.parent === rig.chestGroup, `[${charId}] Neck gắn liền với Chest`);
  assert(rig.headGroup.parent === rig.neckGroup, `[${charId}] Head gắn liền với Neck`);
  assert(rig.leftShoulderGroup.parent === rig.chestGroup, `[${charId}] Vai trái gắn vào lồng ngực Chest`);
  assert(rig.rightShoulderGroup.parent === rig.chestGroup, `[${charId}] Vai phải gắn vào lồng ngực Chest`);
  assert(rig.leftHipGroup.parent === rig.pelvisGroup, `[${charId}] Háng trái gắn vào khung chậu Pelvis`);
  assert(rig.rightHipGroup.parent === rig.pelvisGroup, `[${charId}] Háng phải gắn vào khung chậu Pelvis`);
}

// -----------------------------------------------------------------------------
// CHẶNG 4: KIỂM ĐỊNH HUMANOID ANIMATOR 60 FPS QUA 4 TRẠNG THÁI & TIẾP ĐẤT
// -----------------------------------------------------------------------------
console.log('\n--- CHẶNG 4: Kiểm Định Bộ Hoạt Họa HumanoidAnimator 60 FPS ---');

const primaryChar = charactersMap.get('char_nu_sinh_ao_dai');
const animator = new HumanoidAnimator(primaryChar);

// 4.1. TRẠNG THÁI IDLE (Đứng yên)
console.log('-> Kiểm thử Trạng thái IDLE (speed = 0, isGrounded = true)...');
for (let f = 0; f < 60; f++) {
  animator.update(0.016, 0.0, true);
}
let state = animator.getState();
assert(state.weights.idle > 0.98, `Trọng số idle đạt > 98% (thực tế: ${(state.weights.idle * 100).toFixed(1)}%)`);
assert(state.weights.walk < 0.02, `Trọng số walk triệt tiêu < 2% (thực tế: ${(state.weights.walk * 100).toFixed(1)}%)`);

// Nhịp thở lồng ngực: scale lồng ngực dao động quanh 1.0
const chestScaleY = primaryChar.rig.chestGroup.scale.y;
assert(Math.abs(chestScaleY - 1.0) <= 0.04, `Nhịp thở lồng ngực dao động nhẹ tự nhiên (scale.y: ${chestScaleY.toFixed(4)})`);

// Tà áo dài đung đưa theo gió
const flapRotX = primaryChar.rig.frontFlapGroup.rotation.x;
assert(Math.abs(flapRotX) > 0.001, `Tà áo dài có lay động nhẹ theo gió hồ Gươm (rotX: ${flapRotX.toFixed(4)})`);

// 4.2. TRẠNG THÁI WALK (Đi bộ)
console.log('-> Kiểm thử Trạng thái WALK (speed = 3.5, isGrounded = true)...');
let maxHipStride = 0;
let minHipStride = 0;
let maxKneeFlex = 0;
let hasArmOpposition = false;
let minKneeFlex = 999;
let flapSwayObserved = false;
const initialPelvisY = primaryChar.rig.pelvisGroup.position.y;
let pelvisYBobMax = 0;

for (let f = 0; f < 60; f++) {
  animator.update(0.016, 3.5, true);
  const lh = primaryChar.rig.leftHipGroup.rotation.x;
  const rh = primaryChar.rig.rightHipGroup.rotation.x;
  const lk = primaryChar.rig.leftKneeGroup.rotation.x;
  const rk = primaryChar.rig.rightKneeGroup.rotation.x;
  const la = primaryChar.rig.leftShoulderGroup.rotation.x;
  const ra = primaryChar.rig.rightShoulderGroup.rotation.x;
  const py = primaryChar.rig.pelvisGroup.position.y;
  const flapX = primaryChar.rig.frontFlapGroup.rotation.x;

  maxHipStride = Math.max(maxHipStride, lh, rh);
  minHipStride = Math.min(minHipStride, lh, rh);
  maxKneeFlex = Math.max(maxKneeFlex, lk, rk);
  minKneeFlex = Math.min(minKneeFlex, lk, rk);
  if (la * ra < -0.01) hasArmOpposition = true;
  pelvisYBobMax = Math.max(pelvisYBobMax, Math.abs(py - initialPelvisY));
  if (Math.abs(flapX) > 0.05) flapSwayObserved = true;
}

state = animator.getState();
assert(state.weights.walk > 0.90, `Trọng số walk hòa trộn mượt > 90% (thực tế: ${(state.weights.walk * 100).toFixed(1)}%)`);

// Sải bước chân biên độ đầy đủ
const totalStrideAmplitude = maxHipStride - minHipStride;
assert(totalStrideAmplitude > 0.6, `Sải bước chân biên độ rộng khi đi bộ (Biên độ dao động: ${totalStrideAmplitude.toFixed(3)} rad)`);

// Vung tay ngược pha với chân (tay trái ngược pha tay phải)
assert(hasArmOpposition, `Hai tay vung ngược pha 180 độ đối xứng sinh học`);

// Gập đầu gối sinh học
assert(minKneeFlex >= -0.01 && maxKneeFlex > 0.35, `Đầu gối chỉ gập ra sau tự nhiên (min: ${minKneeFlex.toFixed(3)}, max: ${maxKneeFlex.toFixed(3)} rad)`);

// Nhún trọng tâm & tà áo lay động
assert(pelvisYBobMax > 0.005, `Thân người có nhún theo trọng tâm (pelvisY variance: ${pelvisYBobMax.toFixed(4)}m)`);
assert(flapSwayObserved, `Tà áo dài lay động mềm mại theo luồng gió bước đi`);

// 4.3. TRẠNG THÁI RUN (Chạy nhanh)
console.log('-> Kiểm thử Trạng thái RUN (speed = 7.0, isGrounded = true)...');
for (let f = 0; f < 60; f++) {
  animator.update(0.016, 7.0, true);
}
state = animator.getState();
assert(state.weights.run > 0.35, `Trọng số run tăng trưởng mạnh (thực tế: ${(state.weights.run * 100).toFixed(1)}%)`);
assert(primaryChar.rig.torsoGroup.rotation.x > 0.05, `Thân người dấn nhẹ về phía trước khi chạy (torso.rotX: ${primaryChar.rig.torsoGroup.rotation.x.toFixed(3)})`);

// 4.4. TRẠNG THÁI JUMP (Nhảy / Trên không)
console.log('-> Kiểm thử Trạng thái JUMP (speed = 4.0, isGrounded = false)...');
for (let f = 0; f < 30; f++) {
  animator.update(0.016, 4.0, false);
}
state = animator.getState();
assert(state.weights.jump > 0.90, `Trọng số jump đạt > 90% khi trên không (thực tế: ${(state.weights.jump * 100).toFixed(1)}%)`);
assert(primaryChar.rig.pelvisGroup.position.y > 0.95, `Trọng tâm nâng cao khi trên không`);

// 4.5. TIẾP ĐẤT & SQUASH CUSHION
console.log('-> Kiểm thử Tiếp Đất (Landing Cushion & Squash)...');
animator.update(0.016, 1.0, true); // Chạm đất ngay lập tức
state = animator.getState();
assert(state.landingTimer > 0, `Kích hoạt bộ đệm tiếp đất Squash & Stretch (landingTimer: ${state.landingTimer.toFixed(3)}s)`);
assert(primaryChar.rig.pelvisGroup.scale.y < 1.0, `Trọng tâm bị nén (Squash) trục Y tiếp thu phản lực (scale.y: ${primaryChar.rig.pelvisGroup.scale.y.toFixed(3)})`);

// -----------------------------------------------------------------------------
// CHẶNG 5: XÁC NHẬN ZERO HEAP ALLOCATION TRONG GAME LOOP (60 FPS)
// -----------------------------------------------------------------------------
console.log('\n--- CHẶNG 5: Kiểm Định Zero Heap Allocation Game Loop ---');

// Warm up JIT
for (let i = 0; i < 2000; i++) {
  animator.update(0.016, 4.2, true);
}

// Đo đạc bộ nhớ qua 10,000 chu kỳ update
if (globalThis.gc) globalThis.gc();
const memStart = process.memoryUsage().heapUsed;

for (let i = 0; i < 10000; i++) {
  animator.update(0.016, 4.2, true);
}

if (globalThis.gc) globalThis.gc();
const memEnd = process.memoryUsage().heapUsed;
const memDeltaMB = (memEnd - memStart) / (1024 * 1024);

console.log(`  Độ biến thiên Heap sau 10,000 frames: ${memDeltaMB.toFixed(3)} MB`);
const memThreshold = globalThis.gc ? 0.5 : 1.5;
assert(memDeltaMB < memThreshold, `Zero-Allocation đạt chuẩn: biến thiên heap < ${memThreshold}MB sau 10,000 vòng lặp 60 FPS (thực tế: ${memDeltaMB.toFixed(3)}MB)`);

// -----------------------------------------------------------------------------
// CHẶNG 6: KIỂM ĐỊNH TOÀN VẸN TÀI NGUYÊN TEXTURE PBR (NANO-BANANA)
// -----------------------------------------------------------------------------
console.log('\n--- CHẶNG 6: Toàn Vẹn Tài Nguyên Texture PBR (Chống Lỗi 404) ---');

const REQUIRED_TEXTURES = [
  'char_silk_blue_brocade.jpg',
  'char_silk_blue_brocade_norm.jpg',
  'char_silk_ivory_white.jpg',
  'char_silk_ivory_white_norm.jpg',
  'char_cotton_pink_lotus.jpg',
  'char_cotton_pink_lotus_norm.jpg',
  'char_scarf_caro_krama.jpg',
  'char_scarf_caro_krama_norm.jpg',
  'char_bamboo_non_la.jpg',
  'char_bamboo_non_la_norm.jpg',
  'char_leather_shoes_black.jpg',
  'char_leather_shoes_black_norm.jpg',
  'char_wool_navy_suit.jpg',
  'char_wool_navy_suit_norm.jpg',
  'char_silk_tie_vintage.jpg',
  'char_silk_tie_vintage_norm.jpg'
];

let allTexturesValid = true;
for (const texName of REQUIRED_TEXTURES) {
  const p1 = path.join(process.cwd(), 'assets', 'textures', texName);
  const p2 = path.join(process.cwd(), 'assets', 'characters', texName);
  const exists1 = fs.existsSync(p1) && fs.statSync(p1).size > 0;
  const exists2 = fs.existsSync(p2) && fs.statSync(p2).size > 0;

  if (exists1 && exists2) {
    // Tồn tại ở cả 2 thư mục
  } else {
    allTexturesValid = false;
    assert(false, `Thiếu texture hoặc dung lượng = 0: ${texName}`);
  }
}

assert(allTexturesValid, `Toàn bộ 16/16 tệp PBR textures (Diffuse + Normal) tồn tại đầy đủ, không bị lỗi 404`);

// -----------------------------------------------------------------------------
// CHẶNG 7: BẢO TOÀN TOÀN BỘ HỆ THỐNG NPC CŨ TRONG WORLDMANAGER.JS
// -----------------------------------------------------------------------------
console.log('\n--- CHẶNG 7: Kiểm Định Bảo Toàn 100% Hệ Thống NPC Cũ ---');

const worldManagerContent = fs.readFileSync(path.join(process.cwd(), 'src', 'core', 'WorldManager.js'), 'utf8');

const REQUIRED_NPCS = [
  { name: 'Bác Hùng gác cầu Long Biên', pattern: /Bác Hùng.*Gác Cầu/i },
  { name: 'Bác Hùng bán bánh mì dạo', pattern: /Bác Hùng.*Bánh Mì/i },
  { name: 'Chị gánh hoa dạo bờ hồ', pattern: /gánh hoa/i },
  { name: 'Bà cụ bán trà đá cóc vỉa hè', pattern: /trà đá/i },
  { name: 'Hai cụ già đánh cờ tướng', pattern: /đánh cờ/i },
  { name: 'Thầy lang & bốc thuốc dưỡng sinh', pattern: /Thầy Lang/i },
  { name: 'Thợ may áo dài Lương Văn Can', pattern: /Thợ may/i },
  { name: 'Quán Phở Gia Truyền 1954', pattern: /Phở Gia Truyền 1954/i },
  { name: 'Đàn cá chép vàng Hồ Gươm', pattern: /cá chép/i }
];

let allNpcPreserved = true;
for (const npc of REQUIRED_NPCS) {
  const match = npc.pattern.test(worldManagerContent);
  if (!match) {
    allNpcPreserved = false;
    assert(false, `Không tìm thấy dấu vết NPC: ${npc.name}`);
  }
}

assert(allNpcPreserved, `Toàn bộ 9/9 NPC cũ và sinh vật văn hóa Hà Nội được bảo toàn nguyên vẹn 100%`);

// -----------------------------------------------------------------------------
// CHẶNG 8: HỢP ĐỒNG API & SỰ KIỆN GAME_SPEC.MD
// -----------------------------------------------------------------------------
console.log('\n--- CHẶNG 8: Kiểm Định Hợp Đồng GameAPI & GameEventBus ---');

const REQUIRED_APIS = [
  'checkCharacterNameAvailability',
  'saveUserProfile',
  'getAlbumPhotos',
  'setPlayerMovementLock',
  'getCameraStatus',
  'captureFilmPhoto',
  'startWorldEngine'
];

for (const apiMethod of REQUIRED_APIS) {
  assert(typeof GameAPI[apiMethod] === 'function', `GameAPI.${apiMethod} tồn tại và là function`);
}

// Kiểm tra debounced name checking API
const check1 = await GameAPI.checkCharacterNameAvailability('admin');
assert(!check1.isValid, `Tên 'admin' bị từ chối hợp lệ do trùng tên bảo lưu`);
assert(check1.suggestions.length > 0, `Trả về danh sách tên gợi ý phong cách Hà Nội`);

const check2 = await GameAPI.checkCharacterNameAvailability('AnTrangAn');
assert(check2.isValid, `Tên độc nhất 'AnTrangAn' được chấp thuận hợp lệ`);

assert(typeof GameEventBus.on === 'function', `GameEventBus.on là function`);
assert(typeof GameEventBus.emit === 'function', `GameEventBus.emit là function`);
assert(typeof GameEventBus.off === 'function', `GameEventBus.off là function`);

// -----------------------------------------------------------------------------
// BÁO CÁO KẾT QUẢ CUỐI CÙNG
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(` KẾT QUẢ KIỂM DUYỆT TỔNG THỂ: ${passedTests}/${totalTests} TESTS PASSED`);
const passRate = ((passedTests / totalTests) * 100).toFixed(1);
console.log(` TỶ LỆ ĐẠT: ${passRate}%`);
console.log('================================================================');

if (failedTests === 0) {
  console.log('>>> KẾT QUẢ CHÍNH THỨC: PASSED 100% - CHUẨN MỰC XUẤT SẮC! <<<');
  process.exit(0);
} else {
  console.error(`>>> CÓ ${failedTests} TEST BỊ THẤT BẠI! YÊU CẦU SỬA LỖI! <<<`);
  process.exit(1);
}
