/**
 * Admin Module: Gacha Management (Time & Reward Wheels)
 * Quản lý danh sách vòng quay may mắn, cấu hình ô phần thưởng/thử thách, quay thử OBS và xem lịch sử trúng thưởng.
 */

const AdminGacha = (() => {
  let allGachaWheels = [];
  let currentGachaFilter = 'all';

  function updateModalValueHeader(type) {
    const gachaFormValueHeader = document.getElementById('gachaFormValueHeader');
    if (gachaFormValueHeader) {
      gachaFormValueHeader.textContent = type === 'time' ? 'Số giây (+/-)' : 'Chi tiết thưởng / Thử thách';
    }
  }

  function closeGachaModal() {
    const gachaModal = document.getElementById('gachaModal');
    if (gachaModal) gachaModal.classList.remove('show');
  }

  function renderModalItems(items) {
    const gachaFormItemsTableBody = document.getElementById('gachaFormItemsTableBody');
    const gachaFormType = document.getElementById('gachaFormType');
    if (!gachaFormItemsTableBody) return;
    const isTime = (gachaFormType ? gachaFormType.value : 'time') === 'time';

    gachaFormItemsTableBody.innerHTML = items.map((item, idx) => {
      const label = item.label || '';
      const val = item.value !== undefined ? item.value : (isTime ? 60 : 'Phần thưởng');
      const weight = item.weight ?? 10;
      const color = item.color || '#f59e0b';
      const inputType = isTime ? 'number' : 'text';
      const placeholder = isTime ? '+60 hoặc -30' : 'Mô tả phần thưởng';

      return `
        <tr data-index="${idx}">
          <td>
            <input type="text" class="bento-input item-label" value="${label}" placeholder="Tên ô" style="padding:6px 10px;font-size:0.85rem;width:100%;">
          </td>
          <td>
            <input type="${inputType}" class="bento-input item-value" value="${val}" placeholder="${placeholder}" style="padding:6px 10px;font-size:0.85rem;width:100%;">
          </td>
          <td>
            <input type="number" class="bento-input item-weight" value="${weight}" min="1" placeholder="Trọng số" style="padding:6px 10px;font-size:0.85rem;width:100%;">
          </td>
          <td>
            <div style="display:flex;align-items:center;gap:6px;">
              <input type="color" class="item-color" value="${color}" style="width:32px;height:28px;border:none;background:transparent;cursor:pointer;padding:0;">
              <span class="item-color-hex" style="font-size:0.75rem;color:#94a3b8;font-family:monospace;">${color}</span>
            </div>
          </td>
          <td style="text-align:center;">
            <button type="button" class="btn btn-red btn-remove-item" data-index="${idx}" style="padding:4px 8px;font-size:0.78rem;">Xóa</button>
          </td>
        </tr>
      `;
    }).join('');

    gachaFormItemsTableBody.querySelectorAll('.item-color').forEach(picker => {
      picker.addEventListener('input', (e) => {
        const hex = picker.parentElement?.querySelector('.item-color-hex');
        if (hex) hex.textContent = e.target.value;
      });
    });

    gachaFormItemsTableBody.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const rows = gachaFormItemsTableBody.querySelectorAll('tr[data-index]');
        if (rows.length <= 2) {
          return;
        }
        btn.closest('tr')?.remove();
      });
    });
  }

  function openGachaModal(wheel = null) {
    const gachaModal = document.getElementById('gachaModal');
    const gachaModalTitle = document.getElementById('gachaModalTitle');
    const gachaFormId = document.getElementById('gachaFormId');
    const gachaFormName = document.getElementById('gachaFormName');
    const gachaFormType = document.getElementById('gachaFormType');
    const gachaFormAmount = document.getElementById('gachaFormAmount');
    const gachaFormActive = document.getElementById('gachaFormActive');

    if (!gachaModal) return;
    const isEdit = wheel !== null;
    if (gachaModalTitle) {
      gachaModalTitle.textContent = isEdit ? 'Chỉnh Sửa Vòng Quay Gacha' : 'Tạo Vòng Quay Gacha Mới';
    }

    if (gachaFormId) gachaFormId.value = isEdit ? wheel.id : '';
    if (gachaFormName) gachaFormName.value = isEdit ? wheel.name : 'Vòng Quay May Mắn';
    if (gachaFormType) gachaFormType.value = isEdit ? wheel.wheel_type : 'time';
    if (gachaFormAmount) gachaFormAmount.value = isEdit ? wheel.trigger_amount : 20000;
    if (gachaFormActive) gachaFormActive.checked = isEdit ? wheel.is_active : true;

    updateModalValueHeader(gachaFormType ? gachaFormType.value : 'time');

    let items;
    if (isEdit && wheel.rewards && wheel.rewards.length > 0) {
      items = wheel.rewards;
    } else {
      const isTime = (gachaFormType ? gachaFormType.value : 'time') === 'time';
      items = isTime ? [
        { id: '1', label: '+300s', value: 300, weight: 10, color: '#f59e0b' },
        { id: '2', label: '+120s', value: 120, weight: 20, color: '#8b5cf6' },
        { id: '3', label: '+60s', value: 60, weight: 40, color: '#10b981' },
        { id: '4', label: '+15s', value: 15, weight: 20, color: '#38bdf8' },
        { id: '5', label: '-30s', value: -30, weight: 10, color: '#ef4444' }
      ] : [
        { id: '1', label: 'Tặng Card 50k', value: 'Card điện thoại 50k', weight: 5, color: '#f59e0b' },
        { id: '2', label: 'Hát 1 bài', value: 'Streamer hát 1 bài theo yêu cầu', weight: 25, color: '#ec4899' },
        { id: '3', label: 'Chống đẩy 10 cái', value: 'Chống đẩy 10 cái', weight: 30, color: '#8b5cf6' },
        { id: '4', label: 'Uống 1 cốc nước', value: 'Uống 1 cốc nước lọc', weight: 30, color: '#38bdf8' },
        { id: '5', label: 'Lời cảm ơn đặc biệt', value: 'Cảm ơn và chúc may mắn', weight: 10, color: '#10b981' }
      ];
    }

    renderModalItems(items);
    gachaModal.classList.add('show');
  }

  function renderGachaGrid() {
    const gachaWheelsGrid = document.getElementById('gachaWheelsGrid');
    const gachaEmptyView = document.getElementById('gachaEmptyView');
    if (!gachaWheelsGrid) return;

    let filtered = allGachaWheels;
    if (currentGachaFilter !== 'all') {
      filtered = allGachaWheels.filter(w => w.wheel_type === currentGachaFilter);
    }

    if (filtered.length === 0) {
      gachaWheelsGrid.innerHTML = '';
      if (gachaEmptyView) gachaEmptyView.style.display = 'block';
      return;
    }

    if (gachaEmptyView) gachaEmptyView.style.display = 'none';

    gachaWheelsGrid.innerHTML = filtered.map(wheel => {
      const isTime = wheel.wheel_type === 'time';
      const typeBadgeClass = isTime ? 'type-time' : 'type-reward';
      const typeLabel = isTime
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="vertical-align:middle;margin-right:4px;"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9.5 3h5M12 3v2"/></svg>TIME GACHA`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" style="vertical-align:middle;margin-right:4px;"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>REWARD GACHA`;
      const statusClass = wheel.is_active ? 'badge-success' : 'badge-muted';
      const statusText = wheel.is_active ? 'Đang bật' : 'Đã tắt';
      const formattedAmount = Number(wheel.trigger_amount).toLocaleString('vi-VN') + ' ₫';
      const rewards = wheel.rewards || [];

      const obsUrl = GachaService.getObsWidgetUrl(wheel.widget_token);
      const previewUrl = GachaService.getObsWidgetUrl(wheel.widget_token, { preview: true });

      const pillsHtml = rewards.slice(0, 6).map(r => {
        let valText = r.label || r.value;
        if (isTime && typeof r.value === 'number') {
          valText = r.value >= 0 ? `+${r.value}s` : `${r.value}s`;
        }
        const sliceColor = r.color || '#facc15';
        return `<span class="gacha-slice-pill" style="border-left-color: ${sliceColor};">${valText}</span>`;
      }).join('') + (rewards.length > 6 ? `<span class="gacha-slice-pill">+${rewards.length - 6} ô</span>` : '');

      return `
        <div class="gacha-wheel-item-card ${!wheel.is_active ? 'is-inactive' : ''}" data-id="${wheel.id}">
          <div>
            <div class="gacha-card-top">
              <div>
                <span class="gacha-type-badge ${typeBadgeClass}">${typeLabel}</span>
                <h4 class="gacha-wheel-title" style="margin-top:6px;">${wheel.name}</h4>
              </div>
              <span class="badge ${statusClass}">${statusText}</span>
            </div>

            <div class="gacha-trigger-amount">
              ${formattedAmount}
              <span>kích hoạt</span>
            </div>

            <div class="gacha-slice-pills">
              ${pillsHtml}
            </div>

            <!-- OBS Link Input & Copy -->
            <div style="background:rgba(0,0,0,0.3);padding:8px 10px;border-radius:10px;margin-bottom:14px;">
              <div style="font-size:0.75rem;color:#94a3b8;margin-bottom:4px;font-weight:600;">Link OBS Browser Source:</div>
              <div style="display:flex;gap:6px;align-items:center;">
                <input type="text" class="bento-input gacha-widget-url" readonly value="${obsUrl}" style="font-size:0.78rem;padding:5px 8px;flex:1;background:rgba(0,0,0,0.4);font-family:monospace;">
                <button type="button" class="btn btn-gold btn-copy-gacha-link" data-url="${obsUrl}" style="padding:5px 10px;font-size:0.78rem;white-space:nowrap;">Chép link</button>
                <button type="button" class="btn btn-ghost btn-copy-gacha-preview" data-url="${previewUrl}" title="Sao chép link ghim xem thử" style="padding:5px 8px;font-size:0.78rem;white-space:nowrap;">Xem trước</button>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,0.06);padding-top:14px;">
            <button type="button" class="btn btn-amber btn-test-roll" data-id="${wheel.id}" style="padding:6px 12px;font-size:0.82rem;white-space:nowrap;">
              Quay thử OBS
            </button>
            <button type="button" class="btn btn-ghost btn-edit-wheel" data-id="${wheel.id}" style="padding:6px 12px;font-size:0.82rem;">
              Sửa
            </button>
            <button type="button" class="btn btn-ghost btn-toggle-wheel" data-id="${wheel.id}" style="padding:6px 10px;font-size:0.82rem;">
              ${wheel.is_active ? 'Tắt' : 'Bật'}
            </button>
            <button type="button" class="btn btn-red btn-delete-wheel" data-id="${wheel.id}" style="padding:6px 10px;font-size:0.82rem;margin-left:auto;">
              Xóa
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach card event listeners
    gachaWheelsGrid.querySelectorAll('.btn-copy-gacha-link').forEach(btn => {
      btn.addEventListener('click', async () => {
        const url = btn.getAttribute('data-url');
        const origHTML = btn.innerHTML;
        try {
          await navigator.clipboard.writeText(url);
          btn.textContent = 'Đã chép!';
        } catch {
          const t = document.createElement('textarea');
          t.value = url;
          document.body.appendChild(t);
          t.select();
          document.execCommand('copy');
          document.body.removeChild(t);
          btn.textContent = 'Đã chép!';
        }
        setTimeout(() => { btn.innerHTML = origHTML; }, 2000);
      });
    });

    gachaWheelsGrid.querySelectorAll('.btn-copy-gacha-preview').forEach(btn => {
      btn.addEventListener('click', async () => {
        const url = btn.getAttribute('data-url');
        const origHTML = btn.innerHTML;
        try {
          await navigator.clipboard.writeText(url);
          btn.textContent = 'Đã chép!';
        } catch {
          const t = document.createElement('textarea');
          t.value = url;
          document.body.appendChild(t);
          t.select();
          document.execCommand('copy');
          document.body.removeChild(t);
          btn.textContent = 'Đã chép!';
        }
        setTimeout(() => { btn.innerHTML = origHTML; }, 2000);
      });
    });

    gachaWheelsGrid.querySelectorAll('.btn-test-roll').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-id'));
        const origHTML = btn.innerHTML;
        btn.innerHTML = 'Đang quay...';
        btn.disabled = true;
        try {
          const res = await GachaService.testRoll(id, {
            donor_name: 'Streamer Thử Nghiệm',
            message: 'Quay thử vận may vòng quay!'
          });
          if (res) {
            const rollData = res.data !== undefined ? res.data : res;
            if (typeof BroadcastChannel !== 'undefined') {
              const ch = new BroadcastChannel('gacha-test');
              ch.postMessage({ _type: 'gacha-roll', payload: rollData });
            }
            loadGachaHistory();
          }
        } catch (err) {
          console.error('Lỗi quay thử:', err);
        } finally {
          btn.innerHTML = origHTML;
          btn.disabled = false;
        }
      });
    });

    gachaWheelsGrid.querySelectorAll('.btn-edit-wheel').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-id'));
        const wheel = allGachaWheels.find(w => w.id === id);
        if (wheel) openGachaModal(wheel);
      });
    });

    gachaWheelsGrid.querySelectorAll('.btn-toggle-wheel').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-id'));
        try {
          await GachaService.toggleWheel(id);
          loadGachaWheels();
        } catch (err) {
          console.error('Lỗi bật/tắt:', err);
        }
      });
    });

    gachaWheelsGrid.querySelectorAll('.btn-delete-wheel').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.getAttribute('data-id'));
        const wheelTitle = 'vòng quay này';

        if (typeof ConfirmModal !== 'undefined') {
          const confirmed = await ConfirmModal.show({
            title: 'Xóa vòng quay Gacha',
            message: `Bạn có chắc chắn muốn xóa vĩnh viễn ${wheelTitle}? Tất cả các ô phần thưởng bên trong cũng sẽ bị xóa và không thể khôi phục.`,
            confirmText: 'Xóa vòng quay',
            cancelText: 'Hủy bỏ',
            type: 'danger'
          });
          if (!confirmed) return;
        }

        try {
          await GachaService.deleteWheel(id);
          loadGachaWheels();
        } catch (err) {
          console.error('Lỗi xóa vòng quay:', err);
        }
      });
    });
  }

  async function loadGachaWheels() {
    const gachaWheelsGrid = document.getElementById('gachaWheelsGrid');
    if (!gachaWheelsGrid) return;
    try {
      const res = await GachaService.getWheels();
      allGachaWheels = Array.isArray(res) ? res : (res && res.data ? res.data : []);
      renderGachaGrid();
    } catch (err) {
      console.error('Lỗi tải danh sách vòng quay:', err);
    }
  }

  async function loadGachaHistory() {
    const gachaHistoryTableBody = document.getElementById('gachaHistoryTableBody');
    if (!gachaHistoryTableBody) return;
    try {
      const logs = await GachaService.getHistory(50);
      if (!logs || logs.length === 0) {
        gachaHistoryTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Chưa có lịch sử quay thưởng nào.</td></tr>';
        return;
      }

      gachaHistoryTableBody.innerHTML = logs.map(log => {
        const timeStr = typeof Formatters !== 'undefined'
          ? Formatters.dateTime(log.created_at)
          : (log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : '--');
        const formattedAmount = typeof Formatters !== 'undefined'
          ? Formatters.currency(log.amount)
          : Number(log.amount).toLocaleString('vi-VN') + ' ₫';
        const isTime = log.wheel_type === 'time';
        const typeBadge = isTime
          ? `<span class="gacha-type-badge type-time" style="font-size:0.7rem;padding:2px 6px;display:inline-flex;align-items:center;gap:4px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/></svg>TIME</span>`
          : `<span class="gacha-type-badge type-reward" style="font-size:0.7rem;padding:2px 6px;display:inline-flex;align-items:center;gap:4px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>REWARD</span>`;
        const wonText = log.won_reward?.label || log.won_reward?.value || '--';
        const effect = log.effect_applied || '--';

        return `
          <tr>
            <td class="font-mono text-muted">${timeStr}</td>
            <td style="font-weight:700;">${log.donor_name}</td>
            <td style="font-weight:800;color:#facc15;">${formattedAmount}</td>
            <td style="font-weight:600;">${log.wheel_name || '--'}</td>
            <td>${typeBadge}</td>
            <td style="font-weight:800;color:#38bdf8;">${wonText}</td>
            <td style="font-size:0.82rem;color:#e2e8f0;">${effect}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.warn('Lỗi tải lịch sử Gacha:', err);
      gachaHistoryTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Không thể tải lịch sử quay</td></tr>';
    }
  }

  async function loadGachaData() {
    await Promise.all([loadGachaWheels(), loadGachaHistory()]);
  }

  function init() {
    const openCreateGachaModalBtn = document.getElementById('openCreateGachaModalBtn');
    const emptyCreateGachaBtn = document.getElementById('emptyCreateGachaBtn');
    const gachaFilterBtns = document.querySelectorAll('.gacha-filter-btn');
    const refreshGachaHistoryBtn = document.getElementById('refreshGachaHistoryBtn');
    const gachaModalCloseX = document.getElementById('gachaModalCloseX');
    const gachaModalCancelBtn = document.getElementById('gachaModalCancelBtn');
    const gachaModalSaveBtn = document.getElementById('gachaModalSaveBtn');
    const gachaFormType = document.getElementById('gachaFormType');
    const gachaFormAddItemBtn = document.getElementById('gachaFormAddItemBtn');
    const gachaFormItemsTableBody = document.getElementById('gachaFormItemsTableBody');
    const gachaFormName = document.getElementById('gachaFormName');
    const gachaFormAmount = document.getElementById('gachaFormAmount');
    const gachaFormActive = document.getElementById('gachaFormActive');
    const gachaFormId = document.getElementById('gachaFormId');

    gachaFormType?.addEventListener('change', () => {
      const type = gachaFormType.value;
      updateModalValueHeader(type);
    });

    openCreateGachaModalBtn?.addEventListener('click', () => openGachaModal(null));
    emptyCreateGachaBtn?.addEventListener('click', () => openGachaModal(null));
    gachaModalCloseX?.addEventListener('click', closeGachaModal);
    gachaModalCancelBtn?.addEventListener('click', closeGachaModal);

    gachaFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        gachaFilterBtns.forEach(b => {
          b.classList.remove('btn-gold', 'active');
          b.classList.add('btn-ghost');
        });
        btn.classList.add('btn-gold', 'active');
        btn.classList.remove('btn-ghost');
        currentGachaFilter = btn.getAttribute('data-filter');
        renderGachaGrid();
      });
    });

    gachaFormAddItemBtn?.addEventListener('click', () => {
      if (!gachaFormItemsTableBody) return;
      const isTime = (gachaFormType ? gachaFormType.value : 'time') === 'time';
      const inputType = isTime ? 'number' : 'text';
      const val = isTime ? 60 : 'Phần thưởng mới';
      const label = isTime ? '+60s' : 'Thử thách';
      const color = '#38bdf8';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <input type="text" class="bento-input item-label" value="${label}" placeholder="Tên ô" style="padding:6px 10px;font-size:0.85rem;width:100%;">
        </td>
        <td>
          <input type="${inputType}" class="bento-input item-value" value="${val}" placeholder="${isTime ? '+60' : 'Mô tả'}" style="padding:6px 10px;font-size:0.85rem;width:100%;">
        </td>
        <td>
          <input type="number" class="bento-input item-weight" value="10" min="1" placeholder="Trọng số" style="padding:6px 10px;font-size:0.85rem;width:100%;">
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;">
            <input type="color" class="item-color" value="${color}" style="width:32px;height:28px;border:none;background:transparent;cursor:pointer;padding:0;">
            <span class="item-color-hex" style="font-size:0.75rem;color:#94a3b8;font-family:monospace;">${color}</span>
          </div>
        </td>
        <td style="text-align:center;">
          <button type="button" class="btn btn-red btn-remove-item" style="padding:4px 8px;font-size:0.78rem;">Xóa</button>
        </td>
      `;

      tr.querySelector('.item-color')?.addEventListener('input', (e) => {
        const hex = tr.querySelector('.item-color-hex');
        if (hex) hex.textContent = e.target.value;
      });

      tr.querySelector('.btn-remove-item')?.addEventListener('click', () => {
        const rows = gachaFormItemsTableBody.querySelectorAll('tr');
        if (rows.length <= 2) {
          return;
        }
        tr.remove();
      });

      gachaFormItemsTableBody.appendChild(tr);
    });

    gachaModalSaveBtn?.addEventListener('click', async () => {
      const name = gachaFormName?.value.trim();
      if (!name) {
        gachaFormName?.focus();
        return;
      }

      const wheelType = gachaFormType?.value || 'time';
      const amount = Number(gachaFormAmount?.value || 0);
      if (!amount || amount <= 0) {
        gachaFormAmount?.focus();
        return;
      }

      const isActive = gachaFormActive?.checked ?? true;
      const isEdit = Boolean(gachaFormId && gachaFormId.value);

      const rows = gachaFormItemsTableBody?.querySelectorAll('tr') || [];
      if (rows.length < 2) {
        return;
      }

      const rewards = [];
      rows.forEach((row, i) => {
        const labelInput = row.querySelector('.item-label');
        const valInput = row.querySelector('.item-value');
        const weightInput = row.querySelector('.item-weight');
        const colorInput = row.querySelector('.item-color');

        let label = labelInput ? labelInput.value.trim() : '';
        let rawVal = valInput ? valInput.value.trim() : '';
        const weight = weightInput ? Math.max(1, Number(weightInput.value) || 10) : 10;
        const color = colorInput ? colorInput.value : '#f59e0b';

        let value = rawVal;
        if (wheelType === 'time') {
          value = Number(rawVal) || 0;
          if (!label) label = value >= 0 ? `+${value}s` : `${value}s`;
        } else {
          if (!label) label = String(rawVal || `Ô ${i + 1}`);
        }

        rewards.push({
          id: String(i + 1),
          label,
          value,
          weight,
          color
        });
      });

      const payload = {
        name,
        wheel_type: wheelType,
        trigger_amount: amount,
        is_active: isActive,
        rewards,
        settings: {
          spin_duration: 4.2,
          tts_enabled: true
        }
      };

      const origHTML = gachaModalSaveBtn.innerHTML;
      gachaModalSaveBtn.innerHTML = 'Đang lưu...';
      gachaModalSaveBtn.disabled = true;

      try {
        if (isEdit) {
          await GachaService.updateWheel(Number(gachaFormId.value), payload);
        } else {
          await GachaService.createWheel(payload);
        }
        closeGachaModal();
        loadGachaWheels();
      } catch (err) {
        console.error('Lỗi lưu vòng quay:', err);
        alert('Lỗi lưu vòng quay: ' + (err.message || 'Vui lòng kiểm tra lại'));
      } finally {
        gachaModalSaveBtn.innerHTML = origHTML;
        gachaModalSaveBtn.disabled = false;
      }
    });

    refreshGachaHistoryBtn?.addEventListener('click', () => {
      loadGachaHistory();
    });
  }

  return {
    init,
    loadGachaData,
    loadGachaWheels,
    loadGachaHistory,
    openGachaModal,
    closeGachaModal
  };
})();

window.AdminGacha = AdminGacha;
