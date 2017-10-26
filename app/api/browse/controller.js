import Ember from 'ember';

export default Ember.Controller.extend({
  history: Ember.inject.service(),

  actions: {
    goToCall(id) {
      this.transitionToRoute('api.browse.call', id);
    },
  }
});
