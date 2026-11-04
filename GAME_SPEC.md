# HÀ NỘI: CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
## TÀI LIỆU KIẾN TRÚC KỸ THUẬT & ĐẶC TẢ HỆ THỐNG TOÀN DIỆN (GAME SPECIFICATION)

---

> **Mã dự án:** `HANOI-OPEN-REVERIE-3D`  
> **Phiên bản tài liệu:** `4.1.0-ENTERPRISE-8-CRITICAL-FIXES`  
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
- **Hệ thống điều khiển nhân vật:** GTA V-style Locomotion Physics với Quaternion Slerp turning, **chuẩn hóa góc di chuyển Yaw Facing qua vector tự nhiên kết hợp `facingOffset`**, triệt tiêu 100% lỗi Moonwalking, quán tính khối lượng (Inertia Acceleration & Braking), cơ chế khử nổi chân (Foot Ground Snapping) và **Va chạm ngang Capsule Horizontal Collision chống xuyên thủng lan can cầu**.
- **Vị trí xuất phát & Camera khởi đầu:** Xuất phát tại tọa độ vàng `(16.5, 0.5, -16.5)` ven bờ Hồ Gươm, góc quay camera mở màn `yaw = 0.785 rad` (45 độ) hướng thẳng dọc tim Cầu Thê Húc.
- **Mô hình nhân vật:** 4 nhân vật NGƯỜI THẬT 3D HỮU CƠ (Organic Humanoid SkinnedMesh / Sculpted 3D Mesh), da thịt liền khối, ngũ quan rõ nét Á Đông, kết hợp **Hệ thống trang phục hình khối 3D độc lập đa lớp (Separate 3D Geometric Meshes)** có độ dày (thickness), đường may, nếp gấp. **NGHIÊM CẤM 100% VIỆC LẮP GHÉP ỐNG TRỤ HÌNH HỘP CON RỐI VÀ DÁN DECAL 2D LÊN MÔ HÌNH!**
- **Cơ chế chống Race Condition & Quản lý bộ nhớ:** `_loadToken` tăng tiến kết hợp hàm đệ quy `_disposeHierarchy()` dọn sạch VRAM/GPU khi chuyển đổi nhân vật.
- **Hoạt họa (Animation):** Hệ thống Skeletal MoCap AnimationMixer kết hợp Procedural Kinematics 60 FPS trong `src/core/animations.js`, thực hiện Cross-fade Blending mượt mà giữa Idle, Walk, Run.
- **Kiến trúc mã nguồn:** Vanilla JavaScript (ES6+ ES Modules), mô hình phân rã Decoupled Architecture hướng sự kiện (`EventBus`), không phụ thuộc build tooling nặng nề.

---

## 2. BÁO CÁO KIỂM ĐIỂM CHUYÊN SÂU 8 LỖI CHÍ MẠNG TOÀN STUDIO

> **CHỈ THỊ CỦA SẾP TỔNG:**  
> *"Toàn bộ studio phải nghiêm túc nhìn nhận 8 sai phạm kỹ thuật nghiêm trọng dưới đây. Tất cả các lỗi này phải được lập hồ sơ giải pháp triệt để và kiểm định 100% trước khi phát hành!"*

