/**
 * CharacterFactory.js - BỘ TẠO MÔ HÌNH CON NGƯỜI 3D THẬT SỰ (TRUE 3D SCULPTED HUMANOID MESH)
 * Chuẩn mực Studio Quốc Tế: Hình khối điêu khắc hữu cơ (Solid Clay Sculpt Topology),
 * kết hợp vật liệu PBR (Fully Textured PBR Shading), Normal Maps và Cây Khung Xương 17 Khớp 60 FPS.
 * 
 * Dự án: HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import * as THREE from '../lib/three.module.js';

// Cache texture toàn cục tránh nạp lặp lại gây rò rỉ bộ nhớ
const textureCache = new Map();
function getCachedTexture(path) {
  if (!path || typeof document === 'undefined') return null;
  if (textureCache.has(path)) return textureCache.get(path);
  const loader = new THREE.TextureLoader();
  const tex = loader.load(path);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  textureCache.set(path, tex);
  return tex;
}

export const CHARACTERS_META = [
  {
    id: 'char_nu_sinh_ao_dai',
    legacyIds: ['char_cultural_officer', 'outfit_ao_dai'],
    name: 'Nữ Sinh Tràng An • Áo Dài Trắng Nón Lá',
    shortName: 'Cô Hương • Nữ Sinh Tràng An',
    title: 'Biểu Tượng Vẻ Đẹp Thuần Khiết Đất Thăng Long',
    role: 'Nữ sinh Tràng An am tường di tích Đền Ngọc Sơn & Cầu Thê Húc',
    desc: 'Tà áo dài trắng học trò thướt tha trong gió sớm hồ Gươm, chiếc nón lá bài thơ che nghiêng e ấp, nét thanh lịch nghìn năm.',
    avatar: 'assets/characters/avatar_char_nu_sinh_ao_dai.png',
    bodyFront: 'assets/characters/body_front_char_nu_sinh_ao_dai.png',
    bodyBack: 'assets/characters/body_back_char_nu_sinh_ao_dai.png',
    zone: 'hoan_kiem',
    monumentTitle: 'Đền Ngọc Sơn & Cầu Thê Húc "Ngưng Tụ Ánh Sáng Mặt Trời"',
    greeting: '"Chào lãng tử ghé thăm hồ Gươm! Sáng nay sương bảng lảng trên mặt hồ đẹp lắm. Để em đưa anh/chị qua Cầu Thê Húc son đỏ vào Đền Ngọc Sơn nhé!"'
  },
  {
    id: 'char_co_gai_ao_ba_ba',
    legacyIds: ['char_hanoi_elder', 'outfit_traditional_elder'],
    name: 'Cô Gái Phố Thị • Áo Bà Ba Hồng Cánh Sen Khăn Rằn',
    shortName: 'Chị Lan • Cô Gái Phố Thị',
    title: 'Thiếu Nữ Phố Hàng Tảo Tần Đôn Hậu',
    role: 'Người dẫn đường khám phá 36 Phố Phường và ngõ đường tàu Phùng Hưng',
    desc: 'Chiếc áo bà ba màu hồng cánh sen dịu dàng, khăn rằn quàng cổ mộc mạc, nón lá đeo sau lưng, nụ cười rạng rỡ đón khách phương xa.',
    avatar: 'assets/characters/avatar_char_co_gai_ao_ba_ba.png',
    bodyFront: 'assets/characters/body_front_char_co_gai_ao_ba_ba.png',
    bodyBack: 'assets/characters/body_back_char_co_gai_ao_ba_ba.png',
    zone: 'old_quarter',
    monumentTitle: '36 Phố Phường Hà Nội & Cửa Ô Quan Chưởng Cổ Kính',
    greeting: '"Chào lãng tử ghé phố cổ! Em vừa gánh gánh hoa sớm qua Ô Quan Chưởng, mời anh/chị dừng chân nhấp ngụm nước chè sen và nghe chuyện phố phường nhé!"'
  },
  {
    id: 'char_nam_tri_thuc_suit',
    legacyIds: ['char_young_explorer', 'outfit_leather_jacket'],
    name: 'Trí Thức Hiện Đại • Âu Phục Vest Navy Lịch Lãm',
    shortName: 'KTS Minh Tuấn • Trí Thức Hà Thành',
    title: 'Kiến Trúc Sư Trẻ Đam Mê Di Sản Cầu Long Biên',
    role: 'KTS nghiên cứu kết cấu thép Eiffel và quy hoạch bảo tồn sông Hồng',
    desc: 'Bộ âu phục suit xanh navy lịch lãm chỉn chu, cà vạt thanh lịch, giày da bóng lộn, phong thái trí thức hiện đại giao thoa ký ức hào hoa.',
    avatar: 'assets/characters/avatar_char_nam_tri_thuc_suit.png',
    bodyFront: 'assets/characters/body_front_char_nam_tri_thuc_suit.png',
    bodyBack: 'assets/characters/body_back_char_nam_tri_thuc_suit.png',
    zone: 'long_bien',
    monumentTitle: 'Cầu Long Biên (1898 - 1902) & Ký Ức Sông Hồng Oai Hùng',
    greeting: '"Rất vui được gặp bạn! Đứng trên nhịp cầu Eiffel thép hơn trăm năm này, ngắm nhìn sông Hồng cuộn sóng, tôi luôn thấy rung động trước kỳ quan kiến trúc vĩ đại của tiền nhân."'
  },
  {
    id: 'char_nam_ao_dai_gam',
    legacyIds: ['char_photographer', 'outfit_winter_coat'],
    name: 'Quý Nam Hà Thành • Áo Dài Gấm Xanh Quần Trắng',
    shortName: 'Bác Văn An • Nghệ Nhân Di Sản',
    title: 'Nhà Nghiên Cứu Lịch Sử & Nghệ Nhân Văn Hóa Cung Đình',
    role: 'Người lưu giữ điển tích và linh khí Tháp Rùa ngàn năm',
    desc: 'Áo dài cách tân gấm dệt hoa văn cổ ngũ thân xanh lam hoàng gia, quần âu trắng mực thước, cốt cách quý ông Tràng An lịch thiệp uyên bác.',
    avatar: 'assets/characters/avatar_char_nam_ao_dai_gam.png',
    bodyFront: 'assets/characters/body_front_char_nam_ao_dai_gam.png',
    bodyBack: 'assets/characters/body_back_char_nam_ao_dai_gam.png',
    zone: 'turtle_tower',
    monumentTitle: 'Tháp Rùa Cổ Kính (1886) • Trái Tim Hồ Hoàn Kiếm',
    greeting: '"Kính chào bạn trẻ! Lão là Văn An, sinh ra và lớn lên bên hồ Tả Vọng này. Tháp Rùa bốn mùa soi bóng, chứng kiến bao thăng trầm của kinh thành Thăng Long."'
  }
];

export function findCharacterMeta(id) {
  if (!id) return CHARACTERS_META[0];
  return CHARACTERS_META.find(c => c.id === id || (c.legacyIds && c.legacyIds.includes(id))) || CHARACTERS_META[0];
}

function createPBRMesh(geo, mat) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.visible = true; // True 3D volumetric organic mesh, full 360-degree depth
  return mesh;
}

/**
 * Tạo hình học nón lá điêu khắc hữu cơ (3D Organic Conical Nón Lá)
 */
