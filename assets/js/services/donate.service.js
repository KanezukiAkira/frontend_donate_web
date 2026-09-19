const DonateService = {
  async createPending({ amount, message, is_gacha_mode, gacha_wheel_id }) {
    const payload = {
      amount: Number(amount),
      message: message || ''
    };
    if (is_gacha_mode !== undefined) {
      payload.is_gacha_mode = Boolean(is_gacha_mode);
    }
    if (gacha_wheel_id !== undefined && gacha_wheel_id !== null) {
      payload.gacha_wheel_id = Number(gacha_wheel_id);
    }
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.DONATE.PENDING,
      payload,
      { requiresAuth: true }
    );
    return response.data;
  },

  async getLeaderboard(isMonthly = false) {
    const endpoint = `${CONFIG.ENDPOINTS.DONATE.LEADERBOARD}?is_monthly=${Boolean(isMonthly)}`;
    const response = await apiClient.get(endpoint, { requiresAuth: false });
    return response.data || [];
  },

  async rebuildLeaderboard() {
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.DONATE.LEADERBOARD_REBUILD,
      {},
      { requiresAuth: true }
    );
    return response.data;
  },

  async getWidgetDonations() {
    const response = await apiClient.get(
      CONFIG.ENDPOINTS.DONATE.WIDGET,
      { requiresAuth: false }
    );
    return response.data || [];
  },

  async markWidgetDisplayed(id) {
    const response = await apiClient.patch(
      CONFIG.ENDPOINTS.DONATE.WIDGET_MARK(id),
      {},
      { requiresAuth: false }
    );
    return response;
  },

  async triggerTestAlert(data = {}) {
    const endpoint = CONFIG.ENDPOINTS?.DONATE?.TEST_ALERT || '/donate/test-alert';
    const response = await apiClient.post(
      endpoint,
      data,
      { requiresAuth: false }
    );
    return response.data;
  },

  async cleanupExpired() {
    return await apiClient.delete(
      CONFIG.ENDPOINTS.DONATE.CLEANUP,
      { requiresAuth: false }
    );
  },

  async getHistory(limit = 50, cursor = null) {
    const endpoint = CONFIG.ENDPOINTS?.DONATE?.HISTORY || '/donate/history';
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (cursor) params.append('cursor', cursor);
    const response = await apiClient.get(
      `${endpoint}?${params.toString()}`,
      { requiresAuth: false }
    );
    return response.data || { items: [], next_cursor: null, has_more: false };
  },

  async checkStatus(paymentCode) {
    const endpoint = (CONFIG.ENDPOINTS?.DONATE?.STATUS)
      ? CONFIG.ENDPOINTS.DONATE.STATUS(encodeURIComponent(paymentCode))
      : `/donate/status/${encodeURIComponent(paymentCode)}`;
    const response = await apiClient.get(endpoint, { requiresAuth: false });
    return response.data;
  }
};

if (typeof window !== 'undefined') {
  window.DonateService = DonateService;
}
