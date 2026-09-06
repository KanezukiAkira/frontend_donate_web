/**
 * Gacha Service
 * Quản lý vòng quay Gacha (Time Gacha & Reward Gacha), OBS Widget và lịch sử quay thưởng.
 */

const GachaService = {
  /**
   * Lấy danh sách vòng quay của Streamer
   * @param {string|null} wheelType 'time' | 'reward' | null
   */
  async getWheels(wheelType = null) {
    let url = CONFIG.ENDPOINTS.GACHA.LIST;
    if (wheelType) {
      url += `?wheel_type=${encodeURIComponent(wheelType)}`;
    }
    const response = await apiClient.get(url, { requiresAuth: true });
    return response ? (response.data !== undefined ? response.data : response) : [];
  },

  /**
   * Tạo mới một vòng quay Gacha
   * @param {Object} data
   */
  async createWheel(data) {
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.GACHA.CREATE,
      data,
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  /**
   * Lấy thông tin chi tiết một vòng quay
   * @param {number} id
   */
  async getWheel(id) {
    const response = await apiClient.get(
      CONFIG.ENDPOINTS.GACHA.DETAIL(id),
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  /**
   * Cập nhật thông tin vòng quay
   * @param {number} id
   * @param {Object} data
   */
  async updateWheel(id, data) {
    const response = await apiClient.put(
      CONFIG.ENDPOINTS.GACHA.UPDATE(id),
      data,
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  /**
   * Xóa một vòng quay
   * @param {number} id
   */
  async deleteWheel(id) {
    const response = await apiClient.delete(
      CONFIG.ENDPOINTS.GACHA.DELETE(id),
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  /**
   * Bật hoặc tắt trạng thái kích hoạt vòng quay
   * @param {number} id
   */
  async toggleWheel(id) {
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.GACHA.TOGGLE(id),
      {},
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  /**
   * Quay thử nghiệm vòng quay phát tín hiệu sang OBS Studio
   * @param {number} id
   * @param {Object} fakeData
   */
  async testRoll(id, fakeData = {}) {
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.GACHA.TEST(id),
      fakeData,
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  /**
   * Lấy lịch sử các lần quay thưởng
   * @param {number} limit
   */
  async getHistory(limit = 50) {
    const response = await apiClient.get(
      `${CONFIG.ENDPOINTS.GACHA.HISTORY}?limit=${limit}`,
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : [];
  },

  /**
   * Lấy dữ liệu công khai cho OBS Widget
   * @param {string} token
   */
  async getWidgetData(token) {
    const response = await apiClient.get(
      CONFIG.ENDPOINTS.GACHA.WIDGET_JSON(token),
      { requiresAuth: false }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  /**
   * Tạo link URL Browser Source cho OBS Studio
   * @param {string} token
   * @param {Object} options { preview: boolean, tts: boolean, volume: number }
   */
  getObsWidgetUrl(token, options = {}) {
    const origin = window.location.origin;
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (options.preview) params.set('preview', '1');
    if (options.tts === false) params.set('tts', '0');
    if (options.volume !== undefined && options.volume !== 1.0) params.set('volume', String(options.volume));

    const qs = params.toString();
    return `${origin}/widgets/gacha-wheel.html${qs ? '?' + qs : ''}`;
  }
};
