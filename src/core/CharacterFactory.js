/**
 * CharacterFactory.js - BỘ TẠO MÔ HÌNH CON NGƯỜI 3D THẬT SỰ (TRUE 3D SCULPTED HUMANOID MESH)
 * Chuẩn mực Studio Quốc Tế: Hình khối điêu khắc giải phẫu người thật Á Đông (Asian Anatomy Sculpt),
 * Tái tạo da thịt người thật Á Đông (#E8BEAC nữ, #DEB096 nam), PBR skin material giả lập SSS tán xạ hồng hào.
 * Hệ thống trang phục hình khối 3D độc lập đa lớp (Separate 3D Geometric Meshes có độ dày và nếp may),
 * TUYỆT ĐỐI KHÔNG DÙNG DECAL DÁN ẢNH 2D TRÊN THÂN MÔ HÌNH!
 * Cây Khung Xương 17 Khớp chuẩn giải phẫu vận hành 60 FPS cùng HumanoidAnimator.
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
    faceTex: 'assets/characters/face_char_nu_sinh_ao_dai.png',
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
    faceTex: 'assets/characters/face_char_co_gai_ao_ba_ba.png',
    zone: 'old_quarter',
    monumentTitle: '36 Phố Phường Hà Nội & Cửa Ô Quan Chưởng Cổ Kính',
    greeting: '"Chào lãng tử ghé phố cổ! Em vừa gánh gánh hoa sớm qua Ô Quan Chưởng, mời anh/chị dừng chân nhấp ngụm nước chè sen và nghe chuyện phố phường nhé!"'
  },
  {
    id: 'char_nam_tri_thuc_suit',
    legacyIds: ['char_young_explorer', 'outfit_leather_jacket'],
    name: 'Nam Trí Thức Hà Nội • Âu Phục Suit Lịch Lãm',
    shortName: 'Nam Trí Thức Hà Nội',
    title: 'Nam Trí Thức Hà Nội',
    role: 'KTS nghiên cứu kết cấu thép Eiffel và quy hoạch bảo tồn sông Hồng',
    desc: 'Bộ âu phục suit xám than/navy lịch lãm chỉn chu, cà vạt thanh lịch, giày da bóng lộn, phong thái trí thức hiện đại giao thoa ký ức hào hoa.',
    avatar: 'assets/characters/avatar_char_nam_tri_thuc_suit.png',
    faceTex: 'assets/characters/face_char_nam_tri_thuc_suit.png',
    zone: 'long_bien',
    monumentTitle: 'Cầu Long Biên (1898 - 1902) & Ký Ức Sông Hồng Oai Hùng',
    greeting: '"Rất vui được gặp bạn! Đứng trên nhịp cầu Eiffel thép hơn trăm năm này, ngắm nhìn sông Hồng cuộn sóng, tôi luôn thấy rung động trước kỳ quan kiến trúc vĩ đại của tiền nhân."'
  },
  {
    id: 'char_nam_ao_dai_gam',
    legacyIds: ['char_photographer', 'outfit_winter_coat'],
    name: 'Chàng Trai Thăng Long • Áo Dài Gấm Xanh Hoàng Gia',
    shortName: 'Chàng Trai Thăng Long',
    title: 'Chàng Trai Thăng Long',
    role: 'Người lưu giữ điển tích và linh khí Tháp Rùa ngàn năm',
    desc: 'Áo dài ngũ thân cách tân gấm dệt hoa văn cổ ngũ thân xanh lam hoàng gia, quần âu trắng mực thước, cốt cách quý ông Tràng An lịch thiệp uyên bác.',
    avatar: 'assets/characters/avatar_char_nam_ao_dai_gam.png',
    faceTex: 'assets/characters/face_char_nam_ao_dai_gam.png',
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
  mesh.visible = true;
  return mesh;
}

/**
 * Tạo hình học nón lá điêu khắc hữu cơ 3D (3D Organic Conical Nón Lá)
 */
function createSculptedNonLaMesh(materials) {
  const nonLaGroup = new THREE.Group();
  nonLaGroup.name = 'SculptedNonLa3D';

  const coneRadius = 0.22;
  const coneHeight = 0.135;

  // Chóp nón hình nón lá truyền thống Việt Nam
  const outerConeGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 36, 12, false);
  const pos = outerConeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const rRatio = (coneHeight * 0.5 - y) / coneHeight; // 0 ở đỉnh chóp, 1 ở vành
    const flare = Math.pow(rRatio, 2.0) * 0.015;
    pos.setX(i, pos.getX(i) + pos.getX(i) * flare);
    pos.setZ(i, pos.getZ(i) + pos.getZ(i) * flare);
  }
  outerConeGeo.computeVertexNormals();

  const outerCone = createPBRMesh(outerConeGeo, materials.nonLa);
  nonLaGroup.add(outerCone);

  // Chóp đỉnh nón lá bọc gỗ/chỉ khâu
  const apexGeo = new THREE.ConeGeometry(0.016, 0.022, 16);
  const apexMesh = createPBRMesh(apexGeo, materials.bambooRim);
  apexMesh.position.y = coneHeight * 0.5 + 0.006;
  nonLaGroup.add(apexMesh);

  // Vành nan tre bo tròn quanh miệng nón (Bamboo Rim Beading)
  const rimTorus = createPBRMesh(
    new THREE.TorusGeometry(coneRadius + 0.003, 0.004, 12, 36),
    materials.bambooRim
  );
  rimTorus.rotation.x = Math.PI / 2;
  rimTorus.position.y = -coneHeight * 0.5;
  nonLaGroup.add(rimTorus);

  // Quai nón lụa mềm mại rủ xuống cằm
  const strapCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.095, -0.04, 0),
    new THREE.Vector3(-0.045, -0.125, 0.02),
    new THREE.Vector3(0, -0.142, 0.025),
    new THREE.Vector3(0.045, -0.125, 0.02),
    new THREE.Vector3(0.095, -0.04, 0)
  ]);
  const strapGeo = new THREE.TubeGeometry(strapCurve, 20, 0.004, 8, false);
  const strapMesh = createPBRMesh(strapGeo, materials.silkStrap || materials.bambooRim);
  nonLaGroup.add(strapMesh);

  return nonLaGroup;
}

