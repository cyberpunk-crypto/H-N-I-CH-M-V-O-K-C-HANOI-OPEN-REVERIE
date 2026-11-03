# HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
## TÀI LIỆU KIẾN TRÚC KỸ THUẬT & ĐẶC TẢ HỆ THỐNG TOÀN DIỆN (GAME SPECIFICATION)

---

> **Mã dự án:** `HANOI-OPEN-REVERIE-3D`  
> **Phiên bản tài liệu:** `4.0.0-TRUE-3D-ANATOMY-LAYERED-FASHION`  
> **Phê duyệt:** Sếp Tổng Game Studio & Hội đồng Kiến trúc sư Trưởng  
> **Ngày ban hành:** 03/11/2026  
> **Áp dụng cho 6 Bộ phận chuyên môn Studio AI:**  
> 1. `game-architect` (Kiến Trúc Sư Hệ Thống, GDD, Ranh Giới 4 Phân Khu & API Contracts)  
> 2. `nano-banana` (Lead 2D/3D Asset Artist, Textures PBR, Nhân Vật Việt Nam Độc Bản & Audio)  
> 3. `coder-chinh` (Core Logic 3D Engine, GTA V Locomotion Physics, Camera & Va Chạm Tháp Rùa/Cầu Kim Quy)  
> 4. `animation-master` (Hoạt Họa 3D Skeletal 60 FPS trong `animations.js`, Nón Lá Lag Damping & VFX)  
> 5. `ui-polish` (Giao Diện Người Dùng, Onboarding, Viewfinder HUD, Modals & Styling)  
> 6. `kiem-duyet-qa` (Trưởng Ban Kiểm Định Chất Lượng, Audit 4 Tầng & Săn Lỗi Chí Mạng).

---

## 1. TỔNG QUAN DỰ ÁN & TẦM NHÌN KỸ THUẬT

### 1.1. Tầm nhìn nghệ thuật và trải nghiệm
**HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)** là tựa game thế giới mở 3D không gian hoài niệm Hà Nội (Thập niên 80-90 giao thoa đương đại) vận hành mượt mà trên trình duyệt Web (WebGL / WebGL2). 

Người chơi hóa thân thành một "Kẻ Mộng Mơ" dạo bước qua 4 phân khu đặc trưng của thủ đô (Hồ Gươm & Tháp Rùa, Mê cung Phố Cổ & Cà phê Đường Tàu, Nhịp Cầu Long Biên dầm thép Eiffel, Khu Tập Thể Cũ chuồng cọp hoàng hôn), trải nghiệm cơ chế điều khiển di chuyển nhân vật chân thực chuẩn mực AAA (GTA V Locomotion Physics), sử dụng chiếc máy ảnh cơ film 35mm để căn góc nhìn giải mã những "Giao điểm thị giác" (Perspective Alignment) ẩn giấu trong kiến trúc, hồi sinh những lát cắt ký ức ngưng đọng của thời gian.

### 1.2. Tech Stack & Nền tảng
- **Engine 3D Core:** `Three.js` (r160+) chạy trực tiếp trên WebGL / WebGL2 context.
- **Hệ thống điều khiển nhân vật:** GTA V-style Locomotion Physics với Quaternion Slerp turning, **sửa triệt để lỗi đi ngược (Moonwalking) bằng chuẩn góc vector tự nhiên `targetAngle = Math.atan2(finalDir.x, finalDir.z)` (loại bỏ hoàn toàn góc bù trừ dư thừa `+ Math.PI`)**, đồng bộ forward vector nhân vật theo trục chuẩn Three.js, quán tính khối lượng (Inertia Acceleration & Braking), cơ chế khử nổi chân (Foot Ground Snapping) và **Va chạm ngang Capsule Horizontal Collision chống xuyên thủng lan can cầu**.
- **Vị trí xuất phát & Camera khởi đầu:** Xuất phát tại tọa độ vàng `(16.5, 0.5, -16.5)` ven bờ Hồ Gươm, góc quay camera mở màn `yaw = 0.785 rad` (45 độ) hướng thẳng dọc tim Cầu Thê Húc.
- **Mô hình nhân vật:** Chuẩn mực điêu khắc giải phẫu người thật Á Đông kết hợp **Hệ thống trang phục hình khối 3D độc lập đa lớp (Separate 3D Geometric Meshes)** có độ dày (thickness), đường may, nếp gấp, bao bọc bên ngoài cơ thể da thịt. **NGHIÊM CẤM 100% VIỆC DÁN HÌNH 2D / PHOTO DECAL ĐÈ LÊN MÔ HÌNH ĐỂ LÀM TRANG PHỤC!**
- **Hoạt họa (Animation):** Hệ thống Skeletal MoCap AnimationMixer kết hợp Procedural Kinematics 60 FPS trong `src/core/animations.js`, thực hiện Cross-fade Blending mượt mà giữa Idle (thở tự nhiên, chuyển trọng tâm), Walk (sải bước cắm gót nhấc mũi, vung tay ngược pha), Run (sprint lean 10-12 độ, vung tay góc 90 độ), và độ trễ quán tính Nón Lá (Lag Damping Spring-Damper).
- **Kiến trúc mã nguồn:** Vanilla JavaScript (ES6+ ES Modules), mô hình phân rã Decoupled Architecture hướng sự kiện (`EventBus`), không phụ thuộc build tooling nặng nề.
- **Audio Engine:** `Web Audio API` với bộ giải mã âm thanh không gian (Spatial Audio Listener / PannerNode) tạo không khí Hà Nội 3D sống động (tiếng ve sầu, còi tàu, tiếng rao đêm, tiếng máy hát loa kèn cổ).
- **Lưu trữ dữ liệu:** `LocalStorage` kết hợp `IndexedDB` cục bộ cho việc lưu trữ hồ sơ nhân vật, thiết lập, và album ảnh film độ phân giải cao (`data:image/webp` base64).
- **Giao diện & Mỹ thuật:** HTML5 Canvas Overlay, CSS3 biến đổi không gian (3D Transforms, Backdrop Blur, Vintage Film Grain Post-processing, CSS Grid).

---

## 2. KIẾN TRÚC HỆ THỐNG & TÁCH BIỆT VÙNG LÀM VIỆC (STRICT BOUNDARIES)

> **KHÂU KIỂM DUYỆT 1 - TIÊU CHÍ (1): TÁCH BIỆT RÕ RÀNG GIỮA CORE CODE VÀ UI CODE**  
> Để đảm bảo 4 bộ phận (`coder-chinh`, `ui-polish`, `animation-master`, `nano-banana`) sản xuất song song 100% không xung đột mã nguồn (zero merge conflicts), hệ sinh thái thư mục được phân định ranh giới nghiêm ngặt như sau:

