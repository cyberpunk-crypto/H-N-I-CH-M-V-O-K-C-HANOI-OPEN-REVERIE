import fs from 'fs';
import * as THREE from '../src/lib/three.module.js';
import { GLTFLoader } from '../src/lib/loaders/GLTFLoader.js';

const buf = fs.readFileSync('assets/models/Xbot.glb');
const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const loader = new GLTFLoader();
loader.parse(arrayBuf, '', (gltf) => {
  const model = gltf.scene;
  const mixer = new THREE.AnimationMixer(model);

  const leftFoot = model.getObjectByName('mixamorigLeftFoot');
  const leftToe = model.getObjectByName('mixamorigLeftToe_End') || model.getObjectByName('mixamorigLeftToeBase');
  const rightFoot = model.getObjectByName('mixamorigRightFoot');
  const rightToe = model.getObjectByName('mixamorigRightToe_End') || model.getObjectByName('mixamorigRightToeBase');

  const worldPos = new THREE.Vector3();

  for (const clip of gltf.animations) {
    if (!['idle', 'walk', 'run'].includes(clip.name)) continue;
    const action = mixer.clipAction(clip);
    action.play();

    let lowestY = Infinity;
    const dt = 0.05;
    for (let t = 0; t <= clip.duration; t += dt) {
      mixer.setTime(t);
      model.updateMatrixWorld(true);

      leftFoot.getWorldPosition(worldPos);
      lowestY = Math.min(lowestY, worldPos.y);

      leftToe.getWorldPosition(worldPos);
      lowestY = Math.min(lowestY, worldPos.y);

      rightFoot.getWorldPosition(worldPos);
      lowestY = Math.min(lowestY, worldPos.y);

      rightToe.getWorldPosition(worldPos);
      lowestY = Math.min(lowestY, worldPos.y);
    }
    console.log(`Clip ${clip.name}: lowest foot Y = ${lowestY.toFixed(4)}m`);
    action.stop();
  }
});
