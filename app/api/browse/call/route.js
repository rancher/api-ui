import Ember from 'ember';

export default Ember.Route.extend({
  history: Ember.inject.service(),

  model(params) {
    let history = this.get('history');
    let call = history.getById(params.id);
    if ( call ) {
      return call;
    }

    const [rand, method, path] = params.id.split('$');
    if ( method === 'GET' ) {
      history.follow(path);
    }
  },

  redirect(model) {
    if ( !model ) {
      this.transitionTo('api.browse');
    }
  },
});
