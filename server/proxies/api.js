var pkg  = require('../../package.json');

module.exports = function(app, options) {
  var path = require('path');
  var ForeverAgent = require('forever-agent');
  var HttpProxy = require('http-proxy');
  var httpServer = options.httpServer;

  var config = require('../../config/environment')().APP;

  var proxy = HttpProxy.createProxyServer({
    ws: true,
    xfwd: false,
    target: config.apiServer,
    secure: false,
  });

  proxy.on('error', onProxyError);

  httpServer.on('upgrade', function proxyWsRequest(req, socket, head) {
    proxyLog('WS', req);
    if ( socket.ssl ) {
      req.headers['X-Forwarded-Proto'] = 'https';
    }
    proxy.ws(req, socket, head);
  });

  app.use('/v*', function(req, res, next) {
    req.headers['x-forwarded-proto'] = req.protocol;
    req.headers['user-agent'] = 'API UI ' + pkg.version;
    req.url = req.baseUrl + req.url;
    proxyLog('API', req);
    proxy.web(req, res);
  });
}

function onProxyError(err, req, res) {
  console.log('Proxy Error on '+ req.method + ' to', req.url, err);
  var error = {
    type: 'error',
    status: 500,
    code: 'ProxyError',
    message: 'Error connecting to proxy',
    detail: err.toString()
  }

  if ( req.upgrade )
  {
    res.end();
  }
  else
  {
    res.writeHead(500, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(error));
  }
}

function proxyLog(label, req) {
  console.log('['+ label+ ']', req.method, req.url);
}