| STT | Lỗi Chí Mạng | Mô Tả & Biểu Hiện | Nguyên Nhân Kỹ Thuật Gốc Rễ | Hậu Quả Đối Với Người Chơi | Giải Pháp Kỹ Thuật Triệt Để |
| :---: | :--- | :--- | :--- | :--- | :--- |
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
├── assets/                        # [VÙNG CỦA HỌA SĨ nano-banana]
│   ├── models/                    # Mô hình 3D nhân vật GLTF/GLB (Michelle.glb, Soldier.glb, Xbot.glb, v.v.)
│   ├── textures/                  # Textures 3D PBR/Albedo/Normal/Roughness
│   ├── ui/                        # Đồ họa giao diện, biểu tượng
│   ├── photos/                    # Ảnh film ký ức mẫu tráng sẵn
│   └── audio/                     # Tài nguyên âm thanh âm hưởng Hà Nội
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
│   │   ├── PlayerController.js    # [coder-chinh] GTA V Locomotion Physics: _loadToken, _disposeHierarchy, facingOffset
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
| `CORE:ZONE_ENTERED` | `{ zoneId: string, zoneName: string, description: string, ambientTrack: string }` | `coder-chinh` | `ui-polish` | Người chơi bước vào ranh giới phân khu mới, UI hiện Toast thông báo tên phố. |
| `CORE:INTERACTION_AVAILABLE` | `{ canInteract: boolean, promptText: string, actionKey: string }` | `coder-chinh` | `ui-polish` | Gần ghế đá, hàng nước chè, NPC, bảng tin: UI hiện phím gợi ý (ví dụ: "[E] Uống trà đá vỉa hè"). |
| `UI:OPEN_DIALOGUE` | `{ name: string, role: string, avatar: string, greeting: string, monumentTitle: string, historyText: string, dialogueOptions: Array, shopItems: Array }` | `coder-chinh` | `ui-polish` | Khi người chơi bấm E tương tác với NPC, mở modal đối thoại và tìm hiểu lịch sử danh thắng. |
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

```
               4 HÌNH TƯỢNG VĂN HÓA VIỆT NAM ĐỘC BẢN TOÀN DIỆN:
  ┌───────────────────────────────┐     ┌───────────────────────────────┐
  │ [char_nu_sinh_ao_dai]         │     │ [char_co_gai_ao_ba_ba]        │
  │ • Nữ sinh Tràng An thanh tao  │     │ • Cô gái Phố thị dịu dàng     │
  │ • Da sáng ấm (#E8BEAC)        │     │ • Da sáng ấm (#E8BEAC)        │
  │ • Áo Dài lụa trắng thướt tha  │     │ • Áo Bà Ba hồng sen ngọt ngào │
  │ • Quần lụa trắng suông bay    │     │ • Quần lụa đen bóng mờ        │
  │ • Nón Lá Trúc Chỉ 3D + Hoa tai│     │ • Khăn Rằn 3D + Nón Lá sau lưng│
  └───────────────────────────────┘     └───────────────────────────────┘
  ┌───────────────────────────────┐     ┌───────────────────────────────┐
  │ [char_nam_tri_thuc_suit]      │     │ [char_nam_ao_dai_gam]         │
  │ • Nam trí thức Hà Nội cổ điển │     │ • Chàng trai Thăng Long nho nhã│
  │ • Da bánh mật ấm (#DEB096)    │     │ • Da bánh mật ấm (#DEB096)    │
  │ • Suit tweed xám than lịch lãm│     │ • Áo Dài gấm xanh ngũ thân 3D │
  │ • Quần âu xếp ly thẳng thớm   │     │ • Quần âu trắng mực thước     │
  │ • Mũ Fedora / Kính + Giày da  │     │ • Khăn Xếp 5 tầng nếp 3D      │
  └───────────────────────────────┘     └───────────────────────────────┘
```

### 5.1. `char_nu_sinh_ao_dai`: Nữ Sinh Tràng An • Áo Dài Lụa Trắng & Nón Lá Trúc Chỉ
- **Giải phẫu da thịt:** Chiều cao chuẩn `1.68m`, vòng eo thon nhỏ `0.16m`, bờ vai gầy duyên dáng `0.36m`. Màu da ấm sáng Á Đông `#E8BEAC` (PBR roughness 0.46, Subsurface Scattering hồng hào).
- **Ngũ quan 3D Á Đông:** Mắt bồ câu đen láy long lanh có phản quang, sống mũi dọc dừa thon cao, khóe môi tim hồng chúm chím (`#D8707E`), đôi tai đính hạt hoa tai ngọc trai 3D trắng ngà xà cừ. Mái tóc suôn dài óng ả qua thắt lưng.
- **Trang phục 3D hình khối đa lớp:**
  * Cổ áo trụ 3D cao 3cm, dày 2mm ôm sát cổ ngọc.
  * Thân áo lụa tơ tằm trắng ngà (`color: 0xFCFDFD, roughness: 0.32, sheen: 0.8`), xẻ tà hai bên hông cao tới eo.
  * Hai tà áo dài 3D đa giác mềm có độ dày (Thickness 1.8mm), rủ dài qua đầu gối (`0.74m`), đung đưa theo nhịp bước và gió hồ Gươm.
  * Quần lụa trắng suông rộng 3D bọc ngoài chân rủ chấm mu guốc mộc nâu.
  * Nón lá Trúc Chỉ 3D chóp nón nan tre vàng óng, quai lụa hồng cánh sen buông dưới cằm.