function createSculptedNonLaMesh(materials) {
  const nonLaGroup = new THREE.Group();
  nonLaGroup.name = 'SculptedNonLa3D';

  const coneRadius = 0.28;
  const coneHeight = 0.16;

  // Chóp nón hình nón lá truyền thống Việt Nam
  const outerConeGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 36, 12, false);
  const pos = outerConeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const rRatio = (coneHeight * 0.5 - y) / coneHeight; // 0 ở đỉnh chóp, 1 ở vành
    const flare = Math.pow(rRatio, 2.0) * 0.018;
    pos.setX(i, pos.getX(i) + pos.getX(i) * flare);
    pos.setZ(i, pos.getZ(i) + pos.getZ(i) * flare);
  }
  outerConeGeo.computeVertexNormals();

  const outerCone = createPBRMesh(outerConeGeo, materials.nonLa);
  nonLaGroup.add(outerCone);

  // Chóp đỉnh nón lá bọc gỗ/chỉ khâu
  const apexGeo = new THREE.ConeGeometry(0.020, 0.028, 16);
  const apexMesh = createPBRMesh(apexGeo, materials.bambooRim);
  apexMesh.position.y = coneHeight * 0.5 + 0.008;
  nonLaGroup.add(apexMesh);

  // Vành nan tre bo tròn quanh miệng nón (Bamboo Rim Beading)
  const rimTorus = createPBRMesh(
    new THREE.TorusGeometry(coneRadius + 0.005, 0.006, 12, 36),
    materials.bambooRim
  );
  rimTorus.rotation.x = Math.PI / 2;
  rimTorus.position.y = -coneHeight * 0.5;
  nonLaGroup.add(rimTorus);

  // Quai nón lụa mềm mại rủ xuống cằm
  const strapCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.12, -0.05, 0),
    new THREE.Vector3(-0.05, -0.14, 0.02),
    new THREE.Vector3(0, -0.16, 0.025),
    new THREE.Vector3(0.05, -0.14, 0.02),
    new THREE.Vector3(0.12, -0.05, 0)
  ]);
  const strapGeo = new THREE.TubeGeometry(strapCurve, 20, 0.005, 8, false);
  const strapMesh = createPBRMesh(strapGeo, materials.silkStrap);
  nonLaGroup.add(strapMesh);

  return nonLaGroup;
}

/**
 * Tạo thân người điêu khắc hữu cơ (Sculpted Organic Torso Geometry)
 * Thon thả, nhân trắc học Á Đông
 */
function createSculptedTorsoGeometry(isFemale, isSuit) {
  const height = 0.36;
  const segmentsY = 16;
  const segmentsRadial = 24;

  const topR = isFemale ? 0.105 : (isSuit ? 0.15 : 0.13);
  const botR = isFemale ? 0.115 : (isSuit ? 0.135 : 0.125);
  
  const geo = new THREE.CylinderGeometry(topR, botR, height, segmentsRadial, segmentsY, false);
  const pos = geo.attributes.position;
  
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const normY = (y + height / 2) / height; // 0 ở dưới (hông), 1 ở trên (ngực)
    let rx = 1.0;
    let rz = 0.82; // Dẹp elip người thật

    if (isFemale) {
      if (normY < 0.32) {
        // Hông nở nhẹ
        rx = 1.04 + (0.32 - normY) * 0.22;
        rz = 0.85;
      } else if (normY >= 0.32 && normY < 0.65) {
        // Thắt eo con kiến
        const wRatio = 1.0 - Math.sin((normY - 0.32) / 0.33 * Math.PI) * 0.25;
        rx = 0.88 * wRatio;
        rz = 0.72 * wRatio;
      } else {
        // Ngực nở mềm mại
        const chestRatio = Math.sin((normY - 0.65) / 0.35 * Math.PI);
        rx = 0.98 + chestRatio * 0.08;
        rz = 0.78 + (pos.getZ(i) > 0 ? chestRatio * 0.26 : 0);
      }
    } else {
      rx = 0.92 + normY * 0.32;
      rz = 0.78 + normY * 0.16;
      if (isSuit) {
        rx *= 1.08;
        rz *= 1.04;
      }
    }

    pos.setX(i, pos.getX(i) * rx);
    pos.setZ(i, pos.getZ(i) * rz);
  }

  geo.computeVertexNormals();
  return geo;
}

