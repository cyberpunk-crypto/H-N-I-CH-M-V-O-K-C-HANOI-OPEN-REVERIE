# HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
## TÀI LIỆU KIẾN TRÚC KỸ THUẬT & ĐẶC TẢ HỆ THỐNG (GAME SPECIFICATION)

---

> **Mã dự án:** `HANOI-OPEN-REVERIE-3D`  
> **Phiên bản tài liệu:** `1.0.0-RELEASE`  
> **Phê duyệt:** Sếp Tổng Game Studio & Hội đồng Kiến trúc sư Trưởng  
> **Ngày ban hành:** 29/10/2026  
> **Áp dụng cho:** 3 Mũi nhọn sản xuất (`coder-chinh`, `ui-polish`, `nano-banana`) & Khâu Kiểm duyệt (`kiem-duyet-qa`).

---

## 1. TỔNG QUAN DỰ ÁN & TẦM NHÌN KỸ THUẬT

### 1.1. Tầm nhìn nghệ thuật và trải nghiệm
**HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)** là tựa game khám phá thế giới mở 3D không gian hoài niệm Hà Nội (Thập niên 80-90 giao thoa đương đại) vận hành trực tiếp trên trình duyệt Web. Người chơi hóa thân thành một "Kẻ Mộng Mơ" dạo bước qua 4 phân khu đặc trưng của thủ đô, sử dụng chiếc máy ảnh cơ film 35mm để căn góc nhìn giải mã những "Giao điểm thị giác" (Perspective Alignment) ẩn giấu trong kiến trúc, hồi sinh những lát cắt ký ức ngưng đọng của thời gian.

### 1.2. Tech Stack & Nền tảng
- **Engine 3D Core:** `Three.js` (r160+) chạy trực tiếp trên WebGL / WebGL2 context.
- **Kiến trúc mã nguồn:** Vanilla JavaScript (ES6+ ES Modules), mô hình phân rã Decoupled Architecture hướng sự kiện (`EventBus`), không phụ thuộc build tooling nặng nề để đảm bảo hot-reload và tương thích tối đa.
- **Audio Engine:** `Web Audio API` với bộ giải mã âm thanh không gian (Spatial Audio Listener / PannerNode) tạo không khí Hà Nội 3D sống động (tiếng ve sầu, còi tàu, tiếng rao đêm).
- **Lưu trữ dữ liệu:** `LocalStorage` kết hợp `IndexedDB` cục bộ cho việc lưu trữ hồ sơ nhân vật, thiết lập, và album ảnh film độ phân giải cao (`data:image/webp` base64).
- **Giao diện & Mỹ thuật:** HTML5 Canvas Overlay, CSS3 biến đổi không gian (3D Transforms, Backdrop Blur, Vintage Film Grain Post-processing, CSS Grid).

---

## 2. KIẾN TRÚC HỆ THỐNG & TÁCH BIỆT VÙNG LÀM VIỆC

Để đảm bảo 3 bộ phận (`coder-chinh`, `ui-polish`, `nano-banana`) sản xuất song song 100% không xung đột mã nguồn (zero merge conflicts), hệ sinh thái thư mục được phân định ranh giới nghiêm ngặt như sau:

```
d:/HÀ NỘI CHẠM VÀO KÝ ỨC ,HANOI OPEN REVERIE/
├── index.html                     # Điểm vào ứng dụng (Shell, nạp modules)
├── GAME_SPEC.md                   # Bản đặc tả kỹ thuật này
├── REVIEW_LOG.md                  # Nhật ký kiểm duyệt chất lượng QA
│
├── assets/                        # [VÙNG CỦA HỌA SĨ nano-banana]
│   ├── textures/                  # Textures 3D PBR/Albedo/Normal/Roughness
│   │   ├── lake_water_norm.jpg    # Sóng nước Hồ Gươm
│   │   ├── turtle_tower_moss.jpg  # Rêu phong Tháp Rùa
│   │   ├── old_wall_yellow.jpg    # Vôi vàng nứt nẻ
│   │   ├── rusty_iron_beam.jpg    # Thép dầm cầu Long Biên rỉ
│   │   ├── hanoi_brick_ground.jpg # Gạch ngói & đá lát vỉa hè
│   │   └── vintage_posters.jpg    # Áp phích cổ, biển hiệu vẽ tay
│   ├── ui/                        # Đồ họa giao diện, biểu tượng
│   │   ├── viewfinder_frame.png   # Khung ngắm máy ảnh 35mm cơ khí
│   │   ├── shutter_button.png     # Nút chụp kim loại retro
│   │   ├── stamp_hanoi.png        # Con tem bưu chính Hà Nội
│   │   ├── logo_reverie.png       # Logo tựa game phong cách hoài niệm
│   │   └── train_ticket_retro.png # Vé tàu hỏa giấy cổ
│   ├── photos/                    # Ảnh film ký ức mẫu tráng sẵn
│   │   ├── memory_turtle_mist.jpg # Tháp Rùa bảng lảng sương
│   │   ├── memory_train_street.jpg# Tàu lửa xé toạc ngõ hẹp
│   │   ├── memory_long_bien.jpg   # Hoàng hôn đỏ lửa trên dầm thép
│   │   └── memory_apartment.jpg   # Chuồng cọp & giàn hoa giấy đỏ
│   └── audio/                     # Tài nguyên âm thanh âm hưởng Hà Nội
│       ├── ambient_lake.mp3       # Gió hồ, sóng vỗ nhẹ, lá rơi
│       ├── ambient_train.mp3      # Tiếng rít đường ray, còi tàu xa
│       ├── ambient_street.mp3     # Tiếng ve hè, tiếng rao bánh mì/xôi
│       ├── shutter_click.mp3      # Tiếng màn trập cơ học kim loại đanh
│       └── photo_develop.mp3      # Tiếng tráng phim xoạch xoạch
│
├── src/
│   ├── bridge/                    # [VÙNG GIAO TIẾP DÙNG CHUNG - BẤT BIẾN]
│   │   ├── GameEvents.js          # Hệ thống EventBus tập trung
│   │   └── GameAPI.js             # Window Contract APIs cho UI tương tác với 3D
│   │
│   ├── core/                      # [VÙNG CỦA coder-chinh - LOGIC 3D & CORE]
│   │   ├── GameEngine.js          # Khởi tạo WebGL, vòng lặp GameLoop, render pass
│   │   ├── SceneManager.js        # Quản lý cảnh 3D, ánh sáng, sương mù (Fog)
│   │   ├── WorldManager.js        # Bản đồ 500m x 500m, LOD, Chunking
│   │   ├── ZoneManager.js         # Quản lý 4 phân khu (Hồ Gươm, Phố Cổ, Cầu, Nhà Tập Thể)
│   │   ├── PlayerController.js    # Điều khiển nhân vật, va chạm (AABB/Raycast), parkour
│   │   ├── CameraController.js    # Camera Kép (TPS Spring-Arm & FPS Viewfinder)
│   │   ├── PerspectivePuzzle.js   # Hệ thống giải đố căn góc nhìn quang học
│   │   ├── PhotoSystem.js         # Cơ chế chụp ảnh film, canvas capture, lưu khoảnh khắc
│   │   └── StorageService.js      # Dịch vụ LocalStorage / IndexedDB đồng bộ dữ liệu
│   │
│   └── ui/                        # [VÙNG CỦA ui-polish - GIAO DIỆN & TƯƠNG TÁC]
│       ├── OnboardingManager.js   # Quản lý tuần tự: Age Gate -> Login -> Character
│       ├── AgeGateModal.js        # Cổng xác nhận độ tuổi 18+ tính năm sinh
│       ├── AuthModal.js           # Modal Đăng nhập (Google Mock / Email)
│       ├── CharacterCreation.js   # Tạo nhân vật, Debounce 0.5s check trùng tên
│       ├── ViewfinderHUD.js       # Khung ngắm máy ảnh, thước đo tiêu cự, lưới bố cục
│       ├── ScrapbookModal.js      # Cuốn Album Ký Ức lật trang, tem dán, tản văn
│       ├── ToastNotification.js   # Bảng thông báo góc màn hình phong cách retro
│       ├── MinimapHUD.js          # La bàn và bản đồ chỉ hướng 4 phân khu
│       └── AudioBGMController.js  # Nút bật tắt nhạc, thanh chỉnh âm lượng hoài niệm
│
└── styles/                        # [VÙNG CỦA ui-polish - CSS STYLES]
    ├── reset.css                  # Chuẩn hóa CSS
    ├── retro_theme.css            # Biến màu sắc hoài niệm (Vàng hoàng cúc, đỏ bã trầu, xanh rêu)
    ├── onboarding.css             # Giao diện Age Gate, Login, Tạo nhân vật
    ├── hud.css                    # Thanh trạng thái, bản đồ, thông báo toast
    └── viewfinder.css             # Hiệu ứng film grain, vignette, khung ngắm camera
```

