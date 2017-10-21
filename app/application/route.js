import Ember from 'ember';

export default Ember.Route.extend({
  ajax: Ember.inject.service(),

  model() {
    return this.get('ajax').request('/').then((res) => {
      return res;
    }).catch((/*err*/) => {
      // Do login stuff
    });
  }
});
