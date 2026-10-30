/**
 * CharacterFactory.js - Bộ tạo mô hình 3D cho 4 Nhân Vật & NPC Lịch Sử Hà Nội
 * Dựa trên bản thiết kế quét 3D thực tế của Tổng Giám Đốc:
 * 1. char_photographer: Nam trung niên / KTS / Nhiếp ảnh gia (Tuấn)
 * 2. char_cultural_officer: Nữ thanh lịch / Cán bộ văn hóa Tràng An (Hương)
 * 3. char_young_explorer: Nam thanh niên / Lãng tử / Phượt thủ trẻ (Bảo)
 * 4. char_hanoi_elder: Bà cụ người Hà Nội xưa / Nhân chứng Thăng Long (Bà Vui)
 */

import * as THREE from '../lib/three.module.js';

export const CHARACTERS_META = [
  {
    id: 'char_photographer',
    name: 'Nhiếp Ảnh Gia Di Sản (Tuấn)',
    shortName: 'Chú Tuấn • KTS & Nhiếp Ảnh Gia',
    title: 'KTS & Nhiếp Ảnh Gia Lưu Trữ 36 Phố Phường',
    role: 'Nhiếp ảnh gia di sản ghi lại từng góc phố Thăng Long',
    desc: 'Nam trung niên phong độ, áo thun xám, quần jean xanh, tay cầm máy ảnh ghi lại từng nhịp thở ngàn năm phố cổ.',
    avatar: 'assets/characters/avatar_photographer.png',
    bodyTexture: 'assets/characters/body_photographer_cutout.png',
    zone: 'old_quarter',
    monumentTitle: '36 Phố Phường Hà Nội & Cửa Ô Quan Chưởng Cổ Kính',
    greeting: '"Chào người lãng tử! Bạn có muốn cùng tôi ngắm nhìn những góc phố cổ qua ống kính máy ảnh và lắng nghe câu chuyện về từng con ngõ rêu phong?"',
    historyText: `
      <p><strong>Hà Nội Ba Mươi Sáu Phố Phường:</strong> Vốn bắt nguồn từ các phường hội thủ công nghiệp thời phong kiến ven Hoàng thành Thăng Long. Mỗi con phố mang tên chữ "Hàng" gắn liền với một nghề tinh hoa: Hàng Bạc đúc bạc, Hàng Buồm bán buồm, Hàng Gai kéo tơ thêu dệt, Hàng Trống khắc tranh dân gian.</p>
      <p><strong>Kiến Trúc Nhà Ống & Ngõ Hẹp:</strong> Nhằm tiết kiệm mặt tiền đóng thuế thời xưa, người Hà Nội sáng tạo nên kiểu nhà ống "mặt tiền hẹp, chiều sâu hun hút", bên trong có các giếng trời lấy sáng, sân trong trồng hoa ngọc lan thoang thoảng hương thơm.</p>
      <p><strong>Ô Quan Chưởng (Cửa Ô Thanh Hà):</strong> Xây dựng năm 1749 dưới thời vua Lê Hiển Tông, là cửa ô duy nhất còn nguyên vẹn trong 5 cửa ô huyền thoại che chở cho Thăng Long văn vật.</p>
    `,
    dialogueOptions: [
      { text: 'Bác ơi, góc máy nào chụp phố cổ đẹp nhất ạ?', reply: 'Đó là lúc sớm mai tinh mơ khi tia nắng xiên qua rặng xà cừ rọi xuống mái ngói âm dương rêu phong, hoặc chiều tà khi ánh đèn dầu phố cũ vừa chớm sáng!' },
      { text: 'Nhà ống phố cổ vì sao lại sâu hun hút vậy bác?', reply: 'Ngày xưa tính thuế theo bề rộng mặt tiền, các cụ nhà ta khéo léo phát triển chiều sâu, mở giếng trời ở giữa để lấy gió trời và ánh sáng tự nhiên, tạo nên nét kiến trúc độc nhất vô nhị.' },
      { text: 'Ô Quan Chưởng có ý nghĩa lịch sử thế nào?', reply: 'Năm 1873, một vị Chưởng cơ cùng hơn 100 binh sĩ triều Nguyễn đã chiến đấu quả cảm đến hơi thở cuối cùng để bảo vệ cửa ô này chống thực dân Pháp. Tên Ô Quan Chưởng đời đời tri ân vị anh hùng ấy.' }
    ],
    shopItems: [
      { name: 'Cuộn Film 35mm ISO 200 Cổ Điển', price: '15 Xu', desc: 'Cuộn film chụp ảnh phố cổ màu sắc hoài niệm thập niên 90', icon: '🎞️' },
      { name: 'Bưu Thiếp Tranh Khắc Gỗ Phố Phường', price: '10 Xu', desc: 'Bức tranh khắc họa nhịp sống gánh hàng rong phố cổ', icon: '📮' },
      { name: 'Sách Ảnh "36 Phố Phường Thăng Long"', price: '25 Xu', desc: 'Tư liệu quý giá về lịch sử thủ công mỹ nghệ Hà Nội', icon: '📖' },
      { name: 'Kính Lọc Ống Kính Màu Nắng Thu', price: '20 Xu', desc: 'Bộ lọc quang học tạo sắc vàng ấm áp hồ Gươm', icon: '🔍' }
    ]
  },
  {
    id: 'char_cultural_officer',
    name: 'Cán Bộ Văn Hóa Tràng An (Hương)',
    shortName: 'Cô Hương • Cán Bộ Văn Hóa',
    title: 'Chuyên Gia Nghiên Cứu & Bảo Tồn Di Sản Thăng Long',
    role: 'Người thủ hộ và truyền bá văn hóa di sản Hà Nội',
    desc: 'Nữ thanh lịch, áo blazer màu be, quần âu chỉn chu, túi da đeo chéo, am tường lịch sử và văn hóa Tràng An.',
    avatar: 'assets/characters/avatar_cultural_officer.png',
    bodyTexture: 'assets/characters/body_cultural_officer_cutout.png',
    zone: 'ho_guom',
    monumentTitle: 'Đền Ngọc Sơn - Cầu Thê Húc & Quần Thể Danh Thắng Hồ Hoàn Kiếm',
    greeting: '"Kính chào bạn lãng tử! Tôi rất vui được đồng hành cùng bạn bên Cầu Thê Húc son đỏ và Đền Ngọc Sơn linh thiêng. Nơi đây từng tấc đất, ngọn sóng đều là hồn thiêng sông núi Đại Việt."',
    historyText: `
      <p><strong>Cầu Thê Húc (15 Nhịp Son Đỏ):</strong> Do danh sĩ Nguyễn Văn Siêu cho xây dựng năm 1865. "Thê Húc" nghĩa là "Ngưng tụ ánh sáng ban mai tinh khôi của mặt trời". Cầu cong như dải lụa đỏ nối bờ với Đảo Ngọc, biểu tượng của sự thanh khiết đón sinh khí trời đất.</p>
      <p><strong>Đền Ngọc Sơn & Đắc Nguyệt Lâu:</strong> Tọa lạc trên Đảo Ngọc, thờ Đức Thánh Trần Hưng Đạo – anh hùng hộ quốc ba lần đại phá Nguyên Mông, và Văn Xương Đế Quân – chủ trì sự học và đỗ đạt. Đắc Nguyệt Lâu (Lầu Đón Trăng) là tuyệt tác kiến trúc hài hòa giữa con người và thiên nhiên.</p>
      <p><strong>Tháp Bút - Đài Nghiên:</strong> Khắc ba chữ "Tả Thanh Thiên" (Viết lên trời xanh) nhắc nhở thế hệ con cháu luôn giữ vững khí phách cương trực và lòng hiếu học ngàn đời.</p>
      <p><strong>Tiêu Bản Cụ Rùa Hồ Gươm:</strong> Hiện ngự trang nghiêm trong tủ kính bảo tồn chính điện, gắn liền với huyền tích Rùa Vàng thế kỷ 15.</p>
    `,
    dialogueOptions: [
      { text: 'Ý nghĩa của tên gọi "Cầu Thê Húc" là gì thưa cô?', reply: '"Thê Húc" nghĩa là nơi lưu giữ lại những tia sáng ban mai đầu ngày rực rỡ nhất. Cầu sơn màu đỏ thắm tượng trưng cho mặt trời hướng về phía đông, đưa lòng người hướng thiện an yên.' },
      { text: 'Xin cô kể thêm về Tháp Bút - Đài Nghiên?', reply: 'Tháp Bút dựng trên núi Ngọc Bội, đỉnh tháp vươn cao như chiếc bút lông viết lên nền trời xanh thẳm, răn dạy học trò nước Nam học chữ phải đi đôi với luyện tâm rèn đức.' },
      { text: 'Đền Ngọc Sơn thờ phụng những bậc tiền nhân nào?', reply: 'Đền thờ Đức Thánh Trần Hưng Đạo - vị tướng bách chiến bách thắng đánh tan giặc Mông Cổ, và Đức Văn Xương Đế Quân - thần bảo trợ khoa cử văn chương nước nhà.' }
    ],
    shopItems: [
      { name: 'Thẻ Quẻ May Mắn Văn Xương Đế Quân', price: '5 Xu', desc: 'Quẻ thẻ cầu chúc việc học hành, công danh hanh thông', icon: '📜' },
      { name: 'Vòng Chỉ Đỏ Bình An Đền Ngọc Sơn', price: '10 Xu', desc: 'Vòng dâu tằm chỉ đỏ may mắn trừ tà khí', icon: '🏮' },
      { name: 'Mô Hình Tháp Bút Bằng Đồng Cổ', price: '20 Xu', desc: 'Tượng trưng cho tinh thần hiếu học kiên định của đất Tràng An', icon: '✒️' },
      { name: 'Bưu Thiếp Cầu Thê Húc Ánh Dương', price: '10 Xu', desc: 'Bức ảnh chụp nhịp cầu son soi bóng nước hồ Gươm', icon: '📮' }
    ]
  },
  {
    id: 'char_young_explorer',
    name: 'Lãng Tử Ba Lô / Phượt Thủ (Bảo)',
    shortName: 'Bảo Lãng Tử • Người Trẻ Tiếp Nối Ký Ức',
    title: 'Người Trẻ Đam Mê Khám Phá & Tiếp Nối Ký Ức Lịch Sử',
    role: 'Phượt thủ trẻ đam mê tìm hiểu lịch sử kháng chiến',
    desc: 'Nam thanh niên trẻ trung, áo bomber mũ trùm, ba lô du lịch, sải bước tự tin kết nối quá khứ với hiện đại.',
    avatar: 'assets/characters/avatar_young_explorer.png',
    bodyTexture: 'assets/characters/body_young_explorer_cutout.png',
    zone: 'long_bien',
    monumentTitle: 'Cầu Long Biên (1898 - 1902) & Ký Ức Sông Hồng Oai Hùng',
    greeting: '"Chào bạn đồng hành! Đứng ở nhịp cầu thép Eiffel lộng gió sông Hồng này, ngắm nhìn những vết thương bom đạn lịch sử, mình thấy tự hào về mảnh đất nghìn năm này biết bao!"',
    historyText: `
      <p><strong>Cầu Long Biên (Cầu Doumer - 1902):</strong> Được khởi công năm 1898 bởi hãng Eiffel (Pháp), với chiều dài hơn 2.290m gồm 19 nhịp dầm thép uốn lượn như con rồng thép vắt ngang đôi bờ sông Hồng, là kỳ quan kỹ thuật vĩ đại nhất Đông Dương thời bấy giờ.</p>
      <p><strong>Chứng Nhân Lịch Sử & Vết Sẹo Kháng Chiến:</strong> Cây cầu đã kiên cường gánh chịu hàng nghìn tấn bom đạn trong chiến dịch "Điện Biên Phủ trên không" năm 1972. Dù gãy gập nhiều nhịp, quân dân Thủ đô đã thần tốc dựng cầu dã chiến để mạch máu giao thông không một ngày đứt đoạn.</p>
      <p><strong>Xóm Đường Tàu & Đời Sống Ven Sông:</strong> Những chuyến tàu đêm rền vang trên dầm thép rỉ sét, hương ngô nướng than hồng mùa đông bên bãi bồi sông Hồng là ký ức không thể nào quên của người Hà Nội.</p>
    `,
    dialogueOptions: [
      { text: 'Bạn thích nhất điều gì ở Cầu Long Biên?', reply: 'Mình yêu những vết thép rỉ màu cánh gián và tiếng bánh tàu hỏa rầm rập nghiến trên đường ray. Đó không chỉ là cây cầu, mà là một sinh mệnh cùng sống, cùng đau và cùng chiến thắng với Thủ đô.' },
      { text: 'Trải nghiệm đi dạo cầu Long Biên vào mùa đông ra sao?', reply: 'Gió mùa đông bắc từ lòng sông Hồng thổi lên lạnh buốt, nhưng tấp vào một góc cầu ăn bắp ngô nướng mỡ hành hay uống chén trà nóng thì ấm lòng vô cùng!' },
      { text: 'Tại sao lại có những nhịp dầm hình dáng khác nhau?', reply: 'Đó là những nhịp dầm dã chiến được bộ đội công binh dựng thay thế các nhịp nguyên bản bị bom phá hủy năm 1972, biểu tượng của sự bất khuất!' }
    ],
    shopItems: [
      { name: 'Huy Hiệu Kim Loại Cầu Long Biên 1972', price: '15 Xu', desc: 'Huy hiệu hình nhịp cầu thép kiên cường vươn cao', icon: '🎖️' },
      { name: 'Bắp Ngô Nướng Bờ Sông Hồng', price: '5 Xu', desc: 'Bắp nướng than hoa thơm lừng mùi mỡ hành cay nồng', icon: '🌽' },
      { name: 'Bản Đồ Ký Họa Các Cung Đường Phượt', price: '10 Xu', desc: 'Bản đồ vẽ tay các góc check-in di sản đẹp nhất Hà Nội', icon: '🗺️' },
      { name: 'Dây Vòng Tay Paracord Phượt Thủ', price: '12 Xu', desc: 'Vòng tay dây dù bện bền bỉ cho người lữ hành', icon: '🧶' }
    ]
  },
  {
    id: 'char_hanoi_elder',
    name: 'Bà Cụ Hà Nội Xưa (Bà Ngoại Phố Cổ)',
    shortName: 'Bà Cụ Vui • Nhân Chứng Sống Thăng Long',
    title: 'Nhân Chứng Sống Hơn 90 Năm Thăng Trầm Thăng Long',
    role: 'Bà cụ người Hà Nội xưa, người kể chuyện di sản Tháp Rùa',
    desc: 'Bà cụ mái tóc hoa râm, áo len xám cổ điển, nụ cười hiền hậu, chứng nhân sống của biết bao thăng trầm lịch sử.',
    avatar: 'assets/characters/avatar_hanoi_elder.png',
    bodyTexture: 'assets/characters/body_hanoi_elder_cutout.png',
    zone: 'ho_guom',
    monumentTitle: 'Tháp Rùa Cổ Kính & Huyền Tích Trả Gươm Thần Vua Lê Thái Tổ',
    greeting: '"Chào cháu lãng tử! Bà đã sống bên bờ hồ Gươm này trọn một đời người rồi. Lại đây ngồi bên bóng liễu rủ, nghe bà kể chuyện Vua Lê trả gươm thần cho Rùa Vàng cháu nhé."',
    historyText: `
      <p><strong>Tháp Rùa (Quy Sơn Tháp - 1886):</strong> Tọa lạc trên gò đất nổi giữa lòng hồ Hoàn Kiếm, nơi xưa kia chúa Trịnh dựng Tả Vọng Đình để hóng mát mùa hè. Tháp xây dựng theo phong cách giao thoa độc đáo: hệ vòm cửa cuốn Gothic của kiến trúc Pháp kết hợp mái ngói cong mũi hài truyền thống cung đình Việt.</p>
      <p><strong>Huyền Tích Thuận Thiên Kiếm:</strong> Thế kỷ 15, người anh hùng áo vải Lê Lợi dựng cờ khởi nghĩa Lam Sơn đã nhận được gươm báu Thuận Thiên. Sau 10 năm gian khổ đánh đuổi quân Minh xâm lược, khi dạo thuyền rồng trên hồ Tả Vọng, Thần Kim Quy nổi lên đón nhận lại gươm báu, từ đó hồ đổi tên thành Hồ Hoàn Kiếm (Hồ Trả Gươm).</p>
      <p><strong>Linh Hồn Tràng An:</strong> Giữa trung tâm Thủ đô nhộn nhịp, Tháp Rùa bốn mùa soi bóng mặt nước xanh lục thủy, là biểu tượng thiêng liêng của khát vọng hòa bình và độc lập tự chủ ngàn đời của dân tộc ta.</p>
    `,
    dialogueOptions: [
      { text: 'Bà ơi, Hồ Gươm ngày xưa trong trí nhớ của bà thế nào ạ?', reply: 'Ngày xưa quanh hồ tĩnh mịch lắm cháu ơi! Sáng sớm các cụ đi tập dưỡng sinh trong sương mờ, tiếng chuông chùa Báo Ân ngân nga, mặt nước hồ trong xanh như mắt ngọc bích.' },
      { text: 'Bà có từng tận mắt nhìn thấy Cụ Rùa nổi lên không ạ?', reply: 'Có chứ cháu! Mỗi dịp đại lễ hay ngày trời đẹp, Cụ Rùa lại nổi lên gò đất Tháp Rùa phơi nắng, mai rùa to bằng chiếc nong tằm, uy nghi linh thiêng lắm.' },
      { text: 'Bà có lời khuyên nào cho thế hệ trẻ ngày nay?', reply: 'Hà Nội đẹp bởi cái cốt cách thanh lịch, đi nhẹ nói khẽ, trân trọng cội nguồn. Các cháu đi khắp năm châu bốn bể, hãy luôn giữ lấy cái tâm trong sáng và tình yêu với quê hương đất nước.' }
    ],
    shopItems: [
      { name: 'Gói Cốm Vòng Bọc Lá Sen Tươi', price: '15 Xu', desc: 'Hạt cốm non xanh dẻo thơm thoang thoảng hương sen mùa thu', icon: '🌾' },
      { name: 'Mô Hình Tháp Rùa Cổ Bằng Gốm Sứ', price: '20 Xu', desc: 'Gốm men lam Bát Tràng đun củi thủ công tinh xảo', icon: '🐢' },
      { name: 'Gói Trà Sen Tây Hồ Thượng Hạng', price: '25 Xu', desc: 'Búp trà sao tay ướp ngàn bông sen bách diệp thơm ngát', icon: '🪷' },
      { name: 'Chiếc Quạt Nan Tre Thủ Công Của Bà', price: '5 Xu', desc: 'Chiếc quạt nan đơn sơ xua tan cái oi ả mùa hè', icon: '🪭' }
    ]
  }
];

