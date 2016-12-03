var path = require('path')

module.exports = function(server) {
  // Install a `/` route that returns server status
  const router = server.loopback.Router();
  router.get('/', server.loopback.status());
  server.use(router);
  server.use(function (req, res, next) {
    if (path.extname(req.path).length > 0 || req.path.startsWith('/api')) {
      next();
    }
    else {
      req.url = '/index.html';
      next();
    }
  });
};