function createSculptedHand(skinMat, isLeft) {
  const handGroup = new THREE.Group();
  const palmGeo = new THREE.CylinderGeometry(0.026, 0.020, 0.055, 12);
  const palm = createPBRMesh(palmGeo, skinMat);
  palm.scale.set(1.0, 1.0, 0.55);
  palm.position.set(0, -0.028, 0);
  handGroup.add(palm);

  const thumbGeo = new THREE.CylinderGeometry(0.007, 0.005, 0.028, 8);
  const thumb = createPBRMesh(thumbGeo, skinMat);
  const thumbSign = isLeft ? 1 : -1;
  thumb.position.set(thumbSign * 0.018, -0.022, 0.01);
  thumb.rotation.z = thumbSign * 0.45;
  handGroup.add(thumb);

  const fingersGeo = new THREE.CylinderGeometry(0.016, 0.010, 0.032, 10);
  const fingers = createPBRMesh(fingersGeo, skinMat);
  fingers.scale.set(1.0, 1.0, 0.5);
  fingers.position.set(0, -0.062, 0);
  handGroup.add(fingers);

  return handGroup;
}

function createSculptedShoe(shoeMat, isFemale, isSuit) {
  const shoeGroup = new THREE.Group();
  const len = isSuit ? 0.22 : 0.175;
  const w = isSuit ? 0.082 : 0.070;
  const h = 0.045;

  const shoeGeo = new THREE.CylinderGeometry(w * 0.5, w * 0.54, len, 16);
  shoeGeo.rotateX(Math.PI / 2);
  const pos = shoeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const y = pos.getY(i);
    if (z > 0) {
      const taper = 1.0 - (z / (len * 0.5)) * 0.35;
      pos.setX(i, pos.getX(i) * taper);
    }
    if (y < -h * 0.35) {
      pos.setY(i, -h * 0.35);
    }
  }
  shoeGeo.computeVertexNormals();

  const shoeMesh = createPBRMesh(shoeGeo, shoeMat);
  shoeMesh.scale.set(1.0, 0.65, 1.0);
  shoeMesh.position.set(0, 0.022, 0.03);
  shoeGroup.add(shoeMesh);

  return shoeGroup;
}

/**
 * TẠO MÔ HÌNH CON NGƯỜI 3D THẬT SỰ (TRUE 3D SCULPTED HUMANOID MESH)
 */