```
d:/HÀ NỘI CHẠM VÀO KÝ ỨC ,HANOI OPEN REVERIE/
├── index.html                     # Điểm vào ứng dụng (Shell, nạp modules)
├── package.json                   # Cấu hình dự án & scripts test
├── GAME_SPEC.md                   # Bản đặc tả kỹ thuật này (Chuẩn mực tối cao)
├── REVIEW_LOG.md                  # Nhật ký kiểm duyệt chất lượng QA
│
├── assets/                        # [VÙNG CỦA HỌA SĨ nano-banana]
│   ├── models/                    # Mô hình 3D nhân vật GLTF/GLB (Michelle.glb, Soldier.glb, Xbot.glb)
│   ├── textures/                  # Textures 3D PBR/Albedo/Normal/Roughness
│   │   ├── lake_water_norm.jpg    # Sóng nước Hồ Gươm
│   │   ├── turtle_tower_moss.jpg  # Rêu phong Tháp Rùa
│   │   ├── old_wall_yellow.jpg    # Vôi vàng nứt nẻ
│   │   ├── rusty_iron_beam.jpg    # Thép dầm cầu Long Biên rỉ
│   │   ├── hanoi_brick_ground.jpg # Gạch ngói & đá lát vỉa hè
│   │   ├── vintage_posters.jpg    # Áp phích cổ, biển hiệu vẽ tay
│   │   ├── wood_counter_varnish.jpg
│   │   ├── bridge_ramp_stone.jpg
│   │   └── bougainvillea_blossom.png
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
│   │   ├── GameEvents.js          # Hệ thống EventBus tập trung (window.GameEventBus)
│   │   └── GameAPI.js             # Window Contract APIs cho UI tương tác với 3D (window.GameAPI)
│   │
│   ├── core/                      # [VÙNG CỦA coder-chinh & animation-master]
│   │   ├── GameEngine.js          # Khởi tạo WebGL, vòng lặp GameLoop, render pass
│   │   ├── SceneManager.js        # Quản lý cảnh 3D, ánh sáng, sương mù (Fog)
│   │   ├── WorldManager.js        # Bản đồ 500m x 500m, Collision AABB, BẢO TOÀN 100% 9 NPC LỊCH SỬ
│   │   ├── ZoneManager.js         # Quản lý 4 phân khu (Hồ Gươm, Phố Cổ, Cầu, Nhà Tập Thể)
│   │   ├── PlayerController.js    # [coder-chinh] GTA V Locomotion Physics: atan2(x,z) Không Math.PI, Capsule Clamping
│   │   ├── CharacterFactory.js    # [coder-chinh] True 3D Humanoid Mesh, Da Thịt Á Đông & Trang Phục Lớp Khối 3D
│   │   ├── animations.js          # [animation-master] 3D Skeletal Animation System & MoCap Mixer 60 FPS
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
│       ├── CharacterCreation.js   # Tạo nhân vật & chọn 4 nhân vật 3D, Debounce 0.5s check tên
│       ├── ViewfinderHUD.js       # Khung ngắm máy ảnh, thước đo tiêu cự, lưới bố cục
│       ├── ScrapbookModal.js      # Cuốn Album Ký Ức lật trang, tem dán, tản văn
│       ├── MinimapModal.js        # Bản đồ toàn cảnh & điểm dịch chuyển 4 phân khu
│       ├── DialogueModal.js       # Hộp thoại tương tác với 9 NPC người Hà Nội
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

## 3. ĐẶC TẢ GIAO DIỆN LẬP TRÌNH VÀ TẬP HÀM GIAO TIẾP (API & EVENT SPECIFICATION)

> **KHÂU KIỂM DUYỆT 1 - TIÊU CHÍ (2): ĐỊNH NGHĨA RÕ RÀNG TỪNG CHỮ CÁC HÀM GIAO TIẾP (API/EVENTS)**  
> Dưới đây là danh sách đầy đủ, chính xác từng ký tự tên hàm, tham số, kiểu dữ liệu, chiều truyền dữ liệu giữa `coder-chinh`, `animation-master` và `ui-polish`. Tuyệt đối không tự ý đổi tên để đảm bảo ghép nối hoàn hảo 100%.

### 3.1. Đối tượng toàn cục EventBus: `window.GameEventBus`
Được định nghĩa tại [src/bridge/GameEvents.js](file:///d:/H%C3%80%20N%E1%BB%98I%20CH%E1%BA%A0M%20V%C3%80O%20K%C3%9D%20%E1%BB%A8C%20,HANOI%20OPEN%20REVERIE/src/bridge/GameEvents.js).  
Phương thức chuẩn:
- `window.GameEventBus.on(eventName, callback)`: Đăng ký lắng nghe sự kiện. Trả về hàm hủy đăng ký `() => void`.
- `window.GameEventBus.off(eventName, callback)`: Hủy đăng ký lắng nghe sự kiện.
- `window.GameEventBus.emit(eventName, payload)`: Bắn sự kiện kèm dữ liệu payload sang các module khác.

---

### 3.2. Bảng Sự Kiện từ UI gửi sang Core (`UI -> CORE`)

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

### 3.3. Bảng Sự Kiện từ Core gửi sang UI (`CORE -> UI`)

| Tên Sự Kiện (`eventName`) | Kiểu Dữ Liệu (`payload`) | Bộ Phận Bắn | Bộ Phận Nhận | Ý Nghĩa Kỹ Thuật |
| :--- | :--- | :--- | :--- | :--- |
| `CORE:WORLD_LOAD_PROGRESS` | `{ progress: number, currentAsset: string }` | `coder-chinh` | `ui-polish` | Cập nhật tiến độ tải 3D World (0 - 100%) lên thanh loading retro. |
| `CORE:WORLD_READY` | `{ spawnZone: string, playerPosition: { x: number, y: number, z: number } }` | `coder-chinh` | `ui-polish` | Thế giới 3D đã sẵn sàng, yêu cầu UI ẩn màn hình chờ và hiện HUD chính. |
| `CORE:CAMERA_MODE_CHANGED` | `{ mode: 'TPS' \| 'FPS', fov: number }` | `coder-chinh` | `ui-polish` | Core thông báo đã chuyển xong chế độ camera (FPS bật Viewfinder HUD & ẩn đầu/mũ nhân vật; TPS tắt HUD & hiện lại nhân vật). |
| `CORE:PUZZLE_DETECTED` | `{ puzzleId: string, puzzleName: string, alignmentScore: number, isAligned: boolean }` | `coder-chinh` | `ui-polish` | Người chơi đang nhìn vào vị trí câu đố; `alignmentScore` (0.0 - 1.0) để UI vẽ thước ngắm đổi màu. |
| `CORE:PUZZLE_SOLVED` | `{ puzzleId: string, title: string, quote: string, unlockedShortcut: string, photoUrl: string }` | `coder-chinh` | `ui-polish` | Căn góc thành công! UI mở hiệu ứng chớp sáng, vinh danh ký ức và trao huy hiệu. |
| `CORE:PHOTO_CAPTURED` | `{ photoId: string, dataUrl: string, zoneId: string, timestamp: number, isPuzzle: boolean, poemQuote: string }` | `coder-chinh` | `ui-polish` | Ảnh vừa chụp được render xong, gửi dataUrl sang UI để hiển thị thumbnail và cất vào Album. |
| `CORE:ZONE_ENTERED` | `{ zoneId: string, zoneName: string, description: string, ambientTrack: string }` | `coder-chinh` | `ui-polish` | Người chơi bước vào ranh giới phân khu mới, UI hiện Toast thông báo tên phố. |
| `CORE:INTERACTION_AVAILABLE` | `{ canInteract: boolean, promptText: string, actionKey: string }` | `coder-chinh` | `ui-polish` | Gần ghế đá, hàng nước chè, NPC, bảng tin: UI hiện phím gợi ý (ví dụ: "[E] Uống trà đá vỉa hè"). |
| `UI:OPEN_DIALOGUE` | `{ name: string, role: string, avatar: string, greeting: string, monumentTitle: string, historyText: string, dialogueOptions: Array, shopItems: Array }` | `coder-chinh` | `ui-polish` | Khi người chơi bấm E tương tác với NPC, mở modal đối thoại và tìm hiểu lịch sử danh thắng. |
| `CORE:SWITCH_CHARACTER` | `{ characterId: string }` | `ui-polish` | `coder-chinh` | Yêu cầu thay đổi mô hình nhân vật người chơi trong thế giới 3D. |

---

### 3.4. Bảng Hợp Đồng API Trực Tiếp Toàn Cục (`window.GameAPI`)
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

### 3.5. Đặc Tả API Kết Nối Nội Bộ Giữa Các Module Core (`CharacterFactory` <-> `PlayerController` <-> `animations.js`)

Để đảm bảo `coder-chinh` và `animation-master` phối hợp nhịp nhàng, hợp đồng gọi hàm nội bộ được quy định bất biến như sau:

#### 1. Hợp đồng `CharacterFactory.js`:
- `createHanoiCharacter3D(characterId, options = {})`:
  * Trả về: `THREE.Group` (`characterGroup`), chứa:
    - `characterGroup.rig`: Ánh xạ 17 khớp xương chuẩn giải phẫu (`pelvisGroup`, `torsoGroup`, `chestGroup`, `neckGroup`, `headGroup`, `accessoryHeadGroup`, `leftShoulderGroup`, `rightShoulderGroup`, `leftUpperArm`, `rightUpperArm`, `leftElbowGroup`, `rightElbowGroup`, `leftLowerArm`, `rightLowerArm`, `leftHandGroup`, `rightHandGroup`, `leftHipGroup`, `rightHipGroup`, `leftUpperLeg`, `rightUpperLeg`, `leftKneeGroup`, `rightKneeGroup`, `leftLowerLeg`, `rightLowerLeg`, `leftFootGroup`, `rightFootGroup`, `frontFlapGroup`, `backFlapGroup`).
    - `characterGroup.characterMeta`: Metadata độc bản của nhân vật (tên, vai trò, kích thước tỷ lệ).
    - `characterGroup.baseTorsoY`: Cao độ gốc khung chậu (`= 0.95m`).
    - `characterGroup.isSkinnedMesh`: Boolean (`false` cho Procedural 3D Rigged Mesh, `true` cho GLTF/GLB SkinnedMesh).
- `loadSkinnedMeshCharacter(gltfUrl, options = {})`:
  * Nạp file GLTF/GLB SkinnedMesh (Michelle.glb, Soldier.glb, Xbot.glb), tối ưu bones hierarchy và trả về chuẩn tương thích `characterGroup`.

#### 2. Hợp đồng `PlayerController.js`:
- `setCharacter(characterId)`: Hoán đổi nhân vật, dọn dẹp bộ nhớ cũ (`dispose`), khởi tạo `HumanoidAnimator` mới.
- `update(delta, camera)`:
  1. Đọc WASD và tính vector hướng di chuyển phẳng theo góc quay camera (`camForward`, `camRight`).
  2. Áp dụng gia tốc GTA V (Acceleration `accel = 18.0` khi di chuyển, Braking `brake = 22.0` khi nhả phím).
  3. **Xoay hướng mặt nhân vật bằng Quaternion Slerp với chuẩn góc tự nhiên: `targetAngle = Math.atan2(finalDir.x, finalDir.z)` (SỬA TRIỆT ĐỂ LỖI MOONWALKING, XÓA BỎ HOÀN TOÀN `+ Math.PI`).**
  4. **Kiểm tra va chạm ngang (Capsule Horizontal Collision) chống xuyên thủng lan can cầu Kim Quy / Cầu Thê Húc.**
  5. Bắn raycast 4.0m kiểm tra độ cao mặt đất (`groundHits`) và căn chỉnh khử nổi chân (Step-Up Ground Snapping).
  6. Gọi `this.humanoidAnimator.update(delta, moveSpeed, this.isGrounded, groundSlopeAngle)`.

#### 3. Hợp đồng `animations.js` (`HumanoidAnimator`):
- `constructor(characterGroup, options = {})`: Gắn kết rig hoặc AnimationMixer.
- `update(delta, speed, isGrounded, groundSlopeAngle = 0)`: Cập nhật hoạt ảnh 60 FPS từng frame, tự động nội suy Cross-fade Blending giữa các trạng thái.
- `setLocomotionState(stateName, speed)`: Đặt trạng thái chủ động (`'idle' | 'walk' | 'run' | 'jump'`).
- `playGesture(gestureName)`: Kích hoạt cử chỉ đặc biệt (`'wave' | 'bow' | 'takePhoto'`).
- `resetPose()`: Trả khung xương về tư thế cân bằng tiêu chuẩn.

---

## 4. TÁI TẠO DA THỊT NGƯỜI THẬT Á ĐÔNG (SKIN & FLESH ANATOMY RECONSTRUCTION)

> **CHỈ LỆNH NGHIÊM NGẶT SỐ 2 CỦA SẾP TỔNG:**  
> *"Tái tạo cơ thể da thịt người thật Á Đông chuẩn mực nhân trắc học: Màu da ấm sáng, vật liệu PBR Skin có tán xạ dưới bề mặt (SSS giả lập), ngũ quan 3D sắc sảo Á Đông, và bàn tay 5 ngón thon dài búp măng có thể tích thịt, cử động tự nhiên."*

```
       CẤU TRÚC GIẢI PHẪU DA THỊT NGƯỜI THẬT Á ĐÔNG (SKIN & FLESH MESH):
           [Mái tóc 3D suôn dài / Búi trâm / Khăn xếp Thăng Long]
                              |
           [Đầu & Khuôn mặt 3D: Cằm V-line, Gò má nở nhẹ]
               ├── Mắt bồ câu 3D (Đen láy, Specular Cornea)
               ├── Sống mũi dọc dừa 3D (Dày thịt, thon cao)
               ├── Bờ môi cong hồng hào 3D (Môi trên tim, môi dưới đầy)
               └── Đôi tai 3D giải phẫu (Vành tai uốn cong, hoa tai ngọc trai)
                              |
           [Cổ 3D da thịt: Cylinder mềm mại nối Ngực & Thân trên]
                              |
           [Bàn tay 5 ngón búp măng 3D: Thể tích thịt, khớp co duỗi]
               ├── Ngón cái đối xứng góc 42 độ
               └── 4 ngón thon dài: Trỏ, Giữa, Áp út, Út
