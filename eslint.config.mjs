import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.node,
        // Project globals
        CONFIG: "readonly",
        apiClient: "readonly",
        Storage: "readonly",
        Formatters: "readonly",
        ConfirmModal: "readonly",
        SoundManager: "readonly",
        AuthService: "readonly",
        UserService: "readonly",
        DonateService: "readonly",
        SubathonService: "readonly",
        GoalService: "readonly",
        GachaService: "readonly",
        Pusher: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "args": "none", "varsIgnorePattern": "^(Admin|switchTab|SoundManager)" }],
      "no-console": "off",
      "no-undef": "error",
      "no-redeclare": "off"
    }
  }
];
