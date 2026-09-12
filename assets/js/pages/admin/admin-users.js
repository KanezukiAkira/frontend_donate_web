/**
 * Admin Module: Users Tab Controller
 * Quản lý danh sách thành viên, lọc trạng thái, tái tạo leaderboard cache và dọn dẹp đơn pending hết hạn.
 */

const AdminUsers = (() => {
  async function loadUsers(filters = {}) {
    const userTableBody = document.getElementById('userTableBody');
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
          <td><span class="badge ${(u.role || '').toUpperCase() === 'ADMIN' ? 'badge-admin' : 'badge-user'}">${(u.role || '').toUpperCase()}</span></td>
          <td><span class="badge ${u.is_active ? 'badge-live' : 'badge-ended'}">${u.is_active ? 'Hoạt động' : 'Bị khóa'}</span></td>
          <td class="font-bold stat-gold">${typeof Formatters !== 'undefined' ? Formatters.currency(u.total_donated ?? 0) : `${u.total_donated ?? 0} ₫`}</td>
          <td class="text-muted font-mono">${typeof Formatters !== 'undefined' ? Formatters.dateTime(u.created_at) : (u.created_at ? new Date(u.created_at).toLocaleString('vi-VN') : '--')}</td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Lỗi tải danh sách người dùng:', err);
      userTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-rose">Không thể tải danh sách người dùng.</td></tr>';
    }
  }

  function init() {
    const searchFilterForm = document.getElementById('searchFilterForm');
    const filterName = document.getElementById('filterName');
    const filterEmail = document.getElementById('filterEmail');
    const filterStatus = document.getElementById('filterStatus');
    const rebuildCacheBtn = document.getElementById('rebuildCacheBtn');
    const cleanupPendingBtn = document.getElementById('cleanupPendingBtn');

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
  }

  return {
    init,
    loadUsers
  };
})();

window.AdminUsers = AdminUsers;
