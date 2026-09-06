const UserService = {
  async getMe() {
    const response = await apiClient.get(CONFIG.ENDPOINTS.USERS.ME, { requiresAuth: true });
    return response.data;
  },

  async getUsers(filters = {}) {
    const query = new URLSearchParams();
    if (filters.email) query.append('email', filters.email);
    if (filters.name) query.append('name', filters.name);
    if (filters.status !== undefined && filters.status !== '') {
      query.append('status', filters.status);
    }

    const endpoint = `${CONFIG.ENDPOINTS.USERS.LIST}${query.toString() ? '?' + query.toString() : ''}`;
    const response = await apiClient.get(endpoint, { requiresAuth: true });
    return response.data || [];
  }
};
