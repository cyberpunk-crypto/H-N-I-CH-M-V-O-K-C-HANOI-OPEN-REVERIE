import * as THREE from '../src/lib/three.module.js';
import { GameEventBus } from '../src/bridge/GameEvents.js';
import { WorldManager } from '../src/core/WorldManager.js';
import { PlayerController } from '../src/core/PlayerController.js';

// Mock browser
if (typeof window === 'undefined') globalThis.window = globalThis;
if (typeof document === 'undefined') {
  globalThis.document = {
    createElementNS: () => ({ addEventListener: (ev, cb) => { if (ev === 'load') setTimeout(cb, 0); }, removeEventListener: () => {}, setAttribute: () => {}, style: {} }),
    createElement: () => ({ getContext: () => ({ fillRect: () => {}, drawImage: () => {}, getImageData: () => ({ data: [] }) }), addEventListener: () => {}, removeEventListener: () => {}, style: {} })
  };
}

const scene = new THREE.Scene();
const sceneManager = { getScene: () => scene };
const world = new WorldManager(sceneManager, GameEventBus);
const player = new PlayerController(scene, world, GameEventBus);

console.log('--- PATH 1: CẦU KIM QUY -> SÂN ĐẢO -> TAM CẤP -> THỀM -> NỘI ĐIỆN ---');

player.characterGroup.position.set(72, 1.0, -72);

const path1Waypoints = [
  { name: 'Sân đảo gần cầu', x: 74, z: -73 },
  { name: 'Sân đảo Tháp Rùa', x: 77, z: -74 },
  { name: 'Chân tam cấp Nam', x: 80, z: -74.2 },
  { name: 'Bậc tam cấp Nam', x: 80, z: -75.0 },
  { name: 'Mép thềm đá Tháp Rùa', x: 80, z: -75.8 },
  { name: 'Cửa vòm chính Nam', x: 80, z: -77.0 },
  { name: 'Bên trong Tháp Rùa', x: 80, z: -79.0 },
  { name: 'Trung tâm nội điện', x: 80, z: -80.0 }
];

for (const wp of path1Waypoints) {
  let steps = 0;
  while (steps < 200) {
    const cur = player.characterGroup.position;
    const dx = wp.x - cur.x;
    const dz = wp.z - cur.z;
    const dist = Math.hypot(dx, dz);
    if (dist <= 0.15) break;

    player.velocity.x = (dx / dist) * 3.5;
    player.velocity.z = (dz / dist) * 3.5;
    player.update(0.016);
    steps++;
  }
  const pos = player.characterGroup.position;
  const hits = player._groundHits || [];
  console.log(`[${wp.name}] At (${pos.x.toFixed(2)}, ${pos.z.toFixed(2)}): Y = ${pos.y.toFixed(3)}m, grounded = ${player.isGrounded}, topHit = ${hits[0]?.object?.name || 'none'} (${hits[0]?.point?.y?.toFixed(2) || 'N/A'}) in ${steps} steps`);
}
