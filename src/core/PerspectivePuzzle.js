/**
 * PerspectivePuzzle.js - Hệ thống Giải Đố Giao Điểm Thị Giác (Perspective Alignment)
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 * 
 * 4 Câu đố biểu tượng:
 * 1. Văn Miếu Ký Ức (Hồ Gươm)
 * 2. Giai Điệu Dây Điện (Phố Cổ)
 * 3. Rồng Bay Sông Hồng (Cầu Long Biên)
 * 4. Khát Vọng Chuồng Cọp (Khu Tập Thể)
 */

import { THREE } from './ThreeLib.js';
import { storageService } from './StorageService.js';

export class PerspectivePuzzle {
  constructor(scene, worldManager, eventBus) {
    this.scene = scene;
    this.worldManager = worldManager;
    this.eventBus = eventBus || window.GameEventBus;

    // Trạng thái phát hiện hiện tại
    this.activePuzzle = null;
    this.currentScore = 0;
    this.isAligned = false;
    this._camDir = new THREE.Vector3();

    // Danh sách 4 câu đố theo GAME_SPEC.md
    this.puzzles = [
      {
        id: 'puzzle_ho_guom',
        puzzleName: 'Văn Miếu Ký Ức',
        title: 'Khuê Văn Các Soi Bóng',
        zoneId: 'ho_guom',
        targetPosition: new THREE.Vector3(17, 0.5, -17),
        // Hướng nhìn thẳng ra Tháp Rùa giữa hồ
        targetDirection: new THREE.Vector3(0.707, 0.04, -0.707).normalize(),
        maxDistance: 3.5,
        solved: false,
        quote: 'Hồ Gươm soi bóng nghìn năm, nét Khuê Văn Các thâm nghiêm giữa lòng Hà Nội.',
        unlockedShortcut: 'Lối rẽ hoa liễu dẫn sang Phố Cổ',
        photoUrl: 'assets/photos/memory_turtle_mist.jpg'
      },
      {
        id: 'puzzle_pho_co',
        puzzleName: 'Giai Điệu Dây Điện',
        title: 'Giai Điệu Người Hà Nội',
        zoneId: 'pho_co',
        targetPosition: new THREE.Vector3(-52, 0.5, 56),
        // Hướng nhìn chéo lên mạng dây điện và cột điện ngõ
        targetDirection: new THREE.Vector3(-0.85, 0.35, -0.15).normalize(),
        maxDistance: 2.5,
        solved: false,
        quote: 'Những nốt nhạc thời gian viết trên trời xanh bằng dây điện phố cổ.',
        unlockedShortcut: 'Cửa hông thông qua Ga Tàu Cũ',
        photoUrl: 'assets/photos/memory_train_street.jpg'
      },
      {
        id: 'puzzle_long_bien',
        puzzleName: 'Rồng Bay Sông Hồng',
        title: 'Thăng Long Đệ Nhất Rồng',
        zoneId: 'long_bien',
        targetPosition: new THREE.Vector3(60, 4.5, 60),
        // Hướng nhìn dọc theo dầm thép và sông Hồng hoàng hôn
        targetDirection: new THREE.Vector3(0.35, -0.12, 0.92).normalize(),
        maxDistance: 3.0,
        solved: false,
        quote: 'Chiếc dầm thép uốn lượn như dáng rồng Thăng Long vươn mình qua sóng đỏ phù sa.',
        unlockedShortcut: 'Cầu thang bộ dẫn xuống bãi bồi lau sậy Sông Hồng',
        photoUrl: 'assets/photos/memory_long_bien.jpg'
      },
      {
        id: 'puzzle_tap_the',
        puzzleName: 'Khát Vọng Chuồng Cọp',
        title: 'Cánh Chim Chuồng Cọp',
        zoneId: 'tap_the',
        targetPosition: new THREE.Vector3(-80, 0.5, -105),
        // Hướng nhìn chếch lên lồng sắt chuồng cọp và giàn hoa giấy
        targetDirection: new THREE.Vector3(0.0, 0.45, 0.89).normalize(),
        maxDistance: 2.8,
        solved: false,
        quote: 'Giữa những song sắt chật hẹp, cánh hoa giấy vẫn vươn lên đón nắng hoàng hôn rực rỡ.',
        unlockedShortcut: 'Lối tắt xuyên ngõ khu tập thể Kim Liên',
        photoUrl: 'assets/photos/memory_apartment.jpg'
      }
    ];

    this._syncSolvedPuzzles();
    this._createVisualStandpoints();
  }

  /**
   * Đồng bộ các câu đố đã giải từ StorageService
   */
  _syncSolvedPuzzles() {
    const solvedIds = storageService.getSolvedPuzzleIds();
    this.puzzles.forEach(p => {
      if (solvedIds.includes(p.id)) {
        p.solved = true;
      }
    });
  }

