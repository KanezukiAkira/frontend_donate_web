const SoundManager = {
  audioCtx: null,
  currentAudio: null,

  init() {
    try {
      this.getAudioContext();
    } catch {}
  },

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
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

  stopTTS() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.src = '';
        this.currentAudio = null;
      } catch {}
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  },

  speakSinglePhrase(text, volume = 1.0) {
    return new Promise((resolve) => {
      const trimmed = (text || '').trim();
      if (!trimmed) return resolve();

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

      const timeoutTimer = setTimeout(() => {
        finish();
      }, 15000);

      audio.onended = () => {
        clearTimeout(timeoutTimer);
        finish();
      };

      let triedDirectGoogle = false;
      audio.onerror = () => {
        if (!triedDirectGoogle) {
          triedDirectGoogle = true;
          audio.src = googleTtsUrl;
          audio.play().catch(() => {
            clearTimeout(timeoutTimer);
            this.speakWebSpeech(trimmed, volume).then(finish);
          });
        } else {
          clearTimeout(timeoutTimer);
          this.speakWebSpeech(trimmed, volume).then(finish);
        }
      };

      audio.src = backendTtsUrl;
      audio.play().catch(() => {
        if (!triedDirectGoogle) {
          triedDirectGoogle = true;
          audio.src = googleTtsUrl;
          audio.play().catch(() => {
            clearTimeout(timeoutTimer);
            this.speakWebSpeech(trimmed, volume).then(finish);
          });
        } else {
          clearTimeout(timeoutTimer);
          this.speakWebSpeech(trimmed, volume).then(finish);
        }
      });
    });
  },

  speakWebSpeech(text, volume = 1.0) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) return resolve();

      try {
        window.speechSynthesis.cancel();
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(v => v.lang && (v.lang.toLowerCase().includes('vi') || v.lang.includes('VI')));
        if (!viVoice) {
          return resolve();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = viVoice;
        utterance.lang = 'vi-VN';
        utterance.volume = Math.max(0, Math.min(1, volume));
        utterance.rate = 1.0;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
        setTimeout(resolve, 10000);
      } catch {
        resolve();
      }
    });
  },

  async speakDonation({ name, amount, message, volume = 1.0 }) {
    this.stopTTS();

    const donorName = (name || 'Kanezuki Akira').trim();
    const spokenAmount = this.formatAmountForSpeech(amount);

    const phase1Text = `${donorName} đã donate ${spokenAmount}!`;
    await this.speakSinglePhrase(phase1Text, volume);

    const cleanMsg = this.sanitizeTTSText(message);
    if (cleanMsg) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.speakSinglePhrase(cleanMsg, volume);
    }
  }
};
