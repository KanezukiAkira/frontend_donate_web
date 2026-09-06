document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const isPinned = urlParams.has('preview') || urlParams.has('pin') || urlParams.has('demo') || urlParams.has('stay');
  const isTtsEnabled = urlParams.get('tts') !== '0';
  const ttsVolume = parseFloat(urlParams.get('tts_volume') || urlParams.get('volume') || '1.0');

  // Regular Donate Alert Elements
  const alertBox = document.getElementById('alertBox') || document.getElementById('alert-container');
  const donorNameEl = document.getElementById('donorName');
  const amountEl = document.getElementById('amount');
  const messageEl = document.getElementById('message') || document.getElementById('alert-message');
  const obsStatusPill = document.getElementById('obsStatusPill');
  const obsStatusText = document.getElementById('obsStatusText');

  // Gacha Wheel Alert Elements
  const gachaWheelContainer = document.getElementById('gachaWheelContainer');
  const gachaDonorName = document.getElementById('gachaDonorName');
  const gachaDonorAmount = document.getElementById('gachaDonorAmount');
  const gachaDonorMessage = document.getElementById('gachaDonorMessage');
  const gachaMessageWrap = document.getElementById('gachaMessageWrap');
  const gachaTierBadge = document.getElementById('gachaTierBadge');
  const wheelCanvas = document.getElementById('wheelCanvas');
  const wheelPointer = document.getElementById('wheelPointer');
  const gachaResultBanner = document.getElementById('gachaResultBanner');
  const gachaResultRarity = document.getElementById('gachaResultRarity');
  const gachaResultTitle = document.getElementById('gachaResultTitle');
  const gachaResultSubtitle = document.getElementById('gachaResultSubtitle');
  const fxCanvas = document.getElementById('fxCanvas');

  // Queues & State
  const alertQueue = [];
  let isDisplaying = false;
  let isPolling = false;
  let currentWheelAngle = 0;
  let confettiParticles = [];
  let fxAnimationId = null;

  // Setup HiDPI Canvas
  function setupHiDPICanvas(canvas, width, height) {
    if (!canvas) return null;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
  }

  const wheelCtx = setupHiDPICanvas(wheelCanvas, 380, 380);
  const fxCtx = fxCanvas ? fxCanvas.getContext('2d') : null;

  function resizeFxCanvas() {
    if (!fxCanvas) return;
    fxCanvas.width = window.innerWidth;
    fxCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeFxCanvas);
  resizeFxCanvas();

  // Confetti Animation for Wheel Wins
  function triggerConfetti() {
    if (!fxCanvas || !fxCtx) return;
    confettiParticles = [];
    const colors = ['#f59e0b', '#fde047', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#ffffff'];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < 85; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const speed = Math.random() * 9 + 4;
      confettiParticles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        decay: Math.random() * 0.015 + 0.008
      });
    }

    if (fxAnimationId) cancelAnimationFrame(fxAnimationId);

    function updateFx() {
      fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      let aliveCount = 0;

      for (let p of confettiParticles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.rotation += p.rotSpeed;
        p.opacity -= p.decay;

        if (p.opacity > 0) {
          aliveCount++;
          fxCtx.save();
          fxCtx.translate(p.x, p.y);
          fxCtx.rotate((p.rotation * Math.PI) / 180);
          fxCtx.globalAlpha = Math.max(0, p.opacity);
          fxCtx.fillStyle = p.color;
          fxCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          fxCtx.restore();
        }
      }

      if (aliveCount > 0) {
        fxAnimationId = requestAnimationFrame(updateFx);
      } else {
        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      }
    }

    updateFx();
  }

  // Draw Gacha Wheel on Canvas
  function drawWheel(rewards, currentAngle = 0) {
    if (!wheelCtx) return;
    const width = 380;
    const height = 380;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 10;
    const numSlices = rewards.length || 1;
    const sliceAngle = (2 * Math.PI) / numSlices;

    wheelCtx.clearRect(0, 0, width, height);

    rewards.forEach((item, i) => {
      const startAngle = currentAngle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      wheelCtx.save();
      wheelCtx.beginPath();
      wheelCtx.moveTo(centerX, centerY);
      wheelCtx.arc(centerX, centerY, radius, startAngle, endAngle);
      wheelCtx.closePath();

      const baseColor = item.color || (i % 2 === 0 ? '#4f46e5' : '#4338ca');
      wheelCtx.fillStyle = baseColor;
      wheelCtx.fill();

      wheelCtx.lineWidth = 2.5;
      wheelCtx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      wheelCtx.stroke();

      wheelCtx.save();
      wheelCtx.translate(centerX, centerY);
      wheelCtx.rotate(startAngle + sliceAngle / 2);
      wheelCtx.textAlign = 'right';
      wheelCtx.fillStyle = '#ffffff';
      wheelCtx.font = 'bold 15px Outfit, sans-serif';
      wheelCtx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      wheelCtx.shadowBlur = 5;

      const sec = Number(item.seconds || 0);
      const sign = sec >= 0 ? `+${sec}s` : `${sec}s`;
      const text = (item.label && item.label.trim()) ? item.label.trim() : sign;
      wheelCtx.fillText(text, radius - 20, 5);
      wheelCtx.restore();

      wheelCtx.restore();
    });

    // Outer Golden Ring with light studs
    wheelCtx.save();
    wheelCtx.strokeStyle = '#f59e0b';
    wheelCtx.lineWidth = 6;
    wheelCtx.beginPath();
    wheelCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    wheelCtx.stroke();

    const numDots = numSlices * 2;
    const dotAngle = (2 * Math.PI) / numDots;
    for (let d = 0; d < numDots; d++) {
      const angle = currentAngle + d * dotAngle;
      const dotX = centerX + (radius - 1) * Math.cos(angle);
      const dotY = centerY + (radius - 1) * Math.sin(angle);
      wheelCtx.beginPath();
      wheelCtx.arc(dotX, dotY, 3, 0, 2 * Math.PI);
      wheelCtx.fillStyle = d % 2 === 0 ? '#ffffff' : '#fde047';
      wheelCtx.shadowColor = '#fde047';
      wheelCtx.shadowBlur = 6;
      wheelCtx.fill();
    }
    wheelCtx.restore();
  }

  // ==========================================
  // UNIFIED QUEUE PROCESSING
  // ==========================================
  async function processQueue() {
    if (isDisplaying || alertQueue.length === 0) return;
    isDisplaying = true;

    const current = alertQueue.shift();

    if (current._type === 'gacha') {
      await processGachaAlert(current);
    } else {
      await processRegularAlert(current);
    }

    isDisplaying = false;
    if (alertQueue.length > 0) {
      setTimeout(processQueue, 500);
    }
  }

  // 1. Process Regular Donation Alert
  async function processRegularAlert(current) {
    if (gachaWheelContainer) gachaWheelContainer.classList.remove('show');

    const donorName = current.full_name || current.name || 'Kanezuki Akira';
    if (donorNameEl) donorNameEl.textContent = donorName;

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
            volume: ttsVolume
          }).catch(() => { });
        }, 700);
      }
      return;
    }

    // TTS đọc nội dung donate thường
    if (isTtsEnabled && typeof SoundManager !== 'undefined' && SoundManager.speakDonation) {
      await new Promise(r => setTimeout(r, 700));
      try {
        await SoundManager.speakDonation({
          name: donorName,
          amount: current.amount,
          message: current.message,
          volume: ttsVolume
        });
      } catch (err) {
        console.warn('Lỗi TTS donate:', err);
      }
      await new Promise(r => setTimeout(r, 1600));
    } else {
      await new Promise(r => setTimeout(r, 6500));
    }

    if (alertBox) alertBox.classList.remove('show');
    await new Promise(r => setTimeout(r, 600));
  }

  // 2. Process Gacha Wheel Alert with TTS Reading Reward & Time Added
  async function processGachaAlert(data) {
    if (alertBox) alertBox.classList.remove('show');

    const rewards = data.all_rewards || [];
    const wonIndex = typeof data.won_index === 'number' ? data.won_index : 0;
    const wonReward = data.won_reward || (rewards[wonIndex] || {});
    const donorName = data.donor_name || 'Khán giả';
    const amountStr = typeof data.amount === 'number'
      ? `${data.amount.toLocaleString('vi-VN')} ₫`
      : (data.amount || '20.000 ₫');
    const tierName = data.tier_name || 'VÒNG QUAY MAY MẮN';
    const numSlices = rewards.length || 1;
    const sliceAngle = (2 * Math.PI) / numSlices;

    if (gachaDonorName) gachaDonorName.textContent = donorName;
    if (gachaDonorAmount) gachaDonorAmount.textContent = amountStr;
    if (gachaTierBadge) gachaTierBadge.textContent = tierName;

    if (data.message && data.message.trim()) {
      if (gachaDonorMessage) gachaDonorMessage.textContent = data.message.trim();
      if (gachaMessageWrap) gachaMessageWrap.style.display = 'flex';
    } else {
      if (gachaMessageWrap) gachaMessageWrap.style.display = 'none';
    }

    if (gachaResultBanner) gachaResultBanner.classList.remove('show');

    if (gachaWheelContainer) gachaWheelContainer.classList.add('show');

    drawWheel(rewards, currentWheelAngle);

    // Tính toán góc đích để slice wonIndex dừng ngay đỉnh 12 giờ (3*PI/2)
    const pointerAngle = (3 * Math.PI) / 2;
    const sliceCenter = wonIndex * sliceAngle + sliceAngle / 2;
    let targetBase = pointerAngle - sliceCenter;

    while (targetBase < currentWheelAngle) {
      targetBase += 2 * Math.PI;
    }

    const extraRotations = 6 * 2 * Math.PI;
    const finalAngle = targetBase + extraRotations;
    const startAngle = currentWheelAngle;
    const totalDelta = finalAngle - startAngle;

    const duration = 4300;
    const startTime = performance.now();
    let lastSliceIndex = -1;

    await new Promise((resolveSpin) => {
      function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 4); // Quartic Ease-Out
        currentWheelAngle = startAngle + totalDelta * ease;

        drawWheel(rewards, currentWheelAngle);

        const currentPointerSlice = Math.floor(
          ((pointerAngle - currentWheelAngle) % (2 * Math.PI) + 2 * Math.PI) / sliceAngle
        ) % numSlices;

        if (currentPointerSlice !== lastSliceIndex) {
          lastSliceIndex = currentPointerSlice;
          if (typeof SoundManager !== 'undefined') {
            SoundManager.playTickSound();
          }
          if (wheelPointer) {
            wheelPointer.classList.add('tick');
            setTimeout(() => wheelPointer.classList.remove('tick'), 65);
          }
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          currentWheelAngle = finalAngle;
          drawWheel(rewards, currentWheelAngle);
          resolveSpin();
        }
      }
      requestAnimationFrame(animate);
    });

    // Kết thúc quay -> Hiển thị Banner kết quả
    const sec = Number(wonReward.seconds || 0);
    const isPenalty = sec < 0;

    if (gachaResultTitle) {
      gachaResultTitle.textContent = isPenalty ? `TRỪ ${Math.abs(sec)} GIÂY` : `+${sec} GIÂY`;
    }

    if (gachaResultSubtitle) {
      if (data.is_standalone) {
        gachaResultSubtitle.textContent = isPenalty
          ? `Kết quả: Bị trừ ${Math.abs(sec)} giây.`
          : `Kết quả: Được cộng thêm ${sec} giây!`;
      } else {
        if (isPenalty) {
          gachaResultSubtitle.textContent = `Đã trừ ${Math.abs(sec)} giây từ thời gian Subathon.`;
        } else {
          gachaResultSubtitle.textContent = `Đã cộng ${sec} giây vào thời gian Subathon!`;
        }
      }
    }

    if (gachaResultBanner) {
      gachaResultBanner.classList.add('show');
    }

    if (typeof SoundManager !== 'undefined') {
      SoundManager.playWheelWinSound(isPenalty);
    }

    if (!isPenalty) {
      triggerConfetti();
    }

    // TTS ĐỌC THÔNG TIN DONATE VÀ THỜI GIAN CỘNG THÊM SAU KHI VÒNG QUAY DỪNG
    if (isTtsEnabled && typeof SoundManager !== 'undefined' && SoundManager.speakGachaReward) {
      await new Promise(r => setTimeout(r, 600));
      try {
        await SoundManager.speakGachaReward({
          name: donorName,
          amount: data.amount,
          rewardLabel: wonReward.label,
          seconds: wonReward.seconds,
          message: data.message,
          volume: ttsVolume
        });
      } catch (err) {
        console.warn('Lỗi TTS Gacha:', err);
      }
      await new Promise(r => setTimeout(r, 1800));
    } else {
      await new Promise(r => setTimeout(r, 4500));
    }

    if (data.isPinned) return;

    if (gachaWheelContainer) gachaWheelContainer.classList.remove('show');
    if (gachaResultBanner) gachaResultBanner.classList.remove('show');
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

  const sampleGachaRewards = [
    { id: '1', label: '+30s', seconds: 30, weight: 45, color: '#3b82f6' },
    { id: '2', label: '+60s', seconds: 60, weight: 30, color: '#06b6d4' },
    { id: '3', label: '+120s', seconds: 120, weight: 15, color: '#8b5cf6' },
    { id: '4', label: '+300s', seconds: 300, weight: 6, color: '#f59e0b' },
    { id: '5', label: '-30s', seconds: -30, weight: 4, color: '#ef4444' }
  ];

  function enqueueTestGacha(fake = {}) {
    if (typeof SoundManager !== 'undefined') {
      SoundManager.init();
    }
    alertQueue.push({
      _type: 'gacha',
      donor_name: fake.donor_name || 'Khán giả bí ẩn',
      amount: fake.amount || 20000,
      message: fake.message || 'Cộng thêm thời gian cho streamer nhé!',
      tier_name: fake.tier_name || 'VÒNG QUAY 20K',
      won_reward: fake.won_reward || sampleGachaRewards[3],
      won_index: fake.won_index !== undefined ? fake.won_index : 3,
      all_rewards: fake.all_rewards || sampleGachaRewards,
      added_seconds: 300,
      isPinned: fake.isPinned || false
    });
    processQueue();
  }

  // Status Pill Handling
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

  // Pinned Preview / Test Mode
  if (isPinned) {
    const previewType = urlParams.get('preview') || urlParams.get('mode');
    if (previewType === 'gacha' || previewType === 'wheel') {
      enqueueTestGacha({ isPinned: true });
    } else {
      enqueueTestAlert({ isPinned: true });
    }
  } else if (urlParams.has('test')) {
    setTimeout(() => {
      const mode = urlParams.get('test');
      if (mode === 'gacha') {
        enqueueTestGacha();
      } else {
        enqueueTestAlert();
      }
    }, 1200);
  }

  // Click to test / init sound
  document.addEventListener('click', () => {
    if (typeof SoundManager !== 'undefined') {
      SoundManager.stopTTS();
      SoundManager.init();
    }
    if (alertBox.classList.contains('show') || (gachaWheelContainer && gachaWheelContainer.classList.contains('show'))) {
      if (alertBox) alertBox.classList.remove('show');
      if (gachaWheelContainer) gachaWheelContainer.classList.remove('show');
      if (gachaResultBanner) gachaResultBanner.classList.remove('show');
    }
  });

  // ==========================================
  // PUSHER REALTIME CONNECTION
  // ==========================================
  const pusherKey = CONFIG.PUSHER?.APP_KEY;
  if (pusherKey && typeof Pusher !== 'undefined') {
    try {
      const pusher = new Pusher(pusherKey, { cluster: CONFIG.PUSHER?.CLUSTER || 'ap1' });

      // 1. Kênh tổng obs-channel: nhận ping donate thường & test alert & gacha roll
      const channel = pusher.subscribe('obs-channel');

      channel.bind('ping-new-donation', () => {
        pollWidgetDonations();
      });

      channel.bind('test-donation', (data) => {
        enqueueTestAlert(data);
      });

      channel.bind('subathon-gacha-roll', (data) => {
        alertQueue.push({
          _type: 'gacha',
          ...data
        });
        processQueue();
      });

      // 2. Kênh subathon theo widget_token nếu có
      if (token) {
        const subChannel = pusher.subscribe(`obs-subathon-${token}`);
        subChannel.bind('subathon-gacha-roll', (data) => {
          // Tránh duplicate nếu cả 2 channel cùng nhận
          const exists = alertQueue.some(item =>
            item._type === 'gacha' &&
            item.server_time === data.server_time &&
            item.donor_name === data.donor_name
          );
          if (!exists) {
            alertQueue.push({
              _type: 'gacha',
              ...data
            });
            processQueue();
          }
        });
      }

      console.log('Đã kết nối Pusher Realtime (Donate + Gacha Wheel Unified).');
    } catch (err) {
      console.warn('Lỗi kết nối Pusher cho Donate & Gacha Overlay:', err);
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

    const gachaChannel = new BroadcastChannel('gacha-test');
    gachaChannel.onmessage = (event) => {
      const data = event.data;
      if (data && data._type === 'gacha-roll') {
        alertQueue.push({
          _type: 'gacha',
          ...data.payload
        });
        processQueue();
      }
    };
  }

  pollWidgetDonations();

  if (CONFIG.POLL_INTERVALS?.DONATE_WIDGET) {
    setInterval(pollWidgetDonations, CONFIG.POLL_INTERVALS.DONATE_WIDGET);
  }
});
