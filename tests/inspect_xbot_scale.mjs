import fs from 'fs';
import * as THREE from '../src/lib/three.module.js';
import { GLTFLoader } from '../src/lib/loaders/GLTFLoader.js';

const buf = fs.readFileSync('assets/models/Xbot.glb');
const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const loader = new GLTFLoader();
loader.parse(arrayBuf, '', (gltf) => {
  const scene = gltf.scene;
  scene.traverse((c) => {
    console.log(c.type, c.name, 'scale:', c.scale, 'pos:', c.position);
    if (c.isSkinnedMesh) {
      console.log('SkinnedMesh:', c.name, 'bindMode:', c.bindMode, 'bindMatrix:', c.bindMatrix);
      const b3 = new THREE.Box3().setFromBufferAttribute(c.geometry.attributes.position);
      console.log('Geo bbox:', b3);
    }
  });
});
