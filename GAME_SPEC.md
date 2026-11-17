# HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
## TÀI LIỆU KIẾN TRÚC KỸ THUẬT & ĐẶC TẢ HỆ THỐNG TOÀN DIỆN (GAME SPECIFICATION)

---

> **Mã dự án:** `HANOI-OPEN-REVERIE-3D`  
> **Phiên bản tài liệu:** `4.2.0-KIM-LIEN-ENTERABLE-COLLECTIVE-HOUSING`  
> **Phê duyệt:** Sếp Tổng Game Studio & Hội đồng Kiến trúc sư Trưởng  
> **Ngày ban hành:** 17/11/2026  
> **Áp dụng cho 6 Bộ phận chuyên môn Studio AI:**  
> 1. `game-architect` (Kiến Trúc Sư Hệ Thống, GDD, Ranh Giới 4 Phân Khu & API Contracts)  
> 2. `nano-banana` (Lead 2D/3D Asset Artist, Textures PBR, Canva AI Graphics, Nhân Vật Việt Nam Độc Bản & Audio)  
> 3. `coder-chinh` (Core Logic 3D Engine, GTA V Locomotion Physics, Camera, Phân Tầng Va Chạm Khu Tập Thể)  
> 4. `animation-master` (Hoạt Họa 3D Skeletal 60 FPS trong `animations.js`, Nón Lá Lag Damping & VFX)  
> 5. `ui-polish` (Giao Diện Người Dùng, Onboarding, Viewfinder HUD, Modals & Styling)  
> 6. `kiem-duyet-qa` (Trưởng Ban Kiểm Định Chất Lượng, Audit 4 Tầng & Săn Lỗi Chí Mạng).

---

## 1. TỔNG QUAN DỰ ÁN & TẦM NHÌN KỸ THUẬT

### 1.1. Tầm nhìn nghệ thuật và trải nghiệm
**HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)** là tựa game thế giới mở 3D không gian hoài niệm Hà Nội (Thập niên 80-90 giao thoa đương đại) vận hành mượt mà trên trình duyệt Web (WebGL / WebGL2). 

Người chơi hóa thân thành một "Kẻ Mộng Mơ" dạo bước qua 4 phân khu đặc trưng của thủ đô:
1. **Hồ Gươm & Tháp Rùa:** Trái tim di sản bảng lảng khói sương, Cầu Thê Húc đỏ son, Đền Ngọc Sơn.
2. **Mê Cung Phố Cổ & Phố Đường Tàu:** Ngõ phố thông thủy tường mỏng, Tiệm Cà phê Trứng, Bách Hóa Mậu Dịch.
3. **Nhịp Cầu Long Biên & Sông Hồng:** Dầm thép Eiffel hoang hoải rỉ sét, đường ray tàu hỏa, Ga Long Biên.
4. **Quần Thể Khu Tập Thể Kim Liên Mở Hoàn Toàn (Nâng Cấp Đột Phá):** Công trình nhà tập thể lắp ghép bê tông 5 tầng bước vào trong được 100%, cầu thang bộ granito mài, hành lang con tiện thông thoáng, căn hộ mẫu bao cấp đầy đủ hiện vật, ban công "chuồng cọp" vươn đón nắng hoàng hôn, sân chung rêu phong bể nước máy và cây bàng già lá đỏ.

Trải nghiệm cơ chế điều khiển di chuyển nhân vật chân thực chuẩn mực AAA (GTA V Locomotion Physics), sử dụng chiếc máy ảnh cơ film 35mm để căn góc nhìn giải mã những "Giao điểm thị giác" (Perspective Alignment) ẩn giấu trong kiến trúc, hồi sinh những lát cắt ký ức ngưng đọng của thời gian.

### 1.2. Tech Stack & Nền tảng
- **Engine 3D Core:** `Three.js` (r160+) chạy trực tiếp trên WebGL / WebGL2 context.
- **Hệ thống điều khiển nhân vật:** GTA V-style Locomotion Physics với Quaternion Slerp turning, **chuẩn hóa góc di chuyển Yaw Facing qua vector tự nhiên kết hợp `facingOffset`**, triệt tiêu 100% lỗi Moonwalking, quán tính khối lượng (Inertia Acceleration & Braking), cơ chế khử nổi chân (Foot Ground Snapping) và **Va chạm ngang Capsule Horizontal Collision chống xuyên thủng lan can cầu**.
- **Hệ thống va chạm đa tầng (Multi-level Floor & Thin-Wall Collision Engine):** Hỗ trợ leo cầu thang bộ, di chuyển mượt mà trên sàn các tầng (`_isBaseGround = true`), tường mỏng 0.35m, lan can ban công và chuồng cọp bảo vệ người chơi không bị rơi xuyên sàn.
- **Vị trí xuất phát & Camera khởi đầu:** Xuất phát tại tọa độ vàng `(16.5, 0.5, -16.5)` ven bờ Hồ Gươm, góc quay camera mở màn `yaw = 0.785 rad` (45 độ) hướng thẳng dọc tim Cầu Thê Húc.
- **Mô hình nhân vật:** 4 nhân vật NGƯỜI THẬT 3D HỮU CƠ (Organic Humanoid SkinnedMesh / Sculpted 3D Mesh), da thịt liền khối, ngũ quan rõ nét Á Đông, kết hợp **Hệ thống trang phục hình khối 3D độc lập đa lớp (Separate 3D Geometric Meshes)** có độ dày (thickness), đường may, nếp gấp. **NGHIÊM CẤM 100% VIỆC LẮP GHÉP ỐNG TRỤ HÌNH HỘP CON RỐI VÀ DÁN DECAL 2D LÊN MÔ HÌNH!**
- **Cơ chế chống Race Condition & Quản lý bộ nhớ:** `_loadToken` tăng tiến kết hợp hàm đệ quy `_disposeHierarchy()` dọn sạch VRAM/GPU khi chuyển đổi nhân vật.
- **Đồ họa Mỹ thuật Canva AI:** Kết hợp bộ thiết kế đồ họa hoài niệm Canva AI cho bảng tin phường, biển số nhà dập nổi, áp phích bích họa cổ động thời bao cấp, lịch bloc 1985.
- **Hoạt họa (Animation):** Hệ thống Skeletal MoCap AnimationMixer kết hợp Procedural Kinematics 60 FPS trong `src/core/animations.js`, thực hiện Cross-fade Blending mượt mà giữa Idle, Walk, Run.
- **Kiến trúc mã nguồn:** Vanilla JavaScript (ES6+ ES Modules), mô hình phân rã Decoupled Architecture hướng sự kiện (`EventBus`), không phụ thuộc build tooling nặng nề.

---

## 2. BÁO CÁO KIỂM ĐIỂM CHUYÊN SÂU 8 LỖI CHÍ MẠNG & PHẢN HỒI KIẾN TRÚC KIM LIÊN

> **CHỈ THỊ CỦA SẾP TỔNG & PHẢN HỒI TỪ NGƯỜI DÙNG:**  
> *"Toàn bộ studio phải nghiêm túc nhìn nhận 8 sai phạm kỹ thuật nghiêm trọng cùng yêu cầu nâng cấp cấp bách của người dùng: 'Bỏ ngay khối hộp đặc làm như cái chung cư vô hồn, kết hợp cùng Canva làm khu tập thể Kim Liên chân thật và có thể bước vào trong nhà di chuyển tự do!' Tất cả phải được giải quyết triệt để!"*

