document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const isPinned = urlParams.has('preview') || urlParams.has('pin') || urlParams.has('demo') || urlParams.has('stay');
  const isTtsEnabled = urlParams.get('tts') !== '0';
  const ttsVolume = parseFloat(urlParams.get('tts_volume') || urlParams.get('volume') || '1.0');
  const ttsVoice = urlParams.get('voice') || urlParams.get('tts_voice') || 'vi-VN-HoaiMyNeural';

  if (typeof SoundManager !== 'undefined' && typeof SoundManager.setVoice === 'function') {
    SoundManager.setVoice(ttsVoice);
  }

  // Regular Donate Alert Elements
  const alertBox = document.getElementById('alertBox') || document.getElementById('alert-container');
  const donorNameEl = document.getElementById('donorName');
  const amountEl = document.getElementById('amount');
  const messageEl = document.getElementById('message') || document.getElementById('alert-message');
  const obsStatusPill = document.getElementById('obsStatusPill');
  const obsStatusText = document.getElementById('obsStatusText');

  // Queues & State
  const alertQueue = [];
  let isDisplaying = false;
  let isPolling = false;

  // ==========================================
  // DONATION QUEUE PROCESSING
  // ==========================================
  async function processQueue() {
    if (isDisplaying || alertQueue.length === 0) return;
    isDisplaying = true;

    const current = alertQueue.shift();
    await processRegularAlert(current);

    isDisplaying = false;
    if (alertQueue.length > 0) {
      setTimeout(processQueue, 500);
    }
  }

  // 1. Process Regular Donation Alert
  async function processRegularAlert(current) {
    const donorName = current.full_name || current.name || 'Kanezuki Akira';
    if (donorNameEl) donorNameEl.textContent = donorName;

    let amountText;
    if (current.amount_text) {
      amountText = current.amount_text;
    } else if (current.currency_name || current.unit) {
      const unit = current.currency_name || current.unit;
      amountText = `${Number(current.amount).toLocaleString('vi-VN')} ${unit}`;
    } else if (typeof current.amount === 'number' || !isNaN(Number(current.amount))) {
      const num = Number(current.amount);
      amountText = typeof Formatters !== 'undefined' ? Formatters.currency(num) : `${num.toLocaleString('vi-VN')} ₫`;
    } else {
      amountText = String(current.amount || '50.000 ₫');
    }

    if (amountEl) amountEl.textContent = amountText.replace(/!+$/, '');

    const msg = current.message !== undefined && current.message !== null ? String(current.message).trim() : '';
    if (messageEl) {
      messageEl.textContent = msg;
      const wrap = messageEl.closest('.alert-message-wrap');
      if (wrap) wrap.style.display = msg ? 'flex' : 'none';
      else messageEl.style.display = msg ? 'inline-block' : 'none';
    }

    if (typeof SoundManager !== 'undefined') {
      SoundManager.playDonateChime();
    }

    if (alertBox) alertBox.classList.add('show');

    if (current.id && typeof DonateService !== 'undefined') {
      try {
        await DonateService.markWidgetDisplayed(current.id);
      } catch (err) {
        console.error('Lỗi đánh dấu displayed:', err);
      }
    }

    if (current.isPinned) {
      if (isTtsEnabled && typeof SoundManager !== 'undefined' && SoundManager.speakDonation) {
        setTimeout(() => {
          SoundManager.speakDonation({
            name: donorName,
            amount: current.amount,
            message: current.message,
            volume: ttsVolume,
            voice: ttsVoice
          }).catch(() => { });
        }, 700);
      }
      return;
    }

    // TTS đọc nội dung donate theo hàng đợi FIFO
    if (isTtsEnabled && typeof SoundManager !== 'undefined' && SoundManager.speakDonation) {
      await new Promise(r => setTimeout(r, 600));
      try {
        await SoundManager.speakDonation({
          name: donorName,
          amount: current.amount,
          message: current.message,
          volume: ttsVolume,
          voice: ttsVoice
        });
      } catch (err) {
        console.warn('Lỗi TTS donate:', err);
      }
      await new Promise(r => setTimeout(r, 800));
    } else {
      await new Promise(r => setTimeout(r, 5500));
    }

    if (alertBox) alertBox.classList.remove('show');
    await new Promise(r => setTimeout(r, 600));
  }

  // Polling donations from backend
  async function pollWidgetDonations() {
    if (isPolling) return;
    isPolling = true;

    try {
      if (typeof DonateService !== 'undefined' && DonateService.getWidgetDonations) {
        const donations = await DonateService.getWidgetDonations();
        if (donations && Array.isArray(donations) && donations.length > 0) {
          donations.forEach(d => {
            if (!alertQueue.some(item => item.id === d.id)) {
              alertQueue.push(d);
            }
          });
          processQueue();
        }
      }
    } catch (err) {
      console.warn('OBS Widget poll error:', err);
    } finally {
      isPolling = false;
    }
  }

  // Mock test helpers
  function enqueueTestAlert(fake = {}) {
    if (typeof SoundManager !== 'undefined') {
      SoundManager.init();
    }
    const fallbackVnd = fake.amount
      ? (typeof Formatters !== 'undefined' ? Formatters.currency(fake.amount) : `${Number(fake.amount).toLocaleString('vi-VN')} ₫`)
      : '50.000 ₫';

    alertQueue.push({
      _type: 'donate',
      id: null,
      full_name: fake.full_name || fake.name || 'Kanezuki Akira',
      amount_text: fake.amount_text || fallbackVnd,
      amount: fake.amount !== undefined ? fake.amount : 50000,
      message: fake.message !== undefined ? fake.message : 'Chúc streamer livestream vui vẻ!',
      isPinned: fake.isPinned || false
    });
    processQueue();
  }

  // Status Pill Handling
  if (obsStatusPill) {
    if (isPinned) {
      if (obsStatusText) obsStatusText.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" style="vertical-align:middle;margin-right:4px;"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>Chế độ xem thử (Ghim) • Xóa ?preview=1 khi bắt đầu stream';
      obsStatusPill.style.borderColor = '#facc15';
      obsStatusPill.style.color = '#facc15';
    } else {
      setTimeout(() => {
        obsStatusPill.classList.add('fade-out');
        setTimeout(() => obsStatusPill.remove(), 1000);
      }, 7500);
    }
  }

  // Pinned Preview / Test Mode
  if (isPinned) {
    enqueueTestAlert({ isPinned: true });
  } else if (urlParams.has('test')) {
    setTimeout(() => {
      enqueueTestAlert();
    }, 1200);
  }

  // Click to test / init sound
  document.addEventListener('click', () => {
    if (typeof SoundManager !== 'undefined') {
      SoundManager.stopTTS();
      SoundManager.init();
    }
    if (alertBox && alertBox.classList.contains('show')) {
      alertBox.classList.remove('show');
    }
  });

  // ==========================================
  // PUSHER REALTIME CONNECTION
  // ==========================================
  const pusherKey = CONFIG.PUSHER?.APP_KEY;
  if (pusherKey && typeof Pusher !== 'undefined') {
    try {
      const pusher = new Pusher(pusherKey, { cluster: CONFIG.PUSHER?.CLUSTER || 'ap1' });

      // Kênh tổng obs-channel: nhận ping donate & test alert
      const channel = pusher.subscribe('obs-channel');

      channel.bind('ping-new-donation', () => {
        pollWidgetDonations();
      });

      channel.bind('test-donation', (data) => {
        enqueueTestAlert(data);
      });

      if (token) {
        const donateChannel = pusher.subscribe(`obs-donate-${token}`);
        donateChannel.bind('ping-new-donation', () => {
          pollWidgetDonations();
        });
        donateChannel.bind('test-donation', (data) => {
          enqueueTestAlert(data);
        });
      }

      console.log('Đã kết nối Pusher Realtime (Donate Alert Widget).');
    } catch (err) {
      console.warn('Lỗi kết nối Pusher cho Donate Overlay:', err);
    }
  }

  // BroadcastChannel for Local Cross-Tab Testing
  if (typeof BroadcastChannel !== 'undefined') {
    const donateChannel = new BroadcastChannel('donate-test');
    donateChannel.onmessage = (event) => {
      const fake = event.data;
      if (fake && fake._type === 'test-donate') {
        enqueueTestAlert(fake);
      }
    };
  }

  pollWidgetDonations();

  if (CONFIG.POLL_INTERVALS?.DONATE_WIDGET) {
    setInterval(pollWidgetDonations, CONFIG.POLL_INTERVALS.DONATE_WIDGET);
  }
});
