const SubathonService = {
  async createSession(data) {
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.SUBATHON.CREATE,
      data,
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  async getCurrentSession() {
    const response = await apiClient.get(
      CONFIG.ENDPOINTS.SUBATHON.CURRENT,
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  async start(id) {
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.SUBATHON.START(id),
      {},
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  async pause(id) {
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.SUBATHON.PAUSE(id),
      {},
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  async resume(id) {
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.SUBATHON.RESUME(id),
      {},
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  async end(id) {
    if (!id) throw new Error('ID phiên Subathon không hợp lệ');
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.SUBATHON.END(id),
      {},
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  async adjust(id, { seconds_delta, note }) {
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.SUBATHON.ADJUST(id),
      { seconds_delta: Number(seconds_delta), note: note || '' },
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  async getLogs(id) {
    const response = await apiClient.get(
      CONFIG.ENDPOINTS.SUBATHON.LOGS(id),
      { requiresAuth: true }
    );
    return response.data || [];
  },

  async getWidgetData(widgetToken) {
    const response = await apiClient.get(
      CONFIG.ENDPOINTS.SUBATHON.WIDGET_JSON(widgetToken),
      { requiresAuth: false }
    );
    return response.data;
  },

  getWidgetViewUrl(widgetToken) {
    return `${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.SUBATHON.WIDGET_VIEW(widgetToken)}`;
  }
};

