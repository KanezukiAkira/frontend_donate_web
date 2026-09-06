const AuthService = {
  async register({ email, password, full_name }) {
    const response = await apiClient.post(
      CONFIG.ENDPOINTS.AUTH.REGISTER,
      { email, password, full_name },
      { requiresAuth: false }
    );
    return response.data;
  },

  async login(email, password) {
    const formData = new FormData();
    formData.append('email', (email || '').trim());
    formData.append('password', password || '');

    const response = await apiClient.post(
      CONFIG.ENDPOINTS.AUTH.LOGIN,
      formData,
      { isFormData: true, requiresAuth: false }
    );

    if (response && response.data) {
      const { access_token, refresh_token } = response.data;
      Storage.setTokens(access_token, refresh_token);

      let initialRole = 'user';
      let userId = null;
      try {
        const payloadBase64 = access_token.split('.')[1];
        const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const decoded = JSON.parse(payloadJson);
        if (decoded) {
          if (decoded.role) initialRole = decoded.role;
          if (decoded.sub) userId = decoded.sub;
        }
      } catch (jwtErr) {
        console.warn('Không thể đọc payload JWT:', jwtErr);
      }

      Storage.setUser({
        id: userId,
        email: email,
        role: initialRole,
        full_name: email
      });

      try {
        const userProfile = await UserService.getMe();
        if (userProfile) {
          Storage.setUser(userProfile);
        }
      } catch (err) {
        console.warn('Không thể tải profile ngay:', err);
      }

      return response.data;
    }
    throw new Error('Đăng nhập thất bại, không nhận được token.');
  },

  async refreshToken() {
    const refreshToken = Storage.getRefreshToken();
    if (!refreshToken) throw new Error('Không có refresh token');

    const response = await apiClient.post(
      CONFIG.ENDPOINTS.AUTH.REFRESH,
      { refresh_token: refreshToken },
      { requiresAuth: false }
    );

    if (response && response.data) {
      Storage.setTokens(response.data.access_token, response.data.refresh_token || refreshToken);
      return response.data;
    }
    throw new Error('Làm mới token thất bại');
  },

  logout(redirectUrl = null) {
    Storage.clearSession();
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      window.location.reload();
    }
  },

  isLoggedIn() {
    return Storage.isAuthenticated();
  },

  getCurrentUser() {
    return Storage.getUser();
  }
};