```

### 4.1. Bảng Thông Số Màu Da & Vật Liệu PBR Skin Á Đông
Hệ thống vật liệu da thịt được thiết kế chuẩn xác theo nghiên cứu nhân trắc học người Việt Nam:

| Phân Loại Nhân Vật | Mã Màu Hex Da Thịt | MeshStandardMaterial Properties | Giả Lập Subsurface Scattering (SSS) |
| :--- | :--- | :--- | :--- |
| **Nữ Sinh / Cô Gái** | `#E8BEAC` (Tone da ấm sáng, trắng hồng hào thanh khiết) | `color: 0xE8BEAC`<br>`roughness: 0.46`<br>`metalness: 0.00` | Tán xạ viền đỏ cam ấm (Subsurface Rim Scattering: `0xF09A82`, sheen: 0.25) giúp da có độ trong trẻo và ấm áp dưới ánh nắng sớm ven hồ. |
| **Nam Trí Thức / Thăng Long** | `#DEB096` (Tone da bánh mật ấm áp, khỏe khoắn, đĩnh đạc) | `color: 0xDEB096`<br>`roughness: 0.48`<br>`metalness: 0.00` | Tán xạ ấm hổ phách (`0xD98E6E`, sheen: 0.15) tạo độ sâu khối cơ mặt và bờ vai nam tính. |

### 4.2. Ngũ Quan 3D Hình Khối Giải Phẫu Người Thật (True 3D Facial Anatomy)
Tuyệt đối không dùng hình phẳng 2D để vẽ mặt! Toàn bộ ngũ quan được đắp bằng các hình khối 3D đa giác mịn:
1. **Mắt bồ câu đen long lanh:**
   - Cặp mắt hình quả hạnh đặc trưng Á Đông.
   - Nhãn cầu lồi 3D kết hợp tròng đen tuyền (`color: 0x111111`) và lớp giác mạc trong suốt phản chiếu ánh sáng điểm (Specular Highlight) tạo đôi mắt có hồn, biết nói.
   - Hàng mi cong nhẹ đắp nổi 3D thanh mảnh.
2. **Sống mũi dọc dừa:**
   - Dựng khối 3D thon dài từ gốc mũi (khoảng giữa hai mắt) chạy thẳng xuống đầu mũi tròn kín đáo, cánh mũi gọn ghẽ cân đối.
3. **Bờ môi cong hồng hào chúm chím:**
   - Môi trên hình cung vát tim rõ nét, môi dưới căng mọng có thể tích thịt (`color: 0xD8707E` cho nữ, `color: 0xC4736C` cho nam), khóe môi hơi hé cười nhẹ nhàng hoài niệm.
4. **Đôi tai 3D & Hoa tai ngọc trai:**
   - Hai bên thái dương có đôi tai 3D với vành tai bo cong, gờ đối vành và dái tai tròn đầy.
   - Nhân vật nữ sinh có thêm viên **Hoa tai hạt ngọc trai 3D** (`SphereGeometry(0.0035, 12, 12)`, xà cừ óng ánh `color: 0xFFFAF0`, roughness 0.2) đung đưa nhẹ theo nhịp bước.
5. **Mái tóc 3D suôn dài mượt mà:**
   - Đắp bằng các dải tóc hình học mềm mại (`CatmullRomCurve3` kết hợp `TubeGeometry` dẹt), uốn lượn ôm sát đỉnh đầu, buông xõa dài qua vai đến tận thắt lưng đối với Nữ sinh Áo dài.

### 4.3. Bàn Tay 5 Ngón Thon Dài Búp Măng (5-Finger Volumetric Hands)
- Khối lòng bàn tay dẹt tự nhiên theo tỷ lệ bàn tay người Việt.
- Tách rời hoàn chỉnh 5 ngón tay độc lập có thể tích thịt đẫy đà:
  * Ngón cái: Xoay hướng ra ngoài góc 42 độ, có khớp gốc đối diện.
  * 4 ngón tay (Trỏ, Giữa, Áp út, Út): Có chiều dài phân cấp chuẩn (`0.030m`, `0.034m`, `0.032m`, `0.026m`), đầu ngón thon búp măng, khẽ khum cong tự nhiên khi ở trạng thái nghỉ, sẵn sàng cầm máy ảnh hoặc buông lơi thướt tha.