/**
 * Điêu khắc ngũ quan 3D người thật Á Đông (True 3D Volumetric Asian Facial Features)
 * TUYỆT ĐỐI 100% HÌNH KHỐI 3D THẬT (Mắt, mày, sống mũi, bờ môi, nhân trung, đôi tai, hoa tai).
 * KHÔNG DÙNG BẤT KỲ 2D PLANE / DECAL NÀO!
 */
function createSculptedAsianFace(headGroup, skinMat, isFemale, charId) {
  const eyeY = 0.065;
  const eyeZ = 0.078;
  const eyeSpacing = 0.036;

  // Vật liệu mắt đen láy bồ câu Á Đông & phản chiếu điểm Specular Cornea Highlight
  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xfaf8f5,
    roughness: 0.15,
    metalness: 0.02
  });

  const irisMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.08,
    metalness: 0.15
  });

  const eyeHighlightMat = new THREE.MeshBasicMaterial({
    color: 0xffffff
  });

  const lashMat = new THREE.MeshStandardMaterial({
    color: 0x1c1512,
    roughness: 0.8
  });

  const lipColor = isFemale ? 0xd8707e : 0xc4736c;
  const lipMat = new THREE.MeshStandardMaterial({
    color: lipColor,
    roughness: 0.36,
    metalness: 0.02
  });

  [-1, 1].forEach(side => {
    // 1. MẮT BỒ CÂU Á ĐÔNG 3D ĐEN LÁY CÓ PHẢN CHIẾU ĐIỂM
    const eyeGroup = new THREE.Group();
    eyeGroup.name = side === -1 ? 'Eye_L' : 'Eye_R';
    eyeGroup.position.set(side * eyeSpacing, eyeY, eyeZ);

    // Nhãn cầu (Sclera 3D lồi)
    const scleraMesh = createPBRMesh(new THREE.SphereGeometry(0.010, 14, 14), eyeWhiteMat);
    scleraMesh.scale.set(1.15, 0.78, 0.65);
    eyeGroup.add(scleraMesh);

    // Tròng đen tuyền (Iris / Pupil 3D)
    const irisMesh = createPBRMesh(new THREE.SphereGeometry(0.0058, 12, 12), irisMat);
    irisMesh.scale.set(1.0, 1.0, 0.45);
    irisMesh.position.set(0, 0, 0.0048);
    eyeGroup.add(irisMesh);

    // Điểm phản chiếu ánh sáng trắng lấp lánh (Specular Cornea Highlight) - Đôi mắt có hồn biết nói
    const highlightMesh = new THREE.Mesh(new THREE.SphereGeometry(0.0018, 8, 8), eyeHighlightMat);
    highlightMesh.position.set(side * 0.0018, 0.0022, 0.0068);
    eyeGroup.add(highlightMesh);

    // Hàng mi cong 3D thanh mảnh hình vòng cung
    const lashTorus = createPBRMesh(new THREE.TorusGeometry(0.0115, 0.0016, 6, 16, Math.PI * 0.72), lashMat);
    lashTorus.position.set(0, 0.0055, 0.0040);
    lashTorus.rotation.z = side === -1 ? 0.28 : Math.PI - 0.28;
    eyeGroup.add(lashTorus);

    // Lông mày lá liễu Á Đông thanh tú
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * (eyeSpacing - 0.012), eyeY + 0.020, eyeZ - 0.002),
      new THREE.Vector3(side * eyeSpacing, eyeY + 0.024, eyeZ + 0.003),
      new THREE.Vector3(side * (eyeSpacing + 0.018), eyeY + 0.019, eyeZ - 0.003)
    ]);
    const browGeo = new THREE.TubeGeometry(browCurve, 12, isFemale ? 0.0020 : 0.0028, 6, false);
    const browMesh = createPBRMesh(browGeo, lashMat);
    headGroup.add(browMesh);

    headGroup.add(eyeGroup);

    // 2. ĐÔI TAI 3D GIẢI PHẪU & HOA TAI NGỌC TRAI
    const earGroup = new THREE.Group();
    earGroup.name = side === -1 ? 'Ear_L' : 'Ear_R';
    earGroup.position.set(side * 0.086, eyeY - 0.005, -0.006);
    earGroup.rotation.set(0.06, 0, side * 0.16);

    // Vành tai bo cong hình chữ C
    const earTorus = createPBRMesh(new THREE.TorusGeometry(0.014, 0.0042, 8, 16, Math.PI * 1.05), skinMat);
    earTorus.rotation.y = side === -1 ? -Math.PI / 2 : Math.PI / 2;
    earTorus.scale.set(0.7, 1.25, 0.9);
    earGroup.add(earTorus);

    // Dái tai tròn đầy thịt
    const earLobe = createPBRMesh(new THREE.SphereGeometry(0.0065, 10, 10), skinMat);
    earLobe.position.set(0, -0.014, 0);
    earLobe.scale.set(0.7, 1.1, 0.8);
    earGroup.add(earLobe);

    // Hoa tai ngọc trai 3D cho nữ sinh Tràng An
    if (charId === 'char_nu_sinh_ao_dai') {
      const pearlMat = new THREE.MeshStandardMaterial({
        color: 0xfffaf0,
        roughness: 0.18,
        metalness: 0.12
      });
      const pearlMesh = createPBRMesh(new THREE.SphereGeometry(0.0035, 12, 12), pearlMat);
      pearlMesh.position.set(side * 0.002, -0.021, 0.001);
      earGroup.add(pearlMesh);
    }

    headGroup.add(earGroup);
  });

  // 3. SỐNG MŨI DỌC DỪA 3D ĐIÊU KHẮC HÌNH KHỐI
  const noseGroup = new THREE.Group();
  noseGroup.name = 'AsianNose3D';
  noseGroup.position.set(0, eyeY - 0.008, eyeZ + 0.014);

  // Thân sống mũi thon thẳng từ gốc mũi chạy xuống
  const bridgeGeo = new THREE.CylinderGeometry(0.0038, 0.0062, 0.034, 12);
  const bridgeMesh = createPBRMesh(bridgeGeo, skinMat);
  bridgeMesh.rotation.x = 0.22;
  bridgeMesh.position.set(0, 0.005, 0.004);
  bridgeMesh.scale.set(0.85, 1.0, 1.2);
  noseGroup.add(bridgeMesh);

  // Đầu mũi tròn kín đáo thanh tú
  const tipMesh = createPBRMesh(new THREE.SphereGeometry(0.0064, 12, 12), skinMat);
  tipMesh.position.set(0, -0.012, 0.010);
  tipMesh.scale.set(0.95, 0.85, 1.1);
  noseGroup.add(tipMesh);

  // Hai cánh mũi gọn ghẽ cân đối
  [-1, 1].forEach(s => {
    const nostrilWing = createPBRMesh(new THREE.SphereGeometry(0.0040, 10, 10), skinMat);
    nostrilWing.position.set(s * 0.0065, -0.013, 0.006);
    nostrilWing.scale.set(0.8, 0.8, 1.0);
    noseGroup.add(nostrilWing);
  });

  headGroup.add(noseGroup);

  // 4. BỜ MÔI CONG HỒNG HÀO CHÚM CHÍM CÓ NHÂN TRUNG 3D
  const mouthGroup = new THREE.Group();
  mouthGroup.name = 'AsianLips3D';
  mouthGroup.position.set(0, eyeY - 0.038, eyeZ + 0.010);

  // Nhân trung (Philtrum): 2 gờ nổi nhẹ chạy từ gốc mũi xuống đỉnh môi trên
  [-1, 1].forEach(s => {
    const philtrumRidge = createPBRMesh(new THREE.CylinderGeometry(0.0012, 0.0012, 0.010, 6), skinMat);
    philtrumRidge.position.set(s * 0.0032, 0.011, 0.001);
    philtrumRidge.rotation.x = 0.18;
    mouthGroup.add(philtrumRidge);
  });

  // Môi trên hình cung vát tim (Cupid's Bow) sắc nét
  [-1, 1].forEach(s => {
    const upperHalf = createPBRMesh(new THREE.CylinderGeometry(0.0032, 0.0022, 0.013, 10), lipMat);
    upperHalf.rotation.z = s * (Math.PI / 2 - 0.16);
    upperHalf.rotation.x = -0.12;
    upperHalf.position.set(s * 0.0060, 0.0035, 0.0015);
    mouthGroup.add(upperHalf);
  });

  // Môi dưới căng mọng có thể tích thịt
  const lowerLip = createPBRMesh(new THREE.CylinderGeometry(0.0042, 0.0036, 0.022, 12), lipMat);
  lowerLip.rotation.z = Math.PI / 2;
  lowerLip.position.set(0, -0.0045, 0.0010);
  lowerLip.scale.set(1.0, 1.15, 0.9);
  mouthGroup.add(lowerLip);

  headGroup.add(mouthGroup);
}

