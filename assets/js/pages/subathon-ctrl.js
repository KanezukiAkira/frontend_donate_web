document.addEventListener('DOMContentLoaded', async () => {
  if (!AuthService.isLoggedIn()) {
    window.location.href = '../index.html';
    return;
  }

  const user = AuthService.getCurrentUser() || Storage.getUser();
  const role = (user?.role || '').toLowerCase();
  if (role !== 'admin') {
    window.location.href = '../index.html';
    return;
  }

  let currentSession = null;
  let localRemainingSeconds = 0;
  let timerInterval = null;

  const noSessionView = document.getElementById('noSessionView');
  const activeSessionView = document.getElementById('activeSessionView');
  const createSubathonForm = document.getElementById('createSubathonForm');

  const sessionTitleEl = document.getElementById('sessionTitle');
  const sessionStatusBadge = document.getElementById('sessionStatusBadge');
  const countdownDisplay = document.getElementById('countdownDisplay');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const endBtn = document.getElementById('endBtn');
  const newSessionBtn = document.getElementById('newSessionBtn');
  const logsTableBody = document.getElementById('logsTableBody');
  const customAdjustForm = document.getElementById('customAdjustForm');
  const adjustSecondsInput = document.getElementById('adjustSeconds');
  const adjustNoteInput = document.getElementById('adjustNote');
  const subathonObsLink = document.getElementById('subathonObsLink');

  async function loadSubathonSession() {
    try {
      currentSession = await SubathonService.getCurrentSession();
      if (!currentSession || currentSession.status === 'ended') {
        showCreateView();
      } else {
        showActiveView();
      }
    } catch (err) {
      console.error('Lỗi khi tải phiên Subathon:', err);
      showCreateView();
    }
  }

  function showCreateView() {
    if (noSessionView) noSessionView.style.display = 'block';
    if (activeSessionView) activeSessionView.style.display = 'none';
    clearInterval(timerInterval);
  }

  function showActiveView() {
    if (!currentSession) return showCreateView();

    if (noSessionView) noSessionView.style.display = 'none';
    if (activeSessionView) activeSessionView.style.display = 'block';

    sessionTitleEl.textContent = currentSession.title;
    localRemainingSeconds = currentSession.remaining_seconds || 0;

    updateStatusUI();

    if (subathonObsLink && currentSession.widget_token) {
      subathonObsLink.value = `${window.location.origin}/widgets/subathon-timer.html?token=${currentSession.widget_token}`;
    }

    startLocalCountdown();

    loadAuditLogs();
  }

  function updateStatusUI() {
    if (!currentSession) return;
    const status = (currentSession.status || '').toLowerCase();
    sessionStatusBadge.className = 'badge';

    if (newSessionBtn) newSessionBtn.style.display = 'none';

    if (status === 'active') {
      sessionStatusBadge.classList.add('badge-active');
      sessionStatusBadge.textContent = 'ĐANG CHẠY (LIVE)';
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-flex';
      resumeBtn.style.display = 'none';
      endBtn.style.display = 'inline-flex';
    } else if (status === 'paused') {
      sessionStatusBadge.classList.add('badge-paused');
      sessionStatusBadge.textContent = 'TẠM DỪNG (PAUSED)';
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'none';
      resumeBtn.style.display = 'inline-flex';
      endBtn.style.display = 'inline-flex';
    } else if (status === 'pending') {
      sessionStatusBadge.classList.add('badge-paused');
      sessionStatusBadge.textContent = 'CHỜ BẮT ĐẦU';
      startBtn.style.display = 'inline-flex';
      pauseBtn.style.display = 'none';
      resumeBtn.style.display = 'none';
      endBtn.style.display = 'inline-flex';
    } else {
      sessionStatusBadge.classList.add('badge-ended');
      sessionStatusBadge.textContent = 'ĐÃ KẾT THÚC';
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'none';
      resumeBtn.style.display = 'none';
      endBtn.style.display = 'none';
      if (newSessionBtn) newSessionBtn.style.display = 'inline-flex';
    }

    countdownDisplay.textContent = Formatters.duration(localRemainingSeconds);
  }

  function startLocalCountdown() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (currentSession && currentSession.status === 'active' && localRemainingSeconds > 0) {
        localRemainingSeconds--;
        countdownDisplay.textContent = Formatters.duration(localRemainingSeconds);
      }
    }, 1000);
  }

  async function loadAuditLogs() {
    if (!currentSession || !logsTableBody) return;
    try {
      const logs = await SubathonService.getLogs(currentSession.id);
      if (!logs || logs.length === 0) {
        logsTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Chưa có bản ghi biến động thời gian nào</td></tr>';
        return;
      }

      logsTableBody.innerHTML = logs.map(log => `
        <tr>
          <td class="font-mono text-muted">${Formatters.dateTime(log.created_at)}</td>
          <td><span class="badge ${log.change_type === 'DONATION' ? 'badge-active' : 'badge-paused'}">${log.change_type}</span></td>
          <td class="font-mono font-bold ${log.seconds_delta > 0 ? 'text-emerald' : 'text-rose'}">
            ${Formatters.secondsDelta(log.seconds_delta)}
          </td>
          <td class="font-mono">${Formatters.duration(log.new_remaining_seconds)}</td>
          <td class="text-muted">${log.note || '--'}</td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Lỗi tải audit logs:', err);
    }
  }

  createSubathonForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      title: document.getElementById('createTitle').value.trim(),
      initial_duration_seconds: Number(document.getElementById('createDuration').value) * 60,
      unit_amount: Number(document.getElementById('createUnitAmount').value),
      seconds_per_unit: Number(document.getElementById('createSecondsPerUnit').value),
      min_amount_to_add: Number(document.getElementById('createMinAmount').value),
      max_cap_seconds: Number(document.getElementById('createMaxCap').value) * 3600
    };

    try {
      currentSession = await SubathonService.createSession(data);
      showActiveView();
    } catch (err) {
      console.error('Lỗi khi khởi tạo Subathon:', err);
    }
  });

  function broadcastSubathonUpdate(action, payload = {}) {
    const data = {
      event: action,
      action: action,
      _type: action,
      timestamp: Date.now(),
      widget_token: currentSession?.widget_token,
      session_id: currentSession?.id,
      remaining_seconds: typeof payload.remaining_seconds === 'number'
        ? payload.remaining_seconds
        : localRemainingSeconds,
      status: payload.status || currentSession?.status,
      ...payload
    };

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('obs_subathon_channel');
        bc.postMessage(data);
        bc.close();
      } catch (err) {
        console.warn('Lỗi gửi BroadcastChannel subathon:', err);
      }
    }

    try {
      localStorage.setItem('subathon_sync_event', JSON.stringify({
        event: action,
        payload: data,
        _ts: Date.now()
      }));
    } catch (err) {
      console.warn('Lỗi ghi subathon_sync_event vào storage:', err);
    }
  }

  startBtn?.addEventListener('click', async () => {
    try {
      currentSession = await SubathonService.start(currentSession.id);
      localRemainingSeconds = currentSession.remaining_seconds;
      updateStatusUI();
      loadAuditLogs();
      broadcastSubathonUpdate('subathon-started', {
        remaining_seconds: currentSession.remaining_seconds,
        status: 'active'
      });
    } catch (err) {
      console.error('Lỗi khi kích hoạt:', err);
    }
  });

  pauseBtn?.addEventListener('click', async () => {
    try {
      currentSession = await SubathonService.pause(currentSession.id);
      localRemainingSeconds = currentSession.remaining_seconds;
      updateStatusUI();
      loadAuditLogs();
      broadcastSubathonUpdate('subathon-paused', {
        remaining_seconds: currentSession.remaining_seconds,
        status: 'paused'
      });
    } catch (err) {
      console.error('Lỗi khi tạm dừng:', err);
    }
  });

  resumeBtn?.addEventListener('click', async () => {
    try {
      currentSession = await SubathonService.resume(currentSession.id);
      localRemainingSeconds = currentSession.remaining_seconds;
      updateStatusUI();
      loadAuditLogs();
      broadcastSubathonUpdate('subathon-resumed', {
        remaining_seconds: currentSession.remaining_seconds,
        status: 'active'
      });
    } catch (err) {
      console.error('Lỗi khi tiếp tục:', err);
    }
  });

  endBtn?.addEventListener('click', async () => {
    if (!currentSession || !currentSession.id) {
      showCreateView();
      return;
    }

    if (typeof ConfirmModal !== 'undefined') {
      const confirmed = await ConfirmModal.show({
        title: 'Kết thúc phiên Subathon',
        message: 'Bạn có chắc chắn muốn kết thúc phiên đếm ngược Subathon hiện tại không?',
        confirmText: 'Kết thúc phiên',
        cancelText: 'Hủy bỏ',
        type: 'danger'
      });
      if (!confirmed) return;
    }

    endBtn.disabled = true;
    const origHtml = endBtn.innerHTML;
    endBtn.innerHTML = '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="vertical-align:middle;margin-right:6px;"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>Đang kết thúc...</span>';

    try {
      await SubathonService.end(currentSession.id);
      clearInterval(timerInterval);
      localRemainingSeconds = 0;
      if (currentSession) {
        currentSession.status = 'ended';
      }
      updateStatusUI();
      loadAuditLogs();
      broadcastSubathonUpdate('subathon-ended', {
        remaining_seconds: 0,
        status: 'ended'
      });
    } catch (err) {
      console.error('Lỗi khi kết thúc Subathon:', err);
      const msg = err.message || '';
      if (msg.includes('đã kết thúc') || msg.includes('Không tìm thấy') || err.status === 400 || err.status === 404) {
        clearInterval(timerInterval);
        localRemainingSeconds = 0;
        if (currentSession) currentSession.status = 'ended';
        updateStatusUI();
        loadAuditLogs();
        broadcastSubathonUpdate('subathon-ended', {
          remaining_seconds: 0,
          status: 'ended'
        });
      }
    } finally {
      endBtn.disabled = false;
      endBtn.innerHTML = origHtml;
    }
  });

  newSessionBtn?.addEventListener('click', () => {
    currentSession = null;
    localRemainingSeconds = 0;
    showCreateView();
  });

  document.querySelectorAll('.adjust-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!currentSession) return;
      const delta = Number(btn.getAttribute('data-delta'));
      try {
        currentSession = await SubathonService.adjust(currentSession.id, {
          seconds_delta: delta,
          note: `Điều chỉnh nhanh ${Formatters.secondsDelta(delta)}`
        });
        localRemainingSeconds = currentSession.remaining_seconds;
        updateStatusUI();
        loadAuditLogs();
        broadcastSubathonUpdate('subathon-time-adjusted', {
          remaining_seconds: currentSession.remaining_seconds,
          seconds_delta: delta,
          status: currentSession.status
        });
      } catch (err) {
        console.error('Lỗi điều chỉnh thời gian:', err);
      }
    });
  });

  customAdjustForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentSession) return;
    const delta = Number(adjustSecondsInput.value);
    const note = adjustNoteInput.value.trim() || 'Điều chỉnh thủ công';

    try {
      currentSession = await SubathonService.adjust(currentSession.id, {
        seconds_delta: delta,
        note: note
      });
      localRemainingSeconds = currentSession.remaining_seconds;
      updateStatusUI();
      adjustSecondsInput.value = '';
      adjustNoteInput.value = '';
      loadAuditLogs();
      broadcastSubathonUpdate('subathon-time-adjusted', {
        remaining_seconds: currentSession.remaining_seconds,
        seconds_delta: delta,
        status: currentSession.status
      });
    } catch (err) {
      console.error('Lỗi khi điều chỉnh:', err);
    }
  });

  document.getElementById('copySubathonLinkBtn')?.addEventListener('click', () => {
    if (subathonObsLink?.value) {
      navigator.clipboard.writeText(subathonObsLink.value);
    }
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setTimeout(() => {
        AuthService.logout('../index.html');
      }, 100);
    });
  }

  loadSubathonSession();
});
