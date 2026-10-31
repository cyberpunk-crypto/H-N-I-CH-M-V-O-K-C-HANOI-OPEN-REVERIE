# HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
## TÀI LIỆU KIẾN TRÚC KỸ THUẬT & ĐẶC TẢ HỆ THỐNG TOÀN DIỆN (GAME SPECIFICATION)

---

> **Mã dự án:** `HANOI-OPEN-REVERIE-3D`  
> **Phiên bản tài liệu:** `3.0.0-GTA5-LOCOMOTION-SPEC`  
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
- **Hệ thống điều khiển nhân vật:** GTA V-style Locomotion Physics với Quaternion Slerp turning, quán tính khối lượng (Inertia Acceleration & Braking), cơ chế khử nổi chân (Foot Ground Snapping) và Continuous Collision Sub-stepping chống kẹt.
- **Mô hình nhân vật:** Hybrid System: Hỗ trợ 3D SkinnedMesh tiêu chuẩn Mixamo (GLTF/GLB) kết hợp Mô hình người 3D thủ công truyền thống 4 nhân vật Việt Nam có Rigging phân cấp 17 khớp (Áo dài lụa 3D, Nón lá 3D, Áo bà ba 3D, Suit 3D). **Tuyệt đối loại bỏ vĩnh viễn 100% billboard/plane 2D trên nhân vật người chơi!**
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
│   │   ├── PlayerController.js    # [coder-chinh] GTA V Locomotion Physics: Slerp turning, Braking, Snap
│   │   ├── CharacterFactory.js    # [coder-chinh] True 3D Humanoid Mesh & GLTF SkinnedMesh Hybrid Loader
│   │   ├── animations.js          # [animation-master] 3D Skeletal Animation System & MoCap Mixer 60 FPS
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
    - `characterGroup.isSkinnedMesh`: Boolean (`false` cho Procedural 3D Rigged Mesh, `true` cho GLTF/GLB SkinnedMesh).
    - `characterGroup.mixer`: `THREE.AnimationMixer` (nếu là SkinnedMesh) hoặc `null`.
    - `characterGroup.clips`: `Map<string, THREE.AnimationClip>` (MoCap clips `idle`, `walk`, `run`).
- `loadSkinnedMeshCharacter(gltfUrl, options = {})`:
  * Nạp file GLTF/GLB SkinnedMesh (Michelle.glb, Soldier.glb, Xbot.glb), tối ưu bones hierarchy và trả về chuẩn tương thích `characterGroup`.

#### 2. Hợp đồng `PlayerController.js`:
- `setCharacter(characterId)`: Hoán đổi nhân vật, dọn dẹp bộ nhớ cũ (`dispose`), khởi tạo `HumanoidAnimator` mới.
- `update(delta, camera)`:
  1. Đọc WASD và tính vector hướng di chuyển phẳng theo góc quay camera (`camForward`, `camRight`).
  2. Áp dụng gia tốc GTA V (Acceleration `accel = 18.0` khi di chuyển, Braking `brake = 22.0` khi nhả phím).
  3. Xoay hướng mặt nhân vật bằng Quaternion Slerp / Angular Dampening (`turnSpeed = 11.0 - 14.0`).
  4. Bắn raycast 4.0m kiểm tra độ cao mặt đất (`groundHits`) và căn chỉnh khử nổi chân (Step-Up Ground Snapping).
  5. Gọi `this.humanoidAnimator.update(delta, moveSpeed, this.isGrounded, groundSlopeAngle)`.

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

## 8. ĐẶC TẢ KIẾN TRÚC MÔ HÌNH NGƯỜI 3D THẬT SỰ & SKINNEDMESH HYBRID

> **CHỈ THỊ CAO NHẤT TỪ SẾP TỔNG:**  
> *"Loại bỏ vĩnh viễn 100% các mặt phẳng 2D billboard/plane trên người chơi. Hỗ trợ mô hình 3D SkinnedMesh tiêu chuẩn Mixamo (GLTF/GLB) kết hợp mô hình 3D thủ công truyền thống 4 nhân vật Việt Nam điêu khắc khối 3D PBR có khung xương phân cấp hoàn chỉnh!"*

