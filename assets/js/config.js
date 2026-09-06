const CONFIG = {
  BACKEND_URL: 'https://backend-donate-web.onrender.com',
  API_BASE_URL: 'https://backend-donate-web.onrender.com/api',
  // BACKEND_URL: "http://127.0.0.1:8000",
  // API_BASE_URL: "http://127.0.0.1:8000/api",
  
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/auth/register',
      LOGIN: '/auth/login',
      REFRESH: '/auth/refresh',
    },
    USERS: {
      ME: '/users/me',
      LIST: '/users',
    },
    DONATE: {
      PENDING: '/donate/pending',
      SEPAY_WEBHOOK: '/donate',
      LEADERBOARD: '/donate/leaderboard',
      LEADERBOARD_REBUILD: '/donate/leaderboard/rebuild',
      WIDGET: '/donate/widget',
      WIDGET_MARK: (id) => `/donate/widget/${id}`,
      TEST_ALERT: '/donate/test-alert',
      CLEANUP: '/donate/cleanup',
      HISTORY: '/donate/history',
    },
    SUBATHON: {
      CREATE: '/subathon',
      CURRENT: '/subathon/current',
      START: (id) => `/subathon/${id}/start`,
      PAUSE: (id) => `/subathon/${id}/pause`,
      RESUME: (id) => `/subathon/${id}/resume`,
      END: (id) => `/subathon/${id}/end`,
      ADJUST: (id) => `/subathon/${id}/adjust`,
      LOGS: (id) => `/subathon/${id}/logs`,
      WIDGET_JSON: (token) => `/subathon/widget/${token}`,
      WIDGET_VIEW: (token) => `/subathon/widget/${token}/view`,
    },
    GOALS: {
      CREATE: '/goals',
      ACTIVE: '/goals/active',
      HISTORY: '/goals/history',
      DETAIL: (id) => `/goals/${id}`,
      UPDATE: (id) => `/goals/${id}`,
      ADJUST: (id) => `/goals/${id}/adjust`,
      STATUS: (id) => `/goals/${id}/status`,
      RESET: (id) => `/goals/${id}/reset`,
      TEST: (id) => `/goals/${id}/test`,
      WIDGET_JSON: (token) => `/goals/widget/${token}`,
    },
    GACHA: {
      LIST: '/gacha',
      CREATE: '/gacha',
      DETAIL: (id) => `/gacha/${id}`,
      UPDATE: (id) => `/gacha/${id}`,
      DELETE: (id) => `/gacha/${id}`,
      TOGGLE: (id) => `/gacha/${id}/toggle`,
      TEST: (id) => `/gacha/${id}/test`,
      HISTORY: '/gacha/history',
      WIDGET_JSON: (token) => `/gacha/widget/${token}`,
    }
  },

  PUSHER: {
    APP_KEY: '9446ce24131b862e620b',
    CLUSTER: 'ap1'
  },

  POLL_INTERVALS: {
    DONATE_WIDGET: 60000,
    SUBATHON_TICK: 1000,
    SUBATHON_SYNC: 60000,
  },

  STORAGE_KEYS: {
    ACCESS_TOKEN: 'donate_access_token',
    REFRESH_TOKEN: 'donate_refresh_token',
    USER_PROFILE: 'donate_user_profile',
    STREAMER_SETTINGS: 'donate_streamer_settings'
  }
};

Object.freeze(CONFIG);

window.Toast = window.Toast || {
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {}
};
