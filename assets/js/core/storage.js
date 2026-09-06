const Storage = {
  getAccessToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  },

  setAccessToken(token) {
    if (token) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, token);
    }
  },

  getRefreshToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken(token) {
    if (token) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, token);
    }
  },

  setTokens(accessToken, refreshToken) {
    this.setAccessToken(accessToken);
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
  },

  getUser() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILE);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
    }
  },

  clearSession() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_PROFILE);
  },

  isAuthenticated() {
    return !!this.getAccessToken();
  }
};
