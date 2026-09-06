document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const isPreview = params.get('preview') === '1' || params.has('preview');

  const goalCard = document.getElementById('goalCard');
  const goalTitle = document.getElementById('goalTitle');
  const statusBadge = document.getElementById('statusBadge');
  const goalFill = document.getElementById('goalFill');
  const currentAmountEl = document.getElementById('currentAmount');
  const targetAmountEl = document.getElementById('targetAmount');
  const pctBadge = document.getElementById('pctBadge');
  const deltaPill = document.getElementById('deltaPill');

  if (isPreview && goalCard) {
    goalCard.classList.add('preview-mode');
  }

  if (!token) {
    if (goalTitle) goalTitle.textContent = 'CHƯA CÓ TOKEN';
    if (currentAmountEl) currentAmountEl.textContent = 'Vui lòng cung cấp ?token=... trên URL';
    return;
  }

  let state = {
    title: 'MỤC TIÊU DONATE',
    current_amount: 0,
    target_amount: 1,
    percentage: 0,
    status: 'active'
  };

  let displayedAmount = 0;
  let counterAnimId = null;

  function showDelta(amount) {
    if (!deltaPill || !amount || amount <= 0) return;
    deltaPill.textContent = '+' + Formatters.currency(amount);
    deltaPill.classList.add('show');
    setTimeout(() => {
      deltaPill.classList.remove('show');
    }, 3500);
  }

  function animateAmount(targetVal) {
    if (displayedAmount === targetVal) {
      if (currentAmountEl) currentAmountEl.textContent = Formatters.currency(targetVal);
      return;
    }

    const startVal = displayedAmount;
    const diff = targetVal - startVal;
    const duration = 800; // ms
    const startTime = performance.now();

    if (counterAnimId) cancelAnimationFrame(counterAnimId);

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutQuad
      const ease = 1 - (1 - progress) * (1 - progress);
      displayedAmount = Math.round(startVal + diff * ease);

      if (currentAmountEl) {
        currentAmountEl.textContent = Formatters.currency(displayedAmount);
      }

      if (progress < 1) {
        counterAnimId = requestAnimationFrame(step);
      } else {
        displayedAmount = targetVal;
        if (currentAmountEl) {
          currentAmountEl.textContent = Formatters.currency(displayedAmount);
        }
      }
    }

    counterAnimId = requestAnimationFrame(step);
  }

  function renderUI() {
    if (goalTitle) goalTitle.textContent = state.title || 'MỤC TIÊU DONATE';
    if (targetAmountEl) targetAmountEl.textContent = Formatters.currency(state.target_amount);
    if (pctBadge) pctBadge.textContent = `${state.percentage}%`;

    // Thanh fill giới hạn tối đa 100% về chiều ngang
    const fillPercent = Math.min(100, Math.max(0, state.percentage));
    if (goalFill) {
      goalFill.style.width = `${fillPercent}%`;
    }

    animateAmount(state.current_amount);

    if (statusBadge) {
      statusBadge.className = 'goal-status';
      const st = (state.status || '').toLowerCase();
      if (st === 'active') {
        statusBadge.classList.add('status-live');
        statusBadge.textContent = 'LIVE';
      } else if (st === 'paused') {
        statusBadge.classList.add('status-paused');
        statusBadge.textContent = 'PAUSED';
      } else {
        statusBadge.classList.add('status-ended');
        statusBadge.textContent = 'ENDED';
      }
    }
  }

  async function fetchState() {
    try {
      const data = await GoalService.getWidgetData(token);
      if (data) {
        state.title = data.title || state.title;
        state.current_amount = typeof data.current_amount === 'number' ? data.current_amount : state.current_amount;
        state.target_amount = typeof data.target_amount === 'number' ? data.target_amount : state.target_amount;
        state.percentage = typeof data.percentage === 'number' ? data.percentage : 0;
        state.status = data.status || state.status;
        renderUI();
      }
    } catch (err) {
      console.warn('Không thể tải dữ liệu goal widget:', err);
    }
  }

  // Khởi chạy fetch lần đầu
  fetchState();

  // Polling dự phòng mỗi 15 giây
  setInterval(fetchState, 15000);

  // Pusher Realtime
  const pusherKey = CONFIG.PUSHER?.APP_KEY;
  if (pusherKey && typeof Pusher !== 'undefined') {
    try {
      const pusher = new Pusher(pusherKey, { cluster: CONFIG.PUSHER?.CLUSTER || 'ap1' });
      const channel = pusher.subscribe(`obs-goal-${token}`);

      channel.bind('goal-updated', (data) => {
        if (!data) return;
        if (data.title) state.title = data.title;
        if (typeof data.current_amount === 'number') state.current_amount = data.current_amount;
        if (typeof data.target_amount === 'number') state.target_amount = data.target_amount;
        if (typeof data.percentage === 'number') state.percentage = data.percentage;
        if (data.status) state.status = data.status;

        if (data.added_amount && data.added_amount > 0) {
          showDelta(data.added_amount);
        }

        renderUI();
      });
    } catch (e) {
      console.warn('Lỗi kết nối Pusher Goal Widget:', e);
    }
  }
});
