
document.addEventListener('DOMContentLoaded', async () => {
  if (!AuthService.isLoggedIn()) {
    window.location.href = '../index.html';
    return;
  }

  const currentUser = AuthService.getCurrentUser() || Storage.getUser();
  const role = (currentUser?.role || '').toLowerCase();

  if (role !== 'admin') {
    window.location.href = '../index.html';
    return;
  }

  const tabItems = document.querySelectorAll('.bento-nav-item');
  const tabPanels = document.querySelectorAll('.admin-tab-content');

  function switchTab(tabName) {
    const validTabs = ['overview', 'subathon', 'goals', 'gacha', 'users', 'donations'];
    if (!validTabs.includes(tabName)) {
      tabName = 'overview';
    }

    tabItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    tabPanels.forEach(panel => {
      if (panel.id === `tab-${tabName}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    if (window.location.hash !== `#${tabName}`) {
      history.replaceState(null, '', `#${tabName}`);
    }

    if (tabName === 'subathon' || tabName === 'overview') {
      loadSubathonSession();
    }
    if (tabName === 'goals' || tabName === 'overview') {
      loadGoalData();
    } else if (tabName === 'gacha') {
      loadGachaData();
    } else if (tabName === 'users') {
      loadUsers();
    } else if (tabName === 'donations') {
      loadDonationHistory();
    }
  }

  tabItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  document.querySelectorAll('[data-jump-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.getAttribute('data-jump-tab');
      switchTab(tab);
    });
  });

  const bentoSidebar = document.getElementById('bentoSidebar');
  const adminMobileMenuBtn = document.getElementById('adminMobileMenuBtn');

  function closeAdminMobileMenu() {
    if (bentoSidebar) bentoSidebar.classList.remove('open');
    if (adminMobileMenuBtn) {
      adminMobileMenuBtn.classList.remove('active');
      adminMobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function toggleAdminMobileMenu() {
    if (!bentoSidebar || !adminMobileMenuBtn) return;
    const willOpen = !bentoSidebar.classList.contains('open');
    bentoSidebar.classList.toggle('open', willOpen);
    adminMobileMenuBtn.classList.toggle('active', willOpen);
    adminMobileMenuBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  }

  adminMobileMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleAdminMobileMenu();
  });

  tabItems.forEach(item => {
    item.addEventListener('click', () => {
      closeAdminMobileMenu();
    });
  });

  document.querySelector('.sidebar-brand-info')?.addEventListener('click', () => {
    switchTab('overview');
    closeAdminMobileMenu();
  });

  document.addEventListener('click', (e) => {
    if (bentoSidebar?.classList.contains('open')) {
      if (!bentoSidebar.contains(e.target)) {
        closeAdminMobileMenu();
      }
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      closeAdminMobileMenu();
    }
  });

  const streamerNameEl = document.getElementById('streamerName');
  const streamerEmailEl = document.getElementById('streamerEmail');
  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarUserEmail = document.getElementById('sidebarUserEmail');
  const alertWidgetUrl = document.getElementById('alertWidgetUrl');
  const subathonWidgetUrl = document.getElementById('subathonWidgetUrl');
  const logoutBtn = document.getElementById('logoutBtn');

  const fullName = currentUser.full_name || 'Admin';
  const email = currentUser.email || '';

  if (streamerNameEl) streamerNameEl.textContent = fullName;
  if (streamerEmailEl) streamerEmailEl.textContent = email;
  if (sidebarUserName) sidebarUserName.textContent = fullName;
  if (sidebarUserEmail) sidebarUserEmail.textContent = email;

  const origin = window.location.origin;
  if (alertWidgetUrl) {
    alertWidgetUrl.value = `${origin}/widgets/donate-alert.html`;
  }

  const subathonWidgetBtn = document.getElementById('subathonWidgetActionBtn');
  const subathonWidgetHint = document.getElementById('subathonWidgetHint');

  function buildSubathonObsUrl(token) {
    if (!token) return `${origin}/widgets/subathon-timer.html`;
    const customSub = localStorage.getItem('subathon_custom_subtitle') || '';
    const subParam = customSub ? `&subtitle=${encodeURIComponent(customSub)}` : '';
    return `${origin}/widgets/subathon-timer.html?token=${token}${subParam}`;
  }

  function updateSubathonOverviewWidget(token) {
    if (!subathonWidgetUrl || !subathonWidgetBtn) return;

    if (token) {
      const obsUrl = buildSubathonObsUrl(token);
      subathonWidgetUrl.value = obsUrl;
      subathonWidgetBtn.className = 'btn btn-gold copy-widget-btn';
      subathonWidgetBtn.setAttribute('data-target', 'subathonWidgetUrl');
      subathonWidgetBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        <span>Sao chép</span>
      `;
      if (subathonWidgetHint) {
        subathonWidgetHint.innerHTML = 'Khuyến nghị: 450×220px. Nền trong suốt, đặt ở góc màn hình.';
      }
    } else {
      subathonWidgetUrl.value = `${origin}/widgets/subathon-timer.html`;
      subathonWidgetBtn.className = 'btn btn-gold goto-subathon-btn';
      subathonWidgetBtn.removeAttribute('data-target');
      subathonWidgetBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        <span>Tạo phiên</span>
      `;
      if (subathonWidgetHint) {
        subathonWidgetHint.innerHTML = '<span style="color:var(--gold);display:inline-flex;align-items:center;gap:4px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Chưa có phiên hoạt động.</span> Nhấn <strong>Tạo phiên</strong> để thiết lập ca đếm ngược và lấy link OBS.';
      }
    }
  }

  updateSubathonOverviewWidget(null);

  subathonWidgetBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (subathonWidgetBtn.classList.contains('goto-subathon-btn')) {
      switchTab('subathon');
      showCreateView();
      setTimeout(() => {
        const titleInput = document.getElementById('createTitle');
        if (titleInput) {
          titleInput.focus();
          titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return;
    }

    if (subathonWidgetUrl && subathonWidgetUrl.value) {
      const origHTML = subathonWidgetBtn.innerHTML;
      const copyDone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> <span>Đã chép</span>`;
      try {
        await navigator.clipboard.writeText(subathonWidgetUrl.value);
        subathonWidgetBtn.innerHTML = copyDone;
        setTimeout(() => { subathonWidgetBtn.innerHTML = origHTML; }, 2000);
      } catch {
        subathonWidgetUrl.select();
        document.execCommand('copy');
        subathonWidgetBtn.innerHTML = copyDone;
        setTimeout(() => { subathonWidgetBtn.innerHTML = origHTML; }, 2000);
      }
    }
  });

  document.querySelectorAll('.copy-widget-btn').forEach((btn) => {
    if (btn.id === 'subathonWidgetActionBtn') return;
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-target');
      const inputEl = document.getElementById(targetId);
      if (inputEl && inputEl.value) {
        const origHTML = btn.innerHTML;
        const copyDone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Đã chép`;
        try {
          await navigator.clipboard.writeText(inputEl.value);
          btn.innerHTML = copyDone;
          setTimeout(() => { btn.innerHTML = origHTML; }, 2000);
        } catch {
          inputEl.select();
          document.execCommand('copy');
          btn.innerHTML = copyDone;
          setTimeout(() => { btn.innerHTML = origHTML; }, 2000);
        }
      }
    });
  });

  const copyPreviewAlertBtn = document.getElementById('copyPreviewAlertBtn');
  if (copyPreviewAlertBtn && alertWidgetUrl) {
    copyPreviewAlertBtn.addEventListener('click', async () => {
      const baseUrl = alertWidgetUrl.value || `${window.location.origin}/widgets/donate-alert.html`;
      const previewUrl = baseUrl.includes('?') ? `${baseUrl}&preview=1` : `${baseUrl}?preview=1`;
      const origHTML = copyPreviewAlertBtn.innerHTML;
      const copyDone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Đã sao chép!`;
      try {
        await navigator.clipboard.writeText(previewUrl);
        copyPreviewAlertBtn.innerHTML = copyDone;
      } catch {
        const temp = document.createElement('textarea');
        temp.value = previewUrl;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        copyPreviewAlertBtn.innerHTML = copyDone;
      }
      setTimeout(() => { copyPreviewAlertBtn.innerHTML = origHTML; }, 2000);
    });
  }

  const toggleObsSpecsBtn = document.getElementById('toggleObsSpecsBtn');
  const obsSpecsCollapse = document.getElementById('obsSpecsCollapse');
  if (toggleObsSpecsBtn && obsSpecsCollapse) {
    toggleObsSpecsBtn.addEventListener('click', () => {
      const isOpen = obsSpecsCollapse.classList.toggle('open');
      toggleObsSpecsBtn.classList.toggle('active', isOpen);
      toggleObsSpecsBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  const testDonateAlertBtn = document.getElementById('testDonateAlertBtn');
  if (testDonateAlertBtn) {
    const sampleDonors = ['Nguyễn Văn A', 'Fan Cứng 20 Năm', 'Một Người Giấu Tên', 'Hoàng Nam', 'Thảo Nhi'];
    const sampleAmounts = [20000, 50000, 100000, 200000, 500000];
    const sampleMessages = [
      'Chúc streamer buổi tối vui vẻ và tràn đầy năng lượng!',
      'Streamer chơi game đỉnh quá, gửi tặng ly trà sữa nhé!',
      'Ủng hộ kênh ngày càng phát triển và sớm đạt 100k sub!',
      'Cố lên streamer ơi, subathon hôm nay cháy hết mình luôn!',
      'Gửi chút động lực cho idol tối nay!'
    ];

    testDonateAlertBtn.addEventListener('click', async () => {
      const randomDonor = sampleDonors[Math.floor(Math.random() * sampleDonors.length)];
      const randomAmount = sampleAmounts[Math.floor(Math.random() * sampleAmounts.length)];
      const randomMsg = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const testChannel = new BroadcastChannel('donate-test');
          testChannel.postMessage({
            _type: 'test-donate',
            full_name: randomDonor,
            amount: randomAmount,
            message: randomMsg
          });
          testChannel.close();
        } catch (e) {
          console.warn('BroadcastChannel error:', e);
        }
      }

      try {
        await DonateService.triggerTestAlert({
          full_name: randomDonor,
          amount: randomAmount,
          message: randomMsg
        });
      } catch (err) {
        console.warn('Không thể kích hoạt test alert qua Pusher API:', err);
      }

      const origHTML = testDonateAlertBtn.innerHTML;
      testDonateAlertBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> Đã gửi Test!`;
      testDonateAlertBtn.disabled = true;


      setTimeout(() => {
        testDonateAlertBtn.innerHTML = origHTML;
        testDonateAlertBtn.disabled = false;
      }, 1800);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setTimeout(() => {
        AuthService.logout('../index.html');
      }, 250);
    });
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
  const subathonObsLink = document.getElementById('subathonObsLink');
  const customAdjustForm = document.getElementById('customAdjustForm');
  const adjustSecondsInput = document.getElementById('adjustSeconds');
  const adjustNoteInput = document.getElementById('adjustNote');
  const logsTableBody = document.getElementById('logsTableBody');

  async function loadSubathonSession() {
    try {
      const res = await SubathonService.getCurrentSession();
      currentSession = (res && res.id) ? res : (res && res.data ? res.data : res);
      if (!currentSession || currentSession.status === 'ended') {
        showCreateView();
        updateSubathonOverviewWidget(null);
      } else {
        showActiveView();
        updateSubathonOverviewWidget(currentSession.widget_token);
      }
    } catch (err) {
      console.warn('Lỗi khi tải phiên Subathon:', err);
      showCreateView();
      updateSubathonOverviewWidget(null);
    }
  }

  function showCreateView() {
    if (noSessionView) noSessionView.style.display = 'block';
    if (activeSessionView) activeSessionView.style.display = 'none';
    clearInterval(timerInterval);
    updateSubathonOverviewWidget(null);

    const subtitleInput = document.getElementById('createSubtitle');
    if (subtitleInput && !subtitleInput.value) {
      subtitleInput.value = localStorage.getItem('subathon_custom_subtitle') || '';
    }
  }

  function showActiveView() {
    if (!currentSession) return showCreateView();

    if (noSessionView) noSessionView.style.display = 'none';
    if (activeSessionView) activeSessionView.style.display = 'block';

    if (sessionTitleEl) sessionTitleEl.textContent = currentSession.title || 'SUBATHON LIVE';
    localRemainingSeconds = currentSession.remaining_seconds || (currentSession.initial_duration_minutes ? currentSession.initial_duration_minutes * 60 : 0);

    updateStatusUI();

    const obsUrl = buildSubathonObsUrl(currentSession.widget_token);
    if (subathonObsLink) subathonObsLink.value = obsUrl;
    if (subathonWidgetUrl) subathonWidgetUrl.value = obsUrl;

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

    updateSubathonOverviewWidget(currentSession.widget_token);

    startLocalCountdown();
    loadAuditLogs();

    if (activeSessionView) {
      activeSessionView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function updateStatusUI() {
    if (!currentSession) return;
    const status = (currentSession.status || '').toLowerCase();
    
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
    timerInterval = setInterval(() => {
      if (currentSession && currentSession.status === 'active' && localRemainingSeconds > 0) {
        localRemainingSeconds--;
        if (countdownDisplay) {
          countdownDisplay.textContent = Formatters.duration(localRemainingSeconds);
        }
      }
    }, 1000);
  }

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

  let _isBusy = false;

  function setControlsBusy(busy) {
    _isBusy = busy;

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
    } catch (err) {
      console.error('Lỗi khi kết thúc Subathon:', err);
      const msg = err.message || '';
      if (msg.includes('đã kết thúc') || msg.includes('Không tìm thấy') || err.status === 400 || err.status === 404) {
        clearInterval(timerInterval);
        localRemainingSeconds = 0;
        if (currentSession) currentSession.status = 'ended';
        updateStatusUI();
        loadAuditLogs();
      } else {
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
    const seconds = Number(adjustSecondsInput.value);
    const note = adjustNoteInput.value.trim();

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
      adjustSecondsInput.value = '';
      adjustNoteInput.value = '';
      loadAuditLogs();
    } catch (err) {
      console.error('Lỗi khi điều chỉnh:', err);
    } finally {
      if (submitBtn && origHTML) submitBtn.innerHTML = origHTML;
      setControlsBusy(false);
    }
  });

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
          <td><span class="badge ${log.change_type === 'DONATION' ? 'badge-live' : 'badge-paused'}">${log.change_type}</span></td>
          <td class="font-mono font-bold ${log.seconds_delta > 0 ? 'text-emerald' : 'text-rose'}">
            ${Formatters.secondsDelta(log.seconds_delta)}
          </td>
          <td class="font-mono">${Formatters.duration(log.new_remaining_seconds)}</td>
          <td class="text-muted">${log.note || '--'}</td>
        </tr>
      `).join('');
    } catch (err) {
      console.warn('Lỗi tải audit logs:', err);
    }
  }




  const userTableBody = document.getElementById('userTableBody');
  const searchFilterForm = document.getElementById('searchFilterForm');
  const filterName = document.getElementById('filterName');
  const filterEmail = document.getElementById('filterEmail');
  const filterStatus = document.getElementById('filterStatus');
  const rebuildCacheBtn = document.getElementById('rebuildCacheBtn');
  const cleanupPendingBtn = document.getElementById('cleanupPendingBtn');

  async function loadUsers(filters = {}) {
    if (!userTableBody) return;
    userTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Đang tải danh sách thành viên...</td></tr>';
    try {
      const users = await UserService.getUsers(filters);
      if (!users || users.length === 0) {
        userTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Không tìm thấy thành viên nào</td></tr>';
        return;
      }

      userTableBody.innerHTML = users.map(u => `
        <tr>
          <td class="font-mono">#${u.id}</td>
          <td class="font-bold">${u.full_name}</td>
          <td class="font-mono">${u.email}</td>
          <td><span class="badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}">${u.role}</span></td>
          <td><span class="badge ${u.is_active ? 'badge-live' : 'badge-ended'}">${u.is_active ? 'Hoạt động' : 'Bị khóa'}</span></td>
          <td class="font-bold stat-gold">${Formatters.currency(u.total_donated ?? 0)}</td>
          <td class="text-muted font-mono">${Formatters.dateTime(u.created_at)}</td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
      userTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-rose">Không thể tải danh sách người dùng.</td></tr>';
    }
  }

  searchFilterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    loadUsers({
      name: filterName?.value.trim(),
      email: filterEmail?.value.trim(),
      status: filterStatus?.value
    });
  });

  rebuildCacheBtn?.addEventListener('click', async () => {
    if (typeof ConfirmModal !== 'undefined') {
      const confirmed = await ConfirmModal.show({
        title: 'Tái tạo Leaderboard Cache',
        message: 'Bạn có chắc chắn muốn tái tạo toàn bộ cache Leaderboard Redis từ MySQL? Hệ thống sẽ quét lại dữ liệu donate và đồng bộ xếp hạng.',
        confirmText: 'Tái tạo ngay',
        cancelText: 'Hủy bỏ',
        type: 'warning'
      });
      if (!confirmed) return;
    }

    rebuildCacheBtn.disabled = true;
    const orig = rebuildCacheBtn.innerHTML;
    rebuildCacheBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="vertical-align:middle;margin-right:6px;"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>Đang tái tạo...';

    try {
      await DonateService.rebuildLeaderboard();
      rebuildCacheBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="vertical-align:middle;margin-right:6px;"><polyline points="20 6 9 17 4 12"/></svg>Đã tái tạo!';
      setTimeout(() => { rebuildCacheBtn.innerHTML = orig; }, 2000);
    } catch (err) {
      console.error('Lỗi khi tái tạo cache:', err);
      rebuildCacheBtn.innerHTML = orig;
    } finally {
      rebuildCacheBtn.disabled = false;
    }
  });

  cleanupPendingBtn?.addEventListener('click', async () => {
    if (typeof ConfirmModal !== 'undefined') {
      const confirmed = await ConfirmModal.show({
        title: 'Dọn dẹp đơn Pending',
        message: 'Bạn có chắc chắn muốn xóa tất cả các bản ghi donate ở trạng thái pending quá 30 phút? Hành động này không thể hoàn tác.',
        confirmText: 'Dọn dẹp ngay',
        cancelText: 'Hủy bỏ',
        type: 'danger'
      });
      if (!confirmed) return;
    }

    cleanupPendingBtn.disabled = true;
    const orig = cleanupPendingBtn.innerHTML;
    cleanupPendingBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="vertical-align:middle;margin-right:6px;"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>Đang dọn dẹp...';

    try {
      await DonateService.cleanupExpired();
      cleanupPendingBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="vertical-align:middle;margin-right:6px;"><polyline points="20 6 9 17 4 12"/></svg>Đã dọn dẹp!';
      setTimeout(() => { cleanupPendingBtn.innerHTML = orig; }, 2000);
    } catch (err) {
      console.error('Lỗi khi dọn dẹp đơn pending:', err);
      cleanupPendingBtn.innerHTML = orig;
    } finally {
      cleanupPendingBtn.disabled = false;
    }
  });

  const donationTableBody = document.getElementById('donationTableBody');
  const donationsCountStat = document.getElementById('donationsCountStat');
  const donationsTotalStat = document.getElementById('donationsTotalStat');
  const refreshDonationsBtn = document.getElementById('refreshDonationsBtn');
  const rebuildLeaderboardBtn = document.getElementById('rebuildLeaderboardBtn');

  async function loadDonationHistory() {
    if (!donationTableBody) return;
    donationTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Đang tải lịch sử nhận donate...</td></tr>';

    try {
      const list = (typeof DonateService !== 'undefined' && typeof DonateService.getHistory === 'function')
        ? await DonateService.getHistory(50)
        : (await apiClient.get(`${CONFIG.ENDPOINTS?.DONATE?.HISTORY || '/donate/history'}?limit=50`, { requiresAuth: false })).data || [];
      if (!list || list.length === 0) {
        donationTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Chưa có giao dịch donate nào</td></tr>';
        if (donationsCountStat) donationsCountStat.textContent = '0';
        if (donationsTotalStat) donationsTotalStat.textContent = '0 ₫';
        return;
      }

      let totalAmount = 0;
      donationTableBody.innerHTML = list.map(item => {
        const amount = Number(item.amount) || 0;
        totalAmount += amount;
        const msg = item.message
          ? `<span style="color:rgba(255,255,255,0.9);">${item.message}</span>`
          : '<span class="text-muted" style="font-style:italic;">Không có lời nhắn</span>';
        const initial = (item.full_name || 'A').charAt(0).toUpperCase();

        return `
          <tr>
            <td class="font-mono text-muted">#${item.id}</td>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <span class="user-avatar-circle" style="width:30px;height:30px;font-size:12px;">${initial}</span>
                <div>
                  <strong style="color:#ffffff;">${item.full_name || 'Người ủng hộ bí mật'}</strong>
                  <div class="text-muted" style="font-size:11px;">User ID: ${item.user_id}</div>
                </div>
              </div>
            </td>
            <td class="font-bold stat-gold">${Formatters.currency(amount)}</td>
            <td style="max-width:320px;word-break:break-word;">${msg}</td>
            <td class="text-muted font-mono">${Formatters.dateTime(item.created_at)}</td>
          </tr>
        `;
      }).join('');

      if (donationsCountStat) donationsCountStat.textContent = list.length;
      if (donationsTotalStat) donationsTotalStat.textContent = Formatters.currency(totalAmount);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử donate:', err);
      donationTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-rose">Không thể tải lịch sử donate: ${err.message || ''}</td></tr>`;
    }
  }

  refreshDonationsBtn?.addEventListener('click', () => {
    loadDonationHistory();
  });

  rebuildLeaderboardBtn?.addEventListener('click', async () => {
    if (typeof ConfirmModal !== 'undefined') {
      const confirmed = await ConfirmModal.show({
        title: 'Tái tạo Leaderboard Cache',
        message: 'Bạn có chắc chắn muốn tái tạo toàn bộ cache Leaderboard Redis từ MySQL? Quá trình này sẽ đồng bộ lại toàn bộ dữ liệu bảng xếp hạng.',
        confirmText: 'Tái tạo ngay',
        cancelText: 'Hủy bỏ',
        type: 'warning'
      });
      if (!confirmed) return;
    }

    rebuildLeaderboardBtn.disabled = true;
    const orig = rebuildLeaderboardBtn.innerHTML;
    rebuildLeaderboardBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="vertical-align:middle;margin-right:6px;"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>Rebuilding...';

    try {
      await DonateService.rebuildLeaderboard();
      rebuildLeaderboardBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="vertical-align:middle;margin-right:6px;"><polyline points="20 6 9 17 4 12"/></svg>Đã tái tạo!';
      setTimeout(() => { rebuildLeaderboardBtn.innerHTML = orig; }, 2000);
    } catch (err) {
      console.error('Lỗi khi tái tạo cache:', err);
      rebuildLeaderboardBtn.innerHTML = orig;
    } finally {
      rebuildLeaderboardBtn.disabled = false;
    }
  });

  // ==========================================
  // QUẢN LÝ MỤC TIÊU DONATE (DONATION GOALS)
  // ==========================================
  let currentActiveGoal = null;

  const noGoalView = document.getElementById('noGoalView');
  const activeGoalView = document.getElementById('activeGoalView');
  const createGoalForm = document.getElementById('createGoalForm');
  const createGoalTitle = document.getElementById('createGoalTitle');
  const createGoalDesc = document.getElementById('createGoalDesc');
  const createGoalTarget = document.getElementById('createGoalTarget');
  const createGoalStarting = document.getElementById('createGoalStarting');
  const createGoalEndDate = document.getElementById('createGoalEndDate');

  const activeGoalTitle = document.getElementById('activeGoalTitle');
  const activeGoalDesc = document.getElementById('activeGoalDesc');
  const activeGoalStatusBadge = document.getElementById('activeGoalStatusBadge');
  const activeGoalProgressBar = document.getElementById('activeGoalProgressBar');
  const activeGoalCurrentText = document.getElementById('activeGoalCurrentText');
  const activeGoalTargetText = document.getElementById('activeGoalTargetText');
  const activeGoalPctBadge = document.getElementById('activeGoalPctBadge');

  const pauseGoalBtn = document.getElementById('pauseGoalBtn');
  const resumeGoalBtn = document.getElementById('resumeGoalBtn');
  const endGoalBtn = document.getElementById('endGoalBtn');
  const resetGoalBtn = document.getElementById('resetGoalBtn');
  const newGoalBtn = document.getElementById('newGoalBtn');

  const goalObsUrl = document.getElementById('goalObsUrl');
  const copyPreviewGoalBtn = document.getElementById('copyPreviewGoalBtn');
  const testGoalOverlayBtn = document.getElementById('testGoalOverlayBtn');

  const goalOverviewWidgetUrl = document.getElementById('goalOverviewWidgetUrl');
  const goalOverviewActionBtn = document.getElementById('goalOverviewActionBtn');
  const goalOverviewHint = document.getElementById('goalOverviewHint');
  const copyPreviewGoalOverviewBtn = document.getElementById('copyPreviewGoalOverviewBtn');

  const customAdjustGoalForm = document.getElementById('customAdjustGoalForm');
  const adjustGoalAmount = document.getElementById('adjustGoalAmount');
  const adjustGoalNote = document.getElementById('adjustGoalNote');
  const goalHistoryTableBody = document.getElementById('goalHistoryTableBody');

  function buildGoalObsUrl(token) {
    if (!token) return `${origin}/widgets/goal-bar.html`;
    return `${origin}/widgets/goal-bar.html?token=${token}`;
  }

  function updateGoalOverviewWidget(token) {
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
    if (goal && (goal.status === 'active' || goal.status === 'paused')) {
      if (noGoalView) noGoalView.style.display = 'none';
      if (activeGoalView) activeGoalView.style.display = 'block';

      if (activeGoalTitle) activeGoalTitle.textContent = goal.title || 'MỤC TIÊU DONATE';
      if (activeGoalDesc) {
        activeGoalDesc.textContent = goal.description || '';
        activeGoalDesc.style.display = goal.description ? 'block' : 'none';
      }

      if (activeGoalCurrentText) activeGoalCurrentText.textContent = Formatters.currency(goal.current_amount);
      if (activeGoalTargetText) activeGoalTargetText.textContent = Formatters.currency(goal.target_amount);
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

  function renderGoalHistory(list) {
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

      return `
        <tr>
          <td>#${item.id}</td>
          <td><strong>${item.title}</strong></td>
          <td class="text-gold font-bold">${Formatters.currency(item.current_amount)}</td>
          <td>${Formatters.currency(item.target_amount)}</td>
          <td><span class="tag-pill">${item.percentage}%</span></td>
          <td>${stBadge}</td>
          <td class="text-muted text-sm">${Formatters.dateTime(item.created_at)}</td>
        </tr>
      `;
    }).join('');
  }

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

  setupPreviewGoalCopy(copyPreviewGoalBtn, goalObsUrl);
  setupPreviewGoalCopy(copyPreviewGoalOverviewBtn, goalOverviewWidgetUrl);

  // ===================================================
  // GACHA MANAGEMENT MODULE (TIME & REWARD WHEELS)
  // ===================================================
  const gachaWheelsGrid = document.getElementById('gachaWheelsGrid');
  const gachaEmptyView = document.getElementById('gachaEmptyView');
  const openCreateGachaModalBtn = document.getElementById('openCreateGachaModalBtn');
  const emptyCreateGachaBtn = document.getElementById('emptyCreateGachaBtn');
  const gachaFilterBtns = document.querySelectorAll('.gacha-filter-btn');
  const refreshGachaHistoryBtn = document.getElementById('refreshGachaHistoryBtn');
  const gachaHistoryTableBody = document.getElementById('gachaHistoryTableBody');

  // Modal elements
  const gachaModal = document.getElementById('gachaModal');
  const gachaModalTitle = document.getElementById('gachaModalTitle');
  const gachaModalCloseX = document.getElementById('gachaModalCloseX');
  const gachaModalCancelBtn = document.getElementById('gachaModalCancelBtn');
  const gachaModalSaveBtn = document.getElementById('gachaModalSaveBtn');
  const gachaFormId = document.getElementById('gachaFormId');
  const gachaFormName = document.getElementById('gachaFormName');
  const gachaFormType = document.getElementById('gachaFormType');
  const gachaFormAmount = document.getElementById('gachaFormAmount');
  const gachaFormActive = document.getElementById('gachaFormActive');
  const gachaFormAddItemBtn = document.getElementById('gachaFormAddItemBtn');
  const gachaFormItemsTableBody = document.getElementById('gachaFormItemsTableBody');
  const gachaFormValueHeader = document.getElementById('gachaFormValueHeader');

  let allGachaWheels = [];
  let currentGachaFilter = 'all';

  async function loadGachaData() {
    await Promise.all([loadGachaWheels(), loadGachaHistory()]);
  }

  async function loadGachaWheels() {
    if (!gachaWheelsGrid) return;
    try {
      const res = await GachaService.getWheels();
      allGachaWheels = Array.isArray(res) ? res : (res && res.data ? res.data : []);
      renderGachaGrid();
    } catch (err) {
      console.error('Lỗi tải danh sách vòng quay:', err);
    }
  }

  function renderGachaGrid() {
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

  // Filter Buttons
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

  // Modal Open / Close
  function openGachaModal(wheel = null) {
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

    let items = [];
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

  function closeGachaModal() {
    if (gachaModal) gachaModal.classList.remove('show');
  }

  function updateModalValueHeader(type) {
    if (gachaFormValueHeader) {
      gachaFormValueHeader.textContent = type === 'time' ? 'Số giây (+/-)' : 'Chi tiết thưởng / Thử thách';
    }
  }

  gachaFormType?.addEventListener('change', () => {
    const type = gachaFormType.value;
    updateModalValueHeader(type);
  });

  openCreateGachaModalBtn?.addEventListener('click', () => openGachaModal(null));
  emptyCreateGachaBtn?.addEventListener('click', () => openGachaModal(null));
  gachaModalCloseX?.addEventListener('click', closeGachaModal);
  gachaModalCancelBtn?.addEventListener('click', closeGachaModal);

  function renderModalItems(items) {
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

  // Save Modal Form
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

    // Thu thập danh sách items
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
    } finally {
      gachaModalSaveBtn.innerHTML = origHTML;
      gachaModalSaveBtn.disabled = false;
    }
  });

  // History Table
  async function loadGachaHistory() {
    if (!gachaHistoryTableBody) return;
    try {
      const logs = await GachaService.getHistory(50);
      if (!logs || logs.length === 0) {
        gachaHistoryTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Chưa có lịch sử quay thưởng nào.</td></tr>';
        return;
      }

      gachaHistoryTableBody.innerHTML = logs.map(log => {
        const timeStr = log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : '--';
        const formattedAmount = Number(log.amount).toLocaleString('vi-VN') + ' ₫';
        const isTime = log.wheel_type === 'time';
        const typeBadge = isTime
          ? `<span class="gacha-type-badge type-time" style="font-size:0.7rem;padding:2px 6px;display:inline-flex;align-items:center;gap:4px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/></svg>TIME</span>`
          : `<span class="gacha-type-badge type-reward" style="font-size:0.7rem;padding:2px 6px;display:inline-flex;align-items:center;gap:4px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>REWARD</span>`;
        const wonText = log.won_reward?.label || log.won_reward?.value || '--';
        const effect = log.effect_applied || '--';

        return `
          <tr>
            <td style="font-size:0.8rem;color:#94a3b8;white-space:nowrap;">${timeStr}</td>
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

  refreshGachaHistoryBtn?.addEventListener('click', () => {
    loadGachaHistory();
  });

  const initialTab = window.location.hash.replace('#', '') || 'overview';
  switchTab(initialTab);
});
