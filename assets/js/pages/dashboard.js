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

  const streamerName = document.getElementById('streamerName');
  const streamerEmail = document.getElementById('streamerEmail');
  const userRole = document.getElementById('userRole');
  const adminNavItem = document.getElementById('adminNavItem');
  const alertWidgetUrl = document.getElementById('alertWidgetUrl');
  const subathonWidgetUrl = document.getElementById('subathonWidgetUrl');
  const logoutBtn = document.getElementById('logoutBtn');

  if (streamerName) streamerName.textContent = user.full_name || 'Admin';
  if (streamerEmail) streamerEmail.textContent = user.email || '';
  if (userRole) {
    userRole.textContent = 'ADMIN';
    userRole.className = 'badge badge-admin';
  }
  if (adminNavItem) adminNavItem.style.display = 'block';

  const origin = window.location.origin;
  if (alertWidgetUrl) {
    alertWidgetUrl.value = `${origin}/widgets/donate-alert.html`;
  }

  if (subathonWidgetUrl) {
    try {
      const session = await SubathonService.getCurrentSession();
      if (session && session.widget_token) {
        subathonWidgetUrl.value = `${origin}/widgets/subathon-timer.html?token=${session.widget_token}`;
      } else {
        subathonWidgetUrl.value = `${origin}/widgets/subathon-timer.html`;
      }
    } catch (err) {
      console.warn('Chưa thể lấy phiên subathon:', err);
      subathonWidgetUrl.value = `${origin}/widgets/subathon-timer.html`;
    }
  }

  document.querySelectorAll('.copy-widget-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-target');
      const inputEl = document.getElementById(targetId);
      if (inputEl && inputEl.value) {
        try {
          await navigator.clipboard.writeText(inputEl.value);
          const originalText = btn.textContent;
          btn.textContent = 'Đã sao chép!';
          setTimeout(() => {
            btn.textContent = originalText;
          }, 2000);
        } catch {
          inputEl.select();
          document.execCommand('copy');
        }
      }
    });
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setTimeout(() => {
        AuthService.logout('../index.html');
      }, 100);
    });
  }
});