module.exports = function(app, options) {
  var globSync    = require('glob').sync;
  var proxies     = globSync('./proxies/**/*.js', { cwd: __dirname }).map(require);

  proxies.forEach(function(route) {
    route(app, options);
  });
};
