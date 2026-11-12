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
          getImageData: () => ({ data: [] }),
          createLinearGradient: () => ({ addColorStop: () => {} }),
          fillText: () => {},
          strokeText: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          stroke: () => {},
          fill: () => {}
        }),
        addEventListener: () => {},
        removeEventListener: () => {},
        style: {},
        width: 1024,
        height: 256
      };
    }
  };
}

import * as THREE from '../src/lib/three.module.js';
import { GameEventBus } from '../src/bridge/GameEvents.js';
import { WorldManager } from '../src/core/WorldManager.js';
import { PlayerController } from '../src/core/PlayerController.js';

console.log('================================================================');
console.log(' TEST SUITE: KIỂM ĐỊNH VỊ TRÍ BIỂN HIỆU 8 CỬA HÀNG & HỆ THỐNG NGỒI GHẾ TRÀ ĐÁ');
console.log(' Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

// Khởi tạo giả lập môi trường
const scene = new THREE.Scene();
const sceneManager = { getScene: () => scene };
const worldManager = new WorldManager(sceneManager, GameEventBus);

console.log('--- 1. KIỂM ĐỊNH VỊ TRÍ VÀ CAO ĐỘ BIỂN HIỆU CÁC CỬA HÀNG PHỐ CỔ ---');

// Thu thập toàn bộ biển hiệu Signboard_* trong thế giới
const signboards = [];
worldManager.worldGroup.traverse(child => {
  if (child.name && child.name.startsWith('Signboard_')) {
    const worldPos = new THREE.Vector3();
    child.getWorldPosition(worldPos);
    signboards.push({ name: child.name, obj: child, pos: worldPos });
  }
});

console.log(`Tìm thấy tổng cộng ${signboards.length} biển hiệu trong không gian game.`);
assert(signboards.length >= 8, `Có ít nhất 8 biển hiệu di sản (thực tế: ${signboards.length})`);

// Kiểm tra 8 cửa hàng tiêu biểu
const expectedShops = [
  { name: 'Cà Phê Trứng', expectedMinY: 3.95, isSouth: true, expectedZMin: 53.5 },
  { name: 'BÁCH HÓA MẬU DỊCH', expectedMinY: 3.95, isSouth: true, expectedZMin: 53.5 },
  { name: 'HIỆU THUỐC BẮC', expectedMinY: 3.95, isSouth: true, expectedZMin: 53.5 },
  { name: 'MAY ĐO ÂU PHỤC', expectedMinY: 3.95, isSouth: true, expectedZMin: 53.5 },
  { name: 'PHỞ GIA TRUYỀN', expectedMinY: 3.95, isSouth: false, expectedZMax: 72.5 },
  { name: 'BIA HƠI HÀ NỘI', expectedMinY: 3.95, isSouth: false, expectedZMax: 72.5 },
  { name: 'SỬA ĐỒNG HỒ', expectedMinY: 3.95, isSouth: false, expectedZMax: 72.5 },
  { name: 'CẮT TÓC BÌNH DÂN', expectedMinY: 3.95, isSouth: false, expectedZMax: 72.5 }
];

expectedShops.forEach(shop => {
  const match = signboards.find(s => s.name.toUpperCase().includes(shop.name.toUpperCase()));
  if (match) {
    assert(match.pos.y >= shop.expectedMinY, `Biển hiệu "${shop.name}" nâng cao lên trên lanh-tô cửa/mái hiên (Y = ${match.pos.y.toFixed(2)}m >= ${shop.expectedMinY}m)`);
    if (shop.isSouth) {
      assert(match.pos.z >= shop.expectedZMin, `Biển hiệu "${shop.name}" quay ra MẶT TIỀN ĐƯỜNG RAY phía Nam (Z = ${match.pos.z.toFixed(2)} >= ${shop.expectedZMin})`);
    } else {
      assert(match.pos.z <= shop.expectedZMax, `Biển hiệu "${shop.name}" quay ra MẶT TIỀN ĐƯỜNG RAY phía Bắc (Z = ${match.pos.z.toFixed(2)} <= ${shop.expectedZMax})`);
    }
  } else {
    assert(false, `Không tìm thấy biển hiệu cho shop: ${shop.name}`);
  }
});

console.log('\n--- 2. KIỂM ĐỊNH QUÁN TRÀ ĐÁ VỈA HÈ & HỆ THỐNG GHẾ NGỒI TƯƠNG TÁC ---');

// Kiểm tra điểm trò chuyện Cụ Tính
const grandmaInteract = worldManager.interactables.find(item => item.promptText && item.promptText.includes('Cụ Tính'));
assert(grandmaInteract !== undefined, 'Tồn tại điểm tương tác trò chuyện thân tình cùng Cụ Tính');
if (grandmaInteract) {
  assert(grandmaInteract.position.distanceTo(new THREE.Vector3(-50, 0.6, 58.65)) < 0.5, 'Tọa độ Cụ Tính chính xác tại quán trà đá vỉa hè (-50, 0.6, 58.65)');
}

// Kiểm tra 4 ghế đẩu có thể ngồi (Sit Spots)
const sitSpots = worldManager.interactables.filter(item => item.isSitSpot && item.sitSpot);
console.log(`Tìm thấy ${sitSpots.length} vị trí ghế ngồi tương tác trong thế giới.`);
assert(sitSpots.length >= 4, `Quán trà đá vỉa hè trang bị ít nhất 4 ghế đẩu mộc mạc (thực tế: ${sitSpots.length})`);

sitSpots.forEach((spot, idx) => {
  assert(spot.sitSpot.seatY !== undefined, `Ghế #${idx + 1} (${spot.sitSpot.name}): Có cao độ mặt ghế chuẩn seatY = ${spot.sitSpot.seatY}m`);
  assert(spot.promptText.includes('Ngồi'), `Ghế #${idx + 1}: Có prompt văn minh mộc mạc "${spot.promptText}"`);
});

console.log('\n--- 3. KIỂM ĐỊNH LOGIC PLAYER CONTROLLER: NGỒI & ĐỨNG DẬY TỰ NHIÊN 60 FPS ---');

const playerController = new PlayerController(scene, worldManager, GameEventBus);

// Test cơ chế sitAt
const testSpot = sitSpots[0].sitSpot;
playerController.sitAt(testSpot);
assert(playerController.isSitting === true, 'PlayerController chuyển sang trạng thái isSitting = true');
assert(playerController.currentSitSpot === testSpot, 'PlayerController neo đúng vị trí currentSitSpot');
assert(playerController.velocity.length() === 0, 'Vận tốc nhân vật triệt tiêu hoàn toàn khi ngồi (không trôi lướt)');

// Test cơ chế standUp
playerController.standUp();
assert(playerController.isSitting === false, 'PlayerController chuyển về isSitting = false khi đứng dậy');
assert(playerController.currentSitSpot === null, 'currentSitSpot được giải phóng an toàn');

// Test tự động đứng dậy khi bấm phím di chuyển (WASD)
playerController.sitAt(testSpot);
playerController.keys.forward = true;
playerController.update(0.016);
assert(playerController.isSitting === false, 'Nhấn phím W di chuyển: Nhân vật tự động đứng dậy mượt mà, trả lại quyền điều khiển');
playerController.keys.forward = false;

// Test phím Space (Jump)
playerController.sitAt(testSpot);
playerController.keys.jump = true;
playerController.update(0.016);
assert(playerController.isSitting === false, 'Nhấn phím Space: Nhân vật tự động đứng dậy mượt mà');
playerController.keys.jump = false;

console.log('\n================================================================');
console.log(` KẾT QUẢ KIỂM DUYỆT: ${passCount}/${passCount + failCount} TESTS PASSED`);
console.log(` TỶ LỆ ĐẠT: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
console.log('================================================================');

if (failCount === 0) {
  console.log('>>> KẾT QUẢ CHÍNH THỨC: PASSED 100% - CHUẨN MỰC XUẤT SẮC! <<<');
  process.exit(0);
} else {
  console.error('>>> THẤT BẠI: CÒN LỖI CẦN KHẮC PHỤC! <<<');
  process.exit(1);
}
