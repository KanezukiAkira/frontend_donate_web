const DonateService = {
  async createPending({ amount, message }) {
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.DONATE.PENDING,
      { amount: Number(amount), message: message || '' },
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
  }
};

if (typeof window !== 'undefined') {
  window.DonateService = DonateService;
}
