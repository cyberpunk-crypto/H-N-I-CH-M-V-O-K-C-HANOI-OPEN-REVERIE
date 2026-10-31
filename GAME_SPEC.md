# HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
## TÀI LIỆU KIẾN TRÚC KỸ THUẬT & ĐẶC TẢ HỆ THỐNG TOÀN DIỆN (GAME SPECIFICATION)

---

> **Mã dự án:** `HANOI-OPEN-REVERIE-3D`  
> **Phiên bản tài liệu:** `3.1.0-FIX-LOCOMOTION-AND-DISTINCT-CHARACTERS`  
> **Phê duyệt:** Sếp Tổng Game Studio & Hội đồng Kiến trúc sư Trưởng  
> **Ngày ban hành:** 31/10/2026  
> **Áp dụng cho 4 Mũi nhọn sản xuất song song:**  
> 1. `coder-chinh` (Core Logic 3D Engine, GTA V Locomotion Physics, Camera & Systems)  
> 2. `ui-polish` (Giao diện người dùng, Onboarding, Viewfinder HUD, Modals & Styling)  
> 3. `animation-master` (Hoạt họa chuyển động 3D Skeletal MoCap & Procedural 60 FPS trong `animations.js`)  
> 4. `nano-banana` (Họa sĩ Textures PBR, 3D Assets, UI Art, Audio)  
> & Khâu Kiểm duyệt độc lập: `kiem-duyet-qa`.

---

## 1. TỔNG QUAN DỰ ÁN & TẦM NHÌN KỸ THUẬT

### 1.1. Tầm nhìn nghệ thuật và trải nghiệm
**HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)** là tựa game thế giới mở 3D không gian hoài niệm Hà Nội (Thập niên 80-90 giao thoa đương đại) vận hành mượt mà trên trình duyệt Web (WebGL / WebGL2). 

Người chơi hóa thân thành một "Kẻ Mộng Mơ" dạo bước qua 4 phân khu đặc trưng của thủ đô (Hồ Gươm & Tháp Rùa, Mê cung Phố Cổ & Cà phê Đường Tàu, Nhịp Cầu Long Biên dầm thép Eiffel, Khu Tập Thể Cũ chuồng cọp hoàng hôn), trải nghiệm cơ chế điều khiển di chuyển nhân vật chân thực chuẩn mực AAA (GTA V Locomotion Physics), sử dụng chiếc máy ảnh cơ film 35mm để căn góc nhìn giải mã những "Giao điểm thị giác" (Perspective Alignment) ẩn giấu trong kiến trúc, hồi sinh những lát cắt ký ức ngưng đọng của thời gian.

