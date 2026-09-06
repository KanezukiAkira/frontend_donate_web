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

  function showDeltaAnimation(seconds) {
    if (!deltaPill || seconds === 0) return;
    deltaPill.textContent = Formatters.secondsDelta(seconds);
    deltaPill.classList.add('show');
    setTimeout(() => {
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

  const pusherKey = CONFIG.PUSHER?.APP_KEY;
  if (pusherKey && typeof Pusher !== 'undefined') {
    try {
      const pusher = new Pusher(pusherKey, { cluster: CONFIG.PUSHER?.CLUSTER || 'ap1' });
      const channel = pusher.subscribe(`obs-subathon-${token}`);

      channel.bind('subathon-time-added', (data) => {
        if (data.status) currentStatus = data.status;
        if (typeof data.remaining_seconds === 'number') {
          remainingSeconds = data.remaining_seconds;
        }
        if (data.added_seconds) {
          showDeltaAnimation(data.added_seconds);
        }
        updateUI();
      });

      channel.bind('subathon-time-adjusted', (data) => {
        if (data.status) currentStatus = data.status;
        if (typeof data.remaining_seconds === 'number') {
          remainingSeconds = data.remaining_seconds;
        }
        if (data.seconds_delta) {
          showDeltaAnimation(data.seconds_delta);
        }
        updateUI();
      });

      channel.bind('subathon-started', (data) => {
        currentStatus = 'active';
        if (typeof data.remaining_seconds === 'number') {
          remainingSeconds = data.remaining_seconds;
        }
        updateUI();
      });

      channel.bind('subathon-paused', (data) => {
        currentStatus = 'paused';
        if (typeof data.remaining_seconds === 'number') {
          remainingSeconds = data.remaining_seconds;
        }
        updateUI();
      });

      channel.bind('subathon-resumed', (data) => {
        currentStatus = 'active';
        if (typeof data.remaining_seconds === 'number') {
          remainingSeconds = data.remaining_seconds;
        }
        updateUI();
      });

      channel.bind('subathon-ended', () => {
        currentStatus = 'ended';
        remainingSeconds = 0;
        updateUI();
      });


      console.log(`Đã kết nối Pusher Realtime (obs-subathon-${token}) cho Subathon Widget.`);
    } catch (err) {
      console.warn('Lỗi kết nối Pusher cho Subathon Widget:', err);
    }
  }


  if (CONFIG.POLL_INTERVALS?.SUBATHON_SYNC) {
    setInterval(fetchState, CONFIG.POLL_INTERVALS.SUBATHON_SYNC);
  }
});
