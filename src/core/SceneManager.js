/**
 * SceneManager.js - Quản lý Scene 3D, Skybox hoàng hôn vàng ấm, Sương mù & Ánh sáng Hà Nội
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { THREE } from './ThreeLib.js';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.lights = [];
    this.lanternLights = [];
    this.leafParticles = null;
    this.dustParticles = null;
    this.clock = new THREE.Clock();

    this._initFog();
    this._initSkybox();
    this._initLighting();
    this._initAutumnParticles();
  }

  /**
   * Sương mù hoài niệm (Hà Nội bảng lảng sương chiều mùa thu)
   */
  _initFog() {
    // Sương mù pha sắc vàng cam hoàng hôn hòa quyện với camera.far = 160m (Triệt tiêu hiện tượng drop FPS)
    const fogColor = new THREE.Color(0xd99a60);
    this.scene.background = fogColor;
    this.scene.fog = new THREE.Fog(fogColor.getHex(), 40, 155);
  }

  /**
   * Tạo vòm trời hoàng hôn (Skydome Gradient Canvas Texture)
   */
  _initSkybox() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Gradient bầu trời mùa thu: Xanh chàm đỉnh trời -> Cam đào -> Vàng rực chân trời
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0.0, '#261c36'); // Đỉnh trời tím chàm
    gradient.addColorStop(0.3, '#5c2d4a'); // Tím đỏ hoàng hôn
    gradient.addColorStop(0.55, '#c85a32'); // Cam gạch nung
    gradient.addColorStop(0.78, '#e58e38'); // Vàng cam ấm
    gradient.addColorStop(0.92, '#f8be60'); // Vàng mật ong
    gradient.addColorStop(1.0, '#d99a60'); // Hòa quyện với màu sương mù chân trời

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vẽ vầng mặt trời đỏ lặn mờ ảo sau làn sương khói
    const sunX = canvas.width * 0.28;
    const sunY = canvas.height * 0.76;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 140);
    sunGrad.addColorStop(0, 'rgba(255, 235, 180, 0.95)');
    sunGrad.addColorStop(0.3, 'rgba(255, 130, 45, 0.6)');
    sunGrad.addColorStop(0.7, 'rgba(230, 80, 40, 0.2)');
    sunGrad.addColorStop(1, 'rgba(200, 70, 30, 0)');

    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 140, 0, Math.PI * 2);
    ctx.fill();

    const skyTexture = new THREE.CanvasTexture(canvas);
    skyTexture.wrapS = THREE.ClampToEdgeWrapping;
    skyTexture.wrapT = THREE.ClampToEdgeWrapping;

    // Vòm bán cầu Skydome bao quanh thế giới 500m x 500m
    const skyGeo = new THREE.SphereGeometry(440, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide,
      fog: false
    });
    this.skydome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skydome);
  }

  /**
   * Ánh sáng hoàng hôn & Đèn đường phố cổ
   */
  _initLighting() {
    // 1. Ánh sáng bán cầu (Bầu trời ấm, mặt đất nâu rêu phong)
    const hemiLight = new THREE.HemisphereLight(0xffe6c4, 0x5a3d24, 0.85);
    hemiLight.position.set(0, 200, 0);
    this.scene.add(hemiLight);
    this.lights.push(hemiLight);

    // 2. Ánh nắng hoàng hôn xiên chếch (Tạo bóng đổ dài trên phố cổ)
    const sunLight = new THREE.DirectionalLight(0xffab50, 1.8);
    sunLight.position.set(-160, 85, -110);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 320;
    const shadowD = 130;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);
    this.lights.push(sunLight);
    this.sunLight = sunLight;

    // 3. Ánh sáng môi trường tổng thể
    const ambientLight = new THREE.AmbientLight(0x8a5e3d, 0.35);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);
  }

  /**
   * Tạo đèn điểm (PointLight) cho lồng đèn phố cổ hoặc đèn đường
   */
  createPointLight(position, color = 0xffa540, intensity = 1.6, distance = 18) {
    const light = new THREE.PointLight(color, intensity, distance, 1.2);
    light.position.copy(position);
    this.scene.add(light);
    this.lanternLights.push({
      light,
      baseIntensity: intensity,
      phase: Math.random() * Math.PI * 2
    });
    return light;
  }

  /**
   * Hệ thống hạt lá vàng rơi mùa thu & bụi nắng hoàng hôn
   */
  _initAutumnParticles() {
    // 1. Hạt lá vàng thu (Autumn Leaf Particles)
    const leafCount = 280;
    const leafGeo = new THREE.BufferGeometry();
    const leafPos = new Float32Array(leafCount * 3);
    const leafVel = [];

    for (let i = 0; i < leafCount; i++) {
      leafPos[i * 3 + 0] = (Math.random() - 0.5) * 450;
      leafPos[i * 3 + 1] = Math.random() * 25 + 1.0;
      leafPos[i * 3 + 2] = (Math.random() - 0.5) * 450;

      leafVel.push({
        vx: (Math.random() - 0.3) * 0.8,
        vy: -(Math.random() * 0.4 + 0.3),
        vz: (Math.random() - 0.4) * 0.7,
        rotSpeed: Math.random() * 2.0 + 1.0,
        swayPhase: Math.random() * Math.PI * 2
      });
    }

    leafGeo.setAttribute('position', new THREE.BufferAttribute(leafPos, 3));

    // Canvas texture chiếc lá vàng thu nhỏ nhắn
    const leafCanvas = document.createElement('canvas');
    leafCanvas.width = 32;
    leafCanvas.height = 32;
    const lctx = leafCanvas.getContext('2d');
    lctx.fillStyle = '#d4882c';
    lctx.beginPath();
    lctx.ellipse(16, 16, 12, 6, Math.PI / 4, 0, Math.PI * 2);
    lctx.fill();

    const leafTex = new THREE.CanvasTexture(leafCanvas);
    const leafMat = new THREE.PointsMaterial({
      size: 1.1,
      map: leafTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.leafPoints = new THREE.Points(leafGeo, leafMat);
    this.leafVelocities = leafVel;
    this.scene.add(this.leafPoints);

    // 2. Bụi nắng vàng lấp lánh (Golden Dust Motes)
    const dustCount = 220;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3 + 0] = (Math.random() - 0.5) * 200;
      dustPos[i * 3 + 1] = Math.random() * 12 + 0.5;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.4,
      color: 0xffe89e,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.dustPoints = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.dustPoints);
  }

  /**
   * Cập nhật animation các hiệu ứng trong Scene theo frame
   * @param {number} delta - Delta time
   */
  update(delta) {
    const time = this.clock.getElapsedTime();

    // 1. Cập nhật lá vàng rơi đung đưa trong gió
    if (this.leafPoints && this.leafVelocities) {
      const posAttr = this.leafPoints.geometry.attributes.position;
      const positions = posAttr.array;

      for (let i = 0; i < this.leafVelocities.length; i++) {
        const vel = this.leafVelocities[i];
        const idx = i * 3;

        // Rơi kết hợp dao động lượn hình sin
        positions[idx + 0] += (vel.vx + Math.sin(time * 1.5 + vel.swayPhase) * 0.4) * delta * 5.0;
        positions[idx + 1] += vel.vy * delta * 5.0;
        positions[idx + 2] += (vel.vz + Math.cos(time * 1.2 + vel.swayPhase) * 0.3) * delta * 5.0;

        // Reset lên trời khi chạm đất
        if (positions[idx + 1] <= 0.2) {
          positions[idx + 1] = Math.random() * 15 + 15;
          positions[idx + 0] = (Math.random() - 0.5) * 400;
          positions[idx + 2] = (Math.random() - 0.5) * 400;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 2. Nhấp nháy nhẹ lồng đèn phố cổ hoài niệm
    for (let i = 0; i < this.lanternLights.length; i++) {
      const item = this.lanternLights[i];
      const flicker = Math.sin(time * 4.0 + item.phase) * 0.12 + Math.cos(time * 7.0 + item.phase) * 0.08;
      item.light.intensity = item.baseIntensity + flicker;
    }

    // 3. Xoay nhẹ Skydome theo chiều hoàng hôn
    if (this.skydome) {
      this.skydome.rotation.y = time * 0.003;
    }
  }

  /**
   * Thêm đối tượng vào Scene
   */
  add(object) {
    this.scene.add(object);
  }

  /**
   * Xóa đối tượng khỏi Scene
   */
  remove(object) {
    this.scene.remove(object);
  }

  /**
   * Lấy instance THREE.Scene
   */
  getScene() {
    return this.scene;
  }
}
