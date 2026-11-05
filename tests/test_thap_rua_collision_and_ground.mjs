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

console.log('\n================================================================');
console.log(` KẾT QUẢ: ${wallPass + groundPass}/${wallTestPoints.length + groundTestPoints.length} TESTS PASSED 100%!`);
console.log('================================================================\n');
