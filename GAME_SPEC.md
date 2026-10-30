# HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
## TÀI LIỆU KIẾN TRÚC KỸ THUẬT & ĐẶC TẢ HỆ THỐNG TOÀN DIỆN (GAME SPECIFICATION)

---

> **Mã dự án:** `HANOI-OPEN-REVERIE-3D`  
> **Phiên bản tài liệu:** `2.0.0-PRO-3D-HUMANOID`  
> **Phê duyệt:** Sếp Tổng Game Studio & Hội đồng Kiến trúc sư Trưởng  
> **Ngày ban hành:** 30/10/2026  
> **Áp dụng cho 4 Mũi nhọn sản xuất:**  
> 1. `coder-chinh` (Core Logic 3D Engine & Systems)  
> 2. `ui-polish` (Giao diện người dùng, Onboarding, Modals & Styling)  
> 3. `animation-master` (Hoạt họa chuyển động 3D Skeletal Humanoid 60 FPS & VFX trong `animations.js`)  
> 4. `nano-banana` (Họa sĩ Textures PBR, UI Art, Audio)  
> & Khâu Kiểm duyệt độc lập: `kiem-duyet-qa`.

---

## 1. TỔNG QUAN DỰ ÁN & TẦM NHÌN KỸ THUẬT

### 1.1. Tầm nhìn nghệ thuật và trải nghiệm
**HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)** là tựa game khám phá thế giới mở 3D không gian hoài niệm Hà Nội (Thập niên 80-90 giao thoa đương đại) vận hành trực tiếp trên trình duyệt Web (WebGL / WebGL2). 

Người chơi hóa thân thành một "Kẻ Mộng Mơ" dạo bước qua 4 phân khu đặc trưng của thủ đô (Hồ Gươm & Tháp Rùa, Mê cung Phố Cổ & Cà phê Đường Tàu, Nhịp Cầu Long Biên dầm thép Eiffel, Khu Tập Thể Cũ chuồng cọp hoàng hôn), sử dụng chiếc máy ảnh cơ film 35mm để căn góc nhìn giải mã những "Giao điểm thị giác" (Perspective Alignment) ẩn giấu trong kiến trúc, hồi sinh những lát cắt ký ức ngưng đọng của thời gian.

### 1.2. Tech Stack & Nền tảng
- **Engine 3D Core:** `Three.js` (r160+) chạy trực tiếp trên WebGL / WebGL2 context.
- **Mô hình nhân vật:** True 3D Humanoid Mesh with Skeletal Rig Hierarchy (khớp xương đa tầng: hông, thân, ngực, cổ, đầu, vai, cánh tay, cẳng tay, bàn tay, đùi, cẳng chân, bàn chân, cùng tà áo dài 3D và phụ kiện 3D uốn lượn). **Tuyệt đối cấm sử dụng ảnh 2D billboard/plane cho nhân vật người chơi!**
- **Hoạt họa (Animation):** Hệ thống Skeletal Easing & Kinematics 60 FPS độc lập trong `src/core/animations.js`, quản lý các chu kỳ Walk Cycle, Run Cycle, Idle Breathing & Weight Shift.
- **Kiến trúc mã nguồn:** Vanilla JavaScript (ES6+ ES Modules), mô hình phân rã Decoupled Architecture hướng sự kiện (`EventBus`), không phụ thuộc build tooling nặng nề để đảm bảo hot-reload và tương thích tối đa.
- **Audio Engine:** `Web Audio API` với bộ giải mã âm thanh không gian (Spatial Audio Listener / PannerNode) tạo không khí Hà Nội 3D sống động (tiếng ve sầu, còi tàu, tiếng rao đêm, tiếng máy hát loa kèn cổ).
- **Lưu trữ dữ liệu:** `LocalStorage` kết hợp `IndexedDB` cục bộ cho việc lưu trữ hồ sơ nhân vật, thiết lập, và album ảnh film độ phân giải cao (`data:image/webp` base64).
- **Giao diện & Mỹ thuật:** HTML5 Canvas Overlay, CSS3 biến đổi không gian (3D Transforms, Backdrop Blur, Vintage Film Grain Post-processing, CSS Grid).

---

## 2. KIẾN TRÚC HỆ THỐNG & TÁCH BIỆT VÙNG LÀM VIỆC (STRICT BOUNDARIES)

Để đảm bảo 4 bộ phận (`coder-chinh`, `ui-polish`, `animation-master`, `nano-banana`) sản xuất song song 100% không xung đột mã nguồn (zero merge conflicts), hệ sinh thái thư mục được phân định ranh giới nghiêm ngặt như sau:

```
d:/HÀ NỘI CHẠM VÀO KÝ ỨC ,HANOI OPEN REVERIE/
├── index.html                     # Điểm vào ứng dụng (Shell, nạp modules)
├── GAME_SPEC.md                   # Bản đặc tả kỹ thuật này (Chuẩn mực tối cao)
├── REVIEW_LOG.md                  # Nhật ký kiểm duyệt chất lượng QA
│
├── assets/                        # [VÙNG CỦA HỌA SĨ nano-banana]
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
│   │   ├── WorldManager.js        # Bản đồ 500m x 500m, Collision AABB, giữ nguyên 100% NPC cũ
│   │   ├── ZoneManager.js         # Quản lý 4 phân khu (Hồ Gươm, Phố Cổ, Cầu, Nhà Tập Thể)
│   │   ├── PlayerController.js    # Điều khiển nhân vật, va chạm, tích hợp Humanoid Animator
│   │   ├── CharacterFactory.js    # BỘ XÂY DỰNG MÔ HÌNH NGƯỜI 3D THẬT SỰ (TRUE 3D RIGGED MESH)
│   │   ├── animations.js          # [VÙNG CỦA animation-master] Hệ thống hoạt họa xương 60 FPS
│   │   ├── CameraController.js    # Camera Kép (TPS Spring-Arm & FPS Viewfinder)
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
│       ├── DialogueModal.js       # Hộp thoại tương tác với NPC người Hà Nội
│       ├── ChatboxModal.js        # Kênh chat lãng tử
│       ├── ToastNotification.js   # Bảng thông báo góc màn hình phong cách retro
│       └── AudioBGMController.js  # Nút bật tắt nhạc, thanh chỉnh âm lượng hoài niệm
│
└── styles/                        # [VÙNG CỦA ui-polish - CSS STYLES]
    ├── reset.css                  # Chuẩn hóa CSS
    ├── retro_theme.css            # Biến màu sắc hoài niệm (Vàng hoàng cúc, đỏ bã trầu, xanh rêu)
    ├── onboarding.css             # Giao diện Age Gate, Login, Tạo nhân vật
    ├── hud.css                    # Thanh trạng thái, bản đồ, thông báo toast, modal hội thoại
    └── viewfinder.css             # Hiệu ứng film grain, vignette, khung ngắm camera
```