### 5.2. `char_co_gai_ao_ba_ba`: Cô Gái Phố Thị • Áo Bà Ba Hồng Sen & Khăn Rằn Nam Bộ
- **Giải phẫu da thịt:** Chiều cao chuẩn `1.65m`, vai ngang vừa vặn `0.38m`, dáng vẻ nhanh nhẹn, đôn hậu. Màu da ấm sáng `#E8BEAC`, búi tóc cài trâm gáy truyền thống, bàn tay búp măng thon dài.
- **Trang phục 3D hình khối đa lớp:**
  * Chiếc Áo Bà Ba đũi tơ tằm hồng sen (`color: 0xDF648A, roughness: 0.58`), cổ tròn xẻ ngực, hàng 5 cúc áo đen tuyền nổi 3D, vạt áo xẻ hông hai bên.
  * Khăn Rằn caro thủ công dệt hình khối 3D uốn cong quấn quanh cổ và buông hai dải trước ngực.
  * Quần lụa đen bóng mờ 3D (`color: 0x181818, roughness: 0.50`), ống rộng nhẹ nhàng.
  * Chiếc Nón Lá máng thanh thoát sau lưng bằng quai lụa đen vắt chéo ngực.

### 5.3. `char_nam_tri_thuc_suit`: Nam Trí Thức Hà Nội • Âu Phục Suit Tweed Xám Than
- **Giải phẫu da thịt:** Chiều cao chuẩn `1.78m`, bờ vai rộng đĩnh đạc `0.44m`, ngực nở khỏe khoắn. Màu da ấm bánh mật `#DEB096`, gương mặt cương nghị, phong thái trí thức Hà thành xưa.
- **Trang phục 3D hình khối đa lớp:**
  * Bộ Suit Jacket dạ nỉ tweed xám than lịch lãm (`color: 0x4A5568, roughness: 0.52`), ve áo Notch Lapel chữ V dựng nổi 3D sắc sảo.
  * Áo sơ mi trắng cắm thùng và cà vạt đỏ mận vintage 3D.
  * Quần âu dạ ống đứng có gờ nếp ly dập nổi 3D thẳng thớm, phủ chấm mu giày tây.
  * Giày da Oxford đen bóng lộn 3D (`color: 0x111111, roughness: 0.22, metalness: 0.28`).
  * Phụ kiện: Kính mắt trí thức gọng tròn kim loại 3D / Mũ Fedora dạ thanh lịch.

### 5.4. `char_nam_ao_dai_gam`: Chàng Trai Thăng Long • Áo Dài Ngũ Thân Gấm Xanh Hoàng Gia
- **Giải phẫu da thịt:** Chiều cao chuẩn `1.76m`, cốt cách thư sinh nho nhã mực thước đất kinh kỳ. Màu da ấm `#DEB096`.
- **Trang phục 3D hình khối đa lớp:**
  * Áo Dài ngũ thân cách tân gấm xanh hoàng gia Thăng Long (`color: 0x16213E, roughness: 0.32, metalness: 0.28`), ánh kim vàng dệt hoa văn cổ ngũ thân óng ả.
  * Cổ áo đứng cao 3cm viền gấm, hàng 5 chiếc khuy cúc ngọc bích 3D xanh biếc (`color: 0x2E8B57`) cài chéo ngực phải.
  * Hai tà áo nam 3D dài qua đầu gối (`0.78m`), có thể tích dày dặn buông thẳng uy nghiêm.
  * Quần âu trắng ngà 3D (`color: 0xF5F5F0`) và giày vải thêu truyền thống.
  * Khăn Xếp Thăng Long 5 tầng nếp 3D dựng bằng 5 tầng hình xuyến nếp vải gấm quấn đầu trang trọng.

