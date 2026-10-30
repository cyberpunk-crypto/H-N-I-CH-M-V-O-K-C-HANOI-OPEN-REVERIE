/**
 * CharacterFactory.js - Bộ tạo mô hình 3D CON NGƯỜI THẬT SỰ (True 3D Humanoid Mesh with Rig Hierarchy)
 * Đáp ứng 100% chỉ thị của Sếp Tổng: Xóa bỏ hoàn toàn billboard 2D plane cho nhân vật người chơi.
 * Toàn bộ cơ thể được dựng bằng hình học 3D thật sự, có khung xương phân cấp và khớp xoay sinh học.
 * 
 * 4 Nhân vật hoàn chỉnh:
 * 1. char_nu_sinh_ao_dai: Nữ Sinh Tràng An • Áo Dài Trắng Nón Lá 3D
 * 2. char_co_gai_ao_ba_ba: Cô Gái Phố Thị • Áo Bà Ba Hồng Cánh Sen Khăn Rằn Nón Lá 3D
 * 3. char_nam_tri_thuc_suit: Trí Thức Hiện Đại • Âu Phục Suit Navy Lịch Lãm 3D
 * 4. char_nam_ao_dai_gam: Quý Nam Hà Thành • Áo Dài Gấm Xanh Sapphire Khăn Xếp 3D
 * 
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 * Tuân thủ chuẩn mực Phần 8 trong GAME_SPEC.md
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
      { text: 'Xin em kể thêm về Tháp Bút - Đài Nghiên?', reply: 'Tháp Bút dựng trên núi Ngọc Bội, đỉnh tháp vươn cao như chiếc bút lông viết lên nền trời xanh thẫm, răn dạy học trò nước Nam học chữ phải đi đôi với luyện tâm rèn đức.' }
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
      { text: 'Dưới góc độ kiến trúc, kết cấu dầm Eiffel của cầu có gì đặc sắc?', reply: 'Hệ giàn thép liên kết bằng đinh tán nóng uốn lượn hình sin nhấp nhô như lưng rồng châu Á. Kết cấu này vừa phân tán lực cản gió sông Hồng cực tốt, vừa tạo nên vẻ đẹp thanh thoát vượt thời gian.' },
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

/**
 * Tìm metadata nhân vật theo ID (hỗ trợ cả legacy IDs)
 */
export function findCharacterMeta(id) {
  if (!id) return CHARACTERS_META[0];
  return CHARACTERS_META.find(c => c.id === id || (c.legacyIds && c.legacyIds.includes(id))) || CHARACTERS_META[0];
}

/**
 * Helper tạo Mesh 3D chuẩn PBR có bật đổ bóng
 */
function createPBRMesh(geo, mat) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * TẠO MÔ HÌNH CON NGƯỜI 3D THẬT SỰ CÓ CÂY KHUNG XƯƠNG PHÂN CẤP (TRUE 3D RIGGED MESH)
 * Chuẩn mực tuyệt đối: Không dùng mặt phẳng 2D Plane/Billboard cho nhân vật người chơi!
 * 
 * @param {string} characterId - ID của 1 trong 4 nhân vật
 * @param {Object} options - Các tùy chọn bổ sung
 * @returns {THREE.Group} characterGroup chứa cây xương chuẩn tại .rig
 */