// Texture cache to prevent redundant GPU loads
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
 * Tạo mô hình 3D cho 1 trong 4 nhân vật, tương thích hoàn toàn với PlayerController và NPC System
 * @param {string} characterId - 'char_photographer' | 'char_cultural_officer' | 'char_young_explorer' | 'char_hanoi_elder'
 * @param {Object} options - { isNPC: boolean, coatTexture: boolean }
 * @returns {THREE.Group} characterGroup chứa torsoGroup, headGroup, leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot
 */
export function createHanoiCharacter3D(characterId, options = {}) {
  const meta = CHARACTERS_META.find(c => c.id === characterId) || CHARACTERS_META[0];
  const isNPC = !!options.isNPC;

  const characterGroup = new THREE.Group();
  characterGroup.name = `Character_${meta.id}`;

  // Shared Skin & Common Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xefc49e,
    roughness: 0.65,
    metalness: 0.05
  });
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x151515 });

  // Base proportions per character
  let baseTorsoY = 0.95;
  let shoulderW = 0.30;
  let bodyHeight = 1.0;
  let armLength = 0.58;
  let legLength = 0.82;

  // Materials customized to match the exact photograph:
  let torsoColor, pantsColor, shoesColor, hairColor, jacketColor;

  if (meta.id === 'char_photographer') {
    // Top-Left: Adult male, grey tee, blue jeans, sneakers
    torsoColor = 0x3d4147; // Charcoal grey t-shirt
    pantsColor = 0x2b4566; // Blue denim jeans
    shoesColor = 0xcad0dc; // Light grey / white sneakers
    hairColor = 0x383533;  // Dark brown hair with grey sides
    shoulderW = 0.32;
    bodyHeight = 1.02;
  } else if (meta.id === 'char_cultural_officer') {
    // Top-Right: Elegant female, beige blazer, charcoal slacks, beige heels, brown bag
    torsoColor = 0xd8c8b4; // Warm beige blazer
    pantsColor = 0x3a3842; // Charcoal tailored slacks
    shoesColor = 0xbda692; // Warm beige heels
    hairColor = 0x181615;  // Lustrous long black hair
    shoulderW = 0.27;
    bodyHeight = 1.0;
  } else if (meta.id === 'char_young_explorer') {
    // Bottom-Left: Young male, khaki bomber, backpack, olive cargo, sneaker
    torsoColor = 0xc8bea6; // Khaki sand bomber jacket
    pantsColor = 0x424b36; // Olive green cargo pants
    shoesColor = 0x545b50; // Sage / grey trail shoes
    hairColor = 0x29211c;  // Young dark textured hair
    shoulderW = 0.31;
    bodyHeight = 1.0;
  } else {
    // Bottom-Right: Hanoi elder woman, grey knit sweater, black slacks, flat shoes
    torsoColor = 0x787b80; // Heather grey wool sweater
    pantsColor = 0x202123; // Classic black silk/wool slacks
    shoesColor = 0x1a1a1c; // Black flat shoes
    hairColor = 0xa8a8a8;  // Salt-and-pepper silver grey hair
    shoulderW = 0.28;
    bodyHeight = 0.94;
    baseTorsoY = 0.91;
  }

  const torsoMat = new THREE.MeshStandardMaterial({ color: torsoColor, roughness: 0.82, metalness: 0.05 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.85, metalness: 0.05 });
  const shoesMat = new THREE.MeshStandardMaterial({ color: shoesColor, roughness: 0.70, metalness: 0.1 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9, metalness: 0.05 });

  // 1. TORSO GROUP
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = baseTorsoY;

  // Chest / upper body
  const chestGeo = new THREE.CylinderGeometry(shoulderW * 0.72, shoulderW * 0.65, 0.48 * bodyHeight, 14);
  chestGeo.scale(1.15, 1.0, 0.76);
  const chestMesh = new THREE.Mesh(chestGeo, torsoMat);
  chestMesh.position.y = 0.24 * bodyHeight;
  chestMesh.castShadow = true;
  chestMesh.receiveShadow = true;
  torsoGroup.add(chestMesh);

  // Waist / lower torso
  const waistGeo = new THREE.CylinderGeometry(shoulderW * 0.64, shoulderW * 0.70, 0.28 * bodyHeight, 14);
  waistGeo.scale(1.1, 1.0, 0.78);
  const waistMesh = new THREE.Mesh(waistGeo, (meta.id === 'char_photographer' || meta.id === 'char_cultural_officer') ? torsoMat : torsoMat);
  waistMesh.position.y = -0.06 * bodyHeight;
  waistMesh.castShadow = true;
  torsoGroup.add(waistMesh);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.12, 10), skinMat);
  neck.position.y = 0.52 * bodyHeight;
  torsoGroup.add(neck);

  // Character-specific clothing accessories:
  if (meta.id === 'char_photographer') {
    // Belt
    const belt = new THREE.Mesh(
      new THREE.CylinderGeometry(shoulderW * 0.69, shoulderW * 0.71, 0.05, 14),
      new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5 })
    );
    belt.scale.set(1.12, 1.0, 0.8);
    belt.position.y = -0.16 * bodyHeight;
    torsoGroup.add(belt);

    // Silver belt buckle
    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.04, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.9, roughness: 0.2 })
    );
    buckle.position.set(0, -0.16 * bodyHeight, 0.16);
    torsoGroup.add(buckle);

    // Smartphone / Leica Rangefinder Camera held in hands
    const cameraMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.10, 0.035),
      new THREE.MeshStandardMaterial({ color: 0x1f2226, metalness: 0.8, roughness: 0.2 })
    );
    cameraMesh.position.set(0, 0.26, 0.28);
    // Camera lens glass
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.03, 0.02, 12),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.95, roughness: 0.1 })
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0.03, 0, 0.02);
    cameraMesh.add(lens);
    torsoGroup.add(cameraMesh);

  } else if (meta.id === 'char_cultural_officer') {
    // Blazer Lapels & White Blouse V-neck
    const blouse = new THREE.Mesh(
      new THREE.PlaneGeometry(0.12, 0.22),
      new THREE.MeshBasicMaterial({ color: 0xf5f0ea, side: THREE.DoubleSide })
    );
    blouse.position.set(0, 0.32 * bodyHeight, 0.155);
    torsoGroup.add(blouse);

    // Crossbody leather bag (Nâu hạt dẻ Tràng An)
    const bagMat = new THREE.MeshStandardMaterial({ color: 0x6e3d25, roughness: 0.55, metalness: 0.1 });
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.065), bagMat);
    bag.position.set(-0.25, -0.05 * bodyHeight, 0.05);
    bag.rotation.z = 0.15;
    torsoGroup.add(bag);

    // Bag strap
    const strapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.20, 0.45 * bodyHeight, 0.08),
      new THREE.Vector3(0.02, 0.20 * bodyHeight, 0.16),
      new THREE.Vector3(-0.22, -0.02 * bodyHeight, 0.06)
    ]);
    const strap = new THREE.Mesh(new THREE.TubeGeometry(strapCurve, 12, 0.012, 6, false), bagMat);
    torsoGroup.add(strap);

  } else if (meta.id === 'char_young_explorer') {
    // Hiking Backpack on back
    const packMat = new THREE.MeshStandardMaterial({ color: 0x2b2e34, roughness: 0.85, metalness: 0.05 });
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45 * bodyHeight, 0.18), packMat);
    pack.position.set(0, 0.22 * bodyHeight, -0.18);
    torsoGroup.add(pack);

    // Backpack straps
    const packStrapMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1d, roughness: 0.9 });
    for (let s of [-1, 1]) {
      const strapMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 6), packStrapMat);
      strapMesh.position.set(s * 0.14, 0.24 * bodyHeight, 0.08);
      torsoGroup.add(strapMesh);
    }

    // Bomber zipper line
    const zipLine = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.44 * bodyHeight, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x757575, metalness: 0.7, roughness: 0.3 })
    );
    zipLine.position.set(0, 0.22 * bodyHeight, 0.16);
    torsoGroup.add(zipLine);

  } else if (meta.id === 'char_hanoi_elder') {
    // Wool collar ribbing
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.025, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x66696e, roughness: 0.95 })
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.48 * bodyHeight;
    torsoGroup.add(collar);
  }

  // 2. HEAD & FACE GROUP
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.65 * bodyHeight;

  // Skull & Face
  const skullGeo = new THREE.SphereGeometry(0.155, 16, 16);
  skullGeo.scale(0.88, 1.15, 1.0);
  const skullMesh = new THREE.Mesh(skullGeo, skinMat);
  skullMesh.castShadow = true;
  headGroup.add(skullMesh);

  // Nose
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 0.07, 6), skinMat);
  nose.rotation.x = 0.35;
  nose.position.set(0, 0.01, 0.16);
  headGroup.add(nose);

  // Eyes & Ears
  for (let s of [-1, 1]) {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), eyeWhiteMat);
    eyeWhite.scale.set(1.2, 0.7, 0.5);
    eyeWhite.position.set(s * 0.055, 0.04, 0.142);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), pupilMat);
    pupil.position.set(s * 0.055, 0.04, 0.153);

    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), skinMat);
    ear.scale.set(0.4, 0.9, 0.7);
    ear.position.set(s * 0.145, 0.02, 0);

    headGroup.add(eyeWhite, pupil, ear);
  }

  // Hair styling according to character:
  if (meta.id === 'char_cultural_officer') {
    // Long straight black hair down back and over shoulders
    const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 14), hairMat);
    hairCrown.position.set(0, 0.06, -0.02);
    hairCrown.scale.set(0.95, 1.05, 1.08);
    headGroup.add(hairCrown);

    // Hair strands flowing down back
    const hairBack = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.45, 10), hairMat);
    hairBack.position.set(0, -0.15, -0.09);
    hairBack.rotation.x = 0.1;
    headGroup.add(hairBack);

  } else if (meta.id === 'char_hanoi_elder') {
    // Short neat wavy silver-grey hair
    const elderHair = new THREE.Mesh(new THREE.SphereGeometry(0.178, 14, 14), hairMat);
    elderHair.position.set(0, 0.06, -0.02);
    elderHair.scale.set(0.96, 1.05, 1.05);
    headGroup.add(elderHair);

  } else {
    // Male styled short crop hair
    const maleHair = new THREE.Mesh(new THREE.SphereGeometry(0.172, 14, 14), hairMat);
    maleHair.position.set(0, 0.07, -0.02);
    maleHair.scale.set(0.94, 1.02, 1.04);
    headGroup.add(maleHair);
  }

  torsoGroup.add(headGroup);
  characterGroup.add(torsoGroup);

  // 3. ARMS & HANDS (Dual pivots for walk cycle and posing)
  let leftArmPivot = new THREE.Group();
  let rightArmPivot = new THREE.Group();

  for (let s of [-1, 1]) {
    const armPivot = (s === -1) ? leftArmPivot : rightArmPivot;
    armPivot.position.set(s * (shoulderW + 0.03), baseTorsoY + 0.42 * bodyHeight, 0);

    // Shoulder sphere
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.078, 8, 8), torsoMat);
    armPivot.add(shoulder);

    // Upper arm
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.058, 0.28, 8), torsoMat);
    upperArm.position.y = -0.15;
    upperArm.castShadow = true;
    armPivot.add(upperArm);

    // Forearm
    const forearmMat = (meta.id === 'char_photographer') ? skinMat : torsoMat; // T-shirt has bare forearms!
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.26, 8), forearmMat);
    forearm.position.y = -0.41;
    forearm.castShadow = true;
    armPivot.add(forearm);

    // Hand
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), skinMat);
    hand.scale.set(0.9, 1.2, 0.7);
    hand.position.y = -0.56;
    armPivot.add(hand);

    // Poses for specific characters when idle/NPC:
    if (meta.id === 'char_photographer') {
      // Arms raised holding camera up in front of chest
      armPivot.rotation.x = -0.85;
      armPivot.rotation.y = s * -0.45;
      armPivot.rotation.z = s * 0.15;
    } else if (meta.id === 'char_hanoi_elder') {
      // Hands clasped softly in front of abdomen
      armPivot.rotation.x = -0.55;
      armPivot.rotation.y = s * -0.42;
      armPivot.rotation.z = s * 0.12;
    }

    characterGroup.add(armPivot);
  }

  // 4. LEGS & SHOES
  let leftLegPivot = new THREE.Group();
  let rightLegPivot = new THREE.Group();

  for (let s of [-1, 1]) {
    const legPivot = (s === -1) ? leftLegPivot : rightLegPivot;
    legPivot.position.set(s * 0.125, 0.82 * bodyHeight, 0);

    // Thigh
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.072, 0.40, 8), pantsMat);
    thigh.position.y = -0.20;
    thigh.castShadow = true;
    legPivot.add(thigh);

    // Knee
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.072, 6, 6), pantsMat);
    knee.position.y = -0.40;
    legPivot.add(knee);

    // Calf
    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.38, 8), pantsMat);
    calf.position.y = -0.60;
    calf.castShadow = true;
    legPivot.add(calf);

    // Shoe
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.80, 0.04);

    const shoeSole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.22, 10), shoesMat);
    shoeSole.rotation.x = Math.PI / 2;
    shoeSole.scale.set(0.85, 1.2, 0.55);
    shoeGroup.add(shoeSole);

    legPivot.add(shoeGroup);
    characterGroup.add(legPivot);
  }

  // 5. HYBRID HIGH-RES PHOTO CARD (Exact photorealistic visual match from uploaded reference)
  if (meta.bodyTexture) {
    const photoTex = loadCachedTexture(meta.bodyTexture);
    const planeGeo = new THREE.PlaneGeometry(0.92, 1.84);
    const photoMat = new THREE.MeshBasicMaterial({
      map: photoTex,
      transparent: true,
      alphaTest: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const photoPlane = new THREE.Mesh(planeGeo, photoMat);
    photoPlane.position.set(0, 0.92, 0.04);
    photoPlane.renderOrder = 5;
    characterGroup.add(photoPlane);
    characterGroup.photoPlane = photoPlane;
  }

  // 6. CONTACT SHADOW
  if (typeof document !== 'undefined') {
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 64;
    const sctx = shadowCanvas.getContext('2d');
    const grad = sctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 64, 64);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.75, 0.75),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.8, depthWrite: false })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.02;
    characterGroup.add(shadowPlane);
  }

  // Store references for animations
  characterGroup.torsoGroup = torsoGroup;
  characterGroup.headGroup = headGroup;
  characterGroup.leftArmPivot = leftArmPivot;
  characterGroup.rightArmPivot = rightArmPivot;
  characterGroup.leftLegPivot = leftLegPivot;
  characterGroup.rightLegPivot = rightLegPivot;
  characterGroup.baseTorsoY = baseTorsoY;
  characterGroup.characterMeta = meta;

  // NPC Breathing / Idle animation helper
  characterGroup.idleTime = Math.random() * 10;
  characterGroup.updateNPCAnimation = function(delta) {
    this.idleTime += delta * 1.8;
    // Breathing subtle torso elevation
    const breath = Math.sin(this.idleTime) * 0.015;
    this.torsoGroup.position.y = this.baseTorsoY + breath;
    // Subtle head tilt
    this.headGroup.rotation.y = Math.sin(this.idleTime * 0.5) * 0.08;
    this.headGroup.rotation.z = Math.cos(this.idleTime * 0.4) * 0.02;
  };

  return characterGroup;
}