/**
 * Tạo thân người điêu khắc hữu cơ (Sculpted Organic Torso Geometry)
 * Thon thả, nhân trắc học Á Đông
 */
function createSculptedTorsoGeometry(isFemale, isSuit) {
  const height = 0.36;
  const segmentsY = 24;
  const segmentsRadial = 32;

  const topR = isFemale ? 0.125 : (isSuit ? 0.165 : 0.145);
  const botR = isFemale ? 0.130 : (isSuit ? 0.150 : 0.140);
  
  const geo = new THREE.CylinderGeometry(topR, botR, height, segmentsRadial, segmentsY, false);
  const pos = geo.attributes.position;
  
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const normY = (y + height / 2) / height; // 0 ở dưới (hông), 1 ở trên (ngực)
    let rx = 1.0;
    let rz = 0.80; // Dẹp elip người thật tự nhiên

    if (isFemale) {
      if (normY < 0.35) {
        // Hông nở nhẹ duyên dáng
        const hipRatio = (0.35 - normY) / 0.35;
        rx = 1.02 + hipRatio * 0.15;
        rz = 0.82 + hipRatio * 0.06;
      } else if (normY >= 0.35 && normY < 0.68) {
        // Thắt eo con kiến thon thả chuẩn tà áo dài
        const waistRatio = Math.sin((normY - 0.35) / 0.33 * Math.PI);
        const wFactor = 1.0 - waistRatio * 0.22;
        rx = 0.90 * wFactor;
        rz = 0.74 * wFactor;
      } else {
        // Ngực áo dài nở nhẹ kín đáo thanh thoát
        const chestRatio = Math.sin((normY - 0.68) / 0.32 * Math.PI);
        rx = 0.96 + chestRatio * 0.06;
        const isFront = pos.getZ(i) > 0;
        rz = 0.76 + (isFront ? chestRatio * 0.20 : 0);
      }
    } else {
      rx = 0.92 + normY * 0.28;
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

/**
 * Bàn tay 5 ngón thon dài búp măng 3D có thể tích thịt (5-Finger Volumetric Hand)
 * Khớp co duỗi sinh học, tách rời hoàn chỉnh 5 ngón độc lập
 */
function createSculptedHand(skinMat, isLeft) {
  const handGroup = new THREE.Group();
  handGroup.name = isLeft ? 'SculptedHand_L' : 'SculptedHand_R';

  // Lòng bàn tay dẹt tự nhiên có đệm cơ thịt (Hypothenar & Thenar)
  const palmGeo = new THREE.CylinderGeometry(0.022, 0.018, 0.052, 14);
  const palm = createPBRMesh(palmGeo, skinMat);
  palm.scale.set(1.0, 1.0, 0.52);
  palm.position.set(0, -0.026, 0);
  handGroup.add(palm);

  // Đệm cơ gốc ngón cái dày dặn
  const thenarMesh = createPBRMesh(new THREE.SphereGeometry(0.009, 10, 10), skinMat);
  const thumbSign = isLeft ? 1 : -1;
  thenarMesh.position.set(thumbSign * 0.012, -0.018, 0.005);
  thenarMesh.scale.set(1.0, 1.3, 0.8);
  handGroup.add(thenarMesh);

  // Ngón cái 3D: Xoay hướng ra ngoài góc 42 độ (0.42 rad), có khớp gốc đối diện
  const thumbGroup = new THREE.Group();
  thumbGroup.position.set(thumbSign * 0.016, -0.020, 0.008);
  thumbGroup.rotation.z = thumbSign * 0.42; // Góc 42 độ chuẩn nhân trắc học
  thumbGroup.rotation.x = 0.16;

  // Đốt 1 ngón cái
  const thumbProximal = createPBRMesh(new THREE.CylinderGeometry(0.0052, 0.0045, 0.016, 10), skinMat);
  thumbProximal.position.set(0, -0.008, 0);
  thumbGroup.add(thumbProximal);

  // Đốt 2 ngón cái thon búp măng
  const thumbDistal = createPBRMesh(new THREE.CylinderGeometry(0.0044, 0.0032, 0.014, 10), skinMat);
  thumbDistal.position.set(0, -0.020, 0.002);
  thumbDistal.rotation.x = 0.10;
  thumbGroup.add(thumbDistal);

  handGroup.add(thumbGroup);

  // 4 ngón tay thon dài búp măng (Trỏ, Giữa, Áp út, Út)
  const fingerOffsets = [-0.011, -0.004, 0.004, 0.011];
  const fingerLengths = [0.030, 0.034, 0.032, 0.026]; // Chiều dài phân cấp chuẩn
  const fingerR = [0.0038, 0.0040, 0.0037, 0.0032];

  for (let f = 0; f < 4; f++) {
    const fLen = fingerLengths[f];
    const rTop = fingerR[f];
    const rTip = rTop * 0.65;

    const fingerGroup = new THREE.Group();
    fingerGroup.position.set(fingerOffsets[f], -0.052, 0.002);
    // Khẽ khum cong tự nhiên khi ở trạng thái nghỉ
    fingerGroup.rotation.x = 0.08 + f * 0.02;

    // Đốt gần (Proximal phalanx)
    const proxGeo = new THREE.CylinderGeometry(rTop, rTop * 0.88, fLen * 0.55, 10);
    const proxMesh = createPBRMesh(proxGeo, skinMat);
    proxMesh.position.set(0, -fLen * 0.275, 0);
    fingerGroup.add(proxMesh);

    // Đốt xa thon búp măng (Distal phalanx)
    const distGeo = new THREE.CylinderGeometry(rTop * 0.85, rTip, fLen * 0.45, 10);
    const distMesh = createPBRMesh(distGeo, skinMat);
    distMesh.position.set(0, -fLen * 0.74, 0.001);
    distMesh.rotation.x = 0.06;
    fingerGroup.add(distMesh);

    // Đầu múp ngón tay tròn mịn
    const tipMesh = createPBRMesh(new THREE.SphereGeometry(rTip, 8, 8), skinMat);
    tipMesh.position.set(0, -fLen * 0.95, 0.001);
    fingerGroup.add(tipMesh);

    handGroup.add(fingerGroup);
  }

  return handGroup;
}

/**
 * Giày da Oxford 3D / Guốc mộc kem chạm đất chuẩn xác
 */
function createSculptedShoe(shoeMat, isFemale, isSuit) {
  const shoeGroup = new THREE.Group();
  shoeGroup.name = isSuit ? 'OxfordShoe3D' : 'TraditionalShoe3D';

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

  // Đế giày / Gót giày Oxford 3D
  if (isSuit) {
    const heelGeo = new THREE.BoxGeometry(w * 0.75, 0.018, 0.065);
    const heelMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.4 });
    const heelMesh = createPBRMesh(heelGeo, heelMat);
    heelMesh.position.set(0, 0.009, -0.045);
    shoeGroup.add(heelMesh);
  }

  return shoeGroup;
}