---

## 5. HỆ THỐNG TRANG PHỤC HÌNH KHỐI 3D ĐỘC LẬP ĐA LỚP (LAYERED 3D GEOMETRIC COSTUME SYSTEM)

> **CHỈ LỆNH NGHIÊM NGẶT SỐ 1 CỦA SẾP TỔNG:**  
> *"NGHIÊM CẤM 100% VIỆC DÁN HÌNH 2D / PHOTO DECAL ĐÈ LÊN MÔ HÌNH ĐỂ LÀM TRANG PHỤC.  
> Trang phục PHẢI là hệ thống lớp hình khối 3D độc lập (Separate 3D Geometric Meshes) có độ dày (thickness), đường may, nếp gấp, bao bọc bên ngoài cơ thể da thịt."*

```
     HỆ THỐNG PHÂN LỚP ĐA TẦNG 3D (3D LAYERED GEOMETRIC ARCHITECTURE):
     ┌─────────────────────────────────────────────────────────────┐
     │ LỚP 3: PHỤ KIỆN 3D (Nón lá nan tre, Khăn rằn, Khăn xếp)     │
     ├─────────────────────────────────────────────────────────────┤
     │ LỚP 2: TRANG PHỤC NGOÀI 3D (Cổ trụ 3D, Thân áo xẻ tà,     │
     │        Ống tay áo 3D, Hai tà áo dài 3D đa giác mềm)         │
     ├─────────────────────────────────────────────────────────────┤
     │ LỚP 1: QUẦN LỤA ỐNG RỘNG 3D / QUẦN ÂU CÓ LY 3D (Bọc chân)  │
     ├─────────────────────────────────────────────────────────────┤
     │ LỚP 0: CƠ THỂ DA THỊT NGƯỜI THẬT 3D (Skin & Flesh Anatomy)  │
     └─────────────────────────────────────────────────────────────┘
```

### 5.1. Nguyên Lý Thiết Kế Lớp Khối 3D Độc Lập (Separate Geometric Meshes)
- Toàn bộ trang phục là các Mesh riêng biệt, có bán kính lớn hơn cơ thể da thịt từ `2mm` đến `6mm` (`radial offset = 0.002m - 0.006m`), ngăn chặn hoàn toàn hiện tượng nhấp nháy tranh chấp chiều sâu (Z-Fighting).
- Các cạnh mép của vải (cổ áo, vạt áo, gấu quần) được tạo đường gờ may se viền 3D (`Edge Bevel / Seam Beading Geometry`), thể hiện độ dày của chất liệu vải lụa tơ tằm, dạ nỉ hoặc gấm.

### 5.2. Các Thành Phần Trang Phục Điêu Khắc 3D Bắt Buộc

#### 1. Cổ Áo Trụ 3D (Mandarin Collar Geometry):
- Kết cấu `CylinderGeometry` độc lập có thành vải dày `2mm` (`thickness = 0.002m`), chiều cao chuẩn `3cm` (`height = 0.03m`).
- Ôm khít quanh cổ da thịt, phía trước xẻ nhẹ chữ V truyền thống hoặc cài khuy bấm lệch sang bên phải.

#### 2. Thân Áo 3D Xẻ Tà Hai Bên Hông & Ống Tay Áo 3D:
- **Thân áo ngoài 3D:** Khối đa giác độc lập bao bọc quanh thân ngực và eo, ôm sát đường cong cơ thể. Tại vị trí eo hông (`y = baseTorsoY`), thân áo xẻ tà sâu lên đến thắt lưng, để lộ rõ lớp quần lụa trắng/đen bên trong.
- **Ống tay áo 3D:** Khối ống lăng trụ tròn bọc ngoài bắp tay và cẳng tay (`radial clearance = 0.003m`), cổ tay áo may ôm gọn cổ tay, chừa lại bàn tay da thịt thon dài.

#### 3. Quần Lụa Ống Rộng 3D & Quần Âu Ống Đứng Có Ly 3D:
- **Quần lụa ống rộng 3D (Áo dài & Áo bà ba):** Khối ống rộng bay bổng (`botRadius = 0.085m`), rủ thẳng từ hông xuống che phủ mu bàn chân, các nếp gấp lụa uốn lượn mềm mại theo từng sải chân.
- **Quần âu ống đứng có ly 3D (Bộ Suit):** Quần âu dạ nỉ đứng dáng, dọc ống chân có gờ nếp ly quần 3D sắc nét (`Sharp Trouser Crease`), gấu quần chấm mu giày da Oxford.

#### 4. Hai Tà Áo Dài 3D Đa Giác Mềm Có Thể Tích (Volumetric Soft Cloth Flaps):
- Tuyệt đối không dùng 1 tấm mặt phẳng phẳng lì (Zero-thickness Plane).
- Hai tà áo được tạo hình bằng lưới đa giác mềm 2 mặt có độ dày thể tích (`Extruded / Multi-segment Geometry with Thickness 1.8mm`).
- **Tà trước:** Rủ dài qua đầu gối, rộng dần về phía dưới, đung đưa mềm mại theo nhịp chuyển động của đùi và hông.
- **Tà sau:** Rủ chấm bắp chân, lượn sóng tự nhiên theo gió hồ Gươm và quán tính bước đi.

#### 5. Khuy Cúc Hạt Ngọc 3D, Khăn Xếp, Khăn Rằn, Nón Lá:
- **Khuy cúc hạt ngọc 3D:** Hàng hạt ngọc trai hoặc ngọc bích hình cầu nổi 3D đính dọc theo đường xẻ chéo vai ngực.
- **Khăn xếp Thăng Long 5 tầng nếp 3D:** Được dựng bằng 5 tầng hình xuyến (`TorusGeometry`) xếp chồng nếp so le tinh xảo, thể hiện rõ từng nếp vải gấm quấn đầu trang trọng của quý ông Hà thành.
- **Khăn rằn 3D quấn cổ:** Dải khăn caro dệt hình ống uốn lượn quanh cổ (`TubeGeometry` đường kính 1.5cm) và rủ hai vạt dài trước ngực.
- **Nón lá 3D nan tre vàng óng:** Chóp nón hình nón cong mềm mại, viền nan tre bo tròn quanh vành nón, quai nón lụa mềm buông dưới cằm.

---

## 6. CHI TIẾT MAY ĐO & ĐIÊU KHẮC TÁCH BIỆT 4 NHÂN VẬT VIỆT NAM ĐỘC BẢN

```
                4 NHÂN VẬT 3D VIỆT NAM ĐỘC BẢN HOÀN TOÀN:
   [char_nu_sinh_ao_dai]       [char_co_gai_ao_ba_ba]
    • Nữ sinh Tràng An          • Cô gái Phố thị
    • Da sáng ấm (#E8BEAC)      • Da sáng ấm (#E8BEAC)
    • Áo dài lụa trắng 3D       • Áo bà ba hồng sen 3D
    • Quần lụa trắng suông 3D   • Quần lụa đen bóng 3D
    • Nón lá lụa hồng + Hoa tai • Khăn rằn 3D + Nón lá sau lưng
   -----------------------------------------------------------
   [char_nam_tri_thuc_suit]    [char_nam_ao_dai_gam]
    • Nam trí thức Hà Nội       • Chàng trai Thăng Long
    • Da ấm bánh mật (#DEB096)  • Da ấm bánh mật (#DEB096)
    • Suit xám than 3D          • Áo dài gấm xanh hoàng gia 3D
    • Quần âu ống đứng có ly 3D • Ngũ thân khuy ngọc bích 3D
    • Kính mắt + Giày Oxford 3D • Khăn xếp 5 tầng nếp 3D
```

### 6.1. `char_nu_sinh_ao_dai`: Nữ Sinh Tràng An • Áo Dài Trắng Nón Lá
- **Nhân trắc học & Da thịt:** Nữ thanh mảnh, e ấp (chiều cao `1.68m`, vòng eo thon `0.16m`), màu da ấm sáng `#E8BEAC`, PBR roughness 0.46, hoa tai ngọc trai 3D lấp lánh, mái tóc 3D suôn dài qua lưng.
- **Lớp áo dài trắng 3D:** Lụa tơ tằm trắng ngà (`color: 0xFCFDFD, roughness: 0.32, sheen: 0.8`), cổ trụ 3D cao 3cm dày 2mm, hàng 4 khuy cúc ngọc trai đính chéo ngực.
- **Hai tà áo dài 3D:** Tà trước dài `0.74m`, tà sau dài `0.74m`, có thể tích, đung đưa theo bước chân và gió hồ.
- **Lớp quần lụa trắng 3D:** Ống suông rộng màu trắng ngà (`color: 0xF2F2F7`), che phủ nhẹ lên cổ guốc mộc nâu trầm.
- **Nón lá bài thơ 3D:** Chóp nón nan tre vàng óng, quai nón lụa hồng cánh sen buông nhẹ dưới cằm, trang bị cơ chế lò xo quán tính Lag Damping khi xoay người.

