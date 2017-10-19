import Ember from 'ember';

export default Ember.Route.extend({
  beforeModel(params) {
    console.log(params);
  },
});
