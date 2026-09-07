const SoundManager = {
  audioCtx: null,
  currentAudio: null,

  init() {
    try {
      this.getAudioContext();
    } catch {
      // AudioContext init error ignored
    }
  },

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => { });
    }
    return this.audioCtx;
  },

  async playDonateChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const now = ctx.currentTime;
      const notes = [659.25, 830.61, 987.77, 1318.51];

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0.001, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.2, now + index * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.65);
      });
    } catch (err) {
      console.warn('Could not synthesize sound:', err);
    }
  },

  formatAmountForSpeech(amount) {
    if (amount === undefined || amount === null) return '0 đồng';
    const num = typeof amount === 'number' ? amount : parseInt(String(amount).replace(/\D/g, ''), 10) || 0;
    if (num <= 0) return '0 đồng';

    if (num >= 1000000000) {
      const ty = Math.floor(num / 1000000000);
      const rem = num % 1000000000;
      if (rem === 0) return `${ty} tỷ đồng`;
      const trieu = Math.floor(rem / 1000000);
      return `${ty} tỷ ${trieu > 0 ? trieu + ' triệu ' : ''}đồng`;
    }

    if (num >= 1000000) {
      const trieu = Math.floor(num / 1000000);
      const rem = num % 1000000;
      if (rem === 0) return `${trieu} triệu đồng`;
      const nghin = Math.floor(rem / 1000);
      return `${trieu} triệu ${nghin > 0 ? nghin + ' nghìn ' : ''}đồng`;
    }

    if (num >= 1000) {
      const nghin = Math.floor(num / 1000);
      const rem = num % 1000;
      if (rem === 0) return `${nghin} nghìn đồng`;
      return `${nghin} nghìn ${rem} đồng`;
    }

    return `${num} đồng`;
  },

  sanitizeTTSText(text) {
    if (!text || typeof text !== 'string') return '';
    let cleaned = text.trim();
    cleaned = cleaned.replace(/(.)\1{2,}/g, '$1$1');
    cleaned = cleaned.replace(/(ha|he|hi|ho|kk|kaka){3,}/gi, 'hahaha');
    if (cleaned.length > 250) {
      cleaned = cleaned.substring(0, 247) + '...';
    }
    return cleaned;
  },

  _ttsQueue: [],
  _isTtsProcessing: false,
  _googleBlockedUntil: 0, // Circuit Breaker: nếu Google chặn (429/403), tự ngắt chuyển sang Web Speech trong 15 phút

  stopTTS(clearQueue = false) {
    if (clearQueue) {
      this._ttsQueue = [];
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.src = '';
        this.currentAudio = null;
      } catch {
        // Audio pause error ignored
      }
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // SpeechSynthesis cancel error ignored
      }
    }
  },

  /**
   * Phát một câu đơn với cơ chế Circuit Breaker:
   * Nếu Google TTS đang bị chặn hoặc lỗi mạng, chuyển ngay sang Web Speech API bản địa không độ trễ.
   */
  speakSinglePhrase(text, volume = 1.0) {
    return new Promise((resolve) => {
      const trimmed = (text || '').trim();
      if (!trimmed) return resolve();

      // Kiểm tra Circuit Breaker: Nếu Google đang bị block, dùng Web Speech API bản địa ngay lập tức
      const now = Date.now();
      if (now < this._googleBlockedUntil) {
        this.speakWebSpeech(trimmed, volume).then(resolve);
        return;
      }

      const encoded = encodeURIComponent(trimmed);
      const backendBase = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL)
        ? CONFIG.API_BASE_URL.replace(/\/+$/, '')
        : 'http://127.0.0.1:8000/api';
      const backendTtsUrl = `${backendBase}/tts?text=${encoded}`;
      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&total=1&idx=0&textlen=${trimmed.length}&q=${encoded}`;

      const audio = new Audio();
      audio.volume = Math.max(0, Math.min(1, volume));
      this.currentAudio = audio;

      let resolved = false;
      const finish = () => {
        if (!resolved) {
          resolved = true;
          this.currentAudio = null;
          resolve();
        }
      };

      // Giới hạn thời gian tối đa để không bao giờ bị treo
      const timeoutTimer = setTimeout(() => {
        finish();
      }, 14000);

      audio.onended = () => {
        clearTimeout(timeoutTimer);
        finish();
      };

      const tripCircuitBreakerAndFallback = () => {
        clearTimeout(timeoutTimer);
        // Khóa Google TTS trong 15 phút để tránh bị phạt IP 429
        this._googleBlockedUntil = Date.now() + 15 * 60 * 1000;
        console.warn('[SoundManager TTS] Kích hoạt Circuit Breaker: Chuyển toàn bộ TTS sang Web Speech API bản địa.');
        this.speakWebSpeech(trimmed, volume).then(finish);
      };

      let triedDirectGoogle = false;
      audio.onerror = () => {
        if (!triedDirectGoogle) {
          triedDirectGoogle = true;
          audio.src = googleTtsUrl;
          audio.play().catch(() => {
            tripCircuitBreakerAndFallback();
          });
        } else {
          tripCircuitBreakerAndFallback();
        }
      };

      audio.src = backendTtsUrl;
      audio.play().catch(() => {
        if (!triedDirectGoogle) {
          triedDirectGoogle = true;
          audio.src = googleTtsUrl;
          audio.play().catch(() => {
            tripCircuitBreakerAndFallback();
          });
        } else {
          tripCircuitBreakerAndFallback();
        }
      });
    });
  },

  /**
   * Phát giọng đọc Web Speech API bản địa của hệ điều hành (100% Offline, không phụ thuộc Google / Internet)
   */
  speakWebSpeech(text, volume = 1.0) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) return resolve();

      try {
        window.speechSynthesis.cancel();
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(v => v.lang && (v.lang.toLowerCase().includes('vi') || v.lang.includes('VI')));

        const utterance = new SpeechSynthesisUtterance(text);
        if (viVoice) {
          utterance.voice = viVoice;
        }
        utterance.lang = 'vi-VN';
        utterance.volume = Math.max(0, Math.min(1, volume));
        utterance.rate = 1.0;

        let done = false;
        const doneHandler = () => {
          if (!done) {
            done = true;
            resolve();
          }
        };

        utterance.onend = doneHandler;
        utterance.onerror = doneHandler;

        window.speechSynthesis.speak(utterance);
        setTimeout(doneHandler, 12000);
      } catch {
        resolve();
      }
    });
  },

  /**
   * Hàng đợi TTS Audio Queue (FIFO):
   * Đưa request đọc donate vào hàng đợi tuần tự. Đảm bảo nếu nhận 5 donate cùng lúc,
   * từng giọng đọc sẽ phát lần lượt, không bao giờ bị đè hay cắt ngang lời nhau.
   */
  speakDonation({ name, amount, message, volume = 1.0 }) {
    return new Promise((resolve, reject) => {
      this._ttsQueue.push({
        name,
        amount,
        message,
        volume,
        resolve,
        reject
      });
      this._processTtsQueue();
    });
  },

  async _processTtsQueue() {
    if (this._isTtsProcessing || this._ttsQueue.length === 0) return;
    this._isTtsProcessing = true;

    const item = this._ttsQueue.shift();

    try {
      this.stopTTS(false);

      const donorName = (item.name || 'Kanezuki Akira').trim();
      const spokenAmount = this.formatAmountForSpeech(item.amount);

      // Giai đoạn 1: Đọc tên người tặng và số tiền
      const phase1Text = `${donorName} đã donate ${spokenAmount}!`;
      await this.speakSinglePhrase(phase1Text, item.volume);

      // Giai đoạn 2: Đọc lời nhắn (nếu có)
      const cleanMsg = this.sanitizeTTSText(item.message);
      if (cleanMsg) {
        await new Promise(resolve => setTimeout(resolve, 600)); // Nghỉ nhẹ tự nhiên giữa tên và lời nhắn
        await this.speakSinglePhrase(cleanMsg, item.volume);
      }

      // Giãn cách an toàn trước khi kết thúc item
      await new Promise(resolve => setTimeout(resolve, 500));
      item.resolve();
    } catch (err) {
      console.warn('[SoundManager TTS] Lỗi xử lý item trong queue:', err);
      item.resolve();
    } finally {
      this._isTtsProcessing = false;
      // Nếu còn item trong hàng đợi, tiếp tục xử lý
      if (this._ttsQueue.length > 0) {
        setTimeout(() => this._processTtsQueue(), 300);
      }
    }
  },

  playTickSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.028);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.028);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.028);
    } catch {
      // Audio tick error ignored
    }
  },

  playWheelWinSound(isPenalty) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (isPenalty) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(85, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.008, ctx.currentTime + i * 0.08 + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.08);
          osc.stop(ctx.currentTime + i * 0.08 + 0.45);
        });
      }
    } catch {
      // Wheel win audio error ignored
    }
  },

  async speakGachaReward({ name, amount, rewardLabel, seconds, message, volume = 1.0 }) {
    this.stopTTS();

    const donorName = (name || 'Khán giả').trim();
    const spokenAmount = this.formatAmountForSpeech(amount);
    const sec = Number(seconds || 0);

    let timePhrase;
    if (sec > 0) {
      timePhrase = `được cộng thêm ${sec} giây`;
    } else if (sec < 0) {
      timePhrase = `bị trừ ${Math.abs(sec)} giây`;
    } else {
      timePhrase = `thời gian giữ nguyên`;
    }

    const phase1Text = `${donorName} đã donate ${spokenAmount}, ${timePhrase}!`;
    await this.speakSinglePhrase(phase1Text, volume);

    const cleanMsg = this.sanitizeTTSText(message);
    if (cleanMsg) {
      await new Promise(resolve => setTimeout(resolve, 600));
      await this.speakSinglePhrase(`Lời nhắn: ${cleanMsg}`, volume);
    }
  }
};

window.SoundManager = SoundManager;