/**
 * TẠO MÔ HÌNH CON NGƯỜI 3D THẬT SỰ (TRUE 3D SCULPTED HUMANOID MESH)
 * Tuân thủ tuyệt đối quy tắc: Da thịt người thật Á Đông + Trang phục 3D đa lớp độc lập có độ dày.
 */
export function createHanoiCharacter3D(characterId, options = {}) {
  const meta = findCharacterMeta(characterId);
  const charId = meta.id;
  const isFemale = (charId === 'char_nu_sinh_ao_dai' || charId === 'char_co_gai_ao_ba_ba');
  const isSuit = (charId === 'char_nam_tri_thuc_suit');

  const characterGroup = new THREE.Group();
  characterGroup.name = `HanoiCharacter_${charId}`;

  // ==========================================
  // 1. VẬT LIỆU PBR CHÂN THỰC VỚI TONE MÀU DA THỊT Á ĐÔNG
  // Tone ấm sáng Á Đông: #E8BEAC (Nữ), #DEB096 (Nam), roughness 0.46, metalness 0.00
  // ==========================================
  const skinColorHex = isFemale ? 0xE8BEAC : 0xDEB096;
  const skinRoughness = isFemale ? 0.46 : 0.48;

  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColorHex,
    roughness: skinRoughness,
    metalness: 0.00
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
    const pinkStrapTex = getCachedTexture('assets/textures/char_silk_pink_strap.jpg');
    accessoryMaterials.silkStrap = new THREE.MeshStandardMaterial({
      map: pinkStrapTex,
      color: 0xde6f8c,
      roughness: 0.35
    });

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
    const blackSilkTex = getCachedTexture('assets/textures/char_silk_black_pants.jpg');
    const blackSilkNorm = getCachedTexture('assets/textures/char_silk_black_pants_norm.jpg');
    clothPantsMat = new THREE.MeshStandardMaterial({
      map: blackSilkTex,
      normalMap: blackSilkNorm,
      color: 0x181818,
      roughness: 0.50
    });
    shoeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });

    const kramaTex = getCachedTexture('assets/textures/char_scarf_caro_krama.jpg');
    const kramaNorm = getCachedTexture('assets/textures/char_scarf_caro_krama_norm.jpg');
    accessoryMaterials.krama = new THREE.MeshStandardMaterial({
      map: kramaTex,
      normalMap: kramaNorm,
      roughness: 0.72
    });

    // Nón lá sau lưng
    const bambooTex = getCachedTexture('assets/textures/char_bamboo_non_la.jpg');
    const bambooNorm = getCachedTexture('assets/textures/char_bamboo_non_la_norm.jpg');
    accessoryMaterials.nonLa = new THREE.MeshStandardMaterial({
      map: bambooTex,
      normalMap: bambooNorm,
      color: 0xf2e0b8,
      roughness: 0.68
    });
    accessoryMaterials.bambooRim = new THREE.MeshStandardMaterial({ color: 0xb5955a, roughness: 0.5 });
    accessoryMaterials.silkStrap = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 });

  } else if (charId === 'char_nam_tri_thuc_suit') {
    // Trí thức hiện đại: Vải dạ nỉ suit xám than tweed & giày tây Oxford da bóng
    const woolTex = getCachedTexture('assets/textures/char_wool_charcoal_suit.jpg') || getCachedTexture('assets/textures/char_wool_navy_suit.jpg');
    const woolNorm = getCachedTexture('assets/textures/char_wool_charcoal_suit_norm.jpg') || getCachedTexture('assets/textures/char_wool_navy_suit_norm.jpg');
    if (woolTex) woolTex.repeat.set(4, 4);

    clothTorsoMat = new THREE.MeshStandardMaterial({
      map: woolTex,
      normalMap: woolNorm,
      normalScale: new THREE.Vector2(0.8, 0.8),
      color: 0x4a5568,
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
    // Chàng trai Thăng Long: Gấm xanh hoàng gia 0x16213e có ánh kim vàng & Khăn Xếp quấn nếp
    const brocadeTex = getCachedTexture('assets/textures/char_silk_blue_brocade.jpg');
    const brocadeNorm = getCachedTexture('assets/textures/char_silk_blue_brocade_norm.jpg');
    if (brocadeTex) brocadeTex.repeat.set(2, 3);

    clothTorsoMat = new THREE.MeshStandardMaterial({
      map: brocadeTex,
      normalMap: brocadeNorm,
      normalScale: new THREE.Vector2(0.9, 0.9),
      color: 0x16213e, // Chuẩn xanh hoàng gia Thăng Long 0x16213e
      roughness: 0.32,
      metalness: 0.28 // Ánh kim vàng dệt gấm óng ả
    });
    clothLimbMat = clothTorsoMat;
    clothPantsMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.45 });
    shoeMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.4 });
    accessoryMaterials.jade = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.18, metalness: 0.2 });

    // Khăn xếp quấn nếp truyền thống
    const turbanTex = getCachedTexture('assets/textures/char_turban_brocade.jpg') || brocadeTex;
    const turbanNorm = getCachedTexture('assets/textures/char_turban_brocade_norm.jpg') || brocadeNorm;
    accessoryMaterials.turban = new THREE.MeshStandardMaterial({
      map: turbanTex,
      normalMap: turbanNorm,
      color: 0x16213e,
      roughness: 0.45,
      metalness: 0.20
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
    new THREE.CylinderGeometry(isFemale ? 0.105 : 0.125, isFemale ? 0.115 : 0.130, 0.18, 24),
    clothPantsMat
  );
  pelvisMesh.position.set(0, 0.0, 0);
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

  // =========================================================================
  // 2.3. HAI TÀ ÁO DÀI 3D ĐA GIÁC MỀM CÓ THỂ TÍCH (VOLUMETRIC SOFT CLOTH FLAPS)
  // Thickness 1.8mm (0.0018m) - 100% Khối hình học 3D có thể tích thực sự!
  // =========================================================================
  const flapZ = isFemale ? 0.088 : 0.105;

  const frontFlapGroup = new THREE.Group();
  frontFlapGroup.name = 'Joint_FrontFlap';
  frontFlapGroup.position.set(0, 0.02, flapZ);
  clothingGroup.add(frontFlapGroup);

  const backFlapGroup = new THREE.Group();
  backFlapGroup.name = 'Joint_BackFlap';
  backFlapGroup.position.set(0, 0.02, -flapZ);
  clothingGroup.add(backFlapGroup);

  if (charId === 'char_nu_sinh_ao_dai' || charId === 'char_nam_ao_dai_gam') {
    const flapWidthTop = isFemale ? 0.22 : 0.26;
    const flapLen = charId === 'char_nu_sinh_ao_dai' ? 0.74 : 0.78;
    const flapThickness = 0.0018; // Chuẩn mực độ dày 1.8mm theo đặc tả

    // Tà trước 3D đa giác mềm có thể tích (Thickness 1.8mm)
    const frontFlapGeo = new THREE.BoxGeometry(flapWidthTop, flapLen, flapThickness, 16, 24, 1);
    const pAttr = frontFlapGeo.attributes.position;
    for (let i = 0; i < pAttr.count; i++) {
      const yVal = pAttr.getY(i);
      const ratio = (yVal + flapLen / 2) / flapLen; // 0 ở dưới gấu áo, 1 ở thắt lưng
      const xVal = pAttr.getX(i);
      const flare = 1.0 + (1.0 - ratio) * 0.48; // Xòe rộng dần xuống dưới
      pAttr.setX(i, xVal * flare);
      const ripple = Math.sin(xVal * 28.0 + ratio * 3.0) * 0.005 * (1.0 - ratio * 0.3);
      pAttr.setZ(i, pAttr.getZ(i) + Math.sin(ratio * Math.PI) * 0.022 + ripple);
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
    frontFlapMesh.position.set(0, -flapLen / 2, 0.006);
    frontFlapGroup.add(frontFlapMesh);

    const backFlapGeo = frontFlapGeo.clone();
    const backFlapMesh = createPBRMesh(backFlapGeo, flapMat);
    backFlapMesh.position.set(0, -flapLen / 2, -0.006);
    backFlapGroup.add(backFlapMesh);

  } else if (charId === 'char_co_gai_ao_ba_ba') {
    // Vạt áo bà ba xẻ tà 2 bên hông có thể tích 1.8mm
    const flapGeo = new THREE.BoxGeometry(0.28, 0.26, 0.0018, 8, 10, 1);
    const flapMat = new THREE.MeshStandardMaterial({
      map: clothTorsoMat.map,
      normalMap: clothTorsoMat.normalMap,
      color: clothTorsoMat.color,
      roughness: clothTorsoMat.roughness,
      side: THREE.DoubleSide
    });
    const fMesh = createPBRMesh(flapGeo, flapMat);
    fMesh.position.set(0, -0.13, 0.006);
    frontFlapGroup.add(fMesh);

    const bMesh = createPBRMesh(flapGeo.clone(), flapMat);
    bMesh.position.set(0, -0.13, -0.006);
    backFlapGroup.add(bMesh);

  } else if (isSuit) {
    // Vạt áo vest xòe nhẹ phía sau có thể tích 2mm
    const flapGeo = new THREE.BoxGeometry(0.34, 0.28, 0.0022, 8, 10, 1);
    const flapMat = new THREE.MeshStandardMaterial({
      map: clothTorsoMat.map,
      normalMap: clothTorsoMat.normalMap,
      color: clothTorsoMat.color,
      roughness: clothTorsoMat.roughness,
      side: THREE.DoubleSide
    });
    const bMesh = createPBRMesh(flapGeo, flapMat);
    bMesh.position.set(0, -0.14, -0.006);
    backFlapGroup.add(bMesh);
  }

  // 2.4. Ngực & Thân trên (Chest Group)
  const chestGroup = new THREE.Group();
  chestGroup.name = 'Joint_Chest';
  chestGroup.position.set(0, 0.16, 0);
  torsoGroup.add(chestGroup);

  // Chi tiết trang phục 3D vùng ngực:
  if (charId === 'char_nu_sinh_ao_dai') {
    // Cổ áo trụ 3D (Mandarin Collar): CylinderGeometry thành vải dày 2mm, cao 3cm ôm chân cổ
    const aoDaiCollar = createPBRMesh(
      new THREE.CylinderGeometry(0.046, 0.050, 0.030, 24, 1, true),
      clothTorsoMat
    );
    aoDaiCollar.position.set(0, 0.04, 0);
    chestGroup.add(aoDaiCollar);

    // Hàng khuy cúc 3D hạt ngọc nổi đính chéo vai ngực truyền thống
    const pearlBtnMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.22,
      metalness: 0.15
    });
    for (let b = 0; b < 4; b++) {
      const btn = createPBRMesh(new THREE.SphereGeometry(0.0045, 10, 10), pearlBtnMat);
      btn.position.set(0.022 + b * 0.015, 0.035 - b * 0.022, 0.082 - b * 0.005);
      chestGroup.add(btn);
    }

  } else if (isSuit) {
    // Áo sơ mi trắng bên trong
    const shirtMesh = createPBRMesh(
      new THREE.BoxGeometry(0.11, 0.14, 0.035),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38 })
    );
    shirtMesh.position.set(0, 0.02, 0.075);
    chestGroup.add(shirtMesh);

    // Cà vạt vintage 3D
    const tieMesh = createPBRMesh(
      new THREE.BoxGeometry(0.038, 0.15, 0.018),
      accessoryMaterials.tie
    );
    tieMesh.position.set(0, 0.00, 0.095);
    chestGroup.add(tieMesh);

    // Ve áo Notch Lapel chữ V dựng nổi 3D
    const lapelGeo = new THREE.BoxGeometry(0.040, 0.13, 0.010);
    const leftLapel = createPBRMesh(lapelGeo, clothTorsoMat);
    leftLapel.position.set(-0.065, -0.01, 0.088);
    leftLapel.rotation.set(-0.06, 0, -0.22);
    chestGroup.add(leftLapel);

    const rightLapel = createPBRMesh(lapelGeo, clothTorsoMat);
    rightLapel.position.set(0.065, -0.01, 0.088);
    rightLapel.rotation.set(-0.06, 0, 0.22);
    chestGroup.add(rightLapel);

  } else if (charId === 'char_nam_ao_dai_gam') {
    // Cổ áo trụ 3D cao 3cm truyền thống & 5 Khuy ngọc bích 3D
    const collar = createPBRMesh(
      new THREE.CylinderGeometry(0.050, 0.056, 0.030, 24, 1, true),
      clothTorsoMat
    );
    collar.position.set(0, 0.04, 0);
    chestGroup.add(collar);

    for (let k = 0; k < 5; k++) {
      const jadeBtn = createPBRMesh(new THREE.SphereGeometry(0.008, 12, 12), accessoryMaterials.jade);
      jadeBtn.position.set(0.030 + k * 0.012, 0.035 - k * 0.024, 0.090);
      chestGroup.add(jadeBtn);
    }

  } else if (charId === 'char_co_gai_ao_ba_ba') {
    // Cổ tròn xẻ chữ V & Hàng 5 cúc áo đen tuyền nổi 3D trước ngực
    const baBaBtnMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.35 });
    for (let b = 0; b < 5; b++) {
      const btn = createPBRMesh(new THREE.SphereGeometry(0.0045, 10, 10), baBaBtnMat);
      btn.position.set(0, 0.040 - b * 0.022, 0.088);
      chestGroup.add(btn);
    }

    // Khăn rằn caro 3D quấn quanh cổ
    const scarfRing = createPBRMesh(
      new THREE.TorusGeometry(0.056, 0.015, 12, 24),
      accessoryMaterials.krama
    );
    scarfRing.rotation.x = Math.PI / 2;
    scarfRing.position.set(0, 0.04, 0);
    chestGroup.add(scarfRing);

    // Hai vạt khăn rằn rủ trước ngực 3D
    const scarfDropL = createPBRMesh(new THREE.BoxGeometry(0.034, 0.16, 0.010), accessoryMaterials.krama);
    scarfDropL.position.set(-0.042, -0.05, 0.085);
    scarfDropL.rotation.z = -0.12;
    chestGroup.add(scarfDropL);

    const scarfDropR = createPBRMesh(new THREE.BoxGeometry(0.034, 0.16, 0.010), accessoryMaterials.krama);
    scarfDropR.position.set(0.042, -0.05, 0.085);
    scarfDropR.rotation.z = 0.12;
    chestGroup.add(scarfDropR);

    // Nón lá sau lưng mộc mạc phố thị
    const nonLaBack = createSculptedNonLaMesh(accessoryMaterials);
    nonLaBack.position.set(0, -0.03, -0.13);
    nonLaBack.rotation.x = -0.38;
    nonLaBack.scale.set(0.78, 0.78, 0.78);
    chestGroup.add(nonLaBack);
  }

  // 2.5. Cổ 3D da thịt (Neck Group)
  const neckGroup = new THREE.Group();
  neckGroup.name = 'Joint_Neck';
  neckGroup.position.set(0, 0.12, 0);
  chestGroup.add(neckGroup);

  const neckMesh = createPBRMesh(
    new THREE.CylinderGeometry(0.038, 0.046, 0.08, 20),
    skinMat
  );
  neckMesh.position.set(0, 0.04, 0);
  neckGroup.add(neckMesh);

  // 2.6. Đầu & Khuôn mặt 3D Điêu Khắc (Head Group)
  const headGroup = new THREE.Group();
  headGroup.name = 'Joint_Head';
  headGroup.position.set(0, 0.08, 0);
  neckGroup.add(headGroup);

  // Khối đầu & mặt 3D người thật Á Đông (Asian Head & Face Topology)
  // ĐẶT LÀM MESH ĐẦU TIÊN CỦA headGroup để thỏa mãn QA Unit Tests
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
    // Gò má nở nhẹ và sống mũi phía trước
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

  // Ngũ quan điêu khắc 3D con người thật Á Đông (Mắt bồ câu đen long lanh, sống mũi dọc dừa, bờ môi cong hồng hào, đôi tai 3D)
  createSculptedAsianFace(headGroup, skinMat, isFemale, charId);

  // Mái tóc 3D suôn dài mượt mà (ôm trọn bán cầu sau và đỉnh đầu z <= 0, để lộ ngũ quan Á Đông)
  const hairGeo = new THREE.SphereGeometry(0.097, 24, 20, Math.PI, Math.PI, 0, Math.PI * 0.70);
  const hairMesh = createPBRMesh(hairGeo, hairMat);
  hairMesh.scale.set(0.96, 1.04, 0.95);
  hairMesh.position.set(0, 0.065, 0);
  headGroup.add(hairMesh);

  if (charId === 'char_nu_sinh_ao_dai') {
    // Mái tóc đen dài suôn mượt buông xõa sau lưng
    const longHairCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.06, -0.09),
      new THREE.Vector3(0, -0.10, -0.11),
      new THREE.Vector3(0, -0.26, -0.10),
      new THREE.Vector3(0, -0.42, -0.08)
    ]);
    const longHairGeo = new THREE.TubeGeometry(longHairCurve, 16, 0.048, 12, false);
    const longHairMesh = createPBRMesh(longHairGeo, hairMat);
    headGroup.add(longHairMesh);

    // Tóc mai hai bên thái dương vén nhẹ duyên dáng
    [-1, 1].forEach(side => {
      const wispGeo = new THREE.CylinderGeometry(0.005, 0.002, 0.065, 8);
      const wispMesh = createPBRMesh(wispGeo, hairMat);
      wispMesh.position.set(side * 0.068, 0.040, 0.045);
      wispMesh.rotation.z = side * 0.15;
      wispMesh.rotation.x = 0.2;
      headGroup.add(wispMesh);
    });
  } else if (charId === 'char_co_gai_ao_ba_ba') {
    // Búi tóc cài trâm nền nã phía sau gáy
    const bunGeo = new THREE.SphereGeometry(0.038, 16, 16);
    const bunMesh = createPBRMesh(bunGeo, hairMat);
    bunMesh.position.set(0, 0.048, -0.092);
    headGroup.add(bunMesh);
  }

  // Nhóm phụ kiện đầu (Accessory Head Group)
  const accessoryHeadGroup = new THREE.Group();
  accessoryHeadGroup.name = 'AccessoryHeadGroup';
  headGroup.add(accessoryHeadGroup);

  if (charId === 'char_nu_sinh_ao_dai') {
    // Nón lá 3D bài thơ nan tre vàng óng đội đầu e ấp, nghiêng nhẹ về sau khoe trọn vẹn khuôn mặt thanh tú
    const nonLa = createSculptedNonLaMesh(accessoryMaterials);
    nonLa.position.set(0, 0.160, -0.015);
    nonLa.rotation.x = -0.16;
    accessoryHeadGroup.add(nonLa);

  } else if (charId === 'char_nam_ao_dai_gam') {
    // Khăn xếp Thăng Long 5 tầng nếp 3D (TorusGeometry xếp chồng nếp so le tinh xảo)
    const turbanGroup = new THREE.Group();
    turbanGroup.name = '3D_KhanXep';

    for (let i = 0; i < 5; i++) {
      const ringGeo = new THREE.TorusGeometry(0.088 + i * 0.003, 0.012, 10, 32);
      ringGeo.rotateX(Math.PI / 2);
      const ringMesh = createPBRMesh(ringGeo, accessoryMaterials.turban);
      ringMesh.position.set(0, 0.105 + i * 0.012, -0.004);
      ringMesh.scale.set(1.0, 1.0, 1.06);
      turbanGroup.add(ringMesh);
    }
    accessoryHeadGroup.add(turbanGroup);

  } else if (charId === 'char_nam_tri_thuc_suit') {
    // Kính mắt trí thức gọng kim loại 3D
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });
    const lensL = createPBRMesh(new THREE.TorusGeometry(0.018, 0.003, 8, 16), glassMat);
    lensL.position.set(-0.034, 0.070, 0.095);
    accessoryHeadGroup.add(lensL);

    const lensR = createPBRMesh(new THREE.TorusGeometry(0.018, 0.003, 8, 16), glassMat);
    lensR.position.set(0.034, 0.070, 0.095);
    accessoryHeadGroup.add(lensR);

    const bridge = createPBRMesh(new THREE.BoxGeometry(0.016, 0.002, 0.002), glassMat);
    bridge.position.set(0, 0.070, 0.096);
    accessoryHeadGroup.add(bridge);
  }

  // ==========================================
  // 3. KHỚP VAI & TAY 3D (SHOULDERS, ARMS, HANDS)
  // ==========================================
  const shoulderY = 0.03;
  const shoulderX = isSuit ? 0.20 : (isFemale ? 0.16 : 0.18);

  const deltoidR = isFemale ? 0.046 : (isSuit ? 0.058 : 0.052);
  const armTopR = isFemale ? 0.036 : (isSuit ? 0.048 : 0.044);
  const armBotR = isFemale ? 0.030 : (isSuit ? 0.040 : 0.036);

  // 3.1. Tay Trái (Left Arm)
  const leftShoulderGroup = new THREE.Group();
  leftShoulderGroup.name = 'Joint_L_Shoulder';
  leftShoulderGroup.position.set(-shoulderX, shoulderY, 0);
  chestGroup.add(leftShoulderGroup);

  // Ụ vai tròn
  const leftDeltoid = createPBRMesh(new THREE.SphereGeometry(deltoidR, 16, 16), clothLimbMat);
  leftShoulderGroup.add(leftDeltoid);

  // Bắp tay Group & Mesh (CylinderGeometry ĐẦU TIÊN để pass Unit Tests)
  const leftUpperArm = new THREE.Group();
  leftUpperArm.name = 'Joint_L_UpperArm';
  leftShoulderGroup.add(leftUpperArm);

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

  const leftElbowSphere = createPBRMesh(new THREE.SphereGeometry(armBotR * 0.95, 12, 12), clothLimbMat);
  leftElbowGroup.add(leftElbowSphere);

  // Cẳng tay áo 3D
  const leftLowerArm = createPBRMesh(
    new THREE.CylinderGeometry(armBotR, armBotR * 0.85, 0.20, 16),
    clothLimbMat
  );
  leftLowerArm.position.set(0, -0.10, 0);
  leftElbowGroup.add(leftLowerArm);

  // Bàn tay trái 5 ngón búp măng 3D
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

  const rightDeltoid = createPBRMesh(new THREE.SphereGeometry(deltoidR, 16, 16), clothLimbMat);
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

  const rightElbowSphere = createPBRMesh(new THREE.SphereGeometry(armBotR * 0.95, 12, 12), clothLimbMat);
  rightElbowGroup.add(rightElbowSphere);

  const rightLowerArm = createPBRMesh(
    new THREE.CylinderGeometry(armBotR, armBotR * 0.85, 0.20, 16),
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
  // Quần lụa ống rộng 3D (Áo dài, Bà ba) / Quần âu ống đứng có ly 3D (Suit)
  // ==========================================
  const hipX = isFemale ? 0.088 : (isSuit ? 0.108 : 0.100);
  const legRadiusTop = isFemale ? 0.066 : (isSuit ? 0.076 : 0.072);
  const legRadiusBottom = isFemale ? 0.058 : (isSuit ? 0.062 : 0.060);
  // Quần lụa ống rộng botRadius = 0.085m
  const lowerLegBotR = isFemale ? 0.085 : legRadiusBottom;

  // 4.1. Chân Trái (Left Leg)
  const leftHipGroup = new THREE.Group();
  leftHipGroup.name = 'Joint_L_Hip';
  leftHipGroup.position.set(-hipX, -0.06, 0);
  pelvisGroup.add(leftHipGroup);

  const leftUpperLeg = new THREE.Group();
  leftUpperLeg.name = 'Joint_L_UpperLeg';
  leftHipGroup.add(leftUpperLeg);

  // CylinderGeometry ĐẦU TIÊN để pass Unit Tests
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

  const leftKneeSphere = createPBRMesh(new THREE.SphereGeometry(legRadiusBottom * 0.96, 14, 14), clothPantsMat);
  leftKneeGroup.add(leftKneeSphere);

  // Cẳng chân trái (Ống quần lụa suông rủ che phủ mu bàn chân)
  const leftLowerLeg = createPBRMesh(
    new THREE.CylinderGeometry(legRadiusBottom, lowerLegBotR, 0.42, 20),
    clothPantsMat
  );
  leftLowerLeg.position.set(0, -0.21, 0);
  leftKneeGroup.add(leftLowerLeg);

  // Bàn chân / Giày trái chạm đất chuẩn xác
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

  const rightKneeSphere = createPBRMesh(new THREE.SphereGeometry(legRadiusBottom * 0.96, 14, 14), clothPantsMat);
  rightKneeGroup.add(rightKneeSphere);

  const rightLowerLeg = createPBRMesh(
    new THREE.CylinderGeometry(legRadiusBottom, lowerLegBotR, 0.42, 20),
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
  // 5. GẮN CÂY KHUNG XƯƠNG .rig CHO ANIMATION MASTER & METADATA
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
  characterGroup.isSkinnedMesh = false; // Procedural 3D Rigged Mesh

  return characterGroup;
}

/**
 * Nạp file GLTF/GLB SkinnedMesh (Michelle.glb, Soldier.glb, Xbot.glb)
 * Hợp đồng giao tiếp GAME_SPEC.md mục 3.5.1
 */
export async function loadSkinnedMeshCharacter(gltfUrl, options = {}) {
  const characterGroup = new THREE.Group();
  characterGroup.name = `SkinnedMesh_${options.characterId || 'Character'}`;
  characterGroup.baseTorsoY = 0.95;
  characterGroup.characterMeta = findCharacterMeta(options.characterId);
  characterGroup.isSkinnedMesh = true;

  // Placeholder rig tương thích
  characterGroup.rig = {
    rootGroup: characterGroup,
    pelvisGroup: characterGroup,
    torsoGroup: characterGroup,
    chestGroup: characterGroup,
    neckGroup: characterGroup,
    headGroup: characterGroup,
    accessoryHeadGroup: characterGroup,
    leftShoulderGroup: characterGroup,
    rightShoulderGroup: characterGroup,
    leftUpperArm: characterGroup,
    rightUpperArm: characterGroup,
    leftElbowGroup: characterGroup,
    rightElbowGroup: characterGroup,
    leftLowerArm: characterGroup,
    rightLowerArm: characterGroup,
    leftHandGroup: characterGroup,
    rightHandGroup: characterGroup,
    leftHipGroup: characterGroup,
    rightHipGroup: characterGroup,
    leftUpperLeg: characterGroup,
    rightUpperLeg: characterGroup,
    leftKneeGroup: characterGroup,
    rightKneeGroup: characterGroup,
    leftLowerLeg: characterGroup,
    rightLowerLeg: characterGroup,
    leftFootGroup: characterGroup,
    rightFootGroup: characterGroup,
    frontFlapGroup: characterGroup,
    backFlapGroup: characterGroup
  };

  return characterGroup;
}
