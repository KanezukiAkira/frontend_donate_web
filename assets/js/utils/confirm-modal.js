/**
 * ConfirmModal UI System
 * Cung cấp hộp thoại xác nhận (Confirm Modal) theo phong cách kính mờ Glassmorphism.
 * Thay thế hoàn toàn window.confirm() mặc định của trình duyệt.
 */

(function () {
  'use strict';

  // Inject CSS nếu chưa có trong trang
  function injectStyles() {
    if (document.getElementById('confirm-modal-styles')) return;

    const css = `
      /* Confirm Modal Overlay */
      .confirm-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        background: rgba(5, 8, 16, 0.78);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.25s;
      }
      .confirm-modal-overlay.active {
        opacity: 1;
        visibility: visible;
      }

      /* Confirm Modal Box */
      .confirm-modal-box {
        background: rgba(15, 23, 42, 0.96);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 24px;
        max-width: 440px;
        width: 100%;
        padding: 28px 24px 22px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 0, 0, 0.4);
        transform: scale(0.9) translateY(12px);
        transition: transform 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        position: relative;
        color: #f8fafc;
        font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      }
      .confirm-modal-overlay.active .confirm-modal-box {
        transform: scale(1) translateY(0);
      }

      /* Icon Wrapper */
      .confirm-modal-icon-wrap {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        transition: all 0.25s ease;
      }
      .confirm-modal-icon-wrap.danger {
        background: rgba(239, 68, 68, 0.14);
        border: 1px solid rgba(239, 68, 68, 0.35);
        box-shadow: 0 0 24px rgba(239, 68, 68, 0.22);
        color: #ef4444;
      }
      .confirm-modal-icon-wrap.warning {
        background: rgba(245, 158, 11, 0.14);
        border: 1px solid rgba(245, 158, 11, 0.35);
        box-shadow: 0 0 24px rgba(245, 158, 11, 0.22);
        color: #f59e0b;
      }
      .confirm-modal-icon-wrap.info {
        background: rgba(59, 130, 246, 0.14);
        border: 1px solid rgba(59, 130, 246, 0.35);
        box-shadow: 0 0 24px rgba(59, 130, 246, 0.22);
        color: #3b82f6;
      }
      .confirm-modal-icon-wrap.success {
        background: rgba(16, 185, 129, 0.14);
        border: 1px solid rgba(16, 185, 129, 0.35);
        box-shadow: 0 0 24px rgba(16, 185, 129, 0.22);
        color: #10b981;
      }

      /* Close X Button */
      .confirm-modal-close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      .confirm-modal-close-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
      }

      /* Typography */
      .confirm-modal-title {
        font-size: 1.25rem;
        font-weight: 700;
        line-height: 1.35;
        color: #ffffff;
        margin-bottom: 8px;
      }
      .confirm-modal-message {
        font-size: 0.92rem;
        color: rgba(255, 255, 255, 0.72);
        line-height: 1.55;
        margin-bottom: 24px;
        max-width: 380px;
        word-break: break-word;
      }

      /* Actions */
      .confirm-modal-actions {
        display: flex;
        width: 100%;
        gap: 12px;
      }
      .confirm-modal-actions button {
        flex: 1;
        padding: 11px 18px;
        font-size: 0.92rem;
        font-weight: 600;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-family: inherit;
      }
      .confirm-modal-btn-cancel {
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.14);
        color: #cbd5e1;
      }
      .confirm-modal-btn-cancel:hover {
        background: rgba(255, 255, 255, 0.14);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.25);
      }

      .confirm-modal-btn-confirm {
        border: none;
      }
      .confirm-modal-btn-confirm.danger {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: #ffffff;
        box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
      }
      .confirm-modal-btn-confirm.danger:hover {
        filter: brightness(1.12);
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(239, 68, 68, 0.5);
      }
      .confirm-modal-btn-confirm.warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #0f172a;
        font-weight: 700;
        box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
      }
      .confirm-modal-btn-confirm.warning:hover {
        filter: brightness(1.08);
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(245, 158, 11, 0.45);
      }
      .confirm-modal-btn-confirm.info {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: #ffffff;
        box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
      }
      .confirm-modal-btn-confirm.info:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
      }
      .confirm-modal-btn-confirm.success {
        background: linear-gradient(135deg, #10b981, #059669);
        color: #ffffff;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
      }
      .confirm-modal-btn-confirm.success:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
      }
    `;

    const styleEl = document.createElement('style');
    styleEl.id = 'confirm-modal-styles';
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  // SVGs cho từng trạng thái
  const SVG_ICONS = {
    danger: `
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    `,
    warning: `
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    `,
    info: `
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    `,
    success: `
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    `,
    close: `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    `
  };

  /**
   * ConfirmModal Singleton Object
   */
  const ConfirmModal = {
    /**
     * Hiển thị modal xác nhận với Promise
     * @param {Object} options
     * @param {string} options.title Tiêu đề
     * @param {string} options.message Nội dung mô tả
     * @param {string} [options.confirmText='Xác nhận'] Nhãn nút xác nhận
     * @param {string} [options.cancelText='Hủy bỏ'] Nhãn nút hủy
     * @param {'danger'|'warning'|'info'|'success'} [options.type='warning'] Loại giao diện
     * @returns {Promise<boolean>}
     */
    show(options = {}) {
      injectStyles();

      const {
        title = 'Xác nhận thao tác',
        message = 'Bạn có chắc chắn muốn thực hiện hành động này không?',
        confirmText = 'Xác nhận',
        cancelText = 'Hủy bỏ',
        type = 'warning'
      } = options;

      return new Promise((resolve) => {
        // Tạo overlay
        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'confirmModalTitle');

        overlay.innerHTML = `
          <div class="confirm-modal-box">
            <button type="button" class="confirm-modal-close-btn" aria-label="Đóng">
              ${SVG_ICONS.close}
            </button>
            <div class="confirm-modal-icon-wrap ${type}">
              ${SVG_ICONS[type] || SVG_ICONS.warning}
            </div>
            <h3 id="confirmModalTitle" class="confirm-modal-title">${title}</h3>
            <p class="confirm-modal-message">${message}</p>
            <div class="confirm-modal-actions">
              <button type="button" class="confirm-modal-btn-cancel">${cancelText}</button>
              <button type="button" class="confirm-modal-btn-confirm ${type}">${confirmText}</button>
            </div>
          </div>
        `;

        document.body.appendChild(overlay);

        // Kích hoạt animation xuất hiện
        requestAnimationFrame(() => {
          overlay.classList.add('active');
        });

        const cancelBtn = overlay.querySelector('.confirm-modal-btn-cancel');
        const confirmBtn = overlay.querySelector('.confirm-modal-btn-confirm');
        const closeBtn = overlay.querySelector('.confirm-modal-close-btn');

        // Focus vào nút xác nhận mặc định
        setTimeout(() => {
          confirmBtn?.focus();
        }, 50);

        let isResolved = false;

        const cleanup = (confirmed) => {
          if (isResolved) return;
          isResolved = true;

          overlay.classList.remove('active');
          document.removeEventListener('keydown', handleKeydown);

          setTimeout(() => {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
            resolve(confirmed);
          }, 240);
        };

        const handleKeydown = (e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            cleanup(false);
          }
        };

        document.addEventListener('keydown', handleKeydown);

        cancelBtn?.addEventListener('click', () => cleanup(false));
        closeBtn?.addEventListener('click', () => cleanup(false));
        confirmBtn?.addEventListener('click', () => cleanup(true));

        // Click ngoài backdrop để đóng
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            cleanup(false);
          }
        });
      });
    }
  };

  // Vô hiệu hóa hoàn toàn Toast (silent no-op) để không bao giờ hiển thị Toast
  window.Toast = {
    success: () => {},
    error: () => {},
    warning: () => {},
    info: () => {}
  };

  // Xuất ra window
  window.ConfirmModal = ConfirmModal;

})();
