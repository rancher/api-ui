import Ember from 'ember';

export default Ember.Route.extend({
  history: Ember.inject.service(),

  redirect() {
    let call = this.get('history.last');
    if ( !call ) {
      call = this.get('history').follow('/', false);
    }

    if ( this.get('history.length') ) {
      this.transitionTo('api.browse.call', call.get('id'));
    }
  },
});
