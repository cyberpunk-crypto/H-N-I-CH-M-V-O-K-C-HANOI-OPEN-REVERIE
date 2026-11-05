import assert from 'assert';

if (typeof window === 'undefined') {
  globalThis.window = globalThis;
}
if (typeof document === 'undefined') {
  globalThis.document = {
    createElementNS: (ns, tag) => {
      return {
        addEventListener: (ev, cb) => {
          if (ev === 'load') setTimeout(cb, 0);
        },
        removeEventListener: () => {},
        setAttribute: () => {},
        style: {}
      };
    },
    createElement: (tag) => {
      return {
        getContext: () => ({
          fillRect: () => {},
          drawImage: () => {},
          getImageData: () => ({ data: [] })
        }),
        addEventListener: () => {},
        removeEventListener: () => {},
        style: {}
      };
    }
  };
}

import * as THREE from '../src/lib/three.module.js';
import { GameEventBus } from '../src/bridge/GameEvents.js';
import { WorldManager } from '../src/core/WorldManager.js';
import { PlayerController } from '../src/core/PlayerController.js';

console.log('================================================================');
console.log(' TEST SUITE: KIỂM TOÁN VA CHẠM TƯỜNG & CAO ĐỘ CHÂN THÁP RÙA');
console.log('================================================================\n');

// Mock Scene
const scene = new THREE.Scene();
const sceneManager = { getScene: () => scene };

const world = new WorldManager(sceneManager, GameEventBus);
const player = new PlayerController(scene, world, GameEventBus);

console.log('--- 1. KIỂM ĐỊNH CHỐNG XUYÊN 4 PHÍA VÁCH TƯỜNG THÁP RÙA ---');

// Kiểm tra 4 vách tường có chặn người chơi (isCollidingAt === true)
const wallTestPoints = [
  // Mặt Nam (Z = -77.0)
  { name: 'Mặt Nam Cánh Tây (X = 77.25, Z = -77.0)', x: 77.25, z: -77.0, shouldBlock: true },
  { name: 'Mặt Nam Cánh Đông (X = 82.75, Z = -77.0)', x: 82.75, z: -77.0, shouldBlock: true },
  { name: 'Cửa Vòm Chính Nam (X = 80.0, Z = -77.0)', x: 80.0, z: -77.0, shouldBlock: false },

  // Mặt Bắc (Z = -83.0)
  { name: 'Mặt Bắc Cánh Tây (X = 77.25, Z = -83.0)', x: 77.25, z: -83.0, shouldBlock: true },
  { name: 'Mặt Bắc Cánh Đông (X = 82.75, Z = -83.0)', x: 82.75, z: -83.0, shouldBlock: true },
  { name: 'Cửa Vòm Chính Bắc (X = 80.0, Z = -83.0)', x: 80.0, z: -83.0, shouldBlock: false },

  // Mặt Tây (X = 76.0)
  { name: 'Mặt Tây Trụ Bắc (X = 76.0, Z = -82.175)', x: 76.0, z: -82.175, shouldBlock: true },
  { name: 'Mặt Tây Trụ Nam (X = 76.0, Z = -77.825)', x: 76.0, z: -77.825, shouldBlock: true },
  { name: 'Cửa Vòm Mặt Tây (X = 76.0, Z = -80.0)', x: 76.0, z: -80.0, shouldBlock: false },

  // Mặt Đông (X = 84.0)
  { name: 'Mặt Đông Trụ Bắc (X = 84.0, Z = -82.175)', x: 84.0, z: -82.175, shouldBlock: true },
  { name: 'Mặt Đông Trụ Nam (X = 84.0, Z = -77.825)', x: 84.0, z: -77.825, shouldBlock: true },
  { name: 'Cửa Vòm Mặt Đông (X = 84.0, Z = -80.0)', x: 84.0, z: -80.0, shouldBlock: false },

  // 4 Góc tháp kín khít
  { name: 'Góc Tây Nam (X = 76.0, Z = -77.0)', x: 76.0, z: -77.0, shouldBlock: true },
  { name: 'Góc Tây Bắc (X = 76.0, Z = -83.0)', x: 76.0, z: -83.0, shouldBlock: true },
  { name: 'Góc Đông Nam (X = 84.0, Z = -77.0)', x: 84.0, z: -77.0, shouldBlock: true },
  { name: 'Góc Đông Bắc (X = 84.0, Z = -83.0)', x: 84.0, z: -83.0, shouldBlock: true },
];

let wallPass = 0;
for (const pt of wallTestPoints) {
  const testVec = new THREE.Vector3(pt.x, 2.05, pt.z);
  const isBlocked = player._isCollidingAt(testVec);
  if (isBlocked === pt.shouldBlock) {
    console.log(`  [PASS] ${pt.name} -> ${isBlocked ? 'CHẶN ĐỨNG (BLOCKED)' : 'THÔNG SUỐT (OPEN)'}`);
    wallPass++;
  } else {
    console.error(`  [FAIL] ${pt.name} -> Kỳ vọng ${pt.shouldBlock ? 'CHẶN' : 'MỞ'} nhưng thực tế ${isBlocked ? 'CHẶN' : 'MỞ'}`);
  }
}
assert.strictEqual(wallPass, wallTestPoints.length, 'Tất cả các điểm kiểm tra tường & cửa phải đạt');

