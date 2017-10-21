import Ember from 'ember';

export default Ember.Route.extend({
  history: Ember.inject.service(),

  model(params) {
    return this.get('history').getById(params.id); 
  },

  redirect(model) {
    if ( !model ) {
      this.transitionTo('api.browse');
    }
  },
});
