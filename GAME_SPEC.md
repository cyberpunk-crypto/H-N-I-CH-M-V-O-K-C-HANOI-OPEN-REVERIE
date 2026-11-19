# HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
## TÀI LIỆU KIẾN TRÚC KỸ THUẬT & ĐẶC TẢ HỆ THỐNG TOÀN DIỆN (GAME SPECIFICATION)

---

> **Mã dự án:** `HANOI-OPEN-REVERIE-3D`  
> **Phiên bản tài liệu:** `5.0.0-AUTUMN-DAY-NIGHT-CLEAN-HUD`  
> **Phê duyệt:** Sếp Tổng Game Studio & Hội đồng Kiến trúc sư Trưởng  
> **Ngày ban hành:** 19/11/2026  
> **Áp dụng cho 6 Bộ phận chuyên môn Studio AI:**  
> 1. `game-architect` (Kiến Trúc Sư Hệ Thống, GDD, Ranh Giới 4 Phân Khu & API Contracts)  
> 2. `nano-banana` (Lead 2D/3D Asset Artist, Textures PBR, Canva AI Graphics, Nhân Vật Việt Nam Độc Bản & Audio)  
> 3. `coder-chinh` (Core Logic 3D Engine, GTA V Locomotion, Chu Kỳ Ngày - Đêm, Day/Night Lighting, Collision Engine)  
> 4. `animation-master` (Hoạt Họa 3D Skeletal 60 FPS, Autumn Leaves VFX, Mây Trôi Lãng Đãng & Nón Lá Lag Damping)  
> 5. `ui-polish` (Giao Diện Tối Giản Clean HUD, Modal Cài Đặt Toàn Năng, La Bàn Tinh Gọn, Zone Banner Fade Out)  
> 6. `kiem-duyet-qa` (Trưởng Ban Kiểm Định Chất Lượng, Audit 4 Tầng & Săn Lỗi Chí Mạng).

---

## 1. TỔNG QUAN DỰ ÁN & CÁC NÂNG CẤP V5.0.0 ĐỘT PHÁ

### 1.1. Tầm nhìn nghệ thuật và trải nghiệm
**HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)** là tựa game thế giới mở 3D không gian hoài niệm Hà Nội (Thập niên 80-90 giao thoa đương đại) vận hành mượt mà trên trình duyệt Web (WebGL / WebGL2). 

Người chơi hóa thân thành một "Kẻ Mộng Mơ" dạo bước qua 4 phân khu đặc trưng của thủ đô:
1. **Hồ Gươm & Tháp Rùa:** Trái tim di sản bảng lảng sương mai mùa thu, Cầu Thê Húc đỏ son 15 nhịp cong, Đền Ngọc Sơn (Đắc Nguyệt Lâu 2 tầng 8 mái cong), Tháp Bút ("Tả Thanh Thiên") và Đài Nghiên đá đào kết hợp Canva AI. Tuyến đường dạo bộ được nắn hoàn toàn trên cạn men theo phố Đinh Tiên Hoàng (`R >= 90m`), không còn cắt ngang mặt nước.
2. **Mê Cung Phố Cổ & Phố Đường Tàu:** Ngõ phố thông thủy tường mỏng, Tiệm Cà phê Trứng, Bách Hóa Mậu Dịch.
3. **Nhịp Cầu Long Biên & Sông Hồng:** Dầm thép Eiffel hoang hoải rỉ sét, đường ray tàu hỏa, Ga Long Biên. Đã xóa bỏ triệt để cầu thang thừa mạn trái dốc dẫn cầu.
4. **Quần Thể Khu Tập Thể Kim Liên Mở 100%:** Công trình nhà tập thể lắp ghép bê tông mở hoàn toàn, cầu thang bộ granito mài, hành lang con tiện thông thoáng, căn hộ mẫu bao cấp 204 đầy đủ hiện vật, ban công "chuồng cọp" vươn đón nắng hoàng hôn.

### 1.2. Trọng tâm nâng cấp phiên bản v5.0.0:
1. **[HUD & Menu Tối Giản - Clean Screen]:** Thu gọn toàn bộ các nút Album, Bản Đồ, Máy Ảnh, Đổi Nhân Vật vào bên trong Modal Cài Đặt. Trên màn hình chính chỉ để lại duy nhất nút bánh răng Cài Đặt tinh tế góc phải trên và Mini-la bàn góc trái dưới.
2. **[La Bàn Định Hướng & Banner Vùng Tự Ẩn]:**
   - La bàn thẩm mỹ: Bỏ 4 nhãn chữ rườm rà ("Phố Cổ", "Long Biên", "Tập Thể", "Hồ Gươm"). Thiết kế vành đồng cổ điển với kim la bàn và vạch 0 độ (Bắc - N) màu đỏ son.
   - Banner địa danh khu vực: Khi chuyển vùng, banner hiển thị trong 4.5 giây rồi tự động mờ dần (fade out) và ẩn đi hoàn toàn, không che chắn tầm nhìn.
3. **[Xóa Cầu Thang Thừa & Sửa Đường Dạo Bộ Lấn Nước]:**
   - Xóa bỏ cầu thang bộ thừa ở bên cạnh bên trái Cầu Long Biên (`stairwayGroup`).
   - Nắn lại tuyến đường dạo bộ di sản men theo vỉa hè phố Đinh Tiên Hoàng trên cạn (`R >= 90m`), triệt tiêu đoạn đường lấn nước che mặt nước Cầu Thê Húc & Đền Ngọc Sơn.
4. **[Cầu Thê Húc, Đền Ngọc Sơn & Tháp Bút - Đài Nghiên Canva AI]:** Đặc tả kiến trúc 3D Cầu Thê Húc son đỏ, Đắc Nguyệt Lâu 2 tầng 8 mái, Tháp Bút đá 5 tầng "Tả Thanh Thiên", Đài Nghiên quả đào 3 chú ếch đá.
5. **[Bầu Trời Mùa Thu Hà Nội & Chu Kỳ Ngày - Đêm]:** Bầu trời thu trong xanh, mây trắng trôi lãng đãng, hiệu ứng lá vàng mùa thu rơi lả tả (Autumn Leaves VFX), chu kỳ Ngày - Đêm mượt mà và hệ thống chiếu sáng ban đêm tự động thắp sáng đèn lồng, đèn đường, đèn cầu.

---

## 2. BÁO CÁO KIỂM ĐIỂM CHUYÊN SÂU & HỒ SƠ LỖI HỆ THỐNG

| STT | Vấn Đề / Lỗi Kỹ Thuật | Mô Tả & Biểu Hiện | Nguyên Nhân Gốc Rễ | Giải Pháp Triệt Để v5.0.0 |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **HUD rườm rà, che khuất tầm nhìn** | Màn hình chính dày đặc các nút bấm (Album, Bản Đồ, Máy Ảnh, Đổi Nhân Vật) gây rối mắt. | Bố trí UI phân tán, thiếu phân cấp trải nghiệm ngắm cảnh tĩnh lặng. | Thu gọn toàn bộ vào **Modal Cài Đặt**, chỉ để lại nút bánh răng góc phải trên. |
| **2** | **La bàn rườm rà & Banner vùng treo cố định** | Mặt la bàn dán 4 chữ định hướng thô thiển; banner tên phố hiện cố định trên đỉnh màn hình không bao giờ tắt. | Chưa có cơ chế Auto-hide Timer cho banner và la bàn thiếu chuẩn mỹ thuật cổ điển. | Bỏ 4 chữ trên la bàn, làm kim chỉ Bắc chuẩn xác; Banner vùng hiện **4.5s** rồi tự động fade out ẩn đi. |
| **3** | **Cầu thang thừa & Đường dạo bộ lấn lòng hồ** | Cầu thang sắt thừa mạn trái Cầu Long Biên gây vướng víu; đường dạo bộ đè ngang mặt nước che mất chân Cầu Thê Húc. | Tọa độ spline đường dạo bộ tính theo bán kính nhỏ (< 85m) đâm xuyên lòng hồ; asset cầu thang phụ không cần thiết. | **Xóa bỏ `stairwayGroup`** mạn trái cầu; **nắn đường dạo bộ `R >= 90m`** nằm trọn vẹn trên vỉa hè đất liền phố Đinh Tiên Hoàng. |
| **4** | **Thiếu vắng Đền Ngọc Sơn & Tháp Bút - Đài Nghiên** | Quần thể Hồ Gươm chỉ có Tháp Rùa đơn lẻ, thiếu cụm di tích Đền Ngọc Sơn linh thiêng. | Chưa hoàn thiện đặc tả kiến trúc cụm di tích Đền Ngọc Sơn. | Xây dựng 3D **Cầu Thê Húc đỏ son, Đắc Nguyệt Lâu 2 tầng 8 mái cong, Tháp Bút Tả Thanh Thiên và Đài Nghiên đá đào**. |
| **5** | **Bầu không khí đơn điệu, thiếu chất thu Hà Nội** | Ánh sáng ban ngày cố định, không có chu kỳ thời gian, không có lá vàng rơi đặc trưng mùa thu thủ đô. | Chưa tích hợp Day/Night Cycle và hệ thống Particle System thời tiết mùa thu. | Tích hợp **Bầu trời thu trong xanh, Mây trôi lãng đãng, Autumn Leaves VFX chao nghiêng và Chu kỳ Ngày - Đêm tự động bật đèn**. |