| STT | Vấn Đề / Lỗi Kỹ Thuật | Mô Tả & Biểu Hiện | Nguyên Nhân Kỹ Thuật Gốc Rễ | Hậu Quả Đối Với Trải Nghiệm | Giải Pháp Kỹ Thuật Triệt Để |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **0** | **Khu tập thể dạng khối hộp đặc vô hồn** | Khu nhà tập thể Kim Liên là 3 khối BoxGeometry đặc kín, người chơi bị bức tường vô hình chặn đứng ngoài sân, không thể bước vào trong. | Sử dụng `BoxGeometry(w, h, d)` nguyên khối kèm `_addBoxObstacle` bao trùm toàn bộ tòa nhà, lười biếng trong dựng hình không gian thông thủy. | Phá vỡ cảm xúc hoài niệm, khiến khu tập thể giống hệt khối bê tông thô kệch, không có hồn sống. | **Tái thiết kế công trình mở hoàn toàn:** Xây dựng sảnh đón, cầu thang bộ granito mài, hành lang thông thoáng, căn hộ mẫu bao cấp bước vào được, chuồng cọp ngắm hoàng hôn. |
| **1** | **4 nhân vật giống nhau 100%** | Dù chọn Nữ sinh, Cô gái, Nam trí thức hay Chàng trai Thăng Long thì nhân vật xuất hiện vẫn là cùng 1 hình dạng. | Hardcode cố định đường dẫn asset `assets/models/Soldier.glb` trong hàm `_load3DHumanoidCharacter` tại `PlayerController.js:149`, bỏ qua hoàn toàn tham số `characterId`. | Phá hỏng tính năng cốt lõi tạo nhân vật và lựa chọn bản sắc văn hóa Việt Nam. | Ánh xạ chính xác từng `characterId` vào tài nguyên mô hình và tạo hình độc bản riêng biệt của 4 nhân vật trong `CharacterFactory.js`. |
| **2** | **Đi ngược (Moonwalking)** | Khi bấm phím `W` để tiến lên, nhân vật quay lưng về phía trước, bước thụt lùi như Michael Jackson. | Sai lệch vector góc quay yaw giữa `Math.atan2(finalDir.x, finalDir.z)` và trục mặt tiền tự nhiên của mô hình (+Z vs -Z), cộng thêm việc áp dụng bừa bãi `+ Math.PI` không theo hướng gốc của từng model. | Trải nghiệm điều khiển kỳ dị, mất kiểm soát thị giác và vi phạm tiêu chuẩn AAA. | Thiết lập hệ thống `facingOffset` chuẩn xác cho từng nhân vật (0 hoặc Math.PI tùy trục model), tính toán góc quay đồng bộ với camera. |
| **3** | **Đổi nhân vật bị đơ cứng (Frozen Pose)** | Sau khi chọn đổi nhân vật khác trong menu, mô hình xuất hiện ở tư thế T-pose hoặc đứng đơ, không chuyển động bước đi. | Desync AnimationMixer: mixer cũ bị hủy nhưng mixer mới không gắn đúng root bone hoặc action clips bị mất/lỗi Promise bất đồng bộ không bắt exception. | Nhân vật thành hình nộm trượt trên mặt đất, mất hoàn toàn hoạt họa sinh học. | Chuẩn hóa hàm khởi tạo mixer, kiểm tra clips tồn tại, tự động play `idleAction`, và thiết lập fallback procedural animator an toàn. |
| **4** | **Bóng ma đè hình (Ghost Overlapping)** | Hai hoặc nhiều mô hình nhân vật lồng vào nhau, xuất hiện hình nộm ma-nơ-canh xuyên thấu. | Race Condition khi click đổi nhân vật liên tục: các Promise async `load()` chạy đồng thời, cái xong sau đè lên cái trước nhưng không dọn sạch (`dispose`) hierarchy mesh cũ. | Hình ảnh hiển thị hỗn loạn, sụt giảm FPS nghiêm trọng, tràn bộ nhớ VRAM. | Triển khai cơ chế `_loadToken` tăng dần (hủy Promise token cũ) kết hợp hàm `_disposeHierarchy()` dọn sạch triệt để bộ nhớ GPU/VRAM. |
| **5** | **Sai lệch bối cảnh văn hóa nghiêm trọng** | Mô hình người lính chiến binh Sci-Fi hiện đại chạy loanh quanh bên bờ Tháp Rùa và Cầu Thê Húc. | Sử dụng mô hình `Soldier.glb` phương Tây làm mẫu mặc định thay vì mô hình văn hóa truyền thống Hà Nội thập niên 80-90. | Phá hủy hoàn toàn bầu không khí hoài niệm, thơ mộng của tựa game di sản Hà Nội. | Thay thế 100% bằng 4 nhân vật Việt Nam độc bản: Áo dài trắng nón lá, Áo bà ba khăn rằn, Nam trí thức suit xám, Chàng trai Thăng Long gấm ngũ thân. |
| **6** | **Thiếu Debounce / Cooldown chống spam** | Người chơi click lia lịa vào các thẻ chọn nhân vật khiến giao diện nhấp nháy liên tục và engine quá tải. | Sự kiện click gọi trực tiếp hàm chuyển đổi nhân vật mà không có biến cờ khóa (`isSwitchingCharacter`) hoặc cooldown thời gian. | Gây sập GameEngine, tạo ra hàng loạt Promise treo và kích hoạt lỗi Ghost Overlapping. | Bổ sung Cooldown tối thiểu 600ms và Debounce tại UI & Core, vô hiệu hóa nút bấm tạm thời khi đang chuyển đổi. |
| **7** | **Lệch tỉ lệ kích thước (Scale & AABB)** | Nhân vật nữ thì to khổng lồ bằng nóc nhà, nhân vật nam thì bé như người tí hon hoặc chìm lỉm dưới mặt đất. | Thiếu bước chuẩn hóa Bounding Box (AABB) tự động, mỗi asset GLB có scale gốc khác nhau do phần mềm xuất khác nhau. | Tỉ lệ cơ thể phi thực tế, chân không chạm đất hoặc ngập sâu trong lòng đường. | Dùng `THREE.Box3` tính toán chiều cao thực tế và tự động scale chuẩn hóa theo nhân trắc học: Nữ `1.68m`/`1.65m`, Nam `1.78m`/`1.76m`. |
| **8** | **Lỗi nạp GLB Meshopt nén** | Bị lỗi runtime không nạp được file GLB hiện đại có nén Meshopt hoặc KTX2. | `GLTFLoader` không được khai báo và cấu hình `MeshoptDecoder` đi kèm. | Crash game khi nạp mô hình tối ưu dung lượng cao từ artist. | Tích hợp thư viện giải nén `MeshoptDecoder` vào cấu hình khởi tạo của `GLTFLoader`. |

---

## 3. KIẾN TRÚC HỆ THỐNG & TÁCH BIỆT VÙNG LÀM VIỆC (STRICT BOUNDARIES)

> **KHÂU KIỂM DUYỆT 1 - TIÊU CHÍ (1): TÁCH BIỆT RÕ RÀNG GIỮA CORE CODE VÀ UI CODE**  
> Để đảm bảo 4 bộ phận (`coder-chinh`, `ui-polish`, `animation-master`, `nano-banana`) sản xuất song song 100% không xung đột mã nguồn (zero merge conflicts), hệ sinh thái thư mục được phân định ranh giới nghiêm ngặt như sau:

```
d:/HÀ NỘI CHẠM VÀO KÝ ỨC ,HANOI OPEN REVERIE/
├── index.html                     # Điểm vào ứng dụng (Shell, nạp modules)
├── package.json                   # Cấu hình dự án & scripts test
├── GAME_SPEC.md                   # Bản đặc tả kỹ thuật này (Chuẩn mực tối cao)
├── REVIEW_LOG.md                  # Nhật ký kiểm duyệt chất lượng QA
│
├── assets/                        # [VÙNG CỦA HỌA SĨ nano-banana & CANVA AI GRAPHICS]
│   ├── models/                    # Mô hình 3D nhân vật GLTF/GLB (Michelle.glb, Soldier.glb, Xbot.glb, v.v.)
│   ├── textures/                  # Textures 3D PBR/Albedo/Normal/Roughness & Canva AI Posters
│   │   ├── canva_poster_kimlien.jpg   # Tranh cổ động thời bao cấp phong cách Canva AI
│   │   ├── kimlien_block_sign.png     # Biển số nhà nhôm A1 dập nổi Canva
│   │   ├── bloc_calendar_1985.png     # Lịch bloc tường ngày 2/9/1985
│   │   └── ward_bulletin_board.png    # Bảng tin phường phấn trắng viết tay
│   ├── ui/                        # Đồ họa giao diện, biểu tượng
│   ├── photos/                    # Ảnh film ký ức mẫu tráng sẵn
│   └── audio/                     # Tài nguyên âm thanh âm hưởng Hà Nội
│       ├── water_tap_audio.mp3        # Tiếng vòi nước bể tập thể róc rách
│       └── cassette_autumn_audio.mp3  # Tiếng đài cassette rè rè vang bài hát Hà Nội
│
├── src/
│   ├── bridge/                    # [VÙNG GIAO TIẾP DÙNG CHUNG - BẤT BIẾN]
│   │   ├── GameEvents.js          # Hệ thống EventBus tập trung (window.GameEventBus)
│   │   └── GameAPI.js             # Window Contract APIs cho UI tương tác với 3D (window.GameAPI)
│   │
│   ├── core/                      # [VÙNG CỦA coder-chinh & animation-master]
│   │   ├── GameEngine.js          # Khởi tạo WebGL, vòng lặp GameLoop, render pass
│   │   ├── SceneManager.js        # Quản lý cảnh 3D, ánh sáng, sương mù (Fog)
│   │   ├── WorldManager.js        # Bản đồ 500m x 500m, Collision AABB, Nhà Tập Thể Mở Kim Liên, BẢO TOÀN 9 NPC LỊCH SỬ
│   │   ├── ZoneManager.js         # Quản lý 4 phân khu (Hồ Gươm, Phố Cổ, Cầu, Nhà Tập Thể)
│   │   ├── PlayerController.js    # [coder-chinh] GTA V Locomotion Physics: Floor Colliders, Raycast Snapping, facingOffset
│   │   ├── CharacterFactory.js    # [coder-chinh] 4 Nhân Vật Người Thật Hữu Cơ 3D, Da Thịt Á Đông & Trang Phục Lớp Khối 3D
│   │   ├── animations.js          # [animation-master] 3D Skeletal Animation System & MoCap Retargeting 60 FPS
│   │   ├── CameraController.js    # Camera Kép (TPS Spring-Arm yaw 0.785 rad & FPS Viewfinder)
│   │   ├── PerspectivePuzzle.js   # Hệ thống giải đố căn góc nhìn quang học
│   │   ├── PhotoSystem.js         # Cơ chế chụp ảnh film, canvas capture, lưu khoảnh khắc
│   │   └── StorageService.js      # Dịch vụ LocalStorage / IndexedDB đồng bộ dữ liệu
│   │
│   └── ui/                        # [VÙNG CỦA ui-polish - GIAO DIỆN & TƯƠNG TÁC]
│       ├── UIManager.js           # Điều phối toàn bộ vòng đời UI
│       ├── OnboardingManager.js   # Quản lý tuần tự: Age Gate -> Login -> Character
│       ├── AgeGateModal.js        # Cổng xác nhận độ tuổi 18+ tính năm sinh
│       ├── AuthModal.js           # Modal Đăng nhập (Google Mock / Email)
│       ├── CharacterCreation.js   # Tạo nhân vật, chọn 4 nhân vật 3D, Debounce 0.5s check tên, Cooldown click 600ms
│       ├── ViewfinderHUD.js       # Khung ngắm máy ảnh, thước đo tiêu cự, lưới bố cục
│       ├── ScrapbookModal.js      # Cuốn Album Ký Ức lật trang, tem dán, tản văn
│       ├── MinimapModal.js        # Bản đồ toàn cảnh & điểm dịch chuyển 4 phân khu
│       ├── DialogueModal.js       # Hộp thoại tương tác với 9 NPC người Hà Nội & Cư dân tập thể
│       ├── ChatboxModal.js        # Kênh chat lãng tử
│       ├── ToastNotification.js   # Bảng thông báo góc màn hình phong cách retro
│       └── AudioBGMController.js  # Nút bật tắt nhạc, thanh chỉnh âm lượng hoài niệm
│
├── styles/                        # [VÙNG CỦA ui-polish - CSS STYLES]
│   ├── reset.css                  # Chuẩn hóa CSS
│   ├── retro_theme.css            # Biến màu sắc hoài niệm (Vàng hoàng cúc, đỏ bã trầu, xanh rêu)
│   ├── onboarding.css             # Giao diện Age Gate, Login, Tạo nhân vật
│   ├── hud.css                    # Thanh trạng thái, bản đồ, thông báo toast, modal hội thoại
│   └── viewfinder.css             # Hiệu ứng film grain, vignette, khung ngắm camera
│
└── tests/                         # [VÙNG CỦA kiem-duyet-qa - AUTOMATED TEST SUITE]
    └── test_3d_humanoid_system.mjs# Bộ test tự động kiểm thử toàn bộ hệ thống
```