export function createHanoiCharacter3D(characterId, options = {}) {
  const meta = findCharacterMeta(characterId);
  const charId = meta.id;

  const characterGroup = new THREE.Group();
  characterGroup.name = `HanoiCharacter_${charId}`;

  // ==========================================
  // 1. MÀU SẮC & VẬT LIỆU CHUẨN PBR THEO NHÂN VẬT
  // ==========================================
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xf5cfb3,
    roughness: 0.55,
    metalness: 0.05
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x161312,
    roughness: 0.75,
    metalness: 0.08
  });

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.15,
    metalness: 0.2
  });

  const lipMat = new THREE.MeshStandardMaterial({
    color: (charId === 'char_nu_sinh_ao_dai' || charId === 'char_co_gai_ao_ba_ba') ? 0xd4625b : 0xc7786f,
    roughness: 0.45
  });

  // Vật liệu quần áo đặc trưng
  let clothTorsoMat, clothLimbMat, clothPantsMat, shoeMat;
  if (charId === 'char_nu_sinh_ao_dai') {
    // Lụa tơ tằm trắng ngà
    clothTorsoMat = new THREE.MeshStandardMaterial({ color: 0xfbfcfd, roughness: 0.35, metalness: 0.02 });
    clothLimbMat = new THREE.MeshStandardMaterial({ color: 0xfbfcfd, roughness: 0.35, metalness: 0.02 });
    clothPantsMat = new THREE.MeshStandardMaterial({ color: 0xf2f2f6, roughness: 0.45 });
    shoeMat = new THREE.MeshStandardMaterial({ color: 0x8a5229, roughness: 0.65 }); // Guốc mộc gỗ
  } else if (charId === 'char_co_gai_ao_ba_ba') {
    // Áo bà ba hồng cánh sen, quần lụa đen
    clothTorsoMat = new THREE.MeshStandardMaterial({ color: 0xdf648a, roughness: 0.62 });
    clothLimbMat = new THREE.MeshStandardMaterial({ color: 0xdf648a, roughness: 0.62 });
    clothPantsMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.55 });
    shoeMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.7 });
  } else if (charId === 'char_nam_tri_thuc_suit') {
    // Suit jacket navy lịch lãm, giày tây Oxford bóng
    clothTorsoMat = new THREE.MeshStandardMaterial({ color: 0x1e2e4a, roughness: 0.55 });
    clothLimbMat = new THREE.MeshStandardMaterial({ color: 0x1e2e4a, roughness: 0.55 });
    clothPantsMat = new THREE.MeshStandardMaterial({ color: 0x1e2e4a, roughness: 0.58 });
    shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.22, metalness: 0.3 }); // Da đen bóng
  } else {
    // Áo dài gấm xanh ngũ thân, quần trắng ngà
    clothTorsoMat = new THREE.MeshStandardMaterial({ color: 0x1b3b6f, roughness: 0.40, metalness: 0.15 });
    clothLimbMat = new THREE.MeshStandardMaterial({ color: 0x1b3b6f, roughness: 0.40, metalness: 0.15 });
    clothPantsMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.48 });
    shoeMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.45 });
  }

  // ==========================================
  // 2. KHỞI TẠO CÂY KHUNG XƯƠNG PHÂN CẤP (RIG TREE)
  // ==========================================
  const baseTorsoY = 0.95;

  // 2.1. Đĩa bóng tiếp xúc mặt đất chân thực (Shadow Blob)
  const shadowGeo = new THREE.CircleGeometry(0.38, 24);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.45,
    depthWrite: false
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  characterGroup.add(shadowMesh);

  // 2.2. Khung chậu (Pelvis Group) tại cao độ y = 0.95m
  const pelvisGroup = new THREE.Group();
  pelvisGroup.name = 'Joint_Pelvis';
  pelvisGroup.position.set(0, baseTorsoY, 0);
  characterGroup.add(pelvisGroup);

  // Hình học khung chậu (bo tròn mềm mại)
  const pelvisMesh = createPBRMesh(
    new THREE.CylinderGeometry(0.16, 0.15, 0.14, 16),
    clothPantsMat
  );
  pelvisMesh.position.set(0, -0.04, 0);
  pelvisGroup.add(pelvisMesh);

  // 2.3. Thân mình (Torso Group)
  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'Joint_Torso';
  torsoGroup.position.set(0, 0, 0);
  pelvisGroup.add(torsoGroup);

  // Thân dưới / eo thon 3D
  const torsoMesh = createPBRMesh(
    new THREE.CylinderGeometry(0.155, 0.165, 0.30, 16),
    clothTorsoMat
  );
  torsoMesh.position.set(0, 0.15, 0);
  torsoGroup.add(torsoMesh);

  // Nhóm trang phục & tà áo (Clothing Group)
  const clothingGroup = new THREE.Group();
  clothingGroup.name = 'ClothingGroup';
  torsoGroup.add(clothingGroup);

  // Tà trước (Front Flap) & Tà sau (Back Flap)
  const frontFlapGroup = new THREE.Group();
  frontFlapGroup.name = 'Joint_FrontFlap';
  frontFlapGroup.position.set(0, 0.02, 0.10);
  clothingGroup.add(frontFlapGroup);

  const backFlapGroup = new THREE.Group();
  backFlapGroup.name = 'Joint_BackFlap';
  backFlapGroup.position.set(0, 0.02, -0.10);
  clothingGroup.add(backFlapGroup);

  // Tạo tà áo 3D hình học cho Áo Dài (Nữ & Nam) hoặc vạt xẻ cho Áo Bà Ba / Vest
  if (charId === 'char_nu_sinh_ao_dai' || charId === 'char_nam_ao_dai_gam') {
    const flapWidthTop = 0.34;
    const flapWidthBottom = 0.42;
    const flapLen = charId === 'char_nu_sinh_ao_dai' ? 0.72 : 0.76;

    // Tà trước 3D đa phân đoạn
    const frontFlapGeo = new THREE.PlaneGeometry(flapWidthTop, flapLen, 4, 8);
    // Uốn cong nhẹ theo dáng người
    const posAttrF = frontFlapGeo.attributes.position;
    for (let i = 0; i < posAttrF.count; i++) {
      const yVal = posAttrF.getY(i);
      const ratio = (yVal + flapLen / 2) / flapLen; // 0 ở dưới, 1 ở trên
      const xVal = posAttrF.getX(i);
      // Xòe nhẹ ở dưới
      posAttrF.setX(i, xVal * (1.0 + (1 - ratio) * 0.25));
      // Uốn nhẹ ra trước
      posAttrF.setZ(i, Math.sin(ratio * Math.PI) * 0.025);
    }
    frontFlapGeo.computeVertexNormals();

    const flapMat = new THREE.MeshStandardMaterial({
      color: clothTorsoMat.color,
      roughness: clothTorsoMat.roughness,
      metalness: clothTorsoMat.metalness,
      side: THREE.DoubleSide
    });

    const frontFlapMesh = createPBRMesh(frontFlapGeo, flapMat);
    frontFlapMesh.position.set(0, -flapLen / 2, 0.015);
    frontFlapGroup.add(frontFlapMesh);

    // Tà sau 3D đa phân đoạn
    const backFlapGeo = frontFlapGeo.clone();
    const backFlapMesh = createPBRMesh(backFlapGeo, flapMat);
    backFlapMesh.position.set(0, -flapLen / 2, -0.015);
    backFlapGroup.add(backFlapMesh);
  } else if (charId === 'char_co_gai_ao_ba_ba') {
    // Vạt áo bà ba ngắn hơn, buông qua hông ~0.25m
    const flapGeo = new THREE.PlaneGeometry(0.32, 0.26, 2, 4);
    const flapMat = new THREE.MeshStandardMaterial({
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
  } else if (charId === 'char_nam_tri_thuc_suit') {
    // Vạt áo vest xòe nhẹ sau lưng
    const flapGeo = new THREE.PlaneGeometry(0.36, 0.30, 2, 4);
    const flapMat = new THREE.MeshStandardMaterial({
      color: clothTorsoMat.color,
      roughness: clothTorsoMat.roughness,
      side: THREE.DoubleSide
    });
    const bMesh = createPBRMesh(flapGeo, flapMat);
    bMesh.position.set(0, -0.15, -0.01);
    backFlapGroup.add(bMesh);
  }

  // 2.4. Ngực & Thân trên (Chest Group)
  const chestGroup = new THREE.Group();
  chestGroup.name = 'Joint_Chest';
  chestGroup.position.set(0, 0.30, 0);
  torsoGroup.add(chestGroup);

  const chestMesh = createPBRMesh(
    new THREE.CylinderGeometry(0.18, 0.16, 0.22, 16),
    clothTorsoMat
  );
  chestMesh.scale.set(1.15, 1.0, 0.85); // Hơi dẹt elip theo khuôn ngực
  chestMesh.position.set(0, 0.11, 0);
  chestGroup.add(chestMesh);

  // Chi tiết đặc biệt theo nhân vật ở vùng ngực:
  if (charId === 'char_nu_sinh_ao_dai') {
    // Cổ áo dài đứng cao 3cm
    const aoDaiCollar = createPBRMesh(
      new THREE.CylinderGeometry(0.068, 0.072, 0.05, 16),
      clothTorsoMat
    );
    aoDaiCollar.position.set(0, 0.22, 0);
    chestGroup.add(aoDaiCollar);
  } else if (charId === 'char_nam_tri_thuc_suit') {
    // Áo sơ mi trắng bên trong
    const shirtMesh = createPBRMesh(
      new THREE.BoxGeometry(0.12, 0.20, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
    );
    shirtMesh.position.set(0, 0.12, 0.08);
    chestGroup.add(shirtMesh);

    // Cà vạt đỏ mận 3D vát nhọn
    const tieMesh = createPBRMesh(
      new THREE.BoxGeometry(0.042, 0.18, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x821c2c, roughness: 0.4 })
    );
    tieMesh.position.set(0, 0.10, 0.10);
    chestGroup.add(tieMesh);

    // Ve áo Notch Lapel dựng nổi 3D
    const lapelGeo = new THREE.BoxGeometry(0.045, 0.16, 0.02);
    const lapelMat = new THREE.MeshStandardMaterial({ color: 0x18243b, roughness: 0.5 });
    const leftLapel = createPBRMesh(lapelGeo, lapelMat);
    leftLapel.position.set(-0.08, 0.12, 0.095);
    leftLapel.rotation.z = -0.22;
    chestGroup.add(leftLapel);

    const rightLapel = createPBRMesh(lapelGeo, lapelMat);
    rightLapel.position.set(0.08, 0.12, 0.095);
    rightLapel.rotation.z = 0.22;
    chestGroup.add(rightLapel);

    // Cúc áo mạ đồng vàng
    const buttonMat = new THREE.MeshStandardMaterial({ color: 0xc5a059, metalness: 0.8, roughness: 0.2 });
    for (let b = 0; b < 2; b++) {
      const btn = createPBRMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.008, 8), buttonMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, 0.05 - b * 0.06, 0.10);
      chestGroup.add(btn);
    }
  } else if (charId === 'char_nam_ao_dai_gam') {
    // Cổ đứng cao truyền thống
    const collar = createPBRMesh(
      new THREE.CylinderGeometry(0.07, 0.075, 0.055, 16),
      clothTorsoMat
    );
    collar.position.set(0, 0.22, 0);
    chestGroup.add(collar);

    // 5 Khuy cài ngọc bích bên ngực phải
    const jadeMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.2, metalness: 0.15 });
    for (let k = 0; k < 5; k++) {
      const jadeBtn = createPBRMesh(new THREE.SphereGeometry(0.012, 8, 8), jadeMat);
      jadeBtn.position.set(0.035 + k * 0.018, 0.20 - k * 0.035, 0.095);
      chestGroup.add(jadeBtn);
    }
  } else if (charId === 'char_co_gai_ao_ba_ba') {
    // Khăn rằn caro đen trắng vắt qua cổ và vai rủ xuống ngực
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.7 });
    // Vòng khăn ôm cổ
    const scarfRing = createPBRMesh(
      new THREE.TorusGeometry(0.085, 0.022, 8, 20),
      scarfMat
    );
    scarfRing.rotation.x = Math.PI / 2;
    scarfRing.position.set(0, 0.20, 0);
    chestGroup.add(scarfRing);

    // Dải khăn rủ trước ngực
    const scarfDropL = createPBRMesh(new THREE.BoxGeometry(0.05, 0.24, 0.015), scarfMat);
    scarfDropL.position.set(-0.06, 0.08, 0.095);
    scarfDropL.rotation.z = -0.15;
    chestGroup.add(scarfDropL);

    const scarfDropR = createPBRMesh(new THREE.BoxGeometry(0.05, 0.24, 0.015), scarfMat);
    scarfDropR.position.set(0.06, 0.08, 0.095);
    scarfDropR.rotation.z = 0.15;
    chestGroup.add(scarfDropR);

    // Nón lá máng sau lưng áo
    const backHatMat = new THREE.MeshStandardMaterial({ color: 0xe0caa0, roughness: 0.75 });
    const backHatCone = createPBRMesh(new THREE.ConeGeometry(0.28, 0.16, 24), backHatMat);
    backHatCone.rotation.x = Math.PI * 0.42;
    backHatCone.position.set(0, 0.08, -0.16);
    chestGroup.add(backHatCone);
  }

  // 2.5. Khớp cổ (Neck Group)
  const neckGroup = new THREE.Group();
  neckGroup.name = 'Joint_Neck';
  neckGroup.position.set(0, 0.23, 0);
  chestGroup.add(neckGroup);

  const neckMesh = createPBRMesh(
    new THREE.CylinderGeometry(0.055, 0.065, 0.10, 16),
    skinMat
  );
  neckMesh.position.set(0, 0.05, 0);
  neckGroup.add(neckMesh);

  // 2.6. Đầu & Khuôn mặt 3D (Head Group)
  const headGroup = new THREE.Group();
  headGroup.name = 'Joint_Head';
  headGroup.position.set(0, 0.10, 0);
  neckGroup.add(headGroup);

  // Hình học đầu bo tròn tỉ lệ vàng Á Đông
  const headMesh = createPBRMesh(
    new THREE.SphereGeometry(0.125, 20, 20),
    skinMat
  );
  headMesh.scale.set(0.95, 1.08, 0.98);
  headMesh.position.set(0, 0.07, 0);
  headGroup.add(headMesh);

  // Các chi tiết mặt 3D
  // Mắt đen bóng
  const eyeL = createPBRMesh(new THREE.SphereGeometry(0.014, 8, 8), eyeMat);
  eyeL.position.set(-0.042, 0.085, 0.11);
  headGroup.add(eyeL);

  const eyeR = createPBRMesh(new THREE.SphereGeometry(0.014, 8, 8), eyeMat);
  eyeR.position.set(0.042, 0.085, 0.11);
  headGroup.add(eyeR);

  // Lông mày
  const browMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const browL = createPBRMesh(new THREE.BoxGeometry(0.035, 0.006, 0.01), browMat);
  browL.position.set(-0.042, 0.105, 0.115);
  browL.rotation.z = -0.1;
  headGroup.add(browL);

  const browR = createPBRMesh(new THREE.BoxGeometry(0.035, 0.006, 0.01), browMat);
  browR.position.set(0.042, 0.105, 0.115);
  browR.rotation.z = 0.1;
  headGroup.add(browR);

  // Mũi 3D
  const noseMesh = createPBRMesh(
    new THREE.ConeGeometry(0.016, 0.038, 4),
    skinMat
  );
  noseMesh.rotation.x = Math.PI / 2;
  noseMesh.position.set(0, 0.065, 0.125);
  headGroup.add(noseMesh);

  // Miệng 3D
  const lipMesh = createPBRMesh(
    new THREE.BoxGeometry(0.038, 0.012, 0.012),
    lipMat
  );
  lipMesh.position.set(0, 0.032, 0.115);
  headGroup.add(lipMesh);

  // Tóc 3D
  const hairShell = createPBRMesh(
    new THREE.SphereGeometry(0.132, 16, 16),
    hairMat
  );
  hairShell.scale.set(0.96, 1.05, 1.02);
  hairShell.position.set(0, 0.08, -0.015);
  headGroup.add(hairShell);

  if (charId === 'char_nu_sinh_ao_dai') {
    // Mái tóc đen dài buông xõa sau lưng đến thắt lưng
    const longHairGeo = new THREE.CylinderGeometry(0.07, 0.12, 0.42, 12);
    const longHairMesh = createPBRMesh(longHairGeo, hairMat);
    longHairMesh.position.set(0, -0.12, -0.09);
    headGroup.add(longHairMesh);
  }

  // 2.7. Phụ kiện đầu 3D (Accessory Head Group)
  const accessoryHeadGroup = new THREE.Group();
  accessoryHeadGroup.name = 'Joint_AccessoryHead';
  accessoryHeadGroup.position.set(0, 0.11, 0);
  headGroup.add(accessoryHeadGroup);

  if (charId === 'char_nu_sinh_ao_dai') {
    // 3D Conical Nón Lá hoàn chỉnh: Chóp nón + Vành nan tre + Quai nón
    const nonLaMat = new THREE.MeshStandardMaterial({
      color: 0xeedbb2,
      roughness: 0.72,
      side: THREE.DoubleSide
    });
    const coneGeo = new THREE.ConeGeometry(0.34, 0.22, 32);
    const nonLaCone = createPBRMesh(coneGeo, nonLaMat);
    nonLaCone.position.set(0, 0.09, 0);
    accessoryHeadGroup.add(nonLaCone);

    // Nan tre viền vành nón
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xc8aa6c, roughness: 0.65 });
    const rimMesh = createPBRMesh(new THREE.TorusGeometry(0.34, 0.012, 8, 32), rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.set(0, -0.02, 0);
    accessoryHeadGroup.add(rimMesh);

    // Quai nón dải lụa hồng cánh sen buông nhẹ dưới cằm
    const quaiMat = new THREE.MeshStandardMaterial({ color: 0xe87a90, roughness: 0.5 });
    const quaiMesh = createPBRMesh(new THREE.TorusGeometry(0.12, 0.008, 6, 20), quaiMat);
    quaiMesh.position.set(0, -0.06, 0.02);
    accessoryHeadGroup.add(quaiMesh);

    // Nón đội hơi nghiêng nhẹ e ấp
    accessoryHeadGroup.rotation.x = -0.08;
    accessoryHeadGroup.rotation.z = 0.04;
  } else if (charId === 'char_nam_tri_thuc_suit') {
    // Kính mắt trí thức gọng kim loại mạ vàng 3D
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });
    const frameL = createPBRMesh(new THREE.TorusGeometry(0.022, 0.004, 6, 16), glassMat);
    frameL.position.set(-0.042, -0.025, 0.12);
    accessoryHeadGroup.add(frameL);

    const frameR = createPBRMesh(new THREE.TorusGeometry(0.022, 0.004, 6, 16), glassMat);
    frameR.position.set(0.042, -0.025, 0.12);
    accessoryHeadGroup.add(frameR);

    const bridge = createPBRMesh(new THREE.BoxGeometry(0.02, 0.004, 0.004), glassMat);
    bridge.position.set(0, -0.025, 0.125);
    accessoryHeadGroup.add(bridge);
  } else if (charId === 'char_nam_ao_dai_gam') {
    // Khăn xếp truyền thống 3D (Khăn đóng quấn nhiều nếp)
    const turbanMat = new THREE.MeshStandardMaterial({ color: 0x142036, roughness: 0.7 });
    for (let t = 0; t < 5; t++) {
      const wrapRing = createPBRMesh(
        new THREE.TorusGeometry(0.130 + t * 0.003, 0.016, 8, 24),
        turbanMat
      );
      wrapRing.rotation.x = Math.PI / 2;
      wrapRing.position.set(0, -0.02 + t * 0.018, 0);
      accessoryHeadGroup.add(wrapRing);
    }
  }

  // 2.8. CÁNH TAY TRÁI (LEFT ARM RIG)
  const leftShoulderGroup = new THREE.Group();
  leftShoulderGroup.name = 'Joint_LeftShoulder';
  leftShoulderGroup.position.set(-0.21, 0.18, 0);
  chestGroup.add(leftShoulderGroup);

  // Khớp vai bi
  const leftShoulderJointMesh = createPBRMesh(new THREE.SphereGeometry(0.052, 12, 12), clothLimbMat);
  leftShoulderGroup.add(leftShoulderJointMesh);

  // Bắp tay trái 3D
  const leftUpperArm = new THREE.Group();
  leftUpperArm.name = 'Joint_LeftUpperArm';
  leftShoulderGroup.add(leftUpperArm);

  const leftUpperArmMesh = createPBRMesh(
    new THREE.CylinderGeometry(0.045, 0.040, 0.24, 14),
    clothLimbMat
  );
  leftUpperArmMesh.position.set(0, -0.12, 0);
  leftUpperArm.add(leftUpperArmMesh);

  // Khuỷu tay trái
  const leftElbowGroup = new THREE.Group();
  leftElbowGroup.name = 'Joint_LeftElbow';
  leftElbowGroup.position.set(0, -0.26, 0);
  leftUpperArm.add(leftElbowGroup);

  const leftElbowJointMesh = createPBRMesh(new THREE.SphereGeometry(0.042, 12, 12), clothLimbMat);
  leftElbowGroup.add(leftElbowJointMesh);

  // Cẳng tay trái 3D
  const leftLowerArm = new THREE.Group();
  leftLowerArm.name = 'Joint_LeftLowerArm';
  leftElbowGroup.add(leftLowerArm);

  const leftLowerArmMesh = createPBRMesh(
    new THREE.CylinderGeometry(0.040, 0.034, 0.22, 14),
    clothLimbMat
  );
  leftLowerArmMesh.position.set(0, -0.11, 0);
  leftLowerArm.add(leftLowerArmMesh);

  // Bàn tay trái 3D
  const leftHandGroup = new THREE.Group();
  leftHandGroup.name = 'Joint_LeftHand';
  leftHandGroup.position.set(0, -0.24, 0);
  leftLowerArm.add(leftHandGroup);

  const leftHandMesh = createPBRMesh(
    new THREE.BoxGeometry(0.052, 0.09, 0.03),
    skinMat
  );
  leftHandMesh.position.set(0, -0.045, 0);
  leftHandGroup.add(leftHandMesh);

  // 2.9. CÁNH TAY PHẢI (RIGHT ARM RIG)
  const rightShoulderGroup = new THREE.Group();
  rightShoulderGroup.name = 'Joint_RightShoulder';
  rightShoulderGroup.position.set(0.21, 0.18, 0);
  chestGroup.add(rightShoulderGroup);

  const rightShoulderJointMesh = createPBRMesh(new THREE.SphereGeometry(0.052, 12, 12), clothLimbMat);
  rightShoulderGroup.add(rightShoulderJointMesh);

  // Bắp tay phải 3D
  const rightUpperArm = new THREE.Group();
  rightUpperArm.name = 'Joint_RightUpperArm';
  rightShoulderGroup.add(rightUpperArm);

  const rightUpperArmMesh = createPBRMesh(
    new THREE.CylinderGeometry(0.045, 0.040, 0.24, 14),
    clothLimbMat
  );
  rightUpperArmMesh.position.set(0, -0.12, 0);
  rightUpperArm.add(rightUpperArmMesh);

  // Khuỷu tay phải
  const rightElbowGroup = new THREE.Group();
  rightElbowGroup.name = 'Joint_RightElbow';
  rightElbowGroup.position.set(0, -0.26, 0);
  rightUpperArm.add(rightElbowGroup);

  const rightElbowJointMesh = createPBRMesh(new THREE.SphereGeometry(0.042, 12, 12), clothLimbMat);
  rightElbowGroup.add(rightElbowJointMesh);

  // Cẳng tay phải 3D
  const rightLowerArm = new THREE.Group();
  rightLowerArm.name = 'Joint_RightLowerArm';
  rightElbowGroup.add(rightLowerArm);

  const rightLowerArmMesh = createPBRMesh(
    new THREE.CylinderGeometry(0.040, 0.034, 0.22, 14),
    clothLimbMat
  );
  rightLowerArmMesh.position.set(0, -0.11, 0);
  rightLowerArm.add(rightLowerArmMesh);

  // Bàn tay phải 3D
  const rightHandGroup = new THREE.Group();
  rightHandGroup.name = 'Joint_RightHand';
  rightHandGroup.position.set(0, -0.24, 0);
  rightLowerArm.add(rightHandGroup);

  const rightHandMesh = createPBRMesh(
    new THREE.BoxGeometry(0.052, 0.09, 0.03),
    skinMat
  );
  rightHandMesh.position.set(0, -0.045, 0);
  rightHandGroup.add(rightHandMesh);

  // 2.10. CHÂN TRÁI (LEFT LEG RIG)
  // Khớp háng trái tại y = -0.05m so với Pelvis (tức cao độ 0.90m)
  const leftHipGroup = new THREE.Group();
  leftHipGroup.name = 'Joint_LeftHip';
  leftHipGroup.position.set(-0.12, -0.05, 0);
  pelvisGroup.add(leftHipGroup);

  const leftHipJointMesh = createPBRMesh(new THREE.SphereGeometry(0.065, 12, 12), clothPantsMat);
  leftHipGroup.add(leftHipJointMesh);

  // Đùi trái 3D
  const leftUpperLeg = new THREE.Group();
  leftUpperLeg.name = 'Joint_LeftUpperLeg';
  leftHipGroup.add(leftUpperLeg);

  const leftUpperLegMesh = createPBRMesh(
    new THREE.CylinderGeometry(0.065, 0.052, 0.40, 16),
    clothPantsMat
  );
  leftUpperLegMesh.position.set(0, -0.20, 0);
  leftUpperLeg.add(leftUpperLegMesh);

  // Khớp gối trái tại y = -0.42m (tức cao độ 0.48m)
  const leftKneeGroup = new THREE.Group();
  leftKneeGroup.name = 'Joint_LeftKnee';
  leftKneeGroup.position.set(0, -0.42, 0);
  leftUpperLeg.add(leftKneeGroup);

  const leftKneeJointMesh = createPBRMesh(new THREE.SphereGeometry(0.052, 12, 12), clothPantsMat);
  leftKneeGroup.add(leftKneeJointMesh);

  // Cẳng chân trái 3D
  const leftLowerLeg = new THREE.Group();
  leftLowerLeg.name = 'Joint_LeftLowerLeg';
  leftKneeGroup.add(leftLowerLeg);

  const leftLowerLegMesh = createPBRMesh(
    new THREE.CylinderGeometry(0.052, 0.042, 0.40, 16),
    clothPantsMat
  );
  leftLowerLegMesh.position.set(0, -0.20, 0);
  leftLowerLeg.add(leftLowerLegMesh);

  // Bàn chân trái 3D tại y = -0.42m (chạm đất tại y = 0.00m)
  const leftFootGroup = new THREE.Group();
  leftFootGroup.name = 'Joint_LeftFoot';
  leftFootGroup.position.set(0, -0.42, 0);
  leftLowerLeg.add(leftFootGroup);

  const leftFootMesh = createPBRMesh(
    new THREE.BoxGeometry(0.09, 0.06, 0.22),
    shoeMat
  );
  leftFootMesh.position.set(0, -0.03, 0.06);
  leftFootGroup.add(leftFootMesh);

  // 2.11. CHÂN PHẢI (RIGHT LEG RIG)
  // Khớp háng phải tại y = -0.05m so với Pelvis (tức cao độ 0.90m)
  const rightHipGroup = new THREE.Group();
  rightHipGroup.name = 'Joint_RightHip';
  rightHipGroup.position.set(0.12, -0.05, 0);
  pelvisGroup.add(rightHipGroup);

  const rightHipJointMesh = createPBRMesh(new THREE.SphereGeometry(0.065, 12, 12), clothPantsMat);
  rightHipGroup.add(rightHipJointMesh);

  // Đùi phải 3D
  const rightUpperLeg = new THREE.Group();
  rightUpperLeg.name = 'Joint_RightUpperLeg';
  rightHipGroup.add(rightUpperLeg);

  const rightUpperLegMesh = createPBRMesh(
    new THREE.CylinderGeometry(0.065, 0.052, 0.40, 16),
    clothPantsMat
  );
  rightUpperLegMesh.position.set(0, -0.20, 0);
  rightUpperLeg.add(rightUpperLegMesh);

  // Khớp gối phải tại y = -0.42m (tức cao độ 0.48m)
  const rightKneeGroup = new THREE.Group();
  rightKneeGroup.name = 'Joint_RightKnee';
  rightKneeGroup.position.set(0, -0.42, 0);
  rightUpperLeg.add(rightKneeGroup);

  const rightKneeJointMesh = createPBRMesh(new THREE.SphereGeometry(0.052, 12, 12), clothPantsMat);
  rightKneeGroup.add(rightKneeJointMesh);

  // Cẳng chân phải 3D
  const rightLowerLeg = new THREE.Group();
  rightLowerLeg.name = 'Joint_RightLowerLeg';
  rightKneeGroup.add(rightLowerLeg);

  const rightLowerLegMesh = createPBRMesh(
    new THREE.CylinderGeometry(0.052, 0.042, 0.40, 16),
    clothPantsMat
  );
  rightLowerLegMesh.position.set(0, -0.20, 0);
  rightLowerLeg.add(rightLowerLegMesh);

  // Bàn chân phải 3D tại y = -0.42m (chạm đất tại y = 0.00m)
  const rightFootGroup = new THREE.Group();
  rightFootGroup.name = 'Joint_RightFoot';
  rightFootGroup.position.set(0, -0.42, 0);
  rightLowerLeg.add(rightFootGroup);

  const rightFootMesh = createPBRMesh(
    new THREE.BoxGeometry(0.09, 0.06, 0.22),
    shoeMat
  );
  rightFootMesh.position.set(0, -0.03, 0.06);
  rightFootGroup.add(rightFootMesh);

  // ==========================================
  // 3. ĐÓNG GÓI RIG TREE ĐỦ CHUẨN TỪNG TÊN KHỚP
  // ==========================================
  const rig = {
    rootGroup: characterGroup,
    pelvisGroup,
    torsoGroup,
    chestGroup,
    neckGroup,
    headGroup,
    accessoryHeadGroup,
    clothingGroup,
    frontFlapGroup,
    backFlapGroup,

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
    shadowMesh,

    // Aliases tiện dụng
    pelvis: pelvisGroup,
    torso: torsoGroup,
    chest: chestGroup,
    neck: neckGroup,
    head: headGroup,
    accessoryHead: accessoryHeadGroup,
    leftShoulder: leftShoulderGroup,
    rightShoulder: rightShoulderGroup,
    leftElbow: leftElbowGroup,
    rightElbow: rightElbowGroup,
    leftHand: leftHandGroup,
    rightHand: rightHandGroup,
    leftHip: leftHipGroup,
    rightHip: rightHipGroup,
    leftKnee: leftKneeGroup,
    rightKnee: rightKneeGroup,
    leftFoot: leftFootGroup,
    rightFoot: rightFootGroup,
    frontFlap: frontFlapGroup,
    backFlap: backFlapGroup
  };

  // Gắn rig vào characterGroup
  characterGroup.rig = rig;

  // Giữ lại các tham chiếu tương thích ngược
  characterGroup.torsoGroup = torsoGroup;
  characterGroup.headGroup = headGroup;
  characterGroup.leftArmPivot = leftShoulderGroup;
  characterGroup.rightArmPivot = rightShoulderGroup;
  characterGroup.leftLegPivot = leftHipGroup;
  characterGroup.rightLegPivot = rightHipGroup;
  characterGroup.baseTorsoY = baseTorsoY;
  characterGroup.characterMeta = meta;

  // Cập nhật hoạt ảnh nhàn rỗi cho NPC nếu dùng CharacterFactory
  characterGroup.idleTime = Math.random() * 10;
  characterGroup.updateNPCAnimation = function(delta) {
    this.idleTime += delta * 1.8;
    const breath = Math.sin(this.idleTime) * 0.015;
    this.torsoGroup.position.y = breath;
    if (this.rig.chestGroup) {
      this.rig.chestGroup.scale.set(1 + breath * 1.5, 1 + breath * 2.0, 1 + breath * 1.5);
    }
  };

  return characterGroup;
}
