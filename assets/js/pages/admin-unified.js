
document.addEventListener('DOMContentLoaded', async () => {
  if (!AuthService.isLoggedIn()) {
    window.location.href = '../index.html';
    return;
  }

  const currentUser = AuthService.getCurrentUser() || Storage.getUser();
  const role = (currentUser?.role || '').toLowerCase();

  if (role !== 'admin') {
    if (typeof Toast !== 'undefined') {
      Toast.error('Bạn không có quyền truy cập trang quản trị Admin!');
    }
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 1200);
    return;
  }

  const tabItems = document.querySelectorAll('.bento-nav-item');
  const tabPanels = document.querySelectorAll('.admin-tab-content');

  function switchTab(tabName) {
    const validTabs = ['overview', 'subathon', 'users', 'donations'];
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
  const gachaCardWidgetUrl = document.getElementById('gachaCardWidgetUrl');
  const testGachaOverlayBtn = document.getElementById('testGachaOverlayBtn');
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

  function updateGachaOverviewWidget(token) {
    const unifiedAlertUrl = token ? `${origin}/widgets/donate-alert.html?token=${token}` : `${origin}/widgets/donate-alert.html`;
    if (gachaCardWidgetUrl) gachaCardWidgetUrl.value = unifiedAlertUrl;
  }

  function updateSubathonOverviewWidget(token) {
    updateGachaOverviewWidget(token);
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
        subathonWidgetHint.innerHTML = '<span style="color:var(--gold);">⚠️ Chưa có phiên hoạt động.</span> Nhấn <strong>Tạo phiên</strong> để thiết lập ca đếm ngược và lấy link OBS.';
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
      if (typeof Toast !== 'undefined') {
        Toast.success('Đã sao chép Link Xem trước (Ghim trên OBS)!');
      }
      setTimeout(() => { copyPreviewAlertBtn.innerHTML = origHTML; }, 2000);
    });
  }

  testGachaOverlayBtn?.addEventListener('click', () => {
    if (testGachaBtn) {
      testGachaBtn.click();
    }
  });

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

      if (typeof Toast !== 'undefined') {
        Toast.success(`Đã phát test alert đến OBS: ${randomDonor} (${Formatters.currency(randomAmount)})`);
      }

      setTimeout(() => {
        testDonateAlertBtn.innerHTML = origHTML;
        testDonateAlertBtn.disabled = false;
      }, 1800);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof Toast !== 'undefined') Toast.info('Đang đăng xuất...');
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
    loadGachaConfig();
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
    loadGachaConfig();


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
    loadGachaConfig();

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
      alert(err.message || 'Lỗi khi khởi tạo Subathon');
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
      alert(err.message || 'Lỗi khi kích hoạt');
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
      alert(err.message || 'Lỗi khi tạm dừng');
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
      alert(err.message || 'Lỗi khi tiếp tục');
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
        alert(msg || 'Lỗi khi kết thúc phiên');
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
      const origText = btn.textContent;
      btn.textContent = '⏳';

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
        alert(err.message || 'Lỗi điều chỉnh thời gian');
      } finally {
        btn.textContent = origText;
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
    if (submitBtn) submitBtn.innerHTML = '⏳ Đang xử lý...';

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
      alert(err.message || 'Lỗi khi điều chỉnh');
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

  // ==========================================
  // GACHA TIME MANAGEMENT (VÒNG QUAY MAY MẮN)
  // ==========================================
  const gachaTierTabs = document.getElementById('gachaTierTabs');
  const addTierBtn = document.getElementById('addTierBtn');
  const emptyAddTierBtn = document.getElementById('emptyAddTierBtn');
  const tierEmptyBox = document.getElementById('tierEmptyBox');
  const tierDetailBox = document.getElementById('tierDetailBox');
  const tierAmountInput = document.getElementById('tierAmountInput');
  const tierNameInput = document.getElementById('tierNameInput');
  const tierEnabledInput = document.getElementById('tierEnabledInput');
  const deleteTierBtn = document.getElementById('deleteTierBtn');
  const addRewardRowBtn = document.getElementById('addRewardRowBtn');
  const gachaRewardsTableBody = document.getElementById('gachaRewardsTableBody');
  const testGachaBtn = document.getElementById('testGachaBtn');
  const saveGachaBtn = document.getElementById('saveGachaBtn');

  // Accordion toggle cho ghi chú overlay (hiệu ứng giống thông số OBS Specs)
  const toggleGachaNoticeBtn = document.getElementById('toggleGachaNoticeBtn');
  const gachaNoticeCollapse = document.getElementById('gachaNoticeCollapse');

  if (toggleGachaNoticeBtn && gachaNoticeCollapse) {
    toggleGachaNoticeBtn.addEventListener('click', () => {
      const isOpen = gachaNoticeCollapse.classList.toggle('open');
      toggleGachaNoticeBtn.classList.toggle('active', isOpen);
      toggleGachaNoticeBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  let gachaConfig = {};
  let activeGachaTierKey = null;

  async function loadGachaConfig() {
    if (!gachaTierTabs) return;
    try {
      const sessionId = currentSession ? currentSession.id : 0;
      const res = await SubathonService.getGachaConfig(sessionId);
      gachaConfig = (res && Object.keys(res).length > 0) ? res : {
        "20000": {
          "name": "Vòng Quay Thời Gian 20K",
          "enabled": true,
          "rewards": [
            {"id": "1", "label": "+300s", "seconds": 300, "weight": 5, "color": "#f59e0b"},
            {"id": "2", "label": "+120s", "seconds": 120, "weight": 20, "color": "#8b5cf6"},
            {"id": "3", "label": "+60s", "seconds": 60, "weight": 45, "color": "#10b981"},
            {"id": "4", "label": "+15s", "seconds": 15, "weight": 20, "color": "#3b82f6"},
            {"id": "5", "label": "-30s", "seconds": -30, "weight": 10, "color": "#ef4444"}
          ]
        }
      };

      renderGachaTabs();
    } catch (err) {
      console.warn('Lỗi khi tải cấu hình Gacha:', err);
      gachaConfig = {
        "20000": {
          "name": "Vòng Quay Thời Gian 20K",
          "enabled": true,
          "rewards": [
            {"id": "1", "label": "+300s", "seconds": 300, "weight": 5, "color": "#f59e0b"},
            {"id": "2", "label": "+120s", "seconds": 120, "weight": 20, "color": "#8b5cf6"},
            {"id": "3", "label": "+60s", "seconds": 60, "weight": 45, "color": "#10b981"},
            {"id": "4", "label": "+15s", "seconds": 15, "weight": 20, "color": "#3b82f6"},
            {"id": "5", "label": "-30s", "seconds": -30, "weight": 10, "color": "#ef4444"}
          ]
        }
      };
      renderGachaTabs();
    }
  }

  function renderGachaTabs() {
    if (!gachaTierTabs) return;
    const tierKeys = Object.keys(gachaConfig);

    // Khi xóa hết mốc: Ẩn bảng cấu hình, hiện thông báo trống
    if (tierKeys.length === 0) {
      gachaTierTabs.innerHTML = '';
      if (tierDetailBox) tierDetailBox.style.display = 'none';
      if (tierEmptyBox) tierEmptyBox.style.display = 'block';
      activeGachaTierKey = null;
      return;
    }

    // Khi có mốc: Hiện bảng cấu hình, ẩn thông báo trống
    if (tierEmptyBox) tierEmptyBox.style.display = 'none';
    if (tierDetailBox) tierDetailBox.style.display = 'block';

    if (!activeGachaTierKey || !gachaConfig[activeGachaTierKey]) {
      activeGachaTierKey = tierKeys[0];
    }

    gachaTierTabs.innerHTML = tierKeys.map(key => {
      const tier = gachaConfig[key];
      const isActive = key === activeGachaTierKey;
      const formattedAmount = Number(key).toLocaleString('vi-VN') + 'đ';
      const disabledTag = tier.enabled === false ? ' [Tắt]' : '';
      return `
        <button type="button" class="btn ${isActive ? 'btn-gold' : 'btn-ghost'} gacha-tab-btn" data-key="${key}" style="padding:6px 14px;font-size:0.85rem;white-space:nowrap;">
          ${formattedAmount} - ${tier.name || 'Mốc quay'}${disabledTag}
        </button>
      `;
    }).join('');

    gachaTierTabs.querySelectorAll('.gacha-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        saveCurrentTierFormToState();
        activeGachaTierKey = btn.getAttribute('data-key');
        renderGachaTabs();
        renderActiveTierDetail();
      });
    });

    renderActiveTierDetail();
  }

  function renderActiveTierDetail() {
    if (!activeGachaTierKey || !gachaConfig[activeGachaTierKey]) {
      if (tierDetailBox) tierDetailBox.style.display = 'none';
      if (tierEmptyBox) tierEmptyBox.style.display = 'block';
      return;
    }
    if (tierDetailBox) tierDetailBox.style.display = 'block';
    if (tierEmptyBox) tierEmptyBox.style.display = 'none';

    const tier = gachaConfig[activeGachaTierKey];

    if (tierAmountInput) tierAmountInput.value = activeGachaTierKey;
    if (tierNameInput) tierNameInput.value = tier.name || '';
    if (tierEnabledInput) tierEnabledInput.checked = tier.enabled !== false;

    renderRewardsTable(tier.rewards || []);
  }

  function renderRewardsTable(rewards) {
    if (!gachaRewardsTableBody) return;
    if (!rewards || rewards.length === 0) {
      gachaRewardsTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Chưa có ô thời gian nào. Hãy bấm "Thêm ô thời gian".</td></tr>';
      return;
    }

    gachaRewardsTableBody.innerHTML = rewards.map((item, idx) => {
      const sec = item.seconds ?? 60;
      const defLabel = item.label || (sec >= 0 ? `+${sec}s` : `${sec}s`);
      const itemColor = item.color || '#f59e0b';
      return `
      <tr data-index="${idx}">
        <td>
          <input type="text" class="bento-input reward-label" value="${defLabel}" placeholder="Ví dụ: +60s" style="padding:6px 10px;font-size:0.85rem;width:100%;box-sizing:border-box;">
        </td>
        <td>
          <input type="number" class="bento-input reward-seconds" value="${sec}" placeholder="+60 hoặc -30" style="padding:6px 10px;font-size:0.85rem;width:100%;box-sizing:border-box;">
        </td>
        <td>
          <input type="number" class="bento-input reward-weight" value="${item.weight ?? 10}" min="1" placeholder="Trọng số" style="padding:6px 10px;font-size:0.85rem;width:100%;box-sizing:border-box;">
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;">
            <input type="color" class="reward-color" value="${itemColor}" style="width:34px;height:28px;border:none;background:transparent;cursor:pointer;padding:0;flex-shrink:0;">
            <span class="reward-color-hex" style="font-size:0.75rem;color:#94a3b8;font-family:monospace;">${itemColor}</span>
          </div>
        </td>
        <td style="text-align:center;">
          <button type="button" class="btn btn-red btn-delete-reward" data-index="${idx}" style="padding:4px 10px;font-size:0.78rem;white-space:nowrap;">Xóa</button>
        </td>
      </tr>
      `;
    }).join('');

    gachaRewardsTableBody.querySelectorAll('.reward-color').forEach(picker => {
      picker.addEventListener('input', (e) => {
        const hexSpan = picker.parentElement?.querySelector('.reward-color-hex');
        if (hexSpan) hexSpan.textContent = e.target.value;
      });
    });

    gachaRewardsTableBody.querySelectorAll('.btn-delete-reward').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = Number(btn.getAttribute('data-index'));
        saveCurrentTierFormToState();
        if (gachaConfig[activeGachaTierKey]?.rewards) {
          gachaConfig[activeGachaTierKey].rewards.splice(index, 1);
          renderActiveTierDetail();
        }
      });
    });
  }

  function saveCurrentTierFormToState() {
    if (!activeGachaTierKey || !gachaConfig[activeGachaTierKey]) return;

    const name = tierNameInput?.value.trim() || 'Vòng Quay Thời Gian';
    const enabled = tierEnabledInput?.checked ?? true;
    const newAmountStr = String(tierAmountInput?.value || activeGachaTierKey).trim();

    const rewards = [];
    if (gachaRewardsTableBody) {
      gachaRewardsTableBody.querySelectorAll('tr[data-index]').forEach(row => {
        const seconds = Number(row.querySelector('.reward-seconds')?.value || 0);
        let label = row.querySelector('.reward-label')?.value.trim();
        if (!label) {
          label = seconds >= 0 ? `+${seconds}s` : `${seconds}s`;
        }
        const weight = Number(row.querySelector('.reward-weight')?.value || 1);
        const color = row.querySelector('.reward-color')?.value || '#f59e0b';
        rewards.push({ id: String(Date.now() + Math.random()), label, seconds, weight, color });
      });
    }

    const currentTierData = {
      name,
      enabled,
      rewards
    };

    if (newAmountStr && newAmountStr !== activeGachaTierKey) {
      delete gachaConfig[activeGachaTierKey];
      gachaConfig[newAmountStr] = currentTierData;
      activeGachaTierKey = newAmountStr;
    } else {
      gachaConfig[activeGachaTierKey] = currentTierData;
    }
  }

  // Tự động tạo mốc mới mà không dùng prompt hay confirm
  function createNewTier() {
    saveCurrentTierFormToState();
    const defaults = [20000, 50000, 100000, 200000, 500000, 1000000];
    let chosenAmount = 20000;
    for (const d of defaults) {
      if (!gachaConfig[String(d)]) {
        chosenAmount = d;
        break;
      }
    }
    if (gachaConfig[String(chosenAmount)]) {
      const existing = Object.keys(gachaConfig).map(Number);
      const maxVal = existing.length > 0 ? Math.max(...existing) : 0;
      chosenAmount = maxVal + 50000;
    }

    const key = String(chosenAmount);
    gachaConfig[key] = {
      name: `Vòng Quay ${chosenAmount.toLocaleString('vi-VN')}đ`,
      enabled: true,
      rewards: [
        {"id": "1", "label": "+300s", "seconds": 300, "weight": 10, "color": "#f59e0b"},
        {"id": "2", "label": "+120s", "seconds": 120, "weight": 20, "color": "#8b5cf6"},
        {"id": "3", "label": "+60s", "seconds": 60, "weight": 40, "color": "#10b981"},
        {"id": "4", "label": "+15s", "seconds": 15, "weight": 20, "color": "#3b82f6"},
        {"id": "5", "label": "-30s", "seconds": -30, "weight": 10, "color": "#ef4444"}
      ]
    };

    activeGachaTierKey = key;
    renderGachaTabs();
    renderActiveTierDetail();
    if (tierAmountInput) {
      tierAmountInput.focus();
      tierAmountInput.select();
    }
  }

  addTierBtn?.addEventListener('click', createNewTier);
  emptyAddTierBtn?.addEventListener('click', createNewTier);

  // Xóa mốc trực tiếp không dùng confirm
  deleteTierBtn?.addEventListener('click', () => {
    if (!activeGachaTierKey) return;
    delete gachaConfig[activeGachaTierKey];
    const remainingKeys = Object.keys(gachaConfig);
    if (remainingKeys.length > 0) {
      activeGachaTierKey = remainingKeys[0];
    } else {
      activeGachaTierKey = null;
    }
    renderGachaTabs();
  });

  addRewardRowBtn?.addEventListener('click', () => {
    if (!activeGachaTierKey || !gachaConfig[activeGachaTierKey]) return;
    saveCurrentTierFormToState();
    if (!gachaConfig[activeGachaTierKey].rewards) {
      gachaConfig[activeGachaTierKey].rewards = [];
    }
    gachaConfig[activeGachaTierKey].rewards.push({
      id: String(Date.now()),
      label: '+60s',
      seconds: 60,
      weight: 20,
      color: '#10b981'
    });
    renderActiveTierDetail();
  });

  // Tự động cập nhật tiêu đề tab khi người dùng sửa số tiền hoặc tên vòng quay
  tierAmountInput?.addEventListener('blur', () => {
    if (!activeGachaTierKey) return;
    const newAmountStr = String(tierAmountInput.value || '').trim();
    if (!newAmountStr || isNaN(Number(newAmountStr)) || Number(newAmountStr) <= 0) {
      tierAmountInput.value = activeGachaTierKey;
      return;
    }
    if (newAmountStr !== activeGachaTierKey) {
      if (gachaConfig[newAmountStr]) {
        activeGachaTierKey = newAmountStr;
      } else {
        const currentData = gachaConfig[activeGachaTierKey];
        delete gachaConfig[activeGachaTierKey];
        gachaConfig[newAmountStr] = currentData;
        activeGachaTierKey = newAmountStr;
      }
      renderGachaTabs();
    }
  });

  tierNameInput?.addEventListener('input', () => {
    if (activeGachaTierKey && gachaConfig[activeGachaTierKey]) {
      gachaConfig[activeGachaTierKey].name = tierNameInput.value.trim() || 'Mốc quay';
      const activeBtn = gachaTierTabs?.querySelector(`.gacha-tab-btn[data-key="${activeGachaTierKey}"]`);
      if (activeBtn) {
        const formattedAmount = Number(activeGachaTierKey).toLocaleString('vi-VN') + 'đ';
        const disabledTag = tierEnabledInput?.checked === false ? ' [Tắt]' : '';
        activeBtn.textContent = `${formattedAmount} - ${gachaConfig[activeGachaTierKey].name}${disabledTag}`;
      }
    }
  });

  tierEnabledInput?.addEventListener('change', () => {
    if (activeGachaTierKey && gachaConfig[activeGachaTierKey]) {
      gachaConfig[activeGachaTierKey].enabled = tierEnabledInput.checked;
      const activeBtn = gachaTierTabs?.querySelector(`.gacha-tab-btn[data-key="${activeGachaTierKey}"]`);
      if (activeBtn) {
        const formattedAmount = Number(activeGachaTierKey).toLocaleString('vi-VN') + 'đ';
        const disabledTag = tierEnabledInput.checked ? '' : ' [Tắt]';
        activeBtn.textContent = `${formattedAmount} - ${gachaConfig[activeGachaTierKey].name}${disabledTag}`;
      }
    }
  });

  saveGachaBtn?.addEventListener('click', async () => {
    saveCurrentTierFormToState();
    const origHTML = saveGachaBtn.innerHTML;
    saveGachaBtn.innerHTML = 'Đang lưu...';
    try {
      const sessionId = currentSession ? currentSession.id : 0;
      await SubathonService.saveGachaConfig(sessionId, gachaConfig);
      if (typeof Toast !== 'undefined') {
        Toast.success('Đã lưu cấu hình Vòng Quay thành công!');
      } else {
        saveGachaBtn.innerHTML = 'Đã lưu thành công!';
        setTimeout(() => { saveGachaBtn.innerHTML = origHTML; }, 2000);
      }
    } catch (err) {
      console.error('Lỗi khi lưu cấu hình Vòng Quay:', err);
      if (typeof Toast !== 'undefined') {
        Toast.error('Lỗi lưu cấu hình: ' + (err.message || err));
      }
    } finally {
      if (typeof Toast !== 'undefined') {
        saveGachaBtn.innerHTML = origHTML;
      }
    }
  });

  testGachaBtn?.addEventListener('click', async () => {
    saveCurrentTierFormToState();
    const origHTML = testGachaBtn.innerHTML;
    testGachaBtn.innerHTML = 'Đang quay...';
    try {
      const sessionId = currentSession ? currentSession.id : 0;
      const res = await SubathonService.testGachaRoll(sessionId, {
        amount: activeGachaTierKey || "20000",
        donor_name: "Streamer Thử Nghiệm"
      });

      if (typeof BroadcastChannel !== 'undefined' && res) {
        const gachaChannel = new BroadcastChannel('gacha-test');
        gachaChannel.postMessage({ _type: 'gacha-roll', payload: res });
      }

      if (typeof Toast !== 'undefined') {
        Toast.success('Đã kích hoạt Vòng Quay sang OBS Studio!');
      }
    } catch (err) {
      console.error('Lỗi khi test vòng quay:', err);
      if (typeof Toast !== 'undefined') {
        Toast.error('Lỗi quay thử: ' + (err.message || err));
      }
    } finally {
      testGachaBtn.innerHTML = origHTML;
    }
  });


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
    rebuildCacheBtn.disabled = true;
    const orig = rebuildCacheBtn.textContent;
    rebuildCacheBtn.textContent = '⏳ Đang tái tạo...';

    try {
      await DonateService.rebuildLeaderboard();
      rebuildCacheBtn.textContent = '✅ Đã tái tạo!';
      setTimeout(() => { rebuildCacheBtn.textContent = orig; }, 2000);
    } catch (err) {
      console.error('Lỗi khi tái tạo cache:', err);
      alert(err.message || 'Lỗi khi tái tạo cache');
      rebuildCacheBtn.textContent = orig;
    } finally {
      rebuildCacheBtn.disabled = false;
    }
  });

  cleanupPendingBtn?.addEventListener('click', async () => {
    cleanupPendingBtn.disabled = true;
    const orig = cleanupPendingBtn.textContent;
    cleanupPendingBtn.textContent = '⏳ Đang dọn dẹp...';

    try {
      await DonateService.cleanupExpired();
      cleanupPendingBtn.textContent = '✅ Đã dọn dẹp!';
      setTimeout(() => { cleanupPendingBtn.textContent = orig; }, 2000);
    } catch (err) {
      console.error('Lỗi khi dọn dẹp đơn pending:', err);
      alert(err.message || 'Lỗi khi dọn dẹp đơn pending');
      cleanupPendingBtn.textContent = orig;
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
    rebuildLeaderboardBtn.disabled = true;
    const orig = rebuildLeaderboardBtn.innerHTML;
    rebuildLeaderboardBtn.innerHTML = '⏳ Rebuilding...';

    try {
      await DonateService.rebuildLeaderboard();
      rebuildLeaderboardBtn.innerHTML = '✅ Đã tái tạo!';
      setTimeout(() => { rebuildLeaderboardBtn.innerHTML = orig; }, 2000);
    } catch (err) {
      console.error('Lỗi khi tái tạo cache:', err);
      alert(err.message || 'Lỗi khi tái tạo cache');
      rebuildLeaderboardBtn.innerHTML = orig;
    } finally {
      rebuildLeaderboardBtn.disabled = false;
    }
  });

  const initialTab = window.location.hash.replace('#', '') || 'overview';
  switchTab(initialTab);
});
