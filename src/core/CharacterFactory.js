/**
 * CharacterFactory.js - Bộ tạo mô hình 3D cho 4 Nhân Vật Hoàn Chỉnh của Sếp Tổng:
 * 1. char_nu_sinh_ao_dai: Nữ Sinh Tràng An - Áo Dài Trắng Nón Lá
 * 2. char_co_gai_ao_ba_ba: Cô Gái Phố Thị - Áo Bà Ba Hồng Cánh Sen Khăn Rằn Nón Lá
 * 3. char_nam_tri_thuc_suit: Chàng Trai Tràng An / Trí Thức Hiện Đại - Âu Phục Vest Navy Lịch Lãm
 * 4. char_nam_ao_dai_gam: Quý Nam Hà Thành / Nghệ Nhân Di Sản - Áo Dài Gấm Xanh Quần Trắng
 */

import * as THREE from '../lib/three.module.js';

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
    zone: 'ho_guom',
    monumentTitle: 'Đền Ngọc Sơn - Cầu Thê Húc & Quần Thể Danh Thắng Hồ Hoàn Kiếm',
    greeting: '"Em chào anh/chị lãng tử! Hôm nay hồ Gươm sương giăng bảng lảng, Cầu Thê Húc son đỏ soi bóng nước biếc đẹp như một bức tranh thủy mặc."',
    historyText: `
      <p><strong>Cầu Thê Húc (15 Nhịp Son Đỏ):</strong> Do danh sĩ Nguyễn Văn Siêu cho xây dựng năm 1865. "Thê Húc" nghĩa là "Ngưng tụ ánh sáng ban mai tinh khôi của mặt trời". Cầu cong như dải lụa đỏ nối bờ với Đảo Ngọc, biểu tượng của sự thanh khiết đón sinh khí trời đất.</p>
      <p><strong>Đền Ngọc Sơn & Đắc Nguyệt Lâu:</strong> Tọa lạc trên Đảo Ngọc, thờ Đức Thánh Trần Hưng Đạo – anh hùng hộ quốc ba lần đại phá Nguyên Mông, và Văn Xương Đế Quân – chủ trì sự học và đỗ đạt. Đắc Nguyệt Lâu (Lầu Đón Trăng) là tuyệt tác kiến trúc hài hòa giữa con người và thiên nhiên.</p>
      <p><strong>Tháp Bút - Đài Nghiên:</strong> Khắc ba chữ "Tả Thanh Thiên" (Viết lên trời xanh) nhắc nhở thế hệ con cháu luôn giữ vững khí phách cương trực và lòng hiếu học ngàn đời.</p>
      <p><strong>Tiêu Bản Cụ Rùa Hồ Gươm:</strong> Hiện ngự trang nghiêm trong tủ kính bảo tồn chính điện, gắn liền với huyền tích Rùa Vàng thế kỷ 15.</p>
    `,
    dialogueOptions: [
      { text: 'Ý nghĩa của tên gọi "Cầu Thê Húc" là gì em?', reply: '"Thê Húc" nghĩa là nơi lưu giữ lại những tia sáng ban mai đầu ngày rực rỡ nhất. Cầu sơn màu đỏ thắm tượng trưng cho mặt trời hướng về phía đông, đưa lòng người hướng thiện an yên.' },
      { text: 'Tà áo dài trắng và nón lá có ý nghĩa thế nào với thiếu nữ Hà Nội?', reply: 'Áo dài trắng nữ sinh tôn vinh sự tinh khôi, đoan trang, còn chiếc nón lá bài thơ che nghiêng là nét duyên ngầm e ấp của người con gái đất kinh kỳ Tràng An.' },
      { text: 'Xin em kể thêm về Tháp Bút - Đài Nghiên?', reply: 'Tháp Bút dựng trên núi Ngọc Bội, đỉnh tháp vươn cao như chiếc bút lông viết lên nền trời xanh thẳm, răn dạy học trò nước Nam học chữ phải đi đôi với luyện tâm rèn đức.' }
    ],
    shopItems: [
      { name: 'Chiếc Nón Lá Bài Thơ Xứ Huế - Hà Nội', price: '15 Xu', desc: 'Nón lá chằm tay soi lên ánh sáng hiện hình hoa sen', icon: '👒' },
      { name: 'Thẻ Quẻ May Mắn Văn Xương Đế Quân', price: '5 Xu', desc: 'Quẻ thẻ cầu chúc việc học hành, công danh hanh thông', icon: '📜' },
      { name: 'Vòng Chỉ Đỏ Bình An Đền Ngọc Sơn', price: '10 Xu', desc: 'Vòng dâu tằm chỉ đỏ may mắn trừ tà khí', icon: '🏮' },
      { name: 'Bưu Thiếp Cầu Thê Húc Ánh Dương', price: '10 Xu', desc: 'Bức ảnh chụp nhịp cầu son soi bóng nước hồ Gươm', icon: '📮' }
    ]
  },
  {
    id: 'char_co_gai_ao_ba_ba',
    legacyIds: ['char_hanoi_elder', 'outfit_vintage_shirt'],
    name: 'Cô Gái Phố Thị • Áo Bà Ba Hồng Khăn Rằn Nón Lá',
    shortName: 'Chị Lan • Cô Gái Phố Thị',
    title: 'Nét Duyên Mộc Mạc & Hiếu Khách 36 Phố Phường',
    role: 'Người dẫn đường nồng hậu tại ngõ ngách Phố Cổ & Ô Quan Chưởng',
    desc: 'Áo bà ba hồng cánh sen mộc mạc, chiếc khăn rằn vắt vai, nón lá đeo sau lưng, nụ cười rạng rỡ chào đón lữ khách ghé thăm phố cũ.',
    avatar: 'assets/characters/avatar_char_co_gai_ao_ba_ba.png',
    bodyFront: 'assets/characters/body_front_char_co_gai_ao_ba_ba.png',
    bodyBack: 'assets/characters/body_back_char_co_gai_ao_ba_ba.png',
    zone: 'old_quarter',
    monumentTitle: '36 Phố Phường Hà Nội & Cửa Ô Quan Chưởng Cổ Kính',
    greeting: '"Chào lãng tử ghé phố cổ! Em vừa gánh gánh hoa sớm qua Ô Quan Chưởng, mời anh/chị dừng chân nhấp ngụm nước chè sen và nghe chuyện phố phường nhé!"',
    historyText: `
      <p><strong>Hà Nội Ba Mươi Sáu Phố Phường:</strong> Vốn bắt nguồn từ các phường hội thủ công nghiệp thời phong kiến ven Hoàng thành Thăng Long. Mỗi con phố mang tên chữ "Hàng" gắn liền với một nghề tinh hoa: Hàng Bạc đúc bạc, Hàng Buồm bán buồm, Hàng Gai kéo tơ thêu dệt, Hàng Trống khắc tranh dân gian.</p>
      <p><strong>Kiến Trúc Nhà Ống & Ngõ Hẹp:</strong> Nhằm tiết kiệm mặt tiền đóng thuế thời xưa, người Hà Nội sáng tạo nên kiểu nhà ống "mặt tiền hẹp, chiều sâu hun hút", bên trong có các giếng trời lấy sáng, sân trong trồng hoa ngọc lan thoang thoảng hương thơm.</p>
      <p><strong>Ô Quan Chưởng (Cửa Ô Thanh Hà):</strong> Xây dựng năm 1749 dưới thời vua Lê Hiển Tông, là cửa ô duy nhất còn nguyên vẹn trong 5 cửa ô huyền thoại che chở cho Thăng Long văn vật.</p>
    `,
    dialogueOptions: [
      { text: 'Chị ơi, phố cổ Hà Nội có những món quà vặt gì ngon nhất?', reply: 'Nhiều lắm lãng tử ơi! Nào là bánh cốm Hàng Than, phở cuốn Ngũ Xã, cà phê trứng thơm nức mũi, chè sen long nhãn ngọt thanh giải nhiệt.' },
      { text: 'Ý nghĩa của chiếc khăn rằn và áo bà ba ở phố cổ?', reply: 'Áo bà ba mềm mại thoáng mát, khăn rằn thấm giọt mồ hôi gánh gồng tảo tần, biểu trưng cho đức tính chịu thương chịu khó, bao dung của phụ nữ Việt.' },
      { text: 'Lịch sử Cửa Ô Quan Chưởng hào hùng ra sao?', reply: 'Năm 1873, một vị Chưởng cơ cùng hơn 100 binh sĩ triều Nguyễn đã chiến đấu quả cảm đến hơi thở cuối cùng để bảo vệ cửa ô này chống thực dân Pháp. Tên Ô Quan Chưởng đời đời tri ân vị anh hùng ấy.' }
    ],
    shopItems: [
      { name: 'Khăn Rằn Bông Dệt Thủ Công', price: '12 Xu', desc: 'Khăn rằn caro đen trắng thấm mồ hôi dạo phố', icon: '🧣' },
      { name: 'Gói Kẹo Lạc Giòn Rụm Bọc Giấy Báo', price: '5 Xu', desc: 'Món quà ăn vặt dân dã bên quán nước chè xanh', icon: '🥜' },
      { name: 'Bưu Thiếp Tranh Khắc Gỗ Phố Phường', price: '10 Xu', desc: 'Bức tranh khắc họa nhịp sống gánh hàng rong phố cổ', icon: '📮' },
      { name: 'Túi Thảo Mộc Thơm Phố Cổ', price: '15 Xu', desc: 'Hương thơm tự nhiên giúp thư giãn an giấc', icon: '🌿' }
    ]
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
    greeting: '"Rất vui được gặp bạn! Đứng trên nhịp cầu Eiffel thép hơn trăm năm này, ngắm nhìn sông Hồng cuộn sóng, tôi luôn thấy rung động trước kỳ quan kiến trúc vĩ đại của tiền nhân."',
    historyText: `
      <p><strong>Cầu Long Biên (Cầu Doumer - 1902):</strong> Được khởi công năm 1898 bởi hãng Daydé & Pillé (Pháp), với chiều dài hơn 2.290m gồm 19 nhịp dầm thép uốn lượn như con rồng thép vắt ngang đôi bờ sông Hồng, là kỳ quan kỹ thuật vĩ đại nhất Đông Dương thời bấy giờ.</p>
      <p><strong>Chứng Nhân Lịch Sử & Vết Sẹo Kháng Chiến:</strong> Cây cầu đã kiên cường gánh chịu hàng nghìn tấn bom đạn trong chiến dịch "Điện Biên Phủ trên không" năm 1972. Dù gãy gập nhiều nhịp, quân dân Thủ đô đã thần tốc dựng cầu dã chiến để mạch máu giao thông không một ngày đứt đoạn.</p>
      <p><strong>Xóm Đường Tàu & Đời Sống Ven Sông:</strong> Những chuyến tàu đêm rền vang trên dầm thép rỉ sét, hương ngô nướng than hồng mùa đông bên bãi bồi sông Hồng là ký ức không thể nào quên của người Hà Nội.</p>
    `,
    dialogueOptions: [
      { text: 'Dưới góc độ kiến trúc, kết cấu dầm Eiffel của cầu có gì đặc sắc?', reply: 'Hệ giàn thép liên kết bằng đinh tán nóng uốn lượn hình sin nhấp nhô như lưng rồng châu á. Kết cấu này vừa phân tán lực cản gió sông Hồng cực tốt, vừa tạo nên vẻ đẹp thanh thoát vượt thời gian.' },
      { text: 'Tại sao lại có những nhịp cầu hình dáng khác nhau?', reply: 'Đó là những nhịp dã chiến Bailey do công binh ta hàn dựng cấp tốc trong đêm bom đạn năm 1972 để thông xe. Đó là những "vết sẹo kiêu hãnh" của lòng dũng cảm!' },
      { text: 'Anh thấy sự giao thoa giữa hiện đại và quá khứ ở đâu rõ nhất?', reply: 'Chính là ở đây: Tàu hỏa hiện đại vẫn chạy trên đường ray thế kỷ 19, và người trẻ chúng ta vẫn tìm về nhịp cầu này để lắng lòng giữa cuộc sống bộn bề.' }
    ],
    shopItems: [
      { name: 'Huy Hiệu Kim Loại Cầu Long Biên 1972', price: '15 Xu', desc: 'Huy hiệu hình nhịp cầu thép kiên cường vươn cao', icon: '🎖️' },
      { name: 'Bản Vẽ Kỹ Thuật Dầm Cầu Long Biên (A3)', price: '20 Xu', desc: 'Bản vẽ phục dựng kết cấu thép nguyên bản năm 1898', icon: '📐' },
      { name: 'Cuộn Film 35mm ISO 400 Chụp Đêm', price: '18 Xu', desc: 'Film nhạy sáng ghi lại bóng tàu hỏa vụt qua đêm sông Hồng', icon: '🎞️' },
      { name: 'Bắp Ngô Nướng Bờ Sông Hồng', price: '5 Xu', desc: 'Bắp nướng than hoa thơm lừng mùi mỡ hành cay nồng', icon: '🌽' }
    ]
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
    zone: 'ho_guom',
    monumentTitle: 'Tháp Rùa Cổ Kính & Huyền Tích Trả Gươm Thần Vua Lê Thái Tổ',
    greeting: '"Kính chào Tổng Giám Đốc và các bạn lãng tử! Tôi đã gắn bó bên làn nước biếc hồ Gươm này trọn đời người. Mời quý vị ghé thăm Quy Sơn Tháp chiêm bái hồn thiêng non sông."',
    historyText: `
      <p><strong>Tháp Rùa (Quy Sơn Tháp - 1886):</strong> Tọa lạc trên gò đất nổi giữa lòng hồ Hoàn Kiếm, nơi xưa kia chúa Trịnh dựng Tả Vọng Đình để hóng mát mùa hè. Tháp xây dựng theo phong cách giao thoa độc đáo: hệ vòm cửa cuốn Gothic của kiến trúc Pháp kết hợp mái ngói cong mũi hài truyền thống cung đình Việt.</p>
      <p><strong>Huyền Tích Thuận Thiên Kiếm:</strong> Thế kỷ 15, người anh hùng áo vải Lê Lợi dựng cờ khởi nghĩa Lam Sơn đã nhận được gươm báu Thuận Thiên. Sau 10 năm gian khổ đánh đuổi quân Minh xâm lược, khi dạo thuyền rồng trên hồ Tả Vọng, Thần Kim Quy nổi lên đón nhận lại gươm báu, từ đó hồ đổi tên thành Hồ Hoàn Kiếm (Hồ Trả Gươm).</p>
      <p><strong>Linh Hồn Tràng An:</strong> Giữa trung tâm Thủ đô nhộn nhịp, Tháp Rùa bốn mùa soi bóng mặt nước xanh lục thủy, là biểu tượng thiêng liêng của khát vọng hòa bình và độc lập tự chủ ngàn đời của dân tộc ta.</p>
    `,
    dialogueOptions: [
      { text: 'Thưa bác, áo dài nam truyền thống có ý nghĩa gì về đạo đức người xưa?', reply: 'Áo dài ngũ thân có 5 tà tượng trưng cho Tứ thân phụ mẫu và chính mình, 5 chiếc khuy cài tượng trưng cho Ngũ thường: Nhân - Lễ - Nghĩa - Trí - Tín. Mặc áo dài là nhắc mình giữ trọn đạo làm người.' },
      { text: 'Kiến trúc Tháp Rùa giao thoa Á - Âu như thế nào?', reply: 'Tầng 1 và 2 mang các cửa vòm Gothic thanh thoát của kiến trúc phương Tây, nhưng tầng 3 và phần mái lại lợp ngói cong mũi hài cung đình Đại Việt, tạo nên sự hòa hợp văn hóa độc đáo cuối thế kỷ 19.' },
      { text: 'Hồ Hoàn Kiếm có vị thế phong thủy thế nào với Thăng Long?', reply: 'Hồ là mắt ngọc của kinh thành, tụ khí linh thiêng sông Hồng, bốn mùa nước biếc lục thủy. Giữ được vẻ đẹp hồ Gươm là giữ được vượng khí thái bình thịnh trị cho muôn đời con cháu.' }
    ],
    shopItems: [
      { name: 'Mô Hình Tháp Rùa Thu Nhỏ Mạ Đồng', price: '15 Xu', desc: 'Mô hình kỷ niệm Tháp Rùa tinh xảo mang lại may mắn', icon: '🐢' },
      { name: 'Gói Trà Sen Tây Hồ Bách Diệp', price: '25 Xu', desc: 'Búp trà ướp ngàn đóa sen sớm thơm ngát lòng người', icon: '🪷' },
      { name: 'Bưu Thiếp Tháp Rùa Đổi Màu Mờ Sương', price: '10 Xu', desc: 'Bức ảnh chụp Tháp Rùa trong làn sương sớm mùa đông', icon: '📮' },
      { name: 'Sách Ảnh "Hồ Gươm - Hồn Xưa Nét Cũ"', price: '20 Xu', desc: 'Cuốn tư liệu quý giá về lịch sử Tháp Rùa và 36 phố phường', icon: '📖' }
    ]
  }
];