### 8.1. Hỗ Trợ Mô Hình 3D SkinnedMesh (GLTF/GLB Mixamo Tiêu Chuẩn)
- **Định dạng file:** Binary GLTF (`.glb`) hoặc `.gltf` kèm buffers.
- **Tiêu chuẩn Rigging:** Skeleton Mixamo tiêu chuẩn quốc tế (`mixamorig:Hips`, `Spine`, `Spine1`, `Spine2`, `Neck`, `Head`, `LeftShoulder`, `LeftArm`, `LeftForeArm`, `LeftHand`, `RightShoulder`, `RightArm`, `RightForeArm`, `RightHand`, `LeftUpLeg`, `LeftLeg`, `LeftFoot`, `LeftToeBase`, `RightUpLeg`, `RightLeg`, `RightFoot`, `RightToeBase`).
- **Danh sách models hỗ trợ:**
  * `assets/models/Michelle.glb`: Nhân vật nữ thể thao hiện đại.
  * `assets/models/Soldier.glb`: Nhân vật nam mạnh mẽ kiên định.
  * `assets/models/Xbot.glb`: Mô hình tham chiếu chuyển động chuẩn Motion Capture.

### 8.2. Hệ Thống 4 Nhân Vật Việt Nam Điêu Khắc Khối 3D Thủ Công (Procedural Rigged Mesh)
Mô hình được xây dựng từ các khối hình học hữu cơ 3D (`SphereGeometry`, `CylinderGeometry`, `CapsuleGeometry`, `CatmullRomCurve3`) với vật liệu PBR Shading chất lượng cao:

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

#### Chi tiết 4 nhân vật Việt Nam:
1. **`char_nu_sinh_ao_dai`: Nữ Sinh Tràng An • Áo Dài Trắng Nón Lá**
   - Thân áo dài lụa trắng 3D ôm sát eo thon thả (`color: 0xfcfdfd, roughness: 0.35, sheen: 0.8`).
   - Tà trước và tà sau 3D uốn lượn đa phân đoạn (`frontFlapGroup`, `backFlapGroup`), đung đưa mềm mại theo bước chân.
   - Nón lá 3D: Chóp nón `ConeGeometry(0.28, 0.16, 36)`, vành nón đan nan tre vàng óng, quai nón lụa hồng cánh sen.
2. **`char_co_gai_ao_ba_ba`: Cô Gái Phố Thị • Áo Bà Ba Hồng Cánh Sen Khăn Rằn**
   - Áo bà ba 3D hồng cánh sen dịu dàng (`color: 0xdf648a`), vạt áo xẻ hông đặc trưng.
   - Khăn rằn 3D: Khăn rằn caro đen trắng uốn cong vắt chéo qua vai.
   - Quần lụa đen 3D ống rộng (`color: 0x1a1a1a`), nón lá tre quai thao đeo sau lưng.
3. **`char_nam_tri_thuc_suit`: Trí Thức Hiện Đại • Âu Phục Vest Navy Lịch Lãm**
   - Bộ Suit Jacket 3D xanh navy (`color: 0x1e2e4a`), ve áo chữ V (Notch Lapel) dựng nổi ôm sát cổ.
   - Cà vạt 3D thanh lịch, sơ mi trắng cắm thùng, quần tây âu xếp ly thẳng thớm, giày oxford da bóng 3D.
4. **`char_nam_ao_dai_gam`: Quý Nam Hà Thành • Áo Dài Gấm Xanh Ngũ Thân**
   - Áo dài ngũ thân 3D gấm dệt hoa văn cổ màu xanh lam hoàng gia (`color: 0x1b3b6f`), khuy cài ngọc bích bên ngực phải.
   - Tà áo rộng rãi buông dài qua gối uy nghiêm đĩnh đạc, quần âu trắng 3D, khăn xếp quấn đầu 3D trang nghiêm.

---

## 9. ĐẶC TẢ TRUE 3D HUMANOID LOCOMOTION SYSTEM CHUẨN GTA V

> **YÊU CẦU TRẢI NGHIỆM ĐIỀU KHIỂN ĐỈNH CAO:**  
> Hệ thống di chuyển mô phỏng phong cách điều khiển của Grand Theft Auto V (GTA V) và Red Dead Redemption 2: Nhân vật có khối lượng vật lý, quán tính, chuyển hướng mềm mại và chân bám địa hình hoàn hảo.

### 9.1. Cơ Chế Điều Khiển Locomotion GTA V

#### 1. Xoay Hướng Mượt Mà Bằng Quaternion Slerp (Smooth Turning)
- Không quay tức thời (no snap turn). Khi người chơi đổi hướng di chuyển, thân người xoay dần về hướng mong muốn bằng nội suy góc mượt mà:
  ```javascript
  const targetAngle = Math.atan2(finalDir.x, finalDir.z);
  let angleDiff = targetAngle - characterGroup.rotation.y;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  const turnSpeed = isSprinting ? 14.0 : 11.0;
  characterGroup.rotation.y += angleDiff * Math.min(1.0, turnSpeed * delta);
  ```
