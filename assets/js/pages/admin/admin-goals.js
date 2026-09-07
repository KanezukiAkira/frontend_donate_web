/**
 * Admin Module: Goals Tab Controller
 * Quản lý mục tiêu donate (Donation Goals), tiến độ, cập nhật số tiền, kết thúc, đặt lại và hiển thị trên OBS overlay.
 */

const AdminGoals = (() => {
  let currentActiveGoal = null;
  const origin = window.location.origin;

  function buildGoalObsUrl(token) {
    if (!token) return `${origin}/widgets/goal-bar.html`;
    return `${origin}/widgets/goal-bar.html?token=${token}`;
  }

  function updateGoalOverviewWidget(token) {
    const goalOverviewWidgetUrl = document.getElementById('goalOverviewWidgetUrl');
    const goalOverviewActionBtn = document.getElementById('goalOverviewActionBtn');
    const goalOverviewHint = document.getElementById('goalOverviewHint');
    if (!goalOverviewWidgetUrl || !goalOverviewActionBtn) return;

    if (token) {
      const url = buildGoalObsUrl(token);
      goalOverviewWidgetUrl.value = url;
      if (goalOverviewHint) {
        goalOverviewHint.innerHTML = 'Khuyến nghị: 540×120px. Nền kính trong suốt, đặt ở trên hoặc dưới màn hình OBS.';
      }
    } else {
      goalOverviewWidgetUrl.value = `${origin}/widgets/goal-bar.html`;
      if (goalOverviewHint) {
        goalOverviewHint.innerHTML = '<span style="color:var(--gold);display:inline-flex;align-items:center;gap:4px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Chưa có mục tiêu hoạt động.</span> Nhấn <strong>Mục tiêu</strong> để thiết lập và lấy link OBS.';
      }
    }
  }

  function renderActiveGoalUI(goal) {
    currentActiveGoal = goal;
    const noGoalView = document.getElementById('noGoalView');
    const activeGoalView = document.getElementById('activeGoalView');
    const activeGoalTitle = document.getElementById('activeGoalTitle');
    const activeGoalDesc = document.getElementById('activeGoalDesc');
    const activeGoalStatusBadge = document.getElementById('activeGoalStatusBadge');
    const activeGoalProgressBar = document.getElementById('activeGoalProgressBar');
    const activeGoalCurrentText = document.getElementById('activeGoalCurrentText');
    const activeGoalTargetText = document.getElementById('activeGoalTargetText');
    const activeGoalPctBadge = document.getElementById('activeGoalPctBadge');
    const pauseGoalBtn = document.getElementById('pauseGoalBtn');
    const resumeGoalBtn = document.getElementById('resumeGoalBtn');
    const newGoalBtn = document.getElementById('newGoalBtn');
    const goalObsUrl = document.getElementById('goalObsUrl');

    if (goal && (goal.status === 'active' || goal.status === 'paused')) {
      if (noGoalView) noGoalView.style.display = 'none';
      if (activeGoalView) activeGoalView.style.display = 'block';

      if (activeGoalTitle) activeGoalTitle.textContent = goal.title || 'MỤC TIÊU DONATE';
      if (activeGoalDesc) {
        activeGoalDesc.textContent = goal.description || '';
        activeGoalDesc.style.display = goal.description ? 'block' : 'none';
      }

      if (activeGoalCurrentText) activeGoalCurrentText.textContent = typeof Formatters !== 'undefined' ? Formatters.currency(goal.current_amount) : `${goal.current_amount} ₫`;
      if (activeGoalTargetText) activeGoalTargetText.textContent = typeof Formatters !== 'undefined' ? Formatters.currency(goal.target_amount) : `${goal.target_amount} ₫`;
      if (activeGoalPctBadge) activeGoalPctBadge.textContent = `${goal.percentage}%`;

      const fillPercent = Math.min(100, Math.max(0, goal.percentage));
      if (activeGoalProgressBar) {
        activeGoalProgressBar.style.width = `${fillPercent}%`;
      }

      if (activeGoalStatusBadge) {
        activeGoalStatusBadge.className = 'status-badge';
        if (goal.status === 'active') {
          activeGoalStatusBadge.classList.add('status-live');
          activeGoalStatusBadge.textContent = 'LIVE';
        } else {
          activeGoalStatusBadge.classList.add('status-paused');
          activeGoalStatusBadge.textContent = 'PAUSED';
        }
      }

      if (pauseGoalBtn && resumeGoalBtn) {
        if (goal.status === 'active') {
          pauseGoalBtn.style.display = 'inline-flex';
          resumeGoalBtn.style.display = 'none';
        } else {
          pauseGoalBtn.style.display = 'none';
          resumeGoalBtn.style.display = 'inline-flex';
        }
      }

      if (newGoalBtn) newGoalBtn.style.display = 'none';

      const obsUrl = buildGoalObsUrl(goal.widget_token);
      if (goalObsUrl) goalObsUrl.value = obsUrl;
      updateGoalOverviewWidget(goal.widget_token);
    } else {
      currentActiveGoal = null;
      if (noGoalView) noGoalView.style.display = 'block';
      if (activeGoalView) activeGoalView.style.display = 'none';
      updateGoalOverviewWidget(null);
    }
  }

  function renderGoalHistory(list) {
    const goalHistoryTableBody = document.getElementById('goalHistoryTableBody');
    if (!goalHistoryTableBody) return;
    if (!list || list.length === 0) {
      goalHistoryTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Chưa có mục tiêu nào trong lịch sử.</td></tr>';
      return;
    }

    goalHistoryTableBody.innerHTML = list.map(item => {
      let stBadge = `<span class="badge-status badge-secondary">${item.status}</span>`;
      if (item.status === 'active') stBadge = '<span class="badge-status badge-success">Đang chạy</span>';
      else if (item.status === 'paused') stBadge = '<span class="badge-status badge-warning">Tạm dừng</span>';
      else if (item.status === 'ended') stBadge = '<span class="badge-status badge-secondary">Đã kết thúc</span>';
      else if (item.status === 'completed') stBadge = '<span class="badge-status badge-success">Hoàn thành</span>';

      const cur = typeof Formatters !== 'undefined' ? Formatters.currency(item.current_amount) : `${item.current_amount} ₫`;
      const tgt = typeof Formatters !== 'undefined' ? Formatters.currency(item.target_amount) : `${item.target_amount} ₫`;
      const dt = typeof Formatters !== 'undefined' ? Formatters.dateTime(item.created_at) : new Date(item.created_at).toLocaleString('vi-VN');

      return `
        <tr>
          <td>#${item.id}</td>
          <td><strong>${item.title}</strong></td>
          <td class="text-gold font-bold">${cur}</td>
          <td>${tgt}</td>
          <td><span class="tag-pill">${item.percentage}%</span></td>
          <td>${stBadge}</td>
          <td class="text-muted text-sm">${dt}</td>
        </tr>
      `;
    }).join('');
  }

  async function loadGoalData() {
    try {
      const active = await GoalService.getActiveGoal();
      renderActiveGoalUI(active);
    } catch (err) {
      console.warn('Lỗi khi tải active goal:', err);
      renderActiveGoalUI(null);
    }

    try {
      const history = await GoalService.getHistory();
      renderGoalHistory(history);
    } catch (err) {
      console.warn('Lỗi khi tải goal history:', err);
    }
  }

  function setupPreviewGoalCopy(btn, inputEl) {
    if (!btn || !inputEl) return;
    btn.addEventListener('click', async () => {
      const baseUrl = inputEl.value || `${window.location.origin}/widgets/goal-bar.html`;
      const previewUrl = baseUrl.includes('?') ? `${baseUrl}&preview=1` : `${baseUrl}?preview=1`;
      const origHTML = btn.innerHTML;
      const copyDone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Đã sao chép!`;
      try {
        await navigator.clipboard.writeText(previewUrl);
        btn.innerHTML = copyDone;
      } catch {
        const temp = document.createElement('textarea');
        temp.value = previewUrl;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        btn.innerHTML = copyDone;
      }
      setTimeout(() => { btn.innerHTML = origHTML; }, 2000);
    });
  }

  function init() {
    const createGoalForm = document.getElementById('createGoalForm');
    const createGoalTitle = document.getElementById('createGoalTitle');
    const createGoalDesc = document.getElementById('createGoalDesc');
    const createGoalTarget = document.getElementById('createGoalTarget');
    const createGoalStarting = document.getElementById('createGoalStarting');
    const createGoalEndDate = document.getElementById('createGoalEndDate');

    const pauseGoalBtn = document.getElementById('pauseGoalBtn');
    const resumeGoalBtn = document.getElementById('resumeGoalBtn');
    const endGoalBtn = document.getElementById('endGoalBtn');
    const resetGoalBtn = document.getElementById('resetGoalBtn');
    const goalObsUrl = document.getElementById('goalObsUrl');
    const copyPreviewGoalBtn = document.getElementById('copyPreviewGoalBtn');
    const testGoalOverlayBtn = document.getElementById('testGoalOverlayBtn');
    const goalOverviewWidgetUrl = document.getElementById('goalOverviewWidgetUrl');
    const copyPreviewGoalOverviewBtn = document.getElementById('copyPreviewGoalOverviewBtn');

    const customAdjustGoalForm = document.getElementById('customAdjustGoalForm');
    const adjustGoalAmount = document.getElementById('adjustGoalAmount');
    const adjustGoalNote = document.getElementById('adjustGoalNote');

    createGoalForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = createGoalTitle?.value?.trim();
      const desc = createGoalDesc?.value?.trim() || null;
      const target = Number(createGoalTarget?.value);
      const startAmount = Number(createGoalStarting?.value || 0);
      const endDate = createGoalEndDate?.value || null;

      if (!title || !target || target <= 0) {
        return;
      }

      try {
        const newGoal = await GoalService.createGoal({
          title,
          description: desc,
          target_amount: target,
          starting_amount: startAmount,
          end_date: endDate ? new Date(endDate).toISOString() : null
        });

        renderActiveGoalUI(newGoal);
        loadGoalData();
      } catch (err) {
        console.error('Lỗi tạo mục tiêu:', err);
      }
    });

    pauseGoalBtn?.addEventListener('click', async () => {
      if (!currentActiveGoal) return;
      try {
        const res = await GoalService.changeStatus(currentActiveGoal.id, 'paused');
        renderActiveGoalUI(res);
      } catch (err) { console.error(err); }
    });

    resumeGoalBtn?.addEventListener('click', async () => {
      if (!currentActiveGoal) return;
      try {
        const res = await GoalService.changeStatus(currentActiveGoal.id, 'active');
        renderActiveGoalUI(res);
      } catch (err) { console.error(err); }
    });

    endGoalBtn?.addEventListener('click', async () => {
      if (!currentActiveGoal) return;
      if (typeof ConfirmModal !== 'undefined') {
        const confirmed = await ConfirmModal.show({
          title: 'Kết thúc mục tiêu',
          message: `Bạn có chắc chắn muốn kết thúc mục tiêu "${currentActiveGoal.title || 'hiện tại'}" không? Mục tiêu sẽ chuyển sang trạng thái đã kết thúc.`,
          confirmText: 'Kết thúc mục tiêu',
          cancelText: 'Hủy bỏ',
          type: 'warning'
        });
        if (!confirmed) return;
      }

      try {
        await GoalService.changeStatus(currentActiveGoal.id, 'ended');
        loadGoalData();
      } catch (err) { console.error(err); }
    });

    resetGoalBtn?.addEventListener('click', async () => {
      if (!currentActiveGoal) return;
      if (typeof ConfirmModal !== 'undefined') {
        const confirmed = await ConfirmModal.show({
          title: 'Đặt lại tiến độ mục tiêu',
          message: `Bạn có chắc chắn muốn đặt lại tiến độ mục tiêu "${currentActiveGoal.title || 'hiện tại'}" về số tiền ban đầu không?`,
          confirmText: 'Đặt lại tiến độ',
          cancelText: 'Hủy bỏ',
          type: 'danger'
        });
        if (!confirmed) return;
      }

      try {
        const res = await GoalService.resetGoal(currentActiveGoal.id);
        renderActiveGoalUI(res);
      } catch (err) { console.error(err); }
    });

    document.querySelectorAll('.goal-adjust-pill').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!currentActiveGoal) {
          return;
        }
        const delta = Number(btn.getAttribute('data-delta'));
        if (!delta) return;

        try {
          const res = await GoalService.adjustGoal(currentActiveGoal.id, {
            amount_delta: delta,
            note: `Điều chỉnh nhanh ${delta > 0 ? '+' : ''}${delta.toLocaleString('vi-VN')}đ`
          });
          renderActiveGoalUI(res);
        } catch (err) { console.error(err); }
      });
    });

    customAdjustGoalForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentActiveGoal) {
        return;
      }

      const delta = Number(adjustGoalAmount?.value);
      const note = adjustGoalNote?.value?.trim() || null;

      if (!delta) return;

      try {
        const res = await GoalService.adjustGoal(currentActiveGoal.id, {
          amount_delta: delta,
          note: note
        });
        renderActiveGoalUI(res);
        if (adjustGoalAmount) adjustGoalAmount.value = '';
        if (adjustGoalNote) adjustGoalNote.value = '';
      } catch (err) { console.error(err); }
    });

    testGoalOverlayBtn?.addEventListener('click', async () => {
      if (!currentActiveGoal) {
        return;
      }

      try {
        testGoalOverlayBtn.disabled = true;
        await GoalService.testGoal(currentActiveGoal.id, 50000);
      } catch (err) { console.error(err); } finally {
        setTimeout(() => { testGoalOverlayBtn.disabled = false; }, 1000);
      }
    });

    setupPreviewGoalCopy(copyPreviewGoalBtn, goalObsUrl);
    setupPreviewGoalCopy(copyPreviewGoalOverviewBtn, goalOverviewWidgetUrl);
  }

  return {
    init,
    loadGoalData,
    buildGoalObsUrl,
    updateGoalOverviewWidget,
    getActiveGoal: () => currentActiveGoal
  };
})();

window.AdminGoals = AdminGoals;
