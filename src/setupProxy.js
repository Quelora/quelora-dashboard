// ./setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'https://localhost:3001',
      changeOrigin: true,
      secure: false, // ignora SSL inválido en desarrollo
    })
  );
};