- Thân trên nghiêng nhẹ vào khúc cua (Banking / Body Lean) tỷ lệ thuận với tốc độ xoay `angleDiff * 0.12`.

#### 2. Gia Tốc Khối Lượng & Quán Tính (Acceleration & Braking)
- Nhân vật có khối lượng biểu kiến:
  * **Tăng tốc (Acceleration):** Từ đứng yên lên đi bộ mất ~0.25 giây (`accel = 18.0 m/s²`). Khi sprint cần ~0.4 giây để đạt vận tốc tối đa 9.2 m/s.
  * **Hãm phanh (Deceleration / Braking):** Khi nhả phím, nhân vật bước thêm 1-2 bước hãm quán tính (`brake = 22.0 m/s²`), triệt tiêu hoàn toàn cảm giác trượt băng (no ice-skating).
  * **Trên không (In Air):** Lực cản giảm (`accel = 6.0`, `brake = 5.0`) mô phỏng đúng động học bay.

#### 3. Khử Nổi Chân & Bám Bề Mặt (Foot Ground Snapping)
- Khắc phục triệt để hiện tượng chân lơ lửng trên dốc cầu Long Biên (`y = 0.1m` đến `y = 4.2m`) và dốc cầu Thê Húc:
  * Bắn Raycast thẳng đứng từ cao độ thắt lưng (`y + 1.4m`) hướng xuống trục -Y với tầm quét `far = 4.0m`.
  * Khi tiếp xúc mặt đất:
    ```javascript
    if (groundHits.length > 0) {
      const groundY = groundHits[0].point.y;
      if (charPos.y + velocity.y * delta <= groundY + 0.08) {
        charPos.y = THREE.MathUtils.lerp(charPos.y, groundY, 0.4);
        velocity.y = 0;
        isGrounded = true;
      }
    }
    ```
  * **Cơ chế bước qua gờ thấp (Step-Up Height = 0.55m):** Không bị chặn bởi mép vỉa hè, gạch hoa hay mép ray tàu, tự động bước lên êm ái.

---

### 9.2. Cơ Chế Hoạt Họa MoCap AnimationMixer Clips & Procedural Kinematics