### 6.2. `char_co_gai_ao_ba_ba`: Cô Gái Phố Thị • Áo Bà Ba Hồng Sen Khăn Rằn
- **Nhân trắc học & Da thịt:** Nữ đôn hậu, tháo vát (chiều cao `1.65m`, vai ngang vừa vặn `0.38m`), màu da ấm sáng `#E8BEAC`, búi tóc trâm cài gáy nền nã, bàn tay búp măng nhanh nhẹn.
- **Lớp áo bà ba hồng sen 3D:** Vải đũi tơ tằm hồng sen ngọt ngào (`color: 0xDF648A, roughness: 0.58`), cổ tròn xẻ ngực, hàng 5 cúc áo đen tuyền, vạt xẻ hông hai bên.
- **Khăn rằn caro 3D:** Dệt thủ công hình khối 3D uốn cong quấn quanh cổ và rủ 2 dải trước ngực.
- **Lớp quần lụa đen 3D:** Quần lụa đen bóng mờ (`color: 0x181818, roughness: 0.50`), ống rộng tạo dáng bước chân nhẹ nhàng.
- **Nón lá sau lưng 3D:** Đeo thanh thoát sau lưng bằng quai lụa đen vắt chéo qua vai.

### 6.3. `char_nam_tri_thuc_suit`: Nam Trí Thức Hà Nội • Âu Phục Suit Lịch Lãm
- **Nhân trắc học & Da thịt:** Nam cao ráo, vai rộng đĩnh đạc (chiều cao `1.78m`, bờ vai `0.44m`), màu da ấm khỏe `#DEB096`, bàn tay nam tính khớp ngón thon dài, kính mắt trí thức gọng kim loại 3D.
- **Lớp Suit Jacket 3D:** Vải dạ nỉ xám than tweed cao cấp (`color: 0x4A5568, roughness: 0.52`), ve áo Notch Lapel chữ V dựng nổi 3D, áo sơ mi trắng cắm thùng và cà vạt đỏ mận vintage 3D.
- **Lớp Quần âu 3D:** Quần tây ống đứng có nếp ly dập nổi 3D thẳng thớm, phủ chấm mu giày da.
- **Giày da Oxford 3D:** Da bò đen bóng lộn (`color: 0x111111, roughness: 0.22, metalness: 0.28`).

### 6.4. `char_nam_ao_dai_gam`: Chàng Trai Thăng Long • Áo Dài Gấm Xanh Hoàng Gia
- **Nhân trắc học & Da thịt:** Nam thư sinh nho nhã cốt cách Thăng Long (chiều cao `1.76m`), màu da ấm `#DEB096`, phong thái đĩnh đạc từ tốn.
- **Lớp Áo dài gấm ngũ thân 3D:** Gấm dệt hoa văn cổ ngũ thân xanh hoàng gia (`color: 0x16213E, roughness: 0.32, metalness: 0.28`), ánh kim vàng dệt gấm óng ả, cổ đứng cao 3cm truyền thống, 5 khuy cúc ngọc bích xanh ngọc (`color: 0x2E8B57`) sang trọng.
- **Hai tà áo nam 3D:** Dáng đứng uy nghiêm dài qua gối (`0.78m`), có thể tích dày dặn buông thẳng.
- **Lớp Quần âu trắng 3D:** Ống đứng màu trắng ngà (`color: 0xF5F5F0`), giày vải truyền thống đen thêu.
- **Khăn xếp Thăng Long 5 tầng nếp 3D:** Dựng bằng 5 tầng hình xuyến nếp vải gấm quấn đầu trang nghiêm.

---

## 7. SỬA TRIỆT ĐỂ LỖI ĐI NGƯỢC (MOONWALKING FIX) & HỆ THỐNG DI CHUYỂN GTA V

> **CHỈ LỆNH NGHIÊM NGẶT SỐ 3 CỦA SẾP TỔNG:**  
> *"SỬA TRIỆT ĐỂ LỖI ĐI NGƯỢC (MOONWALKING):  
> - Xóa bỏ `+ Math.PI` tại `PlayerController.js:982`, sửa thành `targetAngle = Math.atan2(finalDir.x, finalDir.z)`.  
> - Đồng bộ forward vector và cập nhật điều kiện kiểm thử trong `tests/test_3d_humanoid_system.mjs:458`."*

### 7.1. Bản Chất Hình Học & Công Thức Chuẩn Hóa Vector Di Chuyển
Trong không gian tọa độ thế giới của Three.js:
- Trục tọa độ chuẩn: Khi camera nhìn theo vector hướng đi `(finalDir.x, finalDir.z)`, góc quay xoay quanh trục Y của nhân vật để mặt hướng về phía trước được xác định trực tiếp bởi hàm lượng giác `Math.atan2(finalDir.x, finalDir.z)`.
- Việc cộng thêm góc bù trừ `+ Math.PI` trước đây là nguyên nhân khiến mô hình bị quay ngược 180 độ (lưng hướng về phía trước khi bấm phím `W`, tạo ra hiện tượng Moonwalking).
- **Quy tắc toán học bất biến tại `src/core/PlayerController.js` (dòng 982):**

```javascript
// Smooth Turn Slerp: Xoay hướng mặt nhân vật mượt mà theo góc cua di chuyển
// SỬA TRIỆT ĐỂ LỖI ĐI NGƯỢC (MOONWALKING): Sử dụng trực tiếp góc vector tự nhiên
const targetAngle = Math.atan2(finalDir.x, finalDir.z);

this._targetQuat.setFromAxisAngle(this._worldUp, targetAngle);
const turnRate = this.keys.sprint ? 13.0 : 11.0;
this.characterGroup.quaternion.slerp(this._targetQuat, Math.min(1.0, turnRate * delta));
this.characterGroup.rotation.setFromQuaternion(this.characterGroup.quaternion, 'YXZ');
```

- **Cập nhật điều kiện kiểm thử trong `tests/test_3d_humanoid_system.mjs` (dòng 458):**
```javascript
// 1. Sửa dứt điểm lỗi Đi ngược (Moonwalking) bằng góc vector tự nhiên (không còn + Math.PI)
assert(
  playerCtrlContent.includes('const targetAngle = Math.atan2(finalDir.x, finalDir.z);'),
  '1. Sửa dứt điểm lỗi Đi ngược (Moonwalking) bằng góc vector tự nhiên (không còn + Math.PI)'
);
```

### 7.2. Cơ Chế Va Chạm Ngang Capsule Chống Xuyên Thủng Lan Can Cầu
- Kẹp vị trí đường cong (Bridge Arc Clamping) trên Cầu Thê Húc & Cầu Kim Quy:
  * Khoảng cách đến tim cầu: `getTheHucBridgeInfo(x, y, z)`.
  * Giới hạn an toàn: `maxBridgeOffset = 1.25m`.
  * Khi `dist > 1.6m`, tự động kẹp vị trí nhân vật không vượt qua mép lan can và triệt tiêu thành phần vận tốc vuông góc với lan can: `velocity.projectOnVector(tangentVec)`.

### 7.3. Gia Tốc Khối Lượng GTA V & Khử Nổi Chân
- **Gia tốc quán tính:** Tăng tốc `accel = 18.0 m/s²` khi bấm WASD, hãm phanh `brake = 22.0 m/s²` khi nhả phím; triệt tiêu hoàn toàn trôi trượt khi tốc độ < 0.06 m/s.
- **Khử nổi chân (Foot Ground Snapping):** Bắn raycast 4.0m kiểm tra bề mặt đất, tự động chỉnh khớp chân bám dính độ dốc cầu Thê Húc và Cầu Long Biên, vượt gờ vỉa hè `0.55m`.

---

## 8. HOẠT HỌA SKELETAL MOCAP & PROCEDURAL KINEMATICS 60 FPS TRONG `animations.js`

