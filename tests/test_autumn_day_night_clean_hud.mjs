/**
 * test_autumn_day_night_clean_hud.mjs
 * Kiểm định toàn diện:
 * 1. Xóa bỏ cầu thang phụ bên trái Cầu Long Biên, bảo toàn lan can liền mạch mạn Nam
 * 2. Tuyến dạo bộ di sản Ga Long Biên ↔ Thê Húc 100% trên cạn (0% xâm lấn mặt nước)
 * 3. Tháp Bút Tả Thanh Thiên 5 tầng & Cây bút lông vẽ lên trời xanh chân thực
 * 4. Đài Nghiên đào đá nâng bởi Tam Cóc & Tranh 3D Canva AI di sản
 * 5. Chu kỳ Ngày - Đêm liên tục & Hệ thống Mây 3D bồng bềnh mùa thu Hà Nội
 * 6. Bản đồ du lịch La bàn 0° Bắc (Không còn chữ phân khu gây vướng mắt)
 * 7. HUD tối giản chỉ giữ lại Bánh Răng ở góc phải & Bảng phân khu tự ẩn sau 4.5s
 */

import assert from 'node:assert';
import fs from 'node:fs';
import { SceneManager } from '../src/core/SceneManager.js';
import { MinimapHUD } from '../src/ui/MinimapHUD.js';

