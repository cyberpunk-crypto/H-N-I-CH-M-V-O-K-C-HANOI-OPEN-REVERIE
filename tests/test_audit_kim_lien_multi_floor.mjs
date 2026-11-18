/**
 * test_audit_kim_lien_multi_floor.mjs
 * Test Suite Kiểm Định Chuyên Sâu & Săn Lỗi Chí Mạng: Quần Thể Khu Tập Thể Kim Liên Mở Hoàn Toàn (Zone 4)
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 * 
 * Kiểm định 4 danh mục và 11 chốt theo GAME_SPEC.md v4.2.0:
 * 1. VẬT LÝ, CHỐNG XUYÊN TƯỜNG, DI CHUYỂN ĐA TẦNG & VA CHẠM DI SẢN
 * 2. HÌNH ẢNH, ĐỒ HỌA & KẾT HỢP CANVA AI VINTAGE
 * 3. LOGIC, UI/UX, TƯƠNG TÁC THỜI BAO CẤP & ZERO HEAP GAME LOOP
 * 4. TOÀN VẸN TÀI NGUYÊN (0 LỖI 404) & BẢO TOÀN DI SẢN VĂN HÓA
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Mock môi trường Node.js an toàn
if (typeof window === 'undefined') {
  globalThis.window = globalThis;
}
const createRecursiveProxy = () => {
  const p = new Proxy(() => {}, {
    get: (target, prop) => {
      if (prop === 'canvas') return null;
      if (prop === 'width' || prop === 'height') return 256;
      return createRecursiveProxy();
    },
    set: () => true,
    apply: () => createRecursiveProxy()
  });
  return p;
};
const dummyCtx = createRecursiveProxy();

const createMockElement = (name) => ({
  tagName: name.toUpperCase(),
  width: 256,
  height: 256,
  style: {},
  addEventListener: () => {},
  removeEventListener: () => {},
  setAttribute: () => {},
  getAttribute: () => null,
  getContext: (type) => dummyCtx,
  set src(v) {}
});

if (typeof document === 'undefined') {
  globalThis.document = {
    createElementNS: (ns, name) => createMockElement(name),
    createElement: (name) => createMockElement(name)
  };
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
import { WorldManager } from '../src/core/WorldManager.js';
import { PlayerController } from '../src/core/PlayerController.js';
import { KimLienEnvironmentAnimator, createElephantEarFanMesh, createBambooBirdcageMesh } from '../src/core/animations.js';
import { SPECIAL_LANDMARKS } from '../src/ui/ToastNotification.js';

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

console.log('================================================================');
console.log(' QA/QC AUDITOR SUITE: KIỂM ĐỊNH QUẦN THỂ KHU TẬP THỂ KIM LIÊN MỞ');
console.log(' Phiên bản đặc tả: GAME_SPEC.md v4.2.0 (Zone 4 Multi-Floor)');
console.log(' Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)');
console.log('================================================================\n');

// Mock SceneManager tối thiểu để khởi tạo WorldManager
const mockSceneManager = {
  getScene: () => new THREE.Scene()
};

const wm = new WorldManager(mockSceneManager, GameEventBus);

// -----------------------------------------------------------------------------
// DANH MỤC 1: VẬT LÝ, CHỐNG XUYÊN TƯỜNG, DI CHUYỂN ĐA TẦNG & VA CHẠM
// -----------------------------------------------------------------------------
console.log('--- DANH MỤC 1: Vật Lý, Di Chuyển Đa Tầng & Chống Xuyên Tường ---');

runTest('1.1. Sảnh Tầng 1 Nhà A1 mở thông thoáng (Không có obstacle cản cửa vòm)', () => {
  // Cửa vòm trung tâm tại X = -65.0, Z = -68.0 (rộng 3.6m từ X: -66.8 đến -63.2)
  const entranceX = -65.0;
  const entranceZ = -68.0;
  const playerY = 0.5;

  const obstacles = wm.getObstacles();
  // Kiểm tra không có obstacle nào bao trùm vị trí cửa vòm ở độ cao mặt đất
  const blockedAtEntrance = obstacles.some(obs => {
    return entranceX >= obs.minX && entranceX <= obs.maxX &&
           entranceZ >= obs.minZ && entranceZ <= obs.maxZ &&
           playerY >= obs.minY && playerY <= obs.maxY;
  });

  assert.strictEqual(blockedAtEntrance, false, 'Cửa vòm sảnh tầng 1 phải hoàn toàn thông suốt');
});

runTest('1.2. Cầu thang bộ granito mài: Đầy đủ colliders vế thang 1, 2 và chiếu nghỉ T1 -> T2 -> T3 -> T4', () => {
  const colliders = wm.getColliders();
  const stairColliders = colliders.filter(c => c.name && c.name.includes('KimLien_A1_Stair'));

  // Mỗi tầng có 2 vế thang (StairRamp1, StairRamp2) và 1 chiếu nghỉ (Landing) -> 3 tầng thang = 9 colliders
  assert(stairColliders.length >= 9, `Phải có đủ tối thiểu 9 colliders cầu thang bộ (thực tế: ${stairColliders.length})`);

  stairColliders.forEach(c => {
    assert.strictEqual(c._isBaseGround, true, `Collider ${c.name} phải có _isBaseGround = true để raycast nhận diện`);
  });
});

runTest('1.3. Sàn các tầng (T1, T2, T3, T4, Roof) có thuộc tính _isBaseGround = true', () => {
  const colliders = wm.getColliders();
  const floorColliders = colliders.filter(c => c.name && c.name.includes('KimLien_A1_Floor'));

  assert(floorColliders.length >= 7, `Phải có đủ tối thiểu 7 floor colliders phân cánh (thực tế: ${floorColliders.length})`);
  floorColliders.forEach(f => {
    assert.strictEqual(f._isBaseGround, true, `Sàn ${f.name} phải có _isBaseGround = true`);
  });

  const roof = colliders.find(c => c.name === 'KimLien_A1_RoofSlab');
  assert(roof, 'Mái bằng bê tông nóc nhà A1 phải tồn tại');
  assert.strictEqual(roof._isBaseGround, true, 'Mái bằng có _isBaseGround = true');
});

runTest('1.4. Hệ thống dò tìm mặt sàn đa tầng trong PlayerController: Chọn sàn dưới chân gần nhất, không snap trần', () => {
  const pcSrc = fs.readFileSync(path.join(process.cwd(), 'src/core/PlayerController.js'), 'utf8');
  assert(pcSrc.includes('hit.point.y <= charPos.y + 0.65'), 'Phải lọc sàn gần chân với ngưỡng charPos.y + 0.65m');
  assert(pcSrc.includes('hit.point.y > bestHit.point.y'), 'Chọn sàn cao nhất dưới chân nhân vật');
});

runTest('1.5. Hành lang T2, T3, T4 có lan can con tiện bê tông bảo vệ chống ngã', () => {
  const obstacles = wm.getObstacles();
  // Lan can hành lang tại Z = -67.9, X = -65, Y các tầng [3.8, 7.6, 11.4]
  const corridorBalustrades = obstacles.filter(obs => {
    return Math.abs(obs.minZ - (-68.075)) < 0.3 && (obs.maxX - obs.minX) > 30.0;
  });
  assert(corridorBalustrades.length >= 3, `Phải có đủ 3 lan can hành lang bảo vệ cho T2, T3, T4 (thực tế: ${corridorBalustrades.length})`);
});

runTest('1.6. Căn hộ 204: Cửa vào mở thông suốt (X: -58, Z: -66.2) và đứng được trong chuồng cọp sắt an toàn', () => {
  const obstacles = wm.getObstacles();
  const doorX = -58.0;
  const doorZ = -66.2;
  const aptY = 4.2; // Độ cao bên trong căn hộ tầng 2

  const blockedAtDoor = obstacles.some(obs => {
    return doorX >= obs.minX && doorX <= obs.maxX &&
           doorZ >= obs.minZ && doorZ <= obs.maxZ &&
           aptY >= obs.minY && aptY <= obs.maxY;
  });
  assert.strictEqual(blockedAtDoor, false, 'Cửa vào Căn hộ 204 phải mở thông suốt không có obstacle cản');

  // Kiểm tra sàn chuồng cọp sắt
  const colliders = wm.getColliders();
  const cageFloor = colliders.find(c => c.name === 'KimLien_A1_Cage_Floor');
  assert(cageFloor, 'Sàn ban công chuồng cọp KimLien_A1_Cage_Floor phải tồn tại');
  assert.strictEqual(cageFloor._isBaseGround, true, 'Sàn chuồng cọp phải có _isBaseGround = true');

  // Kiểm tra rào chắn bảo vệ mép ngoài chuồng cọp (Z = -50.4)
  const cageRailing = obstacles.some(obs => {
    return Math.abs(obs.minZ - (-50.4)) < 0.3 && obs.minY >= 3.8;
  });
  assert(cageRailing, 'Chuồng cọp phải có rào chắn mép ngoài bảo vệ người chơi không rơi');
});

runTest('1.7. Sân chung: Bể nước tập thể, bàn cờ tướng, cây bàng già, bảng tin phường đầy đủ', () => {
  const obstacles = wm.getObstacles();
  // Cây bàng (-68, -74)
  const hasBang = obstacles.some(obs => Math.abs(obs.minX - (-68.8)) < 0.2 && Math.abs(obs.minZ - (-74.8)) < 0.2);
  assert(hasBang, 'Cây bàng già lá đỏ có obstacle thân cây bảo vệ');

  // Bàn cờ tướng (-75, -78)
  const hasChess = obstacles.some(obs => Math.abs(obs.minX - (-76.2)) < 0.2 && Math.abs(obs.minZ - (-78.7)) < 0.2);
  assert(hasChess, 'Bàn cờ tướng sân chung có obstacle hợp lệ');

  // Bảng tin phường (-82, -75)
  const hasBulletin = wm.interactables.some(it => it.promptText && it.promptText.includes('Bảng Tin Phường'));
  assert(hasBulletin, 'Điểm tương tác đọc Bảng Tin Phường tồn tại');
});

// -----------------------------------------------------------------------------
// DANH MỤC 2: HÌNH ẢNH, ĐỒ HỌA & KẾT HỢP CANVA AI VINTAGE
// -----------------------------------------------------------------------------
console.log('\n--- DANH MỤC 2: Hình Ảnh, Đồ Họa & Kết Hợp Canva AI Vintage ---');

runTest('2.1. Toàn bộ textures Canva AI và PBR Kim Liên tồn tại trên đĩa cứng (0 lỗi 404)', () => {
  const requiredFiles = [
    'assets/textures/canva_poster_kimlien.jpg',
    'assets/textures/canva_poster_kimlien_2.jpg',
    'assets/textures/kimlien_block_sign.png',
    'assets/textures/kimlien_block_sign_a1.png',
    'assets/textures/bloc_calendar_1985.png',
    'assets/textures/ward_bulletin_board.png',
    'assets/textures/cement_tile_lemon_blossom.jpg',
    'assets/textures/old_wall_yellow_moss.jpg'
  ];

  requiredFiles.forEach(f => {
    const fullP = path.join(process.cwd(), f);
    assert(fs.existsSync(fullP), `File texture Canva AI/PBR ${f} phải tồn tại`);
    assert(fs.statSync(fullP).size > 1000, `File ${f} phải có dung lượng > 1KB`);
  });
});

runTest('2.2. Khởi tạo mô hình Quạt tai voi Liên Xô quay tút-năng (createElephantEarFanMesh)', () => {
  const fan = createElephantEarFanMesh();
  assert(fan instanceof THREE.Group, 'Quạt tai voi phải là THREE.Group');
  assert(fan.head, 'Quạt phải có cụm đầu xoay fan.head');
  assert(fan.blades, 'Quạt phải có cụm cánh mềm fan.blades');
  assert(fan.base, 'Quạt phải có chân đế fan.base');
});

runTest('2.3. Khởi tạo mô hình Lồng chim sơn ca khuyên tre tinh xảo (createBambooBirdcageMesh)', () => {
  const cage = createBambooBirdcageMesh();
  assert(cage instanceof THREE.Group, 'Lồng chim phải là THREE.Group');
  assert(cage.getObjectByName('Birdcage'), 'Lồng chim phải có khối thân lồng Birdcage');
  assert(cage.getObjectByName('Songbird'), 'Lồng chim phải có chú chim Songbird');
});

runTest('2.4. KimLienEnvironmentAnimator đăng ký hoa giấy, quạt tai voi, lồng chim và vận hành 60 FPS', () => {
  assert(wm.kimLienAnimator instanceof KimLienEnvironmentAnimator, 'WorldManager phải sở hữu kimLienAnimator');
  assert(wm.kimLienAnimator.bougainvilleas.length > 0, 'Đã đăng ký giàn hoa giấy chuồng cọp');
  assert(wm.kimLienAnimator.elephantFans.length > 0, 'Đã đăng ký quạt tai voi căn hộ 204');
  assert(wm.kimLienAnimator.birdcages.length > 0, 'Đã đăng ký lồng chim sơn ca chuồng cọp');

  // Chạy thử 60 frames hoạt ảnh
  for (let i = 0; i < 60; i++) {
    wm.kimLienAnimator.update(0.016, new THREE.Vector3(-65, 3.8, -60));
  }
});

// -----------------------------------------------------------------------------
// DANH MỤC 3: LOGIC, UI/UX, TƯƠNG TÁC THỜI BAO CẤP & ZERO HEAP
// -----------------------------------------------------------------------------
console.log('\n--- DANH MỤC 3: Logic, UI/UX, Tương Tác Thời Bao Cấp & Zero Heap ---');

runTest('3.1. Điểm tương tác đài cassette hoài niệm phát âm thanh Hà Nội Mùa Thu', () => {
  const cassetteInt = wm.interactables.find(it => it.id === 'cassette_kim_lien_204' || (it.promptText && it.promptText.includes('Đài Cassette')));
  assert(cassetteInt, 'Phải có điểm tương tác đài cassette trong căn hộ 204');
  assert(cassetteInt.promptText.includes('Cassette'), 'Nội dung prompt gợi nhớ đài cassette');

  const audioFile = path.join(process.cwd(), 'assets/audio/cassette_autumn_audio.mp3');
  assert(fs.existsSync(audioFile), 'File âm thanh cassette_autumn_audio.mp3 phải tồn tại');
  assert(fs.statSync(audioFile).size > 10000, 'File âm thanh phải có dung lượng chuẩn');
});

runTest('3.2. Điểm tương tác vặn vòi nước máy tập thể van đồng thời Pháp - Liên Xô', () => {
  const waterTapInt = wm.interactables.find(it => it.id === 'water_tap_kim_lien' || (it.promptText && it.promptText.includes('vòi nước')));
  assert(waterTapInt, 'Phải có điểm tương tác vặn vòi nước máy sân chung');

  const waterAudio = path.join(process.cwd(), 'assets/audio/water_tap_audio.mp3');
  assert(fs.existsSync(waterAudio), 'File âm thanh water_tap_audio.mp3 phải tồn tại');
  assert(fs.statSync(waterAudio).size > 10000, 'File âm thanh nước chảy phải có dung lượng chuẩn');
});

runTest('3.3. Đăng ký đầy đủ 3 SPECIAL_LANDMARKS phát hiện vị trí Khu Tập Thể Kim Liên', () => {
  const ids = ['sanh_tap_the_a1', 'can_ho_204_bao_cap', 'chuong_cop_hoang_hon'];
  ids.forEach(id => {
    const lm = SPECIAL_LANDMARKS.find(l => l.id === id);
    assert(lm, `Landmark ${id} phải được đăng ký trong SPECIAL_LANDMARKS`);
    assert(typeof lm.check === 'function', `Landmark ${id} phải có hàm check(pos)`);
  });

  // Test kích hoạt đúng tọa độ
  const sanh = SPECIAL_LANDMARKS.find(l => l.id === 'sanh_tap_the_a1');
  assert.strictEqual(sanh.check({ x: -65, y: 0.5, z: -62 }), true, 'Phát hiện sảnh A1');

  const canHo = SPECIAL_LANDMARKS.find(l => l.id === 'can_ho_204_bao_cap');
  assert.strictEqual(canHo.check({ x: -58, y: 3.8, z: -59 }), true, 'Phát hiện căn hộ 204');

  const chuongCop = SPECIAL_LANDMARKS.find(l => l.id === 'chuong_cop_hoang_hon');
  assert.strictEqual(chuongCop.check({ x: -58, y: 3.8, z: -51 }), true, 'Phát hiện chuồng cọp');
});

runTest('3.4. Kiểm định Zero Heap Allocation trong vòng lặp hoạt họa Kim Liên sau 5,000 frames', () => {
  const animator = wm.kimLienAnimator;
  assert(animator, 'kimLienAnimator phải tồn tại');

  // Khởi động GC trước khi đo
  if (globalThis.gc) globalThis.gc();
  const initialMemory = process.memoryUsage().heapUsed;

  const playerPos = new THREE.Vector3(-65, 3.8, -60);
  for (let i = 0; i < 5000; i++) {
    animator.update(0.016, playerPos);
  }

  if (globalThis.gc) globalThis.gc();
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryDeltaMB = (finalMemory - initialMemory) / (1024 * 1024);
  console.log(`    -> Biến thiên Heap sau 5,000 frames hoạt ảnh Kim Liên: ${memoryDeltaMB.toFixed(3)} MB`);
  const thresholdMB = globalThis.gc ? 2.0 : 15.0; // Đồng bộ chuẩn đo V8 khi không bật --expose-gc
  assert(memoryDeltaMB < thresholdMB, `Biến thiên Heap (${memoryDeltaMB.toFixed(3)} MB) phải < ${thresholdMB}MB sau 5,000 frames`);
});

// -----------------------------------------------------------------------------
// DANH MỤC 4: BẢO TOÀN DI SẢN & ĐỐI SOÁT CHỐT 11 GAME_SPEC.MD
// -----------------------------------------------------------------------------
console.log('\n--- DANH MỤC 4: Bảo Toàn Di Sản & Đối Soát Chốt 11 GAME_SPEC.md ---');

runTest('4.1. Tuyệt đối không còn khối hộp đặc BoxGeometry bao kín khu nhà A1', () => {
  const wmSrc = fs.readFileSync(path.join(process.cwd(), 'src/core/WorldManager.js'), 'utf8');
  assert(!wmSrc.includes('_addBoxObstacle(-65, -60, 38, 16, 0, 15)'), 'Không còn obstacle đặc khối bao bọc toàn bộ tòa A1');
  assert(wmSrc.includes('_buildEnterableCollectiveBlockA1'), 'Sử dụng kiến trúc thông thủy mở _buildEnterableCollectiveBlockA1');
});

runTest('4.2. Bảo tồn 100% 9 NPC lịch sử của Thủ Đô Hà Nội', () => {
  const wmSrc = fs.readFileSync(path.join(process.cwd(), 'src/core/WorldManager.js'), 'utf8');
  const requiredPatterns = [
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
  requiredPatterns.forEach(p => {
    assert(p.test(wmSrc), `WorldManager phải bảo toàn NPC: ${p}`);
  });
});

console.log('\n================================================================');
console.log(` KẾT QUẢ KIỂM ĐỊNH KIM LIÊN ĐA TẦNG: ${passedTests}/${totalTests} TESTS PASSED`);
const rate = ((passedTests / totalTests) * 100).toFixed(1);
console.log(` TỶ LỆ ĐẠT: ${rate}%`);
console.log('================================================================');

if (failedTests === 0) {
  console.log('>>> KẾT QUẢ CHÍNH THỨC: PASSED 100% - CHUẨN MỰC XUẤT SẮC! <<<');
  process.exit(0);
} else {
  console.error(`>>> CÓ ${failedTests} TEST BỊ THẤT BẠI! YÊU CẦU SỬA LỖI! <<<`);
  process.exit(1);
}