---

## 3. ĐẶC TẢ GIAO DIỆN LẬP TRÌNH VÀ TẬP HÀM GIAO TIẾP (API & EVENT SPECIFICATION)
> **KHÂU KIỂM DUYỆT 1 - BẮT BUỘC:**  
> Dưới đây là danh sách đầy đủ, chính xác từng ký tự tên hàm, tham số, kiểu dữ liệu, chiều truyền dữ liệu giữa `coder-chinh` và `ui-polish`. Tuyệt đối không tự ý đổi tên để đảm bảo ghép nối hoàn hảo.

### 3.1. Đối tượng toàn cục EventBus: `window.GameEventBus`
Được định nghĩa tại [src/bridge/GameEvents.js](file:///d:/H%C3%80%20N%E1%BB%98I%20CH%E1%BA%A0M%20V%C3%80O%20K%C3%9D%20%E1%BB%A8C%20,HANOI%20OPEN%20REVERIE/src/bridge/GameEvents.js).  
Phương thức chuẩn:
- `window.GameEventBus.on(eventName, callback)`: Đăng ký lắng nghe sự kiện.
- `window.GameEventBus.off(eventName, callback)`: Hủy đăng ký.
- `window.GameEventBus.emit(eventName, payload)`: Bắn sự kiện kèm dữ liệu.

---

### 3.2. Bảng Sự Kiện từ UI gửi sang Core (`UI -> CORE`)

| Tên Sự Kiện (`eventName`) | Kiểu Dữ Liệu (`payload`) | Bộ Phận Bắn | Bộ Phận Nhận | Ý Nghĩa Kỹ Thuật |
| :--- | :--- | :--- | :--- | :--- |
| `UI:AGE_VERIFIED` | `{ birthYear: number, birthMonth: number, birthDay: number, isAdult: boolean }` | `ui-polish` | `coder-chinh` | Người dùng xác nhận tuổi thành công (>= 18 tuổi), cho phép mở màn hình tiếp. |
| `UI:AUTH_SUCCESS` | `{ userId: string, username: string, authType: 'google' \| 'guest' \| 'email' }` | `ui-polish` | `coder-chinh` | Đăng nhập tài khoản thành công, khởi động nạp dữ liệu người dùng từ Storage. |
| `UI:CHARACTER_CONFIRMED` | `{ characterName: string, outfitId: string, cameraModel: string }` | `ui-polish` | `coder-chinh` | Người dùng chốt tên hợp lệ và trang phục, kích hoạt Game Core tải 3D World. |
| `UI:SWITCH_CAMERA_MODE` | `{ targetMode: 'TPS' \| 'FPS' }` | `ui-polish` | `coder-chinh` | Chuyển đổi thủ công camera (ví dụ bấm nút trên màn hình cảm ứng hoặc phím tắt). |
| `UI:TRIGGER_SHUTTER` | `{ timestamp: number }` | `ui-polish` | `coder-chinh` | Bấm nút chụp ảnh vật lý/ảo trên Viewfinder HUD, kích hoạt chụp Canvas 3D. |
| `UI:OPEN_SCRAPBOOK` | `{ open: boolean }` | `ui-polish` | `coder-chinh` | Bật/tắt Album Ký Ức, yêu cầu Core tạm dừng (pause) hoặc tiếp tục Game Loop. |
| `UI:TELEPORT_REQUEST` | `{ zoneId: 'ho_guom' \| 'pho_co' \| 'long_bien' \| 'tap_the' }` | `ui-polish` | `coder-chinh` | Người chơi chọn điểm dịch chuyển nhanh trên bản đồ nhỏ (Minimap). |
| `UI:SET_AUDIO_VOLUME` | `{ master: number, bgm: number, sfx: number }` | `ui-polish` | `coder-chinh` | Điều chỉnh âm lượng tổng và thành phần (giá trị float từ `0.0` đến `1.0`). |

---

### 3.3. Bảng Sự Kiện từ Core gửi sang UI (`CORE -> UI`)

| Tên Sự Kiện (`eventName`) | Kiểu Dữ Liệu (`payload`) | Bộ Phận Bắn | Bộ Phận Nhận | Ý Nghĩa Kỹ Thuật |
| :--- | :--- | :--- | :--- | :--- |
| `CORE:WORLD_LOAD_PROGRESS` | `{ progress: number, currentAsset: string }` | `coder-chinh` | `ui-polish` | Cập nhật tiến độ tải 3D World (0 - 100%) lên thanh loading retro. |
| `CORE:WORLD_READY` | `{ spawnZone: string, playerPosition: { x: number, y: number, z: number } }` | `coder-chinh` | `ui-polish` | Thế giới 3D đã sẵn sàng, yêu cầu UI ẩn màn hình chờ và hiện HUD. |
| `CORE:CAMERA_MODE_CHANGED` | `{ mode: 'TPS' \| 'FPS', fov: number }` | `coder-chinh` | `ui-polish` | Core thông báo đã lerp xong chế độ camera (FPS bật Viewfinder HUD, TPS tắt HUD). |
| `CORE:PUZZLE_DETECTED` | `{ puzzleId: string, puzzleName: string, alignmentScore: number, isAligned: boolean }` | `coder-chinh` | `ui-polish` | Người chơi đang nhìn vào vị trí câu đố; `alignmentScore` (0.0 - 1.0) để UI vẽ thước ngắm đổi màu. |
| `CORE:PUZZLE_SOLVED` | `{ puzzleId: string, title: string, quote: string, unlockedShortcut: string, photoUrl: string }` | `coder-chinh` | `ui-polish` | Căn góc thành công! UI mở hiệu ứng chớp sáng, vinh danh ký ức và trao huy hiệu. |
| `CORE:PHOTO_CAPTURED` | `{ photoId: string, dataUrl: string, zoneId: string, timestamp: number, isPuzzle: boolean, poemQuote: string }` | `coder-chinh` | `ui-polish` | Ảnh vừa chụp được render xong, gửi dataUrl sang UI để hiển thị thumbnail và cất vào Album. |
| `CORE:ZONE_ENTERED` | `{ zoneId: string, zoneName: string, description: string, ambientTrack: string }` | `coder-chinh` | `ui-polish` | Người chơi bước vào ranh giới phân khu mới, UI hiện Toast thông báo tên phố. |
| `CORE:INTERACTION_AVAILABLE` | `{ canInteract: boolean, promptText: string, actionKey: string }` | `coder-chinh` | `ui-polish` | Gần ghế đá, hàng nước chè, bảng tin: UI hiện phím gợi ý (ví dụ: "[E] Ngồi uống trà đá"). |

---

### 3.4. Bảng Hợp Đồng API Trực Tiếp (`window.GameAPI`)
Được triển khai tại [src/bridge/GameAPI.js](file:///d:/H%C3%80%20N%E1%BB%98I%20CH%E1%BA%A0M%20V%C3%80O%20K%C3%9D%20%E1%BB%A8C%20,HANOI%20OPEN%20REVERIE/src/bridge/GameAPI.js) bởi `coder-chinh` để `ui-polish` gọi đồng bộ khi cần:

```javascript
/**
 * Contract API toàn cục giữa Coder Chính và UI Polish
 */
window.GameAPI = {
  /**
   * Kiểm tra tính hợp lệ và trùng lặp của tên nhân vật theo thời gian thực (Debounce)
   * @param {string} rawName - Tên người dùng nhập vào
   * @returns {Promise<{ isValid: boolean, message: string, suggestions: string[] }>}
   */
  checkCharacterNameAvailability: async (rawName) => {},

  /**
   * Lưu hoặc cập nhật hồ sơ người chơi vào LocalStorage
   * @param {Object} profile - { username, outfit, unlockedPuzzles, capturedPhotosCount }
   * @returns {boolean} Thành công hay thất bại
   */
  saveUserProfile: (profile) => {},

  /**
   * Lấy toàn bộ danh sách ảnh đã chụp từ Album Database (LocalStorage / IndexedDB)
   * @returns {Promise<Array<{ id: string, dataUrl: string, zone: string, timestamp: number, quote: string }>>}
   */
  getAlbumPhotos: async () => {},

  /**
   * Khóa hoặc mở khóa điều khiển di chuyển nhân vật (khi đang mở modal UI)
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
  startWorldEngine: () => {}
};
```

---

## 4. CHI TIẾT 4 PHÂN KHU THẾ GIỚI MỞ 500m x 500m LIỀN MẠCH

Bản đồ tổng thể được thiết kế theo tỷ lệ tọa độ 3D thực (1 đơn vị Three.js = 1 mét), diện tích phủ bì `500m x 500m` phân chia làm 4 phân khu liền mạch (Seamless Streaming, không tải lại trang):

```
       [TÂY BẮC]                                [ĐÔNG BẮC]
 Khu 2: MÊ CUNG PHỐ CỔ & ĐƯỜNG TÀU       Khu 3: NHỊP CẦU LONG BIÊN & SÔNG HỒNG
   - Phố Hàng Bạc, Hàng Ngang, Hàng Đào     - Dầm thép Eiffel rỉ sét, đường ray
   - Cà phê đường tàu, ray lượn sát vách    - Bãi bồi lau sậy Sông Hồng bạt ngàn
   - Tọa độ: (-250 đến 0, 0 đến 250)        - Tọa độ: (0 đến 250, 0 đến 250)
 --------------------------------------------------------------------------------
   - Tọa độ: (-250 đến 0, -250 đến 0)       - Tọa độ: (0 đến 250, -250 đến 0)
 Khu 4: KHU TẬP THỂ CŨ HOÀNG HÔN          Khu 1: HỒ GƯƠM & THÁP RÙA TRUNG TÂM
   - Chuồng cọp sắt vươn mình, dây phơi     - Tháp Rùa cổ kính ngự giữa hồ
   - Tường vôi ố vàng, hoa giấy nở rộ       - Cầu Thê Húc đỏ son, Đền Ngọc Sơn
       [TÂY NAM]                                [ĐÔNG NAM]
```

### 4.1. Phân khu 1: Hồ Gươm & Tháp Rùa (Zone A: Hoan Kiem Lake)
- **Tâm điểm:** Tháp Rùa cổ kính rêu phong nằm giữa đảo xanh trên mặt nước phẳng lặng.
- **Chi tiết môi trường:**
  - Mặt nước sử dụng Three.js `Water` shader với hiệu ứng gợn sóng nhỏ và phản chiếu môi trường hoàng hôn mờ ảo.
  - Cầu Thê Húc uốn cong màu đỏ son dẫn vào Đền Ngọc Sơn với hàng cây đa và liễu rủ ven hồ đung đưa theo gió.
  - Vỉa hè lát đá xanh, hàng ghế đá xưa, cột đèn đường phong cách Pháp cổ với ánh sáng vàng ấm áp.
- **Thiết kế dốc tiếp cận Cầu Thê Húc (Thê Húc Bridge Approach Ramps):**
  - **Đầu phía Bờ Hồ:** Thiết kế dốc thoải tiếp cận nhẹ nhàng (Gentle Approach Ramp) chuyển tiếp từ mặt vỉa hè (`y = 0.15m`) lên sàn chân cầu (`y = 0.95m`), độ dốc êm ái < 12%, bề mặt lát đá khuyết mộc mạc, triệt tiêu gờ gập giúp raycast nhân vật bước lên êm ái 100% không bị vấp.
  - **Nhịp cầu cong & Mặt ván đỏ:** Thân cầu cong hình cầu vồng với chuỗi collider đa giác cong mượt mà theo sống cầu, lan can gỗ sơn son đỏ chạm đầu rồng cách điệu.
  - **Đầu phía Đảo Ngọc Sơn:** Dốc hạ thoải dẫn thẳng qua cổng Đắc Nguyệt Lâu (Lầu Ngắm Trăng) vào sân đền cổ kính rợp bóng cây đa nghìn năm tuổi, không có bất kỳ khoảng hở hay xung đột va chạm nào.
- **Ký ức ngưng đọng:** Hình bóng rùa thiêng lập lờ trong sương mai, tiếng lá rụng xào xạc lúc chớm đông.

### 4.2. Phân khu 2: Mê Cung Phố Cổ & Phố Đường Tàu (Zone B: Old Quarter & Train Street)
- **Tâm điểm:** Đoạn đường ray tàu hỏa uốn lượn chạy sát rạt qua các ngôi nhà phố cổ hình ống sâu hun hút.
- **Chi tiết môi trường ngoại thất:**
  - Mái ngói âm dương rêu phong nhấp nhô cao thấp; tường quét vôi vàng đặc trưng đã bong tróc từng mảng lộ lớp gạch đỏ.
  - Mạng nhện dây điện chằng chịt treo lủng lẳng trên các cột điện bê tông xưa.
  - Quán cà phê cóc ven đường tàu với bàn ghế gỗ con con, tách cà phê phin nhôm đang nhỏ giọt.
  - Biển hiệu cửa hiệu vẽ tay thủ công phong cách Hà Nội xưa: "Cắt tóc bình dân", "Đồng hồ Liên Xô", "May đo âu phục".
- **Ký ức ngưng đọng:** Còi tàu vang dội từ xa, chuông cảnh báo leng keng, những bóng người vội vã nép sát vào vách tường khi đoàn tàu chạy qua ga trong ký ức.

#### 4.2.1. Quy chuẩn Kiến trúc Tường Mỏng & Không Gian Thông Thủy (Thin-Wall Architecture)
> **YÊU CẦU ĐẠI TU TỪ SẾP TỔNG:**  
> Tuyệt đối **KHÔNG** sử dụng khối hộp đặc (Solid Box) dày 4m - 5m chiếm hết diện tích lòng nhà.  
- **Độ dày tường bao ngoại thất:** Chuẩn xác `0.35m` (kết cấu tường gạch 330 trát vữa vôi truyền thống).
- **Kích thước thông thủy bên trong:** Đạt đúng tỷ lệ quy mô bên ngoài `11.3m x 15.3m`, chiều cao trần nhà `4.2m`, tạo không gian bên trong rộng thênh thang, thoáng đãng, người chơi có thể tự do đi lại và khám phá mọi góc phòng.
- **Cửa chính & Cửa sổ đón sáng:** Cửa gỗ bức bàn 4 cánh mở toang đón gió và ánh sáng tự nhiên, cửa sổ chớp lá sách phong cách Pháp cổ sơn màu xanh lam/xanh ngọc.

#### 4.2.2. Chi tiết Nội Thất: Tiệm Cà Phê Trứng & Trà Sen Cổ Điển (Egg Coffee & Lotus Tea House)
- **Quầy Bar Trung Tâm:** Dài 5.2m bằng gỗ lim đánh vec-ni cánh gián bóng loáng, mặt quầy bo viền đồng thau sáng bóng. Trên mặt quầy xếp 6 phin nhôm cà phê đang nhỏ giọt chầm chậm, cốc thủy tinh khía hoa văn đựng lớp kem trứng béo ngậy vàng óng.
- **Kệ Tủ Trưng Bày Trà & Cà Phê:** Kệ gỗ 4 tầng kịch trần, sắp đặt các hũ thủy tinh nút bần đựng hạt cà phê rang mộc Robusta, Arabica, hũ gốm ủ cánh sen Tây Hồ sấy khô, ấm trà đất nung Bát Tràng.
- **Khu Âm Nhạc Hoài Niệm:** Một chiếc máy hát đĩa than loa kèn đồng cổ (Gramophone) đặt trên đôn gỗ chạm khắc, phát ra những thanh âm rè rè mộc mạc của các bản tình ca Hà Nội xưa.
- **Đồng Hồ Thời Gian:** Đồng hồ quả lắc bằng gỗ sồi treo tường, quả lắc đồng đung đưa nhịp nhàng gõ tích tắc theo từng giây trôi.
- **Khu Vực Tiếp Khách Sang Trọng:**
  - 3 bộ bàn ghế sofa bọc nỉ nhung xanh rêu và da nâu cổ điển.
  - 4 bộ bàn tròn gỗ gụ khảm ốc xà cừ kèm ghế đôn mây tre đan tinh tế.
  - Tấm thảm trải sàn dệt hoa văn hình học phong cách Đông Dương (Indochine) khổ lớn 4m x 6m.
- **Nghệ Thuật & Mỹ Cảm:**
  - Bình gốm Bát Tràng men rạn cắm những búp sen hồng và sen trắng tỏa hương thơm dịu mát.
  - Tủ sách gỗ lớn chứa đầy tiểu thuyết, tập thơ Quang Dũng, Nguyễn Đình Thi, Thạch Lam và báo Tiền Phong, Nhân Dân thập niên 80-90.
  - Cầu thang gỗ uốn cong thanh thoát dẫn lên gác lửng (Mezzanine), nơi có ban công nhìn thẳng ra phố cổ và đường ray xe lửa.
- **Hệ Thống Ánh Sáng:** Đèn chùm thả đồng cổ trần nhà, kết hợp 8 đèn rọi spotlight vàng ấm (2700K) rọi rực rỡ vào tranh sơn mài và các góc tĩnh vật.

#### 4.2.3. Chi tiết Nội Thất: Cửa Hàng Bách Hóa Mậu Dịch Thời Bao Cấp (State Department Store)
- **Không Gian & Mặt Bằng:** Kích thước `11.3m x 15.3m` rộng thênh thang, sàn lát gạch bông hoa chanh cổ điển thập niên 80.
- **Dãy Kệ Hàng Mậu Dịch:** 3 dãy kệ gỗ thông và khung thép sơn xám chạy dọc gian phòng, đầy ắp hiện vật thời bao cấp:
  - Hàng trăm chiếc ca tráng men Hải Phòng màu trắng in bông hoa hải đường đỏ.
  - Những chiếc phích nước Rạng Đông vỏ nhôm in họa tiết cúc vạn thọ rực rỡ.
  - Hộp bích quy Hải Châu bằng thiếc vuông vức xếp thành chồng tháp.
  - Các súc vải hoa phin nõn, vải kaki Nam Định cuộn tròn xếp lớp ngay ngắn.
- **Bàn Quầy Thu Ngân Phân Phối:**
  - Bàn gỗ mậu dịch viên với chiếc cân đĩa đồng có bộ quả cân sắt từ 50g đến 2kg.
  - Bàn tính gảy bằng gỗ kêu lách cách mỗi khi tính tem phiếu.
- **Góc Kỹ Nghệ & Đời Sống:**
  - Chiếc đài Radio Cassette Liên Xô (VEF-206) thân bọc da đen vỏ nhôm sáng bóng.
  - Quạt tai voi Liên Xô cánh cao su dẻo màu xanh ngọc bích êm ái quay phe phẩy.
  - Chiếc xe đạp Thống Nhất khung nam màu xanh bộ đội, gắn chuông đồng "kính coong" và biển số đăng ký kiểm soát xe đạp Hà Nội năm 1985 dựng ngay góc phòng danh dự.
- **Bích Họa & Khẩu Hiệu Cổ Động:** Tường treo các bức tranh cổ động vẽ tay: *"Không có gì quý hơn độc lập tự do"*, *"Cửa hàng phục vụ văn minh lịch sự"*, bảng thông báo *"Phân phối nhu yếu phẩm theo tem phiếu đợt 2"*.
- **Hệ Thống Đèn Chiếu:** Đèn tuýp huỳnh quang treo dây xích thả trần phát ánh sáng xanh trắng đặc trưng kết hợp bóng đèn tròn sợi đốt 40W vàng ấm.

### 4.3. Phân khu 3: Nhịp Cầu Long Biên & Bãi Bồi Sông Hồng (Zone C: Long Bien Bridge)
- **Tâm điểm:** Cây cầu Long Biên bằng dầm thép khổng lồ rỉ sét màu cánh gián vắt ngang dòng Sông Hồng phù sa đỏ, đặt tại cao độ mặt sàn `y = 4.2m`.
- **Thiết Kế Tiếp Cận Cầu (Ramps & Stairs System):**
  > **YÊU CẦU ĐẠI TU TỪ SẾP TỔNG:**  
  > Cầu Long Biên đang ở cao độ `y = 4.2m` trên cao, bắt buộc phải có hệ thống tiếp cận trực quan, hoàn chỉnh để người chơi di chuyển tự nhiên từ mặt đất lên dầm cầu!
  - **Dốc Dẫn Thoải (Main Bridge Ramp):**
    - Điểm khởi đầu trên mặt đất: Tọa độ `x = 10.0m` (`y = 0.1m`).
    - Điểm kết thúc trên dầm cầu: Tọa độ `x = 35.0m` (`y = 4.2m`).
    - Chiều dài dốc: `25.0m`, chiều rộng dốc: `4.5m`.
    - Độ dốc kỹ thuật chuẩn mực: `(4.2 - 0.1) / 25.0 = 16.4%` (độ dốc thoai thoải, lý tưởng cho người đi bộ dạo bước và xe đạp leo dốc không bị trượt).
    - Mặt đường dốc: Lát bê tông đá dăm cổ có các rãnh khía ngang chống trơn trượt, hai bên có dầm thép hình chữ X Eiffel che chắn an toàn.
  - **Cầu Thang Bộ Gạch Đá Phụ Trợ (Pedestrian Stone Staircase):**
    - Vị trí: Đặt sát vỉa hè chân cầu từ phía phố dẫn thẳng lên lối đi bộ cánh dầm cầu.
    - Cấu trúc: 24 bậc thang gạch chỉ trát đá rửa màu xám, chiều cao bậc `0.17m`, mặt bậc rộng `0.32m`, tay vịn bằng sắt ống sơn chống rỉ màu nâu đỏ.
- **Không Gian Trên Cầu:**
  - Nhịp dầm thép đan chéo vươn cao `12m` tạo thành đường hầm kết cấu kim loại hùng vĩ.
  - Lối đi bộ lát ván gỗ lim phát tiếng kẽo kẹt theo từng bước chân.
  - Đường ray xe lửa ở giữa với các tà vẹt gỗ ngâm hắc ín bóng loáng.
- **Bãi Bồi Sông Hồng Phía Dưới:** Những vạt lau sậy trắng xóa đu đưa theo chiều gió sông thổi lồng lộng, sương khói lãng đãng từ mặt nước hòa vào ánh hoàng hôn nhuộm đỏ cả một góc trời phía Đông.
- **Ký ức ngưng đọng:** Đoàn người gánh hàng hoa dong xe đạp qua cầu trong chiều lộng gió, tiếng thép ngân rung dưới bánh xe sắt.

### 4.4. Phân khu 4: Khu Tập Thể Cũ & Ngõ Phố Hoàng Hôn (Zone D: Collective Housing)
- **Tâm điểm:** Dãy nhà tập thể 5 tầng kiểu lắp ghép tấm lớn thập niên 80 (như Kim Liên, Trung Tự, Giảng Võ).
- **Chi tiết môi trường:**
  - Hệ thống "chuồng cọp" (lồng sắt cơi nới không gian) nhô ra ngoài chằng chịt cây cảnh, lồng chim sơn ca và dây phơi quần áo rực rỡ màu sắc.
  - Tường nhà màu vàng hoàng cúc bạc phếch, in hằn vệt rêu đen sau những mùa mưa nồm ẩm.
  - Cầu thang bộ ngoài trời bám rêu xanh, giàn hoa giấy đỏ rực rủ xuống lối đi chung.
  - Dưới sân tập thể: bàn cờ tướng của các cụ già, xe đạp Thống Nhất cũ kỹ dựng chân chống nghiêng bên gốc bàng già.
- **Ký ức ngưng đọng:** Tiếng loa phường phát bản tin chiều, mùi cơm sôi ngạt ngào từ các căn hộ tập thể thoảng ra lối đi hẹp.

---

## 5. HỆ THỐNG CAMERA KÉP (DUAL CAMERA SYSTEM: TPS & FPS)

Hệ thống Camera được quản lý bởi `CameraController.js` với sự phối hợp chặt chẽ giữa góc nhìn thứ ba tự do và góc nhìn thứ nhất mô phỏng máy ảnh film.

```
       [PHÍM V / GIỮ CHUỘT PHẢI]
       ------------------------->
  TPS (Khám phá thế giới)          FPS (Khung ngắm máy ảnh film)
  - Spring-Arm camera 4.5m         - Ẩn phần đầu/thân nhân vật
  - Tự động tránh xuyên tường      - Bật Viewfinder HUD cơ khí
  - Parkour, nhảy leo vỉa hè       - Lưới Rule of Thirds / Tỷ lệ vàng
       <-------------------------  - Head-bobbing thở nhẹ chân thực
       [NHẢ CHUỘT / BẤM PHÍM V]
       (Chuyển đổi Lerp 0.3 giây)
```

### 5.1. Chế độ Góc Nhìn Thứ Ba (TPS - Third Person Exploration)
- **Mục đích:** Khám phá cảnh quan, điều khiển nhân vật chạy bộ dạo phố, tương tác không gian.
- **Đặc tính kỹ thuật:**
  - **Spring-Arm (Camera Boom):** Khoảng cách tiêu chuẩn 4.5m sau lưng nhân vật, góc chúc xuống `15 độ`.
  - **Damping & Smooth Orbit:** Dùng nội suy `lerp` góc quay chuột (Yaw/Pitch) với tốc độ làm mềm `factor = 0.08`, chuyển động mượt mà không bị giật cục (camera jitter).
  - **Chống xuyên tường (Collision Detection):** Bắn Raycast từ vị trí đầu nhân vật tới vị trí mong muốn của camera. Nếu va chạm với Mesh tĩnh của các tòa nhà hoặc dầm cầu, tự động kéo khoảng cách camera lại gần (khoảng cách tối thiểu 0.8m) để tránh hiện tượng camera nhìn xuyên tường (clipping).

### 5.2. Chế độ Góc Nhìn Thứ Nhất (FPS - Viewfinder Máy Ảnh Film)
- **Mục đích:** Săn khoảnh khắc, quan sát chi tiết hoa văn rêu phong, căn góc giải đố thị giác.
- **Đặc tính kỹ thuật:**
  - **Chuyển đổi êm ái (Smooth Transition):** Khi bấm phím `V` hoặc giữ chuột phải, Camera tự động `lerp` từ tọa độ TPS về tọa độ mắt nhân vật (`y = 1.65m`) trong vòng `0.3 giây` (sử dụng hàm easing `cubic-bezier(0.25, 1, 0.5, 1)`).
  - **Ẩn Model để thông thoáng góc nhìn:** Tự động gán `playerMesh.visible = false` khi ở chế độ FPS, tránh tình trạng phần tóc hoặc mũ của nhân vật che khuất ống kính.
  - **Head-Bobbing & Nhịp thở:** Khi nhân vật đứng yên hoặc bước đi trong FPS, áp dụng dao động điều hòa nhẹ nhàng theo trục Y (`Math.sin(time * 2.0) * 0.015`) mô phỏng nhịp thở người cầm máy cơ.
  - **FOV (Field of View):** Giảm từ `65 độ` (TPS) xuống `45 độ` (FPS) mô phỏng tiêu cự ống kính chân dung 50mm cổ điển.

---

## 6. CƠ CHẾ GAMEPLAY CỐT LÕI

### 6.1. Cơ chế Giải đố Giao Điểm Thị Giác (Perspective Alignment Puzzle)
Lấy cảm hứng từ *The Witness*, *Gorogoa* và *Superliminal*, người chơi phải di chuyển nhân vật đến một "Điểm Đứng Định Mệnh" (Fateful Standpoint) và hướng ống kính theo góc độ chính xác để các vật thể rời rạc ghép thành một biểu tượng hoàn chỉnh.

```
       Vật thể A (Tiền cảnh)            Vật thể B (Hậu cảnh)
       [Nhánh cây liễu rủ]             [Vết nứt tường vôi vàng]
                \                               /
                 \                             /
                  \                           /
                   \                         /
                    [Ống kính Viewfinder FPS]
                   (Căn chuẩn góc -> Ghép thành biểu tượng KHUÊ VĂN CÁC)
```

#### 4 Câu Đố Biểu Tượng Của 4 Phân Khu:
1. **Câu đố 1 (Hồ Gươm): "Văn Miếu Ký Ức"**  
   - Cành liễu rủ ven hồ khi ngắm từ một ghế đá cổ ghép vừa khít với bóng phản chiếu của Tháp Rùa trên mặt nước, tạo thành hình bóng Khuê Văn Các uy nghiêm.
2. **Câu đố 2 (Phố Cổ): "Giai Điệu Dây Điện"**  
   - Những bó dây điện chằng chịt vắt ngang con hẻm nhỏ khi căn từ ban công tầng 2 quán cà phê ghép với các cánh chim bồ câu đậu trên mái ngói tạo thành 5 dòng kẻ và các nốt nhạc đầu tiên của bài hát "Người Hà Nội".
3. **Câu đố 3 (Cầu Long Biên): "Rồng Bay Sông Hồng"**  
   - Các thanh dầm thép Eiffel đan chéo vắt bóng xuống bãi cát bồi Sông Hồng vào lúc hoàng hôn buông xuống, tạo thành hình ảnh Thăng Long Đệ Nhất Rồng thiêng bay lượn.
4. **Câu đố 4 (Khu Tập Thể): "Khát Vọng Chuồng Cọp"**  
   - Những thanh sắt song thưa của lồng chuồng cọp tầng 4 ghép với giàn hoa giấy đỏ tầng 3 và mặt trời tròn đỏ lặn phía xa tạo thành hình cánh chim bồ câu vút bay khỏi lồng sắt.

#### Thuật toán kiểm tra góc nhìn quang học (`PerspectivePuzzle.js`):
- **Kiểm tra khoảng cách người chơi:** `distance(playerPosition, puzzle.targetPosition) < 0.8m`.
- **Kiểm tra hướng nhìn Vector (Dot Product):**  
  `dotProduct = cameraDirection.dot(puzzle.targetDirection) > 0.985` (tương đương sai số góc cho phép dưới 10 độ).
- **Điểm căn chỉnh (`alignmentScore`):** Tính theo thang điểm từ `0.0` đến `1.0`. Khi `alignmentScore >= 0.95`, phát sự kiện `CORE:PUZZLE_DETECTED` với cờ `isAligned = true`.

### 6.2. Săn Khoảnh Khắc Bằng Máy Ảnh Film (Vintage Shutter & Darkroom)
- Khi đang ở chế độ FPS và bấm `Space` hoặc click chuột trái / nút chụp ảo:
  1. **Hiệu ứng màn trập cơ học:** Màn hình chớp đen trong `0.08 giây` kèm âm thanh tanh tách đanh thép của máy cơ Leica M3.
  2. **Trích xuất khung hình:** Lấy dữ liệu WebGL Canvas thông qua `renderer.domElement.toDataURL('image/jpeg', 0.85)`.
  3. **Bộ lọc tráng phim Vintage:** Áp dụng hiệu ứng Film Grain, hạt màu bạc, tone vàng ấm Kodak Portra hoặc đen trắng Ilford Tri-X.
  4. **Tự động gắn tem ký ức:** Gắn tem bưu chính Hà Nội, ngày giờ chụp, địa danh và một câu tản văn/thơ Hà Nội ngẫu hứng tương ứng.
  5. **Lưu trữ vĩnh viễn:** Lưu vào `IndexedDB` để cuốn Album không bị mất khi tải lại trang.

### 6.3. Mở Khóa Đường Tắt & Biến Đổi Không Gian (Shortcut Unlocking)
Mỗi khi một câu đố giao điểm thị giác được chụp thành công:
- **Biến đổi không gian 3D:** Một bức tường ngõ cụt rêu phong khẽ dịch chuyển hé mở một con ngõ sâu dẫn lối tắt qua phân khu khác.
- **Hiệu ứng ánh sáng ký ức:** Đèn lồng phố cổ bừng sáng, hoa giấy bung nở rực rỡ, hoặc đoàn tàu hỏa hơi nước ký ức chầm chậm lướt qua màn sương đêm.
- **Âm thanh ký ức:** Tiếng đàn vĩ cầm hoặc tiếng dương cầm ngân lên khúc ca hoài niệm giữa bầu không khí tĩnh mịch.

---

## 7. LUỒNG ONBOARDING & WEB PORTAL (WEB PORTAL FLOW)

Luồng tiếp cận người chơi được thiết kế chỉn chu, đậm chất hoài niệm với 3 bước phân tách độc lập:

```
[Mở Trang Web]
      │
      ▼
┌───────────────────────────┐
│ Bước 1: Age Gate (18+)    │ ---> Từ chối (< 18 tuổi): Chuyển sang màn hình thông điệp
│ - Nhập ngày/tháng/năm     │
│ - Cảnh báo Hà Nội đêm     │
└─────────────┬─────────────┘
              │ Đạt chuẩn (>= 18 tuổi)
              ▼
┌───────────────────────────┐
│ Bước 2: Đăng Nhập         │
│ - Google 1-Click (Mock)   │ ---> Đăng nhập thành công, lưu session vào LocalStorage
│ - Email / Mật khẩu        │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Bước 3: Tạo Nhân Vật      │
│ - Tên "Kẻ Mộng Mơ"        │
│ - Debounce 500ms check tên│ ---> Trùng tên: Rung lắc, viền đỏ, kèm 3 tên gợi ý
│ - Chọn trang phục xưa     │      Hợp lệ: Viền xanh, bật sáng nút "Bước Vào Ký Ức"
└─────────────┬─────────────┘
              │ Bấm "Bước Vào Ký Ức"
              ▼
[Khởi Động 3D World & Nhập Cuộc]
```

### 7.1. Cổng Xác Nhận Độ Tuổi (Age Gate 18+)
- **Nội dung cảnh báo:**  
  *"Hà Nội về đêm chứa đựng những hoài niệm sâu lắng, những trầm tư và ký ức của thời gian. Trải nghiệm không gian mở này được tối ưu hóa cảm xúc cho người trưởng thành (trên 18 tuổi)."*
- **Tương tác:** Người chơi chọn Ngày / Tháng / Năm sinh từ dropdown hoài niệm. Thuật toán kiểm tra chính xác mốc đủ 18 tuổi tính tới ngày hiện tại.
- **Lưu trạng thái:** Khi xác nhận thành công, lưu `localStorage.setItem('hanoi_age_verified', 'true')` để không làm phiền người chơi trong các phiên truy cập sau.

### 7.2. Đăng Nhập Tài Khoản
- **Phương thức hỗ trợ:**
  - Nút **"Đăng nhập bằng Google"** (1-click mô phỏng hoàn chỉnh cơ chế SSO, tự động sinh tên đại diện).
  - Tùy chọn **"Đăng ký / Đăng nhập bằng Email & Mật khẩu"** phong cách bìa sổ hộ khẩu / thẻ căn cước vintage.
  - Tùy chọn **"Dạo chơi ẩn danh (Khách mộng mơ)"** cho phép trải nghiệm ngay lập tức.
- **Lưu trữ dữ liệu:** Thông tin tài khoản được lưu trữ an toàn trong `localStorage.getItem('hanoi_auth_user')`.

### 7.3. Tạo Nhân Vật & Kiểm Tra Trùng Tên Thời Gian Thực (Debounce 500ms)
- **Input Tên nhân vật:** Giới hạn từ `3 đến 16 ký tự`, không chứa ký tự đặc biệt nguy hiểm.
- **Cơ chế Debounce 0.5 giây:** Khi người dùng dừng gõ phím đúng 500ms, hàm `window.GameAPI.checkCharacterNameAvailability(name)` sẽ được gọi.
- **Danh sách tên đã đăng ký sẵn (Mock/Pre-reserved):** `["admin", "hanoian", "kemongmo", "thaprua", "longbien", "hoanghon", "phoco", "trangan", "nguoihanoi"]`.
- **Trường hợp TRÙNG TÊN:**
  - Viền ô nhập đổi sang màu đỏ bã trầu nhấp nháy (`border: 2px solid #e74c3c; animation: shake 0.4s ease-in-out`).
  - Icon cảnh báo đỏ kèm dòng chữ: *"Tên này đã có lãng tử sử dụng!"*.
  - Tự động hiển thị 3 gợi ý tên độc đáo: ví dụ `[Tên]_1990`, `LãngTử_[Tên]`, `[Tên]_PhốCổ`. Click vào gợi ý sẽ tự điền vào ô input.
- **Trường hợp TÊN HỢP LỆ:**
  - Viền ô đổi sang màu xanh ngọc bích vintage (`border: 2px solid #2ecc71`).
  - Icon tick xanh kèm thông báo: *"Tên lãng tử rất tuyệt vời!"*.
  - Nút **"Bước Vào Ký Ức"** được kích hoạt sáng lên từ màu xám sang màu vàng đồng hoàng gia (`#f39c12`), có hiệu ứng hào quang nhẹ.
- **Tùy chọn trang phục:**
  - *Áo Dài Trắng Thanh Lịch* (Áo dài học trò Hà Nội xưa).
  - *Áo Phao Mùa Đông Phố Cũ* (Phong cách mùa đông rét buốt).
  - *Áo Khoác Da Bomber Cổ Điển* (Lãng tử thập niên 90).
  - *Sơ Mi Trắng Quần Tây Thống Nhất* (Trang phục thanh niên trí thức).

---

## 8. PHÂN CHIA NHIỆM VỤ CHO 3 MŨI NHỌN SẢN XUẤT

| Mũi Nhọn | Phân Vùng File Đảm Trách | Nhiệm Vụ Cụ Thể | Tiêu Chuẩn Nghiệm Thu |
| :--- | :--- | :--- | :--- |
| **Coder Chính**<br>(`coder-chinh`) | `src/core/*`<br>`src/bridge/*` | 1. Xây dựng Game Loop Three.js mượt 60 FPS.<br>2. Xây dựng 4 phân khu thế giới mở với ranh giới tọa độ rõ ràng.<br>3. Triển khai Camera Kép (TPS Spring-Arm chống xuyên tường & FPS Viewfinder).<br>4. Lập trình thuật toán căn góc Perspective Alignment & Shutter Canvas Capture.<br>5. Cung cấp đầy đủ các API trong `window.GameAPI` và kết nối sự kiện `window.GameEventBus`. | Đảm bảo chuyển động camera không rung lắc, FPS không lộ đầu model, căn góc chính xác, API trả về đúng schema. |
| **UI Polish**<br>(`ui-polish`) | `src/ui/*`<br>`styles/*`<br>`index.html` | 1. Thiết kế giao diện Onboarding (Age Gate 18+, Login Modal, Character Creator).<br>2. Viết logic Debounce 500ms kiểm tra trùng tên, rung lắc đỏ & gợi ý tên.<br>3. Thiết kế Viewfinder HUD máy ảnh film với thước đo, lưới bố cục tỷ lệ vàng.<br>4. Thiết kế Album Ký Ức (Scrapbook) phong cách sổ tay cổ dán tem.<br>5. Bắn và đón đúng các sự kiện theo bảng hợp đồng `GameEventBus`. | Giao diện đậm phong cách hoài niệm, không vỡ layout trên mọi kích thước màn hình, thao tác mượt mà. |
| **Họa Sĩ**<br>(`nano-banana`) | `assets/textures/*`<br>`assets/ui/*`<br>`assets/photos/*`<br>`assets/audio/*` | 1. Tạo đầy đủ textures 3D (nước Hồ Gươm, rêu Tháp Rùa, tường vôi vàng, thép Long Biên).<br>2. Tạo UI assets (Khung ngắm máy ảnh 35mm, nút shutter, tem bưu chính, vé tàu).<br>3. Tạo bộ 4 ảnh film ký ức mẫu độ phân giải tiêu chuẩn.<br>4. Cung cấp âm thanh màn trập máy ảnh, tiếng còi tàu, ambient phố Hà Nội. | Ảnh đúng định dạng, không hỏng đường dẫn (không bị 404), màu sắc đậm chất thơ và chất cổ kính Hà Nội. |

---

## 9. DANH SÁCH TÀI NGUYÊN (ASSET REQUIREMENTS)

### 9.1. Textures Môi Trường & Nội Thất 3D (`assets/textures/`)
1. `lake_water_norm.jpg`: Normal map mặt nước Hồ Gươm gợn sóng lăn tăn (512x512 Seamless).
2. `turtle_tower_moss.jpg`: Texture đá phủ rêu xanh cổ kính của Tháp Rùa và Đền Ngọc Sơn (1024x1024).
3. `old_wall_yellow.jpg`: Vôi quét tường màu vàng hoàng cúc bong tróc loang lổ (1024x1024).
4. `rusty_iron_beam.jpg`: Bề mặt dầm thép rỉ sét màu nâu cánh gián cầu Long Biên (1024x1024).
5. `hanoi_brick_ground.jpg`: Đá xanh lát vỉa hè và gạch chỉ vỉa hè phố cổ ẩm ướt (1024x1024).
6. `vintage_posters.jpg`: Bản ghép các áp phích cổ, biểu ngữ văn hóa thập niên 80-90 (1024x1024).
7. `wood_counter_varnish.jpg`: Mặt gỗ lim đánh vec-ni cánh gián bóng loáng viền đồng quầy bar cà phê (1024x1024).
8. `bat_trang_ceramic.jpg`: Men rạn gốm Bát Tràng cổ kính cắm hoa sen và bình trà (512x512).
9. `indochine_rug.jpg`: Họa tiết dệt hoa văn hình học thổ cẩm thảm trải sàn Đông Dương (1024x1024).
10. `rang_dong_thermos.jpg`: Vỏ nhôm in hoa cúc phích nước Rạng Đông và men sứ Hải Phòng (512x512).
11. `soviet_poster.jpg`: Áp phích cổ động mậu dịch thời bao cấp và bảng tem phiếu (1024x1024).
12. `bridge_ramp_stone.jpg`: Bề mặt bê tông đá dăm khía rãnh chống trượt dốc dẫn cầu Long Biên (1024x1024).

### 9.2. UI Elements & Biểu Tượng (`assets/ui/`)
1. `viewfinder_frame.png`: Khung viền quang học máy ảnh cơ 35mm kèm vạch đo sáng và thước tiêu cự (PNG trong suốt 1920x1080).
2. `shutter_button.png`: Nút chụp máy ảnh kim loại vân tròn cổ điển (PNG tròn 128x128).
3. `stamp_hanoi.png`: Con tem bưu chính xưa in hình chùa Một Cột và Tháp Rùa mép răng cưa (PNG 256x256).
4. `logo_reverie.png`: Logo chữ thư pháp hoài niệm "Hà Nội: Chạm Vào Ký Ức" viền vàng đồng (PNG 512x256).
5. `train_ticket_retro.png`: Tấm vé tàu hỏa giấy nâu mộc mạc Hà Nội - Hải Phòng xưa (PNG 400x200).

### 9.3. Bộ Ký Ức & Ảnh Film Hoàn Chỉnh (`assets/photos/`)
1. `memory_turtle_mist.jpg`: Ảnh film Tháp Rùa huyền ảo trong màn sương chớm đông, rặng liễu rủ mờ xa.
2. `memory_train_street.jpg`: Ảnh chụp đoàn tàu hỏa chạy lướt sát những mái ngói rêu phong phố Phùng Hưng.
3. `memory_long_bien.jpg`: Ảnh dầm thép cầu Long Biên nhuộm đỏ trong ánh hoàng hôn chiều muộn sông Hồng.
4. `memory_apartment.jpg`: Ảnh ban công khu tập thể cũ với lồng chuồng cọp và giàn hoa giấy rực cháy.

### 9.4. Âm Thanh Môi Trường & Hiệu Ứng (`assets/audio/`)
1. `ambient_lake.mp3`: Tiếng sóng hồ vỗ bờ đá nhẹ, gió rặng liễu, tiếng chuông chùa xa xăm.
2. `ambient_train.mp3`: Tiếng còi tàu hơi nước vang vọng trong ngõ hẹp, tiếng rít kim loại đường ray.
3. `ambient_street.mp3`: Tiếng ve râm ran trưa hè, tiếng rao hàng rong: "Ai xôi lạc bánh khúc đê...".
4. `shutter_click.mp3`: Tiếng chớp màn trập cơ học kim loại đanh thép của máy ảnh cơ.
5. `photo_develop.mp3`: Tiếng lật tráng giấy ảnh và tiếng nước chảy trong phòng tối tráng phim.
6. `gramophone_melody.mp3`: Tiếng máy hát loa kèn phát nhạc tiền chiến Hà Nội rè rè ấm áp trong quán cà phê.
7. `clock_pendulum.mp3`: Tiếng tích tắc gõ nhịp của đồng hồ quả lắc gỗ sồi.
8. `bicycle_bell.mp3`: Tiếng chuông "kính coong" vang giòn của chiếc xe đạp Thống Nhất.

---

## 10. TIÊU CHUẨN KIỂM DUYỆT CHẤT LƯỢNG (QA CHECKLIST)

Trước khi nghiệm thu dự án đạt mức độ "PASSED 100%", subagent `kiem-duyet-qa` phải kiểm tra lần lượt các tiêu chí:

- [ ] **Kiểm tra phân vùng file:** Không có file nào của `coder-chinh` bị ghi đè bởi `ui-polish` và ngược lại.
- [ ] **Khâu kiểm duyệt API:** Mọi sự kiện phát ra từ `GameEventBus` và mọi hàm trong `GameAPI` đều trùng khớp 100% từng chữ hoa chữ thường với mục 3 của tài liệu này.
- [ ] **Kiểm tra không gian nội thất tường mỏng (Thin-Wall Interior):**
  - Tường bao các công trình đạt độ dày chuẩn 0.35m, không dùng khối đặc 4.5m bịt kín.
  - Lòng nhà đạt diện tích thông thủy thực tế 11.3m x 15.3m, cao 4.2m rộng thênh thang.
  - Đầy đủ chi tiết nội thất Tiệm Cà Phê Trứng & Trà Sen (quầy bar gỗ viền đồng, 6 phin nhôm nhỏ giọt, kệ hũ trà, máy hát loa kèn gramophone, đồng hồ quả lắc, sofa, thảm Đông Dương, gốm sen, tủ sách, gác lửng, đèn rọi 2700K).
  - Đầy đủ chi tiết nội thất Cửa Hàng Bách Hóa Mậu Dịch (kệ hàng ca men, phích Rạng Đông, bánh quy Hải Châu, vải hoa, cân đĩa đồng, đài Liên Xô, quạt tai voi, xe đạp Thống Nhất, tranh cổ động).
- [ ] **Kiểm tra dốc & bậc lên Cầu Long Biên (Bridge Ramp & Stairs):**
  - Cầu Long Biên ở cao độ y = 4.2m có dốc dẫn thoải dài 25m từ x = 10 (y = 0.1m) lên x = 35 (y = 4.2m) với độ dốc ~16% bước êm ái.
  - Có cầu thang bộ gạch đá từ vỉa hè lên dầm cầu, lan can dầm thép Eiffel bảo vệ an toàn, không bị kẹt hay rơi xuống vực.
- [ ] **Kiểm tra dốc dẫn Cầu Thê Húc & Đắc Nguyệt Lâu:**
  - Hai đầu cầu nối bờ hồ và Đảo Ngọc Sơn có dốc thoải mượt mà, người chơi bước chân qua cầu và đi qua cổng Đắc Nguyệt Lâu không bị vấp ngấn.
- [ ] **Kiểm tra tài nguyên (Zero 404):** Toàn bộ file ảnh, âm thanh trong thư mục `assets/` đều tồn tại thực tế và có kích thước hợp lệ trên đĩa cứng.
- [ ] **Kiểm tra Onboarding:**
  - Nhập tuổi dưới 18 bị chặn kèm thông báo lịch sự.
  - Nhập tên trùng báo đỏ, rung lắc và hiện gợi ý; nhập tên hợp lệ sáng nút vàng đồng.
- [ ] **Kiểm tra Camera Kép:**
  - Chuyển đổi TPS sang FPS mượt mà trong 0.3s.
  - Ở FPS: ẩn đầu model nhân vật, hiện Viewfinder HUD.
- [ ] **Kiểm tra Giải đố & Chụp ảnh:**
  - Căn đúng góc nhìn xuất hiện chỉ số điểm `isAligned = true`.
  - Bấm chụp màn hình chớp sáng, âm thanh màn trập phát ra, ảnh được lưu vào Album LocalStorage.
- [ ] **Hiệu năng:** Duy trì 60 FPS ổn định trên màn hình Full HD, không rò rỉ bộ nhớ (Memory Leak) khi dạo chơi qua 4 phân khu.

---
*Tài liệu này là chuẩn mực bất biến cho toàn bộ đội ngũ kỹ thuật trong suốt quá trình triển khai dự án.*
