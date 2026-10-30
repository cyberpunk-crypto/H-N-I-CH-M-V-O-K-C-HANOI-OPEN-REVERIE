/**
 * ThreeLib.js - Wrapper nạp Three.js r160+ cục bộ siêu tốc, zero CDN latency
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import * as THREE from '../lib/three.module.js';

const globalScope = typeof window !== 'undefined' ? window : globalThis;
globalScope.THREE = THREE;

export { THREE };
export default THREE;