---

## 6. KIẾN TRÚC CHỐNG RACE CONDITION & QUẢN LÝ BỘ NHỚ TRIỆT ĐỂ

> **GIẢI PHÁP TRIỆT TIÊU LỖI 4 (GHOST OVERLAPPING) & LỖI RÒ RỈ BỘ NHỚ VRAM:**  
> Khi người chơi bấm đổi nhân vật nhiều lần liên tiếp, các tác vụ bất đồng bộ tải file GLB/Texture chạy song song sẽ gây xung đột thời gian (Race Condition) và sinh ra hiện tượng mô hình mới nạp đè lên mô hình cũ mà không giải phóng bộ nhớ.

```
       LUỒNG XỬ LÝ CHỐNG RACE CONDITION VỚI LOAD TOKEN TĂNG TIẾN:
   [UI: Click đổi nhân vật] 
              |
   (Kiểm tra Cooldown 600ms & Debounce)
              |
   [PlayerController.setCharacter(charId)]
              |
   1. this._loadToken++ (Tạo token phiên bản mới, VD: token = 5)
   2. this._disposeHierarchy(this.characterGroup) (Dọn sạch 100% VRAM cũ)
   3. Bắt đầu nạp Async Model & Textures (Lưu currentToken = 5)
              |
   [Khi Promise hoàn tất]
              |
   4. KIỂM TRA: if (currentToken !== this._loadToken) {
                    console.log("Token cũ bị hủy bỏ!");
                    this._disposeHierarchy(newModel); // Hủy ngay model thừa
                    return; // HỦY BỎ, KHÔNG ADD VÀO SCENE!
                }
              |
   5. Thêm model mới vào characterGroup & Gắn AnimationMixer 60 FPS
   6. Bắn sự kiện CORE:CHARACTER_SWITCHED thông báo thành công
```

### 6.1. Chi Tiết Thuật Toán Dọn Sạch Bộ Nhớ `_disposeHierarchy(root)`
Mỗi khi tháo gỡ một mô hình nhân vật, toàn bộ cây đối tượng 3D phải được duyệt đệ quy để giải phóng tận gốc bộ nhớ GPU:

```javascript
_disposeHierarchy(node) {
  if (!node) return;

  // Dọn dẹp AnimationMixer liên quan
  if (this._gltfMixer) {
    this._gltfMixer.stopAllAction();
    this._gltfMixer.uncacheRoot(node);
    this._gltfMixer = null;
  }
  this._animActions = null;

  node.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => this._disposeMaterial(mat));
        } else {
          this._disposeMaterial(child.material);
        }
      }
    }
  });

  while (node.children.length > 0) {
    const child = node.children[0];
    node.remove(child);
  }
}

_disposeMaterial(mat) {
  if (!mat) return;
  // Giải phóng toàn bộ textures gắn vào vật liệu
  ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'alphaMap', 'emissiveMap'].forEach((mapName) => {
    if (mat[mapName] && mat[mapName].dispose) {
      mat[mapName].dispose();
    }
  });
  mat.dispose();
}
```

---

## 7. CHUẨN HÓA GÓC DI CHUYỂN (YAW FACING & facingOffset) & GTA V LOCOMOTION

> **GIẢI PHÁP TRIỆT TIÊU LỖI 2 (MOONWALKING):**  
> Mỗi mô hình 3D xuất xưởng từ các phần mềm đồ họa khác nhau có thể có hướng mặt tiền tự nhiên khác nhau (ví dụ: Blender hướng `-Z`, Mixamo hướng `+Z`). Do đó, không thể dùng một công thức gán cứng bừa bãi. Hệ thống quy định mỗi nhân vật sở hữu thuộc tính `facingOffset` định danh rõ ràng.

