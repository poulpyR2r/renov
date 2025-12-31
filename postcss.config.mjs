/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "postcss-import": {}, // ⚠️ DOIT être en premier
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