  /**
   * Tạo các vòng tròn ký ức mờ ảo tại điểm đứng định mệnh
   */
  _createVisualStandpoints() {
    this.standpointGroup = new THREE.Group();
    this.standpointGroup.name = 'PuzzleStandpoints';

    const circleGeo = new THREE.RingGeometry(0.6, 0.9, 32);
    circleGeo.rotateX(-Math.PI / 2);

    const circleMat = new THREE.MeshBasicMaterial({
      color: 0xf39c12,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });

    this.puzzles.forEach(p => {
      const ring = new THREE.Mesh(circleGeo, circleMat.clone());
      ring.position.copy(p.targetPosition);
      ring.position.y += 0.06; // Nằm sát mặt sàn
      this.standpointGroup.add(ring);
      p.visualRing = ring;
    });

    this.scene.add(this.standpointGroup);
  }

  /**
   * Kiểm tra góc nhìn quang học mỗi frame
   * @param {THREE.Vector3} playerPosition 
   * @param {THREE.Camera} camera 
   * @param {boolean} isFpsMode 
   */
  update(playerPosition, camera, isFpsMode) {
    if (!playerPosition || !camera) return;

    let detectedPuzzle = null;
    let bestScore = 0;
    let aligned = false;

    const camDir = this._camDir;
    camera.getWorldDirection(camDir);

    for (const puzzle of this.puzzles) {
      if (puzzle.solved) continue;

      const dist = playerPosition.distanceTo(puzzle.targetPosition);

      // Hiệu ứng nhấp nháy vòng tròn định mệnh khi người chơi tới gần
      if (puzzle.visualRing) {
        const pulse = Math.sin(performance.now() * 0.003) * 0.2 + 0.5;
        puzzle.visualRing.material.opacity = (dist < 10) ? pulse : 0.2;
      }

      if (dist <= puzzle.maxDistance) {
        // Tính tích vô hướng hướng nhìn với hướng mục tiêu
        const dot = camDir.dot(puzzle.targetDirection);

        // Chuẩn hóa điểm căn chỉnh từ 0.0 đến 1.0
        // Ngưỡng phát hiện bắt đầu từ dot > 0.93
        if (dot > 0.93) {
          const dotFactor = THREE.MathUtils.clamp((dot - 0.93) / (1.0 - 0.93), 0, 1);
          const distFactor = THREE.MathUtils.clamp(1.0 - (dist / puzzle.maxDistance), 0, 1);
          const score = dotFactor * 0.7 + distFactor * 0.3;

          if (score > bestScore) {
            bestScore = score;
            detectedPuzzle = puzzle;
            // Tiêu chuẩn ăn khớp hoàn toàn: dot > 0.985 và dist < 1.2m
            if (dot >= 0.985 && dist <= 1.2) {
              aligned = true;
            }
          }
        }
      }
    }

    // Phát hiện hoặc cập nhật điểm căn góc
    if (detectedPuzzle) {
      this.activePuzzle = detectedPuzzle;
      this.currentScore = bestScore;
      this.isAligned = aligned;

      if (this.eventBus) {
        this.eventBus.emit('CORE:PUZZLE_DETECTED', {
          puzzleId: detectedPuzzle.id,
          puzzleName: detectedPuzzle.puzzleName,
          alignmentScore: parseFloat(bestScore.toFixed(3)),
          isAligned: aligned
        });
      }
    } else if (this.activePuzzle !== null) {
      // Người chơi đã quay đi chỗ khác
      this.activePuzzle = null;
      this.currentScore = 0;
      this.isAligned = false;

      if (this.eventBus) {
        this.eventBus.emit('CORE:PUZZLE_DETECTED', {
          puzzleId: '',
          puzzleName: '',
          alignmentScore: 0,
          isAligned: false
        });
      }
    }
  }

  /**
   * Kích hoạt kiểm tra giải câu đố khi người chơi chụp ảnh
   * @returns {Object|null} Thông tin câu đố nếu giải thành công
   */
  checkShutterCapture() {
    if (this.activePuzzle && this.isAligned && !this.activePuzzle.solved) {
      const p = this.activePuzzle;
      p.solved = true;

      // Ẩn vòng tròn định mệnh sau khi giải
      if (p.visualRing) {
        p.visualRing.visible = false;
      }

      // Kích hoạt biến đổi không gian thế giới
      if (this.worldManager) {
        this.worldManager.triggerPuzzleTransformation(p.id);
      }

      // Lưu vào Storage
      storageService.markPuzzleSolved(p.id, {
        title: p.title,
        zoneId: p.zoneId
      });

      // Phát sự kiện câu đố đã giải
      if (this.eventBus) {
        this.eventBus.emit('CORE:PUZZLE_SOLVED', {
          puzzleId: p.id,
          title: p.title,
          quote: p.quote,
          unlockedShortcut: p.unlockedShortcut,
          photoUrl: p.photoUrl
        });
      }

      return p;
    }
    return null;
  }

  /**
   * Lấy câu đố đang ngắm
   */
  getActivePuzzle() {
    return this.activePuzzle;
  }

  /**
   * Kiểm tra câu đố đang căn có khớp hoàn toàn không
   */
  getIsAligned() {
    return this.isAligned;
  }
}
