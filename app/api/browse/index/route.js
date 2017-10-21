import Ember from 'ember';

export default Ember.Route.extend({
  history: Ember.inject.service(),

  redirect() {
    let call = this.get('history.last');
    if ( !call ) {
      call = this.get('store').createRecord({
        type: 'call',
        path: '/',
      });

      this.get('history').add(call);
      call.go();
    }

    if ( this.get('history.length') ) {
      this.transitionTo('api.browse.call', call.get('id'));
    }
  },
});