---

## 3. ĐẶC TẢ GIAO DIỆN LẬP TRÌNH VÀ TẬP HÀM GIAO TIẾP (API & EVENT SPECIFICATION)

> **KHÂU KIỂM DUYỆT 1 - BẮT BUỘC TUÂN THỦ:**  
> Dưới đây là danh sách đầy đủ, chính xác từng ký tự tên hàm, tham số, kiểu dữ liệu, chiều truyền dữ liệu giữa `coder-chinh`, `animation-master` và `ui-polish`. Tuyệt đối không tự ý đổi tên để đảm bảo ghép nối hoàn hảo 100%.

### 3.1. Đối tượng toàn cục EventBus: `window.GameEventBus`
Được định nghĩa tại [src/bridge/GameEvents.js](file:///d:/H%C3%80%20N%E1%BB%98I%20CH%E1%BA%A0M%20V%C3%80O%20K%C3%9D%20%E1%BB%A8C%20,HANOI%20OPEN%20REVERIE/src/bridge/GameEvents.js).  
Phương thức chuẩn:
- `window.GameEventBus.on(eventName, callback)`: Đăng ký lắng nghe sự kiện. Trả về hàm hủy đăng ký.
- `window.GameEventBus.off(eventName, callback)`: Hủy đăng ký.
- `window.GameEventBus.emit(eventName, payload)`: Bắn sự kiện kèm dữ liệu payload.

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

### 3.4. Bảng Hợp Đồng API Trực Tiếp (`window.GameAPI`)
Được triển khai tại [src/bridge/GameAPI.js](file:///d:/H%C3%80%20N%E1%BB%98I%20CH%E1%BA%A0M%20V%C3%80O%20K%C3%9D%20%E1%BB%A8C%20,HANOI%20OPEN%20REVERIE/src/bridge/GameAPI.js) bởi `coder-chinh` để `ui-polish` gọi đồng bộ khi cần:

```javascript
/**
 * Contract API toàn cục giữa Coder Chính và UI Polish
 */
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
- **Tọa độ trung tâm:** `(100, 0, -100)`.
- **Tâm điểm:** Tháp Rùa cổ kính rêu phong nằm giữa đảo xanh trên mặt nước phẳng lặng.
- **Hệ thống Cầu Thê Húc:**
  - Dốc thoải tiếp cận nhẹ nhàng (Gentle Approach Ramp) chuyển tiếp từ mặt vỉa hè (`y = 0.15m`) lên sàn chân cầu (`y = 0.95m`), độ dốc < 12%, không gờ vấp.
  - Thân cầu 15 nhịp cong màu đỏ son dẫn vào Đền Ngọc Sơn & Đắc Nguyệt Lâu với hàng cây đa và liễu rủ ven hồ đung đưa theo gió.
  - Vỉa hè lát đá xanh, hàng ghế đá xưa, cột đèn đường Pháp cổ chiếu sáng vàng ấm 2700K.

### 4.2. Phân khu 2: Mê Cung Phố Cổ & Phố Đường Tàu (Zone B: Old Quarter & Train Street)
- **Tọa độ trung tâm:** `(-100, 0, 100)`.
- **Tâm điểm:** Đường ray xe lửa uốn lượn chạy sát rạt qua các ngôi nhà phố cổ hình ống sâu hun hút.
- **Quy chuẩn Kiến trúc Tường Mỏng & Không Gian Thông Thủy (Thin-Wall Architecture):**
  - Tường bao kết cấu gạch trát vữa dày chuẩn xác `0.35m` (tuyệt đối không dùng khối đặc 4m-5m bịt kín).
  - Lòng nhà thông thủy rộng `11.3m x 15.3m`, cao `4.2m`, người chơi tự do đi lại bên trong.
  - **Tiệm Cà Phê Trứng & Trà Sen Cổ Điển:** Quầy bar gỗ lim viền đồng dài 5.2m, 6 phin nhôm nhỏ giọt, kệ hũ trà sen Tây Hồ, máy hát đĩa than cổ (Gramophone), đồng hồ quả lắc gỗ sồi gõ nhịp, sofa nhung rêu, thảm dệt Đông Dương, cầu thang gỗ dẫn lên gác lửng ban công ngắm tàu chạy.
  - **Cửa Hàng Bách Hóa Mậu Dịch Thời Bao Cấp:** Sàn gạch bông hoa chanh, kệ hàng ca men Hải Phòng trắng in hoa hải đường, phích Rạng Đông vỏ nhôm, hộp bích quy Hải Châu, súc vải hoa phin nõn, cân đĩa đồng, đài cassette Liên Xô VEF-206, quạt tai voi cánh ngọc bích, xe đạp Thống Nhất khung nam màu xanh bộ đội dựng góc phòng danh dự.

### 4.3. Phân khu 3: Nhịp Cầu Long Biên & Bãi Bồi Sông Hồng (Zone C: Long Bien Bridge)
- **Tọa độ trung tâm:** `(100, 4.2, 100)`. Sàn dầm cầu tại cao độ `y = 4.2m`.
- **Thiết Kế Tiếp Cận Cầu (Ramp & Stairs System):**
  - **Dốc Dẫn Thoải (Main Bridge Ramp):** Dài 25m từ `x = 10.0m` (`y = 0.1m`) lên `x = 35.0m` (`y = 4.2m`), bề rộng dốc 4.5m, độ dốc 16.4% bước đi tự nhiên không bị trượt.
  - **Cầu Thang Bộ Gạch Đá Phụ Trợ (Pedestrian Stairs):** 24 bậc thang trát đá rửa xám, chiều cao bậc 0.17m, mặt bậc rộng 0.32m, tay vịn sắt ống dầm Eiffel kiên cố.
- **Bãi Bồi Sông Hồng:** Vạt lau sậy trắng xóa đu đưa theo gió, sóng nước phù sa đỏ cuộn trôi.

### 4.4. Phân khu 4: Khu Tập Thể Cũ & Ngõ Phố Hoàng Hôn (Zone D: Collective Housing)
- **Tọa độ trung tâm:** `(-100, 0, -100)`.
- **Tâm điểm:** Dãy nhà tập thể 5 tầng kiểu Kim Liên / Giảng Võ thập niên 80 với hệ thống "chuồng cọp" sắt vươn mình, dây phơi quần áo, lồng chim sơn ca, giàn hoa giấy đỏ rực rỡ buông rủ từ ban công tầng 3.
- **Sân chung:** Bàn cờ tướng của các cụ hưu trí dưới gốc bàng già lá đỏ cuối thu, quán nước chè ấm tích giành tre của bà cụ.

---

## 5. HỆ THỐNG CAMERA KÉP (DUAL CAMERA SYSTEM: TPS & FPS)

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

- **Chế độ TPS (Third Person Exploration):**
  - Spring-Arm Boom 4.5m sau lưng, góc chúc xuống 15 độ.
  - Damping nội suy góc quay chuột mượt mà (`lerp factor = 0.08`).
  - Raycast chống xuyên tường (Collision Detection), khoảng cách tối thiểu 0.8m.
- **Chế độ FPS (Viewfinder Máy Ảnh Film):**
  - Lerp mượt mà trong 0.3 giây từ TPS về tọa độ mắt người (`y = 1.65m`).
  - FOV chuyển từ 65 độ xuống 45 độ (tiêu cự 50mm cổ điển).
  - Tự động gán `playerMesh.visible = false` khi ở FPS để ống kính thông thoáng tuyệt đối.

---

## 6. CƠ CHẾ GAMEPLAY CỐT LÕI

### 6.1. Giải đố Giao Điểm Thị Giác (Perspective Alignment Puzzle)
- Người chơi di chuyển đến vị trí định mệnh và căn góc ống kính để các vật thể phân tán ghép thành biểu tượng:
  1. **Hồ Gươm:** Cành liễu ven hồ ghép với bóng Tháp Rùa tạo biểu tượng *Khuê Văn Các*.
  2. **Phố Cổ:** Dây điện hẻm hẹp ghép với chim bồ câu mái ngói tạo 5 dòng kẻ nốt nhạc *"Người Hà Nội"*.
  3. **Cầu Long Biên:** Dầm thép Eiffel rọi bóng xuống bãi cát sông Hồng tạo *Thăng Long Đệ Nhất Rồng*.
  4. **Khu Tập Thể:** Song thưa chuồng cọp ghép với hoa giấy và vầng mặt trời đỏ tạo *Chim Bồ Câu Bay Khỏi Lồng Sắt*.
- **Thuật toán kiểm tra:**
  - Khoảng cách đứng: `dist(playerPosition, targetPosition) < 0.8m`.
  - Hướng ngắm: `cameraDirection.dot(targetDirection) > 0.985` (sai số góc < 10 độ).
  - Khi `alignmentScore >= 0.95`, kích hoạt `CORE:PUZZLE_DETECTED` (`isAligned = true`).

### 6.2. Săn Khoảnh Khắc & Tráng Phim Ký Ức
- Bấm `Space` hoặc nút chụp ảo: Chớp sáng màn trập kim loại cơ học (0.08s) -> Trích xuất Canvas WebGL -> Áp bộ lọc Grain/Portra -> Gắn tem bưu chính & câu thơ tản văn -> Lưu trữ vào `IndexedDB`.

---

## 7. LUỒNG ONBOARDING & WEB PORTAL (3 BƯỚC HOÀN CHỈNH)

1. **Bước 1: Age Gate (18+):** Kiểm tra ngày tháng năm sinh đạt >= 18 tuổi. Dưới 18 tuổi hiện thông báo lịch sự từ chối truy cập không gian đêm.
2. **Bước 2: Đăng Nhập:** Hỗ trợ Google SSO 1-Click (Mock), Email/Mật khẩu vintage, Khách vãng lai.
3. **Bước 3: Tạo Nhân Vật:**
   - Ô nhập tên: 3 - 16 ký tự.
   - **Debounce 500ms:** Gọi `window.GameAPI.checkCharacterNameAvailability(name)`.
   - Nếu trùng: Viền đỏ rung lắc, hiện 3 gợi ý tên (`[Tên]_1990`, `LãngTử_[Tên]`, `[Tên]_PhốCổ`).
   - Nếu hợp lệ: Viền xanh, bật sáng nút vàng đồng "Bước Vào Ký Ức".
   - Cho phép chọn 1 trong 4 nhân vật 3D hoàn chỉnh.

---

## 8. ĐẶC TẢ KIẾN TRÚC MÔ HÌNH CON NGƯỜI 3D THẬT SỰ (TRUE 3D HUMANOID RIGGED MESH)

> **CHỈ THỊ KHẨN CẤP TỪ SẾP TỔNG:**  
> *"Tôi bảo là làm nhân vật 3D chứ không phải là làm hình ảnh biết di chuyển. Mô hình con người 3D! Cấm tiệt billboard 2D plane cho nhân vật người chơi. Toàn bộ cơ thể phải được dựng bằng hình học 3D thật sự, có khung xương phân cấp và khớp xoay sinh học tự nhiên."*

```
                     [3D Head Mesh + Mũ / Nón Lá 3D]
                                    |
                             [Neck Joint]
                                    |
      [L_Shoulder] ---------- [Chest Joint] ---------- [R_Shoulder]
           |                        |                        |
     [L_UpperArm]             [Torso Mesh]             [R_UpperArm]
           |                   (Áo Dài 3D)                   |
      [L_Elbow]                     |                   [R_Elbow]
           |                  [Pelvis / Hips]                |
     [L_LowerArm]            /               \         [R_LowerArm]
           |           [L_Hip Joint]     [R_Hip Joint]       |
        [L_Hand]             |                 |          [R_Hand]
                       [L_UpperLeg]       [R_UpperLeg]
                             |                 |
                         [L_Knee]          [R_Knee]
                             |                 |
                       [L_LowerLeg]       [R_LowerLeg]
                             |                 |
                         [L_Foot]          [R_Foot]
```

### 8.1. Cấu trúc Khớp Phân Cấp (Hierarchical Skeletal Rig Tree)
Mô hình nhân vật người chơi được xây dựng trong [src/core/CharacterFactory.js](file:///d:/H%C3%80%20N%E1%BB%98I%20CH%E1%BA%A0M%20V%C3%80O%20K%C3%9D%20%E1%BB%A8C%20,HANOI%20OPEN%20REVERIE/src/core/CharacterFactory.js) theo cây phân cấp Three.js Groups chuẩn sau:

- `rootGroup` (Vị trí gốc `(0, 0, 0)`)
  - `shadowMesh` (Bóng tiếp xúc mặt đất chân thực dạng đĩa tròn mờ)
  - `pelvisGroup` (Khung chậu / Hips, cao độ chuẩn `y = 0.95m`)
    - `torsoGroup` (Thân mình, cao độ tương đối `y = 0.0m` so với Pelvis)
      - `torsoMesh` (Hình học thân 3D bo tròn mềm mại)
      - `clothingGroup` (Tà áo dài 3D trước/sau uốn lượn, hoặc áo bà ba, hoặc áo vest)
        - `frontFlapGroup` (Khớp tà áo trước xoay tự nhiên)
        - `backFlapGroup` (Khớp tà áo sau bay theo gió)
      - `chestGroup` (Lồng ngực nhấp nhô theo nhịp thở)
        - `neckGroup` (Khớp cổ)
          - `headGroup` (Đầu người 3D, mắt, mũi, miệng tỉ lệ vàng)
            - `accessoryHeadGroup` (Nón lá 3D, mũ phớt 3D, hoặc tóc kiểu Hà Nội)
      - `leftShoulderGroup` (Khớp vai trái tại `x = -0.22m, y = 0.38m`)
        - `leftUpperArmGroup` (Cánh tay trên - bắp tay)
          - `leftElbowGroup` (Khớp khuỷu tay tại `y = -0.28m`)
            - `leftLowerArmGroup` (Cẳng tay)
              - `leftHandGroup` (Bàn tay 3D)
      - `rightShoulderGroup` (Khớp vai phải tại `x = 0.22m, y = 0.38m`)
        - `rightUpperArmGroup` (Cánh tay trên)
          - `rightElbowGroup` (Khớp khuỷu tay tại `y = -0.28m`)
            - `rightLowerArmGroup` (Cẳng tay)
              - `rightHandGroup` (Bàn tay 3D)
    - `leftHipGroup` (Khớp háng trái tại `x = -0.12m, y = -0.05m`)
      - `leftUpperLegGroup` (Đùi 3D)
        - `leftKneeGroup` (Khớp đầu gối gập tự nhiên tại `y = -0.42m`)
          - `leftLowerLegGroup` (Bắp chân / Cẳng chân 3D)
            - `leftFootGroup` (Bàn chân / Giày dép 3D tại `y = -0.40m`)
    - `rightHipGroup` (Khớp háng phải tại `x = 0.12m, y = -0.05m`)
      - `rightUpperLegGroup` (Đùi 3D)
        - `rightKneeGroup` (Khớp đầu gối gập tự nhiên tại `y = -0.42m`)
          - `rightLowerLegGroup` (Bắp chân / Cẳng chân 3D)
            - `rightFootGroup` (Bàn chân / Giày dép 3D tại `y = -0.40m`)

### 8.2. Hệ Thống Hình Học 3D (Organic 3D Geometries)
Tuyệt đối không dùng hình hộp vuông sắc cạnh làm cơ thể người. Áp dụng kết hợp các hình học 3D hữu cơ:
- **Đầu & Khuôn mặt:** `SphereGeometry(0.13, 16, 16)` bo tròn mềm mại với chất liệu da Á Đông (`color: 0xf5cfb3, roughness: 0.55`).
- **Thân & Lồng ngực:** `CylinderGeometry(0.18, 0.22, 0.65, 16)` bo thon eo tự nhiên.
- **Tứ chi (Bắp tay, Cẳng tay, Đùi, Cẳng chân):** `CapsuleGeometry(radius, length, 8, 16)` hoặc `CylinderGeometry` bo đỉnh, tạo đường cong cơ bắp sinh học.
- **Bàn chân / Giày:** `BoxGeometry` vát mũi hoặc `CapsuleGeometry` nằm ngang.

---

### 8.3. Chi Tiết Thiết Kế 4 Nhân Vật Người Chơi 3D Hoàn Chỉnh

#### 1. `char_nu_sinh_ao_dai`: Nữ Sinh Tràng An • Áo Dài Trắng Nón Lá
- **Hình tượng:** Nữ sinh Hà thành thanh lịch, nét đẹp thuần khiết biểu tượng nghìn năm Thăng Long.
- **Thân áo dài 3D:** Chất liệu lụa trắng tơ tằm (`color: 0xfcfdfd, roughness: 0.35, sheen: 0.8`). Thân trên ôm sát eo thon thả.
- **Tà áo dài 3D trước & sau (3D Flowing Flaps):**
  - Dựng bằng `PlaneGeometry(0.38, 0.88, 4, 8)` uốn cong đa phân đoạn (Multi-segment) hoặc chuỗi dải lụa mỏng bo viền.
  - Tà trước thả dài qua gối (`y = -0.15m` đến `-0.90m`).
  - Khớp xoay `frontFlapGroup` và `backFlapGroup` đung đưa mềm mại theo bước chân và luồng gió hồ Gươm.
- **Quần lụa trắng 3D:** Ống suông mềm mại (`color: 0xf4f4f6`), rủ chấm gót guốc mộc.
- **Nón lá 3D hoàn chỉnh:**
  - Chóp nón: `ConeGeometry(0.34, 0.22, 24)` đan nan tre vàng óng (`color: 0xeedbb2, roughness: 0.75`).
  - Vành nón rộng: Vành nan tre mảnh chạy quanh chu vi tạo nét e ấp duyên dáng.
  - Quai nón: Dải lụa hồng cánh sen buông nhẹ dưới cằm.

#### 2. `char_co_gai_ao_ba_ba`: Cô Gái Phố Thị • Áo Bà Ba Hồng Cánh Sen Khăn Rằn
- **Hình tượng:** Cô gái phố cổ mộc mạc, hiếu khách, gánh gánh hoa sớm qua Ô Quan Chưởng.
- **Áo bà ba 3D:** Màu hồng cánh sen ngọt ngào (`color: 0xdf648a, roughness: 0.65`), cổ tròn xẻ ngực truyền thống, vạt áo xẻ hai bên hông đặc trưng.
- **Khăn rằn 3D:** Khăn rằn caro đen trắng dệt thủ công vắt chéo qua vai (`TorusGeometry` uốn cong hoặc `TubeGeometry` ôm quanh cổ và rủ xuống trước ngực).
- **Quần lụa đen 3D:** Quần lụa đen tuyền (`color: 0x1a1a1a, roughness: 0.55`) ống rộng thoải mái bước đi.
- **Nón lá quai thao / Nón lá đeo sau lưng:** Nón lá tre máng sau lưng thanh thoát.

#### 3. `char_nam_tri_thuc_suit`: Trí Thức Hiện Đại • Âu Phục Suit Navy Lịch Lãm
- **Hình tượng:** Kiến trúc sư trẻ lịch lãm, hào hoa, nghiên cứu kết cấu dầm thép Eiffel cầu Long Biên.
- **Bộ Suit Jacket 3D:** Màu xanh navy hoàng gia (`color: 0x1e2e4a, roughness: 0.58`), ve áo chữ V (Notch Lapel) dựng nổi 3D ôm sát cổ.
- **Áo sơ mi & Cà vạt 3D:** Sơ mi trắng cắm thùng, cà vạt màu đỏ mận hoặc xanh thẫm vát nhọn trước ngực.
- **Quần tây âu 3D:** Quần âu xếp ly thẳng thớm cùng tông màu navy.
- **Giày tây da bóng 3D:** Giày Oxford đen bóng loáng (`roughness: 0.25, metalness: 0.2`).

#### 4. `char_nam_ao_dai_gam`: Quý Nam Hà Thành • Áo Dài Gấm Xanh Ngũ Thân
- **Hình tượng:** Nghệ nhân di sản, quý ông Tràng An mực thước am tường lịch sử Tháp Rùa và Đền Ngọc Sơn.
- **Áo dài ngũ thân 3D:** Chất liệu gấm dệt hoa văn cổ màu xanh lam sapphire (`color: 0x1b3b6f, roughness: 0.42, metalness: 0.15`), khuy cài ngọc bích bên ngực phải.
- **Tà áo nam 3D rộng rãi:** Vạt áo buông thẳng dài qua đầu gối, uy nghiêm đĩnh đạc, tà áo khẽ lay động khi dạo bước.
- **Quần âu trắng 3D:** Ống quần đứng dáng màu trắng ngà.
- **Khăn đóng / Khăn xếp 3D:** Khăn xếp truyền thống quấn nhiều nếp màu đen hoặc xanh thẫm đội đầu trang nghiêm.

---

### 8.4. Xác Nhận Bảo Toàn Tuyệt Đối 100% NPC Cũ Trong `WorldManager.js`
Theo đúng mệnh lệnh của Sếp Tổng:
- **GIỮ NGUYÊN 100%** toàn bộ mô hình và logic NPC sẵn có trong `src/core/WorldManager.js`:
  1. `_createBanhMiVendorNPC()`: Bác Hùng bán bánh mì dạo xe đạp Thống Nhất.
  2. `_createFlowerVendorNPC()`: Chị gánh hàng hoa sen hồng và cúc vàng.
  3. `_createTeaStallVendorNPC()`: Bà cụ quán nước chè xanh giành tre vỉa hè.
  4. `_createChessPlayersNPC()`: Hai cụ già đánh cờ tướng sân khu tập thể.
  5. `_createCitizenNPC()`: Bác dân phố cổ dạo bộ mũ phớt.
  6. `_createCoffeePatronNPC()`: Thanh niên uống cà phê ngắm tàu chạy.
  7. Toàn bộ tương tác trong nhà (Thầy lang bốc thuốc Lãn Ông, Thợ may Lương Văn Can, Quán phở 1954, Quán bia hơi, Tiệm sửa đồng hồ Liên Xô, Tiệm cắt tóc bình dân).
  8. Hệ thống đàn cá chép vàng bơi lội `lakeFish` trong lòng Hồ Gươm.
- **CHỈ THAY THẾ DUY NHẤT:** Mô hình nhân vật người chơi (`PlayerController.js` và `CharacterFactory.js`) từ dạng 2D Billboard/Plane sang Mô hình người 3D thật sự có Rig phân cấp và Skeletal Animation System.

---

## 9. ĐẶC TẢ MODULE HOẠT HỌA 3D `src/core/animations.js` (CHO ANIMATION MASTER)

Hệ thống hoạt họa chuyển động con người được đóng gói độc lập trong [src/core/animations.js](file:///d:/H%C3%80%20N%E1%BB%98I%20CH%E1%BA%A0M%20V%C3%80O%20K%C3%9D%20%E1%BB%A8C%20,HANOI%20OPEN%20REVERIE/src/core/animations.js), phụ trách toàn bộ chuyển động của 4 nhân vật 3D ở tốc độ khung hình 60 FPS mượt mà.

### 9.1. Lớp Điều Khiển Hoạt Họa: `HumanoidAnimator`
`HumanoidAnimator` quản lý các trạng thái (`idle`, `walk`, `run`, `jump`) và thực hiện blending mượt mà giữa các trạng thái thông qua hàm `update(delta, moveSpeed, isGrounded)`.

```javascript
export class HumanoidAnimator {
  /**
   * Khởi tạo Animator gắn kết với mô hình nhân vật 3D
   * @param {THREE.Group} characterGroup - Root Group của nhân vật chứa đầy đủ cây xương phân cấp
   * @param {Object} options - Cấu hình biên độ { walkSpeedScale, armSwingScale, clothFlapScale }
   */
  constructor(characterGroup, options = {}) {
    this.char = characterGroup;
    this.rig = characterGroup.rig; // Tham chiếu đến các Joints: pelvis, torso, chest, shoulders, elbows, hips, knees, flaps
    this.animTime = 0;
    this.currentWeight = { idle: 1.0, walk: 0.0, run: 0.0 };
    this.baseTorsoY = 0.95;
  }

  /**
   * Cập nhật hoạt ảnh 60 FPS từng frame (Zero-Allocation Loop)
   * @param {number} delta - Thời gian giữa 2 frames (seconds)
   * @param {number} speed - Vận tốc di chuyển hiện tại (0: đứng yên, >0: đi bộ, >6: chạy nhanh)
   * @param {boolean} isGrounded - Đang tiếp đất hay đang nhảy trên không
   */
  update(delta, speed, isGrounded) {
    // 1. Tính toán trọng số chuyển đổi trạng thái (Cross-Fade Weights)
    // 2. Cập nhật góc quay xương Walk Cycle / Run Cycle / Idle
    // 3. Uốn lượn tà áo dài 3D và phụ kiện
  }

  /**
   * Kích hoạt hiệu ứng vung tay chào hoặc tương tác
   */
  playGesture(gestureName) {}

  /**
   * Reset tư thế về trạng thái cân bằng chuẩn
   */
  resetPose() {}
}
```

### 9.2. Chi Tiết Hoạt Ảnh 3 Chu Kỳ Cốt Lõi

#### 1. Chu Kỳ Đi Bộ (Walk Cycle - 60 FPS)
- **Tần số bước:** `frequency = 6.2 rad/s` (tỉ lệ thuận với tốc độ di chuyển).
- **Vung chân nhịp nhàng:**
  - Chân trái và chân phải lệch pha đúng `Math.PI` (180 độ).
  - Khớp háng (`leftHip`, `rightHip`): Xoay góc `pitch` từ `-0.45` đến `+0.45 rad`.
  - Khớp đầu gối (`leftKnee`, `rightKnee`): Khi chân lăng về sau gập tự nhiên một góc `0.55 rad * Math.max(0, -Math.sin(phase))`, khi chạm đất duỗi thẳng êm ái.
- **Vung tay ngược pha (Counter-Balancing Arm Swing):**
  - Tay trái vung cùng pha với chân phải, tay phải cùng pha với chân trái giúp cân bằng mô-men xoắn cơ thể người.
  - Khớp vai (`leftShoulder`, `rightShoulder`): Xoay biên độ `-0.35` đến `+0.35 rad`.
  - Khớp khuỷu tay (`leftElbow`, `rightElbow`): Khẽ gập tự nhiên một góc `0.20 rad` khi vung ra trước.
- **Nhún thân sinh học (Pelvis Bobbing & Torso Sway):**
  - Trọng tâm hạ thấp khi hai chân dạng rộng nhất và nâng cao khi một chân chống thẳng: `pelvis.position.y = baseTorsoY + Math.abs(Math.sin(walkTime * 2.0)) * 0.035 - 0.02`.
  - Lắc hông nhẹ theo trục Z: `pelvis.rotation.z = Math.sin(walkTime) * 0.03`.

#### 2. Chu Kỳ Chạy Nhanh (Run Cycle - 60 FPS)
- **Tần số sải bước:** `frequency = 9.5 rad/s`.
- **Biên độ sải bước rộng:**
  - Khớp háng xoay từ `-0.85` đến `+0.85 rad`.
  - Đầu gối gập mạnh ra sau tới `1.15 rad` khi chân nhấc khỏi mặt đất.
- **Cánh tay co góc nhọn:**
  - Khuỷu tay gập cố định góc `0.85 rad` (~50 độ), vai vung mạnh mẽ biên độ `0.65 rad`.
- **Độ nhún & nghiêng mình (Forward Lean):**
  - Thân mình nghiêng về phía trước theo hướng chạy: `torso.rotation.x = 0.18 rad`.
  - Độ nhún trọng tâm bật nảy mạnh hơn: `Math.abs(Math.sin(runTime * 2.0)) * 0.07`.

#### 3. Trạng Thái Thở Khi Đứng Yên & Chuyển Trọng Tâm (Idle Breathing & Weight Shift)
- **Lồng ngực phập phồng (Breathing Cycle):**
  - Chu kỳ thở chậm rãi: `breathTime = time * 2.2`.
  - `chestGroup.scale.set(1 + Math.sin(breathTime) * 0.025, 1 + Math.sin(breathTime) * 0.03, 1 + Math.sin(breathTime) * 0.025)`.
  - Vai khẽ nhấp nhô theo nhịp lấy hơi: `pelvis.position.y = baseTorsoY + Math.sin(breathTime) * 0.008`.
- **Chuyển trọng tâm (Weight Shift):**
  - Sau mỗi 4-6 giây, nhân vật khẽ dồn trọng tâm sang một bên chân (`pelvis.rotation.z` lệch `0.02 rad`, đầu khẽ nghiêng e ấp).
- **Tà áo dài & Nón lá bay theo gió (Cloth & Accessory Wind Flapping):**
  - Gió hồ Gươm thổi nhẹ: Tà áo trước và sau uốn lượn hình sin với độ trễ:  
    `frontFlapGroup.rotation.x = Math.sin(time * 3.0) * 0.08 + Math.cos(time * 1.5) * 0.04`.  
    `backFlapGroup.rotation.x = -Math.sin(time * 3.0 + 0.5) * 0.10`.
  - Nón lá khẽ nhấp nhô nghiêng góc theo gió: `nonLaGroup.rotation.z = Math.sin(time * 1.8) * 0.03`.

---

## 10. PHÂN CHIA NHIỆM VỤ CHO 4 MŨI NHỌN SẢN XUẤT

| Mũi Nhọn | Phân Vùng File Đảm Trách | Nhiệm Vụ Kỹ Thuật Trọng Tâm | Tiêu Chuẩn Nghiệm Thu |
| :--- | :--- | :--- | :--- |
| **Coder Chính**<br>(`coder-chinh`) | `src/core/*`<br>(trừ animations.js)<br>`src/bridge/*` | 1. Dựng 4 mô hình người 3D thật sự có cây xương phân cấp trong `CharacterFactory.js`.<br>2. Tích hợp `HumanoidAnimator` vào `PlayerController.js` điều khiển di chuyển.<br>3. Giữ nguyên 100% NPC cũ trong `WorldManager.js`.<br>4. Quản lý Game Loop, Camera Kép, Va chạm AABB, Căn góc quang học và Canvas Shutter Capture.<br>5. Cung cấp API và EventBus bất biến. | Nhân vật là khối 3D thật sự, chân bước chạm đất không trượt trơn, 60 FPS ổn định, zero 404, bảo toàn 100% NPC cũ. |
| **Animation Master**<br>(`animation-master`) | `src/core/animations.js` | 1. Lập trình class `HumanoidAnimator` chuẩn 60 FPS.<br>2. Xây dựng Walk Cycle (vung tay chân ngược pha, gập gối, nhún thân).<br>3. Xây dựng Run Cycle (sải rộng, khuỷu tay gập, nghiêng thân).<br>4. Xây dựng Idle Breathing & Cloth Wind Flap (thở phập phồng, tà áo và nón lá lay động).<br>5. Viết thuật toán Easing chuyển động mượt mà không bị giật cục. | Chuyển động sinh học tự nhiên, không giật khung hình, tà áo dài 3D uốn lượn thướt tha, hòa quyện với di chuyển WASD. |
| **UI Polish**<br>(`ui-polish`) | `src/ui/*`<br>`styles/*`<br>`index.html` | 1. Thiết kế Onboarding 3 bước (Age Gate 18+, Login, Character Creator).<br>2. Viết logic Debounce 500ms check tên kèm rung lắc đỏ và 3 tên gợi ý.<br>3. Cho phép người chơi xem trước và chọn 4 nhân vật 3D mới.<br>4. Xây dựng Viewfinder HUD máy ảnh film, Scrapbook Album dán tem, Modal đối thoại NPC.<br>5. Bắt và bắn đúng chuẩn 100% các sự kiện EventBus. | Giao diện hoài niệm sang trọng, responsive mọi độ phân giải, không lỗi console, ăn khớp hoàn toàn với Core. |
| **Họa Sĩ**<br>(`nano-banana`) | `assets/textures/*`<br>`assets/ui/*`<br>`assets/photos/*`<br>`assets/audio/*` | 1. Cung cấp đầy đủ Textures PBR (nước Hồ Gươm, rêu Tháp Rùa, tường vôi vàng, thép cầu, giàn hoa giấy).<br>2. Cung cấp UI Assets (khung ngắm, nút shutter kim loại, tem bưu chính Hà Nội, vé tàu).<br>3. Cung cấp 4 ảnh film ký ức mẫu.<br>4. Cung cấp bộ âm thanh ambient hồ Gươm, còi tàu đường ray, tiếng rao đêm, tiếng màn trập cơ học. | Tất cả tài nguyên tồn tại thực tế trên đĩa cứng, đúng kích thước, không một đường link nào bị lỗi 404. |

---

## 11. DANH SÁCH TÀI NGUYÊN (ASSET REQUIREMENTS)

### 11.1. Textures Môi Trường & Nhân Vật 3D (`assets/textures/`)
1. `lake_water_norm.jpg`: Normal map mặt nước Hồ Gươm gợn sóng lăn tăn (512x512 Seamless).
2. `turtle_tower_moss.jpg`: Texture đá phủ rêu xanh cổ kính của Tháp Rùa và Đền Ngọc Sơn (1024x1024).
3. `old_wall_yellow.jpg`: Vôi quét tường màu vàng hoàng cúc bong tróc loang lổ (1024x1024).
4. `rusty_iron_beam.jpg`: Bề mặt dầm thép rỉ sét màu nâu cánh gián cầu Long Biên (1024x1024).
5. `hanoi_brick_ground.jpg`: Đá xanh lát vỉa hè và gạch chỉ vỉa hè phố cổ ẩm ướt (1024x1024).
6. `vintage_posters.jpg`: Bản ghép các áp phích cổ, biểu ngữ văn hóa thập niên 80-90 (1024x1024).
7. `wood_counter_varnish.jpg`: Mặt gỗ lim đánh vec-ni cánh gián bóng loáng viền đồng (1024x1024).
8. `bridge_ramp_stone.jpg`: Bề mặt bê tông đá dăm khía rãnh chống trượt dốc dẫn cầu Long Biên (1024x1024).
9. `bougainvillea_blossom.png`: Giàn hoa giấy đỏ hồng rực rỡ buông rủ (PNG trong suốt).

### 11.2. UI Elements & Biểu Tượng (`assets/ui/`)
1. `viewfinder_frame.png`: Khung viền quang học máy ảnh cơ 35mm kèm vạch đo sáng và thước tiêu cự.
2. `shutter_button.png`: Nút chụp máy ảnh kim loại vân tròn cổ điển.
3. `stamp_hanoi.png`: Con tem bưu chính xưa in hình chùa Một Cột và Tháp Rùa mép răng cưa.
4. `logo_reverie.png`: Logo chữ thư pháp hoài niệm "Hà Nội: Chạm Vào Ký Ức" viền vàng đồng.
5. `train_ticket_retro.png`: Tấm vé tàu hỏa giấy nâu mộc mạc Hà Nội - Hải Phòng xưa.

### 11.3. Bộ Ký Ức & Ảnh Film Hoàn Chỉnh (`assets/photos/`)
1. `memory_turtle_mist.jpg`: Ảnh film Tháp Rùa huyền ảo trong màn sương chớm đông.
2. `memory_train_street.jpg`: Đoàn tàu hỏa chạy lướt sát những mái ngói rêu phong phố Phùng Hưng.
3. `memory_long_bien.jpg`: Dầm thép cầu Long Biên nhuộm đỏ trong ánh hoàng hôn sông Hồng.
4. `memory_apartment.jpg`: Ban công khu tập thể cũ với lồng chuồng cọp và giàn hoa giấy rực cháy.

### 11.4. Âm Thanh Môi Trường & Hiệu Ứng (`assets/audio/`)
1. `ambient_lake.mp3`: Tiếng sóng hồ vỗ bờ đá nhẹ, gió rặng liễu, tiếng chuông chùa xa xăm.
2. `ambient_train.mp3`: Tiếng còi tàu hơi nước vang vọng trong ngõ hẹp, tiếng rít kim loại đường ray.
3. `ambient_street.mp3`: Tiếng ve râm ran trưa hè, tiếng rao hàng rong bánh khúc/xôi lạc.
4. `shutter_click.mp3`: Tiếng chớp màn trập cơ học kim loại đanh thép của máy ảnh cơ Leica M3.
5. `photo_develop.mp3`: Tiếng lật tráng giấy ảnh và tiếng nước chảy trong phòng tối tráng phim.

---

## 12. TIÊU CHUẨN KIỂM DUYỆT CHẤT LƯỢNG (QA CHECKLIST)

Trước khi nghiệm thu dự án đạt mức độ "PASSED 100%", subagent `kiem-duyet-qa` phải kiểm tra lần lượt các tiêu chí:

- [ ] **Kiểm tra phân vùng file:** Không có file nào của `coder-chinh` bị ghi đè bởi `ui-polish` hay `animation-master` và ngược lại.
- [ ] **Khâu kiểm duyệt API & Events:** Mọi sự kiện phát ra từ `GameEventBus` và mọi hàm trong `GameAPI` đều trùng khớp 100% từng chữ hoa chữ thường với mục 3 của tài liệu này.
- [ ] **Khâu kiểm duyệt Mô hình Người 3D Thật Sự (True 3D Humanoid):**
  - Tuyệt đối KHÔNG còn tấm billboard 2D Plane cho nhân vật người chơi.
  - Mô hình có đầy đủ cấu trúc khung xương phân cấp: Pelvis -> Torso -> Chest -> Neck -> Head; Shoulders -> Upper Arms -> Elbows -> Lower Arms -> Hands; Hips -> Upper Legs -> Knees -> Lower Legs -> Feet.
  - 4 nhân vật có đủ phụ kiện hình học 3D (Áo dài trắng 3D uốn lượn, Nón lá 3D, Áo bà ba 3D hồng sen, Khăn rằn 3D, Suit navy 3D có ve áo, Áo dài gấm xanh ngũ thân 3D).
- [ ] **Chốt kiểm duyệt Hoạt Họa 60 FPS (`animations.js`):**
  - Walk Cycle: vung tay chân ngược pha, đầu gối gập tự nhiên, thân nhún nhịp nhàng theo từng bước chân.
  - Run Cycle: sải chân biên độ lớn, khuỷu tay gập nhọn, thân hơi đổ về trước.
  - Idle: lồng ngực phập phồng hít thở, trọng tâm chuyển nhẹ, tà áo và nón lá lay động trước gió hồ Gươm.
  - Hoạt ảnh chuyển trạng thái mượt mà (Blending/Cross-fade), không bị giật cục hay đơ cứng.
- [ ] **Bảo toàn 100% NPC cũ trong `WorldManager.js`:**
  - Bác bán bánh mì dạo xe đạp Thống Nhất, Chị gánh hoa, Bà cụ quán trà đá, Hai cụ đánh cờ, cùng toàn bộ các điểm đối thoại nội thất vẫn hoạt động nguyên vẹn 100%.
- [ ] **Kiểm tra không gian nội thất tường mỏng (Thin-Wall Interior):**
  - Tường bao các công trình đạt độ dày chuẩn 0.35m, lòng nhà thông thủy 11.3m x 15.3m x 4.2m thoáng đãng, người chơi vào được bình thường.
  - Tiệm Cà Phê Trứng & Quán Bách Hóa Mậu Dịch đầy đủ đồ đạc theo thiết kế.
- [ ] **Kiểm tra dốc dẫn Cầu Long Biên & Cầu Thê Húc:**
  - Cầu Long Biên (y = 4.2m) có dốc thoải dài 25m từ x = 10 lên x = 35 và cầu thang bộ gạch đá 24 bậc tiếp cận êm ái.
  - Cầu Thê Húc có dốc êm nối bờ hồ và cổng Đắc Nguyệt Lâu, không vấp ngấn.
- [ ] **Kiểm tra tài nguyên (Zero 404):** Toàn bộ file ảnh, âm thanh trong thư mục `assets/` đều tồn tại thực tế và có kích thước hợp lệ trên đĩa cứng.
- [ ] **Kiểm tra Onboarding & Debounce:**
  - Tuổi < 18 bị chặn.
  - Tên trùng rung lắc đỏ & hiện 3 gợi ý; tên hợp lệ sáng nút vàng đồng.
- [ ] **Kiểm tra Camera Kép:** Chuyển đổi TPS sang FPS mượt mà trong 0.3s. Ở FPS ẩn đầu/mũ nhân vật, hiện Viewfinder HUD.
- [ ] **Hiệu năng:** Duy trì 60 FPS ổn định trên màn hình Full HD, không rò rỉ bộ nhớ (Memory Leak) khi dạo chơi qua 4 phân khu.

---
*Bản tài liệu đặc tả này là pháp lệnh kỹ thuật cao nhất cho toàn bộ đội ngũ Game Studio.*
