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
          <td class="text-muted font-mono">${typeof Formatters !== 'undefined' ? Formatters.dateTime(u.created_at) : (u.created_at ? new Date(u.created_at).toLocaleString('vi-VN') : '--')}</td>
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
    rebuildCacheBtn.textContent = 'Đang tái tạo...';

    try {
      await DonateService.rebuildLeaderboard();
    } catch (err) {
      console.error('Lỗi khi tái tạo cache:', err);
    } finally {
      rebuildCacheBtn.disabled = false;
      rebuildCacheBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align:middle;margin-right:6px;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>Rebuild Cache Leaderboard';
    }
  });

  cleanupPendingBtn?.addEventListener('click', async () => {
    if (typeof ConfirmModal !== 'undefined') {
      const confirmed = await ConfirmModal.show({
        title: 'Dọn dẹp đơn Pending',
        message: 'Bạn có chắc chắn muốn xóa tất cả các bản ghi donate ở trạng thái pending quá 30 phút? Hành động này không thể hoàn tác.',
        confirmText: 'Xóa đơn hết hạn',
        cancelText: 'Hủy bỏ',
        type: 'danger'
      });
      if (!confirmed) return;
    }
    cleanupPendingBtn.disabled = true;
    cleanupPendingBtn.textContent = 'Đang dọn dẹp...';

    try {
      await DonateService.cleanupExpired();
    } catch (err) {
      console.error('Lỗi dọn dẹp:', err);
    } finally {
      cleanupPendingBtn.disabled = false;
      cleanupPendingBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align:middle;margin-right:6px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>Dọn dẹp đơn Pending quá hạn';
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

  loadUsers();
});