### 7.1. Bảng Thông Số `facingOffset` Cho Từng Nhân Vật
Được định nghĩa trong metadata `CHARACTERS_META`:

| ID Nhân Vật | Tên Nhân Vật | Hướng Mặt Gốc Của Model | `facingOffset` Bắt Buộc | Kết Quả Khi Bấm Phím `W` |
| :--- | :--- | :--- | :--- | :--- |
| `char_nu_sinh_ao_dai` | Nữ Sinh Tràng An | Hướng `-Z` (Blender chuẩn) | `0` rad (Không bù góc) | Mặt hướng thẳng 100% theo hướng tiến |
| `char_co_gai_ao_ba_ba` | Cô Gái Phố Thị | Hướng `-Z` (Blender chuẩn) | `0` rad (Không bù góc) | Mặt hướng thẳng 100% theo hướng tiến |
| `char_nam_tri_thuc_suit` | Nam Trí Thức Hà Nội | Hướng `-Z` (Blender chuẩn) | `0` rad (Không bù góc) | Mặt hướng thẳng 100% theo hướng tiến |
| `char_nam_ao_dai_gam` | Chàng Trai Thăng Long | Hướng `-Z` (Blender chuẩn) | `0` rad (Không bù góc) | Mặt hướng thẳng 100% theo hướng tiến |
| *Mô hình Mixamo GLB (nếu dùng)* | *Mixamo Rigged Model* | Hướng `+Z` (Ngược trục) | `Math.PI` rad (180 độ) | Bù góc 180 độ, mặt nhìn thẳng hướng tiến |

### 7.2. Công Thức Xoay Hướng Nhân Vật Chuẩn GTA V trong `PlayerController.js`
Tại vòng lặp `update(delta, camera)`:

```javascript
// Tính góc vector di chuyển theo hướng camera
const moveAngle = Math.atan2(finalDir.x, finalDir.z);
// Cộng thêm góc hiệu chỉnh riêng của nhân vật hiện tại
const currentFacingOffset = this.currentCharacterMeta?.facingOffset || 0;
const targetAngle = moveAngle + currentFacingOffset;

// Xoay hướng mặt êm dịu bằng Quaternion Slerp
this._targetQuat.setFromAxisAngle(this._worldUp, targetAngle);
const turnRate = this.keys.sprint ? 13.0 : 11.0;
this.characterGroup.quaternion.slerp(this._targetQuat, Math.min(1.0, turnRate * delta));
this.characterGroup.rotation.setFromQuaternion(this.characterGroup.quaternion, 'YXZ');
```

---

## 8. HỆ THỐNG HOẠT HỌA 60 FPS HUMANOID, RETARGETING & CHỐNG ĐƠ CỨNG

> **GIẢI PHÁP TRIỆT TIÊU LỖI 3 (FROZEN POSE / ĐƠ CỨNG KHI ĐỔI NHÂN VẬT):**  
> Đảm bảo việc khởi tạo và chuyển đổi AnimationMixer diễn ra trơn tru, không bị mất clip, không desync thời gian, và hỗ trợ chuyển động sinh học mượt mà.

### 8.1. Cơ Chế Khởi Tạo & Quản Lý AnimationMixer
Khi nạp nhân vật mới thành công:
1. Tạo mới `THREE.AnimationMixer(model)`.
2. Truy xuất danh sách Animation Clips:
   - `idleClip`: Clip mang tên `'idle'`, `'Idle'`, hoặc clip vị trí `[0]`.
   - `walkClip`: Clip mang tên `'walk'`, `'Walk'`, hoặc clip vị trí `[1]`.
   - `runClip`: Clip mang tên `'run'`, `'Run'`, hoặc clip vị trí `[2]`.
3. Gắn các Action vào từ điển quản lý:
   ```javascript
   this._animActions = {
     idle: this._gltfMixer.clipAction(idleClip),
     walk: this._gltfMixer.clipAction(walkClip),
     run: this._gltfMixer.clipAction(runClip)
   };
   ```
