/**
 * TTS Service (Text-to-Speech)
 * Kết nối các API Microsoft Edge Neural TTS & Fallback:
 * - GET /api/tts/voices : Lấy danh sách giọng đọc Neural gợi ý
 * - GET /api/tts        : Chuyển văn bản thành audio MP3 trực tiếp
 * Nếu giọng đọc hiện tại bị lỗi/không phát được, hệ thống sẽ tự động chuyển sang giọng đọc khác hoặc chuyển sang chế độ dự phòng.
 */

const TtsService = {
  DEFAULT_VOICE: 'vi-VN-HoaiMyNeural',
  FALLBACK_VOICE: 'vi-VN-NamMinhNeural',
  _cachedVoices: null,
  _currentAudio: null,

  /**
   * Lấy danh sách giọng đọc Neural được tối ưu từ máy chủ
   * Endpoint: GET /api/tts/voices
   * @param {boolean} [forceRefresh=false]
   * @returns {Promise<Array<{id: string, name: string, language: string, gender: string, description: string, recommended: boolean}>>}
   */
  async getVoices(forceRefresh = false) {
    if (this._cachedVoices && !forceRefresh) {
      return this._cachedVoices;
    }

    try {
      const endpoint = CONFIG.ENDPOINTS?.TTS?.VOICES || '/tts/voices';
      const response = await apiClient.get(endpoint, { requiresAuth: false });
      const voices = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
      if (voices.length > 0) {
        this._cachedVoices = voices;
      }
      return voices;
    } catch (err) {
      console.warn('[TtsService] Lỗi khi lấy danh sách voices từ máy chủ, sử dụng danh sách fallback cục bộ:', err);
      return [
        {
          id: 'vi-VN-HoaiMyNeural',
          name: 'Hoài My (Nữ)',
          language: 'vi-VN',
          gender: 'Female',
          description: 'Giọng nữ truyền cảm, mượt mà và tự nhiên nhất cho donate stream (Tự động đổi giọng nếu lỗi)',
          recommended: true
        },
        {
          id: 'vi-VN-NamMinhNeural',
          name: 'Nam Minh (Nam)',
          language: 'vi-VN',
          gender: 'Male',
          description: 'Giọng nam trầm ấm, rõ ràng, phát âm chuẩn (Giọng dự phòng tin cậy)',
          recommended: false
        },
        {
          id: 'ja-JP-NanamiNeural',
          name: 'Nanami (Nữ Nhật Bản)',
          language: 'ja-JP',
          gender: 'Female',
          description: 'Giọng nữ anime dễ thương, rất hợp phong cách VTuber',
          recommended: false
        },
        {
          id: 'ja-JP-KeitaNeural',
          name: 'Keita (Nam Nhật Bản)',
          language: 'ja-JP',
          gender: 'Male',
          description: 'Giọng nam tiếng Nhật tự nhiên',
          recommended: false
        },
        {
          id: 'en-US-JennyNeural',
          name: 'Jenny (Nữ Mỹ)',
          language: 'en-US',
          gender: 'Female',
          description: 'Giọng nữ tiếng Anh chuẩn quốc tế',
          recommended: false
        },
        {
          id: 'en-US-GuyNeural',
          name: 'Guy (Nam Mỹ)',
          language: 'en-US',
          gender: 'Male',
          description: 'Giọng nam tiếng Anh tự nhiên',
          recommended: false
        }
      ];
    }
  },

  /**
   * Tạo URL hoàn chỉnh để phát trực tiếp bằng thẻ <audio src="..."> hoặc new Audio(url)
   * Endpoint: GET /api/tts?text=...&voice=...
   * @param {Object} params
   * @param {string} params.text - Văn bản cần đọc
   * @param {string} [params.voice] - ID giọng đọc (mặc định vi-VN-HoaiMyNeural)
   * @param {string} [params.rate] - Tốc độ đọc (ví dụ +0%, +15%, -10%)
   * @param {string} [params.pitch] - Cao độ giọng (ví dụ +0Hz, +5Hz, -5Hz)
   * @param {string} [params.volume] - Âm lượng (ví dụ +0%, -10%)
   * @returns {string} URL endpoint audio MP3
   */
  getAudioUrl({ text, voice, rate, pitch, volume } = {}) {
    const cleanText = (text || '').trim();
    if (!cleanText) return '';

    const baseUrl = (typeof CONFIG !== 'undefined' && CONFIG.API_BASE_URL)
      ? CONFIG.API_BASE_URL.replace(/\/+$/, '')
      : 'https://backend-donate-web.onrender.com/api';
    const ttsPath = CONFIG.ENDPOINTS?.TTS?.GENERATE || '/tts';

    const params = new URLSearchParams();
    params.append('text', cleanText);

    const voiceId = voice || this.DEFAULT_VOICE;
    if (voiceId) params.append('voice', voiceId);
    if (rate) params.append('rate', rate);
    if (pitch) params.append('pitch', pitch);
    if (volume) params.append('volume', volume);

    return `${baseUrl}${ttsPath}?${params.toString()}`;
  },

  /**
   * Tải về audio MP3 dưới dạng Blob
   * Endpoint: GET /api/tts
   * @param {Object} params - Tham số giống getAudioUrl
   * @returns {Promise<Blob>}
   */
  async getAudioBlob(params = {}) {
    const url = this.getAudioUrl(params);
    if (!url) {
      throw new Error('Văn bản đọc không được để trống.');
    }
    return await apiClient.get(url, { requiresAuth: false, responseType: 'blob' });
  },

  /**
   * Tải về audio và tạo Object URL dạng blob:http://...
   * @param {Object} params
   * @returns {Promise<{objectUrl: string, revoke: Function}>}
   */
  async createAudioObjectUrl(params = {}) {
    const blob = await this.getAudioBlob(params);
    const objectUrl = URL.createObjectURL(blob);
    return {
      objectUrl,
      revoke: () => URL.revokeObjectURL(objectUrl)
    };
  },

  /**
   * Phát trực tiếp câu thoại qua HTML5 Audio với cơ chế tự động chuyển giọng dự phòng nếu lỗi
   * @param {Object|string} options - Hoặc chuỗi văn bản, hoặc Object cấu hình
   * @param {number} [volumeLevel=1.0] - Âm lượng từ 0.0 đến 1.0
   * @returns {Promise<void>} Kết thúc khi phát xong âm thanh hoặc bị lỗi
   */
  play(options, volumeLevel = 1.0) {
    return new Promise((resolve) => {
      const config = typeof options === 'string' ? { text: options } : { ...(options || {}) };
      const chosenVoice = config.voice || this.DEFAULT_VOICE;
      let audioUrl = this.getAudioUrl(config);
      if (!audioUrl) {
        return resolve();
      }

      this.stop();

      let hasTriedFallbackVoice = false;
      const audio = new Audio();
      const safeVolume = Math.max(0, Math.min(1, typeof config.volumeLevel === 'number' ? config.volumeLevel : volumeLevel));
      audio.volume = safeVolume;
      audio.referrerPolicy = 'no-referrer';
      this._currentAudio = audio;

      let isFinished = false;
      const cleanup = () => {
        if (!isFinished) {
          isFinished = true;
          if (this._currentAudio === audio) {
            this._currentAudio = null;
          }
          resolve();
        }
      };

      // Giới hạn an toàn 15 giây tránh treo audio
      let timeoutId = setTimeout(cleanup, 15000);

      const tryFallbackVoice = () => {
        if (!hasTriedFallbackVoice) {
          hasTriedFallbackVoice = true;
          const fallbackVoiceId = (chosenVoice === this.DEFAULT_VOICE) ? this.FALLBACK_VOICE : this.DEFAULT_VOICE;
          console.warn(`[TtsService] Giọng đọc ${chosenVoice} gặp sự cố, tự động chuyển sang giọng đọc dự phòng: ${fallbackVoiceId}`);
          
          clearTimeout(timeoutId);
          timeoutId = setTimeout(cleanup, 15000);

          const fallbackUrl = this.getAudioUrl({
            ...config,
            voice: fallbackVoiceId
          });
          audio.src = fallbackUrl;
          audio.play().catch((err) => {
            console.warn('[TtsService] Cả giọng đọc dự phòng cũng không thể phát:', err);
            cleanup();
          });
          return;
        }
        cleanup();
      };

      audio.onended = () => {
        clearTimeout(timeoutId);
        cleanup();
      };

      audio.onerror = (e) => {
        console.warn('[TtsService] Lỗi tải audio từ máy chủ:', e);
        tryFallbackVoice();
      };

      audio.src = audioUrl;
      audio.play().catch((playErr) => {
        if (playErr && playErr.name === 'NotAllowedError') {
          console.warn('[TtsService] Trình duyệt chặn autoplay (cần người dùng click tương tác trên trang).');
          clearTimeout(timeoutId);
          cleanup();
          return;
        }
        console.warn('[TtsService] Lỗi audio.play():', playErr);
        tryFallbackVoice();
      });
    });
  },

  /**
   * Dừng phát âm thanh TTS hiện tại
   */
  stop() {
    if (this._currentAudio) {
      try {
        this._currentAudio.pause();
        this._currentAudio.currentTime = 0;
        this._currentAudio.src = '';
      } catch (e) {
        // bỏ qua
      }
      this._currentAudio = null;
    }
  },

  /**
   * Định dạng nhãn hiển thị cho giọng đọc
   * @param {Object} voice
   * @returns {string}
   */
  formatVoiceLabel(voice) {
    if (!voice) return '';
    const recTag = voice.recommended ? ' ★ Khuyên dùng' : '';
    return `${voice.name} (${voice.language})${recTag}`;
  }
};

if (typeof window !== 'undefined') {
  window.TtsService = TtsService;
}