export function createHanoiCharacter3D(characterId, options = {}) {
  const meta = findCharacterMeta(characterId);
  const charId = meta.id;
  const isFemale = (charId === 'char_nu_sinh_ao_dai' || charId === 'char_co_gai_ao_ba_ba');
  const isSuit = (charId === 'char_nam_tri_thuc_suit');

  const characterGroup = new THREE.Group();
  characterGroup.name = `HanoiCharacter_${charId}`;

  // ==========================================
  // 1. VẬT LIỆU PBR CHÂN THỰC VỚI TEXTURE MAPS & NORMAL MAPS
  // ==========================================
  const skinDiffuse = getCachedTexture('assets/textures/char_cotton_pink_lotus.jpg');
  const skinMat = new THREE.MeshStandardMaterial({
    color: isFemale ? 0xf7d3bd : 0xedd0bb,
    roughness: 0.48,
    metalness: 0.04
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x141212,
    roughness: 0.65,
    metalness: 0.15
  });

  // Tải vật liệu PBR may đo cao cấp cho từng nhân vật
  let clothTorsoMat, clothLimbMat, clothPantsMat, shoeMat, accessoryMaterials = {};

  if (charId === 'char_nu_sinh_ao_dai') {
    // Nữ sinh Tràng An: Vải lụa tơ tằm trắng ngà mềm mượt
    const silkTex = getCachedTexture('assets/textures/char_silk_ivory_white.jpg');
    const silkNorm = getCachedTexture('assets/textures/char_silk_ivory_white_norm.jpg');
    if (silkTex) silkTex.repeat.set(2, 4);

    clothTorsoMat = new THREE.MeshStandardMaterial({
      map: silkTex,
      normalMap: silkNorm,
      normalScale: new THREE.Vector2(0.65, 0.65),
      color: 0xfcfdfd,
      roughness: 0.32,
      metalness: 0.05
    });
    clothLimbMat = clothTorsoMat;
    clothPantsMat = new THREE.MeshStandardMaterial({
      map: silkTex,
      normalMap: silkNorm,
      color: 0xf2f2f7,
      roughness: 0.42
    });
    shoeMat = new THREE.MeshStandardMaterial({ color: 0x7c4522, roughness: 0.6 });

    // Nón lá trúc chỉ vàng óng
    const bambooTex = getCachedTexture('assets/textures/char_bamboo_non_la.jpg');
    const bambooNorm = getCachedTexture('assets/textures/char_bamboo_non_la_norm.jpg');
    if (bambooTex) bambooTex.repeat.set(3, 3);

    accessoryMaterials.nonLa = new THREE.MeshStandardMaterial({
      map: bambooTex,
      normalMap: bambooNorm,
      color: 0xf2e0b8,
      roughness: 0.68
    });
    accessoryMaterials.nonLaInner = new THREE.MeshStandardMaterial({
      map: bambooTex,
      color: 0xd9c298,
      roughness: 0.8
    });
    accessoryMaterials.bambooRim = new THREE.MeshStandardMaterial({ color: 0xb5955a, roughness: 0.5 });
    accessoryMaterials.silkStrap = new THREE.MeshStandardMaterial({ color: 0xde6f8c, roughness: 0.35 });

  } else if (charId === 'char_co_gai_ao_ba_ba') {
    // Cô gái phố thị: Áo bà ba hồng sen & Khăn rằn caro
    const lotusTex = getCachedTexture('assets/textures/char_cotton_pink_lotus.jpg');
    const lotusNorm = getCachedTexture('assets/textures/char_cotton_pink_lotus_norm.jpg');
    if (lotusTex) lotusTex.repeat.set(3, 3);

    clothTorsoMat = new THREE.MeshStandardMaterial({
      map: lotusTex,
      normalMap: lotusNorm,
      normalScale: new THREE.Vector2(0.7, 0.7),
      color: 0xdf648a,
      roughness: 0.58
    });
    clothLimbMat = clothTorsoMat;
    clothPantsMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.55 });
    shoeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });

    const kramaTex = getCachedTexture('assets/textures/char_scarf_caro_krama.jpg');
    const kramaNorm = getCachedTexture('assets/textures/char_scarf_caro_krama_norm.jpg');
    accessoryMaterials.krama = new THREE.MeshStandardMaterial({
      map: kramaTex,
      normalMap: kramaNorm,
      roughness: 0.72
    });

  } else if (charId === 'char_nam_tri_thuc_suit') {
    // Trí thức hiện đại: Vải len dệt chìm xanh navy & giày tây Oxford da bóng
    const woolTex = getCachedTexture('assets/textures/char_wool_navy_suit.jpg');
    const woolNorm = getCachedTexture('assets/textures/char_wool_navy_suit_norm.jpg');
    if (woolTex) woolTex.repeat.set(4, 4);

    clothTorsoMat = new THREE.MeshStandardMaterial({
      map: woolTex,
      normalMap: woolNorm,
      normalScale: new THREE.Vector2(0.8, 0.8),
      color: 0x1a2842,
      roughness: 0.52
    });
    clothLimbMat = clothTorsoMat;
    clothPantsMat = clothTorsoMat;

    const leatherTex = getCachedTexture('assets/textures/char_leather_shoes_black.jpg');
    const leatherNorm = getCachedTexture('assets/textures/char_leather_shoes_black_norm.jpg');
    shoeMat = new THREE.MeshStandardMaterial({
      map: leatherTex,
      normalMap: leatherNorm,
      color: 0x111111,
      roughness: 0.22,
      metalness: 0.28
    });

    const tieTex = getCachedTexture('assets/textures/char_silk_tie_vintage.jpg');
    accessoryMaterials.tie = new THREE.MeshStandardMaterial({
      map: tieTex,
      color: 0x8a1c2c,
      roughness: 0.38,
      metalness: 0.1
    });

  } else {
    // Quý nam Hà thành: Gấm dệt hoa văn cổ ngũ thân xanh sapphire
    const brocadeTex = getCachedTexture('assets/textures/char_silk_blue_brocade.jpg');
    const brocadeNorm = getCachedTexture('assets/textures/char_silk_blue_brocade_norm.jpg');
    if (brocadeTex) brocadeTex.repeat.set(2, 3);

    clothTorsoMat = new THREE.MeshStandardMaterial({
      map: brocadeTex,
      normalMap: brocadeNorm,
      normalScale: new THREE.Vector2(0.85, 0.85),
      color: 0x193766,
      roughness: 0.36,
      metalness: 0.16
    });
    clothLimbMat = clothTorsoMat;
    clothPantsMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.45 });
    shoeMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.4 });
    accessoryMaterials.jade = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.18, metalness: 0.2 });
    accessoryMaterials.turban = new THREE.MeshStandardMaterial({
      map: brocadeTex,
      color: 0x142036,
      roughness: 0.55
    });
  }

  // ==========================================
  // 2. KHỞI TẠO CÂY KHUNG XƯƠNG PHÂN CẤP 17 KHỚP CHUẨN GIẢI PHẪU
  // ==========================================
  const baseTorsoY = 0.95;

  // 2.1. Đĩa bóng tiếp xúc mặt đất chân thực (Shadow Blob)
  const shadowGeo = new THREE.CircleGeometry(0.38, 32);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.48,
    depthWrite: false
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.015;
  characterGroup.add(shadowMesh);

  // 2.2. Khung chậu (Pelvis Group) tại cao độ y = 0.95m
  const pelvisGroup = new THREE.Group();
  pelvisGroup.name = 'Joint_Pelvis';
  pelvisGroup.position.set(0, baseTorsoY, 0);
  characterGroup.add(pelvisGroup);

  const pelvisMesh = createPBRMesh(
    new THREE.CylinderGeometry(isFemale ? 0.088 : 0.115, isFemale ? 0.098 : 0.122, 0.12, 24),
    clothPantsMat
  );
  pelvisMesh.position.set(0, -0.04, 0);
  pelvisGroup.add(pelvisMesh);

  // 2.3. Thân mình điêu khắc hữu cơ (Torso Group)
  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'Joint_Torso';
  torsoGroup.position.set(0, 0, 0);
  pelvisGroup.add(torsoGroup);

  // Thân áo 3D hữu cơ
  const torsoGeo = createSculptedTorsoGeometry(isFemale, isSuit);
  const torsoMesh = createPBRMesh(torsoGeo, clothTorsoMat);
  torsoMesh.position.set(0, 0.17, 0);
  torsoGroup.add(torsoMesh);

  // Tà áo dài 3D trước & sau (Front Flap & Back Flap)
  const clothingGroup = new THREE.Group();
  clothingGroup.name = 'ClothingGroup';
  torsoGroup.add(clothingGroup);

  const frontFlapGroup = new THREE.Group();
  frontFlapGroup.name = 'Joint_FrontFlap';
  frontFlapGroup.position.set(0, -0.16, 0.08);
  clothingGroup.add(frontFlapGroup);

  const backFlapGroup = new THREE.Group();
  backFlapGroup.name = 'Joint_BackFlap';
  backFlapGroup.position.set(0, -0.16, -0.08);
  clothingGroup.add(backFlapGroup);

  if (charId === 'char_nu_sinh_ao_dai' || charId === 'char_nam_ao_dai_gam') {
    const flapWidthTop = isFemale ? 0.25 : 0.28;
    const flapLen = charId === 'char_nu_sinh_ao_dai' ? 0.72 : 0.76;

    // Tà trước 3D uốn cong tự nhiên có nếp lụa
    const frontFlapGeo = new THREE.PlaneGeometry(flapWidthTop, flapLen, 12, 24);
    const pAttr = frontFlapGeo.attributes.position;
    for (let i = 0; i < pAttr.count; i++) {
      const yVal = pAttr.getY(i);
      const ratio = (yVal + flapLen / 2) / flapLen; // 0 ở dưới, 1 ở trên
      const xVal = pAttr.getX(i);
      const flare = 1.0 + (1.0 - ratio) * 0.32;
      pAttr.setX(i, xVal * flare);
      const ripple = Math.sin(xVal * 24.0) * 0.005 * (1.0 - ratio * 0.4);
      pAttr.setZ(i, Math.sin(ratio * Math.PI) * 0.020 + ripple);
    }
    frontFlapGeo.computeVertexNormals();

    const flapMat = new THREE.MeshStandardMaterial({
      map: clothTorsoMat.map,
      normalMap: clothTorsoMat.normalMap,
      color: clothTorsoMat.color,
      roughness: clothTorsoMat.roughness,
      metalness: clothTorsoMat.metalness,
      side: THREE.DoubleSide
    });

    const frontFlapMesh = createPBRMesh(frontFlapGeo, flapMat);
    frontFlapMesh.position.set(0, -flapLen / 2, 0.012);
    frontFlapGroup.add(frontFlapMesh);

    const backFlapGeo = frontFlapGeo.clone();
    const backFlapMesh = createPBRMesh(backFlapGeo, flapMat);
    backFlapMesh.position.set(0, -flapLen / 2, -0.012);
    backFlapGroup.add(backFlapMesh);

  } else if (charId === 'char_co_gai_ao_ba_ba') {
    // Vạt áo bà ba xẻ tà hai bên hông
    const flapGeo = new THREE.PlaneGeometry(0.28, 0.26, 6, 8);
    const flapMat = new THREE.MeshStandardMaterial({
      map: clothTorsoMat.map,
      normalMap: clothTorsoMat.normalMap,
      color: clothTorsoMat.color,
      roughness: clothTorsoMat.roughness,
      side: THREE.DoubleSide
    });
    const fMesh = createPBRMesh(flapGeo, flapMat);
    fMesh.position.set(0, -0.13, 0.01);
    frontFlapGroup.add(fMesh);

    const bMesh = createPBRMesh(flapGeo.clone(), flapMat);
    bMesh.position.set(0, -0.13, -0.01);
    backFlapGroup.add(bMesh);

  } else if (isSuit) {
    // Vạt áo vest xòe nhẹ phía sau
    const flapGeo = new THREE.PlaneGeometry(0.34, 0.28, 6, 8);
    const flapMat = new THREE.MeshStandardMaterial({
      map: clothTorsoMat.map,
      normalMap: clothTorsoMat.normalMap,
      color: clothTorsoMat.color,
      roughness: clothTorsoMat.roughness,
      side: THREE.DoubleSide
    });
    const bMesh = createPBRMesh(flapGeo, flapMat);
    bMesh.position.set(0, -0.14, -0.01);
    backFlapGroup.add(bMesh);
  }

  // 2.4. Ngực & Thân trên (Chest Group)
  const chestGroup = new THREE.Group();
  chestGroup.name = 'Joint_Chest';
  chestGroup.position.set(0, 0.16, 0);
  torsoGroup.add(chestGroup);

  // Chi tiết đặc sắc vùng ngực:
  if (charId === 'char_nu_sinh_ao_dai') {
    // Cổ áo dài 3 phân thanh thoát
    const aoDaiCollar = createPBRMesh(
      new THREE.CylinderGeometry(0.044, 0.048, 0.040, 24),
      clothTorsoMat
    );
    aoDaiCollar.position.set(0, 0.065, 0);
    chestGroup.add(aoDaiCollar);

  } else if (isSuit) {
    // Áo sơ mi trắng bên trong
    const shirtMesh = createPBRMesh(
      new THREE.BoxGeometry(0.11, 0.16, 0.035),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38 })
    );
    shirtMesh.position.set(0, 0.07, 0.075);
    chestGroup.add(shirtMesh);

    // Cà vạt vintage 3D
    const tieMesh = createPBRMesh(
      new THREE.BoxGeometry(0.038, 0.16, 0.018),
      accessoryMaterials.tie
    );
    tieMesh.position.set(0, 0.05, 0.095);
    chestGroup.add(tieMesh);

    // Ve áo Notch Lapel chữ V dựng nổi 3D
    const lapelGeo = new THREE.BoxGeometry(0.042, 0.15, 0.020);
    const leftLapel = createPBRMesh(lapelGeo, clothTorsoMat);
    leftLapel.position.set(-0.072, 0.07, 0.090);
    leftLapel.rotation.z = -0.24;
    chestGroup.add(leftLapel);

    const rightLapel = createPBRMesh(lapelGeo, clothTorsoMat);
    rightLapel.position.set(0.072, 0.07, 0.090);
    rightLapel.rotation.z = 0.24;
    chestGroup.add(rightLapel);

  } else if (charId === 'char_nam_ao_dai_gam') {
    // Cổ đứng cao truyền thống & 5 Khuy ngọc bích
    const collar = createPBRMesh(
      new THREE.CylinderGeometry(0.052, 0.058, 0.045, 24),
      clothTorsoMat
    );
    collar.position.set(0, 0.065, 0);
    chestGroup.add(collar);

    for (let k = 0; k < 5; k++) {
      const jadeBtn = createPBRMesh(new THREE.SphereGeometry(0.010, 12, 12), accessoryMaterials.jade);
      jadeBtn.position.set(0.032 + k * 0.014, 0.06 - k * 0.026, 0.088);
      chestGroup.add(jadeBtn);
    }

  } else if (charId === 'char_co_gai_ao_ba_ba') {
    // Khăn rằn caro quấn quanh cổ
    const scarfRing = createPBRMesh(
      new THREE.TorusGeometry(0.072, 0.018, 12, 24),
      accessoryMaterials.krama
    );
    scarfRing.rotation.x = Math.PI / 2;
    scarfRing.position.set(0, 0.065, 0);
    chestGroup.add(scarfRing);

    // Dải khăn rủ trước ngực
    const scarfDropL = createPBRMesh(new THREE.BoxGeometry(0.042, 0.20, 0.014), accessoryMaterials.krama);
    scarfDropL.position.set(-0.048, -0.02, 0.088);
    scarfDropL.rotation.z = -0.15;
    chestGroup.add(scarfDropL);

    const scarfDropR = createPBRMesh(new THREE.BoxGeometry(0.042, 0.20, 0.014), accessoryMaterials.krama);
    scarfDropR.position.set(0.048, -0.02, 0.088);
    scarfDropR.rotation.z = 0.15;
    chestGroup.add(scarfDropR);

    // Nón lá sau lưng mộc mạc phố thị
    const nonLaBack = createSculptedNonLaMesh(accessoryMaterials);
    nonLaBack.position.set(0, 0.02, -0.15);
    nonLaBack.rotation.x = 0.55;
    nonLaBack.scale.set(0.85, 0.85, 0.85);
    chestGroup.add(nonLaBack);
  }

  // 2.5. Cổ 3D (Neck Group)
  const neckGroup = new THREE.Group();
  neckGroup.name = 'Joint_Neck';
  neckGroup.position.set(0, 0.08, 0);
  chestGroup.add(neckGroup);

  const neckMesh = createPBRMesh(
    new THREE.CylinderGeometry(0.036, 0.044, 0.07, 20),
    skinMat
  );
  neckMesh.position.set(0, 0.035, 0);
  neckGroup.add(neckMesh);

  // 2.6. Đầu & Khuôn mặt 3D Điêu Khắc (Head Group)
  const headGroup = new THREE.Group();
  headGroup.name = 'Joint_Head';
  headGroup.position.set(0, 0.07, 0);
  neckGroup.add(headGroup);

  // Khuôn mặt 3D điêu khắc hữu cơ (Asian Face Topology)
  const headGeo = new THREE.SphereGeometry(0.095, 28, 24);
  const hPos = headGeo.attributes.position;
  for (let i = 0; i < hPos.count; i++) {
    const x = hPos.getX(i);
    const y = hPos.getY(i);
    const z = hPos.getZ(i);

    // Cằm thon V-line Á Đông
    if (y < -0.03) {
      const chinRatio = (-0.03 - y) / 0.065;
      hPos.setX(i, x * (1.0 - chinRatio * 0.35));
      if (z > 0) hPos.setZ(i, z + chinRatio * 0.018);
    }
    // Gò má và sống mũi phía trước
    if (z > 0.06 && y > -0.02 && y < 0.04) {
      if (Math.abs(x) < 0.016) {
        hPos.setZ(i, z + 0.020);
      }
    }
  }
  headGeo.computeVertexNormals();

  const headMesh = createPBRMesh(headGeo, skinMat);
  headMesh.scale.set(0.95, 1.08, 0.98);
  headMesh.position.set(0, 0.065, 0);
  headGroup.add(headMesh);

  // Texture khuôn mặt có hồn (Photorealistic Asian Face Mesh)
  const faceTex = getCachedTexture(`assets/characters/face_${charId}.png`);
  if (faceTex) {
    const faceGeo = new THREE.PlaneGeometry(0.125, 0.145, 6, 6);
    const fPos = faceGeo.attributes.position;
    for (let i = 0; i < fPos.count; i++) {
      const fx = fPos.getX(i);
      fPos.setZ(i, -fx * fx * 1.35);
    }
    faceGeo.computeVertexNormals();

    const faceMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      transparent: true,
      roughness: 0.45,
      metalness: 0.02,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const faceMesh = createPBRMesh(faceGeo, faceMat);
    faceMesh.position.set(0, 0.070, 0.088);
    headGroup.add(faceMesh);
  }

  // Tóc 3D điêu khắc (ôm gọn nửa đầu phía sau và đỉnh đầu, không che mặt)
  const hairGeo = new THREE.SphereGeometry(0.096, 24, 20);
  const hairMesh = createPBRMesh(hairGeo, hairMat);
  hairMesh.scale.set(0.96, 1.04, 0.95);
  hairMesh.position.set(0, 0.075, -0.024);
  headGroup.add(hairMesh);

  if (charId === 'char_nu_sinh_ao_dai') {
    // Mái tóc đen dài suôn mượt buông xõa sau lưng
    const longHairCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.06, -0.09),
      new THREE.Vector3(0, -0.10, -0.11),
      new THREE.Vector3(0, -0.26, -0.10),
      new THREE.Vector3(0, -0.42, -0.08)
    ]);
    const longHairGeo = new THREE.TubeGeometry(longHairCurve, 16, 0.052, 12, false);
    const longHairMesh = createPBRMesh(longHairGeo, hairMat);
    headGroup.add(longHairMesh);
  }

  // Nhóm phụ kiện đầu (Accessory Head Group)
  const accessoryHeadGroup = new THREE.Group();
  accessoryHeadGroup.name = 'AccessoryHeadGroup';
  headGroup.add(accessoryHeadGroup);

  if (charId === 'char_nu_sinh_ao_dai') {
    // Nón lá 3D bài thơ đội đầu e ấp
    const nonLa = createSculptedNonLaMesh(accessoryMaterials);
    nonLa.position.set(0, 0.165, 0.012);
    nonLa.rotation.x = -0.06; // Nghiêng nhẹ duyên dáng
    accessoryHeadGroup.add(nonLa);

  } else if (charId === 'char_nam_ao_dai_gam') {
    // Khăn xếp truyền thống 3D (Khăn đóng quấn nhiều nếp)
    const turbanGeo = new THREE.CylinderGeometry(0.108, 0.110, 0.070, 24);
    const turbanMesh = createPBRMesh(turbanGeo, accessoryMaterials.turban);
    turbanMesh.position.set(0, 0.13, -0.005);
    accessoryHeadGroup.add(turbanMesh);

  } else if (charId === 'char_nam_tri_thuc_suit') {
    // Kính mắt trí thức gọng kim loại 3D
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
    const lensL = createPBRMesh(new THREE.TorusGeometry(0.018, 0.003, 8, 16), glassMat);
    lensL.position.set(-0.036, 0.075, 0.098);
    accessoryHeadGroup.add(lensL);

    const lensR = createPBRMesh(new THREE.TorusGeometry(0.018, 0.003, 8, 16), glassMat);
    lensR.position.set(0.036, 0.075, 0.098);
    accessoryHeadGroup.add(lensR);

    const bridge = createPBRMesh(new THREE.BoxGeometry(0.016, 0.002, 0.002), glassMat);
    bridge.position.set(0, 0.075, 0.100);
    accessoryHeadGroup.add(bridge);
  }

  // ==========================================
  // 3. KHỚP VAI & TAY 3D (SHOULDERS, ARMS, HANDS)
  // ==========================================
  const shoulderY = 0.03;
  const shoulderX = isSuit ? 0.18 : 0.145;

  // 3.1. Tay Trái (Left Arm)
  const leftShoulderGroup = new THREE.Group();
  leftShoulderGroup.name = 'Joint_L_Shoulder';
  leftShoulderGroup.position.set(-shoulderX, shoulderY, 0);
  chestGroup.add(leftShoulderGroup);

  // Ụ vai tròn
  const leftDeltoid = createPBRMesh(new THREE.SphereGeometry(0.036, 16, 16), clothLimbMat);
  leftShoulderGroup.add(leftDeltoid);

  // Bắp tay Group & Mesh
  const leftUpperArm = new THREE.Group();
  leftUpperArm.name = 'Joint_L_UpperArm';
  leftShoulderGroup.add(leftUpperArm);

  const armTopR = isFemale ? 0.028 : (isSuit ? 0.038 : 0.034);
  const armBotR = isFemale ? 0.024 : (isSuit ? 0.032 : 0.028);

  const leftUpperArmMesh = createPBRMesh(
    new THREE.CylinderGeometry(armTopR, armBotR, 0.22, 16),
    clothLimbMat
  );
  leftUpperArmMesh.position.set(0, -0.11, 0);
  leftUpperArm.add(leftUpperArmMesh);

  // Khuỷu tay trái
  const leftElbowGroup = new THREE.Group();
  leftElbowGroup.name = 'Joint_L_Elbow';
  leftElbowGroup.position.set(0, -0.22, 0);
  leftUpperArm.add(leftElbowGroup);

  // Cẳng tay
  const leftLowerArm = createPBRMesh(
    new THREE.CylinderGeometry(armBotR, armBotR * 0.9, 0.20, 16),
    clothLimbMat
  );
  leftLowerArm.position.set(0, -0.10, 0);
  leftElbowGroup.add(leftLowerArm);

  // Bàn tay trái
  const leftHandGroup = new THREE.Group();
  leftHandGroup.name = 'Joint_L_Hand';
  leftHandGroup.position.set(0, -0.20, 0);
  leftElbowGroup.add(leftHandGroup);

  const leftHandMesh = createSculptedHand(skinMat, true);
  leftHandGroup.add(leftHandMesh);

  // 3.2. Tay Phải (Right Arm)
  const rightShoulderGroup = new THREE.Group();
  rightShoulderGroup.name = 'Joint_R_Shoulder';
  rightShoulderGroup.position.set(shoulderX, shoulderY, 0);
  chestGroup.add(rightShoulderGroup);

  const rightDeltoid = createPBRMesh(new THREE.SphereGeometry(0.036, 16, 16), clothLimbMat);
  rightShoulderGroup.add(rightDeltoid);

  const rightUpperArm = new THREE.Group();
  rightUpperArm.name = 'Joint_R_UpperArm';
  rightShoulderGroup.add(rightUpperArm);

  const rightUpperArmMesh = createPBRMesh(
    new THREE.CylinderGeometry(armTopR, armBotR, 0.22, 16),
    clothLimbMat
  );
  rightUpperArmMesh.position.set(0, -0.11, 0);
  rightUpperArm.add(rightUpperArmMesh);

  const rightElbowGroup = new THREE.Group();
  rightElbowGroup.name = 'Joint_R_Elbow';
  rightElbowGroup.position.set(0, -0.22, 0);
  rightUpperArm.add(rightElbowGroup);

  const rightLowerArm = createPBRMesh(
    new THREE.CylinderGeometry(armBotR, armBotR * 0.9, 0.20, 16),
    clothLimbMat
  );
  rightLowerArm.position.set(0, -0.10, 0);
  rightElbowGroup.add(rightLowerArm);

  const rightHandGroup = new THREE.Group();
  rightHandGroup.name = 'Joint_R_Hand';
  rightHandGroup.position.set(0, -0.20, 0);
  rightElbowGroup.add(rightHandGroup);

  const rightHandMesh = createSculptedHand(skinMat, false);
  rightHandGroup.add(rightHandMesh);

  // ==========================================
  // 4. KHỚP HÁNG & CHÂN 3D (HIPS, LEGS, FEET)
  // ==========================================
  const hipX = isFemale ? 0.078 : 0.095;
  const legRadiusTop = isFemale ? 0.052 : 0.062;
  const legRadiusBottom = isFemale ? 0.044 : 0.052;

  // 4.1. Chân Trái (Left Leg)
  const leftHipGroup = new THREE.Group();
  leftHipGroup.name = 'Joint_L_Hip';
  leftHipGroup.position.set(-hipX, -0.06, 0);
  pelvisGroup.add(leftHipGroup);

  const leftUpperLeg = new THREE.Group();
  leftUpperLeg.name = 'Joint_L_UpperLeg';
  leftHipGroup.add(leftUpperLeg);

  const leftUpperLegMesh = createPBRMesh(
    new THREE.CylinderGeometry(legRadiusTop, legRadiusBottom, 0.42, 20),
    clothPantsMat
  );
  leftUpperLegMesh.position.set(0, -0.21, 0);
  leftUpperLeg.add(leftUpperLegMesh);

  // Khớp gối trái
  const leftKneeGroup = new THREE.Group();
  leftKneeGroup.name = 'Joint_L_Knee';
  leftKneeGroup.position.set(0, -0.42, 0);
  leftUpperLeg.add(leftKneeGroup);

  // Cẳng chân trái
  const leftLowerLeg = createPBRMesh(
    new THREE.CylinderGeometry(legRadiusBottom, legRadiusBottom + 0.010, 0.42, 20),
    clothPantsMat
  );
  leftLowerLeg.position.set(0, -0.21, 0);
  leftKneeGroup.add(leftLowerLeg);

  // Bàn chân / Giày trái
  const leftFootGroup = new THREE.Group();
  leftFootGroup.name = 'Joint_L_Foot';
  leftFootGroup.position.set(0, -0.42, 0);
  leftKneeGroup.add(leftFootGroup);

  const leftShoeMesh = createSculptedShoe(shoeMat, isFemale, isSuit);
  leftFootGroup.add(leftShoeMesh);

  // 4.2. Chân Phải (Right Leg)
  const rightHipGroup = new THREE.Group();
  rightHipGroup.name = 'Joint_R_Hip';
  rightHipGroup.position.set(hipX, -0.06, 0);
  pelvisGroup.add(rightHipGroup);

  const rightUpperLeg = new THREE.Group();
  rightUpperLeg.name = 'Joint_R_UpperLeg';
  rightHipGroup.add(rightUpperLeg);

  const rightUpperLegMesh = createPBRMesh(
    new THREE.CylinderGeometry(legRadiusTop, legRadiusBottom, 0.42, 20),
    clothPantsMat
  );
  rightUpperLegMesh.position.set(0, -0.21, 0);
  rightUpperLeg.add(rightUpperLegMesh);

  const rightKneeGroup = new THREE.Group();
  rightKneeGroup.name = 'Joint_R_Knee';
  rightKneeGroup.position.set(0, -0.42, 0);
  rightUpperLeg.add(rightKneeGroup);

  const rightLowerLeg = createPBRMesh(
    new THREE.CylinderGeometry(legRadiusBottom, legRadiusBottom + 0.010, 0.42, 20),
    clothPantsMat
  );
  rightLowerLeg.position.set(0, -0.21, 0);
  rightKneeGroup.add(rightLowerLeg);

  const rightFootGroup = new THREE.Group();
  rightFootGroup.name = 'Joint_R_Foot';
  rightFootGroup.position.set(0, -0.42, 0);
  rightKneeGroup.add(rightFootGroup);

  const rightShoeMesh = createSculptedShoe(shoeMat, isFemale, isSuit);
  rightFootGroup.add(rightShoeMesh);

  // ==========================================
  // 5. GẮN CÂY KHUNG XƯƠNG .rig CHO ANIMATION MASTER
  // ==========================================
  characterGroup.rig = {
    rootGroup: characterGroup,
    pelvisGroup,
    torsoGroup,
    chestGroup,
    neckGroup,
    headGroup,
    accessoryHeadGroup,
    leftShoulderGroup,
    rightShoulderGroup,
    leftUpperArm,
    rightUpperArm,
    leftElbowGroup,
    rightElbowGroup,
    leftLowerArm,
    rightLowerArm,
    leftHandGroup,
    rightHandGroup,
    leftHipGroup,
    rightHipGroup,
    leftUpperLeg,
    rightUpperLeg,
    leftKneeGroup,
    rightKneeGroup,
    leftLowerLeg,
    rightLowerLeg,
    leftFootGroup,
    rightFootGroup,
    frontFlapGroup,
    backFlapGroup
  };

  characterGroup.baseTorsoY = baseTorsoY;
  characterGroup.characterMeta = meta;

  return characterGroup;
}