1. **Idle Breathing & Weight Shift (Thở & Chuyển Trọng Tâm):**
   - Lồng ngực phập phồng chu kỳ 2.2 giây, vai nhấp nhô biên độ 0.015m.
   - Chuyển trọng tâm chân sau mỗi 4 - 6 giây tự nhiên.
   - Tà áo dài 3D đa giác mềm lay động khẽ khàng trước gió hồ.
2. **Walk Cycle (Dáng Đi Cắm Gót Nhấc Mũi):**
   - Chu kỳ bước chân tần số 1.8 Hz, vung tay ngược pha triệt tiêu mô-men xoắn thân trên.
   - Nhún trọng tâm khung chậu `0.035m` theo từng bước cắm gót (Heel Strike) và đẩy mũi (Toe Off).
3. **Run Cycle (Sprint Lean 10-12 độ):**
   - Sải chân dài, góc gập gối lớn, nghiêng thân mình về phía trước 10-12 độ (`0.18 rad`).
   - Cánh tay gập góc nhọn 90 độ đánh mạnh mẽ, tà áo sau bay bổng theo làn gió.
4. **Hệ Thống Lò Xo Giảm Chấn Quán Tính Nón Lá (Lag Damping Spring-Damper):**
   - Tính toán vận tốc góc xoay của đầu để tạo lực ly tâm kéo trễ Nón Lá (`springK = 48.0, dampingC = 7.5`).
   - Khi nhân vật quay người đột ngột, nón lá lắc nhẹ tự nhiên rồi hồi phục về vị trí cân bằng.
5. **Cross-Fade Blending:**
   - Nội suy mượt mà trong `0.2s - 0.3s` giữa Idle, Walk, Run, Jump, triệt tiêu 100% hiện tượng khựng khung hình.

---

## 9. CHI TIẾT 4 PHÂN KHU THẾ GIỚI MỞ 500m x 500m LIỀN MẠCH

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

### 9.1. Phân khu 1: Hồ Gươm & Tháp Rùa Trung Tâm (Zone A)
- **Tọa độ trung tâm:** `(100, 0, -100)`.
- **Tọa độ xuất phát vàng của Người Chơi:** `(x = 16.5, y = 0.5, z = -16.5)` ngay chân Cầu Thê Húc.
- **Hệ thống Cầu Thê Húc:**
  * Dốc tiếp cận thoải (Gentle Approach Ramp) từ vỉa hè (`y = 0.15m`) lên sàn cầu (`y = 0.95m`), độ dốc < 12%, không gờ vấp.
  * Thân cầu cong 15 nhịp đỏ son dẫn vào Đền Ngọc Sơn và Đắc Nguyệt Lâu.
  * Lan can cầu bảo vệ bằng Capsule Horizontal Collision.
  * Vỉa hè lát đá xanh, cột đèn Pháp cổ chiếu ánh sáng vàng ấm 2700K.

### 9.2. Phân khu 2: Mê Cung Phố Cổ & Phố Đường Tàu (Zone B)
- **Tọa độ trung tâm:** `(-100, 0, 100)`.
- **Quy chuẩn Kiến trúc Tường Mỏng & Không Gian Thông Thủy (Thin-Wall Architecture):**
  * Tường bao dày chuẩn xác `0.35m` (tuyệt đối không dùng khối hộp đặc 4m-5m bịt kín).
  * Lòng nhà thông thủy rộng `11.3m x 15.3m`, cao `4.2m`, người chơi tự do đi vào bên trong khám phá.
  * **Tiệm Cà Phê Trứng & Trà Sen Cổ Điển:** Quầy bar gỗ lim viền đồng dài 5.2m, 6 phin nhôm nhỏ giọt, máy hát đĩa than cổ (Gramophone), đồng hồ quả lắc, sofa nhung rêu, gác lửng ban công ngắm tàu chạy sát hiên nhà.
  * **Cửa Hàng Bách Hóa Mậu Dịch Thời Bao Cấp:** Sàn gạch bông hoa chanh, ca men Hải Phòng, phích Rạng Đông vỏ nhôm, hộp bánh bích quy Hải Châu, đài cassette Liên Xô VEF-206, xe đạp Thống Nhất khung nam màu xanh bộ đội.

### 9.3. Phân khu 3: Nhịp Cầu Long Biên & Bãi Bồi Sông Hồng (Zone C)
- **Tọa độ trung tâm:** `(100, 4.2, 100)`. Sàn dầm cầu tại cao độ `y = 4.2m`.
- **Thiết Kế Tiếp Cận Cầu:**
  * **Dốc Dẫn Thoải (Main Bridge Ramp):** Dài 25m từ `x = 10.0m` (`y = 0.1m`) lên `x = 35.0m` (`y = 4.2m`), bề rộng dốc 4.5m, độ dốc 16.4% bước đi tự nhiên không bị trượt.
  * **Cầu Thang Bộ Gạch Đá Phụ Trợ:** 24 bậc thang trát đá rửa xám, chiều cao bậc 0.17m, mặt bậc rộng 0.32m, tay vịn sắt ống dầm Eiffel kiên cố.
- **Bãi Bồi Sông Hồng:** Vạt lau sậy trắng xóa đu đưa theo gió, sóng nước phù sa đỏ cuộn trôi.

### 9.4. Phân khu 4: Khu Tập Thể Cũ & Ngõ Phố Hoàng Hôn (Zone D)
- **Tọa độ trung tâm:** `(-100, 0, -100)`.
- Dãy nhà tập thể 5 tầng kiểu Kim Liên / Giảng Võ thập niên 80 với hệ thống "chuồng cọp" sắt vươn mình, dây phơi quần áo, lồng chim sơn ca, giàn hoa giấy đỏ rực rỡ buông rủ từ ban công tầng 3.
- Quán nước chè ấm tích giành tre của bà cụ và bàn cờ tướng dưới gốc bàng già lá đỏ cuối thu.

---

## 10. HỆ THỐNG CAMERA KÉP & GÓC MỞ MÀN ĐIỆN ẢNH

```
        [PHÍM V / GIỮ CHUỘT PHẢI]
        ------------------------->
   TPS (Khám phá thế giới)          FPS (Khung ngắm máy ảnh film)
   - Spring-Arm camera 4.5m         - Ẩn phần đầu/thân nhân vật 3D
   - Tự động tránh xuyên tường      - Bật Viewfinder HUD cơ khí
   - Parkour, nhảy leo vỉa hè       - Lưới Rule of Thirds / Tỷ lệ vàng
        <-------------------------  - Head-bobbing thở nhẹ chân thực
        [NHẢ CHUỘT / BẤM PHÍM V]
        (Chuyển đổi Lerp 0.3 giây)
```

- **Tọa độ xuất phát người chơi:** `(x = 16.5, y = 0.5, z = -16.5)`.
- **Góc quay Camera mở màn (Initial Camera Orientation):**
  * **Góc quay ngang (Yaw):** Đúng chuẩn `0.785 rad` (45 độ).
  * **Góc chúc xuống (Pitch):** Đúng chuẩn `0.26 rad` (15 độ).
  * **Khoảng cách Spring-Arm:** `4.5 mét` sau lưng nhân vật.
  * **Khung cảnh mở màn:** Hướng thẳng dọc tim Cầu Thê Húc đỏ son nhìn về Đắc Nguyệt Lâu, sương mai bảng lảng trên mặt hồ Gươm tạo cảm giác hoài niệm điện ảnh sâu lắng.

---

## 11. CƠ CHẾ GAMEPLAY CỐT LÕI

### 11.1. Giải Đố Giao Điểm Thị Giác (Perspective Alignment Puzzle)
- Căn góc ống kính máy ảnh để ghép nối 4 biểu tượng ký ức Hà Nội:
  1. **Hồ Gươm:** Cành liễu ghép với bóng Tháp Rùa tạo biểu tượng *Khuê Văn Các*.
  2. **Phố Cổ:** Dây điện hẻm hẹp ghép với chim bồ câu tạo 5 dòng kẻ nốt nhạc *"Người Hà Nội"*.
  3. **Cầu Long Biên:** Dầm thép Eiffel rọi bóng xuống bãi cát sông Hồng tạo *Thăng Long Đệ Nhất Rồng*.
  4. **Khu Tập Thể:** Song thưa chuồng cọp ghép với hoa giấy và vầng mặt trời đỏ tạo *Chim Bồ Câu Bay Khỏi Lồng Sắt*.
