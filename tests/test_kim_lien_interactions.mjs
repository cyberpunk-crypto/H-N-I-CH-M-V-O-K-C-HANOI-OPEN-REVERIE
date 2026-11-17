/**
 * test_kim_lien_interactions.mjs
 * Kiểm thử tính năng Tối ưu UI/UX và Các Tương Tác Trải Nghiệm Khu Tập Thể Kim Liên
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { SPECIAL_LANDMARKS } from '../src/ui/ToastNotification.js';

console.log('================================================================');
console.log(' KIỂM THỬ TƯƠNG TÁC & THÔNG BÁO KHÁM PHÁ KHU TẬP THỂ KIM LIÊN');
console.log('================================================================\n');

// 1. KIỂM THỬ ĐĂNG KÝ VÀ TỌA ĐỘ 3 ĐỊA DANH KHÁM PHÁ
console.log('--- TEST 1: Kiểm Tra SPECIAL_LANDMARKS trong ToastNotification.js ---');
const sanhA1 = SPECIAL_LANDMARKS.find(lm => lm.id === 'sanh_tap_the_a1');
const canHo204 = SPECIAL_LANDMARKS.find(lm => lm.id === 'can_ho_204_bao_cap');
const chuongCop = SPECIAL_LANDMARKS.find(lm => lm.id === 'chuong_cop_hoang_hon');

assert(sanhA1, 'Phải có landmark sanh_tap_the_a1');
console.log(`  ✓ Đã đăng ký: [${sanhA1.id}] "${sanhA1.title}" (icon: ${sanhA1.icon})`);
assert(canHo204, 'Phải có landmark can_ho_204_bao_cap');
console.log(`  ✓ Đã đăng ký: [${canHo204.id}] "${canHo204.title}" (icon: ${canHo204.icon})`);
assert(chuongCop, 'Phải có landmark chuong_cop_hoang_hon');
console.log(`  ✓ Đã đăng ký: [${chuongCop.id}] "${chuongCop.title}" (icon: ${chuongCop.icon})`);

// 2. KIỂM THỬ HÀM CHECK TỌA ĐỘ VÀ CHIỀU CAO
console.log('\n--- TEST 2: Kiểm Tra Hàm check(pos) Cho Từng Phân Vùng ---');
// Sảnh Tầng 1 (X: -50, Y: 0.5, Z: -55)
assert.strictEqual(sanhA1.check({ x: -50, y: 0.5, z: -55 }), true, 'Người chơi tại sảnh A1 tầng 1 phải được phát hiện');
assert.strictEqual(sanhA1.check({ x: 0, y: 0.5, z: 0 }), false, 'Người chơi ở Hồ Gươm không kích hoạt sảnh A1');
console.log('  ✓ Hàm check(pos) cho Sảnh A1 hoạt động chính xác');

// Căn Hộ 204 Tầng 2 (X: -62, Y: 3.8, Z: -62)
assert.strictEqual(canHo204.check({ x: -62, y: 3.8, z: -62 }), true, 'Người chơi tại Căn Hộ 204 tầng 2 phải được phát hiện');
assert.strictEqual(canHo204.check({ x: -62, y: 1.0, z: -62 }), false, 'Người chơi ở tầng 1 dưới căn hộ 204 không kích hoạt');
console.log('  ✓ Hàm check(pos) cho Căn Hộ 204 hoạt động chính xác theo tầng');

// Ban Công Chuồng Cọp Tầng 2 (X: -62, Y: 3.8, Z: -53)
assert.strictEqual(chuongCop.check({ x: -62, y: 3.8, z: -53 }), true, 'Người chơi tại Ban Công Chuồng Cọp phải được phát hiện');
console.log('  ✓ Hàm check(pos) cho Ban Công Chuồng Cọp hoạt động chính xác');

// 3. KIỂM THỬ FILE ÂM THANH HOÀI NIỆM TỒN TẠI TRÊN ĐĨA CỨNG
console.log('\n--- TEST 3: Kiểm Tra Tồn Tại File Âm Thanh Tương Tác ---');
const cassettePath = path.join('assets', 'audio', 'cassette_autumn_audio.mp3');
const waterTapPath = path.join('assets', 'audio', 'water_tap_audio.mp3');

assert(fs.existsSync(cassettePath), 'File cassette_autumn_audio.mp3 phải tồn tại');
console.log(`  ✓ File âm thanh tồn tại: ${cassettePath} (${fs.statSync(cassettePath).size} bytes)`);

assert(fs.existsSync(waterTapPath), 'File water_tap_audio.mp3 phải tồn tại');
console.log(`  ✓ File âm thanh tồn tại: ${waterTapPath} (${fs.statSync(waterTapPath).size} bytes)`);

// 4. KIỂM THỬ CSS GIAO DIỆN PROMPT PHÍM E VÀ TOAST
console.log('\n--- TEST 4: Kiểm Tra CSS Định Kiểu Prompt [E] & Toast trong styles/hud.css ---');
const hudCss = fs.readFileSync(path.join('styles', 'hud.css'), 'utf8');

assert(hudCss.includes('.interaction-prompt-container'), 'CSS phải có .interaction-prompt-container');
assert(hudCss.includes('.interaction-prompt-box'), 'CSS phải có .interaction-prompt-box');
assert(hudCss.includes('.keycap'), 'CSS phải có .keycap');
assert(hudCss.includes('keycapBreathing'), 'CSS phải có animation keycapBreathing');
assert(hudCss.includes('icon-cassette'), 'CSS phải có icon-cassette');
assert(hudCss.includes('icon-water'), 'CSS phải có icon-water');
assert(hudCss.includes('icon-building'), 'CSS phải có icon-building');
assert(hudCss.includes('icon-home'), 'CSS phải có icon-home');
assert(hudCss.includes('icon-sunset'), 'CSS phải có icon-sunset');
console.log('  ✓ CSS styles cho prompt phím [E] và toàn bộ icon toast retro đã hoàn thiện');

console.log('\n================================================================');
console.log(' TẤT CẢ 4 HẠNG MỤC KIỂM THỬ KIM LIÊN ĐÃ ĐẠT 100% HOÀN HẢO!');
console.log('================================================================');
