class ApiClient {
  constructor() {
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  subscribeTokenRefresh(callback) {
    this.refreshSubscribers.push(callback);
  }

  onRefreshed(newToken) {
    this.refreshSubscribers.forEach((callback) => callback(newToken));
    this.refreshSubscribers = [];
  }

  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body = null,
      isFormData = false,
      isUrlEncoded = false,
      requiresAuth = true,
      retryCount = 0
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE_URL}${endpoint}`;
    const reqHeaders = new Headers(headers);

    if (requiresAuth) {
      const token = Storage.getAccessToken();
      if (token) {
        reqHeaders.set('Authorization', `Bearer ${token}`);
      }
    }

    let formattedBody = body;

    if (body instanceof FormData || isFormData) {
      reqHeaders.delete('Content-Type');
      formattedBody = body;
    } else if (body instanceof URLSearchParams) {
      reqHeaders.set('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
      formattedBody = body.toString();
    } else if (isUrlEncoded && body) {
      reqHeaders.set('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
      const params = new URLSearchParams();
      Object.entries(body).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          params.append(key, val);
        }
      });
      formattedBody = params.toString();
    } else if (body && typeof body === 'object') {
      reqHeaders.set('Content-Type', 'application/json');
      formattedBody = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, {
        method,
        headers: reqHeaders,
        body: formattedBody
      });

      if (response.status === 401 && requiresAuth && retryCount === 0) {
        const refreshToken = Storage.getRefreshToken();
        if (!refreshToken) {
          Storage.clearSession();
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }

        if (this.isRefreshing) {
          return new Promise((resolve) => {
            this.subscribeTokenRefresh((newToken) => {
              resolve(this.request(endpoint, { ...options, retryCount: 1 }));
            });
          });
        }

        this.isRefreshing = true;

        try {
          const refreshRes = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });

          if (!refreshRes.ok) {
            Storage.clearSession();
            window.dispatchEvent(new CustomEvent('auth:expired'));
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          }

          const refreshData = await refreshRes.json();
          const tokenData = (refreshData && refreshData.data) ? refreshData.data : refreshData;
          const newAccessToken = tokenData ? tokenData.access_token : null;
          const newRefreshToken = (tokenData && tokenData.refresh_token) ? tokenData.refresh_token : refreshToken;

          if (!newAccessToken) {
            Storage.clearSession();
            window.dispatchEvent(new CustomEvent('auth:expired'));
            throw new Error('Không nhận được access_token mới từ máy chủ.');
          }

          Storage.setTokens(newAccessToken, newRefreshToken);
          this.isRefreshing = false;
          this.onRefreshed(newAccessToken);

          return this.request(endpoint, { ...options, retryCount: 1 });
        } catch (refreshErr) {
          this.isRefreshing = false;
          this.refreshSubscribers = [];
          Storage.clearSession();
          window.dispatchEvent(new CustomEvent('auth:expired'));
          throw refreshErr;
        }
      }

      if (response.status === 429) {
        throw new Error('Thao tác quá nhanh! Bạn đã vượt quá giới hạn lượt gọi API, vui lòng chờ 1 phút.');
      }

      // Xử lý các phản hồi không có body (204 No Content, 205 Reset Content)
      if (response.status === 204 || response.status === 205) {
        return null;
      }

      let data = null;
      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      if (text && text.trim().length > 0) {
        if (contentType.includes('application/json')) {
          try {
            data = JSON.parse(text);
          } catch {
            data = text;
          }
        } else {
          data = text;
        }
      }

      if (!response.ok) {
        const errorMsg = (data && data.detail) 
          ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))
          : (data && data.message) || `Lỗi yêu cầu: mã lỗi ${response.status}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`[API Error] [${method}] ${url}:`, err);
      throw err;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

const apiClient = new ApiClient();