Module hoạt họa [src/core/animations.js](file:///d:/H%C3%80%20N%E1%BB%98I%20CH%E1%BA%A0M%20V%C3%80O%20K%C3%9D%20%E1%BB%A8C%20,HANOI%20OPEN%20REVERIE/src/core/animations.js) vận hành ở tần số 60 FPS chuẩn mực:

#### 1. Trạng Thái Đứng Yên Thở Tự Nhiên (Idle Breathing & Weight Shift)
- **Hít thở sinh học:** Chu kỳ `breathTime = time * 2.2`. Lồng ngực phập phồng co giãn `2.5%`, hai vai khẽ nhấp nhô `0.008m`.
- **Chuyển trọng tâm (Weight Shift):** Sau mỗi 4-6 giây, hông (`pelvis`) khẽ dồn trọng tâm sang một bên chân, đầu khẽ nghiêng e ấp.
- **Tà áo & Nón lá bay theo gió (Wind Cloth Dynamics):**
  * Tà trước: `frontFlap.rotation.x = Math.sin(time * 3.0) * 0.08 + Math.cos(time * 1.5) * 0.04`.
  * Tà sau: `backFlap.rotation.x = -Math.sin(time * 3.0 + 0.5) * 0.10`.
  * Nón lá: Khẽ lay động theo luồng gió hồ Gươm.

#### 2. Chu Kỳ Đi Bộ (Walk Cycle - Heel Strike to Toe Off)
- **Tần số sải bước:** `frequency = 6.2 rad/s`.
- **Cắm gót nhấc mũi:** Chân tiếp đất bằng gót chân, lăn qua bàn chân rồi nhấc mũi đẩy cơ thể về phía trước.
- **Đầu gối gập tự nhiên:** Khớp gối gập `0.55 rad` khi chân lăng về sau và duỗi thẳng khi cắm gót.
- **Vung tay ngược pha:** Tay trái vung cùng pha với chân phải, vai vung biên độ `-0.35` đến `+0.35 rad`, khuỷu tay khẽ chùng `0.20 rad`.
- **Độ nhún trọng tâm:** Trọng tâm hạ thấp khi hai chân dạng rộng và nâng cao khi một chân chống thẳng (`pelvis bobbing = 0.035m`).

#### 3. Chu Kỳ Chạy Nhanh (Run Cycle & Sprint Lean)
- **Tần số sải bước:** `frequency = 9.5 rad/s`.
- **Độ nghiêng thân mình (Sprint Lean):** Thân người đổ về phía trước một góc `0.18 rad` (~10-12 độ).
- **Cánh tay co góc nhọn:** Khuỷu tay gập góc nhọn ~90 độ (`0.85 rad`), vai đánh mạnh biên độ `0.65 rad`.
- **Sải chân dài:** Khớp háng xoay rộng `0.85 rad`, gối gập mạnh `1.15 rad` đưa gót chân sát mông khi tăng tốc.

#### 4. Chuyển Đổi Trạng Thái Mượt Mà (Cross-Fade Blending)
- Áp dụng thuật toán làm mờ chuyển trạng thái (Cross-fade Dampening) thời gian `0.2s - 0.3s`:
  `weight_idle`, `weight_walk`, `weight_run` được nội suy liên tục theo vận tốc thực tế của nhân vật, triệt tiêu hoàn toàn hiện tượng co giật (snapping).

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
| **Coder Chính**<br>(`coder-chinh`) | `src/core/*`<br>(trừ animations.js)<br>`src/bridge/*` | 1. Xây dựng GTA V Locomotion Physics (Quaternion Slerp, Acceleration, Braking, Foot Snapping) trong `PlayerController.js`.<br>2. Cung cấp Hybrid 3D Character Loader trong `CharacterFactory.js`.<br>3. BẢO TOÀN TUYỆT ĐỐI 100% 9 NPC lịch sử trong `WorldManager.js`.<br>4. Quản lý Game Loop, Camera Kép, Va chạm AABB và Canvas Shutter Capture.<br>5. Cung cấp API và EventBus bất biến. | Di chuyển mượt chuẩn GTA V, nhân vật 3D không trượt băng, không kẹt dốc cầu Long Biên, 60 FPS ổn định, zero 404. |
| **Animation Master**<br>(`animation-master`) | `src/core/animations.js` | 1. Lập trình module `animations.js` 60 FPS Zero-Allocation.<br>2. Xây dựng AnimationMixer MoCap Clips kết hợp Procedural Kinematics: Idle (thở, chuyển trọng tâm), Walk (cắm gót nhấc mũi, vung tay ngược pha), Run (sprint lean 10-12 độ).<br>3. Viết thuật toán Cross-fade Blending 0.2s - 0.3s triệt tiêu giật cục.<br>4. Uốn lượn tà áo dài 3D và nón lá bay theo gió hồ Gươm. | Chuyển động sinh học tự nhiên chuẩn AAA, không giật khung hình, hòa quyện nhịp nhàng với vật lý di chuyển WASD. |
| **UI Polish**<br>(`ui-polish`) | `src/ui/*`<br>`styles/*`<br>`index.html` | 1. Thiết kế Onboarding 3 bước (Age Gate 18+, Login, Character Creator).<br>2. Viết logic Debounce 500ms check tên kèm rung lắc đỏ và 3 tên gợi ý.<br>3. Xây dựng giao diện chọn 4 nhân vật 3D Việt Nam.<br>4. Xây dựng Viewfinder HUD máy ảnh film, Scrapbook Album dán tem, Modal đối thoại 9 NPC.<br>5. Bắt và bắn đúng chuẩn 100% các sự kiện EventBus. | Giao diện hoài niệm sang trọng, responsive mọi độ phân giải, không lỗi console, ăn khớp hoàn toàn với Core. |
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
- [ ] **Khâu kiểm duyệt GTA V Locomotion & Mô hình Người 3D:**
  - Tuyệt đối KHÔNG còn tấm billboard 2D Plane nào cho người chơi.
  - Xoay hướng mượt mà qua Quaternion Slerp (không xoay giật cục).
  - Có quán tính tăng tốc (`accel`) và hãm phanh (`brake`) thực tế, không trượt băng.
  - Khử nổi chân (Foot Ground Snapping) chính xác trên mặt đất bằng và dốc cầu Long Biên / Thê Húc.
- [ ] **Chốt kiểm duyệt Hoạt Họa 60 FPS (`animations.js`):**
  - Walk Cycle: cắm gót nhấc mũi, vung tay chân ngược pha, đầu gối gập tự nhiên.
  - Run Cycle: sải chân biên độ lớn, sprint lean 10-12 độ, khuỷu tay gập ~90 độ.
  - Idle: lồng ngực phập phồng hít thở, trọng tâm chuyển nhẹ, tà áo và nón lá lay động trước gió.
  - Chuyển trạng thái mượt mà bằng Cross-fade Blending 0.2s - 0.3s.
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
