const GoalService = {
  async createGoal(data) {
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.GOALS.CREATE,
      data,
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  async getActiveGoal() {
    const response = await apiClient.get(
      CONFIG.ENDPOINTS.GOALS.ACTIVE,
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  async getHistory(skip = 0, limit = 20) {
    const response = await apiClient.get(
      `${CONFIG.ENDPOINTS.GOALS.HISTORY}?skip=${skip}&limit=${limit}`,
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : [];
  },

  async getDetail(id) {
    const response = await apiClient.get(
      CONFIG.ENDPOINTS.GOALS.DETAIL(id),
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  async updateGoal(id, data) {
    const response = await apiClient.put(
      CONFIG.ENDPOINTS.GOALS.UPDATE(id),
      data,
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  async adjustGoal(id, { amount_delta, note }) {
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.GOALS.ADJUST(id),
      { amount_delta: Number(amount_delta), note: note || '' },
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  async changeStatus(id, status) {
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.GOALS.STATUS(id),
      { status },
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  async resetGoal(id) {
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.GOALS.RESET(id),
      {},
      { requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  async testGoal(id, test_amount = 50000) {
    const response = await apiClient.post(
      `${CONFIG.ENDPOINTS.GOALS.TEST(id)}?test_amount=${test_amount}`,
      {},
      {requiresAuth: true }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  },

  async getWidgetData(token) {
    if (!token) return null;
    const response = await apiClient.get(
      CONFIG.ENDPOINTS.GOALS.WIDGET_JSON(token),
      { requiresAuth: false }
    );
    return response ? (response.data !== undefined ? response.data : response) : null;
  }
};

window.GoalService = GoalService;
