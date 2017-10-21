import Ember from 'ember';

export default Ember.Controller.extend({
  isLoggedIn: Ember.computed.notEmpty('model'),

});
