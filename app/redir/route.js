import Ember from 'ember';

export default Ember.Route.extend({
  history: Ember.inject.service(),

  model(params) {
    this.get('history').follow('/' + params.path);
  },
});