### 1.2. Tech Stack & Nền tảng
- **Engine 3D Core:** `Three.js` (r160+) chạy trực tiếp trên WebGL / WebGL2 context.
- **Hệ thống điều khiển nhân vật:** GTA V-style Locomotion Physics với Quaternion Slerp turning, **triệt tiêu 100% lỗi đi ngược (Moonwalking) qua góc bù trừ + Math.PI**, quán tính khối lượng (Inertia Acceleration & Braking), cơ chế khử nổi chân (Foot Ground Snapping) và **Va chạm ngang Capsule Horizontal Collision chống xuyên thủng lan can cầu**.
- **Vị trí xuất phát & Camera khởi đầu:** Xuất phát tại tọa độ vàng `(16.5, 0.5, -16.5)` ven bờ Hồ Gươm, góc quay camera mở màn `yaw = 0.785 rad` (45 độ) hướng thẳng dọc tim Cầu Thê Húc.
- **Mô hình nhân vật:** Cơ chế tách biệt 4 nhân vật Việt Nam độc bản thật sự (Áo dài trắng nữ sinh, Áo bà ba hồng sen, Suit xám than nam trí thức, Áo dài gấm ngũ thân nam Thăng Long) có Rigging phân cấp 17 khớp và vật liệu PBR Shading chất lượng cao. **Tuyệt đối loại bỏ vĩnh viễn 100% billboard/plane 2D trên người chơi!**
- **Hoạt họa (Animation):** Hệ thống Skeletal MoCap AnimationMixer kết hợp Procedural Kinematics 60 FPS trong `src/core/animations.js`, thực hiện Cross-fade Blending mượt mà giữa Idle (thở tự nhiên, chuyển trọng tâm), Walk (sải bước cắm gót nhấc mũi, vung tay ngược pha), Run (sprint lean 10-12 độ, vung tay góc 90 độ).
- **Kiến trúc mã nguồn:** Vanilla JavaScript (ES6+ ES Modules), mô hình phân rã Decoupled Architecture hướng sự kiện (`EventBus`), không phụ thuộc build tooling nặng nề.
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
│   │   ├── PlayerController.js    # [coder-chinh] GTA V Locomotion Physics: Slerp (+Math.PI), Capsule Railing Snap
│   │   ├── CharacterFactory.js    # [coder-chinh] True 3D Humanoid Mesh 4 Nhân Vật Tách Biệt Độc Bản
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
  startWorldEngine: () => {}
};
```

---

### 3.5. Đặc Tả API Kết Nối Nội Bộ Giữa Các Module Core (`CharacterFactory` <-> `PlayerController` <-> `animations.js`)

Để đảm bảo `coder-chinh` và `animation-master` phối hợp nhịp nhàng, hợp đồng gọi hàm nội bộ được quy định bất biến như sau:

#### 1. Hợp đồng `CharacterFactory.js`:
- `createHanoiCharacter3D(characterId, options = {})`:
  * Trả về: `THREE.Group` (`characterGroup`), chứa:
    - `characterGroup.rig`: Ánh xạ 17 khớp xương (`pelvis`, `torso`, `chest`, `neck`, `head`, `leftShoulder`, `leftUpperArm`, `leftElbow`, `leftLowerArm`, `leftHand`, `rightShoulder`, `rightUpperArm`, `rightElbow`, `rightLowerArm`, `rightHand`, `leftHip`, `leftUpperLeg`, `leftKnee`, `leftLowerLeg`, `leftFoot`, `rightHip`, `rightUpperLeg`, `rightKnee`, `rightLowerLeg`, `rightFoot`, `frontFlapGroup`, `backFlapGroup`, `nonLaGroup`).
    - `characterGroup.characterMeta`: Metadata độc bản của nhân vật (tên, vai trò, kích thước tỷ lệ).
    - `characterGroup.modelFacingOffset`: Giá trị góc bù trừ hướng mặt mô hình (mặc định `= Math.PI` để triệt tiêu lỗi Moonwalking).
    - `characterGroup.isSkinnedMesh`: Boolean (`false` cho Procedural 3D Rigged Mesh, `true` cho GLTF/GLB SkinnedMesh).
- `loadSkinnedMeshCharacter(gltfUrl, options = {})`:
  * Nạp file GLTF/GLB SkinnedMesh (Michelle.glb, Soldier.glb, Xbot.glb), tối ưu bones hierarchy và trả về chuẩn tương thích `characterGroup`.

#### 2. Hợp đồng `PlayerController.js`:
- `setCharacter(characterId)`: Hoán đổi nhân vật, dọn dẹp bộ nhớ cũ (`dispose`), khởi tạo `HumanoidAnimator` mới.
- `update(delta, camera)`:
  1. Đọc WASD và tính vector hướng di chuyển phẳng theo góc quay camera (`camForward`, `camRight`).
  2. Áp dụng gia tốc GTA V (Acceleration `accel = 18.0` khi di chuyển, Braking `brake = 22.0` khi nhả phím).
  3. **Xoay hướng mặt nhân vật bằng Quaternion Slerp với góc bù trừ chuẩn: `targetAngle = Math.atan2(finalDir.x, finalDir.z) + Math.PI` (khắc phục hoàn toàn lỗi Moonwalking).**
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
- **Điểm xuất phát vàng của Người Chơi:** Tọa độ chính xác `(16.5, 0.5, -16.5)` ngay sát chân Cầu Thê Húc.
- **Hệ thống Cầu Thê Húc:**
  - Dốc thoải tiếp cận nhẹ nhàng (Gentle Approach Ramp) chuyển tiếp từ mặt vỉa hè (`y = 0.15m`) lên sàn chân cầu (`y = 0.95m`), độ dốc < 12%, không gờ vấp.
  - Thân cầu 15 nhịp cong màu đỏ son dẫn vào Đền Ngọc Sơn & Đắc Nguyệt Lâu với hàng cây đa và liễu rủ ven hồ đung đưa theo gió.
  - Lan can sơn son cong mềm mại được bảo vệ bởi Capsule Horizontal Collision chống xuyên thủng.
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

## 5. HỆ THỐNG CAMERA KÉP & GÓC QUAY MỞ MÀN ĐIỆN ẢNH (INITIAL CINEMATIC CAMERA)

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

### 5.1. Thiết Lập Vị Trí Xuất Phát & Camera Ban Đầu Chuẩn Mực
- **Tọa độ xuất phát người chơi:** `(x = 16.5, y = 0.5, z = -16.5)`.
- **Góc quay Camera mở màn (Initial Camera Orientation):**
  * **Góc quay ngang (Yaw):** Đúng chuẩn `0.785 rad` (45 độ).
  * **Góc chúc xuống (Pitch):** Đúng chuẩn `0.26 rad` (15 độ).
  * **Khoảng cách Spring-Arm:** `4.5 mét` sau lưng nhân vật.
  * **Khung cảnh mở màn:** Ngay khi vào game, camera hướng thẳng dọc theo tim Cầu Thê Húc đỏ son, nhìn về Đắc Nguyệt Lâu và Đền Ngọc Sơn với làn sương mờ ảo trên mặt nước Hồ Gươm, tạo cảm giác choáng ngợp và hoài niệm đậm chất điện ảnh.

### 5.2. Chế độ TPS & FPS
- **TPS:** Spring-Arm Boom 4.5m, Damping mượt mà `lerp factor = 0.08`, Raycast chống xuyên tường tối thiểu 0.8m.
- **FPS:** Lerp mượt mà trong 0.3 giây về tọa độ mắt người (`y = 1.65m`), FOV 45 độ (tiêu cự 50mm cổ điển), tự động gán `playerMesh.visible = false`.

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
   - Cho phép chọn 1 trong 4 nhân vật 3D Việt Nam độc bản.

---

## 8. ĐẶC TẢ CƠ CHẾ TÁCH BIỆT 4 NHÂN VẬT THẬT SỰ (DISTINCT 4 CHARACTERS)

> **MỆNH LỆNH TỪ SẾP TỔNG:**  
> *"Tuyệt đối không được dùng một mô hình chung rồi đổi màu qua loa! Phải tách biệt rõ ràng 4 nhân vật: từ phom dáng nhân trắc học, trang phục may đo 3D, phụ kiện đội đầu, đến dáng điệu cử chỉ."*

```
               4 NHÂN VẬT 3D VIỆT NAM ĐỘC BẢN HOÀN TOÀN:
  [char_nu_sinh_ao_dai]       [char_co_gai_ao_ba_ba]
   • Nữ sinh Tràng An          • Cô gái Phố thị
   • Áo dài trắng tinh khôi    • Áo bà ba hồng cánh sen
   • Quần lụa trắng suông      • Quần lụa đen bóng
   • Nón lá lụa hồng           • Khăn rằn + Nón lá sau lưng
  -----------------------------------------------------------
  [char_nam_tri_thuc_suit]    [char_nam_ao_dai_gam]
   • Nam trí thức Hà Nội       • Chàng trai Thăng Long
   • Suit xám than / navy      • Áo dài gấm xanh hoàng gia
   • Sơ mi trắng + Cà vạt      • Ngũ thân khuy ngọc bích
   • Giày da Oxford cổ điển    • Khăn xếp truyền thống
