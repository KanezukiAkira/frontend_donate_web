/**
 * Admin Module: Subathon Controller
 * Quản lý phiên đếm ngược Subathon, bắt đầu/tạm dừng/kết thúc, điều chỉnh giây, audit logs và đồng bộ realtime 0ms.
 */

const AdminSubathon = (() => {
  let currentSession = null;
  let localRemainingSeconds = 0;
  let timerInterval = null;
  let _isBusy = false;

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

    // 1. Kênh BroadcastChannel đồng bộ tức thời 0ms giữa Admin & OBS Widget trên cùng máy
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('obs_subathon_channel');
        bc.postMessage(data);
        bc.close();
      } catch (err) {
        console.warn('Lỗi gửi BroadcastChannel subathon:', err);
      }
    }

    // 2. Kênh Storage Event đồng bộ liên tab/cửa sổ
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

  function setControlsBusy(busy) {
    _isBusy = busy;

    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const endBtn = document.getElementById('endBtn');
    const newSessionBtn = document.getElementById('newSessionBtn');
    const customAdjustForm = document.getElementById('customAdjustForm');

    const controlBtns = [startBtn, pauseBtn, resumeBtn, endBtn, newSessionBtn];
    controlBtns.forEach(btn => {
      if (btn) {
        btn.disabled = busy;
        btn.style.opacity = busy ? '0.55' : '';
        btn.style.pointerEvents = busy ? 'none' : '';
      }
    });

    document.querySelectorAll('.adjust-pill').forEach(pill => {
      pill.disabled = busy;
      pill.style.opacity = busy ? '0.45' : '';
      pill.style.pointerEvents = busy ? 'none' : '';
    });

    const customSubmit = customAdjustForm?.querySelector('button[type="submit"]');
    if (customSubmit) {
      customSubmit.disabled = busy;
      customSubmit.style.opacity = busy ? '0.55' : '';
    }
  }

  function showCreateView() {
    const noSessionView = document.getElementById('noSessionView');
    const activeSessionView = document.getElementById('activeSessionView');
    if (noSessionView) noSessionView.style.display = 'block';
    if (activeSessionView) activeSessionView.style.display = 'none';
    clearInterval(timerInterval);

    if (window.AdminOverview && typeof window.AdminOverview.updateSubathonOverviewWidget === 'function') {
      window.AdminOverview.updateSubathonOverviewWidget(null);
    }

    const subtitleInput = document.getElementById('createSubtitle');
    if (subtitleInput && !subtitleInput.value) {
      subtitleInput.value = localStorage.getItem('subathon_custom_subtitle') || '';
    }
  }

  function updateStatusUI() {
    if (!currentSession) return;
    const status = (currentSession.status || '').toLowerCase();

    const sessionStatusBadge = document.getElementById('sessionStatusBadge');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const endBtn = document.getElementById('endBtn');
    const newSessionBtn = document.getElementById('newSessionBtn');
    const countdownDisplay = document.getElementById('countdownDisplay');

    if (!sessionStatusBadge) return;
    sessionStatusBadge.className = 'badge';

    if (newSessionBtn) newSessionBtn.style.display = 'none';

    if (status === 'active') {
      sessionStatusBadge.className = 'badge-live';
      sessionStatusBadge.textContent = 'ĐANG CHẠY (LIVE)';
      if (startBtn) startBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'inline-flex';
      if (resumeBtn) resumeBtn.style.display = 'none';
      if (endBtn) endBtn.style.display = 'inline-flex';
    } else if (status === 'paused') {
      sessionStatusBadge.className = 'badge-paused';
      sessionStatusBadge.textContent = 'TẠM DỪNG (PAUSED)';
      if (startBtn) startBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (resumeBtn) resumeBtn.style.display = 'inline-flex';
      if (endBtn) endBtn.style.display = 'inline-flex';
    } else if (status === 'pending') {
      sessionStatusBadge.className = 'badge-paused';
      sessionStatusBadge.textContent = 'CHỜ BẮT ĐẦU';
      if (startBtn) startBtn.style.display = 'inline-flex';
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (resumeBtn) resumeBtn.style.display = 'none';
      if (endBtn) endBtn.style.display = 'inline-flex';
    } else {
      sessionStatusBadge.className = 'badge-ended';
      sessionStatusBadge.textContent = 'ĐÃ KẾT THÚC';
      if (startBtn) startBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'none';
      if (resumeBtn) resumeBtn.style.display = 'none';
      if (endBtn) endBtn.style.display = 'none';
      if (newSessionBtn) newSessionBtn.style.display = 'inline-flex';
    }

    if (countdownDisplay) {
      countdownDisplay.textContent = Formatters.duration(localRemainingSeconds);
    }
  }

  function startLocalCountdown() {
    clearInterval(timerInterval);
    const countdownDisplay = document.getElementById('countdownDisplay');
    timerInterval = setInterval(() => {
      if (currentSession && currentSession.status === 'active' && localRemainingSeconds > 0) {
        localRemainingSeconds--;
        if (countdownDisplay) {
          countdownDisplay.textContent = Formatters.duration(localRemainingSeconds);
        }
      }
    }, 1000);
  }

  function showActiveView() {
    if (!currentSession) return showCreateView();

    const noSessionView = document.getElementById('noSessionView');
    const activeSessionView = document.getElementById('activeSessionView');
    const sessionTitleEl = document.getElementById('sessionTitle');
    const subathonObsLink = document.getElementById('subathonObsLink');
    const subathonWidgetUrl = document.getElementById('subathonWidgetUrl');

    if (noSessionView) noSessionView.style.display = 'none';
    if (activeSessionView) activeSessionView.style.display = 'block';

    if (sessionTitleEl) sessionTitleEl.textContent = currentSession.title || 'SUBATHON LIVE';
    localRemainingSeconds = currentSession.remaining_seconds || (currentSession.initial_duration_minutes ? currentSession.initial_duration_minutes * 60 : 0);

    updateStatusUI();

    let obsUrl = '';
    if (window.AdminOverview && typeof window.AdminOverview.buildSubathonObsUrl === 'function') {
      obsUrl = window.AdminOverview.buildSubathonObsUrl(currentSession.widget_token);
    }
    if (subathonObsLink && obsUrl) subathonObsLink.value = obsUrl;
    if (subathonWidgetUrl && obsUrl) subathonWidgetUrl.value = obsUrl;

    const sessionSubtitleEl = document.getElementById('sessionSubtitle');
    const savedSubtitle = localStorage.getItem('subathon_custom_subtitle') || '';
    if (sessionSubtitleEl) {
      if (savedSubtitle) {
        sessionSubtitleEl.textContent = savedSubtitle;
        sessionSubtitleEl.style.display = 'block';
      } else {
        sessionSubtitleEl.textContent = '';
        sessionSubtitleEl.style.display = 'none';
      }
    }

    if (window.AdminOverview && typeof window.AdminOverview.updateSubathonOverviewWidget === 'function') {
      window.AdminOverview.updateSubathonOverviewWidget(currentSession.widget_token);
    }

    startLocalCountdown();
    loadAuditLogs();

    if (activeSessionView) {
      activeSessionView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async function loadSubathonSession() {
    try {
      const res = await SubathonService.getCurrentSession();
      currentSession = (res && res.id) ? res : (res && res.data ? res.data : res);
      if (!currentSession || currentSession.status === 'ended') {
        showCreateView();
        if (window.AdminOverview && typeof window.AdminOverview.updateSubathonOverviewWidget === 'function') {
          window.AdminOverview.updateSubathonOverviewWidget(null);
        }
      } else {
        showActiveView();
        if (window.AdminOverview && typeof window.AdminOverview.updateSubathonOverviewWidget === 'function') {
          window.AdminOverview.updateSubathonOverviewWidget(currentSession.widget_token);
        }
      }
    } catch (err) {
      console.warn('Lỗi khi tải phiên Subathon:', err);
      showCreateView();
      if (window.AdminOverview && typeof window.AdminOverview.updateSubathonOverviewWidget === 'function') {
        window.AdminOverview.updateSubathonOverviewWidget(null);
      }
    }
  }

  async function loadAuditLogs() {
    const logsTableBody = document.getElementById('logsTableBody');
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
          <td><span class="badge ${log.change_type === 'DONATION' ? 'badge-live' : 'badge-paused'}">${log.change_type}</span></td>
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

  function init() {
    const createSubathonForm = document.getElementById('createSubathonForm');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const endBtn = document.getElementById('endBtn');
    const newSessionBtn = document.getElementById('newSessionBtn');
    const customAdjustForm = document.getElementById('customAdjustForm');
    const adjustSecondsInput = document.getElementById('adjustSeconds');
    const adjustNoteInput = document.getElementById('adjustNote');
    const subathonObsLink = document.getElementById('subathonObsLink');
    const copySubathonLinkBtn = document.getElementById('copySubathonLinkBtn');

    createSubathonForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        title: document.getElementById('createTitle').value.trim(),
        initial_duration_minutes: Number(document.getElementById('createDuration').value),
        unit_amount: Number(document.getElementById('createUnitAmount').value),
        seconds_per_unit: Number(document.getElementById('createSecondsPerUnit').value),
        min_amount_to_add: Number(document.getElementById('createMinAmount').value),
        max_cap_hours: Number(document.getElementById('createMaxCap').value)
      };

      const customSubtitle = (document.getElementById('createSubtitle')?.value || '').trim();
      if (customSubtitle) {
        localStorage.setItem('subathon_custom_subtitle', customSubtitle);
      } else {
        localStorage.removeItem('subathon_custom_subtitle');
      }

      const submitBtn = createSubathonForm.querySelector('button[type="submit"]');
      const origHTML = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Đang khởi tạo...';
      }

      try {
        const res = await SubathonService.createSession(data);
        currentSession = (res && res.id) ? res : (res && res.data ? res.data : res);
        showActiveView();
      } catch (err) {
        console.error('Lỗi khi khởi tạo Subathon:', err);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origHTML;
        }
      }
    });

    startBtn?.addEventListener('click', async () => {
      if (_isBusy) return;
      setControlsBusy(true);
      const origHTML = startBtn.innerHTML;
      startBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Đang xử lý...`;
      try {
        const res = await SubathonService.start(currentSession.id);
        currentSession = (res && res.id) ? res : (res && res.data ? res.data : res);
        localRemainingSeconds = currentSession.remaining_seconds;
        updateStatusUI();
        loadAuditLogs();
        broadcastSubathonUpdate('subathon-started', {
          remaining_seconds: currentSession.remaining_seconds,
          status: 'active'
        });
      } catch (err) {
        console.error('Lỗi khi kích hoạt:', err);
      } finally {
        startBtn.innerHTML = origHTML;
        setControlsBusy(false);
      }
    });

    pauseBtn?.addEventListener('click', async () => {
      if (_isBusy) return;
      setControlsBusy(true);
      const origHTML = pauseBtn.innerHTML;
      pauseBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Đang xử lý...`;
      try {
        const res = await SubathonService.pause(currentSession.id);
        currentSession = (res && res.id) ? res : (res && res.data ? res.data : res);
        localRemainingSeconds = currentSession.remaining_seconds;
        updateStatusUI();
        loadAuditLogs();
        broadcastSubathonUpdate('subathon-paused', {
          remaining_seconds: currentSession.remaining_seconds,
          status: 'paused'
        });
      } catch (err) {
        console.error('Lỗi khi tạm dừng:', err);
      } finally {
        pauseBtn.innerHTML = origHTML;
        setControlsBusy(false);
      }
    });

    resumeBtn?.addEventListener('click', async () => {
      if (_isBusy) return;
      setControlsBusy(true);
      const origHTML = resumeBtn.innerHTML;
      resumeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Đang xử lý...`;
      try {
        const res = await SubathonService.resume(currentSession.id);
        currentSession = (res && res.id) ? res : (res && res.data ? res.data : res);
        localRemainingSeconds = currentSession.remaining_seconds;
        updateStatusUI();
        loadAuditLogs();
        broadcastSubathonUpdate('subathon-resumed', {
          remaining_seconds: currentSession.remaining_seconds,
          status: 'active'
        });
      } catch (err) {
        console.error('Lỗi khi tiếp tục:', err);
      } finally {
        resumeBtn.innerHTML = origHTML;
        setControlsBusy(false);
      }
    });

    endBtn?.addEventListener('click', async () => {
      if (_isBusy) return;
      if (!currentSession || !currentSession.id) {
        showCreateView();
        return;
      }

      if (typeof ConfirmModal !== 'undefined') {
        const confirmed = await ConfirmModal.show({
          title: 'Kết thúc phiên Subathon',
          message: 'Bạn có chắc chắn muốn dừng và kết thúc phiên Subathon hiện tại? Bộ đếm thời gian sẽ dừng lại.',
          confirmText: 'Kết thúc phiên',
          cancelText: 'Hủy bỏ',
          type: 'danger'
        });
        if (!confirmed) return;
      }

      setControlsBusy(true);
      const origHTML = endBtn.innerHTML;
      endBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Đang kết thúc...`;

      try {
        await SubathonService.end(currentSession.id);
        clearInterval(timerInterval);
        localRemainingSeconds = 0;
        if (currentSession) currentSession.status = 'ended';
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
        endBtn.innerHTML = origHTML;
        setControlsBusy(false);
      }
    });

    newSessionBtn?.addEventListener('click', () => {
      currentSession = null;
      localRemainingSeconds = 0;
      showCreateView();
    });

    document.querySelectorAll('.adjust-pill').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (_isBusy || !currentSession) return;
        const delta = Number(btn.getAttribute('data-delta'));

        setControlsBusy(true);
        const origText = btn.innerHTML;
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>';

        try {
          const res = await SubathonService.adjust(currentSession.id, {
            seconds_delta: delta,
            note: `Điều chỉnh nhanh ${Formatters.secondsDelta(delta)}`
          });
          currentSession = (res && res.id) ? res : (res && res.data ? res.data : res);
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
        } finally {
          btn.innerHTML = origText;
          setControlsBusy(false);
        }
      });
    });

    customAdjustForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (_isBusy || !currentSession) return;
      const seconds = Number(adjustSecondsInput?.value);
      const note = adjustNoteInput?.value.trim();

      const submitBtn = customAdjustForm.querySelector('button[type="submit"]');
      const origHTML = submitBtn?.innerHTML;
      setControlsBusy(true);
      if (submitBtn) submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="vertical-align:middle;margin-right:6px;"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>Đang xử lý...';

      try {
        const res = await SubathonService.adjust(currentSession.id, {
          seconds_delta: seconds,
          note: note || `Thủ công: ${Formatters.secondsDelta(seconds)}`
        });
        currentSession = (res && res.id) ? res : (res && res.data ? res.data : res);
        localRemainingSeconds = currentSession.remaining_seconds;
        updateStatusUI();
        if (adjustSecondsInput) adjustSecondsInput.value = '';
        if (adjustNoteInput) adjustNoteInput.value = '';
        loadAuditLogs();
        broadcastSubathonUpdate('subathon-time-adjusted', {
          remaining_seconds: currentSession.remaining_seconds,
          seconds_delta: seconds,
          status: currentSession.status
        });
      } catch (err) {
        console.error('Lỗi khi điều chỉnh:', err);
      } finally {
        if (submitBtn && origHTML) submitBtn.innerHTML = origHTML;
        setControlsBusy(false);
      }
    });

    if (copySubathonLinkBtn && subathonObsLink) {
      copySubathonLinkBtn.addEventListener('click', async () => {
        if (!subathonObsLink.value) return;
        const origHTML = copySubathonLinkBtn.innerHTML;
        try {
          await navigator.clipboard.writeText(subathonObsLink.value);
          copySubathonLinkBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Đã sao chép!`;
          setTimeout(() => { copySubathonLinkBtn.innerHTML = origHTML; }, 2000);
        } catch {
          subathonObsLink.select();
          document.execCommand('copy');
          copySubathonLinkBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Đã sao chép!`;
          setTimeout(() => { copySubathonLinkBtn.innerHTML = origHTML; }, 2000);
        }
      });
    }
  }

  return {
    init,
    loadSubathonSession,
    showCreateView,
    showActiveView,
    broadcastSubathonUpdate
  };
})();

window.AdminSubathon = AdminSubathon;