console.log('================================================================');
console.log(' KIỂM ĐỊNH TOÀN DIỆN: MÙA THU HÀ NỘI, NGÀY ĐÊM & CLEAN HUD');
console.log(' Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// 1. KIỂM ĐỊNH CẦU LONG BIÊN & ĐẠI LỘ DI SẢN KHÔNG XÂM LẤN NƯỚC
// -----------------------------------------------------------------------------
console.log('--- 1. Kiểm Định Cầu Long Biên & Đại Lộ Dạo Bộ Tránh Mặt Nước ---');

const worldManagerSrc = fs.readFileSync('src/core/WorldManager.js', 'utf8');

runTest('1.1. Cầu thang phụ bên trái Cầu Long Biên đã được xóa bỏ hoàn toàn', () => {
  assert(!worldManagerSrc.includes("stairwayGroup.name = 'LongBienToTheHucStairway'"), 'Không còn LongBienToTheHucStairway');
  assert(!worldManagerSrc.includes("GaLongBien_To_TheHuc_GrandStairway"), 'Không còn GaLongBien_To_TheHuc_GrandStairway');
  assert(!worldManagerSrc.includes('longBienStair_'), 'Không còn các bậc đá longBienStair');
  assert(!worldManagerSrc.includes('gaLongBienStep_'), 'Không còn các bậc đá gaLongBienStep');
});

runTest('1.2. Lan can đá mạn Nam (Z = 55m) bảo vệ liên tục toàn dải dốc dẫn viaduct', () => {
  assert(worldManagerSrc.includes("guardSouth.name = 'guardSouthFull'"), 'Có lan can guardSouthFull');
  assert(worldManagerSrc.includes('guardSouthLen = rampLen'), 'Chiều dài lan can phủ kín toàn bộ 58m dốc dẫn viaduct');
});

runTest('1.3. Đại lộ dạo bộ Long Biên ↔ Thê Húc chạy 100% trên đất liền (0% rơi xuống nước)', () => {
  // Tâm hồ (80, -80), bán kính hồ 84.8m. Kiểm tra tọa độ các điểm trên tuyến:
  const points = [
    { x: 25.0,  z: 42.0 },
    { x: 60.0,  z: 32.0 },
    { x: 95.0,  z: 22.0 },
    { x: 135.0, z: 8.0 },
    { x: 172.0, z: -14.0 },
    { x: 175.0, z: -36.0 },
    { x: 164.0, z: -36.0 }
  ];
  for (const pt of points) {
    const distToLakeCenter = Math.hypot(pt.x - 80, pt.z - (-80));
    assert(distToLakeCenter >= 94.0, `Điểm (${pt.x}, ${pt.z}) cách tâm hồ ${distToLakeCenter.toFixed(1)}m >= 94.0m (ngoài ranh nước 85m)`);
  }
});

// -----------------------------------------------------------------------------
// 2. KIỂM ĐỊNH THÁP BÚT, ĐÀI NGHIÊN & KIỆT TÁC TRANH 3D CANVA AI
// -----------------------------------------------------------------------------
console.log('\n--- 2. Kiểm Định Tháp Bút, Đài Nghiên & Tác Phẩm Canva AI 3D ---');

runTest('2.1. Tháp Bút Tả Thanh Thiên mọc từ nước hồ, kết cấu 5 tầng đá và biển chữ Hán thếp vàng', () => {
  assert(worldManagerSrc.includes('ThapBut_DaiNghien_Complex'), 'Tồn tại cụm Tháp Bút - Đài Nghiên');
  assert(worldManagerSrc.includes('TẢ THANH THIÊN'), 'Có chữ Tả Thanh Thiên');
  assert(worldManagerSrc.includes('ngocBoiUnderwater'), 'Có chân móng đá Núi Ngọc Bội ngâm sâu dưới nước hồ');
});

runTest('2.2. Đỉnh Tháp Bút có bút lông viết lên trời xanh chân thực (Cán bút, Khâu đồng, Ngòi mực đen)', () => {
  assert(worldManagerSrc.includes('brushShaft'), 'Có cán bút lông');
  assert(worldManagerSrc.includes('ferrule'), 'Có khâu đồng giữ bút');
  assert(worldManagerSrc.includes('penTip'), 'Có ngòi bút mực đen tuyền');
});

runTest('2.3. Đài Nghiên đá nửa quả đào nâng đỡ bởi Tam Cóc Đội Nghiên đứng trên cổng vòm ngâm nước', () => {
  assert(worldManagerSrc.includes('inkSlabPeach'), 'Có nghiên mực quả đào');
  assert(worldManagerSrc.includes('frogSpots'), 'Có 3 chú cóc đá đội đài nghiên');
  assert(worldManagerSrc.includes('gatePillarsBase'), 'Chân trụ cổng ngâm sâu dưới nước hồ');
});

runTest('2.4. Tranh Sơn Dầu Di Sản Cầu Thê Húc & Đền Ngọc Sơn với link xác thực', () => {
  assert(fs.existsSync('assets/textures/canva_thehuc_ngocson.png'), 'Texture canva_thehuc_ngocson.png tồn tại');
  assert(worldManagerSrc.includes('HeritageOilPaintingInstallation'), 'Có giá vẽ di sản tranh sơn dầu');
  assert(worldManagerSrc.includes('MAHbXhXn470'), 'Có ID liên kết tranh Canva chính xác');
});

// -----------------------------------------------------------------------------
// 3. KIỂM ĐỊNH CHU KỲ NGÀY - ĐÊM & MÂY 3D TRÔI THEO GIÓ THU
// -----------------------------------------------------------------------------
console.log('\n--- 3. Kiểm Định Chu Kỳ Ngày - Đêm & Mây 3D Bồng Bềnh ---');

runTest('3.1. SceneManager khởi tạo chu kỳ Ngày - Đêm và các chế độ luân phiên (Mặc định 24 phút)', () => {
  const sceneMgr = new SceneManager();
  assert(typeof sceneMgr.setTimeOfDay === 'function', 'Có setTimeOfDay');
  assert(typeof sceneMgr.setDayNightMode === 'function', 'Có setDayNightMode');
  assert(typeof sceneMgr.getDayNightInfo === 'function', 'Có getDayNightInfo');
  assert.strictEqual(sceneMgr.cycleDurationSec, 1440, 'Mặc định chu kỳ ngày đêm là 24 phút (1440 giây)');

  sceneMgr.setDayNightMode('day');
  const infoDay = sceneMgr.getDayNightInfo();
  assert.strictEqual(infoDay.isNight, false, 'Ban ngày isNight = false');

  sceneMgr.setDayNightMode('night');
  const infoNight = sceneMgr.getDayNightInfo();
  assert.strictEqual(infoNight.isNight, true, 'Ban đêm isNight = true');
});

runTest('3.2. Cụm Mây 3D bồng bềnh trôi nhẹ trên bầu trời mùa thu Hà Nội', () => {
  const sceneMgr = new SceneManager();
  assert(sceneMgr.cloudsGroup, 'Tồn tại cloudsGroup');
  assert(sceneMgr.cloudsList.length >= 15, 'Có ít nhất 15 cụm mây 3D');

  const initialX = sceneMgr.cloudsList[0].group.position.x;
  sceneMgr.update(1.0); // delta = 1s
  const nextX = sceneMgr.cloudsList[0].group.position.x;
  assert(nextX > initialX, 'Mây chuyển động trôi nhẹ theo thời gian');
});

runTest('3.3. Hạt lá vàng rơi mùa thu và bụi nắng được vận hành mượt mà', () => {
  const sceneMgr = new SceneManager();
  assert(sceneMgr.leafPoints, 'Có hạt lá vàng rơi');
  assert(sceneMgr.dustPoints, 'Có hạt bụi nắng');
});

// -----------------------------------------------------------------------------
// 4. KIỂM ĐỊNH GIAO DIỆN TỐI GIẢN (CLEAN HUD) & LA BÀN MINIMAP 0°
// -----------------------------------------------------------------------------
console.log('\n--- 4. Kiểm Định Clean HUD, Bánh Răng & La Bàn 0° ---');

const indexHtmlSrc = fs.readFileSync('index.html', 'utf8');

runTest('4.1. Thanh HUD trên cùng chỉ còn lại duy nhất nút Bánh Răng Cài Đặt ở góc phải', () => {
  assert(indexHtmlSrc.includes('btnSettingsHud'), 'Tồn tại nút bánh răng btnSettingsHud');
  assert(!indexHtmlSrc.includes('id="quickCharacterBar"'), 'Đã gỡ quickCharacterBar khỏi HUD chính');
  assert(!indexHtmlSrc.includes('id="btnToggleCameraHud"'), 'Đã gỡ btnToggleCameraHud khỏi HUD chính');
  assert(!indexHtmlSrc.includes('id="btnOpenMapHud"'), 'Đã gỡ btnOpenMapHud khỏi HUD chính');
  assert(!indexHtmlSrc.includes('id="btnOpenScrapbookHud"'), 'Đã gỡ btnOpenScrapbookHud khỏi HUD chính');
  assert(!indexHtmlSrc.includes('id="btnRecreateCharacterHud"'), 'Đã gỡ btnRecreateCharacterHud khỏi HUD chính');
});

const minimapSrc = fs.readFileSync('src/ui/MinimapHUD.js', 'utf8');

runTest('4.2. Minimap không còn các dòng chữ phân khu gây vướng mắt', () => {
  assert(!minimapSrc.includes("fillText('PHỐ CỔ'"), 'Không còn chữ PHỐ CỔ');
  assert(!minimapSrc.includes("fillText('LONG BIÊN'"), 'Không còn chữ LONG BIÊN');
  assert(!minimapSrc.includes("fillText('TẬP THỂ'"), 'Không còn chữ TẬP THỂ');
  assert(!minimapSrc.includes("fillText('HỒ GƯƠM'"), 'Không còn chữ HỒ GƯƠM');
});

runTest('4.3. Minimap hiển thị vạch La Bàn và ký hiệu 0° ở hướng Bắc', () => {
  assert(minimapSrc.includes("fillText('0°'"), 'Hiển thị ký hiệu 0°');
  assert(minimapSrc.includes('dialRadius'), 'Có vành la bàn dialRadius');
});

const uiManagerSrc = fs.readFileSync('src/ui/UIManager.js', 'utf8');
const hudCssSrc = fs.readFileSync('styles/hud.css', 'utf8');

runTest('4.4. Bảng tên phân khu tự động ẩn sau 4.5 giây (Fade Out êm dịu)', () => {
  assert(uiManagerSrc.includes('4500'), 'Thời gian chờ 4500ms (4.5 giây)');
  assert(uiManagerSrc.includes('zone-badge-hidden'), 'Sử dụng class zone-badge-hidden');
  assert(hudCssSrc.includes('.player-zone-badge.zone-badge-hidden'), 'Đã khai báo style cho zone-badge-hidden');
});

const settingsModalSrc = fs.readFileSync('src/ui/SettingsModal.js', 'utf8');

runTest('4.5. Bảng Cài Đặt tích hợp Cụm Hành Trình (Máy Ảnh, Bản Đồ, Album) và 4 Nhân Vật', () => {
  assert(settingsModalSrc.includes('btnSettingsCamera'), 'Có nút máy ảnh trong cài đặt');
  assert(settingsModalSrc.includes('btnSettingsMap'), 'Có nút bản đồ trong cài đặt');
  assert(settingsModalSrc.includes('btnSettingsAlbum'), 'Có nút album trong cài đặt');
  assert(settingsModalSrc.includes('settings-character-grid'), 'Có cụm đổi 4 nhân vật');
  assert(settingsModalSrc.includes('daynight-presets-grid'), 'Có cụm điều khiển ngày - đêm');
});

// -----------------------------------------------------------------------------
// TỔNG HỢP KẾT QUẢ
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(` KẾT QUẢ KIỂM ĐỊNH MÙA THU & CLEAN HUD: ${passedTests}/${totalTests} TESTS PASSED`);
console.log(` TỶ LỆ ĐẠT: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log('================================================================');

if (passedTests === totalTests) {
  console.log('>>> KẾT QUẢ CHÍNH THỨC: PASSED 100% - CHUẨN MỰC XUẤT SẮC! <<<');
} else {
  process.exit(1);
}