- Điều kiện giải mã: Khoảng cách `< 0.8m`, góc nhìn `dot > 0.985`, điểm khớp `alignmentScore >= 0.95`.

### 11.2. Săn Khoảnh Khắc & Tráng Phim Ký Ức
- Bấm phím `Space` hoặc nút chụp trên Viewfinder HUD: Kích hoạt chớp màn trập cơ học kim loại đanh thép (0.08s) -> Trích xuất Canvas WebGL -> Phủ bộ lọc Grain/Portra -> Gắn tem bưu chính & câu thơ tản văn -> Lưu trữ vào `IndexedDB`.

---

## 12. LUỒNG ONBOARDING & WEB PORTAL (3 BƯỚC HOÀN CHỈNH)

1. **Bước 1: Age Gate (18+):** Kiểm tra ngày tháng năm sinh đạt >= 18 tuổi.
2. **Bước 2: Đăng Nhập:** Hỗ trợ Google SSO Mock 1-Click, Email/Mật khẩu vintage, Khách vãng lai.
3. **Bước 3: Tạo Nhân Vật:**
   - Ô nhập tên: 3 - 16 ký tự.
   - **Debounce 500ms:** Gọi `window.GameAPI.checkCharacterNameAvailability(name)`.
   - Nếu trùng: Viền đỏ rung lắc, hiện 3 gợi ý tên (`[Tên]_1990`, `LãngTử_[Tên]`, `[Tên]_PhốCổ`).
   - Nếu hợp lệ: Viền xanh, bật sáng nút vàng đồng "Bước Vào Ký Ức".
   - Chọn 1 trong 4 nhân vật 3D Việt Nam độc bản.

---

## 13. BẢO TOÀN TUYỆT ĐỐI 100% 9 NPC LỊCH SỬ TRONG `WorldManager.js`

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

## 14. PHÂN CHIA NHIỆM VỤ CHO 4 MŨI NHỌN SẢN XUẤT

| Mũi Nhọn | Phân Vùng File Đảm Trách | Nhiệm Vụ Kỹ Thuật Trọng Tâm | Tiêu Chuẩn Nghiệm Thu |
| :--- | :--- | :--- | :--- |
| **Coder Chính**<br>(`coder-chinh`) | `src/core/*`<br>(trừ animations.js)<br>`src/bridge/*` | 1. **Sửa triệt để lỗi Moonwalking:** Đổi thành `targetAngle = Math.atan2(finalDir.x, finalDir.z)` (xóa bỏ `+ Math.PI`) tại `PlayerController.js:982`.<br>2. **Tạo da thịt người thật Á Đông & Lớp trang phục 3D hình khối:** Xây dựng trong `CharacterFactory.js` màu da `#E8BEAC` và `#DEB096`, PBR Skin roughness 0.46, ngũ quan 3D, tay 5 ngón búp măng; lớp quần lụa/âu, thân áo xẻ tà, cổ trụ 3cm dày 2mm, 2 tà áo thể tích.<br>3. Capsule Horizontal Collision chống xuyên lan can Cầu Thê Húc/Kim Quy.<br>4. Đặt Spawn Position `(16.5, 0.5, -16.5)` và Camera `yaw = 0.785 rad`.<br>5. **BẢO TOÀN TUYỆT ĐỐI 100% 9 NPC lịch sử trong `WorldManager.js`.** | Di chuyển chuẩn GTA V, mặt hướng đúng chiều tiến, không rơi khỏi cầu, 60 FPS mượt mà. |
| **Animation Master**<br>(`animation-master`) | `src/core/animations.js` | 1. Chu kỳ Walk Cycle, Run Cycle, Idle Breathing 60 FPS đồng bộ với hướng tiến tự nhiên.<br>2. Uốn lượn 2 tà áo dài 3D có thể tích và nón lá theo dao động hông và gió hồ.<br>3. Lò xo giảm chấn quán tính Nón Lá (Lag Damping Spring-Damper).<br>4. Cross-fade Blending 0.2s - 0.3s triệt tiêu giật cục. | Chuyển động sinh học tự nhiên chuẩn AAA, không giật khung hình, hòa quyện nhịp nhàng với vật lý di chuyển WASD. |
| **UI Polish**<br>(`ui-polish`) | `src/ui/*`<br>`styles/*`<br>`index.html` | 1. Thiết kế Onboarding 3 bước (Age Gate 18+, Login, Character Creator).<br>2. Logic Debounce 500ms check tên kèm rung lắc đỏ và 3 tên gợi ý.<br>3. Giao diện chọn 4 nhân vật 3D Việt Nam độc bản.<br>4. Viewfinder HUD máy ảnh film, Scrapbook Album dán tem, Modal đối thoại 9 NPC.<br>5. Bắt và bắn đúng chuẩn 100% các sự kiện EventBus. | Giao diện hoài niệm sang trọng, responsive mọi độ phân giải, không lỗi console, ăn khớp hoàn toàn với Core. |
| **Họa Sĩ**<br>(`nano-banana`) | `assets/textures/*`<br>`assets/models/*`<br>`assets/ui/*`<br>`assets/photos/*`<br>`assets/audio/*` | 1. Cung cấp đầy đủ Textures PBR (nước Hồ Gươm, rêu Tháp Rùa, tường vôi vàng, thép cầu, giàn hoa giấy, vải lụa, gấm dệt, dạ nỉ).<br>2. 3D models GLTF SkinnedMesh (Michelle.glb, Soldier.glb, Xbot.glb).<br>3. UI Assets (khung ngắm, nút shutter kim loại, tem bưu chính Hà Nội, vé tàu).<br>4. 4 ảnh film ký ức và bộ âm thanh ambient hồ Gươm, còi tàu, tiếng màn trập cơ học. | Tất cả tài nguyên tồn tại thực tế trên đĩa cứng, đúng kích thước, không một đường link nào bị lỗi 404. |

---

## 15. DANH SÁCH TÀI NGUYÊN (ASSET REQUIREMENTS)

### 15.1. Textures Môi Trường & Nhân Vật 3D PBR (`assets/textures/`)
1. `lake_water_norm.jpg`: Normal map mặt nước Hồ Gươm gợn sóng lăn tăn (512x512 Seamless).
2. `turtle_tower_moss.jpg`: Texture đá phủ rêu xanh cổ kính của Tháp Rùa và Đền Ngọc Sơn (1024x1024).
3. `old_wall_yellow.jpg`: Vôi quét tường màu vàng hoàng cúc bong tróc loang lổ (1024x1024).
4. `rusty_iron_beam.jpg`: Bề mặt dầm thép rỉ sét màu nâu cánh gián cầu Long Biên (1024x1024).
5. `hanoi_brick_ground.jpg`: Đá xanh lát vỉa hè và gạch chỉ vỉa hè phố cổ ẩm ướt (1024x1024).
6. `vintage_posters.jpg`: Bản ghép các áp phích cổ, biểu ngữ văn hóa thập niên 80-90 (1024x1024).
7. `wood_counter_varnish.jpg`: Mặt gỗ lim đánh vec-ni cánh gián bóng loáng viền đồng (1024x1024).
8. `bridge_ramp_stone.jpg`: Bề mặt bê tông đá dăm khía rãnh chống trượt dốc dẫn cầu Long Biên (1024x1024).
9. `bougainvillea_blossom.png`: Giàn hoa giấy đỏ hồng rực rỡ buông rủ (PNG trong suốt).
10. `char_silk_ivory_white.jpg` & `char_silk_ivory_white_norm.jpg`: Lụa tơ tằm trắng ngà mềm mại dệt hoa văn chìm.
11. `char_cotton_pink_lotus.jpg` & `char_cotton_pink_lotus_norm.jpg`: Vải đũi tơ tằm hồng cánh sen.
12. `char_silk_black_pants.jpg` & `char_silk_black_pants_norm.jpg`: Lụa đen bóng mờ may quần áo dài/bà ba.
13. `char_wool_charcoal_suit.jpg` & `char_wool_charcoal_suit_norm.jpg`: Vải dạ nỉ xám than may suit lịch lãm.
14. `char_silk_blue_brocade.jpg` & `char_silk_blue_brocade_norm.jpg`: Gấm xanh hoàng gia Thăng Long dệt hoa văn cổ.
15. `char_scarf_caro_krama.jpg` & `char_scarf_caro_krama_norm.jpg`: Khăn rằn caro thủ công.
16. `char_bamboo_non_la.jpg` & `char_bamboo_non_la_norm.jpg`: Nan tre trúc chỉ đan nón lá.

