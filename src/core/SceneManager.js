/**
 * SceneManager.js - Quản lý Scene 3D, Bầu trời Mùa Thu Hà Nội, Mây 3D & Chu kỳ Ngày - Đêm
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 * 
 * Tính năng nổi bật:
 * 1. Chu kỳ Ngày - Đêm liên tục (Sáng mùa thu man mác -> Trưa dịu êm -> Hoàng hôn vàng rực -> Đêm trăng huyền ảo)
 * 2. Hệ thống Mây 3D bồng bềnh trôi nhẹ theo làn gió thu Hà Nội
 * 3. Hạt lá vàng rơi chao liệng & bụi nắng vàng hoài niệm
 * 4. Tự động thắp sáng toàn bộ cột đèn đường, đèn lồng phố cổ & cầu Thê Húc khi đêm về
 * 5. Bộ điều khiển linh hoạt tốc độ chu kỳ (1 - 24 phút) và chế độ cố định ngày / đêm
 */

import { THREE } from './ThreeLib.js';
import { GameEventBus } from '../bridge/GameEvents.js';

function createSafeCanvas(w, h) {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  const dummyGrad = { addColorStop: () => {} };
  return {
    width: w,
    height: h,
    getContext: () => ({
      createLinearGradient: () => dummyGrad,
      createRadialGradient: () => dummyGrad,
      fillRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      ellipse: () => {}
    })
  };
}

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.lights = [];
    this.lanternLights = [];
    this.leafParticles = null;
    this.dustParticles = null;
    this.clock = new THREE.Clock();

    // Hệ thống Ngày - Đêm (Day-Night Cycle)
    this.dayNightMode = 'cycle'; // 'cycle' | 'day' | 'midday' | 'sunset' | 'night' | 'dawn'
    this.cycleDurationSec = 1440; // Mặc định: 24 phút cho 1 ngày đêm trọn vẹn (1 giờ game = 1 phút đời thực)
    this.timeOfDay = 9.5; // Bắt đầu lúc 9:30 sáng mùa thu Hà Nội
    this._lastSkyRedrawTime = -999;
    this._currentPhase = 'day';

    // Skybox Canvas Texture
    this.skyCanvas = createSafeCanvas(1024, 512);
    this.skyCtx = this.skyCanvas.getContext('2d');
    this.skyTexture = new THREE.CanvasTexture(this.skyCanvas);
    this.skyTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.skyTexture.wrapT = THREE.ClampToEdgeWrapping;

    this._initFog();
    this._initSkybox();
    this._initLighting();
    this._initClouds();
    this._initAutumnParticles();
    this._bindEvents();
  }

  _bindEvents() {
    GameEventBus.on('UI:SET_DAY_NIGHT_MODE', (payload) => {
      if (!payload) return;
      if (payload.mode) {
        this.setDayNightMode(payload.mode, payload.durationMinutes);
      }
      if (typeof payload.timeOfDay === 'number') {
        this.setTimeOfDay(payload.timeOfDay);
      }
    });
  }

  /**
   * Sương mù hoài niệm biến thiên theo thời gian trong ngày
   */
  _initFog() {
    const initFogColor = new THREE.Color(0xe8f0f8); // Sáng thu trong trẻo
    this.scene.background = initFogColor;
    this.scene.fog = new THREE.Fog(initFogColor.getHex(), 80, 245);
  }

  /**
   * Vòm trời Skydome bán kính 145m bám tâm camera
   */
  _initSkybox() {
    this._drawSkyGradient(this.timeOfDay);

    const skyGeo = new THREE.SphereGeometry(145, 24, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      map: this.skyTexture,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false
    });
    this.skydome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skydome);
  }

  /**
   * Vẽ gradient vòm trời theo giờ trong ngày (Canvas 2D)
   * @param {number} hour - Giờ trong ngày (0 - 24)
   */
  _drawSkyGradient(hour) {
    const ctx = this.skyCtx;
    const w = this.skyCanvas.width;
    const h = this.skyCanvas.height;

    const grad = ctx.createLinearGradient(0, 0, 0, h);

    if (hour >= 6.0 && hour < 15.5) {
      // ☀️ BAN NGÀY / SÁNG THU HÀ NỘI (Trời xanh trong man mác, sương dịu)
      grad.addColorStop(0.0, '#3672a8'); // Xanh da trời đỉnh vòm
      grad.addColorStop(0.35, '#6fa1cc');
      grad.addColorStop(0.70, '#b6d5ec');
      grad.addColorStop(0.90, '#e8f1f8');
      grad.addColorStop(1.0, '#dbe7f2'); // Hòa sắc sương mù chân trời
    } else if (hour >= 15.5 && hour < 18.5) {
      // 🌇 HOÀNG HÔN MÙA THU (Hà Nội chiều thu vàng mật ong, tím biếc)
      const t = (hour - 15.5) / 3.0;
      grad.addColorStop(0.0, '#261c36'); // Đỉnh trời tím chàm
      grad.addColorStop(0.30, '#5c2d4a'); // Tím đỏ
      grad.addColorStop(0.55, '#c85a32'); // Cam gạch nung
      grad.addColorStop(0.78, '#e58e38'); // Vàng cam ấm
      grad.addColorStop(0.92, '#f8be60'); // Vàng mật ong
      grad.addColorStop(1.0, '#d99a60');
    } else if (hour >= 18.5 || hour < 5.0) {
      // 🌙 ĐÊM TRĂNG PHỐ CỔ (Trời lam tím đen huyền ảo, ánh trăng vằng vặc)
      grad.addColorStop(0.0, '#060a14'); // Đỉnh trời xanh đen thăm thẳm
      grad.addColorStop(0.40, '#0c162c');
      grad.addColorStop(0.75, '#152445');
      grad.addColorStop(0.92, '#1b2d52');
      grad.addColorStop(1.0, '#101a2e');
    } else {
      // 🌅 RẠNG ĐÔNG / BÌNH MINH (5.0 - 6.0)
      grad.addColorStop(0.0, '#1a1f3c');
      grad.addColorStop(0.35, '#4a3b5c');
      grad.addColorStop(0.65, '#995655');
      grad.addColorStop(0.85, '#e08968');
      grad.addColorStop(1.0, '#fad390');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Vẽ Mặt Trời hoặc Mặt Trăng
    if (hour >= 5.5 && hour <= 18.5) {
      // Mặt trời thu
      const sunProgress = (hour - 5.5) / 13.0; // 0 -> 1
      const sunX = w * (0.15 + sunProgress * 0.7);
      const sunY = h * (0.85 - Math.sin(sunProgress * Math.PI) * 0.55);
      const sunRad = 90;

      const sunGrad = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, sunRad);
      sunGrad.addColorStop(0, 'rgba(255, 250, 220, 0.95)');
      sunGrad.addColorStop(0.25, 'rgba(255, 200, 110, 0.7)');
      sunGrad.addColorStop(0.65, 'rgba(255, 140, 50, 0.25)');
      sunGrad.addColorStop(1, 'rgba(255, 120, 40, 0)');

      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRad, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Vầng trăng thu vằng vặc chiếu bóng Hồ Gươm
      const moonX = w * 0.72;
      const moonY = h * 0.28;
      const moonGrad = ctx.createRadialGradient(moonX, moonY, 6, moonX, moonY, 70);
      moonGrad.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
      moonGrad.addColorStop(0.25, 'rgba(220, 235, 255, 0.55)');
      moonGrad.addColorStop(0.7, 'rgba(140, 180, 255, 0.15)');
      moonGrad.addColorStop(1, 'rgba(100, 140, 255, 0)');

      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 70, 0, Math.PI * 2);
      ctx.fill();

      // Thêm vài vì sao lấp lánh nhẹ
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let s = 0; s < 35; s++) {
        const sx = ((s * 97) % w);
        const sy = ((s * 53) % (h * 0.6));
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
    }

    this.skyTexture.needsUpdate = true;
  }

  /**
   * Khởi tạo hệ thống chiếu sáng (Mặt trời, Mặt trăng, Bán cầu, Môi trường)
   */
  _initLighting() {
    // 1. Ánh sáng bán cầu (HemisphereLight)
    this.hemiLight = new THREE.HemisphereLight(0xdff0ff, 0x6e5c46, 0.85);
    this.hemiLight.position.set(0, 200, 0);
    this.scene.add(this.hemiLight);
    this.lights.push(this.hemiLight);

    // 2. Ánh nắng Mặt Trời (DirectionalLight)
    this.sunLight = new THREE.DirectionalLight(0xfffaea, 1.7);
    this.sunLight.position.set(-160, 120, -110);
    this.sunLight.castShadow = false;
    this.scene.add(this.sunLight);
    this.lights.push(this.sunLight);

    // 3. Ánh trăng Đêm (DirectionalLight phụ)
    this.moonLight = new THREE.DirectionalLight(0x8cb4e8, 0.0);
    this.moonLight.position.set(160, 110, 110);
    this.moonLight.castShadow = false;
    this.scene.add(this.moonLight);
    this.lights.push(this.moonLight);

    // 4. Ánh sáng môi trường tổng thể (AmbientLight)
    this.ambientLight = new THREE.AmbientLight(0x756758, 0.38);
    this.scene.add(this.ambientLight);
    this.lights.push(this.ambientLight);
  }

  /**
   * ☁️ HỆ THỐNG MÂY 3D BỒNG BỀNH TRÔI THEO GIÓ THU HÀ NỘI
   * Cụm mây mềm mại tự nhiên rải đều trên tầng không (Y = 70m - 90m)
   */
  _initClouds() {
    this.cloudsGroup = new THREE.Group();
    this.cloudsGroup.name = 'HanoiAutumnClouds';
    this.cloudsList = [];

    const cloudCount = 20;
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.78,
      fog: false,
      depthWrite: false
    });
    this.cloudMaterial = cloudMat;

    for (let c = 0; c < cloudCount; c++) {
      const cluster = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 4);
      const clusterScale = 1.2 + Math.random() * 1.5;

      for (let p = 0; p < numPuffs; p++) {
        const puffRadius = 7.0 + Math.random() * 8.0;
        const puffGeo = new THREE.SphereGeometry(puffRadius, 8, 8);
        const puffMesh = new THREE.Mesh(puffGeo, cloudMat);

        puffMesh.position.set(
          (Math.random() - 0.5) * 26 * clusterScale,
          (Math.random() - 0.5) * 5 * clusterScale,
          (Math.random() - 0.5) * 18 * clusterScale
        );
        puffMesh.scale.set(1.4, 0.45, 1.0);
        cluster.add(puffMesh);
      }

      cluster.position.set(
        (Math.random() - 0.5) * 440,
        72 + Math.random() * 24,
        (Math.random() - 0.5) * 440
      );

      const driftSpeed = 0.8 + Math.random() * 1.2;
      this.cloudsList.push({
        group: cluster,
        speed: driftSpeed
      });
      this.cloudsGroup.add(cluster);
    }

    this.scene.add(this.cloudsGroup);
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
   * Hệ thống hạt lá vàng mùa thu & bụi nắng hoài niệm
   */
  _initAutumnParticles() {
    // 1. Lá vàng & lá đỏ mùa thu rơi chao liệng (150 hạt - Tối ưu 60 FPS)
    const leafCount = 150;
    const leafGeo = new THREE.BufferGeometry();
    const leafPos = new Float32Array(leafCount * 3);
    const leafVel = [];

    for (let i = 0; i < leafCount; i++) {
      leafPos[i * 3 + 0] = (Math.random() - 0.5) * 450;
      leafPos[i * 3 + 1] = Math.random() * 25 + 1.0;
      leafPos[i * 3 + 2] = (Math.random() - 0.5) * 450;

      leafVel.push({
        vx: (Math.random() - 0.3) * 0.9,
        vy: -(Math.random() * 0.38 + 0.28),
        vz: (Math.random() - 0.4) * 0.8,
        swayPhase: Math.random() * Math.PI * 2
      });
    }

    leafGeo.setAttribute('position', new THREE.BufferAttribute(leafPos, 3));

    // Texture lá thu vàng cam
    const leafCanvas = createSafeCanvas(32, 32);
    leafCanvas.width = 32;
    leafCanvas.height = 32;
    const lctx = leafCanvas.getContext('2d');
    lctx.fillStyle = '#df8f32';
    lctx.beginPath();
    lctx.ellipse(16, 16, 12, 6, Math.PI / 4, 0, Math.PI * 2);
    lctx.fill();

    const leafTex = new THREE.CanvasTexture(leafCanvas);
    const leafMat = new THREE.PointsMaterial({
      size: 1.25,
      map: leafTex,
      transparent: true,
      opacity: 0.88,
      blending: THREE.NormalBlending,
      depthWrite: false
    });

    this.leafPoints = new THREE.Points(leafGeo, leafMat);
    this.leafVelocities = leafVel;
    this.scene.add(this.leafPoints);

    // 2. Bụi nắng vàng lấp lánh (90 hạt)
    const dustCount = 90;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3 + 0] = (Math.random() - 0.5) * 200;
      dustPos[i * 3 + 1] = Math.random() * 12 + 0.5;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.45,
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
   * Cập nhật chiếu sáng và vòm trời theo chu kỳ Ngày - Đêm
   */
  _updateDayNightLighting(delta) {
    if (this.dayNightMode === 'cycle') {
      const hoursPerSec = 24.0 / this.cycleDurationSec;
      this.timeOfDay = (this.timeOfDay + delta * hoursPerSec) % 24.0;
    }

    const hour = this.timeOfDay;
    const isNight = (hour < 5.5 || hour > 18.5);
    const isSunset = (hour >= 16.0 && hour <= 18.5);

    // Cập nhật pha hiện tại
    let phase = 'day';
    if (isNight) phase = 'night';
    else if (isSunset) phase = 'sunset';
    else if (hour < 7.0) phase = 'dawn';

    if (this._currentPhase !== phase) {
      this._currentPhase = phase;
      GameEventBus.emit('CORE:DAY_NIGHT_UPDATED', {
        timeOfDay: hour,
        phaseName: phase,
        isNight
      });
    }

    // Góc quỹ đạo mặt trời (mặt trời lặn lúc 18h, mọc lúc 6h)
    const sunAngle = ((hour - 6.0) / 12.0) * Math.PI;
    const sunElevation = Math.sin(sunAngle);

    if (sunElevation > 0) {
      // Mặt trời trên đường chân trời
      this.sunLight.intensity = Math.max(0.1, sunElevation * 1.85);
      this.sunLight.position.set(
        -Math.cos(sunAngle) * 180,
        Math.max(10, sunElevation * 140),
        -110
      );

      if (isSunset) {
        this.sunLight.color.setHex(0xff9438); // Vàng cam ấm hoàng hôn
        this.ambientLight.color.setHex(0x8a5e3d);
        this.ambientLight.intensity = 0.36;
        this.hemiLight.color.setHex(0xffe6c4);
        this.hemiLight.groundColor.setHex(0x5a3d24);
        if (this.scene.fog) this.scene.fog.color.setHex(0xf5d8b2);
        if (this.cloudMaterial) this.cloudMaterial.color.setHex(0xfed1a4);
      } else {
        this.sunLight.color.setHex(0xfffaea); // Sáng thu trong trẻo
        this.ambientLight.color.setHex(0x756758);
        this.ambientLight.intensity = 0.40;
        this.hemiLight.color.setHex(0xdff0ff);
        this.hemiLight.groundColor.setHex(0x6e5c46);
        if (this.scene.fog) this.scene.fog.color.setHex(0xe8f0f8);
        if (this.cloudMaterial) this.cloudMaterial.color.setHex(0xffffff);
      }
      this.moonLight.intensity = 0.0;
    } else {
      // Đêm buông xuống - Ánh trăng chiếu sáng
      this.sunLight.intensity = 0.0;
      this.moonLight.intensity = 0.58;
      this.moonLight.position.set(120, 110, 100);
      this.ambientLight.color.setHex(0x1a2438);
      this.ambientLight.intensity = 0.32;
      this.hemiLight.color.setHex(0x223555);
      this.hemiLight.groundColor.setHex(0x0e1726);
      if (this.scene.fog) this.scene.fog.color.setHex(0x101a2c);
      if (this.cloudMaterial) this.cloudMaterial.color.setHex(0x58698a);
    }

    // Tự động thắp sáng / tăng cường đèn đường và đèn lồng khi trời tối
    const nightGlow = isNight ? 1.85 : (isSunset ? 1.2 : 0.45);
    for (let i = 0; i < this.lanternLights.length; i++) {
      const item = this.lanternLights[i];
      item.light.intensity = item.baseIntensity * nightGlow;
    }

    // Vẽ lại Skybox Canvas theo chu kỳ (mỗi khi giờ đổi tối thiểu 0.15h để giữ 60 FPS)
    if (Math.abs(hour - this._lastSkyRedrawTime) >= 0.15) {
      this._lastSkyRedrawTime = hour;
      this._drawSkyGradient(hour);
    }
  }

  /**
   * Cập nhật animation các hiệu ứng trong Scene theo frame
   * @param {number} delta - Delta time
   * @param {THREE.Camera} [camera] - Camera để bám vị trí bầu trời
   */
  update(delta, camera) {
    const time = this.clock.getElapsedTime();

    // 1. Cập nhật chu kỳ Ngày - Đêm
    this._updateDayNightLighting(delta);

    // 2. Cập nhật Mây 3D trôi nhẹ theo chiều gió thu
    if (this.cloudsList && this.cloudsList.length > 0) {
      for (let i = 0; i < this.cloudsList.length; i++) {
        const c = this.cloudsList[i];
        c.group.position.x += c.speed * delta * 2.5;
        // Quấn vòng khi trôi khỏi rìa bản đồ (+230m)
        if (c.group.position.x > 240) {
          c.group.position.x = -240;
        }
      }
    }

    // 3. Cập nhật lá vàng rơi chao liệng trong gió (xen kẽ mỗi 2 frame)
    this._leafFrame = (this._leafFrame || 0) + 1;
    if (this._leafFrame % 2 === 0 && this.leafPoints && this.leafVelocities) {
      const posAttr = this.leafPoints.geometry.attributes.position;
      const positions = posAttr.array;
      const dtEffective = delta * 2.0;

      for (let i = 0; i < this.leafVelocities.length; i++) {
        const vel = this.leafVelocities[i];
        const idx = i * 3;

        positions[idx + 0] += (vel.vx + Math.sin(time * 1.5 + vel.swayPhase) * 0.4) * dtEffective * 5.0;
        positions[idx + 1] += vel.vy * dtEffective * 5.0;
        positions[idx + 2] += (vel.vz + Math.cos(time * 1.2 + vel.swayPhase) * 0.3) * dtEffective * 5.0;

        if (positions[idx + 1] <= 0.2) {
          positions[idx + 1] = Math.random() * 15 + 15;
          positions[idx + 0] = (Math.random() - 0.5) * 400;
          positions[idx + 2] = (Math.random() - 0.5) * 400;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 4. Bám tâm Skydome theo Camera
    if (this.skydome && camera && camera.position) {
      this.skydome.position.copy(camera.position);
    }
  }

  /**
   * Đặt giờ trong ngày trực tiếp (0.0 - 24.0)
   */
  setTimeOfDay(hour) {
    this.timeOfDay = Math.max(0, Math.min(24, hour));
    this._lastSkyRedrawTime = -999;
    this._updateDayNightLighting(0);
  }

  /**
   * Đặt chế độ ngày/đêm và thời lượng chu kỳ
   * @param {string} mode - 'cycle' | 'day' | 'midday' | 'sunset' | 'night' | 'dawn'
   * @param {number} [durationMinutes=24] - Thời lượng 1 chu kỳ 24h tính bằng phút
   */
  setDayNightMode(mode, durationMinutes = 24) {
    this.dayNightMode = mode;
    if (durationMinutes && durationMinutes > 0) {
      this.cycleDurationSec = durationMinutes * 60;
    }

    if (mode === 'day') {
      this.setTimeOfDay(9.5); // Sáng mùa thu Hà Nội
    } else if (mode === 'midday') {
      this.setTimeOfDay(12.0); // Trưa nắng nhẹ
    } else if (mode === 'sunset') {
      this.setTimeOfDay(17.2); // Hoàng hôn rực rỡ
    } else if (mode === 'night') {
      this.setTimeOfDay(21.5); // Đêm trăng huyền ảo
    } else if (mode === 'dawn') {
      this.setTimeOfDay(5.8); // Rạng đông
    }
  }

  /**
   * Lấy thông tin trạng thái ngày/đêm hiện tại
   */
  getDayNightInfo() {
    return {
      mode: this.dayNightMode,
      timeOfDay: this.timeOfDay,
      phaseName: this._currentPhase,
      isNight: (this.timeOfDay < 5.5 || this.timeOfDay > 18.5),
      cycleDurationSec: this.cycleDurationSec
    };
  }

  add(object) {
    this.scene.add(object);
  }

  remove(object) {
    this.scene.remove(object);
  }

  getScene() {
    return this.scene;
  }
}