4. Đặt chế độ hòa trộn mượt mà: `idleAction.play()`, `_currentAnim = 'idle'`.
5. Trong trường hợp nhân vật Procedural (không dùng GLTF SkinnedMesh), tự động khởi tạo `HumanoidAnimator` trong `animations.js` làm bộ điều khiển khung xương 17 khớp.

### 8.2. Chuyển Đổi Hoạt Ảnh Cross-Fade 0.2s - 0.3s
```javascript
playAnimation(animName, duration = 0.25) {
  if (!this._animActions || this._currentAnim === animName) return;
  const prevAction = this._animActions[this._currentAnim];
  const nextAction = this._animActions[animName];

  if (nextAction) {
    nextAction.reset();
    nextAction.enabled = true;
    if (prevAction) {
      prevAction.crossFadeTo(nextAction, duration, true);
    }
    nextAction.play();
    this._currentAnim = animName;
  }
}
```

---

## 9. HỆ THỐNG CHỐNG SPAM CLICK, CHUẨN HÓA SCALE/AABB & MESHOPT DECODER

### 9.1. Cooldown & Debounce Đổi Nhân Vật (Triệt tiêu Lỗi 6)
- **Thời gian Cooldown:** `600ms`.
- **Cơ chế hoạt động:**
  * Khi người chơi bấm vào thẻ nhân vật trong UI, kiểm tra cờ `if (this.isSwitchingCharacter) return;`.
  * Đặt cờ `this.isSwitchingCharacter = true`, áp dụng hiệu ứng viền mờ `disabled-state` cho các thẻ còn lại.
  * Khi Core bắn sự kiện `CORE:CHARACTER_SWITCHED` hoặc sau timeout an toàn 1.2s, giải phóng cờ `this.isSwitchingCharacter = false`.

### 9.2. Chuẩn Hóa Kích Thước Bounding Box Tự Động (Triệt tiêu Lỗi 7)
Mỗi mô hình sau khi nạp được đo đạc kích thước thực tế bằng `THREE.Box3`:
```javascript
normalizeModelScale(model, targetHeight = 1.70) {
  const bbox = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bbox.getSize(size);
  const currentHeight = size.y;

  if (currentHeight > 0.01) {
    const scaleFactor = targetHeight / currentHeight;
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);
  }
  // Căn chỉnh chân nhân vật tiếp xúc chính xác mặt sàn y = 0
  const updatedBbox = new THREE.Box3().setFromObject(model);
  model.position.y -= updatedBbox.min.y;
}
```

### 9.3. Tích Hợp `MeshoptDecoder` Cho GLTFLoader (Triệt tiêu Lỗi 8)
Cấu hình nạp file nén Meshopt để tránh crash khi nạp mô hình chất lượng cao:
```javascript
import { MeshoptDecoder } from '../lib/decoders/meshopt_decoder.module.js';

if (typeof MeshoptDecoder !== 'undefined') {
  this._gltfLoader.setMeshoptDecoder(MeshoptDecoder);
}
```

---

## 10. HỆ THỐNG TRANG PHỤC HÌNH KHỐI 3D ĐỘC LẬP ĐA LỚP & TÁI TẠO DA THỊT Á ĐÔNG

> **CHỈ LỆNH NGHIÊM NGẶT TỪ SẾP TỔNG:**  
> *"Trang phục PHẢI là hệ thống lớp hình khối 3D độc lập (Separate 3D Geometric Meshes) có độ dày (thickness), đường may, nếp gấp, bao bọc bên ngoài cơ thể da thịt. NGHIÊM CẤM 100% VIỆC DÁN HÌNH 2D / PHOTO DECAL ĐÈ LÊN MÔ HÌNH!"*

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

