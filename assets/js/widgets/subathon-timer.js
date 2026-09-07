document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const customSubtitle = (params.get('subtitle') || params.get('sub') || '').trim();

  const timerDisplay = document.getElementById('timerDisplay');
  const statusBadge = document.getElementById('statusBadge');
  const sessionTitle = document.getElementById('sessionTitle');
  const streamerName = document.getElementById('streamerName');
  const deltaPill = document.getElementById('deltaPill');

  if (streamerName && customSubtitle) {
    streamerName.textContent = customSubtitle;
  }

  if (!token) {
    if (timerDisplay) timerDisplay.textContent = 'NO TOKEN';
    if (streamerName && !customSubtitle) streamerName.textContent = 'Vui lòng cung cấp widget token trên URL';
    return;
  }

  let remainingSeconds = 0;
  let currentStatus = 'pending';
  let timerInterval = null;
  let deltaTimeout = null;

  function showDeltaAnimation(seconds) {
    if (!deltaPill || !seconds) return;
    clearTimeout(deltaTimeout);

    const deltaText = (typeof Formatters !== 'undefined' && Formatters.secondsDelta)
      ? Formatters.secondsDelta(seconds)
      : (seconds > 0 ? `+${seconds}s` : `${seconds}s`);

    deltaPill.textContent = deltaText;

    if (seconds < 0) {
      deltaPill.classList.add('negative');
    } else {
      deltaPill.classList.remove('negative');
    }

    // Reset & restart CSS animation smoothly
    deltaPill.classList.remove('show');
    void deltaPill.offsetWidth; // Trigger reflow
    deltaPill.classList.add('show');

    deltaTimeout = setTimeout(() => {
      deltaPill.classList.remove('show');
    }, 3500);
  }

  function updateUI() {
    if (timerDisplay) {
      timerDisplay.textContent = Formatters.duration(remainingSeconds);
    }

    if (statusBadge) {
      statusBadge.className = 'overlay-status';
      if (currentStatus === 'active') {
        statusBadge.classList.add('status-live');
        statusBadge.textContent = 'LIVE';
      } else if (currentStatus === 'paused') {
        statusBadge.classList.add('status-paused');
        statusBadge.textContent = 'PAUSED';
      } else {
        statusBadge.classList.add('status-ended');
        statusBadge.textContent = 'ENDED';
      }
    }
  }

  /**
   * Xử lý chuyên biệt tất cả sự kiện đồng bộ Subathon từ Pusher, BroadcastChannel và Storage:
   * subathon-time-adjusted, subathon-time-added, subathon-started, subathon-paused, subathon-resumed, subathon-ended...
   */
  function handleSyncEvent(eventName, data = {}) {
    if (!data) return;

    // Kiểm tra widget_token nếu payload có cung cấp (đảm bảo đúng phiên Streamer)
    if (token && data.widget_token && data.widget_token !== token) {
      return;
    }

    console.log(`[Subathon Sync] Event: ${eventName}`, data);

    // Kích hoạt hiệu ứng nhảy số deltaPill (+120s, -60s...) nếu có biến động thời gian
    const delta = data.seconds_delta ?? data.added_seconds ?? data.delta;
    if (typeof delta === 'number' && delta !== 0) {
      showDeltaAnimation(delta);
    }

    switch (eventName) {
      case 'subathon-time-added':
      case 'subathon-time-adjusted':
        if (data.status) currentStatus = data.status;
        if (typeof data.remaining_seconds === 'number') {
          remainingSeconds = Math.max(0, data.remaining_seconds);
        } else if (typeof delta === 'number') {
          remainingSeconds = Math.max(0, remainingSeconds + delta);
        }
        break;

      case 'subathon-started':
      case 'subathon-resumed':
        currentStatus = 'active';
        if (typeof data.remaining_seconds === 'number') {
          remainingSeconds = Math.max(0, data.remaining_seconds);
        }
        break;

      case 'subathon-paused':
        currentStatus = 'paused';
        if (typeof data.remaining_seconds === 'number') {
          remainingSeconds = Math.max(0, data.remaining_seconds);
        }
        break;

      case 'subathon-ended':
        currentStatus = 'ended';
        remainingSeconds = 0;
        break;

      case 'subathon-updated':
      case 'subathon-sync':
      default:
        if (data.status) currentStatus = data.status;
        if (typeof data.remaining_seconds === 'number') {
          remainingSeconds = Math.max(0, data.remaining_seconds);
        }
        break;
    }

    if (data.title && sessionTitle) {
      sessionTitle.textContent = data.title;
    }
    if (data.streamer_name && streamerName && !customSubtitle) {
      streamerName.textContent = data.streamer_name;
    }

    updateUI();
  }

  async function fetchState() {
    try {
      const data = await SubathonService.getWidgetData(token);
      if (data) {
        currentStatus = data.status;
        remainingSeconds = typeof data.remaining_seconds === 'number' ? data.remaining_seconds : 0;

        if (sessionTitle) sessionTitle.textContent = data.title || 'SUBATHON TIMER';
        if (streamerName) {
          streamerName.textContent = customSubtitle || data.streamer_name || 'Streamer';
        }

        updateUI();
      }
    } catch (err) {
      console.warn('Không thể tải dữ liệu widget subathon:', err);
    }
  }

  fetchState();

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (currentStatus === 'active') {
      if (remainingSeconds > 0) {
        remainingSeconds--;
        updateUI();
      } else {
        currentStatus = 'ended';
        updateUI();
      }
    }
  }, 1000);

  // 1. Pusher Realtime (Kênh riêng biệt obs-subathon-{token})
  const pusherKey = CONFIG.PUSHER?.APP_KEY;
  if (pusherKey && typeof Pusher !== 'undefined') {
    try {
      const pusher = new Pusher(pusherKey, { cluster: CONFIG.PUSHER?.CLUSTER || 'ap1' });
      const channel = pusher.subscribe(`obs-subathon-${token}`);

      const pusherEvents = [
        'subathon-time-added',
        'subathon-time-adjusted',
        'subathon-started',
        'subathon-paused',
        'subathon-resumed',
        'subathon-ended'
      ];

      pusherEvents.forEach(evt => {
        channel.bind(evt, (data) => handleSyncEvent(evt, data));
      });

      console.log(`Đã kết nối Pusher Realtime (obs-subathon-${token}) cho Subathon Widget.`);
    } catch (err) {
      console.warn('Lỗi kết nối Pusher cho Subathon Widget:', err);
    }
  }

  // 2. BroadcastChannel: Đồng bộ tức thời 0ms giữa Admin Tab và Widget trên cùng máy
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const subathonChannel = new BroadcastChannel('obs_subathon_channel');
      subathonChannel.onmessage = (event) => {
        const msg = event.data;
        if (!msg) return;
        const evtName = msg.event || msg._type || msg.action || 'subathon-updated';
        const payload = msg.payload || msg.data || msg;
        handleSyncEvent(evtName, payload);
      };
    } catch (err) {
      console.warn('Lỗi khởi tạo BroadcastChannel subathon:', err);
    }
  }

  // 3. Storage Event: Đồng bộ liên tab/cửa sổ khi localStorage thay đổi
  window.addEventListener('storage', (event) => {
    if (event.key === 'subathon_sync_event' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        const evtName = parsed.event || parsed._type || 'subathon-updated';
        const payload = parsed.payload || parsed.data || parsed;
        handleSyncEvent(evtName, payload);
      } catch (err) {
        console.warn('Lỗi đọc storage subathon_sync_event:', err);
      }
    }
  });

  if (CONFIG.POLL_INTERVALS?.SUBATHON_SYNC) {
    setInterval(fetchState, CONFIG.POLL_INTERVALS.SUBATHON_SYNC);
  }
});
