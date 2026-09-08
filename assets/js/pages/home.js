const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL)
  ? CONFIG.API_BASE_URL
  : 'https://backend-donate-web.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  const registerSection = document.getElementById('registerSection');
  const donateSection = document.getElementById('donateSection');
  const qrSection = document.getElementById('qrSection');
  const successSection = document.getElementById('successSection');
  const successAmountDisplay = document.getElementById('successAmountDisplay');
  const successCodeDisplay = document.getElementById('successCodeDisplay');
  const successMessageRow = document.getElementById('successMessageRow');
  const successMessageDisplay = document.getElementById('successMessageDisplay');
  const btnContinueDonate = document.getElementById('btnContinueDonate');
  const leaderboardSection = document.getElementById('leaderboardSection');
  const historySection = document.getElementById('historySection');

  let activePaymentPusherChannel = null;
  let activePaymentPollInterval = null;
  let currentActivePaymentCode = null;

  function stopPaymentTracking() {
    if (activePaymentPollInterval) {
      clearInterval(activePaymentPollInterval);
      activePaymentPollInterval = null;
    }
    if (activePaymentPusherChannel && typeof Pusher !== 'undefined') {
      try {
        activePaymentPusherChannel.unbind_all();
      } catch { }
      activePaymentPusherChannel = null;
    }
    currentActivePaymentCode = null;
  }

  async function handleDonationSuccess({ paymentCode, amount, message }) {
    stopPaymentTracking();

    if (qrSection) qrSection.style.display = 'none';
    if (donateSection) donateSection.style.display = 'none';

    if (successSection) {
      if (successAmountDisplay) {
        successAmountDisplay.textContent = typeof Formatters !== 'undefined'
          ? Formatters.currency(amount)
          : `${new Intl.NumberFormat('vi-VN').format(amount)} ₫`;
      }
      if (successCodeDisplay) {
        successCodeDisplay.textContent = paymentCode;
      }
      if (successMessageRow && successMessageDisplay) {
        if (message && message.trim()) {
          successMessageDisplay.textContent = message.trim();
          successMessageRow.style.display = 'flex';
        } else {
          successMessageRow.style.display = 'none';
        }
      }
      successSection.style.display = 'block';
    }

    if (typeof SoundManager !== 'undefined' && SoundManager.playDonateChime) {
      try {
        SoundManager.playDonateChime();
      } catch { }
    }

    if (typeof Toast !== 'undefined' && Toast.success) {
      Toast.success('Thanh toán thành công! Cảm ơn bạn đã ủng hộ Streamer!');
    }

    if (typeof UserService !== 'undefined' && Storage.getAccessToken()) {
      try {
        const updatedMe = await UserService.getMe();
        if (updatedMe) {
          Storage.setUser(updatedMe);
          updateAuthUI();
        }
      } catch { }
    }
  }

  const navHomeLink = document.getElementById('navHomeLink');
  const navLeaderboardLink = document.getElementById('navLeaderboardLink');
  const navHistoryLink = document.getElementById('navHistoryLink');

  let currentTab = 'home';

  const customLoginForm = document.getElementById('customLoginForm');
  const customRegisterForm = document.getElementById('customRegisterForm');
  const donateForm = document.getElementById('donateForm');

  const showRegisterLink = document.getElementById('showRegisterLink');
  const showLoginLink = document.getElementById('showLoginLink');
  const btnBackToDonate = document.getElementById('btnBackToDonate');

  const loginUsername = document.getElementById('loginUsername');
  const loginPassword = document.getElementById('loginPassword');
  const loginError = document.getElementById('loginError');
  const btnDoLogin = document.getElementById('btnDoLogin');

  const regUsername = document.getElementById('regUsername');
  const regEmail = document.getElementById('regEmail');
  const regPassword = document.getElementById('regPassword');
  const registerError = document.getElementById('registerError');
  const btnDoRegister = document.getElementById('btnDoRegister');

  const userProfileNav = document.getElementById('userProfileNav');
  const userNavName = document.getElementById('userNavName');
  const navAdminLink = document.getElementById('navAdminLink');
  const btnBentoLogout = document.getElementById('btn-bento-logout');

  function updateAuthUI() {
    const isLoggedIn = typeof AuthService !== 'undefined'
      ? AuthService.isLoggedIn()
      : (typeof Storage !== 'undefined' && Storage.isAuthenticated());

    if (isLoggedIn) {
      const currentUser = (typeof AuthService !== 'undefined' && AuthService.getCurrentUser())
        || (typeof Storage !== 'undefined' && Storage.getUser())
        || {};

      const role = (currentUser.role || '').toLowerCase();

      if (role === 'admin') {
        window.location.href = './page-admin/index.html';
        return;
      }

      document.body.classList.add('is-logged-in');
      if (loginSection) loginSection.style.display = 'none';
      if (registerSection) registerSection.style.display = 'none';

      if (currentTab === 'home') {
        if (donateSection && (!qrSection || qrSection.style.display !== 'block') && (!successSection || successSection.style.display !== 'block')) {
          donateSection.style.display = 'block';
        }
      }

      if (btnBentoLogout) btnBentoLogout.style.display = 'inline-flex';
    } else {
      document.body.classList.remove('is-logged-in');

      stopPaymentTracking();
      if (donateSection) donateSection.style.display = 'none';
      if (qrSection) qrSection.style.display = 'none';
      if (successSection) successSection.style.display = 'none';
      if (registerSection) registerSection.style.display = 'none';

      if (currentTab === 'home') {
        if (loginSection) loginSection.style.display = 'block';
      }
      if (userProfileNav) userProfileNav.style.display = 'none';
      if (btnBentoLogout) btnBentoLogout.style.display = 'none';
    }
  }

  if (btnBentoLogout) {
    btnBentoLogout.addEventListener('click', () => {
      if (typeof AuthService !== 'undefined') {
        AuthService.logout();
      }
    });
  }

  if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (loginError) { loginError.textContent = ''; loginError.style.display = 'none'; }
      if (registerError) { registerError.textContent = ''; registerError.style.display = 'none'; }
      if (loginSection) loginSection.style.display = 'none';
      if (registerSection) registerSection.style.display = 'block';
      if (regUsername) regUsername.focus();
    });
  }

  if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (loginError) { loginError.textContent = ''; loginError.style.display = 'none'; }
      if (registerError) { registerError.textContent = ''; registerError.style.display = 'none'; }
      if (registerSection) registerSection.style.display = 'none';
      if (loginSection) loginSection.style.display = 'block';
      if (loginUsername) loginUsername.focus();
    });
  }

  if (customLoginForm) {
    customLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginUsername ? loginUsername.value.trim() : '';
      const password = loginPassword ? loginPassword.value : '';

      if (loginError) {
        loginError.textContent = '';
        loginError.style.display = 'none';
      }

      if (!email || !password) {
        const msg = 'Vui lòng nhập đầy đủ email và mật khẩu';
        if (loginError) {
          loginError.textContent = msg;
          loginError.style.display = 'block';
        }
        return;
      }

      if (btnDoLogin) {
        btnDoLogin.disabled = true;
        btnDoLogin.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg> <span>Đang đăng nhập...</span>';
      }

      try {
        await AuthService.login(email, password);
        const currentUser = AuthService.getCurrentUser();
        const role = (currentUser?.role || '').toLowerCase();

        if (role === 'admin') {
          setTimeout(() => {
            window.location.href = './page-admin/index.html';
          }, 400);
          return;
        }

        if (loginPassword) loginPassword.value = '';
        updateAuthUI();
      } catch (err) {
        console.error('Lỗi khi đăng nhập:', err);
        const errorMsg = err.message || 'Email hoặc mật khẩu không chính xác';
        if (loginError) {
          loginError.textContent = errorMsg;
          loginError.style.display = 'block';
        }
      } finally {
        if (btnDoLogin) {
          btnDoLogin.disabled = false;
          btnDoLogin.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> <span>Đăng nhập</span>';
        }
      }
    });
  }

  if (customRegisterForm) {
    customRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = regUsername ? regUsername.value.trim() : '';
      const email = regEmail ? regEmail.value.trim() : '';
      const password = regPassword ? regPassword.value : '';

      if (registerError) {
        registerError.textContent = '';
        registerError.style.display = 'none';
      }

      if (!fullName || !email || !password) {
        const msg = 'Vui lòng điền đầy đủ tất cả các trường';
        if (registerError) {
          registerError.textContent = msg;
          registerError.style.display = 'block';
        }
        return;
      }

      if (password.length < 6) {
        const msg = 'Mật khẩu phải chứa tối thiểu 6 ký tự';
        if (registerError) {
          registerError.textContent = msg;
          registerError.style.display = 'block';
        }
        return;
      }

      if (btnDoRegister) {
        btnDoRegister.disabled = true;
        btnDoRegister.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg> <span>Đang tạo tài khoản...</span>';
      }

      try {
        await AuthService.register({
          email: email,
          password: password,
          full_name: fullName
        });

        if (registerSection) registerSection.style.display = 'none';
        if (loginSection) loginSection.style.display = 'block';
        if (loginUsername) loginUsername.value = email;
        if (loginPassword) {
          loginPassword.value = '';
          loginPassword.focus();
        }

        if (regUsername) regUsername.value = '';
        if (regEmail) regEmail.value = '';
        if (regPassword) regPassword.value = '';
      } catch (err) {
        console.error('Lỗi khi đăng ký tài khoản:', err);
        const errorMsg = err.message || 'Lỗi khi đăng ký tài khoản. Vui lòng kiểm tra lại.';
        if (registerError) {
          registerError.textContent = errorMsg;
          registerError.style.display = 'block';
        }
      } finally {
        if (btnDoRegister) {
          btnDoRegister.disabled = false;
          btnDoRegister.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> <span>Đăng ký ngay</span>';
        }
      }
    });
  }

  const btnGachaPick = document.getElementById('btnGachaPick');
  if (btnGachaPick) {
    btnGachaPick.addEventListener('click', () => {
      const amountInput = document.getElementById('amount');
      if (amountInput) {
        amountInput.value = 20000;
        amountInput.focus();
      }
    });
  }

  if (donateForm) {
    donateForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!AuthService.isLoggedIn()) {
        updateAuthUI();
        return;
      }

      const amountInput = document.getElementById('amount');
      const messageInput = document.getElementById('message');
      const amount = amountInput ? Number(amountInput.value) : 0;
      const message = messageInput ? messageInput.value.trim() : '';

      if (amount < 5) {
        return;
      }

      const submitBtn = donateForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg> <span>Đang tạo mã thanh toán...</span>';
      }

      try {
        const paymentCode = await DonateService.createPending({
          amount: amount * 1000,
          message: message
        });

        const qrAmountDisplay = document.getElementById('qrAmountDisplay');
        if (qrAmountDisplay) {
          const totalVnd = amount * 1000;
          qrAmountDisplay.textContent = typeof Formatters !== 'undefined' ? Formatters.currency(totalVnd) : `${new Intl.NumberFormat('vi-VN').format(totalVnd)} ₫`;
        }

        const BANK_ID = "";
        const ACCOUNT_NO = "";
        const ACCOUNT_NAME = "";
        const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${amount * 1000}&addInfo=${encodeURIComponent(paymentCode)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

        const qrImage = document.getElementById('qrImage');
        if (qrImage) qrImage.src = qrUrl;

        if (donateSection) donateSection.style.display = 'none';
        if (successSection) successSection.style.display = 'none';
        if (qrSection) qrSection.style.display = 'block';

        // Khởi động lắng nghe kết quả thanh toán
        stopPaymentTracking();
        currentActivePaymentCode = paymentCode;
        const totalVnd = amount * 1000;

        // 1. Pusher Realtime (Kênh payment-{paymentCode})
        const pusherKey = CONFIG.PUSHER?.APP_KEY;
        if (pusherKey && typeof Pusher !== 'undefined') {
          try {
            const pusher = new Pusher(pusherKey, { cluster: CONFIG.PUSHER?.CLUSTER || 'ap1' });
            activePaymentPusherChannel = pusher.subscribe(`payment-${paymentCode}`);
            activePaymentPusherChannel.bind('success', () => {
              handleDonationSuccess({
                paymentCode,
                amount: totalVnd,
                message
              });
            });
          } catch (pErr) {
            console.warn('[Pusher] Lỗi kết nối payment channel:', pErr);
          }
        }

        // 2. Polling Fallback mỗi 10s phòng khi WebSocket bị chặn
        activePaymentPollInterval = setInterval(async () => {
          try {
            if (typeof DonateService !== 'undefined' && DonateService.checkStatus) {
              const statusData = await DonateService.checkStatus(paymentCode);
              if (statusData && (statusData.is_completed || statusData.status === 'completed')) {
                handleDonationSuccess({
                  paymentCode,
                  amount: statusData.amount || totalVnd,
                  message
                });
              }
            }
          } catch { }
        }, 10000);
      } catch (err) {
        console.error('Lỗi khi tạo mã donate:', err);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> <span>Tiến hành Donate</span>';
        }
      }
    });
  }

  if (btnBackToDonate) {
    btnBackToDonate.addEventListener('click', (e) => {
      e.preventDefault();
      stopPaymentTracking();
      if (qrSection) qrSection.style.display = 'none';
      if (successSection) successSection.style.display = 'none';
      if (donateSection) donateSection.style.display = 'block';
    });
  }

  if (btnContinueDonate) {
    btnContinueDonate.addEventListener('click', (e) => {
      e.preventDefault();
      stopPaymentTracking();
      if (successSection) successSection.style.display = 'none';
      if (qrSection) qrSection.style.display = 'none';
      if (donateSection) donateSection.style.display = 'block';
      if (donateForm) donateForm.reset();
    });
  }

  function switchMainTab(tab) {
    currentTab = tab;

    if (navHomeLink) navHomeLink.classList.toggle('active', tab === 'home');
    if (navLeaderboardLink) navLeaderboardLink.classList.toggle('active', tab === 'leaderboard');
    if (navHistoryLink) navHistoryLink.classList.toggle('active', tab === 'history');

    if (window.location.hash !== `#${tab}`) {
      history.replaceState(null, '', `#${tab}`);
    }

    if (tab === 'home') {
      if (leaderboardSection) leaderboardSection.style.display = 'none';
      if (historySection) historySection.style.display = 'none';
      updateAuthUI();
    } else if (tab === 'leaderboard') {
      stopPaymentTracking();
      if (donateSection) donateSection.style.display = 'none';
      if (loginSection) loginSection.style.display = 'none';
      if (registerSection) registerSection.style.display = 'none';
      if (qrSection) qrSection.style.display = 'none';
      if (successSection) successSection.style.display = 'none';
      if (historySection) historySection.style.display = 'none';
      if (leaderboardSection) leaderboardSection.style.display = 'block';
      loadLeaderboard(isMonthlyLeaderboard);
    } else if (tab === 'history') {
      stopPaymentTracking();
      if (donateSection) donateSection.style.display = 'none';
      if (loginSection) loginSection.style.display = 'none';
      if (registerSection) registerSection.style.display = 'none';
      if (qrSection) qrSection.style.display = 'none';
      if (successSection) successSection.style.display = 'none';
      if (leaderboardSection) leaderboardSection.style.display = 'none';
      if (historySection) historySection.style.display = 'block';
      loadDonationHistory();
    }
  }

  let isMonthlyLeaderboard = false;
  const lbBtnAllTime = document.getElementById('lbBtnAllTime');
  const lbBtnMonthly = document.getElementById('lbBtnMonthly');
  const leaderboardList = document.getElementById('leaderboardList');
  const currentUserRankBox = document.getElementById('currentUserRankBox');

  async function loadLeaderboard(isMonthly = false) {
    if (!leaderboardList) return;
    leaderboardList.innerHTML = '<div class="lb-loading">Đang tải bảng xếp hạng...</div>';

    try {
      const top5 = await DonateService.getLeaderboard(isMonthly);

      let currentUser = null;
      const isLoggedIn = typeof AuthService !== 'undefined'
        ? AuthService.isLoggedIn()
        : (typeof Storage !== 'undefined' && Storage.isAuthenticated());

      if (isLoggedIn) {
        try {
          currentUser = await UserService.getMe();
        } catch {
          currentUser = (typeof AuthService !== 'undefined' && AuthService.getCurrentUser())
            || (typeof Storage !== 'undefined' && Storage.getUser());
        }
      }

      if (!top5 || top5.length === 0) {
        leaderboardList.innerHTML = '<div class="lb-empty">Chưa có người ủng hộ nào trong giai đoạn này</div>';
      } else {
        leaderboardList.innerHTML = top5.map((user, idx) => {
          const rank = idx + 1;
          const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
          const badgeClass = rank <= 3 ? '' : 'rank-other';
          
          let medal = `#${rank}`;
          if (rank === 1) {
            medal = `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>`;
          } else if (rank === 2) {
            medal = `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><circle cx="12" cy="9" r="6"/><path d="M8.5 14.5L7 22l5-3 5 3-1.5-7.5"/></svg>`;
          } else if (rank === 3) {
            medal = `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><circle cx="12" cy="9" r="6"/><path d="M8.5 14.5L7 22l5-3 5 3-1.5-7.5"/></svg>`;
          }
          const initial = (user.full_name || 'A').charAt(0).toUpperCase();

          return `
            <div class="lb-item ${rankClass}">
              <div class="lb-rank-badge ${badgeClass}">${medal}</div>
              <div class="lb-user-info">
                <span class="lb-avatar-circle">${initial}</span>
                <span class="lb-user-name">${user.full_name || 'Người ủng hộ bí mật'}</span>
              </div>
              <div class="lb-amount">${Formatters.currency(user.total_donated || 0)}</div>
            </div>
          `;
        }).join('');
      }

      if (currentUserRankBox) {
        if (currentUser) {
          let rankText = 'Chưa xếp hạng';
          const rankIndex = top5.findIndex(u => Number(u.id) === Number(currentUser.id));
          if (rankIndex !== -1) {
            rankText = `#${rankIndex + 1}`;
          } else if ((currentUser.total_donated || 0) > 0) {
            rankText = 'Top 5+';
          }

          currentUserRankBox.innerHTML = `
            <div>
              <div class="current-user-rank-title">Vị trí của bạn</div>
              <div class="current-user-rank-name">${currentUser.full_name || currentUser.email}</div>
              <div class="current-user-rank-score">Tổng ủng hộ: ${Formatters.currency(currentUser.total_donated || 0)}</div>
            </div>
            <div class="current-user-rank-pill">${rankText}</div>
          `;
        } else {
          currentUserRankBox.innerHTML = `
            <div>
              <div class="current-user-rank-title">Thứ hạng cá nhân</div>
              <div class="current-user-rank-name">Đăng nhập để xem thứ hạng của bạn</div>
            </div>
            <button type="button" id="btnRankLogin" class="current-user-rank-pill" style="cursor:pointer;border:none;">Đăng nhập</button>
          `;
          document.getElementById('btnRankLogin')?.addEventListener('click', () => {
            switchMainTab('home');
          });
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải bảng xếp hạng:', err);
      leaderboardList.innerHTML = `<div class="lb-empty" style="color:#ef4444;">Lỗi tải bảng xếp hạng: ${err.message || ''}</div>`;
    }
  }

  lbBtnAllTime?.addEventListener('click', () => {
    if (!isMonthlyLeaderboard) return;
    isMonthlyLeaderboard = false;
    lbBtnAllTime.classList.add('active');
    lbBtnMonthly.classList.remove('active');
    loadLeaderboard(false);
  });

  lbBtnMonthly?.addEventListener('click', () => {
    if (isMonthlyLeaderboard) return;
    isMonthlyLeaderboard = true;
    lbBtnMonthly.classList.add('active');
    lbBtnAllTime.classList.remove('active');
    loadLeaderboard(true);
  });

  const donationHistoryList = document.getElementById('donationHistoryList');

  async function loadDonationHistory() {
    if (!donationHistoryList) return;
    donationHistoryList.innerHTML = '<div class="history-loading">Đang tải 50 lần donate gần nhất...</div>';

    try {
      const historyRes = (typeof DonateService !== 'undefined' && typeof DonateService.getHistory === 'function')
        ? await DonateService.getHistory(50)
        : (await apiClient.get(`${CONFIG.ENDPOINTS?.DONATE?.HISTORY || '/donate/history'}?limit=50`, { requiresAuth: false })).data || [];
      const history = Array.isArray(historyRes) ? historyRes : (historyRes?.items || []);
      if (!history || history.length === 0) {
        donationHistoryList.innerHTML = '<div class="history-empty">Chưa có giao dịch donate nào thành công</div>';
        return;
      }

      donationHistoryList.innerHTML = history.map(item => {
        const initial = (item.full_name || 'A').charAt(0).toUpperCase();
        const msg = item.message ? `<div class="history-message">"${item.message}"</div>` : '';

        return `
          <div class="history-item">
            <div class="history-item-header">
              <span class="history-donor-name">
                <span class="lb-avatar-circle" style="width:26px;height:26px;font-size:11px;">${initial}</span>
                ${item.full_name || 'Người ủng hộ bí mật'}
              </span>
              <span class="history-amount">+${Formatters.currency(item.amount)}</span>
            </div>
            ${msg}
            <span class="history-time">${Formatters.dateTime(item.created_at)}</span>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Lỗi khi tải lịch sử donate:', err);
      donationHistoryList.innerHTML = `<div class="history-empty" style="color:#ef4444;">Lỗi: ${err.message || 'Không thể tải lịch sử'}</div>`;
    }
  }

  navHomeLink?.addEventListener('click', (e) => {
    e.preventDefault();
    switchMainTab('home');
  });

  navLeaderboardLink?.addEventListener('click', (e) => {
    e.preventDefault();
    switchMainTab('leaderboard');
  });

  navHistoryLink?.addEventListener('click', (e) => {
    e.preventDefault();
    switchMainTab('history');
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (['home', 'leaderboard', 'history'].includes(hash)) {
      switchMainTab(hash);
    }
  });

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');

  function closeMobileMenu() {
    if (mobileMenuBtn) {
      mobileMenuBtn.classList.remove('active');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
    if (mainNav) {
      mainNav.classList.remove('open');
    }
  }

  function toggleMobileMenu() {
    if (!mobileMenuBtn || !mainNav) return;
    const willOpen = !mainNav.classList.contains('open');
    mainNav.classList.toggle('open', willOpen);
    mobileMenuBtn.classList.toggle('active', willOpen);
    mobileMenuBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  }

  mobileMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileMenu();
  });

  document.querySelectorAll('#mainNav .nav-tab-link, #mainNav .nav-logout-btn').forEach((item) => {
    item.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  document.addEventListener('click', (e) => {
    if (mainNav?.classList.contains('open')) {
      if (!mainNav.contains(e.target) && !mobileMenuBtn?.contains(e.target)) {
        closeMobileMenu();
      }
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeMobileMenu();
    }
  });

  const initialHash = window.location.hash.replace('#', '');
  if (['home', 'leaderboard', 'history'].includes(initialHash)) {
    switchMainTab(initialHash);
  } else {
    updateAuthUI();
  }
});

window.Auth = {
  isLoggedIn: () => (typeof AuthService !== 'undefined' ? AuthService.isLoggedIn() : !!localStorage.getItem('donate_access_token')),
  getCurrentUser: () => (typeof AuthService !== 'undefined' ? AuthService.getCurrentUser() : null),
  logout: () => (typeof AuthService !== 'undefined' ? AuthService.logout() : null)
};