1. **Cổ áo trụ 3D (Mandarin Collar Geometry):** Kết cấu `CylinderGeometry` dày 2mm (`thickness = 0.002m`), cao 3cm (`height = 0.03m`) ôm quanh cổ da thịt.
2. **Thân áo ngoài 3D & Ống tay áo 3D:** Khối đa giác độc lập bao bọc quanh thân ngực và eo, ôm sát đường cong cơ thể. Tại eo hông (`y = baseTorsoY`), thân áo xẻ tà sâu lên đến thắt lưng, để lộ rõ lớp quần lụa bên trong.
3. **Quần lụa ống rộng 3D & Quần âu có ly 3D:** Khối ống rộng bay bổng cho Áo dài và Áo bà ba (`botRadius = 0.085m`); quần âu ống đứng có gờ nếp ly 3D sắc nét cho bộ Suit.
4. **Hai tà áo dài 3D đa giác mềm có thể tích:** Lưới đa giác 2 mặt có độ dày (`Thickness = 1.8mm`), đung đưa mềm mại theo nhịp bước và gió hồ Gươm.
5. **Phụ kiện 3D tinh xảo:** Khuy cúc hạt ngọc nổi 3D, Khăn xếp Thăng Long 5 tầng nếp 3D, Khăn rằn 3D quấn quanh cổ, Nón lá 3D nan tre vàng óng với cơ chế lò xo giảm chấn quán tính (Lag Damping).
6. **Tái tạo da thịt Á Đông:** Nữ sinh da ấm sáng `#E8BEAC`, Nam da ấm `#DEB096`, PBR Skin `roughness: 0.46`, `metalness: 0.0`, Subsurface Scattering giả lập. Bàn tay 5 ngón thon búp măng có thể tích thịt và khớp cử động tự nhiên.

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
 Khu 4: KHU TẬP THỂ CŨ HOÀNG HÔN          Khu 1: HỒ GƯƠM & THÁP RÙA TRUNG TÂM
   - Chuồng cọp sắt vươn mình, dây phơi     - Tháp Rùa cổ kính ngự giữa hồ
   - Tường vôi ố vàng, hoa giấy nở rộ       - Cầu Thê Húc đỏ son, Đền Ngọc Sơn
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

### 11.4. Phân khu 4: Khu Tập Thể Cũ & Ngõ Phố Hoàng Hôn (Zone D)
- **Tọa độ trung tâm:** `(-100, 0, -100)`.
- Dãy nhà tập thể 5 tầng kiểu Kim Liên / Giảng Võ với "chuồng cọp" sắt, giàn hoa giấy đỏ rực rỡ, quán nước chè giành tre của bà cụ và bàn cờ tướng dưới gốc bàng già.

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
| **Coder Chính**<br>(`coder-chinh`) | `src/core/*`<br>(trừ animations.js)<br>`src/bridge/*` | 1. **Khắc phục Lỗi 1, 4, 7, 8:** Xây dựng `_loadToken` chống Race Condition, đệ quy `_disposeHierarchy()` dọn sạch VRAM, cấu hình `MeshoptDecoder`, tự động scale Bounding Box theo nhân trắc học.<br>2. **Khắc phục Lỗi 2:** Áp dụng `facingOffset` và vector quay chuẩn, triệt tiêu 100% Moonwalking.<br>3. **Khắc phục Lỗi 5:** Tạo 4 nhân vật Việt Nam độc bản trong `CharacterFactory.js`.<br>4. Capsule Horizontal Collision chống rơi khỏi cầu.<br>5. **BẢO TOÀN TUYỆT ĐỐI 100% 9 NPC lịch sử trong `WorldManager.js`.** | Di chuyển chuẩn GTA V, mặt hướng đúng chiều tiến, không đơ, không bóng ma, 60 FPS mượt mà. |
| **Animation Master**<br>(`animation-master`) | `src/core/animations.js` | 1. **Khắc phục Lỗi 3:** Tối ưu hóa chu kỳ Walk/Run/Idle 60 FPS, đồng bộ AnimationMixer, retargeting không giật lag.<br>2. Uốn lượn 2 tà áo dài 3D có thể tích và nón lá theo dao động hông và gió hồ.<br>3. Lò xo giảm chấn quán tính Nón Lá (Lag Damping Spring-Damper).<br>4. Cross-fade Blending 0.2s - 0.3s triệt tiêu giật cục. | Hoạt họa sinh học người thật tự nhiên, không bao giờ bị đơ cứng (Frozen Pose) khi đổi nhân vật. |
| **UI Polish**<br>(`ui-polish`) | `src/ui/*`<br>`styles/*`<br>`index.html` | 1. **Khắc phục Lỗi 6:** Bổ sung Debounce & Cooldown 600ms chống spam click đổi nhân vật.<br>2. Thiết kế Onboarding 3 bước (Age Gate 18+, Login, Character Creator).<br>3. Giao diện chọn 4 nhân vật 3D Việt Nam độc bản sang trọng hoài niệm.<br>4. Viewfinder HUD máy ảnh film, Scrapbook Album dán tem, Modal đối thoại 9 NPC.<br>5. Bắt và bắn đúng chuẩn 100% các sự kiện EventBus. | Giao diện hoài niệm sang trọng, responsive mọi độ phân giải, không lỗi console, ăn khớp hoàn toàn với Core. |
| **Họa Sĩ**<br>(`nano-banana`) | `assets/textures/*`<br>`assets/models/*`<br>`assets/ui/*`<br>`assets/photos/*`<br>`assets/audio/*` | 1. Cung cấp đầy đủ Textures PBR (nước Hồ Gươm, rêu Tháp Rùa, tường vôi vàng, thép cầu, vải lụa, gấm dệt, dạ nỉ).<br>2. Cung cấp 3D models GLTF SkinnedMesh tối ưu chuẩn văn hóa Việt Nam.<br>3. UI Assets (khung ngắm, nút shutter kim loại, tem bưu chính Hà Nội, vé tàu).<br>4. 4 ảnh film ký ức và bộ âm thanh ambient hồ Gươm, còi tàu, tiếng màn trập cơ học. | Tất cả tài nguyên tồn tại thực tế trên đĩa cứng, đúng kích thước, không một đường link nào bị lỗi 404. |

