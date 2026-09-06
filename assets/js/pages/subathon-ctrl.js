document.addEventListener('DOMContentLoaded', async () => {
  if (!AuthService.isLoggedIn()) {
    window.location.href = '../index.html';
    return;
  }

  const user = AuthService.getCurrentUser() || Storage.getUser();
  const role = (user?.role || '').toLowerCase();
  if (role !== 'admin') {
    if (typeof Toast !== 'undefined') {
      Toast.error('Bạn không có quyền truy cập trang điều khiển Subathon!');
    }
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 1200);
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
      if (typeof Toast !== 'undefined') Toast.success('Đã tạo phiên Subathon thành công!');
      showActiveView();
    } catch (err) {
      if (typeof Toast !== 'undefined') Toast.error(err.message || 'Lỗi khi khởi tạo Subathon');
    }
  });

  startBtn?.addEventListener('click', async () => {
    try {
      currentSession = await SubathonService.start(currentSession.id);
      localRemainingSeconds = currentSession.remaining_seconds;
      updateStatusUI();
      if (typeof Toast !== 'undefined') Toast.success('Đã kích hoạt đếm ngược Subathon!');
      loadAuditLogs();
    } catch (err) {
      if (typeof Toast !== 'undefined') Toast.error(err.message || 'Lỗi khi kích hoạt');
    }
  });

  pauseBtn?.addEventListener('click', async () => {
    try {
      currentSession = await SubathonService.pause(currentSession.id);
      localRemainingSeconds = currentSession.remaining_seconds;
      updateStatusUI();
      if (typeof Toast !== 'undefined') Toast.warning('Đã tạm dừng đếm ngược');
      loadAuditLogs();
    } catch (err) {
      if (typeof Toast !== 'undefined') Toast.error(err.message || 'Lỗi khi tạm dừng');
    }
  });

  resumeBtn?.addEventListener('click', async () => {
    try {
      currentSession = await SubathonService.resume(currentSession.id);
      localRemainingSeconds = currentSession.remaining_seconds;
      updateStatusUI();
      if (typeof Toast !== 'undefined') Toast.success('Đã tiếp tục đếm ngược');
      loadAuditLogs();
    } catch (err) {
      if (typeof Toast !== 'undefined') Toast.error(err.message || 'Lỗi khi tiếp tục');
    }
  });

  endBtn?.addEventListener('click', async () => {
    if (!currentSession || !currentSession.id) {
      if (typeof Toast !== 'undefined') Toast.warning('Không tìm thấy phiên Subathon nào đang hoạt động.');
      showCreateView();
      return;
    }

    endBtn.disabled = true;
    const origHtml = endBtn.innerHTML;
    endBtn.innerHTML = '<span>⏳ Đang kết thúc...</span>';

    try {
      await SubathonService.end(currentSession.id);
      clearInterval(timerInterval);
      localRemainingSeconds = 0;
      if (currentSession) {
        currentSession.status = 'ended';
      }
      updateStatusUI();
      if (typeof Toast !== 'undefined') Toast.success('Đã kết thúc phiên Subathon thành công!');
      loadAuditLogs();
    } catch (err) {
      console.error('Lỗi khi kết thúc Subathon:', err);
      const msg = err.message || '';
      if (msg.includes('đã kết thúc') || msg.includes('Không tìm thấy') || err.status === 400 || err.status === 404) {
        clearInterval(timerInterval);
        localRemainingSeconds = 0;
        if (currentSession) currentSession.status = 'ended';
        updateStatusUI();
        if (typeof Toast !== 'undefined') Toast.info('Phiên Subathon này đã được kết thúc trước đó.');
        loadAuditLogs();
      } else {
        if (typeof Toast !== 'undefined') Toast.error(msg || 'Lỗi khi kết thúc phiên');
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
        if (typeof Toast !== 'undefined') Toast.success(`Đã điều chỉnh: ${Formatters.secondsDelta(delta)}`);
        loadAuditLogs();
      } catch (err) {
        if (typeof Toast !== 'undefined') Toast.error(err.message || 'Lỗi điều chỉnh thời gian');
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
      if (typeof Toast !== 'undefined') Toast.success(`Đã điều chỉnh ${Formatters.secondsDelta(delta)}`);
      loadAuditLogs();
    } catch (err) {
      if (typeof Toast !== 'undefined') Toast.error(err.message || 'Lỗi khi điều chỉnh');
    }
  });

  document.getElementById('copySubathonLinkBtn')?.addEventListener('click', () => {
    if (subathonObsLink?.value) {
      navigator.clipboard.writeText(subathonObsLink.value);
      if (typeof Toast !== 'undefined') Toast.success('Đã copy link Widget OBS vào clipboard!');
    }
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof Toast !== 'undefined') {
        Toast.info('Đang đăng xuất...');
      }
      setTimeout(() => {
        AuthService.logout('../index.html');
      }, 300);
    });
  }

  loadSubathonSession();
});
