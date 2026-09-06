/**
 * Gacha Wheel OBS Widget
 * Hiển thị vòng quay may mắn độc lập trên OBS Studio (Hỗ trợ cả Time Gacha & Reward Gacha).
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const isPinned = urlParams.has('preview') || urlParams.has('pin') || urlParams.has('demo') || urlParams.has('stay');
  const isTtsEnabled = urlParams.get('tts') !== '0';
  const ttsVolume = parseFloat(urlParams.get('tts_volume') || urlParams.get('volume') || '1.0');

  // DOM Elements
  const obsStatusPill = document.getElementById('obsStatusPill');
  const obsStatusText = document.getElementById('obsStatusText');
  const wheelContainer = document.getElementById('gachaWheelContainer');
  const wheelBadge = document.getElementById('gachaWheelBadge');
  const tierBadge = document.getElementById('gachaTierBadge');
  const donorNameEl = document.getElementById('gachaDonorName');
  const donorAmountEl = document.getElementById('gachaDonorAmount');
  const messageWrap = document.getElementById('gachaMessageWrap');
  const donorMessageEl = document.getElementById('gachaDonorMessage');
  const wheelCanvas = document.getElementById('wheelCanvas');
  const wheelPointer = document.getElementById('wheelPointer');
  const centerCap = document.getElementById('wheelCenterCap');
  const capIcon = document.getElementById('capIcon');
  const capLabel = document.getElementById('capLabel');
  const resultBanner = document.getElementById('gachaResultBanner');
  const resultTitle = document.getElementById('gachaResultTitle');
  const resultSubtitle = document.getElementById('gachaResultSubtitle');
  const fxCanvas = document.getElementById('fxCanvas');

  // Queues & State
  const spinQueue = [];
  let isSpinning = false;
  let currentWheelAngle = 0;
  let confettiParticles = [];
  let fxAnimationId = null;

  // Active wheel configuration (loaded from API or default fallback)
  let activeWheel = {
    name: 'VÒNG QUAY MAY MẮN',
    wheel_type: 'time',
    trigger_amount: 20000,
    rewards: [
      { id: '1', label: '+300s', value: 300, weight: 10, color: '#f59e0b' },
      { id: '2', label: '+120s', value: 120, weight: 20, color: '#8b5cf6' },
      { id: '3', label: '+60s', value: 60, weight: 40, color: '#10b981' },
      { id: '4', label: '+15s', value: 15, weight: 20, color: '#38bdf8' },
      { id: '5', label: '-30s', value: -30, weight: 10, color: '#ef4444' }
    ]
  };

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

  const wheelCtx = setupHiDPICanvas(wheelCanvas, 360, 360);
  const fxCtx = fxCanvas ? fxCanvas.getContext('2d') : null;

  function resizeFxCanvas() {
    if (!fxCanvas) return;
    fxCanvas.width = window.innerWidth;
    fxCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeFxCanvas);
  resizeFxCanvas();

  // Confetti Particle Explosion
  function triggerConfetti() {
    if (!fxCanvas || !fxCtx) return;
    confettiParticles = [];
    const colors = ['#f59e0b', '#fde047', '#38bdf8', '#a855f7', '#ec4899', '#10b981', '#ffffff'];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < 90; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const speed = Math.random() * 10 + 4;
      confettiParticles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
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
        p.vy += 0.24;
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
  function drawWheel(rewards, currentAngle = 0, wheelType = 'time') {
    if (!wheelCtx) return;
    const width = 360;
    const height = 360;
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

      const defaultColors = wheelType === 'reward'
        ? ['#7c3aed', '#9333ea', '#c026d3', '#db2777', '#4f46e5', '#0891b2']
        : ['#2563eb', '#0284c7', '#0d9488', '#16a34a', '#d97706', '#dc2626'];

      const baseColor = item.color || defaultColors[i % defaultColors.length];
      wheelCtx.fillStyle = baseColor;
      wheelCtx.fill();

      wheelCtx.lineWidth = 2.5;
      wheelCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      wheelCtx.stroke();

      // Text trên nan quạt
      wheelCtx.save();
      wheelCtx.translate(centerX, centerY);
      wheelCtx.rotate(startAngle + sliceAngle / 2);
      wheelCtx.textAlign = 'right';
      wheelCtx.fillStyle = '#ffffff';
      wheelCtx.font = 'bold 14px Outfit, sans-serif';
      wheelCtx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      wheelCtx.shadowBlur = 5;

      let text = '';
      if (item.label && item.label.trim()) {
        text = item.label.trim();
      } else if (wheelType === 'time') {
        const sec = Number(item.value || 0);
        text = sec >= 0 ? `+${sec}s` : `${sec}s`;
      } else {
        text = String(item.value || 'Thưởng');
      }

      // Giới hạn độ dài text trên nan quạt
      if (text.length > 15) {
        text = text.substring(0, 14) + '…';
      }

      wheelCtx.fillText(text, radius - 18, 5);
      wheelCtx.restore();

      wheelCtx.restore();
    });

    // Outer Golden Ring with Light Studs
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
      wheelCtx.arc(dotX, dotY, 2.8, 0, 2 * Math.PI);
      wheelCtx.fillStyle = d % 2 === 0 ? '#ffffff' : '#fde047';
      wheelCtx.shadowColor = '#fde047';
      wheelCtx.shadowBlur = 5;
      wheelCtx.fill();
    }
    wheelCtx.restore();
  }

  // Cập nhật Center Cap phù hợp với loại vòng quay
  function updateCenterCap(wheelType) {
    if (wheelType === 'reward') {
      if (centerCap) centerCap.classList.add('reward-cap');
      if (capIcon) capIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>';
      if (capLabel) capLabel.textContent = 'REWARD';
      if (wheelBadge) {
        wheelBadge.innerHTML = '<svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="vertical-align:middle;margin-right:4px;"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg>VÒNG QUAY PHẦN THƯỞNG';
        wheelBadge.classList.add('reward-type');
      }
    } else {
      if (centerCap) centerCap.classList.remove('reward-cap');
      if (capIcon) capIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9.5 3h5M12 3v2"/></svg>';
      if (capLabel) capLabel.textContent = 'TIME';
      if (wheelBadge) {
        wheelBadge.innerHTML = '<svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="vertical-align:middle;margin-right:4px;"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9.5 3h5M12 3v2"/></svg>VÒNG QUAY THỜI GIAN';
        wheelBadge.classList.remove('reward-type');
      }
    }
  }

  // Xử lý hàng đợi vòng quay
  async function processQueue() {
    if (isSpinning || spinQueue.length === 0) return;
    isSpinning = true;

    const current = spinQueue.shift();
    await executeSpin(current);

    isSpinning = false;
    if (spinQueue.length > 0) {
      setTimeout(processQueue, 600);
    }
  }

  // Thực thi quay vòng quay với hiệu ứng chuyển động mượt mà
  async function executeSpin(data) {
    const rewards = data.all_rewards || activeWheel.rewards || [];
    const wonIndex = typeof data.won_index === 'number' ? data.won_index : 0;
    const wonReward = data.won_reward || (rewards[wonIndex] || {});
    const wheelType = data.wheel_type || activeWheel.wheel_type || 'time';
    const donorName = data.donor_name || 'Khán giả';
    const amountStr = typeof data.amount === 'number'
      ? `${data.amount.toLocaleString('vi-VN')} ₫`
      : (data.amount || '20.000 ₫');
    const wheelName = data.wheel_name || activeWheel.name || 'VÒNG QUAY';

    // Cập nhật thông tin người donate trên card
    updateCenterCap(wheelType);
    if (donorNameEl) donorNameEl.textContent = donorName;
    if (donorAmountEl) donorAmountEl.textContent = amountStr;
    if (tierBadge) tierBadge.textContent = `GÓI ${amountStr}`;

    if (data.message && data.message.trim()) {
      if (donorMessageEl) donorMessageEl.textContent = data.message.trim();
      if (messageWrap) messageWrap.style.display = 'flex';
    } else {
      if (messageWrap) messageWrap.style.display = 'none';
    }

    if (resultBanner) resultBanner.classList.remove('show');
    if (wheelContainer) wheelContainer.classList.add('show');

    drawWheel(rewards, currentWheelAngle, wheelType);

    const numSlices = rewards.length || 1;
    const sliceAngle = (2 * Math.PI) / numSlices;

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

    const duration = 4200;
    const startTime = performance.now();
    let lastSliceIndex = -1;

    // Hiệu ứng quay Quartic Ease-Out
    await new Promise((resolveSpin) => {
      function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 4);
        currentWheelAngle = startAngle + totalDelta * ease;

        drawWheel(rewards, currentWheelAngle, wheelType);

        // Phát âm thanh và rung kim khi nan quạt đi qua
        const currentPointerSlice = Math.floor(
          ((pointerAngle - currentWheelAngle) % (2 * Math.PI) + 2 * Math.PI) / sliceAngle
        ) % numSlices;

        if (currentPointerSlice !== lastSliceIndex) {
          lastSliceIndex = currentPointerSlice;
          if (typeof SoundManager !== 'undefined' && SoundManager.playTickSound) {
            SoundManager.playTickSound();
          }
          if (wheelPointer) {
            wheelPointer.classList.add('tick');
            setTimeout(() => wheelPointer.classList.remove('tick'), 60);
          }
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          currentWheelAngle = finalAngle;
          drawWheel(rewards, currentWheelAngle, wheelType);
          resolveSpin();
        }
      }
      requestAnimationFrame(animate);
    });

    // Kết thúc quay -> Chuẩn bị nội dung hiển thị kết quả
    let mainText = '';
    let subNote = '';
    let isPenalty = false;

    if (wheelType === 'time') {
      const sec = Number(wonReward.value ?? wonReward.seconds ?? 0);
      isPenalty = sec < 0;
      mainText = isPenalty ? `TRỪ ${Math.abs(sec)} GIÂY` : `+${sec} GIÂY`;
      subNote = data.effect_applied || (isPenalty ? `Đã trừ ${Math.abs(sec)} giây từ Subathon.` : `Đã cộng ${sec} giây vào Subathon!`);
    } else {
      // Reward Wheel
      const prize = wonReward.label || wonReward.value || 'Phần thưởng đặc biệt';
      mainText = prize.toUpperCase();
      subNote = data.effect_applied || 'Thử thách / Phần thưởng Streamer thực hiện!';
    }

    if (resultTitle) {
      resultTitle.textContent = mainText;
      if (isPenalty) resultTitle.classList.add('penalty');
      else resultTitle.classList.remove('penalty');
    }

    if (resultSubtitle) {
      resultSubtitle.textContent = subNote;
    }

    if (resultBanner) {
      resultBanner.classList.add('show');
    }

    if (typeof SoundManager !== 'undefined') {
      if (SoundManager.playWheelWinSound) {
        SoundManager.playWheelWinSound(isPenalty);
      } else if (SoundManager.playDonateChime) {
        SoundManager.playDonateChime();
      }
    }

    if (!isPenalty) {
      triggerConfetti();
    }

    // Giọng đọc TTS công bố kết quả sau khi vòng quay dừng
    if (isTtsEnabled && typeof SoundManager !== 'undefined') {
      await new Promise(r => setTimeout(r, 600));
      try {
        let ttsText = '';
        if (wheelType === 'time') {
          const sec = Number(wonReward.value ?? wonReward.seconds ?? 0);
          const timeDesc = sec >= 0 ? `cộng ${sec} giây` : `trừ ${Math.abs(sec)} giây`;
          ttsText = `Cảm ơn ${donorName} đã donate ${amountStr}. Kết quả vòng quay: được ${timeDesc}!`;
        } else {
          const prize = wonReward.label || wonReward.value || 'phần thưởng';
          ttsText = `Cảm ơn ${donorName} đã donate ${amountStr}. Kết quả vòng quay: ${prize}!`;
        }

        if (SoundManager.speakText) {
          await SoundManager.speakText(ttsText, ttsVolume);
        } else if (SoundManager.speakDonation) {
          await SoundManager.speakDonation({
            name: donorName,
            amount: data.amount,
            message: ttsText,
            volume: ttsVolume
          });
        }
      } catch (err) {
        console.warn('Lỗi TTS Gacha:', err);
      }
      await new Promise(r => setTimeout(r, 2000));
    } else {
      await new Promise(r => setTimeout(r, 4500));
    }

    // Nếu ở chế độ preview/pin thì giữ nguyên giao diện để streamer căn chỉnh OBS
    if (data.isPinned || isPinned) return;

    if (wheelContainer) wheelContainer.classList.remove('show');
    if (resultBanner) resultBanner.classList.remove('show');
    await new Promise(r => setTimeout(r, 600));
  }

  // Đăng ký test demo
  function enqueueTestSpin(fake = {}) {
    if (typeof SoundManager !== 'undefined' && SoundManager.init) {
      SoundManager.init();
    }
    const sampleRewards = activeWheel.rewards || [];
    const chosenIndex = fake.won_index !== undefined ? fake.won_index : Math.min(2, sampleRewards.length - 1);
    const chosenReward = sampleRewards[chosenIndex] || sampleRewards[0];

    spinQueue.push({
      wheel_id: activeWheel.id || 1,
      wheel_name: activeWheel.name,
      wheel_type: activeWheel.wheel_type,
      donor_name: fake.donor_name || 'Khán giả bí ẩn',
      amount: fake.amount || activeWheel.trigger_amount || 20000,
      message: fake.message || 'Chúc streamer livestream vui vẻ!',
      won_index: chosenIndex,
      won_reward: chosenReward,
      all_rewards: sampleRewards,
      effect_applied: activeWheel.wheel_type === 'time'
        ? `+${chosenReward.value || 60} giây vào Subathon!`
        : `Phần thưởng: ${chosenReward.label || chosenReward.value}`,
      isPinned: fake.isPinned || false
    });
    processQueue();
  }

  // Tải cấu hình khởi tạo từ backend nếu có token
  if (token && typeof GachaService !== 'undefined') {
    try {
      const data = await GachaService.getWidgetData(token);
      if (data && data.rewards && data.rewards.length > 0) {
        activeWheel = {
          ...activeWheel,
          ...data
        };
      }
    } catch (err) {
      console.warn('Không thể tải cấu hình widget:', err);
    }
  }

  // Vẽ vòng quay tĩnh ban đầu
  updateCenterCap(activeWheel.wheel_type);
  drawWheel(activeWheel.rewards, currentWheelAngle, activeWheel.wheel_type);

  // Xử lý OBS Status Pill
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

  // Pinned Preview / Test trigger
  if (isPinned) {
    enqueueTestSpin({ isPinned: true });
  } else if (urlParams.has('test')) {
    setTimeout(() => {
      enqueueTestSpin();
    }, 1200);
  }

  // Click để kiểm tra / bật âm thanh
  document.addEventListener('click', () => {
    if (typeof SoundManager !== 'undefined') {
      if (SoundManager.stopTTS) SoundManager.stopTTS();
      if (SoundManager.init) SoundManager.init();
    }
    if (wheelContainer && wheelContainer.classList.contains('show') && !isPinned) {
      wheelContainer.classList.remove('show');
      if (resultBanner) resultBanner.classList.remove('show');
    }
  });

  // ==========================================
  // PUSHER REALTIME CONNECTION
  // ==========================================
  const pusherKey = CONFIG.PUSHER?.APP_KEY;
  if (pusherKey && typeof Pusher !== 'undefined') {
    try {
      const pusher = new Pusher(pusherKey, { cluster: CONFIG.PUSHER?.CLUSTER || 'ap1' });

      // Lắng nghe kênh riêng của widget token
      if (token) {
        const widgetChannel = pusher.subscribe(`obs-gacha-${token}`);
        widgetChannel.bind('gacha-roll', (data) => {
          spinQueue.push(data);
          processQueue();
        });
      }

      // Kênh tổng dự phòng
      const generalChannel = pusher.subscribe('obs-channel');
      generalChannel.bind('gacha-roll', (data) => {
        if (token && data.widget_token && data.widget_token !== token) return;
        // Kiểm tra tránh trùng lặp nếu cả 2 kênh đều bắt được
        const exists = spinQueue.some(item =>
          item.server_time === data.server_time &&
          item.donor_name === data.donor_name
        );
        if (!exists) {
          spinQueue.push(data);
          processQueue();
        }
      });

      console.log('Đã kết nối Pusher Realtime cho Gacha Wheel Widget.');
    } catch (err) {
      console.warn('Lỗi kết nối Pusher cho Gacha Overlay:', err);
    }
  }

  // BroadcastChannel for Cross-Tab Instant Testing from Admin
  if (typeof BroadcastChannel !== 'undefined') {
    const gachaChannel = new BroadcastChannel('gacha-test');
    gachaChannel.onmessage = (event) => {
      const data = event.data;
      if (data && data._type === 'gacha-roll' && data.payload) {
        spinQueue.push(data.payload);
        processQueue();
      }
    };
  }
});
