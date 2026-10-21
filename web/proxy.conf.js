// The dev server forwards /api to Rails, so the browser only ever talks to
// the Angular origin. That lets the app work from anywhere the dev server
// is reachable, including a Playwright container inside Docker.
//
// The Host header is left as-is on purpose: Rails' development host check
// allows "localhost" but would block the container name "api".
module.exports = {
  '/api': {
    target: process.env.API_PROXY_TARGET || 'http://localhost:3000',
    changeOrigin: false,
  },
};
