import Ember from 'ember';

export default Ember.Route.extend({
  history: Ember.inject.service(),

  queryParams: {
    id: {
      refreshModel: true,
    }
  },

  model(params) {
    let history = this.get('history');
    let call = history.getById(params.id);
    if ( call ) {
      return call;
    }

    return history.follow('/' + (params.path || ''));
  },

  setupController(controller, model) {
    this._super(...arguments);
    if ( model.method !== 'GET' ) {
      controller.set('requestMode', 'editor');
    }
  },
});