// Texture cache
const textureCache = new Map();
function loadCachedTexture(url) {
  if (typeof document === 'undefined') return null;
  if (textureCache.has(url)) return textureCache.get(url);
  const loader = new THREE.TextureLoader();
  const tex = loader.load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(url, tex);
  return tex;
}

/**
 * Tìm metadata nhân vật theo ID (hỗ trợ cả legacy IDs)
 */
export function findCharacterMeta(id) {
  if (!id) return CHARACTERS_META[0];
  return CHARACTERS_META.find(c => c.id === id || (c.legacyIds && c.legacyIds.includes(id))) || CHARACTERS_META[0];
}

/**
 * Tạo mô hình 3D cho 1 trong 4 nhân vật mới, tương thích hoàn toàn với PlayerController và NPC System
 * Sử dụng kết cấu 2 mặt Front/Back độc lập + Xương giải phẫu sải bước tự nhiên
 */
export function createHanoiCharacter3D(characterId, options = {}) {
  const meta = findCharacterMeta(characterId);
  const isNPC = !!options.isNPC;

  const characterGroup = new THREE.Group();
  characterGroup.name = `Character_${meta.id}`;

  const baseTorsoY = 0.95;
  const charH = 1.84;
  const charW = 0.92;

  // 1. TẤM THÂN MẶT TRƯỚC (FRONT VIEW)
  const frontTex = loadCachedTexture(meta.bodyFront);
  const frontMat = new THREE.MeshBasicMaterial({
    map: frontTex,
    transparent: true,
    alphaTest: 0.15,
    side: THREE.FrontSide,
    depthWrite: true
  });
  const frontPlane = new THREE.Mesh(new THREE.PlaneGeometry(charW, charH), frontMat);
  frontPlane.position.set(0, charH / 2, 0.015);
  frontPlane.castShadow = true;
  characterGroup.add(frontPlane);

  // 2. TẤM THÂN MẶT SAU (BACK VIEW - Hiển thị chuẩn khi nhìn từ sau lưng!)
  const backTex = loadCachedTexture(meta.bodyBack || meta.bodyFront);
  const backMat = new THREE.MeshBasicMaterial({
    map: backTex,
    transparent: true,
    alphaTest: 0.15,
    side: THREE.FrontSide,
    depthWrite: true
  });
  const backPlane = new THREE.Mesh(new THREE.PlaneGeometry(charW, charH), backMat);
  backPlane.rotation.y = Math.PI; // Quay mặt ra sau
  backPlane.position.set(0, charH / 2, -0.015);
  backPlane.castShadow = true;
  characterGroup.add(backPlane);

  // 3. XƯƠNG GIẢI PHẪU TỰ NHIÊN CHO HOẠT ẢNH BƯỚC ĐI (PIVOTS)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = baseTorsoY;

  const headGroup = new THREE.Group();
  headGroup.position.y = 0.65;
  torsoGroup.add(headGroup);
  characterGroup.add(torsoGroup);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.32, baseTorsoY + 0.42, 0);
  characterGroup.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.32, baseTorsoY + 0.42, 0);
  characterGroup.add(rightArmPivot);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.13, 0.82, 0);
  characterGroup.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.13, 0.82, 0);
  characterGroup.add(rightLegPivot);

  // 4. BÓNG ĐỔ TIẾP XÚC MẶT ĐẤT (CONTACT BLOB SHADOW)
  if (typeof document !== 'undefined') {
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 64;
    const sctx = shadowCanvas.getContext('2d');
    const grad = sctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.68)');
    grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.28)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 64);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.80, 0.80),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.85, depthWrite: false })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.02;
    characterGroup.add(shadowPlane);
  }

  // Gắn các tham chiếu điều khiển
  characterGroup.frontPlane = frontPlane;
  characterGroup.backPlane = backPlane;
  characterGroup.torsoGroup = torsoGroup;
  characterGroup.headGroup = headGroup;
  characterGroup.leftArmPivot = leftArmPivot;
  characterGroup.rightArmPivot = rightArmPivot;
  characterGroup.leftLegPivot = leftLegPivot;
  characterGroup.rightLegPivot = rightLegPivot;
  characterGroup.baseTorsoY = baseTorsoY;
  characterGroup.characterMeta = meta;

  // Hoạt ảnh thở tự nhiên khi đứng yên (NPC Idle Animation)
  characterGroup.idleTime = Math.random() * 10;
  characterGroup.updateNPCAnimation = function(delta) {
    this.idleTime += delta * 1.8;
    const breath = Math.sin(this.idleTime) * 0.012;
    this.frontPlane.position.y = (charH / 2) + breath;
    this.backPlane.position.y = (charH / 2) + breath;
    this.torsoGroup.position.y = this.baseTorsoY + breath;
  };

  return characterGroup;
}
