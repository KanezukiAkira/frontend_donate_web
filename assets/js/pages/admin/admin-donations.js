/**
 * Admin Module: Donations Tab Controller
 * Quản lý lịch sử ủng hộ, tích hợp Cursor-based Pagination (phân trang id < last_seen_id) và Rebuild Leaderboard cache.
 */

const AdminDonations = (() => {
  let currentCursor = null;
  let hasMore = false;
  let allItems = [];
  let totalSum = 0;
  let isLoading = false;

  function renderRow(item) {
    const amount = Number(item.amount) || 0;
    const msg = item.message
      ? `<span style="color:rgba(255,255,255,0.9);">${item.message}</span>`
      : '<span class="text-muted" style="font-style:italic;">Không có lời nhắn</span>';
    const initial = (item.full_name || 'A').charAt(0).toUpperCase();
    const formattedAmount = typeof Formatters !== 'undefined' ? Formatters.currency(amount) : `${amount} ₫`;
    const formattedDate = typeof Formatters !== 'undefined' ? Formatters.dateTime(item.created_at) : new Date(item.created_at).toLocaleString('vi-VN');

    return `
      <tr data-id="${item.id}">
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
        <td class="font-bold stat-gold">${formattedAmount}</td>
        <td style="max-width:320px;word-break:break-word;">${msg}</td>
        <td class="text-muted font-mono">${formattedDate}</td>
      </tr>
    `;
  }

  function updatePaginationControls() {
    const loadMoreBtn = document.getElementById('loadMoreDonationsBtn');
    const noMoreText = document.getElementById('noMoreDonationsText');

    if (loadMoreBtn) {
      if (hasMore) {
        loadMoreBtn.style.display = 'inline-flex';
        loadMoreBtn.disabled = isLoading;
      } else {
        loadMoreBtn.style.display = 'none';
      }
    }

    if (noMoreText) {
      if (!hasMore && allItems.length > 0) {
        noMoreText.style.display = 'inline-block';
      } else {
        noMoreText.style.display = 'none';
      }
    }
  }

  async function loadDonationHistory(isAppend = false) {
    const donationTableBody = document.getElementById('donationTableBody');
    const donationsCountStat = document.getElementById('donationsCountStat');
    const donationsTotalStat = document.getElementById('donationsTotalStat');
    const loadMoreBtn = document.getElementById('loadMoreDonationsBtn');

    if (!donationTableBody) return;
    if (isLoading) return;

    isLoading = true;
    if (!isAppend) {
      currentCursor = null;
      allItems = [];
      totalSum = 0;
      donationTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Đang tải lịch sử nhận donate...</td></tr>';
    } else if (loadMoreBtn) {
      loadMoreBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="vertical-align:middle;margin-right:6px;"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>
        <span>Đang tải thêm...</span>
      `;
      loadMoreBtn.disabled = true;
    }

    try {
      const res = await DonateService.getHistory(50, currentCursor);
      let newItems = [];

      if (res && Array.isArray(res.items)) {
        newItems = res.items;
        currentCursor = res.next_cursor ?? null;
        hasMore = Boolean(res.has_more);
      } else if (Array.isArray(res)) {
        newItems = res;
        currentCursor = null;
        hasMore = false;
      }

      if (!isAppend && newItems.length === 0) {
        donationTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Chưa có giao dịch donate nào</td></tr>';
        if (donationsCountStat) donationsCountStat.textContent = '0';
        if (donationsTotalStat) donationsTotalStat.textContent = '0 ₫';
        hasMore = false;
        updatePaginationControls();
        return;
      }

      const rowsHtml = newItems.map(item => {
        totalSum += (Number(item.amount) || 0);
        return renderRow(item);
      }).join('');

      if (isAppend) {
        donationTableBody.insertAdjacentHTML('beforeend', rowsHtml);
        allItems = allItems.concat(newItems);
      } else {
        donationTableBody.innerHTML = rowsHtml;
        allItems = newItems;
      }

      if (donationsCountStat) donationsCountStat.textContent = allItems.length;
      if (donationsTotalStat) donationsTotalStat.textContent = typeof Formatters !== 'undefined' ? Formatters.currency(totalSum) : `${totalSum} ₫`;

    } catch (err) {
      console.error('Lỗi khi tải lịch sử donate:', err);
      if (!isAppend) {
        donationTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-rose">Không thể tải lịch sử donate: ${err.message || ''}</td></tr>`;
      }
    } finally {
      isLoading = false;
      if (loadMoreBtn) {
        loadMoreBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="margin-right:6px;"><path d="m6 9 6 6 6-6"/></svg>
          <span>Tải thêm giao dịch cũ hơn</span>
        `;
      }
      updatePaginationControls();
    }
  }

  function init() {
    const refreshDonationsBtn = document.getElementById('refreshDonationsBtn');
    const rebuildLeaderboardBtn = document.getElementById('rebuildLeaderboardBtn');
    const loadMoreBtn = document.getElementById('loadMoreDonationsBtn');

    refreshDonationsBtn?.addEventListener('click', () => {
      loadDonationHistory(false);
    });

    loadMoreBtn?.addEventListener('click', () => {
      if (hasMore && !isLoading) {
        loadDonationHistory(true);
      }
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
  }

  return {
    init,
    loadDonationHistory
  };
})();

window.AdminDonations = AdminDonations;
