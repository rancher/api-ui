import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('index', {path: '/'});

  this.route('apis', function() {
    this.route('api', {path: '/:name'}, function() {

      this.route('schemas', function() {
        this.route('schema', {path: '/:id'});
      });

      this.route('browse', function() {
        this.route('request', {path: '/:id'});
      });
    });
  });

  this.route('redir', {path: '/*path'});
});

export default Router;
