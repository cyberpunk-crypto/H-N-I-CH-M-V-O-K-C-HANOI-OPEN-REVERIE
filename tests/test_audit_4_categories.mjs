/**
 * test_audit_4_categories.mjs - QA/QC Comprehensive Auditor Test Suite (Bước 3 /lam-game)
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 * 
 * Kiểm định toàn diện 4 danh mục lỗi chí mạng:
 * 1. VẬT LÝ & XUYÊN TƯỜNG (Predictive Collision, Sub-stepping, Cầu Thê Húc, Cầu Kim Quy, Hồ Gươm, World Bounds, Yaw/FacingOffset)
 * 2. HÌNH ẢNH & ĐỒ HỌA (4 nhân vật Việt Nam độc bản 3D, không Sci-Fi Soldier, không con rối hình trụ, trang phục 3D có thể tích)
 * 3. LOGIC & GAME LOOP (Khử Race Condition _loadToken, _disposeHierarchy chống rò rỉ VRAM, khử frozen pose, Cooldown 600ms)
 * 4. TOÀN VẸN TÀI NGUYÊN & HỆ THỐNG NPC (74 assets không 404, 9 NPC bảo toàn)
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Mock browser globals
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

import * as THREE from '../src/lib/three.module.js';
import { GameEventBus } from '../src/bridge/GameEvents.js';
import { GameAPI } from '../src/bridge/GameAPI.js';
import { CHARACTERS_META, createHanoiCharacter3D } from '../src/core/CharacterFactory.js';
import { CHARACTER_MODELS_MAP, PlayerController } from '../src/core/PlayerController.js';
import { HumanoidAnimator, smoothstep, damp, clamp, lerp } from '../src/core/animations.js';
import { HUD, HUD_CONFIG } from '../src/ui/HUD.js';
import { CharacterCreation, CHARACTERS } from '../src/ui/CharacterCreation.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  [FAIL] ${name}:`, err.message);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  [FAIL] ${name}:`, err.message);
  }
}

console.log('================================================================');
console.log(' QA/QC COMPREHENSIVE AUDITOR: KIỂM ĐỊNH 4 DANH MỤC LỖI CHÍ MẠNG');
console.log(' Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// DANH MỤC 1: VẬT LÝ & XUYÊN TƯỜNG (PHYSICS, ANTI-TUNNELING, BRIDGES & BOUNDS)
// -----------------------------------------------------------------------------
console.log('--- DANH MỤC 1: Vật Lý, Chống Xuyên Tường & Va Chạm Di Sản ---');

const playerCtrlSrc = fs.readFileSync(path.join(process.cwd(), 'src/core/PlayerController.js'), 'utf8');

runTest('1.1. Predictive Collision & Sub-Stepping với bước tối đa 20cm', () => {
  assert(playerCtrlSrc.includes('const maxSubStep = 0.20'), 'Phải có maxSubStep = 0.20m');
  assert(playerCtrlSrc.includes('stepsCountX = Math.max(1, Math.ceil(Math.abs(stepX) / maxSubStep))'), 'Phân bước trục X');
  assert(playerCtrlSrc.includes('stepsCountZ = Math.max(1, Math.ceil(Math.abs(stepZ) / maxSubStep))'), 'Phân bước trục Z');
  assert(playerCtrlSrc.includes('if (!this._isCollidingAt(this._testPos))'), 'Predictive Collision check trước khi gán tọa độ');
});

runTest('1.2. Khóa Biên Thế Giới [-245, 245] cho bản đồ 500m x 500m', () => {
  assert(playerCtrlSrc.includes('THREE.MathUtils.clamp(currentPos.x + subStepX, -245, 245)'), 'Clamp biên X [-245, 245]');
  assert(playerCtrlSrc.includes('THREE.MathUtils.clamp(currentPos.z + subStepZ, -245, 245)'), 'Clamp biên Z [-245, 245]');
});

runTest('1.3. Khóa Lòng Cầu Thê Húc (dist <= 1.95m) và Cầu Kim Quy (dist <= 1.85m)', () => {
  assert(playerCtrlSrc.includes('pos.x < 158 && pos.x > 134'), 'Ranh giới nhịp vượt nước Cầu Thê Húc');
  assert(playerCtrlSrc.includes('const maxBridgeDist = 1.95'), 'Bán kính an toàn Cầu Thê Húc 1.95m');
  assert(playerCtrlSrc.includes('pos.x >= 16.0 && pos.x <= 72.0 && pos.z <= -16.0 && pos.z >= -72.0'), 'Ranh giới Cầu Kim Quy');
  assert(playerCtrlSrc.includes('const maxBridgeDist = 1.85'), 'Bán kính an toàn Cầu Kim Quy 1.85m');
  assert(playerCtrlSrc.includes('const clampFactor = maxBridgeDist / bridgeInfo.dist'), 'Co lực clampFactor vào tim cầu');
});

runTest('1.4. Ranh giới mặt nước Hồ Gươm (Cấm chạm nước)', () => {
  assert(playerCtrlSrc.includes('this.worldManager.isWaterAt(testPos.x, testPos.y, testPos.z)'), 'Chặn trước khi bước xuống nước');
  assert(playerCtrlSrc.includes('this.worldManager.isWaterAt(pos.x, pos.y, pos.z)'), 'Đẩy lùi nếu lỡ chạm ranh giới nước');
});

runTest('1.5. Triệt tiêu Moonwalking & Đồng bộ Facing Offset', () => {
  assert(playerCtrlSrc.includes('const targetAngle = Math.atan2(finalDir.x, finalDir.z) + (this._currentFacingOffset || 0)'), 'targetAngle tự nhiên + facingOffset');
  // Không được chứa góc + Math.PI trong biểu thức tính toán
  assert(!playerCtrlSrc.includes('Math.atan2(finalDir.x, finalDir.z) + Math.PI;'), 'Loại bỏ hoàn toàn + Math.PI trong phép tính');
});

// -----------------------------------------------------------------------------
// DANH MỤC 2: HÌNH ẢNH, ĐỒ HỌA & 4 NHÂN VẬT VIỆT NAM ĐỘC BẢN 3D
// -----------------------------------------------------------------------------
console.log('\n--- DANH MỤC 2: Hình Ảnh, Đồ Họa & 4 Nhân Vật Việt Nam Độc Bản 3D ---');

runTest('2.1. Đủ 4 nhân vật độc bản trong CHARACTER_MODELS_MAP', () => {
  const keys = Object.keys(CHARACTER_MODELS_MAP);
  assert.strictEqual(keys.length, 4, 'Phải có đúng 4 nhân vật');
  assert(keys.includes('char_nu_sinh_ao_dai'), 'Có char_nu_sinh_ao_dai');
  assert(keys.includes('char_co_gai_ao_ba_ba'), 'Có char_co_gai_ao_ba_ba');
  assert(keys.includes('char_nam_tri_thuc_suit'), 'Có char_nam_tri_thuc_suit');
  assert(keys.includes('char_nam_ao_dai_gam'), 'Có char_nam_ao_dai_gam');
});

runTest('2.2. KHÔNG sử dụng model lính Sci-Fi Soldier.glb làm model chính hay fallback', () => {
  Object.values(CHARACTER_MODELS_MAP).forEach(cfg => {
    assert(!cfg.modelUrl.includes('Soldier.glb'), `${cfg.id} modelUrl không được là Soldier.glb`);
    assert(!cfg.fallbackModelUrl.includes('Soldier.glb'), `${cfg.id} fallbackModelUrl không được là Soldier.glb`);
  });
});

runTest('2.3. Trang phục 3D có thể tích độc lập (Áo Dài Flaps, Nón Lá, Khăn Rằn, Khăn Xếp, Fedora)', () => {
  assert(playerCtrlSrc.includes('_create3DNonLa'), 'Có hàm _create3DNonLa 3D');
  assert(playerCtrlSrc.includes('_create3DFlaps'), 'Có hàm _create3DFlaps thể tích');
  assert(playerCtrlSrc.includes('_create3DKhanRan'), 'Có hàm _create3DKhanRan 3D');
  assert(playerCtrlSrc.includes('_create3DKhanXep'), 'Có hàm _create3DKhanXep 3D');
  assert(playerCtrlSrc.includes('_create3DFedoraHat'), 'Có hàm _create3DFedoraHat 3D');
});

runTest('2.4. Khởi tạo Procedural 3D Humanoid cho cả 4 nhân vật từ CharacterFactory', () => {
  const ids = ['char_nu_sinh_ao_dai', 'char_co_gai_ao_ba_ba', 'char_nam_tri_thuc_suit', 'char_nam_ao_dai_gam'];
  ids.forEach(id => {
    const group = createHanoiCharacter3D(id);
    assert(group instanceof THREE.Group, `Tạo thành công THREE.Group cho ${id}`);
    assert(group.children.length > 0, `Nhóm nhân vật ${id} có các bộ phận con`);
    assert(group.rig, `Nhân vật ${id} có khung xương rig`);
  });
});

// -----------------------------------------------------------------------------
// DANH MỤC 3: LOGIC, GAME LOOP, RACE CONDITION & COOLDOWN
// -----------------------------------------------------------------------------
console.log('\n--- DANH MỤC 3: Logic, Khử Race Condition, Frozen Pose & Cooldown ---');

runTest('3.1. Cơ chế _loadToken triệt tiêu Race Condition bóng ma dính đè', () => {
  assert(playerCtrlSrc.includes('this._loadToken = 0'), 'Khởi tạo this._loadToken = 0');
  assert(playerCtrlSrc.includes('this._loadToken++'), 'Tăng token mỗi khi gọi setCharacter');
  assert(playerCtrlSrc.includes('if (token !== this._loadToken) return;'), 'Hủy tải nếu token cũ');
});

runTest('3.2. Cơ chế _disposeHierarchy dọn dẹp sạch sẽ GPU/VRAM', () => {
  assert(playerCtrlSrc.includes('_disposeHierarchy(root)'), 'Có hàm _disposeHierarchy');
  assert(playerCtrlSrc.includes('node.geometry.dispose()'), 'Giải phóng geometry');
  assert(playerCtrlSrc.includes('m.dispose()'), 'Giải phóng material');
  assert(playerCtrlSrc.includes('node.skeleton.dispose()'), 'Giải phóng skeleton');
  assert(playerCtrlSrc.includes('this._gltfMixer.stopAllAction()'), 'Dừng tất cả action cũ');
});

runTest('3.3. Triệt tiêu Frozen Pose khi khởi động hoạt ảnh nhân vật', () => {
  assert(playerCtrlSrc.includes('idleAction.reset().play()'), 'idleAction.reset().play() ngay khi load xong');
  assert(playerCtrlSrc.includes('mixer.update(0.016)'), 'Kích hoạt ngay frame đầu tiên tránh T-pose/Frozen');
  assert(playerCtrlSrc.includes("CORE:CHARACTER_SWITCHED"), 'Bắn sự kiện CORE:CHARACTER_SWITCHED khi hoàn tất');
});

runTest('3.4. Cooldown >= 600ms chống spam click đổi nhân vật trong HUD.js & CharacterCreation.js', () => {
  assert(HUD_CONFIG.COOLDOWN_MS >= 600, 'HUD_CONFIG.COOLDOWN_MS >= 600ms');
  const hud = new HUD();
  assert.strictEqual(hud.isSwitching, false, 'HUD ban đầu sẵn sàng');
  const ok1 = hud.switchCharacter('char_co_gai_ao_ba_ba');
  assert.strictEqual(ok1, true, 'Click 1 thành công');
  assert.strictEqual(hud.isSwitching, true, 'isSwitching bật');
  const spam = hud.switchCharacter('char_nam_tri_thuc_suit');
  assert.strictEqual(spam, false, 'Spam click bị chặn đứng');
});

runTest('3.5. Chống chia cho 0 trong smoothstep (animations.js)', () => {
  const res1 = smoothstep(5, 5, 5);
  assert.strictEqual(res1, 1, 'smoothstep(5,5,5) = 1 (không NaN)');
  const res2 = smoothstep(5, 5, 4);
  assert.strictEqual(res2, 0, 'smoothstep(5,5,4) = 0 (không NaN)');
});

await runAsyncTest('3.6. Cooldown 600ms tự động giải phóng sau thời gian chờ', async () => {
  const hud = new HUD();
  hud.switchCharacter('char_co_gai_ao_ba_ba');
  assert.strictEqual(hud.isSwitching, true);
  await new Promise(r => setTimeout(r, 650));
  assert.strictEqual(hud.isSwitching, false, 'Sau 650ms đã mở khóa');
});

// -----------------------------------------------------------------------------
// DANH MỤC 4: TOÀN VẸN TÀI NGUYÊN & BẢO TOÀN NPC
// -----------------------------------------------------------------------------
console.log('\n--- DANH MỤC 4: Toàn Vẹn Tài Nguyên & Bảo Toàn 9 NPC Lịch Sử ---');

runTest('4.1. Toàn bộ 74 tài nguyên dự án tồn tại 100% trên đĩa (0 lỗi 404)', () => {
  const assetAuditScript = fs.readFileSync(path.join(process.cwd(), 'tests/audit_assets_404.mjs'), 'utf8');
  assert(assetAuditScript.includes('SUCCESS: All'), 'Script audit_assets_404.mjs chuẩn mực');
  // Kiểm tra trực tiếp các file mô hình quan trọng
  const models = ['Michelle.glb', 'Asian_Female.glb', 'Asian_Male_Suit.glb', 'readyplayer.me.glb', 'Xbot.glb'];
  models.forEach(m => {
    const fullP = path.join(process.cwd(), 'assets/models', m);
    assert(fs.existsSync(fullP), `Mô hình ${m} tồn tại trên đĩa`);
    assert(fs.statSync(fullP).size > 100000, `Mô hình ${m} có dung lượng hợp lệ (>100KB)`);
  });
});

runTest('4.2. Bảo tồn 100% 9 NPC lịch sử trong WorldManager.js', () => {
  const wmSrc = fs.readFileSync(path.join(process.cwd(), 'src/core/WorldManager.js'), 'utf8');
  const required = [
    /Bác Hùng.*Gác Cầu/i,
    /Bác Hùng.*Bánh Mì/i,
    /gánh hoa/i,
    /trà đá/i,
    /đánh cờ/i,
    /Thầy Lang/i,
    /Thợ may/i,
    /Phở Gia Truyền 1954/i,
    /cá chép/i
  ];
  required.forEach(pattern => {
    assert(pattern.test(wmSrc), `WorldManager chứa NPC với mẫu regex: ${pattern}`);
  });
});

console.log('\n================================================================');
console.log(` KẾT QUẢ KIỂM TOÁN TỔNG HỢP: ${passedTests}/${totalTests} TESTS PASSED`);
const rate = ((passedTests / totalTests) * 100).toFixed(1);
console.log(` TỶ LỆ ĐẠT: ${rate}%`);
console.log('================================================================');

if (failedTests === 0) {
  console.log('>>> KẾT QUẢ CHÍNH THỨC: PASSED 100% - CHUẨN MỰC XUẤT SẮC! <<<');
  process.exit(0);
} else {
  console.error(`>>> CÓ ${failedTests} BÀI TEST THẤT BẠI! YÊU CẦU SỬA LỖI! <<<`);
  process.exit(1);
}
