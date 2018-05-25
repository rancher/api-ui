/* eslint-env node */
'use strict';

var pkg  = require('../package.json');

// host can be an ip "1.2.3.4" -> http://1.2.3.4:8080
// or a URL+port
function normalizeHost(host,defaultPort) {
  if ( host.indexOf('http') !== 0 )
  {
    if ( host.indexOf(':') === -1 )
    {
      host = 'https://' + host + (defaultPort ? ':'+defaultPort : '');
    }
    else
    {
      host = 'https://' + host;
    }
  }

  return host;
}

module.exports = function(environment) {
  let ENV = {
    modulePrefix: 'api-ui',
    environment,
    exportApplicationGlobal: true,
    rootURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      }
    },

    APP: {
      version: pkg.version,
      apiServer: 'https://localhost:8000',
      apiProxy: '/api-proxy',
    }
  };

  var server = process.env.API;
  if ( server ) {
    ENV.APP.apiServer = normalizeHost(server,443);
  } else if (environment === 'production') {
    ENV.APP.apiServer = '';
  }

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    ENV.APP.LOG_TRANSITIONS = true;
    ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {
    // here you can enable a production-specific feature
  }

  return ENV;
};
