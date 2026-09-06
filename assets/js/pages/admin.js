document.addEventListener('DOMContentLoaded', async () => {
  if (!AuthService.isLoggedIn()) {
    window.location.href = '../index.html';
    return;
  }

  const user = AuthService.getCurrentUser() || Storage.getUser();
  const role = (user?.role || '').toLowerCase();
  if (role !== 'admin') {
    Toast.error('Bạn không có quyền quản trị viên!');
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 1200);
    return;
  }

  const userTableBody = document.getElementById('userTableBody');
  const searchFilterForm = document.getElementById('searchFilterForm');
  const filterName = document.getElementById('filterName');
  const filterEmail = document.getElementById('filterEmail');
  const filterStatus = document.getElementById('filterStatus');
  const rebuildCacheBtn = document.getElementById('rebuildCacheBtn');
  const cleanupPendingBtn = document.getElementById('cleanupPendingBtn');

  async function loadUsers(filters = {}) {
    userTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Đang tải danh sách thành viên...</td></tr>';
    try {
      const users = await UserService.getUsers(filters);
      if (!users || users.length === 0) {
        userTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Không tìm thấy thành viên nào</td></tr>';
        return;
      }

      userTableBody.innerHTML = users.map(u => `
        <tr>
          <td class="font-mono">#${u.id}</td>
          <td class="font-bold">${u.full_name}</td>
          <td class="font-mono">${u.email}</td>
          <td><span class="badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}">${u.role}</span></td>
          <td><span class="badge ${u.is_active ? 'badge-active' : 'badge-ended'}">${u.is_active ? 'Hoạt động' : 'Bị khóa'}</span></td>
          <td class="text-muted font-mono">${Formatters.dateTime(u.created_at)}</td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
      userTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-rose">Không thể tải danh sách người dùng.</td></tr>';
    }
  }

  searchFilterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    loadUsers({
      name: filterName.value.trim(),
      email: filterEmail.value.trim(),
      status: filterStatus.value
    });
  });

  rebuildCacheBtn?.addEventListener('click', async () => {
    if (!confirm('Bạn có chắc muốn tái tạo toàn bộ cache Leaderboard Redis từ MySQL?')) return;
    rebuildCacheBtn.disabled = true;
    rebuildCacheBtn.textContent = 'Đang tái tạo...';

    try {
      const res = await DonateService.rebuildLeaderboard();
      Toast.success('Đã tái tạo toàn bộ cache Leaderboard Redis thành công!');
    } catch (err) {
      Toast.error(err.message || 'Lỗi khi tái tạo cache');
    } finally {
      rebuildCacheBtn.disabled = false;
      rebuildCacheBtn.textContent = '🔄 Rebuild Cache Leaderboard';
    }
  });

  cleanupPendingBtn?.addEventListener('click', async () => {
    if (!confirm('Xóa tất cả các bản ghi donate pending quá 30 phút?')) return;
    cleanupPendingBtn.disabled = true;
    cleanupPendingBtn.textContent = 'Đang dọn dẹp...';

    try {
      await DonateService.cleanupExpired();
      Toast.success('Đã dọn dẹp các đơn donate pending hết hạn!');
    } catch (err) {
      Toast.error(err.message || 'Lỗi dọn dẹp');
    } finally {
      cleanupPendingBtn.disabled = false;
      cleanupPendingBtn.textContent = '🗑️ Dọn dẹp đơn Pending quá hạn';
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

  loadUsers();
});
