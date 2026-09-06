document.addEventListener('DOMContentLoaded', () => {
  const alertBox = document.getElementById('alertBox') || document.getElementById('alert-container');
  const donorNameEl = document.getElementById('donorName');
  const amountEl = document.getElementById('amount');
  const messageEl = document.getElementById('message') || document.getElementById('alert-message');
  const obsStatusPill = document.getElementById('obsStatusPill');
  const obsStatusText = document.getElementById('obsStatusText');

  const alertQueue = [];
  let isDisplaying = false;
  let isPolling = false;

  const urlParams = new URLSearchParams(window.location.search);
  const isPinned = urlParams.has('preview') || urlParams.has('pin') || urlParams.has('demo') || urlParams.has('stay') || urlParams.has('test');

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

  async function processQueue() {
    if (isDisplaying || alertQueue.length === 0) return;

    isDisplaying = true;
    const current = alertQueue.shift();

    const donorName = current.full_name || current.name || 'Kanezuki Akira';
    if (donorNameEl) {
      donorNameEl.textContent = donorName;
    }

    let amountText = '';
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

    const cleanAmount = amountText.replace(/!+$/, '');
    if (amountEl) {
      amountEl.textContent = cleanAmount;
    }

    if (messageEl) {
      const msg = current.message !== undefined && current.message !== null ? String(current.message).trim() : '';
      messageEl.textContent = msg;
      const wrap = messageEl.closest('.alert-message-wrap');
      if (wrap) {
        wrap.style.display = msg ? 'flex' : 'none';
      } else {
        messageEl.style.display = msg ? 'inline-block' : 'none';
      }
    }

    if (typeof SoundManager !== 'undefined') {
      SoundManager.playDonateChime();
    }

    alertBox.classList.add('show');

    if (current.id && typeof DonateService !== 'undefined') {
      try {
        await DonateService.markWidgetDisplayed(current.id);
      } catch (err) {
        console.error('Không thể đánh dấu donation đã hiển thị:', err);
      }
    }

    const isTtsEnabled = urlParams.get('tts') !== '0';
    const ttsVolume = parseFloat(urlParams.get('tts_volume') || urlParams.get('volume') || '1.0');

    if (current.isPinned) {
      if (isTtsEnabled && typeof SoundManager !== 'undefined' && SoundManager.speakDonation) {
        setTimeout(() => {
          SoundManager.speakDonation({
            name: donorName,
            amount: current.amount,
            message: current.message,
            volume: ttsVolume
          }).catch(() => {});
        }, 700);
      }
      isDisplaying = false;
      return;
    }

    if (isTtsEnabled && typeof SoundManager !== 'undefined' && SoundManager.speakDonation) {
      setTimeout(async () => {
        try {
          await SoundManager.speakDonation({
            name: donorName,
            amount: current.amount,
            message: current.message,
            volume: ttsVolume
          });
        } catch (err) {
          console.warn('TTS playback error:', err);
        } finally {
          setTimeout(() => {
            alertBox.classList.remove('show');
            setTimeout(() => {
              isDisplaying = false;
              processQueue();
            }, 600);
          }, 2000);
        }
      }, 700);
    } else {
      setTimeout(() => {
        alertBox.classList.remove('show');
        setTimeout(() => {
          isDisplaying = false;
          processQueue();
        }, 600);
      }, 7000);
    }
  }

  function enqueueTestAlert(fake = {}) {
    if (typeof SoundManager !== 'undefined') {
      SoundManager.init();
    }
    const fallbackVnd = fake.amount ? (typeof Formatters !== 'undefined' ? Formatters.currency(fake.amount) : `${Number(fake.amount).toLocaleString('vi-VN')} ₫`) : '50.000 ₫';
    alertQueue.push({
      id: null,
      full_name: fake.full_name || fake.name || 'Kanezuki Akira',
      amount_text: fake.amount_text || fallbackVnd,
      amount: fake.amount !== undefined ? fake.amount : 50000,
      message: fake.message !== undefined ? fake.message : 'abc',
      isPinned: fake.isPinned || false
    });
    processQueue();
  }

  if (typeof SoundManager !== 'undefined') {
    SoundManager.init();
  }

  if (obsStatusPill) {
    if (isPinned) {
      if (obsStatusText) obsStatusText.textContent = '📌 Chế độ xem thử (Ghim) • Xóa ?preview=1 khi bắt đầu stream';
      obsStatusPill.style.borderColor = '#facc15';
      obsStatusPill.style.color = '#facc15';
    } else {
      setTimeout(() => {
        obsStatusPill.classList.add('fade-out');
        setTimeout(() => obsStatusPill.remove(), 1000);
      }, 7500);
    }
  }

  setTimeout(() => {
    const testName = urlParams.get('name') || 'Kanezuki Akira';
    const testAmount = urlParams.get('amount') || '50.000 ₫';
    const testMsg = urlParams.get('message') || 'abc';
    enqueueTestAlert({
      full_name: testName,
      amount_text: testAmount,
      amount: 50000,
      message: testMsg,
      isPinned: isPinned
    });
  }, 700);

  document.addEventListener('click', () => {
    if (typeof SoundManager !== 'undefined') {
      SoundManager.stopTTS();
      SoundManager.init();
    }
    if (alertBox.classList.contains('show')) {
      alertBox.classList.remove('show');
      setTimeout(() => {
        enqueueTestAlert({
          full_name: 'Kanezuki Akira',
          amount_text: '50.000 ₫',
          amount: 50000,
          message: 'abc',
          isPinned: isPinned
        });
      }, 250);
    } else {
      enqueueTestAlert({
        full_name: 'Kanezuki Akira',
        amount_text: '50.000 ₫',
        amount: 50000,
        message: 'abc',
        isPinned: isPinned
      });
    }
  });

  const pusherKey = CONFIG.PUSHER?.APP_KEY;
  if (pusherKey && typeof Pusher !== 'undefined') {
    try {
      const pusher = new Pusher(pusherKey, { cluster: CONFIG.PUSHER?.CLUSTER || 'ap1' });
      const channel = pusher.subscribe('obs-channel');

      channel.bind('ping-new-donation', () => {
        pollWidgetDonations();
      });

      channel.bind('test-donation', (data) => {
        enqueueTestAlert(data);
      });
    } catch (err) {
      console.warn('Lỗi kết nối Pusher Realtime cho Donate Alert:', err);
    }
  }

  if (typeof BroadcastChannel !== 'undefined') {
    const testChannel = new BroadcastChannel('donate-test');
    testChannel.onmessage = (event) => {
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