---

## 3. KIẾN TRÚC HỆ THỐNG & TÁCH BIỆT VÙNG LÀM VIỆC (STRICT BOUNDARIES)

> **KHÂU KIỂM DUYỆT 1 - TIÊU CHÍ (1): TÁCH BIỆT RÕ RÀNG GIỮA CORE CODE VÀ UI CODE**  
> Để đảm bảo 4 bộ phận (`coder-chinh`, `ui-polish`, `animation-master`, `nano-banana`) sản xuất song song 100% không xung đột mã nguồn (zero merge conflicts), hệ sinh thái thư mục được phân định ranh giới nghiêm ngặt như sau:

```
d:/HÀ NỘI CHẠM VÀO KÝ ỨC ,HANOI OPEN REVERIE/
├── index.html                     # Điểm vào ứng dụng (Shell, nạp modules)
├── package.json                   # Cấu hình dự án & scripts test
├── GAME_SPEC.md                   # Bản đặc tả kỹ thuật này (Chuẩn mực tối cao v5.0.0)
├── REVIEW_LOG.md                  # Nhật ký kiểm duyệt chất lượng QA
│
├── assets/                        # [VÙNG CỦA HỌA SĨ nano-banana & CANVA AI GRAPHICS]
│   ├── models/                    # Mô hình 3D nhân vật GLTF/GLB (Michelle.glb, Soldier.glb, Xbot.glb, v.v.)
│   ├── textures/                  # Textures 3D PBR/Albedo/Normal & Canva AI Posters
│   │   ├── the_huc_lacquer_red.jpg    # Sơn then đỏ son Cầu Thê Húc
│   │   ├── ngoc_son_roof_moss.jpg     # Ngói mũi hài rêu phong Đắc Nguyệt Lâu
│   │   ├── thap_but_stone.jpg         # Đá xanh cổ Tháp Bút
│   │   ├── leaf_autumn_yellow.png     # Hạt lá vàng mùa thu rơi (Canva AI)
│   │   ├── leaf_autumn_red.png        # Hạt lá bàng đỏ mùa thu rơi
│   │   ├── canva_poster_kimlien.jpg   # Tranh cổ động thời bao cấp Canva AI
│   │   ├── kimlien_block_sign.png     # Biển số nhà nhôm A1 dập nổi Canva
│   │   └── bloc_calendar_1985.png     # Lịch bloc tường ngày 2/9/1985
│   ├── ui/                        # Đồ họa giao diện, biểu tượng
│   │   ├── compass_rose_vintage.png   # Mặt la bàn đồng cổ điển không chữ
│   │   ├── compass_needle.png         # Kim la bàn định hướng tinh xảo
│   │   └── gear_settings_icon.png     # Biểu tượng bánh răng Cài Đặt retro
│   ├── photos/                    # Ảnh film ký ức mẫu tráng sẵn
│   └── audio/                     # Tài nguyên âm thanh âm hưởng Hà Nội
│       ├── autumn_wind_leaves.mp3     # Tiếng gió thu xào xạc lá khô
│       ├── temple_bell_distant.mp3    # Tiếng chuông Đền Ngọc Sơn xa xăm
│       ├── water_tap_audio.mp3        # Tiếng vòi nước bể tập thể róc rách
│       └── cassette_autumn_audio.mp3  # Tiếng đài cassette rè rè bài hát Hà Nội
│
├── src/
│   ├── bridge/                    # [VÙNG GIAO TIẾP DÙNG CHUNG - BẤT BIẾN]
│   │   ├── GameEvents.js          # Hệ thống EventBus tập trung (window.GameEventBus)
│   │   └── GameAPI.js             # Window Contract APIs cho UI tương tác với 3D (window.GameAPI)
│   │
│   ├── core/                      # [VÙNG CỦA coder-chinh & animation-master]
│   │   ├── GameEngine.js          # Khởi tạo WebGL, GameLoop, quản lý Day/Night Cycle
│   │   ├── SceneManager.js        # Bầu trời thu, Fog mùa thu, Đèn chiếu ban đêm, Quản lý ánh sáng
│   │   ├── WorldManager.js        # Cụm Đền Ngọc Sơn, Cầu Thê Húc, Tháp Bút, Nắn đường dạo bộ R>=90m, Xóa thang thừa
│   │   ├── ZoneManager.js         # Quản lý 4 phân khu & phát sự kiện CORE:ZONE_ENTERED
│   │   ├── PlayerController.js    # GTA V Locomotion: Floor Colliders, Raycast Snapping, facingOffset
│   │   ├── CharacterFactory.js    # 4 Nhân Vật Người Thật Hữu Cơ 3D, Da Thịt Á Đông & Trang Phục Lớp Khối 3D
│   │   ├── animations.js          # [animation-master] Autumn Leaves Falling VFX, Mây trôi lãng đãng, MoCap Retargeting
│   │   ├── CameraController.js    # Camera Kép (TPS Spring-Arm yaw 0.785 rad & FPS Viewfinder)
│   │   ├── PerspectivePuzzle.js   # Hệ thống giải đố căn góc nhìn quang học
│   │   ├── PhotoSystem.js         # Cơ chế chụp ảnh film, canvas capture, lưu khoảnh khắc
│   │   └── StorageService.js      # Dịch vụ LocalStorage / IndexedDB đồng bộ dữ liệu
│   │
│   └── ui/                        # [VÙNG CỦA ui-polish - GIAO DIỆN TỐI GIẢN CLEAN HUD]
│       ├── UIManager.js           # Điều phối toàn bộ vòng đời UI & Clean Screen HUD
│       ├── SettingsModal.js       # [MỚI V5.0.0] Modal Cài Đặt tích hợp: Album, Map, Máy ảnh, Đổi nhân vật, Day/Night
│       ├── CompassHUD.js           # [MỚI V5.0.0] Mini-la bàn cổ điển tinh gọn, không nhãn chữ, vạch đỏ chỉ Bắc
│       ├── ZoneBannerHUD.js       # [MỚI V5.0.0] Banner địa danh trượt êm, tự động fade out ẩn sau 4.5s
│       ├── OnboardingManager.js   # Quản lý tuần tự: Age Gate -> Login -> Character
│       ├── AgeGateModal.js        # Cổng xác nhận độ tuổi 18+ tính năm sinh
│       ├── AuthModal.js           # Modal Đăng nhập (Google Mock / Email)
│       ├── CharacterCreation.js   # Tạo nhân vật, chọn 4 nhân vật 3D, Debounce 0.5s check tên, Cooldown click 600ms
│       ├── ViewfinderHUD.js       # Khung ngắm máy ảnh, thước đo tiêu cự, lưới bố cục (mở từ Settings hoặc phím V)
│       ├── ScrapbookModal.js      # Cuốn Album Ký Ức lật trang, tem dán, tản văn (mở từ Settings)
│       ├── MinimapModal.js        # Bản đồ toàn cảnh & điểm dịch chuyển 4 phân khu (mở từ Settings)
│       ├── DialogueModal.js       # Hộp thoại tương tác với 9 NPC người Hà Nội & Cư dân tập thể
│       ├── ChatboxModal.js        # Kênh chat lãng tử
│       ├── ToastNotification.js   # Bảng thông báo góc màn hình phong cách retro
│       └── AudioBGMController.js  # Nút bật tắt nhạc, thanh chỉnh âm lượng hoài niệm
│
├── styles/                        # [VÙNG CỦA ui-polish - CSS STYLES]
│   ├── reset.css                  # Chuẩn hóa CSS
│   ├── retro_theme.css            # Biến màu sắc hoài niệm (Vàng hoàng cúc, đỏ bã trầu, xanh rêu)
│   ├── clean_hud.css              # [MỚI V5.0.0] Phong cách Clean HUD tối giản, nút bánh răng, la bàn tinh xảo
│   ├── settings_modal.css         # [MỚI V5.0.0] Giao diện Modal Cài Đặt đa năng sang trọng
│   ├── zone_banner.css            # [MỚI V5.0.0] Hiệu ứng trượt và fade out 4.5s của banner địa danh
│   ├── onboarding.css             # Giao diện Age Gate, Login, Tạo nhân vật
│   ├── hud.css                    # Thanh trạng thái, thông báo toast, modal hội thoại
│   └── viewfinder.css             # Hiệu ứng film grain, vignette, khung ngắm camera
│
└── tests/                         # [VÙNG CỦA kiem-duyet-qa - AUTOMATED TEST SUITE]
    └── test_3d_humanoid_system.mjs# Bộ test tự động kiểm thử toàn bộ hệ thống v5.0.0
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
| `UI:OPEN_SETTINGS` | `{ open: boolean }` | `ui-polish` | `coder-chinh` | Người dùng bấm nút bánh răng mở/đóng Modal Cài Đặt toàn năng. Core tạm khóa/mở chuột. |
| `UI:SET_DAY_NIGHT_MODE` | `{ mode: 'cycle' \| 'fixed_day' \| 'fixed_sunset' \| 'fixed_night', durationMinutes: number }` | `ui-polish` | `coder-chinh` | Người chơi chọn chế độ chu kỳ ngày đêm (tự động 5p, 10p hoặc cố định thời khắc). |
| `UI:SWITCH_CHARACTER` | `{ characterId: string }` | `ui-polish` | `coder-chinh` | Yêu cầu thay đổi mô hình nhân vật người chơi trong thế giới 3D (từ Modal Cài Đặt). |
| `CORE:SWITCH_CHARACTER` | `{ characterId: string }` | `ui-polish` / API | `coder-chinh` | Alias tương thích ngược cho yêu cầu chuyển đổi nhân vật 3D. |
| `UI:AGE_VERIFIED` | `{ birthYear: number, birthMonth: number, birthDay: number, isAdult: boolean }` | `ui-polish` | `coder-chinh` | Người dùng xác nhận tuổi thành công (>= 18 tuổi), cho phép mở màn hình Auth. |
| `UI:AUTH_SUCCESS` | `{ userId: string, username: string, authType: 'google' \| 'guest' \| 'email' }` | `ui-polish` | `coder-chinh` | Đăng nhập tài khoản thành công, khởi động nạp hồ sơ người dùng từ Storage. |
| `UI:CHARACTER_CONFIRMED` | `{ characterName: string, characterId: string, outfitId: string, cameraModel: string }` | `ui-polish` | `coder-chinh` | Người dùng chốt tên hợp lệ và chọn 1 trong 4 nhân vật 3D, kích hoạt Core nạp nhân vật & World 3D. |
| `UI:SWITCH_CAMERA_MODE` | `{ targetMode: 'TPS' \| 'FPS' }` | `ui-polish` | `coder-chinh` | Chuyển đổi thủ công camera (bấm nút Máy Ảnh trong Cài Đặt hoặc phím V). |
| `UI:TRIGGER_SHUTTER` | `{ timestamp: number }` | `ui-polish` | `coder-chinh` | Bấm nút chụp ảnh trên Viewfinder HUD, kích hoạt chụp Canvas 3D. |
| `UI:OPEN_SCRAPBOOK` | `{ open: boolean }` | `ui-polish` | `coder-chinh` | Mở Album Ký Ức từ Modal Cài Đặt. Core tạm dừng chuyển động nhân vật. |
| `UI:TELEPORT_REQUEST` | `{ zoneId: 'ho_guom' \| 'pho_co' \| 'long_bien' \| 'tap_the' }` | `ui-polish` | `coder-chinh` | Người chơi chọn điểm dịch chuyển nhanh trên bản đồ (từ Modal Cài Đặt). |
| `UI:SET_AUDIO_VOLUME` | `{ master: number, bgm: number, sfx: number }` | `ui-polish` | `coder-chinh` | Điều chỉnh âm lượng tổng và thành phần (giá trị float từ `0.0` đến `1.0`). |
| `UI:START_ENGINE_REQUEST` | `{}` | `ui-polish` | `coder-chinh` | Yêu cầu Game Engine khởi động WebGL render loop khi sẵn sàng. |

---

### 4.3. Bảng Sự Kiện từ Core gửi sang UI (`CORE -> UI`)

| Tên Sự Kiện (`eventName`) | Kiểu Dữ Liệu (`payload`) | Bộ Phận Bắn | Bộ Phận Nhận | Ý Nghĩa Kỹ Thuật |
| :--- | :--- | :--- | :--- | :--- |
| `CORE:DAY_NIGHT_UPDATED` | `{ timeNormalized: number, phase: 'dawn' \| 'day' \| 'sunset' \| 'night', skyColorHex: number, isNightLightingActive: boolean }` | `coder-chinh` | `ui-polish` | Core phát trạng thái thời khắc trong ngày để UI cập nhật biểu tượng mặt trời/mặt trăng trong Settings. |
| `CORE:ZONE_ENTERED` | `{ zoneId: string, zoneName: string, description: string, ambientTrack: string, displayDuration: number }` | `coder-chinh` | `ui-polish` | Bắn khi người chơi chuyển vùng. `displayDuration: 4500` (ms) để UI hiện banner đúng 4.5s rồi tự fade out ẩn. |
| `CORE:WORLD_LOAD_PROGRESS` | `{ progress: number, currentAsset: string }` | `coder-chinh` | `ui-polish` | Cập nhật tiến độ tải 3D World (0 - 100%) lên thanh loading retro. |
| `CORE:WORLD_READY` | `{ spawnZone: string, playerPosition: { x: number, y: number, z: number } }` | `coder-chinh` | `ui-polish` | Thế giới 3D đã sẵn sàng, yêu cầu UI ẩn màn hình chờ và hiện Clean HUD chính. |
| `CORE:CAMERA_MODE_CHANGED` | `{ mode: 'TPS' \| 'FPS', fov: number }` | `coder-chinh` | `ui-polish` | Core thông báo đã chuyển xong chế độ camera (FPS bật Viewfinder HUD & ẩn đầu/mũ; TPS tắt HUD & hiện lại nhân vật). |
| `CORE:PUZZLE_DETECTED` | `{ puzzleId: string, puzzleName: string, alignmentScore: number, isAligned: boolean }` | `coder-chinh` | `ui-polish` | Người chơi đang nhìn vào vị trí câu đố; `alignmentScore` (0.0 - 1.0) để UI vẽ thước ngắm đổi màu. |
| `CORE:PUZZLE_SOLVED` | `{ puzzleId: string, title: string, quote: string, unlockedShortcut: string, photoUrl: string }` | `coder-chinh` | `ui-polish` | Căn góc thành công! UI mở hiệu ứng chớp sáng, vinh danh ký ức và trao huy hiệu. |
| `CORE:PHOTO_CAPTURED` | `{ photoId: string, dataUrl: string, zoneId: string, timestamp: number, isPuzzle: boolean, poemQuote: string }` | `coder-chinh` | `ui-polish` | Ảnh vừa chụp được render xong, gửi dataUrl sang UI để cất vào Album. |
| `CORE:INTERACTION_AVAILABLE` | `{ canInteract: boolean, promptText: string, actionKey: string }` | `coder-chinh` | `ui-polish` | Gần ghế đá, hàng nước chè, vòi nước bể tập thể, đài cassette: UI hiện phím gợi ý. |
| `UI:OPEN_DIALOGUE` | `{ name: string, role: string, avatar: string, greeting: string, monumentTitle: string, historyText: string, dialogueOptions: Array, shopItems: Array }` | `coder-chinh` | `ui-polish` | Khi người chơi bấm E tương tác với NPC, mở modal đối thoại và tìm hiểu lịch sử. |
| `CORE:CHARACTER_SWITCHED` | `{ characterId: string, success: boolean }` | `coder-chinh` | `ui-polish` | Thông báo hoàn tất đổi nhân vật, mở khóa nút bấm (Cooldown/Debounce). |

---

### 4.4. Bảng Hợp Đồng API Trực Tiếp Toàn Cục (`window.GameAPI`)
Được triển khai tại [src/bridge/GameAPI.js](file:///d:/H%C3%80%20N%E1%BB%98I%20CH%E1%BA%A0M%20V%C3%80O%20K%C3%9D%20%E1%BB%A8C%20,HANOI%20OPEN%20REVERIE/src/bridge/GameAPI.js) bởi `coder-chinh` để `ui-polish` gọi đồng bộ khi cần:

```javascript
window.GameAPI = {
  /**
   * Mở hoặc đóng Modal Cài Đặt toàn năng
   * @param {boolean} open
   */
  toggleSettingsModal: (open) => {},

  /**
   * Thiết lập chế độ Chu kỳ Ngày - Đêm
   * @param {'cycle' | 'fixed_day' | 'fixed_sunset' | 'fixed_night'} mode
   * @param {number} durationMinutes - Thời lượng 1 chu kỳ (5 hoặc 10 phút)
   */
  setDayNightMode: (mode, durationMinutes = 10) => {},

  /**
   * Lấy thông tin trạng thái Chu kỳ Ngày - Đêm hiện tại
   * @returns {{ timeNormalized: number, phase: string, isNightLightingActive: boolean }}
   */
  getDayNightStatus: () => {},

  /**
   * Chuyển đổi mô hình nhân vật người chơi trong thế giới 3D
   * @param {string} characterId - 'char_nu_sinh_ao_dai' | 'char_co_gai_ao_ba_ba' | 'char_nam_tri_thuc_suit' | 'char_nam_ao_dai_gam'
   * @returns {Promise<boolean>}
   */
  switchCharacter: async (characterId) => {},

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
   * Lấy toàn bộ danh sách ảnh đã chụp từ Album Database
   * @returns {Promise<Array<{ id: string, dataUrl: string, zone: string, timestamp: number, quote: string }>>}
   */
  getAlbumPhotos: async () => {},

  /**
   * Khóa hoặc mở khóa điều khiển di chuyển nhân vật
   * @param {boolean} locked - true: không cho WASD di chuyển; false: cho phép
   */
  setPlayerMovementLock: (locked) => {},

  /**
   * Lấy trạng thái hiện tại của hệ thống camera
   * @returns {{ mode: 'TPS' | 'FPS', fov: number, isAiming: boolean, yaw: number }}
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

## 5. THIẾT KẾ HUD TỐI GIẢN (CLEAN SCREEN HUD) & MODAL CÀI ĐẶT TOÀN NĂNG

> **CHỈ THỊ CẢI TIẾN TRẢI NGHIỆM TỪ NGƯỜI DÙNG:**  
> *"Thu gọn toàn bộ các nút rườm rà trên màn hình chính vào Modal Cài Đặt. Giữ cho khung hình 3D thông thoáng, tĩnh lặng tối đa để người chơi tận hưởng bầu không khí hoài niệm Hà Nội mùa thu!"*

```
     MẶT BẰNG GIAO DIỆN CLEAN HUD TỐI GIẢN (SCREEN HUD LAYOUT):
     ┌─────────────────────────────────────────────────────────────┐
     │                                           [ ⚙️ Nút Cài Đặt ] │ (Góc phải trên)
     │                                                             │
     │                   [ BANNER ĐỊA DANH ]                       │ (Hiện 4.5s khi đổi vùng,
     │            "HỒ HOÀN KIẾM & ĐỀN NGỌC SƠN"                    │  sau đó fade out ẩn đi)
     │                                                             │
     │                                                             │
     │                                                             │
     │                                                             │
     │                                                             │
     │  [ 🧭 LA BÀN TINH GỌN ]                                      │ (Góc trái dưới,
     │   (Kim chỉ Bắc đỏ, vành đồng,                               │  xoay theo yaw camera)
     │    không nhãn chữ rườm rà)                                  │
     └─────────────────────────────────────────────────────────────┘
```

### 5.1. Nút Bánh Răng Cài Đặt (Settings Gear Button)
- **Vị trí:** Cố định tại góc phải trên cùng (`top: 24px, right: 24px`), kích thước `48px x 48px`.
- **Mỹ thuật:** Nút tròn kim loại đồng cổ viền hoa văn retro, biểu tượng bánh răng xoay nhẹ khi hover, có hiệu ứng đổ bóng mờ hoài niệm.
- **Hành động:** Khi click, phát âm thanh click cơ khí nhẹ và mở `SettingsModal.js`, đồng thời tạm dừng xoay camera chuột (khóa camera).

### 5.2. Modal Cài Đặt Toàn Năng (SettingsModal.js)
Tập hợp toàn bộ các tính năng trước đây nằm rải rác trên màn hình thành một trung tâm điều khiển trang trọng, đậm chất hoài niệm:
1. **Lưới Nút Chức Năng Nhanh (Quick Action Cards):**
   - **Thẻ 1 - Cuốn Album Ký Ức (Scrapbook):** Mở xem toàn bộ ảnh film 35mm đã chụp, tem bưu chính và câu thơ tản văn.
   - **Thẻ 2 - Bản Đồ Ký Ức & Dịch Chuyển (World Map):** Mở Minimap 4 phân khu và bấm dịch chuyển nhanh.
   - **Thẻ 3 - Máy Ảnh Cơ 35mm (Vintage Viewfinder):** Kích hoạt chế độ ngắm máy ảnh cơ FPS tiêu cự 50mm.
   - **Thẻ 4 - Lựa Chọn Nhân Vật (Character Wardrobe):** Chuyển đổi giữa 4 nhân vật Việt Nam độc bản (Nữ sinh Áo dài, Cô gái Áo bà ba, Nam trí thức Suit, Chàng trai Thăng Long).
2. **Cài Đặt Bầu Trời & Chu Kỳ Ngày - Đêm (Day/Night Settings):**
   - Lựa chọn chế độ:
     * `Chu kỳ tự động 10 phút`: 1 ngày trôi qua trong 10 phút đời thực.
     * `Chu kỳ tự động 5 phút`: Nhịp chuyển ngày đêm nhanh sống động.
     * `Cố định Ban Ngày (Nắng Thu)`: Giữ ánh nắng vàng mật ong ấm áp vĩnh viễn.
     * `Cố định Hoàng Hôn (Chiều Tà)`: Giữ ráng chiều đỏ rực rỡ lãng mạn.
     * `Cố định Ban Đêm (Đèn Lồng Phố Cổ)`: Thắp sáng đèn lồng, đèn đường, ngắm trăng Đắc Nguyệt Lâu.
3. **Cài Đặt Âm Thanh (Audio Mixer):**
   - Thanh trượt âm lượng Master (Tổng thể), BGM (Nhạc nền tiền chiến / tiếng máy hát đĩa than), SFX (Tiếng ve sầu, còi tàu, lá rơi, tiếng chuông chùa).
4. **Trợ Giúp & Thoát Game:** Hướng dẫn phím bấm WASD, Space, Shift, E, V và nút Thoát ra màn hình bắt đầu.

---

## 6. LA BÀN ĐỊNH HƯỚNG TINH GỌN & BANNER ĐỊA DANH TỰ ĐỘNG ẨN

### 6.1. La Bàn Định Hướng Thẩm Mỹ Chuẩn Mực (CompassHUD.js)
- **Vị trí:** Góc trái dưới cùng màn hình (`bottom: 24px, left: 24px`), đường kính nhỏ gọn `84px`.
- **Triệt tiêu nhãn chữ rườm rà:**
  * Bỏ hoàn toàn 4 khối chữ "Phố Cổ", "Long Biên", "Tập Thể", "Hồ Gươm" in đè lên mặt la bàn.
  * Chỉ giữ lại đĩa la bàn đồng cổ chạm khắc tinh xảo các vạch chia độ (mỗi vạch 30 độ).
  * Vạch chỉ hướng Bắc (0 độ - North) được đánh dấu bằng hình tam giác màu đỏ son nổi bật có chữ **N** mảnh mai hoài niệm.
  * Kim la bàn 2 đầu (đầu đỏ chỉ Bắc, đầu bạc chỉ Nam) xoay mượt mà theo góc `cameraController.getYaw()` với thuật toán Lerp góc ngắn nhất (shortest angle interpolation).

### 6.2. Banner Địa Danh Khu Vực Tự Động Mờ Dần (ZoneBannerHUD.js)
- **Cơ chế kích hoạt:** Lắng nghe sự kiện `CORE:ZONE_ENTERED`.
- **Hành vi hiển thị & Tự động ẩn (Fade Out):**
  1. Khi người chơi bước qua ranh giới phân khu mới, banner địa danh trượt êm ái từ trên đỉnh màn hình xuống (`transform: translateY(0)`), độ mờ `opacity: 1` trong `0.5s`.
  2. Banner hiển thị rõ ràng: Tên danh thắng lớn (ví dụ: *"HỒ HOÀN KIẾM • ĐỀN NGỌC SƠN"*), câu tản văn hoài niệm bên dưới và hoa văn viền vàng kim.
  3. **Đếm thời gian đúng 4.5 giây (`4500ms`):** Duy trì hiển thị trọn vẹn để người chơi kịp đọc và cảm nhận.
  4. **Sau 4.5 giây:** Tự động kích hoạt hiệu ứng mờ dần (Fade Out) và trượt nhẹ lên trong `0.8s` (`opacity: 0, transform: translateY(-20px)`), sau đó gán `visibility: hidden; pointer-events: none;`.
  5. **Cam kết thẩm mỹ:** Tuyệt đối không để banner treo cố định liên tục trên màn hình làm vướng mắt người chơi!

---

## 7. XÓA BỎ CẦU THANG THỪA & NẮN ĐƯỜNG DẠO BỘ DI SẢN TRÊN CẠN (R >= 90m)

### 7.1. Xóa Bỏ Cầu Thang Thừa Mạn Trái Cầu Long Biên
- **Hiện trạng cũ:** Ở cạnh mạn trái dốc dẫn cầu Long Biên (phía bờ Tây Phố Cổ) tồn tại một khối cầu thang sắt bộ hành phụ (`stairwayGroup`) gây rối mắt, tạo vật cản va chạm không cần thiết và làm lệch bố cục dầm Eiffel.
- **Quy chuẩn sửa đổi:** Xóa bỏ hoàn toàn cụm cầu thang sắt thừa này khỏi `WorldManager.js`. Chỉ giữ lại dốc dẫn thoải 25m từ `x = 10` lên `x = 35` (`y = 4.2m`) và đường dẫn bộ hành chính thống chuẩn mực lịch sử.

### 7.2. Nắn Tuyến Đường Dạo Bộ Di Sản Men Phố Đinh Tiên Hoàng Trên Cạn
- **Vấn đề nghiêm trọng trước đây:** Đường dạo bộ quanh hồ bị tính toán theo bán kính nhỏ (< 85m), khiến đoạn đường phía Đông Bắc chém ngang lòng hồ Gươm, lấn sâu vào mặt nước và che khuất tầm nhìn mặt nước quanh chân Cầu Thê Húc và Đền Ngọc Sơn.
- **Quy chuẩn hình học di sản mới:**
  * Tâm hồ Gươm: `(80.0, -80.0)`.
  * **Bán kính đường dạo bộ trên cạn:** Toàn bộ tuyến đường đi bộ được mở rộng với bán kính `R >= 90.0m` (dao động từ `90.0m` đến `105.0m`).
  * Tuyến đường chạy uốn lượn hoàn toàn trên vỉa hè lát đá xanh phố Đinh Tiên Hoàng - Hàng Khay - Lê Thái Tổ, nằm trọn vẹn trên đất liền bờ hồ.
  * **Giải phóng 100% mặt nước:** Triệt tiêu hoàn toàn mảng đường cắt ngang lòng nước. Mặt nước phẳng lặng của Hồ Gươm được giải phóng thông thoáng, phẳng như gương soi bóng Tháp Rùa cổ kính và Cầu Thê Húc đỏ son.

---

## 8. ĐẶC TẢ CỤM DI TÍCH CẦU THÊ HÚC, ĐỀN NGỌC SƠN & THÁP BÚT - ĐÀI NGHIÊN

```
                 SƠ ĐỒ BỐ CỤC KHÔNG GIAN CỤM DI TÍCH NGỌC SƠN:
       [BỜ HỒ PHỐ ĐINH TIÊN HOÀNG]
                   │
         [1. CỔNG NGOÀI & THÁP BÚT] (Núi Độc Tôn, Tháp đá 5 tầng "Tả Thanh Thiên")
                   │
         [2. CỔNG TRONG & ĐÀI NGHIÊN] (Đài nghiên đá đào, 3 chú ếch đá đội)
                   │
         [3. CẦU THÊ HÚC ĐỎ SON] (15 nhịp cong, sàn gỗ lim, ngưng tụ ánh sáng mặt trời)
                   │
         [4. ĐẮC NGUYỆT LÂU] (Lầu ngắm trăng 2 tầng 8 mái cong, cửa vòm Gothic)
                   │
         [5. CHÍNH ĐIỆN ĐỀN NGỌC SƠN] (Thờ Văn Xương Đế Quân & Đức Thánh Trần)
```

### 8.1. Cầu Thê Húc 15 Nhịp Son Đỏ ("Ngưng Tụ Ánh Sáng Mặt Trời")
- **Ý nghĩa văn hóa:** Thê Húc nghĩa là "Nơi ngưng tụ ánh sáng mặt trời ban mai", được danh sĩ Nguyễn Văn Siêu xây dựng năm 1865.
- **Đặc tả 3D Engine:**
  * Chiều dài: `32.0m` uốn cong hình cầu vồng mềm mại bắc từ bờ Đông sang Đảo Ngọc Sơn.
  * Cao độ vòm cầu: Đỉnh cầu uốn cao `y = 2.4m` so với mặt nước, hai đầu chân cầu thoai thoải dốc tiếp giáp êm ái (`y = 0.85m`).
  * 15 nhịp cầu gỗ lim sơn son đỏ rực rỡ (`color: 0xB91C1C, roughness: 0.38, sheen: 0.6`).
  * Hệ thống trụ cầu tròn sơn đỏ cắm vững chãi xuống đáy hồ, dầm ngang đỡ ván sàn gỗ cong.
  * Lan can hai bên uốn cong mềm mại với các chấn song tiện tròn đều tăm tắp, tay vịn gỗ sơn son.
  * **Vật lý va chạm:** Kẹp vị trí Capsule Horizontal Collision chống xuyên thủng lan can, bảo đảm người chơi đi dạo thong thả ngắm đàn cá bơi lội mà không rơi xuống hồ.

### 8.2. Đền Ngọc Sơn & Đắc Nguyệt Lâu (Lầu Ngắm Trăng)
- **Đắc Nguyệt Lâu (Cổng Đền Ngọc Sơn):**
  * Kiến trúc 2 tầng, 8 mái cong uốn lượn lợp ngói mũi hài rêu phong (`ngoc_son_roof_moss.jpg`).
  * Tầng dưới là cửa vòm cuốn đá rộng mở thông thoáng đón khách dạo bước vào đền.
  * Tầng trên có cửa tròn hình vầng trăng khuyết và ban công ngắm trăng mặt hồ.
  * Hai bên cổng đắp nổi bức đại tự và câu đối chữ Hán sơn then thếp vàng rực rỡ phong cách Canva AI.
- **Chính Điện Đền Ngọc Sơn:**
  * Kiến trúc chữ Tam truyền thống gồm Bái đường, Trung đường và Hậu cung.
  * Bộ vì kèo gỗ lim cổ kính, cột gỗ tròn sơn cánh gián bóng loáng.
  * Bàn thờ Đức Thánh Trần Hưng Đạo và Văn Xương Đế Quân tôn nghiêm nghi ngút khói trầm hương.
  * Nơi lưu giữ Tiêu bản Rùa Hồ Gươm lịch sử trong tủ kính trang trọng.

### 8.3. Tháp Bút ("Tả Thanh Thiên") & Đài Nghiên Đá Đào
- **Tháp Bút trên Núi Độc Tôn:**
  * Tọa độ đặt tại đầu cầu phía bờ hồ: Núi đá Độc Tôn xếp bằng các khối đá xanh gồ ghề rêu phong.
  * Tháp đá 5 tầng hình vuông vuốt thon dần lên cao, chiều cao thực tế `12.5m`.
  * Trên thân tầng thứ ba khắc 3 chữ Hán đại tự: **"TẢ THANH THIÊN"** (Viết lên trời xanh) biểu trưng cho khí phách hiên ngang của kẻ sĩ Bắc Hà.
  * Đỉnh tháp là một ngọn bút lông bằng đá chỉ thẳng lên trời xanh mây trắng mùa thu.
- **Đài Nghiên Đá Đào:**
  * Đặt trên cuốn thư cổng dẫn vào Cầu Thê Húc.
  * Nghiên mực đẽo từ khối đá xanh nguyên khối hình nửa quả đào bổ đôi.
  * Đỡ nghiên mực là hình tượng 3 chú ếch đá ba chân vững chãi.
  * Hàng năm vào ngày mùng 5 tháng 5 âm lịch, khi mặt trời mọc, bóng ngọn Tháp Bút chấm đúng vào lòng Đài Nghiên, tạo nên kỳ quan phong thủy văn hóa độc nhất vô nhị.

---

## 9. BẦU TRỜI MÙA THU HÀ NỘI & CHU KỲ NGÀY - ĐÊM (DAY/NIGHT SYSTEM)

> **MỸ THUẬT & KHÔNG KHÍ ĐẶC TRƯNG HÀ NỘI:**  
> *"Gió heo may chớm lạnh, bầu trời thu xanh ngắt man mác, những đám mây trắng trôi lững lờ trên cao, và những chiếc lá vàng chao nghiêng rơi lả tả trên mặt đường vôi vàng rêu phong... Đêm về, ngàn ánh đèn lồng lung linh soi bóng nước hồ Gươm!"*

```
     CHU KỲ NGÀY - ĐÊM 4 THỜI KHẮC MÙA THU (DAY/NIGHT TRANSITIONS):
     ┌─────────────────────────────────────────────────────────────┐
     │ 1. BÌNH MINH (05:30 - 07:00): Sương sớm, hồng đào, chim hót │
     ├─────────────────────────────────────────────────────────────┤
     │ 2. BAN NGÀY (07:00 - 16:30): Trời thu xanh ngắt, mây trắng, │
     │    nắng vàng mật ong êm ả, lá vàng rơi lả tả trong gió       │
     ├─────────────────────────────────────────────────────────────┤
     │ 3. HOÀNG HÔN (16:30 - 18:30): Ráng chiều tím đỏ rực rỡ,     │
     │    chuồng cọp đổ bóng dài, mặt nước hồ Gươm nhuộm ánh đồng  │
     ├─────────────────────────────────────────────────────────────┤
     │ 4. BAN ĐÊM (18:30 - 05:30): Trăng thanh soi Đắc Nguyệt Lâu, │
     │    TỰ ĐỘNG THẮP SÁNG đèn lồng đỏ, đèn đường, đèn Cầu Thê Húc│
     └─────────────────────────────────────────────────────────────┘
```

### 9.1. Bầu Trời Mùa Thu Hà Nội & Mây Trắng Lãng Đãng
- **Bầu trời ban ngày:** Bầu trời trong vắt ngả xanh ngọc bích êm dịu (`0x87CEEB` hòa sắc `0xE0F7FA`), ánh sáng mặt trời chiếu xiên góc 55 độ ấm áp, không chói gắt.
- **Lớp sương mù thu hồ Gươm (Autumn Morning Mist):** `THREE.FogExp2(0xd6e5ea, 0.0016)` bảng lảng trên mặt hồ, tạo cảm giác mờ ảo hoài niệm sâu lắng.
- **Mây trắng lãng đãng (Drifting Autumn Clouds):**
  * Hệ thống các cụm mây trắng mềm mại dạng khối bán trong suốt (`THREE.Group` gồm các mặt phẳng mây procedural mềm hoặc shader mây gió nhẹ).
  * Vận tốc trôi nhẹ nhàng theo hướng Đông Bắc `0.8 m/s`, lững lờ trôi trên bầu trời cao độ `y = 120m`.

### 9.2. Hiệu Ứng Lá Vàng Mùa Thu Rơi (Autumn Leaves Falling VFX)
Được triển khai trong `src/core/animations.js`:
- **Hệ thống Particle:** `350` hạt lá mùa thu rơi phân tán trong bán kính `65m` quanh vị trí người chơi.
- **Hạt lá đa dạng:**
  * Lá sấu vàng tươi (`leaf_autumn_yellow.png`).
  * Lá bàng đỏ tía cuối thu (`leaf_autumn_red.png`).
  * Lá liễu thon dài vàng úa.
- **Chuyển động chao nghiêng sinh học (Organic Swaying Motion):**
  * Mỗi chiếc lá rơi với tốc độ rơi chậm `0.6 - 1.1 m/s`.
  * Dao động hình sin 3 trục: `dx = sin(time * 2.5 + seed) * 0.45`, `dz = cos(time * 1.8 + seed) * 0.35`, xoay lật góc `roll` và `pitch` như chiếc lá khô chao lượn trong gió heo may.
  * Khi lá rơi chạm đất (`y <= 0.05`), hạt lá tự động hồi sinh trở lại trên không trung tại tọa độ đón gió phía trước mặt người chơi.

### 9.3. Chu Kỳ Ngày - Đêm & Hệ Thống Chiếu Sáng Ban Đêm Thông Minh
- **Thuật toán nội suy thời gian:** Biến `timeNormalized` chạy từ `0.0` đến `1.0` (tương ứng 24 giờ trong game).
  * Mặc định chu kỳ: `10 phút` đời thực = 1 ngày trong game.
  * Tùy chọn trong Cài Đặt: `5 phút`, `10 phút`, hoặc ghim cố định thời khắc yêu thích.
- **Nội suy màu sắc bầu trời và mặt trời:**
  * `0.0 - 0.25` (Đêm sang Bình minh): Ánh sáng lam sẫm chuyển sang hồng đào rạng đông.
  * `0.25 - 0.70` (Ban ngày): Nắng vàng mật ong rực rỡ, chỉ số `sunLight.intensity = 1.6`.
  * `0.70 - 0.80` (Hoàng hôn): Bầu trời chuyển sang ráng chiều đỏ bã trầu và cam cháy lộng lẫy, `sunLight.color = 0xff6b35`.
  * `0.80 - 1.0` (Ban đêm): Ánh trăng xanh huyền bí `0x1a2b4c`, chỉ số `ambientLight = 0.25`.
- **Hệ thống chiếu sáng đêm tự động bật (Smart Night Lighting):**
  * Khi `timeNormalized >= 0.75` (trời chuyển tối sau 18:00):
    + Tự động bật sáng toàn bộ đèn lồng đỏ phố cổ và Cầu Thê Húc (`emissiveIntensity: 1.8`).
    + Bật các ngọn đèn đường Pháp cổ vàng ấm 2700K dọc bờ hồ Đinh Tiên Hoàng.
    + Thắp sáng đèn dầm thép Cầu Long Biên và chao đèn nhôm hành lang Nhà Tập Thể Kim Liên.
  * Khi `timeNormalized >= 0.25` (trời sáng): Tự động tắt đèn để tối ưu hóa hiệu năng render 60 FPS.

---

## 10. HỆ THỐNG TRANG PHỤC HÌNH KHỐI 3D ĐỘC LẬP & 4 NHÂN VẬT VIỆT NAM ĐỘC BẢN

- **Cổ áo trụ 3D:** Cao 3cm dày 2mm ôm cổ da thịt.
- **Thân áo ngoài xẻ tà:** Xẻ tà 2 bên hông để lộ quần lụa, ống tay áo ôm bắp tay/cẳng tay.
- **Quần lụa ống rộng 3D / Quần âu có ly 3D:** Bọc chân mềm mại.
- **Hai tà áo dài 3D đa giác mềm có thể tích:** Thickness 1.8mm đung đưa theo hông và gió hồ.
- **4 Nhân vật người thật hữu cơ:**
  1. `char_nu_sinh_ao_dai`: Nữ sinh Tràng An da sáng ấm (#E8BEAC), Áo Dài lụa trắng, Nón Lá Trúc Chỉ 3D, hoa tai ngọc trai.
  2. `char_co_gai_ao_ba_ba`: Cô gái Phố thị da sáng (#E8BEAC), Áo Bà Ba hồng sen, Khăn Rằn 3D quấn cổ, Nón Lá quàng lưng.
  3. `char_nam_tri_thuc_suit`: Nam trí thức Hà Nội cổ điển da ấm (#DEB096), Suit tweed xám than, Mũ Fedora / Kính mắt, Giày da Oxford.
  4. `char_nam_ao_dai_gam`: Chàng trai Thăng Long da ấm (#DEB096), Áo Dài ngũ thân gấm xanh hoàng gia (0x16213e) khuy ngọc bích, Khăn Xếp 5 tầng 3D.

---

## 11. BẢO TOÀN TUYỆT ĐỐI 100% 9 NPC LỊCH SỬ TRONG `WorldManager.js`

Toàn bộ 9 NPC lịch sử được giữ nguyên vẹn 100% vị trí, tạo hình và kịch bản đối thoại:
1. **Bác Hùng** - Bán bánh mì dạo xe đạp Thống Nhất.
2. **Chị Lan** - Gánh hàng hoa tươi ven hồ Gươm.
3. **Bà Cụ Quán Nước** - Chè xanh giành tre phố cổ.
4. **Hai Cụ Già Kỳ Thủ** - Đánh cờ tướng sân tập thể Kim Liên.
5. **Bác Dân Phố Cổ** - Dạo bộ mũ phớt.
6. **Thanh Niên Ngắm Tàu** - Cà phê đường tàu Phùng Hưng.
7. **Cụ Lang Triệu** - Hiệu thuốc bắc Lãn Ông.
8. **Cô Mai** - Tiệm may lụa Lương Văn Can.
9. **Bác Cả Phở** - Đệ nhất phở gia truyền 1954.

---

## 12. PHÂN CHIA NHIỆM VỤ CHO 4 MŨI NHỌN SẢN XUẤT

| Mũi Nhọn | Phân Vùng File Đảm Trách | Nhiệm Vụ Kỹ Thuật Trọng Tâm v5.0.0 | Tiêu Chuẩn Nghiệm Thu |
| :--- | :--- | :--- | :--- |
| **Coder Chính**<br>(`coder-chinh`) | `src/core/*`<br>(trừ animations.js)<br>`src/bridge/*` | 1. **Dựng 3D Cụm Đền Ngọc Sơn & Cầu Thê Húc:** Cầu Thê Húc 15 nhịp đỏ son, Đắc Nguyệt Lâu 2 tầng 8 mái, Tháp Bút Tả Thanh Thiên, Đài Nghiên đá đào.<br>2. **Sửa hình học di sản:** Xóa cầu thang thừa mạn trái Cầu Long Biên; nắn đường dạo bộ bờ hồ `R >= 90m` nằm trọn vẹn trên cạn.<br>3. **Engine Chu kỳ Ngày - Đêm:** Tích hợp bộ đổi thời gian 4 thì, tự động kích hoạt đèn đêm chiếu sáng thông minh.<br>4. Quản lý Floor Colliders đa tầng và bảo toàn 9 NPC lịch sử. | Không lấn nước, không thang thừa, đền tháp nguy nga, ngày đêm mượt mà 60 FPS. |
| **Animation Master**<br>(`animation-master`) | `src/core/animations.js` | 1. **Autumn Leaves Falling VFX:** Lập trình hệ thống 350 hạt lá vàng/đỏ mùa thu chao nghiêng đu đưa theo gió.<br>2. **Mây trắng lãng đãng trôi:** Mô phỏng các cụm mây thu trôi nhẹ nhàng trên cao độ 120m.<br>3. Tối ưu hoạt họa MoCap Retargeting 60 FPS và Lag Damping Nón Lá. | Lá vàng bay lãng mạn, mây trôi thơ mộng, hoạt họa nhân vật bước đi tự nhiên. |
| **UI Polish**<br>(`ui-polish`) | `src/ui/*`<br>`styles/*`<br>`index.html` | 1. **Clean Screen HUD:** Thu gọn toàn bộ nút vào Modal Cài Đặt, chỉ để lại nút bánh răng góc phải trên.<br>2. **SettingsModal.js:** Xây dựng modal đa năng chứa Album, Bản đồ, Máy ảnh, Đổi nhân vật, Chu kỳ Ngày/Đêm.<br>3. **CompassHUD.js:** La bàn đồng cổ tinh gọn, bỏ 4 chữ nhãn, kim chỉ Bắc chuẩn xác.<br>4. **ZoneBannerHUD.js:** Banner địa danh trượt êm, tự động fade out ẩn sau 4.5s. | Màn hình thông thoáng tối đa, giao diện retro tinh xảo, không che chắn tầm nhìn. |
| **Họa Sĩ & Canva AI**<br>(`nano-banana`) | `assets/textures/*`<br>`assets/models/*`<br>`assets/ui/*`<br>`assets/photos/*`<br>`assets/audio/*` | 1. Cung cấp Textures Canva AI hoài niệm: sơn then đỏ Cầu Thê Húc, ngói rêu Đắc Nguyệt Lâu, đá xanh Tháp Bút, lá vàng mùa thu.<br>2. UI Assets: Mặt la bàn đồng không chữ, kim la bàn, nút bánh răng Cài Đặt.<br>3. Cung cấp âm thanh: tiếng gió thu xào xạc lá rơi, tiếng chuông Đền Ngọc Sơn xa xăm. | Toàn bộ tài nguyên tồn tại thực tế, đúng kích thước, không lỗi 404. |

---

## 13. DANH SÁCH TÀI NGUYÊN (ASSET REQUIREMENTS V5.0.0)

### 13.1. Textures & Đồ Họa Canva AI (`assets/textures/`)
1. `the_huc_lacquer_red.jpg`: Sơn then đỏ son Cầu Thê Húc rực rỡ (1024x1024).
2. `ngoc_son_roof_moss.jpg`: Ngói mũi hài rêu phong Đắc Nguyệt Lâu (1024x1024).
3. `thap_but_stone.jpg`: Đá xanh Thanh Hóa rêu phong Tháp Bút (1024x1024).
4. `leaf_autumn_yellow.png`: Hạt lá vàng mùa thu rơi trong suốt (PNG 256x256).
5. `leaf_autumn_red.png`: Hạt lá bàng đỏ tía mùa thu rơi trong suốt (PNG 256x256).
6. `lake_water_norm.jpg`: Normal map mặt nước Hồ Gươm (512x512 Seamless).
7. `turtle_tower_moss.jpg`: Đá phủ rêu Tháp Rùa (1024x1024).
8. `canva_poster_kimlien.jpg`: Tranh cổ động thời bao cấp Canva AI (1024x1024).
9. `kimlien_block_sign.png`: Biển số nhà nhôm A1 dập nổi Canva (512x256).

### 13.2. UI Elements & Biểu Tượng Clean HUD (`assets/ui/`)
1. `gear_settings_icon.png`: Biểu tượng bánh răng kim loại đồng cổ điển (128x128).
2. `compass_rose_vintage.png`: Mặt la bàn đồng khắc độ tinh xảo, không có 4 chữ nhãn (256x256).
3. `compass_needle.png`: Kim la bàn chỉ Bắc đỏ son (128x256).
4. `viewfinder_frame.png`: Khung ngắm máy ảnh cơ 35mm.
5. `stamp_hanoi.png`: Con tem bưu chính Hà Nội mép răng cưa.

### 13.3. Âm Thanh Môi Trường Mùa Thu (`assets/audio/`)
1. `autumn_wind_leaves.mp3`: Tiếng gió heo may xào xạc lá khô rơi ven hồ.
2. `temple_bell_distant.mp3`: Tiếng chuông đồng Đền Ngọc Sơn ngân vang xa xăm trong sương mai.
3. `ambient_lake.mp3`: Tiếng sóng hồ vỗ bờ đá nhẹ, gió rặng liễu.
4. `ambient_train.mp3`: Tiếng còi tàu hơi nước và đường ray Cầu Long Biên.
5. `shutter_click.mp3`: Tiếng màn trập cơ học đanh thép Leica M3.

---

## 14. TIÊU CHUẨN KIỂM DUYỆT CHẤT LƯỢNG TOÀN DIỆN (QA CHECKLIST 12 CHỐT)

Trước khi nghiệm thu dự án đạt mức độ "PASSED 100%", subagent `kiem-duyet-qa` phải kiểm tra lần lượt 12 chốt kiểm định:

### Chốt 1: Tách Biệt Vùng Làm Việc & Toàn Vẹn File (Khâu Kiểm Duyệt 1 - Tiêu chí 1)
- [ ] Không có file nào của `coder-chinh` bị ghi đè bởi `ui-polish` hay `animation-master` và ngược lại.
- [ ] Khung sườn thư mục chuẩn xác: `src/bridge/` cho giao tiếp chung, `src/core/` cho 3D logic, `src/ui/` & `styles/` cho giao diện.

### Chốt 2: Khâu Kiểm Duyệt API & Events (Khâu Kiểm Duyệt 1 - Tiêu chí 2)
- [ ] Mọi sự kiện phát ra từ `GameEventBus` và mọi hàm trong `GameAPI` đều trùng khớp 100% từng chữ hoa chữ thường với Mục 4 của tài liệu này.
- [ ] Đầy đủ các hàm và sự kiện mới: `UI:OPEN_SETTINGS`, `UI:SET_DAY_NIGHT_MODE`, `CORE:DAY_NIGHT_UPDATED`.

### Chốt 3: Clean Screen HUD & Modal Cài Đặt Toàn Năng
- [ ] Màn hình chính tối giản tối đa: chỉ có nút bánh răng góc phải trên và mini-la bàn góc trái dưới.
- [ ] Bấm nút bánh răng mở được Modal Cài Đặt tích hợp đầy đủ: Album, Bản Đồ, Máy Ảnh, Đổi Nhân Vật, Âm Lượng, Chu kỳ Ngày - Đêm.

### Chốt 4: La Bàn Định Hướng & Banner Vùng Tự Động Ẩn Sau 4.5s
- [ ] Mặt la bàn không còn 4 chữ "Phố Cổ", "Long Biên", "Tập Thể", "Hồ Gươm". Kim la bàn chỉ hướng Bắc đỏ son chính xác theo góc quay camera.
- [ ] Khi chuyển phân khu, banner địa danh hiện lên đúng 4.5 giây, sau đó tự động mờ dần (fade out) và biến mất hoàn toàn, không đọng lại trên màn hình.

### Chốt 5: Đã Xóa Cầu Thang Thừa & Nắn Đường Dạo Bộ Trên Cạn (R >= 90m)
- [ ] Đã xóa bỏ vĩnh viễn cầu thang bộ thừa bên mạn trái Cầu Long Biên (`stairwayGroup`).
- [ ] Tuyến đường dạo bộ bờ hồ chạy hoàn toàn trên vỉa hè cạn phố Đinh Tiên Hoàng (`R >= 90m`), không còn đoạn đường chém ngang lòng nước che khuất Cầu Thê Húc.

### Chốt 6: Cụm Di Tích Cầu Thê Húc, Đền Ngọc Sơn & Tháp Bút - Đài Nghiên
- [ ] Cầu Thê Húc 15 nhịp đỏ son uốn cong mềm mại trên mặt nước, có Capsule Horizontal Collision an toàn.
- [ ] Đắc Nguyệt Lâu 2 tầng 8 mái cong rêu phong, câu đối thếp vàng.
- [ ] Tháp Bút đá 5 tầng khắc "TẢ THANH THIÊN" trên Núi Độc Tôn và Đài Nghiên đá đào 3 chú ếch đá.

### Chốt 7: Bầu Trời Thu, Mây Trôi & Hiệu Ứng Lá Vàng Rơi (Autumn Leaves VFX)
- [ ] Bầu trời mùa thu trong xanh man mác, sương mù hồ Gươm huyền ảo.
- [ ] Có mây trắng lãng đãng trôi nhẹ nhàng trên cao.
- [ ] 350 hạt lá vàng/đỏ mùa thu chao nghiêng đu đưa theo gió rơi lả tả chân thực.

### Chốt 8: Chu Kỳ Ngày - Đêm & Đèn Ban Đêm Tự Động Thắp Sáng
- [ ] Chu kỳ ngày đêm chuyển tiếp êm ái giữa Bình minh, Ban ngày, Hoàng hôn và Ban đêm.
- [ ] Khi trời tối (sau 18:00), toàn bộ hệ thống đèn lồng đỏ, đèn đường Pháp cổ, đèn pha Cầu Thê Húc tự động thắp sáng lung linh.
- [ ] Cài đặt được tốc độ chu kỳ hoặc ghim cố định thời khắc trong Modal Cài Đặt.

### Chốt 9: Khu Tập Thể Kim Liên Mở 100%
- [ ] Không còn khối hộp đặc BoxGeometry bao bọc nhà tập thể. Người chơi bước vào sảnh tầng 1, leo cầu thang bộ granito mài, vào căn hộ mẫu 204 và đứng ngắm hoàng hôn chuồng cọp.

### Chốt 10: 4 Nhân Vật Người Thật Hữu Cơ 3D & Triệt Tiêu 100% Moonwalking
- [ ] 4 nhân vật Việt Nam độc bản da thịt hữu cơ liền khối, trang phục 3D đa lớp có độ dày 2mm.
- [ ] Bấm phím W luôn tiến thẳng về phía trước theo hướng nhìn camera, không bị giật lùi.

### Chốt 11: Bảo Toàn 100% 9 NPC Lịch Sử trong `WorldManager.js`
- [ ] Đầy đủ 9 NPC lịch sử: Bác Hùng, Chị Lan, Bà cụ quán nước, Hai cụ đánh cờ, Bác dân dạo bộ, Thanh niên cà phê, Cụ lang Triệu, Cô Mai, Bác Cả Phở.

### Chốt 12: Hiệu Năng & Độ Ổn Định
- [ ] Duy trì 60 FPS mượt mà trên trình duyệt, không rò rỉ bộ nhớ VRAM khi chuyển đổi nhân vật hoặc chuyển vùng.

---
*Bản tài liệu đặc tả kỹ thuật này là pháp lệnh kỹ thuật cao nhất cho toàn bộ đội ngũ Game Studio.*