console.log('\n--- 2. KIỂM ĐỊNH CAO ĐỘ CHÂN & CHỐNG LÚN ĐẤT TẠI THÁP RÙA ---');

const groundTestPoints = [
  { name: 'Sàn trung tâm Tháp Rùa (80, -80)', x: 80.0, z: -80.0, minY: 2.035 },
  { name: 'Thềm đá Tây Tháp Rùa (77.0, -79.0)', x: 77.0, z: -79.0, minY: 2.035 },
  { name: 'Cửa vòm đón khách Cầu Kim Quy (80.0, -77.0)', x: 80.0, z: -77.0, minY: 2.035 },
  { name: 'Tam cấp thềm Tháp Rùa (80.0, -74.5)', x: 80.0, z: -74.5, minY: 1.85 },
  { name: 'Sân đá xanh Đảo Tháp Rùa (80.0, -71.0)', x: 80.0, z: -71.0, minY: 1.635 },
  { name: 'Đoạn dốc nối từ Cầu Kim Quy (70.0, -70.0)', x: 70.0, z: -70.0, minY: 1.10 },
  { name: 'Sân Chùa Đỏ & Đền Ngọc Sơn (120.0, -70.0)', x: 120.0, z: -70.0, minY: 0.885 },
];

let groundPass = 0;
for (const pt of groundTestPoints) {
  player.characterGroup.position.set(pt.x, 2.5, pt.z);
  player.velocity.set(0, 0, 0);
  player.isJumping = false;
  player.isGrounded = true;

  // Giả lập 10 frames vật lý tiếp đất
  for (let f = 0; f < 10; f++) {
    player.update(0.016);
  }

  const finalY = player.characterGroup.position.y;
  if (finalY >= pt.minY - 0.001) {
    console.log(`  [PASS] ${pt.name} -> Y = ${finalY.toFixed(3)}m (>= ${pt.minY}m chuẩn an toàn, chân nằm trên sàn)`);
    groundPass++;
  } else {
    console.error(`  [FAIL] ${pt.name} -> Y = ${finalY.toFixed(3)}m (thấp hơn ${pt.minY}m, lún đất!)`);
  }
}
assert.strictEqual(groundPass, groundTestPoints.length, 'Tất cả các điểm kiểm tra cao độ chân phải đạt');

console.log('\n--- 3. KIỂM ĐỊNH CHỐNG XUYÊN HÀNG RÀO LAN CAN NGOÀI THÁP RÙA & MÁ GÀ TAM CẤP ---');

const railingTestPoints = [
  // Lan can ngoài phía Tây (X = 74.55)
  { name: 'Lan can ngoài Tây - Cánh Bắc (X = 74.55, Z = -83.0)', x: 74.55, z: -83.0, shouldBlock: true },
  { name: 'Lan can ngoài Tây - Cánh Nam (X = 74.55, Z = -77.0)', x: 74.55, z: -77.0, shouldBlock: true },
  { name: 'Lối tam cấp Tây - Giữa cầu thang (X = 73.5, Z = -80.0)', x: 73.5, z: -80.0, shouldBlock: false },

  // Lan can ngoài phía Đông (X = 85.45)
  { name: 'Lan can ngoài Đông - Cánh Bắc (X = 85.45, Z = -83.0)', x: 85.45, z: -83.0, shouldBlock: true },
  { name: 'Lan can ngoài Đông - Cánh Nam (X = 85.45, Z = -77.0)', x: 85.45, z: -77.0, shouldBlock: true },
  { name: 'Lối tam cấp Đông - Giữa cầu thang (X = 86.5, Z = -80.0)', x: 86.5, z: -80.0, shouldBlock: false },

  // Lan can ngoài phía Bắc (Z = -84.35)
  { name: 'Lan can ngoài Bắc - Cánh Tây (X = 76.5, Z = -84.35)', x: 76.5, z: -84.35, shouldBlock: true },
  { name: 'Lan can ngoài Bắc - Cánh Đông (X = 83.5, Z = -84.35)', x: 83.5, z: -84.35, shouldBlock: true },
  { name: 'Lối tam cấp Bắc - Giữa cầu thang (X = 80.0, Z = -85.5)', x: 80.0, z: -85.5, shouldBlock: false },

  // Lan can ngoài phía Nam (Z = -75.65)
  { name: 'Lan can ngoài Nam - Cánh Tây (X = 76.5, Z = -75.65)', x: 76.5, z: -75.65, shouldBlock: true },
  { name: 'Lan can ngoài Nam - Cánh Đông (X = 83.5, Z = -75.65)', x: 83.5, z: -75.65, shouldBlock: true },
  { name: 'Lối tam cấp Nam - Giữa cầu thang (X = 80.0, Z = -74.5)', x: 80.0, z: -74.5, shouldBlock: false },

  // 4 Trụ góc thềm đá Tháp Rùa
  { name: 'Trụ góc thềm Tây Bắc (X = 74.55, Z = -84.35)', x: 74.55, z: -84.35, shouldBlock: true },
  { name: 'Trụ góc thềm Tây Nam (X = 74.55, Z = -75.65)', x: 74.55, z: -75.65, shouldBlock: true },
  { name: 'Trụ góc thềm Đông Bắc (X = 85.45, Z = -84.35)', x: 85.45, z: -84.35, shouldBlock: true },
  { name: 'Trụ góc thềm Đông Nam (X = 85.45, Z = -75.65)', x: 85.45, z: -75.65, shouldBlock: true },

  // 8 Má gà đá tam cấp 4 phía
  { name: 'Má gà Tây Bắc (X = 73.5, Z = -81.55)', x: 73.5, z: -81.55, shouldBlock: true },
  { name: 'Má gà Tây Nam (X = 73.5, Z = -78.45)', x: 73.5, z: -78.45, shouldBlock: true },
  { name: 'Má gà Đông Bắc (X = 86.5, Z = -81.55)', x: 86.5, z: -81.55, shouldBlock: true },
  { name: 'Má gà Đông Nam (X = 86.5, Z = -78.45)', x: 86.5, z: -78.45, shouldBlock: true },
  { name: 'Má gà Bắc Tây (X = 78.65, Z = -85.5)', x: 78.65, z: -85.5, shouldBlock: true },
  { name: 'Má gà Bắc Đông (X = 81.35, Z = -85.5)', x: 81.35, z: -85.5, shouldBlock: true },
  { name: 'Má gà Nam Tây (X = 78.65, Z = -74.5)', x: 78.65, z: -74.5, shouldBlock: true },
  { name: 'Má gà Nam Đông (X = 81.35, Z = -74.5)', x: 81.35, z: -74.5, shouldBlock: true },
];