```

### 8.1. Chi Tiết Thiết Kế Tách Biệt Từng Nhân Vật

#### 1. `char_nu_sinh_ao_dai`: Nữ Sinh Tràng An • Áo Dài Trắng Nón Lá
- **Phom dáng:** Nữ thanh mảnh, e ấp (chiều cao `1.68m`, vòng eo thon `radius = 0.16m`).
- **Thân áo dài 3D:** Lụa tơ tằm trắng tinh khôi (`color: 0xfcfdfd, roughness: 0.35, sheen: 0.8`), cổ áo trụ cao 3cm truyền thống ôm khít cổ.
- **Tà áo dài 3D đa phân đoạn (Multi-segment 3D Flaps):**
  * Tà trước (`frontFlapGroup`): Rủ dài qua đầu gối (`y = -0.15m` đến `-0.85m`), đung đưa mềm mại theo bước chân.
  * Tà sau (`backFlapGroup`): Rủ chấm bắp chân, uốn lượn bay bổng theo gió hồ Gươm.
- **Quần lụa trắng 3D:** Ống suông rộng màu trắng ngà (`color: 0xf2f2f4`) che phủ nhẹ lên cổ guốc mộc.
- **Nón lá bài thơ 3D:** Chóp nón `ConeGeometry(0.28, 0.16, 36)` đan nan tre vàng óng, viền vành nón uốn cong nhẹ nhàng, quai nón bằng lụa hồng cánh sen buông nhẹ dưới cằm.

#### 2. `char_co_gai_ao_ba_ba`: Cô Gái Phố Thị • Áo Bà Ba Hồng Sen Khăn Rằn
- **Phom dáng:** Nữ năng động, đôn hậu, tháo vát (chiều cao `1.65m`, vai ngang vừa vặn `0.38m`).
- **Áo bà ba 3D:** Màu hồng cánh sen ngọt ngào (`color: 0xdf648a, roughness: 0.65`), cổ tròn xẻ ngực cúc cài giữa, vạt áo xẻ hai bên hông đặc trưng.
- **Khăn rằn 3D:** Khăn rằn caro đen trắng dệt thủ công uốn lượn hình học (`TubeGeometry` hoặc `TorusGeometry`) vắt chéo qua vai trái và rủ trước ngực.
- **Quần lụa đen 3D:** Quần lụa đen tuyền (`color: 0x181818, roughness: 0.50`) bóng mờ, ống rộng tạo dáng bước chân nhanh nhẹn.
- **Nón lá sau lưng:** Chiếc nón lá tre máng sau lưng thanh thoát bởi quai đeo chéo ngực.

#### 3. `char_nam_tri_thuc_suit`: Nam Trí Thức Hà Nội • Âu Phục Suit Lịch Lãm
- **Phom dáng:** Nam cao ráo, vai rộng đĩnh đạc (chiều cao `1.78m`, bờ vai `0.44m`, ngực nở).
- **Bộ Suit Jacket 3D:** Màu xám than cổ điển hoặc xanh blazer navy (`color: 0x242830, roughness: 0.60`), ve áo chữ V (Notch Lapel) dựng khối 3D sắc nét ôm sát cổ áo.
- **Áo sơ mi & Cà vạt 3D:** Áo sơ mi trắng tinh cắm thùng phẳng phiu, cà vạt màu đỏ mận hoặc xanh thẫm vát nhọn trước ngực.
- **Quần âu 3D:** Quần tây âu xếp ly thẳng thớm, ống đứng chấm mu bàn chân.
- **Giày da Oxford cổ điển 3D:** Giày tây da đen bóng loáng mũi nhọn (`metalness: 0.25, roughness: 0.28`).

#### 4. `char_nam_ao_dai_gam`: Chàng Trai Thăng Long • Áo Dài Gấm Xanh Hoàng Gia
- **Phom dáng:** Nam thư sinh nho nhã, mực thước cốt cách Tràng An (chiều cao `1.76m`).
- **Áo dài ngũ thân 3D:** Gấm dệt hoa văn cổ màu xanh lam hoàng gia (`color: 0x19376d, roughness: 0.42, metalness: 0.15`), hàng 5 chiếc khuy cài ngọc bích bên ngực phải.
- **Tà áo nam rộng rãi:** Thân áo buông thẳng dài qua đầu gối, tà áo khẽ bay nhẹ uy nghiêm khi dạo bước.
- **Quần âu trắng 3D:** Ống quần đứng dáng màu trắng ngà.
- **Khăn xếp truyền thống 3D:** Khăn xếp quấn nhiều nếp màu đen hoặc xanh thẫm đội đầu trang nghiêm.

---

## 9. ĐẶC TẢ TRUE 3D HUMANOID LOCOMOTION SYSTEM CHUẨN GTA V & SỬA LỖI MOONWALKING

### 9.1. Sửa Triệt Để Lỗi Đi Ngược (Moonwalking Fix via + Math.PI Offset)
- **Bản chất kỹ thuật:** Trong Three.js, khi mô hình nhân vật 3D được thiết kế với mặt tiền hướng trục `-Z` (chuẩn quốc tế của Blender/Mixamo), việc tính toán góc quay mặt theo vector di chuyển `Math.atan2(finalDir.x, finalDir.z)` sẽ khiến nhân vật quay lưng (+Z) về phía trước khi bấm phím `W`, tạo ra hiện tượng "Moonwalking" (chân bước tiến nhưng mặt quay ngược lại).
- **Quy định công thức chuẩn bất biến:**
  ```javascript
  // Góc quay mục tiêu luôn cộng góc bù trừ modelFacingOffset (+ Math.PI)
  const targetAngle = Math.atan2(finalDir.x, finalDir.z) + Math.PI;
  let angleDiff = targetAngle - characterGroup.rotation.y;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  const turnSpeed = isSprinting ? 14.0 : 11.0;
  characterGroup.rotation.y += angleDiff * Math.min(1.0, turnSpeed * delta);
  ```
- Kết quả: Khi bấm `W` tiến lên, nhân vật quay mặt 100% về phía trước; khi bấm `A`/`D`, nhân vật rẽ trái/phải mượt mà theo đúng hướng di chuyển.

### 9.2. Cơ Chế Va Chạm Ngang Capsule Chống Xuyên Thủng Lan Can Cầu (Capsule Horizontal Collision)
- **Vấn đề trên Cầu Thê Húc & Cầu Kim Quy:** Thân cầu cong hình cầu vồng với lan can gỗ uốn lượn. Nếu chỉ dùng raycast dọc tâm hoặc bounding box phẳng, người chơi chạy chéo hoặc trượt dọc thành cầu sẽ bị xuyên thủng lan can rơi xuống nước.
- **Giải pháp Capsule Horizontal Collision:**
  1. **Hình trụ Capsule người chơi:** Bán kính quét `radius = 0.35m`, hai tâm cầu tại chân (`y = 0.35m`) và ngực (`y = 1.10m`).
  2. **Kẹp vị trí đường cong (Bridge Arc Clamping):**
     * Khoảng cách đến tim cầu Thê Húc được tính theo phương trình hình chiếu đoạn thẳng `getTheHucBridgeInfo(x, y, z)`.
     * Giới hạn nửa bề rộng mặt cầu an toàn: `maxBridgeOffset = 1.25m`.
     * Khi khoảng cách ngang từ nhân vật đến tim cầu vượt quá `maxBridgeOffset - radius` (~0.90m), cơ chế tự động:
       + Kẹp vị trí nhân vật không vượt qua mép lan can: `pos = centerPoint + clamp(offset, -0.90, 0.90) * normalVec`.
       + Triệt tiêu thành phần vận tốc vuông góc với lan can: `velocity.projectOnVector(tangentVec)`.
       + Nhân vật trượt êm ái dọc theo lan can cầu mà không bao giờ xuyên thủng rơi xuống nước.

### 9.3. Gia Tốc Khối Lượng & Khử Nổi Chân
- **Gia tốc có quán tính thực tế:** Tăng tốc `accel = 18.0 m/s²`, hãm phanh `brake = 22.0 m/s²`. Dừng lại có bước đệm, không trượt băng.
- **Khử nổi chân (Foot Ground Snapping):** Bắn raycast 4.0m kiểm tra mặt đất, đưa bàn chân bám dính bề mặt dốc cầu Long Biên và Thê Húc, hỗ trợ vượt gờ thấp `stepUpHeight = 0.55m`.

### 9.4. Hoạt Họa Skeletal MoCap 60 FPS trong `animations.js`
- **Idle Breathing & Weight Shift:** Lồng ngực phập phồng chu kỳ 2.2s, vai nhấp nhô nhẹ, chuyển trọng tâm chân sau mỗi 4-6s; tà áo dài trước/sau và nón lá lay động trước gió hồ Gươm.
- **Walk Cycle:** Cắm gót nhấc mũi (Heel Strike to Toe Off), vung tay ngược pha triệt tiêu xoắn thân, nhún trọng tâm `0.035m`.
- **Run Cycle:** Sải chân dài, sprint lean nghiêng thân mình về trước 10-12 độ (`0.18 rad`), cánh tay gập góc nhọn ~90 độ.
- **Cross-Fade Blending:** Thuật toán làm mờ chuyển trạng thái trong `0.2s - 0.3s` triệt tiêu hoàn toàn giật cục/snapping.

---

## 10. BẢO TOÀN TUYỆT ĐỐI 100% 9 NPC LỊCH SỬ TRONG `WorldManager.js`

> **LỆNH TỪ SẾP TỔNG:**  
> *"Và các NPC giữ nguyên cho tôi, tôi không yêu cầu đổi NPC, tôi chỉ cần đổi nhân vật người chơi game thôi!"*

Toàn bộ 9 NPC lịch sử cùng các điểm tương tác môi trường trong [src/core/WorldManager.js](file:///d:/H%C3%80%20N%E1%BB%98I%20CH%E1%BA%A0M%20V%C3%80O%20K%C3%9D%20%E1%BB%A8C%20,HANOI%20OPEN%20REVERIE/src/core/WorldManager.js) được bảo toàn nguyên vẹn 100%, không bị sửa đổi hay xóa bỏ:

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

## 11. PHÂN CHIA NHIỆM VỤ CHO 4 MŨI NHỌN SẢN XUẤT

| Mũi Nhọn | Phân Vùng File Đảm Trách | Nhiệm Vụ Kỹ Thuật Trọng Tâm | Tiêu Chuẩn Nghiệm Thu |
| :--- | :--- | :--- | :--- |
| **Coder Chính**<br>(`coder-chinh`) | `src/core/*`<br>(trừ animations.js)<br>`src/bridge/*` | 1. Sửa lỗi Moonwalking qua `targetAngle + Math.PI` trong `PlayerController.js`.<br>2. Xây dựng Capsule Horizontal Collision chống xuyên lan can Cầu Thê Húc/Kim Quy.<br>3. Đặt Spawn Position `(16.5, 0.5, -16.5)` và Camera `yaw = 0.785 rad`.<br>4. Tạo 4 mô hình 3D Việt Nam tách biệt độc bản trong `CharacterFactory.js`.<br>5. BẢO TOÀN TUYỆT ĐỐI 100% 9 NPC lịch sử trong `WorldManager.js`. | Di chuyển chuẩn GTA V, mặt hướng đúng chiều tiến, không rơi khỏi cầu, 60 FPS mượt mà. |
| **Animation Master**<br>(`animation-master`) | `src/core/animations.js` | 1. Tối ưu hóa chu kỳ Walk Cycle, Run Cycle, Idle Breathing 60 FPS.<br>2. Đảm bảo hoạt ảnh vung tay vung chân đồng bộ hoàn hảo với hướng tiến không bị đảo pha.<br>3. Cross-fade Blending 0.2s - 0.3s triệt tiêu giật cục.<br>4. Uốn lượn tà áo dài 3D và nón lá bay theo gió hồ Gươm. | Chuyển động sinh học tự nhiên chuẩn AAA, không giật khung hình, hòa quyện nhịp nhàng với vật lý di chuyển WASD. |
| **UI Polish**<br>(`ui-polish`) | `src/ui/*`<br>`styles/*`<br>`index.html` | 1. Thiết kế Onboarding 3 bước (Age Gate 18+, Login, Character Creator).<br>2. Viết logic Debounce 500ms check tên kèm rung lắc đỏ và 3 tên gợi ý.<br>3. Xây dựng giao diện chọn 4 nhân vật 3D Việt Nam độc bản.<br>4. Xây dựng Viewfinder HUD máy ảnh film, Scrapbook Album dán tem, Modal đối thoại 9 NPC.<br>5. Bắt và bắn đúng chuẩn 100% các sự kiện EventBus. | Giao diện hoài niệm sang trọng, responsive mọi độ phân giải, không lỗi console, ăn khớp hoàn toàn với Core. |
| **Họa Sĩ**<br>(`nano-banana`) | `assets/textures/*`<br>`assets/models/*`<br>`assets/ui/*`<br>`assets/photos/*`<br>`assets/audio/*` | 1. Cung cấp đầy đủ Textures PBR (nước Hồ Gươm, rêu Tháp Rùa, tường vôi vàng, thép cầu, giàn hoa giấy).<br>2. Cung cấp 3D models GLTF SkinnedMesh (Michelle.glb, Soldier.glb, Xbot.glb).<br>3. Cung cấp UI Assets (khung ngắm, nút shutter kim loại, tem bưu chính Hà Nội, vé tàu).<br>4. Cung cấp 4 ảnh film ký ức và bộ âm thanh ambient hồ Gươm, còi tàu, tiếng màn trập cơ học. | Tất cả tài nguyên tồn tại thực tế trên đĩa cứng, đúng kích thước, không một đường link nào bị lỗi 404. |

---

## 12. DANH SÁCH TÀI NGUYÊN (ASSET REQUIREMENTS)

### 12.1. Mô Hình 3D Nhân Vật SkinnedMesh (`assets/models/`)
1. `Michelle.glb`: Nhân vật nữ thể thao hiện đại, đầy đủ khung xương Mixamo tiêu chuẩn.
2. `Soldier.glb`: Nhân vật nam mạnh mẽ kiên định.
3. `Xbot.glb`: Mô hình tham chiếu chuyển động chuẩn Motion Capture.

### 12.2. Textures Môi Trường & Nhân Vật 3D (`assets/textures/`)
1. `lake_water_norm.jpg`: Normal map mặt nước Hồ Gươm gợn sóng lăn tăn (512x512 Seamless).
2. `turtle_tower_moss.jpg`: Texture đá phủ rêu xanh cổ kính của Tháp Rùa và Đền Ngọc Sơn (1024x1024).
3. `old_wall_yellow.jpg`: Vôi quét tường màu vàng hoàng cúc bong tróc loang lổ (1024x1024).
4. `rusty_iron_beam.jpg`: Bề mặt dầm thép rỉ sét màu nâu cánh gián cầu Long Biên (1024x1024).
5. `hanoi_brick_ground.jpg`: Đá xanh lát vỉa hè và gạch chỉ vỉa hè phố cổ ẩm ướt (1024x1024).
6. `vintage_posters.jpg`: Bản ghép các áp phích cổ, biểu ngữ văn hóa thập niên 80-90 (1024x1024).
7. `wood_counter_varnish.jpg`: Mặt gỗ lim đánh vec-ni cánh gián bóng loáng viền đồng (1024x1024).
8. `bridge_ramp_stone.jpg`: Bề mặt bê tông đá dăm khía rãnh chống trượt dốc dẫn cầu Long Biên (1024x1024).
9. `bougainvillea_blossom.png`: Giàn hoa giấy đỏ hồng rực rỡ buông rủ (PNG trong suốt).

### 12.3. UI Elements & Biểu Tượng (`assets/ui/`)
1. `viewfinder_frame.png`: Khung viền quang học máy ảnh cơ 35mm kèm vạch đo sáng và thước tiêu cự.
2. `shutter_button.png`: Nút chụp máy ảnh kim loại vân tròn cổ điển.
3. `stamp_hanoi.png`: Con tem bưu chính xưa in hình chùa Một Cột và Tháp Rùa mép răng cưa.
4. `logo_reverie.png`: Logo chữ thư pháp hoài niệm "Hà Nội: Chạm Vào Ký Ức" viền vàng đồng.
5. `train_ticket_retro.png`: Tấm vé tàu hỏa giấy nâu mộc mạc Hà Nội - Hải Phòng xưa.

### 12.4. Bộ Ký Ức & Ảnh Film Hoàn Chỉnh (`assets/photos/`)
1. `memory_turtle_mist.jpg`: Ảnh film Tháp Rùa huyền ảo trong màn sương chớm đông.
2. `memory_train_street.jpg`: Đoàn tàu hỏa chạy lướt sát những mái ngói rêu phong phố Phùng Hưng.
3. `memory_long_bien.jpg`: Dầm thép cầu Long Biên nhuộm đỏ trong ánh hoàng hôn sông Hồng.
4. `memory_apartment.jpg`: Ban công khu tập thể cũ với lồng chuồng cọp và giàn hoa giấy rực cháy.

### 12.5. Âm Thanh Môi Trường & Hiệu Ứng (`assets/audio/`)
1. `ambient_lake.mp3`: Tiếng sóng hồ vỗ bờ đá nhẹ, gió rặng liễu, tiếng chuông chùa xa xăm.
2. `ambient_train.mp3`: Tiếng còi tàu hơi nước vang vọng trong ngõ hẹp, tiếng rít kim loại đường ray.
3. `ambient_street.mp3`: Tiếng ve râm ran trưa hè, tiếng rao hàng rong bánh khúc/xôi lạc.
4. `shutter_click.mp3`: Tiếng chớp màn trập cơ học kim loại đanh thép của máy ảnh cơ Leica M3.
5. `photo_develop.mp3`: Tiếng lật tráng giấy ảnh và tiếng nước chảy trong phòng tối tráng phim.

---

## 13. TIÊU CHUẨN KIỂM DUYỆT CHẤT LƯỢNG (QA CHECKLIST)

Trước khi nghiệm thu dự án đạt mức độ "PASSED 100%", subagent `kiem-duyet-qa` phải kiểm tra lần lượt các tiêu chí:

- [ ] **Kiểm tra phân vùng file:** Không có file nào của `coder-chinh` bị ghi đè bởi `ui-polish` hay `animation-master` và ngược lại.
- [ ] **Khâu kiểm duyệt API & Events:** Mọi sự kiện phát ra từ `GameEventBus` và mọi hàm trong `GameAPI` đều trùng khớp 100% từng chữ hoa chữ thường với mục 3 của tài liệu này.
- [ ] **Khâu kiểm duyệt Moonwalking Fix:**
  - Bấm `W`: Nhân vật tiến về phía trước và mặt nhìn thẳng vào hướng tiến, không bị đi lùi hoặc quay lưng vào màn hình.
  - Bấm `A`/`D`: Nhân vật xoay mượt mà đúng hướng rẽ.
- [ ] **Khâu kiểm duyệt Tách Biệt 4 Nhân Vật Thật Sự:**
  - `char_nu_sinh_ao_dai`: Áo dài trắng lụa, quần lụa trắng, nón lá bài thơ.
  - `char_co_gai_ao_ba_ba`: Áo bà ba hồng sen, quần lụa đen, khăn rằn caro vắt vai.
  - `char_nam_tri_thuc_suit`: Suit xám than/navy ve áo nổi, sơ mi trắng, giày tây oxford.
  - `char_nam_ao_dai_gam`: Áo dài gấm xanh ngũ thân khuy ngọc bích, quần âu trắng, khăn xếp.
- [ ] **Khâu kiểm duyệt Lan Can & Điểm Xuất Phát:**
  - Spawn tại tọa độ `(16.5, 0.5, -16.5)`.
  - Camera ban đầu có `yaw = 0.785 rad` (45 độ) hướng dọc Cầu Thê Húc.
  - Chạy dọc Cầu Thê Húc/Kim Quy không bao giờ bị xuyên thủng lan can rơi xuống nước (Capsule Clamping).
- [ ] **Bảo toàn 100% 9 NPC lịch sử trong `WorldManager.js`:**
  - Đầy đủ 9 NPC: Bác Hùng bán bánh mì dạo xe đạp Thống Nhất, Chị Lan gánh hoa, Bà cụ quán trà đá, Hai cụ già đánh cờ, Bác dân dạo bộ, Thanh niên cà phê đường tàu, Thầy lang Lãn Ông, Cô Mai thợ may lụa, Bác Cả Phở 1954; kèm các tương tác quán bia hơi, tiệm đồng hồ, tiệm cắt tóc và đàn cá chép hồ Gươm.
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
