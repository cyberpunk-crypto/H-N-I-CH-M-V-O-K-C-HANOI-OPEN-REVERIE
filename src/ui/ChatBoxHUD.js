/**
 * ChatBoxHUD.js - Kênh Chat Trực Tuyến & Giao Tiếp Cộng Đồng Lãng Tử Hà Nội
 * Hỗ trợ: Phím Enter mở chat, tin nhắn cộng đồng và Bong bóng Chat 3D trên đầu nhân vật
 * Dự án: HÀ NỘI CHẠM VÀO KÝ ỨC (HANOI: OPEN REVERIE)
 */

import { GameEventBus } from '../bridge/GameEvents.js';

export class ChatBoxHUD {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.element = null;
    this.isChatOpen = false;
    this.messages = [
      { sender: 'Hương_HồGươm', text: 'Chào các bạn lãng tử! Chiều nay sương hồ Gươm đẹp quá!', time: '17:15' },
      { sender: 'LãngTử_PhốCổ', text: 'Ai biết cách căn góc câu đố Cầu Long Biên không chỉ mình với?', time: '17:18' },
      { sender: 'MinhAnh_KimLiên', text: 'Vừa tráng xong cuộn film ở quán cà phê đường tàu nè!', time: '17:22' }
    ];

    this.render();
    this._bindEvents();
  }

  render() {
    this.element = document.createElement('div');
    this.element.id = 'chatBoxHudContainer';
    this.element.className = 'chatbox-hud-container';
    this.element.innerHTML = `
      <!-- Khung hiển thị tin nhắn -->
      <div id="chatMessagesArea" class="chat-messages-area">
        ${this.messages.map(m => `
          <div class="chat-msg-row">
            <span class="chat-sender-badge">${m.sender}:</span>
            <span class="chat-msg-text">${m.text}</span>
          </div>
        `).join('')}
      </div>

      <!-- Ô nhập tin nhắn (Bấm Enter để mở) -->
      <form id="chatInputForm" class="chat-input-form ${this.isChatOpen ? '' : 'collapsed'}">
        <input 
          type="text" 
          id="chatTextInput" 
          class="chat-text-input" 
          placeholder="Nhấn Enter để gửi lời nhắn đến những người bạn dạo phố..." 
          maxlength="100"
          autocomplete="off"
        />
        <button type="submit" class="btn-send-chat">Gửi</button>
      </form>
    `;

    this.container.appendChild(this.element);
  }

  _bindEvents() {
    const inputForm = this.element.querySelector('#chatInputForm');
    const inputField = this.element.querySelector('#chatTextInput');
    const messagesArea = this.element.querySelector('#chatMessagesArea');

    // Phím Enter bật/tắt ô nhập chat
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const activeModal = document.querySelector('.dialogue-modal-backdrop:not(.hidden), .scrapbook-modal-backdrop:not(.hidden)');
        if (activeModal) return;

        if (!this.isChatOpen) {
          e.preventDefault();
          this.openChat();
        }
      } else if (e.key === 'Escape' && this.isChatOpen) {
        this.closeChat();
      }
    });

    // Xử lý gửi tin nhắn
    if (inputForm) {
      inputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = (inputField.value || '').trim();
        if (text.length > 0) {
          const profile = JSON.parse(localStorage.getItem('hanoi_user_profile') || '{}');
          const myName = profile.username || 'Tôi';
          this.addMessage(myName, text);
          inputField.value = '';

          // Kích hoạt bong bóng chat 3D trên đầu nhân vật
          GameEventBus.emit('UI:CHAT_MESSAGE_SENT', {
            sender: myName,
            text: text
          });
        }
        this.closeChat();
      });
    }

    // Tự động mô phỏng tin nhắn cộng đồng ghé thăm
    const communityQuotes = [
      { sender: 'ThuTrang_Hanoi', text: 'Quán cà phê trứng ở số 18 mở cửa rồi đó mọi người, vào uống đi!' },
      { sender: 'NhiếpẢnhGia_89', text: 'Chị Lan bán hoa đang đi bộ ven hồ đó, hoa sen thơm nức.' },
      { sender: 'BảoNam_TràngAn', text: 'Hoàng hôn đỏ lửa trên nhịp cầu Long Biên chụp lên film đẹp mê hồn.' }
    ];

    let quoteIdx = 0;
    setInterval(() => {
      const q = communityQuotes[quoteIdx % communityQuotes.length];
      this.addMessage(q.sender, q.text);
      quoteIdx++;
    }, 28000);
  }

  openChat() {
    this.isChatOpen = true;
    const inputForm = this.element.querySelector('#chatInputForm');
    const inputField = this.element.querySelector('#chatTextInput');
    if (inputForm) inputForm.classList.remove('collapsed');
    if (inputField) {
      inputField.focus();
    }
    // Khóa di chuyển WASD khi đang gõ chữ
    if (window.GameAPI && typeof window.GameAPI.setPlayerMovementLock === 'function') {
      window.GameAPI.setPlayerMovementLock(true);
    }
  }

  closeChat() {
    this.isChatOpen = false;
    const inputForm = this.element.querySelector('#chatInputForm');
    const inputField = this.element.querySelector('#chatTextInput');
    if (inputForm) inputForm.classList.add('collapsed');
    if (inputField) inputField.blur();

    // Mở lại di chuyển
    if (window.GameAPI && typeof window.GameAPI.setPlayerMovementLock === 'function') {
      window.GameAPI.setPlayerMovementLock(false);
    }
  }

  addMessage(sender, text) {
    const messagesArea = this.element.querySelector('#chatMessagesArea');
    if (!messagesArea) return;

    const row = document.createElement('div');
    row.className = 'chat-msg-row fade-in-msg';
    row.innerHTML = `
      <span class="chat-sender-badge">${sender}:</span>
      <span class="chat-msg-text">${text}</span>
    `;
    messagesArea.appendChild(row);
    messagesArea.scrollTop = messagesArea.scrollHeight;

    // Giữ tối đa 15 tin nhắn
    while (messagesArea.children.length > 15) {
      messagesArea.removeChild(messagesArea.firstChild);
    }
  }
}