let railingPass = 0;
for (const pt of railingTestPoints) {
  const testVec = new THREE.Vector3(pt.x, 2.05, pt.z);
  const isBlocked = player._isCollidingAt(testVec);
  if (isBlocked === pt.shouldBlock) {
    console.log(`  [PASS] ${pt.name} -> ${isBlocked ? 'CHẶN ĐỨNG (BLOCKED)' : 'THÔNG SUỐT (OPEN)'}`);
    railingPass++;
  } else {
    console.error(`  [FAIL] ${pt.name} -> Kỳ vọng ${pt.shouldBlock ? 'CHẶN' : 'MỞ'} nhưng thực tế ${isBlocked ? 'CHẶN' : 'MỞ'}`);
  }
}
assert.strictEqual(railingPass, railingTestPoints.length, 'Tất cả các điểm kiểm tra lan can ngoài & má gà phải đạt');

console.log('\n--- 4. KIỂM ĐỊNH HÀNG RÀO LAN CAN ĐÁ VEN ĐẢO RÙA ---');

const islandRailingPoints = [
  { name: 'Trụ lan can mép đảo phía Đông (X = 94.8, Z = -80.0)', x: 94.8, z: -80.0, shouldBlock: true },
  { name: 'Trụ lan can mép đảo phía Bắc (X = 80.0, Z = -94.8)', x: 80.0, z: -94.8, shouldBlock: true },
  { name: 'Dầm lan can mép đảo Tây Bắc (X = 69.5, Z = -90.5)', x: 69.5, z: -90.5, shouldBlock: true },
  { name: 'Lối dẫn lên Cầu Kim Quy (X = 69.5, Z = -69.5)', x: 69.5, z: -69.5, shouldBlock: false },
];

let islandPass = 0;
for (const pt of islandRailingPoints) {
  const testVec = new THREE.Vector3(pt.x, 1.80, pt.z);
  const isBlocked = player._isCollidingAt(testVec);
  if (isBlocked === pt.shouldBlock) {
    console.log(`  [PASS] ${pt.name} -> ${isBlocked ? 'CHẶN ĐỨNG (BLOCKED)' : 'THÔNG SUỐT (OPEN)'}`);
    islandPass++;
  } else {
    console.error(`  [FAIL] ${pt.name} -> Kỳ vọng ${pt.shouldBlock ? 'CHẶN' : 'MỞ'} nhưng thực tế ${isBlocked ? 'CHẶN' : 'MỞ'}`);
  }
}
assert.strictEqual(islandPass, islandRailingPoints.length, 'Tất cả các điểm kiểm tra lan can đảo phải đạt');

console.log('\n================================================================');
console.log(` KẾT QUẢ: ${wallPass + groundPass + railingPass + islandPass}/${wallTestPoints.length + groundTestPoints.length + railingTestPoints.length + islandRailingPoints.length} TESTS PASSED 100%!`);
console.log('================================================================\n');
