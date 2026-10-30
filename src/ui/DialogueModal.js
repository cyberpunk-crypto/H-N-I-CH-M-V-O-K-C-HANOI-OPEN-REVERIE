/**
 * DialogueModal.js - Giao diện Hộp Thoại & Thuyết Minh Lịch Sử & Giao Dịch Buôn Bán với NPC
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { GameEventBus } from '../bridge/GameEvents.js';

export class DialogueModal {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.element = null;
    this.isOpen = false;
    this.currentNpc = null;
    this.currentTab = 'dialogue'; // 'dialogue' | 'history' | 'shop'

    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.id = 'dialogueModalContainer';
    this.element.className = 'dialogue-modal-backdrop hidden';
    this.element.innerHTML = `
      <div class="dialogue-card-retro">
        <div class="card-corner-tr"></div>
        <div class="card-corner-bl"></div>

        <!-- Header NPC -->
        <header class="dialogue-header">
          <div class="npc-avatar-box">
            <div id="npcAvatarIcon" class="npc-avatar-graphic">🌸</div>
          </div>
          <div class="npc-meta">
            <h2 id="npcNameTitle" class="npc-name">Chị Lan &bull; Gánh Hàng Hoa Ven Hồ</h2>
            <p id="npcRoleBadge" class="npc-role">Người buôn hoa chợ sớm Quảng Bá</p>
          </div>
          <button type="button" id="btnCloseDialogue" class="btn-close-dialogue" title="Đóng [Esc]">&times;</button>
        </header>

        <!-- Thanh điều hướng Tab -->
        <nav class="dialogue-nav-tabs">
          <button type="button" class="tab-btn active" data-tab="dialogue">💬 Trò Chuyện</button>
          <button type="button" class="tab-btn" data-tab="history">📜 Lịch Sử & Kiến Trúc</button>
          <button type="button" class="tab-btn" data-tab="shop">🛍️ Quầy Hàng Xưa</button>
        </nav>

        <!-- Nội dung chính -->
        <div class="dialogue-body">
          <!-- 1. Tab Trò Chuyện -->
          <div id="tabContentDialogue" class="tab-pane active">
            <div class="dialogue-bubble">
              <p id="dialogueTextContent" class="dialogue-speech-text">
                "Chào bạn lãng tử! Sáng sớm nay tôi vừa dong xe lên chợ hoa Quảng Bá từ lúc ba giờ sáng. Hoa sen Hồ Tây chớm đông thơm ngát lắm, bạn có muốn chọn một bó lưu giữ ký ức không?"
              </p>
            </div>
            <div id="dialogueOptionsContainer" class="dialogue-quick-options">
              <!-- Nút lựa chọn câu thoại -->
            </div>
          </div>

          <!-- 2. Tab Thuyết Minh Lịch Sử & Kiến Trúc -->
          <div id="tabContentHistory" class="tab-pane">
            <div class="history-content-box">
              <div class="history-monument-badge" id="historyMonumentName">🏛️ Tháp Rùa & Hồ Hoàn Kiếm</div>
              <div class="history-scroll-text" id="historyTextContent">
                <!-- Nội dung thuyết minh lịch sử -->
              </div>
            </div>
          </div>

          <!-- 3. Tab Cửa Hàng & Giao Dịch -->
          <div id="tabContentShop" class="tab-pane">
            <div class="shop-inventory-grid" id="shopItemsContainer">
              <!-- Danh sách vật phẩm mua sắm -->
            </div>
            <div class="shop-footer">
              <span id="playerWalletBadge" class="player-wallet-badge">🪙 Ví Ký Ức: <strong>1,986 Xu</strong></span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this._bindEvents();
  }

  _bindEvents() {
    const btnClose = this.element.querySelector('#btnCloseDialogue');
    if (btnClose) {
      btnClose.addEventListener('click', () => this.close());
    }

    // Phím Esc đóng modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Chuyển Tab
    const tabBtns = this.element.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.switchTab(btn.dataset.tab);
      });
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    const panes = this.element.querySelectorAll('.tab-pane');
    panes.forEach(p => p.classList.remove('active'));

    if (tabId === 'dialogue') {
      this.element.querySelector('#tabContentDialogue').classList.add('active');
    } else if (tabId === 'history') {
      this.element.querySelector('#tabContentHistory').classList.add('active');
    } else if (tabId === 'shop') {
      this.element.querySelector('#tabContentShop').classList.add('active');
    }
  }

  /**
   * Mở hộp thoại với dữ liệu NPC cụ thể
   */
  open(npcData) {
    this.currentNpc = npcData;
    this.isOpen = true;
    this.element.classList.remove('hidden');

    // Khóa di chuyển nhân vật khi đang nói chuyện
    if (window.GameAPI && typeof window.GameAPI.setPlayerMovementLock === 'function') {
      window.GameAPI.setPlayerMovementLock(true);
    }

    // Cập nhật thông tin NPC
    const avatarEl = this.element.querySelector('#npcAvatarIcon');
    const nameEl = this.element.querySelector('#npcNameTitle');
    const roleEl = this.element.querySelector('#npcRoleBadge');
    const textEl = this.element.querySelector('#dialogueTextContent');
    const historyTitleEl = this.element.querySelector('#historyMonumentName');
    const historyTextEl = this.element.querySelector('#historyTextContent');
    const optionsContainer = this.element.querySelector('#dialogueOptionsContainer');
    const shopContainer = this.element.querySelector('#shopItemsContainer');

    if (avatarEl) {
      if (npcData.avatar && (npcData.avatar.includes('/') || npcData.avatar.includes('.'))) {
        avatarEl.innerHTML = `<img src="${npcData.avatar}" alt="NPC" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      } else {
        avatarEl.textContent = npcData.avatar || '👤';
      }
    }
    if (nameEl) nameEl.innerHTML = npcData.name || 'Người Dân Hà Nội';
    if (roleEl) roleEl.textContent = npcData.role || npcData.title || 'Cư dân phố cổ';
    if (textEl) textEl.textContent = npcData.greeting || '"Chào bạn lãng tử!"';

    // 1. Thuyết minh lịch sử
    if (historyTitleEl) historyTitleEl.textContent = `🏛️ ${npcData.monumentTitle || 'Di Tích Lịch Sử'}`;
    if (historyTextEl) {
      historyTextEl.innerHTML = npcData.historyText || `
        <p>Hà Nội ba mươi sáu phố phường, nghìn năm văn hiến lắng đọng qua từng nhịp cầu, ngõ nhỏ rêu phong.</p>
      `;
    }

    // 2. Lựa chọn câu thoại (hỗ trợ cả dialogueOptions và topics)
    if (optionsContainer) {
      optionsContainer.innerHTML = '';
      const options = npcData.dialogueOptions || npcData.topics || [
        { text: 'Hỏi về nét đẹp của nơi này', reply: 'Nơi này mỗi mùa thu qua đi lại lắng đọng biết bao câu chuyện thời gian...' },
        { text: 'Thời tiết Hà Nội hôm nay thế nào bác?', reply: 'Trời bảng lảng sương sớm, se se lạnh của gió heo may đầu mùa, đẹp lắm bạn ơi!' }
      ];

      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-dialogue-option';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => {
          textEl.textContent = opt.reply;
        });
        optionsContainer.appendChild(btn);
      });
    }

    // 3. Quầy hàng mậu dịch
    if (shopContainer) {
      shopContainer.innerHTML = '';
      const items = npcData.shopItems || [
        { name: 'Cuộn Phim Kodak Portra 35mm', price: '45 Xu', desc: 'Ghi lại những bức hình ấm áp màu hoàng hôn', icon: '🎞️' },
        { name: 'Tách Trà Sen Hồ Tây Nóng', price: '15 Xu', desc: 'Hồi phục thể lực dạo phố', icon: '🍵' },
        { name: 'Bưu Thiếp Tháp Rùa Cổ Điển', price: '10 Xu', desc: 'Lưu vào Album ký ức', icon: '📮' }
      ];

      items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'shop-item-card';
        itemCard.innerHTML = `
          <div class="item-icon">${item.icon}</div>
          <div class="item-info">
            <h4 class="item-name">${item.name}</h4>
            <p class="item-desc">${item.desc}</p>
          </div>
          <button type="button" class="btn-buy-item">${item.price}</button>
        `;
        const buyBtn = itemCard.querySelector('.btn-buy-item');
        buyBtn.addEventListener('click', () => {
          buyBtn.textContent = '✓ Đã Mua';
          buyBtn.disabled = true;
          buyBtn.style.background = '#27ae60';
          GameEventBus.emit('UI:ITEM_PURCHASED', item);
        });
        shopContainer.appendChild(itemCard);
      });
    }

    // Mặc định về Tab Trò chuyện
    this.switchTab('dialogue');
    const tabBtns = this.element.querySelectorAll('.tab-btn');
    tabBtns.forEach(b => b.classList.remove('active'));
    if (tabBtns[0]) tabBtns[0].classList.add('active');
  }

  close() {
    this.isOpen = false;
    this.element.classList.add('hidden');

    // Mở khóa lại điều khiển di chuyển
    if (window.GameAPI && typeof window.GameAPI.setPlayerMovementLock === 'function') {
      window.GameAPI.setPlayerMovementLock(false);
    }
  }
}