### 15.2. UI Elements & Biểu Tượng (`assets/ui/`)
1. `viewfinder_frame.png`: Khung viền quang học máy ảnh cơ 35mm kèm vạch đo sáng và thước tiêu cự.
2. `shutter_button.png`: Nút chụp máy ảnh kim loại vân tròn cổ điển.
3. `stamp_hanoi.png`: Con tem bưu chính xưa in hình chùa Một Cột và Tháp Rùa mép răng cưa.
4. `logo_reverie.png`: Logo chữ thư pháp hoài niệm "Hà Nội: Chạm Vào Ký Ức" viền vàng đồng.
5. `train_ticket_retro.png`: Tấm vé tàu hỏa giấy nâu mộc mạc Hà Nội - Hải Phòng xưa.

### 15.3. Bộ Ký Ức & Ảnh Film Hoàn Chỉnh (`assets/photos/`)
1. `memory_turtle_mist.jpg`: Ảnh film Tháp Rùa huyền ảo trong màn sương chớm đông.
2. `memory_train_street.jpg`: Đoàn tàu hỏa chạy lướt sát những mái ngói rêu phong phố Phùng Hưng.
3. `memory_long_bien.jpg`: Dầm thép cầu Long Biên nhuộm đỏ trong ánh hoàng hôn sông Hồng.
4. `memory_apartment.jpg`: Ban công khu tập thể cũ với lồng chuồng cọp và giàn hoa giấy rực cháy.

### 15.4. Âm Thanh Môi Trường & Hiệu Ứng (`assets/audio/`)
1. `ambient_lake.mp3`: Tiếng sóng hồ vỗ bờ đá nhẹ, gió rặng liễu, tiếng chuông chùa xa xăm.
2. `ambient_train.mp3`: Tiếng còi tàu hơi nước vang vọng trong ngõ hẹp, tiếng rít kim loại đường ray.
3. `ambient_street.mp3`: Tiếng ve râm ran trưa hè, tiếng rao hàng rong bánh khúc/xôi lạc.
4. `shutter_click.mp3`: Tiếng chớp màn trập cơ học kim loại đanh thép của máy ảnh cơ Leica M3.
5. `photo_develop.mp3`: Tiếng lật tráng giấy ảnh và tiếng nước chảy trong phòng tối tráng phim.

---

## 16. TIÊU CHUẨN KIỂM DUYỆT CHẤT LƯỢNG TOÀN DIỆN (QA CHECKLIST)

Trước khi nghiệm thu dự án đạt mức độ "PASSED 100%", subagent `kiem-duyet-qa` phải kiểm tra lần lượt các tiêu chí:

### Chốt 1: Tách Biệt Vùng Làm Việc & Toàn Vẹn File
- [ ] Không có file nào của `coder-chinh` bị ghi đè bởi `ui-polish` hay `animation-master` và ngược lại.
- [ ] Khung sườn thư mục chuẩn xác: `src/bridge/` cho giao tiếp chung, `src/core/` cho 3D logic, `src/ui/` & `styles/` cho giao diện.

### Chốt 2: Khâu Kiểm Duyệt API & Events (Khâu Kiểm Duyệt 1)
- [ ] Mọi sự kiện phát ra từ `GameEventBus` và mọi hàm trong `GameAPI` đều trùng khớp 100% từng chữ hoa chữ thường với Mục 3 của tài liệu này.
- [ ] Giao tiếp giữa UI và Core hoàn toàn thông qua EventBus và GameAPI, không truy cập chéo biến nội bộ bừa bãi.

### Chốt 3: Nghiêm Cấm 100% Decal 2D Trang Phục & Lớp Hình Khối 3D Độc Lập
- [ ] Tuyệt đối không dán hình phẳng 2D/decal lên thân người để giả lập quần áo.
- [ ] Cổ áo trụ 3D `CylinderGeometry` dày 2mm, cao 3cm ôm quanh cổ.
- [ ] Thân áo 3D xẻ tà hai bên hông để lộ quần lụa; ống tay áo 3D ôm quanh cánh tay.
- [ ] Quần lụa ống rộng 3D (Áo dài) / Quần âu ống đứng có ly 3D (Suit) bọc ngoài chân.
- [ ] Hai tà áo dài 3D đa giác mềm có thể tích (Thickness), đung đưa theo hông và gió hồ.
- [ ] Khuy cúc hạt ngọc 3D nổi, Khăn xếp Thăng Long 5 tầng nếp 3D, Khăn rằn 3D quấn cổ, Nón lá 3D.

### Chốt 4: Tái Tạo Da Thịt Người Thật Á Đông Chuẩn Mực
- [ ] Màu da ấm sáng chuẩn: `#E8BEAC` (Nữ sinh, Cô gái), `#DEB096` (Nam trí thức, Nam Thăng Long).
- [ ] Vật liệu PBR Skin: `roughness = 0.46`, `metalness = 0.0`, giả lập tán xạ dưới bề mặt SSS.
- [ ] Ngũ quan 3D hình khối: Mắt bồ câu đen long lanh, sống mũi dọc dừa, bờ môi cong hồng hào, đôi tai 3D giải phẫu có hoa tai ngọc trai, mái tóc 3D suôn dài.
- [ ] Bàn tay 5 ngón thon dài búp măng có thể tích thịt, khớp cử động tự nhiên.

### Chốt 5: Sửa Triệt Để Lỗi Đi Ngược (Moonwalking Fix)
- [ ] Tại `PlayerController.js:982`, xóa bỏ `+ Math.PI`, chuẩn hóa thành `const targetAngle = Math.atan2(finalDir.x, finalDir.z);`.
- [ ] Cập nhật và kiểm định khớp trong `tests/test_3d_humanoid_system.mjs:458`.
- [ ] Bấm phím `W`: Nhân vật tiến thẳng về phía trước và mặt nhìn thẳng theo hướng tiến 100%. Bấm `A`/`D`: Nhân vật xoay mượt mà đúng hướng rẽ.

### Chốt 6: Lan Can Cầu & Điểm Xuất Phát
- [ ] Spawn tại tọa độ `(16.5, 0.5, -16.5)`.
- [ ] Camera ban đầu có `yaw = 0.785 rad` (45 độ) hướng dọc Cầu Thê Húc.
- [ ] Chạy dọc Cầu Thê Húc/Kim Quy không bao giờ bị xuyên thủng lan can rơi xuống nước (Capsule Arc Clamping).

### Chốt 7: Bảo Toàn 100% 9 NPC Lịch Sử trong `WorldManager.js`
- [ ] Đầy đủ 9 NPC lịch sử: Bác Hùng bán bánh mì dạo xe đạp Thống Nhất, Chị Lan gánh hoa, Bà cụ quán trà đá giành tre, Hai cụ già đánh cờ, Bác dân dạo bộ, Thanh niên cà phê đường tàu, Thầy lang Triệu Lãn Ông, Cô Mai thợ may lụa, Bác Cả Phở 1954; cùng các tương tác quán bia hơi, tiệm đồng hồ, tiệm cắt tóc và đàn cá chép hồ Gươm.

### Chốt 8: Kiến Trúc Tường Mỏng & Dốc Dẫn Cầu Long Biên
- [ ] Tường bao các công trình dày chuẩn 0.35m, lòng nhà thông thủy 11.3m x 15.3m x 4.2m thoáng đãng, người chơi vào được bình thường.
- [ ] Tiệm Cà Phê Trứng & Quán Bách Hóa Mậu Dịch đầy đủ đồ đạc theo thiết kế.
- [ ] Cầu Long Biên (y = 4.2m) có dốc thoải dài 25m từ x = 10 lên x = 35 và cầu thang bộ gạch đá 24 bậc tiếp cận êm ái.

### Chốt 9: Tài Nguyên Đầy Đủ (Zero 404) & Hiệu Năng
- [ ] Toàn bộ file ảnh, âm thanh trong thư mục `assets/` đều tồn tại thực tế và có kích thước hợp lệ trên đĩa cứng.
- [ ] Duy trì 60 FPS ổn định trên màn hình Full HD, không rò rỉ bộ nhớ (Memory Leak) khi dạo chơi qua 4 phân khu.

---
*Bản tài liệu đặc tả này là pháp lệnh kỹ thuật cao nhất cho toàn bộ đội ngũ Game Studio.*
