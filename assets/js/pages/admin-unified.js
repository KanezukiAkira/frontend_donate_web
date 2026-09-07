/**
 * Admin Dashboard - Main Coordinator
 * Điều phối định tuyến Tabs, Auth Guard, Menu Mobile và khởi tạo các modules chuyên trách:
 * - AdminOverview: Quản lý thông tin OBS Overlays & Test Alert
 * - AdminSubathon: Phiên đếm ngược Subathon, realtime 0ms sync
 * - AdminGoals: Mục tiêu donate & Goal bar overlay
 * - AdminGacha: Vòng quay may mắn thời gian / quà tặng & test roll
 * - AdminUsers: Danh sách tài khoản & dọn dẹp cache / pending
 * - AdminDonations: Lịch sử ủng hộ & Cursor-based pagination
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Auth Guard
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

  // 2. Streamer / User Profile Info
  const streamerNameEl = document.getElementById('streamerName');
  const streamerEmailEl = document.getElementById('streamerEmail');
  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarUserEmail = document.getElementById('sidebarUserEmail');
  const logoutBtn = document.getElementById('logoutBtn');

  const fullName = currentUser.full_name || 'Admin';
  const email = currentUser.email || '';

  if (streamerNameEl) streamerNameEl.textContent = fullName;
  if (streamerEmailEl) streamerEmailEl.textContent = email;
  if (sidebarUserName) sidebarUserName.textContent = fullName;
  if (sidebarUserEmail) sidebarUserEmail.textContent = email;

  // 3. Mobile Drawer Menu
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

  // 4. Tab Navigation & Routing
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

    // Trigger tab-specific data load
    if (tabName === 'overview') {
      window.AdminSubathon?.loadSubathonSession();
      window.AdminGoals?.loadGoalData();
    } else if (tabName === 'subathon') {
      window.AdminSubathon?.loadSubathonSession();
    } else if (tabName === 'goals') {
      window.AdminGoals?.loadGoalData();
    } else if (tabName === 'gacha') {
      window.AdminGacha?.loadGachaData();
    } else if (tabName === 'users') {
      window.AdminUsers?.loadUsers();
    } else if (tabName === 'donations') {
      window.AdminDonations?.loadDonationHistory();
    }
  }

  // Expose switchTab globally for cross-module jumps (e.g. Overview -> Subathon)
  window.switchTab = switchTab;

  tabItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.getAttribute('data-tab');
      switchTab(tab);
      closeAdminMobileMenu();
    });
  });

  document.querySelectorAll('[data-jump-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.getAttribute('data-jump-tab');
      switchTab(tab);
    });
  });

  document.querySelector('.sidebar-brand-info')?.addEventListener('click', () => {
    switchTab('overview');
    closeAdminMobileMenu();
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setTimeout(() => {
        AuthService.logout('../index.html');
      }, 250);
    });
  }

  // 5. Initialize All Sub-modules
  window.AdminOverview?.init();
  window.AdminSubathon?.init();
  window.AdminGoals?.init();
  window.AdminGacha?.init();
  window.AdminUsers?.init();
  window.AdminDonations?.init();

  // 6. Initial Tab Activation
  const initialTab = window.location.hash.replace('#', '') || 'overview';
  switchTab(initialTab);
});
