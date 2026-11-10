import fs from 'fs';
import path from 'path';
import * as THREE from '../src/lib/three.module.js';
import { GLTFLoader } from '../src/lib/loaders/GLTFLoader.js';

// Read Xbot.glb
const buf = fs.readFileSync('assets/models/Xbot.glb');
const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const loader = new GLTFLoader();
loader.parse(arrayBuf, '', (gltf) => {
  console.log('GLTF loaded successfully');
  const scene = gltf.scene;

  // Compute bounding box
  const box = new THREE.Box3().setFromObject(scene);
  console.log('Unskinned Scene Bounding Box:', {
    min: { x: box.min.x, y: box.min.y, z: box.min.z },
    max: { x: box.max.x, y: box.max.y, z: box.max.z },
    size: {
      x: box.max.x - box.min.x,
      y: box.max.y - box.min.y,
      z: box.max.z - box.min.z
    }
  });

  // Find all bones and their rest positions
  const bones = [];
  scene.traverse((c) => {
    if (c.isBone) {
      bones.push({ name: c.name, y: c.position.y });
    }
  });
  console.log('Bones count:', bones.length);
  const hips = bones.find(b => b.name.includes('Hips'));
  const footL = bones.find(b => b.name.includes('LeftFoot'));
  const toeL = bones.find(b => b.name.includes('LeftToeBase'));
  console.log('Hips:', hips);
  console.log('LeftFoot:', footL);
  console.log('LeftToeBase:', toeL);

  // Check animations
  if (gltf.animations) {
    console.log('Animations:', gltf.animations.map(a => a.name));
    for (const clip of gltf.animations) {
      const hipsTrack = clip.tracks.find(t => t.name.includes('Hips.position'));
      if (hipsTrack) {
        let minY = Infinity, maxY = -Infinity;
        for (let i = 1; i < hipsTrack.values.length; i += 3) {
          const val = hipsTrack.values[i];
          if (val < minY) minY = val;
          if (val > maxY) maxY = val;
        }
        console.log(`Clip ${clip.name} Hips.position Y range: [${minY}, ${maxY}]`);
      }
    }
  }
}, (err) => {
  console.error('Error parsing GLTF:', err);
});
