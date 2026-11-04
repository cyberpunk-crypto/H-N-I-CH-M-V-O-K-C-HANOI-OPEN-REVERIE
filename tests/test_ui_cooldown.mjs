/**
 * test_ui_cooldown.mjs - Unit test kiểm định cơ chế Debounce & Cooldown 600ms (Khắc phục Lỗi 6)
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import assert from 'node:assert';
import { GameEventBus } from '../src/bridge/GameEvents.js';
import { CHARACTERS, DEFAULT_CHARACTERS, CharacterCreation } from '../src/ui/CharacterCreation.js';
import { HUD, HUD_CONFIG } from '../src/ui/HUD.js';

console.log('================================================================');
console.log(' KIỂM THỬ DEBOUNCE / COOLDOWN 600MS & UI 4 NHÂN VẬT VIỆT NAM');
console.log('================================================================\n');

// 1. KIỂM ĐỊNH 4 NHÂN VẬT VIỆT NAM ĐỘC BẢN
console.log('--- TEST 1: Danh Sách & Thông Tin 4 Nhân Vật Việt Nam ---');
assert.strictEqual(CHARACTERS.length, 4, 'Phải có đúng 4 nhân vật Việt Nam độc bản');

const expectedIds = [
  'char_nu_sinh_ao_dai',
  'char_co_gai_ao_ba_ba',
  'char_nam_tri_thuc_suit',
  'char_nam_ao_dai_gam'
];

expectedIds.forEach(id => {
  const char = CHARACTERS.find(c => c.id === id);
  assert(char, `Nhân vật ${id} phải tồn tại`);
  assert(char.avatar && char.avatar.includes('avatar_'), `Nhân vật ${id} có avatar hợp lệ`);
  assert(char.outfitFeature && char.outfitFeature.length > 10, `Nhân vật ${id} có thông tin trang phục`);
  assert(char.name && char.name.length > 5, `Nhân vật ${id} có tên gọi trang trọng`);
  console.log(`  ✓ [${char.id}] ${char.name} - ${char.outfitFeature.slice(0, 45)}...`);
});

// 2. KIỂM ĐỊNH COOLDOWN TRONG HUD.js
console.log('\n--- TEST 2: Cooldown >= 600ms trong HUD.js ---');
assert(HUD_CONFIG.COOLDOWN_MS >= 600, 'HUD_CONFIG.COOLDOWN_MS phải tối thiểu 600ms');

const hud = new HUD();
assert.strictEqual(hud.isSwitching, false, 'Trạng thái ban đầu không được lock');

// Click lần 1 -> Thành công
const firstClick = hud.switchCharacter('char_co_gai_ao_ba_ba');
assert.strictEqual(firstClick, true, 'Lần click đầu tiên phải được chấp thuận');
assert.strictEqual(hud.isSwitching, true, 'Cờ isSwitching phải được bật lên true');

// Click ngay lập tức lần 2 -> Bị chặn chống spam
const spamClick = hud.switchCharacter('char_nam_tri_thuc_suit');
assert.strictEqual(spamClick, false, 'Click liên tiếp trong 600ms phải bị chặn');

// Chờ mở khóa Cooldown
console.log('  -> Đang chờ cooldown 650ms...');
await new Promise(res => setTimeout(res, 650));
assert.strictEqual(hud.isSwitching, false, 'Sau cooldown 600ms, cờ isSwitching phải tự giải phóng');

// Click sau cooldown -> Thành công
const nextClick = hud.switchCharacter('char_nam_ao_dai_gam');
assert.strictEqual(nextClick, true, 'Click sau khi hết cooldown phải thành công');

// 3. KIỂM ĐỊNH SỰ KIỆN CORE:CHARACTER_SWITCHED MỞ KHÓA TỨC THÌ
console.log('\n--- TEST 3: CORE:CHARACTER_SWITCHED Mở Khóa Tức Thì ---');
hud.switchCharacter('char_nu_sinh_ao_dai');
assert.strictEqual(hud.isSwitching, true, 'isSwitching đang bật');

GameEventBus.emit('CORE:CHARACTER_SWITCHED', { characterId: 'char_nu_sinh_ao_dai', success: true });
assert.strictEqual(hud.isSwitching, false, 'Sự kiện CORE:CHARACTER_SWITCHED mở khóa ngay lập tức');

console.log('\n================================================================');
console.log(' TẤT CẢ CÁC BÀI KIỂM THỬ COOLDOWN & UI HOÀN TOÀN THÀNH CÔNG 100%!');
console.log('================================================================');