---

## 4. ĐẶC TẢ GIAO DIỆN LẬP TRÌNH VÀ TẬP HÀM GIAO TIẾP (API & EVENT SPECIFICATION)

> **KHÂU KIỂM DUYỆT 1 - TIÊU CHÍ (2): ĐỊNH NGHĨA RÕ RÀNG TỪNG CHỮ CÁC HÀM GIAO TIẾP (API/EVENTS)**  
> Dưới đây là danh sách đầy đủ, chính xác từng ký tự tên hàm, tham số, kiểu dữ liệu, chiều truyền dữ liệu giữa `coder-chinh`, `animation-master` và `ui-polish`. Tuyệt đối không tự ý đổi tên để đảm bảo ghép nối hoàn hảo 100%.

### 4.1. Đối tượng toàn cục EventBus: `window.GameEventBus`
Được định nghĩa tại [src/bridge/GameEvents.js](file:///d:/H%C3%80%20N%E1%BB%98I%20CH%E1%BA%A0M%20V%C3%80O%20K%C3%9D%20%E1%BB%A8C%20,HANOI%20OPEN%20REVERIE/src/bridge/GameEvents.js).  
Phương thức chuẩn:
- `window.GameEventBus.on(eventName, callback)`: Đăng ký lắng nghe sự kiện. Trả về hàm hủy đăng ký `() => void`.
- `window.GameEventBus.off(eventName, callback)`: Hủy đăng ký lắng nghe sự kiện.
- `window.GameEventBus.emit(eventName, payload)`: Bắn sự kiện kèm dữ liệu payload sang các module khác.

---

### 4.2. Bảng Sự Kiện từ UI gửi sang Core (`UI -> CORE`)

| Tên Sự Kiện (`eventName`) | Kiểu Dữ Liệu (`payload`) | Bộ Phận Bắn | Bộ Phận Nhận | Ý Nghĩa Kỹ Thuật |
| :--- | :--- | :--- | :--- | :--- |
| `UI:AGE_VERIFIED` | `{ birthYear: number, birthMonth: number, birthDay: number, isAdult: boolean }` | `ui-polish` | `coder-chinh` | Người dùng xác nhận tuổi thành công (>= 18 tuổi), cho phép mở màn hình Auth. |
| `UI:AUTH_SUCCESS` | `{ userId: string, username: string, authType: 'google' \| 'guest' \| 'email' }` | `ui-polish` | `coder-chinh` | Đăng nhập tài khoản thành công, khởi động nạp hồ sơ người dùng từ Storage. |
| `UI:CHARACTER_CONFIRMED` | `{ characterName: string, characterId: string, outfitId: string, cameraModel: string }` | `ui-polish` | `coder-chinh` | Người dùng chốt tên hợp lệ và chọn 1 trong 4 nhân vật 3D, kích hoạt Core nạp nhân vật & World 3D. |
| `UI:SWITCH_CAMERA_MODE` | `{ targetMode: 'TPS' \| 'FPS' }` | `ui-polish` | `coder-chinh` | Chuyển đổi thủ công camera (bấm nút Máy Ảnh hoặc phím V). |
| `UI:TRIGGER_SHUTTER` | `{ timestamp: number }` | `ui-polish` | `coder-chinh` | Bấm nút chụp ảnh vật lý/ảo trên Viewfinder HUD, kích hoạt chụp Canvas 3D. |
| `UI:OPEN_SCRAPBOOK` | `{ open: boolean }` | `ui-polish` | `coder-chinh` | Bật/tắt Album Ký Ức, yêu cầu Core tạm dừng (pause) hoặc tiếp tục Game Loop. |
| `UI:TELEPORT_REQUEST` | `{ zoneId: 'ho_guom' \| 'pho_co' \| 'long_bien' \| 'tap_the' }` | `ui-polish` | `coder-chinh` | Người chơi chọn điểm dịch chuyển nhanh trên bản đồ nhỏ (Minimap). |
| `UI:SET_AUDIO_VOLUME` | `{ master: number, bgm: number, sfx: number }` | `ui-polish` | `coder-chinh` | Điều chỉnh âm lượng tổng và thành phần (giá trị float từ `0.0` đến `1.0`). |
| `UI:START_ENGINE_REQUEST` | `{}` | `ui-polish` | `coder-chinh` | Yêu cầu Game Engine khởi động WebGL render loop khi sẵn sàng. |

---

### 4.3. Bảng Sự Kiện từ Core gửi sang UI (`CORE -> UI`)

| Tên Sự Kiện (`eventName`) | Kiểu Dữ Liệu (`payload`) | Bộ Phận Bắn | Bộ Phận Nhận | Ý Nghĩa Kỹ Thuật |
| :--- | :--- | :--- | :--- | :--- |
| `CORE:WORLD_LOAD_PROGRESS` | `{ progress: number, currentAsset: string }` | `coder-chinh` | `ui-polish` | Cập nhật tiến độ tải 3D World (0 - 100%) lên thanh loading retro. |
| `CORE:WORLD_READY` | `{ spawnZone: string, playerPosition: { x: number, y: number, z: number } }` | `coder-chinh` | `ui-polish` | Thế giới 3D đã sẵn sàng, yêu cầu UI ẩn màn hình chờ và hiện HUD chính. |
| `CORE:CAMERA_MODE_CHANGED` | `{ mode: 'TPS' \| 'FPS', fov: number }` | `coder-chinh` | `ui-polish` | Core thông báo đã chuyển xong chế độ camera (FPS bật Viewfinder HUD & ẩn đầu/mũ nhân vật; TPS tắt HUD & hiện lại nhân vật). |
| `CORE:PUZZLE_DETECTED` | `{ puzzleId: string, puzzleName: string, alignmentScore: number, isAligned: boolean }` | `coder-chinh` | `ui-polish` | Người chơi đang nhìn vào vị trí câu đố; `alignmentScore` (0.0 - 1.0) để UI vẽ thước ngắm đổi màu. |
| `CORE:PUZZLE_SOLVED` | `{ puzzleId: string, title: string, quote: string, unlockedShortcut: string, photoUrl: string }` | `coder-chinh` | `ui-polish` | Căn góc thành công! UI mở hiệu ứng chớp sáng, vinh danh ký ức và trao huy hiệu. |
| `CORE:PHOTO_CAPTURED` | `{ photoId: string, dataUrl: string, zoneId: string, timestamp: number, isPuzzle: boolean, poemQuote: string }` | `coder-chinh` | `ui-polish` | Ảnh vừa chụp được render xong, gửi dataUrl sang UI để hiển thị thumbnail và cất vào Album. |
| `CORE:ZONE_ENTERED` | `{ zoneId: string, zoneName: string, description: string, ambientTrack: string }` | `coder-chinh` | `ui-polish` | Người chơi bước vào ranh giới phân khu mới hoặc bước vào căn hộ tập thể, UI hiện Toast thông báo. |
| `CORE:INTERACTION_AVAILABLE` | `{ canInteract: boolean, promptText: string, actionKey: string }` | `coder-chinh` | `ui-polish` | Gần ghế đá, hàng nước chè, vòi nước bể tập thể, đài cassette căn hộ: UI hiện phím gợi ý (ví dụ: "[E] Bật đài cassette"). |
| `UI:OPEN_DIALOGUE` | `{ name: string, role: string, avatar: string, greeting: string, monumentTitle: string, historyText: string, dialogueOptions: Array, shopItems: Array }` | `coder-chinh` | `ui-polish` | Khi người chơi bấm E tương tác với NPC, mở modal đối thoại và tìm hiểu lịch sử danh thắng/khu tập thể. |
| `CORE:SWITCH_CHARACTER` | `{ characterId: string }` | `ui-polish` | `coder-chinh` | Yêu cầu thay đổi mô hình nhân vật người chơi trong thế giới 3D. |
| `CORE:CHARACTER_SWITCHED` | `{ characterId: string, success: boolean }` | `coder-chinh` | `ui-polish` | Thông báo hoàn tất đổi nhân vật, mở khóa nút bấm (Cooldown/Debounce). |

---

### 4.4. Bảng Hợp Đồng API Trực Tiếp Toàn Cục (`window.GameAPI`)
Được triển khai tại [src/bridge/GameAPI.js](file:///d:/H%C3%80%20N%E1%BB%98I%20CH%E1%BA%A0M%20V%C3%80O%20K%C3%9D%20%E1%BB%A8C%20,HANOI%20OPEN%20REVERIE/src/bridge/GameAPI.js) bởi `coder-chinh` để `ui-polish` gọi đồng bộ khi cần:

```javascript
window.GameAPI = {
  /**
   * Kiểm tra tính hợp lệ và trùng lặp của tên nhân vật theo thời gian thực (Debounce 500ms)
   * @param {string} rawName - Tên người dùng nhập vào
   * @returns {Promise<{ isValid: boolean, message: string, suggestions: string[] }>}
   */
  checkCharacterNameAvailability: async (rawName) => {},

  /**
   * Lưu hoặc cập nhật hồ sơ người chơi vào LocalStorage
   * @param {Object} profile - { username, outfit, characterId, unlockedPuzzles, capturedPhotosCount }
   * @returns {boolean} Thành công hay thất bại
   */
  saveUserProfile: (profile) => {},

  /**
   * Lấy toàn bộ danh sách ảnh đã chụp từ Album Database (LocalStorage / IndexedDB)
   * @returns {Promise<Array<{ id: string, dataUrl: string, zone: string, timestamp: number, quote: string }>>}
   */
  getAlbumPhotos: async () => {},

  /**
   * Khóa hoặc mở khóa điều khiển di chuyển nhân vật (khi đang mở modal UI, hội thoại, scrapbook)
   * @param {boolean} locked - true: không cho WASD di chuyển; false: cho phép
   */
  setPlayerMovementLock: (locked) => {},

  /**
   * Lấy trạng thái hiện tại của hệ thống camera
   * @returns {{ mode: 'TPS' | 'FPS', fov: number, isAiming: boolean }}
   */
  getCameraStatus: () => {},

  /**
   * Yêu cầu chụp ảnh màn hình WebGL hiện tại với bộ lọc film vintage
   * @param {string} filterPreset - 'portra' | 'tri-x' | 'sepia' | 'cyber-hanoi'
   * @returns {Promise<string>} Base64 Data URL của ảnh chụp
   */
  captureFilmPhoto: async (filterPreset) => {},

  /**
   * Khởi động nhanh quá trình nạp thế giới 3D
   */
  startWorldEngine: async () => {}
};
```

---

## 5. ĐẶC TẢ 4 NHÂN VẬT NGƯỜI THẬT 3D HỮU CƠ & VĂN HÓA HÀ NỘI ĐỘC BẢN

> **NGUYÊN TẮC BẤT DI BẤT DỊCH TỪ SẾP TỔNG:**  
> *"Loại bỏ hoàn toàn lính Sci-Fi phương Tây ra khỏi Hồ Gươm! Phải xây dựng 4 nhân vật NGƯỜI THẬT 3D HỮU CƠ (Organic Humanoid SkinnedMesh / Sculpted 3D Mesh), da thịt liền khối, ngũ quan rõ nét Á Đông, tuyệt đối KHÔNG lắp ghép ống trụ/hình hộp con rối."*

1. `char_nu_sinh_ao_dai`: Nữ sinh Tràng An da sáng ấm (#E8BEAC), Áo Dài lụa trắng thướt tha, Nón Lá Trúc Chỉ 3D, hoa tai ngọc trai.
2. `char_co_gai_ao_ba_ba`: Cô gái Phố thị da sáng (#E8BEAC), Áo Bà Ba hồng sen, Khăn Rằn Nam Bộ 3D quấn cổ, Nón Lá quàng lưng.
3. `char_nam_tri_thuc_suit`: Nam trí thức Hà Nội cổ điển da ấm (#DEB096), Suit tweed xám than, Mũ Fedora / Kính mắt, Giày da Oxford.
4. `char_nam_ao_dai_gam`: Chàng trai Thăng Long da ấm (#DEB096), Áo Dài ngũ thân gấm xanh hoàng gia (0x16213e) khuy ngọc bích, Khăn Xếp 5 tầng 3D.

---

## 6. KIẾN TRÚC CHỐNG RACE CONDITION & QUẢN LÝ BỘ NHỚ TRIỆT ĐỂ

- **Cơ chế `_loadToken` tăng tiến:** Mỗi lượt nạp nhân vật mới kích hoạt `this._loadToken++`. Các Promise cũ nếu `currentToken !== this._loadToken` sẽ bị hủy bỏ ngay lập tức, ngăn ngừa hoàn toàn lỗi đè mô hình Ghost Overlapping.
- **Dọn sạch triệt để `_disposeHierarchy(root)`:** Đệ quy duyệt cây Mesh, giải phóng toàn bộ Geometry, Material, Textures và stop/uncache AnimationMixer, giải phóng 100% VRAM GPU.

---

## 7. CHUẨN HÓA GÓC DI CHUYỂN (YAW FACING & facingOffset) & GTA V LOCOMOTION

- **Chuẩn hóa góc quay:** `targetAngle = Math.atan2(finalDir.x, finalDir.z) + facingOffset`.
- **Triệt tiêu 100% Moonwalking:** Khi bấm phím `W`, nhân vật luôn hướng mặt 100% theo hướng tiến về phía trước theo góc nhìn camera.
- **Gia tốc có quán tính:** Tăng tốc `18.0 m/s²`, hãm phanh `22.0 m/s²`, Capsule Horizontal Collision kẹp an toàn lan can cầu Thê Húc / Kim Quy.

---

## 8. HỆ THỐNG HOẠT HỌA 60 FPS HUMANOID, RETARGETING & CHỐNG ĐƠ CỨNG

- **Khởi tạo AnimationMixer chuẩn mực:** Tự động map `idleAction`, `walkAction`, `runAction`.
- **Cross-Fade Blending:** Thời gian chuyển đổi 0.25s mượt mà, không khựng giật, không bao giờ bị đơ cứng ở tư thế T-pose.
- **Lò xo giảm chấn quán tính Nón Lá (Lag Damping):** Phản ứng tự nhiên theo gia tốc xoay đầu của nhân vật.

---

## 9. HỆ THỐNG CHỐNG SPAM CLICK, CHUẨN HÓA SCALE/AABB & MESHOPT DECODER

- **Cooldown 600ms:** Chống spam click đổi nhân vật tại UI.
- **Chuẩn hóa chiều cao AABB:** Nữ sinh `1.68m`, Cô gái `1.65m`, Nam trí thức `1.78m`, Chàng trai Thăng Long `1.76m`.
- **Tích hợp `MeshoptDecoder`:** Hỗ trợ nạp file GLB nén hiệu năng cao.

---

## 10. HỆ THỐNG TRANG PHỤC HÌNH KHỐI 3D ĐỘC LẬP ĐA LỚP & TÁI TẠO DA THỊT Á ĐÔNG

- Cổ áo trụ 3D cao 3cm dày 2mm ôm cổ da thịt.
- Thân áo ngoài xẻ tà 2 bên hông để lộ quần lụa, ống tay áo ôm bắp tay/cẳng tay.
- Quần lụa ống rộng 3D / Quần âu ống đứng có ly 3D bọc ngoài chân.
- Hai tà áo dài 3D đa giác mềm có thể tích (Thickness 1.8mm), đung đưa theo hông và gió hồ.
- Khuy cúc hạt ngọc 3D, Khăn xếp Thăng Long 5 tầng nếp 3D, Khăn rằn 3D quấn cổ, Nón lá 3D.
- Màu da ấm sáng Á Đông `#E8BEAC` và `#DEB096`, PBR Skin roughness 0.46, giả lập Subsurface Scattering.

---

## 11. CHI TIẾT 4 PHÂN KHU THẾ GIỚI MỞ 500m x 500m LIỀN MẠCH

```
       [TÂY BẮC]                                [ĐÔNG BẮC]
 Khu 2: MÊ CUNG PHỐ CỔ & ĐƯỜNG TÀU       Khu 3: NHỊP CẦU LONG BIÊN & SÔNG HỒNG
   - Phố Hàng Bạc, Hàng Ngang, Hàng Đào     - Dầm thép Eiffel rỉ sét, đường ray
   - Cà phê đường tàu, ray lượn sát vách    - Bãi bồi lau sậy Sông Hồng bạt ngàn
   - Tọa độ: (-250 đến 0, 0 đến 250)        - Tọa độ: (0 đến 250, 0 đến 250)
 --------------------------------------------------------------------------------
   - Tọa độ: (-250 đến 0, -250 đến 0)       - Tọa độ: (0 đến 250, -250 đến 0)
 Khu 4: KHU TẬP THỂ KIM LIÊN MỞ 3D        Khu 1: HỒ GƯƠM & THÁP RÙA TRUNG TÂM
   - Nhà A1 mở cửa, leo cầu thang bộ        - Tháp Rùa cổ kính ngự giữa hồ
   - Căn hộ mẫu 204 bao cấp, chuồng cọp     - Cầu Thê Húc đỏ son, Đền Ngọc Sơn
   - Bể nước máy tập thể, sân cờ tướng
       [TÂY NAM]                                [ĐÔNG NAM]
```

### 11.1. Phân khu 1: Hồ Gươm & Tháp Rùa Trung Tâm (Zone A)
- **Tọa độ trung tâm:** `(100, 0, -100)`.
- **Tọa độ xuất phát vàng của Người Chơi:** `(x = 16.5, y = 0.5, z = -16.5)` ngay chân Cầu Thê Húc.
- **Hệ thống Cầu Thê Húc:** Dốc tiếp cận thoải (< 12%) từ vỉa hè (`y = 0.15m`) lên sàn cầu (`y = 0.95m`), thân cầu 15 nhịp sơn son, Capsule Horizontal Collision chống rơi xuống hồ.

### 11.2. Phân khu 2: Mê Cung Phố Cổ & Phố Đường Tàu (Zone B)
- **Tọa độ trung tâm:** `(-100, 0, 100)`.
- **Quy chuẩn Kiến trúc Tường Mỏng & Không Gian Thông Thủy (Thin-Wall Architecture):**
  * Tường bao dày chuẩn xác `0.35m`.
  * Lòng nhà thông thủy rộng `11.3m x 15.3m`, cao `4.2m`.
  * Tiệm Cà Phê Trứng & Trà Sen Cổ Điển (quầy bar gỗ lim 5.2m, phin nhôm nhỏ giọt, máy hát đĩa than cổ).
  * Cửa Hàng Bách Hóa Mậu Dịch Thời Bao Cấp (ca men Hải Phòng, phích Rạng Đông, bánh bích quy Hải Châu, đài cassette Liên Xô, xe đạp Thống Nhất).

### 11.3. Phân khu 3: Nhịp Cầu Long Biên & Bãi Bồi Sông Hồng (Zone C)
- **Tọa độ trung tâm:** `(100, 4.2, 100)`. Sàn dầm cầu tại cao độ `y = 4.2m`.
- **Dốc Dẫn Thoải (Main Bridge Ramp):** Dài 25m từ `x = 10.0m` lên `x = 35.0m`, rộng 4.5m, độ dốc 16.4%.
- **Cầu Thang Bộ Gạch Đá Phụ Trợ:** 24 bậc thang trát đá rửa xám, tay vịn sắt ống dầm Eiffel kiên cố.
- **Bãi Bồi Sông Hồng:** Vạt lau sậy trắng xóa đu đưa theo gió, sóng nước phù sa đỏ cuộn trôi.

---

### 11.4. Phân khu 4: Quần Thể Khu Tập Thể Kim Liên Mở Hoàn Toàn & Căn Hộ Mẫu Bao Cấp (Zone D - Nâng Cấp Đột Phá)

> **MỆNH LỆNH THIẾT KẾ MỚI TỪ NGƯỜI DÙNG & SẾP TỔNG:**  
> *"Loại bỏ hoàn toàn các khối hộp BoxGeometry đặc kín thô sơ. Kết hợp đồ họa Canva AI tái hiện Quần thể Nhà Tập Thể Kim Liên mở 100%, người chơi tự do bước qua sảnh, leo cầu thang bộ granito, dạo bước trên hành lang lộng gió, vào tham quan Căn hộ mẫu thời bao cấp số 204 và đứng trong lồng 'chuồng cọp' ngắm hoàng hôn ngõ phố!"*

#### 11.4.1. Quy Hoạch Tổng Thể & Tọa Độ Phân Khu
- **Tọa độ trung tâm:** `(-75.0, 0, -85.0)` thuộc góc Tây Nam thế giới mở.
- **Quần thể kiến trúc:**
  * **Nhà Tập Thể A1 (Khối Trọng Tâm Mở 100%):** Tọa độ `(-65.0, 0, -60.0)`, kích thước `38.0m x 16.0m x 16.0m` (4 tầng thực tế, bước vào tự do).
  * **Nhà Tập Thể A2 & B1 (Khối Cảnh Quan Hậu Cảnh):** Tọa độ `(-110.0, 0, -60.0)` và `(-75.0, 0, -115.0)` tạo thế quần thể chữ U khép kín ôm lấy Sân chung.
  * **Sân chung Khu Tập Thể:** Tọa độ trung tâm `(-75.0, 0, -80.0)`, mặt sân lát gạch chỉ đỏ xi măng rêu phong.

#### 11.4.2. Chi Tiết Kiến Trúc Khối Nhà Tập Thể A1 Mở Hoàn Toàn (Enterable Architecture)

##### 1. Cấu Trúc Khung Bê Tông Tường Mỏng & Sảnh Đón Tầng 1:
- Toàn bộ kết cấu sử dụng tường mỏng `thickness = 0.35m` (thay vì khối đặc), phủ texture vôi vàng ố hoàng cúc `old_wall_yellow.jpg` kết hợp mảng rêu đen ẩm mốc chân tường.
- **Sảnh đón trung tâm tầng 1 (Entrance Portal):** Cửa vòm thông thoáng rộng `3.6m`, cao `3.2m` tại mặt trước tòa nhà (hướng ra sân chung), không có cánh cửa chặn, người chơi đi thẳng từ sân vào sảnh cầu thang bộ.
- **Biển tên khối nhà Canva AI:** Phía trên cửa sảnh gắn biển nhôm dập nổi `A1 - KHU TẬP THỂ KIM LIÊN` viền đỏ chữ vàng hoài niệm.

##### 2. Cầu Thang Bộ Trung Tâm Nối Các Tầng (Central Granito Staircase):
- **Vị trí:** Trung tâm khối nhà tại trục `X = -65.0, Z = -60.0`.
- **Cấu trúc bậc thang:** 2 vế thang đối xứng mỗi tầng kèm chiếu nghỉ rộng `2.2m x 1.6m`. Bậc thang đúc bê tông ốp đá mài granito lấm tấm xám đen đỏ đặc trưng thập niên 80.
  * Chiều cao mỗi bậc thang: `0.17m`.
  * Bề rộng mặt bậc: `0.28m`.
  * Chiều rộng vế thang: `1.5m` thênh thang cho 2 người đi tránh nhau.
- **Tay vịn & Lan can:** Khung sắt dẹt hoa văn chấn song đứng thanh mảnh sơn màu xanh bộ đội, tay vịn gỗ lim tiện tròn bo êm tay, chiều cao lan can an toàn `0.95m`.
- **Cơ chế vật lý:** Mỗi bậc thang hoặc ram dốc thang được gán collider `_isBaseGround = true`, người chơi bấm `W` bước lên bậc thang mượt mà, chân snap bám dính tự nhiên, không rơi xuyên kẽ thang.

##### 3. Hành Lang Dài Thông Thoáng Các Tầng (Open Air Corridor):
- **Cao độ sàn các tầng:**
  * Sàn Tầng 1: `Y = 0.04m`
  * Sàn Tầng 2: `Y = 3.80m`
  * Sàn Tầng 3: `Y = 7.60m`
  * Sàn Tầng 4 / Sân thượng: `Y = 11.40m`
- **Hành lang chạy dọc mặt tiền:** Chiều dài `36.0m`, rộng `1.8m`, người chơi tự do dạo bước từ đầu hồi bên này sang đầu hồi bên kia.
- **Lan can con tiện bê tông (Balustrade):** Cao `1.05m`, đúc rỗng hoa văn quả trám / hoa chanh thông gió đón gió nồm nam.
- **Hệ thống ánh sáng & Chi tiết đời sống thực tế:**
  * Chao đèn nhôm hình nón lá thả dây xích, bóng đèn tròn sợi đốt 60W phát ánh sáng vàng ấm 2700K chập chờn khi hoàng hôn buông.
  * Mạng lưới dây điện "mạng nhện" chằng chịt uốn lượn dọc xà trần, kèm các hộp công tơ điện sứ tròn màu đen cổ điển gắn trước cửa từng căn hộ.
  * Dây thép phơi quần áo giăng ngang dọc hành lang với khăn mặt hoa, áo may ô sợi bông, quần âu bộ đội rung rinh trong gió.

##### 4. Căn Hộ Mẫu Thời Bao Cấp Bước Vào Được (Căn Hộ 204 - Tầng 2):
- **Vị trí:** Tọa độ `X = -62.0, Y = 3.80, Z = -62.0`.
- **Lối vào:** Cánh cửa gỗ màu xanh lá mạ có ô chớp thông gió bên trên, then cài sắt kêu lách cách. Người chơi bấm `[E]` mở cửa bước vào không gian bên trong diện tích `8.5m x 6.5m`.
- **Phòng khách bao cấp chân thực:**
  * **Bộ bàn ghế nan gỗ guột:** 1 bàn trà chữ nhật và 4 ghế nan uốn lượn mộc mạc, trên bàn đặt khay trà và bộ ấm chén quả hồng men rạn Bát Tràng.
  * **Tủ ly gỗ vec-ni:** Tủ chè gỗ gụ bóng loáng, bên trong bày bộ cốc chén thủy tinh Liên Xô, vài đĩa than ca khúc Hà Nội, và tượng sứ thiếu nữ ba miền.
  * **Quạt tai voi Liên Xô:** Cánh cao su dẻo màu xanh ngọc bích đặt trên kệ gỗ, quay tút-năng nhịp nhàng.
  * **Đài radio cassette cổ (VEF-206 / Riga):** Vỏ nhựa đen viền nhôm, phát rè rè bài hát *"Hà Nội Mùa Thu"* hoặc bản tin dự báo thời tiết thập niên 80.
  * **Tranh cổ động Canva AI:** Treo trang trọng giữa tường phòng khách bức tranh cổ động khổ lớn phong cách Canva AI Vintage: *"Thi Đua Lao Động Sản Xuất - Tất Cả Vì Chủ Nghĩa Xã Hội"*.
  * **Lịch bloc treo tường:** Tấm lịch bloc xé ngày `02/09/1985` nền đỏ chữ vàng giấy ngả màu thời gian.
- **Gian bếp dầu thô sơ:**
  * Chiếc bếp dầu Thăng Long 16 bấc sơn xanh ngọc, ngọn lửa xanh liu riu đun ấm nước nhôm.
  * Chạn bát tre mắt lưới sắt chống gián ruồi đựng bát sành hoa cúc, đũa tre vót tay.
  * Vại sành muối dưa cải bẹ nén chặt bằng hòn đá cuội xám góc chân tường.
- **Ban công cơi nới "Chuồng cọp" sắt (Tiger Cage Balcony):**
  * Khung lồng sắt dầm thép chữ U hàn cơi nới nhô ra ngoài không trung `1.4m` từ phòng khách.
  * Giàn hoa giấy đỏ rực rỡ buông rủ xum xuê phủ kín nóc chuồng cọp.
  * Chiếc lồng chim sơn ca bằng tre khuyên treo đung đưa dưới thanh sắt.
  * Vài chậu ớt chỉ thiên cay nồng và vò nước mưa hứng góc ban công.
  * **Điểm ngắm cảnh đắt giá:** Người chơi đứng tựa vào thanh chuồng cọp, phóng tầm mắt ngắm trọn vẹn hoàng hôn đỏ rực buông xuống sân chung khu tập thể.

#### 11.4.3. Sân Chung Khu Tập Thể & Không Gian Sinh Hoạt Cộng Đồng
- **Bể nước máy tập thể rêu phong (Communal Water Reservoir):**
  * Bể nước xây gạch trát xi măng kích thước `4.5m x 2.8m x 1.2m` rêu xanh phong trần.
  * 2 vòi van đồng cổ nước chảy róc rách vào xô nhôm múc nước.
  * Người chơi lại gần bấm `[E]` để nghe âm thanh tiếng vòi nước máy và tiếng xô nhôm va chạm.
- **Cây bàng già lá đỏ cuối thu:**
  * Thân cây vặn xoắn gồ ghề vươn cao 9.5m, xòe tán lá đỏ rực rỡ che bóng mát cho nửa góc sân.
- **Bàn cờ tướng đá của 2 cụ già kỳ thủ:**
  * Bàn đá tròn và 2 ghế đôn nơi 2 cụ ông trầm ngâm so tài chiếu tướng dưới bóng bàng.
- **Bảng tin phường mái ngói:**
  * Bảng tin gỗ có mái ngói che mưa, dán thông báo tem phiếu mua vải, lịch cúp điện luân phiên và tranh cổ động Canva AI vẽ tay cổ vũ vệ sinh phòng dịch.
- **Quán nước chè tươi ấm tích giành tre:**
  * Quán nước của bà cụ với kẹo lạc, kẹo dồi, điếu cày thuốc lào giòn tan.

#### 11.4.4. Công Thức Vật Lý Va Chạm Phân Tầng & Chống Xuyên Tường

```
        MÔ HÌNH VA CHẠM PHÂN TẦNG KHU TẬP THỂ KIM LIÊN (MULTI-FLOOR COLLIDERS):
   Tầng 4 / Sân thượng [Y = 11.4m]  ============================= (Floor Collider, _isBaseGround = true)
                                         │ Cầu thang dốc 32 độ
   Tầng 3 [Y = 7.6m]               ============================= (Floor Collider, _isBaseGround = true)
                                         │ Cầu thang dốc 32 độ
   Tầng 2 (Căn hộ 204) [Y = 3.8m]  ============================= (Floor Collider, _isBaseGround = true)
                                         │ Cầu thang dốc 32 độ
   Tầng 1 (Sảnh đón) [Y = 0.04m]   ============================= (Floor Collider, _isBaseGround = true)
                                   -----------------------------
   Mặt Đất Sân Chung [Y = 0.0m]    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (Ground Mesh, _isBaseGround = true)
```

1. **Floor Colliders (`_isBaseGround = true`):**
   - Mặt sàn bê tông của từng tầng được gắn cờ `_isBaseGround = true` và đăng ký trực tiếp vào mảng `colliders` của `WorldManager.js`.
   - Cơ chế Raycasting thẳng đứng 4.0m của `PlayerController.js` sẽ tự động phát hiện mặt sàn ngay dưới chân người chơi ở bất kỳ tầng nào (`Y = 0.04m`, `Y = 3.80m`, `Y = 7.60m`, `Y = 11.40m`), loại bỏ hoàn toàn lỗi rơi xuyên sàn xuống đất.
2. **Thin-Wall Obstacles (Va chạm tường mỏng):**
   - Thay vì dùng 1 hộp đặc bao trọn tòa nhà, hệ thống sử dụng các thanh dầm va chạm mỏng `0.35m` cho tường bao và `0.20m` cho tường ngăn phòng.
   - Các khoảng cửa đi (Doorway) rộng `1.2m - 1.5m` được để trống hoàn toàn trong danh sách obstacles, cho phép người chơi bước qua êm ái.
3. **Stair Step Colliders (Va chạm cầu thang):**
   - Mỗi vế thang bộ được gắn mặt nghiêng collider góc `32 độ` độ dày `0.30m` với `_isBaseGround = true`. Khi người chơi giữ phím `W`, nhân vật tự động bước leo lên chiếu nghỉ và sàn tầng trên mà không bị giật lag camera.
4. **Lan Can & Chuồng Cọp (Edge Fall-Protection Obstacles):**
   - Toàn bộ mép ngoài hành lang và chuồng cọp được gắn rào cản va chạm cao `1.10m` ngăn người chơi không bị trượt ngã khỏi tầng cao.

#### 11.4.5. Danh Mục Tài Nguyên Đồ Họa Canva AI Textures (Canva Design Assets)
Được phối hợp sản xuất giữa `nano-banana` và công cụ thiết kế Canva AI:
1. `canva_poster_kimlien.jpg`: Bức tranh cổ động thời bao cấp kích thước 1024x1024 phong cách Retro Typography Canva AI: hình ảnh người công nhân và nông dân hăng say lao động, màu đỏ bã trầu và vàng kim đặc trưng.
2. `kimlien_block_sign.png`: Biển số nhà nhôm dập nổi `A1 - KHU TẬP THỂ KIM LIÊN` sắc nét (512x256).
3. `bloc_calendar_1985.png`: Lịch bloc tường xé ngày 02/09/1985 giấy ngả vàng, font chữ số retro hoài niệm.
4. `ward_bulletin_board.png`: Bảng tin phường phấn trắng viết tay thông báo phân phối nhu yếu phẩm.

#### 11.4.6. Các Điểm Tương Tác Ký Ức Trong Khu Tập Thể (Interactive Memory Spots)
- **Điểm 1 (Sảnh Nhà A1):** `[E] Bước vào Cầu thang bộ Nhà Tập Thể A1`.
- **Điểm 2 (Cửa Căn hộ 204):** `[E] Mở cửa bước vào Căn Hộ 204 Thời Bao Cấp`.
- **Điểm 3 (Đài Radio Cassette):** `[E] Bật Đài Cassette Riga Nghe Bài Hát Hà Nội Mùa Thu` (phát file âm thanh `cassette_autumn_audio.mp3`).
- **Điểm 4 (Vòi Nước Bể Tập Thể):** `[E] Vặn Van Đồng Múc Nước Bể Tập Thể` (phát âm thanh `water_tap_audio.mp3`).
- **Điểm 5 (Lồng Chuồng Cọp Tầng 2):** `[E] Đứng Ngắm Hoàng Hôn Khu Tập Thể Qua Chuồng Cọp`.
- **Câu Đố Quang Học Số 4 (Perspective Alignment):** Đứng tại ban công chuồng cọp, căn góc nhìn qua khe sắt chuồng cọp với giàn hoa giấy và vầng mặt trời lặn để giải mã biểu tượng ký ức *"Chim Bồ Câu Bay Khỏi Lồng Sắt"*.

---

## 12. HỆ THỐNG CAMERA KÉP & GÓC QUAY MỞ MÀN ĐIỆN ẢNH

- **Tọa độ xuất phát người chơi:** `(x = 16.5, y = 0.5, z = -16.5)`.
- **Góc quay Camera mở màn (Initial Camera Orientation):**
  * **Góc quay ngang (Yaw):** Đúng chuẩn `0.785 rad` (45 độ).
  * **Góc chúc xuống (Pitch):** Đúng chuẩn `0.26 rad` (15 độ).
  * **Khoảng cách Spring-Arm:** `4.5 mét` sau lưng nhân vật.
  * **Khung cảnh mở màn:** Nhìn thẳng dọc tim Cầu Thê Húc đỏ son hướng về Đắc Nguyệt Lâu trong làn sương mai hồ Gươm huyền ảo.
- **Chuyển đổi TPS sang FPS:** Lerp mượt mà trong 0.3s. Ở FPS, tự động ẩn đầu/thân nhân vật và kích hoạt Viewfinder HUD máy ảnh cơ 35mm.

---

## 13. CƠ CHẾ GAMEPLAY CỐT LÕI

### 13.1. Giải Đố Giao Điểm Thị Giác (Perspective Alignment Puzzle)
- Căn góc ống kính máy ảnh để ghép nối 4 biểu tượng ký ức Hà Nội:
  1. **Hồ Gươm:** Cành liễu ghép với bóng Tháp Rùa tạo biểu tượng *Khuê Văn Các*.
  2. **Phố Cổ:** Dây điện hẻm hẹp ghép với chim bồ câu tạo 5 dòng kẻ nốt nhạc *"Người Hà Nội"*.
  3. **Cầu Long Biên:** Dầm thép Eiffel rọi bóng xuống bãi cát sông Hồng tạo *Thăng Long Đệ Nhất Rồng*.
  4. **Khu Tập Thể:** Song thưa chuồng cọp ghép với hoa giấy và vầng mặt trời đỏ tạo *Chim Bồ Câu Bay Khỏi Lồng Sắt*.
- Điều kiện giải mã: Khoảng cách `< 0.8m`, góc nhìn `dot > 0.985`, điểm khớp `alignmentScore >= 0.95`.

### 13.2. Săn Khoảnh Khắc & Tráng Phim Ký Ức
- Bấm phím `Space` hoặc nút chụp trên Viewfinder HUD: Kích hoạt chớp màn trập cơ học kim loại đanh thép (0.08s) -> Trích xuất Canvas WebGL -> Phủ bộ lọc Grain/Portra -> Gắn tem bưu chính & câu thơ tản văn -> Lưu trữ vào `IndexedDB`.

---

## 14. LUỒNG ONBOARDING & WEB PORTAL (3 BƯỚC HOÀN CHỈNH)

1. **Bước 1: Age Gate (18+):** Kiểm tra ngày tháng năm sinh đạt >= 18 tuổi.
2. **Bước 2: Đăng Nhập:** Hỗ trợ Google SSO Mock 1-Click, Email/Mật khẩu vintage, Khách vãng lai.
3. **Bước 3: Tạo Nhân Vật:**
   - Ô nhập tên: 3 - 16 ký tự.
   - **Debounce 500ms:** Gọi `window.GameAPI.checkCharacterNameAvailability(name)`.
   - Nếu trùng: Viền đỏ rung lắc, hiện 3 gợi ý tên (`[Tên]_1990`, `LãngTử_[Tên]`, `[Tên]_PhốCổ`).
   - Nếu hợp lệ: Viền xanh, bật sáng nút vàng đồng "Bước Vào Ký Ức".
   - Chọn 1 trong 4 nhân vật 3D Việt Nam độc bản với Cooldown 600ms chống spam click.

---

## 15. BẢO TOÀN TUYỆT ĐỐI 100% 9 NPC LỊCH SỬ TRONG `WorldManager.js`

> **LỆNH TỪ SẾP TỔNG:**  
> *"Và các NPC giữ nguyên cho tôi, tôi không yêu cầu đổi NPC, tôi chỉ cần đổi nhân vật người chơi game thôi!"*

Toàn bộ 9 NPC lịch sử cùng các điểm tương tác môi trường trong [src/core/WorldManager.js](file:///d:/H%C3%80%20N%E1%BB%98I%20CH%E1%BA%A0M%20V%C3%80O%20K%C3%9D%20%E1%BB%A8C%20,HANOI%20OPEN%20REVERIE/src/core/WorldManager.js) được bảo toàn nguyên vẹn 100%:

| STT | Tên Nhân Vật Lịch Sử | Vị Trí / Khu Vực | Hàm Khởi Tạo Trong Core | Chi Tiết Tạo Hình & Tương Tác |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Bác Hùng**<br>Bán Bánh Mì Dạo | Tuần tra Phố Cổ & Đường Tàu | `_createBanhMiVendorNPC(x, z)` | Xe đạp Thống Nhất khung nam màu xanh bộ đội, hòm kính đựng bánh mì vàng giòn sau gác-ba-ga, mũ cối, bánh xe lăn mượt mà. |
| **2** | **Chị Lan**<br>Gánh Hàng Hoa Tươi | Ven Hồ Gươm & Ngõ Phố | `_createFlowerVendorNPC(x, z, rotY)` | Áo bà ba nâu, nón lá nghiêng, đòn gánh tre uốn cong với hai thúng hoa sen hồng Tây Hồ và cúc vàng rực rỡ. |
| **3** | **Bà Cụ Quán Nước**<br>Chè Xanh Giành Tre | Vỉa hè góc phố cổ `(-50, 58)` | `_createTeaStallVendorNPC(x, z)` | Bà cụ ngồi ghế đẩu gỗ, ấm tích ủ trong giành tre giữ nhiệt, phích nước Rạng Đông vỏ nhôm đỏ, đĩa kẹo lạc giòn rụm. |
| **4** | **Hai Cụ Già Kỳ Thủ**<br>Đánh Cờ Tướng Sân Tập Thể | Sân khu tập thể Kim Liên `(-75, -78)` | `_createChessPlayersNPC(x, z)` | Cụ ông vuốt chòm râu bạc đăm chiêu bên bàn cờ tướng gỗ, cụ ông đối diện giơ quân cờ chiếu tướng kịch tính. |
| **5** | **Bác Dân Phố Cổ**<br>Dạo Bộ Mũ Phớt | Đường dạo ven hồ `(38, -70)` | `_createCitizenNPC(...)` | Trang phục thanh lịch thập niên 80, mũ phớt cổ điển, dạo bước ngắm sương mai hồ Gươm. |
| **6** | **Thanh Niên Ngắm Tàu**<br>Cà Phê Đường Tàu | Quán cà phê đường ray `(-53, 55)` | `_createCoffeePatronNPC(...)` | Ngồi ghế gỗ ngắm tách cà phê phin nhôm đang nhỏ giọt chầm chậm và chờ đoàn tàu ký ức chạy qua. |
| **7** | **Cụ Lang Triệu**<br>Thầy Thuốc Đông Y | Hiệu thuốc bắc phố Lãn Ông `(-90, 46.8)` | `_initInteractables()` - Điểm 3 | Bắt mạch bốc thuốc bổ dưỡng sinh, mùi quế chi, hoa cúc, tủ thuốc gỗ mun 100 ngăn gia truyền. |
| **8** | **Cô Mai**<br>Nghệ Nhân May Đo Lụa | Tiệm may phố Lương Văn Can `(-114, 46.8)` | `_initInteractables()` - Điểm 4 | Chiếc máy khâu Singer chân gang đạp nhịp nhàng, các súc lụa tơ tằm Vạn Phúc óng ánh dệt hoa cúc. |
| **9** | **Bác Cả Phở**<br>Đệ Nhất Phở Gia Truyền 1954 | Quán phở phố cổ `(-42, 79.2)` | `_initInteractables()` - Điểm 5 | Nồi nước dùng ninh xương bò 18 tiếng thơm lừng mùi quế hồi gừng nướng, phở bò tái lăn gừng nóng hổi. |

*Ngoài ra, các điểm tương tác Quán bia hơi Chú Tuấn (`-66, 79.2`), Tiệm sửa đồng hồ Liên Xô Bác Thợ Kim (`-90, 79.2`), Tiệm cắt tóc bình dân Chú Chiến (`-114, 79.2`) và đàn cá chép vàng bơi lội `lakeFish` trong lòng Hồ Gươm được duy trì hoạt động 100%.*

---

## 16. PHÂN CHIA NHIỆM VỤ CHO 4 MŨI NHỌN SẢN XUẤT

| Mũi Nhọn | Phân Vùng File Đảm Trách | Nhiệm Vụ Kỹ Thuật Trọng Tâm | Tiêu Chuẩn Nghiệm Thu |
| :--- | :--- | :--- | :--- |
| **Coder Chính**<br>(`coder-chinh`) | `src/core/*`<br>(trừ animations.js)<br>`src/bridge/*` | 1. **Kiến trúc Nhà Tập Thể Kim Liên Mở 100%:** Xây dựng khối nhà A1 thông thủy, sảnh đón, cầu thang bộ granito mài, hành lang con tiện, căn hộ mẫu 204, chuồng cọp sắt.<br>2. **Hệ thống va chạm đa tầng:** Floor colliders phân tầng `_isBaseGround = true`, thin-wall obstacles, cầu thang step colliders.<br>3. `_loadToken` chống Race Condition, đệ quy `_disposeHierarchy()` dọn sạch VRAM.<br>4. Áp dụng `facingOffset` triệt tiêu 100% Moonwalking.<br>5. BẢO TOÀN TUYỆT ĐỐI 100% 9 NPC lịch sử trong `WorldManager.js`. | Di chuyển tự do trong nhà tập thể, leo cầu thang lên các tầng, không rơi xuyên sàn, 60 FPS mượt mà. |
| **Animation Master**<br>(`animation-master`) | `src/core/animations.js` | 1. Tối ưu hóa chu kỳ Walk/Run/Idle 60 FPS, đồng bộ AnimationMixer, retargeting không giật lag.<br>2. Uốn lượn 2 tà áo dài 3D có thể tích và nón lá theo dao động hông và gió hồ.<br>3. Lò xo giảm chấn quán tính Nón Lá (Lag Damping Spring-Damper).<br>4. Cross-fade Blending 0.2s - 0.3s triệt tiêu giật cục. | Hoạt họa sinh học người thật tự nhiên, không bao giờ bị đơ cứng (Frozen Pose) khi đổi nhân vật. |
| **UI Polish**<br>(`ui-polish`) | `src/ui/*`<br>`styles/*`<br>`index.html` | 1. Bổ sung Debounce & Cooldown 600ms chống spam click đổi nhân vật.<br>2. Thiết kế Onboarding 3 bước (Age Gate 18+, Login, Character Creator).<br>3. Giao diện chọn 4 nhân vật 3D Việt Nam độc bản sang trọng hoài niệm.<br>4. Viewfinder HUD máy ảnh film, Scrapbook Album dán tem, Modal đối thoại 9 NPC & Cư dân tập thể.<br>5. Bắt và bắn đúng chuẩn 100% các sự kiện EventBus. | Giao diện hoài niệm sang trọng, responsive mọi độ phân giải, không lỗi console, ăn khớp hoàn toàn với Core. |
| **Họa Sĩ & Canva AI**<br>(`nano-banana`) | `assets/textures/*`<br>`assets/models/*`<br>`assets/ui/*`<br>`assets/photos/*`<br>`assets/audio/*` | 1. Cung cấp bộ Textures Canva AI Vintage: `canva_poster_kimlien.jpg`, `kimlien_block_sign.png`, `bloc_calendar_1985.png`, `ward_bulletin_board.png`.<br>2. Cung cấp Textures PBR (nước Hồ Gươm, rêu Tháp Rùa, tường vôi vàng, thép cầu, granito mài, gạch chỉ đỏ).<br>3. Cung cấp âm thanh: `water_tap_audio.mp3`, `cassette_autumn_audio.mp3`.<br>4. 3D models GLTF SkinnedMesh tối ưu chuẩn văn hóa Việt Nam. | Tất cả tài nguyên tồn tại thực tế trên đĩa cứng, đúng kích thước, không một đường link nào bị lỗi 404. |

---

## 17. DANH SÁCH TÀI NGUYÊN (ASSET REQUIREMENTS)

### 17.1. Textures Môi Trường, Canva AI Graphics & Nhân Vật 3D PBR (`assets/textures/`)
1. `canva_poster_kimlien.jpg`: Tranh cổ động thời bao cấp Canva AI kích thước 1024x1024.
2. `kimlien_block_sign.png`: Biển số nhà nhôm dập nổi `A1 - KHU TẬP THỂ KIM LIÊN` (512x256).
3. `bloc_calendar_1985.png`: Lịch bloc tường xé ngày 02/09/1985 (256x512).
4. `ward_bulletin_board.png`: Bảng tin phường phấn trắng viết tay thời bao cấp (1024x512).
5. `lake_water_norm.jpg`: Normal map mặt nước Hồ Gươm gợn sóng lăn tăn (512x512 Seamless).
6. `turtle_tower_moss.jpg`: Texture đá phủ rêu xanh cổ kính của Tháp Rùa và Đền Ngọc Sơn (1024x1024).
7. `old_wall_yellow.jpg`: Vôi quét tường màu vàng hoàng cúc bong tróc loang lổ (1024x1024).
8. `rusty_iron_beam.jpg`: Bề mặt dầm thép rỉ sét màu nâu cánh gián cầu Long Biên (1024x1024).
9. `hanoi_brick_ground.jpg`: Đá xanh lát vỉa hè và gạch chỉ vỉa hè phố cổ ẩm ướt (1024x1024).
10. `vintage_posters.jpg`: Bản ghép các áp phích cổ, biểu ngữ văn hóa thập niên 80-90 (1024x1024).
11. `wood_counter_varnish.jpg`: Mặt gỗ lim đánh vec-ni cánh gián bóng loáng viền đồng (1024x1024).
12. `bridge_ramp_stone.jpg`: Bề mặt bê tông đá dăm khía rãnh chống trượt dốc dẫn cầu Long Biên (1024x1024).
13. `bougainvillea_blossom.png`: Giàn hoa giấy đỏ hồng rực rỡ buông rủ (PNG trong suốt).
14. `char_silk_ivory_white.jpg` & `char_silk_ivory_white_norm.jpg`: Lụa tơ tằm trắng ngà mềm mại dệt hoa văn chìm.
15. `char_cotton_pink_lotus.jpg` & `char_cotton_pink_lotus_norm.jpg`: Vải đũi tơ tằm hồng cánh sen.
16. `char_silk_black_pants.jpg` & `char_silk_black_pants_norm.jpg`: Lụa đen bóng mờ may quần áo dài/bà ba.
17. `char_wool_charcoal_suit.jpg` & `char_wool_charcoal_suit_norm.jpg`: Vải dạ nỉ xám than may suit lịch lãm.
18. `char_silk_blue_brocade.jpg` & `char_silk_blue_brocade_norm.jpg`: Gấm xanh hoàng gia Thăng Long dệt hoa văn cổ.
19. `char_scarf_caro_krama.jpg` & `char_scarf_caro_krama_norm.jpg`: Khăn rằn caro thủ công.
20. `char_bamboo_non_la.jpg` & `char_bamboo_non_la_norm.jpg`: Nan tre trúc chỉ đan nón lá.

### 17.2. UI Elements & Biểu Tượng (`assets/ui/`)
1. `viewfinder_frame.png`: Khung viền quang học máy ảnh cơ 35mm kèm vạch đo sáng và thước tiêu cự.
2. `shutter_button.png`: Nút chụp máy ảnh kim loại vân tròn cổ điển.
3. `stamp_hanoi.png`: Con tem bưu chính xưa in hình chùa Một Cột và Tháp Rùa mép răng cưa.
4. `logo_reverie.png`: Logo chữ thư pháp hoài niệm "Hà Nội: Chạm Vào Ký Ức" viền vàng đồng.
5. `train_ticket_retro.png`: Tấm vé tàu hỏa giấy nâu mộc mạc Hà Nội - Hải Phòng xưa.

### 17.3. Bộ Ký Ức & Ảnh Film Hoàn Chỉnh (`assets/photos/`)
1. `memory_turtle_mist.jpg`: Ảnh film Tháp Rùa huyền ảo trong màn sương chớm đông.
2. `memory_train_street.jpg`: Đoàn tàu hỏa chạy lướt sát những mái ngói rêu phong phố Phùng Hưng.
3. `memory_long_bien.jpg`: Dầm thép cầu Long Biên nhuộm đỏ trong ánh hoàng hôn sông Hồng.
4. `memory_apartment.jpg`: Ban công khu tập thể cũ với lồng chuồng cọp và giàn hoa giấy rực cháy.

### 17.4. Âm Thanh Môi Trường & Hiệu Ứng (`assets/audio/`)
1. `water_tap_audio.mp3`: Tiếng nước máy chảy róc rách từ van đồng bể nước tập thể.
2. `cassette_autumn_audio.mp3`: Tiếng đài cassette rè rè hoài niệm ca khúc Hà Nội mùa thu.
3. `ambient_lake.mp3`: Tiếng sóng hồ vỗ bờ đá nhẹ, gió rặng liễu, tiếng chuông chùa xa xăm.
4. `ambient_train.mp3`: Tiếng còi tàu hơi nước vang vọng trong ngõ hẹp, tiếng rít kim loại đường ray.
5. `ambient_street.mp3`: Tiếng ve râm ran trưa hè, tiếng rao hàng rong bánh khúc/xôi lạc.
6. `shutter_click.mp3`: Tiếng chớp màn trập cơ học kim loại đanh thép của máy ảnh cơ Leica M3.
7. `photo_develop.mp3`: Tiếng lật tráng giấy ảnh và tiếng nước chảy trong phòng tối tráng phim.

---

## 18. TIÊU CHUẨN KIỂM DUYỆT CHẤT LƯỢNG TOÀN DIỆN (QA CHECKLIST 11 CHỐT)

Trước khi nghiệm thu dự án đạt mức độ "PASSED 100%", subagent `kiem-duyet-qa` phải kiểm tra lần lượt 11 chốt kiểm định:

### Chốt 1: Tách Biệt Vùng Làm Việc & Toàn Vẹn File (Khâu Kiểm Duyệt 1 - Tiêu chí 1)
- [ ] Không có file nào của `coder-chinh` bị ghi đè bởi `ui-polish` hay `animation-master` và ngược lại.
- [ ] Khung sườn thư mục chuẩn xác: `src/bridge/` cho giao tiếp chung, `src/core/` cho 3D logic, `src/ui/` & `styles/` cho giao diện.

### Chốt 2: Khâu Kiểm Duyệt API & Events (Khâu Kiểm Duyệt 1 - Tiêu chí 2)
- [ ] Mọi sự kiện phát ra từ `GameEventBus` và mọi hàm trong `GameAPI` đều trùng khớp 100% từng chữ hoa chữ thường với Mục 4 của tài liệu này.
- [ ] Giao tiếp giữa UI và Core hoàn toàn thông qua EventBus và GameAPI, không truy cập chéo biến nội bộ bừa bãi.

### Chốt 3: Kiểm Soát Khắc Phục Lỗi 1 (4 Nhân Vật Tách Biệt Thực Sự)
- [ ] Xóa bỏ hoàn toàn việc hardcode asset cố định trong `_load3DHumanoidCharacter`.
- [ ] Mỗi nhân vật nạp đúng model, đúng trang phục và đúng phong cách độc bản.

### Chốt 4: Kiểm Soát Khắc Phục Lỗi 2 (Triệt Tiêu 100% Moonwalking)
- [ ] Áp dụng đúng `facingOffset` cho từng nhân vật.
- [ ] Bấm phím `W`: Nhân vật tiến thẳng về phía trước và mặt nhìn thẳng theo hướng tiến 100%. Bấm `A`/`D`: Nhân vật xoay mượt mà đúng hướng rẽ.

### Chốt 5: Kiểm Soát Khắc Phục Lỗi 3 (Chống Đơ Cứng Hoạt Họa - Frozen Pose)
- [ ] Khi đổi nhân vật, AnimationMixer mới được kích hoạt trơn tru, play ngay `idleAction`.
- [ ] WASD di chuyển chuyển đổi mượt sang `walkAction` và `runAction` 60 FPS, không bị kẹt T-pose.

### Chốt 6: Kiểm Soát Khắc Phục Lỗi 4 & 6 (Chống Race Condition & Ghost Overlapping)
- [ ] Kiểm tra cơ chế `_loadToken` tăng tiến trong `PlayerController.js`.
- [ ] Hàm `_disposeHierarchy()` giải phóng toàn bộ Geometry, Material, Textures và uncache AnimationMixer cũ.
- [ ] Cooldown 600ms chống spam click tại UI hoạt động hiệu quả.

### Chốt 7: Kiểm Soát Khắc Phục Lỗi 5 (Loại Bỏ Hoàn Toàn Sci-Fi)
- [ ] Không còn bất kỳ mô hình Sci-Fi / Soldier nào xuất hiện trong game.
- [ ] Đầy đủ 4 hình tượng văn hóa Hà Nội: Nữ sinh Áo dài, Cô gái Áo bà ba, Nam trí thức Âu phục suit, Chàng trai Thăng Long Áo dài gấm ngũ thân.

### Chốt 8: Kiểm Soát Khắc Phục Lỗi 7 & 8 (Scale Bounding Box & MeshoptDecoder)
- [ ] Kích thước 4 nhân vật được chuẩn hóa đúng tỷ lệ nhân trắc học (`1.65m - 1.78m`), chân chạm sàn vững vàng.
- [ ] Cấu hình `MeshoptDecoder` hoạt động bình thường, không crash runtime.

### Chốt 9: Bảo Toàn 100% 9 NPC Lịch Sử trong `WorldManager.js`
- [ ] Đầy đủ 9 NPC lịch sử: Bác Hùng bán bánh mì dạo xe đạp Thống Nhất, Chị Lan gánh hoa, Bà cụ quán trà đá giành tre, Hai cụ già đánh cờ, Bác dân dạo bộ, Thanh niên cà phê đường tàu, Thầy lang Triệu Lãn Ông, Cô Mai thợ may lụa, Bác Cả Phở 1954; cùng các tương tác quán bia hơi, tiệm đồng hồ, tiệm cắt tóc và đàn cá chép hồ Gươm.

### Chốt 10: Lan Can Cầu, Spawn Point & Kiến Trúc Tường Mỏng Phố Cổ
- [ ] Spawn tại tọa độ `(16.5, 0.5, -16.5)`. Camera ban đầu có `yaw = 0.785 rad` (45 độ) hướng dọc Cầu Thê Húc.
- [ ] Capsule Horizontal Collision kẹp an toàn lan can cầu.
- [ ] Tường bao mỏng 0.35m, thông thủy phòng 11.3m x 15.3m x 4.2m người chơi đi vào bình thường.

### Chốt 11: Kiểm Soát Công Trình Khu Tập Thể Kim Liên Mở Hoàn Toàn (Khắc Phục Lỗi Khối Hộp Đặc)
- [ ] Tuyệt đối không còn khối hộp đặc BoxGeometry bao bọc kín tòa nhà tập thể.
- [ ] Người chơi có thể tự do bước qua sảnh đón tầng 1 của Nhà A1, leo cầu thang bộ granito mài lên tầng 2, 3, 4.
- [ ] Sàn các tầng có collider `_isBaseGround = true`, người chơi đi lại tự nhiên không bị rơi xuyên sàn.
- [ ] Căn hộ mẫu 204 mở được cửa vào trong: đầy đủ bàn ghế nan gỗ, đài cassette, tủ ly, bếp dầu, vại dưa cà và tranh cổ động Canva AI.
- [ ] Người chơi đứng được trong lồng chuồng cọp sắt đón hoàng hôn mà không bị vướng obstacle ảo.
- [ ] Sân chung đầy đủ bể nước tập thể van đồng, cây bàng già lá đỏ, bàn cờ tướng 2 cụ già và bảng tin phường.

---
*Bản tài liệu đặc tả kỹ thuật này là pháp lệnh kỹ thuật cao nhất cho toàn bộ đội ngũ Game Studio.*