---

## 17. DANH SÁCH TÀI NGUYÊN (ASSET REQUIREMENTS)

### 17.1. Textures Môi Trường & Nhân Vật 3D PBR (`assets/textures/`)
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
1. `ambient_lake.mp3`: Tiếng sóng hồ vỗ bờ đá nhẹ, gió rặng liễu, tiếng chuông chùa xa xăm.
2. `ambient_train.mp3`: Tiếng còi tàu hơi nước vang vọng trong ngõ hẹp, tiếng rít kim loại đường ray.
3. `ambient_street.mp3`: Tiếng ve râm ran trưa hè, tiếng rao hàng rong bánh khúc/xôi lạc.
4. `shutter_click.mp3`: Tiếng chớp màn trập cơ học kim loại đanh thép của máy ảnh cơ Leica M3.
5. `photo_develop.mp3`: Tiếng lật tráng giấy ảnh và tiếng nước chảy trong phòng tối tráng phim.

---

## 18. TIÊU CHUẨN KIỂM DUYỆT CHẤT LƯỢNG TOÀN DIỆN (QA CHECKLIST 10 CHỐT)

Trước khi nghiệm thu dự án đạt mức độ "PASSED 100%", subagent `kiem-duyet-qa` phải kiểm tra lần lượt 10 chốt kiểm định:

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

### Chốt 10: Lan Can Cầu, Spawn Point & Kiến Trúc Tường Mỏng
- [ ] Spawn tại tọa độ `(16.5, 0.5, -16.5)`. Camera ban đầu có `yaw = 0.785 rad` (45 độ) hướng dọc Cầu Thê Húc.
- [ ] Capsule Horizontal Collision kẹp an toàn lan can cầu.
- [ ] Tường bao mỏng 0.35m, thông thủy phòng 11.3m x 15.3m x 4.2m người chơi đi vào bình thường.

---
*Bản tài liệu đặc tả kỹ thuật này là pháp lệnh kỹ thuật cao nhất cho toàn bộ đội ngũ Game Studio.*
